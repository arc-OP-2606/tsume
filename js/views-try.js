/* tsumé — 試着ステージ（はじめの画面）。大きな手に着せ替え、飾りの量、肌の色 */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  let cache = { key: null, list: [] };

  function featured(season) {
    const d = new Date();
    const fitting = T.CONCEPTS.filter(c => c.seasons.includes(season) || c.seasons.includes('all'));
    return fitting[(d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % fitting.length];
  }
  /** 今月の一枚 ＋ ムードごとの1位（重複なし） */
  function tryPicks(season) {
    if (cache.key === season) return cache.list;
    const used = new Set(), list = [];
    const f = featured(season);
    list.push({ id: f.id, label: `${new Date().getMonth() + 1}月の一枚` }); used.add(f.id);
    T.MOODS.forEach(m => {
      const p = E.propose(Object.assign(E.defaults(), { mood: m.id, level: 'expert' }), { season }).find(x => !used.has(x.concept.id));
      if (p) { used.add(p.concept.id); list.push({ id: p.concept.id, label: m.name }); }
    });
    cache = { key: season, list };
    return list;
  }
  const trySel = (c, st) => Object.assign(E.defaults(), { level: 'expert', topping: st.tryAmount, mood: c.moods[0], shape: (c.shapes && c.shapes[0]) || 'oval', length: 'medium' });
  function current(st) {
    const list = tryPicks(st.season), pick = list[st.tryPick] || list[0];
    const concept = U.byId(T.CONCEPTS, pick.id), sel = trySel(concept, st);
    return { pick, concept, sel, design: E.build(concept, sel, { season: st.season }) };
  }

  T.views.try = st => {
    const { concept, sel, design } = current(st);
    const skins = Object.entries(T.SKINS).map(([k, s]) => `<button class="skin-dot" data-act="skin" data-v="${k}" aria-pressed="${st.skin === k}" aria-label="肌の色 ${s.name}" style="--skin:${s.base}"></button>`).join('');
    const overlay = `<div class="skins" role="group" aria-label="肌の色">${skins}</div><div class="hint">${U.ICON.hand}<span>爪をタップすると、光る</span></div>`;
    const stage = U.handStage(design, { sel, side: 'left', viewBox: '50 50 320 380', cls: 'try-stage', overlay });
    const rail = tryPicks(st.season).map((p, i) => {
      const c = U.byId(T.CONCEPTS, p.id), s2 = trySel(c, st), d = E.build(c, s2, { season: st.season }), acc = U.accentOf(c);
      return `<button class="rail-item" data-act="trypick" data-i="${i}" aria-pressed="${i === st.tryPick}"><span class="rail-tip">${T.renderSwatch(d.left[acc], d.palette, { shape: s2.shape, length: 'medium', seed: 21 + i, finger: acc })}</span><span class="rail-label">${U.esc(p.label)}</span></button>`;
    }).join('');
    const dots = T.SEASONS[st.season].colors.slice(0, 4).map(([n, c]) => `<i style="background:${c}" title="${U.esc(n)}"></i>`).join('');
    return `${U.brandBar()}
      <section class="try">
        <div class="try-head"><div class="eyebrow">Try on</div><h1>手にのせて、飾って、選ぶ。</h1></div>
        ${stage}
        <div class="try-amount"><span class="lab">飾り</span>${U.seg(T.TOPPINGS.LEVELS, 'tryamount', st.tryAmount, 'aria-label="飾り（トッピング）の量"')}</div>
        <div class="try-name"><b>${U.esc(concept.name)}</b><span>${U.esc(T.toppings.summary(design.left) || '塗りだけ')}</span></div>
        <div class="rail" data-keep-scroll="try-rail">${rail}<button class="rail-item more kotoba-rail" data-act="nav" data-view="kotoba"><span class="rail-tip words">${U.ICON.sparkle}</span><span class="rail-label">ことばで</span></button><button class="rail-item more" data-act="nav" data-view="colors"><span class="rail-tip colors">${dots}</span><span class="rail-label">色から探す</span></button></div>
        <div class="try-cta">
          <button class="btn rose cta" data-act="start">わたしに合うネイルを探す<small>6つの質問に答えるだけ</small></button>
          <div class="links"><button class="link" data-act="edit-try">自分で飾る${U.ICON.chev}</button><button class="link" data-act="open-try">作り方を見る${U.ICON.chev}</button></div>
          <button class="link myhand-link" data-act="myhand">${U.ICON.hand}${T.handFit && T.handFit.get() ? `わたしの手（${U.esc(T.handFit.SIZES[T.handFit.get().size].name)}）・置き直す` : 'わたしの手にする（指を置くだけ）'}${U.ICON.chev}</button>
        </div>
      </section>`;
  };

  function adopt(st) {
    const { concept, sel } = current(st);
    st.sel = Object.assign({}, st.sel, { topping: st.tryAmount, shape: st.answered.shape ? st.sel.shape : sel.shape, length: st.answered.length ? st.sel.length : sel.length });
    st.current = { conceptId: concept.id, paletteIndex: 0 };
    st.side = null; st.tab = 'look'; st.stepIdx = 0;
  }
  Object.assign(T.actions, {
    trypick: (el, st) => { st.tryPick = +el.dataset.i; st.fx = 'paint'; T.app.render(); },
    tryamount: (el, st) => { st.tryAmount = el.dataset.v; st.fx = 'pop'; T.app.render(); },
    skin: (el, st) => { st.skin = el.dataset.v; T.app.persist(); T.app.render(); },
    'edit-try': (el, st) => { adopt(st); if (T.editor) T.editor.enter(st); T.app.go(T.views.editor ? 'editor' : 'detail'); },
    'open-try': (el, st) => { adopt(st); T.app.go('detail'); },
  });
  T.tryPicks = tryPicks;
  T.tryAdopt = adopt;
  T.tryCurrent = current;
})(typeof window !== 'undefined' ? window : globalThis);
