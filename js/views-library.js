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
      const sel = Object.assign(E.defaults(), x.sel), own = typeof x.paletteIndex === 'string' && st.palettes[x.paletteIndex];
      const d = E.build(c, sel, { season: st.season, paletteIndex: own ? x.paletteIndex : (+x.paletteIndex || 0), palette: own || undefined, toppings: x.toppings || undefined });
      const side = sel.hand === 'left' ? 'right' : 'left';
      const art = d.foot ? T.renderFoot(d.foot, d.palette, { seed: 11, skin: x.skin || st.skin }) : T.renderHand(side === 'left' ? d.left : d.right, d.palette, { side, skin: x.skin || st.skin, shape: sel.shape, length: sel.length, seed: 11, viewBox: '50 50 320 380' });
      return `<div class="mine-card"><button class="card-btn" data-act="open-saved" data-id="${esc(x.id)}"><span class="mine-art">${art}</span><b>${esc(c.name)}</b><span class="small muted">${esc(d.palette.name)} ・ ${esc(E.situation(sel, st.season).name)}</span>${Number.isFinite(x.madeAt) ? `<span class="made">${ICON.check}作った ${new Date(x.madeAt).getMonth() + 1}/${new Date(x.madeAt).getDate()}</span>` : ''}</button><button class="link" data-act="remove" data-id="${esc(x.id)}">削除</button></div>`;
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

  // 図鑑の品ぞろえはエディタのトレイと同じ。押すと大きさ・値段・つけ方のシートが開き、指にのせて試せる
  const BOOK_TITLE = { stone: 'ストーン', pearl: 'パール・ブリオン・スタッズ', metal: 'メタルパーツ', bijou: 'ビジュー', flower: '3Dフラワー・チェーン' };
  const BOOK_SIZE = { stone: 'L', pearl: 'L', bullion: 'S', stud: 'L', charm: 'S', bijou: 'S', flower3d: 'S', chain: 'S' };
  function partLabel(it) {
    const metal = it.v === 'silver' ? '・銀' : it.v === 'rose' ? '・ローズ' : '・金';
    if (it.k === 'stone') return D.STONES[it.v].name;
    if (it.k === 'pearl') return D.PEARLS[it.v].name;
    if (it.k === 'bullion') return 'ブリオン' + metal;
    if (it.k === 'stud') return D.STUDS[it.shape || 'round'].name + 'スタッズ';
    if (it.k === 'charm') return D.CHARMS[it.shape].name;
    if (it.k === 'bijou') return D.BIJOUX[it.v].name;
    if (it.k === 'flower3d') return D.FLOWERS[it.v].name;
    return 'チェーン' + metal;
  }
  function partsBook() {
    const btn = it => `<button class="part" data-act="part-open" data-k="${it.k}" data-v="${it.v}" data-shape="${it.shape || ''}" aria-label="${esc(T.toppings.fullName(it))}：大きさ・値段・つけ方"><span class="part-art">${T.partSwatch(Object.assign({ s: BOOK_SIZE[it.k] }, it, it.k === 'chain' ? { r: 0 } : {}), 17)}</span><span class="part-name">${esc(partLabel(it))}</span></button>`;
    const rows = D.TRAY.map(t => `<div class="parts-row"><h3>${esc(BOOK_TITLE[t.id] || t.name)}</h3><div class="parts-grid">${t.items.map(btn).join('')}</div></div>`).join('');
    const sa = T.MATERIALS.stone_accent.tiers;
    const prices = [['100均', sa.coin], ['専門店', sa.petit], ['ブランド', sa.luxe]].map(([k, t]) => `<div class="price-card"><span class="pk">${k}</span><span class="py latin">${t.y.toLocaleString()}円</span><span class="pp">${esc(t.p)}<br>${esc(t.s)}</span></div>`).join('');
    return `<div class="parts-book">
      <p class="small muted parts-lead">${ICON.hand}パーツを押すと、大きさ・値段・つけ方が見られて、そのまま指にのせて試せます。</p>
      <button class="btn ghost block" data-act="nav" data-view="shop">${ICON.bag}SHOPで、セリアなどのアイテムから探す</button>
      <div class="card flat parts-card">${rows}</div>
      <div class="group-label">ストーンの値段（同じ置き方のまま）</div>
      <div class="price-cards">${prices}</div>
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
        ${card('05', '作るモードで、キレイに', '経験に合わせて手順の細かさが変わります。1手順ずつ大きな文字で、硬化のタイマーつき。最後に仕上がりを5つの点で確かめます。', 'start', '', 'デザインを選ぶ')}
        ${card('06', 'ことばで咲く', '「金木犀の帰り道」のような一行から、その色で作れる3案と名前を出します。', 'nav', 'data-view="kotoba"', 'ことばで咲かせる')}
        ${card('07', '声で聞く', '作るモードの音声案内は、手順とタイマーを読み上げます。tsumé ソムリエは、映える角度・光・背景を約30〜60秒で話します。声は端末の読み上げです。', 'start', '', 'デザインを選ぶ')}
      </div>
      ${T.ai.available() ? `<div class="card flat"><h3>AIで読み取る</h3><p class="small muted">「ことばで咲く」と「ソムリエ」の言い回しで、打った言葉やデザインの説明を、中継サーバーを通して Google Gemini に送ります。tsumé は保存しません。</p><div class="btnrow">${T.ai.consent() === 'yes' ? '<button class="btn ghost sm" data-act="ai-off">AIを使わない</button>' : '<button class="btn ghost sm" data-act="ai-ask">AIを使う</button>'}</div></div>` : ''}
      <div class="card flat"><h3>参考にした情報</h3><ul class="notes">${T.HOWTO.SOURCES.map(([t]) => `<li>${esc(t)}</li>`).join('')}</ul><p class="small muted">作り方は2026年10月に、ネイルの協会・公的機関・メーカー・ネイリストの情報をもとにまとめました。硬化の時間などは、お使いのライトとジェルの説明書を優先してください。</p></div>
      <div class="card flat"><h3>価格と情報について</h3><p class="small muted">価格は2026年10月のWeb調査に基づく目安（税込）。店・時期で変わります。個人情報の収集・広告・課金はありません。保存した内容はこの端末の中だけにあります。作るモードの「声で操作する」を押したときだけ、マイクの声がブラウザの音声認識に送られます。</p></div>`;
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
    'part-open': (el, st) => { const it = { k: el.dataset.k, v: el.dataset.v }; if (el.dataset.shape) it.shape = el.dataset.shape; st.partItem = it; st.sheet = 'part'; T.app.render(); },
    // エディタから図鑑に来たときはエディタへ戻る（指の選択を保つ）。それ以外は見せ場の指で開く
    'part-try': (el, st) => {
      const it = st.partItem; if (!it) return;
      const from = T.app.peek(), fromEditor = from === 'editor';
      st.sheet = null;
      // 試着の画面から来たときは、そこで選んでいるデザインにのせる
      if ((!st.current || from === 'try') && T.tryAdopt) T.tryAdopt(st);
      if (!fromEditor) T.editor.enter(st);
      T.editor.addPart(st, it); st.fx = 'pop';
      if (fromEditor) T.app.back(); else T.app.go('editor');
      T.app.toast(`${T.FINGER_NAMES[st.editor.finger] || '親指'}にのせました。ドラッグで動かせます`);
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
