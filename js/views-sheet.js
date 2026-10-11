/* tsumé — 「条件を変える」シート。変えると背後の提案・作り方がその場で変わる */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui;
  const { esc, ICON } = U;
  const pill = (st, key, val, label) => {
    const on = val === '' ? st.sel[key] == null : String(st.sel[key]) === String(val);
    return `<button class="pill" data-act="sel" data-key="${key}" data-val="${esc(val)}" aria-pressed="${on}">${esc(label)}</button>`;
  };
  const group = (id, title, inner) => `<section class="sheet-group" id="sheet-${id}"><h3>${esc(title)}</h3>${inner}</section>`;
  const row = items => `<div class="subopts">${items.join('')}</div>`;

  T.ui.sheet = (st, opening) => {
    const s = st.sel;
    const scenes = g => T.SCENES.filter(x => x.group === g).map(x => pill(st, 'scene', x.id, x.name));
    const note = T.toppings.capNote(s);
    const body = [
      s.color ? group('color', '色', `<div class="subopts"><span class="pill static"><i class="swatch-dot" style="background:${esc(s.color)}"></i>${esc(s.colorName || '')}</span><button class="pill" data-act="clearcolor">色の条件を外す</button></div>`) : '',
      group('scene', 'シーン', `<p class="sheet-sub">いつもの日</p>${row(scenes('daily'))}<p class="sheet-sub">特別な日</p>${row(scenes('special'))}${row([pill(st, 'scene', '', 'おまかせ')])}`),
      group('tier', '予算', row(T.TIERS.map(t => pill(st, 'tier', t, `${T.TIER_INFO[t].label}（${T.TIER_INFO[t].range}）`)))),
      group('mood', 'ムードと飾り', `${row(T.MOODS.map(m => pill(st, 'mood', m.id, m.name)).concat([pill(st, 'mood', '', 'おまかせ')]))}<p class="sheet-sub">飾り（トッピング）の量</p>${row(T.TOPPINGS.LEVELS.map(l => pill(st, 'topping', l.id, l.name)).concat([pill(st, 'topping', '', 'シーンに合わせる')]))}${note ? `<p class="cap-note">${esc(note)}</p>` : ''}`),
      group('nail', '爪の長さと形', `${row(T.LENGTHS.map(l => pill(st, 'length', l.id, l.name)))}${row(T.SHAPES.map(sh => pill(st, 'shape', sh.id, sh.name)))}`),
      group('scope', 'どこまで塗る', `${row(T.SCOPES.map(sc => pill(st, 'scope', sc.id, sc.name)))}${s.scope === 'foot' ? '' : `<p class="sheet-sub">利き手</p>${row(T.HANDS.map(h => pill(st, 'hand', h.id, h.name)))}`}`),
      group('method', 'やり方と時間', `${row(T.METHODS.map(m => pill(st, 'method', m.id, m.name)))}<p class="sheet-sub">使える時間</p>${row(T.TIMES.map(t => pill(st, 'time', t.id, t.name)))}<p class="sheet-sub">セルフネイルの経験</p>${row(T.LEVELS.map(l => pill(st, 'level', l.id, l.name)))}`),
    ].join('');
    const op = opening ? ' opening' : '';
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet${op}" role="dialog" aria-modal="true" aria-label="条件を変える">
        <header class="sheet-head"><b>条件を変える</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body" data-keep-scroll="sheet">${body}</div>
        <footer class="sheet-foot"><button class="btn block" data-act="sheet-close">この条件で見る</button></footer>
      </section>`;
  };

  Object.assign(T.actions, {
    sheet: (el, st) => {
      st.sheet = el.dataset.group || 'scene'; T.app.render();
      const g = typeof document !== 'undefined' && document.getElementById('sheet-' + st.sheet);
      const body = g && g.closest('.sheet-body');
      if (body) body.scrollTop = g.offsetTop - 8;
    },
    'sheet-close': (el, st) => { st.sheet = null; T.app.render(); },
    sel: (el, st) => {
      const key = el.dataset.key, val = el.dataset.val;
      st.sel[key] = val === '' ? null : val; st.answered[key] = true; st.seed = 0;
      T.app.render();
    },
    clearcolor: (el, st) => { st.sel.color = null; st.sel.colorName = null; T.app.render(); },
  });
})(typeof window !== 'undefined' ? window : globalThis);
