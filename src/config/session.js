const session = require("express-session");

// Validation du secret
if (!process.env.SESSION_SECRET) {
  console.error("❌ ERREUR: SESSION_SECRET doit être défini dans .env");
  process.exit(1);
}

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: "djqueue.sid",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
};

// Redis uniquement en production
if (process.env.NODE_ENV === "production") {
  try {
    const RedisStore = require("connect-redis").default;
    const { redisClient } = require("./redis");

    if (redisClient) {
      sessionConfig.store = new RedisStore({
        client: redisClient,
        prefix: "djqueue:sess:",
        ttl: 7 * 24 * 60 * 60,
      });
    } else {
      console.warn(
        "⚠️  Redis non disponible, utilisation du store mémoire pour les sessions",
      );
    }
  } catch (error) {
    console.error(
      "⚠️  Erreur config Redis, utilisation du store mémoire:",
      error.message,
    );
  }
}
module.exports = sessionConfig;
