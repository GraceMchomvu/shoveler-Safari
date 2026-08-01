"""Pass 3: restore footer col close, fix popup search, contact form submit."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
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

CONTACT_FORM = '''              <form
                action="#"
                method="post"
                class="form-style1"
                id="shoveler-contact-form"
              >'''


def process(html: str, name: str) -> str:
    # Restore missing column close before Instagram/Safari Moments widget
    html = re.sub(
        r"(</div>\s*</div>\s*)</div>\s*(<div class=\"col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3\">)",
        r"\1\n            </div>\n            \2",
        html,
        count=1,
    )
    # If already correct (has </div>\n            <div class="col-md-6), don't double
    # Undo accidental double close
    html = html.replace(
        """            </div>
            </div>
            </div>
            <div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">""",
        """            </div>
            </div>
            <div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">""",
    )

    # Popup search → trips
    html = html.replace(
        """    <div class="popup-search-box">
      <button class="searchClose"><i class="fal fa-times"></i></button>
      <form action="#">
        <input
          type="text"
          class="border-theme"
          placeholder="What are you looking for"
        />
        <button type="submit"><i class="fal fa-search"></i></button>
      </form>
    </div>""",
        """    <div class="popup-search-box">
      <button class="searchClose"><i class="fal fa-times"></i></button>
      <form action="trips.html" method="get">
        <input
          type="text"
          name="q"
          class="border-theme"
          placeholder="Search safaris, destinations..."
        />
        <button type="submit"><i class="fal fa-search"></i></button>
      </form>
    </div>""",
    )
    # Shorter variant
    html = re.sub(
        r'(<div class="popup-search-box">[\s\S]*?<form )action="#">',
        r'\1action="trips.html" method="get">',
        html,
    )

    if name == "contact.html":
        html = re.sub(
            r'<form\s+action="#" method="get" onsubmit="window\.open\([^>]+class="form-style1"\s*>',
            CONTACT_FORM,
            html,
        )
        # Also if still one-line broken form tag
        html = re.sub(
            r'<form\s*\n\s*action="#" method="get" onsubmit="[^"]*"\s*\n\s*class="form-style1"\s*>',
            CONTACT_FORM,
            html,
        )

    return html


def main() -> None:
    for name in PAGES:
        path = BASE / name
        original = path.read_text(encoding="utf-8")
        updated = process(original, name)
        # Verify footer pattern once more with a safer approach
        if 'order-md-2 order-lg-3">' in updated:
            # Ensure useful-links col closes before moments col
            marker = '<div class="col-md-6 col-lg-3 col-xl-3 order-md-2 order-lg-3">'
            idx = updated.find(marker)
            if idx > 0:
                before = updated[max(0, idx - 80) : idx]
                if before.rstrip().endswith("</div>") and before.count("</div>") >= 1:
                    # check if we have widgets close + col close
                    snippet = updated[max(0, idx - 120) : idx + 10]
                    if snippet.count("</div>") < 2:
                        updated = updated[:idx] + "            </div>\n            " + updated[idx:]

        if updated != original:
            path.write_text(updated, encoding="utf-8")
            print("fixed", name)
        else:
            print("ok", name)


if __name__ == "__main__":
    main()
