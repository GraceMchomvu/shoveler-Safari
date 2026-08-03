# Northern Shoveler Adventure — Custom CMS

Custom content management system for [www.shovelersafari.com](https://www.shovelersafari.com).

## Stack

- **Admin UI:** Vite + React + TypeScript + Tailwind (`client/`)
- **API:** Express + TypeScript (`server/`)
- **Database:** Prisma + SQLite (`prisma/`)

## Quick start

```bash
cd cms
cp .env.example .env
# Set a long random JWT_SECRET in .env
npm install
npm install --prefix server
npm install --prefix client
npm run db:setup
npm run harden          # rotates any known weak seed passwords
npm run clean:site      # strip public Admin links + demo pages
npm run dev
```

- Admin: http://localhost:5173/admin/ (or http://localhost:4000/admin/ after build)
- API: http://localhost:4000

**Do not put Admin login links on the public marketing site.** Open the admin URL directly (bookmark it). Prefer hosting admin on a separate subdomain in production (e.g. `cms.shovelersafari.com`).

### First login credentials

Seed no longer uses published default passwords. After `db:setup` or `npm run harden`, open the gitignored file:

`cms/.seed-credentials`

Sign in, change the password when prompted, then **delete** `.seed-credentials`.

## Production checklist

1. `NODE_ENV=production`
2. Strong `JWT_SECRET` (32+ random characters) — server refuses to start without it
3. `CLIENT_ORIGIN` / `SITE_ORIGIN` set to your real HTTPS domains (localhost origins are **not** allowed in production)
4. `TRUST_PROXY=1` behind Cloudflare / nginx
5. Run `npm run harden` once on the production database (or set passwords manually)
6. Enable 2FA for admin accounts (Account screen)
7. Deploy marketing site (`tripix-html`) separately from the CMS API when possible
8. `npm run smoke` and `npm run smoke -- https://your-api-host` before go-live

```bash
cd cms
npm run build   # builds admin UI → ../tripix-html/admin/
NODE_ENV=production npm start
```

### Cloudflare Pages + API host

1. Deploy `tripix-html` (static site).
2. Host the CMS API on a Node server with HTTPS.
3. Set Pages env `CMS_API_ORIGIN` to that API URL so `/api/*` can be proxied if needed.
4. Set API `SITE_ORIGIN` / `CLIENT_ORIGIN` to your real site / admin origins.
5. Prefer **not** advertising `/admin/` from the public nav; use a private URL or Cloudflare Access.

## Security features (built in)

| Control | Behavior |
|---------|----------|
| Passwords | Min 10 chars, upper + lower + number; bcrypt cost 12 |
| mustChangePassword | Enforced server-side until changed |
| JWT | No weak fallback in production; sessions revocable in DB |
| Cookies | httpOnly, SameSite=lax, Secure on HTTPS |
| Rate limits | Login 8/15min · forgot 5/hour · reset 10/15min · forms/comments 20/hour |
| Uploads | JPEG/PNG/WebP/GIF/PDF only, 8MB max, SVG/HTML/JS blocked |
| Roles | Only Super Admin can assign Admin / Super Admin |
| CORS | Allowlist only; localhost stripped in production |
| Errors | 500 responses never leak internal messages |
| Publish | SEO files bridged to site; full content-pack stays on API host |

## Role permissions

| Role | Access |
|------|--------|
| Super Admin | Everything including security + API keys |
| Admin | Most CMS features (not security overview / API keys) |
| Editor | Content, menus, SEO, forms, comments, analytics |
| Author | Posts, media, comments |
| Viewer | Dashboard, read content, analytics, activity |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + admin concurrently |
| `npm run build` | Build admin UI → `tripix-html/admin/` |
| `npm start` | Production API (serves `/admin` if built) |
| `npm run db:setup` | generate + push + seed |
| `npm run harden` | Rotate weak passwords + force password change |
| `npm run clean:site` | Remove public Admin links + demo HTML pages |
| `npm run smoke` | Static (and optional live) readiness checks |

## Public API

```
GET  /api/v1/pages
GET  /api/v1/posts
GET  /api/v1/menus/:location
GET  /api/v1/settings
POST /api/v1/forms/:slug/submit
POST /api/v1/posts/:slug/comments
```

Optional header: `X-API-Key: sk_...`

## Notes

- Password reset sends a **6-digit code + link** by **email (SMTP)** and **WhatsApp (Twilio or Meta Cloud API)**. Configure vars in `.env.example`. Each admin should save a WhatsApp number under **Account**. For local testing set `ALLOW_DEV_RESET_FILE=true` and read `cms/.dev-reset-link`.
- Analytics are mock snapshots until a provider is connected.
- **Publish to website** writes `sitemap.xml` and `robots.txt` into `../tripix-html` only (not a public content-pack dump).
