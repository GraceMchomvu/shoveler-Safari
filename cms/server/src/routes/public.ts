import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notify } from "../lib/activity.js";

const router = Router();

const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
});

async function optionalApiKey(req: import("express").Request) {
  const key = req.headers["x-api-key"];
  if (!key || typeof key !== "string") return;
  const prefix = key.slice(0, 10);
  const candidates = await prisma.apiKey.findMany({ where: { prefix, active: true } });
  for (const c of candidates) {
    if (await bcrypt.compare(key, c.keyHash)) {
      await prisma.apiKey.update({
        where: { id: c.id },
        data: { lastUsedAt: new Date() },
      });
      return;
    }
  }
}

router.use(async (req, _res, next) => {
  await optionalApiKey(req);
  next();
});

router.get("/pages", async (_req, res) => {
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      canonicalUrl: true,
      ogImage: true,
      keywords: true,
      publishedAt: true,
    },
  });
  res.json({ pages });
});

router.get("/pages/:slug", async (req, res) => {
  const page = await prisma.page.findFirst({
    where: { slug: req.params.slug, status: "PUBLISHED" },
  });
  if (!page) return res.status(404).json({ error: "Not found" });
  res.json({ page });
});

router.get("/posts", async (_req, res) => {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { category: true, tags: true, author: { select: { name: true } } },
  });
  res.json({ posts });
});

router.get("/posts/:slug", async (req, res) => {
  const post = await prisma.post.findFirst({
    where: { slug: req.params.slug, status: "PUBLISHED" },
    include: { category: true, tags: true, author: { select: { name: true } } },
  });
  if (!post) return res.status(404).json({ error: "Not found" });
  res.json({ post });
});

router.get("/menus/:location", async (req, res) => {
  const menu = await prisma.menu.findUnique({
    where: { location: req.params.location },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  res.json({ menu });
});

router.get("/settings", async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "site" } });
  const theme = await prisma.theme.findUnique({ where: { id: "default" } });
  res.json({
    settings: JSON.parse(setting?.data || "{}"),
    theme: JSON.parse(theme?.data || "{}"),
  });
});

router.post("/forms/:slug/submit", writeLimiter, async (req, res) => {
  const form = await prisma.form.findFirst({ where: { slug: req.params.slug, active: true } });
  if (!form) return res.status(404).json({ error: "Form not found" });
  const honeypot = req.body._hp;
  const spam = Boolean(honeypot);
  // Strip honeypot from stored payload
  const { _hp: _ignored, ...safeBody } = req.body || {};
  const submission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      data: JSON.stringify(safeBody),
      spam,
    },
  });
  if (!spam) {
    console.log(`[form-notify] new submission ${submission.id}`);
    await notify({
      type: "form",
      title: `Form submitted: ${form.name}`,
      body: "New submission received",
      link: `/app/forms/${form.id}`,
    });
  }
  res.status(201).json({ ok: true, id: submission.id });
});

router.post("/posts/:slug/comments", writeLimiter, async (req, res) => {
  const post = await prisma.post.findFirst({
    where: { slug: req.params.slug, status: "PUBLISHED", commentsEnabled: true },
  });
  if (!post) return res.status(404).json({ error: "Not found" });
  const schema = z.object({
    authorName: z.string().min(1).max(120),
    authorEmail: z.string().email().optional(),
    body: z.string().min(1).max(5000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid comment" });
  const data = parsed.data;
  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorName: data.authorName,
      authorEmail: data.authorEmail,
      body: data.body,
      status: "PENDING",
    },
  });
  await notify({
    type: "comment",
    title: "New comment awaiting moderation",
    body: data.authorName,
    link: "/app/comments",
  });
  res.status(201).json({ comment: { id: comment.id, status: comment.status } });
});

export default router;
