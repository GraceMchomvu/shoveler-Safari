# Production always-on (PC can be off)

## Stack
- Website: Cloudflare Pages → www.shovelersafari.com
- CMS API: Render → https://shoveler-safari.onrender.com
- Database: Neon Postgres (set `DATABASE_URL` in Render Environment)

## Admin login
- URL: https://www.shovelersafari.com/admin/
- Username: `admin`
- Password: value of `SEED_ADMIN_PASSWORD` on Render (default used in local docs only: ask your deployer)

## Render Environment (set in dashboard — do not commit secrets)
- `DATABASE_URL` — Neon connection string
- `JWT_SECRET` — long random string (≥32 chars)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_PHONE`
- `CLIENT_ORIGIN` / `SITE_ORIGIN` = `https://www.shovelersafari.com`
- `COOKIE_SECURE=true`, `TRUST_PROXY=1`
- Optional SMTP_* for email password reset

## Cloudflare Pages
- Secret `CMS_API_ORIGIN` = `https://shoveler-safari.onrender.com`

## Security
- Never commit Postgres URIs, JWT secrets, or SMTP passwords to GitHub.
- If GitGuardian alerts, rotate the Neon password and JWT_SECRET immediately.
