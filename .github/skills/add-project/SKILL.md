---
name: add-project
description: 'Add or update a portfolio project: register it in data/projects.js, write projects/content/<slug>.md (Markdown with hero, overview, meta, row, gallery, tabs, cards blocks) and generate the projects/<slug>.html shell. Use when the user has a new tech art / graphics / game / creative coding project, wants to edit a project page, change a card cover, or reorder the project grid.'
argument-hint: 'Project title, category, tech stack, video link, description and media files'
---

# Add a portfolio project

Follow [content page rules](../../instructions/content-pages.instructions.md) and the [global rules](../../copilot-instructions.md).

## Inputs (ask for anything missing; never invent content)

- Title, categories (1–3 of `shaders` | `vfx` | `tools` | `procedural` | `environment` | `computer-graphics` | `games` | `creative-coding`)
- Subtitle / tech stack line (e.g. `Unity / HLSL / Houdini`)
- Facts for the meta box: context (course, team, client), role, tools, platform, links
- Optional: video (YouTube / Bilibili URL or media path), external project URL
- Description, highlights (what *I* did), and the list of media files with what each shows

## Procedure

1. Choose a slug (lowercase ASCII kebab-case), unique in `data/projects.js`.
2. Media goes to `cleaned_media/projects/<slug>/`; reference it as `media:projects/<slug>/<file>`. Upload with the `sync-media` skill (step A). Never copy media into Git-tracked folders.
3. Insert an entry at the **top** of `window.PROJECTS` in `data/projects.js` (array order = grid order):
   `{ slug, title, categories, subtitle, date, cover, preview?, video?, url?, from? }`. Use `listed: false` for sub-pages that should not appear in the grid. If `url` is set the card links externally and no page is needed.
4. Write `projects/content/<slug>.md` following section 2 of the content rules (copy the structure of `projects/content/sarapist.md`):
   - `:::hero` with the main video or best GIF.
   - `:::overview` (1–2 short paragraphs + highlight bullets) and `:::meta` (only known facts).
   - `##` sections with one `:::row` per feature (heading + short text + its media), `:::gallery N` for collections, `:::tabs` for multi-part projects, `:::cards` for sub-projects.
   - Every image/video needs meaningful alt text; captions go in the quoted title.
5. Generate the shell: `python scripts/build_project_pages.py --only <slug>`.
6. Preview: `python -m http.server 8000` → `http://localhost:8000/projects/<slug>.html` (add `?media=remote` to test R2). Check that no `:::` text is left on the page.
7. Run the checklist in the content rules, then commit (and push only if the user asks).

Changing a title, subtitle or categories in `data/projects.js` requires re-running `scripts/build_project_pages.py` so the shell matches.

## Professional work (game titles)

Work on shipped / in-development games goes in `data/professional.js` (title, `cover`, `trailer { video | youtube | bilibili }`, `contributions[] { title, tags, summary, project? }`); there are no per-title pages. A contribution that deserves its own page is written as a normal project with `from: "<title-slug>"` and linked via `project`. Ask which title a contribution was developed under; never publish unannounced or non-public details.
