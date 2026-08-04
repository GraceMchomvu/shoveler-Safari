import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(cmsRoot, "client/dist");
const repoRoot = path.resolve(cmsRoot, "..");
const targets = [
  path.join(repoRoot, "admin"),
  path.join(repoRoot, "tripix-html", "admin"),
].filter((t, i, arr) => arr.indexOf(t) === i);

if (!fs.existsSync(dist)) {
  console.error("Missing client/dist — run the client build first.");
  process.exit(1);
}

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(dist, target, { recursive: true });
  console.log(`Admin UI copied to ${target}`);
}
