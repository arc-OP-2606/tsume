/* tsumé — パーツを撮って登録（画面）。持っているパーツ・シールを写真から1個ずつ切り抜き、「持ってる」に入れる。
   切り抜きは端末の中だけ（送らない）。AI は、写真を送る同意があるときの［AIにおまかせ］だけ（T.aiv があるとき）。袋の JAN からも入れられる */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, S = T.scan;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const SENS = [{ id: 'low', name: '透明も拾う' }, { id: 'mid', name: 'ふつう' }, { id: 'high', name: '影を拾わない' }];
  const MAX_OWN = 120;
  const sc = st => st.scan || (st.scan = { phase: 'intro', pieces: [], coin: null, coinGuess: -1, mode: 'coin', sel: 0, sens: 'mid', jan: '', janMsg: null, ai: null, saving: false, done: null, bc: null });
  const items = st => { st.myColors = st.myColors || { gel: [], polish: [] }; return st.myColors.items || (st.myColors.items = []); };
  const kindName = id => (S.KINDS.find(k => k.id === id) || S.KINDS[4]).name;
  const short = it => (T.shop && T.shop.short ? T.shop.short(it) : it.name);
  const dot = hex => `<i class="mx-dot" style="background:${HEX.test(hex || '') ? hex : '#ccc'}"></i>`;
  const revoke = u => { try { if (u && hasDOM) URL.revokeObjectURL(u); } catch (e) {} };
  // 写真を送る同意があり、中継とことばの同意もそろっているときだけ（そろわないと T.aiv.scan は何もしないので、ボタンも出さない）
  function aiOk() { try { return !!(T.aiv && typeof T.aiv.scan === 'function' && typeof T.aiv.photoConsent === 'function' && T.aiv.photoConsent() === 'yes' && (typeof T.aiv.photoReady !== 'function' || T.aiv.photoReady())); } catch (e) { return false; } }
  const keepCount = s => s.pieces.filter(p => p.keep && !p.coin).length;
  // Android アプリ（Capacitor）は capture の無い input ではカメラを出さず、写真の選択だけになる（@capacitor/android 8.5.3 の BridgeWebChromeClient.onShowFileChooser）。
  // そこでは［カメラで撮る］（capture あり）と［写真から選ぶ］を分ける。iPhone・ブラウザは capture なし（OS がカメラか写真かを選ばせる）
  const camSplit = () => !!(T.native && T.native.isNative && T.native.platform === 'android');
  // SHOP の「持ってる」のうち、色（ジェル・マニキュア）は myColors.gel / polish に入る（views-shop.js の toggleOwned と同じ）
  const colorList = it => (it && it.apply && it.apply.paint && it.apply.paint.t === 'one_color' ? (it.illo === 'polish' ? 'polish' : 'gel') : null);
  function ownedRows(st) {
    const mc = st.myColors || {}, rows = items(st).slice();
    ['gel', 'polish'].forEach(k => (Array.isArray(mc[k]) ? mc[k] : []).forEach(c => { if (c && c.shop && T.SHOP && T.SHOP.byId(c.shop)) rows.push(c); }));
    return rows;
  }

  // ---- 画面のかたまり
  const HOWTO_SVG = `<svg class="scan-howto-art" viewBox="0 0 200 120" aria-hidden="true">
    <rect x="30" y="34" width="140" height="80" rx="4" fill="#2B2226"/>
    <circle cx="62" cy="74" r="17" fill="#C9CCD4" stroke="#8C9099" stroke-width="1.5"/><text x="62" y="80" text-anchor="middle" font-size="16" fill="#5F636B" font-family="sans-serif">1</text>
    <circle cx="104" cy="60" r="6" fill="#F5B3C6"/><circle cx="126" cy="66" r="7" fill="#FFFFFF"/><path d="M146 54 l3.5 7 7.5 1 -5.5 5 1.5 7.5 -7 -3.6 -7 3.6 1.5 -7.5 -5.5 -5 7.5 -1z" fill="#D4AF5E"/>
    <circle cx="112" cy="92" r="5" fill="#A9C6EE"/><circle cx="140" cy="94" r="6" fill="#EFEDF6"/>
    <rect x="86" y="2" width="28" height="18" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="100" cy="11" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M100 22 v8 m-3 -3 l3 3 3 -3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
  function intro() {
    return `<section class="mx-card scan-intro">
      <h2 class="mx-h">パーツ・シールを撮る</h2>
      <div class="scan-howto">${HOWTO_SVG}<ul class="notes">
        <li>すき間をあけて並べる。</li><li>1円玉を1枚置く（大きさを測るため）。</li><li>真上から撮る。紙が画面いっぱいになるように近づく。</li>
        <li>透明・白・光るパーツは黒い紙の上、黒や濃い色のパーツは白い紙の上。</li></ul></div>
      ${camSplit() ? `<button class="btn rose block" data-act="sc-photo">${ICON.camera}カメラで撮る</button><button class="btn ghost block" data-act="sc-photo" data-pick="1">撮った写真から選ぶ</button>`
        : `<button class="btn rose block" data-act="sc-photo">${ICON.camera}パーツを撮る</button>`}
      <p class="small muted">写真はこの端末の中だけで切り抜きます。送りません。</p>
    </section>`;
  }
  const busy = text => `<section class="mx-card scan-busy" aria-live="polite"><span class="scan-spin" aria-hidden="true"></span><b>${esc(text)}</b><span class="small muted">端末の中で計算しています</span></section>`;
  function card(p, i, s) {
    const label = p.coin ? '1円玉' : p.name;
    const sub = p.coin ? '直径20mm（ものさし）' : !p.keep ? '入れない' : s.mode === 'coin' ? kindName(p.kind) : `${kindName(p.kind)}・約${p.mm}mm`;
    const hint = s.mode === 'coin' && i === s.coinGuess ? '<em class="scan-guess">1円玉？</em>' : '';
    return `<button class="scan-card${p.coin ? ' coin' : ''}${p.keep || p.coin ? '' : ' off'}" data-act="sc-card" data-i="${i}" aria-label="${i + 1}番 ${esc(label)}">
      <span class="scan-no">${i + 1}</span><span class="scan-thumb">${p.url ? `<img src="${esc(p.url)}" alt="">` : dot(p.color)}</span>
      <span class="scan-meta"><b>${esc(label)}</b><small>${esc(sub)}</small>${hint}</span></button>`;
  }
  function pieces(st) {
    const s = sc(st), n = s.pieces.length, keep = keepCount(s);
    if (!n) {
      return `<section class="mx-card"><h2 class="mx-h">パーツが見つかりませんでした</h2>
        <p class="small">紙の色を変える（白いパーツは黒い紙）、明るい所で真上から撮る、紙を画面いっぱいにする、を試してください。</p>
        <div class="scan-chips" role="group" aria-label="拾い方">${SENS.map(x => `<button class="chip" data-act="sc-sens" data-v="${x.id}" aria-pressed="${s.sens === x.id}">${esc(x.name)}</button>`).join('')}</div>
        <button class="btn rose block" data-act="sc-photo">${ICON.camera}撮り直す</button></section>`;
    }
    const coinLine = s.mode === 'coin'
      ? `<div class="scan-banner" role="status">${ICON.hand}<span><b>1円玉をタップ</b>（写真か下の一覧で）</span><button class="link" data-act="sc-nocoin">1円玉なし</button></div>`
      : s.coin != null ? `<p class="small">1円玉（直径20mm）から大きさを出しました。<button class="link" data-act="sc-coinmode">選び直す</button></p>`
        : `<p class="small muted">1円玉が無いので、大きさは仮の数字です。<button class="link" data-act="sc-coinmode">1円玉を選ぶ</button></p>`;
    const ai = aiOk() ? `<div class="scan-ai"><button class="btn ghost block" data-act="sc-ai" ${s.ai && s.ai.busy ? 'disabled' : ''}>${ICON.sparkle}${s.ai && s.ai.busy ? 'AIで読み取り中…' : 'AIにおまかせ（種類と名前）'}</button>
      <p class="small muted">写真を AI（Google Gemini）に送ります。手や顔が写っていないか確かめてから押してください。</p></div>` : '';
    return `<section class="mx-card scan-result">
      <div class="mx-head"><h2 class="mx-h">見つかったパーツ ${n}個</h2><button class="link" data-act="sc-photo">${ICON.camera}撮り直す</button></div>
      ${s.many ? '<p class="small muted">多いので、大きい順に60個までにしました。</p>' : ''}
      <div class="scan-photo"><canvas id="sc-canvas" data-act="sc-tap" aria-label="撮った写真。パーツをタップで選ぶ"></canvas></div>
      ${coinLine}
      ${ai}
      <div class="scan-grid">${s.pieces.map((p, i) => card(p, i, s)).join('')}</div>
      <p class="small muted">パーツをタップすると、種類・名前・大きさを直せます。高さのあるパーツや、ななめから撮った写真では、大きさがずれます。</p>
      <div class="scan-sens"><span class="small muted">うまく分かれないとき</span><div class="scan-chips" role="group" aria-label="拾い方">${SENS.map(x => `<button class="chip" data-act="sc-sens" data-v="${x.id}" aria-pressed="${s.sens === x.id}">${esc(x.name)}</button>`).join('')}</div></div>
      <button class="btn rose block" data-act="sc-save" ${keep && !s.saving && s.mode !== 'coin' ? '' : 'disabled'}>${s.saving ? '入れています…' : s.mode === 'coin' ? '先に1円玉をタップ（無ければ「1円玉なし」）' : `${keep}個を「持ってる」に入れる`}</button>
    </section>`;
  }
  function done(st) {
    const d = sc(st).done || { n: 0, ok: true };
    return `<section class="mx-card scan-done" aria-live="polite">
      <h2 class="mx-h">${ICON.check}「持ってる」に入れました</h2>
      <p>${d.n}個を入れました。「アイテムで飾る」の下の「持ってる」から、爪にのせられます。</p>
      ${d.ok ? '' : '<p class="scan-warn">この端末では写真の絵を残せませんでした。アプリを閉じると絵は消えます（名前・大きさ・色は残ります）。</p>'}
      <div class="btnrow"><button class="btn rose" data-act="sc-use">${ICON.wand}デザインで使う</button><button class="btn ghost" data-act="sc-photo">${ICON.camera}続けて撮る</button></div>
    </section>`;
  }
  function janBlock(st) {
    const s = sc(st), m = s.janMsg;
    const cam = s.bc === true ? `<button class="btn ghost block" data-act="sc-barcode">${ICON.camera}バーコードを撮る</button>`
      : `<p class="small muted">${s.bc === false ? 'この端末では、カメラでバーコードを読めません。' : ''}袋のバーコードの下の数字（13けた）を入れてください。</p>`;
    return `<section class="mx-card scan-jan">
      <h2 class="mx-h">袋のバーコードから</h2>
      <p class="small muted">tsumé の SHOP にある商品なら、「持ってる」に入れられます。</p>
      ${cam}
      <div class="scan-form"><input id="sc-jan" class="kt-input" type="text" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="13けたの数字" value="${esc(s.jan || '')}" aria-label="JAN（バーコードの数字）"><button class="btn rose" data-act="sc-jan">さがす</button></div>
      ${m ? `<p class="scan-msg ${m.t}" role="status">${esc(m.text)}</p>` : ''}
    </section>`;
  }
  function ownRow(it) {
    if (it.shop) {
      const s = T.SHOP && T.SHOP.byId(it.shop); if (!s) return '';
      return `<li><span class="scan-own-art">${T.renderItem ? T.renderItem(s) : dot(s.hex)}</span><span class="scan-own-t"><b>${esc(short(s))}</b><small>${esc(s.store)}</small></span><button class="iconbtn" data-act="sc-del" data-id="${esc(it.id)}" aria-label="${esc(short(s))}を外す">${ICON.trash}</button></li>`;
    }
    const url = S.src(it.img);
    return `<li><span class="scan-own-art">${url ? `<img src="${esc(url)}" alt="">` : dot(it.color)}</span><span class="scan-own-t"><b>${esc(it.name || kindName(it.kind))}</b><small>${esc(kindName(it.kind))}・約${esc(it.mm)}mm${url ? '' : '・絵なし'}</small></span><button class="iconbtn" data-act="sc-del" data-id="${esc(it.id)}" aria-label="${esc(it.name || kindName(it.kind))}を外す">${ICON.trash}</button></li>`;
  }
  function owned(st) {
    const list = ownedRows(st);
    return `<section class="mx-card scan-own">
      <h2 class="mx-h">持ってる（${list.length}）</h2>
      ${list.length ? `<ul class="scan-own-list">${list.map(ownRow).join('')}</ul>` : '<p class="small muted">まだありません。</p>'}
    </section>`;
  }
  T.views.scan = st => {
    const s = sc(st);
    if (s.bc == null) S.barcodeSupported().then(v => { s.bc = v; if (st.view === 'scan' && T.app) T.app.render(); });
    const main = s.phase === 'busy' ? busy('切り抜いています…') : s.phase === 'pieces' ? pieces(st) : s.phase === 'done' ? done(st) : intro();
    return `${U.bar({ back: true, title: 'パーツを撮って登録' })}
      <section class="scan">
        ${main}
        ${janBlock(st)}
        ${owned(st)}
        <p class="small muted">写真はこの端末の中で切り抜き、切り抜いた絵だけをこの端末に残します。大きさ・色は目安です。</p>
      </section>`;
  };

  // ---- シート: 1個ずつ直す
  function pieceSheet(st, op) {
    const s = sc(st), n = s.pieces.length, i = Math.min(Math.max(0, s.sel || 0), n - 1), p = s.pieces[i];
    if (!p) return '';
    const kinds = S.KINDS.map(k => `<button class="chip" data-act="sc-kind" data-v="${k.id}" aria-pressed="${p.kind === k.id}">${esc(k.name)}</button>`).join('');
    const ideas = Array.from(new Set((p.aiName ? [p.aiName] : []).concat(S.nameIdeas(p.kind, p.color)))).slice(0, 4);
    const hero = `<div class="scan-hero">${p.url ? `<img src="${esc(p.url)}" alt="切り抜いた${i + 1}番のパーツ">` : dot(p.color)}</div>`;
    const body = p.coin
      ? `<div class="scan-top">${hero}<p>これを<b>1円玉（直径20mm）</b>として、ほかのパーツの大きさを出しています。1円玉は「持ってる」には入れません。</p></div>`
      : `<div class="scan-top">${hero}<div class="scan-field"><label class="lab" for="sc-mm">大きさ（長い辺）</label><div class="scan-mm"><input id="sc-mm" class="kt-input" type="number" inputmode="decimal" min="1" max="30" step="0.1" value="${p.mm}"><span>mm</span></div>
          <span class="scan-color">${dot(p.color)}${esc(S.colorWord(p.color))}（色は自動）</span></div></div>
        <p class="small muted">${s.coin != null ? '大きさは1円玉から出した目安です。' : '1円玉が無いので仮の大きさです。定規で測って直せます。'}高さのあるパーツ・ななめの写真ではずれます。</p>
        <div class="scan-field"><span class="lab">種類${p.kindBy === 'ai' ? '（AI）' : p.kindAuto ? '（自動）' : ''}</span><div class="scan-chips" role="group" aria-label="種類">${kinds}</div></div>
        <div class="scan-field"><span class="lab">名前</span><div class="scan-chips" role="group" aria-label="名前の候補">${ideas.map(v => `<button class="chip" data-act="sc-name" data-v="${esc(v)}" aria-pressed="${p.name === v}">${esc(v)}</button>`).join('')}</div>
          <input id="sc-name" class="kt-input" type="text" maxlength="20" autocomplete="off" value="${esc(p.name)}" aria-label="名前（自分で入れる）"></div>`;
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet scan-sheet${op}" role="dialog" aria-modal="true" aria-label="${i + 1}番のパーツ">
        <header class="sheet-head"><b>${i + 1}番 / ${n}個</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          ${body}
          <div class="scan-chips">${p.coin ? '' : `<button class="chip" data-act="sc-keep" aria-pressed="${!p.keep}">これは入れない</button>`}<button class="chip" data-act="sc-setcoin" aria-pressed="${!!p.coin}">${p.coin ? '1円玉をやめる' : 'これが1円玉'}</button></div>
        </div>
        <footer class="sheet-foot btnrow scan-foot"><button class="btn ghost" data-act="sc-step" data-d="-1" ${i ? '' : 'disabled'}>前へ</button><button class="btn ghost" data-act="sc-step" data-d="1" ${i < n - 1 ? '' : 'disabled'}>次へ</button><button class="btn rose" data-act="sheet-close">できた</button></footer>
      </section>`;
  }
  T.sheets = Object.assign(T.sheets || {}, { 'scan-piece': pieceSheet });

  // ---- SHOP の「持ってる」タブとエディタのトレイ（views-shop.js が T.scan.trayItems / ownedCards を呼ぶ）。写真で取り込んだパーツだけ
  const photos = st => items(st).filter(it => it && it.img);
  const art = it => { const url = S.src(it.img); return url ? `<img class="scan-img" src="${esc(url)}" alt="">` : `<i class="mx-dot scan-dot" style="background:${HEX.test(it.color || '') ? it.color : '#ccc'}"></i>`; };
  const label = it => it.name || kindName(it.kind);
  // 爪までドラッグ: interact.js が 'shop-drop' を呼ぶ → views-shop.js の hooks で T.scan.drop を先に試す。つなぎ（photo の種類）が無いときはドラッグさせない
  function trayItems(st) {
    const drag = T.TOPPINGS && T.TOPPINGS.KINDS && T.TOPPINGS.KINDS.photo ? ' data-drag="shop"' : '';
    return photos(st).map(it => `<button class="shop-item" data-act="sc-add" data-id="${esc(it.id)}"${drag} aria-label="${esc(label(it))}をのせる"><span class="si-art">${art(it)}</span><span class="si-name">${esc(label(it))}</span><span class="si-price">約${esc(it.mm)}mm</span></button>`).join('');
  }
  /** トレイからドラッグして落としたとき（views-shop.js の 'shop-drop' から）。写真のパーツでなければ ''（SHOP の処理に任せる） */
  function drop(st, id, pos) {
    const it = photos(st).find(x => x.id === id);
    if (!it || !st.current || !T.editor || !T.TOPPINGS.KINDS.photo) return '';
    if (pos) T.editor.placePart(st, S.partOf(it), pos); else T.editor.addPart(st, S.partOf(it));
    st.fx = 'pop';
    return `${T.FINGER_NAMES[st.editor.finger] || '親指'}に「${label(it)}」をのせました`;
  }
  function ownedCards(st) {
    const list = photos(st); if (!list.length) return '';
    return `<h3 class="scan-own-h">写真で取り込んだパーツ</h3><div class="shop-grid">${list.map(it => `<button class="shop-card" data-act="sc-own" data-id="${esc(it.id)}"><span class="sc-art">${art(it)}</span><span class="sc-name">${esc(label(it))}</span><span class="sc-store">${esc(kindName(it.kind))}・約${esc(it.mm)}mm</span></button>`).join('')}</div>`;
  }
  function ownSheet(st, op) {
    const it = photos(st).find(x => x.id === st.scanOwn); if (!it) return '';
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet scan-sheet${op}" role="dialog" aria-modal="true" aria-label="${esc(label(it))}">
        <header class="sheet-head"><b>${esc(label(it))}</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <div class="scan-top"><div class="scan-hero">${art(it)}</div><div class="scan-field"><span>${esc(kindName(it.kind))}</span><span>大きさ 約${esc(it.mm)}mm（長い辺）</span><span class="scan-color">${dot(it.color)}${esc(S.colorWord(it.color))}</span></div></div>
          <p class="small muted">写真から取り込んだ、自分のパーツです。${S.src(it.img) ? '' : 'この端末に絵が残っていないので、色の丸で描きます。'}</p>
        </div>
        <footer class="sheet-foot btnrow"><button class="btn ghost" data-act="sc-del" data-id="${esc(it.id)}">${ICON.trash}外す</button><button class="btn rose" data-act="sc-try" data-id="${esc(it.id)}">${ICON.wand}爪にのせる</button></footer>
      </section>`;
  }
  T.sheets = Object.assign(T.sheets || {}, { 'scan-own': ownSheet });

  // ---- 動き
  function setPieces(st, list, canvas) {
    const s = sc(st);
    s.pieces.forEach(p => revoke(p.url));
    s.pieces = list; s.coin = null; s.sel = 0; s.mode = 'coin'; s.done = null;
    s.coinGuess = S.guessCoin(list);
    if (s.coinGuess < 0 && !list.length) s.mode = 'edit';
    s.photo = canvas ? { canvas, W: canvas.width, H: canvas.height, view: null } : s.photo;
  }
  function makePiece(p) {
    const kind = S.guessKind(p);
    return { x: p.x, y: p.y, w: p.w, h: p.h, area: p.area, color: p.color, cx: p.cx, cy: p.cy, edge: p.edge, mask: p.mask, kind, kindAuto: true, kindBy: null, name: S.nameFor(kind, p.color), nameAuto: true, mm: S.DEFAULT_MM[kind], mmEdited: false, keep: true, coin: false, png: null, url: null };
  }
  /** 切り抜き → PNG。写真（canvas）は端末の中だけ */
  async function runCutout(st) {
    const s = sc(st), ph = s.photo; if (!ph || !ph.canvas) return;
    s.phase = 'busy'; T.app.render();
    await new Promise(r => setTimeout(r, 30));
    let list = [];
    try {
      const img = ph.canvas.getContext('2d').getImageData(0, 0, ph.W, ph.H), found = S.cutout(img, { sens: s.sens });
      s.many = !!(found.meta && found.meta.many);
      list = found.map(makePiece);
      for (const p of list) { p.png = await S.toPng(ph.canvas, p); p.mask = null; p.url = p.png && hasDOM ? URL.createObjectURL(p.png) : null; }
    } catch (e) { list = []; }
    setPieces(st, list.filter(p => p.png || !hasDOM), null);
    s.phase = 'pieces'; T.app.render();
  }
  async function takePhoto(st, file) {
    const s = sc(st);
    s.phase = 'busy'; T.app.render();
    const canvas = await S.fileToCanvas(file, S.MAX_SIDE);
    if (!canvas) { s.phase = s.pieces.length ? 'pieces' : 'intro'; T.app.render(); T.app.toast('写真を開けませんでした'); return; }
    s.photo = { canvas, W: canvas.width, H: canvas.height, view: null };
    await runCutout(st);
  }
  function refreshMm(s) {
    const coin = s.coin != null ? s.pieces[s.coin] : null;
    s.pieces.forEach(p => { if (p.coin || p.mmEdited) return; p.mm = coin ? S.clampMm(S.mmFromCoin(coin, p)) : S.DEFAULT_MM[p.kind] || 4; });
  }
  function setCoin(st, i) {
    const s = sc(st);
    s.pieces.forEach((p, j) => { if (p.coin && j !== i) { p.coin = false; p.keep = true; } });
    const p = s.pieces[i]; if (!p) return;
    p.coin = true; s.coin = i; s.mode = 'edit'; refreshMm(s);
    T.app.toast('1円玉（20mm）で大きさを出しました');
  }
  function unsetCoin(st) { const s = sc(st); s.pieces.forEach(p => { if (p.coin) { p.coin = false; p.keep = true; } }); s.coin = null; refreshMm(s); }
  function pick(st, i) {
    const s = sc(st); if (!s.pieces[i]) return;
    if (s.mode === 'coin') { setCoin(st, i); T.app.render(); return; }
    s.sel = i; st.sheet = 'scan-piece'; T.app.render();
  }
  const cur = st => { const s = sc(st); return s.pieces[s.sel] || null; };
  async function save(st) {
    const s = sc(st), list = items(st), todo = s.pieces.filter(p => p.keep && !p.coin && p.png);
    if (!todo.length || s.saving) { if (!todo.length) T.app.toast('入れるパーツがありません'); return; }
    const room = MAX_OWN - list.length;
    if (room <= 0) { T.app.toast(`「持ってる」は${MAX_OWN}個までです。下の一覧から外してください`); return; }
    s.saving = true; T.app.render();
    let ok = true, n = 0;
    for (const p of todo.slice(0, room)) {
      const id = S.newId('ph');
      if (!(await S.idb.put(id, p.png))) ok = false;
      list.push({ id, img: 'idb:' + id, kind: p.kind, mm: S.clampMm(p.mm), color: HEX.test(p.color) ? p.color.toUpperCase() : '#CCCCCC', name: S.cleanName(p.name) || S.nameFor(p.kind, p.color) });
      n++;
    }
    T.app.persist();
    s.pieces.forEach(p => revoke(p.url)); s.pieces = []; s.photo = null;
    s.saving = false; s.done = { n, ok }; s.phase = 'done';
    T.app.render();
    if (hasDOM && st.view === 'scan') { try { window.scrollTo(0, 0); } catch (e) {} } // 一覧が消えて縮むので、「入れました」の所へ
    T.app.toast(todo.length > room ? `${n}個を入れました（${MAX_OWN}個まで）` : `${n}個を「持ってる」に入れました`);
  }
  async function runAi(st) {
    const s = sc(st), ph = s.photo; if (!ph || !aiOk() || (s.ai && s.ai.busy)) return;
    s.ai = { busy: true }; T.app.render();
    let r = null;
    try { const blob = await S.canvasBlob(ph.canvas, 'image/jpeg', 0.85); r = blob ? await T.aiv.scan(blob) : null; } catch (e) { r = null; }
    s.ai = { busy: false };
    if (!r || !Array.isArray(r.items) || sc(st).photo !== ph) {
      let why = ''; try { why = !r && T.aiv.errorText ? T.aiv.errorText() : ''; } catch (e) { why = ''; }
      T.app.render(); T.app.toast(`${why || 'AIで読み取れませんでした'}（種類と名前は自分で選べます）`); return;
    }
    const hits = S.matchAi(s.pieces, r.items, ph.W, ph.H); let n = 0;
    hits.forEach((h, i) => {
      const p = s.pieces[i]; if (!h || p.coin) return;
      if (p.kindAuto || p.kindBy === 'ai') { p.kind = h.kind; p.kindAuto = false; p.kindBy = 'ai'; }
      if (h.name) { p.aiName = h.name; if (p.nameAuto) { p.name = h.name; p.nameAuto = true; } }
      else if (p.nameAuto) p.name = S.nameFor(p.kind, p.color);
      n++;
    });
    refreshMm(s); T.app.render();
    T.app.toast(n ? `AIで${n}個の種類と名前を入れました（直せます）` : 'AIの答えが、切り抜きと合いませんでした');
  }
  function addJan(st, raw) {
    const s = sc(st), code = S.janDigits(raw); s.jan = code;
    const say = (t, text) => { s.janMsg = { t, text }; T.app.render(); };
    if (!code) return say('warn', '数字を入れてください。');
    if (!S.janOk(code)) return say('warn', '番号がちがうようです。数字を見直してください（13けた）。');
    const it = S.findJan(code);
    if (!it) return say('info', `tsumé の SHOP に無い商品です（${code}）。パーツなら、写真で取り込めます。`);
    // 色のジェル・マニキュアは「持っている色」（myColors.gel / polish、60色まで）、ほかは items（120個まで）。SHOP の［持ってる］と同じ入れ物
    items(st); // st.myColors を必ず作る
    const ck = colorList(it), list = ck ? (st.myColors[ck] = Array.isArray(st.myColors[ck]) ? st.myColors[ck] : []) : items(st), cap = ck ? 60 : MAX_OWN;
    const have = T.shop && T.shop.owned ? T.shop.owned(st, it) : list.some(x => x && x.shop === it.id);
    if (have) return say('ok', `「${short(it)}」は、もう入っています。`);
    if (list.length >= cap) return say('warn', ck ? '「持ってる」の色は60色までです。' : `「持ってる」は${MAX_OWN}個までです。`);
    if (T.shop && T.shop.toggleOwned) T.shop.toggleOwned(st, it);
    else { list.push(ck ? { id: S.newId('c'), hex: it.apply.paint.c.base.toUpperCase(), name: short(it).slice(0, 20), shop: it.id } : { id: S.newId('sh'), shop: it.id }); T.app.persist(); }
    s.jan = '';
    say('ok', `「${short(it)}」を「持ってる」に入れました。`);
  }
  async function barcodePhoto(st, file) {
    const canvas = await S.fileToCanvas(file, 2048);
    if (!canvas) { T.app.toast('写真を開けませんでした'); return; }
    const code = await S.readBarcode(canvas);
    if (code == null) { sc(st).bc = false; T.app.render(); T.app.toast('この端末では読めません。数字を入れてください'); return; }
    if (!code) { T.app.toast('読めませんでした。明るい所で、バーコードを大きく撮ってください'); return; }
    addJan(st, code);
  }
  function used(st, ref) { const k = S.keyOf(ref); return !!k && S.refsInUse(st).has(k); }

  // 撮った写真に、切り抜きの枠と番号を描く
  function drawPhoto() {
    const st = T.app.state, s = st.scan, cv = hasDOM && document.getElementById('sc-canvas');
    if (!s || !s.photo || !cv) return;
    const ph = s.photo;
    if (!ph.view) { const k = Math.min(1, 720 / Math.max(ph.W, ph.H)), v = document.createElement('canvas'); v.width = Math.round(ph.W * k); v.height = Math.round(ph.H * k); v.getContext('2d').drawImage(ph.canvas, 0, 0, v.width, v.height); ph.view = v; }
    const v = ph.view, k = v.width / ph.W; cv.width = v.width; cv.height = v.height;
    const g = cv.getContext('2d'); g.drawImage(v, 0, 0);
    const fs = Math.max(11, Math.round(v.width / 40));
    s.pieces.forEach((p, i) => {
      const x = p.x * k, y = p.y * k, w = p.w * k, h = p.h * k;
      g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.strokeRect(x - 2, y - 2, w + 4, h + 4);
      g.lineWidth = 1.5; g.strokeStyle = p.coin ? '#C8A96A' : !p.keep ? '#8C8C8C' : '#AB5A69'; g.setLineDash(p.keep || p.coin ? [] : [4, 3]); g.strokeRect(x - 2, y - 2, w + 4, h + 4); g.setLineDash([]);
      const r = fs * 0.75, cx = x - 2, cy = y - 2;
      g.fillStyle = p.coin ? '#C8A96A' : '#AB5A69'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFFFFF'; g.font = `bold ${Math.round(fs * 0.85)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), cx, cy + 0.5);
    });
  }
  function fileInput(id, cam) {
    let el = document.getElementById(id);
    if (!el) { el = document.createElement('input'); el.type = 'file'; el.accept = 'image/*'; el.id = id; el.className = 'sr'; el.tabIndex = -1; el.setAttribute('aria-hidden', 'true'); if (cam) el.setAttribute('capture', 'environment'); document.body.appendChild(el); }
    return el;
  }
  if (hasDOM) {
    window.addEventListener('tsume:render', () => { const st = T.app.state; if (st.view === 'scan' && st.scan && st.scan.phase === 'pieces') drawPhoto(); });
    document.addEventListener('change', e => {
      const t = e.target, st = T.app && T.app.state; if (!t || !st) return;
      if ((t.id === 'sc-file' || t.id === 'sc-file-cam') && t.files && t.files[0]) { takePhoto(st, t.files[0]); t.value = ''; }
      else if ((t.id === 'sc-jan-file' || t.id === 'sc-jan-cam') && t.files && t.files[0]) { barcodePhoto(st, t.files[0]); t.value = ''; }
      else if (t.id === 'sc-mm') { const p = cur(st), v = parseFloat(String(t.value).replace(',', '.')); if (p && isFinite(v)) { p.mm = S.clampMm(v); p.mmEdited = true; t.value = p.mm; } }
    });
    document.addEventListener('input', e => {
      const t = e.target, st = T.app && T.app.state; if (!t || !st) return;
      if (t.id === 'sc-name') { const p = cur(st); if (p) { p.name = S.cleanName(t.value); p.nameAuto = false; } }
      else if (t.id === 'sc-jan') sc(st).jan = t.value;
      else if (t.id === 'sc-mm') { const p = cur(st), v = parseFloat(String(t.value).replace(',', '.')); if (p && isFinite(v) && v >= 1 && v <= 30) { p.mm = Math.round(v * 10) / 10; p.mmEdited = true; } }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'sc-jan' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); addJan(T.app.state, e.target.value); } });
  }

  Object.assign(T.actions, {
    'sc-photo': el => { if (!hasDOM) return; const cam = camSplit() && !(el && el.dataset && el.dataset.pick === '1'); fileInput(cam ? 'sc-file-cam' : 'sc-file', cam).click(); },
    'sc-barcode': () => { if (hasDOM) { const cam = camSplit(); fileInput(cam ? 'sc-jan-cam' : 'sc-jan-file', cam).click(); } },
    'sc-sens': (el, st) => { const s = sc(st); s.sens = SENS.some(x => x.id === el.dataset.v) ? el.dataset.v : 'mid'; if (s.photo) runCutout(st); else T.app.render(); },
    'sc-card': (el, st) => pick(st, +el.dataset.i),
    'sc-tap': (el, st, ev) => {
      const s = sc(st), ph = s.photo; if (!ph || !ev || !el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * ph.W, y = ((ev.clientY - r.top) / r.height) * ph.H, m = 10 * ph.W / Math.max(1, r.width);
      let best = -1; s.pieces.forEach((p, i) => { if (x >= p.x - m && x <= p.x + p.w + m && y >= p.y - m && y <= p.y + p.h + m && (best < 0 || p.area < s.pieces[best].area)) best = i; });
      if (best >= 0) pick(st, best);
    },
    'sc-nocoin': (el, st) => { const s = sc(st); unsetCoin(st); s.mode = 'edit'; T.app.render(); },
    'sc-coinmode': (el, st) => { sc(st).mode = 'coin'; T.app.render(); T.app.toast('1円玉をタップしてください'); },
    'sc-kind': (el, st) => {
      const p = cur(st), k = el.dataset.v; if (!p || !S.KINDS.some(x => x.id === k)) return;
      p.kind = k; p.kindAuto = false; p.kindBy = null;
      if (p.nameAuto) p.name = S.nameFor(k, p.color);
      if (sc(st).coin == null && !p.mmEdited) p.mm = S.DEFAULT_MM[k];
      T.app.render();
    },
    'sc-name': (el, st) => { const p = cur(st); if (!p) return; p.name = S.cleanName(el.dataset.v); p.nameAuto = false; T.app.render(); },
    'sc-keep': (el, st) => { const p = cur(st); if (!p) return; p.keep = !p.keep; T.app.render(); },
    'sc-setcoin': (el, st) => { const s = sc(st), p = cur(st); if (!p) return; if (p.coin) unsetCoin(st); else setCoin(st, s.sel); T.app.render(); },
    'sc-step': (el, st) => { const s = sc(st); s.sel = Math.min(s.pieces.length - 1, Math.max(0, (s.sel || 0) + (+el.dataset.d || 0))); T.app.render(); },
    'sc-save': (el, st) => { save(st); },
    'sc-ai': (el, st) => { runAi(st); },
    'sc-use': (el, st) => {
      if (st.current && T.editor) { T.editor.enter(st); T.app.go('editor'); return; }
      T.app.go('try'); T.app.toast('デザインを選んで「アイテムで飾る」から使えます');
    },
    'sc-jan': (el, st) => { const i = hasDOM && document.getElementById('sc-jan'); addJan(st, i ? i.value : sc(st).jan); },
    'sc-del': (el, st) => {
      const mc = st.myColors || {}, lists = [items(st)].concat(['gel', 'polish'].map(k => (Array.isArray(mc[k]) ? mc[k] : [])));
      const list = lists.find(l => l.some(x => x && x.id === el.dataset.id)); if (!list) return;
      const [it] = list.splice(list.findIndex(x => x && x.id === el.dataset.id), 1); T.app.persist();
      if (it.img && !used(st, it.img)) S.idb.del(S.keyOf(it.img));
      if (st.sheet === 'scan-own') st.sheet = null;
      T.app.render(); T.app.toast('「持ってる」から外しました');
    },
    'sc-add': (el, st) => {
      const it = items(st).find(x => x.id === el.dataset.id); if (!it || !it.img || !st.current) return;
      if (!T.editor || !T.TOPPINGS.KINDS.photo) { T.app.toast('この版では、まだ爪にのせられません'); return; }
      T.editor.addPart(st, S.partOf(it)); st.fx = 'pop'; T.app.render();
      T.app.toast(`${T.FINGER_NAMES[st.editor.finger] || '親指'}に「${label(it)}」をのせました`);
    },
    'sc-own': (el, st) => { st.scanOwn = el.dataset.id; st.sheet = 'scan-own'; T.app.render(); },
    // SHOP の「持ってる」から［爪にのせる］（views-shop.js の shop-try と同じ流れ）
    'sc-try': (el, st) => {
      const it = items(st).find(x => x.id === el.dataset.id); st.sheet = null;
      if (!it || !T.editor || !T.TOPPINGS.KINDS.photo) { T.app.render(); T.app.toast('この版では、まだ爪にのせられません'); return; }
      if ((!st.current || (st.view === 'shop' && T.app.peek() === 'try')) && T.tryAdopt) T.tryAdopt(st);
      if (!st.current) { T.app.render(); T.app.toast('先にデザインを選んでください'); return; }
      if (st.view !== 'editor') T.editor.enter(st);
      T.editor.addPart(st, S.partOf(it)); st.fx = 'pop';
      if (st.view !== 'editor') T.app.go('editor'); else T.app.render();
      T.app.toast(`${T.FINGER_NAMES[st.editor.finger] || '親指'}に「${label(it)}」をのせました`);
    },
  });
  Object.assign(T.scan, { trayItems, ownedCards, drop });
  T.scanView = { sc, makePiece, setPieces, setCoin, unsetCoin, addJan, save, refreshMm, items, ownedRows };
})(typeof window !== 'undefined' ? window : globalThis);
