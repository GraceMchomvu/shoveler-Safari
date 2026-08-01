from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = (root / "index.html").read_text(encoding="utf-8")
dst_path = root / "index-3.html"
text = dst_path.read_text(encoding="utf-8")

# Sync hero content block
start_marker = '        <div class="shoveler-hero__content">'
end_marker = "      <!--================= Hero Area End =================-->"
s0 = src.index(start_marker)
s1 = src.index(end_marker, s0)
d0 = text.index(start_marker)
d1 = text.index(end_marker, d0)
text = text[:d0] + src[s0:s1] + text[d1:]

# Sync quote form script block
a = '        var form = document.getElementById("hero-quote");'
b = "      })();"
s0 = src.index(a)
s1 = src.index(b, s0) + len(b)
d0 = text.index(a)
d1 = text.index(b, d0) + len(b)
text = text[:d0] + src[s0:s1] + text[d1:]

dst_path.write_text(text, encoding="utf-8")
print("synced hero quote card + script")
