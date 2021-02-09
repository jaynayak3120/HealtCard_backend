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

doctorRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query(`select * from doctor where "doctorID"=${req.body.doctorID}`)

        const result = await comparePass(req.body.docPass,resp.rows[0].docPass)
        if(result) {
            delete resp.rows[0].docPass
            res.status(200).json(resp.rows[0])
        } else {
            res.status(404).json({ message: 'Wrong password' })
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

doctorRoute.post('/signup', async (req,res) => {
    try {
        const text = ['INSERT INTO doctor VALUES($1, $2, $3, $4, $5) RETURNING *',`SELECT * FROM doctor where "doctorID"=${req.body.doctorID}`],
              values = [req.body.doctorID, req.body.docPass, req.body.docName, req.body.degree, req.body.hospitalName]
        
        const user = await client.query(text[1])

        if(user.rowCount) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[1] = await getHashedPass(req.body.docPass)
            const resp = await client.query(text[0], values)
            
            delete resp.rows[0].docPass
            res.status(201).json(resp.rows[0])
        }
    } catch (e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

module.exports = doctorRoute