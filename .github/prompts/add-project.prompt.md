---
mode: 'agent'
description: 'Add a new TA project: register it in data/projects.js and generate projects/<slug>.html'
---

# /add-project — Add a project

Follow the [content page rules](../instructions/content-pages.instructions.md) and the [global rules](../copilot-instructions.md).

## Project info

- Title: ${input:title:Project title}
- Category: ${input:category:computer-graphics | tech-art | games | creative-coding}
- Tech stack: ${input:subtitle:Unity / HLSL / Houdini}
- Video link: ${input:video:YouTube / Bilibili URL or media library path, optional}
- One-line summary: ${input:summary:≤ 120 characters}
- Description and media list: ${input:body:Paragraphs of description; media as projects/<slug>/xxx.gif}

## Steps

1. If any required field (title, category, summary) is empty, or the category is not one of the four valid values, ask me first — do not guess.
2. Generate a slug (lowercase ASCII kebab-case) and make sure it is unique in `data/projects.js`; on conflict append a year suffix and tell me.
3. Use `projects/<slug>/<file>` for all media paths. List the files I need to put in `cleaned_media/projects/<slug>/` and upload to R2. If I give local file paths, tell me to copy them there — never copy media into Git-tracked folders.
4. Insert the entry at the top of `data/projects.js` (array order = grid order; fields: `slug, title, category, subtitle, date, cover, preview, video`); `date` defaults to today.
5. Create `projects/<slug>.html` from the rules' skeleton:
   - Header: category label, title, subtitle (tech stack line).
   - If there is a video, the first block is `.media-video` (YouTube → `youtube-nocookie.com/embed/<id>`, Bilibili → `player.bilibili.com/player.html?bvid=<BV>`).
   - Build `content-section`s from the description; multiple GIFs go in a `gif-grid`; code uses `language-*` highlighting; every image has `data-lightbox` + `loading="lazy"` + meaningful `alt`.
6. Self-check with the checklist in section 5 of the rules and confirm there are no errors.
7. Tell me which files were added/changed and how to preview locally (e.g. `python -m http.server 8000`, then `http://localhost:8000/projects/<slug>.html`).
