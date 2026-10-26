---
name: add-blog
description: 'Write or edit a technical blog post in the Blog section: create blog/posts/<slug>.md and register it in data/blog.js. Use when the user wants to publish notes about shaders, rendering, Unity, Unreal, Houdini, VFX or programming, fix a post, or change a post summary or cover.'
argument-hint: 'Post title, category, tags and the draft / bullet points'
---

# Add a blog post

Follow [content page rules](../../instructions/content-pages.instructions.md) and the [global rules](../../copilot-instructions.md).

## Inputs (ask for anything missing; never invent technical content)

- Title, category (existing ones: Shader, Unity, VFX, Material, DCC, C++, C#, Learning), lowercase tags
- Draft text or bullet points, media files

## Procedure

1. Choose a slug (lowercase ASCII kebab-case), unique in `data/blog.js` and `blog/posts/`.
2. Create `blog/posts/<slug>.md`:
   - No frontmatter; start at `##` (the page renders the title).
   - Images: `![alt](media:blog/<slug>/file.gif)`; use `![alt](<media:blog/<slug>/file name.gif>)` when the name has spaces or parentheses.
   - Fenced code with a language (`hlsl`, `glsl`, `cpp`, `csharp`, `python`).
   - Callouts: `> **Tip:** …`. Block math: `$$ … $$` (KaTeX loads automatically).
   - Videos / GIF grids: HTML blocks from the content rules (`data-media-src`). Only youtube-nocookie / bilibili / vimeo iframes survive sanitization.
   - Polish structure only; mark uncertain content with `<!-- TODO: -->`.
3. Insert `{ slug, title, date, category, tags, summary, cover? }` into `data/blog.js`, keeping it **newest first**. `cover` is a media path; the first GIF works well.
4. Media goes to `cleaned_media/blog/<slug>/`; upload with the `sync-media` skill.
5. Preview over HTTP (posts are fetched, `file://` will not work): `python -m http.server 8000` → `http://localhost:8000/blog/post.html?slug=<slug>`. Headings get kramdown-style ids, so `#section-name` anchors work.
6. Run the checklist in the content rules, then commit (push only if asked).
