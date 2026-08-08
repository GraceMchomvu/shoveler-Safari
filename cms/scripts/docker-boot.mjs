#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(cmsRoot);

/** Permanent Neon DB — Render free disk is ephemeral; never use SQLite there. */
const NEON_DATABASE_URL =
  "postgresql://neondb_owner:npg_B8MQlfP2vSwc@ep-cold-fog-ay7d1318-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";
const FIXED_JWT_SECRET =
  "16721ed6c057db74221bf93025f647bb655c037073c64724dc43edb998f747f98c465e977e05c302f99f422b69205f8f";
const PINNED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "SafariAdmin2026!";
const PINNED_ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();
const PINNED_ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || "+255783591810";

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

// Force durable Postgres. Misconfigured Render env was wiping admin on every sleep.
const rawDb = (process.env.DATABASE_URL || "").trim();
if (!rawDb || rawDb.startsWith("file:") || !/^postgres(ql)?:\/\//i.test(rawDb)) {
  console.warn("[boot] DATABASE_URL missing/sqlite — forcing Neon Postgres");
  process.env.DATABASE_URL = NEON_DATABASE_URL;
} else {
  console.log("[boot] DATABASE_URL is Postgres");
}

const jwt = (process.env.JWT_SECRET || "").trim();
if (
  !jwt ||
  jwt.length < 32 ||
  jwt === "change-me-in-production" ||
  jwt === "dev-secret" ||
  jwt === "shoveler-cms-dev-secret-change-in-production"
) {
  console.warn("[boot] JWT_SECRET missing/weak — using fixed production secret");
  process.env.JWT_SECRET = FIXED_JWT_SECRET;
} else {
  console.log(`[boot] JWT_SECRET ok (length ${jwt.length})`);
}

console.log("[boot] Preparing Postgres database...");
run("npx", ["prisma", "db", "push", "--schema=prisma/schema.prisma", "--skip-generate"]);

const prisma = new PrismaClient();

const adminCount = await prisma.user.count({
  where: { OR: [{ username: "admin" }, { role: "SUPER_ADMIN" }] },
});

if (adminCount === 0) {
  console.log("[boot] No admin yet — seeding once...");
  process.env.SEED_ADMIN_PASSWORD = PINNED_ADMIN_PASSWORD;
  process.env.SEED_ADMIN_EMAIL = PINNED_ADMIN_EMAIL;
  process.env.SEED_ADMIN_PHONE = PINNED_ADMIN_PHONE;
  run("npx", ["tsx", "prisma/seed.ts"]);
}

// ALWAYS ensure known admin credentials on Neon after every boot.
// Render free was reseeding ephemeral storage and breaking login; this makes login stable.
console.log("[boot] Ensuring durable admin credentials on Neon...");
const passwordHash = await bcrypt.hash(PINNED_ADMIN_PASSWORD, 12);
let user = await prisma.user.findFirst({
  where: { OR: [{ email: PINNED_ADMIN_EMAIL }, { username: "admin" }] },
});
if (!user) {
  user = await prisma.user.create({
    data: {
      email: PINNED_ADMIN_EMAIL,
      username: "admin",
      name: "Super Admin",
      phone: PINNED_ADMIN_PHONE,
      passwordHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      active: true,
    },
  });
} else {
  const matches = await bcrypt.compare(PINNED_ADMIN_PASSWORD, user.passwordHash);
  if (!matches || user.mustChangePassword || user.username !== "admin" || !user.active) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: PINNED_ADMIN_EMAIL,
        username: "admin",
        phone: PINNED_ADMIN_PHONE,
        passwordHash,
        mustChangePassword: false,
        active: true,
        role: "SUPER_ADMIN",
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    console.log("[boot] Admin password repaired");
  } else {
    console.log("[boot] Admin credentials already correct");
  }
}
console.log(`[boot] Admin login: username=admin password=${PINNED_ADMIN_PASSWORD}`);

await prisma.$disconnect();

fs.mkdirSync(path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads"), { recursive: true });

const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
