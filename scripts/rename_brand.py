from pathlib import Path

root = Path(__file__).resolve().parent.parent
exts = {".html", ".xml", ".txt", ".json", ".css", ".js", ".md"}

replacements = [
    ("Hello%20SHOVELER%20SAFARI", "Hello%20NORTHERN%20SHOVELER%20ADVENTURE"),
    ("SHOVELER%20SAFARI", "NORTHERN%20SHOVELER%20ADVENTURE"),
    ("SHOVELER SAFARI", "NORTHERN SHOVELER ADVENTURE"),
    ("Shoveler Safari", "Northern Shoveler Adventure"),
    ("SHOVELER Team", "NORTHERN SHOVELER Team"),
]

updated = []
for f in root.rglob("*"):
    if not f.is_file() or f.suffix.lower() not in exts:
        continue
    if "scripts" in f.parts and f.name == "rename_brand.py":
        continue
    try:
        text = f.read_text(encoding="utf-8")
    except Exception:
        continue
    orig = text
    for old, new in replacements:
        text = text.replace(old, new)
    if f.suffix.lower() == ".html":
        text = text.replace(
            '<p class="shoveler-hero__brand">SHOVELER</p>',
            '<p class="shoveler-hero__brand">NORTHERN SHOVELER</p>',
        )
        text = text.replace(
            '<p class="shoveler-hero__mark">Safari</p>',
            '<p class="shoveler-hero__mark">Adventure</p>',
        )
    if text != orig:
        f.write_text(text, encoding="utf-8")
        updated.append(str(f.relative_to(root)))

print(f"Updated {len(updated)} files:")
for u in updated:
    print(" -", u)

leftovers = [
    "SHOVELER SAFARI",
    "Shoveler Safari",
    "Hello%20SHOVELER%20SAFARI",
    "SHOVELER%20SAFARI",
    "SHOVELER Team",
]
for f in root.rglob("*"):
    if not f.is_file() or f.suffix.lower() not in exts:
        continue
    try:
        t = f.read_text(encoding="utf-8")
    except Exception:
        continue
    for p in leftovers:
        c = t.count(p)
        if c:
            print(f"LEFT {p!r} x{c} in {f.relative_to(root)}")
