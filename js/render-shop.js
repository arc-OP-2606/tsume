/* tsumé — SHOPアイテムのイラスト（tsumé が描く汎用の形。商品写真・ロゴ・パッケージの絵柄は使わない）。viewBox は 0 0 100 100 */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const { lighten, darken } = T.colorUtil;
  let n = 0; const uid = () => 'si' + (n++).toString(36);
  // パーツやシールの絵（partSwatch の svg）を、x・y を中心に w の大きさで置く
  const place = (svg, x, y, w) => svg.replace('<svg ', `<svg x="${x - w / 2}" y="${y - w / 2}" width="${w}" height="${w}" `);
  const boxOf = k => (['charm', 'chain', 'bijou', 'flower3d'].includes(k) ? 30 : 20);

  function bottle(it, kind) {
    const id = uid(), c = it.hex || '#E9C6C6', tall = kind === 'polish', glass = kind === 'clear';
    const grad = `<linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${darken(c, 0.12)}"/><stop offset="0.45" stop-color="${lighten(c, 0.18)}"/><stop offset="1" stop-color="${darken(c, 0.2)}"/></linearGradient>`;
    const body = tall ? '<rect x="30" y="46" width="40" height="44" rx="10"/>' : '<rect x="24" y="52" width="52" height="38" rx="12"/>';
    const cap = tall ? '<rect x="40" y="10" width="20" height="38" rx="5" fill="#2E2A2C"/><rect x="43" y="13" width="4" height="30" rx="2" fill="#FFFFFF" opacity="0.22"/>'
      : '<rect x="34" y="26" width="32" height="28" rx="6" fill="#2E2A2C"/><rect x="37" y="29" width="5" height="21" rx="2" fill="#FFFFFF" opacity="0.22"/>';
    let fx = '';
    if (kind === 'magnet') fx = `<path d="M ${tall ? 32 : 26} ${tall ? 80 : 82} L ${tall ? 68 : 74} ${tall ? 56 : 58}" stroke="${lighten(c, 0.75)}" stroke-width="5" stroke-linecap="round" opacity="0.9"/>`;
    if (kind === 'glitter') fx = [[34, 64], [46, 78], [58, 62], [66, 80], [40, 84], [62, 70], [52, 70]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.4}" fill="#FFFFFF" opacity="0.9"/>`).join('');
    if (glass) fx = '<path d="M 50 60 C 44 68 42 74 46 79 C 49 83 55 82 57 77 C 59 72 55 66 50 60 Z" fill="#FFFFFF" opacity="0.85"/>';
    const fill = glass ? 'rgba(232,240,247,0.95)' : `url(#${id}b)`;
    // 暗い色・ダーク表示でも形が見えるように、ふたと瓶に白いふちを足す
    const rim = `<g fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="2.4">${body}${cap.match(/<rect[^>]*\/>/)[0].replace(/fill="[^"]*"/, '')}</g>`;
    return `<defs>${grad}</defs><ellipse cx="50" cy="92" rx="28" ry="4" fill="#2A1214" opacity="0.08"/>${rim}<g fill="${fill}" stroke="${darken(c, 0.3)}" stroke-width="1.2">${body}</g>${fx}<rect x="${tall ? 33 : 28}" y="${tall ? 50 : 56}" width="8" height="${tall ? 30 : 24}" rx="4" fill="#FFFFFF" opacity="0.35"/>${cap}`;
  }
  function sheet(it) {
    const list = (it.apply && it.apply.sticker) || [['heart', '#F2B7C6']];
    const art = [[34, 44], [66, 44], [34, 74], [66, 74]].map(([x, y], i) => { const [m, col] = list[i % list.length]; return place(T.partSwatch({ k: 'sticker', v: m, col, s: 'L' }, 22), x, y, 28); }).join('');
    return `<rect x="14" y="16" width="72" height="78" rx="8" fill="#FFFFFF" stroke="#E6D9D2"/><rect x="14" y="16" width="72" height="12" rx="6" fill="#F3ECE6"/>${art}`;
  }
  function cover(it) {
    const p = it.apply.paint, spec = { t: p.t, c: p.c, p: {} };
    const nails = [[24, 26], [52, 26], [38, 58]].map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(0.24)">${T.renderNail(spec, {}, { shape: 'oval', length: 'medium', seed: 7 + i, finger: i + 1 })}</g>`).join('');
    return `<rect x="12" y="14" width="76" height="80" rx="8" fill="#FFFFFF" stroke="#E6D9D2"/>${nails}`;
  }
  function pack(it) {
    const parts = (it.apply && it.apply.part) || [];
    const a = parts[0], b = parts[1] || parts[0];
    return `<path d="M 18 24 L 82 24 L 80 90 Q 50 94 20 90 Z" fill="rgba(255,255,255,0.8)" stroke="#D8CCC6"/><path d="M 18 30 L 82 30" stroke="#E8B4B8" stroke-width="2"/>${place(T.partSwatch(Object.assign({ s: 'L' }, a, a.k === 'chain' ? { r: 0 } : {}), boxOf(a.k)), 38, 58, 34)}${place(T.partSwatch(Object.assign({ s: 'L' }, b, b.k === 'chain' ? { r: 0 } : {}), boxOf(b.k)), 62, 66, 30)}`;
  }
  function box(it) {
    const a = it.apply.part[0];
    return `<rect x="16" y="40" width="68" height="50" rx="6" fill="#F7EFE6" stroke="#D9C29A"/><path d="M 16 52 L 84 52" stroke="#D9C29A"/><rect x="44" y="40" width="12" height="50" fill="#E9D6B4" opacity="0.6"/>${place(T.partSwatch(Object.assign({ s: 'L' }, a, a.k === 'chain' ? { r: 0 } : {}), boxOf(a.k)), 50, 26, 36)}`;
  }
  function jar() {
    const hearts = [[40, 66, -20], [57, 73, 25], [49, 57, 10], [62, 60, -35], [45, 80, 40]].map(([x, y, r]) => place(T.partSwatch({ k: 'flake', v: 'heart', s: 'L', r }, 8), x, y, 14)).join('');
    return `<rect x="28" y="40" width="44" height="50" rx="10" fill="rgba(240,246,250,0.95)" stroke="#CFD8E0"/><rect x="32" y="28" width="36" height="14" rx="4" fill="#E8B4B8"/>${hearts}`;
  }
  function renderItem(it) {
    let inner;
    switch (it.illo) {
      case 'gel': case 'polish': case 'magnet': case 'glitter': case 'clear': inner = bottle(it, it.illo); break;
      case 'sticker': inner = sheet(it); break;
      case 'cover': inner = cover(it); break;
      case 'box': inner = box(it); break;
      case 'flake': inner = jar(); break;
      default: inner = pack(it);
    }
    return `<svg class="shop-illo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  }
  T.renderItem = renderItem;
})(typeof window !== 'undefined' ? window : globalThis);
