const bcrypt = require('bcrypt')

const saltRounds = 12

const getHashedPass = (pass) => {
    return bcrypt.hash(pass, saltRounds)
}

const comparePass = (userpass, dbpass) => {
    return bcrypt.compare(userpass, dbpass).then(result => result);
}

module.exports = {
    getHashedPass,
    comparePass
}