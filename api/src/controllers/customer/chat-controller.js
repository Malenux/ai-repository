const { broadcast } = require('../../services/websocket-service')

exports.sendMessage = async (req, res) => {
  try {
    broadcast('colectivo', JSON.stringify({ event: 'new_message', data: req.body }))
    res.status(200).send({ message: 'Mensaje recibido' })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: 'Error al obtener el chat' })
  }
}
