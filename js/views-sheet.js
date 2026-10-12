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

  const PART_NS = [1, 2, 3, 5];
  const basketN = st => (st.partBasket || []).reduce((n, b) => n + b.n, 0);
  // 図鑑のパーツ: 大きさ・値段・つけ方と、いくつ・ほかのパーツも選んで［指にのせる］
  function partSheet(st, op) {
    const D = T.TOPPINGS, it = st.partItem, kd = it && D.KINDS[it.k]; if (!kd) return '';
    const m = T.MATERIALS[kd.mat], name = T.toppings.fullName(it);
    const mm = z => (Math.round(kd.mm * D.SIZES[z] * 10) / 10).toFixed(1);
    const sizes = ['S', 'M', 'L'].filter(z => !(kd.big && z === 'S')).map(z => `<span><b class="latin">${z}</b>${mm(z)}mm</span>`).join('');
    const prices = T.TIERS.filter(t => m && m.tiers[t]).map(t => `<div class="price-card"><span class="pk">${esc(T.TIER_INFO[t].label)}</span><span class="py latin">${m.tiers[t].y.toLocaleString()}円</span><span class="pp">${esc(m.tiers[t].p)}<br>${esc(m.tiers[t].s)}</span></div>`).join('');
    const H = T.HOWTO && T.HOWTO.TOPPING[it.k], polish = st.sel.method === 'polish';
    const tips = H ? (polish ? H.polish : H.gel).concat(H.tip ? [H.tip] : []) : [polish ? 'ネイルグルーを米粒ほど置き、ピンセットでのせて10秒押さえる。' : '置く場所にトップジェルを少しのせ、ピンセットで置いて硬化。', 'パーツの表面にはトップを塗らない。まわりだけ固めると輝きが残る。'];
    const art = T.partSwatch(Object.assign({ s: 'L' }, it, it.k === 'chain' ? { r: 0 } : {}), ['charm', 'chain', 'bijou', 'flower3d'].includes(it.k) ? 30 : 20);
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet part-sheet${op}" role="dialog" aria-modal="true" aria-label="${esc(name)}">
        <header class="sheet-head"><b>${esc(name)}</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <div class="part-hero">${art}</div>
          <div class="part-sizes"><span class="lab">大きさの目安</span>${sizes}</div>
          <p class="small muted">爪の幅は約10〜14mm。値段は1袋の目安（2026年10月の調査）。</p>
          <div class="price-cards">${prices}</div>
          <div class="part-tips"><h3>キレイにつけるコツ（${polish ? 'マニキュア' : 'ジェル'}）</h3><ol>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
        </div>
        <footer class="sheet-foot part-foot">
          <div class="part-count"><span class="lab">いくつのせる</span>${U.seg(PART_NS.map(n => ({ id: String(n), name: n + '個' })), 'part-n', String(st.partN || 1), 'aria-label="のせる数"')}</div>
          <div class="btnrow"><button class="btn ghost" data-act="part-more">${ICON.plus}ほかのパーツも選ぶ</button><button class="btn rose" data-act="part-try">${ICON.wand}${basketN(st) ? `まとめてのせる（${basketN(st) + (st.partN || 1)}個）` : `指にのせる（${st.partN || 1}個）`}</button></div>
        </footer>
      </section>`;
  }

  T.ui.sheet = (st, opening) => {
    if (st.sheet === 'part') return partSheet(st, opening ? ' opening' : '');
    if (st.sheet === 'item') return T.shop.sheet(st, opening ? ' opening' : '');
    if (st.sheet === 'ai-consent') return T.kotobaView.consentSheet(st, opening ? ' opening' : '');
    if (st.sheet === 'sommelier') return T.sommelier.sheet(st, opening ? ' opening' : '');
    if (T.sheets && T.sheets[st.sheet]) return T.sheets[st.sheet](st, opening ? ' opening' : '');
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
