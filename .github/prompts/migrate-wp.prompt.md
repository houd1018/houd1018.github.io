---
mode: 'agent'
description: 'Parse the WordPress export XML and generate project detail pages plus the data/projects.js index'
---

# /migrate-wp — WordPress project page migration

Input XML: ${input:xml:portfolio_Legacy/dazhouhou.WordPress.2026-10-26.xml}

Follow the [content page rules](../instructions/content-pages.instructions.md) and the [global rules](../copilot-instructions.md).

## Prerequisites

1. `cleaned_media/_manifest.json` must exist (otherwise run `/clean-media` first). Use its `redirects` map to rewrite thumbnail references to master paths.
2. If [scripts/migrate_wp_subpages.py](../../scripts/migrate_wp_subpages.py) does not exist, create it to this spec (Python stdlib only: `xml.etree.ElementTree`, `html.parser`, `re`, `json`):
   - Parse `<item>` elements; only process `wp:post_type` of `page` / `post` / `portfolio` (and Visual Portfolio `vp_*` types) with `wp:status` = `publish`. Skip `attachment`, `nav_menu_item`, `elementor_library`, `wp_template*` and other system types.
   - Extract: title, slug (`wp:post_name`, normalized to lowercase kebab-case), date, categories/tags (`<category domain=...>`), `content:encoded` body, featured image (`_thumbnail_id` → the attachment's `wp:attachment_url`).
   - For Elementor pages with empty `content:encoded`, parse the `_elementor_data` JSON in `wp:postmeta` (widgets: `heading`, `text-editor`, `image`, `video`, `image-gallery`, `code-highlight`).
   - Rewrite every `…/wp-content/uploads/YYYY/MM/file` to the media library path `YYYY/MM/file`, map it to the master via the manifest `redirects`, and emit `data-media-src` / `data-media-poster` / `data-media-href`.
   - Convert YouTube / Vimeo / Bilibili links and iframes into `.media-video` containers (YouTube via `youtube-nocookie.com`).
   - Turn ≥ 2 consecutive images/GIFs into `gif-grid gif-grid--2|3`; code blocks into `<pre><code class="language-…">`.
   - Strip WP/Elementor inline styles, `class="wp-*"`, `srcset`, `sizes`, `[...]` shortcodes, `<script>`, and `on*` attributes.
   - Generate `projects/<slug>.html` (using the skeleton from the rules) and write `data/projects.js`. Skip existing pages by default; overwrite only with `--force`.
   - Provide `--dry-run`, `--only <slug>`, `--report migration_report.json` (unmatched media, unknown categories, failed items).

## Steps

1. Dry run:
   ```powershell
   python scripts/migrate_wp_subpages.py --xml "${input:xml:portfolio_Legacy/dazhouhou.WordPress.2026-10-26.xml}" --manifest cleaned_media/_manifest.json --dry-run --report migration_report.json
   ```
2. List the projects to be generated (title / slug / inferred category / media count / video count / missing media). Categories must map to `computer-graphics | tech-art | games | creative-coding`; ask me about any that can't be inferred.
3. After I confirm categories, run for real, then spot-check 3 generated pages: no `wp-content/uploads`, no thumbnail suffixes, correct script order.
4. Report issues from `migration_report.json` with suggested fixes.
