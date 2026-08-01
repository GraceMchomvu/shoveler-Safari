import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../tripix-html");

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

const adminBtn = `
              <a
                href="/admin/"
                class="shoveler-admin-link shoveler-admin-btn"
                aria-label="Admin login"
                title="Admin login"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 1.5a4.5 4.5 0 00-4.5 4.5V8H6.75A2.25 2.25 0 004.5 10.25v9A2.25 2.25 0 006.75 21.5h10.5a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0017.25 8H16.5V6A4.5 4.5 0 0012 1.5zm-2.25 6.5V6a2.25 2.25 0 114.5 0v2h-4.5zM12 13.25a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor"></path>
                </svg>
                <span>Admin</span>
              </a>`;

const mobileItem =
  '<li><a href="/admin/" class="shoveler-admin-link">Admin login</a></li>';
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
  // so Admin is not duplicated next to the logo on desktop hero.
  return html.replace(
    /(<button\b[^>]*\bsearchBoxTggler\b[^>]*>[\s\S]*?<\/button>)(\s*)/gi,
    (full, button, space) => {
      if (/\bd-lg-none\b/.test(button)) return full;
      return `${button}${adminBtn}${space}`;
    }
  );
}

function insertMobileAdmin(html) {
  // Only inside vs-mobile-menu: after Contact list item, before </ul>
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

for (const file of pages) {
  const filePath = path.join(siteRoot, file);
  const before = fs.readFileSync(filePath, "utf8");
  const beforeLen = before.length;

  let html = before;
  html = stripAdminAnchors(html);
  html = stripAdminListItems(html);
  html = html.replace(/\s*<script src="assets\/js\/shoveler-admin\.js"><\/script>/g, "");

  html = insertAfterSearchButtons(html);
  html = insertMobileAdmin(html);
  html = insertFooterAdmin(html);
  html = ensureScript(html);

  // Safety guard: never write a shredded page
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

console.log("Done.");
