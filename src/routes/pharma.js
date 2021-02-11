const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken } = require('../Controllers/auth'),
      { pharmaAccess } = require('../Controllers/permission'),
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

pharmaRoute.get('/id', verifyToken, pharmaAccess, (req,res) => {
    res.status(200).send(`${req.body.userId}`)
})

pharmaRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query(`select * from pharmacists where "pharmaID"=${req.body.pharmaID}`)

        const result = await comparePass(req.body.pharmaPass,resp.rows[0].pharmaPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].pharmaID, role: 'pharmacists' })
            delete resp.rows[0].pharmaPass
            res.status(200).json({ pharmacists: resp.rows[0], token: token})
        } else {
            res.status(404).json({ message: 'Wrong password' })
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

pharmaRoute.post('/signup', async (req,res) => {
    try {
        const text = ['INSERT INTO pharmacists VALUES($1, $2, $3) RETURNING *', `SELECT * FROM pharmacists where "pharmaID"=${req.body.pharmaID}`],
              values = [req.body.pharmaID, req.body.pharmaPass, req.body.pharmaName]
        
        const user = await client.query(text[1])
        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[1] = await getHashedPass(req.body.pharmaPass)
            const resp = await client.query(text[0], values)
            
            delete resp.rows[0].pharmaPass
            res.status(201).json(resp.rows[0])
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

module.exports = pharmaRoute