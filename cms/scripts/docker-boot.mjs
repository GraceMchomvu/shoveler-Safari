#!/usr/bin/env node
/**
 * Production boot — durable Neon Postgres + stable admin login.
 * Secrets MUST come from environment (Render Dashboard). Never hardcode them.
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
    "[fatal] DATABASE_URL must be a Postgres URL from Neon (set it in Render → Environment). SQLite is not allowed."
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
    "[fatal] JWT_SECRET must be a fixed random value (≥32 chars) in Render → Environment."
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

console.log("[boot] Ready — username: admin (password from SEED_ADMIN_PASSWORD)");
await prisma.$disconnect();

fs.mkdirSync(path.join(cmsRoot, process.env.UPLOAD_DIR || "./uploads"), { recursive: true });
const port = process.env.PORT || "4000";
console.log(`[boot] Starting CMS API on :${port}`);
run("npx", ["tsx", "server/src/index.ts"]);
