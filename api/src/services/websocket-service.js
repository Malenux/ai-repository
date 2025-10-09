const WebSocket = require('ws')
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

function broadcast (channel, data, sender = null) {
  const set = channels.get(channel)
  if (!set) return
  const payload = JSON.stringify({ channel, data })
  for (const client of set) {
    if (client.readyState === WebSocket.OPEN) {
      // Evita reenviar al propio emisor si no quieres duplicados
      if (client !== sender) client.send(payload)
    }
  }
}

wss.on('connection', (ws, req) => {
  ws._channels = new Set()

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    switch (msg.type) {
      case 'subscribe':
        subscribe(ws, msg.channel)
        break

      case 'unsubscribe':
        unsubscribe(ws, msg.channel)
        break

      default:
        // 👇 Si tiene canal y data, lo reenviamos a todos los suscriptores
        if (msg.channel && msg.data) {
          broadcast(msg.channel, msg.data, ws)
        }
        break
    }
  })

  ws.on('close', () => {
    unsubscribeAll(ws)
  })
})

module.exports = { wss, broadcast }
