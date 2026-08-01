import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const dbPath = path.join(cmsRoot, "prisma", "dev.db").replace(/\\/g, "/");
process.env.DATABASE_URL = `file:${dbPath}`;

export const prisma = new PrismaClient();
export { cmsRoot };
