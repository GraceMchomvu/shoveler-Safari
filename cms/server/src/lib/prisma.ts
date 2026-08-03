import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const schemaDir = path.join(cmsRoot, "prisma");

/**
 * Normalize DATABASE_URL so Prisma CLI and the running API always hit the same file.
 * Relative SQLite paths resolve from cms/prisma/ (same as Prisma schema location).
 */
function resolveDatabaseUrl() {
  const raw = (process.env.DATABASE_URL || "").trim();
  if (raw && !raw.startsWith("file:")) {
    return raw;
  }

  let filePath = "";
  if (raw.startsWith("file:")) {
    let p = raw.slice("file:".length);
    if (p.startsWith("file:")) p = p.slice("file:".length); // tolerate file:file:
    if (path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p)) {
      filePath = p;
    } else {
      // ./dev.db or dev.db → cms/prisma/dev.db
      // ./prisma/dev.db (legacy) → cms/prisma/dev.db
      const cleaned = p.replace(/^\.[\\/]/, "").replace(/\\/g, "/");
      if (cleaned.startsWith("prisma/")) {
        filePath = path.join(cmsRoot, cleaned);
      } else {
        filePath = path.join(schemaDir, cleaned);
      }
    }
  } else {
    const preferred = path.join(schemaDir, "cms.db");
    const legacy = path.join(schemaDir, "dev.db");
    filePath = !fs.existsSync(preferred) && fs.existsSync(legacy) ? legacy : preferred;
  }

  return `file:${path.resolve(filePath).replace(/\\/g, "/")}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();

export const prisma = new PrismaClient();
export { cmsRoot };

export function sqliteDbFilePath() {
  const url = process.env.DATABASE_URL || "";
  if (url.startsWith("file:")) return url.slice("file:".length).replace(/\//g, path.sep);
  return path.join(schemaDir, "cms.db");
}
