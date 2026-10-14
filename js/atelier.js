/* tsumé — わたしの爪アトリエ: 描いた絵（js/draw.js の保存）をデザインの指にのせる。
   st.custom[デザインの鍵].art[手][指] = 絵の id。描くのは toppings.apply → renderNail（spec.art） */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const SIDES = ['left', 'right', 'foot'];
  const keyOf = st => (st.current ? T.ui.customKey(st.current.conceptId, st.current.paletteIndex) : null);
  /** その指にのっている絵の id（無ければ null） */
  function artOf(st, side, finger) {
    const k = keyOf(st), c = k && st.custom && st.custom[k];
    return (c && c.art && Array.isArray(c.art[side]) && c.art[side][finger]) || null;
  }
  /** 絵を保存して、今のデザインの指にのせる。のせた絵（保存したもの）を返す。デザインが無い・保存できないときは null */
  function attach(st, drawing, side, finger) {
    const k = keyOf(st); if (!k || !SIDES.includes(side) || !(finger >= 0 && finger <= 4)) return null;
    const saved = T.draw.save(Object.assign({}, drawing, { finger })); if (!saved) return null;
    const c = st.custom[k] = st.custom[k] || {};
    c.art = c.art || {};
    if (!Array.isArray(c.art[side]) || c.art[side].length !== 5) c.art[side] = [null, null, null, null, null];
    c.art[side][finger] = saved.id;
    T.app.persist();
    return saved;
  }
  /** 指から外す（絵そのものは消さない） */
  function detach(st, side, finger) {
    const k = keyOf(st), c = k && st.custom[k]; if (!c || !c.art || !Array.isArray(c.art[side])) return false;
    c.art[side][finger] = null;
    if (!c.art[side].some(Boolean)) delete c.art[side];
    if (!Object.keys(c.art).length) delete c.art;
    if (!Object.keys(c).length) delete st.custom[k];
    T.app.persist();
    return true;
  }
  /** どれかのデザインの指にのっている絵の id（保存の整理で消さない） */
  function pinned() {
    const st = T.app && T.app.state, out = new Set();
    Object.values((st && st.custom) || {}).forEach(c => SIDES.forEach(s => ((c && c.art && c.art[s]) || []).forEach(id => { if (id) out.add(id); })));
    return out;
  }
  if (T.draw) T.draw.pinned = pinned;
  T.atelier = Object.assign(T.atelier || {}, { artOf, attach, detach, pinned });
})(typeof window !== 'undefined' ? window : globalThis);
