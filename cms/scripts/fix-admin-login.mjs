import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDir = path.join(cmsRoot, "prisma");

const envPath = path.join(cmsRoot, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const raw = (process.env.DATABASE_URL || "file:./dev.db").trim();
let p = raw.startsWith("file:") ? raw.slice(5) : raw;
const cleaned = p.replace(/^\.[\\/]/, "").replace(/\\/g, "/");
const filePath = path.isAbsolute(p) || /^[A-Za-z]:/.test(p)
  ? p
  : cleaned.startsWith("prisma/")
    ? path.join(cmsRoot, cleaned)
    : path.join(schemaDir, cleaned);
process.env.DATABASE_URL = `file:${path.resolve(filePath).replace(/\\/g, "/")}`;
console.log("DB:", process.env.DATABASE_URL);

const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: { id: true, email: true, username: true, active: true, mustChangePassword: true, role: true },
});
console.log("Users:", users);

const password = "AdminPass123";
const email = "victorkiungai@gmail.com";
let user = await prisma.user.findFirst({
  where: { OR: [{ email }, { username: "admin" }] },
});

if (!user) {
  console.log("No admin found — creating one");
  user = await prisma.user.create({
    data: {
      email,
      username: "admin",
      name: "Super Admin",
      phone: "+255783591810",
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
      mustChangePassword: true,
      active: true,
    },
  });
} else {
  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      email,
      username: "admin",
      passwordHash: await bcrypt.hash(password, 12),
      mustChangePassword: true,
      active: true,
    },
  });
}

await prisma.session.deleteMany({ where: { userId: user.id } });
const ok = await bcrypt.compare(password, user.passwordHash);
console.log("Password verify after update:", ok);

fs.writeFileSync(
  path.join(cmsRoot, ".seed-credentials"),
  [
    "# Simple admin login — DO NOT COMMIT",
    `# ${new Date().toISOString()}`,
    "",
    "username: admin",
    "password: AdminPass123",
    `email (resets only): ${email}`,
    "",
    "LOCAL: http://localhost:5173/admin/",
    "LIVE admin UI needs a running CMS API + Cloudflare CMS_API_ORIGIN.",
    "",
  ].join("\n")
);

console.log("Ready — username: admin / password: AdminPass123");
await prisma.$disconnect();
