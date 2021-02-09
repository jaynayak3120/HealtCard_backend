const jwt = require('jsonwebtoken'),
      client = require('./db')

function getToken(values) {
    return jwt.sign({...values}, process.env.JWT_SECRET, { expiresIn: '1d' })
}

function verifyToken( req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.JWT_SECRET, async (err,user) => {
        if(err){
            console.log(user);
            console.log(err);
            res.status(403).json({ message : 'You are not authorized', errors: err })
        }
        switch(user.role) {
            case 'patient':
                const resp1 = await client.query(`SELECT * FROM ${user.role} where "patientID"=${user._id}`)
                if(resp1.rowCount !== 1) {
                    res.status(403).json({ message: "You are not authorized" })
                }
                req.user = user
                next()
                break;
            case 'doctor':
                const resp2 = await client.query(`SELECT * FROM ${user.role} where "doctorID"=${user._id}`)
                if(resp2.rowCount !== 1) {
                    res.status(403).json({ message: "You are not authorized" })
                }
                req.user = user
                next()
                break;
            case 'pharmacists':
                const resp3 = await client.query(`SELECT * FROM ${user.role} where "pharmaID"=${user._id}`)
                if(resp3.rowCount !== 1) {
                    res.status(403).json({ message: "You are not authorized" })
                }
                req.user = user
                next()
                break;
            case 'laboratory':
                const resp4 = await client.query(`SELECT * FROM ${user.role} where "labID"=${user._id}`)
                if( resp4.rowCount !== 1 ) {
                    res.status(403).json({ message: "You are not authorized" })
                }
                req.user = user
                next()
                break;
            default:
        }
    })
}

module.exports = {
    getToken,
    verifyToken
}