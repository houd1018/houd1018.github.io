#!/usr/bin/env python3
"""Migrate the archived Jekyll/Chirpy posts into the static Blog section.

Reads ``_legacy_backup/_posts/*.md`` and writes:
  * ``blog/posts/<slug>.md`` — body without frontmatter, headings normalized, code fence
    languages normalized, ``/assets/pic/...`` images rewritten to ``media:blog/pic/...``.
  * ``data/blog.js``         — ``window.BLOG_POSTS`` index, newest first.

Examples
--------
    python scripts/migrate_blog_posts.py --dry-run
    python scripts/migrate_blog_posts.py --force
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = REPO_ROOT / "_legacy_backup" / "_posts"
DEFAULT_OUT = REPO_ROOT / "blog" / "posts"
DEFAULT_DATA = REPO_ROOT / "data" / "blog.js"
DEFAULT_EXCLUDE = ["hello"]

DATE_PREFIX_RE = re.compile(r"^\d{4}-\d{1,2}-\d{1,2}-")
FENCE_RE = re.compile(r"^(\s*)(`{3,}|~{3,})\s*([^\s`]*)(.*)$")
HEADING_RE = re.compile(r"^(#{1,6})(\s+.*)$")
MD_IMAGE_RE = re.compile(
    r"\]\(\s*/assets/pic/(.+?\.(?:png|jpe?g|gif|webp|svg|mp4))\s*\)", re.IGNORECASE
)
HTML_IMG_RE = re.compile(r"<img\b[^>]*?\bsrc=[\"']/assets/pic/([^\"']+)[\"'][^>]*>", re.IGNORECASE)
HTML_ALT_RE = re.compile(r"\balt=[\"']([^\"']*)[\"']", re.IGNORECASE)
ANY_IMAGE_RE = re.compile(r"media:blog/pic/([^)>\"]+?\.(?:png|jpe?g|gif|webp|svg))", re.IGNORECASE)

FENCE_LANGS = {"c++": "cpp", "c#": "csharp", "cs": "csharp", "hlsl": "hlsl", "shader": "hlsl"}
SLUG_OVERRIDES = {
    "gamedevlearning": "gamedev-learning",
    "blender-introtutorial": "blender-intro",
    "shadergraph-introtutorial": "shadergraph-intro",
    "catlikecoding": "catlike-coding",
    "toonshader": "toon-shader",
    "urpshader": "urp-shader",
}
CATEGORY_LABELS = {
    "c plus plus": "C++",
    "c#": "C#",
    "gamedev_learningmap": "Learning",
    "dcc": "DCC",
    "vfx": "VFX",
    "unity": "Unity",
    "shader": "Shader",
    "material": "Material",
}


def ensure_utf8_stdout() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
        except (AttributeError, ValueError):
            pass


def slugify(name: str) -> str:
    s = name.lower().replace("c++", "cpp").replace("c#", "csharp")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return SLUG_OVERRIDES.get(s, s)


def parse_frontmatter(text: str) -> Tuple[Dict[str, object], str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end < 0:
        return {}, text
    raw = text[3:end]
    body = text[end + 4 :].lstrip("\r\n")
    meta: Dict[str, object] = {}
    for line in raw.splitlines():
        line = re.sub(r"\s+#(?:\s.*)?$", "", line).rstrip()
        if ":" not in line or line.startswith(" "):
            continue
        key, value = line.split(":", 1)
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key.strip()] = [v.strip().strip("'\"") for v in value[1:-1].split(",") if v.strip()]
        else:
            meta[key.strip()] = value.strip("'\"")
    return meta, body


def transform_body(body: str) -> Tuple[str, List[str]]:
    """Return (new markdown, warnings)."""
    warnings: List[str] = []
    lines = body.splitlines()

    # Pass 1: classify lines as inside/outside code fences.
    in_fence: List[bool] = []
    fence_marker: Optional[str] = None
    for i, line in enumerate(lines):
        m = FENCE_RE.match(line)
        if fence_marker is None and m:
            fence_marker = m.group(2)[0] * len(m.group(2))
            in_fence.append(True)
            lang = m.group(3).lower()
            if lang:
                lines[i] = f"{m.group(1)}{m.group(2)}{FENCE_LANGS.get(lang, lang)}{m.group(4)}"
        elif fence_marker is not None:
            in_fence.append(True)
            stripped = line.strip()
            if m and stripped.startswith(fence_marker) and not m.group(3):
                fence_marker = None
        else:
            in_fence.append(False)
    if fence_marker is not None:
        warnings.append("unclosed code fence")

    # Pass 2: drop the leading H1 (the page renders the title).
    for i, line in enumerate(lines):
        if in_fence[i] or not line.strip():
            continue
        if re.match(r"^#\s+", line):
            lines[i] = ""
        break

    has_h1 = any(not in_fence[i] and re.match(r"^#\s+", l) for i, l in enumerate(lines))

    out: List[str] = []
    for i, line in enumerate(lines):
        if in_fence[i]:
            out.append(line)
            continue
        if has_h1:
            h = HEADING_RE.match(line)
            if h:
                line = "#" * min(len(h.group(1)) + 1, 6) + h.group(2)

        def md_img(m: "re.Match[str]") -> str:
            path = m.group(1)
            target = f"media:blog/pic/{path}"
            return f"](<{target}>)" if re.search(r"[\s()]", path) else f"]({target})"

        line = MD_IMAGE_RE.sub(md_img, line)

        def html_img(m: "re.Match[str]") -> str:
            alt = HTML_ALT_RE.search(m.group(0))
            alt_text = alt.group(1) if alt else ""
            return f'<img data-media-src="blog/pic/{m.group(1)}" alt="{alt_text}" loading="lazy" data-lightbox>'

        line = HTML_IMG_RE.sub(html_img, line)
        if "/assets/pic/" in line:
            warnings.append(f"unconverted asset reference: {line.strip()[:100]}")
        out.append(line)

    text = "\n".join(out).strip("\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text + "\n", warnings


def extract_summary(markdown: str, limit: int = 160) -> str:
    fence = False
    for line in markdown.splitlines():
        s = line.strip()
        if FENCE_RE.match(s):
            fence = not fence
            continue
        if fence or not s or s.startswith(("#", "!", "<", "|", ">", "-", "*", "$", "[")) or re.match(r"^\d+\.", s):
            continue
        s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
        s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
        s = re.sub(r"[*_`]+", "", s).strip()
        if len(s) < 20 or re.match(r"^https?://\S+$", s):
            continue
        return s if len(s) <= limit else s[: limit - 1].rstrip() + "…"
    return ""


def extract_cover(markdown: str) -> Optional[str]:
    images = ANY_IMAGE_RE.findall(markdown)
    for name in images:
        if name.lower().endswith(".gif"):
            return f"blog/pic/{name}"
    return f"blog/pic/{images[0]}" if images else None


def category_label(raw: str) -> str:
    return CATEGORY_LABELS.get(raw.lower(), raw.strip().title())


def main(argv: Optional[List[str]] = None) -> int:
    ensure_utf8_stdout()
    ap = argparse.ArgumentParser(description="Migrate Jekyll posts to blog/posts/*.md + data/blog.js")
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA)
    ap.add_argument("--exclude", nargs="*", default=DEFAULT_EXCLUDE, help="slugs to skip")
    ap.add_argument("--force", action="store_true", help="overwrite existing posts and data/blog.js")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)

    if not args.src.is_dir():
        print(f"[error] source not found: {args.src}", file=sys.stderr)
        return 2
    if args.data.exists() and not args.force and not args.dry_run:
        print(f"[error] {args.data} exists; use --force to regenerate it", file=sys.stderr)
        return 2

    posts = []
    seen: Dict[str, Path] = {}
    for path in sorted(args.src.glob("*.md")):
        slug = slugify(DATE_PREFIX_RE.sub("", path.stem))
        if slug in args.exclude:
            print(f"skip    {path.name}")
            continue
        if slug in seen:
            print(f"[error] duplicate slug {slug!r}: {seen[slug].name} / {path.name}", file=sys.stderr)
            return 2
        seen[slug] = path

        meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        markdown, warnings = transform_body(body)
        categories = meta.get("categories") or ["Notes"]
        tags = sorted({str(t).lower() for t in (meta.get("tags") or [])})
        entry = {
            "slug": slug,
            "title": str(meta.get("title") or path.stem),
            "date": str(meta.get("date", ""))[:10],
            "category": category_label(str(categories[0])),
            "tags": tags,
            "summary": extract_summary(markdown),
            "cover": extract_cover(markdown),
        }
        if not entry["cover"]:
            del entry["cover"]
        posts.append((entry, markdown))

        target = args.out_dir / f"{slug}.md"
        status = "exists " if target.exists() and not args.force else "write  "
        print(f"{status} {path.name} -> blog/posts/{slug}.md  [{entry['category']}]")
        for w in warnings:
            print(f"        warn: {w}")
        if not args.dry_run and (args.force or not target.exists()):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(markdown, encoding="utf-8", newline="\n")

    posts.sort(key=lambda p: (p[0]["date"], p[0]["slug"]), reverse=True)
    index = [p[0] for p in posts]
    entries = [
        "  {\n" + ",\n".join(f"    {k}: {json.dumps(v, ensure_ascii=False)}" for k, v in e.items()) + ",\n  }"
        for e in index
    ]
    js = (
        "// Blog index — single source of truth for post metadata. Bodies live in blog/posts/<slug>.md.\n"
        "window.BLOG_POSTS = [\n" + ",\n".join(entries) + ",\n];\n"
    )
    print(f"\n{len(index)} posts -> {args.data.relative_to(REPO_ROOT) if args.data.is_absolute() else args.data}")
    if args.dry_run:
        print("Dry run complete. Nothing was written.")
        return 0
    args.data.parent.mkdir(parents=True, exist_ok=True)
    args.data.write_text(js, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
