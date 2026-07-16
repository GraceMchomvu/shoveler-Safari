from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = (root / "index.html").read_text(encoding="utf-8")
dst = root / "index-3.html"
text = dst.read_text(encoding="utf-8")

a = "          function bindSingle($el, minDate) {"
b = "          var $in = jQuery(\"#hq-checkin\");"
s0 = src.index(a)
s1 = src.index(b, s0)
d0 = text.index(a)
d1 = text.index(b, d0)
text = text[:d0] + src[s0:s1] + text[d1:]
dst.write_text(text, encoding="utf-8")
print("datepicker mobile sync ok")
