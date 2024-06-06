const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c9pict7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("BuildiFyDb").collection("Users");
    const apartMentCollection = client.db("BuildiFyDb").collection("Apatments");
    const agreeMentCollection = client
      .db("BuildiFyDb")
      .collection("Agreements");

    //User Api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User Already Exist" });
      }
      const result = await userCollection.insertOne(user);
      res.json(result);
    });

    //agreement api

    app.post("/agreements", async (req, res) => {
      const user = req.body;
      const result = await agreeMentCollection.insertOne(user);
      res.send(result);
    });

    //get user info by email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    //user role updated

    app.patch("/users/update/:email", async (req, res) => {
      const email = req.params.email;
      const updateDoc = {
        $set: {
          role: "user",
        },
      };

      try {
        const result = await userCollection.updateOne({ email }, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Failed to update user role:", error);
        res.status(500).send("Failed to update user role");
      }
    });

    //get user info by email
    app.get("/members", async (req, res) => {
      const query = { role: "member" };
      const user = await userCollection.find(query).toArray();
      res.send(user);
    });

    //ApartMent Api
    app.get("/apartments", async (req, res) => {
      try {
        // console.log("Received request:", req.query); // Log the received request
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 6;
        // console.log("Page:", page, "Size:", size); // Log the page and size
        const skip = (page - 1) * size;
        const apartments = await apartMentCollection
          .find()
          .skip(skip)
          .limit(size)
          .toArray();
        // console.log("Sending apartments:", apartments); // Log the data being sent
        res.send(apartments);
      } catch (error) {
        console.error("Error fetching apartments:", error);
        res.status(500).send("Server error");
      }
    });

    app.get("/apartmentsCount", async (req, res) => {
      try {
        const count = await apartMentCollection.estimatedDocumentCount();
        res.send({ count });
      } catch (error) {
        console.error("Error fetching apartments count:", error);
        res.status(500).send("Server error");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("BuildiFy Server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
