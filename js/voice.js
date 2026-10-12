/* tsumé — 読み上げと、声の合図（使える端末だけ）。ソムリエ・作るモードの音声案内・色を混ぜる・描き方レシピ・描く・写真から作り方で共通。
   読み上げの声は2つ。呼ぶ側はどちらでも speak(lines, { onLine, onEnd, rate, pitch, voice }) の同じ形:
   - 自然な声（Google Gemini。紹介ビデオと同じ声）: 1文ずつ中継（relay/ の POST /v1/speech）で声にして、1つの Audio で順に鳴らす。次の2文は先に取りに行く。
     使うのは、中継があり・ネットにつながり・利用者が同意したときだけ（AI の同意 T.ai.consent()==='yes' か、この声の同意 'tsume.speech.v1'）。
     ※ 'tsume.voice.v1' は app.js が音声案内のオン・オフ（true/false）に使っているので、声の選択には使わない（保存のたびに消される）。
     どちらも無いときは、初めて読み上げるときに確認のシートを出し、選んだらそのまま読む（もう一度押させない）。
     取った声は端末に保存して（Cache Storage。使えなければ IndexedDB。最大300文・古いものから消す）、次からは通信しない。
     最初の文が8秒で届かない・中継のエラー・オフラインのときは、その読み上げを端末の声に切り替えて続ける。
   - 端末の声: speechSynthesis（外に送らない） */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const hasDOM = typeof window !== 'undefined';
  const synth = () => (hasDOM && window.speechSynthesis) || null;
  let jaVoice = null, gen = 0; /* gen: 読み上げの世代。stop と新しい speak で進み、古い読み上げの続きを捨てる */
  function pickVoice() {
    const s = synth(); if (!s) return null;
    const vs = s.getVoices() || [];
    jaVoice = vs.find(v => /^ja(-|_|$)/i.test(v.lang) && /Kyoko|O-ren|Google|Siri/i.test(v.name)) || vs.find(v => /^ja/i.test(v.lang)) || null;
    return jaVoice;
  }
  if (synth()) { pickVoice(); try { synth().addEventListener('voiceschanged', pickVoice); } catch (e) { /* 古い端末 */ } }
  const deviceOK = () => !!synth() && typeof SpeechSynthesisUtterance !== 'undefined';
  // 読み上げている間は音声認識を止める（自分の声を合図として拾わない）。読み終えて少し待ってから聞き直す
  let held = false, holdT = null;
  function hold(on) {
    clearTimeout(holdT);
    if (on) { held = true; if (rec) { try { rec.abort(); } catch (e) {} } return; }
    holdT = setTimeout(() => { held = false; if (want && !rec) start(); }, 700);
  }
  const toast = m => { if (T.app && T.app.toast) T.app.toast(m); };

  // ---- 文を、声で聞きやすい形に整える（→ は「、そのあと」、・ は読点、（ ）の補足は読まない）
  const EMOJI = (() => { try { return new RegExp('[\\p{Extended_Pictographic}\\uFE0F\\u200D]', 'gu'); } catch (e) { return null; } })();
  function tidy(s) {
    let t = String(s == null ? '' : s).replace(/[<>＜＞]/g, ' ');
    for (let i = 0; i < 2; i++) t = t.replace(/[（(][^（）()]*[）)]/g, ''); /* 入れ子は2段まで */
    // 1つの文に → が1つなら「、そのあと」。2つ以上（中央 → 左 → 右）は並びなので読点だけ
    t = t.replace(/[^。！？!?]+[。！？!?]*/g, seg => { const n = (seg.match(/[→⇒➡]/g) || []).length; return seg.replace(/\s*[→⇒➡]\s*/g, n === 1 ? '、そのあと' : '、'); });
    t = t.replace(/\s*[/／]\s*/g, (m, at, all) => (/\d/.test(all[at - 1] || '') && /\d/.test(all[at + m.length] || '') ? m : '、'));
    t = t.replace(/([0-9０-９一-龠々ぁ-んァ-ヶー])\s*[〜～]\s*(?=[0-9０-９一-龠々ぁ-んァ-ヶ])/g, '$1から');
    t = t.replace(/\s*[・･]\s*/g, '、').replace(/\s*[＋+]\s*/g, 'と');
    t = t.replace(/[※★☆♪♫♡♥◎○●◇◆□■▶▷►◀◁＊*＃#|｜【】［］[\]]/g, '');
    if (EMOJI) t = t.replace(EMOJI, '');
    return t.replace(/\s+/g, ' ').replace(/\s*([、。！？!?])\s*/g, '$1').replace(/、+/g, '、').replace(/、([。！？!?])/g, '$1').replace(/([。！？!?])、/g, '$1').replace(/^[、。\s]+/, '').trim();
  }
  const MAX_CHARS = 280; /* 中継は300字まで。長い文は文の終わりで分ける */
  function chunks(t) {
    const len = x => Array.from(x).length, out = [];
    let cur = '';
    (t.match(/[^。！？!?]+[。！？!?]*|[。！？!?]+/g) || [t]).forEach(s => {
      if (len(cur + s) <= MAX_CHARS) { cur += s; return; }
      if (cur) out.push(cur);
      while (len(s) > MAX_CHARS) { const a = Array.from(s); out.push(a.slice(0, MAX_CHARS).join('')); s = a.slice(MAX_CHARS).join(''); }
      cur = s;
    });
    if (cur) out.push(cur);
    return out;
  }
  /** 読む単位。i は呼ぶ側の文の番号（onLine に渡す）、head はその文の最初のかけら */
  function prepare(lines, voice) {
    const out = [];
    [].concat(lines).filter(Boolean).forEach((l, i) => chunks(tidy(l)).forEach((text, n) => out.push({ text, i, head: n === 0, voice })));
    return out;
  }

  // ---- どちらの声で読むか
  const VKEY = 'tsume.speech.v1';
  const relay = () => (T.CONFIG && T.CONFIG.relayUrl ? String(T.CONFIG.relayUrl).replace(/\/$/, '') : '');
  const online = () => typeof navigator === 'undefined' || !navigator || navigator.onLine !== false;
  function choice() { try { const v = localStorage.getItem(VKEY); return v === 'natural' || v === 'device' ? v : null; } catch (e) { return null; } }
  function setMode(v) { skipAsk = false; try { if (v === 'natural' || v === 'device') localStorage.setItem(VKEY, v); else localStorage.removeItem(VKEY); } catch (e) {} }
  /** 'natural' | 'device' | null（まだ決めていない）。自分で選んでいなければ、AI に同意した人は自然な声 */
  const mode = () => choice() || (T.ai && typeof T.ai.consent === 'function' && T.ai.consent() === 'yes' ? 'natural' : null);
  const naturalPossible = () => hasDOM && typeof Audio !== 'undefined' && typeof fetch === 'function' && !!relay();
  let skipAsk = false; /* 確認のシートを選ばずに閉じたら、このページを開いている間は聞き直さず端末の声で読む（タイマーや次の手順のたびに出さない） */
  /** 今読むとどうなるか: 'natural' | 'device' | 'ask'（確認のシートを出す） */
  function route() {
    if (!naturalPossible() || !online()) return 'device';
    const m = mode();
    return m === 'natural' ? 'natural' : m === 'device' || skipAsk ? 'device' : 'ask';
  }
  const available = () => deviceOK() || (naturalPossible() && mode() !== 'device');

  // ---- 取った声の保存（端末の中）。キーは声＋文
  const STORE = 'tsume-voice-v1', KEEP = 300, MEM = 40;
  const keyOf = (voice, text) => 'https://tsume-voice.invalid/v1/' + voice + '?t=' + encodeURIComponent(text);
  const CS = {
    async get(k) { const r = await (await caches.open(STORE)).match(k); return r ? r.blob() : null; },
    async put(k, b) {
      const c = await caches.open(STORE);
      await c.put(k, new Response(b, { headers: { 'content-type': b.type || 'audio/wav' } }));
      const ks = await c.keys(); /* 入れた順。多すぎたら古いものから消す */
      for (const x of ks.slice(0, Math.max(0, ks.length - KEEP))) await c.delete(x);
    },
    async del(k) { await (await caches.open(STORE)).delete(k); },
  };
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    const q = indexedDB.open('tsume-voice', 1);
    q.onupgradeneeded = () => { const s = q.result.createObjectStore('clips', { keyPath: 'k' }); s.createIndex('ts', 'ts'); };
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  }));
  const done = t => new Promise((res, rej) => { t.oncomplete = res; t.onerror = t.onabort = () => rej(t.error); });
  const IDB = {
    async get(k) { const db = await idb(), t = db.transaction('clips'), q = t.objectStore('clips').get(k); await done(t); const x = q.result; return x ? new Blob([x.buf], { type: x.type }) : null; },
    async put(k, b) {
      const buf = await b.arrayBuffer(), db = await idb(), t = db.transaction('clips', 'readwrite'), s = t.objectStore('clips');
      s.put({ k, ts: Date.now(), type: b.type || 'audio/wav', buf });
      const c = s.count();
      c.onsuccess = () => { let extra = c.result - KEEP; if (extra > 0) s.index('ts').openCursor().onsuccess = e => { const cur = e.target.result; if (cur && extra-- > 0) { cur.delete(); cur.continue(); } }; };
      await done(t);
    },
    async del(k) { const db = await idb(), t = db.transaction('clips', 'readwrite'); t.objectStore('clips').delete(k); await done(t); },
  };
  let back = null;
  const backend = () => back || (back = (async () => {
    try { if (typeof caches !== 'undefined' && caches && typeof caches.open === 'function') { await caches.open(STORE); return CS; } } catch (e) { /* アプリの中などで使えない */ }
    try { if (typeof indexedDB !== 'undefined' && indexedDB) { await idb(); return IDB; } } catch (e) {}
    return null;
  })());
  const mem = new Map(), inflight = new Map(); /* mem: このページを開いている間だけ、最近の声を手元に置く */
  const remember = (k, b) => { mem.delete(k); mem.set(k, b); while (mem.size > MEM) mem.delete(mem.keys().next().value); };
  function forget(it) { const k = keyOf(it.voice, it.text); mem.delete(k); backend().then(s => s && s.del(k)).catch(() => {}); }
  /** 1文の声（Blob）。端末にあればそれ、無ければ中継に頼む。取れないときは null */
  function blobOf(text, voice, signal) {
    const k = keyOf(voice, text);
    if (mem.has(k)) { const b = mem.get(k); remember(k, b); return Promise.resolve(b); }
    /* 取りに行っている途中のものに相乗りする。ただし止めた読み上げのもの（中止済み）は null で終わるので使わない
       （同じ文を続けて読み直したときに、端末の声へ落ちないように） */
    const f = inflight.get(k);
    if (f && !(f.signal && f.signal.aborted)) return f.p;
    const p = (async () => {
      const st = await backend();
      const hit = st ? await st.get(k).catch(() => null) : null;
      if (hit && hit.size > 44) { remember(k, hit); return hit; }
      if (!online() || !relay() || (signal && signal.aborted)) return null; /* 止めたあとに頼まない */
      const headers = { 'content-type': 'application/json' };
      if (T.CONFIG.relayToken) headers['x-tsume-token'] = T.CONFIG.relayToken;
      const r = await fetch(relay() + '/v1/speech', { method: 'POST', headers, body: JSON.stringify({ text, voice }), signal });
      const type = String((r.headers && r.headers.get('content-type')) || '').split(';')[0].trim().toLowerCase();
      if (!r.ok || !/^audio\//.test(type)) return null;
      let b = await r.blob();
      if (!b || b.size <= 44) return null; /* WAV の頭だけ */
      if (b.type !== type) b = new Blob([b], { type });
      remember(k, b);
      if (st) st.put(k, b).catch(() => {});
      return b;
    })().catch(() => null);
    const entry = { p, signal };
    inflight.set(k, entry);
    p.then(() => { if (inflight.get(k) === entry) inflight.delete(k); });
    return p;
  }

  // ---- 鳴らす。Audio は1つだけ作って使い回す（iPhone は、押したときに一度鳴らした要素でないと、あとから鳴らせない）
  let el = null, unlocked = false, silent = null;
  const audio = () => { if (!el && typeof Audio !== 'undefined') { el = new Audio(); try { el.preload = 'auto'; } catch (e) {} } return el; };
  function silence() { /* 0.1秒の無音の WAV（8kHz・8bit） */
    if (silent) return silent;
    const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer), tag = (o, s) => { for (let i = 0; i < 4; i++) b[o + i] = s.charCodeAt(i); };
    tag(0, 'RIFF'); v.setUint32(4, 36 + n, true); tag(8, 'WAVE'); tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); tag(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return (silent = 'data:audio/wav;base64,' + btoa(s));
  }
  /** 押したときに呼ぶ。同じ Audio で無音を一度鳴らして、あとから（文が届いてから）鳴らせるようにする */
  function unlock() {
    const a = audio(); if (!a || unlocked) return;
    unlocked = true;
    try { a.src = silence(); const p = a.play(); if (p && p.catch) p.catch(e => { if (e && e.name === 'NotAllowedError') unlocked = false; }); } catch (e) { unlocked = false; }
  }
  const AHEAD = 2, wait = () => (T.voice && T.voice.waitMs) || 8000;
  let play = null; /* 自然な声で読んでいる間の状態 */
  function endNatural(P) {
    if (play === P) play = null;
    if (el) { el.onended = el.onerror = null; try { el.pause(); } catch (e) {} }
    P.urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); P.urls = [];
  }
  function failed(o) { hold(false); toast('読み上げできませんでした'); if (o.onEnd) o.onEnd(); }
  function natural(items, o, my) {
    const P = play = { ctrl: typeof AbortController !== 'undefined' ? new AbortController() : null, jobs: [], urls: [] };
    const live = () => my === gen && play === P;
    const job = k => (k < items.length ? (P.jobs[k] || (P.jobs[k] = blobOf(items[k].text, items[k].voice, P.ctrl ? P.ctrl.signal : undefined))) : null);
    // 届かない・鳴らせないときは、その文から端末の声で続ける（取りに行っている声はそのまま。届けば次から使える）
    const fall = k => { if (!live()) return; endNatural(P); if (!device(items.slice(k), o, my)) failed(o); };
    function step(k) {
      if (!live()) return;
      if (k >= items.length) { endNatural(P); hold(false); if (o.onEnd) o.onEnd(); return; }
      for (let n = k; n <= k + AHEAD; n++) job(n); /* 今の文と、次の2文 */
      let late = false;
      const t = setTimeout(() => { late = true; fall(k); }, wait());
      P.jobs[k].then(b => {
        clearTimeout(t);
        if (late || !live()) return;
        if (!b) return fall(k);
        const a = audio(), url = URL.createObjectURL(b); P.urls.push(url);
        a.onended = () => { if (live()) { a.onended = a.onerror = null; step(k + 1); } };
        a.onerror = () => { if (!live()) return; forget(items[k]); fall(k); }; /* 壊れた声は端末から消す */
        a.src = url;
        let p; try { p = a.play(); } catch (e) { fall(k); return; }
        const begun = () => { if (live() && items[k].head && o.onLine) o.onLine(items[k].i); };
        if (p && typeof p.then === 'function') p.then(begun, e => { if (live() && !(e && e.name === 'AbortError')) fall(k); }); else begun();
      });
    }
    step(0);
  }
  function device(items, o, my) {
    const s = synth(); if (!deviceOK() || !s) return false;
    items.forEach((it, n) => {
      const u = new SpeechSynthesisUtterance(it.text);
      u.lang = 'ja-JP'; u.rate = o.rate || 1.02; u.pitch = o.pitch || 1.05; if (jaVoice || pickVoice()) u.voice = jaVoice;
      u.onstart = () => { if (my === gen && it.head && o.onLine) o.onLine(it.i); };
      if (n === items.length - 1) u.onend = () => { if (my !== gen) return; hold(false); if (o.onEnd) o.onEnd(); };
      s.speak(u);
    });
    return true;
  }

  // ---- 初めて読むときの確認（自然な声か、端末の声か）。#app の外に置くので、画面を描き直しても消えない
  let ask = null;
  function closeAsk() {
    if (!ask) return;
    const a = ask; ask = null;
    try { document.removeEventListener('keydown', a.onKey, true); } catch (e) {}
    try { a.box.remove(); } catch (e) {}
    try { if (a.prev && a.prev.focus && a.prev.isConnected !== false) a.prev.focus(); } catch (e) {}
  }
  function openAsk(items, o, my) {
    if (!hasDOM || typeof document === 'undefined' || !document.body || !document.createElement) return false;
    const box = document.createElement('div');
    box.className = 'vc-ask';
    const x = (T.ui && T.ui.ICON && T.ui.ICON.close) || '×';
    box.innerHTML = `<div class="sheet-back opening" data-vc="cancel" aria-hidden="true"></div>
      <section class="sheet vc-sheet opening" role="dialog" aria-modal="true" aria-labelledby="vc-ask-t">
        <header class="sheet-head"><b id="vc-ask-t">自然な声で読み上げますか？</b><button class="iconbtn" data-vc="cancel" aria-label="閉じる">${x}</button></header>
        <div class="sheet-body"><p>読み上げる文（手順やソムリエの説明）を Google の AI（Gemini）に送って声にします。18歳以上の方向けです。</p><p class="small muted">端末の声なら、外には送りません。あとから「使い方」で変えられます。</p></div>
        <footer class="sheet-foot btnrow">${deviceOK() ? '<button class="btn ghost" data-vc="device">端末の声で聞く</button>' : ''}<button class="btn rose" data-vc="natural">自然な声で聞く</button></footer>
      </section>`;
    const pick = v => {
      if (!ask || ask.box !== box) return;
      closeAsk();
      if (my !== gen) return;
      if (v === 'cancel') { skipAsk = true; if (o.onEnd) o.onEnd(); return; } /* 読まずに閉じた: 呼ぶ側の「再生中」を戻す */
      setMode(v); hold(true);
      if (v === 'natural') { unlock(); natural(items, o, my); return; } /* 押したその場で Audio を鳴らせるようにする */
      if (!device(items, o, my)) failed(o);
    };
    box.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-vc]') : null; if (!b) return; e.stopPropagation(); pick(b.getAttribute('data-vc')); });
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); pick('cancel'); } };
    ask = { box, onKey, prev: document.activeElement };
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(box);
    const f = box.querySelector('[data-vc=natural]'); if (f && f.focus) { try { f.focus(); } catch (e) {} }
    return true;
  }

  function stop() {
    gen++;
    const s = synth(); if (s) s.cancel();
    if (play) { const P = play; if (P.ctrl) { try { P.ctrl.abort(); } catch (e) {} } endNatural(P); } /* 取りに行っている途中の声も捨てる */
    closeAsk(); hold(false);
  }
  /** 文を順に読む。onLine(i) は i 番目の文を読み始めたとき、onEnd() は全部読み終えたとき（止めたときは呼ばない）。
      o.voice: 'guide'（既定）| 'sommelier'。読めないときは false */
  function speak(lines, o) {
    o = o || {};
    const voice = o.voice === 'sommelier' ? 'sommelier' : 'guide', way = route();
    if (way === 'device' && !deviceOK()) return false;
    stop();
    const items = prepare(lines, voice), my = gen;
    if (!items.length) return true;
    if (way === 'ask' && openAsk(items, o, my)) return true;
    hold(true);
    if (way === 'natural') { unlock(); natural(items, o, my); return true; }
    if (device(items, o, my)) return true;
    hold(false); return false;
  }
  const speaking = () => { const s = synth(); return !!play || !!(s && (s.speaking || s.pending)); };
  /** 先に取っておく（鳴らさない）。自然な声に同意しているときだけ。1文ずつ順に（中継の回数制限に当たらないように） */
  let warmGen = 0;
  function warm(lines, o) {
    o = o || {};
    if (route() !== 'natural') return false;
    const items = prepare(lines, o.voice === 'sommelier' ? 'sommelier' : 'guide').slice(0, 12), my = ++warmGen;
    (async () => { for (const it of items) { if (my !== warmGen) return; if (!(await blobOf(it.text, it.voice))) return; } })().catch(() => {});
    return true;
  }

  // ---- 声の合図（「つぎ」「もどる」「もう一回」「スタート」「ストップ」「できた」）。iPhone のアプリ版などでは使えない。
  // Chrome などの音声認識は、声をブラウザの提供元に送る（使う前に画面で知らせる）
  const Rec = hasDOM ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  let rec = null, onCmd = null, onState = null, want = false;
  // 判定の順が大事:「タイマー止めて」は止める、「次の指スタート」はスタート。長い発話（読み上げの声など）は合図にしない
  const COMMANDS = [['done', /できた|完成/], ['stop', /ストップ|(^|[^ま])とめて|止めて|とまれ/], ['start', /スタート|はじめ|始め/], ['repeat', /もう一|もう1|もういち|くりかえ|繰り返/], ['prev', /まえ|前|もどる|戻る|もどって|戻って/], ['next', /つぎ|次|ネクスト|すすむ|進む|オッケー|OK/i]];
  function command(text) {
    const t = String(text || '').replace(/[\s、。！!？?]/g, '');
    if (!t || t.length > 10) return null;
    const hit = COMMANDS.find(([, re]) => re.test(t)); return hit ? hit[0] : null;
  }
  const FATAL = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'language-not-supported'];
  function start() {
    if (held || rec) return true;
    rec = new Rec(); rec.lang = 'ja-JP'; rec.continuous = true; rec.interimResults = false;
    rec.onresult = e => { if (held) return; for (let i = e.resultIndex; i < e.results.length; i++) { const c = command(e.results[i][0].transcript); if (c && onCmd) onCmd(c); } };
    rec.onend = () => { rec = null; if (want && !held) start(); };
    rec.onerror = e => { if (FATAL.includes(e.error)) { want = false; if (onState) onState(false, e.error); } };
    try { rec.start(); } catch (err) { rec = null; return false; }
    return true;
  }
  /** 合図を聞く。cb(command)。state(false, error) は、マイクが使えなくなったとき */
  function listen(cb, state) {
    if (!Rec) return false;
    onCmd = cb; onState = state || null; want = true;
    return start();
  }
  /** 1回だけ聞き取る（色の名前など）。cb(文字 | null) */
  function dictate(cb) {
    if (!Rec) return false;
    const r = new Rec(); r.lang = 'ja-JP'; r.continuous = false; r.interimResults = false;
    let done = false; const end = t => { if (!done) { done = true; cb(t); } };
    r.onresult = e => end(e.results[0] && e.results[0][0] ? e.results[0][0].transcript : null);
    r.onerror = () => end(null); r.onend = () => end(null);
    try { r.start(); } catch (e) { return false; }
    return true;
  }
  function unlisten() { want = false; onCmd = null; onState = null; if (rec) { try { rec.stop(); } catch (e) {} } }
  T.voice = { available, speak, stop, speaking, listenAvailable: () => !!Rec, listen, unlisten, command, dictate, warm, mode, setMode, route, naturalPossible, tidy, waitMs: 8000 };
})(typeof window !== 'undefined' ? window : globalThis);
