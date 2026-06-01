import { sendChatMessage } from './notifyTelegram.js'
import {
  findByCodigo,
  updateVideo,
  extractMp4FromApplay,
  isApplayUrl,
  VideoStatus,
} from './eventVideosService.js'

const TELEGRAM_API = 'https://api.telegram.org'
const POLL_TIMEOUT = 30 // segundos (long polling)
const URL_RE = /https?:\/\/\S+/gi

function allowedChatIds() {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

// Extrai o código (primeiro número fora das URLs) e a URL do applay360.
function parseCommand(text) {
  const urls = text.match(URL_RE) || []
  const applayUrl = urls.find(isApplayUrl) || null
  const withoutUrls = text.replace(URL_RE, ' ')
  const numMatch = withoutUrls.match(/\d+/)
  const codigo = numMatch ? numMatch[0] : null
  return { codigo, applayUrl, hasUrl: urls.length > 0 }
}

async function handleMessage(msg) {
  const text = (msg.text || '').trim()
  if (!text) return

  const { codigo, applayUrl } = parseCommand(text)

  // Só tratamos como comando se houver um link do applay360 na mensagem,
  // para não reagir a conversas normais no chat.
  if (!applayUrl) {
    if (/https?:\/\//i.test(text)) {
      await sendChatMessage(msg.chat.id, '⚠️ O link precisa ser do applay360.com.', {
        replyToMessageId: msg.message_id,
      })
    }
    return
  }

  if (!codigo) {
    await sendChatMessage(
      msg.chat.id,
      'ℹ️ Informe o número do código junto com o link. Ex.:\nSenha 1\nhttps://applay360.com/event/...',
      { replyToMessageId: msg.message_id },
    )
    return
  }

  const codigoNorm = codigo.trim().toUpperCase()
  const video = await findByCodigo(codigoNorm)
  if (!video) {
    await sendChatMessage(msg.chat.id, `❌ Código ${codigoNorm} não encontrado.`, {
      replyToMessageId: msg.message_id,
    })
    return
  }

  try {
    const mp4 = await extractMp4FromApplay(applayUrl)
    const wasReady = video.status === VideoStatus.PRONTO && Boolean(video.videoUrl)
    await updateVideo(video.id, {
      source_url: applayUrl,
      video_url: mp4,
      status: VideoStatus.PRONTO,
    })
    await sendChatMessage(
      msg.chat.id,
      wasReady
        ? `♻️ Código ${codigoNorm} atualizado com o novo vídeo.`
        : `✅ Código ${codigoNorm} liberado!`,
      { replyToMessageId: msg.message_id },
    )
  } catch (err) {
    await sendChatMessage(
      msg.chat.id,
      `⚠️ Código ${codigoNorm}: não consegui extrair o vídeo. ${err?.message ?? ''}`.trim(),
      { replyToMessageId: msg.message_id },
    )
  }
}

async function getUpdates(token, offset) {
  const url = `${TELEGRAM_API}/bot${token}/getUpdates?timeout=${POLL_TIMEOUT}${
    offset != null ? `&offset=${offset}` : ''
  }&allowed_updates=${encodeURIComponent('["message"]')}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), (POLL_TIMEOUT + 10) * 1000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      console.error('[telegram-bot] getUpdates falhou', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return data.ok ? data.result : null
  } finally {
    clearTimeout(timeout)
  }
}

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const allowed = allowedChatIds()
  if (!token || allowed.size === 0) {
    console.log('[telegram-bot] desativado (TELEGRAM_BOT_TOKEN/CHAT_ID ausentes).')
    return
  }
  if (process.env.TELEGRAM_BOT_ENABLED === 'false') {
    console.log('[telegram-bot] desativado por TELEGRAM_BOT_ENABLED=false.')
    return
  }

  const startTime = Math.floor(Date.now() / 1000)
  let offset

  async function loop() {
    while (true) {
      try {
        const updates = await getUpdates(token, offset)
        if (updates) {
          for (const upd of updates) {
            offset = upd.update_id + 1
            const msg = upd.message
            if (!msg || !msg.text) continue
            // Ignora mensagens anteriores ao start (backlog antigo).
            if (msg.date && msg.date < startTime) continue
            // Apenas chats autorizados.
            if (!allowed.has(String(msg.chat?.id))) continue
            await handleMessage(msg).catch((err) =>
              console.error('[telegram-bot] erro ao processar mensagem', err?.message ?? err),
            )
          }
        }
      } catch (err) {
        console.error('[telegram-bot] erro no polling', err?.message ?? err)
        await new Promise((r) => setTimeout(r, 5000))
      }
    }
  }

  console.log(`[telegram-bot] ativo. Chats autorizados: ${[...allowed].join(', ')}`)
  loop()
}
