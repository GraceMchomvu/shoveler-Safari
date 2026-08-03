import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function makePassword() {
  // 16 url-safe chars + enforced complexity suffix
  return `${crypto.randomBytes(12).toString("base64url")}Aa1`;
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPass123";
  const editorPassword = process.env.SEED_EDITOR_PASSWORD || makePassword();
  const authorPassword = process.env.SEED_AUTHOR_PASSWORD || makePassword();
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminPhone = process.env.SEED_ADMIN_PHONE || "+255783591810";
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: "admin",
      passwordHash,
      phone: adminPhone,
      mustChangePassword: true,
      active: true,
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: adminEmail,
      username: "admin",
      name: "Super Admin",
      phone: adminPhone,
      passwordHash,
      role: Role.SUPER_ADMIN,
      mustChangePassword: true,
    },
  });

  // Legacy seed email — keep in sync so old bookmarks still work
  if (adminEmail !== "admin@shovelersafari.com") {
    await prisma.user.upsert({
      where: { email: "admin@shovelersafari.com" },
      update: { passwordHash, username: null, active: true },
      create: {
        email: "admin@shovelersafari.com",
        name: "Super Admin (legacy)",
        phone: adminPhone,
        passwordHash,
        role: Role.SUPER_ADMIN,
        mustChangePassword: true,
      },
    });
  }

  // Ensure admin has a recovery phone for WhatsApp resets
  await prisma.user.updateMany({
    where: { email: adminEmail, OR: [{ phone: null }, { phone: "" }] },
    data: { phone: adminPhone },
  });

  await prisma.user.upsert({
    where: { email: "editor@shovelersafari.com" },
    update: {},
    create: {
      email: "editor@shovelersafari.com",
      name: "Content Editor",
      passwordHash: await bcrypt.hash(editorPassword, 12),
      role: Role.EDITOR,
      mustChangePassword: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "author@shovelersafari.com" },
    update: {},
    create: {
      email: "author@shovelersafari.com",
      name: "Safari Author",
      passwordHash: await bcrypt.hash(authorPassword, 12),
      role: Role.AUTHOR,
      mustChangePassword: true,
    },
  });

  const pages = [
    { title: "Home", slug: "home", content: "<p>Private journeys across Tanzania.</p>" },
    { title: "About", slug: "about", content: "<p>Founded in Arusha in June 2022.</p>" },
    { title: "Destinations", slug: "destinations", content: "<p>Serengeti, Ngorongoro, Tarangire & more.</p>" },
    { title: "Safaris", slug: "trips", content: "<p>Expert-led Northern Circuit safaris.</p>" },
    { title: "Activities", slug: "activities", content: "<p>Game drives, birdwatching, cultural visits.</p>" },
    { title: "FAQ", slug: "faq", content: "<p>Common questions about booking a safari.</p>" },
    { title: "Contact", slug: "contact", content: "<p>Email shovelersafari@gmail.com · WhatsApp +255 783 591 810</p>" },
    { title: "Blog", slug: "blog", content: "<p>Safari journal and travel tips.</p>" },
  ];

  for (const [i, p] of pages.entries()) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        status: "PUBLISHED",
        publishedAt: new Date(),
        sortOrder: i,
        authorId: admin.id,
        metaTitle: `${p.title} | Northern Shoveler Adventure`,
        metaDescription: `${p.title} — Tanzania safari experiences from Arusha.`,
        keywords: "Tanzania safari, Arusha, Serengeti, Shoveler",
        canonicalUrl: `https://www.shovelersafari.com/${p.slug === "home" ? "" : p.slug + ".html"}`,
      },
    });
  }

  const cat = await prisma.category.upsert({
    where: { slug: "safari-tips" },
    update: {},
    create: { name: "Safari Tips", slug: "safari-tips" },
  });

  const tag = await prisma.tag.upsert({
    where: { slug: "serengeti" },
    update: {},
    create: { name: "Serengeti", slug: "serengeti" },
  });

  await prisma.post.upsert({
    where: { slug: "best-time-to-visit-serengeti" },
    update: {},
    create: {
      title: "Best Time to Visit the Serengeti",
      slug: "best-time-to-visit-serengeti",
      excerpt: "Migration seasons and tips from Arusha-based guides.",
      content:
        "<p>Plan your Tanzania safari with Northern Shoveler Adventure. Learn the best time to visit the Serengeti.</p>",
      status: "PUBLISHED",
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: cat.id,
      tags: { connect: [{ id: tag.id }] },
      metaTitle: "Best Time to Visit Serengeti | Blog",
      metaDescription: "Plan your Tanzania safari — Serengeti seasons and tips.",
      commentsEnabled: true,
    },
  });

  const post = await prisma.post.findUnique({ where: { slug: "best-time-to-visit-serengeti" } });
  if (post) {
    const existing = await prisma.comment.count({ where: { postId: post.id } });
    if (existing === 0) {
      await prisma.comment.create({
        data: {
          postId: post.id,
          authorName: "Guest",
          authorEmail: "guest@example.com",
          body: "Very helpful guide — thank you!",
          status: "PENDING",
        },
      });
    }
  }

  for (const location of ["header", "footer", "mobile"] as const) {
    const menu = await prisma.menu.upsert({
      where: { location },
      update: {},
      create: { name: location, location },
    });
    const count = await prisma.menuItem.count({ where: { menuId: menu.id } });
    if (count === 0) {
      const items = [
        { label: "Home", url: "/", sortOrder: 0 },
        { label: "About", url: "/about.html", sortOrder: 1 },
        { label: "Destinations", url: "/destinations.html", sortOrder: 2 },
        { label: "Safaris", url: "/trips.html", sortOrder: 3 },
        { label: "Contact", url: "/contact.html", sortOrder: 4 },
      ];
      for (const item of items) {
        await prisma.menuItem.create({ data: { menuId: menu.id, ...item } });
      }
    }
  }

  await prisma.setting.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      data: JSON.stringify({
        siteTitle: "Northern Shoveler Adventure",
        siteUrl: "https://www.shovelersafari.com",
        logo: "/uploads/logo.png",
        favicon: "/uploads/favicon.ico",
        contactEmail: "shovelersafari@gmail.com",
        phone: "+255 783 591 810",
        address: "Arusha, Tanzania",
        timezone: "Africa/Dar_es_Salaam",
        language: "en",
        robotsTxt:
          "User-agent: *\nAllow: /\nSitemap: https://www.shovelersafari.com/sitemap.xml\n",
        sitemapAuto: true,
        analyticsProvider: "",
      }),
    },
  });

  await prisma.theme.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      data: JSON.stringify({
        primaryColor: "#b8953e",
        secondaryColor: "#1a1f1a",
        backgroundColor: "#f7f4ef",
        fontHeading: "Cormorant Garamond",
        fontBody: "Source Sans 3",
        buttonStyle: "outline-gold",
        headerStyle: "frosted",
        footerStyle: "dark",
        darkMode: false,
      }),
    },
  });

  await prisma.form.upsert({
    where: { slug: "contact" },
    update: {},
    create: {
      name: "Contact form",
      slug: "contact",
      notifyEmail: "shovelersafari@gmail.com",
      fields: JSON.stringify([
        { id: "name", type: "text", label: "Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "message", type: "textarea", label: "Message", required: true },
      ]),
    },
  });

  await prisma.form.upsert({
    where: { slug: "safari-quote" },
    update: {},
    create: {
      name: "Safari booking quote",
      slug: "safari-quote",
      notifyEmail: "shovelersafari@gmail.com",
      fields: JSON.stringify([
        { id: "name", type: "text", label: "Name", required: true },
        { id: "email", type: "email", label: "Email", required: true },
        { id: "dates", type: "text", label: "Travel dates", required: false },
        { id: "guests", type: "number", label: "Guests", required: true },
      ]),
    },
  });

  // Analytics mock — last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    await prisma.analyticsSnapshot.upsert({
      where: { date },
      update: {},
      create: {
        date,
        visitors: 40 + Math.floor(Math.random() * 80),
        pageViews: 100 + Math.floor(Math.random() * 200),
        bounceRate: 35 + Math.random() * 20,
        avgSessionSec: 90 + Math.floor(Math.random() * 120),
        devices: JSON.stringify({ desktop: 55, mobile: 40, tablet: 5 }),
        countries: JSON.stringify({ TZ: 30, US: 25, GB: 15, DE: 10, Other: 20 }),
        topPages: JSON.stringify([
          { path: "/", views: 120 },
          { path: "/trips.html", views: 80 },
          { path: "/about.html", views: 45 },
        ]),
        referrals: JSON.stringify([
          { source: "google", visits: 60 },
          { source: "instagram", visits: 25 },
          { source: "direct", visits: 40 },
        ]),
      },
    });
  }

  await prisma.notification.create({
    data: {
      type: "system",
      title: "Welcome to Shoveler CMS",
      body: "Your content management system is ready.",
      link: "/app",
    },
  });

  const credPath = path.join(cmsRoot, ".seed-credentials");
  const createdAdmin = await prisma.user.findUnique({ where: { email: "admin@shovelersafari.com" } });
  // Only write credentials when we may have created fresh passwords (file missing or FORCE_SEED_CREDS)
  const shouldWriteCreds =
    process.env.FORCE_SEED_CREDS === "true" || !fs.existsSync(credPath);
  if (shouldWriteCreds && createdAdmin) {
    const body = [
      "# Generated by npm run db:seed — DO NOT COMMIT",
      `# ${new Date().toISOString()}`,
      "",
      "admin@shovelersafari.com",
      adminPassword,
      "",
      "editor@shovelersafari.com",
      editorPassword,
      "",
      "author@shovelersafari.com",
      authorPassword,
      "",
      "Change these passwords immediately after first login.",
      "",
    ].join("\n");
    fs.writeFileSync(credPath, body, "utf8");
    console.log("Seed complete.");
    console.log(`One-time credentials written to ${credPath} (gitignored).`);
    console.log("Change passwords on first login. Delete .seed-credentials after.");
  } else {
    console.log("Seed complete. Existing users were not overwritten.");
    console.log("Set FORCE_SEED_CREDS=true only when intentionally rotating seed passwords.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
