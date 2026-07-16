"""Remove logo background and download free Unsplash safari photos."""
from __future__ import annotations

import io
import urllib.request
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parents[1]
IMG = BASE / "assets" / "img"

# Unsplash free-license wildlife / Tanzania safari photos (direct CDN)
# Format: unsplash photo IDs with crop params
DOWNLOADS: dict[str, str] = {
    # Hero background — Serengeti sunset plains
    "hero/hero-layout3-bg.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1920&q=80",
    # Also cover layout1 if used
    "hero/hero-layout1-bg.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1920&q=80",
    # Offers — Serengeti, Ngorongoro-style crater/wildlife, elephants
    "offer/offer-img-1-1.png": "https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=900&q=80",
    "offer/offer-img-1-2.png": "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=900&q=80",
    "offer/offer-img-1-3.png": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=900&q=80",
    # About
    "about/about-thumb.png": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1000&q=80",
    # Tour packages
    "tour-packages/tour-package-1-1.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-1-2.png": "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-1-3.png": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    # Destinations
    "destination/destination-1-1.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    "destination/destination-1-2.png": "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=800&q=80",
    "destination/destination-1-3.jpg": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=800&q=80",
    "destination/destination-1-4.jpg": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80",
    # Destination gallery
    "destination-galler/destination-gallery-1-1.png": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80",
    "destination-galler/destination-gallery-1-2.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    "destination-galler/destination-gallery-1-3.png": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    "destination-galler/destination-gallery-1-4.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80",
    "destination-galler/destination-gallery-1-5.png": "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=800&q=80",
    # Extra tour package variants used on trips page
    "tour-packages/tour-package-2-1.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-2-2.png": "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-2-3.png": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-3-1.png": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-3-2.png": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-3-3.png": "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-3-4.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-3-5.png": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80",
    "tour-packages/tour-package-3-6.png": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80",
    # Destinations thumbs
    "destination/destination-2-1.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    "destination/destination-2-2.png": "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=800&q=80",
    "destination/destination-2-3.png": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=800&q=80",
    "destination/destination-single-1.png": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80",
    "destination/destinations-thumb-2-1.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=700&q=80",
    "destination/destinations-thumb-2-2.png": "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=700&q=80",
    "destination/destinations-thumb-2-3.png": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=700&q=80",
    "destination/destinations-thumb-2-4.png": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=700&q=80",
    "destination/destinations-thumb-2-5.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=700&q=80",
    "destination/destinations-thumb-2-6.png": "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=700&q=80",
    # Activities thumbs
    "activities/activities-thumb-1-1.png": "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80",
    "activities/activities-thumb-1-2.png": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    "activities/activities-thumb-1-3.png": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=800&q=80",
    "activities/activities-thumb-1-4.png": "https://images.unsplash.com/photo-1534567110243-8875d64ca8ff?auto=format&fit=crop&w=800&q=80",
    "activities/activities-thumb-1-5.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80",
    # Page banners / backgrounds
    "bg/breadcrumb-bg.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1920&q=80",
    "bg/breadcrumb-bg-2.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1920&q=80",
    "bg/breadcrumb-bg-3.png": "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1920&q=80",
    "bg/destination.png": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=70",
    "bg/offer-bg.png": "https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1600&q=70",
    "bg/testimonial-bg.png": "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=70",
    "hero/hero-layout2-bg.png": "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1920&q=80",
}


def remove_logo_background(src: Path, dest: Path, threshold: int = 228) -> None:
    """Make near-cream / near-white pixels transparent using luminance + corner flood."""
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    def is_bg(r: int, g: int, b: int) -> bool:
        # Cream / off-white / light gray backgrounds
        if r >= threshold and g >= threshold - 8 and b >= threshold - 18:
            if abs(r - g) < 28 and abs(g - b) < 32:
                return True
        if r > 248 and g > 245 and b > 235:
            return True
        # warm paper cream
        if r > 240 and g > 232 and b > 215 and (r + g + b) / 3 > 235:
            return True
        return False

    # Flood-fill from edges for contiguous background
    visited = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = pixels[x, y]
        if not is_bg(r, g, b):
            continue
        pixels[x, y] = (r, g, b, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    # Second pass: any remaining near-white islands that are mostly bg-like
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a and is_bg(r, g, b) and (r + g + b) / 3 >= 242:
                pixels[x, y] = (r, g, b, 0)

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG")
    print(f"Logo transparent -> {dest}")


def download_to(path: Path, url: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; ShovelerSafariSite/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")
    # Keep original extension intent; always save as PNG if path ends with png else JPEG
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        img.save(path, "JPEG", quality=85, optimize=True)
    else:
        img.save(path, "PNG", optimize=True)
    print(f"Saved {path.name} ({path.stat().st_size // 1024} KB) from Unsplash")


def main() -> None:
    logo_src = IMG / "shoveler-logo.png"
    logo_bak = IMG / "shoveler-logo-original.png"
    if not logo_bak.exists():
        # Fall back to current logo
        if logo_src.exists():
            logo_bak.write_bytes(logo_src.read_bytes())
    remove_logo_background(logo_bak, logo_src, threshold=228)

    fav = IMG / "favicons" / "favicon-32x32.png"
    if fav.parent.exists():
        logo = Image.open(logo_src).convert("RGBA")
        logo.thumbnail((64, 64), Image.Resampling.LANCZOS)
        logo.save(fav, "PNG")

    for rel, url in DOWNLOADS.items():
        out = IMG / rel
        try:
            download_to(out, url)
        except Exception as exc:  # noqa: BLE001
            print(f"FAILED {rel}: {exc}")


if __name__ == "__main__":
    main()
