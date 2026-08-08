# CRITICAL: Manual Deploy on Render (one click)

Render is NOT auto-deploying, so admin password keeps resetting on the old ephemeral DB.

1. Open: https://dashboard.render.com/
2. Open service: shoveler-safari
3. Click Manual Deploy ? Deploy latest commit
4. Wait until status is Live
5. Login: https://www.shovelersafari.com/admin/
   - username: admin
   - password: SafariAdmin2026!

After this deploy, docker-boot forces Neon Postgres and repairs the admin password on every start.
