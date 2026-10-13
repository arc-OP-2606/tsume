/* tsumé — 手の描画（やわらかシルエット）。肌は1色で、しわ・影・グラデーションは描かない。左手の甲が基本、右手は左右反転。肌の色5段階 */
(function (global) {
  'use strict';
  const T = global.TSUME;
  let uidN = 0; const nid = () => 'h' + (uidN++).toString(36);
  const SKINS = {
    porcelain: { base: '#F6DFD2', line: '#DDB4A0', name: 'ポーセリン' },
    natural:   { base: '#F1D0BD', line: '#D4A48B', name: 'ナチュラル' },
    honey:     { base: '#E0B392', line: '#BD8C69', name: 'ハニー' },
    caramel:   { base: '#BF8C68', line: '#99694B', name: 'キャラメル' },
    cocoa:     { base: '#8E6045', line: '#6B4430', name: 'ココア' },
  };
  // thumb, index, middle, ring, pinky — 付け根の位置・角度（+ で右へ）・長さ・付け根と先の幅。少し太く短く、先は丸く
  const FINGERS = [
    { bx: 290, by: 402, ang: 40, len: 104, wb: 57, wt: 46 },
    { bx: 248, by: 296, ang: 9, len: 150, wb: 48, wt: 41 },
    { bx: 204, by: 285, ang: 1.5, len: 168, wb: 49, wt: 42 },
    { bx: 160, by: 294, ang: -6, len: 156, wb: 47, wt: 40 },
    { bx: 119, by: 318, ang: -14, len: 120, wb: 41, wt: 35 },
  ];
  const W = 400, H = 540;
  const PALM = 'M 104 320 C 98 374 108 430 124 470 C 132 500 136 530 138 560 L 286 560 C 288 520 296 486 312 452 C 322 430 314 404 296 392 C 284 360 276 322 268 298 C 240 272 150 272 112 302 Z';
  // 指の両側だけ（付け根は手の甲に隠れるので線を引かない）
  function sides(f) {
    const hb = f.wb / 2, ht = f.wt / 2, L = f.len;
    return `M ${-hb} 2 C ${-hb} ${-L * 0.42} ${-ht} ${-L * 0.72} ${-ht} ${-L + ht} A ${ht} ${ht} 0 0 1 ${ht} ${-L + ht} C ${ht} ${-L * 0.72} ${hb} ${-L * 0.42} ${hb} 2`;
  }

  /** 爪の先が上で切れるなら、下の真ん中を軸に縦横同じ比で広げる */
  function fitTop(vb, minTop) {
    const [x, y, w, h] = vb.split(/\s+/).map(Number), need = y + 8 - minTop;
    if (!(need > 0) || [x, y, w, h].some(v => !isFinite(v))) return vb;
    const nh = h + need, nw = w * nh / h, r = v => Math.round(v * 10) / 10;
    return `${r(x - (nw - w) / 2)} ${r(y - need)} ${r(nw)} ${r(nh)}`;
  }
  function renderHand(specs, palette, opts) {
    opts = opts || {};
    const side = opts.side || 'left';
    const skin = SKINS[opts.skin] || SKINS.natural;
    const length = opts.length || 'medium', shape = opts.shape || 'oval';
    const id = nid();
    // わたしの手（hand-fit.js）: 指と爪の幅だけを変える。保存していなければ 1
    const ws = typeof opts.handScale === 'number' ? opts.handScale : (T.handFit ? T.handFit.widthScale() : 1);
    const FING = ws === 1 ? FINGERS : FINGERS.map(f => Object.assign({}, f, { wb: f.wb * ws, wt: f.wt * ws }));
    const defs = [`<linearGradient id="${id}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.62" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}m"><rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" fill="url(#${id}fade)"/></mask>`];
    const line = `fill="none" stroke="${skin.line}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`;
    let minTop = Infinity; /* 爪の先のいちばん上（絵の座標）。長い爪が viewBox の上で切れないように使う */
    const fingerG = (f, i) => {
      const spec = specs[i] || { t: 'sheer' };
      const nw = f.wt * (i === 0 ? 0.84 : 0.86), s = nw / 100;
      const root = -f.len + 1.1 * nw; /* 甘皮の位置（指先から爪の幅 1.1 個ぶん下）。長さを変えても動かさない */
      const top = root - T.nailPath(shape, length).L * s;
      minTop = Math.min(minTop, f.by + top * Math.cos(f.ang * Math.PI / 180));
      const d = sides(f);
      let g = `<path d="${d} L ${f.wb / 2} 80 L ${-f.wb / 2} 80 Z" fill="${skin.base}"/><path d="${d}" ${line}/>`;
      g += `<g transform="translate(${(-nw / 2).toFixed(2)} ${top.toFixed(2)}) scale(${s.toFixed(4)})">${T.renderNail(spec, palette, { shape, length, seed: (opts.seed || 0) + (side === 'left' ? 100 : 0), finger: i })}</g>`;
      return `<g class="h-finger" data-f="${i}" transform="translate(${f.bx} ${f.by}) rotate(${f.ang})">${g}</g>`;
    };
    const parts = [fingerG(FING[0], 0)];
    parts.push(`<path d="${PALM}" fill="${skin.base}"/>`);
    parts.push(`<path d="M 104 320 C 98 374 108 430 124 470 C 132 500 136 530 138 560 M 312 452 C 296 486 288 520 286 560 M 312 452 C 322 430 314 404 296 392" ${line}/>`);
    [4, 3, 2, 1].forEach(i => parts.push(fingerG(FING[i], i)));
    const flip = side === 'right' ? `transform="translate(${W} 0) scale(-1 1)"` : '';
    return `<svg class="tsume-hand" viewBox="${fitTop(opts.viewBox || `0 0 ${W} ${H}`, minTop)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${side === 'left' ? '左手' : '右手'}のネイル"><defs>${defs.join('')}</defs><g mask="url(#${id}m)"><g ${flip}>${parts.join('')}</g></g></svg>`;
  }

  T.renderHand = renderHand;
  T.SKINS = SKINS;
})(typeof window !== 'undefined' ? window : globalThis);
