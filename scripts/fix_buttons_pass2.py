"""Pass 2: footer structure, fab # links, contact form action, newsletter."""
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


def process(html: str, name: str) -> str:
    html = html.replace(
        """                </div>

              </div>
            </div>
            </div>
            <div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">""",
        """                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">""",
    )
    html = re.sub(
        r"(</div>\s*</div>\s*</div>)\s*</div>\s*(<div class=\"col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3\">)",
        r"\1\n            \2",
        html,
        count=1,
    )

    html = re.sub(
        r'<a href="#">(\s*<i class="fab )',
        f'<a href="{WA}" target="_blank" rel="noopener">\\1',
        html,
    )
    html = re.sub(
        r'<a href="#">(\s*<i class="fa-brands )',
        f'<a href="{WA}" target="_blank" rel="noopener">\\1',
        html,
    )

    # Newsletter / footer subscribe forms that still POST to WhatsApp
    html = re.sub(
        r'action="https://wa\.me/255783591810[^"]*" method="post" enctype="text/plain"',
        f'action="#" method="get" onsubmit="window.open(\'{WA}\',\'_blank\');return false;"',
        html,
    )

    if name == "contact.html":
        html = html.replace(
            f'action="{WA}" method="post" enctype="text/plain"\n                class="form-style1"',
            'action="#" method="post"\n                class="form-style1"',
        )
        # If action already became the onsubmit form for contact form, restore contact form
        html = re.sub(
            r'<form\s+action="#" method="get" onsubmit="window\.open\([^\"]+\"\);\s*return false;"\s*class="form-style1"',
            '<form action="#" method="post" class="form-style1"',
            html,
        )
        html = html.replace(
            f'<a href="{WA}"><i class="fa-brands fa-linkedin-in"></i></a>',
            '<a href="mailto:shovelersafari@gmail.com" aria-label="Email"><i class="fa-solid fa-envelope"></i></a>',
        )
        html = html.replace(
            f'<a href="{WA}"><i class="fa-brands fa-vimeo-v"></i></a>',
            f'<a href="{WA}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>',
        )

    return html


def main() -> None:
    for name in PAGES:
        path = BASE / name
        if not path.exists():
            print("missing", name)
            continue
        original = path.read_text(encoding="utf-8")
        updated = process(original, name)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print("fixed", name)
        else:
            print("ok", name)


if __name__ == "__main__":
    main()
