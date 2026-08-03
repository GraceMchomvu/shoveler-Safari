import fs from "fs";
import path from "path";
import { cmsRoot, prisma } from "./prisma.js";

const siteRoot = path.resolve(cmsRoot, "../tripix-html");

export async function writePublicSeo(settings: Record<string, unknown>) {
  const publicDir = path.join(cmsRoot, "server/public");
  fs.mkdirSync(publicDir, { recursive: true });

  const base = (settings.siteUrl as string) || "https://www.shovelersafari.com";
  const pages = await prisma.page.findMany({ where: { status: "PUBLISHED" } });
  const posts = await prisma.post.findMany({ where: { status: "PUBLISHED" } });
  const urls = [
    ...pages.map((p) => `${base}/${p.slug === "home" ? "" : p.slug}`),
    ...posts.map((p) => `${base}/blog/${p.slug}`),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.replace(/\/$/, "") || base}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  const robots = String(
    settings.robotsTxt || `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`
  );
  // Full content pack stays on the API host only (not copied into the public marketing site).
  const pack = { exportedAt: new Date().toISOString(), pages, posts, settings };

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(publicDir, "robots.txt"), robots);
  fs.writeFileSync(path.join(publicDir, "content-pack.json"), JSON.stringify(pack, null, 2));

  // Bridge SEO files only into the live HTML site folder
  if (fs.existsSync(siteRoot)) {
    fs.writeFileSync(path.join(siteRoot, "sitemap.xml"), sitemap);
    fs.writeFileSync(path.join(siteRoot, "robots.txt"), robots);
    // Remove previously published content pack from public admin folder if present
    const leaked = path.join(siteRoot, "admin", "content-pack.json");
    if (fs.existsSync(leaked)) {
      try {
        fs.unlinkSync(leaked);
      } catch {
        /* ignore */
      }
    }
  }

  return { pages: pages.length, posts: posts.length, bridged: fs.existsSync(siteRoot) };
}
