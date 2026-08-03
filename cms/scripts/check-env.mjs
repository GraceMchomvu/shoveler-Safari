import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env");
if (!fs.existsSync(envPath)) {
  console.log("No .env file — copy .env.example to .env");
  process.exit(1);
}
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return [l.slice(0, i).trim(), v];
    })
);

const secret = env.JWT_SECRET || "";
console.log("NODE_ENV:", env.NODE_ENV || "(unset → development)");
console.log("DATABASE_URL:", env.DATABASE_URL ? "set" : "missing");
console.log(
  "JWT_SECRET:",
  !secret
    ? "MISSING"
    : secret === "change-me-in-production" || secret === "dev-secret"
      ? "PLACEHOLDER — replace before production"
      : `ok (${secret.length} chars)`
);
console.log("SITE_ORIGIN:", env.SITE_ORIGIN || "(unset)");
if (secret.length < 32) console.log("WARN: JWT_SECRET should be 32+ characters for production");
