const { MongoClient } = require("mongodb");

const url =
  "mongodb://admin:adminpassword@localhost:27017/myDatabase?authSource=admin";
const client = new MongoClient(url);
const dbName = "myDatabase";
let db;

exports.initializeDbConnection = async () => {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    db = client.db(dbName);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

exports.insertRecord = async (record) => {
  const collection = db.collection("myCollection");
  await collection.insertOne(record);
};

exports.getAllRecords = async () => {
  const collection = db.collection("myCollection");
  return await collection.find({}).toArray();
};

exports.getFilteredRecords = async (minLat, maxLat, minLong, maxLong) => {
  const collection = db.collection("myCollection");

  const result = await collection
    .find({
      latitude: { $gte: parseFloat(minLat), $lte: parseFloat(maxLat) },
      longitude: { $gte: parseFloat(minLong), $lte: parseFloat(maxLong) },
    })
    .toArray();

  return result;
};
