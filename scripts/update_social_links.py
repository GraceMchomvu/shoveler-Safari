from pathlib import Path

root = Path(__file__).resolve().parent.parent
FB = "https://www.facebook.com/share/1JNNS8g8yz/"
IG = "https://www.instagram.com/shovelersafari/"
WA = "https://wa.me/255783591810?text=Hello%20SHOVELER%20SAFARI%2C%20I%20would%20like%20a%20safari%20quote."

files = [f for f in root.glob("*.html") if "backup" not in f.name.lower()]
updated = []

for path in files:
    text = path.read_text(encoding="utf-8")
    orig = text

    text = text.replace('href="https://www.facebook.com/"', f'href="{FB}"')
    text = text.replace('href="https://www.instagram.com/"', f'href="{IG}"')

    parts = []
    i = 0
    while True:
        start = text.find("<a ", i)
        if start == -1:
            parts.append(text[i:])
            break
        parts.append(text[i:start])
        gt = text.find(">", start)
        if gt == -1:
            parts.append(text[start:])
            break
        close = text.find("</a>", gt + 1)
        if close == -1:
            parts.append(text[start:])
            break
        block = text[start : close + 4]
        open_tag = text[start : gt + 1]
        inner = text[gt + 1 : close]
        if WA in open_tag:
            lower_inner = inner.lower()
            if "fa-facebook" in lower_inner:
                block = block.replace(WA, FB, 1)
            elif "fa-instagram" in lower_inner:
                block = block.replace(WA, IG, 1)
        parts.append(block)
        i = close + 4
    text = "".join(parts)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        updated.append(path.name)

print(f"Updated: {len(updated)}")
for n in updated:
    print(f" - {n}")
