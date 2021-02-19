const express = require('express'),
      multer = require('multer'),
      path = require('path'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken } = require('../Controllers/auth'),
      { labAccess } = require('../Controllers/permission'),
      labRoute = express.Router()

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(path.dirname(__dirname), 'reports'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({ storage: storage })

labRoute.post('/signin', async (req,res) => {
    try {
        const resp = await client.query('SELECT * FROM laboratory WHERE "labID"=$1',[req.body.labID])

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
        const text = ['INSERT INTO laboratory VALUES($1, $2, $3) RETURNING *','SELECT * FROM laboratory WHERE "labID"=$1'],
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

labRoute.get('/', async (req,res) => {
    try {
        const resp = await client.query("SELECT * FROM laboratory")
        res.status(200).json(resp.rows)
    } catch (e) {
        res.status(503).json({ message: "Connection Error" , errors: e.stack})
    }
})

labRoute.use(verifyToken)
labRoute.use(labAccess)

labRoute.get('/:labID', async (req,res) => {
    try{
        const resp = await client.query('SELECT * FROM laboratory WHERE "labID"=$1',[req.user._id])
        delete resp.rows[0].labPass
        res.status(200).json({ laboratory: resp.rows[0] })
    } catch (e) {
        res.status(404).json({message: "User Not Found!", errors: e.stack})
    }
})

labRoute.post('/addReport', upload.array('report'), (req, res) => {
    if(req.body.labID === req.user._id){
        try {
            const { labID, patientID } = req.body
            
            if(req.files.length > 0){
                req.files.map(file => {
                    console.log(file.filename);
                });
            }
            res.status(201).json( req.body )
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack , body: req.body})
        }
    } else {
        res.status(404).json({ message: 'You are not authorized' })
    }
})

module.exports = labRoute