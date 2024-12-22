const path = require("path");
const fs = require("fs");
const dbService = require("./dbService");
const { spawn } = require("child_process");

exports.saveAudio = async (audioData, senderId) => {
  const timestamp = Date.now();
  const audioFileName = `${senderId}_audio_${Math.floor(timestamp / 1000)}.wav`;
  const savePath = path.join("./uploaded-audio", audioFileName);

  if (!fs.existsSync(path.dirname(savePath))) {
    fs.mkdirSync(path.dirname(savePath));
  }

  fs.writeFileSync(savePath, audioData);

  const output = await processAudioFile(audioFileName, senderId, timestamp);

  if (output == true) {
    return { message: "Audio file has human voice in it." };
  }

  try {
    fs.unlinkSync(savePath);
    console.log(`Deleted file: ${audioFileName}`);
  } catch (err) {
    console.error(`Error deleting file: ${err.message}`);
  }
  return { message: "Audio file does not have human voice in it." };
};

exports.getFilteredRecords = async ({
  minLat,
  maxLat,
  minLong,
  maxLong,
  minTime,
  maxTime,
}) => {
  if (minTime && maxTime) {
    return dbService.getFilteredRecordsWithTime(
      minLat,
      maxLat,
      minLong,
      maxLong,
      minTime,
      maxTime
    );
  }
  return dbService.getFilteredRecords(minLat, maxLat, minLong, maxLong);
};

exports.getAudio = async (fileName) => {
  try {
    if (!fileName || fileName.includes("..") || path.isAbsolute(fileName)) {
      throw new Error("Invalid file name.");
    }

    const filePath = path.join("./uploaded-audio", fileName + ".wav");

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found.");
    }

    const audioBuffer = fs.readFileSync(filePath);
    return audioBuffer;
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

exports.tagEntry = async (fileName, tag) => {
  if (!fileName || !tag) {
    throw new Error("Invalid input.");
  }

  return dbService.tagEntry(fileName, tag);
};

exports.deleteEntry = async (fileName) => {
  if (!fileName) {
    throw new Error("Invalid input.");
  }

  return dbService.deleteEntry(fileName);
};

const processAudioFile = async (audioFileName, senderId, timestampDB) => {
  const scriptPath = "./ai_model/main.py";
  const pythonProcess = spawn("python3", [
    scriptPath,
    `./uploaded-audio/${audioFileName}`,
  ]);

  let output = "";
  let errorOutput = "";
  let humanVoice = false;

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  await new Promise((resolve) => {
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python script error: ${errorOutput}`);
      }
      resolve();
    });
  });

  output = output.split(":")[output.split(":").length - 1];

  if (output.trim() == "Human Voice") {
    humanVoice = true;
    try {
      console.log("Human voice detected for: " + audioFileName);
      let timestamp = audioFileName.split("_")[2].split(".")[0];
      let limit = timestamp - 500;

      let gpsData = null;
      while (timestamp > limit) {
        // const gpsFileName = `${senderId}_gps_${timestamp}.json`;
        const gpsFileName = `1_gps_1734536017.json`;
        const gpsFilePath = "./uploaded-gps/" + gpsFileName;

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

      dbService.insertRecord({
        timestamp: timestampDB,
        audioFileName,
        longitude: parseFloat(gpsData.longitude),
        latitude: parseFloat(gpsData.latitude),
      });
    } catch (err) {
      console.error("Error: ", err);
    }
  } else {
    console.log("Not a human voice: " + audioFileName);
  }

  return humanVoice;
};
