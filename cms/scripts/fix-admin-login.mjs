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

const raw = (process.env.DATABASE_URL || "").trim();
if (!raw) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (raw.startsWith("file:")) {
  let p = raw.slice(5);
  const cleaned = p.replace(/^\.[\\/]/, "").replace(/\\/g, "/");
  const filePath = path.isAbsolute(p) || /^[A-Za-z]:/.test(p)
    ? p
    : cleaned.startsWith("prisma/")
      ? path.join(cmsRoot, cleaned)
      : path.join(schemaDir, cleaned);
  process.env.DATABASE_URL = `file:${path.resolve(filePath).replace(/\\/g, "/")}`;
}
console.log("DB provider:", process.env.DATABASE_URL.startsWith("file:") ? "sqlite" : "postgres");

const prisma = new PrismaClient();
const password = process.env.SEED_ADMIN_PASSWORD || "AdminPass123";
const email = (process.env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();
const phone = process.env.SEED_ADMIN_PHONE || "+255783591810";
const passwordHash = await bcrypt.hash(password, 12);
const forceReset = process.env.FORCE_ADMIN_RESET === "1" || process.env.FORCE_ADMIN_RESET === "true";

let user = await prisma.user.findFirst({
  where: { OR: [{ email }, { username: "admin" }] },
});

if (!user) {
  console.log("Creating admin once...");
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
} else if (forceReset) {
  console.log("FORCE_ADMIN_RESET — updating admin password");
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
} else {
  console.log(`Admin already exists (${user.username || user.email}) — leaving password unchanged`);
}

const ok = user ? await bcrypt.compare(password, (await prisma.user.findUnique({ where: { id: user.id } })).passwordHash) : false;
if (forceReset || !user) {
  console.log("Bootstrap password verify:", ok);
  console.log(`Ready — username: admin / password: ${password}`);
} else {
  console.log("Password left as the user last set it.");
}

fs.writeFileSync(
  path.join(cmsRoot, ".seed-credentials"),
  [
    "# Admin login — DO NOT COMMIT",
    `# ${new Date().toISOString()}`,
    "",
    "username: admin",
    forceReset || ok ? `password: ${password}` : "password: (unchanged — use the password you set)",
    `email (resets only): ${email}`,
    "",
    "LIVE: https://www.shovelersafari.com/admin/",
    "",
  ].join("\n")
);

await prisma.$disconnect();
