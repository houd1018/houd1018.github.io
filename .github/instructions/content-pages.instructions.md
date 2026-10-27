---
applyTo: "projects/**,blog/**,data/**"
description: "Layout and media rules for project detail pages, blog posts, and data indexes"
---

# Content page rules (Projects / Blog / Data)

Everything here builds on the architecture rules in `.github/copilot-instructions.md`: **all content media must load through `MEDIA_BASE_URL`**.

## 1. Data indexes

### `data/projects.js`

```js
window.PROJECTS = [
  {
    slug: 'interactive-sand-desert-scene',   // lowercase kebab-case, unique, maps to projects/<slug>.html
    title: 'Interactive Sand – Stylized Desert Scene',
    category: 'tech-art',                    // computer-graphics | tech-art | games | creative-coding
    subtitle: 'URP / HLSL / 3D Environment', // tech stack line shown on the card
    date: '2024-04-11',                      // ISO date
    cover: '2024/04/Sand.gif',               // media library path (card cover)
    preview: '2024/04/Sand.mp4',             // optional: hover preview GIF or .mp4
    video: 'https://www.youtube.com/watch?v=XXXX', // optional: main video
    url: 'https://example.com/',             // optional: external project, card links here (no detail page)
    listed: false,                           // optional: has a detail page but is hidden from the grid
  },
];
```

- **Array order is the display order** of the grid (curated). New projects go at the top unless the user says otherwise.
- `listed: false` entries are sub-pages (e.g. individual game-jam / BVW projects) linked from other project pages.

### `data/blog.js`

```js
window.BLOG_POSTS = [
  {
    slug: 'interactive-desert-shader',       // maps to blog/posts/<slug>.md
    title: 'Interactive Desert',
    date: '2024-04-04',
    category: 'Shader',
    tags: ['unity', 'shader', 'urp'],
    summary: '…',
    cover: 'blog/pic/Sand.gif',              // optional
  },
];
```

- `data/blog.js` stays sorted by `date`, newest first. Do not reformat or reorder fields of other entries.
- Never store full media URLs in these files — only media library paths.

## 2. Project detail pages

Each project has two files:

- `projects/content/<slug>.md` — **the content you edit**: Markdown plus `:::` layout blocks.
- `projects/<slug>.html` — a generated shell (header, sketch band with category/title/subtitle from `data/projects.js`, empty `<article id="project-body">`). Never hand-edit it; run `python scripts/build_project_pages.py [--only <slug>]` after adding a project or changing its title/subtitle/category.

`js/project-page.js` fetches the Markdown (needs HTTP, like blog posts), renders it with `marked`, sanitizes with DOMPurify, then lays out the blocks.

### Page structure (in this order)

```md
:::hero
![Gameplay trailer](youtube:VIDEO_ID)
:::

:::overview
One or two short paragraphs: what the project is.

- Highlight of what I did (bullets here render as highlight dots)
- Another highlight
:::

:::meta
Context: CMU ETC · Building Virtual Worlds Round 1 · Team 10
Role: Technical Artist
Tools: Unity, C#, Shader Graph
Platform: Quest 2 (VR)
Links: [Play on itch.io](https://…) · [Breakdown](../blog/post.html?slug=…)
:::

## Section heading

:::row
### Feature name
Text explaining the feature.

![Feature result](media:projects/<slug>/feature.gif)
:::
```

- `hero` (optional): one media item shown full width under the title band.
- `overview` + `meta`: rendered side by side (meta is a `Key: value` list; values allow inline Markdown links). Use only facts the user gave; omit unknown keys.
- `row [reverse|normal]`: text beside media; media items (images, videos, galleries) go to the media column, everything else to the text column. Rows alternate sides automatically; several media items stack (images in two columns).
- `gallery N` (N = 1–4): grid of media items; the title in quotes becomes the caption.
- `cards`: list items `- [Title](slug.html) Subtitle ![](media:cover.jpg)` → link cards to sub-projects.
- `tabs` containing `:::tab Label` blocks (each closed with `:::`): tab panel ids derive from the label (`#pathtracer` deep links). Headings inside tabs start at `###`/`####`.
- Plain Markdown (paragraphs, `##` headings, lists, code fences, single media) can go anywhere between blocks. Every block opener needs its own `:::` closer.

### Media syntax (projects)

| Markdown | Renders as |
|---|---|
| `![alt](media:path/x.gif "Caption")` | figure with lightbox image and optional caption |
| `![alt](media:path/x.mp4)` | 16:9 video player with controls (`#9x16` / `#4x3` suffix changes aspect) |
| `![alt](media:path/x.mp4#loop)` | silent autoplay loop, like a GIF |
| `![title](youtube:ID)`, `bilibili:BV…`, `vimeo:ID` | embedded player (youtube-nocookie) |

Raw HTML components from section 3 still work inside the Markdown (sanitized; `data-media-*` attributes are hydrated).

## 3. HTML components (blog posts, raw HTML in Markdown)

### Responsive video container (16:9)

