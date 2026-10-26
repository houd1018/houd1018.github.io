# AGENTS.md

Static portfolio + tech blog for Howard (Dazhou Hou), deployed at `https://houd1018.github.io`.
Full rules: [.github/copilot-instructions.md](.github/copilot-instructions.md). Content page rules: [.github/instructions/content-pages.instructions.md](.github/instructions/content-pages.instructions.md).

## Non-negotiables

- Pure static site (HTML/CSS/vanilla JS). No Jekyll, no bundler, no framework. CDN libs only with pinned version + SRI.
- Never commit `uploads/`, `portfolio_Legacy/uploads/`, `cleaned_media/`, videos or large GIFs.
- All content media (images, GIFs, videos, PDFs) load via `SiteConfig.getMediaUrl(path)` / `data-media-*` attributes / `media:` prefix in Markdown, all based on `MEDIA_BASE_URL` in `config.js`. Never hard-code media URLs.
- Media library paths: `YYYY/MM/<file>` (WordPress), `blog/pic/<file>` (old blog), `projects/<slug>/<file>`, `blog/<slug>/<file>`. Reference master files only, never WP thumbnails (`-150x150`, `-scaled`, `-e<timestamp>`).
- `config.js` is the first site script on every page; subpages use relative paths (`../config.js`).
- Single sources of truth: `data/projects.js` (`window.PROJECTS`) and `data/blog.js` (`window.BLOG_POSTS`).
- Do not delete `_legacy_backup/` or `portfolio_Legacy/` without explicit user confirmation.

## Infrastructure

- Deploy: push to `main` → `.github/workflows/pages-deploy.yml` publishes an allowlist of site files to GitHub Pages.
- Media: Cloudflare R2 bucket `houd1018-media`, public base `https://pub-af66391f274d47529898def605b4df9a.r2.dev/`; local mirror `cleaned_media/`; upload with `rclone copy cleaned_media r2:houd1018-media`.
- Workflows: skills in `.github/skills/` (`add-project`, `add-blog`, `sync-media`, `migrate-wp`).
- When conventions change, update `.github/copilot-instructions.md`, this file, the content instructions and affected skills in the same commit.

## Visual system

- Hero `#4a4a4a`, curved white bottom edge, centered bio + social icons, CMYK (cyan/magenta/yellow/black) diagonal hand-drawn strokes with translucent overprint.
- Cards `#f5f4f9`, titles `#df6c74`. Nav: `Home | About Me | Projects | Blog | Contact`.
- Filters: `ALL | COMPUTER GRAPHICS | TECH ART | GAMES | CREATIVE CODING`.
- Motion: calm low-frequency breathing, eased 3D parallax on mouse move, local elastic "string pluck" within radius ≈ 42px; honor `prefers-reduced-motion`.
