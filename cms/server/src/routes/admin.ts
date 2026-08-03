import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import archiver from "archiver";
import { z } from "zod";
import { ContentStatus, CommentStatus, Role } from "@prisma/client";
import { cmsRoot, prisma, sqliteDbFilePath } from "../lib/prisma.js";
import { logActivity, notify } from "../lib/activity.js";
import { can } from "../lib/permissions.js";
import { writePublicSeo } from "../lib/publish.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import {
  ALLOWED_UPLOAD_EXTS,
  ALLOWED_UPLOAD_MIMES,
  isStrongPassword,
  MAX_UPLOAD_BYTES,
  PASSWORD_MIN,
  passwordSchemaMessage,
} from "../lib/security.js";

const router = Router();
router.use(requireAuth);

const uploadRoot = process.env.UPLOAD_DIR
  ? path.isAbsolute(process.env.UPLOAD_DIR)
    ? process.env.UPLOAD_DIR
    : path.join(cmsRoot, process.env.UPLOAD_DIR)
  : path.join(cmsRoot, "uploads");
const backupRoot = path.join(cmsRoot, "backups");
fs.mkdirSync(uploadRoot, { recursive: true });
fs.mkdirSync(backupRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();
    if (!ALLOWED_UPLOAD_EXTS.has(ext) || !ALLOWED_UPLOAD_MIMES.has(mime)) {
      return cb(new Error("Only JPEG, PNG, WebP, GIF, and PDF files are allowed"));
    }
    // Block double extensions and SVG masquerading
    if (/\.(html?|svg|js|mjs|php|exe|sh|bat)$/i.test(file.originalname)) {
      return cb(new Error("File type not allowed"));
    }
    cb(null, true);
  },
});

function canAssignRole(actorRole: Role, targetRole: Role) {
  if (actorRole === "SUPER_ADMIN") return true;
  // Non–super-admins cannot create or promote to ADMIN / SUPER_ADMIN
  return targetRole !== "SUPER_ADMIN" && targetRole !== "ADMIN";
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// —— Dashboard ——
router.get("/dashboard", requirePermission("dashboard:view"), async (_req, res) => {
  const [pages, posts, media, users, comments, submissions, recent] = await Promise.all([
    prisma.page.count(),
    prisma.post.count(),
    prisma.media.count(),
    prisma.user.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    prisma.formSubmission.count(),
    prisma.activityLog.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  const latestAnalytics = await prisma.analyticsSnapshot.findFirst({
    orderBy: { date: "desc" },
  });
  res.json({
    stats: {
      pages,
      posts,
      media,
      users,
      pendingComments: comments,
      formSubmissions: submissions,
      visitors: latestAnalytics?.visitors ?? 0,
    },
    recent,
    analytics: latestAnalytics,
  });
});

// —— Users ——
router.get("/users", requirePermission("users:manage"), async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      active: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });
  res.json({ users });
});

router.post("/users", requirePermission("users:manage"), async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    username: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .transform((v) => v.toLowerCase())
      .optional(),
    name: z.string().min(1),
    password: z
      .string()
      .min(PASSWORD_MIN)
      .refine(isStrongPassword, { message: passwordSchemaMessage() }),
    role: z.nativeEnum(Role),
  });
  const data = schema.parse(req.body);
  if (!canAssignRole(req.user!.role, data.role)) {
    return res.status(403).json({ error: "Only Super Admin can assign Admin roles" });
  }
  if (data.username) {
    const taken = await prisma.user.findUnique({ where: { username: data.username } });
    if (taken) return res.status(400).json({ error: "Username already taken" });
  }
  const hash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      username: data.username || null,
      name: data.name,
      passwordHash: hash,
      role: data.role,
      mustChangePassword: true,
    },
  });
  await logActivity({
    userId: req.user!.id,
    action: "create",
    entity: "user",
    entityId: user.id,
  });
  await notify({
    type: "user_registered",
    title: "New user created",
    body: `${user.name} (${user.username || user.email})`,
    link: "/app/users",
  });
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
});

