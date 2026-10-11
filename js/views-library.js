/* tsumé — 色から探す・マイデザイン・素材とトッピングの図鑑・使い方 */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui, D = T.TOPPINGS;
  const { esc, ICON, byId } = U;
  const clone = o => JSON.parse(JSON.stringify(o));

  T.views.colors = st => {
    const s = T.SEASONS[st.season], cur = st.sel.color;
    const btn = (n, c) => `<button class="color-btn" data-act="color" data-hex="${c}" data-name="${esc(n)}" aria-pressed="${cur === c}"><i style="background:${c}"></i><span>${esc(n)}</span></button>`;
    return `${U.bar({ back: true, title: '色から探す', right: cur ? '<button class="btn ghost sm" data-act="clearcolor">色をクリア</button>' : '' })}
      <p class="small muted">色をタップすると、その色がいちばん似合う案を提案します。シーンや予算はあとから足せます。</p>
      <div class="group-label">${esc(s.name)}の色</div>
      <div class="color-grid">${s.colors.map(([n, c]) => btn(n, c)).join('')}</div>
      <div class="group-label">すべての色</div>
      <div class="color-grid">${T.COLORS.map(x => btn(x.name, x.hex)).join('')}</div>`;
  };

  T.views.mine = st => {
    if (!st.saved.length) return `${U.bar({ back: true, title: 'マイデザイン' })}<div class="empty card flat"><p>まだ保存したデザインはありません。</p><button class="btn rose" data-act="start">${ICON.sparkle}わたしに合うネイルを探す</button></div>`;
    const cards = st.saved.map(x => {
      const c = byId(T.CONCEPTS, x.conceptId); if (!c) return '';
      const sel = Object.assign(E.defaults(), x.sel), d = E.build(c, sel, { season: st.season, paletteIndex: x.paletteIndex, toppings: x.toppings || undefined });
      const side = sel.hand === 'left' ? 'right' : 'left';
      const art = d.foot ? T.renderFoot(d.foot, d.palette, { seed: 11 }) : T.renderHand(side === 'left' ? d.left : d.right, d.palette, { side, skin: x.skin || st.skin, shape: sel.shape, length: sel.length, seed: 11, viewBox: '50 50 320 380' });
      return `<div class="mine-card"><button class="card-btn" data-act="open-saved" data-id="${x.id}"><span class="mine-art">${art}</span><b>${esc(c.name)}</b><span class="small muted">${esc(d.palette.name)} ・ ${esc(E.situation(sel, st.season).name)}</span></button><button class="link" data-act="remove" data-id="${x.id}">削除</button></div>`;
    }).join('');
    return `${U.bar({ back: true, title: 'マイデザイン', right: `<span class="small muted">${st.saved.length}件</span>` })}<div class="mine-grid">${cards}</div>`;
  };

  function materialsList(state) {
    const stores = ['all', 'ダイソー', 'セリア', 'キャンドゥ', '専門店', 'ブランド'];
    const brandish = s => /OPI|シャネル|ディオール|スワロフスキー|KOKOIST|プリジェル|ageha|uka/.test(s);
    const rows = Object.entries(T.MATERIALS).map(([id, m]) => ({ id, m }));
    const match = tierObj => { const st = state.matStore; if (st === 'all') return true; if (st === 'ブランド') return brandish(tierObj.s); if (st === '専門店') return /専門店|ネイル工房|グレースガーデン|BLAZE/.test(tierObj.s); return tierObj.s.includes(st); };
    const list = rows.map(({ m }) => { const tiers = T.TIERS.filter(t => m.tiers[t] && match(m.tiers[t])); if (!tiers.length) return ''; return `<div class="mat-card"><div><b>${esc(m.name)}</b><div class="tier-strip">${tiers.map(t => `<span>${esc(T.TIER_INFO[t].label)}: ${esc(m.tiers[t].p)}（${esc(m.tiers[t].s)}）${m.tiers[t].y.toLocaleString()}円</span>`).join('')}</div></div><div class="pr num">${m.tiers[tiers[0]].y.toLocaleString()}円〜</div></div>`; }).join('');
    return `<div class="store-tabs">${stores.map(s => `<button class="pill" data-act="store" data-s="${esc(s)}" aria-pressed="${state.matStore === s}">${s === 'all' ? 'すべて' : esc(s)}</button>`).join('')}</div>
      <div class="card flat">${list || '<p class="muted">該当なし</p>'}</div>
      <div class="card flat"><h3>100均3社の得意分野</h3><ul class="notes"><li>セリア: カラージェル85色超、マグネットジェル、ミラーパウダー、ピールオフベース、カラーベースコート。品揃えが最多。</li><li>キャンドゥ: ニュアンスカラーとマグネット13色、ハードラインジェル、ネイルシール（着物・リボン・花）。</li><li>ダイソー: たっぷり容量のカラージェル、マグネット10色、オーロラパウダー、UV-LEDライト、ネイルチップ120枚。</li></ul></div>`;
  }

  function partsBook() {
    const row = (title, items, box) => `<div class="parts-row"><h3>${esc(title)}</h3><div class="parts-grid">${items.map(([it, label]) => `<div class="part"><span class="part-art">${T.partSwatch(it, box)}</span><span class="part-name">${esc(label)}</span></div>`).join('')}</div></div>`;
    const sa = T.MATERIALS.stone_accent.tiers;
    const prices = [['100均', sa.coin], ['専門店', sa.petit], ['ブランド', sa.luxe]].map(([k, t]) => `<div class="price-card"><span class="pk">${k}</span><span class="py latin">${t.y.toLocaleString()}円</span><span class="pp">${esc(t.p)}<br>${esc(t.s)}</span></div>`).join('');
    return `<div class="parts-book">
      <div class="card flat parts-card">
        ${row('ストーン', Object.entries(D.STONES).map(([v, c]) => [{ k: 'stone', v, s: 'L' }, c.name]), 17)}
        ${row('パール・粒・スタッズ', Object.entries(D.PEARLS).map(([v, c]) => [{ k: 'pearl', v, s: 'L' }, c.name]).concat([[{ k: 'bullion', v: 'gold', s: 'S' }, 'ブリオン'], [{ k: 'chain', v: 'gold', s: 'S', r: 0 }, 'チェーン'], [{ k: 'stud', v: 'silver', shape: 'square', s: 'L' }, 'スタッズ']]), 17)}
        ${row('メタルパーツ', Object.keys(D.CHARMS).map(sh => [{ k: 'charm', shape: sh, v: 'gold', s: 'S' }, D.CHARMS[sh].name]), 17)}
        ${row('ビジュー・3Dフラワー', Object.entries(D.BIJOUX).slice(0, 4).map(([v, c]) => [{ k: 'bijou', v, s: 'S' }, c.name]).concat(Object.entries(D.FLOWERS).slice(0, 2).map(([v, c]) => [{ k: 'flower3d', v, s: 'S' }, c.name])), 17)}
      </div>
      <div class="group-label">ストーンの値段（同じ置き方のまま）</div>
      <div class="price-cards">${prices}</div>
      <div class="card flat tips"><h3>つけ方のコツ</h3><ol>
        <li>置く場所にトップジェルを少しのせ、ピンセットで置いて硬化。</li>
        <li>ストーンの表面にはトップを塗らない。まわりだけ固めると輝きが残る。</li>
        <li>大きいパーツは、まわりをジェルで囲んでもう一度硬化。マニキュアならネイルグルーで。</li>
      </ol></div>
      <p class="disclaimer">価格は2026年10月の調査に基づく目安（税込）。店・時期で変わります。</p>
    </div>`;
  }
  T.views.materials = st => {
    const tabs = U.seg([{ id: 'materials', name: '素材' }, { id: 'toppings', name: 'トッピング' }], 'mattab', st.matTab, 'aria-label="図鑑の切り替え"');
    return `${U.bar({ back: true, title: '素材とトッピングの図鑑' })}<div class="tabs">${tabs}</div>${st.matTab === 'toppings' ? partsBook() : materialsList(st)}`;
  };

  T.views.about = () => {
    const card = (n, h, p, act, extra, label) => `<div class="card flat about-card"><div class="eyebrow">${n}</div><h3>${esc(h)}</h3><p class="small muted">${esc(p)}</p><button class="btn ghost sm" data-act="${act}" ${extra}>${esc(label)}</button></div>`;
    return `${U.bar({ back: true, title: '使い方' })}
      <div class="feature">
        ${card('01', '状況から設計する', '結婚式のお呼ばれと推しのライブでは、映える光も守るマナーも違う。6つの質問で状況を決めてから、色と技法を組みます。', 'start', '', '質問に答える')}
        ${card('02', 'トッピングで仕上げる', '塗りと光は土台。ストーン・パール・メタルパーツで完成させます。量はシーンに合わせて自動で調整し、自分で置き直すこともできます。', 'nav', 'data-view="try"', '試着してみる')}
        ${card('03', '予算で素材だけ変わる', '同じ設計のまま、100均のストーンがスワロフスキーに。価格は2026年10月の調査目安。', 'mattab-open', '', 'トッピングの図鑑を見る')}
        ${card('04', '利き手は、置くだけ', '利き手側は描かず、パーツを置くだけの簡単な作り方に自動で差し替えます。', 'start', '', '質問に答える')}
      </div>
      <div class="card flat"><h3>価格と情報について</h3><p class="small muted">価格は2026年10月のWeb調査に基づく目安（税込）。店・時期で変わります。個人情報の収集・広告・課金はありません。保存した内容はこの端末の中だけにあります。</p></div>`;
  };

  Object.assign(T.actions, {
    color: (el, st) => { st.sel.color = el.dataset.hex; st.sel.colorName = el.dataset.name; st.seed = 0; T.app.go('proposals'); },
    'open-saved': (el, st) => {
      const x = st.saved.find(y => y.id === el.dataset.id); if (!x) return;
      st.sel = Object.assign(E.defaults(), clone(x.sel));
      st.current = { conceptId: x.conceptId, paletteIndex: x.paletteIndex };
      const k = U.customKey(x.conceptId, x.paletteIndex);
      if (x.toppings) st.custom[k] = clone(x.toppings); else delete st.custom[k];
      T.app.persist();
      st.side = null; st.tab = 'look'; st.stepIdx = 0;
      T.app.go('detail');
    },
    remove: (el, st) => { st.saved = st.saved.filter(y => y.id !== el.dataset.id); T.app.persist(); T.app.render(); },
    store: (el, st) => { st.matStore = el.dataset.s; T.app.render(); },
    mattab: (el, st) => { st.matTab = el.dataset.v; T.app.render(); },
    'mattab-open': (el, st) => { st.matTab = 'toppings'; T.app.go('materials'); },
  });
})(typeof window !== 'undefined' ? window : globalThis);
