const express = require('express');
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        // await client.connect();
        const lectureCollection = client.db("learnerCafeDB").collection("lectureSlide");
        const userCollection = client.db("learnerCafeDB").collection("users");
        const bookMarkCollection = client.db("learnerCafeDB").collection("bookmarks");

        // get all lecture
        app.get('/lectures', async (req, res) => {
            try {
                const cursor = lectureCollection.find().sort({ _id: -1 });
                const result = await cursor.toArray();
                res.status(200).json(result); // Sending the result as JSON response
            } catch (error) {
                console.error("Error fetching lectures:", error);
                res.status(500).send("Internal Server Error");
            }
        })

        // get single lecture
        app.get('/lectures/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await lectureCollection.findOne(query);

                if (result) {
                    res.status(200).json(result); // Sending the lecture as JSON response
                } else {
                    res.status(404).send("Lecture not found");
                }
            } catch (error) {
                console.error("Error fetching lecture:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        // search option
        app.get('/documentSearchByTopicName/:text', async (req, res) => {
            try {
                const searchText = req.params.text;
                const searchResult = await lectureCollection.find({
                    $or: [
                        { topicName: { $regex: searchText, $options: 'i' } },
                        { subName: { $regex: searchText, $options: 'i' } }
                    ]
                }).toArray();

                res.json(searchResult);
            } catch (error) {
                console.error("Error searching for lectures:", error);
                res.status(500).json({ error: "Internal server error" });
            }
        });

        // categorywise api for lecture http://localhost:5000/lectures/category/EEE
        app.get('/lectures/category/:category', async (req, res) => {
            try {
                const category = (req.params.category);
                if (category === 'slide' || category === 'presentation' || category === 'suggestion' || category === 'lecture' || category === 'labreport') {
                    const result = await lectureCollection.find({ category }).toArray();
                    res.status(200).json(result);
                } else {
                    res.status(404).send("Invalid category");
                }
            } catch (error) {
                console.error("Error fetching lectures by category:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        // get api with email  http://localhost:5000/myLectures?email=xyz@abc.com
        app.get('/myLectures', async (req, res) => {
            console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = lectureCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        // update document
        app.patch('/lectures/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = req.body;
            console.log(updatedDoc);
            const document = {
                $set: {
                    subName: updatedDoc.subName,
                    subCode: updatedDoc.subCode,
                    driveLink: updatedDoc.driveLink,
                    topicName: updatedDoc.topicName,
                    category: updatedDoc.category,
                    description: updatedDoc.description
                }
            }
            const result = await lectureCollection.updateOne(filter, document, options);
            res.send(result);
        })
        // post lecture
        app.post('/lectures', async (req, res) => {
            const newLecture = req.body;
            const result = await lectureCollection.insertOne(newLecture);
            res.send(result);
            console.log(newLecture);
        })
        // delete lecture
        app.delete('/lectures/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await lectureCollection.deleteOne(query);
            res.send(result);
        })
        // user api
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })
        // post users
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            console.log('Existing USER: ', existingUser);
            if (existingUser) {
                return res.send({ message: 'user already exist' })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })
        // make admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        // get admin   ---- http://localhost:5000/users/admin/ashraful.islam0871@gmail.com
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            // console.log(user);
            const result = { admin: user?.role === 'admin' }
            res.send(result)
        })
        // bookmark get
        app.get('/bookmarks', async (req, res) => {
            const cursor = bookMarkCollection.find();
            const result = await cursor.toArray();
            res.status(200).json(result);
        })
        // bookmarks get by email
        app.get('/mybookmarks', async (req, res) => {
            console.log(req.query);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const cursor = bookMarkCollection.find(query);
            const result = await cursor.toArray();
            res.status(200).json(result);
        })
        // bookmarks post
        app.post('/bookmarks', async (req, res) => {
            const mybookmarks = req.body;
            const result = await bookMarkCollection.insertOne(mybookmarks);
            res.send(result);
            console.log(mybookmarks);
        })
        // bookmarks delete
        app.delete('/bookmarks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookMarkCollection.deleteOne(query);
            res.send(result);
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB");
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