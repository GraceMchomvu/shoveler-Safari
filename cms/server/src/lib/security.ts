import crypto from "crypto";

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** Prefer explicit HTTPS site origin; fall back to NODE_ENV. */
export function useSecureCookies() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const site = process.env.SITE_ORIGIN || "";
  if (site.startsWith("https://")) return true;
  return isProduction();
}

export function cookieOptions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: useSecureCookies(),
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function clearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: useSecureCookies(),
    path: "/",
  };
}

export function resolveJwtSecret(): string {
  const secret = (process.env.JWT_SECRET || "").trim();
  if (isProduction()) {
    if (!secret || secret === "change-me-in-production" || secret === "dev-secret") {
      console.error(
        "[fatal] JWT_SECRET must be set to a long random value in production (not the example placeholder)."
      );
      process.exit(1);
    }
    if (secret.length < 32) {
      console.error("[fatal] JWT_SECRET must be at least 32 characters in production.");
      process.exit(1);
    }
    return secret;
  }
  if (!secret) {
    console.warn("[security] JWT_SECRET missing — using ephemeral dev secret (sessions reset on restart).");
    if (!process.env.__EPHEMERAL_JWT) {
      process.env.__EPHEMERAL_JWT = crypto.randomBytes(32).toString("hex");
    }
    return process.env.__EPHEMERAL_JWT;
  }
  return secret;
}

export const PASSWORD_MIN = 10;

export function passwordSchemaMessage() {
  return `Password must be at least ${PASSWORD_MIN} characters and include upper, lower, and a number`;
}

export function isStrongPassword(pw: string) {
  if (pw.length < PASSWORD_MIN) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
}

export const ALLOWED_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const ALLOWED_UPLOAD_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
