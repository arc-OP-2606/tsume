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

  // SHOP: トレイのアイテムを爪までドラッグ。タッチは上へ引くとドラッグ（横はトレイのスクロール）、マウスは少し動かすとドラッグ。
  // ドラッグのあとに来る click は捨てる（タップの「今の指にのせる」と二重にならないように）
  let dnd = null, swallowUntil = 0;
  const clearDrop = () => document.querySelectorAll('.drop-on').forEach(x => x.classList.remove('drop-on'));
  const endDnd = () => { if (dnd && dnd.ghost) dnd.ghost.remove(); document.body.classList.remove('dragging'); clearDrop(); dnd = null; };
  document.addEventListener('pointerdown', e => {
    if (dnd && dnd.ghost) return; // ドラッグ中の2本目の指は無視
    const it = e.target.closest && e.target.closest('[data-drag="shop"]');
    dnd = it && e.isPrimary && e.button === 0 ? { el: it, id: it.dataset.id, x0: e.clientX, y0: e.clientY, pid: e.pointerId, mouse: e.pointerType === 'mouse', ghost: null } : null;
  });
  document.addEventListener('pointermove', e => {
    if (!dnd || e.pointerId !== dnd.pid) return;
    if (dnd.mouse && !(e.buttons & 1)) { endDnd(); return; }
    const dx = e.clientX - dnd.x0, dy = e.clientY - dnd.y0;
    if (!dnd.ghost) {
      if (dnd.mouse ? Math.hypot(dx, dy) < 8 : !(dy < -10 && Math.abs(dy) > Math.abs(dx))) return;
      const g = document.createElement('div'); g.className = 'drag-ghost'; g.innerHTML = dnd.el.querySelector('.si-art').innerHTML;
      document.body.appendChild(g); dnd.ghost = g; document.body.classList.add('dragging');
      try { dnd.el.setPointerCapture(e.pointerId); } catch (err) {}
    }
    e.preventDefault();
    dnd.ghost.style.transform = `translate(${e.clientX - 34}px, ${e.clientY - 52}px)`;
    clearDrop();
    const t = document.elementFromPoint(e.clientX, e.clientY), target = t && (t.closest('.ed-stage') || t.closest('.ed-finger'));
    if (target) target.classList.add('drop-on');
  });
  document.addEventListener('pointerup', e => {
    if (!dnd || e.pointerId !== dnd.pid) return;
    if (!dnd.ghost) { dnd = null; return; }
    const id = dnd.id; endDnd(); swallowUntil = Date.now() + 400;
    const t = document.elementFromPoint(e.clientX, e.clientY), app = window.TSUME && TSUME.app;
    const finger = t && t.closest('.ed-finger'), stage = t && t.closest('.ed-stage');
    if (finger) app.act('shop-drop', null, { id, finger: +finger.dataset.i });
    else if (stage) { const svg = stage.querySelector('svg.ed-nail'), p = svg && nailPos(svg, e); app.act('shop-drop', null, { id, pos: p && p.inside ? { x: p.x, y: p.y } : null }); }
  });
  document.addEventListener('pointercancel', e => { if (dnd && e.pointerId === dnd.pid) endDnd(); });
  ['contextmenu', 'lostpointercapture'].forEach(t => document.addEventListener(t, () => { if (dnd) endDnd(); }, true));
  window.addEventListener('blur', () => { if (dnd) endDnd(); });
  document.addEventListener('click', e => { if (Date.now() < swallowUntil && e.target.closest && e.target.closest('[data-drag="shop"]')) { e.stopPropagation(); e.preventDefault(); } }, true);

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
