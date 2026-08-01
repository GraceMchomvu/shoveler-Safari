from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
pat = re.compile(
    r'(?:src|data-bg-src|data-src|href)=["\']((?:\./)?assets/img/[^"\']+)["\']',
    re.I,
)
keep_frags = (
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
    "/client/",
)

old = {}
client = 0
kept = 0
for html in root.glob("*.html"):
    text = html.read_text(encoding="utf-8", errors="ignore")
    for m in pat.findall(text):
        p = m.replace("\\", "/").lstrip("./")
        low = p.lower()
        if "/client/" in low:
            client += 1
            continue
        if low.endswith(".svg") or any(f in low for f in keep_frags):
            kept += 1
            continue
        old[p] = old.get(p, 0) + 1

print("client refs", client)
print("kept UI refs", kept)
print("OLD photo refs remaining", len(old))
for k, v in sorted(old.items(), key=lambda x: -x[1])[:60]:
    print(f"{v:3} {k}")

# external
ext = 0
for html in root.glob("*.html"):
    text = html.read_text(encoding="utf-8", errors="ignore")
    ext += len(
        re.findall(
            r'(?:src|data-bg-src)=["\']https?://(?:images\.unsplash|cdn\.pixabay|images\.pexels)',
            text,
            re.I,
        )
    )
print("external photo refs", ext)
