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
    `[boot] JWT_SECRET missing/weak — generated for this boot. Set JWT_SECRET on Render to keep sessions stable.`
  );
}

console.log("[boot] Preparing database...");
run("npx", ["prisma", "db", "push", "--schema=prisma/schema.prisma", "--skip-generate", "--accept-data-loss"]);

const prisma = new PrismaClient();
const adminCount = await prisma.user.count({
  where: { OR: [{ username: "admin" }, { role: "SUPER_ADMIN" }] },
});

if (adminCount === 0) {
  console.log("[boot] No admin yet — seeding + creating admin once...");
  run("npx", ["tsx", "prisma/seed.ts"]);
  run("node", ["scripts/fix-admin-login.mjs"]);
} else {
  console.log(`[boot] Admin exists (${adminCount}) — NOT resetting password`);
}
await prisma.$disconnect();

const uploadDir = path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads");
fs.mkdirSync(uploadDir, { recursive: true });

ensureJwtSecret();

const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
