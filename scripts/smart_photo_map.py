"""
Remap site photos from ../photos with:
- no/low repetition (unique per page first, least-used globally)
- aspect-ratio-aware assignment + center-cropped web variants
"""
from __future__ import annotations

import re
import shutil
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PHOTOS_SRC = ROOT.parent / "photos"
DEST = ROOT / "assets" / "img" / "client"
WEB = "assets/img/client"

KEEP = (
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
)

ATTR_RE = re.compile(
    r'(?P<attr>src|data-bg-src|data-src)=(?P<q>["\'])(?P<path>(?:\./)?assets/img/[^"\']+|(?:https?://[^"\']+))(?P=q)',
    re.I,
)


@dataclass
class Photo:
    src: Path
    width: int
    height: int
    ar: float
    orient: str  # landscape | portrait | square


@dataclass
class Slot:
    file: Path
    start: int
    end: int
    attr: str
    quote: str
    path: str
    kind: str  # wide | card | portrait | square | feature


def classify_orient(ar: float) -> str:
    if ar >= 1.15:
        return "landscape"
    if ar <= 0.87:
        return "portrait"
    return "square"


def load_photos() -> list[Photo]:
    files = sorted(
        [
            p
            for p in PHOTOS_SRC.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        ],
        key=lambda p: p.name.lower(),
    )
    out: list[Photo] = []
    for p in files:
        with Image.open(p) as im:
            im = ImageOps.exif_transpose(im)
            w, h = im.size
        ar = w / h
        out.append(Photo(p, w, h, ar, classify_orient(ar)))
    return out


def center_crop(im: Image.Image, target_ar: float) -> Image.Image:
    w, h = im.size
    ar = w / h
    if abs(ar - target_ar) < 0.02:
        return im
    if ar > target_ar:
        # too wide
        nw = int(h * target_ar)
        left = (w - nw) // 2
        return im.crop((left, 0, left + nw, h))
    nh = int(w / target_ar)
    top = (h - nh) // 2
    return im.crop((0, top, w, top + nh))


