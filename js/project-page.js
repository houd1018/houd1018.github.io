/* Project detail pages: render projects/content/<slug>.md (Markdown + ::: layout blocks) into the page.
 * Block syntax is documented in .github/instructions/content-pages.instructions.md. */
(function (global) {
  'use strict';

  var doc = global.document;
  var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  var VIDEO_RE = /\.(?:mp4|webm|mov|m4v)$/i;
  var EMBEDS = {
    youtube: function (id) {
      return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id);
    },
    bilibili: function (id) {
      return 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(id) + '&autoplay=0';
    },
    vimeo: function (id) {
      return 'https://player.vimeo.com/video/' + encodeURIComponent(id);
    },
  };
  var ASPECTS = { '9x16': 'media-video--9x16', '4x3': 'media-video--4x3' };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------------------------------------------------------------- Markdown

  // `![alt](media:path.gif "caption")` → figure; .mp4 → video (#loop = silent autoplay loop, #9x16 / #4x3 = aspect);
  // `![title](youtube:ID)`, `bilibili:BV…`, `vimeo:ID` → embedded player.
  function renderMedia(href, title, alt) {
    href = href || '';
    var embed = /^(youtube|bilibili|vimeo):(.+)$/i.exec(href);
    if (embed) {
      return (
        '<div class="media-video"><iframe src="' + escapeHtml(EMBEDS[embed[1].toLowerCase()](embed[2])) +
        '" title="' + escapeHtml(alt || 'Video') + '" loading="lazy" ' +
        'allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'
      );
    }
    var hashAt = href.indexOf('#');
    var flags = hashAt < 0 ? [] : href.slice(hashAt + 1).split(/[,&]/);
    var path = hashAt < 0 ? href : href.slice(0, hashAt);
    var url = global.SiteConfig.getMediaUrl(path);
    var caption = title ? '<figcaption>' + escapeHtml(title) + '</figcaption>' : '';

    if (VIDEO_RE.test(path)) {
      var loop = flags.indexOf('loop') >= 0;
      var aspect = '';
      flags.forEach(function (f) {
        if (ASPECTS[f]) aspect = ' ' + ASPECTS[f];
      });
      if (loop) {
        return (
          '<figure class="media-figure media-clip"><video src="' + escapeHtml(url) +
          '" autoplay muted loop playsinline preload="metadata" aria-label="' + escapeHtml(alt || '') + '"></video>' +
          caption + '</figure>'
        );
      }
      return (
        '<figure class="media-figure"><div class="media-video' + aspect + '"><video src="' + escapeHtml(url) +
        '" controls playsinline preload="metadata" aria-label="' + escapeHtml(alt || '') + '"></video></div>' +
        caption + '</figure>'
      );
    }
    return (
      '<figure class="media-figure"><img src="' + escapeHtml(url) + '" alt="' + escapeHtml(alt || '') +
      '" loading="lazy">' + caption + '</figure>'
    );
  }

  var md = null;

  function markdown() {
    if (md) return md;
    md = new global.marked.Marked({ gfm: true });
    md.use({
      walkTokens: function (token) {
        if (token.type === 'link' && /^media:/i.test(token.href || '')) {
          token.href = global.SiteConfig.getMediaUrl(token.href);
        }
      },
      renderer: {
        image: function (href, title, text) {
          return renderMedia(href, title, text);
        },
        // A paragraph holding only media becomes the media itself (figures can't live inside <p>).
        paragraph: function (text) {
          var stripped = text.replace(/<figure[\s\S]*?<\/figure>|<div class="media-video">[\s\S]*?<\/div>/g, '');
          if (stripped.trim() === '' && text.trim() !== '') return text + '\n';
          return '<p>' + text + '</p>\n';
        },
      },
    });
    return md;
  }

  // ---------------------------------------------------------------- ::: blocks

  var OPEN_RE = /^:::\s*([a-z][a-z-]*)\s*(.*)$/;
  var CLOSE_RE = /^:::\s*$/;
  var FENCE_RE = /^\s*(```|~~~)/;

  // Splits the source into a tree of Markdown runs and ::: blocks (fenced code is left untouched).
  function parseBlocks(src) {
    var root = { children: [] };
    var stack = [root];
    var buf = [];
    var fence = null;

    function flush() {
      if (buf.length) stack[stack.length - 1].children.push({ md: buf.join('\n') });
      buf = [];
    }

    src.replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
      var f = FENCE_RE.exec(line);
      if (fence) {
        if (f && f[1] === fence) fence = null;
        buf.push(line);
        return;
      }
      if (f) {
        fence = f[1];
        buf.push(line);
        return;
      }
      var open = OPEN_RE.exec(line);
      if (open) {
        flush();
        var node = { name: open[1], arg: open[2].trim(), children: [] };
        stack[stack.length - 1].children.push(node);
        stack.push(node);
        return;
      }
      if (CLOSE_RE.test(line) && stack.length > 1) {
        flush();
        stack.pop();
        return;
      }
      buf.push(line);
    });
    flush();
    return root.children;
  }

  function renderMeta(node) {
    var text = node.children.map(function (c) {
      return c.md || '';
    }).join('\n');
    var rows = '';
    text.split('\n').forEach(function (line) {
      var m = /^\s*([^:]+?)\s*:\s*(.+)$/.exec(line);
      if (!m) return;
      rows += '<dt>' + escapeHtml(m[1]) + '</dt><dd>' + markdown().parseInline(m[2]) + '</dd>';
    });
    return '<aside class="project-meta" aria-label="Project facts"><dl>' + rows + '</dl></aside>';
  }

  function renderNodes(nodes) {
    return nodes.map(function (node) {
      if (node.md !== undefined) return markdown().parse(node.md);
      if (node.name === 'meta') return renderMeta(node);
      return (
        '<div data-block="' + escapeHtml(node.name) + '" data-arg="' + escapeHtml(node.arg) + '">' +
        renderNodes(node.children) + '</div>'
      );
    }).join('');
  }

  // ---------------------------------------------------------------- DOM layout

  function el(tag, className) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function isMedia(node) {
    if (node.nodeType !== 1) return false;
    if (node.matches('figure, .media-video, .gif-grid')) return true;
    return node.matches('p') && !node.textContent.trim() && !!node.querySelector('img, video, iframe');
  }

  function unwrap(block, className, tag) {
    var out = el(tag || 'div', className);
    while (block.firstChild) out.appendChild(block.firstChild);
    block.parentNode.replaceChild(out, block);
    return out;
  }

  function layoutRow(block, index) {
    var row = el('div', 'project-row');
    var text = el('div', 'project-row-text');
    var media = el('div', 'project-row-media');
    Array.prototype.slice.call(block.childNodes).forEach(function (child) {
      if (child.nodeType === 3 && !child.textContent.trim()) return;
      (isMedia(child) ? media : text).appendChild(child);
    });
    var reverse = block.getAttribute('data-arg') === 'reverse' || (block.getAttribute('data-arg') !== 'normal' && index % 2 === 1);
    if (reverse) row.classList.add('project-row--reverse');
    if (!text.childNodes.length) row.classList.add('project-row--media-only');
    if (!media.childNodes.length) row.classList.add('project-row--text-only');
    if (media.children.length > 1) media.classList.add('project-row-media--stack');
    row.appendChild(text);
    row.appendChild(media);
    block.parentNode.replaceChild(row, block);
  }

  function layoutGallery(block) {
    var cols = Math.min(4, Math.max(1, parseInt(block.getAttribute('data-arg'), 10) || 2));
    var grid = el('div', 'gif-grid gif-grid--' + cols);
    block.querySelectorAll('figure, .media-video').forEach(function (item) {
      if (item.parentNode.closest('figure') && item.parentNode.closest('figure') !== item) return;
      grid.appendChild(item);
    });
    block.parentNode.replaceChild(grid, block);
  }

  // `- [Title](href) Subtitle ![](media:cover.jpg)` list items → link cards.
  function layoutCards(block) {
    var wrap = el('div', 'link-cards');
    block.querySelectorAll('li').forEach(function (li) {
      var link = li.querySelector('a[href]');
      if (!link) return;
      var card = el('a', 'link-card');
      card.href = link.getAttribute('href');
      var img = li.querySelector('img');
      if (img) {
        var cover = el('img', 'link-card-img');
        cover.src = img.src;
        cover.alt = '';
        cover.loading = 'lazy';
        cover.setAttribute('data-no-lightbox', '');
        card.appendChild(cover);
      }
      var title = el('span', 'link-card-title');
      title.textContent = link.textContent;
      card.appendChild(title);
      var clone = li.cloneNode(true);
      clone.querySelectorAll('a, figure, img').forEach(function (n) {
        n.remove();
      });
      var rest = clone.textContent.replace(/^[\s\u2013\u2014|:-]+/, '').trim();
      if (rest) {
        var sub = el('span', 'link-card-text');
        sub.textContent = rest;
        card.appendChild(sub);
      }
      wrap.appendChild(card);
    });
    block.parentNode.replaceChild(wrap, block);
  }

  var tabGroupCount = 0;

  function layoutTabs(block) {
    var group = el('div', 'tabs');
    group.setAttribute('data-tabs', '');
    var list = el('div', 'tabs-list');
    list.setAttribute('role', 'tablist');
    group.appendChild(list);
    var used = {};
    Array.prototype.slice.call(block.children).forEach(function (child, i) {
      if (child.getAttribute('data-block') !== 'tab') return;
      var label = child.getAttribute('data-arg') || 'Tab ' + (i + 1);
      var id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tab';
      while (used[id] || doc.getElementById(id)) id += '-' + (++tabGroupCount);
      used[id] = true;
      var tab = el('button');
      tab.type = 'button';
      tab.id = 'tab-' + id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', id);
      tab.textContent = label;
      list.appendChild(tab);
      var panel = unwrap(child, 'tab-panel', 'section');
      panel.id = id;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      group.appendChild(panel);
    });
    block.parentNode.replaceChild(group, block);
  }

  function layout(root) {
    // Innermost blocks first so rows/galleries inside tabs are laid out before the tabs move them.
    var blocks = Array.prototype.slice.call(root.querySelectorAll('[data-block]')).reverse();
    // Rows alternate sides in document order within each parent.
    var counters = new Map();
    var orderIndex = new Map();
    Array.prototype.slice.call(root.querySelectorAll('[data-block="row"]')).forEach(function (row) {
      var c = counters.get(row.parentNode) || 0;
      orderIndex.set(row, c);
      counters.set(row.parentNode, c + 1);
    });

    blocks.forEach(function (block) {
      var name = block.getAttribute('data-block');
      if (name === 'row') layoutRow(block, orderIndex.get(block) || 0);
      else if (name === 'gallery') layoutGallery(block);
      else if (name === 'cards') layoutCards(block);
      else if (name === 'tabs') layoutTabs(block);
      else if (name === 'hero') unwrap(block, 'project-hero-media');
      else if (name === 'overview') unwrap(block, 'project-overview');
      else if (name !== 'tab') unwrap(block, 'project-block project-block--' + name);
    });

    // Overview + facts side by side.
    var overview = root.querySelector(':scope > .project-overview');
    var meta = root.querySelector(':scope > .project-meta');
    if (overview || meta) {
      var intro = el('div', 'project-intro');
      var anchor = overview || meta;
      anchor.parentNode.insertBefore(intro, anchor);
      if (overview) intro.appendChild(overview);
      if (meta) intro.appendChild(meta);
      if (!overview || !meta) intro.classList.add('project-intro--single');
    }

    root.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.muted = true;
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  // ---------------------------------------------------------------- page

  function sanitize(html) {
    return global.DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'loading', 'playsinline', 'autoplay', 'muted', 'loop', 'controls', 'preload'],
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
    });
  }

  function allowIframeHosts() {
    global.DOMPurify.addHook('uponSanitizeElement', function (node, data) {
      if (data.tagName !== 'iframe') return;
      var host = '';
      try {
        host = new URL(node.getAttribute('src') || '', global.location.href).hostname;
      } catch (e) {
        host = '';
      }
      if (global.SiteContent.ALLOWED_IFRAME_HOSTS.indexOf(host) < 0 && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }

  function showError(bodyEl, message) {
    bodyEl.textContent = '';
    var p = el('p', 'empty-state');
    p.textContent = message;
    bodyEl.appendChild(p);
  }

  function init() {
    var bodyEl = doc.getElementById('project-body');
    if (!bodyEl) return;
    var slug = doc.body.getAttribute('data-project') || '';
    if (!SLUG_RE.test(slug)) return;
    allowIframeHosts();

    fetch('content/' + slug + '.md', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (src) {
        bodyEl.innerHTML = sanitize(renderNodes(parseBlocks(src)));
        layout(bodyEl);
        global.SiteContent.enhance(bodyEl);
        bodyEl.removeAttribute('aria-busy');
        var target = global.location.hash && doc.getElementById(decodeURIComponent(global.location.hash.slice(1)));
        if (target) target.scrollIntoView();
      })
      .catch(function () {
        showError(
          bodyEl,
          global.location.protocol === 'file:'
            ? 'Project pages must be served over HTTP. Run "python -m http.server" in the repo root.'
            : 'Could not load this project.'
        );
        bodyEl.removeAttribute('aria-busy');
      });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
