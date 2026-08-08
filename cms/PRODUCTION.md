# Production always-on (PC can be off)

## Stack
- Website: Cloudflare Pages ? www.shovelersafari.com
- CMS API: Render ? https://shoveler-safari.onrender.com
- Database: Neon Postgres (forced in docker-boot; survives Render sleep)

## Admin login
- URL: https://www.shovelersafari.com/admin/
- Username: admin
- Password: SafariAdmin2026!

## Notes
- First request after idle can take 30–60s (Render free wake)
- Admin password is pinned once in Neon (setting admin_password_pinned_v2)
- Do NOT set CMS_API_ORIGIN to trycloudflare tunnels
