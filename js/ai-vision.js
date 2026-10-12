/* tsumé — AI の部品（写真のパーツ判定・写真から作り方・AIでシール絵・デザインから作り方）。中継（relay/）経由。
   どれも文字の同意（18歳以上。T.ai.usable()）が前提。写真を送るものは、写真の同意（tsume.photoai.v1）も別に要る。
   写真は送る前にここで描き直す（長い辺 1536px の JPEG。位置情報などは付かない）。返ってきた値は全部確かめ、知らない値は捨てる */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const KEY = 'tsume.photoai.v1';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const hasDOM = typeof document !== 'undefined';
  /* 中継は 1.5MB まで受けるが、Workers Free の CPU 上限（1リクエスト 10ms。2026-10-12 に developers.cloudflare.com/workers/platform/limits で確認）に
     収まるよう、送るのは 1MB まで（1.5MB の JSON を読むだけで約10ms かかった。Mac の node で実測） */
  const LONG = 1536, MAX_BYTES = 1024 * 1024;
  /* relay/worker.js と同じ値（test/aivision.test.js で突き合わせる） */
  const KINDS = ['stone', 'pearl', 'metal', 'stud', 'bijou', 'flower3d', 'sticker', 'chain', 'other'];
  const CURES = ['tack', 'full', 'none'];
  const DAILY = { scan: 300, vision: 300, sticker: 50 };
  const TOOLS = [
    { id: 'flat', name: '平筆' }, { id: 'oval', name: 'オーバル筆' }, { id: 'angled', name: '斜め筆' }, { id: 'liner_short', name: 'ライナー（短い毛）' },
    { id: 'liner_long', name: 'ライナー（長い毛）' }, { id: 'art_fine', name: '極細アート筆' }, { id: 'almond', name: 'アーモンド筆' }, { id: 'round', name: 'ラウンド筆' },
    { id: 'dotting', name: 'ドットペン' }, { id: 'tap', name: 'タップ筆' }, { id: 'comb', name: 'コーム筆' }, { id: 'point', name: 'ポイント筆' },
    { id: 'sponge', name: 'スポンジ' }, { id: 'tweezers', name: 'ピンセット' }, { id: 'magnet', name: 'マグネット' }, { id: 'none', name: '' },
  ];
  /* 中継の筆の名前 → 筆の図鑑（T.BRUSHES）の id */
  const ALIAS = { flat: 'brush_flat', oval: 'brush_oval', angled: 'brush_angular', liner_short: 'brush_liner_s', liner_long: 'brush_liner_l', art_fine: 'brush_fine', almond: 'brush_almond', round: 'brush_round', dotting: 'dotting', tap: 'brush_tap', comb: 'brush_comb', point: 'brush_point' };
  const MOTIFS = [
    { id: 'dog_face', name: 'ワンコ' }, { id: 'cat_face', name: 'ネコ' }, { id: 'rabbit_face', name: 'うさぎ' }, { id: 'bear_face', name: 'くま' }, { id: 'paw', name: '肉球' },
    { id: 'rose', name: 'バラ' }, { id: 'tulip', name: 'チューリップ' }, { id: 'sakura', name: '桜' }, { id: 'daisy', name: 'デイジー' }, { id: 'ribbon', name: 'リボン' },
    { id: 'butterfly', name: 'ちょうちょ' }, { id: 'heart', name: 'ハート' }, { id: 'star', name: '星' }, { id: 'moon', name: '月' }, { id: 'cherry', name: 'さくらんぼ' },
    { id: 'strawberry', name: 'いちご' }, { id: 'leaf', name: 'リーフ' }, { id: 'shell', name: '貝がら' }, { id: 'crown', name: '王冠' }, { id: 'cloud', name: '雲' },
  ];
  const STYLES = [{ id: 'line', name: '線画' }, { id: 'pop', name: 'ポップ' }, { id: 'watercolor', name: '水彩' }];
  /* 1枚の料金（ドル）。2026-10-12 に https://ai.google.dev/gemini-api/docs/pricing で確認（ページの更新日 2026-10-09）。知らないモデルは出さない */
  const PRICES = { 'gemini-3.1-flash-lite-image': { '1K': 0.0336 }, 'gemini-3.1-flash-image': { 512: 0.045, '1K': 0.067 } };
  const PRICE_CHECKED = '2026年10月12日';
  /* 部品の種類 → トッピングの種類（T.TOPPINGS.KINDS） */
  const TOPPING_OF = { stone: 'stone', pearl: 'pearl', metal: 'charm', stud: 'stud', bijou: 'bijou', flower3d: 'flower3d', sticker: 'sticker', chain: 'chain' };

  // ---- 写真を送る同意（文字の同意とは別）
  function photoConsent() { try { const v = localStorage.getItem(KEY); return v === 'yes' || v === 'no' ? v : null; } catch (e) { return null; } }
  function setPhotoConsent(v) { try { localStorage.setItem(KEY, v === 'yes' ? 'yes' : 'no'); } catch (e) {} }
  const textOk = () => !!(T.ai && T.ai.usable());
  const photoOk = () => textOk() && photoConsent() === 'yes';

  function photoSheet(st, op) {
    const { ICON } = T.ui;
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet ai-sheet${op}" role="dialog" aria-modal="true" aria-label="写真をAIに送る">
        <header class="sheet-head"><b>写真をAIに送る</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <p>写真は Google の Gemini に送られます。tsumé は保存しません。</p>
          <p>人の顔・手が写らないように、パーツだけを写してください。作り方を出すときは、ネイルチップか爪の先だけを大きく写してください。</p>
          <p class="ai-age"><b>18歳以上の方だけ</b>が使えます（Google の利用規約）。</p>
          <ul class="notes"><li>送る前に写真を小さくし、撮った場所などの情報を消します。</li><li>送るのは、ボタンを押したときの1枚だけです。</li><li>あとから「使い方」で止められます。</li></ul>
        </div>
        <footer class="sheet-foot btnrow"><button class="btn ghost" data-act="ai-photo-consent" data-v="no">送らない</button><button class="btn rose" data-act="ai-photo-consent" data-v="yes">18歳以上・写真を送る</button></footer>
      </section>`;
  }
  /** 「使い方」画面に置くカード（写真を送るかどうか） */
  function aboutCard() {
    if (!T.ai || !T.ai.available()) return '';
    const yes = photoConsent() === 'yes';
    return `<div class="card flat"><h3>写真をAIに送る</h3><p class="small muted">「写真から作り方」と、「パーツを取り込む」の「AIにおまかせ」で、選んだ写真1枚を中継サーバーを通して Google Gemini に送ります。tsumé は保存しません。18歳以上の方だけ。</p><div class="btnrow"><button class="btn ghost sm" data-act="ai-photo-consent" data-v="${yes ? 'no' : 'ask'}">${yes ? '写真を送らない' : '写真を送る'}</button></div></div>`;
  }

  // ---- 同意がそろうまで続きを待つ。そろっていれば true。
  //      続き（pending）は、確認のシートを開いているあいだ・同じ画面にいるあいだだけ生きる
  //      （閉じたあと、別の画面で同意しても、前に押した「作る」「送る」は動かさない）
  let pending = null;
  const CONSENT_SHEETS = ['ai-consent', 'photo-consent'];
  function ready(st, needPhoto, cont) {
    pending = null;
    if (!T.ai || !T.ai.available()) { T.app.toast('AIの中継が設定されていないので、使えません'); return false; }
    const p = { needPhoto: !!needPhoto, cont: cont || null, view: st.view };
    if (T.ai.consent() !== 'yes') { pending = p; st.sheet = 'ai-consent'; T.app.render(); return false; }
    if (needPhoto && photoConsent() !== 'yes') { pending = p; st.sheet = 'photo-consent'; T.app.render(); return false; }
    return true;
  }
  /** 同意のボタンが押されたとき。続きを取り出して消す（描き直しの前に呼ぶ） */
  function takePending() { const p = pending; pending = null; return p; }
  function resume(st, p) {
    if (!p || p.view !== st.view) return;
    if (p.needPhoto && photoConsent() !== 'yes') { pending = p; st.sheet = 'photo-consent'; T.app.render(); return; }
    if (p.cont) p.cont();
  }
  // 確認のシートが閉じられた（✕・背景・Esc・戻る・画面の移動）ら、続きは捨てる
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('tsume:render', () => { const st = T.app && T.app.state; if (pending && !(st && CONSENT_SHEETS.includes(st.sheet))) pending = null; });
  }

  // ---- 写真を小さくする（端末の中）
  function loadImage(blob) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }
  const toBlob = (c, q) => new Promise(resolve => { try { c.toBlob(b => resolve(b), 'image/jpeg', q); } catch (e) { resolve(null); } });
  /** blob か canvas → 長い辺 1536px の JPEG（1MB まで。位置情報などは付かない）。DOM が無い・読めないときは null */
  async function shrink(src) {
    if (!hasDOM || !src) return null;
    const img = typeof src.getContext === 'function' ? src : await loadImage(src);
    const w0 = img && (img.naturalWidth || img.width), h0 = img && (img.naturalHeight || img.height);
    if (!w0 || !h0) return null;
    const k = Math.min(1, LONG / Math.max(w0, h0)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
    const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    for (const q of [0.85, 0.72, 0.6, 0.48]) { const b = await toBlob(c, q); if (b && b.size <= MAX_BYTES) return b; }
    return null;
  }
  function bytesToB64(u) { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function b64ToBytes(s) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  /** JPEG に EXIF・XMP（APP1。撮った場所が入る）があるか。SOS（画像の本体）の前の区切りだけを見る */
  function hasApp1(u) {
    for (let i = 2; i + 3 < u.length && u[i] === 0xFF;) {
      const m = u[i + 1]; if (m === 0xDA || m === 0xD9) return false; if (m === 0xE1) return true;
      i += 2 + ((u[i + 2] << 8) | u[i + 3]);
    }
    return false;
  }
  /** 送る形（JPEG の base64）。base64 の JPEG を渡されたときも、画面のある所では描き直す（位置情報を消す）。
      描き直せない所（検査）では、EXIF・XMP の無いものだけそのまま */
  async function imageB64(src) {
    if (typeof src === 'string') {
      const s = src.replace(/^data:image\/jpeg;base64,/, '');
      if (!/^\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(s) || s.length % 4) return null;
      let u; try { u = b64ToBytes(s); } catch (e) { return null; }
      if (hasDOM && typeof Blob !== 'undefined') src = new Blob([u], { type: 'image/jpeg' });
      else return u.length <= MAX_BYTES && !hasApp1(u) ? s : null;
    }
    const b = await shrink(src); if (!b) return null;
    return bytesToB64(new Uint8Array(await b.arrayBuffer()));
  }

  // ---- 中継を呼ぶ
  const relay = () => (T.CONFIG && T.CONFIG.relayUrl ? String(T.CONFIG.relayUrl).replace(/\/$/, '') : '');
  const info = { error: null, left: {} };
  const ERR = {
    consent: 'AIを使う同意がまだです', photo: '写真を送る同意がまだです', daily: 'きょうの回数（みんなで使える上限）を使い切りました。あしたまた使えます',
    busy: '混み合っています。1分ほど待ってから、もう一度', blocked: 'この組み合わせでは絵が作れませんでした。モチーフか色を変えてください',
    bad: '写真を読めませんでした。別の写真で試してください', timeout: '時間がかかりすぎました。もう一度試してください', network: '通信できませんでした。電波の良い所で試してください',
    server: 'AIが答えませんでした。少し待ってから試してください', empty: '読み取れませんでした。明るい所で、ネイルを大きく撮ってください',
    missing: 'この機能は、AIの中継サーバーの更新待ちです。もうしばらくお待ちください',
  };
  const errorText = code => ERR[code || info.error] || ERR.server;
  async function post(kind, body, ms) {
    info.error = null;
    if (!textOk()) { info.error = 'consent'; return null; }
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, ms);
    try {
      const headers = { 'content-type': 'application/json' };
      if (T.CONFIG.relayToken) headers['x-tsume-token'] = T.CONFIG.relayToken;
      const r = await fetch(relay() + '/v1/' + kind, { method: 'POST', headers, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined });
      const left = r.headers && r.headers.get('x-tsume-left');
      if (left != null && /^\d{1,5}$/.test(left)) info.left[kind] = +left;
      let j = null; try { j = await r.json(); } catch (e) { j = null; }
      if (!r.ok) { info.error = r.status === 429 ? (j && j.error === 'daily limit' ? 'daily' : 'busy') : r.status === 422 ? 'blocked' : r.status === 400 || r.status === 413 ? 'bad' : r.status === 503 ? 'busy' : r.status === 404 ? 'missing' : 'server'; return null; }
      return j && typeof j === 'object' ? j : (info.error = 'server', null);
    } catch (e) { info.error = e && e.name === 'AbortError' ? 'timeout' : 'network'; return null; } finally { clearTimeout(timer); }
  }

  // ---- 返ってきた値の確かめ
  const clip = (s, n) => Array.from(String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>&"'`]/g, '').trim()).slice(0, n).join('');
  const colors = (list, n) => Array.from(new Set((Array.isArray(list) ? list : []).filter(c => typeof c === 'string' && HEX.test(c)).map(c => c.toUpperCase()))).slice(0, n);
  function cleanScan(list) {
    if (!Array.isArray(list)) return null;
    return list.slice(0, 30).map(x => {
      if (!x || !Array.isArray(x.box_2d) || x.box_2d.length !== 4 || !x.box_2d.every(v => typeof v === 'number' && isFinite(v)) || !KINDS.includes(x.kind)) return null;
      const b = x.box_2d.map(v => Math.round(Math.min(1000, Math.max(0, v)))); if (b[0] >= b[2] || b[1] >= b[3]) return null;
      const k = TOPPING_OF[x.kind] && T.TOPPINGS && T.TOPPINGS.KINDS[TOPPING_OF[x.kind]] ? TOPPING_OF[x.kind] : null;
      return { box: b, box_2d: b, kind: x.kind, k, color: HEX.test(x.color || '') ? x.color.toUpperCase() : null, name: clip(x.name, 12) || (k ? T.TOPPINGS.KINDS[k].name : 'パーツ') };
    }).filter(Boolean);
  }
  /** 筆の id → { id, name, entry }。筆の図鑑にあればその名前。使わない手順は null */
  function brushInfo(id) {
    if (!id || id === 'none') return null;
    const L = T.BRUSHES && Array.isArray(T.BRUSHES.LIST) ? T.BRUSHES.LIST : [];
    const b = L.find(x => x.id === id) || L.find(x => x.id === ALIAS[id]);
    if (b) return { id: b.id, name: String(b.name || ''), entry: b };
    const t = TOOLS.find(x => x.id === id);
    return t && t.name ? { id: t.id, name: t.name, entry: null } : null;
  }
  function cleanSteps(list, ids, max) {
    if (!Array.isArray(list)) return null;
    return list.slice(0, max).map(s => {
      const text = s && clip(s.text, 60); if (!text) return null;
      const brush = ids.includes(s.brush) && s.brush !== 'none' ? s.brush : null;
      return { text, brush, cure: CURES.includes(s.cure) ? s.cure : 'none' };
    }).filter(Boolean);
  }

  // ---- F4: 写真のパーツを見つける → 配列 [{ box:[ymin,xmin,ymax,xmax]（0〜1000）, kind, k（トッピングの種類）, color, name }] | null。
  //      配列には .items（同じ配列）と .model もつける（js/views-scan.js は r.items を読む）
  async function scan(src) {
    if (!photoOk()) { info.error = textOk() ? 'photo' : 'consent'; return null; }
    const image = await imageB64(src); if (!image) { info.error = 'bad'; return null; }
    const j = await post('scan', { image }, 45000); if (!j) return null;
    const items = cleanScan(j.items); if (!items) { info.error = 'empty'; return null; }
    items.items = items; items.model = clip(j.model, 60); return items;
  }
  // ---- F14(b): ネイルの写真から作り方 → steps（配列。steps.colors・steps.model つき）| null
  async function vision(src) {
    if (!photoOk()) { info.error = textOk() ? 'photo' : 'consent'; return null; }
    const image = await imageB64(src); if (!image) { info.error = 'bad'; return null; }
    const j = await post('vision', { image }, 60000); if (!j) return null;
    const steps = cleanSteps(j.steps, TOOLS.map(t => t.id), 10);
    if (!steps || !steps.length) { info.error = 'empty'; return null; }
    steps.colors = colors(j.colors, 6); steps.model = clip(j.model, 60); return steps;
  }

  // ---- F14(a): デザインから作り方（文字だけ。今の /v1/generate）
  const ROLE = { base: 'ベース', tip: '先端', accent: '差し色', deep: '濃い色', light: '明るい色', metal: 'メタル' };
  const FINGERS = ['親指', '人差し指', '中指', '薬指', '小指'];
  function brushChoices() {
    const L = T.BRUSHES && Array.isArray(T.BRUSHES.LIST) ? T.BRUSHES.LIST.filter(b => b && /^[\w-]{1,40}$/.test(b.id)) : [];
    const tools = TOOLS.filter(t => ['sponge', 'tweezers', 'magnet', 'none'].includes(t.id));
    return L.length ? L.map(b => ({ id: b.id, name: String(b.name || b.id).slice(0, 20) })).concat(tools) : TOOLS.slice();
  }
  function orderRule() {
    const R = T.BRUSHES && T.BRUSHES.ORDER_RULE;
    const lines = Array.isArray(R) ? R.map(x => (typeof x === 'string' ? x : x && x.text ? (x.tentative ? '（目安）' : '') + x.text : '') || '').filter(Boolean) : typeof R === 'string' ? [R] : [];
    return (lines.length ? lines : ['地色を塗って硬化してから描く。', '面 → 線 → 小さな点の順。', '色を変える前に仮硬化。', 'パーツはトップの前。', '最後にトップを塗って本硬化。']).join(' / ').slice(0, 1600);
  }
  function describe(design) {
    const specs = (design.foot || design.left || []).slice(0, 5), P = design.palette || {};
    const tech = id => (T.TECHNIQUES && T.TECHNIQUES[id] ? T.TECHNIQUES[id].name : '');
    const part = t => { try { return T.toppings ? T.toppings.itemName(t) : ''; } catch (e) { return ''; } };
    const fingers = specs.map((f, i) => {
      const techs = (f && f.cover ? ['シール（全面）'] : [f && f.over, f && f.t].concat(((f && f.layers) || []).map(l => l.t)).map(tech)).filter(Boolean);
      const tops = Array.from(new Set(((f && f.toppings) || []).map(part).filter(Boolean)));
      return `${FINGERS[i]}: ${techs.join('＋') || '塗りだけ'}${tops.length ? `／パーツ: ${tops.join('・')}` : ''}`;
    });
    const cols = Object.keys(ROLE).filter(r => HEX.test(P[r] || '')).map(r => `${ROLE[r]} ${P[r].toUpperCase()}`);
    return { name: design.concept && design.concept.name ? clip(design.concept.name, 30) : '', fingers, cols };
  }
  /** デザイン → steps（配列。steps.model つき）| null */
  async function recipeFromDesign(design, sel) {
    info.error = null;
    if (!textOk()) { info.error = 'consent'; return null; }
    if (!design || !(design.left || design.foot)) { info.error = 'empty'; return null; }
    sel = sel || (T.app && T.app.state && T.app.state.sel) || {};
    const polish = sel.method === 'polish', choices = brushChoices(), d = describe(design);
    const prompt = [
      `セルフネイル初心者向けに、このネイルの作り方を、作る順に最大12手順で書いてください（${polish ? 'マニキュア' : 'ジェル'}）。`,
      d.name ? `デザイン: ${d.name}` : '', `色: ${d.cols.join('、') || 'おまかせ'}`, '指ごと（左手）:', d.fingers.join('\n'),
      `順番の決まり: ${orderRule()}`,
      'text は日本語で60字まで。商品名は書かない。筆・道具は text に書かず brush で選ぶ。',
      `brush: ${choices.filter(c => c.id !== 'none').map(c => `${c.id}=${c.name}`).join(', ')}, none=使わない。`,
      `cure（その手順のあと）: tack=色を変える前の仮硬化, full=本硬化, none=硬化しない${polish ? '（マニキュアはすべて none）' : ''}。硬化の秒数は書かない。`,
    ].filter(Boolean).join('\n');
    const schema = { type: 'OBJECT', properties: { steps: { type: 'ARRAY', items: { type: 'OBJECT', properties: { text: { type: 'STRING' }, brush: { type: 'STRING', enum: choices.map(c => c.id) }, cure: { type: 'STRING', enum: CURES } }, required: ['text', 'brush', 'cure'] } } }, required: ['steps'] };
    let r = null; try { r = await T.ai.generateJSON(prompt, schema, { temperature: 0.4, maxTokens: 1800, timeout: 30000 }); } catch (e) { r = null; }
    if (!r || !r.data) { info.error = 'server'; return null; }
    const steps = cleanSteps(r.data.steps, choices.map(c => c.id), 12);
    if (!steps || !steps.length) { info.error = 'empty'; return null; }
    if (polish) steps.forEach(s => { s.cure = 'none'; });
    steps.model = clip(r.model, 60); return steps;
  }

  // ---- F13: シール用の絵 → { dataUrl（256px・背景は透明の PNG）, model, size } | null
  /** 白い背景を透明にする。背景は外周につながった、外周の色に近い所だけ（絵の中の白は残す）。ふちは半透明にして白いにじみを消す */
  function clearWhite(px, w, h, o) {
    o = o || {};
    const near = o.near == null ? 22 : o.near, soft = o.soft == null ? 70 : o.soft, N = w * h;
    let R = 0, G = 0, B = 0, n = 0;
    const edge = i => { const j = i * 4; if (px[j + 3] > 200 && Math.min(px[j], px[j + 1], px[j + 2]) >= 200) { R += px[j]; G += px[j + 1]; B += px[j + 2]; n++; } };
    for (let x = 0; x < w; x++) { edge(x); edge((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { edge(y * w); edge(y * w + w - 1); }
    if (!n) return 0;
    const bg = [R / n, G / n, B / n];
    const dist = j => Math.max(Math.abs(px[j] - bg[0]), Math.abs(px[j + 1] - bg[1]), Math.abs(px[j + 2] - bg[2]));
    const isBg = i => px[i * 4 + 3] < 16 || dist(i * 4) <= near;
    const seen = new Uint8Array(N), q = new Int32Array(N); let head = 0, tail = 0;
    const push = i => { if (!seen[i] && isBg(i)) { seen[i] = 1; q[tail++] = i; } };
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (head < tail) { const i = q[head++], x = i % w, y = (i - x) / w; if (x > 0) push(i - 1); if (x < w - 1) push(i + 1); if (y > 0) push(i - w); if (y < h - 1) push(i + w); }
    for (let i = 0; i < N; i++) if (seen[i]) px[i * 4 + 3] = 0;
    for (let i = 0; i < N; i++) {
      if (seen[i]) continue;
      const x = i % w, y = (i - x) / w;
      if (!((x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w]))) continue;
      const j = i * 4, d = dist(j); if (d >= soft) continue;
      const a = Math.max(0.05, (d - near) / (soft - near));
      for (let c = 0; c < 3; c++) px[j + c] = Math.max(0, Math.min(255, Math.round((px[j + c] - bg[c] * (1 - a)) / a)));
      px[j + 3] = Math.round(px[j + 3] * a);
    }
    return tail;
  }
  /** 透明でない所の外枠。全部透明なら null */
  function bbox(px, w, h, min) {
    min = min == null ? 12 : min; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > min) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }
  /** 絵 → 背景を抜き、余白を切り、正方形 256px（大きすぎれば 192px）の PNG */
  function cutout(url) {
    if (!hasDOM) return Promise.resolve(null);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const k = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
          const d = g.getImageData(0, 0, w, h); clearWhite(d.data, w, h); g.putImageData(d, 0, 0);
          const b = bbox(d.data, w, h); if (!b) { resolve(null); return; }
          const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
          for (const S of [256, 192]) {
            const o = document.createElement('canvas'); o.width = o.height = S;
            const og = o.getContext('2d'), pad = Math.round(S * 0.04), s = (S - 2 * pad) / Math.max(bw, bh);
            og.imageSmoothingQuality = 'high'; og.drawImage(c, b.x0, b.y0, bw, bh, (S - bw * s) / 2, (S - bh * s) / 2, bw * s, bh * s);
            const out = o.toDataURL('image/png');
            if (out.length <= 180000 || S === 192) { resolve(/^data:image\/png;base64,/.test(out) && out.length <= 200000 ? out : null); return; }
          }
        } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  async function sticker(o) {
    o = o || {};
    if (!textOk()) { info.error = 'consent'; return null; }
    const motif = MOTIFS.some(m => m.id === o.motif) ? o.motif : null, style = STYLES.some(s => s.id === o.style) ? o.style : null;
    if (!motif || !style) { info.error = 'bad'; return null; }
    const j = await post('sticker', { motif, style, colors: colors(o.colors, 3) }, 80000); if (!j) return null;
    const mime = /^image\/(png|jpeg|webp)$/.test(j.mime || '') ? j.mime : 'image/png';
    if (typeof j.image !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(j.image)) { info.error = 'server'; return null; }
    const dataUrl = await api.cutout(`data:${mime};base64,${j.image}`);
    if (!dataUrl) { info.error = 'blocked'; return null; }
    return { dataUrl, model: clip(j.model, 60), size: j.size === '512' || j.size === '1K' ? j.size : '' };
  }
  /** 1枚の料金（ドル）。知らないモデルは null */
  const priceOf = (model, size) => { const p = PRICES[model]; return p ? (p[size] != null ? p[size] : p['1K'] != null ? p['1K'] : null) : null; };

  const api = { KEY, KINDS, CURES, DAILY, TOOLS, ALIAS, MOTIFS, STYLES, PRICES, PRICE_CHECKED, MAX_BYTES, info, errorText, photoConsent, setPhotoConsent, photoReady: photoOk, photoSheet, aboutCard, ready, shrink, imageB64, hasApp1, scan, vision, sticker, recipeFromDesign, brushInfo, brushChoices, orderRule, describe, cleanScan, cleanSteps, clearWhite, bbox, cutout, priceOf };
  T.aiv = api;
  T.sheets = Object.assign(T.sheets || {}, { 'photo-consent': photoSheet });

  T.actions = T.actions || {};
  const prevConsent = T.actions['ai-consent'], prevClose = T.actions['sheet-close'];
  Object.assign(T.actions, {
    'ai-consent': (el, st, ev) => {
      const p = takePending();
      if (prevConsent) prevConsent(el, st, ev); else { T.ai.setConsent(el.dataset.v === 'yes' ? 'yes' : 'no'); st.sheet = null; T.app.render(); }
      if (el.dataset.v === 'yes') resume(st, p);
    },
    'ai-photo-consent': (el, st) => {
      if (el.dataset.v === 'ask') { pending = null; st.sheet = 'photo-consent'; T.app.render(); return; }
      const p = takePending(), yes = el.dataset.v === 'yes';
      setPhotoConsent(yes ? 'yes' : 'no'); st.sheet = null; T.app.render();
      if (yes) resume(st, p); else T.app.toast('写真は送りません');
    },
    // DOM の無い所（検査）でも、✕ で閉じたら続きを捨てる
    'sheet-close': (el, st, ev) => {
      if (CONSENT_SHEETS.includes(st.sheet)) pending = null;
      if (prevClose) prevClose(el, st, ev); else { st.sheet = null; T.app.render(); }
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
