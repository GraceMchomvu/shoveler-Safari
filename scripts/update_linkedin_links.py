from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
LI = "https://tz.linkedin.com/in/shoveler-safari-44197b352"
FB = "https://www.facebook.com/share/1JNNS8g8yz/"
IG = "https://www.instagram.com/shovelersafari/"
WA = "https://wa.me/255783591810?text=Hello%20SHOVELER%20SAFARI%2C%20I%20would%20like%20a%20safari%20quote."

files = [f for f in root.glob("*.html") if "backup" not in f.name.lower()]
updated = []

# Match full anchor tags (opening through closing)
anchor_re = re.compile(r"<a\b[^>]*>.*?</a>", re.I | re.S)
href_re = re.compile(r'href="[^"]*"', re.I)


def icon_kind(inner: str) -> str | None:
    low = inner.lower()
    if "fa-linkedin" in low:
        return "linkedin"
    if "fa-facebook" in low:
        return "facebook"
    if "fa-instagram" in low:
        return "instagram"
    if "fa-x-twitter" in low or "fa-twitter" in low:
        return "twitter"
    return None


def target_for(kind: str, open_tag: str) -> str | None:
    # Do not rewrite LinkedIn share buttons
    if "share-offsite" in open_tag or "sharer/sharer" in open_tag:
        return None
    if kind == "linkedin":
        return LI
    if kind == "facebook":
        return FB
    if kind == "instagram":
        return IG
    if kind == "twitter":
        # No X/Twitter profile yet — keep WhatsApp (or restore if wrongly set to LI)
        return WA
    return None


for path in files:
    text = path.read_text(encoding="utf-8")
    changes = [0]

    def repl(m: re.Match) -> str:
        block = m.group(0)
        gt = block.find(">")
        if gt == -1:
            return block
        open_tag = block[: gt + 1]
        inner = block[gt + 1 :]
        kind = icon_kind(inner)
        if not kind:
            return block
        target = target_for(kind, open_tag)
        if not target:
            return block
        new_open, n = href_re.subn(f'href="{target}"', open_tag, count=1)
        if n and new_open != open_tag:
            changes[0] += 1
            return new_open + inner
        return block

    new_text = anchor_re.sub(repl, text)
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
        updated.append(f"{path.name} ({changes[0]})")

print(f"Updated: {len(updated)}")
for u in updated:
    print(f" - {u}")
