/* tsumé — シール工房（画面）。模様・モチーフ・手描きを作り、実寸のシートにして印刷する。
   作り方と素材（どこで買えるか）は js/data-stickers.js。AI は「ことばで模様」だけ（同意があるとき） */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, S = T.stickers;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const TABS = [{ id: 'pattern', name: '模様（全面）' }, { id: 'motif', name: 'モチーフ' }, { id: 'draw', name: '手描き' }];
  const SHAPES = [{ id: 'oval', name: 'ラウンド' }, { id: 'square', name: 'スクエア' }, { id: 'almond', name: 'アーモンド' }];
  const STYLES = [{ id: 'fill', name: '塗り' }, { id: 'line', name: '線' }, { id: 'both', name: '塗り＋縁' }];
  const SETS = [{ id: '', name: '1枚' }, { id: 'S', name: '手のセット S' }, { id: 'M', name: 'M' }, { id: 'L', name: 'L' }, { id: 'mine', name: '自分の爪' }];
  // 自分の爪の横幅（親指〜小指、mm）。端末に覚える
  function myWidths() { try { const v = JSON.parse(localStorage.getItem('tsume.nailwidths.v1')); if (Array.isArray(v) && v.length === 5 && v.every(x => typeof x === 'number' && x >= 5 && x <= 22)) return v; } catch (e) {} return S.HANDS.M.slice(); }
  const PAPERS = Object.keys(S.PAPERS).map(id => ({ id, name: S.PAPERS[id].name }));
  const newId = () => 's' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const fresh = type => type === 'pattern' ? { id: newId(), type, kind: 'leopard', shape: 'oval', set: 'M', w: 12, count: 1, seed: 3, p: {} }
    : type === 'motif' ? { id: newId(), type, kind: 'ribbon', w: 7, count: 6, seed: 1, p: { color: '#C8A96A', line: '#2B2226', style: 'fill' } }
      : { id: newId(), type, kind: 'draw', w: 10, count: 4, seed: 1, strokes: [], p: {}, pen: { c: '#2B2226', w: 4 } };
  function stk(st) {
    if (!st.stk) {
      st.stk = { tab: 'pattern', edit: fresh('pattern'), sheet: { paper: 'a4', mirror: false, guides: true, items: [] } };
      try { const v = JSON.parse(localStorage.getItem('tsume.stickers.v1')); if (v) st.stk.sheet = S.cleanSheet(v); } catch (e) {}
    }
    return st.stk;
  }
  const range = (act, label, v, min = 0, max = 1, step = 0.05, unit = '') => `<label class="st-range"><span>${label}</span><input type="range" data-range="${act}" min="${min}" max="${max}" step="${step}" value="${v}"><b class="num">${unit ? `${Math.round(v * 10) / 10}${unit}` : ''}</b></label>`;
  const colorIn = (key, label, v) => `<label class="st-color"><input type="color" data-color="${key}" value="${HEX.test(v || '') ? v : '#FFFFFF'}"><span>${esc(label)}</span></label>`;

  // ---- 作る（模様）
  function patternEditor(e) {
    const P = S.PATTERNS[e.kind], cs = P.colors.map((d, i) => ((e.p.colors || [])[i] || (d.length === 9 ? '#FFFFFF' : d)));
    return `<div class="st-chips">${Object.keys(S.PATTERNS).map(k => `<button class="chip" data-act="st-kind" data-v="${k}" aria-pressed="${e.kind === k}">${esc(S.PATTERNS[k].name)}</button>`).join('')}</div>
      <div class="st-colors">${P.labels.map((l, i) => colorIn('c' + i, l, cs[i])).join('')}<label class="st-check"><input type="checkbox" data-check="clear" ${e.p.clear || e.kind === 'french' && !(e.p.colors || [])[0] ? 'checked' : ''}><span>地を透明（下の色が透ける）</span></label></div>
      ${range('density', '密度', e.p.density != null ? e.p.density : 0.5)}${range('size', '模様の大きさ', e.p.size != null ? e.p.size : 0.5)}
      <div class="st-row"><span class="lab">形</span>${U.seg(SHAPES, 'st-shape', e.shape, 'aria-label="爪の形"')}</div>
      <div class="st-row"><span class="lab">大きさ</span>${U.seg(SETS, 'st-set', e.set || '', 'aria-label="爪の大きさ"')}</div>
      ${e.set === 'mine' ? `<div class="st-widths">${myWidths().map((w, i) => `<label><span>${S.FINGERS[i]}</span><input type="number" inputmode="decimal" min="5" max="22" step="0.5" data-width="${i}" value="${w}"></label>`).join('')}<span class="small muted">爪のいちばん広い所の横幅（mm）を定規で測って入れる</span></div>`
        : e.set ? `<p class="small muted">親指〜小指の5枚（横幅 ${S.HANDS[e.set].join('・')}mm の目安）。合わなければ「自分の爪」で測った幅を入れてください。</p>` : range('w', '横幅', e.w, 6, 20, 0.5, 'mm')}`;
  }
  // ---- 作る（モチーフ）
  function motifEditor(e) {
    const m = S.MOTIFS[e.kind], p = e.p;
    return `<div class="st-chips">${Object.keys(S.MOTIFS).map(k => `<button class="chip st-motif" data-act="st-kind" data-v="${k}" aria-pressed="${e.kind === k}"><svg viewBox="-0.6 -0.6 1.2 1.2" aria-hidden="true">${S.motifSvg({ kind: k, p: { color: '#8A6A2F', style: S.MOTIFS[k].line ? 'line' : 'fill', lw: 0.08 } }, 0, 0, 1)}</svg>${esc(S.MOTIFS[k].name)}</button>`).join('')}</div>
      <div class="st-colors">${colorIn('color', m.line ? '線の色' : '色', p.color)}${m.line ? '' : colorIn('line', '縁の色', p.line)}${S.MOTIFS[e.kind].center ? colorIn('center', '花芯', p.center || '#F2D36B') : ''}</div>
      ${m.line ? '' : `<div class="st-row"><span class="lab">描き方</span>${U.seg(STYLES, 'st-style', p.style || 'fill', 'aria-label="塗りか線か"')}</div>`}
      ${range('w', '大きさ', e.w, 3, 20, 0.5, 'mm')}${range('rot', '向き', p.rot || 0, -180, 180, 5, '°')}
      ${range('round', '形のまるみ', p.round != null ? p.round : 0.5)}${m.line || ['heart', 'sparkle'].includes(e.kind) ? '' : range('size2', '形の大きさ', p.size != null ? p.size : 0.5)}
      ${e.kind === 'flower' ? range('petals', '花びらの数', p.petals || 0) : ''}${e.kind === 'star' ? range('points', 'とがりの数', p.points != null ? p.points : 0.5) : ''}${e.kind === 'line' ? range('wave', 'まっすぐ → ギザ → 波', p.wave || 0) : ''}${m.line || p.style === 'line' || p.style === 'both' ? range('lw', '線の太さ', p.lw || 0.3, 0.1, 1.2, 0.05, 'mm') : ''}`;
  }
  // ---- 作る（手描き）
  function drawEditor(e) {
    const pen = e.pen || { c: '#2B2226', w: 4 };
    return `<p class="small muted">指やタッチペンで、四角の中に描きます。ワンコ・ネコ・バラなど。描いた絵は、下の大きさでシールになります。</p><button class="link mix-link" data-act="dw-start">${ICON.wand}大きな爪に描いて、作り方も出す（描く）${ICON.chev}</button>
      <div class="st-pad-wrap"><canvas id="st-pad" width="600" height="600" aria-label="描くところ"></canvas></div>
      <div class="st-colors">${colorIn('pen', 'ペンの色', pen.c)}${U.seg([{ id: '2', name: '細' }, { id: '4', name: '中' }, { id: '8', name: '太' }], 'st-pen-w', String(pen.w), 'aria-label="線の太さ"')}<button class="chip" data-act="st-undo">ひとつ戻す</button><button class="chip" data-act="st-clear">消す</button></div>
      ${range('w', '大きさ', e.w, 4, 20, 0.5, 'mm')}`;
  }
  function sheetBlock(st) {
    const k = stk(st), sh = k.sheet, L = S.layout(sh.items, sh.paper), P = L.paper;
    const { svg } = S.sheetSvg(sh, { px: 600 });
    return `<section class="mx-card st-sheet">
      <div class="mx-head"><h2 class="mx-h">印刷するシート</h2>${U.seg(PAPERS, 'st-paper', sh.paper, 'aria-label="紙の大きさ"')}</div>
      <div class="st-sheet-view" style="aspect-ratio:${P.w}/${P.h}">${svg.replace('<svg ', '<svg class="st-sheet-svg" ')}</div>
      ${L.overflow.length ? `<p class="st-warn">${L.overflow.length}枚がはみ出しています。数を減らすか、紙を大きくしてください。</p>` : ''}
      <ul class="st-items">${sh.items.map(it => `<li>${S.previewSvg(it, 34)}<span>${esc(it.type === 'pattern' ? S.PATTERNS[it.kind].name : it.type === 'motif' ? S.MOTIFS[it.kind].name : it.type === 'image' ? 'AIの絵' : '手描き')}${it.type === 'pattern' && it.set ? `（手のセット ${it.set}）` : `（${it.w}mm）`}</span><span class="st-count"><button class="iconbtn" data-act="st-count" data-id="${it.id}" data-d="-1" aria-label="減らす">${ICON.minus}</button><b class="num">${it.count}</b><button class="iconbtn" data-act="st-count" data-id="${it.id}" data-d="1" aria-label="増やす">${ICON.plus}</button></span><button class="iconbtn" data-act="st-remove" data-id="${it.id}" aria-label="外す">${ICON.trash}</button></li>`).join('') || '<li class="small muted">まだありません。上で作って「シートに足す」を押してください。</li>'}</ul>
      <div class="st-opts"><label class="st-check"><input type="checkbox" data-check="mirror" ${sh.mirror ? 'checked' : ''}><span>左右反転して印刷（裏から貼る素材のとき）</span></label><label class="st-check"><input type="checkbox" data-check="guides" ${sh.guides !== false ? 'checked' : ''}><span>切り取り線を入れる</span></label></div>
      <div class="btnrow"><button class="btn rose" data-act="st-print" ${sh.items.length ? '' : 'disabled'}>${ICON.share}印刷する</button><button class="btn ghost" data-act="st-pdf" ${sh.items.length ? '' : 'disabled'}>PDFを作る</button><button class="btn ghost" data-act="st-test">テスト印刷（目盛り）</button></div>
      <p class="small muted">印刷は「実際のサイズ（100%）」「フチあり」で。「用紙に合わせる」や「フチなし」だと大きさが変わります。先に普通紙にテスト印刷して、目盛りを定規で測ってください。</p>
      <label class="st-range st-scale"><span>${S.rulerLen(P) / 10}cmの線を測ったら</span><input id="st-measure" type="number" inputmode="decimal" min="${S.rulerLen(P) * 0.9}" max="${S.rulerLen(P) * 1.1}" step="0.5" value="${(S.rulerLen(P) / (sh.scale || 1)).toFixed(1)}"><b>mm${sh.scale && sh.scale !== 1 ? `（${(sh.scale * 100).toFixed(1)}%で刷る）` : ''}</b></label>
    </section>`;
  }
  const INK_NAME = { dye: '染料', pigment: '顔料', laser: 'レーザー' };
  function guideBlock(st) {
    const G = T.STICKER_GUIDE; if (!G) return '';
    const k = stk(st), ink = k.ink || '', list = G.materials.filter(m => !ink || m.ink.includes(ink));
    const shops = m => `<span class="st-shops">${(m.shops || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.shop)}</a>`).join('')}</span>`;
    const mat = m => `<li class="st-mat${k.material === m.id ? ' on' : ''}"><b>${esc(m.name)}</b>
      <span class="st-tags"><i>${m.type === 'tattoo' ? `転写シール（タトゥー型）・${m.mirror === true ? '左右反転で刷る' : '反転は説明書で確かめる'}` : '水転写デカール・反転しない'}</i><i>${m.ink.map(x => INK_NAME[x]).join('・')}</i></span>
      <span class="small muted">${esc([m.size, m.price].filter(Boolean).join('・'))}</span><span>${esc(m.good)}</span>${m.caution ? `<span class="small muted">${esc(m.caution)}</span>` : ''}
      ${shops(m)}<button class="link" data-act="st-material" data-id="${m.id}">${k.material === m.id ? `${ICON.check}この素材に合わせています` : 'この素材に合わせる'}</button></li>`;
    return `<section class="mx-card st-guide"><h2 class="mx-h">作り方と素材</h2>
      <p class="st-answer">${esc(G.thickness)}</p>
      <div class="st-row"><span class="lab">プリンター</span>${U.seg([{ id: '', name: 'すべて' }].concat(G.INKS), 'st-ink', ink, 'aria-label="プリンターのインク"')}</div>
      <p class="small muted">${esc(G.inkHelp)}</p>
      <details open><summary>家のプリンターで刷れる素材と、買える店（${list.length}）</summary><ul class="st-mats">${list.map(mat).join('')}</ul><p class="small muted">価格と在庫は ${esc(G.checked)} に各ページで確かめた目安です。</p></details>
      <details><summary>金・銀・ホロ・立体に使うもの</summary><ul class="st-mats">${G.extras.map(m => `<li class="st-mat"><b>${esc(m.name)}</b><span>${esc(m.good)}</span><span class="small muted">${esc(m.price)}</span>${shops(m)}</li>`).join('')}</ul></details>
      <details><summary>作り方（刷る → 貼る）</summary><ol class="mx-steps">${G.makeSteps.concat(G.applySteps).map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>
      <details><summary>金・白・立体・ホロは？</summary><dl class="st-dl"><dt>金・銀</dt><dd>${esc(G.special.gold)}</dd><dt>白</dt><dd>${esc(G.special.white)}</dd><dt>立体（ぷっくり）</dt><dd>${esc(G.special.raised)}</dd><dt>ホロ・オーロラ</dt><dd>${esc(G.special.holo)}</dd></dl></details>
      <details><summary>失敗したら</summary><dl class="st-dl">${G.pitfalls.map(x => `<dt>${esc(x.q)}</dt><dd>${esc(x.a)}</dd>`).join('')}</dl></details>
      <details><summary>印刷のしかた（iPhone・Android・パソコン）</summary><dl class="st-dl"><dt>パソコン・Web</dt><dd>${esc(G.printing.web)}</dd><dt>iPhone</dt><dd>${esc(G.printing.ios)}</dd><dt>Android</dt><dd>${esc(G.printing.android)}</dd><dt>大きさ</dt><dd>${esc(G.printing.scale)}</dd></dl></details>
      <p class="small muted">${esc(G.copyright)}</p>
    </section>`;
  }
  T.views.stickers = st => {
    const k = stk(st), e = k.edit;
    const editor = k.tab === 'pattern' ? patternEditor(e) : k.tab === 'motif' ? motifEditor(e) : drawEditor(e);
    const word = k.tab === 'pattern' ? `<div class="mx-form st-word"><input id="st-word" class="kt-input" type="text" maxlength="40" placeholder="例：ボルドーのレオパード" value="${esc(k.word || '')}" autocomplete="off" aria-label="ことばで模様を作る"><button class="btn rose" data-act="st-word">${k.busy ? '…' : '作る'}</button></div>` : '';
    return `${U.bar({ back: true, title: 'シール工房' })}
      <section class="mix stickers">
        <p class="mx-lead">気に入るシールが無ければ、自分で。色や形を変えてデザインし、家のプリンターで「水転写シール（デカール）用紙」に刷って貼ります。膜が薄いので段差が小さくなります。</p>
        <section class="mx-card">
          ${U.seg(TABS, 'st-tab', k.tab, 'aria-label="作るもの"')}
          <div class="st-edit"><div class="st-pv">${S.previewSvg(e, 150)}<button class="chip" data-act="st-vary">${ICON.refresh}少し変える</button></div><div class="st-ctl">${word}${editor}</div></div>
          <div class="st-add"><span class="lab">枚数</span><button class="iconbtn" data-act="st-n" data-d="-1" aria-label="減らす">${ICON.minus}</button><b class="num">${e.count}</b><button class="iconbtn" data-act="st-n" data-d="1" aria-label="増やす">${ICON.plus}</button><button class="btn rose" data-act="st-add" ${e.type === 'draw' && !(e.strokes || []).length ? 'disabled' : ''}>${ICON.plus}シートに足す</button></div>
        </section>
        ${sheetBlock(st)}
        ${guideBlock(st)}
      </section>`;
  };

  // ---- 手描き
  let pad = null;
  function drawPad() {
    const st = T.app.state, e = st.stk && st.stk.edit, cv = hasDOM && document.getElementById('st-pad');
    if (!cv || !e || e.type !== 'draw') return;
    const g = cv.getContext('2d'), k = cv.width / 100;
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#EDE6E2'; g.lineWidth = 1; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * cv.width / 4, 0); g.lineTo(i * cv.width / 4, cv.height); g.moveTo(0, i * cv.height / 4); g.lineTo(cv.width, i * cv.height / 4); g.stroke(); }
    const line = s => { g.strokeStyle = s.c; g.lineWidth = s.w * k; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); s.pts.forEach((q, i) => (i ? g.lineTo(q[0] * k, q[1] * k) : g.moveTo(q[0] * k, q[1] * k))); if (s.pts.length === 1) g.lineTo(s.pts[0][0] * k + 0.1, s.pts[0][1] * k); g.stroke(); };
    (e.strokes || []).forEach(line);
    if (pad && pad.cur) line(pad.cur);
    if (cv.dataset.bound) return;
    cv.dataset.bound = '1';
    const pos = ev => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100)), Math.max(0, Math.min(100, ((ev.clientY - r.top) / r.height) * 100))]; };
    cv.addEventListener('pointerdown', ev => { ev.preventDefault(); cv.setPointerCapture(ev.pointerId); const pen = e.pen || { c: '#2B2226', w: 4 }; pad = { cur: { c: pen.c, w: pen.w, pts: [pos(ev)] } }; drawPad(); });
    cv.addEventListener('pointermove', ev => { if (!pad || !pad.cur) return; const q = pos(ev), l = pad.cur.pts[pad.cur.pts.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.6) { pad.cur.pts.push(q); drawPad(); } });
    const end = () => { if (!pad || !pad.cur) return; const s = T.app.state.stk.edit; s.strokes = (s.strokes || []).concat([pad.cur]).slice(-400); pad = null; T.app.render(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('lostpointercapture', end);
  }

  // ---- 印刷（ブラウザの印刷。用紙の大きさを @page で指定）
  function printSvg(svg, P) {
    let box = document.getElementById('print-sheet'), css = document.getElementById('print-page');
    if (!box) { box = document.createElement('div'); box.id = 'print-sheet'; document.body.appendChild(box); }
    if (!css) { css = document.createElement('style'); css.id = 'print-page'; document.head.appendChild(css); }
    css.textContent = `@page { size: ${P.w}mm ${P.h}mm; margin: 0; } #print-sheet { display: none; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; } body > *:not(#print-sheet) { display: none !important; } #print-sheet { display: block !important; } #print-sheet svg { display: block; width: ${P.w}mm; height: ${P.h}mm; } }`;
    box.innerHTML = svg;
    try { window.print(); } catch (err) { T.app.toast('この端末では印刷を開けませんでした。「PDFを作る」を使ってください'); }
  }
  async function makePdf(sheet) {
    T.app.toast('PDFを作っています…');
    try {
      const { pdf, dpi } = await S.sheetPdf(sheet), name = `tsume-sticker-${sheet.paper}.pdf`;
      if (T.native && T.native.isNative && T.native.sharePdf && await T.native.sharePdf(pdf, name)) return;
      const file = typeof File === 'function' ? new File([pdf], name, { type: 'application/pdf' }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'tsumé シール' }).catch(() => {}); return; }
      const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' })), a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      T.app.toast(`PDFを保存しました（${dpi}dpi）。印刷は「実際のサイズ」で`);
    } catch (err) { T.app.toast('PDFを作れませんでした'); }
  }

  // ---- ことばで模様（辞書 → AI）
  async function byWord(st, text) {
    const k = stk(st); k.word = String(text || '').trim().slice(0, 40);
    if (!k.word) return;
    const apply = r => { const e = k.edit; e.kind = r.kind; e.p = Object.assign({}, e.p, { colors: r.colors.length ? r.colors : undefined }, r.density != null ? { density: r.density } : {}, r.size != null ? { size: r.size } : {}); e.seed = (e.seed || 1) + 1; T.app.render(); };
    const hit = S.wordsToPattern(k.word);
    if (hit) { apply(hit); return; }
    if (!T.ai.usable()) { T.app.toast(T.ai.available() ? '模様の名前（レオパード・べっ甲・ドット など）を入れてください。AI はオフです' : '模様の名前（レオパード・べっ甲・ドット など）を入れてください'); return; }
    k.busy = true; T.app.render();
    let r = null; try { r = await S.aiPattern(k.word); } catch (e) { r = null; }
    k.busy = false; if (r) apply(r); else { T.app.toast('読み取れませんでした'); T.app.render(); }
  }

  const persist = st => { try { localStorage.setItem('tsume.stickers.v1', JSON.stringify(stk(st).sheet)); } catch (e) {} };
  /** ほかの画面（エディタ・描く）からシートに足す。足せたら true */
  function addToSheet(st, raw) {
    const k = stk(st), it = S.cleanItem(Object.assign({ id: newId() }, raw));
    if (!it) return false;
    if (k.sheet.items.length >= 40) { T.app.toast('シートに入るのは40種類まで'); return false; }
    k.sheet.items.push(it); persist(st); return true;
  }
  T.stickersUI = { addToSheet, stk };
  if (hasDOM) {
    window.addEventListener('tsume:render', e => { if (e.detail && e.detail.view === 'stickers') drawPad(); });
    document.addEventListener('input', ev => {
      const t = ev.target, st = T.app.state; if (!t || st.view !== 'stickers') return;
      const e = stk(st).edit;
      if (t.dataset.range) {
        const v = +t.value, key = t.dataset.range;
        if (key === 'w') e.w = v; else if (key === 'size2') e.p.size = v; else e.p[key] = v;
        const pv = document.querySelector('.st-pv'); if (pv) pv.firstElementChild.outerHTML = S.previewSvg(e, 150);
        const out = t.parentElement.querySelector('b'); if (out && out.textContent) out.textContent = `${Math.round(v * 10) / 10}${key === 'w' || key === 'lw' ? 'mm' : key === 'rot' ? '°' : ''}`;
      }
      if (t.id === 'st-word') stk(st).word = t.value;
    });
    document.addEventListener('change', ev => {
      const t = ev.target, st = T.app.state; if (!t || t.dataset.width == null) return;
      const ws = myWidths(), v = +t.value; if (!(v >= 5 && v <= 22)) { T.app.toast('5〜22mm で入れてください'); return; }
      ws[+t.dataset.width] = Math.round(v * 2) / 2;
      try { localStorage.setItem('tsume.nailwidths.v1', JSON.stringify(ws)); } catch (e) {}
      stk(st).edit.widths = ws; T.app.render();
    });
    document.addEventListener('change', ev => {
      const t = ev.target, st = T.app.state; if (!t || t.id !== 'st-measure') return;
      const k = stk(st), RL = S.rulerLen(S.PAPERS[k.sheet.paper]), v = +t.value;
      if (v >= RL * 0.9 && v <= RL * 1.1) { k.sheet.scale = Math.round((RL / v) * 10000) / 10000; persist(st); T.app.render(); } else T.app.toast(`${RL * 0.9}〜${RL * 1.1}mm の間で入れてください`);
    });
    document.addEventListener('change', ev => {
      const t = ev.target, st = T.app.state; if (!t || st.view !== 'stickers') return;
      const k = stk(st), e = k.edit;
      if (t.dataset.color && HEX.test(t.value)) {
        const key = t.dataset.color, v = t.value.toUpperCase();
        if (key === 'pen') e.pen = Object.assign({}, e.pen, { c: v });
        else if (/^c\d$/.test(key)) { const cs = (e.p.colors || []).slice(); cs[+key[1]] = v; e.p.colors = cs; if (key === 'c0') e.p.clear = false; }
        else e.p[key] = v;
        T.app.render();
      } else if (t.dataset.check) {
        const key = t.dataset.check;
        if (key === 'clear') e.p.clear = t.checked; else { k.sheet[key] = t.checked; persist(st); }
        T.app.render();
      } else if (t.dataset.range) T.app.render();
    });
    document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.id === 'st-word' && !ev.isComposing && ev.keyCode !== 229) { ev.preventDefault(); byWord(T.app.state, ev.target.value); } });
  }

  Object.assign(T.actions, {
    'st-tab': (el, st) => { const k = stk(st); k.tab = el.dataset.v; if (k.edit.type !== k.tab) k.edit = fresh(k.tab); T.app.render(); },
    'st-kind': (el, st) => { const e = stk(st).edit; e.kind = el.dataset.v; if (e.type === 'pattern') e.p = { density: e.p.density, size: e.p.size }; T.app.render(); },
    'st-shape': (el, st) => { stk(st).edit.shape = el.dataset.v; T.app.render(); },
    'st-set': (el, st) => { const e = stk(st).edit; e.set = el.dataset.v || undefined; if (e.set === 'mine') e.widths = myWidths(); T.app.render(); },
    'st-style': (el, st) => { stk(st).edit.p.style = el.dataset.v; T.app.render(); },
    'st-pen-w': (el, st) => { const e = stk(st).edit; e.pen = Object.assign({}, e.pen, { w: +el.dataset.v }); T.app.render(); },
    'st-undo': (el, st) => { const e = stk(st).edit; e.strokes = (e.strokes || []).slice(0, -1); T.app.render(); },
    'st-clear': (el, st) => { stk(st).edit.strokes = []; T.app.render(); },
    'st-vary': (el, st) => {
      const e = stk(st).edit, R = S.rng(Date.now() % 1e6 + 7);
      e.seed = (e.seed || 1) + 1 + Math.floor(R() * 50);
      if (e.type === 'motif') ['round', 'size', 'tail', 'petals', 'points'].forEach(k => { e.p[k] = Math.round(R() * 20) / 20; });
      if (e.type === 'pattern') { e.p.density = Math.round((0.3 + R() * 0.5) * 20) / 20; e.p.size = Math.round((0.3 + R() * 0.5) * 20) / 20; }
      T.app.render();
    },
    'st-word': (el, st) => { const i = hasDOM && document.getElementById('st-word'); byWord(st, i ? i.value : stk(st).word); },
    'st-n': (el, st) => { const e = stk(st).edit; e.count = Math.max(1, Math.min(20, (e.count || 1) + +el.dataset.d)); T.app.render(); },
    'st-add': (el, st) => {
      const k = stk(st), it = S.cleanItem(JSON.parse(JSON.stringify(Object.assign({}, k.edit, { id: newId() }))));
      if (!it) return;
      if (k.sheet.items.length >= 40) { T.app.toast('シートに入るのは40種類まで'); return; }
      k.sheet.items.push(it); persist(st);
      const L = S.layout(k.sheet.items, k.sheet.paper);
      T.app.toast(L.overflow.length ? `シートに足しました（${L.overflow.length}枚はみ出しています）` : 'シートに足しました');
      T.app.render();
    },
    'st-count': (el, st) => { const it = stk(st).sheet.items.find(x => x.id === el.dataset.id); if (it) { it.count = Math.max(1, Math.min(20, it.count + +el.dataset.d)); persist(st); T.app.render(); } },
    'st-remove': (el, st) => { const k = stk(st); k.sheet.items = k.sheet.items.filter(x => x.id !== el.dataset.id); persist(st); T.app.render(); },
    'st-paper': (el, st) => { stk(st).sheet.paper = el.dataset.v; persist(st); T.app.render(); },
    // アプリ（iPhone・Android）では印刷ダイアログが開かないので、PDF を共有シートへ
    'st-print': (el, st) => { const sh = stk(st).sheet; if (T.native && T.native.isNative) { makePdf(sh); return; } printSvg(S.sheetSvg(sh).svg, S.PAPERS[sh.paper]); },
    'st-test': (el, st) => { const sh = Object.assign({}, stk(st).sheet, { items: [], gauge: true }); if (T.native && T.native.isNative) { makePdf(sh); return; } printSvg(S.sheetSvg(sh).svg, S.PAPERS[sh.paper]); },
    'st-pdf': (el, st) => makePdf(stk(st).sheet),
    'st-ink': (el, st) => { stk(st).ink = el.dataset.v || ''; T.app.render(); },
    'st-material': (el, st) => {
      const m = (T.STICKER_GUIDE.materials || []).find(x => x.id === el.dataset.id), k = stk(st); if (!m) return;
      k.material = m.id; if (typeof m.mirror === 'boolean') k.sheet.mirror = m.mirror;
      if (/はがき/.test(m.size) && k.sheet.paper === 'a4') k.sheet.paper = 'hagaki';
      if (/名刺/.test(m.size)) k.sheet.paper = 'l';
      persist(st); T.app.render();
      T.app.toast(`${m.mirror === true ? '左右反転オン' : m.mirror === false ? '左右反転オフ' : '左右反転は説明書で確かめてください'}・紙は${S.PAPERS[k.sheet.paper].name}にしました`);
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
