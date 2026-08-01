from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

for name in ("index.html", "index-3.html", "trips.html", "destinations.html"):
    path = root / name
    t = path.read_text(encoding="utf-8")
    orig = t

    # Package thumbs with Zanzibar alt
    t = re.sub(
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="Zanzibar[^"]*")',
        r"\1assets/img/client/zanzibar-beach.jpg\2\3",
        t,
    )
    t = re.sub(
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(")(\s+alt="Zanzibar")',
        r"\1assets/img/client/zanzibar-beach.jpg\2\3",
        t,
    )

    # Destination mosaic/card
    t = re.sub(
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="Zanzibar Archipelago")',
        r"\1assets/img/client/zanzibar-dhow.jpg\2\3",
        t,
    )

    # Destinations page listing card
    t = re.sub(
        r'(<figure class="destination-thumb">\s*<img\s+src=")(?:\./)?assets/img/client/[^"]+("[^>]*>\s*</figure>\s*<div class="destination-content">\s*<h5 class="title">\s*<a href="destination-details\.html">Zanzibar</a>)',
        r"\1./assets/img/client/zanzibar-stonetown.jpg\2",
        t,
        flags=re.S,
    )

    # Blog thumb followed by Zanzibar Adventure title
    t = re.sub(
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="blog-thumb"[\s\S]{0,500}?Zanzibar Adventure)',
        r"\1./assets/img/client/zanzibar-beach-wide.jpg\2\3",
        t,
        count=1,
    )

    if t != orig:
        path.write_text(t, encoding="utf-8")
        print(f"updated {name}")
    else:
        print(f"no change {name}")
