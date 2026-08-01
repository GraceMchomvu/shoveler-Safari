from pathlib import Path

css = Path(__file__).resolve().parent.parent / "assets" / "css" / "shoveler-overrides.css"
text = css.read_text(encoding="utf-8")
orig = text

text = text.replace(
    'font-family: "Cormorant Garamond", Georgia, serif;',
    "font-family: var(--title-font);",
)
text = text.replace(
    'font-family: "Source Sans 3", "Segoe UI", sans-serif;',
    "font-family: var(--body-font);",
)
text = text.replace(
    '/* ---- Navigation — mirrors logo "SAFARI" wordmark rhythm ---- */',
    "/* ---- Navigation — wordmark letter-spacing rhythm ---- */",
)

# Hero brand: longer "NORTHERN SHOVELER" needs slightly smaller display size
old_brand = """\
.shoveler-hero__brand {
  margin: 0 0 0.35rem;
  font-family: var(--title-font);
  font-size: clamp(3.25rem, 9.5vw, 6.75rem);
  font-weight: 600;
  line-height: 0.9;
  letter-spacing: 0.01em;
  color: var(--hero-cream);
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.35);
  animation: shovelerHeroIn 1.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}"""

new_brand = """\
.shoveler-hero__brand {
  margin: 0 0 0.35rem;
  max-width: 14ch;
  font-family: var(--title-font);
  font-size: clamp(2.35rem, 6.8vw, 5rem);
  font-weight: 600;
  line-height: 0.95;
  letter-spacing: 0.01em;
  color: var(--hero-cream);
  text-shadow: 0 4px 40px rgba(0, 0, 0, 0.35);
  animation: shovelerHeroIn 1.15s cubic-bezier(0.22, 1, 0.36, 1) both;
}"""

if old_brand in text:
    text = text.replace(old_brand, new_brand)
else:
    print("WARN: hero brand block not found exactly")

# Adventure mark: slightly tighter tracking so it matches prior Safari rhythm
text = text.replace(
    """\
.shoveler-hero__mark {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0.85rem 0 1.85rem;
  font-family: var(--body-font);
  font-size: clamp(0.72rem, 1.1vw, 0.84rem);
  font-weight: 700;
  letter-spacing: 0.48em;
  text-transform: uppercase;
  color: var(--hero-gold);
  animation: shovelerHeroIn 1.15s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
}""",
    """\
.shoveler-hero__mark {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin: 0.85rem 0 1.85rem;
  font-family: var(--body-font);
  font-size: clamp(0.72rem, 1.1vw, 0.84rem);
  font-weight: 700;
  letter-spacing: 0.36em;
  text-transform: uppercase;
  color: var(--hero-gold);
  animation: shovelerHeroIn 1.15s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
}""",
)

# Append consistency rules once
marker = "/* ---- Brand rename font consistency ---- */"
if marker not in text:
    text += """

/* ---- Brand rename font consistency ---- */
.ff-poppins,
.ff-open-sans,
.ff-montserrat {
  font-family: var(--body-font) !important;
}

.choose-us-content .blockquote-custom,
.choose-us-content .info-area .info-list .info-content p,
.choose-us-content .review-info,
.vs-blog-box2 .post-author,
.vs-blog-box2 .post-comments,
.vs-blog-box2 .post-date,
.vs-blog-box3 .blog-meta,
.vs-blog-box3 .blog-text,
.blog-single .blog-meta,
.blog-single .blog-text,
.blog-single .author-text,
.blog-single cite {
  font-family: var(--body-font) !important;
}

.choose-us-content .info-area .info-list .info-content .info-title,
.vs-blog-box2 .post-title,
.vs-blog-box2 .post-title a,
.vs-blog-box3 .blog-title,
.vs-blog-box3 .blog-title a,
.blog-single .blog-title,
.blog-single .author-name,
.blog-single .blog-inner-title {
  font-family: var(--title-font) !important;
}

.choose-us-content .title-area .sec-title,
.vs-choose-us .sec-title {
  max-width: 18ch;
  font-family: var(--title-font) !important;
}

.shoveler-hero__lede,
.shoveler-hero__link {
  font-family: var(--body-font);
}
"""

css.write_text(text, encoding="utf-8")
print("updated", css.name)
print("hardcoded cormorant left:", text.count("Cormorant Garamond"))
print("hardcoded source left:", text.count('"Source Sans 3"'))
print("bytes delta", len(text) - len(orig))
