from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

block = re.compile(
    r"\s*(?:<!--[-=\s]*\n?\s*Preloader\s*\n?\s*[-=\s]*-->\s*)?"
    r'<div class="preloader">\s*'
    r'<button class="vs-btn preloaderCls">Cancel Preloader</button>\s*'
    r'<div class="preloader-inner">[\s\S]*?</div>\s*'
    r"</div>\s*",
    re.I,
)

count = 0
for path in sorted(root.glob("*.html")):
    text = path.read_text(encoding="utf-8")
    if 'class="preloader"' not in text:
        continue
    new, n = block.subn("\n    ", text, count=1)
    if n:
        path.write_text(new, encoding="utf-8")
        count += 1
        print(f"removed: {path.name}")
    else:
        print(f"FAIL: {path.name}")

print(f"done ({count})")
