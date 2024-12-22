const gpsService = require("../services/gpsService");

exports.uploadGPS = async (req, res) => {
  const senderId = req.query.id;

  if (!senderId) {
    return res.status(400).send("No sender ID provided.");
  }

  if (!req.body || req.body.length === 0) {
    return res.status(400).send("No GPS data received.");
  }

  try {
    const result = await gpsService.saveGPS(req.body, senderId);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save GPS file.");
  }
};
