/* tsumé — 指の操作: なぞると光が動く・スワイプの点・トッピングのドラッグ */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const setX = (st, e) => { const r = st.getBoundingClientRect(); st.style.setProperty('--mx', Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)).toFixed(3)); };
  document.addEventListener('pointerdown', e => { const st = e.target.closest('[data-light]'); if (st) { st.classList.add('touching'); setX(st, e); } });
  document.addEventListener('pointermove', e => { const st = e.target.closest('[data-light]'); if (st && st.classList.contains('touching')) setX(st, e); });
  const end = () => document.querySelectorAll('[data-light].touching').forEach(s => s.classList.remove('touching'));
  ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, end, true));
  document.addEventListener('pointerleave', e => { if (e.target && e.target.matches && e.target.matches('[data-light]')) e.target.classList.remove('touching'); }, true);

  // 提案のスワイプに合わせて点を動かす
  document.addEventListener('scroll', e => {
    const sw = e.target; if (!sw.classList || !sw.classList.contains('swipe')) return;
    const card = sw.querySelector('.pcard'); if (!card) return;
    const i = Math.round(sw.scrollLeft / (card.offsetWidth + 12));
    document.querySelectorAll('.dots [data-dot]').forEach((d, j) => d.setAttribute('aria-current', String(j === i)));
  }, true);

  // 作るモード: 左右にスワイプで前後の手順へ（縦のスクロールやボタンのタップとは区別する）
  let sw = null;
  document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('[data-swipe="make"]'); sw = b && e.isPrimary ? { x: e.clientX, y: e.clientY, t: Date.now() } : null; });
  document.addEventListener('pointerup', e => {
    if (!sw) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y, quick = Date.now() - sw.t < 700; sw = null;
    if (!quick || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const btn = document.querySelector(dx < 0 ? '.make-foot [data-act=make-next]' : '.make-foot [data-act=make-prev]:not([disabled])');
    if (btn && window.TSUME && TSUME.app) TSUME.app.act(btn.dataset.act, btn, e);
  });
  document.addEventListener('pointercancel', () => { sw = null; });

  // エディタ: パーツをドラッグで動かす／タップで選ぶ／爪をタップして置く
  let drag = null;
  function nailPos(svg, e) {
    const g = svg.querySelector('.tsume-nail'); if (!g) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(g.getScreenCTM().inverse()), L = +svg.dataset.l;
    return { x: Math.min(0.92, Math.max(0.08, q.x / 100)), y: Math.min(0.94, Math.max(0.06, q.y / L)), L, inside: q.x >= 0 && q.x <= 100 && q.y >= 0 && q.y <= L };
  }
  document.addEventListener('pointerdown', e => {
    const svg = e.target.closest && e.target.closest('.ed-stage svg.ed-nail'); if (!svg) return;
    e.preventDefault();
    const top = e.target.closest('.tsume-top');
    if (top) {
      const pos = top.querySelector('.tsume-top-pos'), m = (pos.getAttribute('transform') || '').match(/rotate\(([-\d.]+)/);
      drag = { svg, pos, i: +top.dataset.i, x0: e.clientX, y0: e.clientY, moved: false, rot: m ? m[1] : 0 };
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    } else drag = { svg, place: true, x0: e.clientX, y0: e.clientY };
  });
  document.addEventListener('pointermove', e => {
    if (!drag || drag.place) return;
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) drag.moved = true;
    if (!drag.moved) return;
    const p = nailPos(drag.svg, e); if (!p) return;
    drag.last = p;
    drag.pos.setAttribute('transform', `translate(${(p.x * 100).toFixed(1)} ${(p.y * p.L).toFixed(1)}) rotate(${drag.rot})`);
  });
  document.addEventListener('pointercancel', () => { drag = null; });
  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag, app = window.TSUME && window.TSUME.app; drag = null;
    if (!app) return;
    if (d.place) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) { const p = nailPos(d.svg, e); if (p && p.inside) app.act('ed-place', null, p); } return; }
    if (d.moved && d.last) app.act('ed-move', null, { i: d.i, x: d.last.x, y: d.last.y });
    else app.act('ed-select', null, { i: d.i });
  });
})();