```html
<!-- YouTube: use the nocookie domain -->
<div class="media-video">
  <iframe src="https://www.youtube-nocookie.com/embed/{id}" title="{Title} demo"
          loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen></iframe>
</div>

<!-- Bilibili -->
<div class="media-video">
  <iframe src="https://player.bilibili.com/player.html?bvid={BV}&autoplay=0" title="{Title} demo"
          loading="lazy" allowfullscreen sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"></iframe>
</div>

<!-- Self-hosted video from the media library -->
<div class="media-video">
  <video controls playsinline preload="metadata"
         data-media-src="2024/03/Sketch.mp4" data-media-poster="2023/10/sketch.jpg"></video>
</div>
```

- Portrait / non-16:9 videos add a modifier: `media-video--9x16`, `media-video--4x3`.
- Short mp4 clips used as "animated images": `<video autoplay muted loop playsinline data-media-src="...">` (preferred over huge GIFs).

### Multi-column GIF / image comparison grid

```html
<figure class="gif-grid gif-grid--3">
  <figure><img data-media-src="2024/03/water.gif" alt="Water shader" loading="lazy" data-lightbox><figcaption>Water</figcaption></figure>
  <figure><img data-media-src="2024/03/rim.gif" alt="Rim light" loading="lazy" data-lightbox><figcaption>Rim</figcaption></figure>
  <figure><img data-media-src="2024/03/masking.gif" alt="Masking" loading="lazy" data-lightbox><figcaption>Masking</figcaption></figure>
</figure>
```

- Column modifiers: `gif-grid--2` / `gif-grid--3` / `gif-grid--4`; collapses to 1–2 columns on mobile.
- Before / After: `<figure class="compare">` with two inner `figure`s captioned `Before` / `After`.

### Single image + lightbox

```html
<figure class="media-figure">
  <img data-media-src="2024/03/bsdf_diagrams.png" alt="BSDF diagram" loading="lazy" data-lightbox>
  <figcaption>Caption</figcaption>
</figure>
```

- All body images get `data-lightbox` by default (except logos/icons).
- Meaningful `alt` is required; `loading="lazy"` is required (except above-the-fold covers).

### Tabs (multi-part projects)

```html
<div class="tabs" data-tabs>
  <div class="tabs-list" role="tablist">
    <button type="button" role="tab" id="tab-rasterizer" aria-controls="rasterizer" aria-selected="true">Rasterizer</button>
    <button type="button" role="tab" id="tab-pathtracer" aria-controls="pathtracer" aria-selected="false">Pathtracer</button>
  </div>
  <section class="tab-panel" role="tabpanel" id="rasterizer" aria-labelledby="tab-rasterizer"><h2>Rasterizer</h2> … </section>
  <section class="tab-panel" role="tabpanel" id="pathtracer" aria-labelledby="tab-pathtracer"><h2>Pathtracer</h2> … </section>
</div>
```

- `js/content.js` wires it up (click, arrow keys, `#panel-id` deep links); without JS all panels show in order. Headings inside panels start at `h3`.

### Link cards (sub-projects)

```html
<div class="link-cards">
  <a class="link-card" href="sarapist.html"><img class="link-card-img" data-media-src="2023/10/Sarapist.jpg" alt="" loading="lazy" data-no-lightbox><span class="link-card-title">Sarapist</span><span class="link-card-text">BVW Round 1</span></a>
</div>
```

### Code blocks (Shader / C++ / C# / Python)

```html
<pre><code class="language-hlsl">half4 frag (v2f i) : SV_Target { ... }</code></pre>
```

- Language classes: `language-hlsl`, `language-glsl`, `language-cpp`, `language-csharp`, `language-python`, `language-shaderlab`, `language-wgsl`. `js/content.js` registers `hlsl`/`shaderlab`/`wgsl` as `cpp` aliases for highlight.js.
- `<`, `>`, `&` inside code must be HTML-escaped.

### Text blocks

- `<section class="content-section"><h2>…</h2><p>…</p></section>`; headings start at `h2` and never skip levels.
- External links: `target="_blank" rel="noopener noreferrer"`.

## 4. Blog Markdown `blog/posts/<slug>.md`

- **No frontmatter**; metadata lives only in `data/blog.js`. Body starts at `##` (the page renders the `#` title from `title`).
- Images: `![alt](media:blog/<slug>/xxx.gif)`; legacy posts: `![alt](media:blog/pic/xxx.png)`. Never `/assets/pic/...` or absolute media URLs.
- Fenced code blocks with a language: ```` ```hlsl ````, ```` ```cpp ````, ```` ```csharp ````.
- Callouts (replacing Chirpy's `{: .prompt-tip }`):
  ```md
  > **Tip:** text
  ```
- Video: write an HTML block (the `media-video` component above). The Markdown renderer allows `iframe` (youtube-nocookie / bilibili allowlist only) and `video`.
- Multi-image comparisons: write an HTML `gif-grid` block using `data-media-src`.

## 5. Checklist (after every content change)

- [ ] No occurrences of `wp-content/uploads`, `cleaned_media/`, `/assets/pic/`, or `http(s)://…r2.dev`.
- [ ] Media paths point to master files (no `-WxH`, `-scaled`, `-e<timestamp>` suffixes).
- [ ] `data/*.js`: unique slugs, blog newest-first, valid syntax.
- [ ] Pages load scripts in `config.js → data → js` order.
