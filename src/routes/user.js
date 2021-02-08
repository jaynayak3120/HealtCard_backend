const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt')
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
    client
        .query(`select * from patient where "patientID"=${req.body.patientID}`)
        .then(resp => {
            console.log(resp.rows[0]);
            comparePass(req.body.patientPass,resp.rows[0].patientPass).then(result => {
                if(result) {
                    delete resp.rows[0].patientPass
                    res.status(200).send(resp.rows[0])
                } else {
                    res.status(403).send('Wrong password')
                }
            }).catch(e => {
                res.status(403).send('Something went wrong! Please try again')
            })
        })
        .catch(e => console.error(e.stack))
})

userRoute.post('/signup', (req,res) => {
    
    const text = 'INSERT INTO patient VALUES($1, $2, $3, $4, $5) RETURNING *',
          values = [req.body.patientID, req.body.patientPass, req.body.patientName, req.body.age, req.body.bloodGrp]

    getHashedPass(req.body.patientPass).then(pass => {
        values[1] = pass
        client
            .query(text, values)
            .then(resp => {
                delete resp.rows[0].patientPass
                res.status(200).send(resp.rows[0])
            })
            .catch(e => console.error(e.stack))
    })
})

module.exports = userRoute