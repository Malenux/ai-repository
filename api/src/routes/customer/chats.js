const express = require('express')
const router = express.Router()
const controller = require('../../controllers/customer/chat-controller.js')

router.post('/', controller.sendMessage)

module.exports = router
