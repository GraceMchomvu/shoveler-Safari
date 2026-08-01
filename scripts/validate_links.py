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
]


def main() -> None:
    existing = {p.name for p in BASE.glob("*.html")}
    issues: list[tuple[str, str, str]] = []
    for name in PAGES:
        text = (BASE / name).read_text(encoding="utf-8")
        for m in re.finditer(r"""href=["']([^"']+)["']""", text):
            href = m.group(1)
            ctx = text[max(0, m.start() - 90) : m.end() + 50]
            if href in ("#", "ht#") or href.startswith("ht#"):
                if "scrollToTop" not in ctx:
                    issues.append((name, href, "dead hash"))
                continue
            if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:", "data:", "#")):
                continue
            if "assets/" in href:
                continue
            path = href.split("#")[0].split("?")[0].lstrip("./")
            if not path:
                continue
            if path not in existing and not (BASE / path).exists():
                issues.append((name, href, "missing file"))

    print(f"ISSUES {len(issues)}")
    for item in issues:
        print(item)


if __name__ == "__main__":
    main()
