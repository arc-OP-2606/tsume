/* tsumé — わたしの爪アトリエ（画面 'draw'）。大きな1本の爪に、指やタッチペンで描き、パーツを置き、デザインの指にのせる。
   描いた線は SVG で見せ、描いている途中の1本だけ canvas に描く。手順・シール・保存は js/draw.js（T.draw）、指にのせるのは js/atelier.js。
   スマホ向け（指）とタブレット向け（ペン）で、線のならし方・太さ・手のひらの扱い・道具の並べ方を変える */
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
  const SIZES_TAB = [{ id: 'x', name: '極細' }].concat(SIZES);
  const ZOOMS = [1, 2, 4];
  // 線のならし: 新しい点へ寄せる割合（小さいほど強くならす）。指はぶれるので強め、ペンはほぼそのまま
  const SMOOTH = { phone: 0.45, tablet: 0.85 };
  // スマホ向けかタブレット向けか。自分で選んだもの → 無ければ画面の短い辺が 700px 以上かペンを使ったらタブレット向け
  const DEV_KEY = 'tsume.atelier.device.v1';
  function devPref() { try { const v = localStorage.getItem(DEV_KEY); return v === 'phone' || v === 'tablet' ? v : null; } catch (e) { return null; } }
  function device(st) {
    const w = st.dw, pref = devPref(); if (pref) return pref;
    if (w && w.penSeen) return 'tablet';
    return hasDOM && Math.min(window.innerWidth || 0, window.innerHeight || 0) >= 700 ? 'tablet' : 'phone';
  }
  /** 太さ（'x' は極細＝細の半分） */
  const widthOf = (tool, size) => (size === 'x' ? Math.max(0.5, tool.sizes[0] / 2) : tool.sizes[size] || tool.sizes[1]);
  /** ペンだけで描くか（タブレット向けは最初から。自分で切り替えたらそれ） */
  const penOnly = (st, w) => (typeof w.penOnly === 'boolean' ? w.penOnly : device(st) === 'tablet');
  const svg = (d, fill) => `<svg viewBox="0 0 24 24" fill="${fill || 'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC = {
    liner: svg('<path d="M4 20c3-1 5-4 8-8s6-7 8-8"/>'),
    brush: svg('<path d="M14.5 3.5l6 6-6.5 6.5-6-6z"/><path d="M8 10.2c-2.5.3-4 2-4.3 4.3L3 20l5.5-.7c2.3-.3 4-1.8 4.3-4.3"/>'),
    dot: svg('<circle cx="7" cy="8" r="2.2" fill="currentColor"/><circle cx="15" cy="12" r="3" fill="currentColor"/><circle cx="8" cy="17" r="1.6" fill="currentColor"/>'),
    bg: svg('<path d="M12 3.5c3 4 6 7 6 10.5a6 6 0 0 1-12 0c0-3.5 3-6.5 6-10.5z" fill="currentColor" fill-opacity="0.25"/>'),
    undo: svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    redo: svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
    stop: svg('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>'),
    eraser: svg('<path d="M15.5 4.5l4 4-9.5 9.5H6l-2-2z"/><path d="M10 18h10"/>'),
  };
  // 消しゴム（線は残さず、なぞった所にかかる線を消す）。draw.js の道具とは別に持つ
  const ERASER = { name: '消しゴム', sizes: [4, 8, 14] };
  const toolOf = k => (k === 'eraser' ? ERASER : D.TOOLS[k]);
  // なぞって描くお手本（幅100・高さ100の枠。爪の長さに合わせて縦に伸ばす）
  const GUIDES = [
    { id: 'none', name: 'なし', d: '' },
    { id: 'flower', name: '小花', d: [0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180, x = 50 + Math.sin(r) * 11, y = 42 - Math.cos(r) * 7; return `M ${(x + 7).toFixed(1)} ${y.toFixed(1)} a 7 4.5 0 1 0 -14 0 a 7 4.5 0 1 0 14 0`; }).join(' ') + ' M 53 42 a 3 2 0 1 0 -6 0 a 3 2 0 1 0 6 0' },
    { id: 'heart', name: 'ハート', d: 'M 50 58 C 22 42 30 24 44 28 C 48 29 50 33 50 35 C 50 33 52 29 56 28 C 70 24 78 42 50 58 Z' },
    { id: 'french', name: 'フレンチ', d: 'M 4 30 Q 50 12 96 30' },
    { id: 'twig', name: '小枝', d: 'M 34 92 C 40 70 46 50 62 18 M 46 62 C 56 58 64 52 72 44 M 40 76 C 32 70 26 62 22 52' },
  ];

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
    if (!st.dw || !st.dw.d) st.dw = { tool: 'liner', size: device(st) === 'phone' ? 2 : 1, color: '#1E1A1C', undo: [], redo: [], hist: [], pLen: null, mode: 'draw', zoom: { k: 1, x: 0, y: 0 }, dirty: false, d: fresh(st) };
    return st.dw;
  }
  const total = d => d.strokes.reduce((n, s) => n + s.pts.length, 0);
  function commit(st, fn) {
    const w = dws(st), d = w.d;
    w.undo.push({ bg: d.bg, strokes: d.strokes }); if (w.undo.length > 100) w.undo.shift();
    w.redo = []; fn(d); w.dirty = true; w.added = null; w.confirm = null; w.hist.push('d');
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
  function reset(st, d) { const w = dws(st); stopPlay(true); w.d = d; w.undo = []; w.redo = []; w.hist = []; w.pLen = null; w.zoom = { k: 1, x: 0, y: 0 }; w.dirty = false; w.added = null; w.confirm = null; w.confirmDel = null; }
  // ---- パーツ（エディタの仕組みをそのまま使う。指と手はアトリエに合わせる）
  const sideOf = (st, w) => { const d = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex); return !d ? null : d.foot ? 'foot' : (w.side || st.editor.side !== 'foot' && st.editor.side || U.showcaseSide(st.sel)); };
  function syncEditor(st, w) {
    const side = sideOf(st, w); if (!side) return false;
    const e = st.editor;
    if (e.side !== side || e.finger !== w.d.finger) { e.side = side; e.finger = w.d.finger; e.selected = null; e.layout = null; }
    return true;
  }
  // パーツの「元に戻す」が増えた分を、アトリエの取り消しの順番（w.hist）に入れる
  function syncHist(st, w) {
    const u = st.editor.undo, n = u && st.current && u.key === U.customKey(st.current.conceptId, st.current.paletteIndex) ? u.stack.length : 0;
    if (w.pLen != null && n > w.pLen) for (let i = w.pLen; i < n; i++) w.hist.push('p');
    if (w.pLen != null && n < w.pLen) { let k = w.pLen - n; for (let i = w.hist.length - 1; i >= 0 && k > 0; i--) if (w.hist[i] === 'p') { w.hist.splice(i, 1); k--; } }
    w.pLen = n;
  }

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
  const zoomStyle = z => (z && z.k > 1 ? ` style="transform:translate(${z.x.toFixed(1)}px,${z.y.toFixed(1)}px) scale(${z.k})"` : '');
  /** お手本の薄い点線（なぞる下書き。保存しない・爪にはのらない） */
  function guideSvg(w, L) {
    const g = GUIDES.find(x => x.id === w.guide); if (!g || !g.d) return '';
    return `<svg class="dw-guide" viewBox="-6 -6 112 ${L + 12}" aria-hidden="true"><path d="${g.d}" transform="scale(1 ${(L / 100).toFixed(3)})" fill="none" stroke="#7A6B6F" stroke-width="1.4" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" opacity="0.75"/></svg>`;
  }
  /** 描きながら見る、小さな手の絵（今のデザイン＋描いている爪） */
  function miniHand(st, w) {
    if (!st.current) return '';
    const d = U.designFor(st.current.conceptId, st.current.paletteIndex), side = sideOf(st, w); if (!d || d.foot) return '';
    const L = T.nailPath(st.sel.shape, st.sel.length).L, f = w.d.finger;
    const layer = `<g class="tsume-art">${w.d.bg ? `<rect x="-2" y="-2" width="104" height="${L + 20}" fill="${w.d.bg}"/>` : ''}${w.d.strokes.map(x => D.strokeSvg(x, L)).join('')}</g>`;
    const specs = (side === 'left' ? d.left : d.right).map((x, i) => (i === f ? Object.assign({}, x, { art: null, artLayer: layer }) : x));
    return `<div class="at-mini" aria-hidden="true">${T.renderHand(specs, d.palette, { side, shape: st.sel.shape, length: st.sel.length, seed: 11, viewBox: '50 50 320 380' })}</div>`;
  }
  function attachBlock(st, w) {
    if (!st.current) return '<p class="small muted at-note">デザインを選んでから開くと、描いた爪をそのデザインの指にのせられます（パーツも置けます）。</p>';
    const side = sideOf(st, w), on = T.atelier && T.atelier.artOf(st, side, w.d.finger);
    const hand = side === 'left' ? '左手' : side === 'right' ? '右手' : '足';
    const both = side !== 'foot';
    return `<div class="at-attach"><button class="btn rose block" data-act="at-attach">${ICON.check}${esc(hand)}の${esc(D.FINGERS[w.d.finger])}にのせる</button>
      <div class="btnrow at-all"><button class="btn ghost" data-act="at-attach-all" data-v="side">${esc(hand)}の5本ぜんぶに</button>${both ? '<button class="btn ghost" data-act="at-attach-all" data-v="both">両手の10本に</button>' : ''}</div>
      ${on ? `<button class="link" data-act="at-detach">この指から絵を外す</button>` : ''}</div>`;
  }
  function partsBlock(st, w) {
    if (!st.current || !syncEditor(st, w)) return { stage: `<div class="dw-stage at-empty" style="aspect-ratio:112/${D.lengthOf(w.d) + 12}">${D.svg(w.d, { cls: 'dw-nail', label: '' })}</div>`, side: '<p class="small muted">パーツは、デザインを選んでから置けます。提案や「マイデザイン」から開いてください。</p>' };
    const d = U.designFor(st.current.conceptId, st.current.paletteIndex), e = st.editor;
    const specs = d.foot || (e.side === 'left' ? d.left : d.right);
    const shape = d.foot ? 'square' : st.sel.shape, length = d.foot ? 'short' : st.sel.length, L = T.nailPath(shape, length).L;
    const art = `<g class="tsume-art">${w.d.bg ? `<rect x="-2" y="-2" width="104" height="${L + 20}" fill="${w.d.bg}"/>` : ''}${w.d.strokes.map(x => D.strokeSvg(x, L)).join('')}</g>`;
    const s = T.editor.stage(st, { d, specs, shape, length, seedBase: 11 + (e.side === 'left' ? 100 : 0), artLayer: art });
    return { stage: `<div class="ed-stage at-ed">${s.nail}${s.tool}</div>`, side: `${s.ranges}${T.shop.tray(st)}` };
  }
  T.views.draw = st => {
    const w = dws(st), d = w.d, L = D.lengthOf(d), tool = w.tool, dev = device(st), parts = w.mode === 'parts';
    const can = !hasDOM || typeof window.PointerEvent !== 'undefined';
    const any = d.strokes.length > 0;
    if (parts && st.current) syncHist(st, w); else if (st.current && w.pLen == null) syncHist(st, w);
    if (dev === 'phone' && w.size === 'x') w.size = 0;
    const sizes = tool === 'bg' ? '<p class="small muted dw-bg-help">下の色を選ぶと、爪全体の色が変わります。</p>'
      : `<div class="dw-row"><span class="lab">太さ</span>${U.seg(dev === 'tablet' ? SIZES_TAB : SIZES, 'dw-size', String(w.size), 'aria-label="太さ"')}</div>`;
    const P = parts ? partsBlock(st, w) : null;
    const stage = parts ? P.stage : `<div class="dw-stage${w.playing ? ' playing' : ''}" style="aspect-ratio:112/${L + 12}">
          ${D.svg(d, { cls: 'dw-nail', linesCls: 'dw-lines', label: `${D.FINGERS[d.finger]}の爪` })}
          ${guideSvg(w, L)}
          <canvas id="dw-canvas" class="dw-canvas" aria-label="${esc(D.FINGERS[d.finger])}の爪。ここに描く"></canvas>
        </div>`;
    const undoOk = w.hist.length && !w.playing;
    const drawTools = `
        <div class="dw-tools" role="group" aria-label="道具">${['liner', 'brush', 'dot', 'eraser', 'bg'].map(k => `<button class="dw-tool" data-act="dw-tool" data-v="${k}" aria-pressed="${tool === k}">${IC[k]}<span>${esc(toolOf(k).name)}</span></button>`).join('')}</div>
        <div class="dw-row at-guides"><span class="lab">お手本</span><div class="chips">${GUIDES.map(g => `<button class="chip" data-act="dw-guide" data-v="${g.id}" aria-pressed="${(w.guide || 'none') === g.id}">${esc(g.name)}</button>`).join('')}</div></div>
        ${sizes}
        ${colorsBlock(st, w)}`;
    return `${U.bar({ back: true, title: 'わたしの爪アトリエ', right: `<button class="btn sm" data-act="dw-save" ${any || d.bg ? '' : 'disabled'}>保存</button>` })}
      <section class="dw at at-${dev}">
        <div class="at-top">
          ${U.seg([{ id: 'draw', name: '描く' }, { id: 'parts', name: 'パーツ' }], 'at-mode', parts ? 'parts' : 'draw', 'aria-label="描く・パーツ"')}
          ${U.seg([{ id: 'phone', name: 'スマホ向け' }, { id: 'tablet', name: 'タブレット向け' }], 'at-dev', dev, 'aria-label="画面の向き"')}
        </div>
        ${U.seg(FINGER_SHORT.map((n, i) => ({ id: String(i), name: n })), 'dw-finger', String(d.finger), 'aria-label="指を選ぶ"')}
        <div class="at-main">
          <div class="at-left">
            <div class="at-view${w.zoom.k > 1 ? ' zoomed' : ''}" data-at-view>
              <div class="at-zoom"${zoomStyle(w.zoom)}>${stage}</div>
              <i class="at-hover" aria-hidden="true"></i>
              ${parts ? '' : miniHand(st, w)}
            </div>
            <div class="at-zoombar" role="group" aria-label="拡大">${ZOOMS.map(k => `<button class="chip" data-act="at-zoom" data-v="${k}" aria-pressed="${w.zoom.k === k}">${k}×</button>`).join('')}<span class="small muted">2本指でも拡大・移動</span></div>
            ${can ? '' : '<p class="dw-warn">このブラウザでは描けません。新しいブラウザで開いてください。</p>'}
          </div>
          <div class="at-right">
            ${!parts && (w.penSeen || dev === 'tablet') ? `<div class="dw-penrow"><button class="chip" data-act="dw-pen" aria-pressed="${penOnly(st, w)}">ペンだけで描く（手のひらは無視）</button></div>` : ''}
            <div class="dw-edit" role="toolbar" aria-label="描いた線とパーツ">
              <button class="dw-ed" data-act="dw-undo" ${undoOk ? '' : 'disabled'}>${IC.undo}<span>戻す</span></button>
              <button class="dw-ed" data-act="dw-redo" ${w.redo.length && !w.playing && !parts ? '' : 'disabled'}>${IC.redo}<span>やり直す</span></button>
              <button class="dw-ed" data-act="dw-clear" ${any && !w.playing && !parts ? '' : 'disabled'}>${ICON.trash}<span>線を全部消す</span></button>
              <button class="dw-ed" data-act="dw-play" ${any && !parts ? '' : 'disabled'}>${w.playing ? IC.stop : ICON.play}<span>${w.playing ? '止める' : '再生'}</span></button>
            </div>
            ${parts ? P.side : drawTools}
            ${attachBlock(st, w)}
            <div class="dw-acts">
              <button class="btn ghost" data-act="dw-steps">${ICON.list}作り方を出す</button>
              <button class="btn ghost" data-act="dw-sticker" ${any ? '' : 'disabled'}>${ICON.wand}シールにする</button>
            </div>
            ${noteBlock(w)}
          </div>
        </div>
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
  /** ペンの傾き 0（立てる）〜1（寝かせる）。寝かせるほど線を太く */
  function tiltOf(ev) {
    if (typeof ev.altitudeAngle === 'number' && ev.altitudeAngle > 0) return Math.max(0, Math.min(1, 1 - ev.altitudeAngle / (Math.PI / 2)));
    const t = Math.max(Math.abs(ev.tiltX || 0), Math.abs(ev.tiltY || 0));
    return Math.max(0, Math.min(1, t / 90));
  }
  function pointOf(ev, cv, L) {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return null;
    const ux = -6 + ((ev.clientX - r.left) / r.width) * 112, uy = -6 + ((ev.clientY - r.top) / r.height) * (L + 12);
    const q = [Math.round(Math.max(0, Math.min(100, ux)) * 10) / 10, Math.round(Math.max(0, Math.min(100, (uy / L) * 100)) * 10) / 10];
    if (ev.pointerType === 'pen' && typeof ev.pressure === 'number' && ev.pressure > 0) q.push(Math.round(Math.min(1, ev.pressure * (1 + 0.6 * tiltOf(ev))) * 100) / 100);
    return q;
  }
  /** 消しゴムでなぞった所にかかる線を消す（1回の「戻す」で戻る） */
  function erase(st, e) {
    const d = dws(st).d, L = D.lengthOf(d), r = e.w / 2;
    const P = q => [q[0], (q[1] * L) / 100];
    // 消しゴムの点から、線の各区間までのいちばん近い距離
    const dist = (q, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy, t = l2 ? Math.max(0, Math.min(1, ((q[0] - a[0]) * vx + (q[1] - a[1]) * vy) / l2)) : 0; return Math.hypot(q[0] - a[0] - t * vx, q[1] - a[1] - t * vy); };
    const near = s => { const ps = s.pts.map(P), lim = r + s.w / 2, segs = ps.length === 1 ? [[ps[0], ps[0]]] : ps.slice(1).map((b, k) => [ps[k], b]); return e.pts.map(P).some(q => segs.some(([a, b]) => dist(q, a, b) <= lim)); };
    const keep = d.strokes.filter(s => !near(s));
    if (keep.length === d.strokes.length) { T.app.toast('消す線がありません'); return false; }
    commit(st, x => { x.strokes = keep; });
    return true;
  }
  function finish() {
    if (!cur) return;
    const s = cur.s; cur = null;
    if (s.t === 'eraser') { erase(T.app.state, s); T.app.render(); return; }
    if (addStroke(T.app.state, s)) T.app.render();
  }
  function down(ev) {
    const st = T.app.state, w = st.dw; if (!w || w.playing) return;
    // タッチペンを一度使ったら、手のひらが触れても描かない（「ペンだけで描く」を外すと、指でも描ける）
    if (pinch || touches.size > 1) return; // 2本指で拡大・移動している間は描かない
    if (ev.pointerType === 'pen') { if (!w.penSeen) { w.penSeen = true; if (typeof w.penOnly !== 'boolean') w.penOnly = true; } }
    else if (penOnly(st, w) && ev.pointerType === 'touch') {
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
    const tool = toolOf(w.tool);
    cur = { id: ev.pointerId, cv, a: SMOOTH[device(st)], s: { t: w.tool, c: w.tool === 'eraser' ? '#FFFFFF' : w.color, w: widthOf(tool, w.size), pts: [q] } };
    hover(null);
    paintLive(0);
  }
  // ペンが触れずに近いとき、筆の大きさの丸を出す（タブレット向け・ホバーに対応する端末だけ）
  function hover(ev) {
    const el = hasDOM && document.querySelector('.at-hover'); if (!el) return;
    const st = T.app.state, w = st.dw;
    if (!ev || !w || ev.pointerType !== 'pen' || ev.buttons || device(st) !== 'tablet' || w.tool === 'bg') { el.classList.remove('on'); return; }
    const view = el.parentElement.getBoundingClientRect(), cv = ev.currentTarget.getBoundingClientRect(), px = (widthOf(toolOf(w.tool), w.size) * cv.width) / 112;
    el.style.width = el.style.height = Math.max(4, px) + 'px';
    el.style.left = (ev.clientX - view.left) + 'px'; el.style.top = (ev.clientY - view.top) + 'px';
    el.classList.add('on');
  }
  function move(ev) {
    if (!cur) { hover(ev); return; }
    if (ev.pointerId !== cur.id || cur.s.t === 'dot') return;
    ev.preventDefault();
    const d = dws(T.app.state).d, L = D.lengthOf(d), pts = cur.s.pts;
    const evs = typeof ev.getCoalescedEvents === 'function' ? ev.getCoalescedEvents() : null;
    for (const e of (evs && evs.length ? evs : [ev])) {
      if (pts.length >= MAX_PTS) break;
      const q0 = pointOf(e, cur.cv, L), l = pts[pts.length - 1];
      if (!q0) continue;
      const q = [Math.round((l[0] + (q0[0] - l[0]) * cur.a) * 10) / 10, Math.round((l[1] + (q0[1] - l[1]) * cur.a) * 10) / 10].concat(q0.slice(2));
      if (Math.hypot(q[0] - l[0], ((q[1] - l[1]) * L) / 100) < 0.7) continue;
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
    cv.addEventListener('pointerleave', () => hover(null));
  }

  // ---- 2本指で拡大・移動（描く・パーツの両方。パーツを選んでいるときは、パーツの大きさと向きに使うので触らない）
  const touches = new Map(); let pinch = null;
  function clampZoom(z, W, H) { const k = Math.max(1, Math.min(4, z.k)); return { k, x: Math.min(0, Math.max(W - W * k, z.x)), y: Math.min(0, Math.max(H - H * k, z.y)) }; }
  function applyZoom(view, z) { const el = view.querySelector('.at-zoom'); if (el) el.style.transform = z.k > 1 ? `translate(${z.x.toFixed(1)}px,${z.y.toFixed(1)}px) scale(${z.k})` : ''; view.classList.toggle('zoomed', z.k > 1); }
  /** 描きかけの線を捨てる（2本目の指が来たとき） */
  function dropStroke() {
    if (!cur) return;
    const cv = cur.cv; cur = null;
    const g = cv && cv.getContext && cv.getContext('2d'); if (g) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); }
  }
  if (hasDOM) {
    document.addEventListener('pointerdown', e => {
      const view = e.target.closest && e.target.closest('[data-at-view]'); if (!view || e.pointerType !== 'touch') return;
      const st = T.app.state, w = st.dw; if (!w) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size !== 2) return;
      if (w.mode === 'parts' && st.editor.selected != null) return;
      dropStroke();
      const [a, b] = Array.from(touches.values()), r = view.getBoundingClientRect();
      pinch = { view, z0: Object.assign({}, w.zoom), d0: Math.hypot(b.x - a.x, b.y - a.y) || 1, c0: { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top }, W: r.width, H: r.height, z: Object.assign({}, w.zoom) };
      e.preventDefault(); e.stopPropagation();
    }, true);
    document.addEventListener('pointermove', e => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!pinch || touches.size < 2) return;
      const [a, b] = Array.from(touches.values()), r = pinch.view.getBoundingClientRect(), z0 = pinch.z0;
      const k = Math.max(1, Math.min(4, z0.k * Math.hypot(b.x - a.x, b.y - a.y) / pinch.d0)), c = { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top };
      // 2本の指の真ん中にあった所が、指について動く
      pinch.z = clampZoom({ k, x: c.x - (pinch.c0.x - z0.x) * (k / z0.k), y: c.y - (pinch.c0.y - z0.y) * (k / z0.k) }, pinch.W, pinch.H);
      applyZoom(pinch.view, pinch.z);
      e.preventDefault(); e.stopPropagation();
    }, true);
    const lift = e => {
      if (!touches.delete(e.pointerId)) return;
      if (pinch && touches.size < 2) { const w = T.app.state.dw, z = pinch.z; pinch = null; if (w) { w.zoom = z; setup(); } }
    };
    ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, lift, true));
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
      if (!w.d.strokes.length && !w.dirty) {
        reset(st, fresh(st));
        // その指にもう絵をのせていれば、その絵を開く（続きから描ける）
        const id = st.current && T.atelier && T.atelier.artOf(st, sideOf(st, w), w.d.finger), x = id && D.get(id);
        if (x) reset(st, x);
      }
      else if (fresh(st).bg !== w.d.bg) { T.app.go('draw'); T.app.toast('描きかけの絵を開きました。この色で描くときは、下の「新しく描く」'); return; }
      T.app.go('draw');
    },
    'dw-finger': (el, st) => { const w = dws(st), i = Number(el.dataset.v); if (Number.isInteger(i) && i >= 0 && i <= 4 && w.d.finger !== i) { w.d.finger = i; if (w.d.strokes.length) w.dirty = true; } T.app.render(); },
    'dw-pen': (el, st) => { const w = dws(st); w.penOnly = !penOnly(st, w); w.penTold = false; T.app.toast(w.penOnly ? 'ペンだけで描きます（指や手のひらは無視）' : '指でも描けます'); T.app.render(); },
    'at-mode': (el, st) => { const w = dws(st); stopPlay(true); w.mode = el.dataset.v === 'parts' ? 'parts' : 'draw'; if (w.mode === 'parts') st.editor.selected = null; T.app.render(); },
    'at-dev': (el, st) => { const v = el.dataset.v === 'tablet' ? 'tablet' : 'phone'; try { localStorage.setItem(DEV_KEY, v); } catch (e) { /* 保存できなくても今は切り替える */ } const w = dws(st); delete w.penOnly; if (v === 'phone' && w.size === 'x') w.size = 0; T.app.render(); },
    'at-zoom': (el, st) => {
      const w = dws(st), k = ZOOMS.includes(+el.dataset.v) ? +el.dataset.v : 1, view = hasDOM && document.querySelector('[data-at-view]');
      const W = view ? view.getBoundingClientRect().width : 0, H = view ? view.getBoundingClientRect().height : 0, z0 = w.zoom;
      w.zoom = k === 1 || !W ? { k, x: 0, y: 0 } : clampZoom({ k, x: W / 2 - (W / 2 - z0.x) * (k / z0.k), y: H / 2 - (H / 2 - z0.y) * (k / z0.k) }, W, H);
      T.app.render();
    },
    'at-attach': (el, st) => {
      const w = dws(st); if (!st.current) { T.app.toast('デザインを選んでから開くと、指にのせられます'); return; }
      if (!w.d.strokes.length && !w.d.bg) { T.app.toast('まだ何も描いていません'); return; }
      const side = sideOf(st, w), saved = T.atelier.attach(st, w.d, side, w.d.finger);
      if (!saved) { T.app.toast('この環境では保存できません'); return; }
      w.d = saved; w.dirty = false; w.confirm = null; st.side = side === 'foot' ? st.side : side;
      T.app.toast(`${D.FINGERS[saved.finger]}にのせました`);
      T.app.go('detail');
    },
    'at-detach': (el, st) => { const w = dws(st); if (T.atelier.detach(st, sideOf(st, w), w.d.finger)) T.app.toast('この指から絵を外しました（絵は「保存した絵」に残っています）'); T.app.render(); },
    'dw-tool': (el, st) => { const w = dws(st); if (toolOf(el.dataset.v)) w.tool = el.dataset.v; T.app.render(); },
    'dw-guide': (el, st) => { const w = dws(st); w.guide = GUIDES.some(g => g.id === el.dataset.v) ? el.dataset.v : 'none'; T.app.render(); },
    'at-attach-all': (el, st) => {
      const w = dws(st); if (!st.current) { T.app.toast('デザインを選んでから開くと、指にのせられます'); return; }
      if (!w.d.strokes.length && !w.d.bg) { T.app.toast('まだ何も描いていません'); return; }
      const side = sideOf(st, w), sides = el.dataset.v === 'both' && side !== 'foot' ? ['left', 'right'] : [side];
      let saved = null;
      sides.forEach(sd => [0, 1, 2, 3, 4].forEach(i => { const r = T.atelier.attach(st, saved || w.d, sd, i); if (r && !saved) saved = r; }));
      if (!saved) { T.app.toast('この環境では保存できません'); return; }
      w.d = Object.assign(saved, { finger: w.d.finger }); w.dirty = false; w.confirm = null;
      T.app.toast(sides.length > 1 ? '両手の10本にのせました' : '5本ぜんぶにのせました');
      T.app.go('detail');
    },
    'dw-size': (el, st) => { dws(st).size = el.dataset.v === 'x' && device(st) === 'tablet' ? 'x' : Math.max(0, Math.min(2, Math.round(+el.dataset.v) || 0)); T.app.render(); },
    'dw-color': (el, st) => pickColor(st, el.dataset.hex, el.dataset.name),
    'dw-bg-none': (el, st) => { setBg(st, null); T.app.render(); },
    /** 戻す: 描いた線とパーツの変更を、起きた順に1つずつ戻す */
    'dw-undo': (el, st) => {
      const w = dws(st), d = w.d; if (w.playing) return;
      if (st.current) syncHist(st, w);
      const last = w.hist[w.hist.length - 1];
      if (last === 'p') { w.hist.pop(); w.pLen = Math.max(0, (w.pLen || 1) - 1); T.actions['ed-undo'](null, st); return; }
      if (!w.undo.length) return;
      if (last === 'd') w.hist.pop();
      w.redo.push({ bg: d.bg, strokes: d.strokes }); const s = w.undo.pop(); d.bg = s.bg; d.strokes = s.strokes; w.dirty = true; w.added = null; T.app.render();
    },
    'dw-redo': (el, st) => {
      const w = dws(st), d = w.d; if (!w.redo.length || w.playing) return;
      w.undo.push({ bg: d.bg, strokes: d.strokes }); const s = w.redo.pop(); d.bg = s.bg; d.strokes = s.strokes; w.dirty = true; w.added = null; w.hist.push('d'); T.app.render();
    },
    'dw-clear': (el, st) => { const w = dws(st); if (!w.d.strokes.length || w.playing) return; commit(st, d => { d.strokes = []; }); T.app.render(); T.app.toast('線を全部消しました（「戻す」で戻せます）'); },
    'dw-play': (el, st) => play(st),
    'dw-steps': (el, st) => { stopPlay(true); st.sheet = 'dw-steps'; T.app.render(); },
    'dw-say': (el, st) => { if (!T.voice || !T.voice.speak(D.stepsFrom(dws(st).d).map(s => s.text), { voice: 'guide2' })) T.app.toast('この端末では読み上げできません'); },
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
  T.drawView = { addStroke, state: dws, stepsSheet, device, widthOf, clampZoom, erase, GUIDES };
})(typeof window !== 'undefined' ? window : globalThis);
