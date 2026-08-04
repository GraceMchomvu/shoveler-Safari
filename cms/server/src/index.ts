import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ZodError } from "zod";
import { prisma } from "./lib/prisma.js";
import { isProduction } from "./lib/security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(cmsRoot, ".env") });

if (isProduction()) {
  const secret = (process.env.JWT_SECRET || "").trim();
  if (
    !secret ||
    secret.length < 32 ||
    secret === "change-me-in-production" ||
    secret === "dev-secret" ||
    secret === "shoveler-cms-dev-secret-change-in-production"
  ) {
    console.error(
      `[fatal] JWT_SECRET missing/weak (length=${secret.length}). ` +
        "In Render: Environment → Add JWT_SECRET (32+ random characters) → Save → Manual Deploy."
    );
    process.exit(1);
  }
}

const { default: authRoutes } = await import("./routes/auth.js");
const { default: adminRoutes } = await import("./routes/admin.js");
const { default: publicRoutes } = await import("./routes/public.js");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.shovelersafari.com";

let origins = [CLIENT_ORIGIN, SITE_ORIGIN]
  .flatMap((o) => o.split(",").map((s) => s.trim()))
  .filter(Boolean);

if (isProduction()) {
  // Never allow loopback origins in production, even if listed in env
  origins = origins.filter((o) => !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o));
} else {
  origins.push(
    "http://localhost:5173",
    "http://localhost:4000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  );
}

const allowedOrigins = new Set(origins);

if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true" || isProduction()) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const uploadDir = process.env.UPLOAD_DIR
  ? path.isAbsolute(process.env.UPLOAD_DIR)
    ? process.env.UPLOAD_DIR
    : path.join(cmsRoot, process.env.UPLOAD_DIR)
  : path.join(cmsRoot, "uploads");

app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'");
    next();
  },
  express.static(uploadDir, {
    index: false,
    dotfiles: "deny",
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".pdf") {
        res.setHeader("Content-Disposition", 'attachment; filename="download.pdf"');
      }
    },
  })
);
app.use("/public", express.static(path.join(cmsRoot, "server/public"), { index: false, dotfiles: "deny" }));

app.get("/api/health", async (_req, res) => {
  let dbHost = "unknown";
  let adminCount = -1;
  try {
    const raw = process.env.DATABASE_URL || "";
    if (raw.startsWith("file:")) dbHost = "sqlite";
    else {
      try {
        dbHost = new URL(raw).hostname || "postgres";
      } catch {
        dbHost = "postgres";
      }
    }
    adminCount = await prisma.user.count({
      where: { OR: [{ username: "admin" }, { role: "SUPER_ADMIN" }] },
    });
  } catch {
    /* keep defaults */
  }
  res.json({
    ok: true,
    service: "shoveler-cms",
    env: isProduction() ? "production" : "development",
    dbHost,
    adminCount,
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1", publicRoutes);

const adminDist = path.join(cmsRoot, "client/dist");
if (fs.existsSync(adminDist)) {
  app.use("/admin", express.static(adminDist, { index: false }));
  app.get(/^\/admin(?:\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(adminDist, "index.html"));
  });
  app.get("/", (_req, res) => res.redirect("/admin/"));
}

app.use(
  (
    err: Error & { status?: number; type?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Invalid request" });
    }
    if (err.name === "MulterError") {
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    console.error(err);
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({
      error: status >= 500 ? "Server error" : err.message || "Request failed",
    });
  }
);

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(path.join(cmsRoot, "backups"), { recursive: true });
fs.mkdirSync(path.join(cmsRoot, "server/public"), { recursive: true });

app.listen(PORT, () => {
  console.log(`Shoveler CMS API on http://localhost:${PORT}`);
  if (fs.existsSync(adminDist)) {
    console.log(`Admin: http://localhost:${PORT}/admin/`);
  }
});
