const express = require('express'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken } = require('../Controllers/auth'),
      { doctorAccess } = require('../Controllers/permission'),
      doctorRoute = express.Router()

doctorRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query('SELECT * FROM "Doctor" WHERE "doctorID"=$1',[req.body.doctorID])

        const result = await comparePass(req.body.docPass,resp.rows[0].docPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].doctorID, role: '"Doctor"' })
            delete resp.rows[0].docPass
            res.status(200).json({ doctor: resp.rows[0], token: token })
        } else {
            res.status(404).json({ message: 'Wrong password' })
        }
    } catch(e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

doctorRoute.post('/signup', async (req,res) => {
    try {
        const text = ['INSERT INTO "Doctor" VALUES($1, $2, $3, $4, $5) RETURNING *',`SELECT * FROM "Doctor" where "doctorID"=${req.body.doctorID}`],
                values = [req.body.doctorID, req.body.docName, req.body.hospitalName, req.body.docPass, req.body.degree]
        
        const user = await client.query(text[1])

        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[3] = await getHashedPass(req.body.docPass)
            const resp = await client.query(text[0], values)
            
            delete resp.rows[0].docPass
            res.status(201).json(resp.rows[0])
        }
    } catch (e) {
        res.status(500).json({ message:'Something went wrong! Please try again', errors: e.stack })
    }
})

doctorRoute.get('/', (req,res) => {
    client
        .query('SELECT * FROM "Doctor"')
        .then(resp => {
        })
        .catch(e => {
            res.status(503).send("Connection Error")
            console.error(e.stack)
        })
})

doctorRoute.use(verifyToken)
doctorRoute.use(doctorAccess)

doctorRoute.get('/:doctorID', async (req,res) => {
    try{
        const resp = await client.query('SELECT * FROM "Doctor" WHERE "doctorID"=$1',[req.params.doctorID])
        delete resp.rows[0].docPass
        res.status(200).json({doctor: resp.rows[0]})
    } catch (e) {
        res.status(404).json({message: "User Not Found!", errors: e.stack})
    }
})

doctorRoute.get('/:doctorID/cases', async (req, res) => {
    if(req.params.doctorID === req.user._id){   
        try {
            const resp = await client.query('SELECT "Cases".*, "Doctor"."doctorID", "Doctor"."docName", "Doctor"."hospitalName" FROM "Cases" INNER JOIN "Doctor" ON ("Cases"."docID" = "Doctor"."doctorID")  where "Doctor"."doctorID"=$1',[req.params.doctorID])
            res.status(200).json({ cases: resp.rows })
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack })
        }
    } else {
        res.status(403).json({ message: 'You are not authorized'})
    }
})

doctorRoute.get('/:doctorID/:patientID/cases', async (req, res) => {
    if(req.params.doctorID === req.user._id){   
        try {
            const resp = await client.query('SELECT "Cases".*, "Doctor"."doctorID", "Doctor"."docName", "Doctor"."hospitalName" FROM "Cases" INNER JOIN "Doctor" ON ("Cases"."docID" = "Doctor"."doctorID")  where "Cases"."patientID"=$1',[req.params.patientID])
            res.status(200).json({ cases: resp.rows })
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack })
        }
    } else {
        res.status(403).json({ message: 'You are not authorized'})
    }
})

doctorRoute.post('/:doctorID/:patientID/addCase', async (req, res) => {
    if(req.params.doctorID === req.user._id){   
        try {
            const resp = await client.query('INSERT INTO "Cases"("docID","patientID","casedetails","prescription","caseID") VALUES($1,$2,$3,$4,$5)',[req.user._id,req.body.patientID,req.body.casedetails,req.body.prescription,req.body.caseID])
            console.log(resp);
            res.status(201).json( req.body )
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack })
        }
    } else {
        res.status(403).json({ message: 'You are not authorized'})
    }
})

module.exports = doctorRoute
