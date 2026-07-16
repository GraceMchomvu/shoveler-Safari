from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = (root / "index.html").read_text(encoding="utf-8")
dst_path = root / "index-3.html"
text = dst_path.read_text(encoding="utf-8")

marker = 'id="hero-quote" class="shoveler-quote"'
s0 = src.index("<form " + marker) if ("<form " + marker) in src else src.index(marker)
s0 = src.rfind("<form", 0, s0 + 1)
s1 = src.index("</form>", s0) + len("</form>")
form = src[s0:s1]

d0 = text.index(marker)
d0 = text.rfind("<form", 0, d0 + 1)
d1 = text.index("</form>", d0) + len("</form>")
text = text[:d0] + form + text[d1:]

old = """form.querySelectorAll(\".shoveler-quote__cell\").forEach(function (cell) {
            cell.addEventListener(\"click\", function (ev) {
              if (ev.target.closest(\"select, input, button\")) return;
              var field = cell.querySelector(\"select, input\");
              if (!field) return;
              field.focus();
              if (typeof field.showPicker === \"function\") {
                try {
                  field.showPicker();
                } catch (err) {}
              }
            });
          });"""
new = """form.querySelectorAll(\".shoveler-quote__cell\").forEach(function (cell) {
            cell.addEventListener(\"click\", function () {
              var field = cell.querySelector(\"select, input\");
              if (!field) return;
              field.focus();
              if (typeof field.showPicker === \"function\") {
                try {
                  field.showPicker();
                } catch (err) {}
              }
            });
          });"""
if old in text:
    text = text.replace(old, new)

dst_path.write_text(text, encoding="utf-8")
print("synced")
