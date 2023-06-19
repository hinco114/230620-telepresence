const ip = "113.125.196.230";
const redisAddress = "redis://elasticache-cluster-demo.2lqmsy.0001.apn2.cache.amazonaws.com:6379";

const http = require("http");
const os = require("os");


// ---------------------- HTTP ----------------------
http.createServer((req, res) => {
  res.write(`Hello World ${os.hostname()}`);
  res.end();
}).listen(3000).on("listening", () => {
  console.log("Server started on port 3000");
});


// ---------------------- Mongo ----------------------

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb://${ip}:30000`;
const client = new MongoClient(uri,  {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    console.log("Connecting to the db...")
    const conn = await client.connect();
    console.log("Connected successfully to server");
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    console.log(client);
  } catch (e) {
    console.log("Error connecting to the db...")
    console.log(e);
  }
}
run().catch(console.dir);

// ---------------------- Redis ----------------------
const { createClient } = require("redis");

const redisClient = createClient({
  url: redisAddress,
});

redisClient.on("error", err => console.log("Redis Client Error", err));

await redisClient.connect();

await redisClient.set("key", "value");
const value = await redisClient.get("key");
console.log(value);
