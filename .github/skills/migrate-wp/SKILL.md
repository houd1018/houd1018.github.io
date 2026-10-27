---
name: migrate-wp
description: 'Regenerate project pages from the WordPress export or re-import the old Jekyll blog posts. Use when changing how WordPress pages are converted (categories, typos, link cards, tabs), re-running scripts/migrate_wp_subpages.py or scripts/migrate_blog_posts.py, or reading migration_report.json.'
argument-hint: 'What to regenerate, e.g. "all project pages" or "only sarapist"'
user-invocable: true
---

# Re-run the WordPress / Jekyll migrations

The one-time migration is done; these scripts stay for reproducible fixes. Prefer fixing the script over hand-editing generated files.

## WordPress projects → `projects/*.html` + `data/projects.js`

Script: [scripts/migrate_wp_subpages.py](../../../scripts/migrate_wp_subpages.py). Inputs: `portfolio_Legacy/dazhouhou.WordPress.2026-10-26.xml` (local only) and `cleaned_media/_manifest.json` (from the `sync-media` skill, part B).

How it works:
- Grid order, categories, subtitles and covers come from the Essential Addons filterable gallery on the WP home page (`_elementor_data`). Other published pages become `listed: false` sub-pages (`UNLISTED_CATEGORIES`).
- Bodies come from `content:encoded`, rebuilt with an allowlist: media → `data-media-*` master paths, bare video URLs → `.media-video`, image runs → `gif-grid`, image-accordion links → `.link-cards`, old `dazhou.io` / `houd1018.github.io/posts/...` links → new URLs.
- Essential Addons tabs (`eael-adv-tabs`, Software Rasterizer / Shader Practice) become accessible `.tabs` built from their `elementor_library` templates; image accordions (`eael-image-accordion`, Game Jams / BVW) become `.link-cards`, or a lightbox `gif-grid` when they link to images.
- Hand-picked fixes: `SLUG_OVERRIDES`, `UNLISTED_CATEGORIES`, `TEXT_FIXES`.

Run:
```powershell
python scripts/migrate_wp_subpages.py --dry-run --report migration_report.json
python scripts/migrate_wp_subpages.py --force --report migration_report.json   # overwrites pages + data/projects.js
python scripts/migrate_wp_subpages.py --force --only <slug>                     # one page (data/projects.js too)
```
`--force` rewrites `data/projects.js`, dropping projects added later by hand. Re-add them (or diff and restore) before committing. Then check `git diff` and `migration_report.json` (`missing_media`, `unresolved_links`).

## Old Jekyll posts → `blog/posts/*.md` + `data/blog.js`

Script: [scripts/migrate_blog_posts.py](../../../scripts/migrate_blog_posts.py), source `_legacy_backup/_posts/`. It strips frontmatter, drops the leading H1, normalizes fence languages, rewrites `/assets/pic/x` to `media:blog/pic/x`. `--force` overwrites posts and `data/blog.js` (posts added later must be re-added).

## After any regeneration

1. Preview with `python -m http.server 8000`; spot-check pages (also with `?media=remote`).
2. Update `.github/` docs if conventions changed, commit.
