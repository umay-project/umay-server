const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const { spawn } = require("child_process");

const app = express();

const url =
  "mongodb://admin:adminpassword@localhost:27017/myDatabase?authSource=admin";
const client = new MongoClient(url);
const dbName = "myDatabase";

let db;

async function initializeDbConnection() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

async function processAudioFile(audioFileName) {
  const scriptPath = "./ai_model/main.py";
  const pythonProcess = spawn("python3", [scriptPath, audioFileName]);
  let output = "";
  let errorOutput = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  await new Promise((resolve) => {
    pythonProcess.on("close", (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code !== 0) {
        console.error(`Python script error: ${errorOutput}`);
      }
      resolve();
    });
  });

  if (output.trim() == "Human Voice") {
    try {
      let timestamp = audioFileName.split("_")[1].split(".")[0];
      let limit = timestamp - 30;

      let gpsData = null;
      while (timestamp > limit) {
        const gpsFileName = `gps_${timestamp}.json`;
        const gpsFilePath = "./uploads/" + gpsFileName;

        if (fs.existsSync(gpsFilePath)) {
          console.log(`Found GPS file: ${gpsFileName}`);
          gpsData = JSON.parse(fs.readFileSync(gpsFilePath, "utf-8"));
          break;
        }
        timestamp--;
      }

      if (!gpsData) {
        console.log("No GPS data found for the audio file.");
        return;
      }

      const collection = db.collection("myCollection");
      await collection.insertOne({
        timestamp,
        audioFileName,
        longitude: gpsData.longitude,
        latitude: gpsData.latitude,
      });
      console.log("inserted.");
      console.log("gpsData: ", gpsData);
    } catch (err) {
      console.error("Error: ", err);
    }
  } else {
    console.log("Not a human voice");
  }
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "audio/wav", limit: "10mb" }));

app.get("/health-check", (req, res) => {
  res.status(200).send("Server is up and running!");
});

app.get("/get-data", async (req, res) => {
  const collection = db.collection("myCollection");
  const entries = await collection.find({}).toArray();
  res.status(200).send(entries);
});

app.post("/upload-gps", (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).send("No audio data received.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
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

  const timestamp = Math.floor(Date.now() / 1000);
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

    processAudioFile(audioFileName);

    res.send({
      message: "Audio file saved successfully!",
      filename: audioFileName,
    });
  });
});

async function contr() {
  const collection = db.collection("myCollection");
  const entries = await collection.find({}).toArray();
  console.log(entries);
}

async function main() {
  await initializeDbConnection();
  await processAudioFile("audio_1732047940819.wav");
  await contr();
}

main();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
