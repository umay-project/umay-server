const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();

const url =
  "mongodb://admin:adminpassword@localhost:27017/myDatabase?authSource=admin";
const client = new MongoClient(url);
const dbName = "myDatabase";

// Test Function
async function connectAndQuery() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");

    const db = client.db(dbName);

    const collection = db.collection("myCollection");
    await collection.insertOne({ name: "John Doe" });
    const documents = await collection.find({}).toArray();

    console.log("Documents:", documents);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    await client.close();
  }
}

connectAndQuery();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "audio/wav", limit: "10mb" })); // Handle raw audio data

app.get("/health-check", (req, res) => {
  res.status(200).send("Server is up and running!");
});

app.post("/upload-gps", (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).send("No audio data received.");
  }

  const timestamp = Date.now();
  const audioFileName = `gps_${timestamp}.json`;

  const savePath = path.join(__dirname, "uploads", audioFileName);

  if (!fs.existsSync(path.join(__dirname, "uploads"))) {
    fs.mkdirSync(path.join(__dirname, "uploads"));
  }

  const dataToWrite = JSON.stringify(req.body, null, 2);

  fs.writeFile(savePath, dataToWrite, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).send("Failed to save audio file.");
    }

    console.log(`Audio file saved: ${audioFileName}`);
    res.send({
      message: "Audio file saved successfully!",
      filename: audioFileName,
    });
  });
});

app.post("/upload-audio", (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).send("No audio data received.");
  }

  const timestamp = Date.now();
  const audioFileName = `audio_${timestamp}.wav`;

  const savePath = path.join(__dirname, "uploads", audioFileName);

  if (!fs.existsSync(path.join(__dirname, "uploads"))) {
    fs.mkdirSync(path.join(__dirname, "uploads"));
  }

  fs.writeFile(savePath, req.body, (err) => {
    if (err) {
      console.error("Error saving file:", err);
      return res.status(500).send("Failed to save audio file.");
    }

    console.log(`Audio file saved: ${audioFileName}`);
    res.send({
      message: "Audio file saved successfully!",
      filename: audioFileName,
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
