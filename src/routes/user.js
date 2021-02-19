const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken }  = require('../Controllers/auth'),
      { patientAccess } = require('../Controllers/permission'),
      userRoute = express.Router()

userRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query('SELECT * FROM patient WHERE "patientID"=$1',[req.body.patientID])

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
        const text = ['INSERT INTO patient VALUES($1, $2, $3, $4, $5) RETURNING *',`SELECT * FROM patient WHERE "patientID"=${req.body.patientID}`],
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

userRoute.get('/', (req,res) => {
    client
        .query('SELECT * FROM patient')
        .then(resp => {
            res.status(200).json({users: resp.rows})
        })
        .catch(e => {
            res.status(503).json({message: 'Connection Error'})
            console.error(e.stack)
        })
})

userRoute.use(verifyToken)
userRoute.use(patientAccess)

userRoute.get('/:id', async (req,res) => {
    try {
        const resp = await client.query('SELECT * FROM patient WHERE "patientID"=$1',[req.user._id])
        delete resp.rows[0].patientPass
        res.status(200).json({ patient: resp.rows[0] })
    } catch (e) {
        res.status(404).json({ message: 'User Not Found', errors: e.stack})
    }
})

userRoute.get('/:patientID/cases', async (req, res) => {
    if(req.params.patientID === req.user._id){   
        try {
            const resp = await client.query('SELECT cases.*, patient.* FROM cases INNER JOIN patient ON (cases."patientID" = patient."patientID")  where patient."patientID"=$1',[req.user._id])
            res.status(200).json({ cases: resp.rows })
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack })
        }
    } else {
        res.status(403).json({ message: 'You are not authorized'})
    }
})

module.exports = userRoute