import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const phone = process.env.SEED_ADMIN_PHONE || "+255783591810";
const user = await prisma.user.update({
  where: { email: "admin@shovelersafari.com" },
  data: { phone },
});
console.log("Updated", user.email, "phone=", user.phone);
await prisma.$disconnect();
