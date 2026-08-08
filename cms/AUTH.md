# Stable admin authentication

## How you sign in
- URL: https://www.shovelersafari.com/admin/
- Username: `admin` (or the admin email)
- Password: whatever is set in Render `SEED_ADMIN_PASSWORD` / last changed in Account settings

## How recovery works
1. Open **Forgot password**
2. Enter admin email (or username `admin`)
3. Check email for a **6-digit code** + reset link
4. Set a new password (10+ chars, upper, lower, number)

Requires SMTP env vars on the API (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`).

## What makes it stable
- Database: Neon Postgres via `DATABASE_URL` (Render Environment — never commit this)
- Fixed `JWT_SECRET` in Render Environment
- Sessions use secure cookies + Bearer token fallback
- Cloudflare Pages proxies `/api` → Render (`CMS_API_ORIGIN`)

## If a secret was leaked (GitGuardian)
1. Neon console → reset database password → update Render `DATABASE_URL`
2. Generate a new `JWT_SECRET` → update Render → redeploy
3. Confirm the secret no longer appears in the latest commit on GitHub