router.patch("/users/:id", requirePermission("users:manage"), async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    username: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .transform((v) => v.toLowerCase())
      .nullable()
      .optional(),
    email: z.string().email().optional(),
    role: z.nativeEnum(Role).optional(),
    active: z.boolean().optional(),
  });
  const data = schema.parse(req.body);
  const existing = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } });
  if (existing.role === "SUPER_ADMIN" && req.user!.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Cannot modify Super Admin" });
  }
  if (data.role && !canAssignRole(req.user!.role, data.role)) {
    return res.status(403).json({ error: "Only Super Admin can assign Admin roles" });
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data });
  await logActivity({ userId: req.user!.id, action: "update", entity: "user", entityId: user.id });
  res.json({ user });
});

router.delete("/users/:id", requirePermission("users:manage"), async (req, res) => {
  if (req.params.id === req.user!.id) return res.status(400).json({ error: "Cannot delete yourself" });
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (existing?.role === "SUPER_ADMIN" && req.user!.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Cannot delete Super Admin" });
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user!.id, action: "delete", entity: "user", entityId: req.params.id });
  res.json({ ok: true });
});

// —— Pages ——
router.get("/pages", requirePermission("pages:read"), async (_req, res) => {
  const pages = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: { author: { select: { name: true } }, parent: { select: { id: true, title: true } } },
  });
  res.json({ pages });
});

router.post("/pages", requirePermission("pages:write"), async (req, res) => {
  const schema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    status: z.nativeEnum(ContentStatus).optional(),
    parentId: z.string().nullable().optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogImage: z.string().optional(),
    keywords: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const slug = data.slug || slugify(data.title);
  const status = data.status || "DRAFT";
  const page = await prisma.page.create({
    data: {
      title: data.title,
      slug,
      content: data.content || "",
      excerpt: data.excerpt,
      status,
      parentId: data.parentId || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      ogImage: data.ogImage,
      keywords: data.keywords,
      authorId: req.user!.id,
    },
  });
  await logActivity({ userId: req.user!.id, action: "create", entity: "page", entityId: page.id });
  res.status(201).json({ page });
});

router.get("/pages/:id", requirePermission("pages:read"), async (req, res) => {
  const page = await prisma.page.findUnique({ where: { id: req.params.id } });
  if (!page) return res.status(404).json({ error: "Not found" });
  res.json({ page });
});

router.patch("/pages/:id", requirePermission("pages:write"), async (req, res) => {
  const data = req.body;
  if (data.status === "PUBLISHED" && !canPublish(req)) {
    return res.status(403).json({ error: "Cannot publish" });
  }
  const page = await prisma.page.update({
    where: { id: req.params.id },
    data: {
      ...pick(data, [
        "title",
        "slug",
        "content",
        "excerpt",
        "status",
        "parentId",
        "sortOrder",
        "metaTitle",
        "metaDescription",
        "canonicalUrl",
        "ogImage",
        "keywords",
      ]),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : data.scheduledAt === null ? null : undefined,
      publishedAt:
        data.status === "PUBLISHED"
          ? new Date()
          : data.status
            ? null
            : undefined,
    },
  });
  await logActivity({
    userId: req.user!.id,
    action: data.status === "PUBLISHED" ? "publish" : "update",
    entity: "page",
    entityId: page.id,
  });
  res.json({ page });
});

router.post("/pages/:id/duplicate", requirePermission("pages:write"), async (req, res) => {
  const src = await prisma.page.findUniqueOrThrow({ where: { id: req.params.id } });
  const page = await prisma.page.create({
    data: {
      title: `${src.title} (Copy)`,
      slug: `${src.slug}-copy-${Date.now().toString(36)}`,
      content: src.content,
      excerpt: src.excerpt,
      status: "DRAFT",
      parentId: src.parentId,
      metaTitle: src.metaTitle,
      metaDescription: src.metaDescription,
      keywords: src.keywords,
      authorId: req.user!.id,
    },
  });
  res.status(201).json({ page });
});

router.delete("/pages/:id", requirePermission("pages:write"), async (req, res) => {
  await prisma.page.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user!.id, action: "delete", entity: "page", entityId: req.params.id });
  res.json({ ok: true });
});

function canPublish(req: import("express").Request) {
  return can(req.user!.role, "pages:publish") || can(req.user!.role, "posts:publish");
}

