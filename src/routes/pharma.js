const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken } = require('../Controllers/auth'),
      { pharmaAccess } = require('../Controllers/permission'),
      pharmaRoute = express.Router()
      
pharmaRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query('SELECT * FROM "Pharmacist" WHERE "pharmaID"=$1',[req.body.userID])

        const result = await comparePass(req.body.userPass,resp.rows[0].pharmaPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].pharmaID, role: '"Pharmacist"' })
            delete resp.rows[0].pharmaPass
            res.status(200).json({ user: resp.rows[0], token: token})
        } else {
            res.status(404).json({ message: 'Wrong password' })
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

pharmaRoute.post('/signup', async (req,res) => {
    try {
        const text = ['INSERT INTO "Pharmacist" VALUES($1, $2, $3) RETURNING *', `SELECT * FROM "Pharmacist" where "pharmaID"=${req.body.pharmaID}`],
              values = [req.body.pharmaID, req.body.pharmaName, req.body.pharmaPass]
        
        const user = await client.query(text[1])
        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[2] = await getHashedPass(req.body.pharmaPass)
            const resp = await client.query(text[0], values)
            
            delete resp.rows[0].pharmaPass
            res.status(201).json(resp.rows[0])
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

pharmaRoute.get('/', (req,res) => {
    client
    .query('SELECT * FROM "Pharmacist"')
    .then(resp => {
        res.status(200).send(resp.rows)
    })
    .catch(e => {
        res.status(503).send("Connection Error")
        console.error(e.stack)
    })
})

pharmaRoute.use(verifyToken)
pharmaRoute.use(pharmaAccess)

pharmaRoute.get('/:pharmaID', async (req,res) => {
    try{
        const resp = await client.query('SELECT * FROM "Pharmacist" WHERE "pharmaID"=$1',[req.params.pharmaID])
        delete resp.rows[0].pharmaPass
        res.status(200).json({pharmacists: resp.rows[0]})
    } catch (e) {
        res.status(404).json({message: "User Not Found!", errors: e.stack})
    }
})

pharmaRoute.get('/:pharmaID/:patientID', async (req, res) => {
    if(req.params.pharmaID === req.user._id) {
        try {
            const resp = await client.query('SELECT "Cases"."caseID","Cases"."prescription" FROM "Cases" WHERE "patientID"=$1',[req.params.patientID])
            res.status(200).json({ prescriptions: resp.rows })
        } catch (e) {
            res.status(403).json({ message: 'Something went wrong! Please try again later', errors: e.stack })
        }
    } else {
        res.status(403).json({ message: 'You are not authorized'})
    }
})

module.exports = pharmaRoute
