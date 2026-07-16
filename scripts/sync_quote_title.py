from pathlib import Path

p = Path(__file__).resolve().parents[1] / "index-3.html"
t = p.read_text(encoding="utf-8")
t = t.replace("Let’s plan your dream safari together", "Plan your dream safari")
t = t.replace("Let's plan your dream safari together", "Plan your dream safari")
p.write_text(t, encoding="utf-8")
print("ok")
