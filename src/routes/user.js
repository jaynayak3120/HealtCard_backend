const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken }  = require('../Controllers/auth'),
      { patientAccess } = require('../Controllers/permission'),
      userRoute = express.Router()

userRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query('SELECT * FROM "Patient" WHERE "patientID"=$1',[req.body.patientID])

        const result = await comparePass(req.body.patientPass,resp.rows[0].patientPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].patientID, role: '"Patient"' })
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
        const d = new Date(1997,04,11)
        const text = ['INSERT INTO "Patient" VALUES($1, $2, $3, $4, $5) RETURNING *',`SELECT * FROM "Patient" WHERE "patientID"=${req.body.patientID}`],
              values = [req.body.patientID, req.body.patientName,d.toDateString(), req.body.patientPass, req.body.bloodGrp]
        
        const user = await client.query(text[1])

        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[3] = await getHashedPass(req.body.patientPass)
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
        .query('SELECT * FROM "Patient"')
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
        const resp = await client.query('SELECT * FROM "Patient" WHERE "patientID"=$1',[req.user._id])
        delete resp.rows[0].patientPass
        res.status(200).json({ patient: resp.rows[0] })
    } catch (e) {
        res.status(404).json({ message: 'User Not Found', errors: e.stack})
    }
})

userRoute.get('/:patientID/cases', async (req, res) => {
    if(req.params.patientID === req.user._id){   
        try {
            const resp = await client.query('SELECT "Cases".*, "Prescription"."prescDetail", "Prescription"."dateOfPrescription", "Reports"."reportURL", "Reports"."dateOfReport" FROM "Cases" INNER JOIN "Patient" ON ("Cases"."patientID" = "Patient"."patientID") LEFT JOIN "Reports" ON ("Cases"."reportID" = "Reports"."reportID") LEFT JOIN "Prescription" ON ("Cases"."prescriptionID" = "Prescription"."prescriptionID") where "Patient"."patientID"=$1',[req.user._id])
            res.status(200).json({ cases: resp.rows })
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack })
        }
    } else {
        res.status(403).json({ message: 'You are not authorized'})
    }
})

module.exports = userRoute
