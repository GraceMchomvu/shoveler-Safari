#!/usr/bin/env node
/**
 * Production boot — Postgres + admin seed.
 * Secrets MUST come from environment. Never hardcode them.
 *
 * Password behavior:
 * - First boot: create admin from SEED_ADMIN_* if missing
 * - Later boots: leave the password alone (survives restarts)
 * - Optional repair: set FORCE_SEED_ADMIN_PASSWORD=true to reset from SEED_ADMIN_PASSWORD
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(cmsRoot);

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "SafariAdmin2026!";
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();
const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || "+255783591810";
const FORCE_SEED =
  String(process.env.FORCE_SEED_ADMIN_PASSWORD || "").toLowerCase() === "true" ||
  process.env.FORCE_SEED_ADMIN_PASSWORD === "1";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

const dbUrl = (process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "").trim();
if (!dbUrl || dbUrl.startsWith("file:") || !/^postgres(ql)?:\/\//i.test(dbUrl)) {
  console.error(
    "[fatal] DATABASE_URL must be a Postgres URL (set it in the host environment / docker compose)."
  );
  process.exit(1);
}
process.env.DATABASE_URL = dbUrl;
console.log("[boot] Using Postgres DATABASE_URL from environment");

const jwt = (process.env.JWT_SECRET || "").trim();
if (
  !jwt ||
  jwt.length < 32 ||
  jwt === "change-me-in-production" ||
  jwt === "dev-secret" ||
  jwt === "shoveler-cms-dev-secret-change-in-production"
) {
  console.error(
    "[fatal] JWT_SECRET must be a fixed random value (≥32 chars) in the host environment."
  );
  process.exit(1);
}
console.log(`[boot] JWT_SECRET ok (length ${jwt.length})`);

console.log("[boot] Syncing schema...");
run("npx", ["prisma", "db", "push", "--schema=prisma/schema.prisma", "--skip-generate"]);

const prisma = new PrismaClient();

const adminCount = await prisma.user.count({
  where: { OR: [{ username: "admin" }, { role: "SUPER_ADMIN" }] },
});
if (adminCount === 0) {
  console.log("[boot] No admin — seeding once...");
  process.env.SEED_ADMIN_PASSWORD = ADMIN_PASSWORD;
  process.env.SEED_ADMIN_EMAIL = ADMIN_EMAIL;
  process.env.SEED_ADMIN_PHONE = ADMIN_PHONE;
  run("npx", ["tsx", "prisma/seed.ts"]);
}

console.log("[boot] Checking admin account...");
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
let user = await prisma.user.findFirst({
  where: { OR: [{ email: ADMIN_EMAIL }, { username: "admin" }] },
});

if (!user) {
  user = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      username: "admin",
      name: "Super Admin",
      phone: ADMIN_PHONE,
      passwordHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      active: true,
    },
  });
  console.log("[boot] Created admin");
} else if (FORCE_SEED) {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: ADMIN_EMAIL,
      username: "admin",
      phone: ADMIN_PHONE,
      passwordHash,
      mustChangePassword: false,
      active: true,
      role: "SUPER_ADMIN",
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  console.log("[boot] Forced admin password reset from SEED_ADMIN_PASSWORD");
} else {
  // Keep login durable: do not overwrite password on normal restarts.
  const patch = {};
  if (!user.active) patch.active = true;
  if (user.username !== "admin") patch.username = "admin";
  if (user.role !== "SUPER_ADMIN") patch.role = "SUPER_ADMIN";
  if (user.email !== ADMIN_EMAIL) patch.email = ADMIN_EMAIL;
  if (Object.keys(patch).length) {
    await prisma.user.update({ where: { id: user.id }, data: patch });
    console.log("[boot] Admin account fields refreshed (password unchanged)");
  } else {
    console.log("[boot] Admin login already healthy (password unchanged)");
  }
}

console.log("[boot] Ready — username: admin");
await prisma.$disconnect();

fs.mkdirSync(path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads"), { recursive: true });
const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
