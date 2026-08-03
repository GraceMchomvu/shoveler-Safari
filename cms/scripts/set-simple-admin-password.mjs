import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.DATABASE_URL = `file:${path.join(cmsRoot, "prisma", "dev.db").replace(/\\/g, "/")}`;

const prisma = new PrismaClient();
const password = "AdminPass123";
const email = "victorkiungai@gmail.com";

const hash = await bcrypt.hash(password, 12);
const user = await prisma.user.update({
  where: { email },
  data: {
    passwordHash: hash,
    username: "admin",
    mustChangePassword: true,
    active: true,
  },
});
await prisma.session.deleteMany({ where: { userId: user.id } });

fs.writeFileSync(
  path.join(cmsRoot, ".seed-credentials"),
  [
    "# Simple admin login — DO NOT COMMIT",
    `# ${new Date().toISOString()}`,
    "",
    "username: admin",
    "password: AdminPass123",
    "email (resets only): victorkiungai@gmail.com",
    "",
    "Open: http://localhost:5173/admin/",
    "After login you must set a new password.",
    "",
  ].join("\n")
);

console.log("OK — username: admin  password: AdminPass123");
await prisma.$disconnect();
