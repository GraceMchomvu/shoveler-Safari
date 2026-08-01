from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

# Match package cards by alt text / unique title context → unique image
replacements = [
    # Homepage / index-3 multi-line img blocks
    (
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="3-Day Tarangire[^"]*")',
        r"\1assets/img/client/pkg-3day.jpg\2\3",
    ),
    (
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="7-Day Classic Serengeti[^"]*")',
        r"\1assets/img/client/pkg-7day.jpg\2\3",
    ),
    (
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="Birdwatching Focus Safari")',
        r"\1assets/img/client/pkg-birdwatching.jpg\2\3",
    ),
    (
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="Professional Photography Safari")',
        r"\1assets/img/client/pkg-photography.jpg\2\3",
    ),
    (
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="Family-Friendly Northern Circuit Safari")',
        r"\1assets/img/client/pkg-family.jpg\2\3",
    ),
    (
        r'(src=")(?:\./)?assets/img/client/[^"]+(")(\s*\n?\s*alt="Zanzibar Beach Add-on")',
        r"\1assets/img/client/pkg-zanzibar.jpg\2\3",
    ),
    # trips.html single-line
    (
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(" alt="3-Day Safari")',
        r"\1assets/img/client/pkg-3day.jpg\2",
    ),
    (
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(" alt="7-Day Safari")',
        r"\1assets/img/client/pkg-7day.jpg\2",
    ),
    (
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(" alt="Birdwatching")',
        r"\1assets/img/client/pkg-birdwatching.jpg\2",
    ),
    (
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(" alt="Photography")',
        r"\1assets/img/client/pkg-photography.jpg\2",
    ),
    (
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(" alt="Family Safari")',
        r"\1assets/img/client/pkg-family.jpg\2",
    ),
    (
        r'(<img src=")(?:\./)?assets/img/client/[^"]+(" alt="Zanzibar")',
        r"\1assets/img/client/pkg-zanzibar.jpg\2",
    ),
]

for name in ("index.html", "index-3.html", "trips.html"):
    path = root / name
    text = path.read_text(encoding="utf-8")
    orig = text
    for pat, repl in replacements:
        text = re.sub(pat, repl, text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print(f"updated {name}")
    else:
        print(f"no change {name}")

# Verify uniqueness of package media srcs on index
idx = (root / "index.html").read_text(encoding="utf-8")
block = re.search(
    r'tour-package-slider.*?Tour Package Area end',
    idx,
    re.S,
)
if block:
    srcs = re.findall(r'src="(assets/img/client/pkg-[^"]+)"', block.group(0))
    print("index package srcs:", srcs)
    print("unique:", len(srcs) == len(set(srcs)), f"({len(set(srcs))}/{len(srcs)})")
