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

  function projectHref(p) {
    return p.url || global.SiteConfig.siteUrl('projects/' + p.slug + '.html');
  }

  function renderCard(p) {
    var card = el('a', 'work-card');
    card.href = projectHref(p);
    if (p.url) {
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

    var info = el('div', 'work-card-info');
    info.appendChild(el('h3', 'work-card-title', p.title));
    if (p.subtitle) info.appendChild(el('p', 'work-card-tech', p.subtitle));
    card.appendChild(info);
    return card;
  }

  function init(grid) {
    var projects = (global.PROJECTS || []).filter(function (p) {
      return p.listed !== false;
    });
    var filtersEl = doc.querySelector('[data-projects-filters]');
    var active = 'all';

    function render() {
      grid.textContent = '';
      projects
        .filter(function (p) {
          return active === 'all' || p.category === active;
        })
        .forEach(function (p) {
          grid.appendChild(renderCard(p));
        });
    }

    function renderFilters() {
      if (!filtersEl) return;
      filtersEl.textContent = '';
      FILTERS.forEach(function (f) {
        var btn = el('button', 'filter-btn', f.label);
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(f.id === active));
        btn.addEventListener('click', function () {
          active = f.id;
          renderFilters();
          render();
        });
        filtersEl.appendChild(btn);
      });
    }

    renderFilters();
    render();
  }

  function boot() {
    var grid = doc.querySelector('[data-projects-grid]');
    if (grid) init(grid);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
