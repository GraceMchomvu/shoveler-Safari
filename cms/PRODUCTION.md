# Production always-on (PC can be off)

## Stack
- Website: Cloudflare Pages → www.shovelersafari.com
- CMS API: Render free → https://shoveler-safari.onrender.com
- Database: Render-connected Postgres (Neon recommended)

## Admin login (live)
- URL: https://www.shovelersafari.com/admin/
- Username: `admin`
- Password: `SafariAdmin2026!`

## Cloudflare Pages (required)
Secret `CMS_API_ORIGIN` must be exactly:
`https://shoveler-safari.onrender.com`
(no trailing slash, never a trycloudflare.com tunnel)

## Render Environment (required)
DATABASE_URL=<Neon Postgres URL>
JWT_SECRET=16721ed6c057db74221bf93025f647bb655c037073c64724dc43edb998f747f98c465e977e05c302f99f422b69205f8f
NODE_ENV=production
CLIENT_ORIGIN=https://www.shovelersafari.com
SITE_ORIGIN=https://www.shovelersafari.com
COOKIE_SECURE=true
TRUST_PROXY=1
SEED_ADMIN_EMAIL=victorkiungai@gmail.com
SEED_ADMIN_PASSWORD=SafariAdmin2026!
SEED_ADMIN_PHONE=+255783591810

## Do not
- Do not point CMS_API_ORIGIN at trycloudflare.com (breaks when the PC is off)
- Do not use SQLite on Render free
- Do not leave FORCE_ADMIN_RESET=1 set on Render
