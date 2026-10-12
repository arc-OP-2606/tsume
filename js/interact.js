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

  // エディタ: パーツをドラッグで動かす／タップで選ぶ／空いている所をタップ（選んでいれば選択を外す・いなければ置く）。
  // 2本の指がほぼ同時（250ms 以内）に触れたら、選んでいるパーツの大きさと角度（ピンチ・ひねり）。
  // ペンで描いている間は指（手のひら）を無視する。動かしている途中に来た2本目の指も無視する
  let drag = null, pinch = null;
  const ptrs = new Map();
  function nailPos(svg, e) {
    const g = svg.querySelector('.tsume-nail'); if (!g) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(g.getScreenCTM().inverse()), L = +svg.dataset.l;
    return { x: q.x / 100, y: q.y / L, L, inside: q.x >= 0 && q.x <= 100 && q.y >= 0 && q.y <= L };
  }
  const clampIn = p => (window.TSUME && TSUME.editor && TSUME.editor.inNail ? TSUME.editor.inNail(p) : { x: Math.min(0.92, Math.max(0.08, p.x)), y: Math.min(0.94, Math.max(0.06, p.y)) });
  const posOf = top => { const pos = top.querySelector('.tsume-top-pos'), tf = pos.getAttribute('transform') || '', m = tf.match(/rotate\(([-\d.]+)/), t = tf.match(/translate\(([-\d.]+)[ ,]+([-\d.]+)/); return { pos, rot: m ? +m[1] : 0, tx: t ? +t[1] : 0, ty: t ? +t[2] : 0 }; };
  const selectedTop = svg => { const st = window.TSUME && TSUME.app && TSUME.app.state, i = st && st.editor ? st.editor.selected : null; return i == null ? null : svg.querySelector(`.tsume-top[data-i="${i}"]`); };
  function startPinch(svg) {
    const top = (drag && drag.top) || selectedTop(svg); if (!top) return false;
    const [a, b] = Array.from(ptrs.values()), st = TSUME.app.state, list = TSUME.editor.listOf(st), it = list[+top.dataset.i]; if (!it) return false;
    const P = posOf(top), z0 = TSUME.editor.scaleOf(it);
    pinch = { svg, top, i: +top.dataset.i, pos: P.pos, tx: P.tx, ty: P.ty, rot0: P.rot, z0, z: z0, r: P.rot, d0: Math.hypot(b.x - a.x, b.y - a.y) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x) };
    if (drag) { drag = null; }
    return true;
  }
  document.addEventListener('pointerdown', e => {
    const stage = e.target.closest && e.target.closest('.ed-stage'); if (!stage || e.target.closest('button, input, label')) return;
    const svg = stage.querySelector('svg.ed-nail'); if (!svg) return;
    const penDown = Array.from(ptrs.values()).some(p => p.type === 'pen');
    if (penDown && e.pointerType === 'touch') return; // ペンを持つ手のひら
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType, t: Date.now() });
    if (ptrs.size === 2) {
      const first = Array.from(ptrs.values())[0], soon = Date.now() - first.t < 250, still = !drag || !drag.moved;
      if (e.pointerType === 'touch' && first.type === 'touch' && (soon || still) && startPinch(svg)) { e.preventDefault(); return; }
      ptrs.delete(e.pointerId); return; // 遅れて来た指・ペンと指の組み合わせは無視
    }
    if (ptrs.size > 2) { ptrs.delete(e.pointerId); return; }
    if (!e.target.closest('svg.ed-nail')) { drag = { svg, place: true, outside: true, x0: e.clientX, y0: e.clientY }; return; }
    e.preventDefault();
    const top = e.target.closest('.tsume-top');
    if (top) {
      const P = posOf(top);
      drag = { svg, top, pos: P.pos, i: +top.dataset.i, x0: e.clientX, y0: e.clientY, moved: false, rot: P.rot };
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    } else drag = { svg, place: true, x0: e.clientX, y0: e.clientY };
  });
  document.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, Object.assign(ptrs.get(e.pointerId), { x: e.clientX, y: e.clientY }));
    if (pinch && ptrs.size === 2) {
      const [a, b] = Array.from(ptrs.values()), d = Math.hypot(b.x - a.x, b.y - a.y), ang = Math.atan2(b.y - a.y, b.x - a.x);
      pinch.z = Math.min(2.2, Math.max(0.5, pinch.z0 * (d / pinch.d0)));
      pinch.r = Math.round((pinch.rot0 + ((ang - pinch.a0) * 180) / Math.PI) % 360);
      pinch.pos.setAttribute('transform', `translate(${pinch.tx} ${pinch.ty}) rotate(${pinch.r}) scale(${(pinch.z / pinch.z0).toFixed(3)})`);
      e.preventDefault(); return;
    }
    if (!drag || drag.place) return;
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) drag.moved = true;
    if (!drag.moved) return;
    const p = nailPos(drag.svg, e); if (!p) return;
    const c = clampIn(p); drag.last = c;
    drag.pos.setAttribute('transform', `translate(${(c.x * 100).toFixed(1)} ${(c.y * p.L).toFixed(1)}) rotate(${drag.rot})`);
  });
  const finish = (e, cancel) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    const app = window.TSUME && TSUME.app;
    if (pinch) { if (ptrs.size === 0) { const p = pinch; pinch = null; if (!cancel && app) app.act('ed-transform', null, { i: p.i, z: p.z, r: p.r }); } return; }
    if (!drag) return;
    const d = drag; drag = null;
    if (cancel || !app) return;
    const tap = Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6;
    if (d.place) {
      if (!tap) return;
      if (app.state.editor && app.state.editor.selected != null) { app.act('ed-deselect', null, {}); return; }
      if (d.outside) return;
      const p = nailPos(d.svg, e); if (p && p.inside) { const c = clampIn(p); app.act('ed-place', null, { x: c.x, y: c.y }); }
      return;
    }
    if (d.moved && d.last) app.act('ed-move', null, { i: d.i, x: d.last.x, y: d.last.y });
    else app.act('ed-select', null, { i: d.i });
  };
  document.addEventListener('pointerup', e => finish(e, false));
  document.addEventListener('pointercancel', e => finish(e, true));
})();
