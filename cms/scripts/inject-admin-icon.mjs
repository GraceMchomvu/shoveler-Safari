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
  return html
    .replace(
      /<li>\s*<a\b[^>]*\bshoveler-admin-link\b[^>]*>\s*Admin(?: login)?\s*<\/a>\s*<\/li>/gi,
      ""
    )
    // Leftover empty items after anchor-only strip
    .replace(/<li>\s*<\/li>/gi, "");
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

/** Insert Admin only inside a specific menu block — never across the whole page. */
function insertAdminInBlock(html, blockPattern, itemHtml) {
  return html.replace(blockPattern, (block) => {
    if (block.includes("shoveler-admin-link")) return block;
    const contactLi = block.match(
      /<li>\s*<a href="\/contact">Contact<\/a>\s*<\/li>/i
    );
    if (!contactLi) return block;
    return block.replace(
      contactLi[0],
      `${contactLi[0]}\n                ${itemHtml}`
    );
  });
}

function insertMobileAdmin(html) {
  return insertAdminInBlock(
    html,
    /<div class="vs-mobile-menu">[\s\S]*?<\/div>/i,
    mobileItem
  );
}

function insertFooterAdmin(html) {
  return insertAdminInBlock(
    html,
    /<div class="footer-menu">[\s\S]*?<\/div>/i,
    footerItem
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

    // Guard: Admin list item must not sit inside desktop/sticky main-menu navs
    const navBlocks = html.match(/<nav class="main-menu[\s\S]*?<\/nav>/gi) || [];
    if (navBlocks.some((nav) => nav.includes("shoveler-admin-link"))) {
      console.error(`SKIP ${file}: Admin leaked into desktop main-menu`);
      continue;
    }

    fs.writeFileSync(filePath, html);
    console.log(`OK ${file} (${beforeLen} -> ${html.length})`);
  }
}

for (const root of roots) processRoot(root);
console.log("\nDone.");
