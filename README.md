# houd1018.github.io

Portfolio and tech blog of Dazhou (Howard) Hou — technical artist and game programmer.
Live at **https://houd1018.github.io**.

A pure static site (HTML / CSS / vanilla JS, no build step). Code lives in this repo and is deployed by GitHub Pages; images, GIFs and videos live in a Cloudflare R2 bucket and are loaded through `MEDIA_BASE_URL` in [config.js](config.js).

## Layout

| Path | What |
|---|---|
| `index.html` | Home: CMYK hero, About, project grid, latest posts, contact |
| `projects/` | `index.html` (grid), `content/<slug>.md` (project content), `<slug>.html` (generated shells) |
| `professional/` | One page per shipped game title: `content/<slug>.md` + generated `<slug>.html` |
| `data/professional.js` | Game titles shown in the Professional section |
| `blog/` | `index.html` (list), `post.html?slug=…` (renderer), `posts/<slug>.md` (post bodies) |
| `data/projects.js` | Project index — order here = order in the grid |
| `data/blog.js` | Blog index — newest first |
| `css/`, `js/` | Styles and scripts (`hero-sketch.js` draws the hero) |
| `config.js` | Media URL switch (local `cleaned_media/` ↔ R2) |
| `scripts/` | Media cleaner and WordPress / Jekyll migration scripts |
| `.github/` | Copilot rules, skills, deploy workflow |
| `_legacy_backup/` | Archived Jekyll site (not deployed) |
| `cleaned_media/` | Local copy of all media (git-ignored, mirrored to R2) |

## Preview locally

```powershell
python -m http.server 8000
```

Open http://localhost:8000. Media loads from `cleaned_media/`; add `?media=remote` to any URL to load it from R2 instead. Blog posts and project pages need the server (opening files directly with `file://` won't load them).

## Media rules (important)

- Never commit images, GIFs or videos. Put them in `cleaned_media/` and upload to R2.
- Paths are relative to the media root: `projects/<slug>/<file>` for projects, `blog/<slug>/<file>` for posts.
- Reference media only as:
  - HTML: `<img data-media-src="projects/my-slug/demo.gif" alt="…">`, `<video data-media-src="…">`
  - Markdown (blog posts, project content): `![alt](media:blog/my-slug/demo.gif)` (wrap in `<…>` if the name has spaces)
- Upload new files:
  ```powershell
  rclone copy cleaned_media r2:houd1018-media --exclude _manifest.json --progress
  ```
  (`rclone` remote `r2` must be configured once with your own R2 API token.)

## Add a project

**With Copilot (recommended):** in Copilot Chat type `/add-project` and describe the project (title, category, tech stack, video link, text, media files). It registers the project, creates the page, and tells you which media to upload.

**By hand:**

1. Pick a slug, e.g. `my-shader`. Copy media to `cleaned_media/projects/my-shader/` and upload it (see above).
2. Add an entry at the **top** of `window.PROJECTS` in [data/projects.js](data/projects.js):
   ```js
   {
     slug: "my-shader",
     title: "My Shader",
     category: "tech-art",            // computer-graphics | tech-art | games | creative-coding
     subtitle: "Unity / URP / HLSL",  // tech stack line on the card
     date: "2026-10-27",
     cover: "projects/my-shader/cover.gif",
   },
   ```
   Optional fields: `preview` (hover GIF/mp4), `video`, `url` (external link, no page needed), `listed: false` (page exists but hidden from the grid).
3. Write the page content in `projects/content/my-shader.md` (Markdown plus `:::` layout blocks; see [projects/content/sarapist.md](projects/content/sarapist.md) for a full example):
   ```md
   :::hero
   ![Demo](youtube:VIDEO_ID)
   :::

   :::overview
   What the project is, in a sentence or two.

   - What I built
   - Another highlight
   :::

   :::meta
   Role: Technical Artist
   Tools: Unity, URP, HLSL
   Links: [Breakdown](../blog/post.html?slug=my-notes)
   :::

   ## Features

   :::row
   ### Water shader
   How it works, in a few lines.

   ![Water](media:projects/my-shader/water.gif)
   :::

   :::gallery 3
   ![A](media:projects/my-shader/a.gif "Caption A")
   ![B](media:projects/my-shader/b.gif "Caption B")
   ![C](media:projects/my-shader/c.mp4#loop "Looping clip")
   :::
   ```
   Rows put text beside media and alternate sides; `:::tabs` with `:::tab Label` blocks and `:::cards` (link cards to sub-projects) are also available. Full reference: [content rules](.github/instructions/content-pages.instructions.md).
