const ENV_NODE_IP = process.env.NODE_IP;
const ENV_REDIS_ENDPOINT = process.env.REDIS_ENDPOINT;

const http = require("http");
const os = require("os");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { createClient } = require("redis");


// ---------------------- HTTP ----------------------
let isMongoConnected = false;
let isRedisConnected = false;
http.createServer((req, res) => {
  res.write(`Hello World ${os.hostname()} / MongoDB: ${isMongoConnected} / Redis: ${isRedisConnected}`);
  res.end();
}).listen(3000).on("listening", () => {
  console.log("Server started on port 3000");
});


// ---------------------- Mongo ----------------------
if (ENV_NODE_IP) {
  const uri = `mongodb://${ENV_NODE_IP}:30000`;
  const client = new MongoClient(uri, {
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
      isMongoConnected = true;
    } catch (e) {
      console.log("Error connecting to the db...")
      console.log(e);
    }
  }

  run().catch(console.dir);
}

// ---------------------- Redis ----------------------
if (ENV_REDIS_ENDPOINT) {
  async function runRedis() {
    try {
      console.log("Connecting to Redis...")
      const redisClient = createClient({
        url: ENV_REDIS_ENDPOINT,
      });

      redisClient.on("error", err => console.log("Redis Client Error", err));

      await redisClient.connect();
      console.log("Connected to Redis");
      isRedisConnected = true;
    } catch (e) {
      console.log("Error connecting to Redis...")
      console.log(e);
    }
  }

  runRedis().catch(console.dir);
}
