/* tsumé — 描くモード（画面）。大きな1本の爪に、指やタッチペンで描く。
   描いた線は SVG で見せ、描いている途中の1本だけ canvas に描く。手順・シール・保存は js/draw.js（T.draw） */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, D = T.draw;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const STICKER_KEY = 'tsume.stickers.v1';
  const MAX_STROKES = 300, MAX_TOTAL = 6000, MAX_PTS = 800;
  const FINGER_SHORT = ['親指', '人差し', '中指', '薬指', '小指'];
  const SIZES = [{ id: '0', name: '細' }, { id: '1', name: '中' }, { id: '2', name: '太' }];
  const svg = (d, fill) => `<svg viewBox="0 0 24 24" fill="${fill || 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    liner: svg('<path d="M4 20c3-1 5-4 8-8s6-7 8-8"/>'),
    brush: svg('<path d="M14.5 3.5l6 6-6.5 6.5-6-6z"/><path d="M8 10.2c-2.5.3-4 2-4.3 4.3L3 20l5.5-.7c2.3-.3 4-1.8 4.3-4.3"/>'),
    dot: svg('<circle cx="7" cy="8" r="2.2" fill="currentColor"/><circle cx="15" cy="12" r="3" fill="currentColor"/><circle cx="8" cy="17" r="1.6" fill="currentColor"/>'),
    bg: svg('<path d="M12 3.5c3 4 6 7 6 10.5a6 6 0 0 1-12 0c0-3.5 3-6.5 6-10.5z" fill="currentColor" fill-opacity="0.25"/>'),
    undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
    stop: svg('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>'),
  };

  // ---- 状態（st.dw）。d が今の絵。元に戻す・やり直すは、前の状態（地色と線の配列）を積む
  function fresh(st) {
    let bg = null, bgName = '';
    try {
      const cur = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex);
      if (cur && cur.palette && HEX.test(cur.palette.base || '')) { bg = cur.palette.base.toUpperCase(); bgName = `${cur.palette.name || 'デザイン'}の色`; }
    } catch (e) { bg = null; }
    const sel = st.sel || {};
    return D.blank({ shape: sel.shape, length: sel.length, bg, names: bg ? { [bg]: bgName } : {} });
  }
  function dws(st) {
    if (!st.dw || !st.dw.d) st.dw = { tool: 'liner', size: 1, color: '#1E1A1C', undo: [], redo: [], dirty: false, d: fresh(st) };
    return st.dw;
  }
  const total = d => d.strokes.reduce((n, s) => n + s.pts.length, 0);
  function commit(st, fn) {
    const w = dws(st), d = w.d;
    w.undo.push({ bg: d.bg, strokes: d.strokes }); if (w.undo.length > 100) w.undo.shift();
    w.redo = []; fn(d); w.dirty = true; w.added = null; w.confirm = null;
  }
  /** 描いた1本を足す（画面の外からも呼べる。検査でも使う） */
  function addStroke(st, s) {
    const w = dws(st), d = w.d;
    if (!s || !D.TOOLS[s.t] || s.t === 'bg' || !HEX.test(s.c || '') || !Array.isArray(s.pts) || !s.pts.length) return false;
    if (d.strokes.length >= MAX_STROKES || total(d) + s.pts.length > MAX_TOTAL) { T.app.toast('この絵は、もう描き足せません。保存して、新しく描いてください'); return false; }
    commit(st, x => { x.strokes = x.strokes.concat([{ t: s.t, c: s.c.toUpperCase(), w: s.w, pts: s.pts.slice(0, MAX_PTS) }]); });
    return true;
  }
  function setBg(st, hex) {
    const d = dws(st).d, v = HEX.test(hex || '') ? hex.toUpperCase() : null;
    if (d.bg === v) return;
    commit(st, x => { x.bg = v; });
  }
  function pickColor(st, hex, name) {
    if (!HEX.test(hex || '')) return;
    const w = dws(st), h = hex.toUpperCase(), nm = String(name || '').replace(/[<>&"'`]/g, '').trim().slice(0, 20);
    if (nm) w.d.names = Object.assign({}, w.d.names, { [h]: nm });
    // 地色を選んでいるときは、線の色は変えない（地色と同じ色で描いて、線が見えなくならないように）
    if (w.tool === 'bg') setBg(st, h); else w.color = h;
    T.app.render();
  }
  // 保存していない線があるときは、2回押して進む
  function guard(st, key, msg) {
    const w = dws(st);
    if (!w.dirty || !w.d.strokes.length) return true;
    if (w.confirm === key) { w.confirm = null; return true; }
    w.confirm = key; T.app.toast(msg); return false;
  }
  function reset(st, d) { const w = dws(st); stopPlay(true); w.d = d; w.undo = []; w.redo = []; w.dirty = false; w.added = null; w.confirm = null; w.confirmDel = null; }

  // ---- 画面
  const dot = (hex, cls) => `<i class="dw-dot${cls ? ' ' + cls : ''}" style="background:${HEX.test(hex || '') ? hex : 'transparent'}"></i>`;
  function swatch(w, hex, name) {
    const on = w.tool === 'bg' ? w.d.bg === hex : w.color === hex;
    return `<button class="dw-sw" data-act="dw-color" data-hex="${hex}" data-name="${esc(name)}" aria-pressed="${on}" aria-label="${esc(name)}"><i style="background:${hex}"></i></button>`;
  }
  function colorsBlock(st, w) {
    const own = (st.myColors && Array.isArray(st.myColors.gel) ? st.myColors.gel : []).filter(c => HEX.test(c.hex || ''));
    const now = w.tool === 'bg'
      ? `${w.d.bg ? dot(w.d.bg) : dot(null, 'bare')}<span>地色: <b>${esc(w.d.bg ? D.nameOf(w.d, w.d.bg) : 'なし（爪の色）')}</b></span>`
      : `${dot(w.color)}<span>いまの色: <b>${esc(D.nameOf(w.d, w.color))}</b></span>`;
    const pv = w.tool === 'bg' ? w.d.bg : w.color, pickVal = HEX.test(pv || '') ? pv.toLowerCase() : '#1e1a1c';
    return `<div class="dw-colors">
      <div class="dw-now">${now}</div>
      <div class="dw-pal" role="group" aria-label="よく使う色">${D.COLORS.map(c => swatch(w, c.hex, c.name)).join('')}</div>
      <h3 class="dw-sub">持っている色</h3>
      <div class="dw-pal" role="group" aria-label="持っている色">${own.length ? own.map(c => swatch(w, c.hex.toUpperCase(), c.name)).join('') : `<span class="small muted">まだありません。</span><button class="link dw-link" data-act="nav" data-view="mix">「色を混ぜて作る」で入れる</button>`}</div>
      <div class="dw-pickrow"><label class="chip dw-pick">${ICON.sliders}色を選ぶ<input id="dw-color-pick" type="color" value="${pickVal}" class="sr"></label>${w.tool === 'bg' ? `<button class="chip" data-act="dw-bg-none" aria-pressed="${!w.d.bg}">地色なし（爪の色）</button>` : ''}</div>
    </div>`;
  }
  // 保存した絵の小さな見本は、保存し直すまで同じ（1本描くたびに20枚を描き直さない）
  const thumbs = new Map();
  function thumb(x) {
    const k = `${x.id}:${x.ts}`;
    if (!thumbs.has(k)) { if (thumbs.size > 60) thumbs.clear(); thumbs.set(k, D.svg(x, { cls: 'dw-mini', label: '' })); }
    return thumbs.get(k);
  }
  function savedBlock(st, w) {
    const list = D.list(), when = ts => { const t = new Date(ts); return `${t.getMonth() + 1}/${t.getDate()}`; };
    return `<section class="dw-saved">
      <div class="dw-saved-head"><h2 class="dw-h">保存した絵</h2><button class="chip" data-act="dw-new">${ICON.plus}新しく描く</button></div>
      ${list.length ? `<ul class="dw-list" data-keep-scroll="dw-list">${list.map(x => `<li class="${x.id === w.d.id ? 'on' : ''}">
        <button class="dw-thumb" data-act="dw-open" data-id="${x.id}" aria-label="${esc(D.FINGERS[x.finger])}の絵（${when(x.ts)}）を開く">${thumb(x)}<span>${esc(FINGER_SHORT[x.finger])} ${when(x.ts)}</span></button>
        <button class="iconbtn dw-del${w.confirmDel === x.id ? ' warn' : ''}" data-act="dw-del" data-id="${x.id}" aria-label="${w.confirmDel === x.id ? 'もう一度押すと消えます' : 'この絵を消す'}">${ICON.trash}</button></li>`).join('')}</ul>`
        : '<p class="small muted">まだありません。描いたら上の「保存」を押してください（20枚まで）。</p>'}
    </section>`;
  }
  function noteBlock(w) {
    const a = w.added; if (!a) return '';
    return `<p class="dw-note">${ICON.check}<span>${a.ok ? `シール工房のシートに${a.n}枚足しました。` : 'シートに足しましたが、この環境では保存できません。'}${a.over ? `${a.over}枚が紙からはみ出しています。シール工房で数を減らすか、紙を大きくしてください。` : ''}${a.white ? '白い線は、家庭用のプリンターでは刷れません（白インクが無いため）。' : ''}</span><button class="link" data-act="nav" data-view="stickers">シール工房を開く${ICON.chev}</button></p>`;
  }
  T.views.draw = st => {
    const w = dws(st), d = w.d, L = D.lengthOf(d), tool = w.tool;
    const can = !hasDOM || typeof window.PointerEvent !== 'undefined';
    const any = d.strokes.length > 0;
    const sizes = tool === 'bg' ? '<p class="small muted dw-bg-help">下の色を選ぶと、爪全体の色が変わります。</p>'
      : `<div class="dw-row"><span class="lab">太さ</span>${U.seg(SIZES, 'dw-size', String(w.size), 'aria-label="太さ"')}</div>`;
    return `${U.bar({ back: true, title: '描く', right: `<button class="btn sm" data-act="dw-save" ${any || d.bg ? '' : 'disabled'}>保存</button>` })}
      <section class="dw">
        <p class="dw-lead">指やタッチペンで、爪に描けます。</p>
        ${U.seg(FINGER_SHORT.map((n, i) => ({ id: String(i), name: n })), 'dw-finger', String(d.finger), 'aria-label="指を選ぶ"')}
        <div class="dw-stage${w.playing ? ' playing' : ''}" style="aspect-ratio:112/${L + 12}">
          ${D.svg(d, { cls: 'dw-nail', linesCls: 'dw-lines', label: `${D.FINGERS[d.finger]}の爪` })}
          <canvas id="dw-canvas" class="dw-canvas" aria-label="${esc(D.FINGERS[d.finger])}の爪。ここに描く"></canvas>
        </div>
        ${can ? '' : '<p class="dw-warn">このブラウザでは描けません。新しいブラウザで開いてください。</p>'}
        ${w.penSeen ? `<div class="dw-penrow"><button class="chip" data-act="dw-pen" aria-pressed="${!!w.penOnly}">ペンだけで描く（手のひらは無視）</button></div>` : ''}
        <div class="dw-edit" role="toolbar" aria-label="描いた線">
          <button class="dw-ed" data-act="dw-undo" ${w.undo.length && !w.playing ? '' : 'disabled'}>${IC.undo}<span>戻す</span></button>
          <button class="dw-ed" data-act="dw-redo" ${w.redo.length && !w.playing ? '' : 'disabled'}>${IC.redo}<span>やり直す</span></button>
          <button class="dw-ed" data-act="dw-clear" ${any && !w.playing ? '' : 'disabled'}>${ICON.trash}<span>全部消す</span></button>
          <button class="dw-ed" data-act="dw-play" ${any ? '' : 'disabled'}>${w.playing ? IC.stop : ICON.play}<span>${w.playing ? '止める' : '再生'}</span></button>
        </div>
        <div class="dw-tools" role="group" aria-label="道具">${['liner', 'brush', 'dot', 'bg'].map(k => `<button class="dw-tool" data-act="dw-tool" data-v="${k}" aria-pressed="${tool === k}">${IC[k]}<span>${esc(D.TOOLS[k].name)}</span></button>`).join('')}</div>
        ${sizes}
        ${colorsBlock(st, w)}
        <div class="dw-acts">
          <button class="btn rose" data-act="dw-steps">${ICON.list}作り方を出す</button>
          <button class="btn ghost" data-act="dw-sticker" ${any ? '' : 'disabled'}>${ICON.wand}シールにする</button>
        </div>
        ${noteBlock(w)}
        ${savedBlock(st, w)}
        <p class="small muted">描いた絵は、この端末の中だけに保存します（どこにも送りません）。</p>
      </section>`;
  };

  // ---- シート: 作り方
  function stepsSheet(st, op) {
    const w = dws(st), steps = D.stepsFrom(w.d), kinds = [];
    steps.forEach(s => { const n = s.kind === 'base' && !s.color ? 'ベース' : D.KIND_NAME[s.kind]; if (n && !kinds.includes(n)) kinds.push(n); });
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet${op}" role="dialog" aria-modal="true" aria-label="作り方">
        <header class="sheet-head"><b>作り方（${esc(D.FINGERS[w.d.finger])}）</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <p class="small muted">描いた線から、${esc(kinds.join(' → '))} の順に並べました。</p>
          <ol class="dw-steps">${steps.map((s, i) => `<li><span class="dw-step-n num">${i + 1}</span><div><p>${esc(s.text)}</p><span class="dw-step-meta">${s.color ? `${dot(s.color, 'sm')}<span>${esc(s.colorName)}</span>` : ''}<span>${esc(s.brushName)}</span><span class="dw-cure ${s.cure}">${s.cure === 'tack' ? '仮硬化' : '硬化'}</span></span></div></li>`).join('')}</ol>
          <p class="small muted">硬化の時間は、お使いのライトとジェルの説明書を優先してください。下準備（形・甘皮・油分）は、いつもの手順で。</p>
        </div>
        <footer class="sheet-foot btnrow">${T.voice && T.voice.available() ? `<button class="btn ghost" data-act="dw-say">${ICON.voice}読み上げる</button>` : ''}<button class="btn rose" data-act="sheet-close">閉じる</button></footer>
      </section>`;
  }
  T.sheets = Object.assign(T.sheets || {}, { 'dw-steps': stepsSheet });

  // ---- シール工房のシート（st.stk が無ければ、シール工房の画面を一度作ると読み込まれる）
  function stickerSheet(st) {
    if (!st.stk) {
      try {
        if (T.stickersUI && T.stickersUI.stk) T.stickersUI.stk(st); // シール工房の状態だけ作る（保存から読む）
        else if (T.views.stickers) T.views.stickers(st);
      } catch (e) { /* 作れなくても、保存から読む */ }
    }
    if (st.stk && st.stk.sheet && Array.isArray(st.stk.sheet.items)) return st.stk.sheet;
    let v = null; try { v = JSON.parse(localStorage.getItem(STICKER_KEY)); } catch (e) { v = null; }
    return T.stickers.cleanSheet(v || {});
  }

  // ---- 描く（Pointer Events）
  let cur = null, anim = null;
  function ctxOf(cv, d) {
    const g = cv.getContext && cv.getContext('2d'); if (!g) return null;
    const L = D.lengthOf(d), sx = cv.width / 112, sy = cv.height / (L + 12);
    g.save(); g.setTransform(sx, 0, 0, sy, 6 * sx, 6 * sy);
    if (typeof Path2D !== 'undefined') { try { g.clip(new Path2D(D.pathOf(d))); } catch (e) { /* 切らずに描く */ } }
    return g;
  }
  const yOf = (q, L) => (q[1] * L) / 100;
  // 線の i 番目の点まで（dot・1点は丸）
  function paintSeg(g, s, L, i) {
    g.fillStyle = g.strokeStyle = s.c; g.lineCap = 'round'; g.lineJoin = 'round';
    const q = s.pts[i];
    if (i === 0 || s.t === 'dot') { g.beginPath(); g.arc(q[0], yOf(q, L), D.widthAt(s, q[2]) / 2, 0, Math.PI * 2); g.fill(); return; }
    const p = s.pts[i - 1], pr = [p[2], q[2]].filter(v => typeof v === 'number');
    g.lineWidth = D.widthAt(s, pr.length ? pr.reduce((a, b) => a + b, 0) / pr.length : undefined);
    g.beginPath(); g.moveTo(p[0], yOf(p, L)); g.lineTo(q[0], yOf(q, L)); g.stroke();
  }
  function paintLive(i) {
    const cv = cur && cur.cv, d = dws(T.app.state).d; if (!cv) return;
    const g = ctxOf(cv, d); if (!g) return;
    paintSeg(g, cur.s, D.lengthOf(d), i); g.restore();
  }
  function pointOf(ev, cv, L) {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return null;
    const ux = -6 + ((ev.clientX - r.left) / r.width) * 112, uy = -6 + ((ev.clientY - r.top) / r.height) * (L + 12);
    const q = [Math.round(Math.max(0, Math.min(100, ux)) * 10) / 10, Math.round(Math.max(0, Math.min(100, (uy / L) * 100)) * 10) / 10];
    if (ev.pointerType === 'pen' && typeof ev.pressure === 'number' && ev.pressure > 0) q.push(Math.round(ev.pressure * 100) / 100);
    return q;
  }
  function finish() {
    if (!cur) return;
    const s = cur.s; cur = null;
    if (addStroke(T.app.state, s)) T.app.render();
  }
  function down(ev) {
    const st = T.app.state, w = st.dw; if (!w || w.playing) return;
    // タッチペンを一度使ったら、手のひらが触れても描かない（「ペンだけで描く」を外すと、指でも描ける）
    if (ev.pointerType === 'pen') { if (!w.penSeen) { w.penSeen = true; w.penOnly = true; } }
    else if (w.penOnly && ev.pointerType === 'touch') {
      if (!w.penTold) { w.penTold = true; T.app.toast('いまはペンだけで描きます。指で描くときは「ペンだけで描く」を外してください'); }
      return;
    }
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    // 2本目の指は使わない。前の線が終わらずに残っていたら（画面が描き直された時など）、描き直さずに足す
    if (cur) { if (cur.cv.isConnected && cur.id !== ev.pointerId) return; const s = cur.s; cur = null; addStroke(st, s); }
    const cv = ev.currentTarget, d = w.d, L = D.lengthOf(d);
    if (w.tool === 'bg') { T.app.toast('下の色を選ぶと、爪全体の色が変わります'); return; }
    const q = pointOf(ev, cv, L); if (!q) return;
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 古いブラウザ */ }
    const tool = D.TOOLS[w.tool];
    cur = { id: ev.pointerId, cv, s: { t: w.tool, c: w.color, w: tool.sizes[w.size] || tool.sizes[1], pts: [q] } };
    paintLive(0);
  }
  function move(ev) {
    if (!cur || ev.pointerId !== cur.id || cur.s.t === 'dot') return;
    ev.preventDefault();
    const d = dws(T.app.state).d, L = D.lengthOf(d), pts = cur.s.pts;
    const evs = typeof ev.getCoalescedEvents === 'function' ? ev.getCoalescedEvents() : null;
    for (const e of (evs && evs.length ? evs : [ev])) {
      if (pts.length >= MAX_PTS) break;
      const q = pointOf(e, cur.cv, L), l = pts[pts.length - 1];
      if (!q || Math.hypot(q[0] - l[0], ((q[1] - l[1]) * L) / 100) < 0.7) continue;
      pts.push(q); paintLive(pts.length - 1);
    }
  }
  function up(ev) { if (cur && ev.pointerId === cur.id) finish(); }
  function setup() {
    const cv = document.getElementById('dw-canvas'); if (!cv) return;
    const r = cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round((r.width || 240) * dpr)); cv.height = Math.max(1, Math.round((r.height || 320) * dpr));
    if (cv.dataset.bound) return;
    cv.dataset.bound = '1';
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => cv.addEventListener(t, up));
  }

  // ---- 描いた順に再生
  let playId = 0;
  // 絵の中の from 番目から to 番目の手前までの点を描く（線をまたいで数える）
  function paintRange(g, d, L, from, to) {
    let base = 0;
    for (const s of d.strokes) {
      const n = s.pts.length;
      if (base + n > from) for (let i = Math.max(0, from - base); i < Math.min(n, to - base); i++) paintSeg(g, s, L, i);
      base += n; if (base >= to) break;
    }
  }
  function stopPlay(silent) {
    playId++;
    if (anim && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(anim);
    anim = null;
    const w = T.app.state.dw; if (w && w.playing) { w.playing = false; if (!silent) T.app.render(); }
  }
  function play(st) {
    const w = dws(st), d = w.d;
    if (w.playing) { stopPlay(); return; }
    if (!d.strokes.length) { T.app.toast('まだ線がありません'); return; }
    if (!hasDOM || typeof requestAnimationFrame !== 'function') return;
    const my = ++playId;
    w.playing = true; T.app.render();
    const all = total(d), dur = Math.max(1500, Math.min(8000, all * 12)), L = D.lengthOf(d), t0 = performance.now();
    // 毎回はじめから描き直さず、増えた点だけ足す。画面が描き直されて canvas が変わったときだけ、はじめから
    let drawn = 0, lastCv = null, lastW = 0;
    const frame = now => {
      if (my !== playId) return;
      const cv = document.getElementById('dw-canvas');
      if (!cv || T.app.state.view !== 'draw' || !w.playing || T.app.state.dw !== w || w.d !== d) { stopPlay(T.app.state.view !== 'draw'); return; }
      const k = Math.min(1, (now - t0) / dur), n = Math.ceil(all * k);
      if (cv !== lastCv || cv.width !== lastW) { const g0 = cv.getContext('2d'); if (g0) { g0.setTransform(1, 0, 0, 1, 0, 0); g0.clearRect(0, 0, cv.width, cv.height); } drawn = 0; lastCv = cv; lastW = cv.width; }
      if (n > drawn) { const g = ctxOf(cv, d); if (g) { paintRange(g, d, L, drawn, n); g.restore(); } drawn = n; }
      if (k < 1) anim = requestAnimationFrame(frame);
      else { anim = null; setTimeout(() => { if (my === playId && w.playing) stopPlay(); }, 500); }
    };
    anim = requestAnimationFrame(frame);
  }

  if (hasDOM) {
    window.addEventListener('tsume:render', e => { if (e.detail && e.detail.view === 'draw') setup(); });
    window.addEventListener('resize', () => { if (T.app && T.app.state.view === 'draw') setup(); });
    document.addEventListener('change', e => {
      const t = e.target, st = T.app && T.app.state; if (!t || t.id !== 'dw-color-pick' || !st || !HEX.test(t.value)) return;
      const nm = T.mixView && T.mixView.nearName ? T.mixView.nearName(t.value) : t.value.toUpperCase();
      pickColor(st, t.value, nm);
    });
    document.addEventListener('keydown', e => {
      const st = T.app && T.app.state; if (!st || st.view !== 'draw' || st.sheet || !(e.metaKey || e.ctrlKey) || String(e.key).toLowerCase() !== 'z') return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'color') return;
      e.preventDefault(); T.actions[e.shiftKey ? 'dw-redo' : 'dw-undo'](null, st);
    });
  }

  Object.assign(T.actions, {
    /** ほかの画面から「描く」を開く。まだ何も描いていなければ、いまのデザインの地色で始める */
    'dw-start': (el, st) => {
      const w = dws(st);
      if (!w.d.strokes.length && !w.dirty) reset(st, fresh(st));
      else if (fresh(st).bg !== w.d.bg) { T.app.go('draw'); T.app.toast('描きかけの絵を開きました。この色で描くときは、下の「新しく描く」'); return; }
      T.app.go('draw');
    },
    'dw-finger': (el, st) => { const w = dws(st), i = Number(el.dataset.v); if (Number.isInteger(i) && i >= 0 && i <= 4 && w.d.finger !== i) { w.d.finger = i; if (w.d.strokes.length) w.dirty = true; } T.app.render(); },
    'dw-pen': (el, st) => { const w = dws(st); w.penOnly = !w.penOnly; w.penTold = false; T.app.toast(w.penOnly ? 'ペンだけで描きます（指や手のひらは無視）' : '指でも描けます'); T.app.render(); },
    'dw-tool': (el, st) => { const w = dws(st); if (D.TOOLS[el.dataset.v]) w.tool = el.dataset.v; T.app.render(); },
    'dw-size': (el, st) => { dws(st).size = Math.max(0, Math.min(2, Math.round(+el.dataset.v) || 0)); T.app.render(); },
    'dw-color': (el, st) => pickColor(st, el.dataset.hex, el.dataset.name),
    'dw-bg-none': (el, st) => { setBg(st, null); T.app.render(); },
    'dw-undo': (el, st) => {
      const w = dws(st), d = w.d; if (!w.undo.length || w.playing) return;
      w.redo.push({ bg: d.bg, strokes: d.strokes }); const s = w.undo.pop(); d.bg = s.bg; d.strokes = s.strokes; w.dirty = true; w.added = null; T.app.render();
    },
    'dw-redo': (el, st) => {
      const w = dws(st), d = w.d; if (!w.redo.length || w.playing) return;
      w.undo.push({ bg: d.bg, strokes: d.strokes }); const s = w.redo.pop(); d.bg = s.bg; d.strokes = s.strokes; w.dirty = true; w.added = null; T.app.render();
    },
    'dw-clear': (el, st) => { const w = dws(st); if (!w.d.strokes.length || w.playing) return; commit(st, d => { d.strokes = []; }); T.app.render(); T.app.toast('線を全部消しました（「戻す」で戻せます）'); },
    'dw-play': (el, st) => play(st),
    'dw-steps': (el, st) => { stopPlay(true); st.sheet = 'dw-steps'; T.app.render(); },
    'dw-say': (el, st) => { if (!T.voice || !T.voice.speak(D.stepsFrom(dws(st).d).map(s => s.text))) T.app.toast('この端末では読み上げできません'); },
    'dw-sticker': (el, st) => {
      const w = dws(st), d = w.d;
      if (!T.stickers || !T.stickers.cleanSheet) { T.app.toast('シール工房が読み込まれていません'); return; }
      if (!d.strokes.length) { T.app.toast('まだ線がありません'); return; }
      const item = D.toSticker(d, { count: 2 });
      if (!item) { T.app.toast('爪の中に線がありません'); return; }
      const sheet = stickerSheet(st);
      if (sheet.items.length >= 40) { T.app.toast('シートに入るのは40種類まで。シール工房で減らしてください'); return; }
      sheet.items.push(item);
      let ok = true; try { localStorage.setItem(STICKER_KEY, JSON.stringify(sheet)); } catch (e) { ok = false; }
      let over = 0; try { over = T.stickers.layout(sheet.items, sheet.paper).overflow.length; } catch (e) { over = 0; }
      w.added = { n: item.count, white: D.hasWhite(d), ok, over };
      T.app.render();
    },
    'dw-save': (el, st) => {
      const w = dws(st), d = w.d;
      if (!d.strokes.length && !d.bg) { T.app.toast('まだ何も描いていません'); return; }
      const before = D.list(), isNew = !before.some(x => x.id === d.id);
      const r = D.save(d);
      // 20枚を超えたとき・端末の空きが足りないときは、古い絵から消える。消えた枚数を知らせる
      const lost = r ? Math.max(0, before.length + (isNew ? 1 : 0) - D.list().length) : 0;
      if (r) { w.dirty = false; w.confirm = null; T.app.toast(lost ? `保存しました（古い絵が${lost}枚消えました）` : 'この端末に保存しました'); } else T.app.toast('この環境では保存できません');
      T.app.render();
    },
    'dw-new': (el, st) => { if (!guard(st, 'new', '保存していない線は消えます。もう一度押すと、新しく描きます')) return; reset(st, fresh(st)); T.app.render(); if (hasDOM) window.scrollTo(0, 0); },
    'dw-open': (el, st) => {
      const id = el.dataset.id, x = D.get(id); if (!x) { T.app.toast('開けませんでした'); T.app.render(); return; }
      if (x.id === dws(st).d.id && !dws(st).dirty) { if (hasDOM) window.scrollTo(0, 0); return; }
      if (!guard(st, 'open:' + id, '保存していない線は消えます。もう一度押すと開きます')) return;
      reset(st, x); T.app.render(); if (hasDOM) window.scrollTo(0, 0);
    },
    'dw-del': (el, st) => {
      const w = dws(st), id = el.dataset.id;
      if (w.confirmDel !== id) { w.confirmDel = id; T.app.toast('もう一度押すと、この絵を消します'); T.app.render(); return; }
      w.confirmDel = null; T.app.toast(D.remove(id) ? '消しました' : '消せませんでした'); T.app.render();
    },
  });
  T.drawView = { addStroke, state: dws, stepsSheet };
})(typeof window !== 'undefined' ? window : globalThis);
