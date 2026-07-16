from pathlib import Path
import re

base = Path(__file__).resolve().parents[1]
old_fonts = (
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800"
    "&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
)
new_fonts = (
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500"
    "&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
)
override_link = '    <link rel="stylesheet" href="assets/css/shoveler-overrides.css" />'

for path in base.glob("*.html"):
    if "backup" in path.name:
        continue
    text = path.read_text(encoding="utf-8")
    updated = text.replace(old_fonts, new_fonts)
    updated = re.sub(
        r"https://fonts\.googleapis\.com/css2\?family=[^\"']+",
        new_fonts,
        updated,
        count=1,
    )
    if "shoveler-overrides.css" not in updated and 'href="assets/css/style.css"' in updated:
        updated = updated.replace(
            '    <link rel="stylesheet" href="assets/css/style.css" />',
            '    <link rel="stylesheet" href="assets/css/style.css" />\n' + override_link,
        )
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        print("updated", path.name)
    else:
        print("no change", path.name)

(base / "index-3.html").write_text((base / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
print("synced index-3")
