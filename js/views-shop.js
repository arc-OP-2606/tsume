/* tsumé — アイテムSHOP（一覧・アイテムシート）と、アイテムを爪にのせる処理（エディタのトレイ・ドラッグと共通） */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, S = T.SHOP, D = T.TOPPINGS;
  const { esc, ICON } = U;
  const clone = o => JSON.parse(JSON.stringify(o));
  const PREFIX = /^(ジェルネイル ライト対応 |ジェルネイル |ネイルエナメル S |ネイルシール |チアミーモア ポイントネイルシール |ネイルパーツ |ジェル風ネイルシールハンド |ジェルネイルシール |ネイル用ホログラム )/;
  const short = it => it.short || it.name.replace(PREFIX, '').replace(/^(マットカラー|シアー|パール|ユニコーンカラー|フラッシュ) /, '');
  const price = it => `${it.price.toLocaleString()}円`;
  const kindOf = it => (it.apply.paint ? (it.apply.paint.cover ? 'cover' : 'paint') : it.apply.sticker ? 'sticker' : it.apply.flake ? 'flake' : 'part');
  const HOW = {
    paint: 'その爪の色と仕上げが、このアイテムに変わります。',
    cover: '爪1本ぶんの模様のシール。その爪全体に貼ります。',
    sticker: 'シールを爪にのせます。動かす・大きさ・回転ができます。のせるたびに次の柄になります。',
    flake: '小さなハートを散らします。',
    part: 'パーツを爪にのせます。動かす・大きさ・回転ができます。',
  };

  // ---- 爪にのせる（タップは今の指、ドラッグは落とした爪・場所に）
  function setPaint(st, entry) {
    T.editor.pushUndo(st);
    const c = T.editor.ensureCustom(st), e = st.editor;
    c.paint = c.paint || {};
    const sides = e.side === 'foot' ? ['foot'] : e.both ? ['left', 'right'] : [e.side];
    sides.forEach(s => { if (!Array.isArray(c.paint[s]) || c.paint[s].length !== 5) c.paint[s] = [null, null, null, null, null]; c.paint[s][e.finger] = entry ? clone(entry) : null; });
    T.app.persist();
  }
  function next(st, it, list) {
    st.shopCycle = st.shopCycle || {};
    const i = st.shopCycle[it.id] || 0; st.shopCycle[it.id] = i + 1;
    return list[i % list.length];
  }
  /** アイテムを今の指に。pos があればその位置（爪の中の 0〜1）に置く。何をしたかの文を返す */
  function apply(st, id, pos) {
    const it = S.byId(id); if (!it || !st.current) return '';
    const name = T.FINGER_NAMES[st.editor.finger] || '親指';
    const kind = kindOf(it);
    if (kind === 'paint' || kind === 'cover') { setPaint(st, Object.assign({ shop: it.id }, it.apply.paint)); st.fx = 'paint'; return `${name}を「${short(it)}」にしました`; }
    let part;
    if (kind === 'sticker') { const [v, col] = next(st, it, it.apply.sticker); part = { k: 'sticker', v, col }; }
    else if (kind === 'flake') part = { k: 'flake', v: it.apply.flake };
    else part = clone(next(st, it, it.apply.part));
    part.shop = it.id;
    if (kind === 'flake') T.editor.scatter(st, part, pos); else if (pos) T.editor.placePart(st, part, pos); else T.editor.addPart(st, part);
    st.fx = 'pop';
    return `${name}に「${short(it)}」をのせました`;
  }

  // ---- 持ってる（色はジェル・マニキュアの「持っている色」、ほかは items）
  const colorKind = it => (it.apply.paint && it.apply.paint.t === 'one_color' ? (it.illo === 'polish' ? 'polish' : 'gel') : null);
  function owned(st, it) {
    const k = colorKind(it), mc = st.myColors || {};
    return k ? (mc[k] || []).some(c => c.shop === it.id) : (mc.items || []).some(c => c.shop === it.id);
  }
  function toggleOwned(st, it) {
    st.myColors = st.myColors || { gel: [], polish: [], items: [] };
    const k = colorKind(it), list = k ? (st.myColors[k] = st.myColors[k] || []) : (st.myColors.items = st.myColors.items || []);
    const i = list.findIndex(c => c.shop === it.id);
    if (i >= 0) list.splice(i, 1);
    else list.push(k ? { id: 'c' + Date.now().toString(36), hex: it.apply.paint.c.base.toUpperCase(), name: short(it).slice(0, 20), shop: it.id } : { id: 'o' + Date.now().toString(36), shop: it.id });
    T.app.persist();
    return i < 0;
  }
  /** 持ってる SHOP アイテム（写真で取り込んだパーツは T.scan があればそちらで並べる） */
  function ownedItems(st) {
    const mc = st.myColors || {}, ids = new Set([].concat(mc.items || [], mc.gel || [], mc.polish || []).map(c => c.shop).filter(Boolean));
    return S.ITEMS.filter(it => ids.has(it.id));
  }
  const MINE = { id: 'mine', name: '持ってる' };

  // ---- SHOP 画面
  const card = it => `<button class="shop-card" data-act="shop-open" data-id="${it.id}"><span class="sc-art">${T.renderItem(it)}</span><span class="sc-name">${esc(short(it))}</span><span class="sc-store">${esc(it.store)} ${price(it)}</span></button>`;
  const NOTE = `価格は参考（${S.CHECKED.slice(0, 4)}年${+S.CHECKED.slice(5, 7)}月の調べ）。取扱いは店舗で確認してください。イラストは tsumé が描いたもので、実際の商品とは異なります。各社とは関係ありません。`;
  T.views.shop = st => {
    const cats = [MINE].concat(S.CATS), tab = cats.find(c => c.id === st.shopTab) || S.CATS[0];
    const items = tab.id === 'mine' ? ownedItems(st) : S.ITEMS.filter(x => x.cat === tab.id);
    const empty = tab.id === 'mine' && !items.length ? `<p class="small muted shop-empty">持っているアイテムは、各アイテムの［持ってる］で入れられます。${T.views.scan ? '写真から取り込むこともできます。' : ''}</p>` : '';
    return `${U.bar({ back: true, title: 'SHOP' })}
      <p class="small muted shop-lead">アイテムを選ぶと、そのまま爪にのせてデザインできます。</p>
      ${tab.id === 'sticker' ? `<button class="mix-link link" data-act="nav" data-view="stickers">${U.ICON.wand}気に入るシールが無ければ、シール工房で自分で作る${U.ICON.chev}</button>` : ''}
      <div class="shop-tabs" data-keep-scroll="shop-tabs">${cats.map(c => `<button class="pill" data-act="shop-tab" data-v="${c.id}" aria-pressed="${c.id === tab.id}">${esc(c.name)}</button>`).join('')}</div>
      ${tab.id === 'mine' && T.views.scan ? `<button class="mix-link link" data-act="nav" data-view="scan">${ICON.camera}持っているパーツ・シールを写真から取り込む${ICON.chev}</button>` : ''}
      ${empty}<div class="shop-grid">${items.map(card).join('')}</div>${tab.id === 'mine' && T.scan && T.scan.ownedCards ? T.scan.ownedCards(st) : ''}
      <p class="disclaimer">${NOTE}</p>`;
  };
  // アイテムシート（大きいイラスト・使い方・JAN・［爪にのせる］）
  function sheet(st, op) {
    const it = S.byId(st.shopItem); if (!it) return '';
    const kind = kindOf(it);
    const jan = it.jan ? `<div class="jan"><span class="lab">JAN</span><b>${esc(it.jan)}</b><small>店頭で商品名とこの番号を伝えると、取り寄せできます（セリアの案内）。</small></div>` : `<p class="small muted">${it.official ? '' : '取扱いは店舗によって違います。'}</p>`;
    const H = T.HOWTO, polish = st.sel.method === 'polish';
    const tips = kind === 'part' ? (H.TOPPING[it.apply.part[0].k] || {})[polish ? 'polish' : 'gel'] : kind === 'sticker' || kind === 'cover' ? H.TOPPING.sticker[polish ? 'polish' : 'gel'] : kind === 'flake' ? H.TOPPING.flake[polish ? 'polish' : 'gel'] : null;
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet item-sheet${op}" role="dialog" aria-modal="true" aria-label="${esc(it.name)}">
        <header class="sheet-head"><b>${esc(short(it))}</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <div class="item-hero">${T.renderItem(it)}</div>
          <p class="item-name">${esc(it.name)}</p>
          <p class="item-store"><b>${esc(it.store)}</b>　<span class="num">${price(it)}</span><span class="muted">（参考）</span></p>
          ${jan}
          <p class="small">${HOW[kind]}</p>
          ${tips ? `<div class="part-tips"><h3>キレイにつけるコツ（${polish ? 'マニキュア' : 'ジェル'}）</h3><ol>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>` : ''}
          <p class="disclaimer">${NOTE}</p>
        </div>
        <footer class="sheet-foot btnrow"><button class="btn ghost" data-act="shop-own" data-id="${it.id}" aria-pressed="${owned(st, it)}">${owned(st, it) ? `${ICON.check}持ってる` : '持ってる'}</button><button class="btn rose" data-act="shop-try" data-id="${it.id}">${ICON.wand}爪にのせる</button></footer>
      </section>`;
  }
  /** エディタ下のトレイ（ドラッグ・タップ） */
  function tray(st) {
    const cats = [MINE].concat(S.CATS), tab = cats.find(c => c.id === st.shopTab) || S.CATS[0];
    const items = tab.id === 'mine' ? ownedItems(st) : S.ITEMS.filter(x => x.cat === tab.id);
    const extra = tab.id === 'mine' && T.scan && T.scan.trayItems ? T.scan.trayItems(st) : '';
    const none = tab.id === 'mine' && !items.length && !extra ? '<p class="tray-empty small muted">SHOP の各アイテムの［持ってる］で入れると、ここに並びます。</p>' : '';
    return `<div class="ed-shop"><div class="ed-tabs shop-tabs" role="group" aria-label="SHOPの種類" data-keep-scroll="ed-shop-tabs">${cats.map(c => `<button data-act="shop-tab" data-v="${c.id}" aria-pressed="${c.id === tab.id}">${esc(c.name)}</button>`).join('')}</div>
      ${none}<div class="shop-tray" data-keep-scroll="shop-tray-${tab.id}">${extra}${items.map(it => `<button class="shop-item" data-act="shop-add" data-id="${it.id}" data-drag="shop" aria-label="${esc(short(it))}をのせる"><span class="si-art">${T.renderItem(it)}</span><span class="si-name">${esc(short(it))}</span><span class="si-price">${esc(it.store)}</span></button>`).join('')}</div>
      <p class="tray-hint">${ICON.hand}爪までドラッグ、またはタップでのせる</p></div>`;
  }
  /** このデザインで使うアイテム（材料タブ） */
  function used(d) {
    const ids = new Set(), changed = new Set();
    (d.foot || d.left.concat(d.right)).forEach(f => {
      if (f.shop) { ids.add(f.shop); const it = S.byId(f.shop); if (it && it.apply.paint && !it.apply.paint.cover && it.apply.paint.t !== f.t) changed.add(f.shop); }
      (f.toppings || []).forEach(t => { if (t.shop) ids.add(t.shop); });
    });
    const items = Array.from(ids).map(S.byId).filter(Boolean);
    if (!items.length) return '';
    const row = it => `<button class="used-item" data-act="shop-open" data-id="${it.id}"><span class="ui-art">${T.renderItem(it)}</span><span class="ui-t"><b>${esc(short(it))}</b><small>${esc(it.store)} ${price(it)}${changed.has(it.id) ? '　マニキュアでは近い仕上げで描いています' : ''}</small></span></button>`;
    return `<div class="used-items"><div class="group-label">このデザインで使うアイテム（SHOP）</div>${items.map(row).join('')}<p class="disclaimer">${NOTE}</p></div>`;
  }

  Object.assign(T.actions, {
    'shop-tab': (el, st) => { st.shopTab = el.dataset.v; T.app.render(); },
    'shop-own': (el, st) => { const it = S.byId(el.dataset.id); if (!it) return; const on = toggleOwned(st, it); T.app.render(); T.app.toast(on ? '「持ってる」に入れました' : '「持ってる」から外しました'); },
    'shop-open': (el, st) => { st.shopItem = el.dataset.id; st.sheet = 'item'; T.app.render(); },
    'shop-add': (el, st) => { const msg = apply(st, el.dataset.id); if (msg) { T.app.render(); T.app.toast(msg); } },
    'shop-drop': (el, st, p) => { if (p.finger != null) { st.editor.finger = p.finger; st.editor.selected = null; } const msg = (T.scan && T.scan.drop && T.scan.drop(st, p.id, p.pos)) || apply(st, p.id, p.pos); if (msg) { T.app.render(); T.app.toast(msg); } },
    // シートの［爪にのせる］。試着の画面から開いた SHOP なら試着のデザインに、作り方（材料）から開いたなら今のデザインにのせる
    'shop-try': (el, st) => {
      const id = el.dataset.id;
      st.sheet = null;
      if (st.view === 'editor') { const msg = apply(st, id); T.app.render(); T.app.toast(msg); return; }
      if ((!st.current || (st.view === 'shop' && T.app.peek() === 'try')) && T.tryAdopt) T.tryAdopt(st);
      T.editor.enter(st);
      const msg = apply(st, id);
      T.app.go('editor');
      T.app.toast(msg);
    },
  });
  T.shop = { apply, sheet, tray, used, short, kindOf, setPaint, NOTE, owned, toggleOwned, ownedItems };
})(typeof window !== 'undefined' ? window : globalThis);
