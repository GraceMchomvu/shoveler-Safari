/**
 * Quick production readiness smoke checks (no server required for static checks).
 * With API running: node scripts/smoke-check.mjs http://localhost:4000
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.resolve(cmsRoot, "../tripix-html");
const api = process.argv[2] || process.env.SMOKE_API || "";

let failed = 0;
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function bad(msg) {
  console.error(`  ✗ ${msg}`);
  failed++;
}

console.log("Static checks");
const envExample = fs.readFileSync(path.join(cmsRoot, ".env.example"), "utf8");
if (envExample.includes("JWT_SECRET")) ok(".env.example documents JWT_SECRET");
else bad(".env.example missing JWT guidance");

const gitignore = fs.readFileSync(path.join(cmsRoot, ".gitignore"), "utf8");
if (gitignore.includes(".env") && gitignore.includes(".seed-credentials")) {
  ok("cms/.gitignore covers secrets");
} else {
  bad("cms/.gitignore should ignore .env and .seed-credentials");
}

if (fs.existsSync(path.join(siteRoot, "index-2.html"))) bad("Demo page index-2.html still present");
else ok("Demo alternate homepages removed");

const index = fs.readFileSync(path.join(siteRoot, "index.html"), "utf8");
if (/shoveler-admin-link|Admin login/.test(index)) bad("Public index still exposes Admin login");
else ok("Public index has no Admin login affordance");
if (/content="Md Kaium Hossain"|is\.gd\/a33FWT/.test(index)) bad("Template author meta still on index");
else ok("Template author meta cleaned on index");

const leaked = path.join(siteRoot, "admin", "content-pack.json");
if (fs.existsSync(leaked)) bad("content-pack.json still in public admin folder");
else ok("No public content-pack.json in site admin folder");

async function live() {
  if (!api) {
    console.log("\nSkip live API checks (pass API base URL as arg to enable)");
    return;
  }
  console.log(`\nLive checks → ${api}`);
  try {
    const health = await fetch(`${api.replace(/\/$/, "")}/api/health`);
    if (health.ok) ok("GET /api/health");
    else bad("GET /api/health failed");

    const login = await fetch(`${api.replace(/\/$/, "")}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-a-user@example.com", password: "wrong" }),
    });
    if (login.status === 401) ok("Login rejects bad credentials");
    else bad(`Login unexpected status ${login.status}`);
  } catch (e) {
    bad(`API unreachable: ${e instanceof Error ? e.message : e}`);
  }
}

await live();
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
