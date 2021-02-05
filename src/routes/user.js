const express = require('express')

const userRoute = express.Router()

userRoute.get('/', (req,res) => {
    res.status(200).send('User route')
})

userRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.userId}`)
})

module.exports = userRoute