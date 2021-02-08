const express = require('express'),
      client = require('../Controllers/db'),
      pharmaRoute = express.Router()

pharmaRoute.get('/', (req,res) => {client
    .query("select * from pharmacists")
    .then(resp => {
        res.status(200).send(resp.rows)
    })
    .catch(e => {
        res.status(503).send("Connection Error")
        console.error(e.stack)
    })
})

pharmaRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.userId}`)
})

pharmaRoute.post('/signin', (req,res) => {
    console.log(req.body)
    client
    .query(`select * from pharmacists where "pharmaID"=${req.body.pharmaID}`)
    .then(resp => {
        console.log(resp.rows)
        res.status(200).send(resp.rows[0])
    })
    .catch(e => console.error(e.stack))
})

pharmaRoute.post('/signup', (req,res) => {
    console.log(req.body)
    const text = 'INSERT INTO pharmacists VALUES($1, $2, $3) RETURNING *'
    const values = [req.body.pharmaID, req.body.pharmaPass, req.body.pharmaName]
    client
        .query(text, values)
        .then(resp => {
            console.log(resp.rows)
            res.status(200).send(resp.rows[0])
        })
        .catch(e => console.error(e.stack))
})

module.exports = pharmaRoute