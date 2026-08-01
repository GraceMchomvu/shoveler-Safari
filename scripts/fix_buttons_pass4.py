"""Pass 4: footer close, blog categories, comment→WhatsApp."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
WA = "https://wa.me/255783591810?text=Hello%20SHOVELER%20SAFARI%2C%20I%20would%20like%20a%20safari%20quote."
PAGES = [
    "index.html",
    "about.html",
    "trips.html",
    "destinations.html",
    "activities.html",
    "contact.html",
    "faq.html",
    "blog.html",
    "blog-details.html",
    "404.html",
    "index-3.html",
]

CATEGORIES = """                  <ul class="custom-ul">
                    <li>
                      <a href="trips.html">Safari Packages</a>
                      <span>06</span>
                    </li>
                    <li>
                      <a href="destinations.html">Destinations</a>
                      <span>05</span>
                    </li>
                    <li>
                      <a href="activities.html">Birdwatching</a>
                      <span>04</span>
                    </li>
                    <li>
                      <a href="activities.html">Game Drives</a>
                      <span>08</span>
                    </li>
                    <li>
                      <a href="destinations.html#zanzibar">Zanzibar</a>
                      <span>03</span>
                    </li>
                    <li>
                      <a href="faq.html">Travel Tips</a>
                      <span>12</span>
                    </li>
                  </ul>"""

TAGS = """                  <div class="tagcloud">
                    <a href="destinations.html#serengeti">Serengeti</a>
                    <a href="destinations.html#ngorongoro">Ngorongoro</a>
                    <a href="destinations.html#tarangire">Tarangire</a>
                    <a href="trips.html">Safari</a>
                    <a href="activities.html#birdwatching">Birding</a>
                    <a href="activities.html#photography">Photography</a>
                    <a href="destinations.html#zanzibar">Zanzibar</a>
                  </div>"""


def process(html: str, name: str) -> str:
    html = html.replace(
        """                </div>
              
            </div>
            <div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">""",
        """                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">""",
    )

    if name in ("blog.html", "blog-details.html"):
        html = re.sub(
            r'(<div class="widget widget_categories">\s*<h5 class="widget_title title-shep">Categories</h5>\s*)'
            r"<ul class=\"custom-ul\">[\s\S]*?</ul>",
            r"\1" + CATEGORIES,
            html,
            count=1,
        )
        html = re.sub(
            r'(<div class="widget widget_meta">\s*<h5 class="widget_title title-shep">Tags</h5>\s*)'
            r'<div class="tagcloud">[\s\S]*?</div>',
            r"\1" + TAGS,
            html,
            count=1,
        )

    if name == "blog-details.html":
        # Reply links → WhatsApp
        html = re.sub(
            r'<a href="blog-details\.html"[^>]*>\s*Replay',
            f'<a href="{WA}" target="_blank" rel="noopener">Reply',
            html,
        )
        # Wrap comment UI as WhatsApp CTA
        html = re.sub(
            r'<button class="vs-btn">Post Comment</button>',
            f'<a class="vs-btn" href="{WA}" target="_blank" rel="noopener">Send via WhatsApp</a>',
            html,
        )
        # Make comment fields optional visual only — disable dead post
        html = html.replace(
            '<div class="vs-comment-form">',
            '<div class="vs-comment-form" data-shoveler-whatsapp-comment>',
        )

    # WhatsApp footer links should open new tab
    html = html.replace(
        f'<a href="{WA}">\n                            <i class="fa-solid fa-angles-right"></i>\n                            WhatsApp Quote',
        f'<a href="{WA}" target="_blank" rel="noopener">\n                            <i class="fa-solid fa-angles-right"></i>\n                            WhatsApp Quote',
    )

    return html


def main() -> None:
    for name in PAGES:
        path = BASE / name
        original = path.read_text(encoding="utf-8")
        updated = process(original, name)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print("fixed", name)
        else:
            print("ok", name)


if __name__ == "__main__":
    main()
