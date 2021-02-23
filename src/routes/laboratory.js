const express = require('express'),
      multer = require('multer'),
      path = require('path'),
      client = require('../Controllers/db'),
      { getHashedPass, comparePass } = require('../Controllers/bcrypt'),
      { getToken, verifyToken } = require('../Controllers/auth'),
      { labAccess } = require('../Controllers/permission'),
      fs = require('fs'),
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
        const resp = await client.query('SELECT * FROM "Laboratory" WHERE "labID"=$1',[req.body.labID])

        const result = await comparePass(req.body.labPass,resp.rows[0].labPass)
        if( result ) {
            const token = getToken({ _id: resp.rows[0].labID, role: '"Laboratory"' })
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
        const text = ['INSERT INTO "Laboratory" VALUES($1, $2, $3) RETURNING *',`SELECT * FROM "Laboratory" WHERE "labID"=${req.body.labID}`],
                values = [req.body.labID, req.body.labName, req.body.labPass]

        const user = await client.query(text[1])
        if(user.rowCount !== 0) {
            res.status(400).json({ message: "User already exist" })
        } else {
            values[2] = await getHashedPass(req.body.labPass)
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
        const resp = await client.query('SELECT * FROM "Laboratory"')
        res.status(200).json(resp.rows)
    } catch (e) {
        res.status(503).json({ message: "Connection Error" , errors: e.stack})
    }
})

//const pdf = require('../reports/Heart_Report.pdf')
//console.log(pdf);
labRoute.get('/downloadfile',(req, res) => {
    const src = fs.createReadStream('D://Project//backend//src//reports//Heart_Report.pdf');
  
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=sample.pdf'
    });
  
    src.pipe(res);
});

labRoute.use(verifyToken)
labRoute.use(labAccess)

labRoute.get('/:labID', async (req,res) => {
    try{
        const resp = await client.query('SELECT * FROM "Laboratory" WHERE "labID"=$1',[req.user._id])
        delete resp.rows[0].labPass
        res.status(200).json({ laboratory: resp.rows[0] })
    } catch (e) {
        res.status(404).json({message: "User Not Found!", errors: e.stack})
    }
})

labRoute.post('/addReport', upload.array('report'), async (req, res) => {
    if(req.body.labID === req.user._id){
        try {
            const d = new Date(2015,02,21)
            var urls = []

            if(req.files.length > 0){
                urls = req.files.map(file => {
                    console.log(file.filename);
                    return '"D://Project//backend//src//reports//"'+file.filename
                    //'https://drive.google.com/file/d/1V93QCn1JNt1xxLSXq-w1B7jE4DKwhfS5/view?usp=sharing'
                });
            }
            const resp = await client.query('INSERT INTO "Reports"("dateOfReport","labID","patientID","caseID","reportURL") VALUES($1,$2,$3,$4,$5) RETURNING *',[d.toDateString(),req.body.labID,req.body.patientID,req.body.caseID,urls])

            const resp1 = await client.query('UPDATE "Cases" SET "reportID"=$1 where "caseID"=$2',[resp.rows[0].reportID,req.body.caseID])

            res.status(201).json({ report: resp.rows[0], case: resp1.rows[0] })
        } catch (e) {
            res.status(404).json({ message: 'Data not found', errors: e.stack , body: req.body })
        }
    } else {
        res.status(404).json({ message: 'You are not authorized' })
    }
})

module.exports = labRoute
