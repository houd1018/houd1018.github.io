/* Home hero: CMYK crayon scribbles that sprawl out on load and re-sketch on double-click or after idling.
 * WebGL renderer (tube shading, depth tint, crayon grain, exact multiply overprint) with a Canvas 2D fallback.
 * Calm breathing, per-vertex 3D parallax and local string pluck are shared by both renderers. */
(function (global) {
  'use strict';

  var doc = global.document;
  var hero = doc.getElementById('hero');
  var canvas = doc.getElementById('hero-canvas');
  if (!hero || !canvas) return;

  var content = doc.getElementById('hero-content');
  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var forced2d = /[?&]hero=2d\b/.test(global.location.search);

  var DESIGN_H = 680;
  var PLUCK_RADIUS_PX = 42;
  var STIFFNESS = 0.09;
  var DAMPING = 0.82;
  var STROKE_WIDTH = 7;
  var ECHO_WIDTH = 2.4;
  var DRAW_DURATION = 2.4;
  var ERASE_DURATION = 1.1;
  var IDLE_REDRAW_MS = 30000;

  // Drawn back-to-front; depth scales parallax, delay staggers the intro (seconds).
  var CLUSTERS = [
    { color: '#1a1a1a', alpha: 0.62, cx: 790, cy: 300, r: 170, depth: 0.45, phase: 0.0, delay: 0.9 },
    { color: '#00a6e4', alpha: 0.74, cx: 430, cy: 300, r: 170, depth: 1.3, phase: 1.7, delay: 0.0 },
    { color: '#e0137f', alpha: 0.68, cx: 545, cy: 296, r: 175, depth: 1.0, phase: 3.1, delay: 0.3 },
    { color: '#f3e500', alpha: 0.72, cx: 668, cy: 300, r: 175, depth: 0.75, phase: 4.6, delay: 0.6 },
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

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
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
      var angle = u * LOOPS * Math.PI * 2;
      var wobble = 0.86 + 0.22 * Math.sin(i * 1.1 + index * 2.3) + (rand() - 0.5) * 0.08;
      var halfW = c.r * (0.3 + 0.7 * env) * wobble;
      var lx = Math.cos(angle) * halfW;
      var ly = (u - 0.5) * c.r * 2 + (rand() - 0.5) * 6;
      var x = c.cx + lx * cosT - ly * sinT;
      var y = c.cy + lx * sinT + ly * cosT;
      // Each loop is treated as a helix: z > 0 is the half nearer the viewer.
      pts.push({ x: x, y: y, ox: x, oy: y, vx: 0, vy: 0, z: Math.sin(angle), seed: rand() * Math.PI * 2 });
    }
    c.pts = pts;
    c.rgb = hexToRgb(c.color);
    c.index = index;
    c.offsetX = 0;
    c.offsetY = 0;
    c.head = reduceMotion ? 1 : 0;
    c.tail = 0;
  }

  CLUSTERS.forEach(buildCluster);

  // ------------------------------------------------------------------ view & input

  var view = { scale: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, active: false };
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
    // Contain-fit by height; on narrow screens let the scribbles span most of the width.
    view.scale = Math.min(rect.height / DESIGN_H, rect.width / 800);
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

  var lastActivity = 0;

  function markActivity() {
    lastActivity = global.performance.now();
  }

  function onPointerMove(e) {
    markActivity();
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

  // ------------------------------------------------------------------ animation state

  // drawing: heads grow 0→1 | shown: idle | erasing: tails chase heads, then drawing restarts.
  var anim = { mode: reduceMotion ? 'shown' : 'drawing', start: null };

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
    if (reduceMotion || anim.mode !== 'shown') return;
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
        lastActivity = time;
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
    } else if (time - lastActivity > IDLE_REDRAW_MS) {
      requestRedraw();
    }
  }

  function step(time) {
    stepAnimation(time);

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

  // ------------------------------------------------------------------ visible geometry

  // Visible window [tail, head] of a stroke in design space, with per-vertex parallax.
  var vis = { x: [], y: [], z: [], s: [], n: 0 };

  function pushPoint(cl, f, zx, zy) {
    var pts = cl.pts;
    var i = Math.min(Math.floor(f), pts.length - 2);
    var t = f - i;
    var a = pts[i];
    var b = pts[i + 1];
    var z = a.z + (b.z - a.z) * t;
    var k = vis.n++;
    vis.x[k] = a.x + (b.x - a.x) * t + cl.offsetX + zx * z;
    vis.y[k] = a.y + (b.y - a.y) * t + cl.offsetY + zy * z;
    vis.z[k] = z;
    vis.s[k] = f;
  }

  function collect(cl) {
    vis.n = 0;
    var last = cl.pts.length - 1;
    var from = cl.tail * last;
    var to = cl.head * last;
    if (to - from < 0.05) return 0;
    var zx = -smooth.x * 14;
    var zy = -smooth.y * 10;
    pushPoint(cl, from, zx, zy);
    for (var i = Math.floor(from) + 1; i < to; i++) pushPoint(cl, i, zx, zy);
    pushPoint(cl, to, zx, zy);
    return vis.n;
  }

  // ------------------------------------------------------------------ WebGL renderer

  var STROKE_VS = [
    'attribute vec2 aPos;',
    'attribute vec2 aSide;',
    'attribute float aZ;',
    'uniform vec4 uView;',
    'uniform vec2 uRes;',
    'varying vec2 vSide;',
    'varying float vZ;',
    'void main() {',
    '  vec2 px = (aPos * uView.x + uView.yz) * uView.w;',
    '  vec2 clip = px / uRes * 2.0 - 1.0;',
    '  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);',
    '  vSide = aSide;',
    '  vZ = aZ;',
    '}',
  ].join('\n');

  var STROKE_FS = [
    'precision mediump float;',
    'uniform vec3 uColor;',
    'uniform float uAlpha;',
    'uniform float uSeed;',
    'varying vec2 vSide;',
    'varying float vZ;',
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    'void main() {',
    '  float v = vSide.x;',
    '  float edge = smoothstep(1.0, 0.65, abs(v));',
    '  float tube = sqrt(max(0.0, 1.0 - v * v));',
    '  float depth = 0.5 + 0.5 * vZ;',
    // Paper tooth (screen space) plus streaks dragged along the stroke = crayon grain.
    '  float tooth = noise(gl_FragCoord.xy * 0.42 + uSeed);',
    '  float streak = noise(vec2(vSide.y * 2.2, v * 2.0 + uSeed));',
    '  float grain = smoothstep(0.2, 0.5, tooth * 0.55 + streak * 0.6);',
    '  float a = uAlpha * edge * grain * mix(0.7, 1.0, depth);',
    '  vec3 col = min(uColor * mix(0.8, 1.12, tube) * mix(0.82, 1.0, depth), 1.0);',
    '  gl_FragColor = vec4(col * a, a);',
    '}',
  ].join('\n');

  var QUAD_VS = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }',
  ].join('\n');

  // Exact W3C "multiply" compositing of the colour layers, back to front, over a transparent canvas.
  var COMPOSITE_FS = [
    'precision mediump float;',
    'uniform sampler2D uL0;',
    'uniform sampler2D uL1;',
    'uniform sampler2D uL2;',
    'uniform sampler2D uL3;',
    'varying vec2 vUv;',
    'vec4 blend(vec4 acc, vec4 s) {',
    '  if (s.a <= 0.0) return acc;',
    '  vec3 cs = s.rgb / s.a;',
    '  vec3 cb = acc.a > 0.0 ? acc.rgb / acc.a : vec3(0.0);',
    '  vec3 mixed = (1.0 - acc.a) * cs + acc.a * cs * cb;',
    '  return vec4(s.a * mixed + (1.0 - s.a) * acc.rgb, s.a + acc.a * (1.0 - s.a));',
    '}',
    'void main() {',
    '  vec4 acc = vec4(0.0);',
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
      side: gl.getAttribLocation(strokeProg, 'aSide'),
      z: gl.getAttribLocation(strokeProg, 'aZ'),
      view: gl.getUniformLocation(strokeProg, 'uView'),
      res: gl.getUniformLocation(strokeProg, 'uRes'),
      color: gl.getUniformLocation(strokeProg, 'uColor'),
      alpha: gl.getUniformLocation(strokeProg, 'uAlpha'),
      seed: gl.getUniformLocation(strokeProg, 'uSeed'),
    };
    var cPos = gl.getAttribLocation(compProg, 'aPos');

    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    var FLOATS = 5;
    var maxVerts = (CLUSTERS[0].pts.length + 4) * 2;
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

    // Triangle strip along the visible stroke; aSide = (across -1..1, along).
    function buildStrip(halfWidth, shiftX, shiftY) {
      var n = vis.n;
      var o = 0;
      for (var i = 0; i < n; i++) {
        var i0 = i > 0 ? i - 1 : i;
        var i1 = i < n - 1 ? i + 1 : i;
        var tx = vis.x[i1] - vis.x[i0];
        var ty = vis.y[i1] - vis.y[i0];
        var len = Math.sqrt(tx * tx + ty * ty) || 1;
        var nx = (-ty / len) * halfWidth;
        var ny = (tx / len) * halfWidth;
        var x = vis.x[i] + shiftX;
        var y = vis.y[i] + shiftY;
        var along = vis.s[i];
        data[o++] = x + nx; data[o++] = y + ny; data[o++] = -1; data[o++] = along; data[o++] = vis.z[i];
        data[o++] = x - nx; data[o++] = y - ny; data[o++] = 1; data[o++] = along; data[o++] = vis.z[i];
      }
      return n * 2;
    }

    function drawStrip(count) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, count * FLOATS));
      var stride = FLOATS * 4;
      gl.enableVertexAttribArray(sLoc.pos);
      gl.vertexAttribPointer(sLoc.pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(sLoc.side);
      gl.vertexAttribPointer(sLoc.side, 2, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(sLoc.z);
      gl.vertexAttribPointer(sLoc.z, 1, gl.FLOAT, false, stride, 16);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
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
          drawStrip(buildStrip(STROKE_WIDTH / 2, 0, 0));
          // Thin offset echo line gives the doubled crayon edge.
          gl.uniform1f(sLoc.alpha, cl.alpha * 0.45);
          drawStrip(buildStrip(ECHO_WIDTH / 2, 3, -2));
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);
        gl.useProgram(compProg);
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

    function tracePath(c2, shiftX, shiftY) {
      c2.beginPath();
      c2.moveTo(vis.x[0] + shiftX, vis.y[0] + shiftY);
      for (var i = 1; i < vis.n; i++) c2.lineTo(vis.x[i] + shiftX, vis.y[i] + shiftY);
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
        ctx.globalCompositeOperation = 'destination-out';
        ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
        ctx.fillStyle = grain;
        ctx.fillRect(0, 0, view.w, view.h);
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

  markActivity();
  hero.addEventListener('pointermove', onPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onPointerLeave);
  hero.addEventListener('dblclick', function (e) {
    if (e.target.closest && e.target.closest('a')) return;
    var sel = global.getSelection && global.getSelection();
    if (sel) sel.removeAllRanges();
    requestRedraw();
  });
  global.addEventListener('scroll', markActivity, { passive: true });
  global.addEventListener('keydown', markActivity);

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
