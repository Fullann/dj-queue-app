const redis = require("redis");

let redisClient = null;

if (process.env.NODE_ENV === "production") {
  const redisConfig = {
    password: process.env.REDIS_PASSWORD || undefined
  };

  if (process.env.REDIS_SOCKET_PATH) {
    redisConfig.socket = {
      path: process.env.REDIS_SOCKET_PATH
    };
  } else if (process.env.REDIS_URL) {
    redisConfig.url = process.env.REDIS_URL;
  } else {
    redisConfig.socket = {
      host: '127.0.0.1',
      port: 6379
    };
  }

  redisClient = redis.createClient(redisConfig);

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis connecté");
  });
} else {
  console.log("Redis non configuré (mode dev)");
}

async function connectRedis() {
  if (redisClient) {
    try {
      await redisClient.connect();
      console.log("Connexion Redis établie");
    } catch (err) {
      console.error("Impossible de se connecter à Redis:", err);
      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      }
    }
  }
}

module.exports = { redisClient, connectRedis };
