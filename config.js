/*!
 * houd1018.github.io — global site config.
 * Must be the FIRST site script on every page, loaded as a classic <script src> (no module/async).
 *
 *   <script src="config.js"></script>       (root pages)
 *   <script src="../config.js"></script>    (projects/*, blog/*)
 */
(function (global) {
  'use strict';

  // ============================================================
  // For deployment, change only this line: Cloudflare R2 public / custom CDN domain (trailing /).
  // ============================================================
  var MEDIA_BASE_URL_REMOTE = 'https://pub-af66391f274d47529898def605b4df9a.r2.dev/';

  // 'auto'  : file:// and localhost → local ./cleaned_media/, otherwise → MEDIA_BASE_URL_REMOTE
  // 'local' : force local cleaned_media/
  // 'remote': force remote CDN
  // Temporary override: append ?media=local or ?media=remote to the page URL.
  var MEDIA_MODE = 'auto';

  var doc = global.document;
  var loc = global.location;

  // Resolve the site root from this script's own URL so subpages at any depth work locally and online.
  var scriptEl = doc.currentScript;
  var SITE_ROOT = new URL('./', (scriptEl && scriptEl.src) || loc.href).href;
  var MEDIA_BASE_URL_LOCAL = new URL('cleaned_media/', SITE_ROOT).href;

  function isLocalEnvironment() {
    return (
      loc.protocol === 'file:' ||
      /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])$/.test(loc.hostname) ||
      /\.local$/.test(loc.hostname)
    );
  }

  function resolveMode() {
    var override = null;
    try {
      override = new URLSearchParams(loc.search).get('media');
    } catch (e) {
      /* URLSearchParams unavailable — ignore override */
    }
    if (override === 'local' || override === 'remote') return override;
    if (MEDIA_MODE === 'local' || MEDIA_MODE === 'remote') return MEDIA_MODE;
    return isLocalEnvironment() ? 'local' : 'remote';
  }

  function withTrailingSlash(url) {
    return url.charAt(url.length - 1) === '/' ? url : url + '/';
  }

  var mode = resolveMode();
  var MEDIA_BASE_URL = withTrailingSlash(mode === 'local' ? MEDIA_BASE_URL_LOCAL : MEDIA_BASE_URL_REMOTE);

  if (mode === 'remote' && /media\.example\.com/.test(MEDIA_BASE_URL) && global.console) {
    global.console.warn('[SiteConfig] MEDIA_BASE_URL_REMOTE is still the placeholder. Set it in config.js.');
  }

  var WP_UPLOADS_RE = /^(?:[a-z]+:)?(?:\/\/[^/]+)?\/?(?:.*?\/)?wp-content\/uploads\/(.+)$/i;
  var EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;
  var PASSTHROUGH_RE = /^(?:data|blob):/i;

  function encodeSegment(segment) {
    var decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch (e) {
      /* keep raw segment */
    }
    return encodeURIComponent(decoded);
  }

  /**
   * Convert a media-library path into a full URL under MEDIA_BASE_URL.
   * Accepts "2024/03/water.gif", "media:blog/pic/x.png", legacy ".../wp-content/uploads/2024/03/x.gif".
   * Non-media external URLs (YouTube etc.) and data:/blob: URLs are returned unchanged.
   */
  function getMediaUrl(path) {
    if (path === null || path === undefined) return '';
    var p = String(path).trim();
    if (!p) return '';
    if (PASSTHROUGH_RE.test(p)) return p;

    p = p.replace(/^media:/i, '');

    var wp = p.match(WP_UPLOADS_RE);
    if (wp) {
      p = wp[1];
    } else if (EXTERNAL_RE.test(p)) {
      return p;
    }

    var suffixIndex = p.search(/[?#]/);
    var suffix = suffixIndex >= 0 ? p.slice(suffixIndex) : '';
    if (suffixIndex >= 0) p = p.slice(0, suffixIndex);

    p = p.replace(/\\/g, '/').replace(/^(?:\.?\/)+/, '').replace(/^(?:cleaned_media|uploads)\//i, '');

    var encoded = p
      .split('/')
      .filter(function (seg) {
        return seg && seg !== '.' && seg !== '..';
      })
      .map(encodeSegment)
      .join('/');

    return MEDIA_BASE_URL + encoded + suffix;
  }

  /** Resolve a site-relative page path (e.g. "blog/post.html?slug=x") from any page depth. */
  function siteUrl(path) {
    return new URL(String(path || '').replace(/^\/+/, ''), SITE_ROOT).href;
  }

  var ATTR_MAP = [
    ['data-media-src', 'src'],
    ['data-media-poster', 'poster'],
    ['data-media-href', 'href'],
  ];

  /** Fill src/poster/href/background from data-media-* attributes inside root (default: document). */
  function hydrateMedia(root) {
    var scope = root || doc;
    if (!scope.querySelectorAll) return;

    var videosToReload = [];

    ATTR_MAP.forEach(function (pair) {
      var dataAttr = pair[0];
      var targetAttr = pair[1];
      var nodes = scope.querySelectorAll('[' + dataAttr + ']');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var url = getMediaUrl(el.getAttribute(dataAttr));
        if (url && el.getAttribute(targetAttr) !== url) {
          el.setAttribute(targetAttr, url);
          if (el.tagName === 'SOURCE' && el.parentElement && el.parentElement.tagName === 'VIDEO') {
            videosToReload.push(el.parentElement);
          }
        }
      }
    });

    var bgNodes = scope.querySelectorAll('[data-media-bg]');
    for (var j = 0; j < bgNodes.length; j++) {
      var bgUrl = getMediaUrl(bgNodes[j].getAttribute('data-media-bg'));
      if (bgUrl) bgNodes[j].style.backgroundImage = 'url("' + bgUrl.replace(/"/g, '%22') + '")';
    }

    videosToReload.forEach(function (video) {
      video.load();
    });
  }

  // ---------- Colour theme: follow the system unless the visitor picked light/dark (localStorage). ----------
  var THEME_KEY = 'theme';
  var rootEl = doc.documentElement;
  var darkQuery = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
  var themeToggle = null;

  function systemTheme() {
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }

  function getTheme() {
    return rootEl.getAttribute('data-theme') || systemTheme();
  }

  function updateThemeToggle() {
    if (!themeToggle) return;
    var dark = getTheme() === 'dark';
    var label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
    themeToggle.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>';
  }

  // Picking the same theme as the system clears the override, so the site follows the system again.
  function setTheme(theme) {
    var follow = theme === systemTheme();
    if (follow) rootEl.removeAttribute('data-theme');
    else rootEl.setAttribute('data-theme', theme);
    try {
      if (follow) global.localStorage.removeItem(THEME_KEY);
      else global.localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* storage blocked — choice lasts for this page only */
    }
    updateThemeToggle();
  }

  try {
    var storedTheme = global.localStorage.getItem(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') rootEl.setAttribute('data-theme', storedTheme);
  } catch (e) {
    /* storage blocked — follow the system */
  }

  function mountThemeToggle() {
    var header = doc.querySelector('.site-header');
    if (!header || themeToggle) return;
    themeToggle = doc.createElement('button');
    themeToggle.type = 'button';
    themeToggle.className = 'theme-toggle';
    themeToggle.addEventListener('click', function () {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
    header.appendChild(themeToggle);
    updateThemeToggle();
  }

  if (darkQuery) {
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', updateThemeToggle);
    else if (darkQuery.addListener) darkQuery.addListener(updateThemeToggle);
  }

  global.SiteConfig = Object.freeze({
    MEDIA_BASE_URL: MEDIA_BASE_URL,
    MEDIA_MODE: mode,
    SITE_ROOT: SITE_ROOT,
    getMediaUrl: getMediaUrl,
    hydrateMedia: hydrateMedia,
    siteUrl: siteUrl,
    getTheme: getTheme,
    setTheme: setTheme,
  });
  global.MEDIA_BASE_URL = MEDIA_BASE_URL;
  global.getMediaUrl = getMediaUrl;

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () {
      hydrateMedia(doc);
      mountThemeToggle();
    });
  } else {
    hydrateMedia(doc);
    mountThemeToggle();
  }
})(window);
