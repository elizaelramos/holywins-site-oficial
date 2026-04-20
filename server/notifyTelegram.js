const TELEGRAM_API = 'https://api.telegram.org'

function escapeMarkdownV2(text) {
  if (text == null) return ''
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error('[telegram] sendMessage falhou', res.status, await res.text())
    }
  } catch (err) {
    console.error('[telegram] erro ao notificar', err?.message ?? err)
  } finally {
    clearTimeout(timeout)
  }
}

export async function notifyNewMessage(message) {
  const lines = [
    '*Novo contato no site Holywins*',
    `*Nome:* ${escapeMarkdownV2(message.name)}`,
    `*E\\-mail:* ${escapeMarkdownV2(message.email)}`,
    message.phone ? `*Telefone:* ${escapeMarkdownV2(message.phone)}` : null,
    '',
    `${escapeMarkdownV2(message.message)}`,
  ].filter(Boolean)
  await sendTelegram(lines.join('\n'))
}

export async function notifyNewInscricao(inscricao) {
  const participantes = inscricao.participantes ?? []
  const lines = [
    '*Nova inscrição Holywins*',
    `*Código:* ${escapeMarkdownV2(inscricao.codigo)}`,
    `*Responsável:* ${escapeMarkdownV2(inscricao.nome)}`,
    `*E\\-mail:* ${escapeMarkdownV2(inscricao.email)}`,
    `*Telefone:* ${escapeMarkdownV2(inscricao.telefone)}`,
    inscricao.paroquia ? `*Paróquia:* ${escapeMarkdownV2(inscricao.paroquia)}` : null,
    '',
    `*Participantes \\(${participantes.length}\\):*`,
    ...participantes.map((p, i) => {
      const parts = [`${i + 1}\\. ${escapeMarkdownV2(p.nome)}`]
      if (p.idade != null) parts.push(`${escapeMarkdownV2(p.idade)} anos`)
      if (p.participaDesfile) parts.push('desfile: sim')
      return parts.join(' \\- ')
    }),
  ].filter(Boolean)
  await sendTelegram(lines.join('\n'))
}
