# houd1018.github.io

Portfolio and tech blog of Dazhou (Howard) Hou — technical artist and game programmer.
Live at **https://houd1018.github.io**.

A pure static site (HTML / CSS / vanilla JS, no build step). Code lives in this repo and is deployed by GitHub Pages; images, GIFs and videos live in a Cloudflare R2 bucket and are loaded through `MEDIA_BASE_URL` in [config.js](config.js).

## Layout

| Path | What |
|---|---|
| `index.html` | Home: CMYK hero, About, project grid, latest posts, contact |
| `projects/` | `index.html` (grid) + one `<slug>.html` per project |
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

Open http://localhost:8000. Media loads from `cleaned_media/`; add `?media=remote` to any URL to load it from R2 instead. Blog posts need the server (opening files directly with `file://` won't load them).

## Media rules (important)

- Never commit images, GIFs or videos. Put them in `cleaned_media/` and upload to R2.
- Paths are relative to the media root: `projects/<slug>/<file>` for projects, `blog/<slug>/<file>` for posts.
- Reference media only as:
  - HTML: `<img data-media-src="projects/my-slug/demo.gif" alt="…">`, `<video data-media-src="…">`
  - Markdown: `![alt](media:blog/my-slug/demo.gif)` (wrap in `<…>` if the name has spaces)
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
3. Copy an existing page (e.g. [projects/sarapist.html](projects/sarapist.html)) to `projects/my-shader.html` and replace the title, description, `data-project`, category, subtitle and the content inside `<main>`. Building blocks:
   ```html
   <div class="media-video"><iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="Demo" loading="lazy" allowfullscreen></iframe></div>
   <p>Text…</p>
   <h2>Section</h2>
   <figure class="media-figure"><img data-media-src="projects/my-shader/a.gif" alt="…" loading="lazy"></figure>
   <div class="gif-grid gif-grid--2">
     <figure><img data-media-src="projects/my-shader/b.gif" alt="…" loading="lazy"></figure>
     <figure><img data-media-src="projects/my-shader/c.gif" alt="…" loading="lazy"></figure>
   </div>
   <pre><code class="language-hlsl">half4 frag (v2f i) : SV_Target { … }</code></pre>
   ```
   Images open in a lightbox automatically.
4. Preview at `http://localhost:8000/projects/my-shader.html`.

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
