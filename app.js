const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initializeDbConnection } = require("./services/dbService");

const audioController = require("./controllers/audioController");
const gpsController = require("./controllers/gpsController");
const healthController = require("./controllers/healthController");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "audio/wav", limit: "10mb" }));

app.get("/health-check", healthController.healthCheck);
app.post("/upload-audio", audioController.uploadAudio);
app.post("/upload-gps", gpsController.uploadGPS);
app.get("/get-records", audioController.getRecords);
app.get("/get-false-taggeds", audioController.getFalseTaggeds);
app.get("/get-data", audioController.getData);
app.get("/get-audio", audioController.getAudio);
app.get("/tag-entry", audioController.tagEntry);
app.get("/delete-entry", audioController.deleteEntry);

const PORT = process.env.PORT || 3000;

initializeDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
