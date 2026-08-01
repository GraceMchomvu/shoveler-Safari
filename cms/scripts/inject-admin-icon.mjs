import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const roots = process.argv.slice(2).map((p) => path.resolve(p));
if (!roots.length) {
  roots.push(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tripix-html"));
}

const pages = [
  "index.html",
  "about.html",
  "destinations.html",
  "destination-details.html",
  "trips.html",
  "activities.html",
  "faq.html",
  "contact.html",
  "blog.html",
  "blog-details.html",
  "404.html",
];

// Text-only Admin control (no lock icon)
const adminBtn = `
              <a
                href="/admin/"
                class="shoveler-admin-link shoveler-admin-btn"
                aria-label="Admin"
                title="Admin"
              >Admin</a>`;

const mobileItem =
  '<li><a href="/admin/" class="shoveler-admin-link">Admin</a></li>';
const footerItem =
  '<li><a href="/admin/" class="shoveler-admin-link">Admin</a></li>';
const scriptTag = '<script src="assets/js/shoveler-admin.js"></script>';

/** Remove only anchors whose opening tag already includes shoveler-admin (safe). */
function stripAdminAnchors(html) {
  return html.replace(
    /<a\b[^>]*\bshoveler-admin(?:-link|-btn)\b[^>]*>[\s\S]*?<\/a>/gi,
    ""
  );
}

function stripAdminListItems(html) {
  return html.replace(
    /<li>\s*<a\b[^>]*\bshoveler-admin-link\b[^>]*>\s*Admin(?: login)?\s*<\/a>\s*<\/li>/gi,
    ""
  );
}

function insertAfterSearchButtons(html) {
  // Only after desktop/header search toggles — skip mobile-only (d-lg-none)
  return html.replace(
    /(<button\b[^>]*\bsearchBoxTggler\b[^>]*>[\s\S]*?<\/button>)(\s*)/gi,
    (full, button, space) => {
      if (/\bd-lg-none\b/.test(button)) return full;
      return `${button}${adminBtn}${space}`;
    }
  );
}

function insertMobileAdmin(html) {
  return html.replace(
    /(<div class="vs-mobile-menu">[\s\S]*?<li><a href="\/contact">Contact<\/a><\/li>)(\s*)(<\/ul>)/i,
    `$1\n                ${mobileItem}\n              $3`
  );
}

function insertFooterAdmin(html) {
  return html.replace(
    /(<div class="footer-menu">[\s\S]*?<li><a href="\/contact">Contact<\/a><\/li>)(\s*)(<\/ul>)/i,
    `$1\n                  ${footerItem}\n                $3`
  );
}

function ensureScript(html) {
  if (html.includes("shoveler-admin.js")) return html;
  return html.replace(/<\/body>/i, `    ${scriptTag}\n  </body>`);
}

/** Sticky search icons were hard-coded light (#F6F5F5) on white bars — force dark. */
function fixSearchIconContrast(html) {
  return html
    .replace(/fill="#F6F5F5"/gi, 'fill="#1a1f1a"')
    .replace(/fill='#F6F5F5'/gi, "fill='#1a1f1a'");
}

function processRoot(siteRoot) {
  console.log(`\n→ ${siteRoot}`);
  for (const file of pages) {
    const filePath = path.join(siteRoot, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`SKIP missing ${file}`);
      continue;
    }
    const before = fs.readFileSync(filePath, "utf8");
    const beforeLen = before.length;

    let html = before;
    html = stripAdminAnchors(html);
    html = stripAdminListItems(html);
    html = html.replace(/\s*<script src="assets\/js\/shoveler-admin\.js"><\/script>/g, "");
    html = fixSearchIconContrast(html);

    html = insertAfterSearchButtons(html);
    html = insertMobileAdmin(html);
    html = insertFooterAdmin(html);
    html = ensureScript(html);

    if (html.length < beforeLen * 0.7) {
      console.error(`SKIP ${file}: output shrank too much (${beforeLen} -> ${html.length})`);
      continue;
    }
    if (!html.includes("vs-header") || !html.includes("shoveler-admin-btn")) {
      console.error(`SKIP ${file}: missing expected markers`);
      continue;
    }

    fs.writeFileSync(filePath, html);
    console.log(`OK ${file} (${beforeLen} -> ${html.length})`);
  }
}

for (const root of roots) processRoot(root);
console.log("\nDone.");
