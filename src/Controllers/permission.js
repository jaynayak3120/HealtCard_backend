const client = require('./db')

async function patientAccess( req, res, next) {
    const resp1 = await client.query(`SELECT * FROM ${req.user.role} where "patientID"=${req.user._id}`)
    if(resp1.rowCount !== 1) {
        return res.status(403).json({ message: "You are not authorized" })
    }
    next()
}

async function doctorAccess( req, res, next) {
    const resp2 = await client.query(`SELECT * FROM ${req.user.role} where "doctorID"=${req.user._id}`)
    if(resp2.rowCount !== 1) {
        return res.status(403).json({ message: "You are not authorized" })
    }
    next()
}

async function pharmaAccess( req, res, next) {
    const resp3 = await client.query(`SELECT * FROM ${req.user.role} where "pharmaID"=${req.user._id}`)
    if(resp3.rowCount !== 1) {
        return res.status(403).json({ message: "You are not authorized" })
    }
    next()
}

async function labAccess( req, res, next) {
    const resp4 = await client.query(`SELECT * FROM ${req.user.role} where "labID"=${req.user._id}`)
    if( resp4.rowCount !== 1 ) {
        return res.status(403).json({ message: "You are not authorized" })
    }
    next()
}

module.exports = {
    patientAccess,
    doctorAccess,
    pharmaAccess,
    labAccess
}