function pick<T extends Record<string, unknown>>(obj: T, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

// —— Posts ——
router.get("/posts", requirePermission("posts:read"), async (_req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true } },
      category: true,
      tags: true,
      _count: { select: { comments: true } },
    },
  });
  res.json({ posts });
});

router.post("/posts", requirePermission("posts:write"), async (req, res) => {
  const schema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    status: z.nativeEnum(ContentStatus).optional(),
    featuredImage: z.string().optional(),
    categoryId: z.string().nullable().optional(),
    tagIds: z.array(z.string()).optional(),
    commentsEnabled: z.boolean().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.string().optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
  });
  const data = schema.parse(req.body);
  const status = data.status || "DRAFT";
  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug: data.slug || slugify(data.title),
      content: data.content || "",
      excerpt: data.excerpt,
      status,
      featuredImage: data.featuredImage,
      categoryId: data.categoryId || null,
      commentsEnabled: data.commentsEnabled ?? true,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      authorId: req.user!.id,
      tags: data.tagIds ? { connect: data.tagIds.map((id) => ({ id })) } : undefined,
    },
  });
  await logActivity({
    userId: req.user!.id,
    action: status === "PUBLISHED" ? "publish" : "create",
    entity: "post",
    entityId: post.id,
  });
  res.status(201).json({ post });
});

router.get("/posts/:id", requirePermission("posts:read"), async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { tags: true, category: true },
  });
  if (!post) return res.status(404).json({ error: "Not found" });
  res.json({ post });
});

router.patch("/posts/:id", requirePermission("posts:write"), async (req, res) => {
  const data = req.body;
  const tagIds: string[] | undefined = data.tagIds;
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: {
      ...pick(data, [
        "title",
        "slug",
        "content",
        "excerpt",
        "status",
        "featuredImage",
        "categoryId",
        "commentsEnabled",
        "metaTitle",
        "metaDescription",
        "canonicalUrl",
        "ogImage",
        "keywords",
      ]),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : data.scheduledAt === null ? null : undefined,
      publishedAt: data.status === "PUBLISHED" ? new Date() : data.status ? null : undefined,
      tags: tagIds ? { set: tagIds.map((id) => ({ id })) } : undefined,
    },
    include: { tags: true, category: true },
  });
  await logActivity({
    userId: req.user!.id,
    action: data.status === "PUBLISHED" ? "publish" : "update",
    entity: "post",
    entityId: post.id,
  });
  res.json({ post });
});

router.delete("/posts/:id", requirePermission("posts:write"), async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  await logActivity({ userId: req.user!.id, action: "delete", entity: "post", entityId: req.params.id });
  res.json({ ok: true });
});

router.get("/categories", requirePermission("posts:read"), async (_req, res) => {
  res.json({ categories: await prisma.category.findMany({ orderBy: { name: "asc" } }) });
});

router.post("/categories", requirePermission("posts:write"), async (req, res) => {
  const name = z.string().min(1).parse(req.body.name);
  const category = await prisma.category.create({
    data: { name, slug: slugify(name) },
  });
  res.status(201).json({ category });
});

router.get("/tags", requirePermission("posts:read"), async (_req, res) => {
  res.json({ tags: await prisma.tag.findMany({ orderBy: { name: "asc" } }) });
});

router.post("/tags", requirePermission("posts:write"), async (req, res) => {
  const name = z.string().min(1).parse(req.body.name);
  const tag = await prisma.tag.create({ data: { name, slug: slugify(name) } });
  res.status(201).json({ tag });
});

