/* tsumé — トッピングの自動提案・量の上限・材料・時間・手順 */
(function (global) {
  'use strict';
  const T = global.TSUME, D = T.TOPPINGS;
  const LV = D.LEVELS.map(l => l.id);
  const clone = o => JSON.parse(JSON.stringify(o));
  // デザイン自体にパーツがある指には足さない
  const PART_TECHS = ['stones_accent', 'pearls_tip', 'studs', 'turtle_gold', 'star_parts', 'starfish', 'brion_line', 'pixie', 'moon_gold'];
  const METALLIC = ['mirror', 'mirror_french', 'gold_leaf', 'gold_edge'];
  function hsl(hex) {
    const n = parseInt(String(hex || '#CCCCCC').replace('#', ''), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    if (!d) return { h: 0, s: 0, l };
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
    return { h, s: d / (1 - Math.abs(2 * l - 1)), l };
  }
  const ruleOf = scene => (scene && D.SCENE_RULES[scene]) || D.NO_SCENE_RULE;
  function levelFor(sel) { const r = ruleOf(sel.scene), want = sel.topping || r.def; return r.cap && LV.indexOf(want) > LV.indexOf(r.cap) ? r.cap : want; }
  const capNote = sel => ruleOf(sel.scene).note || null;
  const metalOf = pal => { const m = hsl(pal.metal); if (m.s < 0.15) return 'silver'; if ((m.h < 22 || m.h > 340) && m.l > 0.55) return 'rose'; return 'gold'; };
  function stoneOf(pal, metal) {
    const b = hsl(pal.base);
    if (b.l < 0.32) return metal === 'silver' ? 'clear' : 'champagne';
    if (b.h > 185 && b.h < 255 && b.s > 0.18) return 'blue';
    if ((b.h < 18 || b.h > 318) && b.s > 0.3 && b.l > 0.5 && b.l < 0.86) return 'pink';
    if (b.l > 0.8) return 'aurora';
    return metal === 'gold' ? 'champagne' : 'clear';
  }
  const pearlOf = pal => { const b = hsl(pal.base); if ((b.h < 18 || b.h > 318) && b.s > 0.25) return 'pink'; return b.h > 25 && b.h < 60 ? 'cream' : 'white'; };
  function bijouOf(pal) { const a = hsl(pal.accent); if (a.l < 0.25) return 'black'; if (a.h > 90 && a.h < 170) return 'emerald'; if (a.h > 190 && a.h < 260) return 'sapphire'; if (a.h < 15 || a.h > 340) return a.l > 0.6 ? 'rose' : 'ruby'; return 'clear'; }
  function item(kind, pal, at) {
    const o = { k: kind.k, x: at.x, y: at.y, s: at.s || 'M' };
    if (kind.shape) o.shape = kind.shape;
    if (o.k === 'stone') o.v = stoneOf(pal, metalOf(pal));
    else if (o.k === 'pearl') o.v = pearlOf(pal);
    else if (o.k === 'bijou') o.v = bijouOf(pal);
    else if (o.k === 'flower3d') o.v = 'white';
    else o.v = metalOf(pal);
    if (o.k === 'stud' && !o.shape) o.shape = 'round';
    if (o.k === 'chain') o.r = -28;
    if (D.KINDS[o.k].big && o.s === 'S') o.s = 'M';
    return o;
  }
  const layout = (name, kinds, pal) => D.LAYOUTS[name].items.map((at, i) => item(kinds[Math.min(i, kinds.length - 1)], pal, at));
  function plan(specs, pal, o) {
    const out = specs.map(f => Object.assign({}, f, { toppings: [] }));
    const level = o.level, rule = ruleOf(o.scene);
    if (level === 'none') return out;
    // 大きいパーツを控えるシーンでは、どの役（主・脇・大）でもストーンに替える
    let [main, sub, big] = (D.MOOD_KINDS[o.mood] || D.MOOD_KINDS.sheer).map(k => (rule.noBig && D.KINDS[k.k].big ? { k: 'stone' } : k));
    if (rule.flat) main = sub = big = { k: 'stone' };
    const accent = o.accent == null ? 3 : o.accent;
    const others = [2, 1, 0, 4, 3].filter(i => i !== accent); // アクセント以外の指を、目立つ順に
    const busy = i => [out[i].t, out[i].over].concat((out[i].layers || []).map(l => l.t)).some(t => PART_TECHS.includes(t));
    const put = (i, list) => {
      if (!out[i] || busy(i) || (o.onlyAccent && i !== accent)) return;
      const shiny = [out[i].t, out[i].over].some(t => METALLIC.includes(t));
      out[i].toppings = list.map(x => (shiny && x.k === 'stone' && x.v === 'champagne') ? Object.assign(x, { v: 'clear' }) : x);
    };
    const notBig = k => (D.KINDS[k.k].big ? { k: 'stone' } : k);
    const small = k => (k.k === 'charm' || k.k === 'chain' ? { k: 'stone' } : k);
    if (level === 'one') put(accent, layout('one', [main], pal).map(x => (rule.flat ? Object.assign(x, { s: 'S' }) : x)));
    else if (level === 'point') { put(accent, layout('cluster', [main, sub, sub], pal).map((x, j) => Object.assign(x, { s: j ? 'M' : 'L' }))); put(others[0], layout('one', [sub], pal)); }
    else {
      put(accent, layout('cluster', [big, main, main], pal));
      put(others[0], layout('three', [notBig(main)], pal));
      put(others[1], layout('tipline', [small(sub)], pal));
      put(others[2], layout('one', [notBig(main)], pal));
      put(others[3], layout('one', [sub.k === 'charm' || sub.k === 'chain' ? { k: 'pearl' } : sub], pal).map(x => Object.assign(x, { s: 'S' })));
    }
    return out;
  }
  /** design に toppings を入れる。opts.toppings（自分で飾った内容）があれば自動より優先。paint（SHOPで選んだ塗り）はその指の技法と色を置き換える */
  function apply(design, sel, opts) {
    const custom = opts && opts.toppings, level = levelFor(sel);
    const mood = sel.mood || (design.concept.moods || [])[0];
    const accent = design.concept.accent == null ? 3 : design.concept.accent;
    (design.foot ? ['foot'] : ['left', 'right']).forEach(side => {
      const specs = design[side], paint = custom && custom.paint && custom.paint[side];
      if (paint) specs.forEach((f, i) => { const pt = paint[i]; if (pt) specs[i] = Object.assign({}, f, { t: pt.cover ? pt.t : T.engine.techForMethod(pt.t, sel.method), c: Object.assign({}, pt.c), p: {}, over: undefined, layers: [], shop: pt.shop, cover: !!pt.cover }); });
      if (custom && custom[side]) { specs.forEach((f, i) => { specs[i] = Object.assign({}, specs[i], { toppings: clone(custom[side][i] || []) }); }); return; }
      plan(specs, design.palette, { level, mood, scene: sel.scene, accent: side === 'foot' ? 0 : accent, onlyAccent: sel.scope === 'accent' || side === 'foot' }).forEach((f, i) => { specs[i] = f; });
    });
    design.topping = { level, note: capNote(sel), custom: !!custom };
  }
  const specsOf = d => (d.foot ? d.foot : d.left.concat(d.right));
  // 同じ種類・色・形は1袋として数える
  function materials(design, sel) {
    const byMat = {};
    specsOf(design).forEach(f => (f.toppings || []).forEach(t => { const m = D.KINDS[t.k].mat; (byMat[m] = byMat[m] || new Set()).add(t.v + ':' + (t.shape || '')); }));
    const out = Object.keys(byMat).map(id => ({ id, qty: byMat[id].size }));
    if (out.length) { out.push({ id: 'tweezers', qty: 1 }); if (sel.method === 'polish') out.push({ id: 'nail_glue', qty: 1 }); }
    return out;
  }
  const minutes = specs => specs.reduce((n, f) => n + (f.toppings || []).reduce((m, t) => m + D.KINDS[t.k].minutes, 0), 0);
  function difficultyBump(specs) { const all = specs.flatMap(f => f.toppings || []); return all.some(t => D.KINDS[t.k].big) || all.length >= 8 ? 1 : 0; }
  function stepFor(sel) {
    const body = sel.method === 'polish'
      ? 'ネイルグルーを米粒ほど置き、ピンセットでパーツをのせて10秒押さえる。トップコートはパーツのまわりだけに。'
      : 'パーツを置く場所にトップジェルを少しのせ、ピンセットで置いて硬化。ストーンの表面にはトップを塗らず、まわりだけ固める。大きいパーツは周りをジェルで囲んでもう一度硬化。';
    return { title: 'トッピング', body, stage: 4, tid: 'topping' };
  }
  function itemName(t) {
    if (t.k === 'sticker') return (D.STICKERS[t.v] || { name: '' }).name + 'のシール';
    if (t.k === 'flake') return 'ホログラム';
    if (t.k === 'stone') return (D.STONES[t.v] || D.STONES.clear).name + 'ストーン';
    if (t.k === 'charm') return (D.METALS[t.v] || D.METALS.gold).name + 'の' + (D.CHARMS[t.shape] || D.CHARMS.star).name;
    if (t.k === 'bijou') return (D.BIJOUX[t.v] || D.BIJOUX.clear).name + 'のビジュー';
    return D.KINDS[t.k].name;
  }
  const summary = specs => Array.from(new Set(specs.flatMap(f => (f.toppings || []).map(itemName)))).join('・');
  /** 図鑑・シート用の名前（色・形まで言う） */
  function fullName(t) {
    const metal = (D.METALS[t.v] || D.METALS.gold).name;
    if (t.k === 'pearl') return (D.PEARLS[t.v] || D.PEARLS.white).name + 'パール';
    if (t.k === 'bullion') return metal + 'のブリオン';
    if (t.k === 'stud') return metal + 'の' + (D.STUDS[t.shape] || D.STUDS.round).name + 'スタッズ';
    if (t.k === 'flower3d') return (D.FLOWERS[t.v] || D.FLOWERS.white).name + 'の3Dフラワー';
    if (t.k === 'chain') return metal + 'のチェーン';
    return itemName(t);
  }
  T.toppings = { levelFor, capNote, plan, apply, materials, minutes, difficultyBump, stepFor, itemName, fullName, summary };
})(typeof window !== 'undefined' ? window : globalThis);
