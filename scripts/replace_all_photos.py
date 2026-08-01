"""
Replace all website photos with files from ../photos.
Keeps logos, favicons, icons, shapes, SVGs, UI chrome images.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT.parent
PHOTOS_SRC = PROJECT / "photos"
DEST_DIR = ROOT / "assets" / "img" / "client"
WEB_PREFIX = "assets/img/client"

KEEP_FRAGMENTS = (
    "logo",
    "favicon",
    "icon",
    "shape",
    "svg",
    "flags",
    "payment",
    "partner",
    "breadcrumb-icon",
    "vs-breadcrumb",
    "loader",
    "map-marker",
    "client/",  # already replaced
)

IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".JPG", ".JPEG", ".PNG", ".WEBP")

# Assign semantic roles by cycling photos with intentional first picks
ROLE_ORDER = [
    "hero",
    "about",
    "pkg1",
    "pkg2",
    "pkg3",
    "pkg4",
    "pkg5",
    "pkg6",
    "dest1",
    "dest2",
    "dest3",
    "dest4",
    "dest5",
    "dest6",
    "moment1",
    "moment2",
    "moment3",
    "activity1",
    "activity2",
    "activity3",
    "blog1",
    "blog2",
    "blog3",
    "team",
]


def is_keep(path: str) -> bool:
    low = path.lower().replace("\\", "/")
    if low.endswith(".svg"):
        return True
    if "/client/" in low:
        return False
    return any(f in low for f in KEEP_FRAGMENTS)


def collect_photos() -> list[Path]:
    files = sorted(
        [
            p
            for p in PHOTOS_SRC.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        ],
        key=lambda p: p.name.lower(),
    )
    if not files:
        raise SystemExit(f"No photos found in {PHOTOS_SRC}")
    return files


def copy_photos(files: list[Path]) -> list[str]:
    if DEST_DIR.exists():
        shutil.rmtree(DEST_DIR)
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    web_paths: list[str] = []
    for i, src in enumerate(files, start=1):
        # short stable names
        name = f"photo-{i:02d}{src.suffix.lower()}"
        dest = DEST_DIR / name
        shutil.copy2(src, dest)
        web_paths.append(f"{WEB_PREFIX}/{name}")
        print(f"copied {src.name} -> {name}")
    return web_paths


def extract_img_refs(text: str) -> list[str]:
    """Find local asset image paths in HTML (src, data-bg-src, href, url())."""
    patterns = [
        r'(?:src|data-bg-src|data-src|href)=["\']((?:\./)?assets/img/[^"\']+)["\']',
        r'url\(["\']?((?:\./)?assets/img/[^"\')\s]+)["\']?\)',
    ]
    found: list[str] = []
    for pat in patterns:
        found.extend(re.findall(pat, text, flags=re.I))
    # also absolute-ish unsplash / external photo URLs in img src
    found.extend(
        re.findall(
            r'(?:src|data-bg-src|data-src)=["\'](https?://(?:images\.unsplash\.com|cdn\.pixabay\.com|images\.pexels\.com)[^"\']+)["\']',
            text,
            flags=re.I,
        )
    )
    return found


def normalize(path: str) -> str:
    return path.replace("\\", "/").lstrip("./")


def build_mapping(all_refs: set[str], pool: list[str]) -> dict[str, str]:
    """Map each unique photo ref to a client photo (cycled)."""
    replaceable = sorted(r for r in all_refs if not is_keep(r) and not r.startswith("http"))
    externals = sorted(r for r in all_refs if r.startswith("http"))
    mapping: dict[str, str] = {}
    n = len(pool)
    # Prefer role-ish ordering: heroes first
    def sort_key(p: str) -> tuple:
        low = p.lower()
        priority = 50
        if "hero" in low:
            priority = 0
        elif "about" in low:
            priority = 1
        elif "tour-package" in low or "package" in low:
            priority = 2
        elif "destination" in low:
            priority = 3
        elif "gallery" in low or "exclusive" in low or "moment" in low:
            priority = 4
        elif "activit" in low:
            priority = 5
        elif "blog" in low:
            priority = 6
        elif "team" in low or "testimonial" in low:
            priority = 7
        elif "offer" in low:
            priority = 8
        return (priority, low)

    ordered = sorted(replaceable, key=sort_key)
    for i, ref in enumerate(ordered):
        mapping[ref] = pool[i % n]
    for i, ref in enumerate(externals):
        mapping[ref] = pool[(len(ordered) + i) % n]
    return mapping


def apply_mapping(text: str, mapping: dict[str, str]) -> tuple[str, int]:
    # longest keys first to avoid partial issues
    keys = sorted(mapping.keys(), key=len, reverse=True)
    count = 0

    def repl_attr(m: re.Match) -> str:
        nonlocal count
        attr, quote, path = m.group(1), m.group(2), m.group(3)
        norm = normalize(path)
        # try exact and with/without ./
        target = mapping.get(norm) or mapping.get(path) or mapping.get("./" + norm)
        if not target and path.startswith("http"):
            target = mapping.get(path)
        if not target:
            return m.group(0)
        # preserve ./ prefix style if original used it
        prefix = "./" if path.startswith("./") else ""
        count += 1
        return f"{attr}={quote}{prefix}{target}{quote}"

    text2 = re.sub(
        r'(src|data-bg-src|data-src|href)=(["\'])([^"\']+)\2',
        repl_attr,
        text,
        flags=re.I,
    )

    def repl_url(m: re.Match) -> str:
        nonlocal count
        path = m.group(1)
        norm = normalize(path)
        target = mapping.get(norm) or mapping.get(path)
        if not target:
            return m.group(0)
        count += 1
        return f'url("{target}")'

    text2 = re.sub(
        r'url\(["\']?((?:\./)?assets/img/[^"\')\s]+)["\']?\)',
        repl_url,
        text2,
        flags=re.I,
    )
    return text2, count


def main() -> None:
    files = collect_photos()
    print(f"Found {len(files)} source photos")
    pool = copy_photos(files)

    html_files = sorted(ROOT.glob("*.html"))
    all_refs: set[str] = set()
    per_file: dict[Path, list[str]] = {}
    for html in html_files:
        text = html.read_text(encoding="utf-8", errors="ignore")
        refs = [normalize(r) if not r.startswith("http") else r for r in extract_img_refs(text)]
        per_file[html] = refs
        all_refs.update(refs)

    mapping = build_mapping(all_refs, pool)
    print(f"Unique replaceable mappings: {len(mapping)}")

    total = 0
    for html in html_files:
        text = html.read_text(encoding="utf-8", errors="ignore")
        new, n = apply_mapping(text, mapping)
        if n:
            html.write_text(new, encoding="utf-8")
            print(f"{html.name}: {n} replacements")
            total += n
        else:
            print(f"{html.name}: no changes")

    # Also fix CSS files that reference assets/img photos
    for css in (ROOT / "assets" / "css").glob("*.css"):
        if css.name.endswith(".min.css"):
            continue
        text = css.read_text(encoding="utf-8", errors="ignore")
        refs = extract_img_refs(text)
        if not refs:
            continue
        # extend mapping for any new css-only refs
        for r in refs:
            nr = normalize(r) if not r.startswith("http") else r
            if nr not in mapping and not is_keep(nr):
                mapping[nr] = pool[len(mapping) % len(pool)]
        new, n = apply_mapping(text, mapping)
        if n:
            css.write_text(new, encoding="utf-8")
            print(f"{css.name}: {n} replacements")
            total += n

    print(f"\nTOTAL replacements: {total}")
    print(f"Client photos folder: {DEST_DIR}")


if __name__ == "__main__":
    main()
