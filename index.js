require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const admin = require('firebase-admin')
const stripe = require('stripe')(process.env.SICRETE_API_KEY);
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
    const retistereventsCollection = db.collection("register")
    const usersCollection = db.collection("users")
    const membershipPayments = db.collection("payment")
    

    app.post('/clubs', async (req, res) => {
      const club = req.body
      const result = await clubsCollection.insertOne(club)
      res.send(result)
    })
    //  clubs releted api 
    app.get('/clubs/limit', async (req, res) => {
      const cursor = clubsCollection.find()
      const result = await cursor.limit(6).sort({ createdAt: 1 }).toArray()
      res.send(result)
    })
    app.get('/clubs', async (req, res) => {
      const cursor = clubsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/clubs/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await clubsCollection.findOne(query)
      res.send(result)
    })



    // events relayed API

    app.post('/events', async (req, res) => {

      const events = req.body
      const result = await eventsCollection.insertOne(events)
      res.send(result)
    })

    app.post('/register/events', async (req, res) => {
      const resgisterdata = req.body
      console.log(resgisterdata)
      resgisterdata.created_At = new Date().toLocaleDateString()
      const alreatyexist = await retistereventsCollection.findOne({ clubId: resgisterdata.clubId })

      if (alreatyexist) {
        return res.send({ message: 'Already Register' })
      }
      const result = await retistereventsCollection.insertOne(resgisterdata)
      res.send(result)
    })
    app.get('/events', async (req, res) => {
      const cursor = eventsCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.delete('/events/delete/:id', async (req, res) => {

      const id = req.params.id
      const query = { _id: new ObjectId(id) }

      const result = await retistereventsCollection.deleteOne(query)
      res.send(result)
    })
    


    app.get('/register/events/:email', async (req, res) => {
      const email = req.params.email
      const result = await retistereventsCollection.find({ email: email }).toArray()
      res.send(result)
    })
    app.get('/events/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await eventsCollection.findOne(query)
      res.send(result)
    })

    // user related API

    app.post('/users', async (req, res) => {


      const userdata = req.body
      userdata.created_At = new Date().toLocaleDateString()
      userdata.last_loggedIn = new Date().toLocaleDateString()
      userdata.role = "member"


      const alreatyexist = await usersCollection.findOne({ email: userdata.email })


      if (alreatyexist) {

        const result = await usersCollection.updateOne({ email: userdata.email }, {
          $set: {
            last_loggedIn: new Date().toLocaleDateString()
          }
        })

        return res.send(result)
      }
      const result = await usersCollection.insertOne(userdata)

      res.send(result)
    })

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const result = await usersCollection.findOne({ email });

      if (!result) {
        return res.send({ role: 'member' }); // or null, or error message
      }

      res.send({ role: result.role });
    });
    app.get('/manager-request', async (req, res) => {
      const managerinfo = req.body 

      
    })

    // payment related API

    app.post('/create-checkout-session', async (req, res) => {

      const paymentinfo = req.body
      console.log(paymentinfo)

      const session = await stripe.checkout.sessions.create({

        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: paymentinfo?.name,

              },
              unit_amount: paymentinfo?.price * 100
            },
            quantity: 1,
          },
        ],
        customer_email: paymentinfo?.email,
        mode: 'payment',
        metadata: {
          type: paymentinfo?.type,
          status: paymentinfo?.status,
          category: paymentinfo?.category,
          clubId: paymentinfo?.clubId,
          member: paymentinfo?.email
          // 
        },
      //  
        success_url: `${process.env.DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.DOMAIN}/payment-cancel/${paymentinfo?.clubId}`
      })

     res.send({ url: session.url })
    })
    
 

    app.post('/payment-success', async (req, res) => {

      const { sessionId } = req.body
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const transection = await membershipPayments.findOne({ transectionId: session.payment_intent })

      if (transection) 
 
    
      if (transection) return 

      const plant = await clubsCollection.findOne({ _id: new ObjectId(session.metadata.clubId) })
      if (session.status === "complete" || plant ) {

        const orderinfo = {
          clubId: session.metadata.clubId,
          transectionId: session.payment_intent,
          member: session.metadata.member,
          status: 'paid',
          price: session.amount_total / 100,
          name: plant?.clubName, 
          club: {
            ...plant
          }

        }
        orderinfo.created_At = new Date().toLocaleDateString()
       
        console.log("orderinformation",orderinfo)
        const result = await membershipPayments.insertOne(orderinfo)

        return res.send(result)
      }

      return res.send({ transectionId: session.payment_intent, orderId: transection._id })
    })

    app.get('/Myclubs/payment/:email', async (req, res) => {
      const email = req.params.email
      const result = await membershipPayments.find({ member: email }).toArray()
      res.send(result)
    })
    app.delete('/Myclubs/delete/:id', async (req, res) => {

      const id = req.params.id
      const query = { _id: new ObjectId(id) }

      const result = await membershipPayments.deleteOne(query)
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