def export_variant(photo: Photo, kind: str, index: int) -> str:
    """Create optimized cropped file; return web path."""
    specs = {
        "wide": (1920, 1080, 16 / 9),
        "card": (1400, 1050, 4 / 3),
        "portrait": (1000, 1500, 2 / 3),
        "square": (1000, 1000, 1.0),
        "feature": (1400, 1600, 7 / 8),  # tall-ish mosaic feature
    }
    tw, th, tar = specs[kind]
    name = f"{kind}-{index:02d}.jpg"
    dest = DEST / name
    with Image.open(photo.src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        im = center_crop(im, tar)
        im = ImageOps.fit(im, (tw, th), method=Image.Resampling.LANCZOS, centering=(0.5, 0.45))
        im.save(dest, "JPEG", quality=86, optimize=True, progressive=True)
    return f"{WEB}/{name}"


def is_keep(path: str) -> bool:
    low = path.lower().replace("\\", "/")
    if low.endswith(".svg"):
        return True
    if "/client/" in low:
        return False
    return any(f in low for f in KEEP)


def infer_kind(attr: str, path: str, context: str) -> str:
    low_ctx = context.lower()
    low_path = path.lower()
    if attr.lower() == "data-bg-src" or "hero" in low_ctx or "vs-cta" in low_ctx:
        return "wide"
    if "avatar" in low_ctx or "testimonial" in low_ctx or "author" in low_ctx:
        return "square"
    if "moments__feature" in low_ctx or "shoveler-moments__feature" in low_ctx:
        return "feature"
    if "moments__tile" in low_ctx or "shoveler-moments__tile" in low_ctx:
        return "portrait"
    if any(
        k in low_ctx or k in low_path
        for k in (
            "choose-us",
            "about-thumb",
            "team",
            "gallery-box",
            "exclusive",
        )
    ):
        # tall editorial side images prefer portrait when available
        if "choose-us" in low_ctx or "about" in low_path:
            return "portrait"
        return "card"
    if any(
        k in low_ctx or k in low_path
        for k in (
            "tour-package",
            "shoveler-pkg",
            "destination",
            "offer",
            "blog",
            "activit",
            "trip",
        )
    ):
        return "card"
    if "breadcrumb" in low_ctx:
        return "wide"
    return "card"


def collect_slots(html_files: list[Path]) -> list[Slot]:
    slots: list[Slot] = []
    for html in html_files:
        text = html.read_text(encoding="utf-8", errors="ignore")
        for m in ATTR_RE.finditer(text):
            path = m.group("path")
            if path.startswith("http"):
                # treat external as replaceable photo
                pass
            elif not path.lower().replace("\\", "/").lstrip("./").startswith("assets/img/"):
                continue
            elif is_keep(path):
                continue
            # context window
            start = max(0, m.start() - 280)
            end = min(len(text), m.end() + 80)
            ctx = text[start:end]
            kind = infer_kind(m.group("attr"), path, ctx)
            slots.append(
                Slot(
                    file=html,
                    start=m.start(),
                    end=m.end(),
                    attr=m.group("attr"),
                    quote=m.group("q"),
                    path=path,
                    kind=kind,
                )
            )
    return slots


def score_photo(photo: Photo, kind: str) -> float:
    """Higher is better fit."""
    ar = photo.ar
    if kind == "wide":
        # prefer ultra-wide / landscape
        if ar >= 1.7:
            return 100 + ar
        if ar >= 1.4:
            return 80 + ar
        if ar >= 1.15:
            return 40 + ar
        return 5
    if kind == "card":
        if 1.25 <= ar <= 1.7:
            return 100 - abs(ar - 1.4) * 10
        if ar >= 1.15:
            return 60
        if 0.9 <= ar <= 1.15:
            return 35
        return 10
    if kind == "portrait":
        if ar <= 0.7:
            return 100 - abs(ar - 0.66) * 20
        if ar <= 0.87:
            return 70
        return 8
    if kind == "square":
        if 0.85 <= ar <= 1.15:
            return 100
        if ar <= 0.87:
            return 70  # portrait crop to square ok
        return 40
    if kind == "feature":
        # tall mosaic panel ~ nearly square / slight portrait
        if 0.7 <= ar <= 1.2:
            return 90
        if ar >= 1.2:
            return 70
        return 50
    return 20


def assign(slots: list[Slot], photos: list[Photo]) -> dict[int, str]:
    """
    Return mapping slot_index -> web path.
    Prefer unique usage: within each page first, then globally least-used.
    """
    # Prepare variants lazily
    variant_cache: dict[tuple[int, str], str] = {}
    usage = defaultdict(int)  # photo index -> count
    page_used: dict[Path, set[int]] = defaultdict(set)
    result: dict[int, str] = {}

    # Process pages with more visible priority first
    priority = {
        "index.html": 0,
        "index-3.html": 1,
        "trips.html": 2,
        "destinations.html": 3,
        "about.html": 4,
        "activities.html": 5,
        "contact.html": 6,
        "blog.html": 7,
        "faq.html": 8,
    }

    indexed = list(enumerate(slots))
    indexed.sort(key=lambda iv: (priority.get(iv[1].file.name, 50), iv[1].file.name, iv[0]))

    for slot_i, slot in indexed:
        # candidate ranking
        candidates = []
        for pi, photo in enumerate(photos):
            s = score_photo(photo, slot.kind)
            # heavy penalty if already used on same page
            if pi in page_used[slot.file]:
                s -= 200
            # mild penalty for global reuse
            s -= usage[pi] * 25
            candidates.append((s, pi))
        candidates.sort(reverse=True)
        best_score, best_pi = candidates[0]

        # if best is a repeat on page and unused photos exist with ok score, force unused
        unused = [c for c in candidates if c[1] not in page_used[slot.file]]
        if unused and unused[0][0] > best_score - 50:
            best_score, best_pi = unused[0]

        key = (best_pi, slot.kind)
        if key not in variant_cache:
            variant_cache[key] = export_variant(photos[best_pi], slot.kind, len(variant_cache) + 1)
        result[slot_i] = variant_cache[key]
        usage[best_pi] += 1
        page_used[slot.file].add(best_pi)

    return result


def apply(slots: list[Slot], mapping: dict[int, str]) -> None:
    by_file: dict[Path, list[tuple[Slot, str]]] = defaultdict(list)
    for i, slot in enumerate(slots):
        by_file[slot.file].append((slot, mapping[i]))

    for html, items in by_file.items():
        text = html.read_text(encoding="utf-8", errors="ignore")
        # replace from end to start
        items.sort(key=lambda x: x[0].start, reverse=True)
        for slot, new_path in items:
            prefix = "./" if slot.path.startswith("./") else ""
            replacement = f'{slot.attr}={slot.quote}{prefix}{new_path}{slot.quote}'
            text = text[: slot.start] + replacement + text[slot.end :]
        html.write_text(text, encoding="utf-8")
        # report uniqueness
        used = [p for _, p in items]
        print(
            f"{html.name}: {len(items)} slots, "
            f"{len(set(used))} unique files, "
            f"kinds={sorted({s.kind for s,_ in items})}"
        )


def main() -> None:
    photos = load_photos()
    print(f"Loaded {len(photos)} photos")
    for p in photos:
        print(f"  {p.orient:9} {p.ar:.2f}  {p.src.name}")

    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir(parents=True)

    # Skip bulky backup clones for assignment quality on main pages; still update all html
    html_files = sorted(
        p
        for p in ROOT.glob("*.html")
        if p.name not in {"index-1-backup.html"}
    )
    slots = collect_slots(html_files)
    print(f"\nSlots to fill: {len(slots)}")
    kind_counts = defaultdict(int)
    for s in slots:
        kind_counts[s.kind] += 1
    print("By kind:", dict(kind_counts))

    mapping = assign(slots, photos)
    apply(slots, mapping)

    # page-level repetition report for index
    idx = [s for s in slots if s.file.name == "index.html"]
    paths = [mapping[i] for i, s in enumerate(slots) if s.file.name == "index.html"]
    print(f"\nindex.html unique images: {len(set(paths))} / {len(paths)}")
    print(f"Exported variants in {DEST} ({len(list(DEST.glob('*.jpg')))} files)")


if __name__ == "__main__":
    main()
