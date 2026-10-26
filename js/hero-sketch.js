/* Home hero: CMYK crayon scribbles with overprint, calm breathing, eased 3D parallax and local string pluck. */
(function (global) {
  'use strict';

  var doc = global.document;
  var hero = doc.getElementById('hero');
  var canvas = doc.getElementById('hero-canvas');
  if (!hero || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var content = doc.getElementById('hero-content');
  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Design space; the canvas covers the hero like `object-fit: cover`.
  var DESIGN_W = 1200;
  var DESIGN_H = 680;
  var PLUCK_RADIUS_PX = 42;
  var STIFFNESS = 0.09;
  var DAMPING = 0.82;

  // Drawn back-to-front; depth scales parallax.
  var CLUSTERS = [
    { color: '#1a1a1a', alpha: 0.62, cx: 790, cy: 300, r: 170, depth: 0.45, phase: 0.0 },
    { color: '#00a6e4', alpha: 0.72, cx: 430, cy: 300, r: 170, depth: 1.3, phase: 1.7 },
    { color: '#e0137f', alpha: 0.66, cx: 545, cy: 296, r: 175, depth: 1.0, phase: 3.1 },
    { color: '#f3e500', alpha: 0.7, cx: 668, cy: 300, r: 175, depth: 0.75, phase: 4.6 },
  ];

  var TILT = -0.5;
  var LOOPS = 17;
  var SEGS_PER_LOOP = 18;

  // Deterministic PRNG so the hand-drawn shape is identical on every load.
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildCluster(c, index) {
    var rand = mulberry32(1018 + index * 97);
    var cosT = Math.cos(TILT);
    var sinT = Math.sin(TILT);
    var total = LOOPS * SEGS_PER_LOOP;
    var pts = [];
    for (var i = 0; i <= total; i++) {
      var u = i / total;
      var env = Math.sin(u * Math.PI);
      var wobble = 0.86 + 0.22 * Math.sin(i * 1.1 + index * 2.3) + (rand() - 0.5) * 0.08;
      var halfW = c.r * (0.3 + 0.7 * env) * wobble;
      var lx = Math.cos(u * LOOPS * Math.PI * 2) * halfW;
      var ly = (u - 0.5) * c.r * 2 + (rand() - 0.5) * 6;
      var x = c.cx + lx * cosT - ly * sinT;
      var y = c.cy + lx * sinT + ly * cosT;
      pts.push({ x: x, y: y, ox: x, oy: y, vx: 0, vy: 0, seed: rand() * Math.PI * 2 });
    }
    c.pts = pts;
    c.offsetX = 0;
    c.offsetY = 0;
  }

  CLUSTERS.forEach(buildCluster);

  // Static crayon grain: punched out of the strokes with destination-out.
  var grain = (function () {
    var size = 160;
    var g = doc.createElement('canvas');
    g.width = g.height = size;
    var gctx = g.getContext('2d');
    var img = gctx.createImageData(size, size);
    var rand = mulberry32(42);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = rand();
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
      img.data[i + 3] = v > 0.72 ? Math.floor((v - 0.72) * 520) : 0;
    }
    gctx.putImageData(img, 0, 0);
    return ctx.createPattern(g, 'repeat');
  })();

  var view = { scale: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };

  function resize() {
    var rect = hero.getBoundingClientRect();
    view.dpr = Math.min(global.devicePixelRatio || 1, 2);
    view.w = rect.width;
    view.h = rect.height;
    canvas.width = Math.round(rect.width * view.dpr);
    canvas.height = Math.round(rect.height * view.dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    // Contain-fit by height; on narrow screens let the scribbles span most of the width.
    view.scale = Math.min(rect.height / DESIGN_H, rect.width / 800);
    view.ox = (rect.width - DESIGN_W * view.scale) / 2;
    // Center the scribble cluster (design y≈300) on the hero text block.
    var anchorY = rect.height / 2;
    if (content) {
      var c = content.getBoundingClientRect();
      anchorY = c.top - rect.top + c.height * 0.45;
    }
    view.oy = anchorY - 300 * view.scale;
  }

  var pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, active: false };
  var target = { x: 0, y: 0 };
  var smooth = { x: 0, y: 0 };

  function onPointerMove(e) {
    var rect = hero.getBoundingClientRect();
    target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    target.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    var dx = (e.clientX - rect.left - view.ox) / view.scale;
    var dy = (e.clientY - rect.top - view.oy) / view.scale;
    if (pointer.active) {
      pointer.vx = (dx - pointer.x) * 0.6 + pointer.vx * 0.4;
      pointer.vy = (dy - pointer.y) * 0.6 + pointer.vy * 0.4;
    }
    pointer.x = dx;
    pointer.y = dy;
    pointer.active = true;
  }

  function onPointerLeave() {
    target.x = target.y = 0;
    pointer.active = false;
    pointer.x = pointer.y = -1e4;
    pointer.vx = pointer.vy = 0;
  }

  function step(time) {
    smooth.x += (target.x - smooth.x) * 0.06;
    smooth.y += (target.y - smooth.y) * 0.06;

    var radius = PLUCK_RADIUS_PX / view.scale;
    var r2 = radius * radius;
    var t = time * 0.001;

    for (var c = 0; c < CLUSTERS.length; c++) {
      var cl = CLUSTERS[c];
      // Slow (~9 s) breathing with per-cluster phase.
      var breath = Math.sin(t * 0.7 + cl.phase) * 4;
      cl.offsetX = -smooth.x * 38 * cl.depth;
      cl.offsetY = -smooth.y * 26 * cl.depth + breath;

      var mx = pointer.x - cl.offsetX;
      var my = pointer.y - cl.offsetY;
      var pts = cl.pts;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (pointer.active) {
          var dx = p.x - mx;
          var dy = p.y - my;
          var d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            var d = Math.sqrt(d2);
            var f = Math.pow(1 - d / radius, 1.4);
            p.vx += (dx / d) * f * 4.5 + pointer.vx * f * 0.45;
            p.vy += (dy / d) * f * 4.5 + pointer.vy * f * 0.45;
          }
        }
        // Staggered vertical drift along the stroke, a couple of pixels.
        var restY = p.oy + Math.sin(t * 0.9 + p.seed + i * 0.015) * 1.6;
        p.vx += (p.ox - p.x) * STIFFNESS;
        p.vy += (restY - p.y) * STIFFNESS;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }
    }
    pointer.vx *= 0.85;
    pointer.vy *= 0.85;

    if (content) {
      content.style.transform =
        'translate3d(' + (smooth.x * 12).toFixed(1) + 'px,' + (smooth.y * 9).toFixed(1) + 'px,0)';
    }
    canvas.style.transform =
      'rotateX(' + (-smooth.y * 4).toFixed(2) + 'deg) rotateY(' + (smooth.x * 5).toFixed(2) + 'deg)';
  }

  function tracePath(pts, ox, oy, jitter) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i].x + ox + (jitter ? Math.cos(pts[i].seed) * jitter : 0);
      var y = pts[i].y + oy + (jitter ? Math.sin(pts[i].seed) * jitter : 0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.ox, view.dpr * view.oy);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Overlaps multiply (overprint); strokes over the transparent canvas keep their own color.
    ctx.globalCompositeOperation = 'multiply';

    for (var c = 0; c < CLUSTERS.length; c++) {
      var cl = CLUSTERS[c];
      ctx.strokeStyle = cl.color;
      ctx.globalAlpha = cl.alpha;
      ctx.lineWidth = 7;
      tracePath(cl.pts, cl.offsetX, cl.offsetY, 0);
      ctx.stroke();
      ctx.globalAlpha = cl.alpha * 0.5;
      ctx.lineWidth = 3;
      tracePath(cl.pts, cl.offsetX + 3, cl.offsetY - 2, 1.4);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.globalCompositeOperation = 'source-over';
  }

  var rafId = 0;
  var visible = true;

  function frame(time) {
    rafId = 0;
    step(time);
    draw();
    schedule();
  }

  function schedule() {
    if (!rafId && visible && !doc.hidden && !reduceMotion) rafId = global.requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId) global.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  resize();
  draw();
  hero.classList.add('hero--ready');

  if (reduceMotion) {
    global.addEventListener('resize', function () {
      resize();
      draw();
    });
    return;
  }

  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave);
  global.addEventListener('resize', function () {
    resize();
    draw();
  });

  if ('IntersectionObserver' in global) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
      else stop();
    }).observe(hero);
  }
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) stop();
    else schedule();
  });

  schedule();
})(window);
