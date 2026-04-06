#!/usr/bin/env node
/**
 * Vérifie la syntaxe de tous les fichiers .js du projet (hors node_modules).
 * Utilisé par la CI GitHub avant déploiement.
 */
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function collectJsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const full = path.join(dir, name);
    const st   = fs.statSync(full);
    if (st.isDirectory()) collectJsFiles(full, acc);
    else if (name.endsWith(".js")) acc.push(full);
  }
  return acc;
}

const files = [path.join(root, "app.js"), ...collectJsFiles(path.join(root, "src"))];

let errors = 0;
for (const file of files) {
  try {
    execSync(`node --check "${file}"`, { stdio: "pipe" });
    console.log("OK", path.relative(root, file));
  } catch {
    console.error("FAIL", path.relative(root, file));
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} fichier(s) avec erreur de syntaxe.`);
  process.exit(1);
}

console.log(`\nSyntaxe OK — ${files.length} fichier(s).`);
