/* Home hero: CMYK crayon scribbles that sprawl out on load and re-sketch on double-click or on a fixed cycle.
 * WebGL renderer (tube shading, depth tint, soft crayon density, exact multiply overprint) with a Canvas 2D fallback.
 * Calm breathing, eased 3D parallax and a cursor "re-ink" trail are shared by both renderers. */
(function (global) {
  'use strict';

  var doc = global.document;
  var hero = doc.getElementById('hero');
  var canvas = doc.getElementById('hero-canvas');
  if (!hero || !canvas) return;

  var content = doc.getElementById('hero-content');
  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var forced2d = /[?&]hero=2d\b/.test(global.location.search);
  // Subpage bands: data-sketch-mode="static" (no intro, re-sketch or double-click), data-sketch-fit="cover".
  var staticMode = reduceMotion || hero.getAttribute('data-sketch-mode') === 'static';
  var coverFit = hero.getAttribute('data-sketch-fit') === 'cover';

  var DESIGN_H = 680;
  // Where the cursor passes over a line, that part is pressed again: it swells and turns fully opaque, then fades back.
  var INK_RADIUS_PX = 30;
  var INK_FADE = 0.7;
  var INK_SWELL = 0.9;
  // The thin echo line drifts further off the main stroke where it is re-inked.
  var ECHO_SPLIT = 1.8;
  // Crossing a line while moving flicks a few ink drops off it, in the direction of travel.
  var FLICK_CHANCE = 0.7;
  var FLICK_PER_FRAME = 6;
  // Lines near the cursor ease aside like hair under a fingertip, then settle back; no spring.
  var PART_RADIUS_PX = 80;
  var PART_PUSH_PX = 18;
  var PART_EASE = 5;
  var STIFFNESS = 0.09;
  var DAMPING = 0.82;
  var STROKE_WIDTH = 7;
  var ECHO_WIDTH = 2.4;
  var DRAW_DURATION = 2.4;
  var ERASE_DURATION = 1.1;
  var REDRAW_CYCLE_MS = 10000;

  // Drawn back-to-front; depth scales parallax, delay staggers the intro (seconds).
  var CLUSTERS = [
    { color: '#1a1a1a', alpha: 0.62, cx: 790, cy: 300, r: 170, depth: 0.45, phase: 0.0, delay: 0.9 },
    { color: '#00a6e4', alpha: 0.74, cx: 430, cy: 300, r: 170, depth: 1.3, phase: 1.7, delay: 0.0 },
    { color: '#e0137f', alpha: 0.68, cx: 545, cy: 296, r: 175, depth: 1.0, phase: 3.1, delay: 0.3 },
    { color: '#f3e500', alpha: 0.72, cx: 668, cy: 300, r: 175, depth: 0.75, phase: 4.6, delay: 0.6 },
  ];

  var TILT = -0.5;
  var LOOPS = 17;
  var SEGS_PER_LOOP = 32;

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function buildCluster(c, index) {
    var cosT = Math.cos(TILT);
    var sinT = Math.sin(TILT);
    var total = LOOPS * SEGS_PER_LOOP;
    var pts = [];
    for (var i = 0; i <= total; i++) {
      var u = i / total;
      var env = Math.sin(u * Math.PI);
      var angle = u * LOOPS * Math.PI * 2;
      var wobble = 0.88 + 0.22 * Math.sin(u * LOOPS * 2 * 1.1 + index * 2.3);
      var halfW = c.r * (0.3 + 0.7 * env) * wobble;
      var lx = Math.cos(angle) * halfW;
      var ly = (u - 0.5) * c.r * 2;
      var x = c.cx + lx * cosT - ly * sinT;
      var y = c.cy + lx * sinT + ly * cosT;
      // Each loop is treated as a helix: z > 0 is the half nearer the viewer.
      pts.push({ x: x, y: y, ox: x, oy: y, vx: 0, vy: 0, z: Math.sin(angle), ink: 0, px: 0, py: 0 });
    }
    c.pts = pts;
    c.rgb = hexToRgb(c.color);
    c.index = index;
    c.offsetX = 0;
    c.offsetY = 0;
    c.head = staticMode ? 1 : 0;
    c.tail = 0;
  }

  CLUSTERS.forEach(buildCluster);

  // ------------------------------------------------------------------ view & input

  var view = { scale: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var pointer = { x: -1e4, y: -1e4, active: false, cssX: 0, cssY: 0, amount: 0, mx: 0, my: 0 };
  var target = { x: 0, y: 0 };
  var smooth = { x: 0, y: 0 };
  var renderer = null;

  function resize() {
    var rect = hero.getBoundingClientRect();
    view.dpr = Math.min(global.devicePixelRatio || 1, 2);
    view.w = rect.width;
    view.h = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * view.dpr));
    canvas.height = Math.max(1, Math.round(rect.height * view.dpr));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    // Home: contain-fit by height (scribbles span most of the width on narrow screens).
    // Bands: fill the width so the scribbles read as a backdrop behind the title.
    view.scale = coverFit
      ? Math.max(rect.width / 1200, rect.height / 500)
      : Math.min(rect.height / DESIGN_H, rect.width / 800);
    view.ox = (rect.width - 1200 * view.scale) / 2;
    // Center the scribble cluster (design y≈300) on the hero text block.
    var anchorY = rect.height / 2;
    if (content) {
      var c = content.getBoundingClientRect();
      anchorY = c.top - rect.top + c.height * 0.45;
    }
    view.oy = anchorY - 300 * view.scale;
    if (renderer) renderer.resize();
  }

  var shownAt = 0;

  function onPointerMove(e) {
    var rect = hero.getBoundingClientRect();
    target.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    target.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    var nx = (e.clientX - rect.left - view.ox) / view.scale;
    var ny = (e.clientY - rect.top - view.oy) / view.scale;
    if (pointer.active) {
      pointer.mx += nx - pointer.x;
      pointer.my += ny - pointer.y;
    }
    pointer.x = nx;
    pointer.y = ny;
    pointer.cssX = e.clientX - rect.left;
    pointer.cssY = e.clientY - rect.top;
    pointer.active = true;
  }

  function onPointerLeave() {
    target.x = target.y = 0;
    pointer.active = false;
    pointer.x = pointer.y = -1e4;
  }

  // ------------------------------------------------------------------ animation state

  // drawing: heads grow 0→1 | shown: idle | erasing: tails chase heads, then drawing restarts.
  var anim = { mode: staticMode ? 'shown' : 'drawing', start: null };

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function setMode(mode, start) {
    anim.mode = mode;
    anim.start = start;
    hero.setAttribute('data-hero-state', mode);
  }

  function requestRedraw() {
    if (staticMode || anim.mode !== 'shown') return;
    setMode('erasing', null);
  }

  function stepAnimation(time) {
    if (anim.start === null) anim.start = time;
    var elapsed = (time - anim.start) / 1000;
    var done = true;
    var i;
    if (anim.mode === 'drawing') {
      for (i = 0; i < CLUSTERS.length; i++) {
        CLUSTERS[i].tail = 0;
        CLUSTERS[i].head = easeInOutCubic(clamp01((elapsed - CLUSTERS[i].delay) / DRAW_DURATION));
        if (CLUSTERS[i].head < 1) done = false;
      }
      if (done) {
        setMode('shown', anim.start);
        shownAt = time;
      }
    } else if (anim.mode === 'erasing') {
      for (i = 0; i < CLUSTERS.length; i++) {
        CLUSTERS[i].tail = easeInOutCubic(clamp01((elapsed - CLUSTERS[i].delay * 0.5) / ERASE_DURATION));
        if (CLUSTERS[i].tail < 1) done = false;
      }
      if (done) {
        for (i = 0; i < CLUSTERS.length; i++) CLUSTERS[i].head = CLUSTERS[i].tail = 0;
        setMode('drawing', time);
      }
    } else if (!staticMode && time - shownAt > REDRAW_CYCLE_MS) {
      requestRedraw();
    }
  }

  // ------------------------------------------------------------------ ink specks

  // While a stroke is drawn (pen tip) or erased (trailing end), tiny ink drops spatter and fade out.
  var SPECK_RATE = 45;
  var SPECK_MAX = 120;
  var lastStepTime = null;

  function tipOf(cl, progress) {
    var pts = cl.pts;
    var f = progress * (pts.length - 1);
    var i = Math.min(Math.floor(f), pts.length - 2);
    var t = f - i;
    var a = pts[i];
    var b = pts[i + 1];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x, dy: b.y - a.y };
  }

  function stepSpecks(cl, dt) {
    var specks = cl.specks || (cl.specks = []);
    var progress = -1;
    if (anim.mode === 'drawing' && cl.head > 0 && cl.head < 1) progress = cl.head;
    else if (anim.mode === 'erasing' && cl.tail > 0 && cl.tail < 1) progress = cl.tail;
    if (progress >= 0 && specks.length < SPECK_MAX) {
      var expected = SPECK_RATE * dt;
      while (expected > 0) {
        if (Math.random() < Math.min(1, expected)) {
          var tip = tipOf(cl, progress);
          var len = Math.sqrt(tip.dx * tip.dx + tip.dy * tip.dy) || 1;
          // Mostly flung sideways from the direction of travel.
          var side = Math.random() < 0.5 ? -1 : 1;
          var nx = (-tip.dy / len) * side;
          var ny = (tip.dx / len) * side;
          var dist = 6 + Math.random() * 22;
          var big = Math.random() < 0.25;
          specks.push({
            x: tip.x + nx * dist + (Math.random() - 0.5) * 8,
            y: tip.y + ny * dist + (Math.random() - 0.5) * 8,
            vx: nx * (0.1 + Math.random() * 0.25),
            vy: ny * (0.1 + Math.random() * 0.25),
            r: big ? 2.6 + Math.random() * 1.8 : 1.1 + Math.random() * 1.3,
            age: 0,
            life: 1.0 + Math.random() * 1.0,
          });
        }
        expected -= 1;
      }
    }
    for (var i = specks.length - 1; i >= 0; i--) {
      var s = specks[i];
      s.age += dt;
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.92;
      s.vy *= 0.92;
      if (s.age >= s.life) specks.splice(i, 1);
    }
  }

  function speckAlpha(s) {
    var fadeIn = Math.min(1, s.age / 0.08);
    return fadeIn * Math.pow(1 - s.age / s.life, 1.5);
  }

  function step(time) {
    stepAnimation(time);
    var dt = lastStepTime === null ? 0 : Math.min(0.1, (time - lastStepTime) / 1000);
    lastStepTime = time;
    for (var sc = 0; sc < CLUSTERS.length; sc++) stepSpecks(CLUSTERS[sc], dt);

    smooth.x += (target.x - smooth.x) * 0.06;
    smooth.y += (target.y - smooth.y) * 0.06;

    var radius = INK_RADIUS_PX / view.scale;
    var r2 = radius * radius;
    var inkDecay = Math.exp(-dt * INK_FADE);
    var partR = PART_RADIUS_PX / view.scale;
    var partR2 = partR * partR;
    var partPush = PART_PUSH_PX / view.scale;
    var partK = 1 - Math.exp(-dt * PART_EASE);
    var moveLen = Math.sqrt(pointer.mx * pointer.mx + pointer.my * pointer.my);
    var moveX = moveLen > 0 ? pointer.mx / moveLen : 0;
    var moveY = moveLen > 0 ? pointer.my / moveLen : 0;
    var moving = moveLen > 1.5;
    pointer.mx = pointer.my = 0;
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
      var specks = cl.specks || (cl.specks = []);
      var flicks = 0;
      var last = pts.length - 1;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var prevInk = p.ink;
        p.ink *= inkDecay;
        var tx = 0;
        var ty = 0;
        if (pointer.active) {
          var dx = p.x - mx;
          var dy = p.y - my;
          var d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            var f = 1 - Math.sqrt(d2) / radius;
            f = f * f * (3 - 2 * f);
            if (f > p.ink) p.ink = f;
            // Only visible parts of the line, and only on a fresh crossing.
            var visible = i >= cl.tail * last && i <= cl.head * last;
            if (moving && visible && f > 0.6 && prevInk < 0.3 && flicks < FLICK_PER_FRAME &&
                specks.length < SPECK_MAX && Math.random() < FLICK_CHANCE) {
              flicks++;
              var sp = 0.3 + Math.random() * 0.5;
              specks.push({
                x: p.x + p.px + moveX * 6 + (Math.random() - 0.5) * 8,
                y: p.y + p.py + moveY * 6 + (Math.random() - 0.5) * 8,
                vx: moveX * sp + (Math.random() - 0.5) * 0.2,
                vy: moveY * sp + (Math.random() - 0.5) * 0.2,
                r: Math.random() < 0.3 ? 2.6 + Math.random() * 1.8 : 1.1 + Math.random() * 1.3,
                age: 0,
                life: 1.0 + Math.random() * 1.0,
              });
            }
          }
          if (d2 < partR2) {
            var d = Math.sqrt(d2) || 1e-3;
            var q = 1 - d2 / partR2;
            var push = partPush * q * q;
            tx = (dx / d) * push;
            ty = (dy / d) * push;
          }
        }
        p.px += (tx - p.px) * partK;
        p.py += (ty - p.py) * partK;
        // A slow wave travelling along the stroke; neighbours move together, so lines stay smooth.
        var restY = p.oy + Math.sin(t * 0.9 + cl.phase + i * 0.03) * 1.6;
        p.vx += (p.ox - p.x) * STIFFNESS;
        p.vy += (restY - p.y) * STIFFNESS;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }
    }
    pointer.amount += ((pointer.active ? 1 : 0) - pointer.amount) * 0.06;

    if (content) {
      content.style.transform =
        'translate3d(' + (smooth.x * 12).toFixed(1) + 'px,' + (smooth.y * 9).toFixed(1) + 'px,0)';
    }
    canvas.style.transform =
      'rotateX(' + (-smooth.y * 4).toFixed(2) + 'deg) rotateY(' + (smooth.x * 5).toFixed(2) + 'deg)';
  }

  // ------------------------------------------------------------------ visible geometry

  // Visible window [tail, head] of a stroke in design space.
  var vis = { x: [], y: [], z: [], s: [], ink: [], n: 0 };

  function pushPoint(cl, f) {
    var pts = cl.pts;
    var i = Math.min(Math.floor(f), pts.length - 2);
    var t = f - i;
    var a = pts[i];
    var b = pts[i + 1];
    var z = a.z + (b.z - a.z) * t;
    var k = vis.n++;
    vis.x[k] = a.x + a.px + (b.x + b.px - a.x - a.px) * t + cl.offsetX;
    vis.y[k] = a.y + a.py + (b.y + b.py - a.y - a.py) * t + cl.offsetY;
    vis.z[k] = z;
    vis.ink[k] = a.ink + (b.ink - a.ink) * t;
    vis.s[k] = f;
  }

  function collect(cl) {
    vis.n = 0;
    var last = cl.pts.length - 1;
    var from = cl.tail * last;
    var to = cl.head * last;
    if (to - from < 0.05) return 0;
    pushPoint(cl, from);
    for (var i = Math.floor(from) + 1; i < to; i++) pushPoint(cl, i);
    pushPoint(cl, to);
    return vis.n;
  }

  // ------------------------------------------------------------------ WebGL renderer

  // One quad per segment; the fragment shader turns it into a round-capped capsule, so joins stay smooth.
  var STROKE_VS = [
    'attribute vec2 aPos;',
    'attribute vec4 aSeg;',
    'attribute vec4 aMeta;',
    'attribute vec2 aInk;',
    'uniform vec4 uView;',
    'uniform vec2 uRes;',
    'varying vec2 vP;',
    'varying vec4 vSeg;',
    'varying vec4 vMeta;',
    'varying vec2 vInk;',
    'void main() {',
    '  vec2 px = (aPos * uView.x + uView.yz) * uView.w;',
    '  vec2 clip = px / uRes * 2.0 - 1.0;',
    '  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);',
    '  vP = aPos;',
    '  vSeg = aSeg;',
    '  vMeta = aMeta;',
    '  vInk = aInk;',
    '}',
  ].join('\n');

  var STROKE_FS = [
    'precision highp float;',
    'uniform vec3 uColor;',
    'uniform float uAlpha;',
    'uniform float uSeed;',
    'uniform float uHalf;',
    'uniform float uSwell;',
    'uniform float uAA;',
    'varying vec2 vP;',
    'varying vec4 vSeg;',
    'varying vec4 vMeta;',
    'varying vec2 vInk;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    'void main() {',
    '  vec2 a = vSeg.xy; vec2 ab = vSeg.zw - a;',
    '  float t = clamp(dot(vP - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);',
    '  float d = length(vP - a - ab * t);',
    '  float ink = mix(vInk.x, vInk.y, t);',
    '  float h = uHalf * (1.0 + uSwell * ink);',
    '  if (d > h + uAA) discard;',
    '  float v = d / h;',
    '  float edge = 1.0 - smoothstep(h - uAA, h + uAA, d);',
    '  float tube = sqrt(max(0.0, 1.0 - v * v));',
    '  float along = mix(vMeta.x, vMeta.y, t);',
    '  float depth = 0.5 + 0.5 * mix(vMeta.z, vMeta.w, t);',
    // Gentle density variation along the stroke (no speckles).
    '  float grain = mix(0.85, 1.0, noise(vec2(along * 0.9, uSeed)));',
    '  float alpha = uAlpha * edge * grain * mix(0.75, 1.0, depth);',
    '  vec3 col = min(uColor * mix(0.85, 1.1, tube) * mix(0.85, 1.0, depth), 1.0);',
    // Re-inked parts: fully opaque and full-strength colour, like a second, harder pass of the crayon.
    '  alpha = mix(alpha, edge, ink);',
    '  col = mix(col, uColor, ink);',
    '  gl_FragColor = vec4(col * alpha, alpha);',
    '}',
  ].join('\n');

  var QUAD_VS = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }',
  ].join('\n');

  // Halftone background (faint dot screen whose dots near the cursor swell and take CMYK inks), then
  // exact W3C "multiply" compositing of the colour layers, back to front, over a transparent canvas.
  var COMPOSITE_FS = [
    'precision highp float;',
    'uniform sampler2D uL0;',
    'uniform sampler2D uL1;',
    'uniform sampler2D uL2;',
    'uniform sampler2D uL3;',
    'uniform vec2 uRes;',
    'uniform float uDpr;',
    'uniform vec3 uMouse;',
    'varying vec2 vUv;',
    'vec4 blend(vec4 acc, vec4 s) {',
    '  if (s.a <= 0.0) return acc;',
    '  vec3 cs = s.rgb / s.a;',
    '  vec3 cb = acc.a > 0.0 ? acc.rgb / acc.a : vec3(0.0);',
    '  vec3 mixed = (1.0 - acc.a) * cs + acc.a * cs * cb;',
    '  return vec4(s.a * mixed + (1.0 - s.a) * acc.rgb, s.a + acc.a * (1.0 - s.a));',
    '}',
    'void main() {',
    '  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;',
    '  vec2 dm = p - uMouse.xy;',
    '  float near = uMouse.z * exp(-dot(dm, dm) / (2.0 * 80.0 * 80.0));',
    '  float cell = 22.0;',
    // One screen only: dots near the cursor grow a little and take one ink each (picked per cell).
    '  vec2 q = vec2(0.7071 * (p.x - p.y), 0.7071 * (p.x + p.y)) / cell;',
    '  float d = length(fract(q) - 0.5) * cell;',
    '  float r = 1.0 + 2.2 * near;',
    '  float dotMask = 1.0 - smoothstep(r - 0.7, r + 0.7, d);',
    '  float h = fract(sin(dot(floor(q), vec2(12.9898, 78.233))) * 43758.5453);',
    '  vec3 ink = h < 0.34 ? vec3(0.0, 0.682, 0.937) : (h < 0.67 ? vec3(0.925, 0.0, 0.549) : vec3(1.0, 0.949, 0.0));',
    '  vec3 col = mix(vec3(1.0), ink, smoothstep(0.1, 0.5, near));',
    '  float a = dotMask * mix(0.07, 0.55, near);',
    '  vec4 acc = vec4(col * a, a);',
    '  acc = blend(acc, texture2D(uL0, vUv));',
    '  acc = blend(acc, texture2D(uL1, vUv));',
    '  acc = blend(acc, texture2D(uL2, vUv));',
    '  acc = blend(acc, texture2D(uL3, vUv));',
    '  gl_FragColor = acc;',
    '}',
  ].join('\n');

  function createGL() {
    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    if (!gl) return null;
    var maxBlend = gl.getExtension('EXT_blend_minmax');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }

    function program(vs, fs) {
      var p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

    var strokeProg;
    var compProg;
    try {
      strokeProg = program(STROKE_VS, STROKE_FS);
      compProg = program(QUAD_VS, COMPOSITE_FS);
    } catch (e) {
      return null;
    }

    var sLoc = {
      pos: gl.getAttribLocation(strokeProg, 'aPos'),
      seg: gl.getAttribLocation(strokeProg, 'aSeg'),
      meta: gl.getAttribLocation(strokeProg, 'aMeta'),
      ink: gl.getAttribLocation(strokeProg, 'aInk'),
      view: gl.getUniformLocation(strokeProg, 'uView'),
      res: gl.getUniformLocation(strokeProg, 'uRes'),
      color: gl.getUniformLocation(strokeProg, 'uColor'),
      alpha: gl.getUniformLocation(strokeProg, 'uAlpha'),
      seed: gl.getUniformLocation(strokeProg, 'uSeed'),
      half: gl.getUniformLocation(strokeProg, 'uHalf'),
      swell: gl.getUniformLocation(strokeProg, 'uSwell'),
      aa: gl.getUniformLocation(strokeProg, 'uAA'),
    };
    var cPos = gl.getAttribLocation(compProg, 'aPos');

    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    var FLOATS = 12;
    var maxVerts = (CLUSTERS[0].pts.length + 4) * 6;
    var data = new Float32Array(maxVerts * FLOATS);
    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);

    var layers = CLUSTERS.map(function () {
      var tex = gl.createTexture();
      var fbo = gl.createFramebuffer();
      return { tex: tex, fbo: fbo };
    });

    function resizeLayers() {
      layers.forEach(function (l) {
        gl.bindTexture(gl.TEXTURE_2D, l.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, l.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, l.tex, 0);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // Two triangles per segment, padded by the stroke radius so the capsule fits inside.
    function buildSegments(halfWidth, shiftX, shiftY) {
      var n = vis.n;
      var o = 0;
      var aaPad = 1.5 / (view.scale * view.dpr);
      for (var i = 0; i < n - 1; i++) {
        var pad = halfWidth * (1 + INK_SWELL * Math.max(vis.ink[i], vis.ink[i + 1])) + aaPad;
        var ax = vis.x[i] + shiftX * (1 + ECHO_SPLIT * vis.ink[i]);
        var ay = vis.y[i] + shiftY * (1 + ECHO_SPLIT * vis.ink[i]);
        var bx = vis.x[i + 1] + shiftX * (1 + ECHO_SPLIT * vis.ink[i + 1]);
        var by = vis.y[i + 1] + shiftY * (1 + ECHO_SPLIT * vis.ink[i + 1]);
        var dx = bx - ax;
        var dy = by - ay;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-4) {
          dx = 1;
          dy = 0;
        } else {
          dx /= len;
          dy /= len;
        }
        var ux = dx * pad;
        var uy = dy * pad;
        var nx = -dy * pad;
        var ny = dx * pad;
        var corners = [
          ax - ux + nx, ay - uy + ny,
          ax - ux - nx, ay - uy - ny,
          bx + ux + nx, by + uy + ny,
          bx + ux - nx, by + uy - ny,
        ];
        var order = [0, 1, 2, 2, 1, 3];
        for (var k = 0; k < 6; k++) {
          var c = order[k] * 2;
          data[o++] = corners[c];
          data[o++] = corners[c + 1];
          data[o++] = ax; data[o++] = ay; data[o++] = bx; data[o++] = by;
          data[o++] = vis.s[i]; data[o++] = vis.s[i + 1]; data[o++] = vis.z[i]; data[o++] = vis.z[i + 1];
          data[o++] = vis.ink[i]; data[o++] = vis.ink[i + 1];
        }
      }
      return Math.max(0, n - 1) * 6;
    }

    // A zero-length capsule (round dot) for one ink speck.
    function buildDot(x, y, halfWidth) {
      var pad = halfWidth + 1.5 / (view.scale * view.dpr);
      var corners = [x - pad, y - pad, x + pad, y - pad, x - pad, y + pad, x + pad, y + pad];
      var order = [0, 1, 2, 2, 1, 3];
      var o = 0;
      for (var k = 0; k < 6; k++) {
        var c = order[k] * 2;
        data[o++] = corners[c];
        data[o++] = corners[c + 1];
        data[o++] = x; data[o++] = y; data[o++] = x; data[o++] = y;
        data[o++] = 0; data[o++] = 0; data[o++] = 1; data[o++] = 1;
        data[o++] = 0; data[o++] = 0;
      }
      return 6;
    }

    function drawSegments(count, halfWidth) {
      if (!count) return;
      gl.uniform1f(sLoc.half, halfWidth);
      gl.uniform1f(sLoc.swell, INK_SWELL);
      gl.uniform1f(sLoc.aa, 0.75 / (view.scale * view.dpr));
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, count * FLOATS));
      var stride = FLOATS * 4;
      gl.enableVertexAttribArray(sLoc.pos);
      gl.vertexAttribPointer(sLoc.pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(sLoc.seg);
      gl.vertexAttribPointer(sLoc.seg, 4, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(sLoc.meta);
      gl.vertexAttribPointer(sLoc.meta, 4, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(sLoc.ink);
      gl.vertexAttribPointer(sLoc.ink, 2, gl.FLOAT, false, stride, 40);
      gl.drawArrays(gl.TRIANGLES, 0, count);
    }

    resizeLayers();

    return {
      kind: 'webgl',
      resize: resizeLayers,
      draw: function () {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(strokeProg);
        gl.uniform4f(sLoc.view, view.scale, view.ox, view.oy, view.dpr);
        gl.uniform2f(sLoc.res, canvas.width, canvas.height);
        gl.enable(gl.BLEND);
        // Within one colour, overlapping loops keep the stronger coverage instead of stacking.
        if (maxBlend) {
          gl.blendEquation(maxBlend.MAX_EXT);
          gl.blendFunc(gl.ONE, gl.ONE);
        } else {
          gl.blendEquation(gl.FUNC_ADD);
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        }

        for (var c = 0; c < CLUSTERS.length; c++) {
          var cl = CLUSTERS[c];
          gl.bindFramebuffer(gl.FRAMEBUFFER, layers[c].fbo);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          if (!collect(cl)) continue;
          gl.uniform3f(sLoc.color, cl.rgb[0], cl.rgb[1], cl.rgb[2]);
          gl.uniform1f(sLoc.seed, cl.index * 17.3);
          gl.uniform1f(sLoc.alpha, cl.alpha);
          drawSegments(buildSegments(STROKE_WIDTH / 2, 0, 0), STROKE_WIDTH / 2);
          // Thin offset echo line gives the doubled crayon edge.
          gl.uniform1f(sLoc.alpha, cl.alpha * 0.45);
          drawSegments(buildSegments(ECHO_WIDTH / 2, 3, -2), ECHO_WIDTH / 2);
          var specks = cl.specks || [];
          for (var s = 0; s < specks.length; s++) {
            gl.uniform1f(sLoc.alpha, speckAlpha(specks[s]));
            drawSegments(buildDot(specks[s].x + cl.offsetX, specks[s].y + cl.offsetY, specks[s].r), specks[s].r);
          }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.useProgram(compProg);
        gl.uniform2f(gl.getUniformLocation(compProg, 'uRes'), canvas.width, canvas.height);
        gl.uniform1f(gl.getUniformLocation(compProg, 'uDpr'), view.dpr);
        gl.uniform3f(gl.getUniformLocation(compProg, 'uMouse'), pointer.cssX, pointer.cssY, pointer.amount);
        for (var k = 0; k < layers.length; k++) {
          gl.activeTexture(gl.TEXTURE0 + k);
          gl.bindTexture(gl.TEXTURE_2D, layers[k].tex);
          gl.uniform1i(gl.getUniformLocation(compProg, 'uL' + k), k);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(cPos);
        gl.vertexAttribPointer(cPos, 2, gl.FLOAT, false, 0, 0);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }

  // ------------------------------------------------------------------ Canvas 2D fallback

  function create2D() {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var layer = doc.createElement('canvas');
    var lctx = layer.getContext('2d');

    function tracePath(c2, shiftX, shiftY) {
      c2.beginPath();
      for (var i = 0; i < vis.n; i++) {
        var k = 1 + ECHO_SPLIT * vis.ink[i];
        if (i) c2.lineTo(vis.x[i] + shiftX * k, vis.y[i] + shiftY * k);
        else c2.moveTo(vis.x[i] + shiftX * k, vis.y[i] + shiftY * k);
      }
    }

    return {
      kind: '2d',
      resize: function () {
        layer.width = canvas.width;
        layer.height = canvas.height;
      },
      draw: function () {
        var m = [view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.ox, view.dpr * view.oy];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var c = 0; c < CLUSTERS.length; c++) {
          var cl = CLUSTERS[c];
          if (collect(cl) < 2) continue;

          // Opaque per-colour layer so self-overlaps don't stack, then one multiply composite.
          lctx.setTransform(1, 0, 0, 1, 0, 0);
          lctx.clearRect(0, 0, layer.width, layer.height);
          lctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
          lctx.lineCap = 'round';
          lctx.lineJoin = 'round';
          lctx.strokeStyle = cl.color;
          lctx.lineWidth = STROKE_WIDTH;
          tracePath(lctx, 0, 0);
          lctx.stroke();
          // Re-inked segments swell, inside the same layer so they don't stack.
          for (var k = 1; k < vis.n; k++) {
            var ink = Math.max(vis.ink[k - 1], vis.ink[k]);
            if (ink < 0.02) continue;
            lctx.lineWidth = STROKE_WIDTH * (1 + INK_SWELL * ink);
            lctx.beginPath();
            lctx.moveTo(vis.x[k - 1], vis.y[k - 1]);
            lctx.lineTo(vis.x[k], vis.y[k]);
            lctx.stroke();
          }
          var specks = cl.specks || [];
          lctx.fillStyle = cl.color;
          for (var s = 0; s < specks.length; s++) {
            lctx.globalAlpha = speckAlpha(specks[s]);
            lctx.beginPath();
            lctx.arc(specks[s].x + cl.offsetX, specks[s].y + cl.offsetY, specks[s].r, 0, Math.PI * 2);
            lctx.fill();
          }
          lctx.globalAlpha = 1;

          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = cl.alpha;
          ctx.drawImage(layer, 0, 0);

          ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = cl.color;
          ctx.globalAlpha = cl.alpha * 0.45;
          ctx.lineWidth = ECHO_WIDTH;
          tracePath(ctx, 3, -2);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      },
    };
  }

  // ------------------------------------------------------------------ loop

  renderer = (!forced2d && createGL()) || create2D();
  if (!renderer) return;
  hero.setAttribute('data-renderer', renderer.kind);
  hero.setAttribute('data-hero-state', anim.mode);

  var rafId = 0;
  var visible = true;

  function frame(time) {
    rafId = 0;
    step(time);
    renderer.draw();
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
  renderer.draw();
  hero.classList.add('hero--ready');

  global.addEventListener('resize', function () {
    resize();
    renderer.draw();
  });

  if (reduceMotion) return;

  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave);
  if (!staticMode) {
    hero.addEventListener('dblclick', function (e) {
      if (e.target.closest && e.target.closest('a')) return;
      var sel = global.getSelection && global.getSelection();
      if (sel) sel.removeAllRanges();
      requestRedraw();
    });
  }

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
