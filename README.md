# Northern Shoveler Adventure

Public website (Cloudflare Pages root) + custom CMS in `cms/`.

## Website
Static files at repo root — https://www.shovelersafari.com

## CMS
See [cms/README.md](cms/README.md)

```bash
cd cms
npm install
npm install --prefix server
npm install --prefix client
npm run db:setup
npm run dev
```

Admin: http://localhost:5173/admin/
