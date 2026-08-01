import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(cmsRoot, "client/dist");
const target = path.resolve(cmsRoot, "../tripix-html/admin");

if (!fs.existsSync(dist)) {
  console.error("Missing client/dist — run the client build first.");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(dist, target, { recursive: true });
console.log(`Admin UI copied to ${target}`);