// —— Media ——
router.get("/media", requirePermission("media:manage"), async (req, res) => {
  const q = String(req.query.q || "");
  const folderId = req.query.folderId ? String(req.query.folderId) : undefined;
  const media = await prisma.media.findMany({
    where: {
      AND: [
        folderId ? { folderId } : {},
        q
          ? {
              OR: [
                { originalName: { contains: q } },
                { altText: { contains: q } },
                { filename: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  const folders = await prisma.mediaFolder.findMany({ orderBy: { name: "asc" } });
  res.json({ media, folders });
});

router.post("/media", requirePermission("media:manage"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file selected from your computer" });
  let finalPath = req.file.path;
  let size = req.file.size;
  let mimeType = req.file.mimetype || "application/octet-stream";
  if (!ALLOWED_UPLOAD_MIMES.has(mimeType)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "File type not allowed" });
  }
  try {
    if (mimeType.startsWith("image/")) {
      const compressed = `${req.file.path}.jpg`;
      await sharp(req.file.path).rotate().jpeg({ quality: 82 }).toFile(compressed);
      fs.unlinkSync(req.file.path);
      fs.renameSync(compressed, req.file.path);
      size = fs.statSync(req.file.path).size;
      finalPath = req.file.path;
      mimeType = "image/jpeg";
    }
  } catch (err) {
    console.error("Image optimize failed, rejecting upload:", err);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Could not process image. Upload a valid JPEG, PNG, WebP, or GIF." });
  }
  const media = await prisma.media.create({
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType,
      size,
      path: finalPath,
      url: `/uploads/${req.file.filename}`,
      altText: req.body.altText || "",
      folderId: req.body.folderId || null,
    },
  });
  await logActivity({ userId: req.user!.id, action: "upload", entity: "media", entityId: media.id });
  res.status(201).json({ media });
});

router.patch("/media/:id", requirePermission("media:manage"), async (req, res) => {
  const media = await prisma.media.update({
    where: { id: req.params.id },
    data: pick(req.body, ["altText", "originalName", "folderId"]),
  });
  res.json({ media });
});

router.post("/media/:id/replace", requirePermission("media:manage"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const existing = await prisma.media.findUniqueOrThrow({ where: { id: req.params.id } });
  let mimeType = req.file.mimetype || "application/octet-stream";
  let size = req.file.size;
  let finalPath = req.file.path;
  if (!ALLOWED_UPLOAD_MIMES.has(mimeType)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "File type not allowed" });
  }
  try {
    if (mimeType.startsWith("image/")) {
      const compressed = `${req.file.path}.jpg`;
      await sharp(req.file.path).rotate().jpeg({ quality: 82 }).toFile(compressed);
      fs.unlinkSync(req.file.path);
      fs.renameSync(compressed, req.file.path);
      size = fs.statSync(req.file.path).size;
      finalPath = req.file.path;
      mimeType = "image/jpeg";
    }
  } catch {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Could not process image" });
  }
  if (fs.existsSync(existing.path)) fs.unlinkSync(existing.path);
  const media = await prisma.media.update({
    where: { id: existing.id },
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType,
      size,
      path: finalPath,
      url: `/uploads/${req.file.filename}`,
    },
  });
  res.json({ media });
});

router.delete("/media/:id", requirePermission("media:manage"), async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (media) {
    if (fs.existsSync(media.path)) fs.unlinkSync(media.path);
    await prisma.media.delete({ where: { id: media.id } });
    await logActivity({ userId: req.user!.id, action: "delete", entity: "media", entityId: media.id });
  }
  res.json({ ok: true });
});

router.post("/media/folders", requirePermission("media:manage"), async (req, res) => {
  const name = z.string().min(1).parse(req.body.name);
  const folder = await prisma.mediaFolder.create({
    data: { name, parentId: req.body.parentId || null },
  });
  res.status(201).json({ folder });
});

