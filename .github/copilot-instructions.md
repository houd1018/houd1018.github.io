# houd1018.github.io — Copilot Global Rules

Technical Artist portfolio + tech blog of Howard (Dazhou Hou).
Live site: `https://houd1018.github.io` (GitHub Pages user-site repository).
The WordPress backend is retired; all content is maintained through VS Code Copilot.

---

## 1. Architecture rules (non-negotiable)

1. **Pure static site**: HTML / CSS / vanilla JavaScript only. No Jekyll, no Node build chain, no React/Vue or other frameworks; the site must run without `npm install`.
   - Third-party libraries only via CDN `<script>` with a pinned version + `integrity` (SRI) + `crossorigin="anonymous"`, e.g. `marked`, `highlight.js`.
   - Keep `.nojekyll` at the root so GitHub Pages publishes files as-is.
2. **Code / media separation**:
   - **Never** commit `uploads/`, `portfolio_Legacy/uploads/`, `cleaned_media/`, or any `*.mp4 / *.mov / large *.gif` content media to Git.
   - All content media (images, GIFs, videos, PDFs) is hosted on external object storage (Cloudflare R2 / CDN). The frontend must build URLs **only** through `getMediaUrl(path)` from `config.js` (based on `MEDIA_BASE_URL`).
   - Never hard-code `cleaned_media/...`, `wp-content/uploads/...`, the R2 domain, or any absolute media URL in HTML / JS / Markdown.
   - Exception: small site UI assets (favicon, social icon SVGs, logo; < 50 KB each) may live in `assets/` and be referenced directly.
3. **Media library paths** (relative to `MEDIA_BASE_URL`):
   - Migrated WordPress media: `YYYY/MM/<file>` (same layout as the old `wp-content/uploads/`).
   - Old blog images: `blog/pic/<file>`.
   - New project media: `projects/<slug>/<file>`; new blog media: `blog/<slug>/<file>`.
   - Reference **master files** only — never WP derivatives such as `-150x150`, `-300x200`, `-scaled`, `-e1710660781451`. Use the `redirects` map in `cleaned_media/_manifest.json` to resolve them.
4. **Three valid ways to reference media**:
   - Static HTML: `<img data-media-src="2024/03/water.gif" alt="...">`, `<video data-media-src="..." data-media-poster="...">`, `<a data-media-href="...">`, `<div data-media-bg="...">`. Filled automatically on load by `SiteConfig.hydrateMedia()`.
   - JS rendering: `SiteConfig.getMediaUrl('2024/03/water.gif')`; after inserting DOM, call `SiteConfig.hydrateMedia(container)`.
   - Markdown (blog): `![alt](media:blog/pic/water.gif)`; the blog renderer resolves the `media:` prefix.
5. **Script order**: `config.js` must be the first site script on every page (classic `<script src>`, no `type="module"` or `async`), followed by `data/*.js`, then `js/*.js`. Subpages use relative paths (e.g. `../config.js`) so the site works via `file://`, a local server, and online.
6. **Data is the single source of truth**:
   - Project index: `data/projects.js` → `window.PROJECTS = [...]`; detail pages at `projects/<slug>.html`.
   - Blog index: `data/blog.js` → `window.BLOG_POSTS = [...]`; post bodies at `blog/posts/<slug>.md` (no frontmatter, metadata lives only in `data/blog.js`), rendered by `blog/post.html?slug=<slug>`.
   - `slug` is always lowercase ASCII kebab-case and unique site-wide.
7. **Archive, don't delete**: the old Jekyll/Chirpy files are archived in `_legacy_backup/`; `portfolio_Legacy/` holds the WordPress source material. Never delete either without explicit user confirmation.

## 2. Directory layout

