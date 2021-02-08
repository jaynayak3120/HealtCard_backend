const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt')
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
    client
        .query(`select * from pharmacists where "pharmaID"=${req.body.pharmaID}`)
        .then(resp => {
            comparePass(req.body.pharmaPass,resp.rows[0].pharmaPass).then(result => {
                if(result) {
                    delete resp.rows[0].pharmaPass
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

pharmaRoute.post('/signup', (req,res) => {

    const text = 'INSERT INTO pharmacists VALUES($1, $2, $3) RETURNING *'
    const values = [req.body.pharmaID, req.body.pharmaPass, req.body.pharmaName]

    getHashedPass(req.body.pharmaPass).then(pass => {
        values[1] = pass
        client
            .query(text, values)
            .then(resp => {
                delete resp.rows[0].pharmaPass
                res.status(200).send(resp.rows[0])
            })
            .catch(e => {
                res.status(403).send('Something went wrong! Please try again')
                console.error(e.stack)
            })
    })
})

module.exports = pharmaRoute