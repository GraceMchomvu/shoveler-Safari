import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(cmsRoot, ".env") });

const { default: authRoutes } = await import("./routes/auth.js");
const { default: adminRoutes } = await import("./routes/admin.js");
const { default: publicRoutes } = await import("./routes/public.js");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.shovelersafari.com";
const allowedOrigins = new Set(
  [CLIENT_ORIGIN, SITE_ORIGIN, "http://localhost:5173", "http://localhost:4000", "http://127.0.0.1:5173", "http://127.0.0.1:4000"]
    .flatMap((o) => o.split(",").map((s) => s.trim()))
    .filter(Boolean)
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(cmsRoot, "uploads")));
app.use("/public", express.static(path.join(cmsRoot, "server/public")));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "shoveler-cms" }));
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
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  }
);

fs.mkdirSync(path.join(cmsRoot, "uploads"), { recursive: true });
fs.mkdirSync(path.join(cmsRoot, "backups"), { recursive: true });
fs.mkdirSync(path.join(cmsRoot, "server/public"), { recursive: true });

app.listen(PORT, () => {
  console.log(`Shoveler CMS API on http://localhost:${PORT}`);
  if (fs.existsSync(adminDist)) {
    console.log(`Admin login: http://localhost:${PORT}/admin/`);
  }
});
