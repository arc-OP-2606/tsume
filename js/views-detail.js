/* tsumé — 作り方。完成図・材料・手順のタブ。手順は1つずつ爪の絵が仕上がっていく */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  const { esc, yen, ICON, byId } = U;

  function current(st) {
    const cur = st.current; if (!cur) return null;
    return U.designFor(cur.conceptId, cur.paletteIndex);
  }
  const sideOf = (st, d) => (d.foot ? 'right' : st.side || U.showcaseSide(st.sel));
  const specsFor = (d, side) => d.foot || (side === 'left' ? d.left : d.right);

  function stage(st, d, side) {
    const c = d.concept;
    const pals = c.palettes.map((p, i) => `<button class="pal-dot" data-act="palette" data-i="${i}" aria-pressed="${i === d.paletteIndex}" aria-label="色 ${esc(p.name)}" style="--c1:${p.base};--c2:${p.accent}"></button>`).join('');
    const sides = d.foot ? '' : U.seg([{ id: 'left', name: '左手' }, { id: 'right', name: '右手' }], 'side', side, 'aria-label="表示する手"');
    const overlay = `<div class="dstage-top">${sides || '<span></span>'}<div class="pal-dots" role="group" aria-label="色をずらす">${pals}</div></div><div class="dstage-bottom"><button class="chip glass" data-act="edit">${ICON.wand}アイテムで飾る</button></div>`;
    return U.handStage(d, { side, viewBox: d.foot ? null : '42 44 330 400', cls: 'dstage', overlay });
  }

  function look(st, d, side) {
    const specs = specsFor(d, side), names = d.foot ? ['親指', '人差し指', '中指', '薬指', '小指'] : T.FINGER_NAMES;
    const order = !d.foot && side === 'left' ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4];
    const rows = order.map(i => {
      const f = specs[i];
      const t = T.TECHNIQUES[f.t], o = f.over ? T.TECHNIQUES[f.over] : null, ls = (f.layers || []).map(l => (T.TECHNIQUES[l.t] || {}).name).filter(Boolean);
      const item = f.shop && T.SHOP && T.SHOP.byId(f.shop), tname = (f.cover ? 'ネイルシール' : t ? t.name : f.t) + (item ? `（${T.shop.short(item)}）` : '');
      const tops = (f.toppings || []).length ? T.toppings.summary([f]) : '';
      return `<div class="recipe-row"><span class="sw">${T.renderSwatch(f, d.palette, { shape: d.foot ? 'square' : st.sel.shape, length: d.foot ? 'short' : st.sel.length, seed: 11 + (side === 'left' ? 100 : 0), finger: i })}</span><span class="rt"><span class="fn">${esc((d.foot ? '足の' : '') + names[i])}</span><span class="ft">${esc(tname)}${o ? `<small>　下地: ${esc(o.name)}</small>` : ''}${ls.length ? `<small>　＋${esc(ls.join('＋'))}</small>` : ''}</span>${tops ? `<span class="tops">${ICON.sparkle}${esc(tops)}</span>` : ''}</span></div>`;
    }).join('');
    const notes = d.notes.concat(d.subs.map(x => 'マニキュア向けに置き換え: ' + x));
    if (d.topping && d.topping.note) notes.push(d.topping.note);
    const saved = T.app.isSaved(d.concept.id, d.paletteIndex);
    return `<div class="look">
      <p class="palette-line"><b>${esc(d.palette.name)}</b>　<span>${esc(E.situation(st.sel, st.season).name)}</span></p>
      <button class="link mix-link" data-act="mix-open" data-hex="${d.palette.base}" data-name="${esc(d.palette.name)}の色">${ICON.drop}この色を、持っている色を混ぜて作る${ICON.chev}</button>
      <button class="link mix-link" data-act="dw-start">${ICON.wand}この色の爪に、自分で描く${ICON.chev}</button>
      <p class="story">${esc(d.concept.story)}</p>
      ${U.chart(d, side)}
      <button class="somm-btn" data-act="somm-open">${ICON.voice}<span><b>tsumé ソムリエに聞く</b><small>映える角度・光・背景を、約${T.sommelier.script(d, st.sel, st.season).sec}秒で</small></span>${ICON.chev}</button>
      <div class="recipe">${rows}</div>
      ${notes.length ? `<ul class="notes">${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      <div class="meta"><span>材料 <b class="num">${yen(d.cost.total)}</b></span><span>道具（初回） <b class="num">${yen(d.cost.tools)}</b></span><span>目安 <b class="num">${d.est.minutes}分</b></span><span>難易度 <b class="num">${d.est.difficulty}/5</b></span></div>
      <div class="btnrow"><button class="btn ${saved ? 'rose' : ''}" data-act="save">${saved ? ICON.heartFill : ICON.heart}${saved ? '保存済み' : 'マイデザインに保存'}</button><button class="btn ghost" data-act="copy">${ICON.copy}レシピをコピー</button><button class="btn ghost" data-act="${T.share ? 'sh-open' : 'share'}">${ICON.share}共有</button>${T.gallery && T.gallery.canPost && T.gallery.canPost() ? `<button class="btn ghost" data-act="gl-post-open">${ICON.sparkle}みんなに見せる</button>` : ''}</div>
    </div>`;
  }

  function materials(st, d) {
    const s = st.sel, cons = d.materials.filter(m => !m.once), kits = d.materials.filter(m => m.cat === 'kit'), tools = d.materials.filter(m => m.once && m.cat !== 'kit'), salon = d.salon;
    const tiers = U.seg(T.TIERS.map(t => ({ id: t, name: T.TIER_INFO[t].label })), 'tier-here', s.tier, 'aria-label="予算"');
    const row = m => `<tr${m.once ? ' class="tool"' : ''}><td>${esc(m.name)}${m.qty > 1 ? ` <span class="muted">×${m.qty}</span>` : ''}<br><span class="prod">${esc(m.product)}（${esc(m.store)}）</span>${!m.once && m.upgrade && (s.tier === 'kodawari' || s.tier === 'luxe') && m.upgrade.tier !== m.tier ? `<br><span class="up">次の予算なら ${esc(m.upgrade.p)}（${esc(m.upgrade.s)}）${yen(m.upgrade.y)}</span>` : ''}${m.id === 'art_brush' && T.brushes ? T.brushes.recommendHtml(T.brushes.techsOf(d)) : ''}</td><td class="price num">${yen(m.subtotal)}</td></tr>`;
    return `<div class="mats">
      ${T.shop ? T.shop.used(d) : ''}
      ${tiers}
      <table class="mat-table"><thead><tr><th>素材と選ぶ商品（店）</th><th style="text-align:right">目安</th></tr></thead><tbody>
      ${cons.map(row).join('')}
      ${kits.length ? `<tr><td colspan="2" class="group-label">キレイに仕上げる小物（初回のみ）</td></tr>${kits.map(row).join('')}` : ''}
      ${tools.length ? `<tr><td colspan="2" class="group-label">道具（初回のみ）</td></tr>${tools.map(row).join('')}` : ''}
      </tbody></table>
      <div class="total-row"><span>材料の合計 <span class="small muted">（道具は初回のみ ${yen(d.cost.tools)}）</span></span><span class="big num">${yen(d.cost.total)}</span></div>
      <div class="compare"><span>サロンなら <b class="num">${salon[0].toLocaleString()}〜${salon[1].toLocaleString()}円</b></span><span class="muted">同じ系統のメニューの相場</span></div>
      <p class="disclaimer">価格は2026年10月のWeb調査に基づく目安（税込）。店・時期・色数で変わります。同じ色のジェルを持っていれば、その分は不要です。</p>
    </div>`;
  }

  function steps(st, d, side) {
    const list = d.steps, k = st.stepIdx = Math.max(0, Math.min(list.length - 1, st.stepIdx)), specs = specsFor(d, side);
    const acc = d.foot ? 0 : U.accentOf(d.concept), shape = d.foot ? 'square' : st.sel.shape, length = d.foot ? 'short' : st.sel.length;
    const thumb = (x, i) => (x.kind === 'prep-list' ? `<span class="sw icon">${ICON.list}</span>` : x.kind === 'check' ? `<span class="sw icon">${ICON.check}</span>` : `<span class="sw">${T.renderSwatch(E.specAtStep(specs[acc], list, i), d.palette, { shape, length, seed: 11, finger: acc })}</span>`);
    const strip = list.map((x, i) => `<button class="sthumb" data-act="stepgo" data-i="${i}" aria-current="${i === k}" aria-label="手順${i + 1} ${esc(x.title)}">${thumb(x, i)}<span class="sn latin">${i + 1}</span></button>`).join('');
    const now = specs.map(f => E.specAtStep(f, list, k)), marks = E.changedAtStep(specs, list, k);
    const s = list[k], last = k === list.length - 1;
    return `<div class="steps-tab">
      <div class="lv-row"><span class="lab">経験</span>${U.seg(T.LEVELS, 'level-here', st.sel.level, 'aria-label="セルフネイルの経験"')}</div>
      <button class="btn rose block make-btn" data-act="make-open" data-i="${k}"><span class="mb-row">${ICON.play}${k ? `作るモードで、手順${k + 1}から` : '作るモードで始める'}</span><small>1手順ずつ大きな文字で。タイマー${T.voice.available() ? 'と音声案内' : ''}つき</small></button>
      <div class="steps-strip" data-keep-scroll="steps-strip">${strip}</div>
      <div class="step-now">
        ${s.kind ? '' : U.chart(d, side, { specs: now, marks })}
        <div class="eyebrow">Step ${k + 1} / ${list.length}</div>
        <h2>${esc(s.title)}</h2>
        <p class="step-body">${esc(s.body)}${!s.kind && marks.length && marks.length < 5 ? '<span class="muted">（点のついた指に）</span>' : ''}</p>
        ${T.make.stepDetail(st, d, s, k)}
      </div>
      <div class="step-nav"><button class="btn ghost" data-act="stepprev" aria-label="前の手順" ${k === 0 ? 'disabled' : ''}>${ICON.back}</button><button class="btn" data-act="${last ? 'tab' : 'stepnext'}" data-v="look">${last ? '完成図を見る' : '次の手順へ'}</button></div>
    </div>`;
  }

  T.views.detail = st => {
    const d = current(st);
    if (!d) return `${U.bar({ back: true, title: '作り方' })}<p class="muted">デザインを選んでください。</p>`;
    st._design = d;
    const side = sideOf(st, d), saved = T.app.isSaved(d.concept.id, d.paletteIndex);
    const tabs = U.seg([{ id: 'look', name: '完成図' }, { id: 'materials', name: `材料 ${yen(d.cost.total).replace('約', '')}` }, { id: 'steps', name: `手順 ${d.steps.length}` }], 'tab', st.tab, 'aria-label="表示の切り替え"');
    const body = st.tab === 'materials' ? materials(st, d) : st.tab === 'steps' ? steps(st, d, side) : look(st, d, side);
    return `${U.bar({ back: true, title: esc(d.concept.name), right: `<button class="iconbtn" data-act="sheet" data-group="scene" aria-label="条件を変える">${ICON.sliders}</button><button class="iconbtn" data-act="save" aria-pressed="${saved}" aria-label="${saved ? '保存を外す' : '保存する'}">${saved ? ICON.heartFill : ICON.heart}</button>` })}
      ${stage(st, d, side)}
      <div class="tabs">${tabs}</div>
      ${body}`;
  };

  function copyText(txt) {
    const done = () => T.app.toast('レシピをコピーしました');
    const fail = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (err) { T.app.toast('コピーできませんでした'); } ta.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, fail); else fail();
  }
  Object.assign(T.actions, {
    side: (el, st) => { st.side = el.dataset.v; st.fx = 'paint'; T.app.render(); },
    palette: (el, st) => { if (!st.current) return; st.current.paletteIndex = +el.dataset.i; st.fx = 'paint'; T.app.render(); },
    tab: (el, st) => { st.tab = el.dataset.v; if (st.tab !== 'steps') st.stepIdx = 0; T.app.render(); },
    stepgo: (el, st) => { st.stepIdx = +el.dataset.i; T.app.render(); },
    stepnext: (el, st) => { st.stepIdx += 1; T.app.render(); },
    stepprev: (el, st) => { st.stepIdx = Math.max(0, st.stepIdx - 1); T.app.render(); },
    // 経験を変えても、同じ手順（技法・用意するもの・チェック）を開いたままにする
    'level-here': (el, st) => {
      const d0 = current(st), s0 = d0 && d0.steps[Math.max(0, Math.min(d0.steps.length - 1, st.stepIdx))];
      st.sel.level = el.dataset.v; st.answered.level = true;
      const d1 = current(st);
      if (s0 && d1) { const id = T.howto.stepId(s0); let i = d1.steps.findIndex(x => T.howto.stepId(x) === id); if (i < 0) i = d1.steps.findIndex(x => x.stage >= s0.stage && !x.kind); st.stepIdx = Math.max(0, i); }
      T.app.render();
    },
    'tier-here': (el, st) => { st.sel.tier = el.dataset.v; st.answered.tier = true; T.app.render(); },
    save: (el, st) => { T.app.saveCurrent(); T.app.render(); },
    copy: (el, st) => { const d = st._design || current(st); if (d) copyText(E.recipeText(d, st.sel)); },
    share: (el, st) => {
      const d = st._design || current(st); if (!d) return;
      const txt = E.recipeText(d, st.sel), n = T.native;
      (n ? n.share({ title: `tsumé — ${d.concept.name}`, text: txt, dialogTitle: 'レシピを共有' }) : Promise.resolve(false)).then(ok => { if (!ok) copyText(txt); }).catch(() => {});
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
