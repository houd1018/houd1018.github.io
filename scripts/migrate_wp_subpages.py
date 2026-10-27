#!/usr/bin/env python3
"""Migrate WordPress project pages into static ``projects/<slug>.html`` pages + ``data/projects.js``.

* Project grid (titles, categories, subtitles, covers, order) comes from the Essential Addons
  "filterable gallery" widget on the WordPress home page (``_elementor_data``).
* Every other published page (except the home page) becomes a detail page; pages that are not in
  the grid are registered with ``listed: false`` (reachable from other project pages).
* Page bodies come from ``content:encoded`` (Elementor's rendered HTML) and are rebuilt with a
  strict allowlist: media → ``data-media-*`` paths (mapped to masters via the cleaned_media
  manifest), bare video URLs → ``.media-video``, image runs → ``gif-grid``, internal links → new URLs.

Examples
--------
    python scripts/migrate_wp_subpages.py --dry-run --report migration_report.json
    python scripts/migrate_wp_subpages.py --force
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import parse_qs, unquote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import clean_uploads  # noqa: E402
import migrate_blog_posts  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XML = REPO_ROOT / "portfolio_Legacy" / "dazhouhou.WordPress.2026-10-26.xml"
DEFAULT_MANIFEST = REPO_ROOT / "cleaned_media" / "_manifest.json"
DEFAULT_OUT = REPO_ROOT / "projects"
DEFAULT_DATA = REPO_ROOT / "data" / "projects.js"
LEGACY_POSTS = REPO_ROOT / "_legacy_backup" / "_posts"

NS = {
    "wp": "http://wordpress.org/export/1.2/",
    "content": "http://purl.org/rss/1.0/modules/content/",
}

CATEGORIES = {
    "computer graphics": "computer-graphics",
    "tech art": "tech-art",
    "games": "games",
    "creative coding": "creative-coding",
}
CATEGORY_LABELS = {
    "computer-graphics": "Computer Graphics",
    "tech-art": "Tech Art",
    "games": "Games",
    "creative-coding": "Creative Coding",
}
SLUG_OVERRIDES = {"elementor-2472": "game-jams"}
# Pages that are not in the home grid; categories picked by hand.
UNLISTED_CATEGORIES = {
    "colorful-world": "games",
    "the-way-3d-third-person-action-game": "games",
    "boomerang-jones": "games",
    "wizherkitten": "games",
    "sarapist": "games",
    "chrono-detective": "games",
    "catnip-go-fast": "games",
    "sketch": "games",
    "forest-claymation": "tech-art",
    "visual-effects": "tech-art",
    "shader-reel": "tech-art",
    "isa-media": "creative-coding",
    "easego-an-android-app-that-helps-seniors-show-the-health-code": "creative-coding",
}
SKIP_PAGES = {"home-2"}
# Typos in the WordPress source, fixed on every regeneration.
TEXT_FIXES = {
    "CMU CG 15662 [C++ | CG algroithm]": "CMU 15-462 Computer Graphics [C++ | CG algorithms]",
    "Buit-in": "Built-in",
}

ZERO_WIDTH_RE = re.compile("[\u200b\u200c\u200d\ufeff]")
UPLOADS_RE = re.compile(r"/wp-content/uploads/(.+)$", re.IGNORECASE)
VIDEO_EXT_RE = re.compile(r"\.(mp4|mov|webm|m4v)$", re.IGNORECASE)
IMAGE_EXT_RE = re.compile(r"\.(png|jpe?g|gif|webp|svg|avif)$", re.IGNORECASE)
URL_IN_TEXT_RE = re.compile(r"https?://.+?(?=https?://|[\s<>\"']|$)")
BG_URL_RE = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)")
YOUTUBE_RE = re.compile(r"(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})")
BILIBILI_RE = re.compile(r"bilibili\.com/video/(BV[\w]+)")
VIMEO_RE = re.compile(r"vimeo\.com/(?:video/)?(\d+)")
WP_HOST_RE = re.compile(r"(?:^|\.)(?:dazhou\.io|hostingersite\.com)$", re.IGNORECASE)

BLOCK_TAGS = {"p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "pre", "table", "thead", "tbody", "tr", "th", "td", "figure", "figcaption"}
INLINE_TAGS = {"strong", "em", "code", "br", "sub", "sup", "a", "img"}
TAG_MAP = {"b": "strong", "i": "em", "h1": "h2", "h5": "h4", "h6": "h4"}
DROP_WITH_CONTENT = {"style", "script", "noscript", "svg", "form", "button", "select", "textarea", "iframe", "template", "head", "title"}
VOID_TAGS = {"br", "img", "hr", "input", "meta", "link", "source", "wbr"}


def ensure_utf8_stdout() -> None:
    clean_uploads.ensure_utf8_stdout()


def text(el: ET.Element, path: str) -> str:
    return el.findtext(path, default="", namespaces=NS) or ""


def clean_title(s: str) -> str:
    s = ZERO_WIDTH_RE.sub("", html.unescape(s))
    s = re.sub(r"\s+", " ", s).strip()
    for wrong, right in TEXT_FIXES.items():
        s = s.replace(wrong, right)
    return s


def normalize_slug(post_name: str) -> str:
    s = SLUG_OVERRIDES.get(post_name, post_name)
    s = re.sub(r"[^a-z0-9]+", "-", unquote(s).lower()).strip("-")
    return s


class MediaResolver:
    def __init__(self, manifest_path: Path) -> None:
        self.files: Set[str] = set()
        self.redirects: Dict[str, str] = {}
        if manifest_path.is_file():
            data = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.files = set(data.get("files", []))
            self.redirects = data.get("redirects", {})
        self.missing: Set[str] = set()

    def resolve(self, url: str) -> Optional[str]:
        """Return a media-library path for a WP upload URL, or None if it is not one."""
        m = UPLOADS_RE.search(urlparse(url.strip()).path)
        if not m:
            return None
        path = unquote(m.group(1))
        path = self.redirects.get(path, path)
        if self.files and path not in self.files:
            stem, dot, ext = path.rpartition(".")
            canonical, _, _ = clean_uploads.parse_variant(Path(stem).name)
            guess = f"{stem.rsplit('/', 1)[0]}/{canonical}.{ext}" if "/" in stem else f"{canonical}.{ext}"
            guess = self.redirects.get(guess, guess)
            if guess in self.files:
                return guess
            self.missing.add(path)
        return path


class Linker:
    """Rewrite links to old WordPress pages / old Jekyll blog posts."""

    def __init__(self, page_slugs: Dict[str, str], page_ids: Dict[str, str]) -> None:
        self.page_slugs = page_slugs
        self.page_ids = page_ids
        self.blog_slugs: Dict[str, str] = {}
        if LEGACY_POSTS.is_dir():
            for p in LEGACY_POSTS.glob("*.md"):
                name = migrate_blog_posts.DATE_PREFIX_RE.sub("", p.stem)
                new = migrate_blog_posts.slugify(name)
                old = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
                self.blog_slugs[old] = new
                self.blog_slugs[new] = new
        self.unresolved: Set[str] = set()

    def rewrite(self, href: str) -> Tuple[str, bool]:
        """Return (href, is_media_path)."""
        href = href.strip()
        u = urlparse(href)
        if u.scheme in ("mailto", "tel") or href.startswith("#"):
            return href, False
        if UPLOADS_RE.search(u.path or ""):
            return href, True
        host = (u.hostname or "").lower()
        if host == "houd1018.github.io":
            m = re.match(r"^/posts/([^/]+)/?$", u.path or "")
            if m:
                key = re.sub(r"[^a-z0-9]+", "-", m.group(1).lower()).strip("-")
                slug = self.blog_slugs.get(key)
                if slug:
                    fragment = f"#{u.fragment}" if u.fragment else ""
                    return f"../blog/post.html?slug={slug}{fragment}", False
                self.unresolved.add(href)
            return "../blog/index.html", False
        if not host or WP_HOST_RE.search(host):
            page_id = parse_qs(u.query).get("page_id", [None])[0]
            if page_id and page_id in self.page_ids:
                return f"{self.page_ids[page_id]}.html", False
            name = (u.path or "").strip("/").split("/")[-1].lower()
            if not name:
                return "../index.html", False
            if name in self.page_slugs:
                return f"{self.page_slugs[name]}.html", False
            self.unresolved.add(href)
        return href, False


class BodyConverter(HTMLParser):
    """Allowlist-based HTML rebuild of an Elementor page body."""

    def __init__(self, media: MediaResolver, linker: Linker) -> None:
        super().__init__(convert_charrefs=True)
        self.media = media
        self.linker = linker
        self.out: List[str] = []
        self.stack: List[Optional[str]] = []
        self.drop_depth = 0
        self.anchor_depth = 0
        self.dropped_first_h1 = False
        self.skip_heading_depth = 0
        self.card: Optional[Dict] = None
        self.stats = {"images": 0, "videos": 0, "embeds": 0}

    # -- helpers ---------------------------------------------------------
    def _emit(self, s: str) -> None:
        self.out.append(s)

    def _img(self, src: str, alt: str) -> None:
        path = self.media.resolve(src)
        if not path:
            return
        self.stats["images"] += 1
        if not alt.strip():
            alt = re.sub(r"[-_.]+", " ", Path(path).stem).strip()
        alt_attr = html.escape(alt, quote=True)
        self._emit(f'<img data-media-src="{html.escape(path, quote=True)}" alt="{alt_attr}" loading="lazy">')

    def _video_block(self, url: str) -> bool:
        path = self.media.resolve(url)
        if path and VIDEO_EXT_RE.search(path):
            self.stats["videos"] += 1
            self._emit(
                '\n<div class="media-video"><video controls playsinline preload="metadata" '
                f'data-media-src="{html.escape(path, quote=True)}"></video></div>\n'
            )
            return True
        embed = None
        yt, bv, vm = YOUTUBE_RE.search(url), BILIBILI_RE.search(url), VIMEO_RE.search(url)
        if yt:
            embed = f"https://www.youtube-nocookie.com/embed/{yt.group(1)}"
        elif bv:
            embed = f"https://player.bilibili.com/player.html?bvid={bv.group(1)}&autoplay=0"
        elif vm:
            embed = f"https://player.vimeo.com/video/{vm.group(1)}"
        if embed:
            self.stats["embeds"] += 1
            self._emit(
                f'\n<div class="media-video"><iframe src="{html.escape(embed, quote=True)}" title="Video" loading="lazy" '
                'allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>\n'
            )
            return True
        return False

    def _finish_card(self) -> None:
        card, self.card = self.card, None
        if card is None:
            return
        title = clean_title(" ".join(card["title"]))
        desc = clean_title(" ".join(card["text"]))
        parts = [f'<a class="link-card" href="{html.escape(card["href"], quote=True)}">']
        if card["img"]:
            parts.append(
                f'<img class="link-card-img" data-media-src="{html.escape(card["img"], quote=True)}" '
                f'alt="" loading="lazy" data-no-lightbox>'
            )
        parts.append(f'<span class="link-card-title">{html.escape(title, quote=False)}</span>')
        if desc:
            parts.append(f'<span class="link-card-text">{html.escape(desc, quote=False)}</span>')
        parts.append("</a>")
        self._emit("\n" + "".join(parts) + "\n")

    # -- parser callbacks ------------------------------------------------
    def handle_starttag(self, tag: str, attrs_list: List[Tuple[str, Optional[str]]]) -> None:
        attrs = {k: (v or "") for k, v in attrs_list}
        if self.card is not None:
            if tag not in VOID_TAGS:
                self.card["depth"] += 1
            if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
                self.card["in_title"] = True
            return
        if self.drop_depth:
            if tag not in VOID_TAGS:
                self.drop_depth += 1
            return
        if tag in DROP_WITH_CONTENT:
            if tag == "iframe" and attrs.get("src"):
                self._video_block(attrs["src"])
            if tag not in VOID_TAGS:
                self.drop_depth = 1
            return
        if self.skip_heading_depth:
            if tag not in VOID_TAGS:
                self.skip_heading_depth += 1
            return
        if tag == "h1" and not self.dropped_first_h1:
            self.dropped_first_h1 = True
            self.skip_heading_depth = 1
            return

        tag = TAG_MAP.get(tag, tag)
        if self.anchor_depth and tag in ("h2", "h3", "h4"):
            tag = "strong"
        elif self.anchor_depth and tag == "p":
            tag = "span"

        if tag == "img":
            src = attrs.get("data-lazy-src") or attrs.get("src") or ""
            self._img(src, attrs.get("alt", ""))
            return
        if tag in ("video", "source"):
            src = attrs.get("src", "")
            if src:
                self._video_block(src)
            if tag == "video":
                self.drop_depth = 1
            return
        if tag == "a":
            href = attrs.get("href", "")
            bg = BG_URL_RE.search(attrs.get("style", ""))
            new_href, is_media = self.linker.rewrite(href) if href else ("", False)
            if is_media:
                path = self.media.resolve(href)
                if path and VIDEO_EXT_RE.search(path) and self._video_block(href):
                    self.drop_depth = 1
                    return
                self._emit(f'<a data-media-href="{html.escape(path or "", quote=True)}">')
            elif new_href and (YOUTUBE_RE.search(new_href) or BILIBILI_RE.search(new_href)) and not self.anchor_depth:
                self._video_block(new_href)
                self.drop_depth = 1
                return
            elif bg:
                path = self.media.resolve(bg.group(1))
                if path:
                    self.stats["images"] += 1
                self.card = {"href": new_href, "img": path, "title": [], "text": [], "depth": 1, "in_title": False}
                return
            elif new_href:
                self._emit(f'<a href="{html.escape(new_href, quote=True)}">')
            else:
                self.stack.append(None)
                return
            self.anchor_depth += 1
            self.stack.append("a")
            return
        if tag == "br":
            self._emit("<br>")
            return
        if tag in BLOCK_TAGS or tag in INLINE_TAGS or tag == "span" and self.anchor_depth:
            self._emit(f"<{tag}>")
            self.stack.append(tag)
            return
        if tag in ("hr",):
            self._emit("<hr>")
            return
        if tag not in VOID_TAGS:
            self.stack.append(None)

    def handle_endtag(self, tag: str) -> None:
        if self.card is not None:
            if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
                self.card["in_title"] = False
            if tag not in VOID_TAGS:
                self.card["depth"] -= 1
            if self.card["depth"] <= 0:
                self._finish_card()
            return
        if self.drop_depth:
            self.drop_depth -= 1
            return
        if self.skip_heading_depth:
            self.skip_heading_depth -= 1
            return
        if tag in VOID_TAGS or not self.stack:
            return
        out_tag = self.stack.pop()
        if out_tag:
            self._emit(f"</{out_tag}>")
            if out_tag == "a":
                self.anchor_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.card is not None:
            if data.strip():
                self.card["title" if self.card["in_title"] else "text"].append(data)
            return
        if self.drop_depth or self.skip_heading_depth:
            return
        data = ZERO_WIDTH_RE.sub("", data)
        if not data.strip():
            if data:
                self._emit(" ")
            return
        pos = 0
        for m in URL_IN_TEXT_RE.finditer(data):
            url = m.group(0)
            is_video = bool(VIDEO_EXT_RE.search(urlparse(url).path)) or bool(
                YOUTUBE_RE.search(url) or BILIBILI_RE.search(url) or VIMEO_RE.search(url)
            )
            if is_video and not self.anchor_depth:
                self._emit(html.escape(data[pos : m.start()], quote=False))
                self._video_block(url)
                pos = m.end()
        self._emit(html.escape(data[pos:], quote=False))

    def result(self) -> str:
        self._finish_card()
        while self.stack:
            t = self.stack.pop()
            if t:
                self._emit(f"</{t}>")
        return postprocess("".join(self.out))


def postprocess(body: str) -> str:
    body = re.sub(r"[ \t\r\n]+", " ", body)
    for _ in range(2):
        body = re.sub(r"<(span|strong|em)>(\s*)</\1>", r"\2", body)
        body = re.sub(r"<(p|li|h2|h3|h4)>\s*</\1>", "", body)

    img = r'<img data-media-src="[^"]*" alt="[^"]*" loading="lazy">'
    def group_images(m: "re.Match[str]") -> str:
        imgs = re.findall(img, m.group(0))
        if len(imgs) == 1:
            return f'\n<figure class="media-figure">{imgs[0]}</figure>\n'
        cols = 2 if len(imgs) in (2, 4) else 3
        inner = "".join(f"<figure>{i}</figure>" for i in imgs)
        return f'\n<div class="gif-grid gif-grid--{cols}">{inner}</div>\n'
    # Only top-level runs of images (not inside links/paragraphs).
    body = re.sub(rf"(?:(?<=>)|^)\s*((?:{img}\s*)+)(?=<(?!/a>|/span>|/p>|/li>)|$)", lambda m: group_images(m), body)

    body = re.sub(r'\s*(<a class="link-card".*?</a>)\s*', r"\n\1\n", body)

    body = re.sub(r"\s*(</?(?:p|h2|h3|h4|ul|ol|li|blockquote|pre|table|tr|figure|div)[^>]*>)\s*", r"\1", body)
    body = re.sub(r"(</(?:p|h2|h3|h4|ul|ol|blockquote|pre|table|figure|div)>)", r"\1\n", body)
    body = re.sub(r"(<(?:h2|h3|h4|ul|ol|div|figure)[^>]*>)", r"\n\1", body)
    body = re.sub(r"\n{2,}", "\n", body).strip()

    # Wrap stray top-level text in paragraphs; group consecutive link cards.
    lines: List[str] = []
    cards: List[str] = []
    for line in body.split("\n") + [""]:
        s = line.strip()
        if s.startswith('<a class="link-card"'):
            cards.append(s)
            continue
        if cards:
            lines.append('<div class="link-cards">\n' + "\n".join(cards) + "\n</div>")
            cards = []
        if s and not s.startswith("<") or s.startswith(("<strong", "<em", "<a ", "<a>", "<code")):
            s = f"<p>{s}</p>"
        if s:
            lines.append(s)
    return "\n".join(lines)


def render_page(project: Dict, body: str, related_url: Optional[str]) -> str:
    esc = lambda s: html.escape(s or "", quote=True)
    label = CATEGORY_LABELS.get(project["category"], project["category"])
    subtitle = f'\n      <p class="content-subtitle">{esc(project.get("subtitle"))}</p>' if project.get("subtitle") else ""
    external = (
        f'\n    <p><a class="btn" href="{esc(related_url)}">Visit project site</a></p>' if related_url else ""
    )
    indented = "\n".join("    " + line for line in body.split("\n"))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{esc(project["title"])} | Dazhou Hou</title>
  <meta name="description" content="{esc(project.get("summary") or project.get("subtitle") or project["title"])}" />
  <script src="../config.js"></script>
  <link rel="icon" href="../assets/img/favicons/favicon.ico" />
  <link rel="stylesheet" href="../css/base.css" />
  <link rel="stylesheet" href="../css/content.css" />
</head>
<body class="page-content" data-project="{esc(project["slug"])}">
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header">
    <a class="site-brand" href="../index.html">Dazhou Hou</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="../index.html">Home</a>
      <a href="../index.html#about">About Me</a>
      <a href="index.html" aria-current="page">Projects</a>
      <a href="../blog/index.html">Blog</a>
      <a href="../index.html#contact">Contact</a>
    </nav>
  </header>

  <section class="page-hero content-header" id="hero" data-sketch-mode="static" data-sketch-fit="cover">
    <canvas id="hero-canvas" aria-hidden="true"></canvas>
    <p class="content-category">{esc(label)}</p>
    <h1>{esc(project["title"])}</h1>{subtitle}
  </section>

  <main id="main" class="content prose">
{indented}{external}
    <p class="back-link"><a href="index.html">&larr; All projects</a></p>
  </main>

  <footer class="site-footer">
    &copy; Dazhou Hou &middot;
    <a href="https://github.com/houd1018" target="_blank" rel="noopener noreferrer">GitHub</a>
  </footer>

  <script src="../data/projects.js"></script>
  <script src="../js/lightbox.js"></script>
  <script src="../js/content.js"></script>
  <script src="../js/hero-sketch.js"></script>
</body>
</html>
"""


