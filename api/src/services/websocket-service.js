const WebSocket = require('ws')
const OpenAIService = require('./openai-service')
const { logModeratedMessage } = require('../utils/logger')

const wss = new WebSocket.Server({ noServer: true })
const channels = new Map()

function subscribe (ws, channel) {
  if (!channel) return
  if (!channels.has(channel)) channels.set(channel, new Set())
  channels.get(channel).add(ws)
  ws._channels.add(channel)
}

function unsubscribe (ws, channel) {
  if (!channel) return
  const set = channels.get(channel)
  if (set) {
    set.delete(ws)
    if (set.size === 0) channels.delete(channel)
  }
  ws._channels.delete(channel)
}

function unsubscribeAll (ws) {
  for (const ch of ws._channels) unsubscribe(ws, ch)
}

function broadcast (channel, data) {
  const set = channels.get(channel)
  if (!set) return
  const payload = JSON.stringify({ channel, data })
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}

async function moderateMessage (message, username) {
  if (!process.env.OPENAI_ASSISTANT || !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ Moderador IA no configurado. Aceptando mensaje por defecto.')
    return {
      approved: true,
      message
    }
  }

  try {
    const openai = new OpenAIService()
    await openai.createThread()
    await openai.setAssistant(process.env.OPENAI_ASSISTANT)
    await openai.createMessage(message)
    await openai.runStatus()

    const respuesta = openai.answer
    const payload = JSON.parse(respuesta)

    if (payload.error === 'true') {
      await logModeratedMessage(message, username, payload.response)
      return {
        approved: false,
        reason: payload.response || 'Contenido no permitido detectado'
      }
    } else {
      return {
        approved: true,
        message: payload.message || message
      }
    }
  } catch (error) {
    console.error('❌ Error en moderación de IA:', error)
    return {
      approved: true,
      message
    }
  }
}

wss.on('connection', (ws, req) => {
  ws._channels = new Set()

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    console.log('📩 Mensaje recibido en WS:', msg)

    switch (msg.type) {
      case 'subscribe':
        subscribe(ws, msg.channel)
        console.log(`✅ Usuario suscrito al canal: ${msg.channel}`)
        break
      case 'unsubscribe':
        unsubscribe(ws, msg.channel)
        console.log(`❌ Usuario desuscrito del canal: ${msg.channel}`)
        break
      case 'chat':
        if (msg.channel && msg.username && msg.message) {
          console.log(`💬 Moderando mensaje de ${msg.username}: "${msg.message}"`)
          ;(async () => {
            const moderation = await moderateMessage(msg.message, msg.username)

            if (moderation.approved) {
              console.log('✅ Mensaje aprobado, broadcasting...')
              const chatData = {
                type: 'chat',
                username: msg.username,
                message: moderation.message,
                timestamp: new Date().toISOString()
              }
              broadcast(msg.channel, chatData)
            } else {
              console.log(`🚫 Mensaje bloqueado: ${moderation.reason}`)
              ws.send(JSON.stringify({
                type: 'moderation_blocked',
                reason: moderation.reason,
                originalMessage: msg.message
              }))
            }
          })().catch(err => {
            console.error('❌ Error en moderación de chat:', err)
          })
        } else {
          console.warn('⚠️ Mensaje de chat incompleto:', msg)
        }
        break
      default:
        console.warn('⚠️ Tipo de mensaje desconocido:', msg.type)
        break
    }
  })

  ws.on('close', () => {
    unsubscribeAll(ws)
  })
})

module.exports = { wss, broadcast }
