"""Fix Google Coverage issues: point sitemap/canonicals/links at non-.html URLs."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
base = "https://www.shovelersafari.com"

pages = [
    "about",
    "trips",
    "destinations",
    "destination-details",
    "activities",
    "blog",
    "blog-details",
    "faq",
    "contact",
]

# --- sitemap ---
sitemap_urls = [f"{base}/"] + [f"{base}/{p}" for p in pages]
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>']
sitemap.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for i, loc in enumerate(sitemap_urls):
    pri = "1.0" if i == 0 else ("0.9" if i < 4 else "0.8" if i < 8 else "0.7")
    freq = "weekly" if i in (0, 2, 3, 6) else "monthly"
    sitemap.append("  <url>")
    sitemap.append(f"    <loc>{loc}</loc>")
    sitemap.append(f"    <changefreq>{freq}</changefreq>")
    sitemap.append(f"    <priority>{pri}</priority>")
    sitemap.append("  </url>")
sitemap.append("</urlset>")
(root / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
print("updated sitemap.xml")

# --- redirects: apex -> www ---
(root / "_redirects").write_text(
    "\n".join(
        [
            "# Prefer www as the canonical host",
            "https://shovelersafari.com/* https://www.shovelersafari.com/:splat 301",
            "http://shovelersafari.com/* https://www.shovelersafari.com/:splat 301",
            "http://www.shovelersafari.com/* https://www.shovelersafari.com/:splat 301",
            "",
        ]
    ),
    encoding="utf-8",
)
print("wrote _redirects")

# --- HTML pages ---
skip = {"index-1-backup.html", "index-2.html", "index-3.html"}
canon_map = {
    "index.html": f"{base}/",
    "about.html": f"{base}/about",
    "trips.html": f"{base}/trips",
    "destinations.html": f"{base}/destinations",
    "destination-details.html": f"{base}/destination-details",
    "activities.html": f"{base}/activities",
    "blog.html": f"{base}/blog",
    "blog-details.html": f"{base}/blog-details",
    "faq.html": f"{base}/faq",
    "contact.html": f"{base}/contact",
    "404.html": f"{base}/",
}

# Longer names first so destination-details.html before destination.html issues
html_files = sorted(
    [p for p in pages],
    key=len,
    reverse=True,
)


def rewrite_links(text: str) -> str:
    # index.html (+ optional hash/query)
    text = re.sub(r'href="(?:\./)?index\.html(#[^"]*)?"', r'href="/\1"', text)
    text = re.sub(r"href='(?:\./)?index\.html(#[^']*)?'", r"href='/\1'", text)

    for name in html_files:
        # page.html, ./page.html, /page.html with optional hash
        text = re.sub(
            rf'href="(?:\./|/)?{re.escape(name)}\.html(#[^"]*)?"',
            rf'href="/{name}\1"',
            text,
        )
        text = re.sub(
            rf"href='(?:\./|/)?{re.escape(name)}\.html(#[^']*)?'",
            rf"href='/{name}\1'",
            text,
        )
    return text


for path in root.glob("*.html"):
    if path.name in skip:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text

    # canonical
    if path.name in canon_map:
        url = canon_map[path.name]
        if re.search(r'rel=["\']canonical["\']', text, re.I):
            text = re.sub(
                r'<link\s+rel=["\']canonical["\'][^>]*>',
                f'<link rel="canonical" href="{url}" />',
                text,
                count=1,
                flags=re.I,
            )
        else:
            text = re.sub(
                r'(<meta\s+name="robots"[^>]*>)',
                rf'\1\n    <link rel="canonical" href="{url}" />',
                text,
                count=1,
                flags=re.I,
            )

    text = rewrite_links(text)

    # sitemap link on homepage should stay
    if path.name == "index.html":
        text = text.replace(
            f"{base}/sitemap.xml",
            f"{base}/sitemap.xml",
        )

    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("updated", path.name)
    else:
        print("unchanged", path.name)

print("done")
