/* tsumé — ギャラリー。「みんなのデザイン」（F6: 運営が選んだ作品。gallery.json）と「投稿」（F7: 承認制。中継の /v1/gallery）。
   隠し画面 #gallery-admin（管理キーで審査）。写真は送らない。中継が無い・通信できないときは「今は見られません」。
   作品は手の絵（受け取った人の肌の色）で描き、押すと試着（T.share.open） */
(function (global) {
  'use strict';
  const T = global.TSUME;
  T.views = T.views || {};
  T.actions = T.actions || {};
  const hasDOM = typeof document !== 'undefined';
  const PICKS_WEB = './gallery.json', PICKS_APP = 'https://arc-op-2606.github.io/tsume/gallery.json';
  const CONTACT = 'matsumoto@arc-edu.com'; // privacy.html のお問い合わせ先と同じ
  const K = { prefs: 'tsume.gallery.v1', device: 'tsume.device.v1', admin: 'tsume.admin.v1' };
  const REASONS = [
    { id: 'personal', name: '名前・顔・写真など、個人がわかる' },
    { id: 'rights', name: 'キャラクター・ロゴ・人の作品のまね' },
    { id: 'offensive', name: 'いやな言葉・こわい・性的な内容' },
    { id: 'spam', name: '宣伝・ネイルと関係ない' },
    { id: 'other', name: 'そのほか' },
  ];
  const MOD = { approve: '載せました', hide: '隠しました', delete: '消しました' };
  // gallery.json が読めないときの内蔵（gallery.json の最初の4件と同じ。test/share.test.js で同じか確かめる）
  const BUILTIN = /*BUILTIN*/[
    {"id":"p-glass-drop","title":"お呼ばれの硝子","by":"tsumé 編集部","note":"根元にパールとオーロラのストーン。式でも上品な量です。","design":{"v":1,"conceptId":"glass_drop","paletteIndex":1,"sel":{"scene":"wedding_guest","tier":"petit","mood":"classic","topping":"point","length":"medium","shape":"almond","scope":"full","hand":"right","method":"gel","time":"t60","level":"some"},"custom":{"left":[[],[{"k":"pearl","x":0.5,"y":0.82,"s":"S","v":"white"}],[{"k":"stone","x":0.5,"y":0.8,"s":"M","v":"aurora"}],[{"k":"pearl","x":0.33,"y":0.83,"s":"S","v":"white"},{"k":"stone","x":0.5,"y":0.79,"s":"M","v":"aurora"},{"k":"pearl","x":0.67,"y":0.83,"s":"S","v":"white"}],[]],"right":[[],[{"k":"pearl","x":0.5,"y":0.82,"s":"S","v":"white"}],[{"k":"stone","x":0.5,"y":0.8,"s":"M","v":"aurora"}],[{"k":"pearl","x":0.33,"y":0.83,"s":"S","v":"white"},{"k":"stone","x":0.5,"y":0.79,"s":"M","v":"aurora"},{"k":"pearl","x":0.67,"y":0.83,"s":"S","v":"white"}],[]]},"skin":"natural"}},
    {"id":"p-kintsugi","title":"金継ぎと小花","by":"tsumé 編集部","note":"金のひびに、金の小花とパール。お正月や和装に。","design":{"v":1,"conceptId":"kintsugi","paletteIndex":0,"sel":{"scene":"newyear","tier":"petit","mood":"wa","topping":"point","length":"medium","shape":"oval","scope":"full","hand":"right","method":"gel","time":"t60","level":"some"},"custom":{"left":[[],[{"k":"bullion","x":0.33,"y":0.83,"s":"S","v":"gold"},{"k":"bullion","x":0.5,"y":0.79,"s":"M","v":"gold"},{"k":"bullion","x":0.67,"y":0.83,"s":"S","v":"gold"}],[{"k":"charm","x":0.5,"y":0.74,"s":"M","v":"gold","shape":"flower"}],[{"k":"pearl","x":0.5,"y":0.83,"s":"M","v":"cream"}],[]],"right":[[],[{"k":"bullion","x":0.33,"y":0.83,"s":"S","v":"gold"},{"k":"bullion","x":0.5,"y":0.79,"s":"M","v":"gold"},{"k":"bullion","x":0.67,"y":0.83,"s":"S","v":"gold"}],[{"k":"charm","x":0.5,"y":0.74,"s":"M","v":"gold","shape":"flower"}],[{"k":"pearl","x":0.5,"y":0.83,"s":"M","v":"cream"}],[]]},"skin":"natural"}},
    {"id":"p-moon-tortoise","title":"べっ甲に金の月","by":"tsumé 編集部","note":"琥珀色のべっ甲に、シャンパン色のストーンと金のブリオン。","design":{"v":1,"conceptId":"moon_tortoise","paletteIndex":0,"sel":{"scene":"party","tier":"petit","mood":"glam","topping":"lots","length":"long","shape":"almond","scope":"full","hand":"right","method":"gel","time":"t60","level":"some"},"custom":{"left":[[{"k":"stone","x":0.5,"y":0.8,"s":"M","v":"champagne"}],[{"k":"bullion","x":0.18,"y":0.258,"s":"S","v":"gold"},{"k":"bullion","x":0.34,"y":0.229,"s":"S","v":"gold"},{"k":"bullion","x":0.5,"y":0.2,"s":"S","v":"gold"},{"k":"bullion","x":0.66,"y":0.229,"s":"S","v":"gold"},{"k":"bullion","x":0.82,"y":0.258,"s":"S","v":"gold"}],[{"k":"stone","x":0.45,"y":0.7,"s":"L","v":"champagne"},{"k":"stone","x":0.68,"y":0.79,"s":"S","v":"champagne"},{"k":"bullion","x":0.62,"y":0.58,"s":"S","v":"gold"}],[{"k":"stone","x":0.68,"y":0.84,"s":"S","v":"clear"}],[]],"right":[[{"k":"stone","x":0.5,"y":0.8,"s":"M","v":"champagne"}],[{"k":"bullion","x":0.18,"y":0.258,"s":"S","v":"gold"},{"k":"bullion","x":0.34,"y":0.229,"s":"S","v":"gold"},{"k":"bullion","x":0.5,"y":0.2,"s":"S","v":"gold"},{"k":"bullion","x":0.66,"y":0.229,"s":"S","v":"gold"},{"k":"bullion","x":0.82,"y":0.258,"s":"S","v":"gold"}],[{"k":"stone","x":0.45,"y":0.7,"s":"L","v":"champagne"},{"k":"stone","x":0.68,"y":0.79,"s":"S","v":"champagne"},{"k":"bullion","x":0.62,"y":0.58,"s":"S","v":"gold"}],[{"k":"stone","x":0.68,"y":0.84,"s":"S","v":"clear"}],[]]},"skin":"natural"}},
    {"id":"p-ribbon","title":"リボンとハートの約束","by":"tsumé 編集部","note":"淡いピンクに、リボンのシールと金のハート。デートの日に。","design":{"v":1,"conceptId":"ribbon_promise","paletteIndex":0,"sel":{"scene":"date","tier":"petit","mood":"sweet","topping":"point","length":"short","shape":"round","scope":"full","hand":"right","method":"gel","time":"t60","level":"some"},"custom":{"left":[[{"k":"charm","x":0.5,"y":0.76,"s":"M","v":"gold","shape":"heart"}],[],[{"k":"sticker","x":0.5,"y":0.56,"s":"M","v":"ribbon","col":"#F28BA8","shop":"se_kid_ribbon"}],[{"k":"pearl","x":0.33,"y":0.85,"s":"S","v":"pink"},{"k":"pearl","x":0.67,"y":0.85,"s":"S","v":"pink"}],[{"k":"pearl","x":0.5,"y":0.82,"s":"S","v":"white"}]],"right":[[{"k":"charm","x":0.5,"y":0.76,"s":"M","v":"gold","shape":"heart"}],[],[{"k":"sticker","x":0.5,"y":0.56,"s":"M","v":"ribbon","col":"#F28BA8","shop":"se_kid_ribbon"}],[{"k":"pearl","x":0.33,"y":0.85,"s":"S","v":"pink"},{"k":"pearl","x":0.67,"y":0.85,"s":"S","v":"pink"}],[{"k":"pearl","x":0.5,"y":0.82,"s":"S","v":"white"}]]},"skin":"natural"}},
  ];

  const num = v => typeof v === 'number' && isFinite(v);
  const IDRE = /^[\w-]{1,64}$/;
  const S = () => T.share;
  const esc = s => T.ui.esc(s);
  function read(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  /** 題名・名前の掃除（記号・改行を捨て、長さで切る） */
  const cleanText = (s, n) => Array.from(String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F<>"'`\\&]/g, '').replace(/\s+/g, ' ').trim()).slice(0, n).join('');
  // 個人がわかりそうなもの（URL・メール・@・電話番号）
  const PERSONAL = /(https?:|www\.|[@＠]|\d{2,4}[-－ー‐]\d{2,4}[-－ー‐]\d{3,4}|\d{10,11})/i;

  // ---- 端末に覚えること（出さない人・通報した作品・送った投稿・ニックネーム）
  let prefCache = null;
  function prefs() {
    if (prefCache) return prefCache;
    const p = read(K.prefs, {}) || {};
    const strs = (a, re, n) => (Array.isArray(a) ? a.filter(x => typeof x === 'string' && re.test(x)).slice(-n) : []);
    prefCache = {
      blocked: strs(p.blocked, /^[an]:[^\u0000-\u001F<>]{1,130}$/, 200),
      hidden: strs(p.hidden, IDRE, 500),
      posted: Array.isArray(p.posted) ? p.posted.filter(x => x && IDRE.test(String(x.id || '')) && typeof x.title === 'string').slice(-30).map(x => ({ id: String(x.id), title: cleanText(x.title, 20), at: num(x.at) ? x.at : 0 })) : [],
      nick: cleanText(p.nick, 12),
    };
    return prefCache;
  }
  const savePrefs = () => write(K.prefs, prefs());
  const adminKey = () => { const k = read(K.admin, ''); return typeof k === 'string' && /^[\x21-\x7E]{8,200}$/.test(k) ? k : ''; };

  // ---- 状態（画面を開いている間だけ。保存しない）
  const gs = st => st.gallery || (st.gallery = { tab: 'picks', picks: null, picksFrom: null, picksBusy: false, posts: null, next: null, postsState: 'idle', postsBusy: false, link: '' });
  const gp = st => st.glPost || (st.glPost = { title: '', name: prefs().nick, agree: false, busy: false, lastAt: 0 });
  const ga = st => st.glAdmin || (st.glAdmin = { items: null, status: 'pending', state: 'idle', confirm: null, busy: Object.create(null), json: '' });
  const STATUS = [{ id: 'pending', name: '審査待ち' }, { id: 'hidden', name: '隠したもの' }, { id: 'approved', name: '載せたもの' }];
  function rerender(view, sheet) {
    const app = T.app; if (!app || !app.hasDOM) return;
    if (view && app.state.view !== view) return;
    if (sheet && app.state.sheet !== sheet) return;
    app.render();
  }

  // ---- 通信
  const relay = () => (T.CONFIG && T.CONFIG.relayUrl ? String(T.CONFIG.relayUrl).replace(/\/$/, '') : '');
  const G = T.gallery = T.gallery || {};
  function doFetch(url, init) {
    const f = G.fetch || (typeof fetch === 'function' ? fetch : null);
    return f ? f(url, init) : Promise.reject(new Error('no-fetch'));
  }
  // 中継にギャラリーの入口があるか（null = まだ分からない / 'ok' / 'off'）。
  // 入口の無い古い中継（404）・合言葉が合わない（403）・ギャラリー未設定（503）は 'off'。通信できないだけなら決めない
  let avail = null;
  const isOff = e => !!e && (e.status === 404 || e.status === 403 || (e.status === 503 && !!e.body && e.body.error === 'gallery not configured'));
  /** ［みんなに見せる］を出してよいか（通信はしない） */
  const canPost = () => !!relay() && avail !== 'off';
  async function api(path, o) {
    o = o || {};
    if (!relay()) { const e = new Error('no-relay'); e.status = 0; throw e; }
    const headers = {};
    if (o.body) headers['content-type'] = 'application/json';
    if (T.CONFIG.relayToken) headers['x-tsume-token'] = T.CONFIG.relayToken;
    if (o.admin) headers['x-tsume-admin'] = o.admin;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, o.timeout || 15000);
    try {
      const r = await doFetch(relay() + path, { method: o.method || 'GET', headers, body: o.body ? JSON.stringify(o.body) : undefined, signal: ctrl ? ctrl.signal : undefined });
      if (!r || !r.ok) { const e = new Error('http'); e.status = r ? r.status : 0; try { e.body = r ? await r.json() : null; } catch (x) { e.body = null; } throw e; }
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  async function deviceId() {
    let id = read(K.device, null);
    if (typeof id !== 'string' || !/^[0-9a-f]{32}$/.test(id)) { id = randomHex(16); write(K.device, id); }
    return sha256hex('tsume-gallery:' + id);
  }
  function randomHex(n) {
    const a = new Uint8Array(n), c = global.crypto;
    if (c && c.getRandomValues) c.getRandomValues(a); else for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
  }
  async function sha256hex(s) {
    const sub = global.crypto && global.crypto.subtle;
    if (sub && typeof TextEncoder === 'function') {
      try { const buf = await sub.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join(''); } catch (e) { /* 下へ */ }
    }
    // 予備（安全な通信でないと crypto.subtle が無い）: FNV-1a を8回まわして64桁
    let out = '';
    for (let k = 0; k < 8; k++) { let h = (2166136261 ^ (k * 2654435761)) >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } out += (h >>> 0).toString(16).padStart(8, '0'); }
    return out;
  }

  // ---- 受け取った作品の掃除
  function cleanPick(x) {
    if (!x || typeof x !== 'object' || !IDRE.test(String(x.id || ''))) return null;
    const design = S().clean(x.design); if (!design) return null;
    return { id: String(x.id), title: cleanText(x.title, 20) || 'みんなのデザイン', by: cleanText(x.by, 20), note: cleanText(x.note, 80), design };
  }
  function cleanPost(x, keepBroken) {
    if (!x || typeof x !== 'object' || !IDRE.test(String(x.id == null ? '' : x.id))) return null;
    const design = S().clean(x.design); if (!design && !keepBroken) return null;
    const created = typeof x.created === 'number' ? x.created : Date.parse(x.created);
    return {
      id: String(x.id), title: cleanText(x.title, 20) || '（題名なし）', name: cleanText(x.name, 12) || 'ななし', design,
      created: isFinite(created) ? created : null,
      author: typeof x.author === 'string' && /^[\w-]{6,128}$/.test(x.author) ? x.author : null,
      reports: num(x.reports) ? Math.max(0, Math.round(x.reports)) : null,
      device: typeof x.device === 'string' && /^[0-9a-f]{4,16}$/.test(x.device) ? x.device : null,
      reasons: Array.isArray(x.reasons) ? x.reasons.filter(r => REASONS.some(y => y.id === r)) : [],
    };
  }
  // 「この人」: 中継が author（端末の値のハッシュ）を返せばそれで、無ければニックネームで見分ける
  const authorKey = it => (it.author ? 'a:' + it.author : 'n:' + it.name);
  const visible = list => { const p = prefs(); return (list || []).filter(it => !p.hidden.includes(it.id) && !p.blocked.includes(authorKey(it))); };
  const builtin = () => BUILTIN.map(cleanPick).filter(Boolean);
  const dateOf = t => { if (!num(t)) return ''; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}`; };

  // ---- 読み込み
  async function getPicks(url) {
    // 通信が止まったままでも「読み込んでいます…」で止まらないように、10秒で内蔵に切り替える
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, 10000);
    try {
      const r = await doFetch(url, { cache: 'no-cache', signal: ctrl ? ctrl.signal : undefined });
      if (!r || !r.ok) throw new Error('http');
      const j = await r.json(), arr = Array.isArray(j) ? j : j && Array.isArray(j.items) ? j.items : [];
      const list = arr.slice(0, 60).map(cleanPick).filter(Boolean);
      if (!list.length) throw new Error('empty');
      return list;
    } finally { clearTimeout(timer); }
  }
  /** 棚を読む。アプリは公開中の gallery.json → 同梱 → 内蔵、Web は同じ場所 → 内蔵 */
  async function loadPicks(st) {
    const g = gs(st); if (g.picksBusy) return; g.picksBusy = true;
    const urls = T.native && T.native.isNative ? [PICKS_APP, PICKS_WEB] : [PICKS_WEB];
    let list = null;
    for (const u of urls) { try { list = await getPicks(u); break; } catch (e) { list = null; } }
    g.picksBusy = false;
    if (list) { g.picks = list; g.picksFrom = 'net'; } else { g.picks = builtin(); g.picksFrom = 'builtin'; }
    rerender('gallery');
  }
  /** 投稿の一覧を読む。quiet = 画面を描いている最中に呼ぶとき（その場で描き直さない） */
  async function loadPosts(st, more, quiet) {
    const g = gs(st);
    if (!relay() || avail === 'off') { g.postsState = 'off'; return; }
    if (g.postsBusy) return;
    g.postsBusy = true;
    if (!more) g.postsState = 'loading';
    if (!quiet) rerender('gallery');
    try {
      const j = await api('/v1/gallery' + (more && g.next ? '?cursor=' + encodeURIComponent(g.next) : ''));
      const got = (j && Array.isArray(j.items) ? j.items : []).slice(0, 100).map(x => cleanPost(x)).filter(Boolean);
      const before = more ? g.posts || [] : [];
      g.posts = before.concat(got.filter(x => !before.some(y => y.id === x.id)));
      const nx = j && j.next;
      g.next = (typeof nx === 'string' && nx && nx.length <= 200) || num(nx) ? String(nx) : null;
      g.postsState = 'ok'; avail = 'ok';
    } catch (e) {
      if (isOff(e)) { avail = 'off'; g.postsState = 'off'; }
      else if (more) { if (T.app) T.app.toast('続きを読み込めませんでした'); } else g.postsState = 'error';
    }
    g.postsBusy = false;
    rerender('gallery');
  }
  /** 投稿シートを開いたとき、中継にギャラリーがあるかだけ確かめる（分かっていれば通信しない） */
  async function probe() {
    if (!relay() || avail) return avail;
    try { await api('/v1/gallery', { timeout: 8000 }); avail = 'ok'; } catch (e) { if (isOff(e)) avail = 'off'; }
    return avail;
  }

  // ---- 画面
  const artCache = new Map();
  function art(kind, it, st) {
    const k = `${kind}:${it.id}:${st.skin}`;
    if (!artCache.has(k)) {
      if (artCache.size > 200) artCache.clear();
      let s = ''; try { s = it.design ? S().handArt(it.design, { skin: st.skin }) : ''; } catch (e) { s = ''; }
      artCache.set(k, s);
    }
    return artCache.get(k);
  }
  function pickCard(st, it) {
    return `<article class="gl-card"><button class="gl-try" data-act="gl-try" data-src="picks" data-id="${esc(it.id)}" aria-label="${esc(it.title)}を試着する"><span class="gl-art">${art('p', it, st)}</span><b class="gl-title">${esc(it.title)}</b>${it.note ? `<span class="gl-note">${esc(it.note)}</span>` : ''}${it.by ? `<span class="gl-by">${esc(it.by)}</span>` : ''}</button></article>`;
  }
  function postCard(st, it) {
    return `<article class="gl-card"><button class="gl-try" data-act="gl-try" data-src="posts" data-id="${esc(it.id)}" aria-label="${esc(it.title)}を試着する"><span class="gl-art">${art('u', it, st)}</span><b class="gl-title">${esc(it.title)}</b><span class="gl-by">${esc(it.name)}${it.created ? `・${dateOf(it.created)}` : ''}</span></button>
      <div class="gl-acts"><button class="gl-mini" data-act="gl-report-open" data-id="${esc(it.id)}">通報</button><button class="gl-mini" data-act="gl-block" data-id="${esc(it.id)}">この人の作品を出さない</button></div></article>`;
  }
  function linkBox(st) {
    const g = gs(st);
    return `<div class="card flat gl-open"><h3>もらったリンクを開く</h3><p class="small muted">共有で届いたリンクを貼ると、そのデザインをあなたの手で試着できます。</p>
      <div class="gl-form"><input id="gl-link" class="kt-input" type="url" inputmode="url" placeholder="https://…#d=…" value="${esc(g.link)}" autocomplete="off" aria-label="もらったリンク"><button class="btn" data-act="gl-link-open">開く</button></div></div>`;
  }
  function picksBody(st) {
    const g = gs(st);
    if (!g.picks && !g.picksBusy) { if (hasDOM && T.app && T.app.hasDOM) loadPicks(st); else { g.picks = builtin(); g.picksFrom = 'builtin'; } }
    const list = g.picks || [];
    return `<p class="gl-lead">tsumé の運営が選んだデザインです。押すと、あなたの手で試着できます。</p>
      ${!g.picks ? '<p class="gl-wait">読み込んでいます…</p>' : `<div class="gl-grid">${list.map(it => pickCard(st, it)).join('')}</div>`}
      ${g.picksFrom === 'builtin' ? '<p class="small muted">いまは一覧を読み込めないので、アプリに入っている作品を出しています。</p>' : ''}
      ${linkBox(st)}`;
  }
  function postsBody(st) {
    const g = gs(st), p = prefs();
    if (!relay() || avail === 'off' || g.postsState === 'off') return `<div class="card flat gl-off"><p><b>今は見られません</b></p><p class="small muted">投稿を見る仕組みが、まだ使えません。「みんなのデザイン」は見られます。</p></div>`;
    if (g.postsState === 'idle' && hasDOM && T.app && T.app.hasDOM) loadPosts(st, false, true);
    if (g.postsState === 'idle' || g.postsState === 'loading') return '<p class="gl-wait">読み込んでいます…</p>';
    if (g.postsState === 'error') return `<div class="card flat gl-off"><p><b>今は見られません</b></p><p class="small muted">通信できる所で、もう一度試してください。</p><button class="btn ghost" data-act="gl-reload">もう一度</button></div>`;
    const list = visible(g.posts);
    return `<p class="gl-lead">みんなの投稿です。運営が見てから載せています。気になる作品は［通報］してください。</p>
      ${list.length ? `<div class="gl-grid">${list.map(it => postCard(st, it)).join('')}</div>` : '<div class="empty card flat"><p>まだ投稿はありません。</p></div>'}
      ${g.next ? `<button class="btn ghost block" data-act="gl-more" ${g.postsBusy ? 'disabled' : ''}>${g.postsBusy ? '読み込んでいます…' : 'もっと見る'}</button>` : ''}
      ${p.blocked.length || p.hidden.length ? `<p class="small muted gl-blocked">この端末で出さない人：${p.blocked.length}人・作品：${p.hidden.length}件<button class="link" data-act="gl-unblock">元に戻す</button></p>` : ''}
      <div class="card flat gl-how"><h3>自分のデザインを投稿する</h3><p class="small muted">作り方の画面の［みんなに見せる］から送れます。運営が見てから載せます。</p>${p.posted.length ? `<p class="small muted">送った投稿：${p.posted.length}件（載るまで少し待ってください）</p>` : ''}<p class="small muted">困ったとき・消してほしいとき：${esc(CONTACT)}</p></div>`;
  }
  T.views.gallery = st => {
    const g = gs(st), U = T.ui;
    const tabs = U.seg([{ id: 'picks', name: 'みんなのデザイン' }, { id: 'posts', name: '投稿' }], 'gl-tab', g.tab, 'aria-label="ギャラリーの切り替え"');
    return `${U.bar({ back: true, title: 'ギャラリー' })}<div class="tabs">${tabs}</div><section class="gl">${g.tab === 'posts' ? postsBody(st) : picksBody(st)}</section>`;
  };

  // ---- シート: みんなに見せる（投稿）
  function postSheet(st, op) {
    const U = T.ui, ICON = U.ICON, p = gp(st), o = S().pack(st), d = o && S().design(o);
    const head = `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet gl-sheet${op}" role="dialog" aria-modal="true" aria-label="みんなに見せる">
        <header class="sheet-head"><b>みんなに見せる</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>`;
    if (!canPost() || !d) return `${head}<div class="sheet-body"><p>${!d ? 'デザインを選んでください。' : '今は投稿できません。投稿の仕組みが、まだ使えません。'}</p></div><footer class="sheet-foot"><button class="btn block" data-act="sheet-close">閉じる</button></footer></section>`;
    const side = d.foot ? 'right' : U.showcaseSide(st.sel);
    return `${head}
        <div class="sheet-body">
          <div class="gl-post-art">${U.chart(d, side)}</div>
          <p class="small"><b>${esc(d.concept.name)}</b>（${esc(d.palette.name)}）を投稿します。</p>
          <label class="gl-field"><span>題名（20字まで）</span><input id="gl-title" class="kt-input" type="text" maxlength="20" value="${esc(p.title)}" placeholder="例：秋のべっ甲" autocomplete="off"></label>
          <label class="gl-field"><span>ニックネーム（12字まで）</span><input id="gl-name" class="kt-input" type="text" maxlength="12" value="${esc(p.name)}" placeholder="例：つめこ" autocomplete="off"></label>
          <ul class="notes gl-rules">
            <li>名前（本名）や、顔・手の写真は入れないでください。写真は送れません。</li>
            <li>運営が見てから載せます。すぐには出ません。</li>
            <li>投稿すると、デザインと題名とニックネームが tsumé のサーバーに保存されます。回数を数えるため、この端末用の番号を変換した値も送ります。肌の色は送りません。</li>
            <li>キャラクターやロゴ、人の作品をまねた柄は投稿しないでください。</li>
            <li>18歳未満の方は、おうちの人と一緒に確かめてから投稿してください。</li>
            <li>消してほしいときは ${esc(CONTACT)} へ。</li>
          </ul>
          <label class="gl-agree"><input type="checkbox" data-act="gl-agree" ${p.agree ? 'checked' : ''}><span>上のことを守って投稿します</span></label>
        </div>
        <footer class="sheet-foot"><button class="btn rose block" id="gl-send" data-act="gl-post-send" ${p.agree && !p.busy ? '' : 'disabled'}>${p.busy ? '送っています…' : '投稿する'}</button></footer>
      </section>`;
  }
  // ---- シート: 通報
  function reportSheet(st, op) {
    const ICON = T.ui.ICON, r = st.glReport || {};
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet gl-sheet${op}" role="dialog" aria-modal="true" aria-label="通報する">
        <header class="sheet-head"><b>通報する</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <p class="small muted">理由を選んでください。運営が確かめます。通報した作品は、この端末では出しません。</p>
          <div class="gl-reasons" role="group" aria-label="通報の理由">${REASONS.map(x => `<button class="gl-reason" data-act="gl-reason" data-v="${x.id}" aria-pressed="${r.reason === x.id}">${esc(x.name)}</button>`).join('')}</div>
        </div>
        <footer class="sheet-foot"><button class="btn rose block" data-act="gl-report-send" ${r.reason && !r.busy ? '' : 'disabled'}>${r.busy ? '送っています…' : '通報する'}</button></footer>
      </section>`;
  }
  T.sheets = Object.assign(T.sheets || {}, { 'gl-post': postSheet, 'gl-report': reportSheet });

  // ---- 投稿・通報・管理（画面から呼ぶ。検査からも呼べる）
  const fail = msg => ({ ok: false, msg });
  async function post(st) {
    const p = gp(st), title = cleanText(p.title, 20), name = cleanText(p.name, 12) || 'ななし';
    if (!canPost()) return fail('今は投稿できません');
    if (!p.agree) return fail('注意を読んで、チェックを入れてください');
    if (!title) return fail('題名を入れてください');
    if (PERSONAL.test(title) || PERSONAL.test(name)) return fail('URL・メールアドレス・電話番号は入れられません');
    if (p.lastAt && Date.now() - p.lastAt < 30000) return fail('少し待ってから送ってください');
    const o = S().pack(st); if (!o) return fail('デザインを選んでください');
    const design = Object.assign({}, o); delete design.skin; // 肌の色は送らない
    if (JSON.stringify(design).length > 8000) return fail('パーツが多すぎて送れません。少し減らしてください');
    p.busy = true; rerender(null, 'gl-post');
    try {
      const device = await deviceId();
      const j = await api('/v1/gallery', { method: 'POST', body: { design, title, name, device } });
      const id = j && IDRE.test(String(j.id == null ? '' : j.id)) ? String(j.id) : null;
      avail = 'ok';
      const pr = prefs();
      if (id) { pr.posted.push({ id, title, at: Date.now() }); pr.posted = pr.posted.slice(-30); }
      pr.nick = name === 'ななし' ? '' : name; savePrefs();
      Object.assign(p, { busy: false, lastAt: Date.now(), title: '', agree: false });
      return { ok: true, id, msg: '受け付けました。運営が見てから載せます' };
    } catch (e) {
      p.busy = false;
      const why = e.body && e.body.error;
      if (isOff(e)) { avail = 'off'; return fail('今は投稿を受け付けていません（準備中です）'); }
      if (e.status) avail = avail || 'ok'; // 断られた（400・429 など）= 入口はある
      if (e.status === 400 && why === 'bad text') return fail(e.body.field === 'design' ? 'デザインの中に使えない言葉があります' : '題名かニックネームに、使えない言葉があります');
      if (e.status === 429) return fail('送る回数が多すぎます。時間をおいてください（1日5件まで）');
      if (e.status === 413) return fail('パーツが多すぎて送れません。少し減らしてください');
      if (e.status === 503) return fail('今は投稿を受け付けていません。時間をおいてください');
      return fail('送れませんでした。通信を確かめて、もう一度');
    }
  }
  async function report(st) {
    const r = st.glReport || {}, reason = REASONS.some(x => x.id === r.reason) ? r.reason : null;
    if (!r.id || !reason) return fail('理由を選んでください');
    const pr = prefs();
    if (!pr.hidden.includes(r.id)) { pr.hidden.push(r.id); pr.hidden = pr.hidden.slice(-500); savePrefs(); }
    r.busy = true; rerender(null, 'gl-report');
    try { const device = await deviceId(); await api('/v1/gallery/report', { method: 'POST', body: { id: r.id, reason, device } }); r.busy = false; return { ok: true, msg: '通報しました。運営が確かめます' }; }
    catch (e) { r.busy = false; return fail('通報は送れませんでした。この端末では出さないようにしました'); }
  }
  async function adminLoad(st) {
    const a = ga(st), key = adminKey();
    if (!key) return fail('管理キーを入れてください');
    if (!relay()) return fail('中継が設定されていません');
    a.state = 'loading'; rerender('gallery-admin');
    try {
      const j = await api('/v1/gallery/pending?status=' + (STATUS.some(x => x.id === a.status) ? a.status : 'pending'), { admin: key });
      const arr = Array.isArray(j) ? j : j && Array.isArray(j.items) ? j.items : [];
      a.items = arr.slice(0, 200).map(x => cleanPost(x, true)).filter(Boolean); a.state = 'ok';
      return { ok: true, msg: `${(STATUS.find(x => x.id === a.status) || STATUS[0]).name} ${a.items.length}件` };
    } catch (e) { a.state = 'error'; return fail(e.status === 401 || e.status === 403 ? '管理キーが違います' : '読み込めませんでした'); }
  }
  async function moderate(st, id, action) {
    const a = ga(st), key = adminKey();
    if (!MOD[action] || !IDRE.test(String(id || ''))) return fail('できませんでした');
    if (!key) return fail('管理キーを入れてください');
    a.busy[id] = true;
    try { await api('/v1/gallery/moderate', { method: 'POST', body: { id, action }, admin: key }); a.items = (a.items || []).filter(x => x.id !== id); delete a.busy[id]; return { ok: true, msg: MOD[action] }; }
    catch (e) { delete a.busy[id]; return fail(e.status === 401 || e.status === 403 ? '管理キーが違います' : 'できませんでした'); }
  }
  /** 運営用: 共有リンクから gallery.json の1件を作る */
  function pickJson(linkText, title, note) {
    const d = S().decode(String(linkText || '')); if (!d) return null;
    const t = cleanText(title, 20); if (!t) return null;
    const id = 'p-' + d.conceptId.replace(/_/g, '-') + '-' + Date.now().toString(36);
    return JSON.stringify({ id, title: t, by: 'tsumé 編集部', note: cleanText(note, 80), design: d }, null, 1);
  }

  // ---- 隠し画面: 管理
  T.views['gallery-admin'] = st => {
    const U = T.ui, a = ga(st), key = adminKey();
    const items = a.items || [];
    const row = it => `<article class="gl-adm-item">
        <span class="gl-art">${it.design ? art('a', it, st) : '<span class="small muted">デザインを読めません</span>'}</span>
        <div class="gl-adm-meta"><b>${esc(it.title)}</b><span class="small muted">${esc(it.name)}${it.created ? '・' + dateOf(it.created) : ''}${it.reports ? `・通報 ${it.reports}件` : ''}</span>${it.reasons && it.reasons.length ? `<span class="small muted">理由: ${esc(it.reasons.map(r => (REASONS.find(y => y.id === r) || {}).name).join('／'))}</span>` : ''}<span class="small muted">番号 ${esc(it.id)}${it.device ? `・端末 ${esc(it.device)}` : ''}</span></div>
        <div class="gl-adm-acts">${['approve', 'hide', 'delete'].map(x => `<button class="btn ${x === 'approve' ? 'rose' : 'ghost'} sm" data-act="gl-mod" data-id="${esc(it.id)}" data-a="${x}" ${a.busy[it.id] ? 'disabled' : ''}>${x === 'approve' ? '載せる' : x === 'hide' ? '隠す' : a.confirm === it.id ? 'もう一度で消す' : '消す'}</button>`).join('')}</div>
      </article>`;
    return `${U.bar({ back: true, title: 'ギャラリーの管理' })}
      <section class="gl gl-admin">
        <div class="card flat"><h3>管理キー</h3><p class="small muted">${key ? 'この端末に保存してあります。' : 'まだ入っていません。'}キーは中継の管理用の値です。人に見せないでください。</p>
          <div class="gl-form"><input id="gl-admin-key" class="kt-input" type="password" autocomplete="off" placeholder="管理キー" aria-label="管理キー"><button class="btn" data-act="gl-admin-save">保存</button></div>
          ${key ? '<button class="link" data-act="gl-admin-clear">この端末からキーを消す</button>' : ''}</div>
        ${U.seg(STATUS, 'gl-admin-status', a.status, 'aria-label="どの作品を見るか"')}
        <button class="btn rose block" data-act="gl-admin-load" ${key && relay() ? '' : 'disabled'}>${esc((STATUS.find(x => x.id === a.status) || STATUS[0]).name)}を読み込む</button>
        ${a.state === 'loading' ? '<p class="gl-wait">読み込んでいます…</p>' : a.state === 'error' ? '<p class="cap-note">読み込めませんでした。</p>' : a.items ? (items.length ? items.map(row).join('') : '<p class="small muted">ありません。</p>') : ''}
        <div class="card flat"><h3>「みんなのデザイン」に足す</h3><p class="small muted">作品の共有リンクから、gallery.json の1件を作ります。できた文を gallery.json の items に足して公開します。</p>
          <input id="gl-adm-link" class="kt-input" type="url" placeholder="共有リンク" aria-label="共有リンク" autocomplete="off">
          <input id="gl-adm-title" class="kt-input" type="text" maxlength="20" placeholder="題名（20字まで）" aria-label="題名" autocomplete="off">
          <input id="gl-adm-note" class="kt-input" type="text" maxlength="80" placeholder="ひとこと（80字まで）" aria-label="ひとこと" autocomplete="off">
          <button class="btn ghost" data-act="gl-admin-json">1件を作る</button>
          ${a.json ? `<textarea class="gl-json" readonly aria-label="gallery.json に足す文">${esc(a.json)}</textarea><button class="btn ghost sm" data-act="gl-admin-copy">コピー</button>` : ''}</div>
      </section>`;
  };

  // ---- 動き
  const val = id => { const el = hasDOM && document.getElementById(id); return el ? el.value : ''; };
  const say = r => { if (r && r.msg && T.app) T.app.toast(r.msg); };
  function findIn(st, src, id) { const g = gs(st); return ((src === 'posts' ? g.posts : g.picks) || []).find(x => x.id === id) || null; }
  function openLink(st, text) {
    const d = S().decode(String(text || ''));
    if (!d) { T.app.toast('このリンクは開けませんでした（途中で切れているかもしれません）'); return false; }
    gs(st).link = '';
    return S().open(d, st);
  }
  Object.assign(T.actions, {
    'gl-open': (el, st) => { if (el && el.dataset.tab) gs(st).tab = el.dataset.tab === 'posts' ? 'posts' : 'picks'; T.app.go('gallery'); },
    'gl-tab': (el, st) => { const g = gs(st); g.tab = el.dataset.v === 'posts' ? 'posts' : 'picks'; if (g.tab === 'posts' && g.postsState === 'error') g.postsState = 'idle'; T.app.render(); },
    'gl-try': (el, st) => { const it = findIn(st, el.dataset.src, el.dataset.id); if (it && it.design) S().open(it.design, st, { toast: `「${it.title}」を開きました。あなたの肌の色で見ています` }); },
    'gl-reload': (el, st) => { gs(st).postsState = 'idle'; loadPosts(st); },
    'gl-more': (el, st) => { loadPosts(st, true); },
    'gl-link-open': (el, st) => openLink(st, val('gl-link') || gs(st).link),
    'gl-block': (el, st) => {
      const it = findIn(st, 'posts', el.dataset.id); if (!it) return;
      const p = prefs();
      // 名前の無い投稿（ななし）は人を見分けられない。ほかの「ななし」さんまで消さないように、この作品だけ出さない
      if (!it.author && it.name === 'ななし') {
        if (!p.hidden.includes(it.id)) { p.hidden.push(it.id); p.hidden = p.hidden.slice(-500); savePrefs(); }
        T.app.toast('ニックネームが無いので、この作品だけ出さないようにしました'); T.app.render(); return;
      }
      const k = authorKey(it);
      if (!p.blocked.includes(k)) { p.blocked.push(k); p.blocked = p.blocked.slice(-200); savePrefs(); }
      T.app.toast('この人の作品は、この端末では出しません'); T.app.render();
    },
    'gl-unblock': (el, st) => { const p = prefs(); p.blocked = []; p.hidden = []; savePrefs(); T.app.toast('出さないようにした人と作品を、元に戻しました'); T.app.render(); },
    'gl-report-open': (el, st) => { st.glReport = { id: el.dataset.id, reason: null, busy: false }; st.sheet = 'gl-report'; T.app.render(); },
    'gl-reason': (el, st) => { if (!st.glReport) return; st.glReport.reason = el.dataset.v; T.app.render(); },
    'gl-report-send': async (el, st) => { const r = await report(st); if (st.glReport) st.sheet = null; say(r); T.app.render(); },
    'gl-post-open': (el, st) => {
      if (!st.current) { T.app.toast('デザインを選んでください'); return; }
      const p = gp(st); if (!p.name) p.name = prefs().nick;
      st.sheet = 'gl-post'; T.app.render();
      // 入口の無い中継なら、書き始める前に「今は投稿できません」に変える
      if (avail === null) probe().then(a => { if (a === 'off') rerender(null, 'gl-post'); });
    },
    'gl-agree': (el, st) => { const p = gp(st); p.agree = !!(el && el.checked); const b = hasDOM && document.getElementById('gl-send'); if (b) b.disabled = !p.agree || p.busy; },
    'gl-post-send': async (el, st) => {
      const p = gp(st); if (p.busy) return;
      if (hasDOM) { const a = document.getElementById('gl-title'), b = document.getElementById('gl-name'); if (a) p.title = a.value; if (b) p.name = b.value; }
      const r = await post(st);
      if (r.ok) st.sheet = null;
      say(r); T.app.render();
    },
    'gl-admin-save': (el, st) => {
      const k = val('gl-admin-key').trim();
      if (!/^[\x21-\x7E]{8,200}$/.test(k)) { T.app.toast('キーは8文字以上の英数字・記号です'); return; }
      write(K.admin, k); T.app.toast('管理キーを保存しました'); T.app.render();
    },
    'gl-admin-clear': (el, st) => { try { localStorage.removeItem(K.admin); } catch (e) { /* 保存できない環境 */ } ga(st).items = null; T.app.toast('管理キーを消しました'); T.app.render(); },
    'gl-admin-load': async (el, st) => { const r = await adminLoad(st); say(r); T.app.render(); },
    'gl-admin-status': (el, st) => { const a = ga(st); a.status = STATUS.some(x => x.id === el.dataset.v) ? el.dataset.v : 'pending'; a.items = null; a.state = 'idle'; T.app.render(); },
    'gl-mod': async (el, st) => {
      const a = ga(st), id = el.dataset.id, action = el.dataset.a;
      if (action === 'delete' && a.confirm !== id) { a.confirm = id; T.app.toast('消すときは、もう一度押してください'); T.app.render(); return; }
      a.confirm = null; T.app.render();
      const r = await moderate(st, id, action); say(r); T.app.render();
    },
    'gl-admin-json': (el, st) => { const j = pickJson(val('gl-adm-link'), val('gl-adm-title'), val('gl-adm-note')); if (!j) { T.app.toast('リンクか題名を確かめてください'); return; } ga(st).json = j; T.app.render(); },
    'gl-admin-copy': (el, st) => { const j = ga(st).json; if (j) S().copyText(j).then(ok => T.app.toast(ok ? 'コピーしました' : 'コピーできませんでした')); },
  });
  if (hasDOM) {
    document.addEventListener('input', e => {
      const t = e.target, st = T.app && T.app.state; if (!t || !st) return;
      if (t.id === 'gl-title') gp(st).title = t.value;
      else if (t.id === 'gl-name') gp(st).name = t.value;
      else if (t.id === 'gl-link') gs(st).link = t.value;
    });
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'gl-link' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); openLink(T.app.state, e.target.value); } });
  }
  Object.assign(G, { loadPicks, loadPosts, probe, canPost, post, report, adminLoad, moderate, pickJson, cleanPick, cleanPost, cleanText, prefs, deviceId, sha256hex, BUILTIN, REASONS, PERSONAL, K, avail: () => avail, _reset: () => { prefCache = null; artCache.clear(); avail = null; } });
})(typeof window !== 'undefined' ? window : globalThis);
