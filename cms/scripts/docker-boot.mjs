#!/usr/bin/env node
/**
 * Production boot — boring & stable auth:
 * - Always use Neon Postgres (never Render ephemeral disk / SQLite)
 * - Fixed JWT secret fallback
 * - Ensure admin login works every start
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(cmsRoot);

const NEON_DATABASE_URL =
  "postgresql://neondb_owner:npg_B8MQlfP2vSwc@ep-cold-fog-ay7d1318-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
const FIXED_JWT_SECRET =
  "16721ed6c057db74221bf93025f647bb655c037073c64724dc43edb998f747f98c465e977e05c302f99f422b69205f8f";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "SafariAdmin2026!";
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();
const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || "+255783591810";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

// ALWAYS Neon — ignore misconfigured / ephemeral Render DATABASE_URL
process.env.DATABASE_URL = (process.env.NEON_DATABASE_URL || NEON_DATABASE_URL).trim();
console.log("[boot] Using durable Neon Postgres");

const jwt = (process.env.JWT_SECRET || "").trim();
if (!jwt || jwt.length < 32 || jwt === "change-me-in-production" || jwt === "dev-secret") {
  process.env.JWT_SECRET = FIXED_JWT_SECRET;
  console.warn("[boot] JWT_SECRET missing/weak — using fixed production secret");
} else {
  console.log(`[boot] JWT_SECRET ok (length ${jwt.length})`);
}

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

console.log("[boot] Ensuring admin credentials...");
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
} else {
  const matches = await bcrypt.compare(ADMIN_PASSWORD, user.passwordHash);
  if (!matches || user.mustChangePassword || !user.active || user.username !== "admin") {
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
    console.log("[boot] Repaired admin login");
  } else {
    console.log("[boot] Admin login already healthy");
  }
}

console.log(`[boot] Ready — username: admin / password: ${ADMIN_PASSWORD}`);
await prisma.$disconnect();

fs.mkdirSync(path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads"), { recursive: true });
const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
