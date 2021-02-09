const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken } = require('../Controllers/auth'),
      { labAccess } = require('../Controllers/permission'),
      labRoute = express.Router()

labRoute.get('/', verifyToken, async (req,res) => {
    try {
        const resp = await client.query("select * from laboratory")
        res.status(200).json(resp.rows)
    } catch (e) {
        res.status(503).json({ message: "Connection Error" , errors: e.stack})
    }
})

labRoute.get('/id', verifyToken, labAccess, (req,res) => {
    res.status(200).send(`${req.body.labId}`)
})

labRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query(`select * from laboratory where "labID"=${req.body.labID}`)

        const result = await comparePass(req.body.labPass,resp.rows[0].labPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].labID, role: 'laboratory' })
            delete resp.rows[0].labPass
            res.status(200).json({ laboratory: resp.rows[0], token: token })
        } else {
            res.status(404).json({ message: 'Wrong password' })
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

labRoute.post('/signup', async (req,res) => {
    try {
        const text = ['INSERT INTO laboratory VALUES($1, $2, $3) RETURNING *',`SELECT * FROM laboratory where "labID"=${req.body.labID}`],
              values = [req.body.labID, req.body.labPass, req.body.labName]

        const user = await client.query(text[1])
        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[1] = await getHashedPass(req.body.labPass)
            const resp = await client.query(text[0], values)
            
            delete resp.rows[0].labPass
            res.status(201).json(resp.rows[0])
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

module.exports = labRoute