from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = (root / "index.html").read_text(encoding="utf-8")
dst_path = root / "index-3.html"
text = dst_path.read_text(encoding="utf-8")

old = """              <input
                type="text"
                id="hq-dates"
                name="dates"
                class="datepicker"
                placeholder="Choose dates"
              />"""
new = """              <input
                type="text"
                id="hq-dates"
                name="dates"
                class="datepicker"
                placeholder="Choose dates"
                readonly
                autocomplete="off"
              />"""
if old in text:
    text = text.replace(old, new)

a = '        var form = document.getElementById("hero-quote");'
b = "      })();"
s0 = src.index(a)
s1 = src.index(b, s0) + len(b)
d0 = text.index(a)
d1 = text.index(b, d0) + len(b)
text = text[:d0] + src[s0:s1] + text[d1:]
dst_path.write_text(text, encoding="utf-8")
print("synced")
