const express = require('express')

const casesRoute = express.Router()

casesRoute.get('/', (req,res) => {
    res.status(200).send('Cases route')
})

casesRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.userId}`)
})

module.exports = casesRoute