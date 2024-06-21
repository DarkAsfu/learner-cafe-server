const express = require('express');
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: '50mb' })); 

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
        const bookCollection = client.db("learnerCafeDB").collection("books");
        const queueDocCollection = client.db("learnerCafeDB").collection("queueDoc");
        const blogsCollection = client.db("learnerCafeDB").collection("blogs");

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
        // get book
        app.get('/books', async (req, res) => {
            const cursor = bookCollection.find().sort({_id: -1});
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/queueDoc', async (req, res) => {
            const cursor = queueDocCollection.find();
            const result = await cursor.toArray();
            res.send(result);
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
        // subject wise data http://localhost:5000/documentSearchBySubName/algorithm
        app.get('/documentSearchBySubName/:text', async (req, res) => {
            try {
                const searchText = req.params.text;
                const searchResult = await lectureCollection.find({
                    $or: [
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
                    const result = await lectureCollection.find({ category }).sort({ _id: -1 }).toArray();
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
        })
        // book post
        app.post('/books', async (req, res) => {
            const book = req.body;
            const result = await bookCollection.insertOne(book);
            res.send(result);
        })
        app.post('/queueDoc', async (req, res) => {
            const doc = req.body;
            const result = await queueDocCollection.insertOne(doc);
            res.send(result);
        })
        // delete lecture
        app.delete('/lectures/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await lectureCollection.deleteOne(query);
            res.send(result);
        })
        app.delete('/queueDoc/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await queueDocCollection.deleteOne(query);
            res.send(result);
        })
        // user api
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().sort({ _id: -1 }).toArray();
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
        // bookmarks post api
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
        // Monthly user registration count
        app.get('/monthlyUserRegistration', async (req, res) => {
            try {
                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
        
                const users = await userCollection.find().toArray();
        
                // Extract and count monthly registrations
                const monthlyCounts = users.reduce((acc, user) => {
                    const registrationDate = new Date(user.date);
                    const year = registrationDate.getFullYear();
                    const month = registrationDate.getMonth(); // Months are 0-based in JavaScript
        
                    const key = `${year}-${month}`;
                    acc[key] = (acc[key] || 0) + 1;
        
                    return acc;
                }, {});
        
                // Convert the counts to an array of objects with month names
                const result = Object.entries(monthlyCounts).map(([key, count]) => {
                    const [year, month] = key.split('-');
                    return { year: parseInt(year), month: monthNames[parseInt(month)], count };
                });
        
                // Sort the result by year and month
                result.sort((a, b) => a.year - b.year || monthNames.indexOf(a.month) - monthNames.indexOf(b.month));
        
                res.status(200).json(result);
            } catch (error) {
                console.error("Error fetching monthly user registration count:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        // Update user data
        app.patch('/user/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedUserInfo = req.body;
            console.log(updatedUserInfo);
            const document = {
                $set: {
                    name: updatedUserInfo.name,
                    github: updatedUserInfo.github,
                    facebook: updatedUserInfo.facebook,
                    linkedin: updatedUserInfo.linkedin,
                }
            }
            const result = await userCollection.updateOne(filter, document, options);
            res.send(result);
        });

        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
            console.log(blog);
        });
        app.get('/blogs', async (req, res) => {
            const cursor = blogsCollection.find();
            const result = await cursor.toArray();
            res.status(200).json(result);
        })
        app.get('/blogs/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await blogsCollection.findOne(query);

                if (result) {
                    res.status(200).json(result);
                } else {
                    res.status(404).send("blog not found");
                }
            } catch (error) {
                console.error("Error fetching blogs:", error);
                res.status(500).send("Internal Server Error");
            }
        });
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