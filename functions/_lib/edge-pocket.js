/**
 * EdgePocket — free durable auth on Cloudflare (no Render).
 * Sessions + password hash live in KV. Secrets: JWT_SECRET, optional ADMIN_PASSWORD bootstrap.
 */

const COOKIE = "cms_token";
const USER_KEY = "edge:user:admin";
const SESSION_PREFIX = "edge:session:";
const RATE_PREFIX = "edge:rate:";

const PERMISSIONS = [
  "dashboard:view",
  "users:manage",
  "pages:read",
  "pages:write",
  "pages:publish",
  "posts:read",
  "posts:write",
  "posts:publish",
  "media:manage",
  "menus:manage",
  "settings:manage",
  "theme:manage",
  "seo:manage",
  "forms:manage",
  "analytics:view",
  "files:manage",
  "backups:manage",
  "notifications:view",
  "comments:moderate",
  "search:use",
  "activity:view",
  "security:manage",
  "api:manage",
];

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function b64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(str) {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const s = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  return crypto.subtle.digest("SHA-256", data);
}

async function pbkdf2Hash(password, saltB64) {
  const salt = fromB64url(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return b64url(bits);
}

async function hashPassword(password) {
  const salt = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2Hash(password, salt);
  return `pbkdf2:100000:${salt}:${hash}`;
}

async function verifyPassword(password, stored) {
  if (!stored || !password) return false;
  if (stored.startsWith("pbkdf2:")) {
    const [, , salt, hash] = stored.split(":");
    const next = await pbkdf2Hash(password, salt);
    return timingSafeEqual(next, hash);
  }
  // bootstrap: plain compare against env secret (upgraded on first login/change)
  return timingSafeEqual(password, stored);
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const max = Math.max(a.length, b.length);
  let out = a.length === b.length ? 0 : 1;
  for (let i = 0; i < max; i++) {
    out |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return out === 0;
}

async function signToken(secret, payload) {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyToken(secret, token) {
  if (!token || token.split(".").length !== 3) return null;
  const [header, body, sig] = token.split(".");
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify("HMAC", key, fromB64url(sig), new TextEncoder().encode(data));
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieHeader(token, maxAge = 60 * 60 * 24 * 7) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearCookieHeader() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  const parts = raw.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

function readBearer(request) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    phone: user.phone || null,
    role: user.role,
    mustChangePassword: !!user.mustChangePassword,
    twoFactorEnabled: false,
    permissions: PERMISSIONS,
  };
}

async function ensureUser(env) {
  const kv = env.EDGE_KV;
  if (!kv) throw new Error("EDGE_KV binding missing");
  let user = await kv.get(USER_KEY, "json");
  if (user) return user;

  const bootstrap =
    env.SEED_ADMIN_PASSWORD ||
    env.ADMIN_PASSWORD ||
    "SafariAdmin2026!";
  const email = (env.SEED_ADMIN_EMAIL || "victorkiungai@gmail.com").toLowerCase();
  user = {
    id: "edge-admin",
    email,
    username: "admin",
    name: "Super Admin",
    phone: env.SEED_ADMIN_PHONE || "+255783591810",
    role: "SUPER_ADMIN",
    passwordHash: await hashPassword(bootstrap),
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  };
  await kv.put(USER_KEY, JSON.stringify(user));
  return user;
}

async function saveUser(env, user) {
  await env.EDGE_KV.put(USER_KEY, JSON.stringify(user));
}

async function rateLimit(env, ip) {
  const key = `${RATE_PREFIX}${ip || "unknown"}`;
  const cur = Number((await env.EDGE_KV.get(key)) || "0");
  if (cur >= 40) return false;
  await env.EDGE_KV.put(key, String(cur + 1), { expirationTtl: 15 * 60 });
  return true;
}

async function createSession(env, user, request) {
  const secret = (env.JWT_SECRET || "").trim();
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set (≥32 chars) in Cloudflare Pages secrets");
  }
  const sid = b64url(crypto.getRandomValues(new Uint8Array(18)));
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const token = await signToken(secret, { sub: user.id, sid, exp });
  await env.EDGE_KV.put(
    `${SESSION_PREFIX}${sid}`,
    JSON.stringify({
      userId: user.id,
      ua: (request.headers.get("user-agent") || "").slice(0, 180),
      createdAt: new Date().toISOString(),
      exp,
    }),
    { expirationTtl: 60 * 60 * 24 * 7 }
  );
  return token;
}

async function getSessionUser(env, request) {
  const secret = (env.JWT_SECRET || "").trim();
  if (!secret) return null;
  const token = readBearer(request) || readCookie(request, COOKIE);
  if (!token) return null;
  const payload = await verifyToken(secret, token);
  if (!payload?.sid) return null;
  const session = await env.EDGE_KV.get(`${SESSION_PREFIX}${payload.sid}`, "json");
  if (!session) return null;
  const user = await ensureUser(env);
  if (user.id !== payload.sub && user.id !== session.userId) return null;
  return { user, token, sid: payload.sid };
}

function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function handleEdgePocket(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (!env.EDGE_KV) {
    return json(
      {
        error: "EdgePocket not configured. Create KV namespace EDGE_KV and bind it to Pages.",
        code: "EDGE_KV_MISSING",
      },
      503
    );
  }

  if (path === "/api/health" && method === "GET") {
    const user = await env.EDGE_KV.get(USER_KEY, "json");
    return json({
      ok: true,
      service: "shoveler-edge-pocket",
      env: "production",
      mode: "edge",
      dbHost: "cloudflare-kv",
      adminCount: user ? 1 : 0,
    });
  }

  if (path === "/api/auth/login" && method === "POST") {
    if (!(await rateLimit(env, clientIp(request)))) {
      return json({ error: "Too many login attempts. Try again in 15 minutes." }, 429);
    }
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid username or password" }, 400);
    }
    const loginId = String(body.login || body.username || body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const user = await ensureUser(env);
    const idOk = loginId === user.username || loginId === user.email;
    const passOk = idOk && (await verifyPassword(password, user.passwordHash));
    if (!passOk) return json({ error: "Invalid credentials" }, 401);

    // Upgrade plain bootstrap secrets to PBKDF2 after first successful login
    if (!String(user.passwordHash).startsWith("pbkdf2:")) {
      user.passwordHash = await hashPassword(password);
      await saveUser(env, user);
    }

    const token = await createSession(env, user, request);
    return json(
      { token, user: publicUser(user) },
      200,
      { "set-cookie": cookieHeader(token) }
    );
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const sess = await getSessionUser(env, request);
    if (sess?.sid) await env.EDGE_KV.delete(`${SESSION_PREFIX}${sess.sid}`);
    return json({ ok: true }, 200, { "set-cookie": clearCookieHeader() });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const sess = await getSessionUser(env, request);
    if (!sess) return json({ error: "Unauthorized" }, 401);
    return json({ user: publicUser(sess.user) });
  }

  if (path === "/api/auth/change-password" && method === "POST") {
    const sess = await getSessionUser(env, request);
    if (!sess) return json({ error: "Unauthorized" }, 401);
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid body" }, 400);
    }
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || body.password || "");
    if (newPassword.length < 10) {
      return json({ error: "Password must be at least 10 characters" }, 400);
    }
    if (!(await verifyPassword(currentPassword, sess.user.passwordHash))) {
      return json({ error: "Current password is incorrect" }, 400);
    }
    sess.user.passwordHash = await hashPassword(newPassword);
    sess.user.mustChangePassword = false;
    await saveUser(env, sess.user);
    return json({ ok: true, user: publicUser(sess.user) });
  }

  if (path === "/api/auth/forgot-password" && method === "POST") {
    return json({
      message:
        "EdgePocket stores your password on Cloudflare. Ask your developer to reset SEED_ADMIN_PASSWORD / clear the KV user key, or use Change password while logged in.",
    });
  }

  if (path === "/api/admin/dashboard" && method === "GET") {
    const sess = await getSessionUser(env, request);
    if (!sess) return json({ error: "Unauthorized" }, 401);
    return json({
      mode: "edge-pocket",
      stats: {
        pages: 0,
        posts: 0,
        media: 0,
        users: 1,
        pendingComments: 0,
        formSubmissions: 0,
        visitors: 0,
      },
      recent: [
        {
          id: "edge-1",
          action: "login",
          entity: "user",
          createdAt: new Date().toISOString(),
          user: { name: sess.user.name },
        },
      ],
      message:
        "Logged in via EdgePocket (Cloudflare). Full content modules can be added here next — login no longer depends on Render.",
      user: publicUser(sess.user),
    });
  }

  return null;
}

export function isEdgePocketPath(pathname) {
  const p = pathname.replace(/\/+$/, "") || "/";
  return (
    p === "/api/health" ||
    p.startsWith("/api/auth/") ||
    p === "/api/admin/dashboard"
  );
}
