/* tsumé — design engine: scoring, adaptation, materials, cost, time, steps */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const TIER_ORDER = { coin: 0, petit: 1, kodawari: 2, luxe: 3 };
  const NUDE = '#F1D9CF';

  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const jitter = (key, seed) => ((hashStr(key + '#' + seed) % 1000) / 500) - 1; // -1..1
  const clone = o => JSON.parse(JSON.stringify(o));
  const uniq = a => Array.from(new Set(a));
  const byId = (list, id) => list.find(x => x.id === id) || null;

  function seasonOf(date) {
    const m = (date || new Date()).getMonth() + 1;
    for (const [id, s] of Object.entries(T.SEASONS)) if (s.months.includes(m)) return id;
    return 'autumn';
  }

  function defaults() {
    return { scene: null, tier: 'petit', mood: null, topping: null, length: 'medium', shape: 'oval', scope: 'full', hand: 'right', method: 'gel', time: 't60', level: 'some', color: null, colorName: null };
  }

  // ---- materials
  function matAt(id, tier) {
    const m = T.MATERIALS[id]; if (!m) return null;
    const want = TIER_ORDER[tier] == null ? 1 : TIER_ORDER[tier];
    let best = null;
    for (const t of T.TIERS) if (TIER_ORDER[t] <= want && m.tiers[t]) best = Object.assign({ tier: t }, m.tiers[t]);
    return best;
  }
  function matUpgrade(id, tier) {
    const m = T.MATERIALS[id]; if (!m) return null;
    const cur = TIER_ORDER[tier];
    for (const t of T.TIERS) if (TIER_ORDER[t] > cur && m.tiers[t]) return Object.assign({ tier: t }, m.tiers[t]);
    return null;
  }

  const POLISH_MAP = { color_gel: 'polish_color', sheer_gel: 'polish_sheer', base_gel: 'polish_base', top_gel: 'polish_top', art_gel: 'polish_color', icing_gel: 'polish_top', magnet_gel: 'polish_magnet', glitter: 'polish_glitter', flash_gel: 'polish_glitter', peel_base: 'polish_base', color_base: 'polish_sheer', top_matte: 'polish_top', led_lamp: null };

  const matForMethod = (id, method) => (method === 'polish' && id in POLISH_MAP ? POLISH_MAP[id] : id);
  function techForMethod(tid, method) {
    const t = T.TECHNIQUES[tid]; if (!t) return tid;
    if (method === 'polish') { if (t.polish === true) return tid; if (typeof t.polish === 'string') return t.polish; return 'one_color'; }
    return tid;
  }

  const BASE_TECHS = ['one_color', 'sheer', 'peel_one', 'bare_gloss', 'sugar_matte', 'gradient', 'magnet', 'magnet_line', 'velvet', 'magnet_polish', 'mirror', 'tortoise', 'marble', 'nuance', 'cheek', 'tweed', 'aura', 'butterfly', 'gemstone', 'glitter_polish', 'glass_french', 'french', 'skinny_french'];
  const COLOR_ROLES = { one_color: ['base'], sheer: [], peel_one: ['base'], sugar_matte: ['base'], gradient: ['tip'], french: ['tip'], skinny_french: ['tip'], marble: ['base', 'deep'], tortoise: ['base', 'deep', 'accent'], nuance: ['base', 'accent', 'deep'], cheek: ['accent'], check: ['deep', 'accent'], tweed: ['deep', 'accent'], camellia: ['base', 'accent'], plum: ['accent'], drip: ['base', 'light'], aura: ['accent'], gemstone: ['base'], dots: ['accent'], mizuhiki: ['accent'], flower_paint: ['accent'], ribbon: ['accent'] };

  function specsOf(design) {
    return design.foot ? design.foot : design.left.concat(design.right);
  }
  // 全面シール（SHOP）は絵は模様のまま、作り方・材料・難しさはシールとして数える
  const techsOf = f => (f.cover ? ['sticker_art'] : [f.over, f.t].concat((f.layers || []).map(l => l.t)).filter(Boolean));
  function hexToRgb(h) { h = h.replace('#', ''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function colorDist(a, b) { const A = hexToRgb(a), B = hexToRgb(b); return Math.sqrt((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2) / 441; }
  function paletteDist(pal, hex) { return Math.min(colorDist(pal.base, hex), colorDist(pal.accent, hex) + 0.06, colorDist(pal.tip, hex) + 0.08); }

  function collectMaterials(design, sel) {
    const specs = specsOf(design);
    const ids = [];
    const colorSet = new Set();
    const palette = design.palette;
    const techUsed = [];
    specs.forEach(f => {
      techsOf(f).forEach(tid => {
        const t = T.TECHNIQUES[tid]; if (!t) return;
        techUsed.push(tid);
        t.mats.forEach(m => ids.push(m));
        const roles = COLOR_ROLES[tid] || [];
        roles.forEach(r => { const rr = (f.c && f.c[r]) || r; colorSet.add(palette[rr] || rr); });
      });
    });
    const usesPeel = techUsed.includes('peel_one');
    let list;
    if (sel.method === 'polish') {
      list = ['polish_base', 'polish_top', 'file_set', 'pusher', 'cuticle_oil'].concat(ids.map(i => (i in POLISH_MAP ? POLISH_MAP[i] : i)).filter(Boolean));
    } else {
      list = [usesPeel ? 'peel_base' : 'base_gel', 'top_gel', 'led_lamp', 'file_set', 'pusher', 'cleaner', 'cuticle_oil', 'skin_clip'].concat(ids);
      if (sel.method === 'tip') list = list.concat(['tips', 'tip_tape']);
    }
    if (T.howto) list = list.concat(T.howto.extras(design, sel));
    if (usesPeel) list = list.filter(i => i !== 'base_gel');
    list = uniq(list).filter(i => T.MATERIALS[i]);
    const topQty = {};
    (T.toppings ? T.toppings.materials(design, sel) : []).forEach(m => { topQty[m.id] = m.qty; if (!list.includes(m.id) && T.MATERIALS[m.id]) list.push(m.id); });
    const colorCount = Math.max(1, colorSet.size);
    return list.map(id => {
      const m = T.MATERIALS[id];
      const at = matAt(id, sel.tier);
      const up = matUpgrade(id, sel.tier);
      const qty = Math.max(m.per === 'color' ? colorCount : 1, topQty[id] || 0);
      return { id, name: m.name, cat: m.cat, once: !!m.once, qty, tier: at ? at.tier : null, product: at ? at.p : '', store: at ? at.s : '', price: at ? at.y : 0, subtotal: at ? at.y * qty : 0, fallback: !!(at && at.tier !== sel.tier && TIER_ORDER[at.tier] < TIER_ORDER[sel.tier] && TIER_ORDER[sel.tier] >= 2 && m.tiers[sel.tier] == null && up == null), upgrade: up };
    });
  }

  function costOf(materials) {
    let total = 0, tools = 0;
    materials.forEach(m => { if (m.once) tools += m.subtotal; else total += m.subtotal; });
    return { total, tools, all: total + tools };
  }

  function estimateSpecs(specs, sel) {
    let minutes = 0, difficulty = 1;
    specs.forEach(f => {
      const t = T.TECHNIQUES[f.t], o = f.over ? T.TECHNIQUES[f.over] : null;
      if (t) { minutes += t.m; difficulty = Math.max(difficulty, t.d); }
      if (o) { minutes += o.m * 0.6; difficulty = Math.max(difficulty, Math.min(o.d, 3)); }
      (f.layers || []).forEach(l => { const lt = T.TECHNIQUES[l.t]; if (lt) { minutes += lt.m * 0.8; difficulty = Math.max(difficulty, lt.d); } });
    });
    minutes += sel.method === 'polish' ? 28 : 18; // 準備・硬化/乾燥
    if (sel.method === 'tip') minutes += 15;
    if (T.toppings) { minutes += T.toppings.minutes(specs); difficulty = Math.min(5, difficulty + T.toppings.difficultyBump(specs)); }
    return { minutes: Math.round(minutes), difficulty };
  }
  const TOPPING_MINUTES = { none: 0, one: 2, point: 8, lots: 22 }; // 提案の並べ替え用のおおよそ（両手ぶん）
  function estimate(concept, sel) {
    const specs = concept.fingers.concat(concept.fingers).map(f => ({ t: techForMethod(f.t, sel.method), over: f.over ? techForMethod(f.over, sel.method) : null, layers: (f.layers || []).map(l => ({ t: techForMethod(l.t, sel.method) })) }));
    const est = estimateSpecs(specs, sel);
    if (T.toppings) est.minutes += TOPPING_MINUTES[T.toppings.levelFor(sel)] || 0;
    return est;
  }

  // ---- scoring
  function score(concept, sel, season) {
    let s = 0;
    const fit = sel.scene ? (concept.fit[sel.scene] || 0) : 1.5;
    s += fit * 10;
    if (sel.scene && fit === 0) s -= 10;
    if (sel.mood) { if (concept.moods[0] === sel.mood) s += 12; else if (concept.moods.includes(sel.mood)) s += 7; else s -= 7; }
    if (concept.seasons.includes(season)) s += 5; else if (concept.seasons.includes('all')) s += 2; else s -= 6;
    const scene = byId(T.SCENES, sel.scene);
    const techs = uniq(concept.fingers.flatMap(techsOf));
    if (sel.color) { const d = Math.min(...concept.palettes.map(p => paletteDist(p, sel.color))); s += d < 0.32 ? (0.32 - d) * 110 : -10; }
    if (scene) {
      techs.forEach(t => { if (scene.favor.includes(t)) s += 2; if (scene.avoid.includes(t)) s -= 6; });
      s -= Math.abs(scene.formality - concept.formality) * 1.5;
      if (concept.moods.some(m => scene.moods.includes(m))) s += 3;
    }
    if (concept.shapes && !concept.shapes.includes(sel.shape)) s -= 2;
    if (concept.lengths && !concept.lengths.includes(sel.length)) s -= 2;
    const est = estimate(concept, sel);
    const level = byId(T.LEVELS, sel.level) || T.LEVELS[1];
    if (est.difficulty > level.max) s -= (est.difficulty - level.max) * 6;
    const time = byId(T.TIMES, sel.time) || T.TIMES[1];
    if (est.minutes > time.min) s -= Math.min(14, (est.minutes - time.min) / 8);
    if (sel.method === 'polish') { const subs = techs.filter(t => T.TECHNIQUES[t] && T.TECHNIQUES[t].polish !== true).length; s -= subs * 3; }
    if (sel.scope === 'foot') { if (techs.some(t => ['skinny_french', 'lace', 'mizuhiki', 'ribbon'].includes(t))) s -= 4; }
    return s;
  }

  function paletteIndexFor(concept, sel, seed) {
    const n = concept.palettes.length;
    if (sel.color) { let best = 0, bd = 9; concept.palettes.forEach((p, i) => { const d = paletteDist(p, sel.color); if (d < bd) { bd = d; best = i; } }); return best; }
    if (!seed) return 0;
    return hashStr(concept.id + '@' + seed) % n;
  }

  // ---- build one design from a concept and the selections
  function build(concept, sel, opts) {
    opts = opts || {};
    const season = opts.season || seasonOf(opts.date);
    // 「ことばで咲く」などで作った配色は opts.palette で渡す（paletteIndex は 'k…' の文字列）
    const own = opts.palette && typeof opts.paletteIndex === 'string';
    const pi = own ? opts.paletteIndex : ((opts.paletteIndex == null ? 0 : +opts.paletteIndex || 0) % concept.palettes.length + concept.palettes.length) % concept.palettes.length;
    const palette = Object.assign({ nude: NUDE }, own ? opts.palette : concept.palettes[pi]);
    const scene = byId(T.SCENES, sel.scene);
    let left = clone(concept.fingers), right = clone(concept.right || concept.fingers);
    const notes = [];
    const accent = concept.accent == null ? 3 : concept.accent;

    if (sel.scope === 'accent') {
      [left, right].forEach(arr => arr.forEach((f, i) => { if (i !== accent) arr[i] = { t: 'sheer', c: { base: 'nude' } }; }));
      notes.push('見せ場の指だけデザイン。ほかはヌードのシアーで、手がきれいに見える。');
    } else if (sel.scope === 'asym') {
      right = right.slice().reverse();
      notes.push('右手は並びを逆に。左右で違う、でも同じ物語。');
    }

    let foot = null;
    if (sel.scope === 'foot') {
      const baseSpec = concept.fingers.find((f, i) => i !== accent && !f.over) || concept.fingers[1];
      foot = [clone(concept.fingers[accent]), clone(baseSpec), clone(baseSpec), clone(baseSpec), clone(baseSpec)];
      notes.push('親指に見せ場。ほかの指は面積が小さいので、ベースの色だけ。');
    }

    if (!foot && sel.method !== 'tip' && sel.level !== 'expert') {
      const dominant = sel.hand === 'left' ? left : right;
      const threshold = sel.level === 'first' ? 3 : 4;
      let n = 0;
      dominant.forEach((f, i) => {
        const t = T.TECHNIQUES[f.t]; let g = f;
        if (t && t.easy && t.d >= threshold) { g = Object.assign({}, g, { t: t.easy }); n++; }
        if (g.layers && g.layers.length) { const kept = g.layers.filter(l => { const lt = T.TECHNIQUES[l.t]; return !(lt && lt.d >= threshold); }); if (kept.length !== g.layers.length) n++; g = Object.assign({}, g, { layers: kept }); }
        dominant[i] = g;
      });
      if (n) notes.push(`利き手（${sel.hand === 'left' ? '左' : '右'}手）は描かず、置くだけの簡略版に。`);
    }
    if (sel.method === 'tip') notes.push('チップなら両手とも同じ精度で作れる。利き手の心配はいらない。');

    const subs = [];
    const arrs = foot ? [foot] : [left, right];
    arrs.forEach(arr => arr.forEach((f, i) => {
      const nt = techForMethod(f.t, sel.method);
      if (nt !== f.t) { subs.push(`${T.TECHNIQUES[f.t].name} → ${T.TECHNIQUES[nt].name}`); arr[i] = Object.assign({}, arr[i], { t: nt }); }
      if (f.over) { const no = techForMethod(f.over, sel.method); if (no !== f.over) arr[i] = Object.assign({}, arr[i], { over: no }); }
      if (f.layers) arr[i] = Object.assign({}, arr[i], { layers: f.layers.map(l => { const nl = techForMethod(l.t, sel.method); if (nl !== l.t) subs.push(`${T.TECHNIQUES[l.t].name} → ${T.TECHNIQUES[nl].name}`); return Object.assign({}, l, { t: nl }); }) });
    }));

    const design = { concept, palette, paletteIndex: pi, left, right, foot, notes, subs: uniq(subs), scene, season };
    if (T.toppings) T.toppings.apply(design, sel, opts);
    design.materials = collectMaterials(design, sel);
    design.cost = costOf(design.materials);
    design.est = estimateSpecs(specsOf(design), sel);
    design.salon = salonBand(design);
    design.steps = steps(design, sel);
    return design;
  }

  function salonBand(design) {
    const techs = specsOf(design).flatMap(techsOf);
    if (techs.some(t => /magnet|velvet/.test(t))) return T.SALON.magnet;
    if (techs.some(t => T.TECHNIQUES[t] && T.TECHNIQUES[t].d >= 3)) return T.SALON.art;
    return T.SALON.one_color;
  }

  function steps(design, sel) {
    if (T.howto) return T.howto.steps(design, sel);
    const out = [], polish = sel.method === 'polish';
    out.push({ title: '整える', body: 'エメリーボードで形を作り、ウッドスティックで甘皮を押し上げる。エタノールで油分を拭く。', stage: 0 });
    if (sel.method === 'tip') out.push({ title: 'チップを合わせる', body: '10本ぶんのサイズを選び、根元のカーブをファイルで自分の爪に合わせる。', stage: 0 });
    out.push({ title: polish ? 'ベースコート' : 'ベースジェル', body: polish ? '薄く1度塗り。乾くまで2分。' : '薄く塗って硬化。はみ出しはウッドスティックで拭ってから。', stage: 1 });
    const seen = new Set();
    specsOf(design).forEach(f => techsOf(f).forEach(tid => {
      if (seen.has(tid)) return; seen.add(tid);
      const t = T.TECHNIQUES[tid]; if (!t || tid === 'bare_gloss') return;
      out.push({ title: t.name, body: t.desc + (polish ? '' : ' 硬化してから次へ。'), stage: BASE_TECHS.includes(tid) ? 2 : 3, tid });
    }));
    if (T.toppings && specsOf(design).some(f => (f.toppings || []).length)) out.push(T.toppings.stepFor(sel));
    out.push({ title: polish ? 'トップコート' : 'トップジェル', body: polish ? '厚めに1度。完全に乾くまで20分、何も触らない。' : 'パーツを包むように厚めに。硬化後、未硬化があれば拭き取る。', stage: 5 });
    out.push({ title: '仕上げ', body: 'ネイルオイルを甘皮にひとさし。', stage: 5 });
    return out;
  }

  /** 手順 k の時点の爪（0 = 整えただけ）。トップの前はツヤ無し */
  function specAtStep(spec, list, k) {
    const at = tid => list.findIndex(s => s.tid === tid), has = tid => !!tid && at(tid) !== -1 && at(tid) <= k;
    const baseIdx = list.findIndex(s => s.stage === 1), topIdx = list.findIndex(s => s.stage === 5), topI = at('topping');
    if (k < baseIdx) return { t: 'bare_gloss', p: { matte: true } };
    // 全面シールは「シールを貼る」手順（sticker_art）で模様ごと現れる
    if (spec.cover) {
      const toppings = topI !== -1 && k >= topI ? (spec.toppings || []) : [];
      return has('sticker_art') ? { t: spec.t, c: spec.c, p: Object.assign({}, spec.p, { matte: k < topIdx }), layers: [], toppings } : { t: 'bare_gloss', p: { matte: false }, layers: [], toppings };
    }
    let base = null, art = null;
    if (spec.over) { base = has(spec.over) ? spec.over : null; art = has(spec.t) ? spec.t : null; }
    else if (BASE_TECHS.includes(spec.t)) base = has(spec.t) ? spec.t : null;
    else art = has(spec.t) ? spec.t : null;
    const layers = (spec.layers || []).filter(l => has(l.t)), toppings = topI !== -1 && k >= topI ? (spec.toppings || []) : [];
    if (!base && !art) return { t: 'bare_gloss', p: { matte: false }, layers, toppings };
    const out = { t: art || base, c: spec.c, p: Object.assign({}, spec.p, { matte: k < topIdx }), layers, toppings };
    if (art && base) out.over = base;
    return out;
  }
  function changedAtStep(specs, list, k) {
    const key = (f, j) => JSON.stringify(j < 0 ? null : specAtStep(f, list, j));
    return specs.map((f, i) => (key(f, k) !== key(f, k - 1) ? i : -1)).filter(i => i >= 0);
  }

  // ---- propose: roles 本命 / 冒険 / 時短 / ご褒美 / 定番
  function propose(sel, opts) {
    opts = opts || {};
    const season = opts.season || seasonOf(opts.date);
    const seed = opts.seed || 0;
    const scored = T.CONCEPTS.map(c => ({ c, s: score(c, sel, season) + (seed ? jitter(c.id, seed) * 6 : 0) }));
    scored.sort((a, b) => b.s - a.s);
    const top = scored[0] ? scored[0].s : 0;
    const used = new Set();
    const picks = [];
    const take = (pred, role, label, hint) => {
      const hit = scored.find(x => !used.has(x.c.id) && pred(x));
      if (hit) { used.add(hit.c.id); picks.push({ concept: hit.c, score: hit.s, role, label, hint }); }
    };
    take(() => true, 'honmei', '本命', 'このシチュエーションに、いちばん合う。');
    { // 冒険: 上位圏内で最も独創的なもの
      const cands = scored.filter(x => !used.has(x.c.id) && x.c.originality >= 4 && x.s > top - 34).sort((a, b) => (b.c.originality - a.c.originality) || (b.s - a.s));
      if (cands[0]) { used.add(cands[0].c.id); picks.push({ concept: cands[0].c, score: cands[0].s, role: 'bouken', label: '冒険', hint: '誰とも被らない。少しだけ勇気がいる。' }); }
    }
    take(x => estimate(x.c, sel).minutes <= 46 && x.s > top - 40, 'jitan', '時短', '45分以内で終わる。');
    if (TIER_ORDER[sel.tier] >= 2) take(x => x.c.minTier === 'coin' && x.s > top - 30 && build(x.c, sel, { season }).materials.some(m => m.tier === sel.tier), 'gohoubi', 'ご褒美', 'この予算でしか出せない素材で。');
    take(x => x.c.originality <= 2 && x.s > top - 30, 'teiban', '定番', '外さない。迷ったらこれ。');
    while (picks.length < 4 && picks.length < scored.length) take(() => true, 'other', 'もうひとつ', '');
    return picks.map(p => Object.assign(p, { design: build(p.concept, sel, { season, paletteIndex: paletteIndexFor(p.concept, sel, seed) }) }));
  }

  function situation(sel, season) {
    const scene = byId(T.SCENES, sel.scene);
    const s = T.SEASONS[season];
    const parts = [];
    parts.push(scene ? `${s.name}の${scene.name}` : `${s.name}の指先`);
    parts.push(`${(byId(T.LENGTHS, sel.length) || {}).name || ''}${(byId(T.SHAPES, sel.shape) || {}).name || ''}`);
    if (sel.mood) parts.push((byId(T.MOODS, sel.mood) || {}).name);
    if (sel.color) parts.push((sel.colorName || '') + 'の色から');
    parts.push((T.TIER_INFO[sel.tier] || {}).label);
    const light = scene ? T.LIGHTS[scene.light] : T.LIGHTS.daylight;
    return { name: parts.filter(Boolean).join('・'), scene, season: s, seasonId: season, light, tips: scene ? scene.tips : ['シーンを選ぶと、その場のマナーと光に合わせます。'] };
  }

  function recipeText(design, sel) {
    const L = [];
    L.push(`${design.concept.name}（${design.palette.name}）`);
    L.push(design.concept.story);
    const names = T.FINGER_NAMES;
    const hands = design.foot ? [['足', design.foot]] : [['左手', design.left], ['右手', design.right]];
    hands.forEach(([h, arr]) => { L.push(`■ ${h}`); arr.forEach((f, i) => { const t = f.cover ? { name: 'ネイルシール' } : T.TECHNIQUES[f.t]; const o = f.over ? T.TECHNIQUES[f.over] : null; const ls = (f.layers || []).map(l => (T.TECHNIQUES[l.t] || {}).name).filter(Boolean); const tp = (f.toppings || []).length && T.toppings ? T.toppings.summary([f]) : ''; L.push(`${names[i]}: ${t ? t.name : f.t}${o ? '（下地 ' + o.name + '）' : ''}${ls.length ? ' ＋ ' + ls.join('＋') : ''}${tp ? ' ／ トッピング: ' + tp : ''}`); }); });
    L.push('■ 材料');
    design.materials.forEach(m => L.push(`${m.name} × ${m.qty}: ${m.product}（${m.store}）約${m.subtotal.toLocaleString()}円${m.once ? ' ※道具' : ''}`));
    L.push(`材料 約${design.cost.total.toLocaleString()}円 / 道具 約${design.cost.tools.toLocaleString()}円`);
    L.push(`目安 ${design.est.minutes}分・難易度 ${design.est.difficulty}/5`);
    L.push('価格は2026年10月の調査に基づく目安です。');
    void sel;
    return L.join('\n');
  }

  global.TSUME = Object.assign(global.TSUME, { engine: { seasonOf, defaults, matAt, matUpgrade, techForMethod, matForMethod, score, build, propose, estimate, situation, recipeText, specsOf, techsOf, colorDist, TIER_ORDER, BASE_TECHS, specAtStep, changedAtStep } });
})(typeof window !== 'undefined' ? window : globalThis);
