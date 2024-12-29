const audioService = require("../services/audioService");
const dbService = require("../services/dbService");

exports.uploadAudio = async (req, res) => {
  const senderId = req.query.id;

  if (!senderId) {
    console.log("No sender ID provided.");
    return res.status(400).send("No sender ID provided.");
  }

  if (!req.body || req.body.length === 0) {
    return res.status(400).send("No audio data received.");
  }

  try {
    const result = await audioService.saveAudio(req.body, senderId);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save audio file.");
  }
};

exports.getRecords = async (req, res) => {
  try {
    const records = await audioService.getFilteredRecords(req.query);
    res.status(200).send(records);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve records.");
  }
};

exports.getData = async (req, res) => {
  try {
    const data = await dbService.getAllRecords();
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve data.");
  }
};

exports.getAudio = async (req, res) => {
  const { fileName } = req.query;

  if (!fileName) {
    console.log("No file name provided.");
    return res.status(400).send("No file name provided.");
  }

  try {
    const audio = await audioService.getAudio(fileName);
    res.status(200).send(audio);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve audio file.");
  }
};

exports.tagEntry = async (req, res) => {
  const { fileName, tag } = req.query;

  if (!fileName || !tag) {
    console.log("No file name or tag provided.");
    return res.status(400).send("No file name or tag provided.");
  }

  try {
    const result = await audioService.tagEntry(fileName, tag);
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to tag entry.");
  }
};

exports.deleteEntry = async (req, res) => {
  const { fileName } = req.query;

  if (!fileName) {
    console.log("No file name provided.");
    return res.status(400).send("No file name provided.");
  }

  try {
    const result = await audioService.deleteEntry(fileName);
    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete entry.");
  }
};

exports.getFalseTaggeds = async (req, res) => {
  try {
    const records = await dbService.getFalseTaggeds();
    res.status(200).send(records);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to retrieve false tagged records.");
  }
};
