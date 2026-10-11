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
  };

  // ---- 保存（端末内だけ）
  const K = { saved: 'tsume.saved.v1', skin: 'tsume.skin.v1', custom: 'tsume.custom.v1' };
  function read(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function load() {
    const sv = read(K.saved, []); state.saved = Array.isArray(sv) ? sv.filter(x => x && typeof x === 'object' && typeof x.conceptId === 'string') : [];
    const sk = read(K.skin, 'natural'); state.skin = T.SKINS[sk] ? sk : 'natural';
    const cu = read(K.custom, {}); state.custom = sanitizeCustom(cu);
    state.saved.forEach(x => { if (x && x.toppings) x.toppings = sanitizeCustom({ k: x.toppings }).k || null; });
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
    if (HEX.test(t.col || '')) o.col = t.col;
    if (ID.test(t.shop || '')) o.shop = t.shop;
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
  function persist() { const a = write(K.saved, state.saved), b = write(K.skin, state.skin), c = write(K.custom, state.custom); return a && b && c; }

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
    return { id: Date.now().toString(36), conceptId: cur.conceptId, paletteIndex: cur.paletteIndex, sel: clone(state.sel), toppings: state.custom[key] ? clone(state.custom[key]) : null, skin: state.skin, ts: Date.now() };
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
    if (['try', 'mine', 'materials', 'colors', 'about', 'shop'].includes(hash)) state.view = hash;
  }
  T.app = { state, render, go, back, act, persist, toast, saveCurrent, markMade, isSaved, sanitizeCustom, peek: () => (history.length ? history[history.length - 1].view : null), STEPS: T.STEPS || [], hasDOM };
  if (hasDOM) render();
})(typeof window !== 'undefined' ? window : globalThis);
