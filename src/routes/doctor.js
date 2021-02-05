const express = require('express')

const doctorRoute = express.Router()

doctorRoute.get('/', (req,res) => {
    res.status(200).send('Doctor route')
})

doctorRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.doctorId}`)
})

module.exports = doctorRoute