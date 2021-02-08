const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt')
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
    client
        .query(`select * from laboratory where "labID"=${req.body.labID}`)
        .then(resp => {
            comparePass(req.body.labPass,resp.rows[0].labPass).then(result => {
                if(result) {
                    delete resp.rows[0].labPass
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

labRoute.post('/signup', (req,res) => {

    const text = 'INSERT INTO laboratory VALUES($1, $2, $3) RETURNING *'
    const values = [req.body.labID, req.body.labPass, req.body.labName]
    
    getHashedPass(req.body.labPass).then(pass => {
        values[1] = pass
        client
            .query(text, values)
            .then(resp => {
                delete resp.rows[0].labPass
                res.status(200).send(resp.rows[0])
            })
            .catch(e => {
                res.status(403).send('Something went wrong! Please try again')
                console.error(e.stack)
            })
    })
})

module.exports = labRoute