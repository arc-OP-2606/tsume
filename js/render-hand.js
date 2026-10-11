/* tsumé — 手の描画。左手の甲が基本（指を上に）、右手は左右反転。肌の色5段階 */
(function (global) {
  'use strict';
  const T = global.TSUME;
  let uidN = 0; const nid = () => 'h' + (uidN++).toString(36);
  const SKINS = {
    porcelain: { base: '#F4D9CA', light: '#FCEDE4', dark: '#E2BBA6', line: '#C2937D', name: 'ポーセリン' },
    natural:   { base: '#ECC8B2', light: '#F8E0D1', dark: '#D6A58C', line: '#B0806A', name: 'ナチュラル' },
    honey:     { base: '#D9AB88', light: '#E9C4A6', dark: '#BF8A66', line: '#98684A', name: 'ハニー' },
    caramel:   { base: '#B4805B', light: '#CA9874', dark: '#946445', line: '#734E35', name: 'キャラメル' },
    cocoa:     { base: '#85573B', light: '#9F6E4D', dark: '#68422B', line: '#4F321F', name: 'ココア' },
  };
  // thumb, index, middle, ring, pinky — base point (knuckle), angle (deg, + = lean right), length, base/tip width
  const FINGERS = [
    { bx: 288, by: 402, ang: 40, len: 112, wb: 52, wt: 41 },
    { bx: 248, by: 294, ang: 9, len: 160, wb: 43, wt: 36 },
    { bx: 204, by: 283, ang: 1.5, len: 180, wb: 44, wt: 37 },
    { bx: 160, by: 292, ang: -6, len: 166, wb: 42, wt: 35 },
    { bx: 119, by: 316, ang: -14, len: 128, wb: 36, wt: 30 },
  ];
  const EXT = { short: 1, medium: 7, long: 18 };
  const W = 400, H = 540;

  function fingerPath(f) {
    const hb = f.wb / 2, ht = f.wt / 2, L = f.len;
    const pip = -L * 0.46, hp = (hb + ht) / 2 + 0.6;
    return `M ${-hb} 90 L ${-hb} 0 C ${-hb} ${pip * 0.45} ${-hp} ${pip * 0.8} ${-hp} ${pip} C ${-hp} ${pip - L * 0.2} ${-ht} ${-L + ht * 1.9} ${-ht} ${-L + ht} A ${ht} ${ht * 1.04} 0 0 1 ${ht} ${-L + ht} C ${ht} ${-L + ht * 1.9} ${hp} ${pip - L * 0.2} ${hp} ${pip} C ${hp} ${pip * 0.8} ${hb} ${pip * 0.45} ${hb} 0 L ${hb} 90 Z`;
  }

  function renderHand(specs, palette, opts) {
    opts = opts || {};
    const side = opts.side || 'left';
    const skin = SKINS[opts.skin] || SKINS.natural;
    const length = opts.length || 'medium', shape = opts.shape || 'oval';
    const id = nid();
    const { L: NL } = T.nailPath(shape, length);
    const defs = [];
    defs.push(`<linearGradient id="${id}sk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${skin.dark}"/><stop offset="0.22" stop-color="${skin.base}"/><stop offset="0.42" stop-color="${skin.light}"/><stop offset="0.7" stop-color="${skin.base}"/><stop offset="1" stop-color="${skin.dark}"/></linearGradient>`);
    defs.push(`<linearGradient id="${id}pa" x1="0" y1="0" x2="1" y2="0.25"><stop offset="0" stop-color="${skin.dark}"/><stop offset="0.3" stop-color="${skin.base}"/><stop offset="0.55" stop-color="${skin.light}"/><stop offset="0.85" stop-color="${skin.base}"/><stop offset="1" stop-color="${skin.dark}"/></linearGradient>`);
    defs.push(`<linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}m"><rect x="-50" y="-50" width="${W + 100}" height="${H + 100}" fill="url(#${id}fade)"/></mask>`);
    defs.push(`<filter id="${id}sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter><filter id="${id}bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>`);
    const parts = [];
    const fingerG = (f, i, withShadow) => {
      const spec = specs[i] || { t: 'sheer' };
      const hb = f.wb / 2, ht = f.wt / 2;
      const nw = f.wt * (i === 0 ? 0.84 : 0.86), s = nw / 100;
      const top = -f.len - EXT[length] * (nw / 30);
      const tr = `translate(${f.bx} ${f.by}) rotate(${f.ang})`;
      const d = fingerPath(f);
      defs.push(`<linearGradient id="${id}fg${i}" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="64"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="${id}fm${i}" maskUnits="userSpaceOnUse" x="-60" y="${-f.len - 80}" width="120" height="${f.len + 180}"><rect x="-60" y="${-f.len - 80}" width="120" height="${f.len + 180}" fill="url(#${id}fg${i})"/></mask>`);
      let g = `<g mask="url(#${id}fm${i})">`;
      if (withShadow) g += `<path d="${d}" fill="rgba(80,35,30,0.28)" transform="translate(3 6)" filter="url(#${id}sh)"/>`;
      g += `<path d="${d}" fill="url(#${id}sk)" stroke="${skin.line}" stroke-opacity="0.45" stroke-width="1"/>`;
      // joint creases (back of finger)
      const pip = -f.len * 0.46, dip = -f.len * 0.74;
      if (i > 0) {
        g += `<path d="M ${-hb * 0.42} ${pip + 1} Q 0 ${pip - 4} ${hb * 0.42} ${pip + 1}" fill="none" stroke="${skin.line}" stroke-width="1" opacity="0.35" stroke-linecap="round"/>`;
        g += `<path d="M ${-hb * 0.3} ${pip + 6} Q 0 ${pip + 2} ${hb * 0.3} ${pip + 6}" fill="none" stroke="${skin.line}" stroke-width="0.8" opacity="0.22" stroke-linecap="round"/>`;
        g += `<path d="M ${-ht * 0.34} ${dip} Q 0 ${dip - 2.5} ${ht * 0.34} ${dip}" fill="none" stroke="${skin.line}" stroke-width="0.8" opacity="0.22" stroke-linecap="round"/>`;
      }
      // soft highlight along the finger
      g += `<ellipse cx="${-ht * 0.22}" cy="${-f.len * 0.42}" rx="${ht * 0.28}" ry="${f.len * 0.26}" fill="${skin.light}" opacity="0.55" filter="url(#${id}bl)"/>`;
      g += `</g>`;
      // nail
      const nx = -nw / 2;
      g += `<g transform="translate(${nx.toFixed(2)} ${top.toFixed(2)}) scale(${s.toFixed(4)})">`;
      g += `<path d="M -4 ${NL - 6} Q 50 ${NL + 22} 104 ${NL - 6}" fill="none" stroke="${skin.dark}" stroke-width="7" opacity="0.55" stroke-linecap="round"/>`;
      g += T.renderNail(spec, palette, { shape, length, seed: (opts.seed || 0) + (side === 'left' ? 100 : 0), finger: i });
      g += `<path d="M 4 ${NL - 4} Q 50 ${NL + 14} 96 ${NL - 4}" fill="none" stroke="${skin.light}" stroke-width="3" opacity="0.7" stroke-linecap="round"/>`;
      g += `</g>`;
      return `<g class="h-finger" data-f="${i}" transform="${tr}">${g}</g>`;
    };
    // thumb (behind palm edge)
    parts.push(fingerG(FINGERS[0], 0, true));
    // back of the hand
    const palm = `M 104 318 C 98 372 108 430 124 470 C 132 500 136 530 138 560 L 286 560 C 288 520 296 486 312 452 C 322 430 314 404 296 392 C 284 360 276 322 268 298 C 240 270 150 270 112 300 Z`;
    parts.push(`<path d="${palm}" fill="rgba(80,35,30,0.26)" transform="translate(4 8)" filter="url(#${id}sh)"/>`);
    parts.push(`<path d="${palm}" fill="url(#${id}pa)"/>`);
    parts.push(`<path d="M 104 318 C 98 372 108 430 124 470 C 132 500 136 530 138 560" fill="none" stroke="${skin.line}" stroke-opacity="0.4" stroke-width="1"/>`);
    parts.push(`<path d="M 312 452 C 296 486 288 520 286 560" fill="none" stroke="${skin.line}" stroke-opacity="0.4" stroke-width="1"/>`);
    // tendons / knuckle shading
    [[247, 292], [203, 281], [159, 290], [118, 314]].forEach(([x, y], k) => {
      parts.push(`<ellipse cx="${x - 2}" cy="${y + 6}" rx="${12 - k}" ry="7" fill="${skin.light}" opacity="0.5" filter="url(#${id}bl)"/>`);
      parts.push(`<path d="M ${x} ${y + 22} C ${x - 4} ${y + 70} ${200 + (x - 200) * 0.4} ${y + 130} ${200 + (x - 200) * 0.3} ${y + 190}" fill="none" stroke="${skin.dark}" stroke-width="5" opacity="0.10" stroke-linecap="round" filter="url(#${id}bl)"/>`);
    });
    // fingers, back to front
    [4, 3, 2, 1].forEach(i => parts.push(fingerG(FINGERS[i], i, true)));
    const flip = side === 'right' ? `transform="translate(${W} 0) scale(-1 1)"` : '';
    return `<svg class="tsume-hand" viewBox="${opts.viewBox || `0 0 ${W} ${H}`}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${side === 'left' ? '左手' : '右手'}のネイル"><defs>${defs.join('')}</defs><g mask="url(#${id}m)"><g ${flip}>${parts.join('')}</g></g></svg>`;
  }

  T.renderHand = renderHand;
  T.SKINS = SKINS;
})(typeof window !== 'undefined' ? window : globalThis);
