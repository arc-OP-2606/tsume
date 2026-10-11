/* tsumé — 画面共通の部品（アイコン・見出し・進み具合・切替・手のステージ・見本） */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine;
  T.views = T.views || {};
  T.actions = T.actions || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yen = n => '約' + Math.round(n).toLocaleString('ja-JP') + '円';
  const byId = (list, id) => list.find(x => x.id === id) || null;
  const svg = (d, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 1.6}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    book: svg('<path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/>'),
    help: svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7"/><path d="M12 17h.01" stroke-width="2.2"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>', 1.8),
    chev: svg('<path d="M9 5l7 7-7 7"/>', 1.8),
    check: svg('<path d="M5 12l5 5 9-10"/>', 2.6),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 1.8),
    sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5 9 15M15 9l2.5-2.5"/>'),
    refresh: svg('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'),
    share: svg('<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>'),
    sliders: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
    clock: svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
    yen: svg('<path d="M7 5l5 7 5-7M12 12v7M8 13h8M8 16h8"/>'),
    hand: svg('<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.6 15a1.5 1.5 0 0 1 2.3-1.9L9 15"/>', 1.5),
    plus: svg('<path d="M6 12h12M12 6v12"/>', 1.8),
    minus: svg('<path d="M6 12h12"/>', 1.8),
    rotate: svg('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>'),
    trash: svg('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>'),
    wand: svg('<path d="M4 20 15 9"/><path d="M15 4v3M13.5 5.5h3M19 9v2M18 10h2M10 3v2M9 4h2"/>'),
    bag: svg('<path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>'),
    list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" stroke-width="2.6"/>'),
    play: svg('<path d="M8 5.5v13l10.5-6.5z"/>', 1.8),
    voice: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    mic: svg('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>'),
  };
  const st = () => T.app.state;

  function bar(o) {
    o = o || {};
    const left = o.back ? `<button class="iconbtn" data-act="back" aria-label="戻る">${ICON.back}</button>` : '<span class="bar-sp" aria-hidden="true"></span>';
    return `<header class="bar ${o.cls || ''}">${left}<h1 class="bar-title">${o.title || ''}</h1><div class="bar-right">${o.right || ''}</div></header>`;
  }
  const navBtn = (view, icon, label) => `<button class="iconbtn" data-act="nav" data-view="${view}" aria-label="${label}">${icon}</button>`;
  function brandBar() {
    return `<header class="brandbar"><button class="brand" data-act="nav" data-view="try" aria-label="tsumé のはじめの画面へ"><span class="logo latin">tsum<em>é</em></span></button><nav class="brand-nav" aria-label="メニュー">${navBtn('shop', ICON.bag, 'SHOP（アイテム）')}${navBtn('mine', ICON.heart, 'マイデザイン')}${navBtn('materials', ICON.book, '素材とトッピングの図鑑')}${navBtn('about', ICON.help, '使い方')}</nav></header>`;
  }
  function progress(n, total) {
    const segs = Array.from({ length: total }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    return `<div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${n}" aria-label="質問 ${n} / ${total}"><span class="segs">${segs}</span><span class="pnum latin">${n}/${total}</span></div>`;
  }
  function seg(items, act, current, attrs) {
    return `<div class="seg" role="group" ${attrs || ''}>${items.map(it => `<button data-act="${act}" data-v="${esc(it.id)}" aria-pressed="${it.id === current}">${esc(it.name)}</button>`).join('')}</div>`;
  }
  const showcaseSide = sel => (sel.hand === 'left' ? 'right' : 'left');
  const customKey = (conceptId, pi) => `${conceptId}:${pi || 0}`;
  // 配色の番号は数字（デザイン案の配色）か 'k…'（ことばで作った配色。st.palettes にある）
  const piOf = v => (/^k[\w-]{1,40}$/.test(String(v)) ? String(v) : (+v || 0));
  function designFor(conceptId, paletteIndex, sel) {
    const s = st(), c = byId(T.CONCEPTS, conceptId); if (!c) return null;
    const pal = typeof paletteIndex === 'string' ? (s.palettes || {})[paletteIndex] : null;
    return E.build(c, sel || s.sel, { season: s.season, paletteIndex: pal ? paletteIndex : (typeof paletteIndex === 'string' ? 0 : paletteIndex), palette: pal || undefined, toppings: s.custom[customKey(conceptId, paletteIndex)] });
  }
  function handSvg(design, o) {
    o = o || {};
    const sel = o.sel || st().sel, side = o.side || showcaseSide(sel);
    if (design.foot) return T.renderFoot(design.foot, design.palette, { side, seed: 11, skin: st().skin });
    return T.renderHand(side === 'left' ? design.left : design.right, design.palette, { side, skin: st().skin, shape: sel.shape, length: sel.length, seed: 11, viewBox: o.viewBox });
  }
  function handStage(design, o) {
    o = o || {};
    return `<div class="stage ${o.cls || ''}" data-light>${handSvg(design, o)}${o.overlay || ''}</div>`;
  }
  function chart(design, side, o) {
    o = o || {};
    const sel = o.sel || st().sel;
    const foot = !!design.foot, mirror = !foot && side === 'left';
    const marks = o.marks ? `<div class="chart-marks">${(mirror ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]).map(i => `<i class="${o.marks.includes(i) ? 'on' : ''}"></i>`).join('')}</div>` : '';
    if (foot) return `<div class="chart">${T.renderChart(o.specs || design.foot, design.palette, { side: 'right', shape: 'square', length: 'short', seed: 11 })}${marks}</div>`;
    const specs = o.specs || (side === 'left' ? design.left : design.right);
    const names = mirror ? T.FINGER_NAMES.slice().reverse() : T.FINGER_NAMES;
    return `<div class="chart">${T.renderChart(specs, design.palette, { side, shape: sel.shape, length: sel.length, seed: 11, mirror })}${marks}<div class="chart-labels">${names.map(n => `<span>${esc(n)}</span>`).join('')}</div></div>`;
  }
  const diff = n => `<span class="diff" aria-label="難易度 ${n} / 5">${'●'.repeat(n)}${'○'.repeat(Math.max(0, 5 - n))}</span>`;
  const accentOf = c => (c.accent == null ? 3 : c.accent);

  T.ui = { esc, yen, byId, ICON, bar, brandBar, progress, seg, showcaseSide, customKey, designFor, piOf, handSvg, handStage, chart, diff, accentOf };
})(typeof window !== 'undefined' ? window : globalThis);
