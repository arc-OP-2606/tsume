/* tsumé — 表紙の「爪の花」。季節の色のチップ20枚と、パール・ストーン */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const P0 = { base: '#F3E8E4', tip: '#C8A96A', accent: '#C9808A', deep: '#7A6B6F', light: '#FFFFFF', metal: '#C8A96A' };
  const SETS = {
    spring: { outer: [['sheer', { base: '#F8E8E6' }], ['one_color', { base: '#F4CDD4' }], ['magnet', { base: '#EBB2C0', light: '#FBE6EC' }], ['one_color', { base: '#E7A3B3' }], ['glass_french', { base: '#F6EDE9', tip: '#E9B9C6' }], ['one_color', { base: '#E3D3EE' }], ['magnet', { base: '#CDB6E2', light: '#F1E6FA' }], ['sheer', { base: '#EAE0F3' }], ['one_color', { base: '#D8E7D0' }], ['aurora', {}], ['mirror', { metal: '#E3C9C9' }], ['marble', { base: '#FBF4EF', deep: '#D9B9C0' }]], stone: 'pink', metal: 'rose' },
    summer: { outer: [['sheer', { base: '#EAF5F6' }], ['glass_french', { base: '#F2F8F8', tip: '#9ED3D3' }], ['magnet', { base: '#9ED3D3', light: '#E2F6F6' }], ['one_color', { base: '#5FB3B3' }], ['magnet', { base: '#2B4C7E', light: '#9BB8E6' }], ['one_color', { base: '#1F3A63' }], ['aurora', {}], ['one_color', { base: '#F7A1A1' }], ['sheer', { base: '#FFE8D6' }], ['one_color', { base: '#FFE27A' }], ['mirror', { metal: '#C9CCD4' }], ['marble', { base: '#F5F0E6', deep: '#9FB7C2' }]], stone: 'blue', metal: 'silver' },
    autumn: { outer: [['sheer', { base: '#F3E4DA' }], ['one_color', { base: '#E5BDB0' }], ['magnet', { base: '#C98E92', light: '#F6D9DA' }], ['one_color', { base: '#B4697A' }], ['magnet', { base: '#8E3B4E', light: '#EBAFBC' }], ['velvet', { base: '#6A2131', light: '#D99FAB' }], ['one_color', { base: '#4A2433' }], ['tortoise', { base: '#B07A4E', deep: '#4A2A1C', accent: '#7A4A2C' }], ['one_color', { base: '#B9814F' }], ['magnet', { base: '#C79A3E', light: '#F7E3A6' }], ['mirror', { metal: '#C8A96A' }], ['marble', { base: '#F1E6D8', deep: '#B9A48C' }]], stone: 'champagne', metal: 'gold' },
    winter: { outer: [['sheer', { base: '#F4F1EC' }], ['one_color', { base: '#E9E4DC' }], ['velvet', { base: '#8C1F2F', light: '#E39AA6' }], ['one_color', { base: '#8C1F2F' }], ['magnet', { base: '#5A1622', light: '#D98C98' }], ['one_color', { base: '#2E4A3F' }], ['velvet', { base: '#22382F', light: '#8FB8A4' }], ['one_color', { base: '#3B2F3A' }], ['magnet', { base: '#B9C7D6', light: '#F2F6FA' }], ['one_color', { base: '#DCE4EC' }], ['mirror', { metal: '#C8A96A' }], ['marble', { base: '#F7F5F2', deep: '#B8B4B0' }]], stone: 'clear', metal: 'gold' },
  };
  const INNER = [['glass_french', { base: '#F6EDE9', tip: '#E9C9C4' }], ['lame_grad', { metal: '#C8A96A' }], ['sheer', { base: '#F2D6D0' }], ['skinny_french', { base: '#F3E4DC', tip: '#C8A96A' }], ['glass_french', { base: '#F6EDE9', tip: '#D9B7B9' }], ['lame_grad', { metal: '#D9B7B9' }], ['sheer', { base: '#EED3C9' }], ['skinny_french', { base: '#F3E4DC', tip: '#B4697A' }]];
  function tops(set) {
    const L3 = T.TOPPINGS.LAYOUTS.three.items;
    return {
      0: [{ k: 'pearl', v: 'white', s: 'M', x: 0.5, y: 0.8 }], 2: [{ k: 'stone', v: 'aurora', s: 'M', x: 0.5, y: 0.8 }],
      4: L3.map(it => Object.assign({ k: 'stone', v: set.stone }, it)), 6: [{ k: 'charm', shape: 'star', v: set.metal, s: 'S', x: 0.5, y: 0.76 }],
      8: [{ k: 'pearl', v: 'cream', s: 'M', x: 0.5, y: 0.8 }], 10: [{ k: 'stone', v: 'clear', s: 'M', x: 0.5, y: 0.78 }], 11: [{ k: 'bullion', v: set.metal, s: 'S', x: 0.5, y: 0.86 }],
    };
  }
  // ことばの色で咲く花（1〜3色を、塗り方を変えながら12枚に配る）
  function colorSet(colors) {
    const C = T.colorUtil, at = i => colors[i % colors.length];
    const outer = Array.from({ length: 12 }, (_, i) => {
      const c = at(i), base = [C.mix(c, '#FFFFFF', 0.45), c, C.darken(c, 0.12)][i % 3], t = ['sheer', 'one_color', 'magnet', 'one_color', 'glass_french', 'one_color'][i % 6];
      return t === 'magnet' ? [t, { base: c, light: C.mix(c, '#FFFFFF', 0.75) }] : t === 'glass_french' ? [t, { base: C.mix(c, '#FFFFFF', 0.8), tip: c }] : [t, { base }];
    });
    const warm = colors.some(c => { const n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return r > b + 20 && r >= g; });
    return { outer, stone: warm ? 'champagne' : 'aurora', metal: warm ? 'gold' : 'silver' };
  }
  function renderBloom(season, opts) {
    const cs = opts && Array.isArray(opts.colors) ? opts.colors.filter(c => /^#[0-9a-fA-F]{6}$/.test(c)) : [];
    const set = cs.length ? colorSet(cs) : SETS[season] || SETS.autumn, size = (opts && opts.size) || 340, TP = tops(set);
    const petal = (t, pal, a, shape, len, w, r0, seed, i, tp) => {
      const { L } = T.nailPath(shape, len), s = w / 100;
      return `<g class="petal" style="--i:${i}"><g transform="rotate(${a}) translate(${(-w / 2).toFixed(1)} ${(-(r0 + L * s)).toFixed(1)}) scale(${s})" filter="url(#bloomsh)">${T.renderNail({ t, toppings: tp || [] }, Object.assign({}, P0, pal), { shape, length: len, seed, finger: 0 })}</g></g>`;
    };
    let g = '';
    set.outer.forEach(([t, p], i) => { g += petal(t, p, i * 30, 'almond', 'long', 56, 50, 30 + i, i, TP[i]); });
    INNER.forEach(([t, p], i) => { g += petal(t, p, 22.5 + i * 45, 'oval', 'short', 40, 20, 60 + i, 12 + i); });
    let c = '';
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5, r = T.renderToppings([{ k: 'pearl', v: 'cream', s: 'S', x: 0, y: 0 }], 1, { finger: i });
      c += `<defs>${r.defs}</defs><g transform="translate(${(Math.cos(a) * 24).toFixed(1)} ${(Math.sin(a) * 24).toFixed(1)}) scale(0.48)">${r.svg}</g>`;
    }
    const big = T.renderToppings([{ k: 'pearl', v: 'white', s: 'L', x: 0, y: 0 }], 1, { finger: 0 });
    return `<svg class="bloom" viewBox="-170 -170 340 340" width="${size}" height="${size}" aria-hidden="true"><defs><filter id="bloomsh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3.2" flood-color="#5A2A2E" flood-opacity="0.22"/></filter></defs><g class="bloom-spin"><circle r="30" fill="#F2E4DA"/>${g}${c}<defs>${big.defs}</defs>${big.svg}</g></svg>`;
  }
  T.renderBloom = renderBloom;
})(typeof window !== 'undefined' ? window : globalThis);
