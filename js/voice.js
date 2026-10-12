/* tsumé — 読み上げ（端末の音声。外には送らない）と、声の合図（使える端末だけ）。ソムリエと手順の音声案内で共通 */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const hasDOM = typeof window !== 'undefined';
  const synth = () => (hasDOM && window.speechSynthesis) || null;
  let jaVoice = null, queue = 0;
  function pickVoice() {
    const s = synth(); if (!s) return null;
    const vs = s.getVoices() || [];
    jaVoice = vs.find(v => /^ja(-|_|$)/i.test(v.lang) && /Kyoko|O-ren|Google|Siri/i.test(v.name)) || vs.find(v => /^ja/i.test(v.lang)) || null;
    return jaVoice;
  }
  if (synth()) { pickVoice(); try { synth().addEventListener('voiceschanged', pickVoice); } catch (e) { /* 古い端末 */ } }
  const available = () => !!synth() && typeof SpeechSynthesisUtterance !== 'undefined';
  // 読み上げている間は音声認識を止める（自分の声を合図として拾わない）。読み終えて少し待ってから聞き直す
  let held = false, holdT = null;
  function hold(on) {
    clearTimeout(holdT);
    if (on) { held = true; if (rec) { try { rec.abort(); } catch (e) {} } return; }
    holdT = setTimeout(() => { held = false; if (want && !rec) start(); }, 700);
  }
  function stop() { queue++; const s = synth(); if (s) s.cancel(); hold(false); }
  /** 文を順に読む。onLine(i) は読み始め、onEnd() は全部読み終えたとき（止めたときは呼ばない） */
  function speak(lines, o) {
    o = o || {}; const s = synth(); if (!available() || !s) return false;
    stop(); hold(true); const my = queue, list = [].concat(lines).filter(Boolean);
    list.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'ja-JP'; u.rate = o.rate || 1.02; u.pitch = o.pitch || 1.05; if (jaVoice || pickVoice()) u.voice = jaVoice;
      u.onstart = () => { if (my === queue && o.onLine) o.onLine(i); };
      if (i === list.length - 1) u.onend = () => { if (my !== queue) return; hold(false); if (o.onEnd) o.onEnd(); };
      s.speak(u);
    });
    return true;
  }
  const speaking = () => { const s = synth(); return !!(s && (s.speaking || s.pending)); };

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
  T.voice = { available, speak, stop, speaking, listenAvailable: () => !!Rec, listen, unlisten, command, dictate };
})(typeof window !== 'undefined' ? window : globalThis);
