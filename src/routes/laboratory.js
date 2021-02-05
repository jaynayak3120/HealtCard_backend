const express = require('express')

const labRoute = express.Router()

labRoute.get('/', (req,res) => {
    res.status(200).send('Laboratory route')
})

labRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.labId}`)
})

module.exports = labRoute