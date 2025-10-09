const fs = require('fs')

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('🛑 Error capturado:', err)
  }

  if (process.env.NODE_ENV === 'production' && err.statusCode !== 404) {
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${err.message}\n`

    fs.appendFile(`${global.__basedir}/error.log`, logMessage, (fsErr) => {
      if (fsErr) {
        console.error('Error al escribir en el archivo de registro:', fsErr)
      }
    })
  }

  const statusCode = err.statusCode || 500
  const message = statusCode === 422 ? err.errors : err.message || 'Ha ocurrido un error inesperado en el servidor.'

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
