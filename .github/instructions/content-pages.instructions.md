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
    slug: 'interactive-desert',              // lowercase kebab-case, unique, maps to projects/<slug>.html
    title: 'Interactive Desert',
    category: 'tech-art',                    // computer-graphics | tech-art | games | creative-coding
    tags: ['Unity', 'URP', 'HLSL', 'Tessellation'], // tech stack
    date: '2024-04-04',                      // ISO date, lists sort newest first
    summary: 'One-line description (≤ 120 chars)',
    cover: '2024/04/desert.jpg',             // media library path (static cover)
    preview: '2024/04/desert.gif',           // optional: hover preview GIF or .mp4
    video: 'https://www.youtube.com/watch?v=XXXX', // optional: main video (YouTube/Bilibili/library mp4)
    featured: false,                         // optional: show on home page
  },
];
```

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

- Keep arrays sorted by `date`, newest first; do not reformat or reorder fields of other entries.
- Never store full media URLs in these files — only media library paths.

## 2. Project detail page `projects/<slug>.html`

Page skeleton (keep it identical across pages for easy bulk maintenance):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{Title} | Dazhou Hou</title>
  <meta name="description" content="{summary}" />
  <script src="../config.js"></script>
  <link rel="stylesheet" href="../css/base.css" />
  <link rel="stylesheet" href="../css/content.css" />
</head>
<body class="page-content" data-project="{slug}">
  <header class="site-nav"><!-- Home | About Me | Projects | Blog | Contact --></header>
  <main class="content">
    <header class="content-header">
      <p class="content-category">{CATEGORY LABEL}</p>
      <h1>{Title}</h1>
      <ul class="tech-stack"><li>Unity</li><li>HLSL</li></ul>
    </header>
    <!-- content blocks, see below -->
  </main>
  <footer class="site-footer"></footer>
  <script src="../data/projects.js"></script>
  <script src="../js/lightbox.js"></script>
  <script src="../js/content.js"></script>
</body>
</html>
```

## 3. Content block components

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
- [ ] `data/*.js`: unique slugs, newest-first order, valid syntax.
- [ ] Pages load scripts in `config.js → data → js` order.
