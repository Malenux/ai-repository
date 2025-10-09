const express = require('express')
const router = express.Router()

router.use('/customer/chats', require('./customer/chats'))

module.exports = router
