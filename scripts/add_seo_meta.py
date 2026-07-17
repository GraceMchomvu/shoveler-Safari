from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
base = "https://www.shovelersafari.com"

canon = {
    "index.html": f"{base}/",
    "about.html": f"{base}/about.html",
    "trips.html": f"{base}/trips.html",
    "destinations.html": f"{base}/destinations.html",
    "destination-details.html": f"{base}/destination-details.html",
    "activities.html": f"{base}/activities.html",
    "blog.html": f"{base}/blog.html",
    "blog-details.html": f"{base}/blog-details.html",
    "faq.html": f"{base}/faq.html",
    "contact.html": f"{base}/contact.html",
}

skip = {"index-2.html", "index-3.html", "index-1-backup.html"}

for path in root.glob("*.html"):
    name = path.name
    text = path.read_text(encoding="utf-8")
    orig = text

    if name == "404.html" or name in skip:
        text = re.sub(
            r'<meta\s+name="robots"\s+content="INDEX,FOLLOW"\s*/>',
            '<meta name="robots" content="noindex, follow" />',
            text,
            count=1,
            flags=re.I,
        )
    elif name in canon:
        url = canon[name]
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
        if name == "index.html" and 'rel="sitemap"' not in text:
            text = re.sub(
                r'(<link rel="canonical"[^>]*>)',
                rf'\1\n    <link rel="sitemap" type="application/xml" title="Sitemap" href="{base}/sitemap.xml" />',
                text,
                count=1,
            )

    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("updated", name)
    else:
        print("unchanged", name)
