const express = require('express');
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

// mongoDB URI

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gqju11e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const lectureCollection = client.db("learnerCafeDB").collection("lectureSlide");

        app.get('/alllecture', async (req, res) => {
            const cursor = lectureCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // categorywise api
        app.get('/alllecture/:category', async (req, res) => {
            // console.log(req.params.category);
            if (req.params.category === 'CSE' || req.params.category === 'EEE' || req.params.category === 'MATH') {
                const result = await lectureCollection.find({ category: req.params.category }).toArray();
                return res.send(result)
            }
        })
        // get api with email  http://localhost:5000/myLecture?email=xyz@abc.com
        app.get('/myLecture', async (req, res) => {
            console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = lectureCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        // post lecture
        app.post('/alllecture', async (req, res) => {
            const newLecture = req.body;
            const result = await lectureCollection.insertOne(newLecture);
            res.send(result);
            console.log(newLecture);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




// default api
app.get('/', (req, res) => {
    res.send('learner cafe is running');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})