// —— Menus ——
router.get("/menus", requirePermission("menus:manage"), async (_req, res) => {
  const menus = await prisma.menu.findMany({
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  res.json({ menus });
});

router.put("/menus/:location", requirePermission("menus:manage"), async (req, res) => {
  const location = req.params.location;
  const items = z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string(),
        url: z.string().nullable().optional(),
        pageId: z.string().nullable().optional(),
        parentId: z.string().nullable().optional(),
        sortOrder: z.number(),
        openInNew: z.boolean().optional(),
      })
    )
    .parse(req.body.items || []);

  let menu = await prisma.menu.findUnique({ where: { location } });
  if (!menu) {
    menu = await prisma.menu.create({
      data: { name: location, location },
    });
  }
  await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
  for (const item of items) {
    await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        label: item.label,
        url: item.url || null,
        pageId: item.pageId || null,
        parentId: null,
        sortOrder: item.sortOrder,
        openInNew: item.openInNew || false,
      },
    });
  }
  // Second pass for nesting using temporary client ids is simplified: store flat + parent labels in url path
  // For scaffold, accept nested parentIndex via parentKey
  const withParents = (req.body.items || []) as Array<{
    label: string;
    url?: string;
    parentKey?: string | null;
    key?: string;
    sortOrder: number;
  }>;
  if (withParents.some((i) => i.parentKey)) {
    await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
    const keyToId = new Map<string, string>();
    const sorted = [...withParents].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const item of sorted.filter((i) => !i.parentKey)) {
      const created = await prisma.menuItem.create({
        data: {
          menuId: menu.id,
          label: item.label,
          url: item.url || null,
          sortOrder: item.sortOrder,
        },
      });
      if (item.key) keyToId.set(item.key, created.id);
    }
    for (const item of sorted.filter((i) => i.parentKey)) {
      await prisma.menuItem.create({
        data: {
          menuId: menu.id,
          label: item.label,
          url: item.url || null,
          parentId: item.parentKey ? keyToId.get(item.parentKey) || null : null,
          sortOrder: item.sortOrder,
        },
      });
    }
  }

  const updated = await prisma.menu.findUnique({
    where: { id: menu.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  await logActivity({ userId: req.user!.id, action: "update", entity: "menu", entityId: menu.id });
  res.json({ menu: updated });
});

// —— Settings / Theme / SEO site files ——
router.get("/settings", requirePermission("settings:manage"), async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "site" } });
  res.json({ settings: JSON.parse(setting?.data || "{}") });
});

router.put("/settings", requirePermission("settings:manage"), async (req, res) => {
  const data = JSON.stringify(req.body || {});
  await prisma.setting.upsert({
    where: { id: "site" },
    create: { id: "site", data },
    update: { data },
  });
  await logActivity({ userId: req.user!.id, action: "update", entity: "settings", entityId: "site" });
  res.json({ settings: req.body });
});

router.get("/theme", requirePermission("theme:manage"), async (_req, res) => {
  const theme = await prisma.theme.findUnique({ where: { id: "default" } });
  res.json({ theme: JSON.parse(theme?.data || "{}") });
});

router.put("/theme", requirePermission("theme:manage"), async (req, res) => {
  const data = JSON.stringify(req.body || {});
  await prisma.theme.upsert({
    where: { id: "default" },
    create: { id: "default", data },
    update: { data },
  });
  res.json({ theme: req.body });
});

router.get("/seo/site", requirePermission("seo:manage"), async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "site" } });
  const settings = JSON.parse(setting?.data || "{}");
  res.json({
    robotsTxt: settings.robotsTxt || "User-agent: *\nAllow: /\n",
    sitemapAuto: settings.sitemapAuto !== false,
  });
});

router.put("/seo/site", requirePermission("seo:manage"), async (req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "site" } });
  const current = JSON.parse(setting?.data || "{}");
  const next = {
    ...current,
    robotsTxt: req.body.robotsTxt ?? current.robotsTxt,
    sitemapAuto: req.body.sitemapAuto ?? current.sitemapAuto,
  };
  await prisma.setting.upsert({
    where: { id: "site" },
    create: { id: "site", data: JSON.stringify(next) },
    update: { data: JSON.stringify(next) },
  });
  await writePublicSeo(next);
  res.json({ ok: true, ...next });
});

router.post("/seo/regenerate-sitemap", requirePermission("seo:manage"), async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "site" } });
  const current = JSON.parse(setting?.data || "{}");
  const result = await writePublicSeo(current);
  res.json({ ok: true, ...result });
});

router.post("/publish/bridge", requirePermission("seo:manage"), async (_req, res) => {
  const setting = await prisma.setting.findUnique({ where: { id: "site" } });
  const current = JSON.parse(setting?.data || "{}");
  const result = await writePublicSeo(current);
  res.json({
    ok: true,
    message: result.bridged
      ? "Published SEO files and content pack to the live website folder."
      : "Exported to CMS public folder (live site folder not found).",
    ...result,
  });
});

