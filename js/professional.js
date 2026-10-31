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
  var body = null;

  function cleanup() {
    body.textContent = '';
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

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = el('dialog', 'title-modal');
    dialog.setAttribute('aria-labelledby', 'title-modal-heading');
    var close = el('button', 'title-modal-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '&times;';
    close.addEventListener('click', closeModal);
    body = el('div', 'title-modal-body');
    dialog.appendChild(close);
    dialog.appendChild(body);
    // A click on the backdrop lands on the <dialog> itself.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeModal();
    });
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeModal();
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

  function open(t) {
    ensureDialog();
    body.textContent = '';
    body.appendChild(renderTrailer(t));

    var info = el('div', 'title-modal-info');
    info.appendChild(el('p', 'title-modal-meta', [t.year, t.status].filter(Boolean).join(' \u00b7 ')));
    var heading = el('h2', 'title-modal-title', t.title);
    heading.id = 'title-modal-heading';
    info.appendChild(heading);
    if (t.focus) info.appendChild(el('p', 'title-modal-focus', t.focus));
    var contribs = t.contributions || [];
    if (contribs.length) {
      info.appendChild(el('h3', 'title-modal-subhead', 'My contributions'));
      var list = el('div', 'title-contribs');
      contribs.forEach(function (c) {
        list.appendChild(renderContribution(c));
      });
      info.appendChild(list);
    }
    body.appendChild(info);

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
    thumb.appendChild(el('span', 'title-card-play'));
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
