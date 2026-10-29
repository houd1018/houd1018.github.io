/* Professional section on the home page: one card per game title from data/professional.js. */
(function (global) {
  'use strict';

  var doc = global.document;

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Key art from the media library, or the trailer's YouTube thumbnail until key art is added.
  function coverUrl(t) {
    if (t.cover) return global.SiteConfig.getMediaUrl(t.cover);
    if (t.trailer) return 'https://i.ytimg.com/vi/' + encodeURIComponent(t.trailer) + '/maxresdefault.jpg';
    return '';
  }

  function renderCard(t) {
    var card = el('a', 'title-card');
    card.href = global.SiteConfig.siteUrl('professional/' + t.slug + '.html');

    var thumb = el('div', 'title-card-thumb');
    var src = coverUrl(t);
    if (src) {
      var img = el('img');
      img.src = src;
      img.alt = t.title + ' key art';
      img.loading = 'lazy';
      img.decoding = 'async';
      // YouTube answers a missing maxres thumbnail with a 120px placeholder, not an error.
      var fallback = function () {
        img.removeEventListener('error', fallback);
        img.removeEventListener('load', checkSize);
        if (!t.cover && t.trailer) img.src = 'https://i.ytimg.com/vi/' + encodeURIComponent(t.trailer) + '/hqdefault.jpg';
      };
      var checkSize = function () {
        if (img.naturalWidth <= 120) fallback();
      };
      img.addEventListener('error', fallback);
      img.addEventListener('load', checkSize);
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

  function boot() {
    var grid = doc.querySelector('[data-professional-grid]');
    if (!grid) return;
    (global.PROFESSIONAL || []).forEach(function (t) {
      grid.appendChild(renderCard(t));
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
