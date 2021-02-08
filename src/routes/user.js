const express = require('express'),
      client = require('../Controllers/db'),
      userRoute = express.Router()

userRoute.get('/', (req,res) => {
    client
        .query("select * from patient")
        .then(resp => {
            res.status(200).send(resp.rows)
        })
        .catch(e => {
            res.status(503).send("Connection Error")
            console.error(e.stack)
        })
})

userRoute.get('/id', (req,res) => {
    res.status(200).send(`${req.body.userId}`)
})

userRoute.post('/signin', (req,res) => {
    console.log(req.body)
    client
        .query(`select * from patient where "patientID"=${req.body.patientID}`)
        .then(resp => {
            console.log(resp.rows)
            res.status(200).send(resp.rows[0])
        })
        .catch(e => console.error(e.stack))
})

userRoute.post('/signup', (req,res) => {
    console.log(req.body)
    const text = 'INSERT INTO patient VALUES($1, $2, $3, $4, $5) RETURNING *'
    const values = [req.body.patientID, req.body.patientPass, req.body.patientName, req.body.age, req.body.bloodGrp]
    client
        .query(text, values)
        .then(resp => {
            console.log(resp.rows)
            res.status(200).send(resp.rows[0])
        })
        .catch(e => console.error(e.stack))
})

module.exports = userRoute