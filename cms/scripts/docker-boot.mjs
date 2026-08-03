#!/usr/bin/env node
import { spawnSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(cmsRoot);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

/** Ensure production has a usable JWT secret (Render env or generated fallback). */
function ensureJwtSecret() {
  const raw = (process.env.JWT_SECRET || "").trim();
  const bad =
    !raw ||
    raw.length < 32 ||
    raw === "change-me-in-production" ||
    raw === "dev-secret" ||
    raw === "shoveler-cms-dev-secret-change-in-production";

  if (!bad) {
    console.log(`[boot] JWT_SECRET ok (length ${raw.length})`);
    return;
  }

  const generated = crypto.randomBytes(48).toString("hex");
  process.env.JWT_SECRET = generated;
  console.warn(
    `[boot] JWT_SECRET missing/weak in environment (length ${raw.length}). ` +
      "Using a generated secret for this boot. Set JWT_SECRET in Render → Environment to keep logins across restarts."
  );
}

console.log("[boot] Preparing database...");
run("npx", ["prisma", "db", "push", "--schema=prisma/schema.prisma", "--skip-generate"]);

const prisma = new PrismaClient();
const userCount = await prisma.user.count();
await prisma.$disconnect();

if (userCount === 0) {
  console.log("[boot] Empty DB — seeding...");
  run("npx", ["tsx", "prisma/seed.ts"]);
} else {
  console.log(`[boot] DB has ${userCount} user(s)`);
}

// Always reset known admin login (Render free disk can leave broken/random seed passwords)
console.log("[boot] Ensuring admin login (admin / SEED_ADMIN_PASSWORD)...");
run("node", ["scripts/fix-admin-login.mjs"]);

const uploadDir = path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });

ensureJwtSecret();

const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
