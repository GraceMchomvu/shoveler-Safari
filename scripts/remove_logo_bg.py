from PIL import Image

src = r"c:\Users\Grace Mchomvu\Downloads\tripix-tours-travels-html-template-2025-07-02-12-09-12-utc\SHOVELER LOGO.png"
out = r"c:\Users\Grace Mchomvu\Downloads\tripix-tours-travels-html-template-2025-07-02-12-09-12-utc\tripix-html\assets\img\shoveler-logo.png"

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

samples = [
    pixels[2, 2],
    pixels[w - 3, 2],
    pixels[2, h - 3],
    pixels[w - 3, h - 3],
    pixels[w // 2, 2],
    pixels[2, h // 2],
]
br = sum(p[0] for p in samples) // len(samples)
bg = sum(p[1] for p in samples) // len(samples)
bb = sum(p[2] for p in samples) // len(samples)
print(f"bg sample RGB=({br},{bg},{bb}) size={w}x{h}")

THRESH = 42
SOFT = 18

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        dist = ((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2) ** 0.5
        if dist < THRESH:
            pixels[x, y] = (r, g, b, 0)
        elif dist < THRESH + SOFT:
            t = (dist - THRESH) / SOFT
            pixels[x, y] = (r, g, b, int(a * t))

bbox = img.getbbox()
if bbox:
    pad = 12
    l, t, r, btm = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(w, r + pad)
    btm = min(h, btm + pad)
    img = img.crop((l, t, r, btm))

img.save(out, "PNG", optimize=True)
print(f"saved {out} -> {img.size}")
