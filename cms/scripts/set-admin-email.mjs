import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const from = "admin@shovelersafari.com";
const to = (process.env.ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();

const existing = await prisma.user.findUnique({ where: { email: to } });
if (existing && existing.email !== from) {
  console.error(`Email ${to} is already used by another user.`);
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email: from },
  data: { email: to },
});

console.log(`Admin email updated: ${from} → ${user.email}`);
await prisma.$disconnect();
