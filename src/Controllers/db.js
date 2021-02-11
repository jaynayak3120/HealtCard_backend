const { Client } = require('pg')

const client = new Client({
    connectionString: process.env.CONNECTION_STR
})

client
  .connect()
  .then(() => console.log('connected'))
  .catch(err => console.error('connection error', err.stack))

module.exports = client