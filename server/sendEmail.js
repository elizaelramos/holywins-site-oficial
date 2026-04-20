import nodemailer from 'nodemailer'

let cachedTransport = null

function getTransport() {
  if (cachedTransport) return cachedTransport
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !port || !user || !pass) return null
  cachedTransport = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  })
  return cachedTransport
}

function renderInscricaoEmailHtml(inscricao) {
  const participantes = inscricao.participantes ?? []
  const listaHtml = participantes
    .map(
      (p, i) => `<li style="margin:4px 0">
          <strong>${escapeHtml(p.nome)}</strong>${p.idade != null ? ` &middot; ${p.idade} anos` : ''}
          ${p.participaDesfile ? ' &middot; desfile' : ''}
        </li>`,
    )
    .join('')

  return `<!doctype html>
  <html lang="pt-br">
    <body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;padding:24px;background:#f7f7fb">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,0.05)">
        <h1 style="margin-top:0;color:#3b0764">Inscrição confirmada</h1>
        <p>Olá, <strong>${escapeHtml(inscricao.nome)}</strong>! Recebemos sua inscrição para o <strong>Holywins Corumbá</strong>.</p>
        <p><strong>Código de inscrição:</strong>
          <span style="display:inline-block;background:#f3e8ff;color:#6b21a8;padding:6px 12px;border-radius:6px;font-family:monospace;font-size:16px">${escapeHtml(inscricao.codigo)}</span>
        </p>
        <p style="color:#555;font-size:14px">Guarde este código. Em caso de dúvida ou se precisar consultar sua inscrição, é ele que usaremos para te identificar.</p>

        <h2 style="font-size:16px;color:#3b0764;margin-top:24px">Participantes (${participantes.length})</h2>
        <ul style="padding-left:20px">${listaHtml}</ul>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="color:#777;font-size:13px">Se você não solicitou esta inscrição, pode ignorar este e-mail.</p>
        <p style="color:#777;font-size:13px">Holywins Corumbá &middot; <a href="https://www.holywinscorumba.com" style="color:#6b21a8">holywinscorumba.com</a></p>
      </div>
    </body>
  </html>`
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export async function sendInscricaoConfirmation(inscricao) {
  const transport = getTransport()
  if (!transport) {
    console.log('[email] SMTP não configurado — e-mail de confirmação ignorado')
    return
  }
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER
  try {
    await transport.sendMail({
      from: `Holywins Corumbá <${from}>`,
      to: inscricao.email,
      subject: `Inscrição confirmada — código ${inscricao.codigo}`,
      html: renderInscricaoEmailHtml(inscricao),
    })
  } catch (err) {
    console.error('[email] falha ao enviar confirmação', err?.message ?? err)
  }
}
