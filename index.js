require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const admin = require('firebase-admin')
const port = process.env.PORT || 3000
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString(
  'utf-8'
)
const serviceAccount = JSON.parse(decoded)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const app = express()
// middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://b12-m11-session.web.app',
    ],
    credentials: true,
    optionSuccessStatus: 200,
  })
)
app.use(express.json())

// jwt middlewares
// const verifyJWT = async (req, res, next) => {
//   const token = req?.headers?.authorization?.split(' ')[1]
//   console.log(token)
//   if (!token) return res.status(401).send({ message: 'Unauthorized Access!' })
//   try {
//     const decoded = await admin.auth().verifyIdToken(token)
//     req.tokenEmail = decoded.email
//     console.log(decoded)
//     next()
//   } catch (err) {
//     console.log(err)
//     return res.status(401).send({ message: 'Unauthorized Access!', err })
//   }
// }

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
          
    const db = client.db("B12-A11-DB")
    const clubsCollection = db.collection("clubs")
    const eventsCollection = db.collection("events")


    app.post('/clubs', async (req, res) => {
      const club = req.body
      const result = await clubsCollection.insertOne(club)
      res.send(result)
    })
//  clubs releted api 
    app.get('/clubs/limit', async (req, res) => {
      const cursor = clubsCollection.find()
      const result = await cursor.limit(6).sort({createdAt: 1}).toArray()
      res.send(result)
    })
    app.get('/clubs', async (req, res) => {
      const cursor = clubsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/clubs/:id', async (req, res) => {
      const id = req.params.id 
      const query = {_id: new ObjectId(id)}
      const result = await clubsCollection.findOne(query)
      res.send(result)
    })

    // events relayed API
    
    app.post('/events', async (req, res) => {

      const events = req.body 
      const result = await eventsCollection.insertOne(events)
      res.send(result)
    })
    app.get('/events', async (req, res) => {
      const cursor = eventsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/events/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await eventsCollection.findOne(query)
      res.send(result)
    })

    
   
    
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from Server..')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