// —— Forms ——
router.get("/forms", requirePermission("forms:manage"), async (_req, res) => {
  const forms = await prisma.form.findMany({
    include: { _count: { select: { submissions: true } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ forms });
});

router.post("/forms", requirePermission("forms:manage"), async (req, res) => {
  const schema = z.object({
    name: z.string(),
    slug: z.string().optional(),
    fields: z.any().optional(),
    notifyEmail: z.string().optional(),
    captchaEnabled: z.boolean().optional(),
  });
  const data = schema.parse(req.body);
  const form = await prisma.form.create({
    data: {
      name: data.name,
      slug: data.slug || slugify(data.name),
      fields: JSON.stringify(data.fields || []),
      notifyEmail: data.notifyEmail,
      captchaEnabled: data.captchaEnabled || false,
    },
  });
  res.status(201).json({ form });
});

router.patch("/forms/:id", requirePermission("forms:manage"), async (req, res) => {
  const form = await prisma.form.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      fields: req.body.fields ? JSON.stringify(req.body.fields) : undefined,
      notifyEmail: req.body.notifyEmail,
      captchaEnabled: req.body.captchaEnabled,
      active: req.body.active,
    },
  });
  res.json({ form: { ...form, fields: JSON.parse(form.fields) } });
});

router.get("/forms/:id/submissions", requirePermission("forms:manage"), async (req, res) => {
  const submissions = await prisma.formSubmission.findMany({
    where: { formId: req.params.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    submissions: submissions.map((s) => ({ ...s, data: JSON.parse(s.data) })),
  });
});

// —— Comments ——
router.get("/comments", requirePermission("comments:moderate"), async (req, res) => {
  const status = req.query.status as CommentStatus | undefined;
  const comments = await prisma.comment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { post: { select: { title: true, slug: true } } },
  });
  res.json({ comments });
});

router.patch("/comments/:id", requirePermission("comments:moderate"), async (req, res) => {
  const status = z.nativeEnum(CommentStatus).parse(req.body.status);
  const comment = await prisma.comment.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json({ comment });
});

router.post("/comments/:id/reply", requirePermission("comments:moderate"), async (req, res) => {
  const body = z.string().min(1).parse(req.body.body);
  const parent = await prisma.comment.findUniqueOrThrow({ where: { id: req.params.id } });
  const reply = await prisma.comment.create({
    data: {
      postId: parent.postId,
      parentId: parent.id,
      authorName: req.user!.name,
      authorEmail: req.user!.email,
      body,
      status: "APPROVED",
      userId: req.user!.id,
    },
  });
  res.status(201).json({ comment: reply });
});

router.delete("/comments/:id", requirePermission("comments:moderate"), async (req, res) => {
  await prisma.comment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// —— Notifications ——
router.get("/notifications", requirePermission("notifications:view"), async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ userId: req.user!.id }, { userId: null }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ notifications });
});

router.post("/notifications/read-all", requirePermission("notifications:view"), async (req, res) => {
  await prisma.notification.updateMany({
    where: { OR: [{ userId: req.user!.id }, { userId: null }], read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});

// —— Activity ——
router.get("/activity", requirePermission("activity:view"), async (_req, res) => {
  const logs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
  res.json({ logs });
});

// —— Search ——
router.get("/search", requirePermission("search:use"), async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ results: [] });
  const canManageUsers = can(req.user!.role, "users:manage");
  const [pages, posts, media, users, forms] = await Promise.all([
    prisma.page.findMany({
      where: { OR: [{ title: { contains: q } }, { content: { contains: q } }] },
      take: 10,
    }),
    prisma.post.findMany({
      where: { OR: [{ title: { contains: q } }, { content: { contains: q } }] },
      take: 10,
    }),
    prisma.media.findMany({
      where: { OR: [{ originalName: { contains: q } }, { altText: { contains: q } }] },
      take: 10,
    }),
    canManageUsers
      ? prisma.user.findMany({
          where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
          take: 10,
          select: { id: true, name: true, email: true, role: true },
        })
      : Promise.resolve([]),
    prisma.form.findMany({ where: { name: { contains: q } }, take: 10 }),
  ]);
  res.json({
    results: [
      ...pages.map((p) => ({ type: "page", id: p.id, title: p.title, link: `/app/pages/${p.id}` })),
      ...posts.map((p) => ({ type: "post", id: p.id, title: p.title, link: `/app/posts/${p.id}` })),
      ...media.map((m) => ({ type: "media", id: m.id, title: m.originalName, link: `/app/media` })),
      ...users.map((u) => ({
        type: "user",
        id: u.id,
        title: u.name,
        link: `/app/users`,
      })),
      ...forms.map((f) => ({ type: "form", id: f.id, title: f.name, link: `/app/forms/${f.id}` })),
    ],
  });
});

