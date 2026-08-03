import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDir = path.join(cmsRoot, "prisma");

// Load .env
const envPath = path.join(cmsRoot, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

/** Same resolution as server/src/lib/prisma.ts */
function resolveDatabaseUrl() {
  const raw = (process.env.DATABASE_URL || "file:./dev.db").trim();
  if (!raw.startsWith("file:")) return raw;
  let p = raw.slice("file:".length);
  if (path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p)) {
    return `file:${path.resolve(p).replace(/\\/g, "/")}`;
  }
  const cleaned = p.replace(/^\.[\\/]/, "").replace(/\\/g, "/");
  const filePath = cleaned.startsWith("prisma/")
    ? path.join(cmsRoot, cleaned)
    : path.join(schemaDir, cleaned);
  return `file:${path.resolve(filePath).replace(/\\/g, "/")}`;
}

process.env.DATABASE_URL = resolveDatabaseUrl();
console.log("Using DB:", process.env.DATABASE_URL);

const prisma = new PrismaClient();
const password = `${crypto.randomBytes(12).toString("base64url")}Aa1`;
const email = (process.env.ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error("Admin user not found:", email);
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
await prisma.user.update({
  where: { email },
  data: {
    passwordHash: hash,
    mustChangePassword: true,
    active: true,
    username: user.username || "admin",
  },
});
await prisma.session.deleteMany({ where: { userId: user.id } });

const credPath = path.join(cmsRoot, ".seed-credentials");
fs.writeFileSync(
  credPath,
  [
    "# Fresh admin password — DO NOT COMMIT",
    `# ${new Date().toISOString()}`,
    "",
    "username: admin",
    `email (resets only): ${email}`,
    `password: ${password}`,
    "",
    'Sign in with username "admin". Change password when prompted, then delete this file.',
    "",
  ].join("\n"),
  "utf8"
);

console.log("Admin password reset.");
console.log("Username: admin");
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
await prisma.$disconnect();
