import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.DATABASE_URL = `file:${path.join(cmsRoot, "prisma", "dev.db").replace(/\\/g, "/")}`;

const prisma = new PrismaClient();
const creds = fs.readFileSync(path.join(cmsRoot, ".seed-credentials"), "utf8");
const pw = (creds.match(/password:\s*(.+)/) || [])[1]?.trim();

const users = await prisma.user.findMany({
  select: { email: true, username: true, active: true, passwordHash: true },
});
console.log(
  "DB users:",
  users.map((u) => ({ email: u.email, username: u.username, active: u.active }))
);
console.log("Cred password:", pw);

const admin = users.find((u) => u.username === "admin") || users[0];
if (admin && pw) {
  console.log("Hash matches creds:", await bcrypt.compare(pw, admin.passwordHash));
}

for (const base of ["http://localhost:4000", "http://localhost:5173"]) {
  try {
    const r = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: "admin", password: pw }),
    });
    console.log(base, r.status, await r.json());
  } catch (e) {
    console.log(base, "FAIL", e.message);
  }
}

await prisma.$disconnect();
