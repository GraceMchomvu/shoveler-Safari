import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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
const password = process.env.SEED_ADMIN_PASSWORD || "AdminPass123";
const email = (process.env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();
const phone = process.env.SEED_ADMIN_PHONE || "+255783591810";
const passwordHash = await bcrypt.hash(password, 12);

const users = await prisma.user.findMany({
  select: { id: true, email: true, username: true, active: true, role: true },
});
console.log("Users before fix:", users);

// Primary admin: username admin + known email/password
let user = await prisma.user.findFirst({
  where: { OR: [{ email }, { username: "admin" }, { email: "admin@shovelersafari.com" }] },
  orderBy: { createdAt: "asc" },
});

if (!user) {
  console.log("No admin found — creating one");
  user = await prisma.user.create({
    data: {
      email,
      username: "admin",
      name: "Super Admin",
      phone,
      passwordHash,
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
      phone,
      passwordHash,
      mustChangePassword: true,
      active: true,
      role: "SUPER_ADMIN",
    },
  });
}

// Any other SUPER_ADMIN / seed admin emails get the same password so login never dead-ends
await prisma.user.updateMany({
  where: {
    role: "SUPER_ADMIN",
    NOT: { id: user.id },
  },
  data: { passwordHash, mustChangePassword: true, active: true },
});

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
    `password: ${password}`,
    `email (resets only): ${email}`,
    "",
    "LIVE: https://www.shovelersafari.com/admin/",
    "",
  ].join("\n")
);

console.log(`Ready — username: admin / password: ${password}`);
await prisma.$disconnect();
