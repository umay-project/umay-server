const { MongoClient } = require("mongodb");

const url =
  "mongodb://admin:adminpassword@localhost:27017/myDatabase?authSource=admin";
const client = new MongoClient(url);
const dbName = "myDatabase";

async function migrate() {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection("myCollection");

  const cursor = collection.find({});
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          latitude: parseFloat(doc.latitude),
          longitude: parseFloat(doc.longitude),
        },
      }
    );
  }

  console.log("Migration completed.");
  client.close();
}

migrate();
