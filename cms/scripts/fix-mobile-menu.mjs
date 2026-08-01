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

for (const file of pages) {
  const fp = path.join(siteRoot, file);
  let html = fs.readFileSync(fp, "utf8");

  html = html.replace(/<li>\s*<\/li>/g, "");

  // Force desktop logo in mobile drawer
  html = html.replace(
    /(<div class="mobile-logo">\s*<a href="\/">\s*<img\s+src=")[^"]+(")/i,
    `$1assets/img/shoveler-logo.png$2`
  );

  // Fix only the first mobile menu block
  html = html.replace(/<div class="vs-mobile-menu">[\s\S]*?<\/div>/i, (block) => {
    let next = block.replace(/<li>\s*<\/li>/g, "");
    if (!next.includes("shoveler-admin-link")) {
      next = next.replace(
        /(<li><a href="\/contact">Contact<\/a><\/li>)(\s*)(<\/ul>)/i,
        `$1\n                <li><a href="/admin/" class="shoveler-admin-link">Admin login</a></li>\n              $3`
      );
    }
    return next;
  });

  fs.writeFileSync(fp, html);
  console.log("fixed", file);
}

const sample = fs.readFileSync(path.join(siteRoot, "index.html"), "utf8");
const m = sample.match(/<div class="vs-mobile-menu">[\s\S]*?<\/div>/i);
console.log("\n--- mobile menu ---\n");
console.log(m ? m[0] : "NOT FOUND");
