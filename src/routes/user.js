const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken }  = require('../Controllers/auth'),
      { patientAccess } = require('../Controllers/permission'),
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

userRoute.get('/id', verifyToken, patientAccess, (req,res) => {
    res.status(200).send(`patient id : ${req.body.text}`)
})

userRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query(`select * from patient where "patientID"=${req.body.patientID}`)

        const result = await comparePass(req.body.patientPass,resp.rows[0].patientPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].patientID, role: 'patient' })
            delete resp.rows[0].patientPass
            res.status(200).json({patient: resp.rows[0], token: token})
        } else {
            res.status(404).json({ message: 'Wrong password' })
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again' })
    }
})

userRoute.post('/signup', async (req,res) => {
    try {
        const text = ['INSERT INTO patient VALUES($1, $2, $3, $4, $5) RETURNING *',`SELECT * FROM patient where "patientID"=${req.body.patientID}`],
              values = [req.body.patientID, req.body.patientPass, req.body.patientName, req.body.age, req.body.bloodGrp]
        
        const user = await client.query(text[1])

        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[1] = await getHashedPass(req.body.patientPass)
            const resp = await client.query(text[0], values)
            
            delete resp.rows[0].patientPass
            res.status(201).json(resp.rows[0])
        }
    } catch (e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

module.exports = userRoute