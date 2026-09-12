import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { once } from 'node:events'
import { test } from 'node:test'
import vm from 'node:vm'
import express from 'express'
import rateLimit from 'express-rate-limit'

function moduleFor(values) {
  return new vm.SyntheticModule(Object.keys(values), function () {
    for (const [key, value] of Object.entries(values)) this.setExport(key, value)
  })
}

test('inscrições públicas, contagem e avisos sem acessar banco ou serviços externos', async (t) => {
  const saved = []
  const emails = []
  const telegram = []
  const auth = new vm.SourceTextModule(await readFile(new URL('./routes/auth.js', import.meta.url), 'utf8'))
  await auth.link((name) => moduleFor(name === 'express' ? { default: express } : name === 'bcryptjs' ? { default: {} } : { getConnection() { throw new Error('Banco não deve ser acessado') }, logActivity() {} }))
  await auth.evaluate()
  const source = new vm.SourceTextModule(await readFile(new URL('./routes/inscricoes.js', import.meta.url), 'utf8'))
  await source.link((name) => {
    if (name === 'express') return moduleFor({ Router: express.Router })
    if (name === 'express-rate-limit') return moduleFor({ default: rateLimit })
    if (name === './auth.js') return auth
    if (name.includes('notifyTelegram')) return moduleFor({ notifyNewInscricao: async (data) => telegram.push(data) })
    if (name.includes('sendEmail')) return moduleFor({ sendInscricaoConfirmation: async (data) => emails.push(data) })
    return moduleFor({
      createInscricao: async (data) => { const row = { ...data, codigo: 'HW-TEST' }; saved.push(row); return row },
      findResponsavelByCodigo() { throw new Error('Consulta sem autorização') },
      listInscricoes() { throw new Error('Listagem sem autorização') },
      deleteInscricao() { throw new Error('Exclusão sem autorização') },
    })
  })
  await source.evaluate()
  const app = express()
  app.use(express.json())
  app.use('/api/inscricoes', source.namespace.default)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const base = 'http://127.0.0.1:' + server.address().port + '/api/inscricoes'
  const oldFlag = process.env.INSCRICOES_ABERTAS
  t.after(async () => {
    if (oldFlag === undefined) delete process.env.INSCRICOES_ABERTAS
    else process.env.INSCRICOES_ABERTAS = oldFlag
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })
  const post = (body) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const minimum = { nome: ' Maria ', telefone: ' 67999999999 ', participantes: [{ nome: ' Maria ', idade: 30, eResponsavel: true }] }

  await t.test('fechamento vale também para envio direto à API', async () => {
    process.env.INSCRICOES_ABERTAS = 'false'
    assert.deepEqual(await (await fetch(base + '/status')).json(), { abertas: false })
    assert.equal((await post(minimum)).status, 403)
    assert.equal(saved.length, 0)
    process.env.INSCRICOES_ABERTAS = 'true'
    assert.deepEqual(await (await fetch(base + '/status')).json(), { abertas: true })
  })
  await t.test('sem login e sem e-mail: grava e notifica Telegram', async () => {
    const response = await post(minimum)
    assert.equal(response.status, 201)
    const row = await response.json()
    assert.equal(row.nome, 'Maria')
    assert.equal(row.email, '')
    assert.equal(row.participantes.length, 1)
    assert.equal(row.participantes[0].autorizaImagem, false)
    assert.equal(telegram.length, 1)
    assert.equal(emails.length, 0)
  })
  await t.test('família: preserva todos os participantes e envia ambos os avisos', async () => {
    const response = await post({ ...minimum, email: ' MARIA@example.com ', participantes: [{ nome: 'Maria', idade: 30, eResponsavel: true }, { nome: 'João', idade: 8, restricaoAlimentar: 'Leite', participaDesfile: true }] })
    assert.equal(response.status, 201)
    const row = await response.json()
    assert.equal(row.email, 'maria@example.com')
    assert.equal(row.participantes.length, 2)
    assert.equal(row.participantes[1].restricaoAlimentar, 'Leite')
    assert.equal(emails.length, 1)
    assert.equal(telegram.length, 2)
  })
  await t.test('um e-mail pode ser compartilhado por famílias', async () => {
    assert.equal((await post({ ...minimum, nome: 'Ana', email: 'maria@example.com', participantes: [{ nome: 'Ana', idade: 25 }] })).status, 201)
  })
  await t.test('dados inválidos não são gravados', async () => {
    const count = saved.length
    for (const body of [
      { ...minimum, email: 'email-invalido' },
      { ...minimum, nome: 123 },
      { ...minimum, participantes: [] },
      { ...minimum, participantes: [{ nome: 'Ana', idade: -1 }] },
    ]) assert.equal((await post(body)).status, 400)
    assert.equal(saved.length, count)
    assert.ok(source.namespace.validate({ ...minimum, participantes: [{ nome: 'Ana', participaDesfile: 'false' }] }).length)
  })
  await t.test('criança exige adulto inscrito, mesmo quando o contato não participa', async () => {
    const count = saved.length
    const response = await post({ ...minimum, participantes: [{ nome: 'Criança', idade: 10 }] })
    assert.equal(response.status, 400)
    assert.match((await response.json()).errors.join(' '), /acompanhante adulto/)
    assert.equal(saved.length, count)
    const accepted = await post({ ...minimum, participantes: [{ nome: 'Bebê', idade: 0 }, { nome: 'Criança', idade: 10 }, { nome: 'Outro acompanhante', idade: 18, eResponsavel: false }] })
    assert.equal(accepted.status, 201)
    const row = await accepted.json()
    assert.equal(row.participantes.length, 3)
    assert.equal(row.participantes[2].nome, 'Outro acompanhante')
    assert.equal(row.participantes.some((p) => p.eResponsavel), false)
  })
  await t.test('limites de idade e omissão não permitem contornar a regra', () => {
    const validate = (participantes) => source.namespace.validate({ ...minimum, participantes })
    for (const idade of [0, 10]) {
      for (const adulto of [undefined, null, '', '18', 17, 121, 18.5]) {
        assert.ok(validate([{ nome: 'Criança', idade }, { nome: 'Acompanhante', idade: adulto }]).length)
      }
      assert.equal(validate([{ nome: 'Criança', idade }, { nome: 'Adulto', idade: 18 }]).length, 0)
      assert.ok(validate([{ nome: 'Criança', idade, eResponsavel: true }]).length)
    }
    assert.equal(validate([{ nome: 'Jovem', idade: 11 }]).length, 0)
    for (const idade of [undefined, null, '', '10']) assert.ok(validate([{ nome: 'Pessoa', idade }]).length)
    assert.ok(validate([null]).length)
  })
  await t.test('gestão e consulta de dados exigem autenticação', async () => {
    assert.equal((await fetch(base)).status, 401)
    assert.equal((await fetch(base + '/lookup?codigo=HW-TEST')).status, 401)
    assert.equal((await fetch(base + '/1', { method: 'DELETE' })).status, 401)
  })
})

test('Telegram inclui total e restrição alimentar, inclusive sem e-mail', async () => {
  const { notifyNewInscricao } = await import('./notifyTelegram.js')
  const originalFetch = globalThis.fetch
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  let sent
  process.env.TELEGRAM_BOT_TOKEN = 'test-token'
  process.env.TELEGRAM_CHAT_ID = 'test-chat'
  globalThis.fetch = async (_url, options) => { sent = JSON.parse(options.body); return { ok: true } }
  try {
    await notifyNewInscricao({ codigo: 'HW-TEST', nome: 'Maria', telefone: '67999999999', email: '', participantes: [{ nome: 'João', idade: 8, restricaoAlimentar: 'Leite' }] })
    assert.match(sent.text, /Não informado/)
    assert.match(sent.text, /Participantes/)
    assert.match(sent.text, /restrição: Leite/)
    assert.match(sent.text, /João/)
  } finally {
    globalThis.fetch = originalFetch
    if (token === undefined) delete process.env.TELEGRAM_BOT_TOKEN
    else process.env.TELEGRAM_BOT_TOKEN = token
    if (chat === undefined) delete process.env.TELEGRAM_CHAT_ID
    else process.env.TELEGRAM_CHAT_ID = chat
  }
})
