/**
 * One-time hardening for existing databases:
 * - Force mustChangePassword on all users
 * - Rotate passwords that still match known weak seed defaults
 * - Write new credentials to cms/.seed-credentials (gitignored)
 *
 * Usage from cms/: node scripts/harden-users.mjs
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load cms/.env manually (no dotenv dependency at root)
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

if (!process.env.DATABASE_URL) {
  const preferred = path.join(cmsRoot, "prisma", "cms.db");
  const legacy = path.join(cmsRoot, "prisma", "dev.db");
  const chosen = fs.existsSync(preferred) ? preferred : legacy;
  process.env.DATABASE_URL = `file:${chosen.replace(/\\/g, "/")}`;
}

const prisma = new PrismaClient();
const WEAK = ["ShovelerAdmin123!", "Editor123!", "Author123!", "TempPass123!"];

function makePassword() {
  return `${crypto.randomBytes(12).toString("base64url")}Aa1`;
}

async function main() {
  const users = await prisma.user.findMany();
  const rotated = [];

  for (const user of users) {
    let newPassword = null;
    for (const weak of WEAK) {
      if (await bcrypt.compare(weak, user.passwordHash)) {
        newPassword =
          process.env.SEED_ADMIN_PASSWORD && user.email.startsWith("admin@")
            ? process.env.SEED_ADMIN_PASSWORD
            : makePassword();
        break;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        mustChangePassword: true,
        ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 12) } : {}),
      },
    });

    await prisma.session.deleteMany({ where: { userId: user.id } });

    if (newPassword) {
      rotated.push({ email: user.email, password: newPassword });
    }
  }

  if (rotated.length) {
    const credPath = path.join(cmsRoot, ".seed-credentials");
    const lines = [
      "# Written by npm run harden — DO NOT COMMIT",
      `# ${new Date().toISOString()}`,
      "",
      ...rotated.flatMap((r) => [r.email, r.password, ""]),
      "Sign in and change each password immediately, then delete this file.",
      "",
    ];
    fs.writeFileSync(credPath, lines.join("\n"), "utf8");
    console.log(`Rotated ${rotated.length} weak password(s). See ${credPath}`);
  } else {
    console.log(
      "No known weak passwords found. All users flagged mustChangePassword=true; sessions cleared."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
