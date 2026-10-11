/* tsumé — 提案。1案1枚のカードを左右にスワイプ。条件はシートで変える */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  const { esc, yen, ICON, byId } = U;

  function condChips(st) {
    const s = st.sel, list = [];
    const scene = s.scene ? byId(T.SCENES, s.scene).name : 'シーンおまかせ';
    list.push(['scene', scene]);
    list.push(['tier', T.TIER_INFO[s.tier].label]);
    const lv = byId(T.TOPPINGS.LEVELS, T.toppings.levelFor(s));
    list.push(['mood', `${s.mood ? byId(T.MOODS, s.mood).name : 'ムードおまかせ'}・飾り${lv ? lv.name : ''}`]);
    list.push(['nail', `${byId(T.LENGTHS, s.length).name}・${byId(T.SHAPES, s.shape).name}`]);
    list.push(['scope', byId(T.SCOPES, s.scope).name]);
    list.push(['method', byId(T.METHODS, s.method).name]);
    if (s.color) list.unshift(['color', `<i class="swatch-dot" style="background:${esc(s.color)}"></i>${esc(s.colorName || '色')}`]);
    return list.map(([g, html]) => `<button class="chip" data-act="sheet" data-group="${g}">${g === 'color' ? html : esc(html)}</button>`).join('');
  }
  function situationCard(st) {
    const sit = E.situation(st.sel, st.season);
    return `<details class="sit"><summary>${ICON.sparkle}<span>このシーンのポイント</span></summary>
      <ul class="notes">${sit.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="small"><b>${esc(sit.light.name)}</b>　<span class="muted">${esc(sit.light.note)}</span></p>
      <div class="sit-colors"><span class="small muted">${esc(sit.season.name)}の色</span>${sit.season.colors.map(([n, c]) => `<i class="swatch-dot" title="${esc(n)}" style="background:${c}"></i>`).join('')}</div>
    </details>`;
  }
  function card(p, st, i) {
    const key = U.customKey(p.concept.id, p.design.paletteIndex);
    const d = st.custom[key] ? U.designFor(p.concept.id, p.design.paletteIndex) : p.design;
    const side = U.showcaseSide(st.sel), saved = T.app.isSaved(p.concept.id, d.paletteIndex);
    const tops = T.toppings.summary(d.foot || (side === 'left' ? d.left : d.right));
    return `<article class="pcard" aria-label="${i + 1}案目 ${esc(d.concept.name)}">
      <div class="pstage-wrap">
        ${U.handStage(d, { side, viewBox: d.foot ? null : '42 50 330 420', cls: 'pstage' })}
        <span class="ptag ${p.role}">${esc(p.label)}</span>
        <button class="iconbtn save" data-act="save-card" data-id="${d.concept.id}" data-pi="${d.paletteIndex}" aria-pressed="${saved}" aria-label="${saved ? '保存を外す' : '保存する'}">${saved ? ICON.heartFill : ICON.heart}</button>
      </div>
      <div class="pbody">
        ${p.hint ? `<span class="phint">${esc(p.hint)}</span>` : ''}
        <h2 class="pname">${esc(d.concept.name)}</h2>
        <span class="pen"><span class="latin">${esc(d.concept.en)}</span> · ${esc(d.palette.name)}</span>
        <span class="ptops">トッピング：${esc(tops || 'なし（塗りだけ）')}</span>
        <div class="pmeta"><span>${ICON.yen}${yen(d.cost.total)}</span><span>${ICON.clock}${d.est.minutes}分</span>${U.diff(d.est.difficulty)}</div>
        <button class="btn" data-act="open" data-id="${d.concept.id}" data-pi="${d.paletteIndex}">作り方を見る</button>
      </div>
    </article>`;
  }

  T.views.proposals = st => {
    const picks = E.propose(st.sel, { season: st.season, seed: st.seed });
    const cards = picks.map((p, i) => card(p, st, i)).join('');
    const more = `<article class="pcard more"><p class="more-t">ほかの案も見る</p><p class="small muted">同じ条件のまま、別のデザインを出します。</p><button class="btn ghost" data-act="seed">${ICON.refresh}ほかの案を見る</button><button class="btn ghost" data-act="sheet" data-group="scene">${ICON.sliders}条件を変える</button></article>`;
    const dots = picks.concat([null]).map((_, i) => `<i data-dot="${i}" aria-current="${i === 0}"></i>`).join('');
    return `${U.bar({ back: true, title: `あなたへの${picks.length}案`, right: `<button class="chip sheet-btn" data-act="sheet" data-group="scene">${ICON.sliders}条件</button>` })}
      <div class="cond" data-keep-scroll="cond">${condChips(st)}</div>
      ${situationCard(st)}
      <div class="swipe" data-keep-scroll="swipe">${cards}${more}</div>
      <div class="dots" aria-hidden="true">${dots}</div>
      <p class="swipe-hint">左右にスワイプで、ほかの案</p>
      <p class="disclaimer">価格は2026年10月のWeb調査に基づく目安（税込）。店や時期で変わります。</p>`;
  };

  Object.assign(T.actions, {
    seed: (el, st) => { st.seed += 1; if (st.view === 'proposals') { T.app.render(); const sw = document.querySelector('.swipe'); if (sw) sw.scrollTo({ left: 0 }); } else T.app.go('proposals'); },
    open: (el, st) => { st.current = { conceptId: el.dataset.id, paletteIndex: U.piOf(el.dataset.pi) }; st.side = null; st.tab = 'look'; st.stepIdx = 0; T.app.go('detail'); },
    'save-card': (el, st) => { const keep = st.current; st.current = { conceptId: el.dataset.id, paletteIndex: U.piOf(el.dataset.pi) }; T.app.saveCurrent(); st.current = keep; T.app.render(); },
  });
})(typeof window !== 'undefined' ? window : globalThis);
