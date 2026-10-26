/* Accessible image lightbox for any img[data-lightbox] (works with dynamically inserted content). */
(function (global) {
  'use strict';

  var doc = global.document;
  var overlay = null;
  var imageEl = null;
  var captionEl = null;
  var closeBtn = null;
  var lastFocus = null;

  function build() {
    overlay = doc.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');

    closeBtn = doc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close image viewer');
    closeBtn.textContent = '\u00d7';

    imageEl = doc.createElement('img');
    imageEl.alt = '';

    captionEl = doc.createElement('p');
    captionEl.className = 'lightbox-caption';

    overlay.appendChild(closeBtn);
    overlay.appendChild(imageEl);
    overlay.appendChild(captionEl);
    doc.body.appendChild(overlay);

    overlay.addEventListener('click', close);
  }

  function captionFor(img) {
    var figure = img.closest('figure');
    var caption = figure && figure.querySelector('figcaption');
    return (caption && caption.textContent.trim()) || img.alt || '';
  }

  function open(img) {
    if (!overlay) build();
    lastFocus = doc.activeElement;
    imageEl.src = img.currentSrc || img.src;
    imageEl.alt = img.alt || '';
    captionEl.textContent = captionFor(img);
    overlay.classList.add('is-open');
    doc.body.classList.add('lightbox-open');
    closeBtn.focus();
  }

  function close() {
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    doc.body.classList.remove('lightbox-open');
    imageEl.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function lightboxTarget(el) {
    var img = el && el.closest ? el.closest('img[data-lightbox]') : null;
    return img && !img.closest('a') ? img : null;
  }

  doc.addEventListener('click', function (event) {
    var img = lightboxTarget(event.target);
    if (!img || !img.src) return;
    event.preventDefault();
    open(img);
  });

  doc.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'Tab' && overlay && overlay.classList.contains('is-open')) {
      event.preventDefault();
      closeBtn.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      var img = lightboxTarget(event.target);
      if (img && img.src) {
        event.preventDefault();
        open(img);
      }
    }
  });

  global.SiteLightbox = { open: open, close: close };
})(window);
