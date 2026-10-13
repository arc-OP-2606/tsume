/* tsumé — アイテムで飾る（デザインの作業台）。指を選び、SHOPのアイテムをのせる・塗る、パーツを動かす・大きさ・回転・外す */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, D = T.TOPPINGS;
  const { esc, ICON } = U;
  const clone = o => JSON.parse(JSON.stringify(o));
  const SIZES = ['S', 'M', 'L'];
  const METAL_KINDS = ['charm', 'stud', 'bullion', 'chain'];
  const MAX_PARTS = 24; // 共有リンク（js/share.js の MAX_PER_NAIL）と同じ上限

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
  function pushUndo(st) {
    const e = st.editor, k = keyOf(st);
    if (!e.undo || e.undo.key !== k) e.undo = { key: k, stack: [] };
    e.undo.stack.push(st.custom[k] ? clone(st.custom[k]) : null);
    if (e.undo.stack.length > 20) e.undo.stack.shift();
  }
  function setList(st, list) {
    pushUndo(st);
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
  const scaleOf = t => (typeof t.z === 'number' && isFinite(t.z) ? t.z : D.SIZES[t.s || 'M'] || 1);
  const nearestSize = z => Object.keys(D.SIZES).reduce((a, b) => (Math.abs(D.SIZES[b] - z) < Math.abs(D.SIZES[a] - z) ? b : a), 'M');
  const unitOf = t => (t.k === 'photo' && T.scan ? T.scan.unitOf(t) : D.KINDS[t.k].unit);
  const radius = t => unitOf(t) * scaleOf(t);
  function freeSpot(list, item, L) {
    const big = D.KINDS[item.k].big || radius(item) > 14, spots = big ? GRID : SPOTS.concat(GRID);
    const gap = s => Math.min(999, ...list.map(t => Math.hypot((t.x - s.x) * 100, (t.y - s.y) * L) - (radius(t) + radius(item)) * 0.85));
    let best = spots[0], bestGap = -Infinity;
    for (const s of spots) { const g = gap(s); if (g > 0) return s; if (g > bestGap) { bestGap = g; best = s; } }
    return best;
  }

  const trayTabOf = it => (D.TRAY.find(t => t.items.some(x => x.k === it.k)) || D.TRAY[0]).id;
  /** パーツを今の指の空いている所に置き、選んだ状態にする（トレイと図鑑の両方から呼ぶ） */
  function isFull(list) {
    if (list.length < MAX_PARTS) return false;
    if (T.app.toast) T.app.toast(`1つの爪にのせられるのは${MAX_PARTS}個までです`);
    return true;
  }
  function addPart(st, item) {
    const e = st.editor;
    e.pick = Object.assign({}, item); e.tab = trayTabOf(item);
    if (isFull(listOf(st))) return -1;
    if (METAL_KINDS.includes(item.k) && D.METALS[item.v]) e.metal = item.v;
    const d = designNow(st), { L } = T.nailPath(d.foot ? 'square' : st.sel.shape, d.foot ? 'short' : st.sel.length);
    const list = clone(listOf(st)), add = Object.assign(pickItem(st), { s: sizeFor(st, item.k) }), spot = freeSpot(list, add, L);
    Object.assign(add, { x: spot.x, y: spot.y }); if (add.k === 'chain') add.r = -28;
    list.push(add); setList(st, list); e.selected = list.length - 1; e.layout = null;
    return e.selected;
  }

  // 爪の中に収める。先端は丸いので、上ほど左右を狭くする
  /** 爪の中に収める（p は 0〜1）。端から 0.06 は空ける。先端は形の幅に合わせて絞る。形・長さを渡さなければ今のデザインの形・長さ */
  function inNail(p, shape, length) {
    const sel = (T.app && T.app.state && T.app.state.sel) || {};
    const y = Math.min(0.9, Math.max(0.06, p.y)), half = Math.max(0.02, T.nailHalf(shape || sel.shape || 'oval', length || sel.length || 'medium', y) - 0.06);
    return { x: Math.min(0.5 + half, Math.max(0.5 - half, p.x)), y };
  }
  /** 落とした位置にパーツを置く（ドラッグ） */
  function placePart(st, item, pos) {
    const e = st.editor, list = clone(listOf(st)), at = inNail(pos);
    e.pick = Object.assign({}, item); e.tab = trayTabOf(item);
    if (isFull(list)) return -1;
    list.push(Object.assign({}, item, { x: at.x, y: at.y, s: sizeFor(st, item.k) }, item.k === 'chain' ? { r: -28 } : {}));
    setList(st, list); e.selected = list.length - 1; e.layout = null;
    return e.selected;
  }
  /** いくつかのパーツをまとめて今の指にのせる。items: [{ item, n }]。のせた数を返す */
  function addMany(st, items) {
    let added = 0;
    for (const { item, n } of items) for (let i = 0; i < n; i++) { if (addPart(st, item) < 0) return added; added++; }
    return added;
  }
  /** トレイの「図鑑のパーツ」を落としたとき（id は 'book:種類:色:形'） */
  function dropBook(st, id, pos) {
    const m = /^book:([a-z0-9]+):([a-z0-9_]+):([a-z0-9_]*)$/.exec(id || ''); if (!m || !D.KINDS[m[1]] || !st.current) return '';
    const it = { k: m[1], v: m[2] }; if (m[3]) it.shape = m[3];
    const i = pos ? placePart(st, it, pos) : addPart(st, it); if (i < 0) return '';
    st.fx = 'pop';
    return `${T.FINGER_NAMES[st.editor.finger] || '親指'}に「${T.toppings.fullName(it)}」をのせました`;
  }
  /** ホログラムは5枚を少しずつずらして散らす */
  function scatter(st, item, pos) {
    const e = st.editor, list = clone(listOf(st)), c = inNail(pos || freeSpot(list, Object.assign({ s: 'M' }, item), 140));
    // 中心を爪の内側に寄せてから散らす（端で重ならないように）
    const cx = Math.min(0.62, Math.max(0.38, c.x)), cy = Math.min(0.78, Math.max(0.3, c.y));
    [[0, 0], [-0.1, 0.06], [0.09, 0.08], [-0.05, -0.08], [0.11, -0.05]].forEach(([dx, dy], i) => list.push(Object.assign({}, item, inNail({ x: cx + dx, y: cy + dy }), { s: i % 2 ? 'S' : 'M', r: (i * 47) % 360 - 60 })));
    setList(st, list); e.selected = null; e.layout = null;
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
    if (!st.current) return `${U.bar({ back: true, title: 'アイテムで飾る' })}<p class="muted">デザインを選んでください。</p>`;
    const d = U.designFor(st.current.conceptId, st.current.paletteIndex), e = st.editor;
    if (d.foot && e.side !== 'foot') e.side = 'foot';
    if (!d.foot && e.side === 'foot') e.side = st.side || U.showcaseSide(st.sel);
    const specs = d.foot || (e.side === 'left' ? d.left : d.right);
    const shape = d.foot ? 'square' : st.sel.shape, length = d.foot ? 'short' : st.sel.length, seedBase = 11 + (e.side === 'left' ? 100 : 0);
    const order = !d.foot && e.side === 'left' ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    const fingers = order.map(i => `<button class="ed-finger" data-act="ed-finger" data-i="${i}" aria-pressed="${i === e.finger}"><span class="sw">${T.renderSwatch(specs[i], d.palette, { shape, length, seed: seedBase, finger: i })}</span><span class="fl">${esc(T.FINGER_NAMES[i])}</span></button>`).join('');
    const spec = specs[e.finger], { L } = T.nailPath(shape, length), list = spec.toppings || [];
    let ring = '';
    if (e.selected != null && list[e.selected]) { const t = list[e.selected], r = unitOf(t) * scaleOf(t) * 1.3 + 4; ring = `<circle class="ed-ring" cx="${(t.x * 100).toFixed(1)}" cy="${(t.y * L).toFixed(1)}" r="${r.toFixed(1)}"/>`; }
    const nail = `<svg class="ed-nail" viewBox="-34 -26 168 ${L + 52}" data-l="${L}" role="img" aria-label="${esc(T.FINGER_NAMES[e.finger])}の爪">${T.renderNail(spec, d.palette, { shape, length, seed: seedBase, finger: e.finger })}${ring}</svg>`;
    const sel = e.selected != null && list[e.selected] ? list[e.selected] : null;
    const tool = sel ? `<div class="ed-tool" role="toolbar" aria-label="選んだパーツ"><button data-act="ed-smaller" aria-label="小さく">${ICON.minus}</button><button data-act="ed-bigger" aria-label="大きく">${ICON.plus}</button><button data-act="ed-rotate" aria-label="回す">${ICON.rotate}</button><button data-act="ed-front" aria-label="前へ（上に重ねる）">${ICON.up || '↑'}</button><button data-act="ed-back" aria-label="後ろへ（下に重ねる）">${ICON.down || '↓'}</button><button data-act="ed-remove" aria-label="外す">${ICON.trash}</button></div>` : `<div class="hint">${ICON.hand}<span>${list.length ? 'ドラッグで動かす・タップで選ぶ・2本指で大きさと向き' : '下のパーツを選ぶか、爪をタップして置く'}</span></div>`;
    const corner = `<div class="ed-corner"><button class="iconbtn" data-act="ed-undo" aria-label="元に戻す" ${e.undo && e.undo.key === keyOf(st) && e.undo.stack.length ? '' : 'disabled'}>${ICON.undo || ICON.refresh}</button><button class="iconbtn" data-act="ed-zoom" aria-pressed="${!!e.zoom}" aria-label="${e.zoom ? '元の大きさで見る' : '大きく見る'}">${ICON.zoom || ICON.plus}</button></div>`;
    const ranges = sel ? `<div class="ed-ranges"><button class="btn ghost sm ed-dup" data-act="ed-dup">${ICON.plus}同じパーツをもう1つ</button><label><span>大きさ</span><input type="range" data-ed-range="z" min="50" max="220" step="5" value="${Math.round(scaleOf(sel) * 100)}"><b class="num">${Math.round(scaleOf(sel) * 100)}%</b></label><label><span>向き</span><input type="range" data-ed-range="r" min="-180" max="180" step="5" value="${((sel.r || 0) + 540) % 360 - 180}"><b class="num">${((sel.r || 0) + 540) % 360 - 180}°</b></label></div>` : '';
    const layouts = Object.keys(D.LAYOUTS).map(k => `<button class="chip" data-act="ed-layout" data-v="${k}" aria-pressed="${e.layout === k}">${esc(D.LAYOUTS[k].name)}</button>`).join('');
    const sizes = U.seg(SIZES.map(z => ({ id: z, name: z })), 'ed-size', e.size, 'aria-label="大きさ"');
    const names = T.toppings.summary([spec]), painted = !!spec.shop;
    const capNote = overCap(st, d) ? T.toppings.capNote(st.sel) : null;
    const topMats = new Set(Object.values(D.KINDS).map(k => k.mat).concat(['tweezers', 'nail_glue']));
    const topCost = d.materials.filter(m => topMats.has(m.id) && !m.once).reduce((n, m) => n + m.subtotal, 0);
    return `${U.bar({ back: true, title: 'アイテムで飾る', right: '<button class="btn sm" data-act="ed-done">完成</button>' })}
      <div class="ed-fingers" role="group" aria-label="指を選ぶ">${fingers}</div>
      <div class="ed-stage${e.zoom ? ' zoom' : ''}">${corner}${nail}${tool}</div>
      ${ranges}
      ${capNote ? `<p class="cap-note">${esc(capNote)}</p>` : ''}
      <div class="ed-layouts" data-keep-scroll="ed-layouts">${layouts}</div>
      ${T.shop.tray(st)}
      <div class="ed-size"><span class="lab">大きさ</span>${sizes}<label class="ed-both"><input type="checkbox" data-act="ed-both" ${e.both ? 'checked' : ''}${d.foot ? ' disabled' : ''}>両手に同じ飾り</label></div>
      <div class="ed-foot">
        <p class="small muted">この指：<b>${esc(names || 'まだ何もありません')}</b></p>
        <p class="small muted">このデザインのトッピング材料：<b>${topCost ? U.yen(topCost) : 'なし'}</b>（${esc(T.TIER_INFO[st.sel.tier].label)}の目安）</p>
        <button class="btn ghost block" data-act="ed-copy">ほかの指にも同じ飾りをつける</button>
        ${T.stickersUI ? `<button class="btn ghost block" data-act="ed-sticker">${ICON.wand}このデザインをシールにする（シール工房へ）</button>` : ''}
        ${painted ? `<button class="btn ghost block" data-act="ed-unpaint">この指の色を、元のデザインに戻す</button>` : ''}
        <p class="disclaimer">${T.shop.NOTE}</p>
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
    'ed-add': (el, st) => {
      const it = { k: el.dataset.k, v: el.dataset.v }; if (el.dataset.shape) it.shape = el.dataset.shape;
      addPart(st, it); st.fx = 'pop'; T.app.render();
    },
    'ed-place': (el, st, pos) => {
      const list = clone(listOf(st)), it = pickItem(st); if (isFull(list)) return;
      list.push(Object.assign(it, { x: pos.x, y: pos.y, s: sizeFor(st, it.k) }, it.k === 'chain' ? { r: -28 } : {}));
      setList(st, list); st.editor.selected = list.length - 1; st.editor.layout = null; T.app.render();
    },
    'ed-move': (el, st, pos) => { const list = clone(listOf(st)); if (!list[pos.i]) return; list[pos.i].x = pos.x; list[pos.i].y = pos.y; setList(st, list); st.editor.selected = pos.i; T.app.render(); },
    'ed-select': (el, st, pos) => { st.editor.selected = pos.i; T.app.render(); },
    'ed-deselect': (el, st) => { st.editor.selected = null; T.app.render(); },
    'ed-transform': (el, st, p) => {
      const list = clone(listOf(st)), t = list[p.i]; if (!t) return;
      if (typeof p.z === 'number') { t.z = Math.round(Math.min(2.2, Math.max(0.5, p.z)) * 100) / 100; t.s = nearestSize(t.z); }
      if (typeof p.r === 'number') t.r = Math.round(p.r) % 360;
      setList(st, list); st.editor.selected = p.i; T.app.render();
    },
    'ed-front': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i] || i === list.length - 1) return; list.push(list.splice(i, 1)[0]); setList(st, list); st.editor.selected = list.length - 1; T.app.render(); },
    'ed-back': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i] || i === 0) return; list.unshift(list.splice(i, 1)[0]); setList(st, list); st.editor.selected = 0; T.app.render(); },
    'ed-undo': (el, st) => {
      const e = st.editor, k = keyOf(st); if (!e.undo || e.undo.key !== k || !e.undo.stack.length) return;
      const prev = e.undo.stack.pop(); if (prev) st.custom[k] = prev; else delete st.custom[k];
      e.selected = null; e.layout = null; T.app.persist(); T.app.render();
    },
    'ed-zoom': (el, st) => { st.editor.zoom = !st.editor.zoom; T.app.render(); },
    'ed-dup': (el, st) => {
      const i = st.editor.selected, list = clone(listOf(st)), t = list[i]; if (!t || isFull(list)) return;
      const d = designNow(st), { L } = T.nailPath(d.foot ? 'square' : st.sel.shape, d.foot ? 'short' : st.sel.length);
      const copy = clone(t), spot = freeSpot(list, copy, L); Object.assign(copy, { x: spot.x, y: spot.y });
      list.push(copy); setList(st, list); st.editor.selected = list.length - 1; st.fx = 'pop'; T.app.render();
    },
    // 並べ方: 選んでいるパーツだけを並べ直す（ほかの種類のパーツは残す）
    'ed-layout': (el, st) => {
      const it = pickItem(st), k = el.dataset.v, same = t => t.k === it.k && t.v === it.v && (t.shape || '') === (it.shape || '');
      const list = clone(listOf(st)).filter(t => !same(t)).concat(D.LAYOUTS[k].items.map(at => Object.assign({}, it, { x: at.x, y: at.y, s: D.KINDS[it.k].big && at.s === 'S' ? 'M' : at.s }, it.k === 'chain' ? { r: -28 } : {})));
      setList(st, list.slice(-MAX_PARTS)); st.editor.layout = k; st.editor.selected = null; st.fx = 'pop'; T.app.render();
    },
    'ed-size': (el, st) => {
      st.editor.size = el.dataset.v;
      const i = st.editor.selected, list = clone(listOf(st));
      if (i != null && list[i]) { list[i].s = sizeFor(st, list[i].k); delete list[i].z; setList(st, list); }
      T.app.render();
    },
    // ＋・−は1割ずつ（指の2本でも、下のつまみでも変えられる）
    'ed-bigger': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; T.actions['ed-transform'](null, st, { i, z: scaleOf(list[i]) * 1.12 }); },
    'ed-smaller': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; T.actions['ed-transform'](null, st, { i, z: scaleOf(list[i]) / 1.12 }); },
    'ed-rotate': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; list[i].r = ((list[i].r || 0) + 30) % 360; setList(st, list); T.app.render(); },
    'ed-remove': (el, st) => { const i = st.editor.selected, list = clone(listOf(st)); if (!list[i]) return; list.splice(i, 1); setList(st, list); st.editor.selected = null; T.app.render(); },
    'ed-both': (el, st) => { st.editor.both = !!el.checked; },
    'ed-copy': (el, st) => {
      const c = ensureCustom(st), src = clone(listOf(st)), e = st.editor;
      const paint = (c.paint && c.paint[e.side] && c.paint[e.side][e.finger]) || null;
      const sides = e.side === 'foot' ? ['foot'] : e.both ? ['left', 'right'] : [e.side];
      sides.forEach(side => {
        if (!c[side]) return;
        c[side] = c[side].map(() => clone(src));
        if (paint || (c.paint && c.paint[side])) { c.paint = c.paint || {}; c.paint[side] = [0, 1, 2, 3, 4].map(() => (paint ? clone(paint) : null)); }
      });
      T.app.persist(); T.app.toast('ほかの指にも同じ飾りをつけました'); T.app.render();
    },
    'ed-unpaint': (el, st) => { T.shop.setPaint(st, null); st.fx = 'paint'; T.app.render(); T.app.toast('この指の色を元に戻しました'); },
    'ed-reset': (el, st) => { pushUndo(st); delete st.custom[keyOf(st)]; st.editor.selected = null; st.editor.layout = null; T.app.persist(); T.app.toast('おまかせの飾りに戻しました'); T.app.render(); },
    'ed-sticker': (el, st) => {
      const d = designNow(st), e = st.editor;
      let widths = null; try { const v = JSON.parse(localStorage.getItem('tsume.nailwidths.v1')); if (Array.isArray(v) && v.length === 5) widths = v; } catch (err) {}
      const ok = T.stickersUI.addToSheet(st, { type: 'nail', conceptId: st.current.conceptId, paletteIndex: st.current.paletteIndex, side: d.foot ? 'foot' : e.side, fingers: [0, 1, 2, 3, 4], set: widths ? 'mine' : 'M', widths, shape: d.foot ? 'square' : st.sel.shape, length: d.foot ? 'short' : st.sel.length, count: 1 });
      if (!ok) return;
      T.app.toast('シール工房のシートに足しました（塗りとシールだけ。ストーンやパールは実物を置きます）');
      T.app.go('stickers');
    },
    'ed-done': (el, st) => { T.app.persist(); if (T.app.peek() === 'detail') T.app.back(); else T.app.go('detail', { replace: true }); },
  });
  // つまみ: 動かしている間は絵だけ変え、離したら保存する
  if (typeof document !== 'undefined') {
    const live = t => {
      const st = T.app.state, i = st.editor.selected, top = document.querySelector(`.ed-stage .tsume-top[data-i="${i}"] .tsume-top-pos`); if (!top) return;
      const list = listOf(st), it = list[i]; if (!it) return;
      const tf = top.getAttribute('transform') || '', m = tf.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)/);
      const zIn = document.querySelector('[data-ed-range="z"]'), rIn = document.querySelector('[data-ed-range="r"]');
      const z = zIn ? +zIn.value / 100 : scaleOf(it), r = rIn ? +rIn.value : it.r || 0;
      if (m) top.setAttribute('transform', `translate(${m[1]} ${m[2]}) rotate(${r}) scale(${(z / scaleOf(it)).toFixed(3)})`);
      const b = t.parentElement.querySelector('b'); if (b) b.textContent = t.dataset.edRange === 'z' ? `${t.value}%` : `${t.value}°`;
    };
    document.addEventListener('input', ev => { const t = ev.target; if (t && t.dataset && t.dataset.edRange) live(t); });
    document.addEventListener('change', ev => {
      const t = ev.target; if (!t || !t.dataset || !t.dataset.edRange) return;
      const st = T.app.state, i = st.editor.selected; if (i == null) return;
      T.actions['ed-transform'](null, st, t.dataset.edRange === 'z' ? { i, z: +t.value / 100 } : { i, r: +t.value });
    });
  }
  T.editor = { ensureCustom, enter, addPart, addMany, dropBook, placePart, scatter, inNail, listOf, scaleOf, pushUndo, MAX_PARTS };
})(typeof window !== 'undefined' ? window : globalThis);
