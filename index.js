const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
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
    const couponCollection = client.db("BuildiFyDb").collection("Coupons");
    const announcementCollection = client
      .db("BuildiFyDb")
      .collection("Announcement");
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

    app.get("/agreements", async (req, res) => {
      const result = await agreeMentCollection.find().toArray();
      res.send(result);
    });

    app.patch("/agreements/:id", async (req, res) => {
      const { id } = req.params;
      const { status, checkedDate } = req.body;
      try {
        const result = await agreeMentCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status, checkedDate } }
        );
        res.send(result);
      } catch (error) {
        console.error("Failed to update agreement status:", error);
        res.status(500).send("Failed to update agreement status");
      }
    });

    app.patch("/users/updates/:email", async (req, res) => {
      const email = req.params.email;
      const { role } = req.body;
      const updateDoc = {
        $set: {
          role,
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

    // Coupon API
    app.post("/coupons", async (req, res) => {
      const { couponCode, discountPercentage, couponDescription } = req.body;

      // Validate the inputs
      if (!couponCode || !discountPercentage || !couponDescription) {
        return res.status(400).send({ message: "All fields are required" });
      }

      const newCoupon = {
        couponCode,
        discountPercentage: parseFloat(discountPercentage), // Ensure it's a number
        couponDescription,
      };

      try {
        const result = await couponCollection.insertOne(newCoupon);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error inserting coupon:", error);
        res.status(500).send({ message: "Error inserting coupon" });
      }
    });

    app.get("/coupons", async (req, res) => {
      const result = await couponCollection.find().toArray();
      res.send(result);
    });

    //Make Announcement
    app.post("/announcement", async (req, res) => {
      const user = req.body;
      const result = await announcementCollection.insertOne(user);
      res.send(result);
    });

    //agreement

    app.get("/carts/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const result = await agreeMentCollection.find(query).toArray();
      res.send(result);
    });

    //Payment intent

    // app.post("/create-intent", async (req, res) => {
    //   const { price } = req.body;
    //   const amount = parseInt(price * 100); // Convert to cents

    //   // Check if the amount is above the minimum threshold
    //   const minimumChargeAmount = 50; // Example minimum amount in cents ($0.50)
    //   if (amount < minimumChargeAmount) {
    //     return res.status(400).send({
    //       message: `The amount must be at least $${minimumChargeAmount / 100}.`,
    //     });
    //   }

    //   try {
    //     const paymentIntent = await stripe.paymentIntents.create({
    //       amount,
    //       currency: "usd",
    //       payment_method_types: ["card"],
    //     });

    //     res.send({
    //       clientSecret: paymentIntent.client_secret,
    //     });
    //   } catch (error) {
    //     console.error("Error creating payment intent:", error);
    //     res.status(500).send({ message: "Error creating payment intent" });
    //   }
    // });

    app.post("/create-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100); // Convert to cents

      // Check if the amount is above the minimum threshold
      const minimumChargeAmount = 50; // Example minimum amount in cents ($0.50)
      if (amount < minimumChargeAmount) {
        return res.status(400).send({
          message: `The amount must be at least $${minimumChargeAmount / 100}.`,
        });
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send({ message: "Error creating payment intent" });
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
