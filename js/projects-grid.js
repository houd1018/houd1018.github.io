/* Project grid with category filters. Renders into [data-projects-grid]; filters into [data-projects-filters]. */
(function (global) {
  'use strict';

  var doc = global.document;
  var FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'computer-graphics', label: 'Computer Graphics' },
    { id: 'tech-art', label: 'Tech Art' },
    { id: 'games', label: 'Games' },
    { id: 'creative-coding', label: 'Creative Coding' },
  ];

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function isExternal(p) {
    return !!p.url && /^https?:\/\//i.test(p.url);
  }

  function projectHref(p) {
    if (p.url) return isExternal(p) ? p.url : global.SiteConfig.siteUrl(p.url);
    return global.SiteConfig.siteUrl('projects/' + p.slug + '.html');
  }

  function renderCard(p) {
    var card = el('a', 'work-card');
    card.href = projectHref(p);
    if (isExternal(p)) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }

    var thumb = el('div', 'work-card-thumb');
    if (p.cover) {
      var img = el('img');
      img.src = global.SiteConfig.getMediaUrl(p.cover);
      img.alt = p.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      thumb.appendChild(img);

      if (p.preview) {
        var previewUrl = global.SiteConfig.getMediaUrl(p.preview);
        var isVideo = /\.(mp4|webm|mov)$/i.test(p.preview);
        var preview = null;
        var show = function () {
          if (!preview) {
            preview = isVideo ? el('video', 'work-card-preview') : el('img', 'work-card-preview');
            if (isVideo) {
              preview.muted = true;
              preview.loop = true;
              preview.playsInline = true;
            } else {
              preview.alt = '';
            }
            preview.src = previewUrl;
            thumb.appendChild(preview);
          }
          thumb.classList.add('is-previewing');
          if (isVideo) preview.play().catch(function () {});
        };
        var hide = function () {
          thumb.classList.remove('is-previewing');
          if (preview && isVideo) preview.pause();
        };
        card.addEventListener('mouseenter', show);
        card.addEventListener('focus', show);
        card.addEventListener('mouseleave', hide);
        card.addEventListener('blur', hide);
      }
    }
    card.appendChild(thumb);

    // `from: "<title-slug>"` marks a professional contribution; label it with the game title.
    if (p.from) {
      var titles = global.PROFESSIONAL || [];
      var from = null;
      for (var t = 0; t < titles.length; t++) if (titles[t].slug === p.from) from = titles[t];
      thumb.appendChild(el('span', 'work-card-from', from ? from.title : p.from));
    }

    var info = el('div', 'work-card-info');
    info.appendChild(el('h3', 'work-card-title', p.title));
    if (p.subtitle) info.appendChild(el('p', 'work-card-tech', p.subtitle));
    card.appendChild(info);
    return card;
  }

  var DURATION = 450;
  var EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  // Rows shown before "Load all"; the column count follows the responsive grid (3 / 2 / 1).
  var COLLAPSED_ROWS = 3;

  function canAnimate() {
    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !reduce && typeof doc.body.animate === 'function';
  }

  function init(grid) {
    var projects = (global.PROJECTS || []).filter(function (p) {
      return p.listed !== false;
    });
    var filtersEl = doc.querySelector('[data-projects-filters]');
    var active = 'all';
    var cards = projects.map(renderCard);
    var shown = [];
    var expanded = false;

    var more = el('div', 'works-more');
    var moreBtn = el('button', 'btn works-more-btn', 'Load all');
    moreBtn.type = 'button';
    more.appendChild(moreBtn);
    grid.parentNode.insertBefore(more, grid.nextSibling);

    function columns() {
      return Math.max(1, global.getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    }

    function matchingIndexes() {
      var out = [];
      projects.forEach(function (p, i) {
        if (active === 'all' || p.category === active) out.push(i);
      });
      return out;
    }

    function visibleIndexes() {
      var all = matchingIndexes();
      var limit = columns() * COLLAPSED_ROWS;
      more.hidden = expanded || all.length <= limit;
      return expanded ? all : all.slice(0, limit);
    }

    function render(animate) {
      var next = visibleIndexes();
      if (!animate || !canAnimate()) {
        grid.textContent = '';
        next.forEach(function (i) {
          grid.appendChild(cards[i]);
        });
        shown = next;
        return;
      }

      // FLIP: record positions, re-layout, then animate from old to new.
      var gridRect = grid.getBoundingClientRect();
      var first = {};
      shown.forEach(function (i) {
        first[i] = cards[i].getBoundingClientRect();
      });

      var leaving = shown.filter(function (i) {
        return next.indexOf(i) < 0;
      });
      leaving.forEach(function (i) {
        var card = cards[i];
        var r = first[i];
        card.getAnimations().forEach(function (a) {
          a.cancel();
        });
        card.style.position = 'absolute';
        card.style.left = r.left - gridRect.left + 'px';
        card.style.top = r.top - gridRect.top + 'px';
        card.style.width = r.width + 'px';
        card.style.height = r.height + 'px';
        card.style.pointerEvents = 'none';
      });

      next.forEach(function (i) {
        var card = cards[i];
        card.removeAttribute('style');
        grid.appendChild(card);
      });
      leaving.forEach(function (i) {
        grid.appendChild(cards[i]);
      });

      next.forEach(function (i) {
        var card = cards[i];
        card.getAnimations().forEach(function (a) {
          a.cancel();
        });
        if (first[i]) {
          var last = card.getBoundingClientRect();
          var dx = first[i].left - last.left;
          var dy = first[i].top - last.top;
          if (dx || dy) {
            card.animate(
              [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
              { duration: DURATION, easing: EASING }
            );
          }
        } else {
          card.animate(
            [
              { transform: 'scale(0.001)', opacity: 0 },
              { transform: 'scale(1)', opacity: 1 },
            ],
            { duration: DURATION, easing: EASING }
          );
        }
      });

      leaving.forEach(function (i) {
        var card = cards[i];
        var anim = card.animate(
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(0.001)', opacity: 0 },
          ],
          { duration: DURATION, easing: EASING, fill: 'forwards' }
        );
        anim.onfinish = function () {
          anim.cancel();
          card.removeAttribute('style');
          if (next.indexOf(i) < 0 && visibleIndexes().indexOf(i) < 0 && card.parentNode === grid) {
            grid.removeChild(card);
          }
        };
      });

      shown = next;
    }

    function renderFilters() {
      if (!filtersEl) return;
      filtersEl.textContent = '';
      FILTERS.forEach(function (f) {
        var btn = el('button', 'filter-btn', f.label);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(f.id === active));
        btn.addEventListener('click', function () {
          if (active === f.id) return;
          active = f.id;
          renderFilters();
          render(true);
        });
        filtersEl.appendChild(btn);
      });
    }

    renderFilters();
    render(false);

    moreBtn.addEventListener('click', function () {
      var before = shown.length;
      expanded = true;
      render(true);
      // The button disappears; keep keyboard focus on the first newly revealed card.
      if (cards[shown[before]]) cards[shown[before]].focus({ preventScroll: true });
    });

    var lastColumns = columns();
    global.addEventListener('resize', function () {
      var c = columns();
      if (c === lastColumns) return;
      lastColumns = c;
      if (!expanded) render(false);
    });
  }

  function boot() {
    var grid = doc.querySelector('[data-projects-grid]');
    if (grid) init(grid);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
