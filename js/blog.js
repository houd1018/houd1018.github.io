/* Blog list (blog/index.html) and Markdown post renderer (blog/post.html). */
(function (global) {
  'use strict';

  var doc = global.document;
  var posts = Array.isArray(global.BLOG_POSTS) ? global.BLOG_POSTS : [];
  var SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  var KATEX = {
    js: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
    jsIntegrity: 'sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg',
    css: 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
    cssIntegrity: 'sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+',
  };

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function formatDate(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso || '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function postUrl(slug) {
    return global.SiteConfig.siteUrl('blog/post.html?slug=' + encodeURIComponent(slug));
  }

  function tagList(tags) {
    var ul = el('ul', 'tag-list');
    (tags || []).forEach(function (tag) {
      ul.appendChild(el('li', null, tag));
    });
    return ul;
  }

  // ---------------------------------------------------------------- list page

  function renderCard(post) {
    var card = el('a', 'post-card');
    card.href = postUrl(post.slug);

    var cover = el('div', 'post-card-cover');
    if (post.cover) {
      var img = el('img');
      img.src = global.SiteConfig.getMediaUrl(post.cover);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        img.remove();
      });
      cover.appendChild(img);
    }
    card.appendChild(cover);

    var body = el('div', 'post-card-body');
    body.appendChild(el('span', 'post-card-meta', formatDate(post.date) + ' \u00b7 ' + (post.category || '')));
    body.appendChild(el('h2', null, post.title));
    if (post.summary) body.appendChild(el('p', null, post.summary));
    body.appendChild(tagList(post.tags));
    card.appendChild(body);
    return card;
  }

  function initList(listEl) {
    var filtersEl = doc.getElementById('blog-filters');
    var categories = [];
    posts.forEach(function (p) {
      if (p.category && categories.indexOf(p.category) < 0) categories.push(p.category);
    });
    categories.sort();

    var params = new URLSearchParams(global.location.search);
    var active = params.get('category');
    if (categories.indexOf(active) < 0) active = null;

    function render() {
      listEl.textContent = '';
      var visible = posts.filter(function (p) {
        return !active || p.category === active;
      });
      if (!visible.length) {
        listEl.appendChild(el('p', 'empty-state', 'No posts yet.'));
        return;
      }
      visible.forEach(function (p) {
        listEl.appendChild(renderCard(p));
      });
    }

    function renderFilters() {
      if (!filtersEl) return;
      filtersEl.textContent = '';
      [null].concat(categories).forEach(function (cat) {
        var btn = el('button', 'filter-btn', cat || 'All');
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(cat === active));
        btn.addEventListener('click', function () {
          active = cat;
          var url = new URL(global.location.href);
          if (cat) url.searchParams.set('category', cat);
          else url.searchParams.delete('category');
          global.history.replaceState(null, '', url);
          renderFilters();
          render();
        });
        filtersEl.appendChild(btn);
      });
    }

    renderFilters();
    render();
  }

  // ---------------------------------------------------------------- post page

  // Kramdown-style ids so old Chirpy anchors (#procedural-city---node--vops--wrangle) keep working.
  function addHeadingIds(root) {
    var used = {};
    var headings = root.querySelectorAll('h2, h3, h4, h5, h6');
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      if (h.id) continue;
      var base = h.textContent.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-') || 'section';
      var id = base;
      for (var n = 1; used[id] || doc.getElementById(id); n++) id = base + '-' + n;
      used[id] = true;
      h.id = id;
    }
  }

  function scrollToHash() {
    var id = decodeURIComponent((global.location.hash || '').slice(1));
    var target = id && doc.getElementById(id);
    if (target) target.scrollIntoView();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var markedConfigured = false;

  function configureMarked() {
    if (markedConfigured) return;
    markedConfigured = true;

    global.marked.use({
      gfm: true,
      walkTokens: function (token) {
        if ((token.type === 'image' || token.type === 'link') && /^media:/i.test(token.href || '')) {
          token.href = global.SiteConfig.getMediaUrl(token.href);
        }
      },
      extensions: [
        {
          name: 'mathBlock',
          level: 'block',
          start: function (src) {
            var i = src.indexOf('$$');
            return i < 0 ? undefined : i;
          },
          tokenizer: function (src) {
            var match = /^\$\$[ \t]*\n?([\s\S]+?)\n?[ \t]*\$\$[ \t]*(?:\n|$)/.exec(src);
            if (match) return { type: 'mathBlock', raw: match[0], text: match[1].trim() };
            return undefined;
          },
          renderer: function (token) {
            return '<div class="math-block">' + escapeHtml(token.text) + '</div>\n';
          },
        },
      ],
    });

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

  function renderMarkdown(markdown) {
    configureMarked();
    var html = global.marked.parse(markdown);
    return global.DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'sandbox', 'playsinline'],
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
    });
  }

  function loadKatex() {
    if (global.katex) return Promise.resolve(global.katex);
    return new Promise(function (resolve, reject) {
      var css = doc.createElement('link');
      css.rel = 'stylesheet';
      css.href = KATEX.css;
      css.integrity = KATEX.cssIntegrity;
      css.crossOrigin = 'anonymous';
      doc.head.appendChild(css);

      var script = doc.createElement('script');
      script.src = KATEX.js;
      script.integrity = KATEX.jsIntegrity;
      script.crossOrigin = 'anonymous';
      script.onload = function () {
        resolve(global.katex);
      };
      script.onerror = reject;
      doc.head.appendChild(script);
    });
  }

  function renderMath(root) {
    var blocks = root.querySelectorAll('.math-block');
    if (!blocks.length) return;
    loadKatex()
      .then(function (katex) {
        for (var i = 0; i < blocks.length; i++) {
          katex.render(blocks[i].textContent, blocks[i], { displayMode: true, throwOnError: false });
        }
      })
      .catch(function () {
        /* leave TeX source visible */
      });
  }

  function renderPostNav(navEl, index) {
    var newer = posts[index - 1];
    var older = posts[index + 1];
    navEl.textContent = '';
    if (older) {
      var a = el('a', 'post-nav-prev');
      a.href = postUrl(older.slug);
      a.appendChild(el('span', null, 'Older'));
      a.appendChild(doc.createTextNode(older.title));
      navEl.appendChild(a);
    } else {
      navEl.appendChild(el('div'));
    }
    if (newer) {
      var b = el('a', 'post-nav-next');
      b.href = postUrl(newer.slug);
      b.appendChild(el('span', null, 'Newer'));
      b.appendChild(doc.createTextNode(newer.title));
      navEl.appendChild(b);
    }
  }

  function showError(bodyEl, message) {
    bodyEl.textContent = '';
    var p = el('p', 'empty-state', message + ' ');
    var back = el('a', null, 'Back to all posts');
    back.href = 'index.html';
    p.appendChild(back);
    bodyEl.appendChild(p);
  }

  function initPost(bodyEl) {
    var slug = new URLSearchParams(global.location.search).get('slug') || '';
    var index = -1;
    if (SLUG_RE.test(slug)) {
      for (var i = 0; i < posts.length; i++) {
        if (posts[i].slug === slug) {
          index = i;
          break;
        }
      }
    }

    var titleEl = doc.getElementById('post-title');
    if (index < 0) {
      titleEl.textContent = 'Post not found';
      showError(bodyEl, 'This post does not exist.');
      return;
    }

    var post = posts[index];
    doc.title = post.title + ' | Dazhou Hou';
    titleEl.textContent = post.title;
    var desc = doc.querySelector('meta[name="description"]');
    if (desc && post.summary) desc.setAttribute('content', post.summary);

    var metaEl = doc.getElementById('post-meta');
    if (metaEl) {
      metaEl.textContent = '';
      var cat = el('a', null, post.category);
      cat.href = 'index.html?category=' + encodeURIComponent(post.category);
      cat.className = 'post-meta-link';
      metaEl.appendChild(el('time', null, formatDate(post.date)));
      metaEl.lastChild.setAttribute('datetime', post.date);
      metaEl.appendChild(doc.createTextNode('\u00b7'));
      metaEl.appendChild(cat);
    }

    var navEl = doc.getElementById('post-nav');
    if (navEl) renderPostNav(navEl, index);

    fetch('posts/' + slug + '.md', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (markdown) {
        bodyEl.innerHTML = renderMarkdown(markdown);
        if (post.tags && post.tags.length) bodyEl.appendChild(tagList(post.tags));
        global.SiteContent.enhance(bodyEl);
        addHeadingIds(bodyEl);
        renderMath(bodyEl);
        bodyEl.removeAttribute('aria-busy');
        scrollToHash();
      })
      .catch(function () {
        var hint =
          global.location.protocol === 'file:'
            ? 'Posts must be served over HTTP. Run "python -m http.server" in the repo root.'
            : 'Could not load this post.';
        showError(bodyEl, hint);
        bodyEl.removeAttribute('aria-busy');
      });
  }

  function init() {
    var listEl = doc.getElementById('blog-list');
    if (listEl) initList(listEl);
    var highlightsEl = doc.getElementById('blog-highlights');
    if (highlightsEl) {
      posts.slice(0, Number(highlightsEl.getAttribute('data-limit')) || 3).forEach(function (p) {
        highlightsEl.appendChild(renderCard(p));
      });
    }
    var bodyEl = doc.getElementById('post-body');
    if (bodyEl) initPost(bodyEl);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