def find_gallery(items: List[ET.Element]) -> List[Dict]:
    for it in items:
        for meta in it.findall("wp:postmeta", NS):
            if text(meta, "wp:meta_key") != "_elementor_data":
                continue
            try:
                data = json.loads(text(meta, "wp:meta_value"))
            except json.JSONDecodeError:
                continue
            found: List[Dict] = []

            def walk(n: object) -> None:
                if isinstance(n, dict):
                    if n.get("widgetType") == "eael-filterable-gallery":
                        found.extend(n.get("settings", {}).get("eael_fg_gallery_items", []))
                    for v in n.values():
                        walk(v)
                elif isinstance(n, list):
                    for v in n:
                        walk(v)

            walk(data)
            if found:
                return found
    return []


def strip_tags(s: str) -> str:
    return clean_title(re.sub(r"<[^>]+>", " ", s or ""))


def elementor_widgets(item: ET.Element, widget_type: str) -> List[Dict]:
    """Return the settings of every Elementor widget of the given type, in document order."""
    found: List[Dict] = []
    for meta in item.findall("wp:postmeta", NS):
        if text(meta, "wp:meta_key") != "_elementor_data":
            continue
        try:
            data = json.loads(text(meta, "wp:meta_value"))
        except json.JSONDecodeError:
            continue

        def walk(n: object) -> None:
            if isinstance(n, dict):
                if n.get("widgetType") == widget_type and isinstance(n.get("settings"), dict):
                    found.append(n["settings"])
                for v in n.values():
                    walk(v)
            elif isinstance(n, list):
                for v in n:
                    walk(v)

        walk(data)
    return found


