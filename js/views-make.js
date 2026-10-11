/* tsumé — 作るモード（全画面で1手順ずつ・タイマー・仕上がりチェック・できた！）と、手順タブと共通の部品 */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';

  // ---- タイマーは1つだけ。表示は該当のボタンだけ書き換え、画面全体は描き直さない（開いた「失敗したら」を閉じないため）
  const tm = { key: null, end: 0, total: 0, label: '', done: null, id: null };
  const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const running = key => tm.key === key && tm.end > Date.now();
  function stateOf(key, sec) {
    const run = running(key), done = !run && tm.done === key, left = run ? tm.end - Date.now() : sec * 1000;
    return { run, done, left, p: run ? 1 - left / (sec * 1000) : done ? 1 : 0, sub: run ? 'タップで止める' : done ? 'もう一度（次の指）' : 'タップで開始' };
  }
  function paint() {
    if (!hasDOM) return;
    document.querySelectorAll('[data-timer]').forEach(el => {
      const s = stateOf(el.dataset.timer, +el.dataset.sec);
      el.classList.toggle('run', s.run); el.classList.toggle('done', s.done);
      el.dataset.act = s.run ? 'timer-stop' : 'timer-start';
      el.style.setProperty('--p', s.p.toFixed(4));
      el.querySelector('.tr-num').textContent = s.done ? '✓' : fmt(s.left);
      el.querySelector('.tr-sub').textContent = s.sub;
    });
  }
  function tick() { if (tm.end - Date.now() <= 0) finish(); else paint(); }
  function start(key, sec, label) {
    if (tm.id) clearInterval(tm.id);
    Object.assign(tm, { key, end: Date.now() + sec * 1000, total: sec, label, done: null });
    if (hasDOM) tm.id = setInterval(tick, 200);
    paint();
  }
  function stop() { if (tm.id) clearInterval(tm.id); Object.assign(tm, { id: null, end: 0, key: null }); paint(); }
  function finish() {
    const key = tm.key, label = tm.label;
    if (tm.id) clearInterval(tm.id); Object.assign(tm, { id: null, end: 0, done: key });
    paint();
    try { window.dispatchEvent(new CustomEvent('tsume:done')); } catch (e) {}
    // ネイティブは tsume:done で振動するので、Web のときだけ
    try { if (!(T.native && T.native.isNative) && navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
    T.app.toast(`${label}、終わりました`);
  }
  function timerView(key, t, big) {
    if (!t) return '';
    const s = stateOf(key, t.sec);
    return `<button class="timer${big ? ' big' : ''}${s.run ? ' run' : ''}${s.done ? ' done' : ''}" data-act="${s.run ? 'timer-stop' : 'timer-start'}" data-key="${esc(key)}" data-sec="${t.sec}" data-label="${esc(t.label)}" data-timer="${esc(key)}" style="--p:${s.p.toFixed(4)}">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tr-bg" cx="60" cy="60" r="52"/><circle class="tr-fg" cx="60" cy="60" r="52" pathLength="100"/></svg>
      <span class="tr-in"><span class="tr-num latin" aria-live="off">${s.done ? '✓' : fmt(s.left)}</span><span class="tr-lab">${esc(t.label)}</span><span class="tr-sub">${s.sub}</span></span>
    </button>`;
  }
  // 段階や色を切り替えても、同じ手順なら同じタイマー
  const timerKey = (st, s) => `${st.current ? st.current.conceptId : '-'}:${st.sel.method}:${T.howto.stepId(s)}`;

  // ---- チェック（用意するもの・仕上がり）。その場だけ覚える
  function checks(st) {
    st.checks = st.checks || {};
    const k = st.current ? `${st.current.conceptId}:${st.current.paletteIndex}` : '-';
    return (st.checks[k] = st.checks[k] || { prep: {}, done: {} });
  }
  const box = (act, attr, on, inner) => `<button class="chk" data-act="${act}" ${attr} aria-pressed="${on}"><i class="box">${ICON.check}</i><span class="chk-t">${inner}</span></button>`;
  const GROUPS = [['塗るもの', ['gel', 'polish', 'art', 'powder']], ['パーツ', ['parts']], ['道具・小物', ['tool', 'kit']]];
  function prepList(st, d, s) {
    const c = checks(st), left = d.materials.filter(m => !c.prep[m.id]).length;
    const groups = GROUPS.map(([name, cats]) => {
      const ms = d.materials.filter(m => cats.includes(m.cat)); if (!ms.length) return '';
      return `<div class="chk-group"><div class="group-label">${name}</div>${ms.map(m => box('prep-check', `data-id="${m.id}"`, !!c.prep[m.id], `${esc(m.name)}${m.qty > 1 ? ` ×${m.qty}` : ''}<small>${esc(m.product)}（${esc(m.store)}）</small>`)).join('')}</div>`;
    }).join('');
    return `<div class="promises"><b>キレイに仕上がる3つの約束</b><ol>${s.how.map(l => `<li>${esc(l)}</li>`).join('')}</ol></div>
      <p class="chk-count">${left ? `そろえるもの あと<b class="num">${left}</b>点` : `${ICON.check}そろいました`}</p>${groups}`;
  }
  function finishCheck(st, s) {
    const c = checks(st), n = s.how.filter((_, i) => c.done[i]).length;
    return `<p class="chk-count">${n === s.how.length ? `${ICON.check}ぜんぶ確かめました` : `確かめた <b class="num">${n}</b> / ${s.how.length}`}</p>
      <div class="chk-group">${s.how.map((t, i) => box('check-item', `data-i="${i}"`, !!c.done[i], esc(t))).join('')}</div>
      ${s.tip ? `<p class="aftercare">${esc(s.tip)}</p>` : ''}`;
  }
  const tipHtml = s => (s.tip ? `<p class="tip">${ICON.sparkle}<span>${esc(s.tip)}</span></p>` : '');
  const fixHtml = (s, open) => (s.fix.length ? `<details class="fix"${open ? ' open' : ''}><summary>失敗したら</summary><dl>${s.fix.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join('')}</dl></details>` : '');
  /** 手順タブの本文（やり方・使うもの・コツ・失敗したら・タイマー） */
  function stepDetail(st, d, s) {
    if (s.kind === 'prep-list') return prepList(st, d, s) + tipHtml(s);
    if (s.kind === 'check') return finishCheck(st, s);
    const tools = s.tools.length ? `<div class="tools"><span class="lab">使うもの</span>${s.tools.map(id => `<span class="tool-chip">${esc(T.MATERIALS[id].name)}</span>`).join('')}</div>` : '';
    const timer = s.timer ? `<div class="timer-row">${timerView(timerKey(st, s), s.timer)}<span class="small muted">${st.sel.method === 'polish' ? '時間は目安。' : '時間はライトとジェルの説明書を優先。'}</span></div>` : '';
    return `<ol class="how">${s.how.map(l => `<li>${esc(l)}</li>`).join('')}</ol>${tools}${tipHtml(s)}${timer}${fixHtml(s)}`;
  }

  // ---- 作るモード
  const designOf = st => (st.current ? U.designFor(st.current.conceptId, st.current.paletteIndex) : null);
  function celebrate(st, ok) {
    return `<div class="make-done" role="dialog" aria-modal="true" aria-labelledby="make-done-h">
      <div class="make-bloom">${T.renderBloom(st.season, { size: 260 })}</div>
      <h2 id="make-done-h" tabindex="-1">キレイにできました</h2>
      <p class="small">${ok ? 'マイデザインに「作った日」を記録しました。' : 'この環境では記録を残せません（表示だけ）。'}</p>
      <p class="aftercare">${esc(T.HOWTO.AFTERCARE[st.sel.method === 'polish' ? 'polish' : 'gel'])}</p>
      <div class="btnrow"><button class="btn rose" data-act="make-mine">マイデザインを見る</button><button class="btn ghost" data-act="make-close">作り方に戻る</button></div>
    </div>`;
  }
  T.views.make = st => {
    const d = designOf(st);
    if (!d) return `${U.bar({ back: true, title: '作るモード' })}<p class="muted">デザインを選んでください。</p>`;
    const mk = st.make || (st.make = { idx: 0 }), list = d.steps;
    const k = mk.idx = Math.max(0, Math.min(list.length - 1, mk.idx)), s = list[k], last = k === list.length - 1;
    const side = d.foot ? 'right' : st.side || U.showcaseSide(st.sel), specs = d.foot || (side === 'left' ? d.left : d.right);
    const marks = E.changedAtStep(specs, list, k);
    const chart = s.kind || s.stage === 0 ? '' : `<div class="make-chart">${U.chart(d, side, { specs: specs.map(f => E.specAtStep(f, list, k)), marks })}</div>`;
    const n = st.sel.level === 'first' ? 6 : 4;
    const center = s.kind === 'prep-list' ? prepList(st, d, s) : s.kind === 'check' ? finishCheck(st, s)
      : `<p class="make-lead">${esc(s.body)}${chart && marks.length && marks.length < 5 ? '<span>（点のついた指に）</span>' : ''}</p><ol class="make-how">${s.how.slice(0, n).map(l => `<li>${esc(l)}</li>`).join('')}</ol>${s.how.length > n ? `<p class="small muted">続きは「コツと、失敗したら」に。</p>` : ''}${s.timer ? timerView(timerKey(st, s), s.timer, true) : ''}`;
    const more = !s.kind && (s.tip || s.fix.length || s.how.length > n);
    const panel = mk.tip ? `<div class="make-tip">${s.how.length > n ? `<ol class="how" start="${n + 1}">${s.how.slice(n).map(l => `<li>${esc(l)}</li>`).join('')}</ol>` : ''}${tipHtml(s)}${fixHtml(s, true)}</div>` : '';
    const foot = `<button class="btn ghost" data-act="make-prev" ${k === 0 ? 'disabled' : ''}>${ICON.back}前</button>${last ? `<button class="btn rose" data-act="make-done">${ICON.sparkle}できた！</button>` : `<button class="btn" data-act="make-next">次へ${ICON.chev}</button>`}`;
    const inert = mk.celebrate ? ' inert' : '';
    return `<section class="make" aria-label="作るモード">
      <header class="make-head"${inert}><span class="make-count latin">${k + 1} / ${list.length}</span><span class="make-name">${esc(d.concept.name)}</span><button class="iconbtn" data-act="make-close" aria-label="作るモードを終える">${ICON.close}</button></header>
      <div class="make-prog" aria-hidden="true"><i style="width:${(((k + 1) / list.length) * 100).toFixed(1)}%"></i></div>
      <div class="make-body" data-swipe="make" data-keep-scroll="make-body"${inert}>
        ${chart}
        <h1 class="make-title" tabindex="-1">${esc(s.title)}</h1>
        ${center}
        ${more ? `<button class="link make-more" data-act="make-tip" aria-expanded="${!!mk.tip}">${ICON.sparkle}コツと、失敗したら</button>` : ''}
        ${panel}
      </div>
      <footer class="make-foot"${inert}>${foot}</footer>
      ${mk.celebrate ? celebrate(st, mk.saved !== false) : ''}
    </section>`;
  };

  // 作っている間は画面を消さない（使える環境だけ）。描画のたびではなく、作るモードに出入りしたときだけ
  let lock = null, want = false, pending = false;
  function wake(on) {
    want = on;
    if (!hasDOM || !navigator.wakeLock) return;
    if (on && !lock && !pending) {
      pending = true;
      navigator.wakeLock.request('screen').then(l => {
        pending = false; lock = l; lock.addEventListener('release', () => { lock = null; });
        if (!want) { lock.release(); lock = null; }
      }).catch(() => { pending = false; });
    }
    if (!on && lock) { lock.release(); lock = null; }
  }
  let lastView = null, lastIdx = null;
  if (hasDOM) {
    window.addEventListener('tsume:render', e => {
      const view = e.detail && e.detail.view, on = view === 'make', st = T.app.state;
      document.body.classList.toggle('make-open', on);
      if (on !== (lastView === 'make')) wake(on);
      // 手順が変わったら見出しへ、できた！のときはその見出しへ（読み上げと Tab の位置を合わせる）
      if (on) {
        const idx = st.make && st.make.celebrate ? 'done' : st.make && st.make.idx;
        if (idx !== lastIdx) { const h = document.querySelector(idx === 'done' ? '#make-done-h' : '.make-title'); if (h) h.focus({ preventScroll: true }); }
        lastIdx = idx;
      } else lastIdx = null;
      lastView = view;
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && T.app.state.view === 'make') wake(true); });
    document.addEventListener('keydown', e => {
      const st = T.app.state; if (st.view !== 'make' || !st.make || e.target.closest('input, textarea')) return;
      if (e.key === 'Escape') { e.preventDefault(); T.app.act('make-close', null, e); }
      else if (!st.make.celebrate && e.key === 'ArrowRight') { const b = document.querySelector('.make-foot [data-act=make-next]'); if (b) T.app.act('make-next', b, e); }
      else if (!st.make.celebrate && e.key === 'ArrowLeft' && st.make.idx > 0) T.app.act('make-prev', null, e);
    });
  }

  const go = (st, k) => { st.make.idx = k; st.make.tip = false; T.app.render(); const b = document.querySelector('.make-body'); if (b) b.scrollTop = 0; };
  Object.assign(T.actions, {
    'make-open': (el, st) => { st.make = { idx: el && el.dataset.i != null ? +el.dataset.i : st.stepIdx || 0 }; T.app.go('make'); },
    'make-next': (el, st) => go(st, st.make.idx + 1),
    'make-prev': (el, st) => go(st, Math.max(0, st.make.idx - 1)),
    'make-tip': (el, st) => { st.make.tip = !st.make.tip; T.app.render(); },
    // 手順の位置は back() が作るモードから合わせる
    'make-close': (el, st) => { if (T.app.peek() === 'detail') T.app.back(); else { const idx = st.make ? st.make.idx : 0; T.app.go('detail', { replace: true }); st.stepIdx = idx; st.tab = 'steps'; T.app.render(); } },
    'make-mine': (el, st) => { if (st.make) st.make.celebrate = false; T.app.go('mine', { replace: true }); },
    'make-done': (el, st) => { st.make.saved = T.app.markMade(); st.make.celebrate = true; try { window.dispatchEvent(new CustomEvent('tsume:done')); } catch (e) {} T.app.render(); },
    'timer-start': el => start(el.dataset.key, +el.dataset.sec || 60, el.dataset.label || ''),
    'timer-stop': () => stop(),
    'prep-check': (el, st) => { const c = checks(st); c.prep[el.dataset.id] = !c.prep[el.dataset.id]; T.app.render(); },
    'check-item': (el, st) => { const c = checks(st); c.done[el.dataset.i] = !c.done[el.dataset.i]; T.app.render(); },
  });

  T.make = { stepDetail, timerView, timerKey, running, start, stop };
})(typeof window !== 'undefined' ? window : globalThis);