// —— Analytics ——
router.get("/analytics", requirePermission("analytics:view"), async (_req, res) => {
  const snapshots = await prisma.analyticsSnapshot.findMany({
    orderBy: { date: "asc" },
    take: 30,
  });
  res.json({
    snapshots: snapshots.map((s) => ({
      ...s,
      devices: JSON.parse(s.devices),
      countries: JSON.parse(s.countries),
      topPages: JSON.parse(s.topPages),
      referrals: JSON.parse(s.referrals),
    })),
  });
});

// —— Files (same uploads) ——
router.get("/files", requirePermission("files:manage"), async (_req, res) => {
  const media = await prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ files: media });
});

// —— Backups ——
router.get("/backups", requirePermission("backups:manage"), async (_req, res) => {
  const backups = await prisma.backup.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ backups });
});

router.post("/backups", requirePermission("backups:manage"), async (req, res) => {
  const filename = `backup-${Date.now()}.zip`;
  const outPath = path.join(backupRoot, filename);
  await createBackupZip(outPath);
  const size = fs.statSync(outPath).size;
  const backup = await prisma.backup.create({
    data: { filename, path: outPath, size, automatic: false },
  });
  await notify({
    type: "backup",
    title: "Backup completed",
    body: filename,
    link: "/app/backups",
  });
  await logActivity({ userId: req.user!.id, action: "backup", entity: "backup", entityId: backup.id });
  res.status(201).json({ backup });
});

router.get("/backups/:id/download", requirePermission("backups:manage"), async (req, res) => {
  const backup = await prisma.backup.findUniqueOrThrow({ where: { id: req.params.id } });
  res.download(backup.path, backup.filename);
});

async function createBackupZip(outPath: string) {
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);
    const dbPath = sqliteDbFilePath();
    if (fs.existsSync(dbPath)) archive.file(dbPath, { name: path.basename(dbPath) });
    if (fs.existsSync(uploadRoot)) archive.directory(uploadRoot, "uploads");
    archive.finalize();
  });
}

// —— API Keys ——
router.get("/api-keys", requirePermission("api:manage"), async (_req, res) => {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, active: true, lastUsedAt: true, createdAt: true },
  });
  res.json({ keys });
});

router.post("/api-keys", requirePermission("api:manage"), async (req, res) => {
  const name = z.string().min(1).parse(req.body.name);
  const raw = `sk_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 10);
  const keyHash = await bcrypt.hash(raw, 10);
  const key = await prisma.apiKey.create({
    data: { name, keyHash, prefix, userId: req.user!.id },
  });
  res.status(201).json({
    key: { id: key.id, name: key.name, prefix, createdAt: key.createdAt },
    secret: raw,
  });
});

router.delete("/api-keys/:id", requirePermission("api:manage"), async (req, res) => {
  await prisma.apiKey.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// —— Security overview ——
router.get("/security", requirePermission("security:manage"), async (_req, res) => {
  const [usersWith2fa, sessions, recentLogins] = await Promise.all([
    prisma.user.count({ where: { twoFactorEnabled: true } }),
    prisma.session.count(),
    prisma.activityLog.findMany({
      where: { action: "login" },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);
  res.json({
    httpsAssumed: true,
    csrf: "SameSite lax cookies + CORS origin allowlist",
    rateLimit: "Login 8/15min · forgot 5/hour · forms/comments 20/hour",
    uploadPolicy: "JPEG/PNG/WebP/GIF/PDF · max 8MB · SVG/HTML/JS blocked",
    passwordPolicy: "min 10 chars with upper, lower, number · mustChangePassword enforced",
    usersWith2fa,
    activeSessions: sessions,
    recentLogins,
  });
});

export default router;
