/* Shared enhancements for content pages: media hydration, lazy images, lightbox flags, code highlighting, external links. */
(function (global) {
  'use strict';

  var doc = global.document;
  var aliasesRegistered = false;

  var ALLOWED_IFRAME_HOSTS = ['www.youtube-nocookie.com', 'player.bilibili.com', 'player.vimeo.com'];

  function registerHighlightAliases() {
    if (aliasesRegistered || !global.hljs || !global.hljs.registerAliases) return;
    global.hljs.registerAliases(['hlsl', 'shaderlab', 'wgsl', 'cg', 'shader'], { languageName: 'cpp' });
    aliasesRegistered = true;
  }

  function languageOf(code) {
    var match = /(?:^|\s)language-([\w+#-]+)/.exec(code.className);
    return match ? match[1].toLowerCase() : '';
  }

  function highlight(root) {
    registerHighlightAliases();
    var blocks = root.querySelectorAll('pre > code');
    for (var i = 0; i < blocks.length; i++) {
      var code = blocks[i];
      var lang = languageOf(code);
      if (lang) code.parentElement.setAttribute('data-lang', lang);
      if (global.hljs && lang && global.hljs.getLanguage(lang) && !code.classList.contains('hljs')) {
        global.hljs.highlightElement(code);
      }
    }
  }

  function enhanceImages(root) {
    var images = root.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      if (!img.closest('a') && !img.hasAttribute('data-no-lightbox')) {
        img.setAttribute('data-lightbox', '');
        img.setAttribute('tabindex', '0');
      }
    }
  }

  function enhanceLinks(root) {
    var links = root.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var url;
      try {
        url = new URL(a.getAttribute('href'), global.location.href);
      } catch (e) {
        continue;
      }
      if (/^https?:$/.test(url.protocol) && url.origin !== global.location.origin) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }

  function initTabs(root) {
    var groups = root.querySelectorAll('[data-tabs]');
    for (var g = 0; g < groups.length; g++) setupTabs(groups[g]);
  }

  function setupTabs(group) {
    if (group.hasAttribute('data-tabs-ready')) return;
    group.setAttribute('data-tabs-ready', '');
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return doc.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (panels[i]) panels[i].hidden = !active;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        select(i, false);
        if (global.history.replaceState) global.history.replaceState(null, '', '#' + tab.getAttribute('aria-controls'));
      });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          select(next, true);
        }
      });
    });

    // Open the tab named in the URL hash, or the one containing the hash target.
    var initial = 0;
    var hash = decodeURIComponent((global.location.hash || '').slice(1));
    var target = hash && doc.getElementById(hash);
    if (target) {
      panels.forEach(function (panel, i) {
        if (panel && (panel === target || panel.contains(target))) initial = i;
      });
    }
    select(initial, false);
  }

  function enhance(root) {
    if (!root) return;
    if (global.SiteConfig) global.SiteConfig.hydrateMedia(root);
    enhanceImages(root);
    highlight(root);
    enhanceLinks(root);
    initTabs(root);
  }

  global.SiteContent = Object.freeze({
    enhance: enhance,
    ALLOWED_IFRAME_HOSTS: ALLOWED_IFRAME_HOSTS,
  });

  function autoEnhance() {
    var targets = doc.querySelectorAll('main.content:not([data-defer-enhance])');
    for (var i = 0; i < targets.length; i++) enhance(targets[i]);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', autoEnhance);
  } else {
    autoEnhance();
  }
})(window);