```
index.html              Home: Hero (CMYK) / About / Projects grid / Blog highlights / Contact
config.js               MEDIA_BASE_URL, getMediaUrl, hydrateMedia, siteUrl
css/                    base.css (tokens/nav/footer) home.css content.css
js/                     hero-sketch.js projects-grid.js content.js lightbox.js blog.js
data/                   projects.js blog.js
projects/               index.html + <slug>.html detail pages
blog/                   index.html post.html posts/<slug>.md
scripts/                clean_uploads.py migrate_wp_subpages.py (Python 3.8+, stdlib preferred)
assets/                 small UI assets only (favicon/icons)
_legacy_backup/         archived Jekyll site (read-only)
portfolio_Legacy/       WP export XML, prototype, uploads (uploads is gitignored)
cleaned_media/          cleaned media (gitignored, uploaded to R2)
```

## 3. Visual design

| Token | Value | Usage |
|---|---|---|
| `--hero-bg` | `#4a4a4a` | Hero dark gray background |
| `--card-bg` | `#f5f4f9` | Project/blog card light lavender-gray |
| `--accent` | `#df6c74` | Card titles, accent (coral pink) |
| `--cmyk-c` | `#00aeef` | Cyan |
| `--cmyk-m` | `#ec008c` | Magenta |
| `--cmyk-y` | `#fff200` | Yellow |
| `--cmyk-k` | `#111111` | Black |

- Hero: dark gray background, **curved white bottom edge** (inline SVG wave), centered bio + social icons; background of cyan/magenta/yellow/black **diagonal hand-drawn crayon strokes** with translucent overprint where they cross (Canvas 2D `multiply` compositing in `js/hero-sketch.js`), keeping a grainy hand-drawn feel. Subpages use a shorter `.page-hero` band with a diagonal edge.
- Navigation (top right): `Home` | `About Me` | `Projects` | `Blog` | `Contact`, thin white type, same order on every page.
- Project grid: filters `ALL | COMPUTER GRAPHICS | TECH ART | GAMES | CREATIVE CODING`; 3 columns desktop / 2 tablet / 1 mobile; light lavender-gray cards with coral titles; static cover that switches to a GIF/video preview on hover (lazy-loaded).
- Category ids: `computer-graphics`, `tech-art`, `games`, `creative-coding`.

## 4. Interaction guidelines

- **Calm and refined**: strokes never jitter at high frequency; they only drift with a gentle, staggered vertical "breathing" (low-frequency sine, per-stroke phase/amplitude, a few pixels).
- **3D parallax**: on mouse move, layers offset by depth with eased interpolation (no hard snapping to the cursor).
- **String pluck**: when the cursor passes over a stroke, vertices within a radius of `≈42px` are pushed away elastically and spring back with damping.
- Prefer Canvas 2D / SVG; WebGPU/WebGL is an optional progressive enhancement with a fallback. Run `requestAnimationFrame` only while visible (`IntersectionObserver` / `visibilitychange`).
- Honor `prefers-reduced-motion: reduce`: disable breathing, parallax and pluck; keep a static frame.

## 5. Coding conventions

- Semantic HTML and accessibility: every image has `alt`, interactive elements are keyboard-accessible, sufficient contrast.
- CSS uses custom properties (tokens above), mobile-first, no CSS frameworks.
- JS: vanilla ES2018+, IIFE or a `window.Site*` namespace, no global pollution. Never insert unescaped external/user data via `innerHTML` (sanitize rendered Markdown: strip `<script>` and `on*` attributes).
- External links with `target="_blank"` must have `rel="noopener noreferrer"`; YouTube embeds use `youtube-nocookie.com`.
- Python scripts: `argparse` CLI, provide `--dry-run`, never delete source files, force UTF-8 output on Windows (file names may contain CJK characters).

## 6. Content workflows (slash commands)

- `/clean-media`: clean WP uploads → `cleaned_media/` (`scripts/clean_uploads.py`).
- `/migrate-wp`: WordPress XML → `projects/<slug>.html` + `data/projects.js`.
- `/add-project`: add a project (register in `data/projects.js` + generate detail page).
- `/add-blog`: add a blog post (`blog/posts/<slug>.md` + `data/blog.js`).

Content page layout details: `.github/instructions/content-pages.instructions.md`.
