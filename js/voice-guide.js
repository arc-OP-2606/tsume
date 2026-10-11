/* tsumé — 手順の音声案内（作るモード）。両手がふさがっていても、手順とタイマーを声で聞ける。
   声の合図（つぎ・まえ・もう一回・スタート・ストップ・できた）は音声認識が使える端末だけ、本人が押したときだけ */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, V = T.voice;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';
  const st = () => T.app.state;
  const on = () => !!st().voiceGuide && V.available();
  // 読み上げの声をマイクが拾って「次」などと誤って動かないよう、話している間と直後は合図を聞き流す
  let hush = 0;
  const quiet = () => { hush = Date.now() + 1200; };
  function say(lines) { if (!on()) return; quiet(); V.speak(lines, { rate: 0.98, onLine: quiet, onEnd: quiet }); }

  const sec = n => (n < 60 ? `${n}秒` : `${Math.floor(n / 60)}分${n % 60 ? `${n % 60}秒` : ''}`);
  const designOf = s => (s.current ? U.designFor(s.current.conceptId, s.current.paletteIndex) : null);
  const strip = t => String(t).replace(/[（(][^）)]*[）)]/g, '').replace(/[・／/]/g, '、');
  /** 1つの手順を、聞いて分かる文にする */
  function lines(s, d, k) {
    const step = d.steps[k], n = d.steps.length, last = k === n - 1;
    const out = [`${last ? '最後の手順' : `手順${k + 1}`}。${step.title}。`];
    if (step.kind === 'prep-list') {
      const names = d.materials.map(m => strip(m.name));
      out.push(`まず、用意するもの。${names.length}点です。${names.slice(0, 10).join('、')}${names.length > 10 ? '、ほか' : ''}。`);
      return out;
    }
    if (step.kind === 'check') return out.concat(['仕上がりを確かめます。'], step.how.map(strip));
    if (step.body && step.body !== step.title) out.push(strip(step.body));
    step.how.slice(0, s.sel.level === 'first' ? 6 : 4).forEach(l => out.push(strip(l)));
    if (step.timer) out.push(`タイマーは${sec(step.timer.sec)}。${listening ? '塗り終わったら「スタート」と言ってください。' : '塗り終わったら、タイマーを押してください。'}`);
    return out;
  }
  function readStep() {
    const s = st(), d = designOf(s); if (!d || !s.make) return;
    if (s.make.celebrate) return say(['キレイにできました。おつかれさまでした。']);
    say(lines(s, d, s.make.idx));
  }

  // ---- 声の合図
  let listening = false, hints = 0;
  function onCommand(c) {
    const s = st(); if (s.view !== 'make' || !s.make || s.make.celebrate) return;
    if (V.speaking()) { if (c === 'stop') V.stop(); return; }
    if (Date.now() < hush) return;
    const d = designOf(s); if (!d) return;
    const step = d.steps[s.make.idx], last = s.make.idx === d.steps.length - 1;
    if (c === 'next') { if (last) say(['これが最後の手順です。終わったら「できた」と言ってください。']); else T.app.act('make-next', null); }
    else if (c === 'prev') { if (s.make.idx > 0) T.app.act('make-prev', null); }
    else if (c === 'repeat') readStep();
    else if (c === 'start') { if (step.timer) T.make.start(T.make.timerKey(s, step), step.timer.sec, step.timer.label); else say(['この手順にタイマーはありません。']); }
    else if (c === 'stop') { if (T.make.isRunning()) T.make.stop(); else V.stop(); }
    else if (c === 'done') { if (last) T.app.act('make-done', null); }
  }
  function setListen(want) {
    const lost = (_, err) => { listening = false; T.app.toast(err === 'not-allowed' || err === 'service-not-allowed' ? 'マイクが許可されていないので、声の合図を止めました' : '声の合図が使えなくなりました'); if (st().view === 'make') T.app.render(); };
    listening = !!want && V.listenAvailable() && V.listen(onCommand, lost);
    if (!listening) V.unlisten();
  }

  // ---- 画面
  function button(s) {
    if (!V.available()) return '';
    return `<button class="iconbtn vg-btn${s.voiceGuide ? ' on' : ''}" data-act="voice-guide" aria-pressed="${!!s.voiceGuide}" aria-label="手順の音声案内">${ICON.voice}</button>`;
  }
  function bar(s) {
    if (!on() || (s.make && s.make.celebrate)) return '';
    const d = designOf(s), last = d && s.make && s.make.idx === d.steps.length - 1;
    const cmds = `「つぎ」「まえ」「もう一回」「スタート」「ストップ」${last ? '「できた」' : ''}`;
    const body = !V.listenAvailable() ? '<span class="vg-t"><b>読み上げ中</b>（この端末では声の合図は使えません）</span>'
      : listening ? `<span class="vg-t">${ICON.mic}<b>声で操作</b>${cmds}</span><button class="link" data-act="voice-listen" data-v="off">やめる</button>`
        : `<span class="vg-t"><b>読み上げ中</b></span><button class="link" data-act="voice-listen" data-v="on">${ICON.mic}声で操作する</button><span class="vg-note">マイクの声は、ブラウザの音声認識に送られます。</span>`;
    return `<div class="make-voice" role="group" aria-label="音声案内">${ICON.voice}${body}</div>`;
  }

  // ---- 手順が変わったら読む・作るモードを出たら止める
  let lastKey = null;
  if (hasDOM) {
    window.addEventListener('tsume:render', e => {
      const view = e.detail && e.detail.view, s = st();
      if (view !== 'make') { if (lastKey !== null) { V.stop(); setListen(false); } lastKey = null; return; }
      const key = s.make && s.make.celebrate ? 'done' : `${s.current && s.current.conceptId}:${s.make && s.make.idx}`;
      if (key !== lastKey) { lastKey = key; if (on()) readStep(); }
    });
    window.addEventListener('tsume:timer', e => {
      if (!on() || st().view !== 'make') return;
      const t = e.detail || {};
      if (t.type === 'start') say([`スタート。${sec(t.sec)}です。`]);
      else if (t.type === 'ten') say(['あと10秒。']);
      else if (t.type === 'end') say([`${strip(t.label)}、終わりました。`].concat(listening && hints++ < 2 ? ['次の指は「スタート」、次の手順へは「つぎ」。'] : []));
    });
  }

  Object.assign(T.actions, {
    'voice-guide': (el, s) => {
      s.voiceGuide = !s.voiceGuide; T.app.persist();
      if (!s.voiceGuide) { V.stop(); setListen(false); }
      T.app.render();
      if (s.voiceGuide) readStep(); else T.app.toast('音声案内をオフにしました');
    },
    'voice-listen': (el, s) => {
      setListen(el.dataset.v === 'on');
      if (el.dataset.v === 'on' && !listening) T.app.toast('マイクが使えませんでした');
      T.app.render();
    },
  });
  T.voiceGuide = { lines, button, bar, onCommand, sec };
})(typeof window !== 'undefined' ? window : globalThis);
