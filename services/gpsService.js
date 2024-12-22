const path = require("path");
const fs = require("fs");

exports.saveGPS = async (gpsData, senderId) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const gpsFileName = `${senderId}_gps_${timestamp}.json`;
  const savePath = path.join("./uploaded-gps", gpsFileName);

  if (!fs.existsSync(path.dirname(savePath))) {
    fs.mkdirSync(path.dirname(savePath));
  }

  fs.writeFileSync(savePath, JSON.stringify(gpsData, null, 2));
  return { message: "GPS data saved.", filename: gpsFileName };
};
