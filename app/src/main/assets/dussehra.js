/*!
 * Get IT Solutions – Happy Dussehra greeting (animated, with sound, self-contained).
 * Upload to public_html and add before </body> of index.html:
 *   <script src="/dussehra.js" defer></script>
 * Shows automatically once a day per visitor until 23 Oct 2026, then switches itself off.
 * Test any time with  https://getitsolutions.in/?dussehra=1
 * All artwork and sound are generated in code (original, no third-party media).
 */
(function () {
  'use strict';
  var CFG = window.GIS_DUSSEHRA || {};
  var START = Date.parse('2026-10-18T00:00:00+05:30');
  var END = Date.parse('2026-10-24T00:00:00+05:30');
  var SITE = 'https://getitsolutions.in/';
  var BRAND = 'Team Get IT Solutions, Lucknow';
  var KEY = 'gis_dussehra_seen';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeIn(x) { return x * x * x; }
  function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // =====================================================================
  //  SCENE  (logical height 1000; width 1000 for the popup, 1778 for 16:9)
  // =====================================================================
  var FW_COLORS = ['#fde047', '#fb923c', '#f472b6', '#67e8f9', '#86efac', '#ffffff', '#c084fc', '#facc15'];
  var T_HIT = 3.2;

  function Scene(canvas, W) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.W = W || 1000; this.ox = (this.W - 1000) / 2;
    this.off = document.createElement('canvas'); this.octx = this.off.getContext('2d');
    this.onEvent = null;
    this.reset();
  }
  Scene.prototype.emit = function (type, x) { if (this.onEvent) this.onEvent(type, x, this.t, this.W); };
  Scene.prototype.reset = function () {
    var R = this.rand = mulberry(20261020), W = this.W, ox = this.ox, i;
    this.t = 0; this.fire = []; this.smoke = []; this.rockets = []; this.sparks = []; this.trail = [];
    this.nextRocket = 4.2; this.flash = 0; this.hit = 0; this.released = 0;
    this.stars = []; for (i = 0; i < 130 * W / 1000; i++) this.stars.push({ x: R() * W, y: R() * 700, r: R() * 1.6 + 0.4, p: R() * 6.28, s: R() * 2 + 1 });
    this.crowd = []; for (var x = -10; x < W + 20; x += 26 + R() * 14) this.crowd.push({ x: x, h: 900 + R() * 32, r: 12 + R() * 5, arm: R() < 0.35, side: R() < 0.5 ? -1 : 1 });
    // effigies: main Ravan (10 heads); on wide screens also Kumbhkaran & Meghnad
    this.effigies = [{ x: ox + 630, s: 1, ten: 1, tb: 3.4, ts: 6.0 }];
    if (W > 1300) {
      this.effigies.push({ x: ox + 1000 + (W - 1000) / 2 * 0.62, s: 0.72, ten: 0, tb: 3.9, ts: 6.6, robe: '#1d4ed8' });
      this.effigies.push({ x: ox - (W - 1000) / 2 * 0.55, s: 0.68, ten: 0, tb: 4.2, ts: 6.9, robe: '#15803d' });
    }
  };
  Scene.prototype.resize = function (hpx) {
    this.k = hpx / 1000;
    this.c.width = this.off.width = Math.round(this.W * this.k);
    this.c.height = this.off.height = hpx;
  };
  Scene.prototype.fireLevel = function (t, e) {
    var t0 = e ? e.tb - 0.2 : T_HIT;
    if (t < t0) return 0;
    if (t < t0 + 1.2) return easeOut(seg(t, t0, t0 + 1.2));
    if (t < t0 + 4.4) return 1;
    return 1 - 0.85 * seg(t, t0 + 4.4, t0 + 6.8);
  };
  Scene.prototype.update = function (dt) {
    var t = (this.t += dt), R = this.rand, W = this.W, ox = this.ox, i, j, p, e;
    for (j = 0; j < this.effigies.length; j++) {
      e = this.effigies[j];
      var f = this.fireLevel(t, e), sink = easeIn(seg(t, e.ts, e.ts + 2.3)), sc = e.s;
      var n = f * 260 * sc * dt, top = 840 - (410 - sink * 300) * sc;
      while (n > 0) {
        if (R() < n) {
          var ex = e.x + (R() - 0.5) * (sink > 0.6 ? 160 : 260 * (1 - sink * 0.5)) * sc;
          var ey = top + R() * (840 - top);
          this.fire.push({ x: ex, y: ey, vx: (R() - 0.5) * 40, vy: (-90 - R() * 150) * (0.6 + 0.4 * sc), life: 0, max: 0.55 + R() * 0.9, s: (10 + R() * 20) * (0.7 + 0.3 * sc) });
          if (R() < 0.25) this.smoke.push({ x: ex, y: ey - 40, vx: (R() - 0.5) * 20 + 12, vy: -40 - R() * 40, life: 0, max: 2.5 + R() * 2, s: 20 + R() * 20 });
          if (R() < 0.35) this.sparks.push({ x: ex, y: ey, vx: (R() - 0.5) * 160, vy: -120 - R() * 220, life: 0, max: 0.8 + R() * 1.2, c: '#fde68a', g: 140 });
        }
        n -= 1;
      }
      if (t >= e.tb - 0.2 && !e.lit) { e.lit = 1; if (j) this.emit('ignite', e.x); }
    }
    for (i = this.fire.length; i--;) { p = this.fire[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life > p.max) this.fire.splice(i, 1); }
    for (i = this.smoke.length; i--;) { p = this.smoke[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.s += 18 * dt; if (p.life > p.max) this.smoke.splice(i, 1); }
    // fireworks
    if (t > this.nextRocket) {
      var late = t > 8, wide = W / 1000;
      this.nextRocket = t + (late ? 0.28 + R() * 0.32 : 0.45 + R() * 0.55) / Math.sqrt(wide);
      var tx = 80 + R() * (W - 160);
      var rk = { x: tx + (R() - 0.5) * 120, y: 1000, tx: tx, ty: late ? 160 + R() * 420 : 110 + R() * 330, life: 0, max: 0.9 + R() * 0.35, c: FW_COLORS[(R() * FW_COLORS.length) | 0] };
      this.rockets.push(rk); this.emit('launch', tx);
    }
    for (i = this.rockets.length; i--;) {
      p = this.rockets[i]; p.life += dt; var k = easeOut(clamp(p.life / p.max, 0, 1));
      p.px = p.x + (p.tx - p.x) * k; p.py = p.y + (p.ty - p.y) * k;
      if (p.life >= p.max) {
        var cnt = 60 + (R() * 30 | 0), multi = R() < 0.3;
        for (j = 0; j < cnt; j++) {
          var a = j / cnt * 6.283 + R() * 0.1, sp = 120 + R() * 190;
          this.sparks.push({ x: p.tx, y: p.ty, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.3 + R() * 0.9, c: multi ? FW_COLORS[(R() * FW_COLORS.length) | 0] : p.c, g: 70, fw: 1 });
        }
        this.emit('burst', p.tx); this.rockets.splice(i, 1);
      }
    }
    var drag = Math.pow(0.35, dt);
    for (i = this.sparks.length; i--;) {
      p = this.sparks[i]; p.life += dt; p.ox = p.x; p.oy = p.y;
      p.vx *= drag; p.vy = p.vy * drag + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life > p.max) this.sparks.splice(i, 1);
    }
    // arrow
    if (t >= 2.4 && !this.released) { this.released = 1; this.emit('release', ox + 214); }
    var af = seg(t, 2.4, T_HIT);
    if (af > 0 && af < 1) {
      var u = af, x0 = ox + 214, y0 = 724, cx = ox + 420, cy = 520, x1 = ox + 612, y1 = 650;
      var ax = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, ay = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
      this.trail.push({ x: ax, y: ay }); if (this.trail.length > 18) this.trail.shift();
      this.arrow = { x: ax, y: ay, a: Math.atan2(2 * (1 - u) * (cy - y0) + 2 * u * (y1 - cy), 2 * (1 - u) * (cx - x0) + 2 * u * (x1 - cx)) };
    } else { this.arrow = null; if (af >= 1 && this.trail.length) this.trail.shift(); }
    if (t >= T_HIT && !this.hit) { this.hit = 1; this.flash = 1; this.emit('hit', ox + 612); }
    this.flash = Math.max(0, this.flash - dt * 2.2);
  };

  Scene.prototype.draw = function () {
    var g = this.ctx, k = this.k, t = this.t, W = this.W, ox = this.ox, i, j, p, e;
    var f = this.fireLevel(t);
    g.setTransform(k, 0, 0, k, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    var sky = g.createLinearGradient(0, 0, 0, 1000);
    sky.addColorStop(0, '#070a24'); sky.addColorStop(0.45, '#1e1048'); sky.addColorStop(0.78, '#5b1a4a'); sky.addColorStop(1, '#a3361a');
    g.fillStyle = sky; g.fillRect(0, 0, W, 1000);
    for (i = 0; i < this.stars.length; i++) {
      p = this.stars[i]; g.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * p.s + p.p));
      g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
    // moon
    var mx = W > 1300 ? W - 170 : 110, my = 96;
    var mg = g.createRadialGradient(mx, my, 10, mx, my, 100); mg.addColorStop(0, 'rgba(255,240,200,.35)'); mg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = mg; g.fillRect(mx - 110, 0, 220, 210);
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(mx, my, 30, 0, 6.283); g.fill();
    g.fillStyle = '#ffe9b8'; g.beginPath(); g.arc(mx - 9, my - 7, 6, 0, 6.283); g.arc(mx + 10, my + 10, 4.5, 0, 6.283); g.fill();
    // horizon / fire glow
    for (j = 0; j < this.effigies.length; j++) {
      e = this.effigies[j]; var fe = this.fireLevel(t, e);
      var hg = g.createRadialGradient(e.x, 820, 40, e.x, 820, 640 * e.s);
      hg.addColorStop(0, 'rgba(255,140,40,' + ((j ? 0.04 : 0.12) + 0.55 * fe * e.s) + ')'); hg.addColorStop(1, 'rgba(255,90,20,0)');
      g.fillStyle = hg; g.fillRect(0, 200, W, 800);
    }
    // fireworks
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.rockets.length; i++) {
      p = this.rockets[i]; if (p.px == null) continue;
      g.strokeStyle = 'rgba(255,220,160,.8)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.px - (p.tx - p.x) * 0.03, p.py + 26); g.stroke();
    }
    for (i = 0; i < this.sparks.length; i++) {
      p = this.sparks[i]; if (!p.fw) continue;
      g.globalAlpha = 1 - p.life / p.max; g.strokeStyle = p.c; g.lineWidth = 2.6; g.beginPath(); g.moveTo(p.ox, p.oy); g.lineTo(p.x, p.y); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // ground
    g.save(); g.scale(W / 1000, 1);
    g.fillStyle = '#16081a'; g.beginPath(); g.moveTo(0, 850); g.quadraticCurveTo(300, 826, 520, 842); g.quadraticCurveTo(800, 858, 1000, 836); g.lineTo(1000, 1000); g.lineTo(0, 1000); g.fill();
    g.restore();
    this.drawArcher(g, t);
    // effigies (drawn offscreen so they can char & fall)
    for (j = this.effigies.length - 1; j >= 0; j--) {
      e = this.effigies[j];
      var sink = easeIn(seg(t, e.ts, e.ts + 2.3)), burn = seg(t, e.tb, e.tb + 3.2), fe2 = this.fireLevel(t, e);
      if (sink >= 1) continue;
      var o = this.octx; o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, this.off.width, this.off.height); o.setTransform(k, 0, 0, k, 0, 0);
      o.save(); o.translate(e.x, 840); o.scale(e.s, e.s); drawRavan(o, 0, 0, e.ten, e.robe); o.restore();
      if (burn > 0) {
        var bw = 340 * e.s;
        o.globalCompositeOperation = 'source-atop';
        o.fillStyle = 'rgba(28,12,6,' + (burn * 0.88) + ')'; o.fillRect(e.x - bw, 360, bw * 2, 500);
        var eg = o.createLinearGradient(0, 840, 0, 420); eg.addColorStop(0, 'rgba(255,120,30,' + (0.55 * fe2) + ')'); eg.addColorStop(1, 'rgba(255,120,30,0)');
        o.fillStyle = eg; o.fillRect(e.x - bw, 360, bw * 2, 500);
        o.globalCompositeOperation = 'source-over';
      }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - sink;
      g.translate(e.x * k, 840 * k); g.rotate(sink * (j === 1 ? -0.22 : 0.22)); g.translate(-e.x * k, (-840 + sink * 280 * e.s) * k);
      g.drawImage(this.off, 0, 0); g.restore();
      g.setTransform(k, 0, 0, k, 0, 0);
    }
    // glowing ash heaps
    for (j = 0; j < this.effigies.length; j++) {
      e = this.effigies[j]; var ash = seg(t, e.ts - 0.5, e.ts + 1.5);
      if (ash <= 0) continue;
      var ag = g.createRadialGradient(e.x, 838, 4, e.x, 838, 150 * e.s);
      ag.addColorStop(0, 'rgba(255,170,60,' + (0.85 * ash * (0.8 + 0.2 * Math.sin(t * 5 + j))) + ')'); ag.addColorStop(0.5, 'rgba(220,70,20,' + (0.45 * ash) + ')'); ag.addColorStop(1, 'rgba(120,20,10,0)');
      g.fillStyle = ag; g.beginPath(); g.ellipse(e.x, 842, 150 * e.s, 34 * e.s, 0, 0, 6.283); g.fill();
      g.fillStyle = 'rgba(20,8,6,' + ash + ')'; g.beginPath(); g.ellipse(e.x, 846, 95 * e.s, 14 * e.s, 0, Math.PI, 0); g.fill();
    }
    for (i = 0; i < this.smoke.length; i++) {
      p = this.smoke[i]; var sa = (1 - p.life / p.max) * 0.22;
      g.fillStyle = 'rgba(70,55,70,' + sa + ')'; g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.283); g.fill();
    }
    g.globalCompositeOperation = 'lighter';
    for (i = 0; i < this.fire.length; i++) {
      p = this.fire[i]; var q = p.life / p.max, r = p.s * (1 - q * 0.7);
      var col = q < 0.25 ? '255,236,150' : q < 0.55 ? '255,150,40' : '220,60,20';
      var fg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      fg.addColorStop(0, 'rgba(' + col + ',' + (0.9 * (1 - q)) + ')'); fg.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = fg; g.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    }
    for (i = 0; i < this.sparks.length; i++) {
      p = this.sparks[i]; if (p.fw) continue;
      g.globalAlpha = 1 - p.life / p.max; g.fillStyle = p.c; g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    g.globalAlpha = 1;
    if (this.trail.length > 1) {
      g.lineCap = 'round';
      for (i = 1; i < this.trail.length; i++) {
        g.strokeStyle = 'rgba(255,190,80,' + (i / this.trail.length * 0.8) + ')'; g.lineWidth = 2 + i / this.trail.length * 7;
        g.beginPath(); g.moveTo(this.trail[i - 1].x, this.trail[i - 1].y); g.lineTo(this.trail[i].x, this.trail[i].y); g.stroke();
      }
    }
    g.globalCompositeOperation = 'source-over';
    if (this.arrow) drawArrow(g, this.arrow.x, this.arrow.y, this.arrow.a, 1);
    if (this.flash > 0) {
      var fl = g.createRadialGradient(ox + 612, 650, 0, ox + 612, 650, 420); fl.addColorStop(0, 'rgba(255,245,210,' + this.flash + ')'); fl.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = fl; g.fillRect(0, 200, W, 800);
    }
    this.drawCrowd(g, t, f);
    this.drawDiyas(g, t);
    this.drawText(g, t);
    if (t < 0.9) { g.fillStyle = 'rgba(0,0,0,' + (1 - t / 0.9) + ')'; g.fillRect(0, 0, W, 1000); }
    if (this.fadeOut) { g.fillStyle = 'rgba(0,0,0,' + this.fadeOut + ')'; g.fillRect(0, 0, W, 1000); }
  };

  Scene.prototype.drawArcher = function (g, t) {
    var pull = seg(t, 1.4, 2.3) * (t < 2.4 ? 1 : 0), rim = 0.25 + 0.5 * this.fireLevel(t), bx = this.ox + 150;
    g.save(); g.translate(bx, 842);
    g.fillStyle = '#0b0614'; g.strokeStyle = '#0b0614'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = 15; g.beginPath(); g.moveTo(-6, -100); g.lineTo(-38, 0); g.moveTo(6, -100); g.lineTo(34, 0); g.stroke();
    g.beginPath(); g.moveTo(-18, -104); g.lineTo(18, -104); g.lineTo(13, -192); g.lineTo(-11, -192); g.closePath(); g.fill();
    g.beginPath(); g.arc(2, -212, 17, 0, 6.283); g.fill(); g.beginPath(); g.arc(-6, -232, 9, 0, 6.283); g.fill();
    g.lineWidth = 11; g.beginPath(); g.moveTo(8, -180); g.lineTo(62, -118); g.stroke();
    g.lineWidth = 6; g.strokeStyle = '#2a1608'; g.beginPath(); g.moveTo(52, -220); g.quadraticCurveTo(110, -120, 62, -22); g.stroke();
    var sx = 46 - pull * 34, sy = -118 + pull * 2;
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,220,170,.8)'; g.beginPath(); g.moveTo(52, -220); g.lineTo(sx, sy); g.lineTo(62, -22); g.stroke();
    g.lineWidth = 11; g.strokeStyle = '#0b0614'; g.beginPath(); g.moveTo(-4, -178); g.lineTo(sx - 6, sy - 6); g.stroke();
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,150,60,' + rim + ')'; g.beginPath(); g.moveTo(18, -104); g.lineTo(13, -192); g.stroke(); g.beginPath(); g.arc(2, -212, 17, -1.2, 1.1); g.stroke();
    g.restore();
    if (t < 2.4) drawArrow(g, bx + sx + 66, 842 + sy - 2, -0.42, 0.95);
  };

  function drawArrow(g, x, y, a, s) {
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
    g.strokeStyle = '#f5d08a'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-70, 0); g.lineTo(0, 0); g.stroke();
    g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill();
    g.fillStyle = '#f97316'; g.beginPath(); g.moveTo(-70, 0); g.lineTo(-82, -8); g.lineTo(-62, 0); g.lineTo(-82, 8); g.closePath(); g.fill();
    var gl = g.createRadialGradient(4, 0, 0, 4, 0, 26); gl.addColorStop(0, 'rgba(255,220,120,.9)'); gl.addColorStop(1, 'rgba(255,160,40,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(-22, -26, 52, 52); g.globalCompositeOperation = 'source-over';
    g.restore();
  }

  function drawHead(g, x, y, r, main) {
    var cw = r * 0.95, ch = r * (main ? 0.95 : 0.8);
    g.fillStyle = '#f59e0b'; g.strokeStyle = '#7c2d12'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - cw, y - r * 0.55); g.lineTo(x - cw * 0.85, y - r * 0.55 - ch); g.lineTo(x - cw * 0.45, y - r * 0.55 - ch * 0.62);
    g.lineTo(x, y - r * 0.55 - ch * 1.25); g.lineTo(x + cw * 0.45, y - r * 0.55 - ch * 0.62); g.lineTo(x + cw * 0.85, y - r * 0.55 - ch); g.lineTo(x + cw, y - r * 0.55); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#dc2626'; g.beginPath(); g.arc(x, y - r * 0.55 - ch * 0.45, r * 0.14, 0, 6.283); g.fill();
    g.fillStyle = '#e8a95b'; g.beginPath(); g.arc(x - r * 0.95, y, r * 0.2, 0, 6.283); g.arc(x + r * 0.95, y, r * 0.2, 0, 6.283); g.fill();
    g.fillStyle = '#fbbf24'; g.beginPath(); g.arc(x - r * 0.98, y + r * 0.3, r * 0.13, 0, 6.283); g.arc(x + r * 0.98, y + r * 0.3, r * 0.13, 0, 6.283); g.fill();
    var fg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    fg.addColorStop(0, '#f8c983'); fg.addColorStop(1, '#d9893d');
    g.fillStyle = fg; g.strokeStyle = '#7c2d12'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 0.9, 0, 6.283); g.fill(); g.stroke();
    g.strokeStyle = '#1a0f0a'; g.lineWidth = Math.max(2, r * 0.1); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.38); g.lineTo(x - r * 0.15, y - r * 0.24); g.moveTo(x + r * 0.6, y - r * 0.38); g.lineTo(x + r * 0.15, y - r * 0.24); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - r * 0.36, y - r * 0.08, r * 0.2, r * 0.13, 0, 0, 6.283); g.ellipse(x + r * 0.36, y - r * 0.08, r * 0.2, r * 0.13, 0, 0, 6.283); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(x - r * 0.33, y - r * 0.07, r * 0.08, 0, 6.283); g.arc(x + r * 0.39, y - r * 0.07, r * 0.08, 0, 6.283); g.fill();
    g.fillStyle = '#dc2626'; g.fillRect(x - r * 0.05, y - r * 0.62, r * 0.1, r * 0.3);
    g.strokeStyle = '#111'; g.lineWidth = Math.max(2.5, r * 0.13);
    g.beginPath(); g.moveTo(x, y + r * 0.28); g.quadraticCurveTo(x - r * 0.35, y + r * 0.18, x - r * 0.62, y + r * 0.42); g.quadraticCurveTo(x - r * 0.7, y + r * 0.18, x - r * 0.55, y + r * 0.12);
    g.moveTo(x, y + r * 0.28); g.quadraticCurveTo(x + r * 0.35, y + r * 0.18, x + r * 0.62, y + r * 0.42); g.quadraticCurveTo(x + r * 0.7, y + r * 0.18, x + r * 0.55, y + r * 0.12); g.stroke();
    g.strokeStyle = '#991b1b'; g.lineWidth = Math.max(2, r * 0.08); g.beginPath(); g.arc(x, y + r * 0.42, r * 0.22, 0.2, Math.PI - 0.2); g.stroke();
  }

  function drawRavan(g, x, gy, ten, robe) {
    var rc = robe || '#dc2626';
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.fillStyle = '#ea580c'; g.strokeStyle = '#7c2d12'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x - 62, gy - 104); g.lineTo(x - 8, gy - 104); g.lineTo(x - 14, gy - 8); g.lineTo(x - 56, gy - 8); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + 8, gy - 104); g.lineTo(x + 62, gy - 104); g.lineTo(x + 56, gy - 8); g.lineTo(x + 14, gy - 8); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#fbbf24'; g.lineWidth = 4;
    for (var s = 0; s < 3; s++) { var yy = gy - 84 + s * 28; g.beginPath(); g.moveTo(x - 58, yy); g.lineTo(x - 12, yy); g.moveTo(x + 12, yy); g.lineTo(x + 58, yy); g.stroke(); }
    g.fillStyle = '#1f130b'; g.fillRect(x - 62, gy - 10, 52, 10); g.fillRect(x + 10, gy - 10, 52, 10);
    g.strokeStyle = rc; g.lineWidth = 26;
    g.beginPath(); g.moveTo(x - 72, gy - 232); g.lineTo(x - 142, gy - 150); g.moveTo(x + 72, gy - 232); g.lineTo(x + 142, gy - 150); g.stroke();
    g.strokeStyle = '#fbbf24'; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 132, gy - 170); g.lineTo(x - 150, gy - 156); g.moveTo(x + 132, gy - 170); g.lineTo(x + 150, gy - 156); g.stroke();
    g.strokeStyle = '#e5e7eb'; g.lineWidth = 8; g.beginPath(); g.moveTo(x + 148, gy - 150); g.lineTo(x + 196, gy - 300); g.stroke();
    g.strokeStyle = '#f59e0b'; g.lineWidth = 7; g.beginPath(); g.moveTo(x + 130, gy - 165); g.lineTo(x + 168, gy - 150); g.stroke();
    var sg = g.createRadialGradient(x - 156, gy - 150, 4, x - 156, gy - 150, 40); sg.addColorStop(0, '#fde68a'); sg.addColorStop(1, '#b45309');
    g.fillStyle = sg; g.strokeStyle = '#7c2d12'; g.lineWidth = 3; g.beginPath(); g.arc(x - 158, gy - 148, 38, 0, 6.283); g.fill(); g.stroke();
    g.fillStyle = '#dc2626'; g.beginPath(); g.arc(x - 158, gy - 148, 9, 0, 6.283); g.fill();
    g.fillStyle = '#e8a95b'; g.beginPath(); g.arc(x + 146, gy - 150, 13, 0, 6.283); g.fill();
    var tg = g.createLinearGradient(x - 80, 0, x + 80, 0); tg.addColorStop(0, 'rgba(0,0,0,.35)'); tg.addColorStop(0.5, 'rgba(0,0,0,0)'); tg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = rc; g.strokeStyle = '#f59e0b'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(x - 82, gy - 240); g.lineTo(x + 82, gy - 240); g.lineTo(x + 66, gy - 104); g.lineTo(x - 66, gy - 104); g.closePath(); g.fill(); g.fillStyle = tg; g.fill(); g.stroke();
    g.fillStyle = 'rgba(251,191,36,.75)';
    for (var r = 0; r < 4; r++) for (var c = -2; c <= 2; c++) {
      var dx = x + c * 28 + (r % 2 ? 14 : 0), dy = gy - 214 + r * 30; if (Math.abs(dx - x) > 66 - r * 4) continue;
      g.beginPath(); g.moveTo(dx, dy - 7); g.lineTo(dx + 6, dy); g.lineTo(dx, dy + 7); g.lineTo(dx - 6, dy); g.closePath(); g.fill();
    }
    g.fillStyle = '#f59e0b'; g.fillRect(x - 69, gy - 124, 138, 14);
    g.fillStyle = '#16a34a'; g.beginPath(); g.arc(x, gy - 117, 8, 0, 6.283); g.fill();
    g.strokeStyle = '#fde68a'; g.lineWidth = 5; g.beginPath(); g.arc(x, gy - 252, 46, 0.35, Math.PI - 0.35); g.stroke();
    g.fillStyle = '#16a34a'; g.beginPath(); g.arc(x, gy - 208, 10, 0, 6.283); g.fill();
    g.fillStyle = '#f59e0b'; g.beginPath(); g.ellipse(x - 80, gy - 238, 22, 13, -0.3, 0, 6.283); g.ellipse(x + 80, gy - 238, 22, 13, 0.3, 0, 6.283); g.fill();
    g.fillStyle = '#d9893d'; g.fillRect(x - 14, gy - 262, 28, 24);
    var hy = gy - 285;
    if (ten) {
      var sizes = [30, 28, 26, 24], off = 44, pos = [];
      for (var i = 0; i < 4; i++) { off += sizes[i] + 4; pos.push([off, sizes[i]]); off += sizes[i]; }
      for (i = 3; i >= 0; i--) { drawHead(g, x - pos[i][0], hy + 6 + i * 3, pos[i][1], 0); drawHead(g, x + pos[i][0], hy + 6 + i * 3, pos[i][1], 0); }
      drawHead(g, x, hy - 86, 24, 0);
    }
    drawHead(g, x, hy, 40, 1);
  }

  Scene.prototype.drawCrowd = function (g, t, f) {
    var cheer = t > 3.4, i, p;
    g.fillStyle = '#05030a'; g.strokeStyle = '#05030a'; g.lineCap = 'round';
    for (i = 0; i < this.crowd.length; i++) {
      p = this.crowd[i]; var bob = cheer ? Math.sin(t * 6 + i) * 3 : 0, hy = p.h + bob;
      g.beginPath(); g.arc(p.x, hy, p.r, 0, 6.283); g.fill();
      g.beginPath(); g.ellipse(p.x, hy + p.r + 30, p.r * 1.7, 36, 0, 0, 6.283); g.fill();
      if (cheer && p.arm) { g.lineWidth = 8; g.beginPath(); g.moveTo(p.x + p.side * p.r, hy + p.r + 8); g.lineTo(p.x + p.side * (p.r + 14), hy - 30 + Math.sin(t * 7 + i) * 6); g.stroke(); }
    }
    g.strokeStyle = 'rgba(255,140,50,' + (0.15 + 0.45 * f) + ')'; g.lineWidth = 2;
    for (i = 0; i < this.crowd.length; i++) { p = this.crowd[i]; g.beginPath(); g.arc(p.x, p.h + (cheer ? Math.sin(t * 6 + i) * 3 : 0), p.r, -2.6, -0.6); g.stroke(); }
  };

  Scene.prototype.drawDiyas = function (g, t) {
    var W = this.W, n = Math.round(11 * W / 1000), step = W / n;
    var lg = g.createLinearGradient(0, 948, 0, 1000); lg.addColorStop(0, '#3b1a0c'); lg.addColorStop(1, '#1a0b05');
    g.fillStyle = lg; g.fillRect(0, 952, W, 48);
    g.fillStyle = 'rgba(255,170,80,.35)'; g.fillRect(0, 952, W, 2);
    for (var i = 0; i < n; i++) {
      var x = step / 2 + i * step, y = 968, fl = 1 + Math.sin(t * 11 + i * 1.7) * 0.12 + Math.sin(t * 17 + i) * 0.06;
      g.globalCompositeOperation = 'lighter';
      var gl = g.createRadialGradient(x, y - 18, 0, x, y - 18, 46); gl.addColorStop(0, 'rgba(255,190,90,.55)'); gl.addColorStop(1, 'rgba(255,140,40,0)');
      g.fillStyle = gl; g.fillRect(x - 46, y - 64, 92, 92);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#c2410c'; g.beginPath(); g.ellipse(x, y, 22, 10, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#9a3412'; g.beginPath(); g.ellipse(x, y, 22, 5, 0, 0, 6.283); g.fill();
      g.fillStyle = '#fbbf24'; g.beginPath(); g.ellipse(x, y - 1, 14, 3, 0, 0, 6.283); g.fill();
      g.save(); g.translate(x + 2, y - 4); g.scale(1, fl);
      var ff = g.createRadialGradient(0, -10, 1, 0, -10, 14); ff.addColorStop(0, '#fffbe6'); ff.addColorStop(0.5, '#fcd34d'); ff.addColorStop(1, '#f97316');
      g.fillStyle = ff; g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(9, -10, 0, 0); g.quadraticCurveTo(-9, -10, 0, -26); g.fill(); g.restore();
    }
  };

  Scene.prototype.drawText = function (g, t) {
    var cx = this.W / 2;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    var lines = [
      { s: 'शुभ विजयादशमी', y: 150, font: '84px "Yatra One","Tiro Devanagari Hindi",serif', t0: 5.0, gold: 1 },
      { s: 'Happy Dussehra', y: 240, font: '800 60px Poppins,system-ui,sans-serif', t0: 5.6, col: '#ffffff' },
      { s: 'May goodness always triumph over evil', y: 300, font: '500 30px Poppins,system-ui,sans-serif', t0: 6.2, col: '#fde7c7' },
      { s: BRAND, y: 352, font: '600 28px Poppins,system-ui,sans-serif', t0: 6.8, col: '#67e8f9' }
    ];
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i], a = easeOut(seg(t, L.t0, L.t0 + 0.8)); if (a <= 0) continue;
      g.save(); g.globalAlpha = a; g.font = L.font; g.translate(0, (1 - a) * 22);
      g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 14; g.shadowOffsetY = 3;
      if (L.gold) {
        var gg = g.createLinearGradient(cx - 240, L.y - 70, cx + 240, L.y); gg.addColorStop(0, '#fde68a'); gg.addColorStop(0.5, '#f59e0b'); gg.addColorStop(1, '#fde68a');
        g.fillStyle = gg;
      } else g.fillStyle = L.col;
      g.fillText(L.s, cx, L.y); g.restore();
    }
    var b = easeOut(seg(t, 7.2, 8));
    if (b > 0) {
      g.save(); g.globalAlpha = b; g.strokeStyle = '#fbbf24'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 80, 382); g.lineTo(cx + 80, 382); g.stroke();
      g.fillStyle = '#fbbf24'; g.beginPath(); g.moveTo(cx + 90, 382); g.lineTo(cx + 78, 376); g.lineTo(cx + 78, 388); g.closePath(); g.fill();
      g.restore();
    }
  };

  // =====================================================================
  //  SOUND  (synthesised with Web Audio – original, royalty-free)
  //  Works with a live AudioContext or an OfflineAudioContext.
  // =====================================================================
  function Sound(ac, t0, dur) {
    this.ac = ac; this.t0 = t0; this.dur = dur || 30;
    var nb = this.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0), R = mulberry(7);
    for (var i = 0; i < d.length; i++) d[i] = R() * 2 - 1;
    this.out = ac.createGain(); this.out.gain.value = 0.9;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
    this.out.connect(comp); comp.connect(ac.destination);
    // reverb
    var ir = ac.createBuffer(2, ac.sampleRate * 2.2, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var id = ir.getChannelData(ch); for (i = 0; i < id.length; i++) id[i] = (R() * 2 - 1) * Math.pow(1 - i / id.length, 3); }
    this.rev = ac.createConvolver(); this.rev.buffer = ir; var wet = ac.createGain(); wet.gain.value = 0.28;
    this.rev.connect(wet); wet.connect(this.out);
    this.bus = ac.createGain(); this.bus.connect(this.out); this.bus.connect(this.rev);
  }
  Sound.prototype.pan = function (x, W) {
    var p = this.ac.createStereoPanner ? this.ac.createStereoPanner() : null;
    if (!p) return this.bus; p.pan.value = clamp(((x / (W || 1000)) * 2 - 1) * 0.75, -1, 1); p.connect(this.bus); return p;
  };
  Sound.prototype.env = function (g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  };
  Sound.prototype.osc = function (type, f0, f1, t, glide, dest, peak, a, d) {
    var ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + glide);
    this.env(g, t, a, peak, d); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + d + 0.05);
  };
  Sound.prototype.nz = function (t, len, ftype, freq, q, dest, peak, a) {
    var ac = this.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.noise; s.loop = true; f.type = ftype; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 0.7;
    this.env(g, t, a || 0.002, peak, len); s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, (t * 7.3) % 1.5); s.stop(t + (a || 0.002) + len + 0.05); return f;
  };
  // drums: dhol-like low "dha" and high "ta"
  Sound.prototype.dha = function (t, v) { this.osc('sine', 120, 48, t, 0.22, this.bus, 0.9 * v, 0.003, 0.38); this.nz(t, 0.06, 'lowpass', 500, 0.7, this.bus, 0.25 * v); };
  Sound.prototype.ta = function (t, v) { this.osc('triangle', 380, 300, t, 0.08, this.bus, 0.35 * v, 0.002, 0.12); this.nz(t, 0.04, 'bandpass', 2600, 1.2, this.bus, 0.3 * v); };
  Sound.prototype.bell = function (t, f, v, dest) {
    this.osc('sine', f, 0, t, 0, dest || this.bus, 0.16 * v, 0.004, 1.6);
    this.osc('sine', f * 2.01, 0, t, 0, dest || this.bus, 0.05 * v, 0.004, 0.7);
    this.osc('triangle', f * 0.5, 0, t, 0, dest || this.bus, 0.04 * v, 0.01, 1.0);
  };
  // the fixed soundtrack (drone, drums, melody, fire crackle)
  Sound.prototype.timeline = function (end) {
    var ac = this.ac, T = this.t0, i, b;
    end = end || this.dur;
    // tanpura-like drone (D)
    var dg = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    dg.gain.setValueAtTime(0.0001, T); dg.gain.exponentialRampToValueAtTime(0.06, T + 1.5);
    dg.gain.setValueAtTime(0.06, T + end - 1.6); dg.gain.exponentialRampToValueAtTime(0.0001, T + end);
    lp.connect(dg); dg.connect(this.bus);
    [73.42, 110, 146.83, 220.0].forEach(function (f, j) {
      var o = ac.createOscillator(); o.type = j % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f; o.detune.value = (j - 1.5) * 4;
      var og = ac.createGain(); og.gain.value = j === 3 ? 0.25 : 0.5; o.connect(og); og.connect(lp); o.start(T); o.stop(T + end + 0.1);
    });
    // dhol pattern, 100 bpm, builds after the arrow hits
    var beat = 0.6;
    for (b = 0; T + 0.6 + b * beat < T + end - 0.8; b++) {
      var bt = 0.6 + b * beat, v = bt < T_HIT ? 0.45 : bt < T_HIT + 0.6 ? 0.2 : 1, fade = clamp((end - 0.8 - bt) / 2, 0, 1);
      v *= fade; if (v <= 0.01) continue;
      if (b % 4 === 0 || b % 4 === 2) this.dha(T + bt, v); else this.ta(T + bt, v * 0.9);
      if (bt > T_HIT + 0.6) { this.ta(T + bt + beat / 2, v * 0.55); if (b % 4 === 3) this.ta(T + bt + beat * 0.75, v * 0.45); }
    }
    // bow creak + twang + whoosh + impact
    this.osc('sawtooth', 70, 60, T + 1.4, 0.9, this.bus, 0.05, 0.6, 0.35);
    this.osc('triangle', 196, 180, T + 2.4, 0.3, this.bus, 0.35, 0.002, 0.45);
    var wf = this.nz(T + 2.4, 0.55, 'bandpass', 500, 1.4, this.bus, 0.45, 0.35); wf.frequency.exponentialRampToValueAtTime(3200, T + 3.15);
    this.osc('sine', 85, 32, T + T_HIT, 1.0, this.bus, 1.0, 0.004, 1.8);
    this.nz(T + T_HIT, 1.0, 'lowpass', 1200, 0.7, this.bus, 0.7, 0.004);
    // fire roar + crackle
    var fr = ac.createBufferSource(), ff = ac.createBiquadFilter(), fg = ac.createGain();
    fr.buffer = this.noise; fr.loop = true; ff.type = 'lowpass'; ff.frequency.value = 420;
    fg.gain.setValueAtTime(0.0001, T + T_HIT); fg.gain.exponentialRampToValueAtTime(0.32, T + T_HIT + 1.0);
    fg.gain.setValueAtTime(0.32, T + 7.6); fg.gain.exponentialRampToValueAtTime(0.03, T + 10.5); fg.gain.setValueAtTime(0.03, T + end - 1.2); fg.gain.exponentialRampToValueAtTime(0.0001, T + end);
    fr.connect(ff); ff.connect(fg); fg.connect(this.bus); fr.start(T + T_HIT); fr.stop(T + end + 0.1);
    var R = mulberry(99);
    for (var ct = T_HIT + 0.1; ct < Math.min(end, 11); ct += 0.02 + R() * 0.05) {
      var lvl = ct < 7.6 ? 1 : 1 - seg(ct, 7.6, 11) * 0.9;
      if (R() < 0.6 * lvl) this.nz(T + ct, 0.012 + R() * 0.03, 'highpass', 2500 + R() * 3000, 0.7, this.bus, (0.12 + R() * 0.25) * lvl);
    }
    // festive bell melody (D major pentatonic) when the greeting appears
    var N = { D5: 587.33, E5: 659.25, F5: 739.99, A5: 880, B5: 987.77, D6: 1174.66, A4: 440, B4: 493.88 };
    var tune = [['D5', 5.0], ['F5', 5.3], ['A5', 5.6], ['B5', 5.9], ['A5', 6.2], ['D6', 6.6], ['B5', 7.2], ['A5', 7.5], ['F5', 7.8], ['E5', 8.1], ['D5', 8.6],
      ['A4', 9.6], ['B4', 9.9], ['D5', 10.2], ['F5', 10.5], ['E5', 10.8], ['D5', 11.4], ['A5', 12.0], ['F5', 12.3], ['D5', 12.9]];
    for (i = 0; i < tune.length; i++) if (tune[i][1] < end - 1.2) this.bell(T + tune[i][1], N[tune[i][0]], 1);
  };
  // event sounds coming from the scene
  Sound.prototype.event = function (type, x, t, W) {
    var at = this.t0 + t, d;
    if (at > this.t0 + this.dur - 0.5) return;
    if (type === 'launch') {
      d = this.pan(x, W); this.osc('sine', 700, 2400, at, 1.0, d, 0.035, 0.05, 1.0);
      this.nz(at, 0.5, 'bandpass', 1800, 2, d, 0.05, 0.05);
    } else if (type === 'burst') {
      d = this.pan(x, W); this.osc('sine', 110, 40, at, 0.5, d, 0.5, 0.003, 0.8);
      this.nz(at, 0.35, 'lowpass', 2200, 0.7, d, 0.45);
      var R = mulberry(Math.round(t * 1000));
      for (var i = 0; i < 14; i++) { var ct = at + 0.25 + R() * 1.1; this.nz(ct, 0.01 + R() * 0.02, 'highpass', 4000, 0.7, d, 0.06 + R() * 0.1); }
    } else if (type === 'ignite') {
      d = this.pan(x, W); this.osc('sine', 70, 35, at, 0.8, d, 0.6, 0.004, 1.2); this.nz(at, 0.8, 'lowpass', 900, 0.7, d, 0.4, 0.01);
    }
  };

  window.GISDussehraScene = Scene;
  window.GISDussehraSound = Sound;
  if (CFG.noAuto) return;

  // =====================================================================
  //  POPUP ON THE WEBSITE
  // =====================================================================
  var force = /[?&]dussehra=1\b/.test(location.search);
  var now = Date.now();
  if (!force && (now < START || now >= END)) return;

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function getSeen() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setSeen() { try { localStorage.setItem(KEY, today()); } catch (e) { } }

  if (!CFG.noFonts) {
    var lk = document.createElement('link'); lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Yatra+One&family=Poppins:wght@500;600;800&display=swap';
    document.head.appendChild(lk);
  }

  var css = '' +
    '#gd-ov{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(5,6,20,.78);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:16px}' +
    '#gd-ov.on{display:flex;animation:gdIn .35s ease}' +
    '@keyframes gdIn{from{opacity:0}to{opacity:1}}' +
    '#gd-card{position:relative;width:min(92vw,560px,calc(100vh - 120px));border-radius:18px;overflow:hidden;background:#0b0a1e;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(251,191,36,.35)}' +
    '#gd-card canvas{display:block;width:100%;aspect-ratio:1/1;height:auto}' +
    '#gd-bar{display:flex;gap:8px;padding:10px;background:#120d24}' +
    '#gd-bar button,#gd-bar a{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:10px;padding:11px 8px;font:600 14px Poppins,system-ui,sans-serif;cursor:pointer;text-decoration:none;min-height:44px;white-space:nowrap}' +
    '#gd-replay,#gd-snd{background:rgba(255,255,255,.1);color:#fde7c7}' +
    '#gd-snd[aria-pressed="true"]{background:#f59e0b;color:#1a0b05}' +
    '#gd-share{background:#25D366;color:#fff;flex:1.4!important}' +
    '#gd-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font:400 26px/40px system-ui,sans-serif;cursor:pointer;z-index:2}' +
    '#gd-x:focus-visible,#gd-bar button:focus-visible,#gd-bar a:focus-visible,#gd-pill:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}' +
    '#gd-pill{position:fixed;left:16px;bottom:' + (CFG.pillBottom || 16) + 'px;z-index:2147482999;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:10px 16px 10px 12px;background:linear-gradient(135deg,#7c2d12,#c2410c);color:#fff;font:600 14px Poppins,system-ui,sans-serif;box-shadow:0 8px 24px rgba(194,65,12,.45);cursor:pointer;animation:gdPulse 2.4s ease-in-out infinite}' +
    '#gd-pill span{font-size:18px}' +
    '@keyframes gdPulse{50%{box-shadow:0 8px 34px rgba(251,146,60,.8)}}' +
    '@media (max-width:380px){#gd-bar button,#gd-bar a{font-size:13px;padding:10px 6px}}' +
    '@media (prefers-reduced-motion:reduce){#gd-pill{animation:none}#gd-ov.on{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var shareText = '🏹 शुभ विजयादशमी! Wishing you and your family a very Happy Dussehra. May goodness always triumph over evil.\n— ' + BRAND + '\n' + SITE + '?dussehra=1';
  var ov = document.createElement('div'); ov.id = 'gd-ov';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Happy Dussehra greeting from Get IT Solutions');
  ov.innerHTML = '<div id="gd-card"><button id="gd-x" type="button" aria-label="Close">×</button><canvas aria-hidden="true"></canvas>' +
    '<div id="gd-bar"><button id="gd-snd" type="button" aria-pressed="false">🔊 Sound</button><button id="gd-replay" type="button">↻ Replay</button>' +
    '<a id="gd-share" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(shareText) + '">Share on WhatsApp</a></div></div>';
  var pill = document.createElement('button'); pill.id = 'gd-pill'; pill.type = 'button';
  pill.innerHTML = '<span aria-hidden="true">🏹</span>Happy Dussehra';

  var scene, raf = 0, last = 0, lastFocus = null, ac = null, snd = null, soundOn = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    var cv = ov.querySelector('canvas'), w = cv.clientWidth || 500;
    scene.resize(Math.round(w * Math.min(window.devicePixelRatio || 1, 2)));
  }
  function stopSound() {
    if (snd) { var o = snd.out, t = ac.currentTime; try { o.gain.cancelScheduledValues(t); o.gain.setValueAtTime(o.gain.value, t); o.gain.linearRampToValueAtTime(0, t + 0.25); } catch (e) { } setTimeout(function () { try { o.disconnect(); } catch (e) { } }, 400); snd = null; }
  }
  function startSound() {
    stopSound(); if (!soundOn) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      snd = new Sound(ac, ac.currentTime + 0.05, 16); snd.timeline(16);
    } catch (e) { snd = null; }
  }
  function loop(ts) {
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    scene.update(dt); scene.draw(); raf = requestAnimationFrame(loop);
  }
  function start() {
    cancelAnimationFrame(raf); last = 0; scene.reset();
    startSound();
    if (reduce) { scene.onEvent = null; for (var i = 0; i < 300; i++) scene.update(1 / 30); scene.draw(); return; }
    raf = requestAnimationFrame(loop);
  }
  function open() {
    if (!ov.parentNode) document.body.appendChild(ov);
    if (!scene) { scene = new Scene(ov.querySelector('canvas'), 1000); scene.onEvent = function (type, x, t, W) { if (snd) snd.event(type, x, t, W); }; }
    lastFocus = document.activeElement;
    ov.classList.add('on'); size(); start(); setSeen();
    setTimeout(function () { try { ov.querySelector('#gd-x').focus({ preventScroll: true }); } catch (e) { } }, 50);
  }
  function close() {
    ov.classList.remove('on'); cancelAnimationFrame(raf); raf = 0; stopSound();
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { }
  }
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  ov.querySelector('#gd-x').addEventListener('click', close);
  ov.querySelector('#gd-replay').addEventListener('click', start);
  ov.querySelector('#gd-snd').addEventListener('click', function () {
    soundOn = !soundOn; this.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); this.textContent = soundOn ? '🔊 Sound on' : '🔊 Sound';
    if (soundOn) start(); else stopSound();
  });
  pill.addEventListener('click', open);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('on')) close(); });
  window.addEventListener('resize', function () { if (ov.classList.contains('on')) { size(); if (reduce) scene.draw(); } });

  function boot() {
    document.body.appendChild(pill);
    var fontsReady = (document.fonts && document.fonts.load) ? Promise.all([
      document.fonts.load('84px "Yatra One"', 'शुभ विजयादशमी'), document.fonts.load('800 60px Poppins', 'Happy')
    ]).catch(function () { }) : Promise.resolve();
    var timeout = new Promise(function (r) { setTimeout(r, 2500); });
    if (force || getSeen() !== today()) {
      Promise.race([fontsReady, timeout]).then(function () { setTimeout(open, force ? 200 : 1200); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.GISDussehra = { open: open, close: close };
})();
