/* tsumé — 描き方レシピ（1手順ずつ、爪の上にお手本が描き足されていく）と、筆の図鑑・筆のシート・おすすめの筆 */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, B = T.BRUSHES;
  const { esc, ICON } = U;
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const f = n => +(+n).toFixed(2);
  const col = c => (HEX.test(c || '') ? c : '#2B2226');
  const brushOf = id => B.LIST.find(b => b.id === id) || null;
  const recipeOf = id => B.RECIPES.find(r => r.id === id) || null;
  const levelOf = st => (['first', 'some', 'expert'].includes(st.sel && st.sel.level) ? st.sel.level : 'some');
  const levelName = id => ((T.LEVELS || []).find(l => l.id === id) || { name: id }).name;

  // ---- 爪の絵（100×100 の箱。上が爪の先）。塗り（点・面）を先に、線を後に重ねる（線の内側を塗る描き方と同じ見え方）
  const NAIL = 'M20,36 C20,14 33,3 50,3 C67,3 80,14 80,36 L80,86 C80,94 70,98 50,98 C30,98 20,94 20,86 Z';
  const FINGER = 'M8,112 L8,46 C8,26 24,14 50,14 C76,14 92,26 92,46 L92,112 Z';
  let uid = 0;
  function shapeSvg(s) {
    if (s.t === 'dot') return `<circle cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.r)}" fill="${col(s.c)}"/>`;
    if (s.t === 'line') {
      const pts = (s.pts || []).filter(q => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1]));
      if (!pts.length) return '';
      return `<path d="M${pts.map(q => `${f(q[0])},${f(q[1])}`).join(' L')}" fill="none" stroke="${col(s.c)}" stroke-width="${f(s.w || 1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (s.t === 'path') {
      const d = String(s.d || '').replace(/[^MLCQZ0-9.,\s-]/gi, '');
      return s.fill ? `<path d="${d}" fill="${col(s.c)}"/>` : `<path d="${d}" fill="none" stroke="${col(s.c)}" stroke-width="${f(s.w || 1.2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return '';
  }
  const isFill = s => s.t === 'dot' || (s.t === 'path' && s.fill);
  function nailSvg(r, upto, o) {
    o = o || {};
    const base = (r.colors.find(c => c.role === '地色') || { hex: '#F4ECE6' }).hex;
    const shapes = r.art.slice(0, Math.max(0, Math.min(r.art.length, upto)));
    const skin = (T.SKINS && T.SKINS[o.skin]) || (T.SKINS && T.SKINS.natural) || { base: '#F1D0BD', line: '#D4A48B' };
    const id = `rcn${++uid}`;
    return `<svg class="rc-nail" viewBox="0 -2 100 112" role="img" aria-label="${esc(o.label || r.name + 'のお手本')}">
      <path d="${FINGER}" fill="${col(skin.base)}" stroke="${col(skin.line)}" stroke-width="0.8"/>
      <clipPath id="${id}"><path d="${NAIL}"/></clipPath>
      <path d="${NAIL}" fill="${col(base)}"/>
      <g clip-path="url(#${id})">${shapes.filter(isFill).map(shapeSvg).join('')}${shapes.filter(s => !isFill(s)).map(shapeSvg).join('')}</g>
      <path d="M28,32 C28,21 34,13 42,10.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2.6" stroke-linecap="round"/>
      <path d="${NAIL}" fill="none" stroke="#000000" stroke-opacity="0.1" stroke-width="0.8"/>
    </svg>`;
  }

  // ---- 筆の絵（柄・金具・毛先。shape で毛先を変える）
  const HAIR = {
    liner_s: 'M74,11.5 C80,11.8 86,13 92,14 C86,15 80,16.2 74,16.5 Z',
    liner_l: 'M74,11.5 C86,12 100,13.3 114,14 C100,14.7 86,16 74,16.5 Z',
    fine: 'M74,12.6 C79,13 84,13.6 89,14 C84,14.4 79,15 74,15.4 Z',
    oval_mini: 'M74,11 L80,11 C84,11 85.5,12.5 85.5,14 C85.5,15.5 84,17 80,17 L74,17 Z',
    oval: 'M74,8.5 L86,8.5 C92,8.5 94.5,11.5 94.5,14 C94.5,16.5 92,19.5 86,19.5 L74,19.5 Z',
    flat: 'M74,8.5 L92,8.5 Q93.5,8.5 93.5,10 L93.5,18 Q93.5,19.5 92,19.5 L74,19.5 Z',
    angular: 'M74,8.5 L97,8.5 L86,19.5 L74,19.5 Z',
    almond: 'M74,10.5 C82,9.5 90,11 99,14 C90,17 82,18.5 74,17.5 Z',
    round: 'M74,9.5 C84,9 92,11.5 103,14 C92,16.5 84,19 74,18.5 Z',
    tap: 'M74,9 C78,8 82,8 84,9 C86,8.4 88.4,10 87.6,11.6 C89.4,12.6 89.4,15.4 87.6,16.4 C88.4,18 86,19.6 84,19 C82,20 78,20 74,19 Z',
    comb: 'M74,8.5 L84,8.5 L84,19.5 L74,19.5 Z' + [0, 1, 2, 3, 4].map(i => { const y = 8.5 + i * 2.3; return ` M84,${f(y)} L93,${f(y)} L93,${f(y + 1.4)} L84,${f(y + 1.4)} Z`; }).join(''),
    point: 'M74,10 L80,10.3 C86,11 90,13 97,14 C90,15 86,17 80,17.7 L74,18 Z',
  };
  // 毛先のいちばん右（チップでは、ここまでだけ見せる）
  const TIP_X = { liner_s: 92, liner_l: 114, fine: 89, oval_mini: 85.5, oval: 94.5, flat: 93.5, angular: 97, almond: 99, round: 103, tap: 89.4, comb: 93, point: 97, dot: 105 };
  function brushSvg(shape, o) {
    o = o || {};
    const vw = o.tight ? f((TIP_X[shape] || 118) + 2 - 27) : 91;
    if (o.tight) o.style = `width:${f((vw / 22) * 12)}px;height:12px`;
    const tip = shape === 'dot'
      ? '<rect class="br-metal" x="74" y="12.8" width="26" height="2.4" rx="1.2" fill="#9A9AA2"/><circle class="br-metal" cx="101.5" cy="14" r="3.4" fill="#9A9AA2"/>'
      : `<path class="br-hair" d="${HAIR[shape] || HAIR.liner_s}" fill="#3B3035"/>`;
    return `<svg class="br-svg" viewBox="27 3 ${vw} 22" aria-hidden="true"${o.style ? ` style="${o.style}"` : ''}>
      <path class="br-handle" d="M32,11.4 L60,10 L60,18 L32,16.6 Q28.6,14 32,11.4 Z" fill="#AB5A69"/>
      <rect class="br-ferrule" x="60" y="9" width="14" height="10" rx="1.6" fill="#C8A96A"/>${tip}
    </svg>`;
  }
  const chip = b => `<button class="br-chip" data-act="br-open" data-id="${esc(b.id)}" aria-label="${esc(b.name)}：筆の説明">${brushSvg(b.shape, { tight: true })}<span>${esc(b.name)}</span></button>`;

  // ---- 技法とおすすめの筆
  const forTech = techId => (B.BY_TECH[techId] || []).map(brushOf).filter(Boolean);
  const forTechs = ids => { const seen = new Set(), out = []; (ids || []).forEach(t => forTech(t).forEach(b => { if (!seen.has(b.id)) { seen.add(b.id); out.push(b); } })); return out; };
  /** デザインに使われている技法（全面シールは除く） */
  function techsOf(design) {
    if (!design) return [];
    const specs = design.foot ? design.foot : (design.left || []).concat(design.right || []);
    return Array.from(new Set(specs.flatMap(sp => (sp.cover ? [] : [sp.over, sp.t].concat((sp.layers || []).map(l => l.t)))).filter(Boolean)));
  }
  /** 材料や手順に添える「おすすめの筆」。合う筆が無ければ空 */
  function recommendHtml(techIds) {
    const list = forTechs(techIds); if (!list.length) return '';
    return `<div class="br-rec"><span class="br-lab">おすすめの筆<small>（目安）</small></span>${list.map(chip).join('')}</div>`;
  }
  const recipesWith = id => B.RECIPES.filter(r => r.brushes.includes(id));
  const techsWith = id => Object.keys(B.BY_TECH).filter(t => B.BY_TECH[t].includes(id) && T.TECHNIQUES && T.TECHNIQUES[t]);
  // 値段: tax が true のものだけ「税込」と出す（ほかは税込かどうか未確認）
  const priceText = p => (p && p.price ? `${p.tax ? '税込' : ''}${p.price.toLocaleString('ja-JP')}円` : '');
  function buyHtml(b) {
    const c = b.cheap, p = b.pro;
    const cheap = c ? `${esc(c.name)}（${esc(c.store)}）${c.price ? `<b class="num">${priceText(c)}</b>` : ''}${c.note ? `<small>${esc(c.note)}</small>` : ''}` : '<span class="muted">確かめた品はまだありません</span>';
    const pro = p ? `${esc(p.maker)} ${esc(p.name)}${p.price ? `<b class="num">${priceText(p)}</b>` : ''}${p.note ? `<small>${esc(p.note)}</small>` : ''}${/^https:\/\//.test(p.url || '') ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.link || '商品のページ')}${ICON.chev}</a>` : ''}` : `<span class="muted">${esc(b.proNote || '確かめた品はまだありません')}</span>`;
    return `<dl class="br-buy"><dt>100均</dt><dd>${cheap}</dd><dt>こだわり</dt><dd>${pro}</dd></dl>`;
  }

  // ---- 図鑑の「筆」タブ
  function book(st) {
    const cards = B.LIST.map(b => `<div class="br-card">
      <button class="br-main" data-act="br-open" data-id="${esc(b.id)}" aria-label="${esc(b.name)}：くわしく">
        <span class="br-txt"><span class="br-head"><span class="br-art">${brushSvg(b.shape)}</span><b class="br-name">${esc(b.name)}</b></span><span class="br-uses">${esc(b.uses)}</span><span class="br-draws">${b.draws.map(d => `<i class="br-tag">${esc(d)}</i>`).join('')}</span></span>
        ${ICON.chev}
      </button>
      ${buyHtml(b)}
    </div>`).join('');
    return `<div class="br-book">
      <p class="small muted">筆は、毛先の形で描けるものが変わります。押すと、合う技法と、その筆を使うレシピが見られます。</p>
      <button class="btn ghost block" data-act="rc-home">${ICON.wand}描き方レシピで使ってみる</button>
      <div class="br-list">${cards}</div>
      <p class="disclaimer">値段は2026年10月にお店のサイトで見えたものだけ載せています（「税込」と書いたもの以外は、税込かどうか未確認）。100均の品は、予告なく取り扱いが終わることがあります。技法との組み合わせは、メーカーの説明する用途をもとにした目安です。</p>
    </div>`;
  }

  // ---- 筆1本のシート（st.brushId）
  function sheet(st, op) {
    const b = brushOf(st.brushId); if (!b) return '';
    op = op || '';
    const techs = techsWith(b.id).map(t => `<span class="tool-chip">${esc(T.TECHNIQUES[t].name)}</span>`).join('');
    const recs = recipesWith(b.id).map(r => `<button class="pill" data-act="rc-open" data-id="${esc(r.id)}">${esc(r.name)}</button>`).join('');
    const src = (b.src || []).filter(u => /^https:\/\//.test(u)).map(u => { const s = B.SOURCES.find(x => x[1] === u); const t = esc(s ? s[0] : u.replace(/^https:\/\/(www\.)?/, '').split('/')[0]); return B.NOLINK.test(u) ? `<li>${t}</li>` : `<li><a href="${esc(u)}" target="_blank" rel="noopener">${t}</a></li>`; }).join('');
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet br-sheet${op}" role="dialog" aria-modal="true" aria-label="${esc(b.name)}">
        <header class="sheet-head"><b>${esc(b.name)}</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <div class="br-hero">${brushSvg(b.shape)}</div>
          <p class="br-lead">${esc(b.uses)}</p>
          <div class="br-draws"><span class="br-lab">描けるもの</span>${b.draws.map(d => `<i class="br-tag">${esc(d)}</i>`).join('')}</div>
          ${techs ? `<section class="sheet-group"><h3>合う技法<small>（目安）</small></h3><div class="br-techs">${techs}</div></section>` : ''}
          ${recs ? `<section class="sheet-group"><h3>この筆を使うレシピ</h3><div class="subopts">${recs}</div></section>` : ''}
          <section class="sheet-group"><h3>買うなら</h3>${buyHtml(b)}</section>
          ${src ? `<details class="rc-src"><summary>用途を確かめたページ</summary><ul>${src}</ul></details>` : ''}
          ${b.verified ? '' : '<p class="disclaimer">用途はまだ出典で確かめていません。</p>'}
        </div>
        <footer class="sheet-foot"><button class="btn block" data-act="sheet-close">閉じる</button></footer>
      </section>`;
  }

  // ---- 描き方レシピ
  const TENT = '<i class="rc-tent">目安</i>';
  const CURE = {
    tack: { name: '仮硬化', note: '時間は、お使いのジェルの説明書に従う。' },
    full: { name: '本硬化', note: '時間は、ライトとジェルの説明書を優先。' },
    none: { name: '硬化しない', note: '' },
  };
  function orderRule() {
    const rows = B.ORDER_RULE.map(r => `<li>${r.tentative ? '<i class="rc-tent">目安</i>' : ''}${esc(r.text)}</li>`).join('');
    return `<details class="rc-rule"><summary><span class="rc-rule-h">重ねる順番の決まり<small>すべてのレシピで共通</small></span></summary><ol>${rows}</ol><p class="disclaimer">「目安」は、一般的な描き方。ネイルの一次情報ではまだ確かめていません。</p></details>`;
  }
  function resumeHtml(st) {
    const x = st.recipeLast, r = x && recipeOf(x.id); if (!r) return '';
    const k = Math.max(0, Math.min(r.steps.length - 1, +x.idx || 0));
    return `<button class="btn ghost block rc-resume" data-act="rc-resume">続きから：${esc(r.name)}（手順${k + 1} / ${r.steps.length}）${ICON.chev}</button>`;
  }
  function list(st) {
    const cards = B.RECIPES.map(r => `<button class="rc-card" data-act="rc-open" data-id="${esc(r.id)}">
        <span class="rc-card-art">${nailSvg(r, r.art.length, { skin: st.skin })}</span>
        <span class="rc-card-body"><b>${esc(r.name)}</b><span class="rc-lead">${esc(r.lead || '')}</span><span class="rc-meta">${esc(levelName(r.level))} ・ 約${r.minutes}分 ・ ${r.steps.length}手順</span><span class="rc-brushes">${r.brushes.map(id => esc((brushOf(id) || {}).name || '')).filter(Boolean).join('・')}</span></span>
        ${ICON.chev}
      </button>`).join('');
    const src = B.SOURCES.map(([t, u]) => (B.NOLINK.test(u) ? `<li>${esc(t)}</li>` : `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`)).join('');
    return `${U.bar({ back: true, title: '描き方レシピ' })}
      <p class="small muted">お手本の絵が、1手順ずつ描き足されていきます。使う筆を押すと、筆の説明が出ます。</p>
      ${resumeHtml(st)}
      ${orderRule()}
      <div class="rc-list">${cards}</div>
      <button class="btn ghost block" data-act="br-book">${ICON.book}筆の図鑑を見る</button>
      <details class="rc-src"><summary>参考にしたページ</summary><ul>${src}</ul></details>
      <p class="disclaimer">手順は、メーカーやネイル講師などの説明をもとに、短く書き直したものです。手順ごとの筆は、出典に筆の名前が無い所は、筆の用途から当てた目安です（「筆は目安」と出ます）。硬化の時間は、お使いのジェルとライトの説明書に従ってください。</p>`;
  }
  const sayLines = (r, k) => { const s = r.steps[k]; return [`${r.name}。手順${k + 1}。`, s.text, s.cure === 'tack' ? '仮硬化の時間は、お使いのジェルの説明書に従ってください。' : ''].filter(Boolean); };
  function step(st, r) {
    const n = r.steps.length, k = st.recipe.idx = Math.max(0, Math.min(n - 1, +st.recipe.idx || 0)), s = r.steps[k], last = k === n - 1;
    const b = s.brush && brushOf(s.brush);
    const swatches = s.role ? r.colors.filter(c => c.role === s.role).map(c => `<span class="rc-swatch"><i style="background:${col(c.hex)}"></i>${esc(c.role)}：${esc(c.name)}</span>`).join('') : '';
    const cure = CURE[s.cure] || CURE.none;
    const voice = T.voice && T.voice.available() ? `<button class="iconbtn" data-act="rc-say" aria-label="この手順を読み上げる">${ICON.voice}</button>` : '';
    const lv = levelOf(st);
    const fixes = r.fixes.map(x => `<details class="fix"><summary>${esc(x.q)}</summary><p class="rc-fix-a">${x.tentative && x.tentative[lv] ? TENT : ''}${esc(x.a[lv] || x.a.some)}</p></details>`).join('');
    return `<header class="bar"><button class="iconbtn" data-act="rc-list" aria-label="レシピの一覧へ">${ICON.back}</button><h1 class="bar-title">${esc(r.name)}</h1><div class="bar-right">${voice}</div></header>
      <div class="rc-step">
        <div class="rc-prog"><span class="latin">${k + 1} / ${n}</span><span class="rc-bar" aria-hidden="true"><i style="width:${(((k + 1) / n) * 100).toFixed(1)}%"></i></span></div>
        <div class="rc-stage">${nailSvg(r, s.art, { skin: st.skin, label: `手順${k + 1}までのお手本` })}</div>
        <p class="rc-text">${s.tentative ? TENT : ''}${esc(s.text)}</p>
        <div class="rc-chips">
          ${b ? `<span class="rc-brush">${chip(b)}${s.brushTentative ? '<i class="rc-tent" title="出典に筆の名前が無いので、筆の用途から当てた目安">筆は目安</i>' : ''}</span>` : ''}
          ${swatches}
          <span class="rc-cure ${esc(s.cure)}">${esc(cure.name)}</span>
        </div>
        ${cure.note ? `<p class="small muted rc-cure-note">${esc(cure.note)}</p>` : ''}
        <div class="rc-nav"><button class="btn ghost" data-act="rc-prev" aria-label="前の手順" ${k === 0 ? 'disabled' : ''}>${ICON.back}前</button>${last ? `<button class="btn rose" data-act="rc-list">${ICON.check}できた！一覧へ</button>` : `<button class="btn" data-act="rc-next">次へ${ICON.chev}</button>`}</div>
      </div>
      <section class="rc-fixes">
        <h3>うまくいかないとき</h3>
        ${U.seg(T.LEVELS || [], 'rc-level', lv, 'aria-label="セルフネイルの経験"')}
        ${fixes}
      </section>
      <div class="rc-uses"><span class="rc-lab">このレシピで使う筆</span>${r.brushes.map(brushOf).filter(Boolean).map(chip).join('')}</div>`;
  }
  // ほかの画面から入ったとき（ラボの入口・下のタブ・戻る）は一覧から。途中の手順は「続きから」で開ける。
  // shown: 直前に描いた画面（app.js の tsume:render）。opening: rc-open で手順を開くところ
  let shown = null, opening = false;
  const seen = v => { shown = v || null; };
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('tsume:render', e => seen(e.detail && e.detail.view));
  T.views.recipes = st => {
    if (st.recipe && !opening && shown && shown !== 'recipes') { st.recipeLast = st.recipe; st.recipe = null; }
    opening = false;
    const r = st.recipe && recipeOf(st.recipe.id);
    return r ? step(st, r) : list(st);
  };

  const top = () => { if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0); };
  /** 手順の途中で一覧へ戻るときは、続きを覚えておく（最後の手順まで見たら消す） */
  const keep = st => {
    const r = st.recipe && recipeOf(st.recipe.id);
    if (r) st.recipeLast = st.recipe.idx < r.steps.length - 1 ? { id: r.id, idx: st.recipe.idx } : null;
    st.recipe = null;
  };
  const quiet = () => { if (T.voice && T.voice.speaking && T.voice.speaking()) T.voice.stop(); };
  Object.assign(T.actions, {
    'rc-home': (el, st) => { keep(st); st.sheet = null; quiet(); T.app.go('recipes'); },
    'rc-open': (el, st) => {
      const r = recipeOf(el && el.dataset.id); if (!r) return;
      st.recipe = { id: r.id, idx: 0 }; st.recipeLast = null; st.sheet = null; quiet();
      opening = true;
      if (st.view === 'recipes') { T.app.render(); top(); } else T.app.go('recipes');
      opening = false;
    },
    'rc-resume': (el, st) => {
      const x = st.recipeLast, r = x && recipeOf(x.id); if (!r) return;
      st.recipe = { id: r.id, idx: Math.max(0, Math.min(r.steps.length - 1, +x.idx || 0)) }; st.recipeLast = null; quiet();
      opening = true; T.app.render(); opening = false; top();
    },
    'rc-list': (el, st) => { keep(st); quiet(); T.app.render(); top(); },
    'rc-next': (el, st) => { const r = st.recipe && recipeOf(st.recipe.id); if (!r) return; st.recipe.idx = Math.min(r.steps.length - 1, (+st.recipe.idx || 0) + 1); quiet(); T.app.render(); top(); },
    'rc-prev': (el, st) => { if (!st.recipe) return; st.recipe.idx = Math.max(0, (+st.recipe.idx || 0) - 1); quiet(); T.app.render(); top(); },
    'rc-say': (el, st) => { const r = st.recipe && recipeOf(st.recipe.id); if (r && T.voice) T.voice.speak(sayLines(r, st.recipe.idx), { voice: 'guide2' }); },
    'rc-level': (el, st) => { st.sel.level = el.dataset.v; if (st.answered) st.answered.level = true; T.app.render(); },
    'br-open': (el, st) => { if (!brushOf(el && el.dataset.id)) return; st.brushId = el.dataset.id; st.sheet = 'brush'; T.app.render(); },
    'br-book': (el, st) => { st.matTab = 'brushes'; st.sheet = null; T.app.go('materials'); },
  });
  T.sheets = Object.assign(T.sheets || {}, { brush: (st, op) => sheet(st, op) });
  T.brushes = { book, forTech, forTechs, techsOf, recommendHtml, sheet, brushSvg, nailSvg, chip, sayLines, seen };
})(typeof window !== 'undefined' ? window : globalThis);
