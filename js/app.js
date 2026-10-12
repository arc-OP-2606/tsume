/* tsumé — 状態・保存・画面遷移・描画・クリックの振り分け（画面そのものは views-*.js） */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine;
  const hasDOM = typeof document !== 'undefined';
  const $app = hasDOM ? document.getElementById('app') : null;

  const state = {
    view: 'cover', step: 0, sel: E.defaults(), answered: {}, seed: 0, current: null, side: null, tab: 'look', stepIdx: 0,
    tryPick: 0, tryAmount: 'point', skin: 'natural', custom: {},
    editor: { finger: 3, side: 'left', selected: null, tab: 'stone', size: 'M', metal: 'gold', layout: null, both: true },
    sheet: null, saved: [], matTab: 'materials', matStore: 'all', season: E.seasonOf(), fx: null, sceneGroup: 'special',
    partItem: null, make: null, checks: {}, shopTab: 'color', shopItem: null, shopCycle: {},
    palettes: {}, kotoba: { text: '', result: null, busy: false }, voiceGuide: false,
    myColors: { gel: [], polish: [], items: [] }, mix: { target: null, kind: 'gel' },
  };

  // ---- 保存（端末内だけ）
  const K = { saved: 'tsume.saved.v1', skin: 'tsume.skin.v1', custom: 'tsume.custom.v1', palettes: 'tsume.palettes.v1', voice: 'tsume.voice.v1', mycolors: 'tsume.mycolors.v1' };
  function read(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function load() {
    const sv = read(K.saved, []); state.saved = Array.isArray(sv) ? sv.filter(x => x && typeof x === 'object' && typeof x.conceptId === 'string') : [];
    const sk = read(K.skin, 'natural'); state.skin = T.SKINS[sk] ? sk : 'natural';
    const cu = read(K.custom, {}); state.custom = sanitizeCustom(cu);
    state.saved.forEach(x => { if (x && x.toppings) x.toppings = sanitizeCustom({ k: x.toppings }).k || null; });
    // ことばで作った配色。保存したデザインが持っている配色も戻す
    const pl = read(K.palettes, {}); state.palettes = {};
    Object.keys(pl || {}).forEach(k => { const p = cleanPalette(k, pl[k]); if (p) state.palettes[k] = p; });
    state.saved.forEach(x => { if (typeof x.paletteIndex === 'string') { const p = cleanPalette(x.paletteIndex, x.palette); if (p) state.palettes[x.paletteIndex] = p; else x.paletteIndex = 0; } });
    state.voiceGuide = read(K.voice, false) === true;
    state.myColors = cleanMyColors(read(K.mycolors, null));
  }
  // 持っている色（ジェル・マニキュアは混ぜられないので分ける）
  const PHOTO_KINDS = ['stone', 'pearl', 'metal', 'sticker', 'other'];
  function cleanOwnedItem(c) {
    if (!c || typeof c !== 'object' || !ID.test(c.id || '')) return null;
    if (c.shop) return T.SHOP && T.SHOP.byId(c.shop) ? { id: c.id, shop: c.shop } : null;
    // 写真から取り込んだパーツ（画像は端末の IndexedDB。ここには鍵だけ）
    if (!/^idb:[\w-]{1,60}$/.test(c.img || '')) return null;
    const mm = typeof c.mm === 'number' && isFinite(c.mm) ? Math.min(30, Math.max(1, c.mm)) : 4;
    return { id: c.id, img: c.img, kind: PHOTO_KINDS.includes(c.kind) ? c.kind : 'other', mm, color: HEX.test(c.color || '') ? c.color : '#CCCCCC', name: String(c.name || '').replace(/[<>&"'`]/g, '').slice(0, 20) };
  }
  function cleanMyColors(v) {
    const out = { gel: [], polish: [], items: [] };
    if (!v || typeof v !== 'object') return out;
    if (Array.isArray(v.items)) out.items = v.items.map(cleanOwnedItem).filter(Boolean).slice(0, 120);
    ['gel', 'polish'].forEach(k => { if (Array.isArray(v[k])) out[k] = v[k].filter(c => c && ID.test(c.id || '') && HEX.test(c.hex || '')).slice(0, 60).map(c => ({ id: c.id, hex: c.hex.toUpperCase(), name: String(c.name || c.hex).replace(/[<>&"'`]/g, '').slice(0, 20), shop: ID.test(c.shop || '') ? c.shop : undefined })); });
    return out;
  }
  const ROLES = ['base', 'tip', 'accent', 'deep', 'light', 'metal'];
  function cleanPalette(k, p) {
    if (!/^k[\w-]{1,40}$/.test(k) || !p || typeof p !== 'object' || !ROLES.every(r => /^#[0-9a-fA-F]{6}$/.test(p[r]))) return null;
    const o = { name: typeof p.name === 'string' ? p.name.slice(0, 30) : 'ことばの色' }; ROLES.forEach(r => { o[r] = p[r]; }); return o;
  }
  // 壊れた保存データで画面が止まらないように、知らないパーツ・塗りは捨てる。色は #rrggbb だけ（SVG にそのまま入るため）
  const HEX = /^#[0-9a-fA-F]{6}$/, ID = /^[\w-]{1,40}$/, WORD = /^[a-z0-9_]{1,24}$/;
  const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const num = v => typeof v === 'number' && isFinite(v);
  function cleanItem(t) {
    if (!t || typeof t !== 'object' || !own(T.TOPPINGS.KINDS, t.k) || !num(t.x) || !num(t.y)) return null;
    const o = { k: t.k, x: Math.min(1, Math.max(0, t.x)), y: Math.min(1, Math.max(0, t.y)) };
    if (WORD.test(t.v || '')) o.v = t.v;
    if (WORD.test(t.shape || '')) o.shape = t.shape;
    if (own(T.TOPPINGS.SIZES, t.s)) o.s = t.s;
    if (num(t.r)) o.r = t.r;
    if (num(t.z)) o.z = Math.min(2.5, Math.max(0.4, t.z));
    if (HEX.test(t.col || '')) o.col = t.col;
    if (ID.test(t.shop || '')) o.shop = t.shop;
    if (t.k === 'photo') { if (!/^idb:[\w-]{1,60}$/.test(t.ref || '')) return null; o.ref = t.ref; o.mm = num(t.mm) ? Math.min(30, Math.max(1, Math.round(t.mm * 10) / 10)) : 4; }
    return o;
  }
  function cleanPaint(p) {
    if (!p || typeof p !== 'object' || !own(T.TECHNIQUES, p.t) || !p.c || typeof p.c !== 'object') return null;
    const c = {}; Object.keys(p.c).forEach(r => { if (/^[a-z]{2,8}$/.test(r) && HEX.test(p.c[r])) c[r] = p.c[r]; });
    return { t: p.t, c, shop: ID.test(p.shop || '') ? p.shop : undefined, cover: p.cover === true };
  }
  function sanitizeCustom(cu) {
    const out = {};
    if (!cu || typeof cu !== 'object' || Array.isArray(cu)) return out;
    Object.keys(cu).forEach(key => {
      const c = cu[key]; if (!c || typeof c !== 'object') return;
      const sides = {};
      ['left', 'right', 'foot'].forEach(side => { if (Array.isArray(c[side]) && c[side].length === 5) sides[side] = c[side].map(list => (Array.isArray(list) ? list.map(cleanItem).filter(Boolean) : [])); });
      if (c.paint && typeof c.paint === 'object') {
        const paint = {};
        ['left', 'right', 'foot'].forEach(side => { if (Array.isArray(c.paint[side]) && c.paint[side].length === 5) paint[side] = c.paint[side].map(cleanPaint); });
        if (Object.keys(paint).length) sides.paint = paint;
      }
      if (Object.keys(sides).length) out[key] = sides;
    });
    return out;
  }
  function persist() {
    // 配色は直近30件と、保存したデザインが使うものだけ残す
    const open = [state.current && state.current.paletteIndex, state.kotoba && state.kotoba.result && state.kotoba.result.key]; // 開いているデザインと、最新のことばの配色は残す
    const keepIds = new Set(state.saved.map(x => x.paletteIndex).concat(open).filter(v => typeof v === 'string').concat(Object.keys(state.palettes).slice(-30)));
    Object.keys(state.palettes).forEach(k => { if (!keepIds.has(k)) delete state.palettes[k]; });
    const a = write(K.saved, state.saved), b = write(K.skin, state.skin), c = write(K.custom, state.custom), d = write(K.palettes, state.palettes); write(K.voice, !!state.voiceGuide); write(K.mycolors, state.myColors);
    return a && b && c && d;
  }

  let toastTimer = null;
  function toast(msg) {
    if (!hasDOM) return;
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ---- 描画。横・縦スクロールの位置は data-keep-scroll の要素ごとに保つ（画面を移って戻っても残る）
  const keep = {};
  let entering = false, sheetWas = null;
  function render() {
    if (!$app) return;
    const view = T.views[state.view] ? state.view : 'try';
    $app.querySelectorAll('[data-keep-scroll]').forEach(el => { keep[el.dataset.keepScroll] = [el.scrollLeft, el.scrollTop]; });
    const html = T.views[view](state);
    // シートは .view の外に置く（.view のアニメーション中に位置がずれないように）
    const opening = !!state.sheet && !sheetWas; sheetWas = state.sheet;
    const sheet = state.sheet && T.ui.sheet ? T.ui.sheet(state, opening) : '';
    // 作るモードは全画面（position: fixed）。親に transform のアニメーションがあると一瞬つぶれるので、入場の動きをつけない
    $app.innerHTML = `<div class="view${entering && view !== 'make' ? ' enter' : ''}" data-view="${view}">${html}</div>${sheet}`;
    entering = false;
    $app.querySelectorAll('[data-keep-scroll]').forEach(el => { const k = keep[el.dataset.keepScroll]; if (k) { el.scrollLeft = k[0]; el.scrollTop = k[1]; } });
    document.body.dataset.view = view;
    document.body.classList.toggle('sheet-open', !!state.sheet);
    if (state.fx) { const s = $app.querySelector('.stage, .ed-stage'); if (s) { s.classList.add(state.fx); setTimeout(() => s.classList.remove('paint', 'pop'), 900); } state.fx = null; }
    if (opening) { const h = $app.querySelector('.sheet-head b'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    try { window.dispatchEvent(new CustomEvent('tsume:render', { detail: { view } })); } catch (e) {}
  }

  // ---- 画面遷移（ネイティブの戻るボタンは back() の戻り値で終了を判断）
  const history = [];
  const snapshot = () => ({ view: state.view, step: state.step, current: state.current ? Object.assign({}, state.current) : null, tab: state.tab, stepIdx: state.stepIdx, side: state.side });
  function go(view, opts) {
    opts = opts || {};
    const nextStep = opts.step != null ? opts.step : state.step;
    if (hasDOM && !opts.replace) { const prev = snapshot(); if (prev.view !== view || prev.step !== nextStep) history.push(prev); if (history.length > 40) history.shift(); }
    if (view === 'proposals' && state.view !== 'detail') delete keep.swipe; // 新しい提案は1枚目から
    state.view = view; state.sheet = null;
    if (opts.step != null) state.step = opts.step;
    entering = true;
    render();
    if (hasDOM) {
      window.scrollTo(0, 0);
      try { if (window.history && window.history.pushState) window.history.pushState({ tsume: true }, '', '#' + view); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('tsume:view', { detail: { view } })); } catch (e) {}
    }
  }
  function back() {
    if (state.sheet) { state.sheet = null; render(); return true; }
    const prev = history.pop();
    if (!prev) { if (state.view !== 'try' && state.view !== 'cover') { state.view = 'try'; entering = true; render(); return true; } return false; }
    const fromMake = state.view === 'make' && state.make;
    Object.assign(state, prev);
    // 作るモードから作り方へ戻るときは、作るモードで進んだ手順を開く（✕ でも、端末の戻るでも同じ）
    if (fromMake && state.view === 'detail') { state.stepIdx = fromMake.idx; state.tab = 'steps'; fromMake.celebrate = false; }
    entering = true; render(); if (hasDOM) window.scrollTo(0, 0); return true;
  }

  // ---- クリックの振り分け
  const SELECT_ACTS = ['pick', 'set', 'sel', 'trypick', 'tryamount', 'skin', 'palette', 'save', 'save-card', 'ed-add', 'ed-layout', 'tab', 'side', 'omakase'];
  function act(name, el, ev) {
    const fn = T.actions[name]; if (!fn) return;
    if (SELECT_ACTS.includes(name)) { try { window.dispatchEvent(new CustomEvent('tsume:select')); } catch (e) {} }
    fn(el, state, ev);
  }
  Object.assign(T.actions, {
    nav: el => go(el.dataset.view),
    back: () => { if (!back()) go('try'); },
    enter: () => go('try'),
  });

  const clone = o => JSON.parse(JSON.stringify(o));
  const findSaved = cur => state.saved.find(x => x.conceptId === cur.conceptId && x.paletteIndex === cur.paletteIndex);
  function savedItem(cur) {
    const key = T.ui.customKey(cur.conceptId, cur.paletteIndex);
    const x = { id: Date.now().toString(36), conceptId: cur.conceptId, paletteIndex: cur.paletteIndex, sel: clone(state.sel), toppings: state.custom[key] ? clone(state.custom[key]) : null, skin: state.skin, ts: Date.now() };
    if (typeof cur.paletteIndex === 'string' && state.palettes[cur.paletteIndex]) x.palette = clone(state.palettes[cur.paletteIndex]);
    return x;
  }
  function saveCurrent() {
    const cur = state.current; if (!cur) return;
    const idx = state.saved.indexOf(findSaved(cur));
    if (idx >= 0) { state.saved.splice(idx, 1); persist(); toast('マイデザインから外しました'); return false; }
    state.saved.unshift(savedItem(cur));
    toast(persist() ? 'マイデザインに保存しました' : 'この環境では保存できません（表示だけ）');
    return true;
  }
  /** 作るモードの「できた！」。保存していなければ保存し、作った日を残す（保存済みの中身は書き換えない） */
  function markMade() {
    const cur = state.current; if (!cur) return false;
    let x = findSaved(cur);
    if (!x) { x = savedItem(cur); state.saved.unshift(x); }
    x.madeAt = Date.now();
    return persist();
  }
  const isSaved = (conceptId, pi) => state.saved.some(x => x.conceptId === conceptId && x.paletteIndex === pi);

  if (hasDOM) {
    document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (!el || el.disabled) return; act(el.dataset.act, el, e); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.sheet) { state.sheet = null; render(); } });
    window.addEventListener('popstate', () => { back(); });
    load();
    const hash = (location.hash || '').replace('#', '');
    if (['try', 'mine', 'materials', 'colors', 'about', 'shop', 'kotoba', 'mix', 'stickers', 'lab', 'draw', 'recipes', 'gallery', 'scan', 'aigen', 'aivision', 'gallery-admin'].includes(hash) && T.views[hash]) state.view = hash;
  }
  T.app = { state, render, go, back, act, persist, toast, saveCurrent, markMade, isSaved, sanitizeCustom, cleanMyColors, peek: () => (history.length ? history[history.length - 1].view : null), STEPS: T.STEPS || [], hasDOM };
  // 共有リンク（#d=…）で開いたときは、そのデザインの作り方を開く（開けなければ、いつもの画面）
  if (hasDOM && !(T.share && T.share.openFromHash(state))) render();
})(typeof window !== 'undefined' ? window : globalThis);
