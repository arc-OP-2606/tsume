/* tsumé — トッピング（パーツ）の立体描画。爪座標 100 × L、item の x・y は 0〜1（y 0 = 先端） */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const D = T.TOPPINGS;
  const { mix, darken, lighten } = T.colorUtil;
  let n = 0;
  const uid = () => 'tp' + (n++).toString(36);
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const STAR4 = 'M 0 -1 C 0.14 -0.14 0.14 -0.14 1 0 C 0.14 0.14 0.14 0.14 0 1 C -0.14 0.14 -0.14 0.14 -1 0 C -0.14 -0.14 -0.14 -0.14 0 -1 Z';
  const LIGHT_ANGLE = -135 * Math.PI / 180;
  const shade = phi => (1 + Math.cos(phi - LIGHT_ANGLE)) / 2;
  const metalHex = v => (D.METALS[v] || D.METALS.gold).hex;

  function shadowGrad(defs, id) { defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="#2A1214" stop-opacity="0.42"/><stop offset="0.6" stop-color="#2A1214" stop-opacity="0.18"/><stop offset="1" stop-color="#2A1214" stop-opacity="0"/></radialGradient>`); return `url(#${id})`; }
  function metalGrad(defs, id, m) {
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(m, 0.78)}"/><stop offset="0.3" stop-color="${lighten(m, 0.22)}"/><stop offset="0.56" stop-color="${darken(m, 0.22)}"/><stop offset="0.8" stop-color="${m}"/><stop offset="1" stop-color="${lighten(m, 0.55)}"/></linearGradient>`);
    return `url(#${id})`;
  }
  // 光る星: 位置と大きさは外側の g、CSS のアニメーションは内側の path（transform 属性と CSS がぶつからないように）
  const glint = (x, y, s, delay) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s)})"><path class="tsume-glint" d="${STAR4}" fill="#FFFFFF" style="animation-delay:${delay.toFixed(2)}s"/></g>`;

  function stone(defs, r, v, delay) {
    const c = D.STONES[v] || D.STONES.clear, id = uid();
    defs.push(`<radialGradient id="${id}b" cx="0.42" cy="0.38" r="0.72"><stop offset="0" stop-color="${c.light}"/><stop offset="0.55" stop-color="${c.base}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient>`);
    let s = `<ellipse cx="${f1(r * 0.14)}" cy="${f1(r * 0.34)}" rx="${f1(r * 1.25)}" ry="${f1(r * 1.1)}" fill="${shadowGrad(defs, id + 's')}"/>`;
    s += `<circle r="${f1(r)}" fill="url(#${id}b)"/>`;
    const rt = r * 0.5, AB = ['#FF9CC6', '#9CD6FF', '#FFF0A0', '#B4F2C8', '#D9B4FF', '#FFC9A0', '#A0F0F0', '#FFB0D8'];
    const P = (a, rad) => [Math.cos(a) * rad, Math.sin(a) * rad];
    const pts = arr => arr.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
    for (let k = 0; k < 8; k++) {
      const a0 = k * Math.PI / 4, a1 = (k + 1) * Math.PI / 4, am = a0 + Math.PI / 8;
      const t0 = P(a0, rt), t1 = P(a1, rt), g = P(am, r), gPrev = P(am - Math.PI / 4, r);
      s += `<polygon points="${pts([t0, t1, g])}" fill="${mix(c.dark, c.light, shade(am))}" opacity="0.62"/>`;
      s += `<polygon points="${pts([gPrev, t0, g])}" fill="${mix(c.dark, c.light, 1 - shade(a0) * 0.8)}" opacity="0.42"/>`;
      if (c.ab) s += `<polygon points="${pts([t0, t1, g])}" fill="${AB[k]}" opacity="0.5"/>`;
    }
    s += `<polygon points="${pts(Array.from({ length: 8 }, (_, k) => P(k * Math.PI / 4, rt)))}" fill="${c.light}" opacity="0.38"/>`;
    s += `<polygon points="${f1(-rt * 0.7)},${f1(-rt * 0.15)} ${f1(-rt * 0.15)},${f1(-rt * 0.7)} ${f1(rt * 0.05)},${f1(-rt * 0.45)} ${f1(-rt * 0.45)},${f1(rt * 0.05)}" fill="#FFFFFF" opacity="0.85"/>`;
    s += `<circle r="${f1(r)}" fill="none" stroke="${c.dark}" stroke-width="${f1(Math.max(0.5, r * 0.06))}" opacity="0.55"/>`;
    s += glint(-r * 0.42, -r * 0.46, r * 0.8, delay);
    return s;
  }

  function pearl(defs, r, v) {
    const c = D.PEARLS[v] || D.PEARLS.white, id = uid();
    defs.push(`<radialGradient id="${id}b" cx="0.36" cy="0.3" r="0.78"><stop offset="0" stop-color="${c.c0}"/><stop offset="0.5" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></radialGradient><linearGradient id="${id}i" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC6DA"/><stop offset="0.5" stop-color="#C6E2FF"/><stop offset="1" stop-color="#FFF0C2"/></linearGradient>`);
    let s = `<ellipse cx="${f1(r * 0.12)}" cy="${f1(r * 0.36)}" rx="${f1(r * 1.2)}" ry="${f1(r * 1.05)}" fill="${shadowGrad(defs, id + 's')}"/>`;
    s += `<circle r="${f1(r)}" fill="url(#${id}b)"/>`;
    s += `<circle r="${f1(r * 0.9)}" fill="none" stroke="url(#${id}i)" stroke-width="${f1(r * 0.14)}" opacity="0.45"/>`;
    s += `<ellipse cx="${f1(-r * 0.34)}" cy="${f1(-r * 0.36)}" rx="${f1(r * 0.3)}" ry="${f1(r * 0.19)}" fill="#FFFFFF" opacity="0.95" transform="rotate(-35 ${f1(-r * 0.34)} ${f1(-r * 0.36)})"/>`;
    s += `<ellipse cx="${f1(r * 0.22)}" cy="${f1(r * 0.42)}" rx="${f1(r * 0.38)}" ry="${f1(r * 0.18)}" fill="#FFFFFF" opacity="0.2"/>`;
    return s;
  }

  // メタルパーツの形（単位空間 -1〜1）
  function moonPath() {
    const r1 = 1, cx2 = 0.46, cy2 = -0.26, r2 = 0.86;
    const d = Math.hypot(cx2, cy2), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(r1 * r1 - a * a);
    const ux = cx2 / d, uy = cy2 / d, px = ux * a, py = uy * a;
    const P1 = [px - uy * h, py + ux * h], P2 = [px + uy * h, py - ux * h];
    return `M ${f1(P1[0])} ${f1(P1[1])} A 1 1 0 1 1 ${f1(P2[0])} ${f1(P2[1])} A ${r2} ${r2} 0 1 0 ${f1(P1[0])} ${f1(P1[1])} Z`;
  }
  function starPts(R0, r0) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 === 0 ? R0 : r0; pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    return pts;
  }
  const SHAPES = {
    heart: { d: 'M 0 0.92 C -1.25 0.05 -0.78 -1.05 0 -0.42 C 0.78 -1.05 1.25 0.05 0 0.92 Z' },
    moon: { d: moonPath() },
    ribbon: { d: 'M -0.06 -0.02 C -0.4 -0.62 -1.1 -0.66 -1.05 -0.06 C -1.0 0.44 -0.42 0.3 -0.06 0.06 Z M 0.06 -0.02 C 0.4 -0.62 1.1 -0.66 1.05 -0.06 C 1.0 0.44 0.42 0.3 0.06 0.06 Z M -0.12 0.12 L -0.5 0.98 L -0.26 0.86 L -0.08 1.02 L 0.02 0.18 Z M 0.12 0.12 L 0.5 0.98 L 0.26 0.86 L 0.08 1.02 L -0.02 0.18 Z', knot: true },
    butterfly: { d: 'M -0.04 -0.06 C -0.32 -0.95 -1.12 -0.98 -0.98 -0.36 C -0.88 0.06 -0.36 0.06 -0.04 -0.02 Z M -0.04 0.04 C -0.36 0.08 -0.86 0.28 -0.66 0.72 C -0.46 0.98 -0.12 0.52 -0.04 0.06 Z M 0.04 -0.06 C 0.32 -0.95 1.12 -0.98 0.98 -0.36 C 0.88 0.06 0.36 0.06 0.04 -0.02 Z M 0.04 0.04 C 0.36 0.08 0.86 0.28 0.66 0.72 C 0.46 0.98 0.12 0.52 0.04 0.06 Z', body: true },
    shell: { d: 'M 0 0.86 L -0.3 0.62 L -0.94 -0.06 C -0.8 -0.78 0.8 -0.78 0.94 -0.06 L 0.3 0.62 Z', ribs: true },
    flower: { petals: true },
    star: { star: true },
    turtle: { turtle: true },
  };

  function charm(defs, size, shape, v, delay) {
    const m = metalHex(v), id = uid(), sh = SHAPES[shape] || SHAPES.star, S = size;
    const g = metalGrad(defs, id + 'm', m), dk = darken(m, 0.5);
    const body = inner => {
      const sil = inner.replace(/fill="[^"]*"/g, 'fill="#2A1214"').replace(/stroke="[^"]*"/g, 'stroke="#2A1214"');
      return `<g transform="translate(${f1(S * 0.1)} ${f1(S * 0.2)}) scale(${f1(S * 1.04)})" opacity="0.13">${sil}</g><g transform="translate(${f1(S * 0.05)} ${f1(S * 0.1)}) scale(${f1(S)})" opacity="0.2">${sil}</g><g transform="scale(${f1(S)})">${inner}</g>`;
    };
    let s = '';
    if (sh.star) {
      const p = starPts(1, 0.46);
      let d = `M ${f1(p[0][0])} ${f1(p[0][1])}`; for (let i = 1; i < 10; i++) d += ` L ${f1(p[i][0])} ${f1(p[i][1])}`; d += ' Z';
      let facets = '';
      for (let i = 0; i < 10; i++) { const a = p[i], b = p[(i + 1) % 10], phi = Math.atan2((a[1] + b[1]) / 2, (a[0] + b[0]) / 2); facets += `<polygon points="0,0 ${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])}" fill="${mix(darken(m, 0.45), lighten(m, 0.7), shade(phi) * (i % 2 ? 0.75 : 1))}"/>`; }
      s += body(`${facets}<path d="${d}" fill="none" stroke="${dk}" stroke-width="0.06" stroke-linejoin="round"/>`);
    } else if (sh.petals) {
      let p = '';
      for (let i = 0; i < 5; i++) p += `<ellipse cx="0" cy="-0.52" rx="0.36" ry="0.5" fill="${g}" stroke="${dk}" stroke-width="0.05" transform="rotate(${i * 72})"/>`;
      p += `<circle r="0.28" fill="${lighten(m, 0.3)}" stroke="${dk}" stroke-width="0.05"/><circle cx="-0.08" cy="-0.08" r="0.1" fill="#FFFFFF" opacity="0.8"/>`;
      s += body(p);
    } else if (sh.turtle) {
      let t = '';
      [[-0.72, -0.42, -35], [0.72, -0.42, 35], [-0.7, 0.5, 215], [0.7, 0.5, 145]].forEach(([fx, fy, a]) => { t += `<ellipse cx="${fx}" cy="${fy}" rx="0.36" ry="0.2" fill="${g}" stroke="${dk}" stroke-width="0.05" transform="rotate(${a} ${fx} ${fy})"/>`; });
      t += `<circle cx="0" cy="-0.9" r="0.26" fill="${g}" stroke="${dk}" stroke-width="0.05"/><path d="M 0 0.78 L -0.12 1.06 L 0.12 1.06 Z" fill="${g}"/>`;
      t += `<ellipse cx="0" cy="0" rx="0.7" ry="0.6" fill="${g}" stroke="${dk}" stroke-width="0.06"/>`;
      t += `<path d="M -0.24 -0.34 L 0.24 -0.34 L 0.4 0 L 0.24 0.34 L -0.24 0.34 L -0.4 0 Z M -0.24 -0.34 L -0.4 -0.62 M 0.24 -0.34 L 0.4 -0.62 M 0.4 0 L 0.7 0 M -0.4 0 L -0.7 0 M 0.24 0.34 L 0.4 0.62 M -0.24 0.34 L -0.4 0.62" fill="none" stroke="${dk}" stroke-width="0.05" opacity="0.8"/>`;
      t += `<path d="M -0.42 -0.34 Q -0.2 -0.56 0.1 -0.5" fill="none" stroke="#FFFFFF" stroke-width="0.07" opacity="0.7" stroke-linecap="round"/>`;
      s += body(t);
    } else {
      let b = `<path d="${sh.d}" fill="${g}" stroke="${dk}" stroke-width="0.06" stroke-linejoin="round"/>`;
      if (sh.ribs) for (let i = -3; i <= 3; i++) b += `<path d="M 0 0.8 L ${f1(i * 0.27)} ${f1(-0.6 + Math.abs(i) * 0.06)}" stroke="${dk}" stroke-width="0.04" opacity="0.7"/>`;
      if (sh.knot) b += `<ellipse cx="0" cy="0.04" rx="0.2" ry="0.24" fill="${g}" stroke="${dk}" stroke-width="0.05"/>`;
      if (sh.body) b += `<ellipse cx="0" cy="0.02" rx="0.07" ry="0.5" fill="${darken(m, 0.2)}"/><path d="M -0.03 -0.46 Q -0.18 -0.78 -0.3 -0.86 M 0.03 -0.46 Q 0.18 -0.78 0.3 -0.86" fill="none" stroke="${dk}" stroke-width="0.04"/>`;
      b += `<path d="${sh.d}" fill="none" stroke="#FFFFFF" stroke-width="0.07" opacity="0.38" transform="translate(-0.04 -0.05) scale(0.9)"/>`;
      s += body(b);
    }
    s += glint(-S * 0.42, -S * 0.46, S * 0.36, delay);
    return s;
  }

  function stud(defs, size, kind, v) {
    const m = metalHex(v), id = uid(), S = size;
    let s = `<ellipse cx="${f1(S * 0.12)}" cy="${f1(S * 0.3)}" rx="${f1(S * 1.2)}" ry="${f1(S * 1.05)}" fill="${shadowGrad(defs, id + 's')}"/>`;
    if (kind === 'round' || !kind) {
      defs.push(`<radialGradient id="${id}d" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="${lighten(m, 0.8)}"/><stop offset="0.45" stop-color="${m}"/><stop offset="1" stop-color="${darken(m, 0.45)}"/></radialGradient>`);
      s += `<circle r="${f1(S)}" fill="url(#${id}d)" stroke="${darken(m, 0.5)}" stroke-width="0.5"/>`;
    } else {
      const k = kind === 'triangle' ? 3 : 4, p = [];
      for (let i = 0; i < k; i++) { const a = -Math.PI / 2 + (kind === 'square' ? Math.PI / 4 : 0) + i * 2 * Math.PI / k; p.push([Math.cos(a) * S * 1.15, Math.sin(a) * S * 1.15]); }
      for (let i = 0; i < k; i++) { const a = p[i], b = p[(i + 1) % k], phi = Math.atan2((a[1] + b[1]) / 2, (a[0] + b[0]) / 2); s += `<polygon points="0,0 ${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])}" fill="${mix(darken(m, 0.45), lighten(m, 0.75), shade(phi))}" stroke="${darken(m, 0.5)}" stroke-width="0.4" stroke-linejoin="round"/>`; }
    }
    return s;
  }

  function bijou(defs, size, v, delay) {
    const col = (D.BIJOUX[v] || D.BIJOUX.emerald).hex, id = uid(), S = size, rx = S, ry = S * 1.3, gold = D.METALS.gold.hex;
    defs.push(`<radialGradient id="${id}b" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="${lighten(col, 0.65)}"/><stop offset="0.55" stop-color="${col}"/><stop offset="1" stop-color="${darken(col, 0.5)}"/></radialGradient>`);
    const g = metalGrad(defs, id + 'm', gold);
    let s = `<ellipse cx="${f1(S * 0.14)}" cy="${f1(S * 0.38)}" rx="${f1(rx * 1.35)}" ry="${f1(ry * 1.25)}" fill="${shadowGrad(defs, id + 's')}"/>`;
    s += `<ellipse rx="${f1(rx * 1.16)}" ry="${f1(ry * 1.12)}" fill="${g}" stroke="${darken(gold, 0.5)}" stroke-width="0.5"/>`;
    s += `<ellipse rx="${f1(rx)}" ry="${f1(ry)}" fill="url(#${id}b)"/>`;
    for (let k = 0; k < 10; k++) {
      const a0 = k * Math.PI / 5, a1 = (k + 1) * Math.PI / 5, am = (a0 + a1) / 2;
      const p0 = [Math.cos(a0) * rx * 0.5, Math.sin(a0) * ry * 0.5], p1 = [Math.cos(a1) * rx * 0.5, Math.sin(a1) * ry * 0.5], q = [Math.cos(am) * rx, Math.sin(am) * ry];
      s += `<polygon points="${f1(p0[0])},${f1(p0[1])} ${f1(p1[0])},${f1(p1[1])} ${f1(q[0])},${f1(q[1])}" fill="${mix(darken(col, 0.45), lighten(col, 0.7), shade(am))}" opacity="0.55"/>`;
    }
    s += `<ellipse rx="${f1(rx * 0.5)}" ry="${f1(ry * 0.5)}" fill="${lighten(col, 0.35)}" opacity="0.55"/>`;
    [[-0.78, -0.82], [0.78, -0.82], [-0.78, 0.82], [0.78, 0.82]].forEach(([px, py]) => { s += `<circle cx="${f1(px * rx)}" cy="${f1(py * ry)}" r="${f1(S * 0.2)}" fill="${g}" stroke="${darken(gold, 0.5)}" stroke-width="0.3"/>`; });
    s += glint(-rx * 0.4, -ry * 0.44, S * 0.62, delay);
    return s;
  }

  function flower3d(defs, size, v) {
    const id = uid(), S = size, tint = (D.FLOWERS[v] || D.FLOWERS.white).tint;
    defs.push(`<radialGradient id="${id}p" cx="0.5" cy="0.85" r="0.9"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#FFFFFF"/><stop offset="1" stop-color="${tint}"/></radialGradient>`);
    let s = `<ellipse cx="${f1(S * 0.12)}" cy="${f1(S * 0.3)}" rx="${f1(S * 1.25)}" ry="${f1(S * 1.12)}" fill="${shadowGrad(defs, id + 's')}"/>`;
    for (let i = 0; i < 5; i++) s += `<g transform="rotate(${i * 72})"><ellipse cx="0" cy="${f1(-S * 0.55)}" rx="${f1(S * 0.42)}" ry="${f1(S * 0.6)}" fill="url(#${id}p)" stroke="${darken(tint, 0.15)}" stroke-width="0.35"/><path d="M 0 ${f1(-S * 0.18)} L 0 ${f1(-S * 0.9)}" stroke="${darken(tint, 0.1)}" stroke-width="0.3" opacity="0.6"/></g>`;
    s += pearl(defs, S * 0.26, 'cream');
    return s;
  }

  function chain(defs, size, v) {
    const m = metalHex(v), g = metalGrad(defs, uid() + 'm', m), S = size;
    let s = '';
    for (let i = -3; i <= 3; i++) {
      const x = i * S * 0.52;
      s += i % 2 === 0 ? `<ellipse cx="${f1(x)}" cy="0" rx="${f1(S * 0.34)}" ry="${f1(S * 0.2)}" fill="none" stroke="${g}" stroke-width="${f1(S * 0.1)}"/>` : `<ellipse cx="${f1(x)}" cy="0" rx="${f1(S * 0.3)}" ry="${f1(S * 0.1)}" fill="none" stroke="${darken(m, 0.25)}" stroke-width="${f1(S * 0.09)}"/>`;
    }
    return `<g transform="translate(${f1(S * 0.06)} ${f1(S * 0.14)})" opacity="0.35">${s.replace(/stroke="[^"]*"/g, 'stroke="#2A1214"')}</g>${s}`;
  }

  function bullion(defs, size, v) {
    const m = metalHex(v), id = uid();
    defs.push(`<radialGradient id="${id}d" cx="0.35" cy="0.32" r="0.75"><stop offset="0" stop-color="${lighten(m, 0.85)}"/><stop offset="0.5" stop-color="${m}"/><stop offset="1" stop-color="${darken(m, 0.45)}"/></radialGradient>`);
    let s = '';
    for (let i = 0; i < 9; i++) { const t = i / 8, x = (t - 0.5) * size * 4.6, y = -Math.sin(t * Math.PI) * size * 0.7; s += `<circle cx="${f1(x + 0.4)}" cy="${f1(y + 0.8)}" r="${f1(size * 0.32)}" fill="#2A1214" opacity="0.22"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(size * 0.3)}" fill="url(#${id}d)"/>`; }
    return s;
  }

  // シール: 平らな形に白いふち（型抜き）と、うすい影。キラッとは光らない。単位空間 -1〜1
  function stickerArt(motif, col) {
    const lt = lighten(col, 0.55), dk = darken(col, 0.35);
    switch (motif) {
      case 'ribbon': return `<path d="${SHAPES.ribbon.d}" fill="${col}"/><ellipse cx="0" cy="0.04" rx="0.2" ry="0.24" fill="${dk}"/>`;
      case 'heart': return `<path d="${SHAPES.heart.d}" fill="${col}"/><ellipse cx="-0.34" cy="-0.3" rx="0.16" ry="0.1" fill="${lt}" transform="rotate(-30 -0.34 -0.3)"/>`;
      case 'star': { const p = starPts(1, 0.46); return `<polygon points="${p.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${col}" stroke="${col}" stroke-width="0.12" stroke-linejoin="round"/>`; }
      case 'flower': return [0, 1, 2, 3, 4].map(i => `<circle cx="${f1(Math.cos(-Math.PI / 2 + i * 1.2566) * 0.5)}" cy="${f1(Math.sin(-Math.PI / 2 + i * 1.2566) * 0.5)}" r="0.42" fill="${col}"/>`).join('') + `<circle r="0.3" fill="#F6D77A"/>`;
      case 'fish': return `<path d="M 0.38 0 L 0.98 -0.46 L 0.98 0.46 Z" fill="${dk}"/><ellipse cx="-0.12" cy="0" rx="0.64" ry="0.44" fill="${col}"/><circle cx="-0.46" cy="-0.08" r="0.08" fill="#2B2226"/><path d="M 0.02 -0.3 Q 0.16 0 0.02 0.3" fill="none" stroke="${lt}" stroke-width="0.07"/>`;
      case 'shell': return `<path d="${SHAPES.shell.d}" fill="${col}"/>` + [-2, -1, 0, 1, 2].map(i => `<path d="M 0 0.78 L ${f1(i * 0.3)} -0.5" stroke="${lt}" stroke-width="0.06"/>`).join('');
      case 'starfish': { const p = starPts(1, 0.42); return `<polygon points="${p.map(q => f1(q[0]) + ',' + f1(q[1])).join(' ')}" fill="${col}" stroke="${col}" stroke-width="0.26" stroke-linejoin="round"/>` + [[0, -0.5], [0.45, -0.12], [0.28, 0.42], [-0.28, 0.42], [-0.45, -0.12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.07" fill="${lt}"/>`).join(''); }
      case 'hibiscus': return [0, 1, 2, 3, 4].map(i => `<ellipse cx="0" cy="-0.5" rx="0.38" ry="0.52" fill="${col}" transform="rotate(${i * 72})"/>`).join('') + `<circle r="0.2" fill="${dk}"/><path d="M 0 0 L 0.32 -0.52" stroke="#F6D77A" stroke-width="0.07"/><circle cx="0.34" cy="-0.56" r="0.08" fill="#F6D77A"/>`;
      case 'leaf': return `<path d="M 0 1 C -0.9 0.32 -0.78 -0.62 0 -1 C 0.78 -0.62 0.9 0.32 0 1 Z" fill="${col}"/><path d="M 0 0.92 L 0 -0.82 M 0 0.3 L -0.42 -0.02 M 0 0.3 L 0.42 -0.02 M 0 -0.18 L -0.34 -0.46 M 0 -0.18 L 0.34 -0.46" fill="none" stroke="${lt}" stroke-width="0.07" stroke-linecap="round"/>`;
      case 'paw': return `<ellipse cx="0" cy="0.34" rx="0.44" ry="0.36" fill="${col}"/>` + [[-0.52, -0.14], [-0.19, -0.48], [0.19, -0.48], [0.52, -0.14]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="0.17" ry="0.21" fill="${col}"/>`).join('');
      case 'cherry': return `<path d="M -0.3 0.18 Q -0.12 -0.36 0.14 -0.78 M 0.32 0.28 Q 0.24 -0.3 0.14 -0.78" fill="none" stroke="#5E8F4E" stroke-width="0.08" stroke-linecap="round"/><path d="M 0.14 -0.78 C 0.4 -0.98 0.72 -0.82 0.8 -0.62 C 0.5 -0.56 0.3 -0.62 0.14 -0.78 Z" fill="#7DB36A"/><circle cx="-0.32" cy="0.44" r="0.32" fill="${col}"/><circle cx="0.34" cy="0.54" r="0.32" fill="${col}"/><circle cx="-0.42" cy="0.34" r="0.08" fill="${lt}"/>`;
      case 'lace': return [-3, -2, -1, 0, 1, 2, 3].map(k => `<circle cx="${f1(k * 0.28)}" cy="${f1(0.1 + Math.abs(k) * 0.04)}" r="0.17" fill="none" stroke="${col}" stroke-width="0.07"/><circle cx="${f1(k * 0.28)}" cy="${f1(0.1 + Math.abs(k) * 0.04)}" r="0.05" fill="${col}"/>`).join('') + `<path d="M -0.98 -0.16 Q 0 -0.04 0.98 -0.16" fill="none" stroke="${col}" stroke-width="0.09"/>`;
      default: return `<circle r="0.8" fill="${col}"/>`;
    }
  }
  function sticker(defs, size, motif, col) {
    const S = size, art = stickerArt(motif, col || '#F2B7C6');
    const flat = c => art.replace(/fill="(?!none)[^"]*"/g, `fill="${c}"`).replace(/stroke="[^"]*"/g, `stroke="${c}"`);
    const edge = `<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="0.24" stroke-linejoin="round">${flat('#FFFFFF')}</g>`;
    return `<g transform="translate(${f1(S * 0.05)} ${f1(S * 0.09)}) scale(${f1(S)})" opacity="0.16">${flat('#2A1214')}</g><g transform="scale(${f1(S)})">${edge}${art}</g>`;
  }
  // ホログラム（小さなハート・星）。虹色のうすい膜
  function flake(defs, size, v) {
    const id = uid();
    defs.push(`<linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC4E1"/><stop offset="0.35" stop-color="#C4E4FF"/><stop offset="0.7" stop-color="#FFF4B8"/><stop offset="1" stop-color="#D9C4FF"/></linearGradient>`);
    const d = v === 'star' ? `M ${starPts(1, 0.46).map(q => f1(q[0]) + ' ' + f1(q[1])).join(' L ')} Z` : SHAPES.heart.d;
    return `<g transform="scale(${f1(size)})"><path d="${d}" fill="url(#${id}h)" stroke="#FFFFFF" stroke-width="0.14" stroke-linejoin="round"/></g>`;
  }

  /** パーツ1個 → SVG（外側の g は CSS の演出用、内側の g が位置と回転） */
  function renderTopping(item, L, defs, idx, delayIdx) {
    const kd = D.KINDS[item.k]; if (!kd) return '';
    const x = (item.x == null ? 0.5 : item.x) * 100, y = (item.y == null ? 0.5 : item.y) * L;
    const size = kd.unit * (typeof item.z === 'number' && isFinite(item.z) ? item.z : D.SIZES[item.s || 'M'] || 1), delay = ((delayIdx || 0) * 0.37) % 2.6;
    let inner = '';
    switch (item.k) {
      case 'stone': inner = stone(defs, size, item.v, delay); break;
      case 'pearl': inner = pearl(defs, size, item.v); break;
      case 'charm': inner = charm(defs, size, item.shape || 'star', item.v, delay); break;
      case 'stud': inner = stud(defs, size, item.shape || 'round', item.v); break;
      case 'bijou': inner = bijou(defs, size, item.v, delay); break;
      case 'flower3d': inner = flower3d(defs, size, item.v); break;
      case 'chain': inner = chain(defs, size, item.v); break;
      case 'bullion': inner = bullion(defs, size, item.v); break;
      case 'sticker': inner = sticker(defs, size, item.v, item.col); break;
      case 'flake': inner = flake(defs, size, item.v); break;
      case 'photo': inner = T.scan ? T.scan.partSvg(item, size / kd.unit, defs) : ''; break;
    }
    return `<g class="tsume-top" data-i="${idx}" data-k="${item.k}"><g class="tsume-top-pos" transform="translate(${f1(x)} ${f1(y)}) rotate(${item.r || 0})">${inner}</g></g>`;
  }

  function renderToppings(items, L, opts) {
    const defs = [], base = ((opts && opts.finger) || 0) * 3;
    const svg = items.map((it, i) => renderTopping(it, L, defs, i, base + i)).join('');
    return { defs: defs.join(''), svg };
  }
  function partSwatch(item, box) {
    const defs = [], g = renderTopping(Object.assign({ x: 0, y: 0 }, item), 1, defs, 0, 1);
    return `<svg class="tsume-part" viewBox="${-box} ${-box} ${box * 2} ${box * 2}" aria-hidden="true" style="overflow:visible"><defs>${defs.join('')}</defs>${g}</svg>`;
  }
  Object.assign(T, { renderToppings, partSwatch });
})(typeof window !== 'undefined' ? window : globalThis);
