#!/usr/bin/env node
/**
 * Vérifie la connexion MySQL et la présence des tables / colonnes attendues.
 *
 * Variables d'environnement (comme l'app, via dotenv à la racine si présent) :
 *   DB_HOST, DB_PORT (défaut 3306), DB_USER, DB_PASSWORD, DB_NAME
 *
 * Codes de sortie : 0 = OK (éventuels warnings), 1 = erreur bloquante
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mysql = require("mysql2/promise");

const REQUIRED_TABLES = [
  "djs",
  "events",
  "requests",
  "votes",
  "rate_limits",
  "spotify_tokens",
];

/** Tables ajoutées par migrations — l'app peut tourner sans certaines sur anciennes bases */
const OPTIONAL_TABLES = ["user_bans"];

/**
 * Colonnes optionnelles : si absentes, warning + indice migration
 */
const OPTIONAL_COLUMNS = [
  { table: "events", column: "repeat_cooldown_minutes", migration: "db/migration_repeat_cooldown.sql" },
  { table: "events", column: "starts_at", migration: "db/migration_starts_at.sql" },
  { table: "events", column: "mod_token", migration: "db/migration_mod_token.sql" },
  { table: "events", column: "donation_enabled", migration: "db/migration_donation.sql" },
  { table: "requests", column: "client_id", migration: "db/migration_request_client_id.sql" },
  { table: "djs", column: "sp_access_token", migration: "db/migration_spotify_tokens_dj.sql" },
];

async function main() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (!user || database === undefined || database === "") {
    console.error(
      "Variables DB_USER et DB_NAME requises (et DB_PASSWORD si le compte en a une).",
    );
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port,
      user,
      password: password ?? "",
      database,
      connectTimeout: 15000,
    });
  } catch (err) {
    console.error("[ERREUR] Connexion MySQL impossible :", err.message);
    process.exit(1);
  }

  console.log(`[OK] Connecté à ${host}:${port} / base « ${database} »`);

  try {
    const [rows] = await conn.query("SELECT 1 AS ok");
    if (!rows?.[0]?.ok) {
      console.error("[ERREUR] SELECT 1 inattendu");
      process.exit(1);
    }
  } catch (err) {
    console.error("[ERREUR] Requête test :", err.message);
    process.exit(1);
  }

  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
    [database],
  );
  const tableSet = new Set(tables.map((t) => t.TABLE_NAME));

  let failed = false;

  for (const t of REQUIRED_TABLES) {
    if (!tableSet.has(t)) {
      console.error(`[ERREUR] Table manquante : ${t}`);
      failed = true;
    } else {
      console.log(`[OK] Table ${t}`);
    }
  }

  for (const t of OPTIONAL_TABLES) {
    if (!tableSet.has(t)) {
      console.warn(`[WARN] Table optionnelle absente : ${t} (bans / fonctionnalités associées)`);
    } else {
      console.log(`[OK] Table ${t}`);
    }
  }

  if (failed) {
    await conn.end();
    process.exit(1);
  }

  for (const { table, column, migration } of OPTIONAL_COLUMNS) {
    if (!tableSet.has(table)) continue;
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [database, table, column],
    );
    if (cols.length === 0) {
      console.warn(`[WARN] Colonne absente : ${table}.${column} — appliquer ${migration}`);
    } else {
      console.log(`[OK] Colonne ${table}.${column}`);
    }
  }

  await conn.end();
  console.log("\nContrôle schéma terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
