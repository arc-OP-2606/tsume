/* tsumé — 6つの質問。どの質問も「選ぶと自動で次へ」。答えるまでは何も選ばれていない表示 */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  const { esc, ICON, byId } = U;
  const STEPS = [
    { id: 'scene', title: 'きょうは、どんな日？', parts: ['scene'] },
    { id: 'tier', title: '材料にかけるのは？', parts: ['tier'] },
    { id: 'mood', title: 'どんな気分？ 飾りは？', parts: ['mood', 'topping'] },
    { id: 'nail', title: '爪の長さと形', parts: ['length', 'shape'] },
    { id: 'scope', title: 'どこまで塗る？', parts: ['scope', 'hand'] },
    { id: 'method', title: 'やり方と、時間', parts: ['method', 'time', 'level'] },
  ];
  const DEFAULT_OF = { scene: null, mood: null, topping: null };
  const required = (step, sel) => step.parts.filter(k => !(k === 'hand' && sel.scope === 'foot'));
  const isDone = (i, st) => required(STEPS[i], st.sel).every(k => st.answered[k]);
  const nextOpen = st => STEPS.findIndex((s, i) => !isDone(i, st));
  let timer = null;
  function advance(st) {
    clearTimeout(timer);
    const at = st.step;
    timer = setTimeout(() => {
      if (st.view !== 'steps' || st.step !== at) return; // 待っている間に別の画面へ移ったら進めない
      const n = nextOpen(st); if (n === -1) T.app.go('proposals'); else T.app.go('steps', { step: n });
    }, 280);
  }

  // ---- 答えた内容の短い表示（上のチップ・提案の条件）
  const levelName = id => (byId(T.TOPPINGS.LEVELS, id) || {}).name;
  function answerLabel(i, st) {
    const s = st.sel, a = st.answered;
    switch (STEPS[i].id) {
      case 'scene': return a.scene ? (s.scene ? byId(T.SCENES, s.scene).name : 'シーンおまかせ') : null;
      case 'tier': return a.tier ? T.TIER_INFO[s.tier].label : null;
      case 'mood': return a.mood || a.topping ? [s.mood ? byId(T.MOODS, s.mood).name : (a.mood ? 'ムードおまかせ' : ''), a.topping ? '飾り' + (s.topping ? levelName(s.topping) : 'おまかせ') : ''].filter(Boolean).join('・') : null;
      case 'nail': return a.length || a.shape ? `${byId(T.LENGTHS, s.length).name}・${byId(T.SHAPES, s.shape).name}` : null;
      case 'scope': return a.scope ? byId(T.SCOPES, s.scope).name + (s.scope !== 'foot' && a.hand ? `・${byId(T.HANDS, s.hand).name}` : '') : null;
      case 'method': return a.method ? `${byId(T.METHODS, s.method).name}・${byId(T.TIMES, s.time).name}` : null;
    }
    return null;
  }

  // ---- 選択肢
  const pressed = (st, key, val) => !!st.answered[key] && String(st.sel[key]) === String(val);
  const opt = (st, key, val, inner, cls) => `<button class="opt ${cls || ''}" data-act="pick" data-key="${key}" data-val="${esc(val)}" aria-pressed="${pressed(st, key, val)}">${inner}<span class="check">${ICON.check}</span></button>`;
  const label = (n, text) => `<div class="q-label"><span class="latin">${n}</span>${esc(text)}</div>`;
  const P0 = { base: '#F3E8E4', tip: '#C8A96A', accent: '#C9808A', deep: '#7A6B6F', light: '#FFFFFF', metal: '#C8A96A' };

  const sceneCache = {};
  function sceneMini(sceneId, season) {
    const key = sceneId + '@' + season;
    if (!sceneCache[key]) {
      const top = E.propose(Object.assign(E.defaults(), { scene: sceneId, level: 'expert' }), { season, seed: 0 })[0];
      const d = top.design;
      sceneCache[key] = [3, 2, 1].map(f => `<span>${T.renderSwatch(d.left[f], d.palette, { shape: 'oval', length: 'medium', seed: 70, finger: f })}</span>`).join('');
    }
    return sceneCache[key];
  }

  function bodyScene(st) {
    const group = st.sceneGroup;
    const cards = T.SCENES.filter(x => x.group === group).map(x => opt(st, 'scene', x.id, `<span class="scene-mini" aria-hidden="true">${sceneMini(x.id, st.season)}</span><span class="t">${esc(x.name)}</span><span class="d">${esc(x.short)}</span>`, 'scene')).join('');
    return `${U.seg([{ id: 'daily', name: 'いつもの日' }, { id: 'special', name: '特別な日' }], 'scenegroup', group, 'aria-label="日の種類"')}<div class="opt-grid">${cards}</div>`;
  }
  function bodyTier(st) {
    const cards = T.TIERS.map((t, i) => { const info = T.TIER_INFO[t]; const coins = Array.from({ length: 4 }, (_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join(''); return opt(st, 'tier', t, `<span class="tier-text"><span class="t">${esc(info.label)}</span><span class="d">${esc(info.desc)}</span></span><span class="tier-side"><span class="r latin">${esc(info.range)}</span><span class="coins" aria-hidden="true">${coins}</span></span>`, 'tier'); }).join('');
    const sa = T.MATERIALS.stone_accent.tiers, nail = { t: 'glass_french', toppings: T.TOPPINGS.LAYOUTS.cluster.items.map((it, j) => Object.assign({ k: 'stone', v: 'aurora' }, it, { s: j ? 'S' : 'M' })) }, pal = Object.assign({}, P0, { base: '#F6EDE9', tip: '#E2C3C1' });
    const one = t => `<div class="cmp-one"><span class="cmp-nail">${T.renderSwatch(nail, pal, { shape: 'oval', length: 'medium', seed: 9 })}</span><span class="cmp-text">${esc(t.p)}<br>${esc(t.s)}・約${t.y.toLocaleString()}円</span></div>`;
    return `<div class="opt-grid one">${cards}</div><div class="cmp"><div class="cmp-head">同じデザインのまま、ストーンだけが入れ替わる</div><div class="cmp-row">${one(sa.coin)}<span class="cmp-arrow" aria-hidden="true">${ICON.chev}</span>${one(sa.luxe)}</div></div>`;
  }
  function bodyMood(st) {
    const pal = sw => Object.assign({}, P0, sw.c || {});
    const moods = T.MOODS.map(m => opt(st, 'mood', m.id, `<span class="sw">${T.renderSwatch(m.swatch, pal(m.swatch), { shape: 'almond', length: 'long', seed: 5 })}</span><span class="t">${esc(m.name)}</span>`, 'center mood')).join('');
    const L = T.TOPPINGS.LAYOUTS, base = { t: 'glass_french' }, gp = Object.assign({}, P0, { base: '#F6EDE9', tip: '#E2C3C1' });
    const tops = { none: [], one: L.one.items.map(it => Object.assign({ k: 'stone', v: 'aurora' }, it)), point: L.cluster.items.map((it, j) => Object.assign({ k: j ? 'stone' : 'pearl', v: j ? 'aurora' : 'white' }, it)), lots: L.tipline.items.concat(L.cluster.items).map(it => Object.assign({ k: 'stone', v: 'aurora' }, it)) };
    const amount = T.TOPPINGS.LEVELS.map(l => opt(st, 'topping', l.id, `<span class="sw">${T.renderSwatch(Object.assign({}, base, { toppings: tops[l.id] }), gp, { shape: 'oval', length: 'medium', seed: 9 })}</span><span class="t">${esc(l.name)}</span>`, 'center amount')).join('');
    const note = T.toppings.capNote(st.sel);
    return `${label(1, 'ムード')}<div class="opt-grid three">${moods}</div>${label(2, '飾り（トッピング）の量')}<div class="opt-grid four">${amount}</div>${note ? `<p class="cap-note">${esc(note)}</p>` : ''}`;
  }
  function bodyNail(st) {
    const lengths = T.LENGTHS.map(l => opt(st, 'length', l.id, `${T.renderShapeIcon(st.answered.shape ? st.sel.shape : 'oval', l.id)}<span class="t">${esc(l.name)}</span><span class="d">${esc(l.desc)}</span>`, 'center shape')).join('');
    const shapes = T.SHAPES.map(sh => opt(st, 'shape', sh.id, `${T.renderShapeIcon(sh.id, st.answered.length ? st.sel.length : 'medium')}<span class="t">${esc(sh.name)}</span><span class="d">${esc(sh.desc)}</span>`, 'center shape')).join('');
    return `${label(1, '長さ')}<div class="opt-grid three">${lengths}</div>${label(2, '形')}<div class="opt-grid three">${shapes}</div>`;
  }
  function bodyScope(st) {
    const scopes = T.SCOPES.map(sc => opt(st, 'scope', sc.id, `<span class="t">${esc(sc.name)}</span><span class="d">${esc(sc.desc)}</span>`)).join('');
    const hands = st.sel.scope === 'foot' ? '' : `${label(2, '利き手')}<p class="q-note">利き手側は、描かずに置くだけの簡単な作り方にします。</p><div class="opt-grid">${T.HANDS.map(h => opt(st, 'hand', h.id, `<span class="t">${esc(h.name)}</span>`)).join('')}</div>`;
    return `${label(1, 'どこまで')}<div class="opt-grid">${scopes}</div>${hands}`;
  }
  function bodyMethod(st) {
    const methods = T.METHODS.map(m => opt(st, 'method', m.id, `<span class="t">${esc(m.name)}</span><span class="d">${esc(m.desc)}</span>`)).join('');
    const times = T.TIMES.map(t => opt(st, 'time', t.id, `<span class="t">${esc(t.name)}</span>`, 'center')).join('');
    const levels = T.LEVELS.map(l => opt(st, 'level', l.id, `<span class="t">${esc(l.name)}</span>`, 'center')).join('');
    return `${label(1, 'やり方')}<div class="opt-grid three">${methods}</div>${label(2, '使える時間')}<div class="opt-grid three">${times}</div>${label(3, 'セルフネイルの経験')}<div class="opt-grid three">${levels}</div>`;
  }
  const BODIES = { scene: bodyScene, tier: bodyTier, mood: bodyMood, nail: bodyNail, scope: bodyScope, method: bodyMethod };

  T.views.steps = st => {
    const i = Math.max(0, Math.min(STEPS.length - 1, st.step)), step = STEPS[i];
    const req = required(step, st.sel);
    const instr = req.length === 1 ? '選ぶと、すぐ次へ進みます。' : `${req.length}つ選ぶと、次へ進みます。`;
    const answers = STEPS.map((s, j) => (j < i ? answerLabel(j, st) : null)).map((t, j) => (t ? `<button class="chip done" data-act="step" data-n="${j}">${esc(t)}</button>` : '')).join('');
    const omakase = i === 0 ? '決めずに、おまかせで進む' : 'おまかせで進む';
    return `<header class="qbar"><button class="iconbtn" data-act="back" aria-label="戻る">${ICON.back}</button>${U.progress(i + 1, STEPS.length)}</header>
      <section class="q" data-step="${step.id}">
        ${answers ? `<div class="answers">${answers}</div>` : ''}
        <h1 class="q-title">${esc(step.title)}</h1>
        <p class="q-sub">${instr}</p>
        ${BODIES[step.id](st)}
        <div class="q-foot"><button class="btn ghost omakase" data-act="omakase">${omakase}</button>${i > 0 ? '<button class="link" data-act="skiprest">残りはおまかせで提案を見る</button>' : ''}</div>
      </section>`;
  };

  Object.assign(T.actions, {
    start: (el, st) => { T.app.go('steps', { step: 0 }); },
    step: (el, st) => { T.app.go('steps', { step: +el.dataset.n }); },
    scenegroup: (el, st) => { st.sceneGroup = el.dataset.v; T.app.render(); },
    pick: (el, st) => {
      const key = el.dataset.key, val = el.dataset.val;
      st.sel[key] = val; st.answered[key] = true; st.seed = 0;
      if (key === 'scope' && val === 'foot' && !st.answered.hand) { st.answered.hand = true; st.handAuto = true; }
      if (key === 'scope' && val !== 'foot' && st.handAuto) { st.answered.hand = false; st.handAuto = false; }
      if (key === 'hand') st.handAuto = false;
      T.app.render();
      if (isDone(st.step, st)) advance(st); else clearTimeout(timer);
    },
    omakase: (el, st) => {
      required(STEPS[st.step], st.sel).forEach(k => { if (!st.answered[k]) { if (k in DEFAULT_OF) st.sel[k] = DEFAULT_OF[k]; st.answered[k] = true; } });
      clearTimeout(timer);
      const n = nextOpen(st); if (n === -1) T.app.go('proposals'); else T.app.go('steps', { step: n });
    },
    skiprest: (el, st) => { STEPS.forEach(s => s.parts.forEach(k => { if (!st.answered[k]) st.answered[k] = true; })); clearTimeout(timer); T.app.go('proposals'); },
  });
  T.STEPS = STEPS;
})(typeof window !== 'undefined' ? window : globalThis);
