---
name: add-project
description: 'Add or update a portfolio project: register it in data/projects.js and create projects/<slug>.html with videos, GIF grids, code blocks and lightbox images. Use when the user has a new tech art / graphics / game / creative coding project, wants to edit a project page, change a card cover, or reorder the project grid.'
argument-hint: 'Project title, category, tech stack, video link, description and media files'
---

# Add a portfolio project

Follow [content page rules](../../instructions/content-pages.instructions.md) and the [global rules](../../copilot-instructions.md).

## Inputs (ask for anything missing; never invent content)

- Title, category (`computer-graphics` | `tech-art` | `games` | `creative-coding`)
- Subtitle / tech stack line (e.g. `Unity / HLSL / Houdini`)
- Optional: video (YouTube / Bilibili URL or media path), external project URL
- Description paragraphs and the list of media files

## Procedure

1. Choose a slug (lowercase ASCII kebab-case), unique in `data/projects.js`.
2. Media goes to `cleaned_media/projects/<slug>/`; reference it as `projects/<slug>/<file>`. Upload with the `sync-media` skill (step A). Never copy media into Git-tracked folders.
3. Insert an entry at the **top** of `window.PROJECTS` in `data/projects.js` (array order = grid order):
   `{ slug, title, category, subtitle, date, cover, preview?, video?, url? }`. Use `listed: false` for sub-pages that should not appear in the grid. If `url` is set the card links externally and no page is needed.
4. Create `projects/<slug>.html` by copying an existing page (e.g. `projects/sarapist.html`) and replacing title, meta description, `data-project`, category label, subtitle and the `<main>` blocks:
   - Video first if present (`.media-video`; YouTube → `https://www.youtube-nocookie.com/embed/<id>`).
   - Text in `<p>` / `<h2>`; 2–4 related GIFs in `.gif-grid gif-grid--2|3`; single images in `.media-figure`.
   - Images: `<img data-media-src="projects/<slug>/x.gif" alt="meaningful text" loading="lazy">` (lightbox is added automatically).
   - Code: `<pre><code class="language-hlsl">…</code></pre>` with `<`, `>`, `&` escaped.
5. Preview: `python -m http.server 8000` → `http://localhost:8000/projects/<slug>.html` (add `?media=remote` to test R2).
6. Run the checklist in the content rules, then commit (and push only if the user asks).

Pages generated from WordPress can be regenerated with `scripts/migrate_wp_subpages.py --force` (see the `migrate-wp` skill); hand edits to those pages are overwritten, so put lasting fixes in the script (`TEXT_FIXES`, `UNLISTED_CATEGORIES`, …).
