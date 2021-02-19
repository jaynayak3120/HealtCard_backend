const env = require('dotenv'),
    bodyParser = require('body-parser')
env.config()

//----------Routes
const UserRoutes = require('./routes/user'),
      DoctorRoutes = require('./routes/doctor'),
      LabRoutes = require('./routes/laboratory'),
      PharmaRoute = require('./routes/pharma'),
      CasesRoute = require('./routes/cases')

const express = require('express'),
    
server = express()
server.use(express.json())
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: false}))

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