import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
const email = (process.env.ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();

const user = await prisma.user.update({
  where: { email },
  data: { username },
});
console.log(`Login username set: ${user.username} (email ${user.email} for resets)`);
await prisma.$disconnect();
