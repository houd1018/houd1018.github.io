---
mode: 'agent'
description: 'Add a new tech blog post and update the data/blog.js index'
---

# /add-blog — Add a blog post

Follow the [content page rules](../instructions/content-pages.instructions.md) and the [global rules](../copilot-instructions.md).

## Post info

- Title: ${input:title:Post title}
- Category: ${input:category:Shader / Unity / Unreal / DCC / VFX / Graphics / Programming}
- Tags: ${input:tags:lowercase, comma-separated}
- Summary: ${input:summary:One or two sentences}
- Draft or outline: ${input:body:Paste a Markdown draft or bullet points}

## Steps

1. If required fields (title, category, body) are missing, ask me first — never invent technical content.
2. Generate a slug (lowercase ASCII kebab-case) and confirm it is unique in `data/blog.js` and `blog/posts/`.
3. Create `blog/posts/<slug>.md`:
   - No frontmatter; body starts at a `##` heading.
   - Images/GIFs always `![alt](media:blog/<slug>/<file>)`; videos and multi-image comparisons use the HTML blocks from the rules (`data-media-src`).
   - Fenced code blocks with a language (`hlsl`, `glsl`, `cpp`, `csharp`, `python`, …).
   - Callouts as `> **Tip:** …` / `> **Note:** …`.
   - Only polish formatting and structure; don't change my technical conclusions. Mark anything uncertain with `<!-- TODO: -->`.
4. Insert into `data/blog.js` in newest-first order: `{ slug, title, date, category, tags, summary, cover }`; `date` defaults to today, `cover` is optional (media library path).
5. List the media files I need to put in `cleaned_media/blog/<slug>/` and upload to R2.
6. Run the checklist in section 5 of the rules, then tell me the added/changed files and the preview URL `blog/post.html?slug=<slug>`.
