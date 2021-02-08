const express = require('express'),
      client = require('../Controllers/db'),
      labRoute = express.Router()

labRoute.get('/', (req,res) => {client
    .query("select * from laboratory")
    .then(resp => {
        res.status(200).send(resp.rows)
    })
    .catch(e => {
        res.status(503).send("Connection Error")
        console.error(e.stack)
    })
})

labRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.labId}`)
})

labRoute.post('/signin', (req,res) => {
    console.log(req.body)
    client
    .query(`select * from laboratory where "labID"=${req.body.labID}`)
    .then(resp => {
        console.log(resp.rows)
        res.status(200).send(resp.rows[0])
    })
    .catch(e => console.error(e.stack))
    res.status(200).send('Lab Login')
})

labRoute.post('/signup', (req,res) => {
    console.log(req.body)
    const text = 'INSERT INTO laboratory VALUES($1, $2, $3) RETURNING *'
    const values = [req.body.labID, req.body.labPass, req.body.labName]
    client
        .query(text, values)
        .then(resp => {
            console.log(resp.rows)
            res.status(200).send(resp.rows[0])
        })
        .catch(e => console.error(e.stack))
})

module.exports = labRoute