def elementor_tabs(item: ET.Element) -> List[Tuple[str, str]]:
    """Return [(tab title, template id)] for Essential Addons tabs that load Elementor templates."""
    tabs: List[Tuple[str, str]] = []
    for settings in elementor_widgets(item, "eael-adv-tabs"):
        for t in settings.get("eael_adv_tabs_tab", []):
            tpl = str(t.get("eael_primary_templates") or "")
            if t.get("eael_adv_tabs_text_type") == "template" and tpl:
                tabs.append((clean_title(t.get("eael_adv_tabs_tab_title", "")), tpl))
    return tabs


def cut_at_line(body: str, needle: str) -> Optional[str]:
    """Return the body up to (not including) the first line containing needle, or None."""
    lines = body.split("\n")
    for i, line in enumerate(lines):
        if needle in line:
            if i > 0 and lines[i - 1].startswith(('<div class="link-cards"', "<ul>")) and needle not in lines[i - 1]:
                i -= 1
            return "\n".join(lines[:i])
    return None


def build_tabs(body: str, tabs: List[Tuple[str, str]], templates: Dict[str, str]) -> Tuple[str, int]:
    """Replace the rendered tab widget (always the last widget on these pages) with accessible tabs."""
    panels = [(title, templates[tpl]) for title, tpl in tabs if templates.get(tpl)]
    if not panels:
        return body, 0
    # Panel title is the h2, so demote headings inside panels one level.
    panels = [(t, re.sub(r"<(/?)h([23])>", lambda m: f"<{m.group(1)}h{int(m.group(2)) + 1}>", b)) for t, b in panels]
    prefix = cut_at_line(body, f"<li>{html.escape(panels[0][0], quote=False)}</li>")
    if prefix is None:
        prefix = body
    used: Set[str] = set()
    buttons, sections = [], []
    for i, (title, panel_body) in enumerate(panels):
        tab_id = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or f"tab-{i + 1}"
        while tab_id in used:
            tab_id += "-x"
        used.add(tab_id)
        label = html.escape(title, quote=False)
        selected = "true" if i == 0 else "false"
        buttons.append(
            f'<button type="button" role="tab" id="tab-{tab_id}" aria-controls="{tab_id}" aria-selected="{selected}">{label}</button>'
        )
        own_heading = f"<h3>{label}</h3>"
        if panel_body.startswith(own_heading):
            panel_body = panel_body[len(own_heading):].lstrip("\n")
        sections.append(
            f'<section class="tab-panel" role="tabpanel" id="{tab_id}" aria-labelledby="tab-{tab_id}">\n'
            f"<h2>{label}</h2>\n{panel_body}\n</section>"
        )
    tabs_html = (
        '<div class="tabs" data-tabs>\n<div class="tabs-list" role="tablist">\n'
        + "\n".join(buttons)
        + "\n</div>\n"
        + "\n".join(sections)
        + "\n</div>"
    )
    return (prefix + "\n" + tabs_html).strip("\n"), len(panels)


