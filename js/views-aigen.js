/* tsumé — AIでシール絵（T.views.aigen）と、写真から作り方（T.views.aivision）。部品は js/ai-vision.js（T.aiv）。
   AI が使えない・同意が無いときは、理由と代わりの道具（シール工房の手描き・描き方レシピ）を出す */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, A = T.aiv;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const SKEY = 'tsume.stickers.v1';
  const MAX_IMAGES = 8;
  const SIZES = [{ id: '6', name: '6mm' }, { id: '8', name: '8mm' }, { id: '10', name: '10mm' }, { id: '12', name: '12mm' }];
  const CURE = { tack: '仮硬化', full: '本硬化' };
  const dot = (hex, cls) => `<i class="mx-dot${cls ? ' ' + cls : ''}" style="background:${HEX.test(hex) ? hex : '#ccc'}"></i>`;
  const name = (list, id) => (list.find(x => x.id === id) || {}).name || '';

  function designColors(st) {
    const d = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex);
    return d ? Array.from(new Set(['base', 'accent', 'tip', 'deep'].map(r => d.palette[r]).filter(h => HEX.test(h || '')).map(h => h.toUpperCase()))) : [];
  }
  const gen = st => st.aig || (st.aig = { motif: 'rose', style: 'pop', colors: designColors(st).slice(0, 2), w: '10', count: 4, busy: false, result: null, err: null, req: 0 });
  const vis = st => st.aiv || (st.aiv = { src: 'photo', photo: null, busy: false, result: null, err: null, req: 0 });

  /** AI が使えないとき・同意がまだのときの案内。使えるなら '' */
  function gate(st, alt) {
    if (!T.ai.available()) return `<section class="mx-card ai-gate"><b>この版では AI が使えません</b><p class="small muted">AI の中継サーバーが設定されていないためです。${alt}</p></section>`;
    if (T.ai.consent() !== 'yes') return `<section class="mx-card ai-gate"><b>AI を使う前に、確認があります</b><p class="small muted">選んだ内容が Google の Gemini に送られます。18歳以上の方だけ使えます。${alt}</p><button class="btn rose" data-act="ai-ask">${ICON.sparkle}確認して使う</button></section>`;
    return '';
  }
  // シール工房のシートに AI の絵を足せるか（js/stickers.js が 'image' を知っているか）
  const PROBE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const canAdd = () => !!(T.stickers && T.stickers.cleanItem && T.stickers.cleanItem({ id: 'probe', type: 'image', w: 10, count: 1, src: PROBE }));

  // ---- AIでシール絵
  function costLine(g) {
    const left = A.info.left.sticker, first = A.priceOf('gemini-3.1-flash-lite-image', '1K');
    return `<div class="ai-gen-cost">
      <p>1回の費用は約${first}ドル〜（Google の料金。運営が払います）。</p>
      <p>みんなで1日${A.DAILY.sticker}回まで${left != null ? `。きょうは、あと${left}回` : ''}。</p>
      <details><summary>料金のくわしい所</summary><p class="small muted">gemini-3.1-flash-lite-image は1枚 ${A.priceOf('gemini-3.1-flash-lite-image', '1K')}ドル。混んでいて gemini-3.1-flash-image で作ると 512px で ${A.priceOf('gemini-3.1-flash-image', '512')}ドル、1K で ${A.priceOf('gemini-3.1-flash-image', '1K')}ドル。Google の料金ページで${A.PRICE_CHECKED}に確かめた値です。</p></details>
    </div>`;
  }
  function resultCard(st, g) {
    const r = g.result, price = A.priceOf(r.model, r.size), ok = canAdd();
    return `<section class="mx-card ai-gen-result" aria-live="polite">
      <h2 class="mx-h">できた絵</h2>
      <div class="ai-gen-art"><img src="${esc(r.dataUrl)}" alt="AI が作った${esc(name(A.MOTIFS, r.motif))}の絵" width="160" height="160"></div>
      <p class="small muted">AI（${esc(r.model || 'Gemini')}）で作りました${price != null ? `・この1枚 ${price}ドル` : ''}。白い背景は透明にしてあります。</p>
      <div class="st-row"><span class="lab">大きさ</span>${U.seg(SIZES, 'ai-gen-size', g.w, 'aria-label="シールの大きさ"')}</div>
      <div class="st-add"><span class="lab">枚数</span><button class="iconbtn" data-act="ai-gen-n" data-d="-1" aria-label="減らす">${ICON.minus}</button><b class="num">${g.count}</b><button class="iconbtn" data-act="ai-gen-n" data-d="1" aria-label="増やす">${ICON.plus}</button></div>
      <div class="btnrow"><button class="btn rose" data-act="ai-gen-add" ${ok ? '' : 'disabled'}>${ICON.plus}シール工房に足す</button><button class="btn ghost" data-act="ai-gen-make" ${g.busy ? 'disabled' : ''}>${ICON.refresh}もう一度作る</button></div>
      ${ok ? '' : '<p class="small muted">シール工房が、まだ AI の絵に対応していません（アプリの更新を待ってください）。</p>'}
      <p class="small muted">家のプリンターは白を刷れません。透明の用紙では、絵の白い所は透けます。</p>
    </section>`;
  }
  T.views.aigen = st => {
    const g = gen(st), blocked = gate(st, 'シール工房の「手描き」なら、AI なしで絵が作れます。');
    const usable = !blocked;
    const mine = designColors(st).filter(h => !g.colors.includes(h));
    return `${U.bar({ back: true, title: 'AIでシール絵' })}
      <section class="mix ai-gen">
        <p class="mx-lead">ワンコ・ネコ・バラなどの絵を AI が描きます。できた絵はシール工房で、爪の大きさのシートにして刷れます。</p>
        ${blocked}
        <section class="mx-card">
          <h2 class="mx-h">モチーフ</h2>
          <div class="ai-gen-chips">${A.MOTIFS.map(m => `<button class="chip" data-act="ai-gen-motif" data-v="${m.id}" aria-pressed="${g.motif === m.id}">${esc(m.name)}</button>`).join('')}</div>
          <h2 class="mx-h">描き方</h2>
          ${U.seg(A.STYLES, 'ai-gen-style', g.style, 'aria-label="描き方"')}
          <h2 class="mx-h">色（3つまで）</h2>
          <div class="ai-gen-chips">${g.colors.map((h, i) => `<button class="chip" data-act="ai-gen-color-del" data-i="${i}" aria-label="${h} を外す">${dot(h, 'sm')}${esc(h)}${ICON.close}</button>`).join('')}${g.colors.length < 3 ? `<label class="chip">${ICON.plus}色を足す<input id="ai-gen-color" type="color" value="#E6A9B6" class="sr"></label>` : ''}</div>
          ${mine.length && g.colors.length < 3 ? `<div class="ai-gen-chips"><span class="small muted">いまのデザインの色</span>${mine.map(h => `<button class="mx-swatch" data-act="ai-gen-color-add" data-hex="${h}" aria-label="${h} を足す">${dot(h)}</button>`).join('')}</div>` : ''}
          ${costLine(g)}
          <button class="btn rose block" data-act="ai-gen-make" ${g.busy || !usable ? 'disabled' : ''}>${g.busy ? '描いています…（30秒ほど）' : `${ICON.sparkle}絵を作る`}</button>
          ${g.err ? `<p class="ai-err" role="alert">${esc(g.err)}</p>` : ''}
        </section>
        ${g.result ? resultCard(st, g) : ''}
        <p class="small muted">文字・ロゴ・キャラクター・実在の人物は描かないように頼んでいます。似ている絵ができたら使わないでください。送るのは選んだモチーフ・描き方・色だけです。作った絵は、この端末の中だけに残します。</p>
      </section>`;
  };

  /** シール工房のシートに足す。'ok' | 'unsupported' | 'full' | 'images' | 'storage' */
  function addToSheet(st, item) {
    const S = T.stickers; if (!canAdd()) return 'unsupported';
    const it = S.cleanItem(item); if (!it) return 'unsupported';
    let sheet = st.stk && st.stk.sheet;
    if (!sheet) { try { sheet = S.cleanSheet(JSON.parse(localStorage.getItem(SKEY))); } catch (e) { sheet = S.cleanSheet(null); } }
    if (sheet.items.length >= 40) return 'full';
    if (sheet.items.filter(x => x.type === 'image').length >= MAX_IMAGES) return 'images';
    sheet.items.push(it);
    try { localStorage.setItem(SKEY, JSON.stringify(sheet)); } catch (e) { sheet.items.pop(); return 'storage'; }
    return 'ok';
  }
  const ADD_MSG = { unsupported: 'シール工房が、まだ AI の絵に対応していません', full: 'シートに入るのは40種類まで。シール工房で減らしてください', images: `AI の絵は1枚のシートに${MAX_IMAGES}種類まで`, storage: '端末に保存できませんでした（空き容量を確かめてください）' };

  async function make(st) {
    const g = gen(st), my = ++g.req;
    g.busy = true; g.err = null; T.app.render();
    let r = null; try { r = await A.sticker({ motif: g.motif, style: g.style, colors: g.colors }); } catch (e) { r = null; }
    if (g.req !== my) return;
    g.busy = false;
    if (r) g.result = Object.assign({ motif: g.motif }, r); else g.err = A.errorText();
    if (st.view === 'aigen') T.app.render();
  }

  // ---- 写真から作り方
  function stepsCard(st, v) {
    const r = v.result, B = T.brushes;
    const items = r.steps.map(s => {
      const b = A.brushInfo(s.brush);
      const chip = b ? (b.entry && B && B.chip ? B.chip(b.entry) : `<span class="ai-vis-tool">${ICON.wand}${esc(b.name)}</span>`) : '';
      return `<li><span class="ai-vis-text">${esc(s.text)}</span>${chip || CURE[s.cure] ? `<span class="ai-vis-meta">${chip}${CURE[s.cure] ? `<span class="ai-vis-cure ${s.cure}">${CURE[s.cure]}</span>` : ''}</span>` : ''}</li>`;
    }).join('');
    return `<section class="mx-card ai-vis-result" aria-live="polite">
      <h2 class="mx-h">作り方（AIの目安）</h2>
      ${r.colors && r.colors.length ? `<div class="ai-vis-colors"><span class="small muted">使われている色</span>${r.colors.map(h => dot(h)).join('')}</div>` : ''}
      <ol class="ai-vis-steps">${items}</ol>
      <p class="small muted">${r.from === 'photo' ? '写真' : 'デザイン'}から AI（${esc(r.model || 'Gemini')}）が考えた目安です。まちがうこともあります。硬化の時間は、お使いのジェルの説明書に従ってください。</p>
      <div class="btnrow">${T.voice && T.voice.available() ? `<button class="btn ghost sm" data-act="ai-vis-say">${ICON.voice}読み上げる</button>` : ''}${T.views.recipes ? `<button class="btn ghost sm" data-act="nav" data-view="recipes">${ICON.list}描き方レシピ</button>` : ''}</div>
    </section>`;
  }
  function sourceBlock(st, v) {
    if (v.src === 'design') {
      const d = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex);
      if (!d) return '<p class="small muted">いまのデザインがありません。デザインを選んでから、ここに来てください。</p>';
      return `<div class="ai-vis-design">${U.chart(d, 'left')}<p><b>${esc(d.concept.name)}</b><span class="small muted">デザインの説明（技法・色・パーツ）だけを送ります。写真は送りません。</span></p></div>`;
    }
    return `<div class="ai-vis-photo">${v.photo ? `<img src="${esc(v.photo.url)}" alt="送る写真（小さくしたもの）">` : `<span class="ai-vis-empty">${ICON.camera}<span class="small muted">ネイルチップか、爪の先だけを大きく撮った写真</span></span>`}</div>
      <button class="btn ghost block" data-act="ai-vis-pick">${ICON.camera}${v.photo ? '別の写真にする' : '写真を選ぶ'}</button>
      <p class="small muted">顔は写さないでください。写真は送る前に小さくし、撮った場所などの情報を消します。</p>`;
  }
  T.views.aivision = st => {
    const v = vis(st), blocked = gate(st, '描き方レシピなら、AI なしで筆と順番が見られます。');
    if (v.src === 'design' && !st.current) v.src = 'photo';
    const ready = v.src === 'design' ? !!st.current : !!v.photo;
    const SRC = [{ id: 'photo', name: '写真から' }].concat(st.current ? [{ id: 'design', name: 'デザインから' }] : []);
    return `${U.bar({ back: true, title: '写真から作り方' })}
      <section class="mix ai-vis">
        <p class="mx-lead">ネイルの写真から、使う色・筆・順番を AI が考えます。</p>
        ${blocked}
        <section class="mx-card">
          ${SRC.length > 1 ? U.seg(SRC, 'ai-vis-src', v.src, 'aria-label="何から作り方を出すか"') : ''}
          ${sourceBlock(st, v)}
          <button class="btn rose block" data-act="ai-vis-run" ${v.busy || !ready || blocked ? 'disabled' : ''}>${v.busy ? '考えています…' : `${ICON.sparkle}作り方を出す`}</button>
          ${v.err ? `<p class="ai-err" role="alert">${esc(v.err)}</p>` : ''}
        </section>
        ${v.result ? stepsCard(st, v) : ''}
        ${A.photoConsent() === 'yes' ? '<p class="small muted">写真を AI に送るのをやめるときは <button class="link" data-act="ai-photo-consent" data-v="no">写真を送らない</button></p>' : ''}
      </section>`;
  };

  async function runVision(st) {
    const v = vis(st), my = ++v.req, from = v.src;
    v.busy = true; v.err = null; T.app.render();
    let steps = null;
    try {
      if (from === 'design') { const d = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex); steps = d ? await A.recipeFromDesign(d, st.sel) : null; }
      else steps = v.photo ? await A.vision(v.photo.blob) : null;
    } catch (e) { steps = null; }
    if (v.req !== my) return;
    v.busy = false;
    if (steps) v.result = { from, steps: steps.slice(), colors: steps.colors || [], model: steps.model || '' }; else v.err = A.errorText();
    if (st.view === 'aivision') T.app.render();
  }
  function fileInput() {
    let el = document.getElementById('ai-vis-file');
    if (!el) { el = document.createElement('input'); el.type = 'file'; el.accept = 'image/*'; el.id = 'ai-vis-file'; el.className = 'sr'; document.body.appendChild(el); }
    return el;
  }
  async function takePhoto(st, file) {
    const v = vis(st);
    if (!file || (file.type && !/^image\//.test(file.type))) { T.app.toast('写真を選んでください'); return; } // 種類が空の写真（端末による）は、開けるか試す
    const blob = await A.shrink(file);
    if (!blob) { T.app.toast('写真を開けませんでした'); return; }
    if (v.photo) URL.revokeObjectURL(v.photo.url);
    v.photo = { blob, url: URL.createObjectURL(blob) }; v.result = null; v.err = null;
    if (st.view === 'aivision') T.app.render();
  }
  if (hasDOM) {
    document.addEventListener('change', e => {
      const t = e.target, st = T.app.state; if (!t) return;
      if (t.id === 'ai-gen-color' && HEX.test(t.value)) { const g = gen(st), h = t.value.toUpperCase(); if (g.colors.length < 3 && !g.colors.includes(h)) g.colors.push(h); T.app.render(); }
      else if (t.id === 'ai-vis-file' && t.files && t.files[0]) { takePhoto(st, t.files[0]); t.value = ''; }
    });
  }

  Object.assign(T.actions, {
    'ai-gen-motif': (el, st) => { if (A.MOTIFS.some(m => m.id === el.dataset.v)) gen(st).motif = el.dataset.v; T.app.render(); },
    'ai-gen-style': (el, st) => { if (A.STYLES.some(s => s.id === el.dataset.v)) gen(st).style = el.dataset.v; T.app.render(); },
    'ai-gen-color-del': (el, st) => { gen(st).colors.splice(+el.dataset.i, 1); T.app.render(); },
    'ai-gen-color-add': (el, st) => { const g = gen(st), h = String(el.dataset.hex || '').toUpperCase(); if (HEX.test(h) && g.colors.length < 3 && !g.colors.includes(h)) g.colors.push(h); T.app.render(); },
    'ai-gen-make': (el, st) => { if (gen(st).busy) return; if (A.ready(st, false, () => make(st))) make(st); },
    'ai-gen-size': (el, st) => { if (SIZES.some(s => s.id === el.dataset.v)) gen(st).w = el.dataset.v; T.app.render(); },
    'ai-gen-n': (el, st) => { const g = gen(st); g.count = Math.max(1, Math.min(20, g.count + (+el.dataset.d || 0))); T.app.render(); },
    'ai-gen-add': (el, st) => {
      const g = gen(st); if (!g.result) return;
      const res = addToSheet(st, { id: 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), type: 'image', kind: 'image', w: +g.w, count: g.count, src: g.result.dataUrl, motif: g.result.motif });
      if (res !== 'ok') { T.app.toast(ADD_MSG[res]); return; }
      T.app.toast('シール工房のシートに足しました'); T.app.go('stickers');
    },
    'ai-vis-src': (el, st) => { const v = vis(st); v.src = el.dataset.v === 'design' ? 'design' : 'photo'; v.err = null; T.app.render(); },
    'ai-vis-pick': () => { if (hasDOM) fileInput().click(); },
    'ai-vis-run': (el, st) => { const v = vis(st); if (v.busy) return; if (A.ready(st, v.src === 'photo', () => runVision(st))) runVision(st); },
    'ai-vis-say': (el, st) => { const r = vis(st).result; if (r && T.voice) T.voice.speak(r.steps.map((s, i) => `${i + 1}。${s.text}${CURE[s.cure] ? `。そのあと${CURE[s.cure]}` : ''}`)); },
  });
  T.aigenView = { addToSheet, canAdd, gate };
})(typeof window !== 'undefined' ? window : globalThis);
