const jwt = require('jsonwebtoken')

function getToken(values) {
    return jwt.sign({...values}, process.env.JWT_SECRET, { expiresIn: '1d' })
}

function verifyToken( req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader.split(' ')[1]
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err,user) => {
            if(err){
                return res.status(403).json({ message : 'You are not authorized', errors: err })
            }
            req.user = user
            next()
        })   
    } else {
        return res.status(403).json({ message : 'You are not authorized', errors: err })
    }
}

module.exports = {
    getToken,
    verifyToken
}
