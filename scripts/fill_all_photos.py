"""Fill every photo content slot with Unsplash safari images."""
from __future__ import annotations

import io
import random
import urllib.request
from pathlib import Path

from PIL import Image

IMG = Path(__file__).resolve().parents[1] / "assets" / "img"

# Diverse free Unsplash safari / Tanzania / wildlife / beach photos
POOL = [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1456926636814-0c8c4a0c42e5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1474511320723-9a56873571b5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1469474960810-2d6e4c4f4c2d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519046904884-4515b22ba5bb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535338454770-8be927b5a00b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552410260-0fd5b615a8a0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516420845333-4d8d4f5a8e4b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1621416894563-c5ef0d4c0e0e?auto=format&fit=crop&w=1200&q=80",
]

# Prefer reliable known-good IDs; fall back if some fail
RELIABLE = [
    "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1474511320723-9a56873571b5?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1519046904884-4515b22ba5bb?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1552410260-0fd5b615a8a0?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1456926636814-0c8c4a0c42e5?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1535338454770-8be927b5a00b?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=1400&q=80",
]

SKIP_DIR_NAMES = {"icons", "favicons", "partner"}
SKIP_NAME_PARTS = (
    "shap",
    "shape",
    "wave",
    "mask",
    "wings",
    "logo",
    "shoveler",
    "svg",
    "icon",
    "eiffel",
    "ballon",
    "cloud",
    "owl",
    "rope",
    "rops",
    "tree.png",
    "map.png",
    "mountan",
    "plain-",
    "hero-sun",
    "offer-arrow",
    "offers-img",
    "choos-us-icon",
    "destination-icon",
    "award-icon",
    "award-box",
    "awards-google",
)

# Always fill these dirs fully (content photos)
FORCE_DIRS = {
    "blog",
    "choos-us",
    "exclusive-gallery",
    "guides",
    "instagram",
    "instagram-post",
    "testimonial",
    "top-place",
    "services",
    "counter",
    "hero",  # booking-avatar
}

# Size threshold: replace if smaller than this (KB) OR in FORCE_DIRS
MAX_KEEP_KB = 40


def fetch(url: str) -> Image.Image | None:
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "Mozilla/5.0 (compatible; ShovelerSafari/1.0)"}
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = resp.read()
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        print(f"  fail {url[:60]}... ({exc})")
        return None


def should_skip(path: Path) -> bool:
    rel = path.relative_to(IMG).as_posix().lower()
    name = path.name.lower()
    if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        return True
    if any(part in rel for part in SKIP_DIR_NAMES):
        # still fill partner png? skip logos
        return True
    if "icons/" in rel:
        return True
    if any(s in name for s in SKIP_NAME_PARTS):
        return True
    if "shoveler-logo" in name:
        return True
    if name.endswith(".svg"):
        return True
    return False


def targets() -> list[Path]:
    out: list[Path] = []
    for path in IMG.rglob("*"):
        if not path.is_file():
            continue
        if should_skip(path):
            continue
        rel_parts = path.relative_to(IMG).parts
        top = rel_parts[0] if rel_parts else ""
        size_kb = path.stat().st_size / 1024
        force = top in FORCE_DIRS or top.startswith("destination")
        # destination already mostly filled; still fill tiny leftover thumbs
        if top == "destination" and size_kb >= MAX_KEEP_KB:
            continue
        if top in {"about", "activities", "tour-packages", "destination-galler", "offer"} and size_kb >= MAX_KEEP_KB:
            continue
        if top == "hero" and "bg" in path.name and size_kb >= MAX_KEEP_KB:
            continue
        if top == "bg" and size_kb >= 100:
            # keep large already-filled backgrounds; replace small bg photos
            continue
        if force or size_kb < MAX_KEEP_KB:
            # Don't replace decorative tiny shapes already skipped
            out.append(path)
    return sorted(out)


def save_photo(img: Image.Image, dest: Path, max_side: int = 1200) -> None:
    work = img.copy()
    work.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.suffix.lower() in {".jpg", ".jpeg"}:
        work.save(dest, "JPEG", quality=85, optimize=True)
    else:
        work.save(dest, "PNG", optimize=True)


def main() -> None:
    files = targets()
    print(f"Slots to fill: {len(files)}")

    # Download a cache of images
    cache: list[Image.Image] = []
    for url in RELIABLE:
        im = fetch(url)
        if im:
            cache.append(im)
            print(f"cached ({len(cache)}) {url.split('photo-')[1][:20]}")
        if len(cache) >= 22:
            break

    if not cache:
        raise SystemExit("No images downloaded")

    rng = random.Random(42)
    for i, path in enumerate(files):
        src = cache[i % len(cache)]
        # slight crop variety
        w, h = src.size
        if w > 400 and h > 400:
            left = rng.randint(0, max(0, w // 10))
            top = rng.randint(0, max(0, h // 10))
            right = w - rng.randint(0, max(0, w // 10))
            bottom = h - rng.randint(0, max(0, h // 10))
            cropped = src.crop((left, top, right, bottom))
        else:
            cropped = src

        # Avatars / small portraits -> square crop center
        name = path.name.lower()
        if any(k in name for k in ("avatar", "author", "comment", "guide", "testimonial", "booking")):
            side = min(cropped.size)
            cx, cy = cropped.size[0] // 2, cropped.size[1] // 2
            half = side // 2
            cropped = cropped.crop((cx - half, cy - half, cx + half, cy + half))
            save_photo(cropped, path, max_side=600)
        elif "blog" in path.as_posix() or "insta" in name or "top-place" in path.as_posix() or "exclusive" in path.as_posix():
            save_photo(cropped, path, max_side=1000)
        elif "bg" in name or "breadcrumb" in name or "cta" in name:
            save_photo(cropped, path, max_side=1920)
        else:
            save_photo(cropped, path, max_side=1200)
        print(f"filled {path.relative_to(IMG)} ({path.stat().st_size // 1024}KB)")

    print(f"Done. Filled {len(files)} slots with {len(cache)} source photos.")


if __name__ == "__main__":
    main()
