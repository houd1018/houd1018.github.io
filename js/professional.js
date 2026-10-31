/* Professional section on the home page: one card per game title from data/professional.js.
 * A card opens a modal panel with the trailer and my contributions; contributions with a project page link to it. */
(function (global) {
  'use strict';

  var doc = global.document;
  var TAG_LABELS = {
    shaders: 'Shaders',
    vfx: 'VFX',
    tools: 'Tools',
    procedural: 'Procedural',
    environment: 'Environment',
    'computer-graphics': 'Computer Graphics',
    games: 'Games',
    'creative-coding': 'Creative Coding',
  };
  var HASH_PREFIX = '#title-';

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function media(path) {
    return global.SiteConfig.getMediaUrl(path);
  }

  // ---------------------------------------------------------------- trailer

  // YouTube is blocked in some regions (e.g. mainland China); probe it once before choosing an embed.
  var youtubeReachable = null;

  function probeYouTube(id) {
    if (youtubeReachable) return youtubeReachable;
    youtubeReachable = new Promise(function (resolve) {
      var img = new Image();
      var timer = global.setTimeout(function () {
        resolve(false);
      }, 3000);
      img.onload = function () {
        global.clearTimeout(timer);
        resolve(true);
      };
      img.onerror = function () {
        global.clearTimeout(timer);
        resolve(false);
      };
      img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/default.jpg?probe=' + Date.now();
    });
    return youtubeReachable;
  }

  function embed(src, title) {
    var frame = el('iframe');
    frame.src = src;
    frame.title = title;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    return frame;
  }

  function playTrailer(box, t) {
    var tr = t.trailer || {};
    box.textContent = '';
    box.appendChild(el('p', 'title-modal-loading', 'Loading trailer\u2026'));
    var useYouTube = tr.youtube ? probeYouTube(tr.youtube) : Promise.resolve(false);
    useYouTube.then(function (ok) {
      if (!box.isConnected) return;
      box.textContent = '';
      if (ok) {
        box.appendChild(embed('https://www.youtube-nocookie.com/embed/' + encodeURIComponent(tr.youtube) + '?autoplay=1', t.title + ' trailer'));
      } else if (tr.bilibili) {
        box.appendChild(embed('https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(tr.bilibili) + '&autoplay=1', t.title + ' trailer'));
      } else {
        box.appendChild(el('p', 'title-modal-loading', 'The trailer is not available in your region.'));
      }
    });
  }

  function renderTrailer(t) {
    var box = el('div', 'title-modal-video');
    var tr = t.trailer || {};
    if (tr.video) {
      var video = el('video');
      video.src = media(tr.video);
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      if (t.cover) video.poster = media(t.cover);
      video.setAttribute('aria-label', t.title + ' trailer');
      box.appendChild(video);
      return box;
    }
    if (!tr.youtube && !tr.bilibili) {
      if (t.cover) box.appendChild(coverImage(t));
      return box;
    }
    // Click-to-play poster: nothing third-party loads until the viewer asks for it.
    var play = el('button', 'title-modal-play');
    play.type = 'button';
    play.setAttribute('aria-label', 'Play ' + t.title + ' trailer');
    if (t.cover) play.appendChild(coverImage(t));
    play.appendChild(el('span', 'title-modal-play-icon'));
    play.addEventListener('click', function () {
      playTrailer(box, t);
    });
    box.appendChild(play);
    return box;
  }

  function coverImage(t) {
    var img = el('img');
    img.src = media(t.cover);
    img.alt = '';
    img.decoding = 'async';
    return img;
  }

  // ---------------------------------------------------------------- modal

  var dialog = null;
  var panel = null;
  var current = -1;

  function titles() {
    return global.PROFESSIONAL || [];
  }

  function cleanup() {
    if (panel) panel.textContent = '';
    current = -1;
    doc.documentElement.classList.remove('modal-open');
    if (global.location.hash.indexOf(HASH_PREFIX) === 0) {
      global.history.replaceState(null, '', global.location.pathname + global.location.search);
    }
  }

  // Clean up synchronously (stops the trailer at once) rather than waiting for the async 'close' event.
  function closeModal() {
    if (!dialog || !dialog.open) return;
    cleanup();
    dialog.close();
  }

  function step(delta) {
    var list = titles();
    if (list.length < 2 || current < 0) return;
    open(list[(current + delta + list.length) % list.length]);
  }

  function iconButton(className, label, html, onClick) {
    var btn = el('button', className);
    btn.type = 'button';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = html;
    btn.addEventListener('click', onClick);
    return btn;
  }

  var ARROW_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  var ARROW_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var COPY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';

  function ensureDialog() {
    if (dialog) return dialog;
    // The dialog covers the viewport; the visible card is .title-modal-panel inside it.
    dialog = el('dialog', 'title-modal');
    dialog.setAttribute('aria-labelledby', 'title-modal-heading');
    panel = el('div', 'title-modal-panel');
    dialog.appendChild(panel);
    dialog.appendChild(iconButton('title-modal-close', 'Close', CROSS, closeModal));
    if (titles().length > 1) {
      dialog.appendChild(iconButton('title-modal-nav title-modal-nav--prev', 'Previous title', ARROW_LEFT, function () {
        step(-1);
      }));
      dialog.appendChild(iconButton('title-modal-nav title-modal-nav--next', 'Next title', ARROW_RIGHT, function () {
        step(1);
      }));
    }
    // Clicks outside the panel land on the full-screen <dialog> itself.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeModal();
    });
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeModal();
    });
    dialog.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|VIDEO)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
    dialog.addEventListener('close', cleanup);
    doc.body.appendChild(dialog);
    return dialog;
  }

  function renderContribution(c) {
    var item = el(c.project ? 'a' : 'div', 'title-contrib');
    if (c.project) item.href = global.SiteConfig.siteUrl('projects/' + c.project + '.html');
    item.appendChild(el('h4', 'title-contrib-name', c.title));
    if (c.tags && c.tags.length) {
      var tags = el('div', 'title-contrib-tags');
      c.tags.forEach(function (tag) {
        tags.appendChild(el('span', 'title-contrib-tag', TAG_LABELS[tag] || tag));
      });
      item.appendChild(tags);
    }
    if (c.summary) item.appendChild(el('p', 'title-contrib-summary', c.summary));
    if (c.project) item.appendChild(el('span', 'title-contrib-more', 'View project \u2192'));
    return item;
  }

  function copyLink(btn, t) {
    var url = global.location.href.split('#')[0] + HASH_PREFIX + t.slug;
    var done = function () {
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', 'Link copied');
      global.setTimeout(function () {
        btn.classList.remove('is-copied');
        btn.setAttribute('aria-label', 'Copy link');
      }, 1600);
    };
    if (global.navigator.clipboard) global.navigator.clipboard.writeText(url).then(done, function () {});
  }

  function open(t) {
    ensureDialog();
    current = titles().indexOf(t);
    panel.textContent = '';
    panel.appendChild(renderTrailer(t));

    // The scroller is absolutely positioned so the row height follows the 16:9 video, not the text.
    var info = el('div', 'title-modal-info');
    var scroll = el('div', 'title-modal-scroll');
    info.appendChild(scroll);
    var head = el('div', 'title-modal-head');
    var heading = el('h2', 'title-modal-title', t.title);
    heading.id = 'title-modal-heading';
    head.appendChild(heading);
    var copy = iconButton('title-modal-copy', 'Copy link', COPY, function () {
      copyLink(copy, t);
    });
    head.appendChild(copy);
    scroll.appendChild(head);

    var meta = [t.year && t.year + ' \u2013 ' + (t.status || 'Release'), t.studio].filter(Boolean).join(' \u00b7 ');
    if (meta) scroll.appendChild(el('p', 'title-modal-meta', meta));
    if (t.role) scroll.appendChild(el('p', 'title-modal-role', t.role));
    if (t.focus) scroll.appendChild(el('p', 'title-modal-focus', t.focus));

    var contribs = t.contributions || [];
    if (contribs.length) {
      scroll.appendChild(el('h3', 'title-modal-subhead', 'My contributions'));
      var list = el('div', 'title-contribs');
      contribs.forEach(function (c) {
        list.appendChild(renderContribution(c));
      });
      scroll.appendChild(list);
    }
    panel.appendChild(info);

    doc.documentElement.classList.add('modal-open');
    if (!dialog.open) dialog.showModal();
    if (global.location.hash !== HASH_PREFIX + t.slug) {
      global.history.replaceState(null, '', HASH_PREFIX + t.slug);
    }
  }

  // ---------------------------------------------------------------- cards

  function renderCard(t) {
    var card = el('a', 'title-card');
    card.href = HASH_PREFIX + t.slug;
    card.setAttribute('aria-haspopup', 'dialog');
    card.addEventListener('click', function (e) {
      e.preventDefault();
      open(t);
    });

    var thumb = el('div', 'title-card-thumb');
    if (t.cover) {
      var img = el('img');
      img.src = media(t.cover);
      img.alt = t.title + ' key art';
      img.loading = 'lazy';
      img.decoding = 'async';
      thumb.appendChild(img);
    }
    if (t.status) thumb.appendChild(el('span', 'title-card-status', t.status));
    card.appendChild(thumb);

    var info = el('div', 'title-card-info');
    info.appendChild(el('h3', 'title-card-title', t.title));
    if (t.year) info.appendChild(el('p', 'title-card-year', t.year));
    if (t.focus) info.appendChild(el('p', 'title-card-focus', t.focus));
    card.appendChild(info);
    return card;
  }

  function openFromHash() {
    var hash = global.location.hash;
    if (hash.indexOf(HASH_PREFIX) !== 0) return;
    var slug = hash.slice(HASH_PREFIX.length);
    (global.PROFESSIONAL || []).forEach(function (t) {
      if (t.slug === slug) open(t);
    });
  }

  function boot() {
    var grid = doc.querySelector('[data-professional-grid]');
    if (!grid) return;
    (global.PROFESSIONAL || []).forEach(function (t) {
      grid.appendChild(renderCard(t));
    });
    openFromHash();
    global.addEventListener('hashchange', openFromHash);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
