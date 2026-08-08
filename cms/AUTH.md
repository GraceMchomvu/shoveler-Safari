# Stable admin authentication

## How you sign in
- URL: https://www.shovelersafari.com/admin/
- Username: `admin`
- Password: `SafariAdmin2026!`
- Or email: `victorkiungai@gmail.com` + same password

## How recovery works
1. Open **Forgot password**
2. Enter admin email (or username `admin`)
3. Check email for a **6-digit code** + reset link
4. Set a new password (10+ chars, upper, lower, number)

Email uses Gmail SMTP env vars on the API (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`).

## What makes it stable
- Database: **Neon Postgres** (forced at boot — not Render temporary disk)
- Password is repaired at boot if wiped/broken
- Sessions use secure cookies + Bearer token fallback
- Cloudflare Pages proxies `/api` → Render (`CMS_API_ORIGIN`)

## One-time setup so deploys stick
Render free does not always auto-deploy. Easiest fix:

1. Render dashboard → **shoveler-safari** → **Settings** → **Deploy Hook** → copy URL  
2. GitHub → **shoveler-Safari** → **Settings** → **Secrets and variables** → **Actions**  
3. New secret: `RENDER_DEPLOY_HOOK_URL` = that URL  

After that, pushes to `cms/**` deploy automatically.
