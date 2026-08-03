#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(cmsRoot);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, ...opts });
  if (r.status !== 0) process.exit(r.status || 1);
}

console.log("[boot] Preparing database...");
run("npx", ["prisma", "db", "push", "--schema=prisma/schema.prisma", "--skip-generate"]);

const prisma = new PrismaClient();
const userCount = await prisma.user.count();
await prisma.$disconnect();

if (userCount === 0) {
  console.log("[boot] Empty DB — seeding admin...");
  run("npx", ["tsx", "prisma/seed.ts"]);
  run("node", ["scripts/fix-admin-login.mjs"]);
} else {
  console.log(`[boot] DB has ${userCount} user(s) — skipping seed`);
}

const uploadDir = path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
