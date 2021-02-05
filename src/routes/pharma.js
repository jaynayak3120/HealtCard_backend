const express = require('express')

const pharmaRoute = express.Router()

pharmaRoute.get('/', (req,res) => {
    res.status(200).send('Pharma route')
})

pharmaRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.userId}`)
})

module.exports = pharmaRoute