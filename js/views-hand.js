/* tsumé — 「わたしの手」: 画面に指先を置くと、その場所に今の爪が出て、手の絵が自分の大きさになる。
   置き場は document.body の直下（app.render() が #app を書き換えても消えない）。写真・カメラ・通信なし */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui;
  if (typeof document === 'undefined') return;
  const NEED = 2; // 2回置いてもらい、まとめる
  let el = null, results = [], peak = [], maxN = 0;

  function nailSvg(i) {
    const cur = T.tryCurrent && T.tryCurrent(T.app.state);
    if (!cur) return '';
    const spec = cur.design.left[i] || cur.design.left[0];
    return T.renderSwatch(spec, cur.design.palette, { shape: cur.sel.shape, length: 'medium', seed: 31 + i, finger: i });
  }
  function close() { if (el) { el.remove(); el = null; } document.body.classList.remove('myhand-open'); }
  function msg(html) { el.querySelector('.mh-msg').innerHTML = html; }
  function drawNails(pts, keep) {
    const box = el.querySelector('.mh-nails'); box.innerHTML = '';
    const size = T.handFit.SIZES[(T.handFit.get() || {}).size || 'M'];
    pts.forEach((p, i) => {
      const d = document.createElement('div'); d.className = 'mh-nail' + (keep ? ' keep' : '');
      d.style.left = p.x + 'px'; d.style.top = p.y + 'px'; d.style.setProperty('--w', (44 * size.w) + 'px');
      d.innerHTML = nailSvg([4, 3, 2, 1, 0][i] != null ? [4, 3, 2, 1, 0][i] : 1);
      box.appendChild(d);
    });
  }
  const pts = e => Array.prototype.map.call(e.touches, t => ({ x: Math.round(t.clientX), y: Math.round(t.clientY) }));
  function onTouch(e) {
    e.preventDefault();
    const p = pts(e); if (p.length >= maxN) { maxN = p.length; peak = p; }
    drawNails(p.slice().sort((a, b) => a.x - b.x), false);
  }
  function onEnd(e) {
    e.preventDefault();
    if (e.touches.length) return;
    const land = innerWidth > innerHeight, got = peak, n = maxN; peak = []; maxN = 0;
    if (n < 3) { msg('指が読めませんでした。<b>3本以上</b>をそっと置いて、2秒待ってください。'); return; }
    drawNails(got.slice().sort((a, b) => a.x - b.x), true);
    results.push(T.handFit.fit(got, land));
    if (results.length < NEED) { msg(`<b>読めました。</b>もう1回だけ、同じように置いてください。（${results.length}/${NEED}）`); return; }
    const r = T.handFit.decide(results); results = [];
    if (!r) { msg('うまく読めませんでした。もう一度置いてください。'); return; }
    T.handFit.set(r);
    msg(`<b>わたしの手にしました。</b>爪の大きさは「${U.esc(T.handFit.SIZES[r.size].name)}」。`);
    setTimeout(() => { close(); T.app.state.fx = 'paint'; T.app.render(); T.app.toast('手の絵を、わたしの手の大きさにしました'); }, 1400);
  }
  function open() {
    close(); results = []; peak = []; maxN = 0;
    el = document.createElement('div'); el.className = 'myhand'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'わたしの手にする');
    el.innerHTML = `<div class="mh-pad"></div><div class="mh-nails"></div>
      <div class="mh-msg"><b>スマホを横向きにして机に置き、</b>指先4本をそろえて、そっと置いてください（親指はいりません）。<br>2秒たったら離します。</div>
      <div class="mh-note">画面の白い所なら、どこでも大丈夫です。指先が少し上や下にずれても、そのまま読めます。細かく合わせなくて平気です。</div>
      <div class="mh-foot"><button class="btn ghost" data-mh="cancel">やめる</button>${T.handFit.get() ? '<button class="btn ghost" data-mh="reset">元の手に戻す</button>' : ''}</div>`;
    document.body.appendChild(el); document.body.classList.add('myhand-open');
    const pad = el.querySelector('.mh-pad');
    pad.addEventListener('touchstart', onTouch, { passive: false });
    pad.addEventListener('touchmove', onTouch, { passive: false });
    pad.addEventListener('touchend', onEnd, { passive: false });
    pad.addEventListener('touchcancel', () => { peak = []; maxN = 0; }, { passive: false });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-mh]'); if (!b) return;
      if (b.dataset.mh === 'reset') { T.handFit.set(null); close(); T.app.render(); T.app.toast('元の手の絵に戻しました'); return; }
      close();
    });
  }
  Object.assign(T.actions, { myhand: () => open() });
  T.myHand = { open, close };
})(typeof window !== 'undefined' ? window : globalThis);
