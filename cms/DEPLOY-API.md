# Why live admin login fails

The public site on Cloudflare Pages (`www.shovelersafari.com`) only hosts **static files**.

Admin login needs the **Node CMS API** (`/api/auth/login`). Right now:

- `https://www.shovelersafari.com/admin/` → loads the login page (static)
- `https://www.shovelersafari.com/api/health` → **404** (no API connected)

So customers see “wrong password” even with the correct password.

## Fix (required for live site)

### 1. Host the CMS API on a Node host (always-on)

Examples: Railway, Render, Fly.io, a VPS.

From this repo:

```bash
cd cms
npm install
npm install --prefix server
npm install --prefix client
npm run db:setup
npm run harden
NODE_ENV=production npm start
```

Set production env on that host at least:

```env
NODE_ENV=production
JWT_SECRET=<32+ random chars>
DATABASE_URL=file:./dev.db
CLIENT_ORIGIN=https://www.shovelersafari.com
SITE_ORIGIN=https://www.shovelersafari.com
PORT=4000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=victorkiungai@gmail.com
SMTP_PASS=<gmail app password>
SMTP_FROM="Northern Shoveler Adventure <victorkiungai@gmail.com>"
```

You should be able to open: `https://YOUR-API-HOST/api/health` → `{ "ok": true }`

### 2. Connect Cloudflare Pages to that API

In Cloudflare Pages → Settings → Environment variables:

| Name | Value |
|------|--------|
| `CMS_API_ORIGIN` | `https://YOUR-API-HOST` (no trailing slash) |

Redeploy Pages after saving.

The function `tripix-html/functions/api/[[path]].js` proxies `/api/*` to that origin.

### 3. Rebuild & deploy admin UI

```bash
cd cms
npm run build
```

Deploy the updated `tripix-html` folder (includes `/admin/` + `functions/`).

## Local login (works now)

1. `cd cms` → `npm.cmd run dev`
2. Open http://localhost:5173/admin/
3. Username: `admin`
4. Password: see `cms/.seed-credentials`

## Do not expect

- Live `/admin/` to work until the API is hosted **and** `CMS_API_ORIGIN` is set
- Cloudflare Pages alone to run SQLite/Prisma — it cannot; you need a Node server
