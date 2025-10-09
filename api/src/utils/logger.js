const fs = require('fs').promises
const path = require('path')

async function logModeratedMessage (message, username, reason) {
  try {
    const logsDir = path.join(__dirname, '../logs')
    await fs.mkdir(logsDir, { recursive: true })

    const now = new Date()
    const timestamp = now.toISOString()
    const dateStr = now.toISOString().split('T')[0]
    const logFile = path.join(logsDir, `moderation-${dateStr}.log`)

    const logEntry = `[${timestamp}] Usuario: ${username} | Razón: ${reason} | Mensaje: ${message}\n`
    await fs.appendFile(logFile, logEntry, 'utf8')

    console.log(`Mensaje moderado registrado: ${username}`)
  } catch (error) {
    console.error('Error al escribir log de moderación:', error)
  }
}

module.exports = { logModeratedMessage }
