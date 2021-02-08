const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt')
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
    client
        .query(`select * from doctor where "doctorID"=${req.body.doctorID}`)
        .then(resp => {
            comparePass(req.body.docPass,resp.rows[0].docPass).then(result => {
                if(result) {
                    delete resp.rows[0].docPass
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

doctorRoute.post('/signup', (req,res) => {
    
    const text = 'INSERT INTO doctor VALUES($1, $2, $3, $4, $5) RETURNING *'
    const values = [req.body.doctorID, req.body.docPass, req.body.docName, req.body.degree, req.body.hospitalName]

    getHashedPass(req.body.docPass).then(pass => {
        values[1] = pass
        client
            .query(text, values)
            .then(resp => {
                delete resp.rows[0].docPass
                res.status(200).send(resp.rows[0])
            })
            .catch(e => {
                res.status(403).send('Something went wrong! Please try again')
                console.error(e.stack)
            })
    })
})

module.exports = doctorRoute