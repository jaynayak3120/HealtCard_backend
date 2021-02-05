const env = require('dotenv')
env.config()

//----------Routes
const UserRoutes = require('./src/routes/user')
const DoctorRoutes = require('./src/routes/doctor')
const LabRoutes = require('./src/routes/laboratory')
const PharmaRoute = require('./src/routes/pharma')
const CasesRoute = require('./src/routes/cases')

const express = require('express')
const server = express()
server.use(express.json())

server.get('', (req,res) => {
    res.send('Hello from express!')
})

server.use('/api/user',UserRoutes)
server.use('/api/doctor',DoctorRoutes)
server.use('/api/lab',LabRoutes)
server.use('/api/pharma',PharmaRoute)
server.use('/api/cases',CasesRoute)

server.use('/api',(req,res) => {
    res.status(403).send('You are not authorized')
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})