def build_accordion_cards(
    body: str, item: ET.Element, media: "MediaResolver", linker: "Linker"
) -> Tuple[str, int]:
    """Replace a rendered image accordion with link cards (page links) or a lightbox grid (image links)."""
    entries: List[Dict] = []
    for settings in elementor_widgets(item, "eael-image-accordion"):
        entries.extend(settings.get("eael_img_accordions", []))
    if not entries:
        return body, 0

    keys: List[str] = []
    cards: List[str] = []
    figures: List[str] = []
    for e in entries:
        title = clean_title(e.get("eael_accordion_tittle", ""))
        desc = strip_tags(e.get("eael_accordion_content", ""))
        link = (e.get("eael_accordion_title_link") or {}).get("url", "")
        href, is_media = linker.rewrite(link) if link else ("", False)
        img = media.resolve((e.get("eael_accordion_bg") or {}).get("url", ""))
        if is_media:
            target = media.resolve(link) or img
            keys.append(f'data-media-href="{html.escape(target or "", quote=True)}"')
            caption = f"<figcaption>{html.escape(title, quote=False)}</figcaption>" if title else ""
            alt = html.escape(title or re.sub(r"[-_.]+", " ", Path(target or "").stem), quote=True)
            figures.append(f'<figure><img data-media-src="{html.escape(target or "", quote=True)}" alt="{alt}" loading="lazy">{caption}</figure>')
            continue
        keys.append(f'href="{html.escape(href, quote=True)}"')
        parts = [f'<a class="link-card" href="{html.escape(href, quote=True)}">']
        if img:
            parts.append(
                f'<img class="link-card-img" data-media-src="{html.escape(img, quote=True)}" alt="" loading="lazy" data-no-lightbox>'
            )
        parts.append(f'<span class="link-card-title">{html.escape(title, quote=False)}</span>')
        if desc:
            parts.append(f'<span class="link-card-text">{html.escape(desc, quote=False)}</span>')
        parts.append("</a>")
        cards.append("".join(parts))

    block = []
    if figures:
        cols = 2 if len(figures) in (2, 4) else 3
        block.append(f'<div class="gif-grid gif-grid--{cols}">\n' + "\n".join(figures) + "\n</div>")
    if cards:
        block.append('<div class="link-cards">\n' + "\n".join(cards) + "\n</div>")

    # Replace the lines where the accordion was rendered.
    lines = body.split("\n")
    hits = [i for i, line in enumerate(lines) if any(k in line for k in keys)]
    if not hits:
        return (body + "\n" + "\n".join(block)).strip("\n"), len(entries)
    start, end = min(hits), max(hits)
    if start > 0 and lines[start - 1].startswith('<div class="link-cards"'):
        start -= 1
        if end + 1 < len(lines) and lines[end + 1] == "</div>":
            end += 1
    while end + 1 < len(lines) and lines[end + 1].strip() == "</p>":
        end += 1
    return "\n".join(lines[:start] + block + lines[end + 1 :]), len(entries)


