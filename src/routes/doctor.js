const express = require('express'),
      client = require('../Controllers/db'),
      doctorRoute = express.Router()

doctorRoute.get('/', (req,res) => {
    client
        .query("select * from doctor")
        .then(resp => {
            res.status(200).send(resp.rows)
        })
        .catch(e => {
            res.status(503).send("Connection Error")
            console.error(e.stack)
        })
})

doctorRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.doctorId}`)
})

doctorRoute.post('/signin', (req,res) => {
    console.log(req.body)
    client
    .query(`select * from doctor where "docID"=${req.body.docID}`)
    .then(resp => {
        console.log(resp.rows)
        res.status(200).send(resp.rows[0])
    })
    .catch(e => console.error(e.stack))
})

doctorRoute.post('/signup', (req,res) => {
    console.log(req.body)
    const text = 'INSERT INTO patient VALUES($1, $2, $3, $4, $5) RETURNING *'
    const values = [req.body.docID, req.body.docPass, req.body.docName, req.body.degree, req.body.hospitalName]
    client
        .query(text, values)
        .then(resp => {
            console.log(resp.rows)
            res.status(200).send(resp.rows[0])
        })
        .catch(e => console.error(e.stack))
})

module.exports = doctorRoute