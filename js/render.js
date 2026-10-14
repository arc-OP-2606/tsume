/* tsumé — SVG nail / hand renderer
   renderNail(spec, palette, opts) → <g> string in a 100×L space
   renderHand → js/render-hand.js
   renderSwatch(spec, palette, opts) → <svg> */
(function (global) {
  'use strict';

  let uidCounter = 0;
  const uid = () => 'n' + (uidCounter++).toString(36);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---- color helpers
  function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const darken = (c, t) => mix(c, '#1A1012', t);
  const lighten = (c, t) => mix(c, '#FFFFFF', t);
  function rgba(c, a) { const [r, g, b] = hexToRgb(c); return `rgba(${r},${g},${b},${a})`; }
  function lum(c) { const [r, g, b] = hexToRgb(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }

  // ---- nail geometry (W = 100)。根元は細い U 字、横はほぼまっすぐ、ys（最大幅）から先が形ごとに変わる
  const LEN = { short: 130, medium: 170, long: 230, xlong: 290 };
  const TIPS = {
    oval: [0.62, ys => `C 96 ${ys * 0.3} 76 0 50 0 C 24 0 4 ${ys * 0.3} 4 ${ys}`],
    almond: [0.72, ys => `C 96 ${ys * 0.42} 60 2 50 0 C 40 2 4 ${ys * 0.42} 4 ${ys}`],
    stiletto: [0.82, ys => `C 95 ${ys * 0.5} 58 ${ys * 0.1} 50 0 C 42 ${ys * 0.1} 5 ${ys * 0.5} 4 ${ys}`],
    ballerina: [0.75, ys => `C 95 ${ys * 0.55} 76 ${ys * 0.14} 74 6 Q 73 0 66 0 L 34 0 Q 27 0 26 6 C 24 ${ys * 0.14} 5 ${ys * 0.55} 4 ${ys}`],
    square: [0.4, () => `L 96 14 Q 96 0 82 0 L 18 0 Q 4 0 4 14`],
    round: [0.5, ys => `C 96 ${ys * 0.1} 78 0 50 0 C 22 0 4 ${ys * 0.1} 4 ${ys}`],
  };
  const r1 = v => Math.round(v * 10) / 10;
  function nailPath(shape, len) {
    const L = LEN[len] || LEN.medium, tip = TIPS[shape] || TIPS.oval, ys = r1((L - 62) * tip[0]);
    const end = shape === 'square' && TIPS[shape] ? ` L 4 ${ys}` : '';
    const d = `M 14 ${L - 16} C 14 ${L + 4} 86 ${L + 4} 86 ${L - 16} L 96 ${ys} ${tip[1](ys)}${end} Z`.replace(/\d+\.\d{2,}/g, m => String(r1(+m)));
    return { d, L, ys };
  }
  /** その高さ（0=先端〜1=根元）での爪の半幅（幅100に対する割合 0〜0.5）。輪郭の右側を細かく区切って測る */
  const halfCache = {};
  function nailHalf(shape, len, yFrac) {
    const key = (TIPS[shape] ? shape : 'oval') + ':' + (LEN[len] ? len : 'medium');
    const pts = halfCache[key] || (halfCache[key] = outlineRight(key.split(':')[0], key.split(':')[1]));
    const L = LEN[key.split(':')[1]], y = Math.max(0, Math.min(1, yFrac)) * L;
    let best = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      if ((y0 - y) * (y1 - y) <= 0 && y0 !== y1) best = Math.max(best, x0 + (x1 - x0) * (y - y0) / (y1 - y0));
    }
    return Math.max(0, (best - 50) / 100);
  }
  // 右半分の輪郭（根元の U の右端 → 最大幅 → 先端）を点の列に
  function outlineRight(shape, len) {
    const { d } = nailPath(shape, len), tok = d.match(/[MLCQZ]|-?\d+(\.\d+)?/g);
    const pts = []; let i = 0, cur = [0, 0], cmd = '';
    const num = () => +tok[i++];
    const bez = (p) => { for (let k = 1; k <= 24; k++) { const t = k / 24, u = 1 - t; let x, y;
      if (p.length === 3) { x = u * u * u * cur[0] + 3 * u * u * t * p[0][0] + 3 * u * t * t * p[1][0] + t * t * t * p[2][0]; y = u * u * u * cur[1] + 3 * u * u * t * p[0][1] + 3 * u * t * t * p[1][1] + t * t * t * p[2][1]; }
      else { x = u * u * cur[0] + 2 * u * t * p[0][0] + t * t * p[1][0]; y = u * u * cur[1] + 2 * u * t * p[0][1] + t * t * p[1][1]; }
      pts.push([x, y]); } cur = p[p.length - 1]; };
    while (i < tok.length) {
      if (/[MLCQZ]/.test(tok[i])) cmd = tok[i++];
      if (cmd === 'Z') break;
      if (cmd === 'M' || cmd === 'L') { cur = [num(), num()]; pts.push(cur); }
      else if (cmd === 'C') bez([[num(), num()], [num(), num()], [num(), num()]]);
      else if (cmd === 'Q') bez([[num(), num()], [num(), num()]]);
    }
    return pts.filter(p => p[0] >= 50); // 右半分だけ（左右対称）
  }
  // smile line (french boundary) at height y: curved
  const smile = (y) => `M -6 ${y + 9} Q 50 ${y - 9} 106 ${y + 9}`;
  const tipRegion = (y) => `M -6 ${y + 9} Q 50 ${y - 9} 106 ${y + 9} L 106 -6 L -6 -6 Z`;

  // ---- technique renderers. ctx: {L, col(role), rng, id, p, defs[], out[], matte}
  const R = {};
  const rect = (fill, op = 1, extra = '') => `<rect x="-2" y="-2" width="104" height="400" fill="${fill}" opacity="${op}" ${extra}/>`;

  R.one_color = c => { c.out.push(rect(c.col('base'))); };
  R.peel_one = R.one_color;
  R.sheer = c => { c.out.push(rect(c.col('base'), 0.62)); };
  R.bare_gloss = () => {};
  R.sugar_matte = c => {
    c.out.push(rect(c.col('base')));
    c.defs.push(`<filter id="${c.id}nz"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.18 0"/></filter>`);
    c.out.push(`<rect x="0" y="0" width="100" height="${c.L}" filter="url(#${c.id}nz)" opacity="0.5"/>`);
    c.matte = true;
  };
  R.gradient = c => {
    c.out.push(rect(c.col('base'), 0.7));
    c.defs.push(`<linearGradient id="${c.id}gr" x1="0" y1="1" x2="0" y2="0"><stop offset="0.12" stop-color="${c.col('tip')}" stop-opacity="0"/><stop offset="0.82" stop-color="${c.col('tip')}" stop-opacity="1"/></linearGradient>`);
    c.out.push(rect(`url(#${c.id}gr)`));
  };
  function glitterDots(c, n, colors, rMin, rMax, yMin, yMax) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = c.rng() * 100, y = yMin + c.rng() * (yMax - yMin), r = rMin + c.rng() * (rMax - rMin);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${colors[i % colors.length]}" opacity="${(0.45 + c.rng() * 0.55).toFixed(2)}"/>`;
    }
    return s;
  }
  R.lame_grad = c => {
    const m = c.col('metal');
    c.defs.push(`<linearGradient id="${c.id}lm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="0.75" stop-color="#000"/></linearGradient><mask id="${c.id}lmk"><rect x="0" y="0" width="100" height="${c.L}" fill="url(#${c.id}lm)"/></mask>`);
    c.out.push(`<rect x="0" y="0" width="100" height="${c.L * 0.55}" fill="${m}" opacity="0.22" mask="url(#${c.id}lmk)"/>`);
    c.out.push(`<g mask="url(#${c.id}lmk)">${glitterDots(c, 110, [m, '#FFFFFF', lighten(m, 0.4)], 0.6, 2.2, 0, c.L)}</g>`);
  };
  R.glitter_polish = c => { const m = c.col('metal'); c.out.push(rect(c.col('base'), 0.8)); c.out.push(glitterDots(c, 90, [m, '#FFFFFF'], 0.6, 1.8, 0, c.L)); };
  R.french = c => { c.out.push(rect(c.col('base'), 0.8)); c.out.push(`<path d="${tipRegion(c.L * 0.3)}" fill="${c.col('tip')}"/>`); };
  R.skinny_french = c => { c.out.push(rect(c.col('base'), 0.85)); c.out.push(`<path d="${smile(c.L * 0.26)}" fill="none" stroke="${c.col('tip')}" stroke-width="2.4" stroke-linecap="round"/>`); };
  R.glass_french = c => {
    const t = c.col('tip');
    c.out.push(rect(c.col('base'), 0.55));
    c.defs.push(`<linearGradient id="${c.id}gf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${t}" stop-opacity="0.55"/><stop offset="1" stop-color="${lighten(t, 0.25)}" stop-opacity="0.75"/></linearGradient>`);
    c.out.push(`<path d="${tipRegion(c.L * 0.3)}" fill="url(#${c.id}gf)"/>`);
    c.out.push(`<path d="${smile(c.L * 0.3)}" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity="0.75"/>`);
  };
  function magnetBand(c, angle, width, op, blur, color) {
    const g = c.id + 'mb' + Math.floor(c.rng() * 1e6).toString(36);
    const w = width / 2;
    c.defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset="${0.5 - w}" stop-color="${color}" stop-opacity="${op * 0.18}"/><stop offset="0.5" stop-color="${color}" stop-opacity="${op}"/><stop offset="${0.5 + w}" stop-color="${color}" stop-opacity="${op * 0.18}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient><filter id="${g}f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter>`);
    return `<rect class="tsume-mag" x="-30" y="-30" width="160" height="${c.L + 60}" fill="url(#${g})" filter="url(#${g}f)"/>`;
  }
  R.magnet = c => {
    const base = c.col('base'), light = c.col('light');
    if (c.p.clear) { c.out.push(rect(base, 0.6)); } else { c.out.push(rect(darken(base, 0.12))); }
    c.out.push(magnetBand(c, -32, 0.26, c.p.clear ? 0.8 : 0.95, 2.6, light));
    c.out.push(`<g opacity="0.35">${glitterDots(c, 60, ['#FFFFFF', light], 0.3, 0.9, 0, c.L)}</g>`);
    if (c.p.clear) c.out.push(`<ellipse cx="50" cy="${c.L * 0.5}" rx="34" ry="${c.L * 0.36}" fill="#FFFFFF" opacity="0.14"/>`);
  };
  R.magnet_polish = R.magnet;
  R.magnet_line = c => { c.out.push(rect(darken(c.col('base'), 0.15))); c.out.push(magnetBand(c, -58, 0.12, 1, 1.4, c.col('light'))); c.out.push(`<g opacity="0.3">${glitterDots(c, 50, ['#FFFFFF'], 0.3, 0.8, 0, c.L)}</g>`); };
  R.velvet = c => {
    const l = c.col('light');
    c.out.push(rect(darken(c.col('base'), 0.1)));
    c.out.push(magnetBand(c, -40, 0.3, 0.6, 4, l));
    c.out.push(magnetBand(c, -70, 0.2, 0.45, 3.5, l));
    c.out.push(magnetBand(c, 20, 0.22, 0.35, 4, l));
    c.out.push(`<g opacity="0.3">${glitterDots(c, 70, ['#FFFFFF', l], 0.3, 0.8, 0, c.L)}</g>`);
  };
  function mirrorGrad(c, m, angle) {
    const g = c.id + 'mr';
    c.defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.22" stop-color="${m}"/><stop offset="0.42" stop-color="${lighten(m, 0.75)}"/><stop offset="0.6" stop-color="${darken(m, 0.4)}"/><stop offset="0.8" stop-color="${m}"/><stop offset="1" stop-color="${lighten(m, 0.6)}"/></linearGradient>`);
    return `url(#${g})`;
  }
  R.mirror = c => {
    const m = c.col('metal');
    c.out.push(rect(mirrorGrad(c, m, 10)));
    c.out.push(`<polygon points="-10,${c.L * 0.55} 110,${c.L * 0.05} 110,${c.L * 0.22} -10,${c.L * 0.72}" fill="#FFFFFF" opacity="0.28"/>`);
  };
  R.mirror_french = c => {
    const m = c.col('metal');
    c.out.push(`<path d="${tipRegion(c.L * 0.3)}" fill="${mirrorGrad(c, m, 10)}"/>`);
    c.out.push(`<path d="${smile(c.L * 0.3)}" fill="none" stroke="${darken(m, 0.3)}" stroke-width="0.8" opacity="0.6"/>`);
  };
  R.aurora = c => {
    const f = c.id + 'au';
    c.defs.push(`<radialGradient id="${f}a"><stop offset="0" stop-color="#F7C6D9" stop-opacity="0.7"/><stop offset="1" stop-color="#F7C6D9" stop-opacity="0"/></radialGradient><radialGradient id="${f}b"><stop offset="0" stop-color="#BFD9F0" stop-opacity="0.75"/><stop offset="1" stop-color="#BFD9F0" stop-opacity="0"/></radialGradient><radialGradient id="${f}c"><stop offset="0" stop-color="#D5F0DD" stop-opacity="0.65"/><stop offset="1" stop-color="#D5F0DD" stop-opacity="0"/></radialGradient>`);
    c.out.push(`<ellipse cx="30" cy="${c.L * 0.3}" rx="42" ry="${c.L * 0.32}" fill="url(#${f}a)"/><ellipse cx="74" cy="${c.L * 0.6}" rx="40" ry="${c.L * 0.3}" fill="url(#${f}b)"/><ellipse cx="42" cy="${c.L * 0.86}" rx="38" ry="${c.L * 0.26}" fill="url(#${f}c)"/>`);
    c.out.push(`<polygon points="-10,${c.L * 0.6} 110,${c.L * 0.1} 110,${c.L * 0.2} -10,${c.L * 0.7}" fill="#FFFFFF" opacity="0.22"/>`);
  };
  R.flash = c => {
    c.out.push(glitterDots(c, 150, ['#FFFFFF', c.col('light'), '#F2F2F2'], 0.4, 1.4, 0, c.L));
    for (let i = 0; i < 4; i++) { const x = 10 + c.rng() * 80, y = 10 + c.rng() * (c.L - 20); c.out.push(`<path d="M ${x} ${y - 4} L ${x + 1} ${y - 1} L ${x + 4} ${y} L ${x + 1} ${y + 1} L ${x} ${y + 4} L ${x - 1} ${y + 1} L ${x - 4} ${y} L ${x - 1} ${y - 1} Z" fill="#FFFFFF" opacity="0.9"/>`); }
  };
  R.holo_scatter = c => {
    const n = c.p.n || (c.p.micro ? 9 : 7);
    const g = c.id + 'ho';
    c.defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD1E8"/><stop offset="0.5" stop-color="#D1F0FF"/><stop offset="1" stop-color="#FFF6C8"/></linearGradient>`);
    for (let i = 0; i < n; i++) {
      const x = 8 + c.rng() * 84, y = 8 + c.rng() * (c.L - 16), r = c.p.micro ? 1.6 + c.rng() * 1.4 : 2.8 + c.rng() * 3.2;
      if (c.p.bubbles) c.out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c.col('light')}" opacity="0.35"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="0.9" opacity="0.8"/><circle cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.25).toFixed(1)}" fill="#FFFFFF" opacity="0.9"/>`);
      else { const pts = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + c.rng() * 0.3; pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`); } c.out.push(`<polygon points="${pts.join(' ')}" fill="url(#${g})" opacity="0.9"/>`); }
    }
  };
  function blob(c, color, x, y, rx, ry, blur, op) {
    const f = c.id + 'b' + Math.floor(c.rng() * 1e6).toString(36);
    c.defs.push(`<filter id="${f}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter>`);
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${color}" opacity="${op}" filter="url(#${f})" transform="rotate(${(c.rng() * 60 - 30).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  }
  R.tortoise = c => {
    const base = c.col('base'), deep = c.col('deep'), acc = c.col('accent');
    c.out.push(rect(c.p.sheer ? lighten(base, 0.3) : base, c.p.sheer ? 0.8 : 1));
    let s = '';
    for (let i = 0; i < 7; i++) s += blob(c, deep, c.rng() * 100, c.rng() * c.L, 8 + c.rng() * 12, 10 + c.rng() * 16, 4, c.p.sheer ? 0.6 : 0.85);
    for (let i = 0; i < 4; i++) s += blob(c, acc, c.rng() * 100, c.rng() * c.L, 6 + c.rng() * 10, 8 + c.rng() * 12, 5, 0.6);
    c.out.push(`<g>${s}</g>`);
    c.out.push(rect(lighten(base, 0.2), 0.15));
  };
  function vein(c, color, w, op, blur, broad) {
    const f = c.id + 'v' + Math.floor(c.rng() * 1e6).toString(36);
    c.defs.push(`<filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${blur}"/></filter>`);
    const x0 = c.rng() * 100, y0 = -5, x1 = c.rng() * 100, y1 = c.L + 5;
    const d = `M ${x0.toFixed(1)} ${y0} C ${(c.rng() * 100).toFixed(1)} ${(c.L * 0.3).toFixed(1)} ${(c.rng() * 100).toFixed(1)} ${(c.L * 0.6).toFixed(1)} ${x1.toFixed(1)} ${y1}`;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" filter="url(#${f})" stroke-linecap="round"/>`;
  }
  R.marble = c => {
    const base = c.col('base'), deep = c.col('deep');
    c.out.push(rect(base));
    c.out.push(vein(c, deep, 7, 0.12, 3) + vein(c, deep, 1.3, 0.55, 0.6) + vein(c, deep, 0.7, 0.8, 0.3) + vein(c, lighten(deep, 0.5), 1.8, 0.35, 1));
  };
  R.ink = c => {
    const deep = c.col('deep'), acc = c.col('accent'), L = c.L;
    const kind = c.p.kind || 'ink';
    if (kind === 'wave') {
      for (let i = 0; i < 4; i++) { const y = L * (0.2 + i * 0.2) + c.rng() * 8; c.out.push(`<path d="M -5 ${y} C 20 ${y - 7} 35 ${y + 7} 50 ${y} S 85 ${y - 7} 105 ${y + 2}" fill="none" stroke="${deep}" stroke-width="${(0.8 + c.rng()).toFixed(1)}" opacity="0.5" stroke-linecap="round"/>`); }
    } else if (kind === 'stream') {
      for (let i = 0; i < 3; i++) { const x = 22 + i * 26 + c.rng() * 6; c.out.push(`<path d="M ${x} -5 C ${x - 10} ${L * 0.3} ${x + 10} ${L * 0.6} ${x} ${L + 5}" fill="none" stroke="${c.col('light')}" stroke-width="1.4" opacity="0.7" stroke-linecap="round"/>`); }
    } else if (kind === 'fish') {
      const x = 44 + c.rng() * 10, y = L * 0.45;
      c.out.push(`<ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" fill="${acc}" opacity="0.92" transform="rotate(-20 ${x} ${y})"/>`);
      c.out.push(`<path d="M ${x + 6} ${y - 1} C ${x + 16} ${y - 14} ${x + 22} ${y - 4} ${x + 14} ${y + 2} C ${x + 22} ${y + 6} ${x + 16} ${y + 16} ${x + 6} ${y + 3} Z" fill="${acc}" opacity="0.75"/>`);
      c.out.push(`<path d="M ${x - 2} ${y - 5} C ${x - 6} ${y - 12} ${x + 2} ${y - 12} ${x + 1} ${y - 6}" fill="${acc}" opacity="0.7"/>`);
      c.out.push(`<circle cx="${x - 5}" cy="${y - 1.5}" r="1.1" fill="${deep}"/>`);
      for (let i = 0; i < 3; i++) c.out.push(`<circle cx="${(x - 14 - c.rng() * 10).toFixed(1)}" cy="${(y - 10 - c.rng() * 20).toFixed(1)}" r="${(1 + c.rng() * 1.5).toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="0.7" opacity="0.8"/>`);
    } else {
      for (let i = 0; i < 3; i++) {
        const f = c.id + 'ik' + i; c.defs.push(`<filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${(0.3 + c.rng() * 0.5).toFixed(2)}"/></filter>`);
        const x0 = c.rng() * 100, y0 = c.rng() * L;
        c.out.push(`<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${(c.rng() * 120 - 10).toFixed(1)} ${(c.rng() * L).toFixed(1)} ${(c.rng() * 120 - 10).toFixed(1)} ${(c.rng() * L).toFixed(1)} ${(c.rng() * 100).toFixed(1)} ${(c.rng() * L).toFixed(1)}" fill="none" stroke="${deep}" stroke-width="${(0.8 + c.rng() * 2.4).toFixed(1)}" opacity="${(0.55 + c.rng() * 0.4).toFixed(2)}" stroke-linecap="round" filter="url(#${f})"/>`);
      }
    }
  };
  R.nuance = c => {
    c.out.push(rect(c.col('base')));
    let s = '';
    s += blob(c, c.col('accent'), 20 + c.rng() * 60, c.rng() * c.L, 24, 30, 9, 0.55);
    s += blob(c, c.col('deep'), 20 + c.rng() * 60, c.rng() * c.L, 20, 26, 9, 0.45);
    s += blob(c, c.col('light'), 20 + c.rng() * 60, c.rng() * c.L, 22, 26, 8, 0.6);
    c.out.push(`<g>${s}</g>`);
  };
  function stone(c, x, y, r, color) {
    const g = c.id + 'st' + Math.floor(c.rng() * 1e6).toString(36);
    c.defs.push(`<radialGradient id="${g}" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="${lighten(color, 0.2)}"/><stop offset="1" stop-color="${darken(color, 0.45)}"/></radialGradient>`);
    return `<circle cx="${x}" cy="${y + 0.8}" r="${r}" fill="rgba(0,0,0,0.18)"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.22}" fill="#FFFFFF" opacity="0.9"/><path d="M ${x + r * 0.4} ${y - r * 1.1} l 0.6 1.4 l 1.4 0.6 l -1.4 0.6 l -0.6 1.4 l -0.6 -1.4 l -1.4 -0.6 l 1.4 -0.6 Z" fill="#FFFFFF" opacity="0.9"/>`;
  }
  R.stones_accent = c => {
    const n = c.p.n || 2, col = c.col('accent'), at = c.p.at;
    const cy = at === 'cuticle' ? c.L - 20 : at === 'tip' ? 18 : c.L * 0.5;
    if (n === 1) c.out.push(stone(c, 50, cy, 6.5, col));
    else if (n === 2) c.out.push(stone(c, 44, cy - 4, 5.5, col) + stone(c, 55, cy + 5, 4.2, col));
    else c.out.push(stone(c, 42, cy - 5, 5.2, col) + stone(c, 54, cy + 1, 6, col) + stone(c, 46, cy + 10, 4, col));
  };
  R.pixie = c => {
    const m = c.col('metal'), at = c.p.at || 'cuticle';
    for (let i = 0; i < 70; i++) {
      const t = c.rng();
      const y = at === 'cuticle' ? c.L - 6 - Math.pow(t, 1.8) * 36 : 6 + Math.pow(t, 1.8) * 34;
      const x = 6 + c.rng() * 88, r = 1 + c.rng() * 1.2;
      c.out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c.rng() < 0.5 ? '#FFFFFF' : m}" opacity="${(0.7 + c.rng() * 0.3).toFixed(2)}"/>`);
    }
  };
  function pearl(c, x, y, r) {
    const g = c.id + 'pr' + Math.floor(c.rng() * 1e6).toString(36);
    c.defs.push(`<radialGradient id="${g}" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#F6EFE6"/><stop offset="1" stop-color="#CFC2B4"/></radialGradient>`);
    return `<circle cx="${x}" cy="${y + 0.7}" r="${r}" fill="rgba(0,0,0,0.14)"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})"/>`;
  }
  R.pearls_tip = c => { const y = c.p.at === 'cuticle' ? c.L - 17 : c.p.at === 'tip' ? 16 : c.L - 17; c.out.push(pearl(c, 38, y + 3, 4) + pearl(c, 50, y, 4.6) + pearl(c, 62, y + 3, 4)); };
  R.brion_line = c => { const m = c.col('metal'); for (let i = 0; i < 11; i++) { const t = i / 10, x = 12 + t * 76, y = c.L - 14 + Math.sin(t * Math.PI) * 6; c.out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.9" fill="${m}"/><circle cx="${(x - 0.6).toFixed(1)}" cy="${(y - 0.6).toFixed(1)}" r="0.6" fill="#FFFFFF" opacity="0.9"/>`); } };
  function metalGrad(c, m) { const g = c.id + 'mg' + Math.floor(c.rng() * 1e6).toString(36); c.defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(m, 0.6)}"/><stop offset="0.5" stop-color="${m}"/><stop offset="1" stop-color="${darken(m, 0.35)}"/></linearGradient>`); return `url(#${g})`; }
  R.studs = c => { const y = c.L * 0.5; c.out.push(`<rect x="46" y="${y - 4}" width="8" height="8" rx="1.5" fill="${metalGrad(c, c.col('metal'))}" transform="rotate(45 50 ${y})"/>`); };
  R.gold_leaf = c => {
    const m = c.col('metal'), n = c.p.tiny ? 2 : 3 + Math.floor(c.rng() * 3);
    for (let i = 0; i < n; i++) {
      const cx = c.p.tiny ? 50 + c.rng() * 20 - 10 : 15 + c.rng() * 70, cy = c.p.tiny ? c.L - 22 + c.rng() * 8 : 10 + c.rng() * (c.L - 20);
      const r = c.p.tiny ? 2 + c.rng() * 2 : 4 + c.rng() * 6, k = 6 + Math.floor(c.rng() * 3), pts = [];
      for (let j = 0; j < k; j++) { const a = (Math.PI * 2 / k) * j, rr = r * (0.5 + c.rng() * 0.7); pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * 1.3).toFixed(1)}`); }
      c.out.push(`<polygon points="${pts.join(' ')}" fill="${metalGrad(c, m)}" opacity="0.95"/>`);
    }
  };
  R.gold_crack = c => {
    const m = c.col('metal'); let d, pts = [];
    if (c.p.coast) { let x = -4, y = c.L * 0.45; pts.push(`${x},${y}`); while (x < 104) { x += 6 + c.rng() * 10; y += c.rng() * 18 - 9; pts.push(`${x.toFixed(1)},${y.toFixed(1)}`); } }
    else { let x = 38 + c.rng() * 24, y = -4; pts.push(`${x},${y}`); while (y < c.L + 4) { y += 8 + c.rng() * 12; x += c.rng() * 16 - 8; pts.push(`${x.toFixed(1)},${y.toFixed(1)}`); } }
    d = 'M ' + pts.join(' L ');
    const bx = pts[Math.floor(pts.length / 2)].split(',');
    c.out.push(`<path d="${d}" fill="none" stroke="${m}" stroke-width="2.2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${lighten(m, 0.6)}" stroke-width="0.7" opacity="0.8" transform="translate(-0.6,-0.6)"/>`);
    c.out.push(`<path d="M ${bx[0]} ${bx[1]} l ${(c.rng() * 16 - 8).toFixed(1)} ${(8 + c.rng() * 10).toFixed(1)}" fill="none" stroke="${m}" stroke-width="1.2"/>`);
  };
  R.shell_inlay = c => {
    const g = c.id + 'sh'; c.defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#E6F0F5"/><stop offset="1" stop-color="#F8E6EE"/></linearGradient>`);
    for (let i = 0; i < 7; i++) { const cx = 12 + c.rng() * 76, cy = 10 + c.rng() * (c.L - 20), r = 4 + c.rng() * 6, k = 5 + Math.floor(c.rng() * 3), pts = []; for (let j = 0; j < k; j++) { const a = (Math.PI * 2 / k) * j, rr = r * (0.6 + c.rng() * 0.5); pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); } c.out.push(`<polygon points="${pts.join(' ')}" fill="url(#${g})" stroke="rgba(255,255,255,0.9)" stroke-width="0.6" opacity="0.92"/>`); }
  };
  function flower(c, x, y, r, color, center, op, stroke) {
    let s = '';
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${x}" cy="${y - r * 0.9}" rx="${r * 0.55}" ry="${r}" fill="${color}" opacity="${op}" ${stroke ? `stroke="${stroke}" stroke-width="0.6"` : ''} transform="rotate(${i * 72} ${x} ${y})"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r * 0.28}" fill="${center}"/>`;
    return s;
  }
  R.flower_pressed = c => { c.out.push(`<ellipse cx="60" cy="${c.L * 0.55}" rx="4" ry="8" fill="#8FA882" opacity="0.6" transform="rotate(40 60 ${c.L * 0.55})"/>`); c.out.push(flower(c, 50, c.L * 0.44, 8, c.col('accent'), c.col('deep'), 0.78)); c.out.push(flower(c, 30, c.L * 0.72, 4.5, c.col('accent'), c.col('deep'), 0.7)); };
  R.flower_paint = c => { c.out.push(flower(c, 50, c.L * 0.45, 8.5, c.col('accent'), c.col('metal'), 1, c.col('light'))); c.out.push(flower(c, 72, c.L * 0.7, 4.5, c.col('accent'), c.col('metal'), 1, c.col('light'))); };
  R.camellia = c => {
    const x = 50, y = c.L * 0.45, acc = c.col('accent'), m = c.col('metal');
    c.out.push(`<ellipse cx="${x - 12}" cy="${y + 8}" rx="5" ry="9" fill="#2E4A3F" opacity="0.85" transform="rotate(-35 ${x - 12} ${y + 8})"/><ellipse cx="${x + 13}" cy="${y + 6}" rx="5" ry="9" fill="#2E4A3F" opacity="0.85" transform="rotate(35 ${x + 13} ${y + 6})"/>`);
    for (let i = 0; i < 6; i++) { const a = (Math.PI * 2 / 6) * i, px = x + Math.cos(a) * 6.5, py = y + Math.sin(a) * 6.5; c.out.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="8" fill="${acc}" stroke="${darken(acc, 0.15)}" stroke-width="0.5"/>`); }
    c.out.push(`<circle cx="${x}" cy="${y}" r="6.5" fill="${lighten(acc, 0.12)}"/>`);
    for (let i = 0; i < 7; i++) { const a = (Math.PI * 2 / 7) * i, r = i === 0 ? 0 : 2.6; c.out.push(`<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="1.1" fill="${m}"/>`); }
  };
  R.plum = c => {
    const acc = c.col('accent'), m = c.col('metal');
    const spots = [[32, c.L * 0.3], [66, c.L * 0.48], [40, c.L * 0.72]];
    spots.forEach(([x, y], k) => { const r = k === 1 ? 3.4 : 2.6; for (let i = 0; i < 5; i++) { const a = (Math.PI * 2 / 5) * i - Math.PI / 2; c.out.push(`<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.8).toFixed(1)}" fill="${acc}"/>`); } c.out.push(`<circle cx="${x}" cy="${y}" r="1" fill="${m}"/>`); });
  };
  R.mizuhiki = c => {
    const y = c.L * 0.45, red = c.col('accent'), m = c.col('metal');
    const d = (o) => `M 50 ${y + o} C 30 ${y - 20 + o} 15 ${y + 10 + o} 35 ${y + 12 + o} C 50 ${y + 14 + o} 50 ${y - 14 + o} 65 ${y - 12 + o} C 85 ${y - 10 + o} 70 ${y + 20 + o} 50 ${y + o}`;
    c.out.push(`<path d="${d(0)}" fill="none" stroke="${red}" stroke-width="1.8"/><path d="${d(3)}" fill="none" stroke="${m}" stroke-width="1.8"/>`);
    c.out.push(`<path d="M 36 ${y + 12} C 30 ${y + 24} 28 ${y + 34} 26 ${y + 44}" fill="none" stroke="${red}" stroke-width="1.6"/><path d="M 64 ${y - 10} C 70 ${y + 2} 72 ${y + 20} 74 ${y + 42}" fill="none" stroke="${m}" stroke-width="1.6"/>`);
  };
  R.firework = c => {
    const x = 50, y = c.L * 0.42, m = c.col('metal'), l = c.col('light');
    for (let i = 0; i < 14; i++) { const a = (Math.PI * 2 / 14) * i, r1 = 6, r2 = 18 + c.rng() * 12; const ex = x + Math.cos(a) * r2, ey = y + Math.sin(a) * r2; c.out.push(`<line x1="${(x + Math.cos(a) * r1).toFixed(1)}" y1="${(y + Math.sin(a) * r1).toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${i % 2 ? m : l}" stroke-width="0.9" opacity="0.9" stroke-linecap="round"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="1.1" fill="${l}"/>`); }
    for (let i = 0; i < 8; i++) c.out.push(`<circle cx="${(x + c.rng() * 60 - 30).toFixed(1)}" cy="${(y + c.rng() * 60 - 30).toFixed(1)}" r="${(0.5 + c.rng()).toFixed(1)}" fill="${m}" opacity="0.8"/>`);
  };
  R.droplet3d = c => {
    const x = 50, y = c.L * 0.5, g = c.id + 'dr', f = c.id + 'drf';
    c.defs.push(`<radialGradient id="${g}" cx="0.4" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/><stop offset="0.6" stop-color="#FFFFFF" stop-opacity="0.12"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.35"/></radialGradient><filter id="${f}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>`);
    c.out.push(`<ellipse cx="${x + 1.5}" cy="${y + 3}" rx="11" ry="14" fill="rgba(0,0,0,0.14)" filter="url(#${f})"/><ellipse cx="${x}" cy="${y}" rx="11" ry="14" fill="url(#${g})" stroke="rgba(255,255,255,0.8)" stroke-width="1"/><ellipse cx="${x - 4}" cy="${y - 6}" rx="3" ry="4.5" fill="#FFFFFF" opacity="0.85"/>`);
  };
  R.ice = c => {
    const l = c.col('light');
    for (let i = 0; i < 6; i++) { const cx = 10 + c.rng() * 80, cy = 10 + c.rng() * (c.L - 20), r = 9 + c.rng() * 12, pts = []; for (let j = 0; j < 4; j++) { const a = Math.PI / 2 * j + c.rng() * 0.6; pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r * 0.8).toFixed(1)}`); } c.out.push(`<polygon points="${pts.join(' ')}" fill="${l}" opacity="0.32" stroke="#FFFFFF" stroke-width="1" stroke-opacity="0.85"/>`); }
  };
  R.cheek = c => {
    c.out.push(rect(c.col('base'), 0.65));
    const g = c.id + 'ch', f = c.id + 'chf';
    c.defs.push(`<radialGradient id="${g}"><stop offset="0" stop-color="${c.col('accent')}" stop-opacity="0.85"/><stop offset="1" stop-color="${c.col('accent')}" stop-opacity="0"/></radialGradient><filter id="${f}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>`);
    c.out.push(`<ellipse cx="50" cy="${c.L * 0.5}" rx="34" ry="${c.L * 0.3}" fill="url(#${g})" filter="url(#${f})"/>`);
  };
  R.check = c => {
    if (c.p.kind === 'ichimatsu') { const s = 12; for (let y = -2; y < c.L; y += s) for (let x = -2; x < 100; x += s) if (((x + 2) / s + (y + 2) / s) % 2 === 0) c.out.push(`<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${metalGrad(c, c.col('accent'))}"/>`); return; }
    const d = c.col('deep'), a = c.col('accent');
    c.out.push(`<g opacity="0.75"><line x1="30" y1="-5" x2="30" y2="${c.L + 5}" stroke="${d}" stroke-width="5"/><line x1="70" y1="-5" x2="70" y2="${c.L + 5}" stroke="${d}" stroke-width="5"/><line x1="-5" y1="${c.L * 0.35}" x2="105" y2="${c.L * 0.35}" stroke="${d}" stroke-width="5"/><line x1="-5" y1="${c.L * 0.68}" x2="105" y2="${c.L * 0.68}" stroke="${d}" stroke-width="5"/></g>`);
    c.out.push(`<g opacity="0.6"><line x1="38" y1="-5" x2="38" y2="${c.L + 5}" stroke="${a}" stroke-width="1.6"/><line x1="62" y1="-5" x2="62" y2="${c.L + 5}" stroke="${a}" stroke-width="1.6"/><line x1="-5" y1="${c.L * 0.5}" x2="105" y2="${c.L * 0.5}" stroke="${a}" stroke-width="1.6"/></g>`);
  };
  R.tweed = c => {
    c.out.push(rect(c.col('base')));
    const cols = [c.col('deep'), c.col('accent'), c.col('light'), c.col('deep')];
    for (let i = 0; i < 110; i++) { const x = c.rng() * 100, y = c.rng() * c.L, len = 3 + c.rng() * 5, h = i % 2 === 0; c.out.push(`<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(h ? x + len : x).toFixed(1)}" y2="${(h ? y : y + len).toFixed(1)}" stroke="${cols[i % 4]}" stroke-width="${(1 + c.rng() * 1.2).toFixed(1)}" opacity="${(0.5 + c.rng() * 0.4).toFixed(2)}" stroke-linecap="round"/>`); }
  };
  R.quilting = c => {
    const s = 18;
    let lines = '';
    for (let k = -c.L; k < 100 + c.L; k += s) { lines += `<line x1="${k}" y1="-5" x2="${k + c.L + 10}" y2="${c.L + 5}" stroke="rgba(0,0,0,0.14)" stroke-width="2.2"/><line x1="${k + 1}" y1="-5" x2="${k + c.L + 11}" y2="${c.L + 5}" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>`; lines += `<line x1="${k}" y1="${c.L + 5}" x2="${k + c.L + 10}" y2="-5" stroke="rgba(0,0,0,0.14)" stroke-width="2.2"/><line x1="${k + 1}" y1="${c.L + 5}" x2="${k + c.L + 11}" y2="-5" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>`; }
    c.out.push(lines);
    for (let y = s * 0.5; y < c.L; y += s) for (let x = (y / s) % 2 === 0 ? s * 0.5 : s; x < 100; x += s) c.out.push(pearl(c, x, y, 1.8));
  };
  R.dots = c => { for (let i = 0; i < 5; i++) c.out.push(`<circle cx="${(10 + c.rng() * 80).toFixed(1)}" cy="${(10 + c.rng() * (c.L - 20)).toFixed(1)}" r="${(2 + c.rng() * 1.6).toFixed(1)}" fill="${c.col('accent')}"/>`); };
  const HEART = 'M 0 2.2 C -2.2 0 -3 -1.6 -1.6 -2.6 C -0.8 -3.2 0 -2.6 0 -1.8 C 0 -2.6 0.8 -3.2 1.6 -2.6 C 3 -1.6 2.2 0 0 2.2 Z';
  R.heart_flakes = c => { const n = 3 + Math.floor(c.rng() * 3); for (let i = 0; i < n; i++) { const x = 14 + c.rng() * 72, y = 14 + c.rng() * (c.L - 28), s = 1.1 + c.rng() * 0.7; c.out.push(`<path d="${HEART}" fill="${c.col('accent')}" opacity="0.92" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(c.rng() * 60 - 30).toFixed(0)}) scale(${s.toFixed(2)})"/>`); } };
  R.sticker_art = c => { if (c.p.motif === 'ribbon') R.ribbon(c); else R.flower_paint(c); };
  R.moon_gold = c => { const y = c.L * 0.3; c.out.push(`<path d="M 50 ${y - 12} A 12 12 0 1 1 50 ${y + 12} A 15 15 0 0 0 50 ${y - 12} Z" fill="${metalGrad(c, c.col('metal'))}" transform="rotate(-25 50 ${y})"/>`); };
  R.star_parts = c => { const x = 50, y = c.L * 0.3, pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 === 0 ? 6 : 2.6; pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`); } c.out.push(`<polygon points="${pts.join(' ')}" fill="${metalGrad(c, c.col('metal'))}"/>`); };
  R.ribbon = c => {
    const x = 50, y = c.L * 0.42, a = c.col('accent'), s = darken(a, 0.2);
    c.out.push(`<ellipse cx="${x - 6}" cy="${y - 1}" rx="6.5" ry="3.6" fill="${a}" stroke="${s}" stroke-width="0.5" transform="rotate(-18 ${x - 6} ${y - 1})"/><ellipse cx="${x + 6}" cy="${y - 1}" rx="6.5" ry="3.6" fill="${a}" stroke="${s}" stroke-width="0.5" transform="rotate(18 ${x + 6} ${y - 1})"/>`);
    c.out.push(`<path d="M ${x - 1} ${y + 1} C ${x - 6} ${y + 8} ${x - 5} ${y + 14} ${x - 7} ${y + 18}" fill="none" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/><path d="M ${x + 1} ${y + 1} C ${x + 6} ${y + 8} ${x + 5} ${y + 14} ${x + 7} ${y + 18}" fill="none" stroke="${a}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="2.2" fill="${s}"/>`);
  };
  R.lace = c => {
    const y = c.L * 0.3, l = c.col('light');
    c.out.push(`<path d="${tipRegion(y)}" fill="${l}" opacity="0.3"/>`);
    let d = '';
    for (let i = 0; i < 8; i++) { const x0 = -2 + i * 14, yy = y + 9 - Math.sin((i + 0.5) / 8 * Math.PI) * 9; d += `M ${x0} ${yy} a 7 6 0 0 0 14 0 `; }
    c.out.push(`<path d="${d}" fill="none" stroke="${l}" stroke-width="1.3" opacity="0.95"/>`);
    for (let i = 0; i < 8; i++) { const x = 5 + i * 14, yy = y + 2 - Math.sin((i + 0.5) / 8 * Math.PI) * 8; c.out.push(`<circle cx="${x}" cy="${yy.toFixed(1)}" r="1.1" fill="${l}"/>`); }
    c.out.push(`<path d="${smile(y - 4)}" fill="none" stroke="${l}" stroke-width="0.8" opacity="0.8" stroke-dasharray="2 2.5"/>`);
  };
  R.drip = c => { const L = c.L, l = c.col('light'); c.out.push(`<path d="M -5 ${L + 10} L -5 ${L * 0.62} C 10 ${L * 0.58} 14 ${L * 0.48} 22 ${L * 0.5} C 30 ${L * 0.52} 28 ${L * 0.7} 40 ${L * 0.66} C 50 ${L * 0.62} 46 ${L * 0.4} 56 ${L * 0.42} C 66 ${L * 0.44} 62 ${L * 0.6} 74 ${L * 0.58} C 84 ${L * 0.56} 86 ${L * 0.66} 105 ${L * 0.64} L 105 ${L + 10} Z" fill="${l}"/>`); c.out.push(`<path d="M 22 ${L * 0.5} C 24 ${L * 0.6} 22 ${L * 0.62} 20 ${L * 0.6}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>`); };
  R.snow_dots = c => { for (let i = 0; i < 10; i++) c.out.push(`<circle cx="${(6 + c.rng() * 88).toFixed(1)}" cy="${(6 + c.rng() * (c.L - 12)).toFixed(1)}" r="${(0.8 + c.rng() * 1.9).toFixed(1)}" fill="${c.col('light')}" opacity="${(0.8 + c.rng() * 0.2).toFixed(2)}"/>`); };
  R.gemstone = c => {
    const k = c.p.kind || 'turquoise', m = c.col('metal');
    if (k === 'turquoise') { c.out.push(rect('#5FB3B3')); let s = ''; for (let i = 0; i < 5; i++) s += vein(c, '#2E6E6E', 1.2 + c.rng() * 2, 0.6, 0.5); c.out.push(s); c.out.push(vein(c, m, 0.9, 0.9, 0.2)); }
    else if (k === 'lapis') { c.out.push(rect('#22427A')); let s = ''; for (let i = 0; i < 3; i++) s += blob(c, '#3F6DB0', c.rng() * 100, c.rng() * c.L, 14, 18, 6, 0.6); c.out.push(s); c.out.push(glitterDots(c, 40, [m, lighten(m, 0.4)], 0.5, 1.4, 0, c.L)); }
    else if (k === 'rose') { c.out.push(rect('#F2CFD6')); let s = ''; for (let i = 0; i < 4; i++) s += blob(c, '#FFFFFF', c.rng() * 100, c.rng() * c.L, 14, 20, 7, 0.7); c.out.push(s); c.out.push(vein(c, '#E3A9B8', 1, 0.5, 0.8)); }
    else if (k === 'ocean') { c.out.push(rect('#1F5F7A')); let s = ''; for (let i = 0; i < 4; i++) s += blob(c, '#4D9BB8', c.rng() * 100, c.rng() * c.L, 14, 20, 7, 0.7); for (let i = 0; i < 2; i++) s += blob(c, '#0F3A4E', c.rng() * 100, c.rng() * c.L, 12, 16, 7, 0.6); c.out.push(s); c.out.push(vein(c, '#DDEFF5', 1.4, 0.7, 0.9) + vein(c, '#DDEFF5', 0.8, 0.5, 0.6)); c.out.push(glitterDots(c, 14, [m], 0.5, 1.1, 0, c.L)); }
    else if (k === 'jade') { c.out.push(rect('#7FB29A')); let s = ''; for (let i = 0; i < 3; i++) s += blob(c, '#FFFFFF', c.rng() * 100, c.rng() * c.L, 12, 16, 7, 0.5); c.out.push(s); c.out.push(vein(c, '#4F8A6E', 1.2, 0.6, 0.6)); }
    else { R.tortoise(c); }
  };
  R.aura = c => {
    c.out.push(rect(lighten(c.col('accent'), 0.75)));
    const g = c.id + 'ar', f = c.id + 'arf';
    c.defs.push(`<radialGradient id="${g}"><stop offset="0" stop-color="${c.col('accent')}" stop-opacity="0.95"/><stop offset="1" stop-color="${c.col('accent')}" stop-opacity="0"/></radialGradient><filter id="${f}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>`);
    c.out.push(`<ellipse cx="50" cy="${c.L * 0.5}" rx="38" ry="${c.L * 0.36}" fill="url(#${g})" filter="url(#${f})"/>`);
  };
  R.butterfly = c => { R.magnet(c); R.aurora(c); };

  // --- watercolor white flower (translucent petals with soft edges)
  function wcFlower(c, x, y, r, rot, op) {
    const f = c.id + 'wf' + Math.floor(c.rng() * 1e6).toString(36);
    c.defs.push(`<filter id="${f}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${(r * 0.09).toFixed(2)}"/></filter>`);
    let s = `<g transform="rotate(${rot} ${x} ${y})">`;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i + c.rng() * 10 - 5, rr = r * (0.85 + c.rng() * 0.3);
      s += `<ellipse cx="${x}" cy="${(y - rr * 0.62).toFixed(1)}" rx="${(rr * 0.36).toFixed(1)}" ry="${(rr * 0.62).toFixed(1)}" fill="#FFFFFF" opacity="${(op * 0.55).toFixed(2)}" filter="url(#${f})" transform="rotate(${a.toFixed(1)} ${x} ${y})"/>`;
      s += `<ellipse cx="${x}" cy="${(y - rr * 0.6).toFixed(1)}" rx="${(rr * 0.2).toFixed(1)}" ry="${(rr * 0.5).toFixed(1)}" fill="#FFFFFF" opacity="${(op * 0.5).toFixed(2)}" transform="rotate(${a.toFixed(1)} ${x} ${y})"/>`;
      s += `<path d="M ${x} ${(y - rr * 0.15).toFixed(1)} L ${x} ${(y - rr * 1.05).toFixed(1)}" stroke="#FFFFFF" stroke-width="0.7" opacity="${(op * 0.7).toFixed(2)}" transform="rotate(${a.toFixed(1)} ${x} ${y})"/>`;
    }
    s += `<circle cx="${x}" cy="${y}" r="${(r * 0.18).toFixed(1)}" fill="#FFFFFF" opacity="${op}"/></g>`;
    return s;
  }
  R.watercolor_flower = c => {
    const big = c.p.big !== false;
    if (big) c.out.push(wcFlower(c, 48 + c.rng() * 8, c.L * (0.42 + c.rng() * 0.1), 24, c.rng() * 40 - 20, 0.95));
    else c.out.push(wcFlower(c, 36 + c.rng() * 10, c.L * 0.36, 15, c.rng() * 40, 0.9) + wcFlower(c, 64, c.L * 0.68, 12, c.rng() * 40, 0.85));
    if (c.p.stone !== false) c.out.push(stone(c, big ? 50 : 36, big ? c.L * 0.47 : c.L * 0.36, 3.2, '#E9EEF8'));
  };
  // --- line-drawn butterfly (white outline)
  R.butterfly_line = c => {
    const x = 50 + (c.p.dx || 0), y = c.L * (c.p.y || 0.45), s = c.p.size || 1, l = c.col('light');
    const w = (d) => `<path d="${d}" fill="${l}" fill-opacity="0.14" stroke="${l}" stroke-width="1.1" stroke-linejoin="round"/>`;
    const g = `<g transform="translate(${x} ${y}) rotate(${(c.rng() * 30 - 15).toFixed(0)}) scale(${s})">` +
      w('M 0 -2 C -6 -16 -22 -16 -20 -6 C -19 0 -10 2 0 -2 Z') + w('M 0 -2 C 6 -16 22 -16 20 -6 C 19 0 10 2 0 -2 Z') +
      w('M 0 0 C -5 2 -15 10 -12 14 C -9 17 -3 10 0 0 Z') + w('M 0 0 C 5 2 15 10 12 14 C 9 17 3 10 0 0 Z') +
      `<path d="M 0 -4 L 0 8" stroke="${l}" stroke-width="1.6" stroke-linecap="round"/><path d="M -1 -5 C -4 -10 -6 -11 -7 -13 M 1 -5 C 4 -10 6 -11 7 -13" stroke="${l}" stroke-width="0.8" fill="none"/>` +
      `<path d="M -14 -8 C -12 -6 -10 -5 -8 -5 M 14 -8 C 12 -6 10 -5 8 -5" stroke="${l}" stroke-width="0.6" fill="none" opacity="0.8"/></g>`;
    c.out.push(g);
  };
  // --- gold foil along one edge
  R.gold_edge = c => {
    const m = c.col('metal'), right = (c.p.side || 'right') === 'right';
    const pts = [];
    for (let y = -4; y <= c.L + 4; y += 10) { const w = 5 + c.rng() * 9; pts.push(right ? `${(100 - w).toFixed(1)},${y}` : `${w.toFixed(1)},${y}`); }
    const d = right ? `M 106 -6 L ${pts.join(' L ')} L 106 ${c.L + 6} Z` : `M -6 -6 L ${pts.join(' L ')} L -6 ${c.L + 6} Z`;
    c.out.push(`<path d="${d}" fill="${metalGrad(c, m)}" opacity="0.92"/>`);
    c.out.push(glitterDots(c, 10, [lighten(m, 0.6)], 0.5, 1.1, 0, c.L));
  };
  // --- gold turtle charm
  R.turtle_gold = c => {
    const x = 50, y = c.L * (c.p.y || 0.48), m = c.col('metal'), g = metalGrad(c, m), dk = darken(m, 0.45);
    let s = `<g transform="translate(${x} ${y}) rotate(${c.p.rot || -15})">`;
    s += `<ellipse cx="0" cy="1.5" rx="10" ry="8" fill="rgba(0,0,0,0.18)"/>`;
    [[-9, -4, -35], [9, -4, 35], [-9, 5, 215], [9, 5, 145]].forEach(([fx, fy, a]) => { s += `<ellipse cx="${fx}" cy="${fy}" rx="4.6" ry="2.4" fill="${g}" stroke="${dk}" stroke-width="0.5" transform="rotate(${a} ${fx} ${fy})"/>`; });
    s += `<circle cx="0" cy="-10" r="3" fill="${g}" stroke="${dk}" stroke-width="0.5"/><path d="M 0 9 L -1.4 12.5 L 1.4 12.5 Z" fill="${g}"/>`;
    s += `<ellipse cx="0" cy="0" rx="8.5" ry="7" fill="${g}" stroke="${dk}" stroke-width="0.6"/>`;
    s += `<path d="M -3 -4 L 3 -4 L 5 0 L 3 4 L -3 4 L -5 0 Z M -3 -4 L -5 -8 M 3 -4 L 5 -8 M 5 0 L 9 0 M -5 0 L -9 0 M 3 4 L 5 8 M -3 4 L -5 8" fill="none" stroke="${dk}" stroke-width="0.6" opacity="0.8"/>`;
    s += `<circle cx="-1" cy="-11" r="0.5" fill="${dk}"/></g>`;
    c.out.push(s);
  };
  // --- starfish part
  R.starfish = c => {
    const x = 50 + (c.p.dx || 0), y = c.L * (c.p.y || 0.5), R0 = c.p.size || 11, col = c.p.color ? c.col(c.p.color) : c.col('accent');
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 === 0 ? R0 : R0 * 0.45; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i <= 10; i++) { const p = pts[i % 10], q = pts[(i + 1) % 10]; d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${((p[0] + q[0]) / 2).toFixed(1)} ${((p[1] + q[1]) / 2).toFixed(1)}`; }
    c.out.push(`<path d="${d} Z" fill="${col}" stroke="${darken(col, 0.25)}" stroke-width="0.6" transform="rotate(${(c.rng() * 40 - 20).toFixed(0)} ${x} ${y})"/>`);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; for (let k = 1; k <= 2; k++) c.out.push(`<circle cx="${(x + Math.cos(a) * R0 * 0.3 * k).toFixed(1)}" cy="${(y + Math.sin(a) * R0 * 0.3 * k).toFixed(1)}" r="0.8" fill="${lighten(col, 0.6)}"/>`); }
  };

  function gloss(c) {
    const f = c.id + 'gl';
    c.defs.push(`<filter id="${f}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>`);
    return `<g class="tsume-gloss"><ellipse cx="30" cy="${(c.L * 0.32).toFixed(1)}" rx="10" ry="${(c.L * 0.2).toFixed(1)}" fill="#FFFFFF" opacity="0.3" filter="url(#${f})" transform="rotate(-6 30 ${(c.L * 0.32).toFixed(1)})"/><path d="M 16 ${(c.L * 0.84).toFixed(1)} Q 12 ${(c.L * 0.55).toFixed(1)} 15 ${(c.L * 0.24).toFixed(1)}" fill="none" stroke="#FFFFFF" stroke-width="2.2" opacity="0.32" filter="url(#${f})"/></g>`;
  }

  /** spec: {t, over, c, p}; palette: {base,tip,accent,deep,light,metal}; opts: {shape, length, seed} */
  function renderNail(spec, palette, opts) {
    opts = opts || {};
    const { d, L } = nailPath(opts.shape || 'oval', opts.length || 'medium');
    const id = uid();
    const seedKey = (opts.seed || 0) + ':' + (spec.t || '') + ':' + (spec.over || '') + ':' + (opts.finger || 0);
    const rng = mulberry32(hashStr(seedKey));
    const roles = Object.assign({}, spec.c || {});
    const col = (role) => { const r = roles[role] || role; return (typeof r === 'string' && r[0] === '#') ? r : palette[r] || palette[role] || '#CCCCCC'; };
    const ctx = { L, col, rng, id, p: spec.p || {}, defs: [], out: [], matte: false };
    // nail bed
    if (!opts.print) ctx.out.push(`<rect x="-2" y="-2" width="104" height="${L + 20}" fill="#F0D2C6"/><path d="${tipRegion(Math.max(L * 0.18, L - 118))}" fill="#F7EAE3" opacity="0.9"/><ellipse cx="50" cy="${L - 10}" rx="20" ry="11" fill="#F8ECE6" opacity="0.7"/>`);
    if (spec.over && R[spec.over]) R[spec.over](ctx);
    else if (spec.t && !['one_color', 'sheer', 'peel_one', 'bare_gloss', 'sugar_matte', 'gradient', 'magnet', 'magnet_line', 'velvet', 'magnet_polish', 'mirror', 'tortoise', 'marble', 'nuance', 'cheek', 'tweed', 'aura', 'butterfly', 'gemstone', 'glitter_polish', 'glass_french', 'french', 'skinny_french'].includes(spec.t)) R.sheer(ctx);
    if (spec.t && R[spec.t]) R[spec.t](ctx);
    (spec.layers || []).forEach(layer => {
      if (!layer || !R[layer.t]) return;
      const lroles = Object.assign({}, roles, layer.c || {});
      const lctx = Object.assign({}, ctx, { p: layer.p || {}, col: (role) => { const r = lroles[role] || role; return palette[r] || palette[role] || '#CCCCCC'; } });
      R[layer.t](lctx);
      if (lctx.matte) ctx.matte = true;
    });
    if (spec.artLayer) ctx.out.push(spec.artLayer); /* アトリエの描きかけ（保存前） */
    else if (spec.art && global.TSUME.draw && global.TSUME.draw.artLayer) ctx.out.push(global.TSUME.draw.artLayer(spec.art, L));
    if (!ctx.matte && !ctx.p.matte && !opts.print) ctx.out.push(gloss(ctx));
    // なぞったときに爪の上を横切る光の帯（.stage.touching のときだけ見える。マットは光らない）
    if (!ctx.matte && !ctx.p.matte && !opts.print) ctx.out.push(`<polygon class="tsume-sheen" points="-34,0 -10,0 -46,${L} -70,${L}" fill="#FFFFFF"/>`);
    let tops = '';
    if (spec.toppings && spec.toppings.length && global.TSUME.renderToppings) {
      const r = global.TSUME.renderToppings(spec.toppings, L, { finger: opts.finger || 0 });
      tops = `<defs>${r.defs}</defs><g class="tsume-tops">${r.svg}</g>`;
    }
    return `<g class="tsume-nail"><defs><clipPath id="${id}cp"><path d="${d}"/></clipPath>${ctx.defs.join('')}</defs><g clip-path="url(#${id}cp)">${ctx.out.join('')}</g>${opts.print ? '' : `<path d="${d}" fill="none" stroke="rgba(70,30,35,0.22)" stroke-width="1.3"/>`}${tops}</g>`;
  }

  const FINGER_NAMES = ['親指', '人差し指', '中指', '薬指', '小指'];

  /** foot: 5 toes, big toe gets the accent spec */
  function renderFoot(specs, palette, opts) {
    opts = opts || {};
    const W = 320, H = 200;
    const toes = [{ w: 76, top: 40, cx: 60 }, { w: 40, top: 34, cx: 134 }, { w: 36, top: 42, cx: 184 }, { w: 32, top: 56, cx: 228 }, { w: 30, top: 76, cx: 268 }];
    // 手と同じやわらかシルエット（肌は1色、輪郭だけ）
    const SK = global.TSUME.SKINS, SKIN = (SK && (SK[opts.skin] || SK.natural)) || { base: '#F1D0BD', line: '#D4A48B' };
    const parts = [];
    toes.forEach((f, i) => {
      const spec = specs[i] || { t: 'sheer' };
      const nw = f.w * 0.74, s = nw / 100, x = f.cx - f.w / 2;
      parts.push(`<rect x="${x}" y="${f.top}" width="${f.w}" height="${H - f.top + 40}" rx="${f.w / 2}" fill="${SKIN.base}" stroke="${SKIN.line}" stroke-width="1.6"/>`);
      parts.push(`<g transform="translate(${(f.cx - nw / 2).toFixed(1)} ${(f.top + 12).toFixed(1)}) scale(${s.toFixed(4)})">${renderNail(spec, palette, { shape: 'square', length: 'short', seed: (opts.seed || 0) + 200, finger: i })}</g>`);
    });
    const flip = opts.side === 'left' ? `transform="translate(${W} 0) scale(-1 1)"` : '';
    return `<svg class="tsume-hand tsume-foot" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="フットネイル"><g ${flip}>${parts.join('')}</g></svg>`;
  }

  /** 5 nails side by side, like a salon tip chart (thumb→pinky). Same seeds as renderHand so it matches. */
  function renderChart(specs, palette, opts) {
    opts = opts || {};
    const { L } = nailPath(opts.shape || 'oval', opts.length || 'medium');
    const w = 100, gap = 16, W = 5 * w + 4 * gap, side = opts.side || 'right';
    const order = opts.mirror ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    const parts = order.map((fi, pos) => `<g data-f="${fi}" transform="translate(${pos * (w + gap)} 0)">${renderNail(specs[fi] || { t: 'sheer' }, palette, { shape: opts.shape, length: opts.length, seed: (opts.seed || 0) + (side === 'left' ? 100 : 0), finger: fi })}</g>`);
    return `<svg class="tsume-chart" viewBox="-8 -8 ${W + 16} ${L + 18}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="チップ見本">${parts.join('')}</svg>`;
  }

  function renderSwatch(spec, palette, opts) {
    opts = opts || {};
    const { L } = nailPath(opts.shape || 'oval', opts.length || 'medium');
    return `<svg class="tsume-swatch" viewBox="-8 -8 116 ${L + 18}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${renderNail(spec, palette, { shape: opts.shape || 'oval', length: opts.length || 'medium', seed: opts.seed || 7, finger: opts.finger || 0 })}</svg>`;
  }

  function renderShapeIcon(shape, length) {
    const { d, L } = nailPath(shape, length || 'medium');
    return `<svg viewBox="-6 -6 112 ${L + 12}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="${d}" fill="currentColor" fill-opacity="0.08" stroke="currentColor" stroke-width="2.5"/></svg>`;
  }

  global.TSUME = global.TSUME || {};
  Object.assign(global.TSUME, { renderNail, renderFoot, renderChart, renderSwatch, renderShapeIcon, nailPath, nailHalf, NAIL_LEN: LEN, FINGER_NAMES, colorUtil: { mix, darken, lighten, rgba, lum, hexToRgb } });
})(typeof window !== 'undefined' ? window : globalThis);
