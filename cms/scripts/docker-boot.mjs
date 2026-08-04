#!/usr/bin/env node
import { spawnSync } from "child_process";
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

  // Never mint an ephemeral secret in production — it invalidates every login after each Render sleep/restart.
  console.error(
    "[fatal] JWT_SECRET must be set to a fixed value (≥32 chars) on Render. Refusing to start with a random secret."
  );
  process.exit(1);
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
  console.error(
    "[fatal] DATABASE_URL must be a Postgres URL (Neon). SQLite on Render free resets on every sleep."
  );
  process.exit(1);
}

console.log("[boot] Preparing Postgres database...");
run("npx", ["prisma", "db", "push", "--schema=prisma/schema.prisma", "--skip-generate"]);

const oneShotMarker = path.join(cmsRoot, "scripts", ".one-shot-admin-reset");
const oneShotReset = fs.existsSync(oneShotMarker);
if (oneShotReset) {
  process.env.FORCE_ADMIN_RESET = "1";
  if (!process.env.SEED_ADMIN_PASSWORD) process.env.SEED_ADMIN_PASSWORD = "AdminPass123";
  if (!process.env.SEED_ADMIN_EMAIL) process.env.SEED_ADMIN_EMAIL = "victorkiungai@gmail.com";
  console.log("[boot] One-shot admin reset marker found — will reset admin password on this database");
}

const prisma = new PrismaClient();
const adminCount = await prisma.user.count({
  where: { OR: [{ username: "admin" }, { role: "SUPER_ADMIN" }] },
});
const forceReset =
  process.env.FORCE_ADMIN_RESET === "1" || process.env.FORCE_ADMIN_RESET === "true";

if (adminCount === 0) {
  console.log("[boot] No admin yet — seeding once...");
  run("npx", ["tsx", "prisma/seed.ts"]);
  run("node", ["scripts/fix-admin-login.mjs"]);
} else if (forceReset) {
  console.log("[boot] FORCE_ADMIN_RESET — resetting admin password on this database...");
  run("node", ["scripts/fix-admin-login.mjs"]);
} else {
  console.log(`[boot] Admin exists (${adminCount}) — password left unchanged`);
}

if (oneShotReset) {
  try {
    fs.unlinkSync(oneShotMarker);
    console.log("[boot] Removed one-shot admin reset marker from this instance");
  } catch {
    /* image may be read-only in some hosts — next commit should delete the file */
  }
}
await prisma.$disconnect();

fs.mkdirSync(path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads"), { recursive: true });
ensureJwtSecret();

const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
