# Northern Shoveler Adventure — Custom CMS

Custom content management system for [www.shovelersafari.com](https://www.shovelersafari.com).

## Stack

- **Admin UI:** Vite + React + TypeScript + Tailwind (`client/`)
- **API:** Express + TypeScript (`server/`)
- **Database:** Prisma + SQLite (`prisma/`)

## Quick start

```bash
cd cms
npm install
npm install --prefix server
npm install --prefix client
npm run db:setup
npm run dev
```

- Admin login: http://localhost:5173/admin/  
- API: http://localhost:4000  

On the public website, click the **lock icon** next to search (or “Admin login” in the mobile menu / footer) to open this login screen.

### Default login

| Email | Password | Role |
|--------|----------|------|
| `admin@shovelersafari.com` | `ShovelerAdmin123!` | Super Admin |
| `editor@shovelersafari.com` | `Editor123!` | Editor |
| `author@shovelersafari.com` | `Author123!` | Author |

Change the admin password after first login (Account → Change password).

## Production build

```bash
cd cms
npm run build   # builds admin UI + copies it to ../tripix-html/admin/
npm start       # API + admin at http://localhost:4000/admin/
```

### Cloudflare Pages

1. Deploy `tripix-html` (includes `/admin/` SPA after `npm run build`).
2. Host the CMS API on a Node server.
3. Set Pages env var `CMS_API_ORIGIN` to that API URL (e.g. `https://cms.yourhost.com`) so `/api/*` is proxied.
4. Set API env `SITE_ORIGIN` / `CLIENT_ORIGIN` to `https://www.shovelersafari.com`.

## Role permissions

| Role | Access |
|------|--------|
| Super Admin | Everything |
| Admin | Everything |
| Editor | Content, menus, SEO, forms, comments, analytics |
| Author | Own posts, media, comments |
| Viewer | Dashboard, read content, analytics, activity |

## Modules

1. Dashboard — stats, activity, quick actions  
2. Authentication — login, logout, forgot/reset, change password, 2FA, sessions  
3. User Management — CRUD + roles  
4. Pages — draft/publish/schedule/duplicate/SEO  
5. Blog — posts, categories, tags, featured image, comments flag  
6. Media Library — upload, search, alt, rename, delete, image compression  
7. Menu Builder — header / footer / mobile  
8. Website Settings — title, logo, contact, timezone, language  
9. Theme — colors, fonts, header/footer, dark mode preview  
10. SEO — meta fields + robots.txt + sitemap + **Publish to website** bridge  
11. Forms — definitions + submissions inbox  
12. Analytics — seeded mock metrics  
13. File Manager — browse uploads  
14. Backup & Restore — ZIP of DB + uploads  
15. Notifications — in-app alerts  
16. Comments — approve / reject / spam / reply  
17. Search — global search  
18. Activity Logs — audit trail  
19. Security — overview + hardening baseline  
20. REST API — `/api/v1/*` + API keys  

## Public API

```
GET  /api/v1/pages
GET  /api/v1/posts
GET  /api/v1/menus/:location
GET  /api/v1/settings
POST /api/v1/forms/:slug/submit
```

Optional header: `X-API-Key: sk_...`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + admin concurrently |
| `npm run build` | Build admin UI → `tripix-html/admin/` |
| `npm start` | Production API (serves `/admin` if built) |
| `npm run db:setup` | generate + push + seed |
| `npm run db:seed` | re-seed |

## Notes

- Password reset emails are **logged to the API console** in development (no SMTP yet).
- Analytics are **mock snapshots** until a provider is connected.
- **Publish to website** (SEO screen) writes `sitemap.xml`, `robots.txt`, and `admin/content-pack.json` into `../tripix-html`.
- Website admin icon: local → `http://localhost:5173/admin/`; production → `/admin/`.
