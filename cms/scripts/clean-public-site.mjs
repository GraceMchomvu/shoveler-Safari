/**
 * Remove public admin entry points + template leftovers from tripix-html.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tripix-html");

const demoPages = ["index-2.html", "index-3.html", "index-1-backup.html"];
for (const f of demoPages) {
  const p = path.join(siteRoot, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log("Removed", f);
  }
}

const leaked = path.join(siteRoot, "admin", "content-pack.json");
if (fs.existsSync(leaked)) {
  fs.unlinkSync(leaked);
  console.log("Removed admin/content-pack.json");
}

function cleanHtml(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const before = html;

  // Remove mobile/footer Admin login list items
  html = html.replace(
    /\s*<li>\s*<a[^>]*class="[^"]*shoveler-admin-link[^"]*"[^>]*>\s*Admin login\s*<\/a>\s*<\/li>/gi,
    ""
  );
  html = html.replace(/\s*<li>\s*<a[^>]*href="\/admin\/"[^>]*>\s*Admin login\s*<\/a>\s*<\/li>/gi, "");

  // Remove lock-button admin anchors (including nested SVG)
  html = html.replace(
    /\s*<a\s+[^>]*class="[^"]*shoveler-admin-(?:link|btn)[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
    ""
  );

  // Remove admin helper script
  html = html.replace(/\s*<script[^>]*shoveler-admin\.js[^>]*><\/script>/gi, "");

  // Brand meta
  html = html.replace(
    /<meta\s+name="author"\s+content="https:\/\/is\.gd\/[^"]*"\s*\/?>/gi,
    '<meta name="author" content="Northern Shoveler Adventure" />'
  );
  html = html.replace(
    /<meta\s+name="developer"\s+content="Md Kaium Hossain"\s*\/?>/gi,
    '<meta name="developer" content="Northern Shoveler Adventure" />'
  );

  // Template developer credit titles
  html = html.replace(
    /title="Develop by Md Kaium Hossain"/gi,
    'title="Northern Shoveler Adventure"'
  );

  // Empty leftover list items
  html = html.replace(/\s*<li>\s*<\/li>/gi, "");

  if (html !== before) {
    fs.writeFileSync(filePath, html, "utf8");
    return true;
  }
  return false;
}

let n = 0;
for (const name of fs.readdirSync(siteRoot)) {
  if (!name.endsWith(".html")) continue;
  if (name.startsWith("admin")) continue;
  if (cleanHtml(path.join(siteRoot, name))) {
    console.log("Cleaned", name);
    n++;
  }
}

// CSS banner
const cssPath = path.join(siteRoot, "assets/css/style.css");
if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, "utf8");
  const cleaned = css.replace(
    /^\uFEFF?\/\*[\r\n]+Template Name:[\s\S]*?\*\/[\r\n]*/,
    "/* Northern Shoveler Adventure — site styles (derived from licensed template) */\n"
  );
  if (cleaned !== css) {
    fs.writeFileSync(cssPath, cleaned, "utf8");
    console.log("Cleaned assets/css/style.css header");
  }
}

console.log(`Done. Updated ${n} HTML file(s).`);
