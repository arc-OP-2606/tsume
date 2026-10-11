/* tsumé — トッピングで飾る。指を選び、パーツを置く・動かす・大きさ・回転・外す */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, D = T.TOPPINGS;
  const { esc, ICON } = U;
  const clone = o => JSON.parse(JSON.stringify(o));
  const SIZES = ['S', 'M', 'L'];
  const METAL_KINDS = ['charm', 'stud', 'bullion', 'chain'];

  const keyOf = st => U.customKey(st.current.conceptId, st.current.paletteIndex);
  const sidesOf = d => (d.foot ? ['foot'] : ['left', 'right']);
  const designNow = st => U.designFor(st.current.conceptId, st.current.paletteIndex);
  /** 最初に手を加えたときだけ、今の飾りを custom に写す（開いただけでは写さない）。範囲が変わって足りない手も今の飾りで埋める */
  function ensureCustom(st) {
    const k = keyOf(st), d = designNow(st), c = st.custom[k] || {};
    sidesOf(d).forEach(side => { if (!Array.isArray(c[side]) || c[side].length !== 5) c[side] = d[side].map(f => clone(f.toppings || [])); });
    st.custom[k] = c;
    return c;
  }
  /** 今の指の飾り（読むだけ。custom が無ければデザインの飾り） */
  function listOf(st) {
    const c = st.custom[keyOf(st)], e = st.editor;
    if (c && Array.isArray(c[e.side]) && Array.isArray(c[e.side][e.finger])) return c[e.side][e.finger];
    const d = designNow(st), specs = d[e.side] || d.foot || d.left;
    return (specs[e.finger] && specs[e.finger].toppings) || [];
  }
  function setList(st, list) {
    const c = ensureCustom(st), e = st.editor;
    c[e.side][e.finger] = list;
    if (e.both && e.side !== 'foot') { const other = e.side === 'left' ? 'right' : 'left'; if (c[other]) c[other][e.finger] = clone(list); }
    T.app.persist();
  }
  const pickItem = st => Object.assign({}, st.editor.pick || { k: 'stone', v: 'aurora' });
  const sizeFor = (st, k) => (D.KINDS[k].big && st.editor.size === 'S' ? 'M' : st.editor.size);
  // 置く場所の候補（空いているところから）
  const SPOTS = [].concat(D.LAYOUTS.one.items, D.LAYOUTS.three.items, D.LAYOUTS.cluster.items, D.LAYOUTS.diagonal.items, D.LAYOUTS.tipline.items, D.LAYOUTS.vertical.items);
  // パーツの大きさを見て、重ならない所。大きいパーツは先端・サイドを避けて根元寄りに（引っかかりにくい）。
  // どこも重なるなら、いちばん重なりが少ない所
  const GRID = [0.85, 0.75, 0.65, 0.55, 0.45].flatMap(y => [0.5, 0.38, 0.62, 0.3, 0.7].map(x => ({ x, y })));
  const radius = t => D.KINDS[t.k].unit * (D.SIZES[t.s || 'M'] || 1);
  function freeSpot(list, item, L) {
    const big = D.KINDS[item.k].big || radius(item) > 14, spots = big ? GRID : SPOTS.concat(GRID);
    const gap = s => Math.min(999, ...list.map(t => Math.hypot((t.x - s.x) * 100, (t.y - s.y) * L) - (radius(t) + radius(item)) * 0.85));
    let best = spots[0], bestGap = -Infinity;
    for (const s of spots) { const g = gap(s); if (g > 0) return s; if (g > bestGap) { bestGap = g; best = s; } }
    return best;
  }

  const trayTabOf = it => (D.TRAY.find(t => t.items.some(x => x.k === it.k)) || D.TRAY[0]).id;
  /** パーツを今の指の空いている所に置き、選んだ状態にする（トレイと図鑑の両方から呼ぶ） */
  function addPart(st, item) {
    const e = st.editor;
    e.pick = Object.assign({}, item); e.tab = trayTabOf(item);
    if (METAL_KINDS.includes(item.k) && D.METALS[item.v]) e.metal = item.v;
    const d = designNow(st), { L } = T.nailPath(d.foot ? 'square' : st.sel.shape, d.foot ? 'short' : st.sel.length);
    const list = clone(listOf(st)), add = Object.assign(pickItem(st), { s: sizeFor(st, item.k) }), spot = freeSpot(list, add, L);
    Object.assign(add, { x: spot.x, y: spot.y }); if (add.k === 'chain') add.r = -28;
    list.push(add); setList(st, list); e.selected = list.length - 1; e.layout = null;
    return e.selected;
  }

  function overCap(st, d) {
    const rule = (st.sel.scene && D.SCENE_RULES[st.sel.scene]) || D.NO_SCENE_RULE;
    const specs = d.foot || (st.editor.side === 'right' ? d.right : d.left), all = specs.flatMap(f => f.toppings || []);
    if (rule.cap === 'none' && all.length) return true;
    if (rule.cap === 'one' && all.length > 1) return true;
    if (rule.cap === 'point' && all.length > 6) return true;
    if (rule.noBig && all.some(t => D.KINDS[t.k].big)) return true;
    return false;
  }

  T.views.editor = st => {
    if (!st.current) return `${U.bar({ back: true, title: 'トッピングで飾る' })}<p class="muted">デザインを選んでください。</p>`;
    const d = U.designFor(st.current.conceptId, st.current.paletteIndex), e = st.editor;
    if (d.foot && e.side !== 'foot') e.side = 'foot';
    if (!d.foot && e.side === 'foot') e.side = st.side || U.showcaseSide(st.sel);
    const specs = d.foot || (e.side === 'left' ? d.left : d.right);
    const shape = d.foot ? 'square' : st.sel.shape, length = d.foot ? 'short' : st.sel.length, seedBase = 11 + (e.side === 'left' ? 100 : 0);
    const order = !d.foot && e.side === 'left' ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    const fingers = order.map(i => `<button class="ed-finger" data-act="ed-finger" data-i="${i}" aria-pressed="${i === e.finger}"><span class="sw">${T.renderSwatch(specs[i], d.palette, { shape, length, seed: seedBase, finger: i })}</span><span class="fl">${esc(T.FINGER_NAMES[i])}</span></button>`).join('');
    const spec = specs[e.finger], { L } = T.nailPath(shape, length), list = spec.toppings || [];
    let ring = '';
    if (e.selected != null && list[e.selected]) { const t = list[e.selected], r = D.KINDS[t.k].unit * (D.SIZES[t.s || 'M'] || 1) * 1.3 + 4; ring = `<circle class="ed-ring" cx="${(t.x * 100).toFixed(1)}" cy="${(t.y * L).toFixed(1)}" r="${r.toFixed(1)}"/>`; }
    const nail = `<svg class="ed-nail" viewBox="-34 -26 168 ${L + 52}" data-l="${L}" role="img" aria-label="${esc(T.FINGER_NAMES[e.finger])}の爪">${T.renderNail(spec, d.palette, { shape, length, seed: seedBase, finger: e.finger })}${ring}</svg>`;
    const tool = e.selected != null && list[e.selected] ? `<div class="ed-tool" role="toolbar" aria-label="選んだパーツ"><button data-act="ed-smaller" aria-label="小さく">${ICON.minus}</button><button data-act="ed-bigger" aria-label="大きく">${ICON.plus}</button><button data-act="ed-rotate" aria-label="回す">${ICON.rotate}</button><button data-act="ed-remove" aria-label="外す">${ICON.trash}</button></div>` : `<div class="hint">${ICON.hand}<span>${list.length ? 'ドラッグで動かす・タップで選ぶ' : '下のパーツを選ぶか、爪をタップして置く'}</span></div>`;
    const layouts = Object.keys(D.LAYOUTS).map(k => `<button class="chip" data-act="ed-layout" data-v="${k}" aria-pressed="${e.layout === k}">${esc(D.LAYOUTS[k].name)}</button>`).join('');
    const tab = D.TRAY.find(t => t.id === e.tab) || D.TRAY[0];
    const tabs = D.TRAY.map(t => `<button data-act="ed-tab" data-v="${t.id}" aria-pressed="${t.id === tab.id}">${esc(t.name)}</button>`).join('');
    const pk = e.pick || { k: 'stone', v: 'aurora' };
    const items = tab.items.map(it0 => {
      const it = Object.assign({}, it0); if (tab.id === 'metal') it.v = e.metal;
      const on = pk.k === it.k && (pk.shape || '') === (it.shape || '') && pk.v === it.v;
      return `<button class="ed-item" data-act="ed-add" data-k="${it.k}" data-v="${it.v}" data-shape="${it.shape || ''}" aria-pressed="${on}" aria-label="${esc(T.toppings.itemName(it))}を置く">${T.partSwatch(Object.assign({ s: 'L' }, it), it.k === 'charm' ? 30 : it.k === 'chain' ? 30 : 20)}</button>`;
    }).join('');
    const metals = tab.id === 'metal' ? `<div class="ed-metal">${Object.entries(D.METALS).map(([k, m]) => `<button class="chip" data-act="ed-metal" data-v="${k}" aria-pressed="${e.metal === k}"><i class="swatch-dot" style="background:${m.hex}"></i>${esc(m.name)}</button>`).join('')}</div>` : '';
    const sizes = U.seg(SIZES.map(z => ({ id: z, name: z })), 'ed-size', e.size, 'aria-label="大きさ"');
    const names = T.toppings.summary([spec]);
    const capNote = overCap(st, d) ? T.toppings.capNote(st.sel) : null;
    const topMats = new Set(Object.values(D.KINDS).map(k => k.mat).concat(['tweezers', 'nail_glue']));
    const topCost = d.materials.filter(m => topMats.has(m.id) && !m.once).reduce((n, m) => n + m.subtotal, 0);
    return `${U.bar({ back: true, title: 'トッピングで飾る', right: '<button class="btn sm" data-act="ed-done">完成</button>' })}
      <div class="ed-fingers" role="group" aria-label="指を選ぶ">${fingers}</div>
      <div class="ed-stage">${nail}${tool}</div>
      ${capNote ? `<p class="cap-note">${esc(capNote)}</p>` : ''}
      <div class="ed-layouts" data-keep-scroll="ed-layouts">${layouts}</div>
      <div class="ed-tabs" role="group" aria-label="パーツの種類">${tabs}</div>
      <div class="ed-tray">${items}</div>
      ${metals}
      <div class="ed-size"><span class="lab">大きさ</span>${sizes}<label class="ed-both"><input type="checkbox" data-act="ed-both" ${e.both ? 'checked' : ''}${d.foot ? ' disabled' : ''}>両手に同じ飾り</label></div>
      <div class="ed-foot">
        <p class="small muted">この指：<b>${esc(names || 'まだ何もありません')}</b></p>
        <p class="small muted">このデザインのトッピング材料：<b>${topCost ? U.yen(topCost) : 'なし'}</b>（${esc(T.TIER_INFO[st.sel.tier].label)}の目安）</p>
        <button class="btn ghost block" data-act="ed-copy">ほかの指にも同じ飾りをつける</button>
        <div class="links"><button class="link" data-act="ed-reset">おまかせの飾りに戻す</button><button class="link" data-act="mattab-open">パーツの図鑑${ICON.chev}</button></div>
      </div>`;
  };

  function enter(st) {
    if (!st.current) return;
    const d = designNow(st);
    Object.assign(st.editor, { side: d.foot ? 'foot' : (st.side || U.showcaseSide(st.sel)), finger: d.foot ? 0 : U.accentOf(d.concept), selected: null, layout: null });
  }
  Object.assign(T.actions, {
    edit: (el, st) => { enter(st); T.app.go('editor'); },
    'ed-finger': (el, st) => { st.editor.finger = +el.dataset.i; st.editor.selected = null; st.editor.layout = null; T.app.render(); },
    'ed-tab': (el, st) => { st.editor.tab = el.dataset.v; T.app.render(); },
    'ed-add': (el, st) => {
      const it = { k: el.dataset.k, v: el.dataset.v }; if (el.dataset.shape) it.shape = el.dataset.shape;
      addPart(st, it); st.fx = 'pop'; T.app.render();
    },
    'ed-place': (el, st, pos) => {
      const list = clone(listOf(st)), it = pickItem(st);
      list.push(Object.assign(it, { x: pos.x, y: pos.y, s: sizeFor(st, it.k) }, it.k === 'chain' ? { r: -28 } : {}));
      setList(st, list); st.editor.selected = list.length - 1; st.editor.layout = null; T.app.render();
    },
    'ed-move': (el, st, pos) => { const list = clone(listOf(st)); if (!list[pos.i]) return; list[pos.i].x = pos.x; list[pos.i].y = pos.y; setList(st, list); st.editor.selected = pos.i; T.app.render(); },
    'ed-select': (el, st, pos) => { st.editor.selected = pos.i; T.app.render(); },
    'ed-layout': (el, st) => {
      const it = pickItem(st), k = el.dataset.v;
      const list = D.LAYOUTS[k].items.map(at => Object.assign({}, it, { x: at.x, y: at.y, s: D.KINDS[it.k].big && at.s === 'S' ? 'M' : at.s }, it.k === 'chain' ? { r: -28 } : {}));
      setList(st, list); st.editor.layout = k; st.editor.selected = null; st.fx = 'pop'; T.app.render();
    },
    'ed-size': (el, st) => {
      st.editor.size = el.dataset.v;
      const i = st.editor.selected, list = clone(listOf(st));
      if (i != null && list[i]) { list[i].s = sizeFor(st, list[i].k); setList(st, list); }
      T.app.render();
    },
    'ed-metal': (el, st) => {
      st.editor.metal = el.dataset.v;
      const pk = st.editor.pick; if (pk && pk.k === 'charm') pk.v = st.editor.metal;
      const i = st.editor.selected, list = clone(listOf(st));
      if (i != null && list[i] && METAL_KINDS.includes(list[i].k)) { list[i].v = st.editor.metal; setList(st, list); }
      T.app.render();
    },
    'ed-bigger': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; list[i].s = SIZES[Math.min(2, SIZES.indexOf(list[i].s || 'M') + 1)]; setList(st, list); T.app.render(); },
    'ed-smaller': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; const s = SIZES[Math.max(0, SIZES.indexOf(list[i].s || 'M') - 1)]; list[i].s = D.KINDS[list[i].k].big && s === 'S' ? 'M' : s; setList(st, list); T.app.render(); },
    'ed-rotate': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; list[i].r = ((list[i].r || 0) + 30) % 360; setList(st, list); T.app.render(); },
    'ed-remove': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; list.splice(i, 1); setList(st, list); st.editor.selected = null; T.app.render(); },
    'ed-both': (el, st) => { st.editor.both = !!el.checked; },
    'ed-copy': (el, st) => {
      const c = ensureCustom(st), src = clone(listOf(st));
      Object.keys(c).forEach(side => { if (side === st.editor.side || st.editor.both) c[side] = c[side].map(() => clone(src)); });
      T.app.persist(); T.app.toast('ほかの指にも同じ飾りをつけました'); T.app.render();
    },
    'ed-reset': (el, st) => { delete st.custom[keyOf(st)]; st.editor.selected = null; st.editor.layout = null; T.app.persist(); T.app.toast('おまかせの飾りに戻しました'); T.app.render(); },
    'ed-done': (el, st) => { T.app.persist(); if (T.app.peek() === 'detail') T.app.back(); else T.app.go('detail', { replace: true }); },
  });
  T.editor = { ensureCustom, enter, addPart };
})(typeof window !== 'undefined' ? window : globalThis);