4. Generate the page shell: `python scripts/build_project_pages.py --only my-shader` (re-run it whenever the title, subtitle or category changes).
5. Preview at `http://localhost:8000/projects/my-shader.html`.

## Add professional work (shipped game titles)

1. Add the title to [data/professional.js](data/professional.js) (newest first): `slug`, `title`, `year`, `status` (`Shipped` / `In development`), `focus` (one line on the card), `trailer` (YouTube id), optional `cover` (key art from the media library; otherwise the trailer thumbnail is used).
2. Write `professional/content/<slug>.md` with the same blocks as projects (see [battlefield-6.md](professional/content/battlefield-6.md)). Each contribution is one block:
   ```md
   :::contribution tool, procedural | also: battlefield-2042
   ### Vegetation Houdini Tools
   What it does, what I did, the impact.

   ![Tool UI](media:professional/battlefield-6/veg-ui.png)
   ![Result](media:professional/battlefield-6/veg.mp4#loop)
   :::
   ```
   Tags (`tool`, `shader`, `vfx`, `procedural`, `pipeline`, …) become the filter chips on the page. Write a shared tool once, under the title where it was developed, and list the other titles after `also:`. Add `| more: <page>.html` for a "Read more →" link to a deep-dive page: register it in `data/professional.js` with `parent: "<title-slug>"` (see `battlefield-2042-war-machine-cosmetics`).
3. Run `python scripts/build_project_pages.py --only <slug>`.
4. Optional: to feature a contribution in the project grid, add a normal entry to `data/projects.js` with `from: "<title-slug>"` (shows a badge) and `url: "professional/<slug>.html#<contribution-id>"` (the id is the contribution heading in kebab-case).

Only publish footage and details your studio has made public.

## Add a blog post

**With Copilot (recommended):** type `/add-blog` and paste your draft or notes.

**By hand:**

1. Pick a slug, e.g. `my-notes`. Put media in `cleaned_media/blog/my-notes/` and upload it.
2. Create `blog/posts/my-notes.md` — plain Markdown, **no frontmatter**, start with `##` headings:
   ````md
   ## Overview

   ![Result](media:blog/my-notes/result.gif)

   ```hlsl
   float4 frag(v2f i) : SV_Target { return _Color; }
   ```

   > **Tip:** callouts are blockquotes.

   $$ L_o = \int f_r L_i \cos\theta \, d\omega $$
   ````
3. Add an entry at the **top** of `window.BLOG_POSTS` in [data/blog.js](data/blog.js) (newest first):
   ```js
   {
     slug: "my-notes",
     title: "My Notes",
     date: "2026-10-27",
     category: "Shader",
     tags: ["unity", "shader"],
     summary: "One or two sentences shown on the card.",
     cover: "blog/my-notes/result.gif",
   },
   ```
4. Preview at `http://localhost:8000/blog/post.html?slug=my-notes`.

## Publish

```powershell
git add -A
git commit -m "Add my-shader project"
git push
```

Pushing to `main` runs [.github/workflows/pages-deploy.yml](.github/workflows/pages-deploy.yml), which publishes only the site files (no media, archives or scripts). Upload media to R2 **before** pushing pages that use it.

## Copilot setup

- Rules: [.github/copilot-instructions.md](.github/copilot-instructions.md), [AGENTS.md](AGENTS.md), [.github/instructions/content-pages.instructions.md](.github/instructions/content-pages.instructions.md)
- Skills (slash commands): `/add-project`, `/add-blog`, `/sync-media`, `/migrate-wp` in [.github/skills/](.github/skills/)