def main(argv: Optional[List[str]] = None) -> int:
    ensure_utf8_stdout()
    ap = argparse.ArgumentParser(description="WordPress XML -> projects/<slug>.html + data/projects.js")
    ap.add_argument("--xml", type=Path, default=DEFAULT_XML)
    ap.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    ap.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA)
    ap.add_argument("--only", help="only (re)generate this slug's page")
    ap.add_argument("--force", action="store_true", help="overwrite existing pages and data/projects.js")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--report", type=Path, help="write a JSON report of problems")
    args = ap.parse_args(argv)

    if not args.xml.is_file():
        print(f"[error] XML not found: {args.xml}", file=sys.stderr)
        return 2
    if not args.manifest.is_file():
        print(f"[warn] manifest not found ({args.manifest}); run scripts/clean_uploads.py first for accurate media paths")

    root = ET.parse(args.xml).getroot()
    items = list(root.iter("item"))
    pages = [
        it for it in items
        if text(it, "wp:post_type") == "page" and text(it, "wp:status") == "publish"
    ]

    page_slugs: Dict[str, str] = {}
    page_ids: Dict[str, str] = {}
    for it in pages:
        name = text(it, "wp:post_name")
        if name in SKIP_PAGES:
            continue
        slug = normalize_slug(name)
        page_slugs[name.lower()] = slug
        page_ids[text(it, "wp:post_id")] = slug

    media = MediaResolver(args.manifest)
    linker = Linker(page_slugs, page_ids)

    def convert(html_body: str) -> Tuple[str, Dict[str, int]]:
        conv = BodyConverter(media, linker)
        conv.feed(html_body)
        conv.close()
        return conv.result(), conv.stats

    templates: Dict[str, str] = {}
    for it in items:
        if text(it, "wp:post_type") == "elementor_library":
            tpl_body, _ = convert(text(it, "content:encoded"))
            if tpl_body:
                templates[text(it, "wp:post_id")] = tpl_body

    # ---- grid entries, in curated order
    projects: List[Dict] = []
    listed: Set[str] = set()
    unknown_categories: List[str] = []
    for g in find_gallery(items):
        title = clean_title(g.get("eael_fg_gallery_item_name", ""))
        cat_raw = clean_title(g.get("eael_fg_gallery_control_name", "")).lower()
        category = CATEGORIES.get(cat_raw)
        if not category:
            unknown_categories.append(f"{title}: {cat_raw!r}")
            category = "games"
        link = (g.get("eael_fg_gallery_img_link") or {}).get("url", "")
        href, _ = linker.rewrite(link) if link else ("", False)
        entry: Dict = {"slug": "", "title": title, "category": category}
        if href.endswith(".html") and "/" not in href:
            entry["slug"] = href[:-5]
        else:
            entry["slug"] = normalize_slug(title)
            entry["url"] = link
        entry["subtitle"] = strip_tags(g.get("eael_fg_gallery_item_content", ""))
        cover = media.resolve((g.get("eael_fg_gallery_img") or {}).get("url", ""))
        if cover:
            entry["cover"] = cover
        projects.append(entry)
        listed.add(entry["slug"])

    by_slug = {p["slug"]: p for p in projects}

    # ---- detail pages
    report: Dict[str, object] = {"pages": {}, "unknown_categories": unknown_categories}
    written = 0
    for it in pages:
        name = text(it, "wp:post_name")
        if name in SKIP_PAGES:
            continue
        slug = page_slugs[name.lower()]
        body, stats = convert(text(it, "content:encoded"))
        body, n_tabs = build_tabs(body, elementor_tabs(it), templates)
        body, n_cards = build_accordion_cards(body, it, media, linker)
        if n_tabs or n_cards:
            stats = dict(stats, videos=body.count("<video"), images=body.count("<img "), tabs=n_tabs, cards=n_cards)

        project = by_slug.get(slug)
        if not project:
            project = {
                "slug": slug,
                "title": clean_title(text(it, "title")),
                "category": UNLISTED_CATEGORIES.get(slug, "games"),
                "listed": False,
            }
            projects.append(project)
            by_slug[slug] = project
        project["date"] = text(it, "wp:post_date")[:10]
        if "cover" not in project:
            first = re.search(r'data-media-src="([^"]+\.(?:png|jpe?g|gif|webp))"', body, re.IGNORECASE)
            if first:
                project["cover"] = first.group(1)

        report["pages"][slug] = dict(stats, listed=slug in listed)  # type: ignore[index]
        target = args.out_dir / f"{slug}.html"
        exists = target.exists()
        status = "skip  " if exists and not args.force else "write "
        if args.only and args.only != slug:
            continue
        print(f"{status} projects/{slug}.html  [{project['category']}{'' if slug in listed else ', unlisted'}]  "
              f"img={stats['images']} video={stats['videos']} embed={stats['embeds']}"
              + (f" tabs={n_tabs}" if n_tabs else "") + (f" cards={n_cards}" if n_cards else ""))
        if not args.dry_run and (args.force or not exists):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(render_page(project, body, None), encoding="utf-8", newline="\n")
            written += 1

    for p in projects:
        if "url" in p:
            print(f"link   {p['slug']} -> {p['url']} (external, no page)")

    key_order = ["slug", "title", "category", "subtitle", "date", "cover", "preview", "video", "url", "listed"]
    entries = []
    for p in projects:
        fields = [f"    {k}: {json.dumps(p[k], ensure_ascii=False)}" for k in key_order if k in p and p[k] not in ("", None)]
        entries.append("  {\n" + ",\n".join(fields) + ",\n  }")
    js = (
        "// Project index — single source of truth. Array order = display order in the grid.\n"
        "// Entries with listed: false have detail pages but are hidden from the grid.\n"
        "window.PROJECTS = [\n" + ",\n".join(entries) + ",\n];\n"
    )

    report["missing_media"] = sorted(media.missing)
    report["unresolved_links"] = sorted(linker.unresolved)
    print(f"\n{len(projects)} projects ({len(listed)} listed), {written} pages written")
    if media.missing:
        print(f"[warn] {len(media.missing)} media paths not found in manifest (see report)")
    if linker.unresolved:
        print(f"[warn] {len(linker.unresolved)} internal links could not be resolved (see report)")
    if unknown_categories:
        print(f"[warn] unknown categories: {unknown_categories}")

    if args.report:
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.dry_run:
        print("Dry run complete. Nothing was written.")
        return 0
    if args.data.exists() and not args.force:
        print(f"[skip] {args.data} exists; use --force to regenerate it")
        return 0
    args.data.parent.mkdir(parents=True, exist_ok=True)
    args.data.write_text(js, encoding="utf-8", newline="\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
