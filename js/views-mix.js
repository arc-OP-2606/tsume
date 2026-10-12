/* tsumé — 色を混ぜて作る（画面）。作りたい色と持っている色から、混ぜ方（色・割合・手順）を出す。
   写真から色を取るのは端末の中だけ（送らない）。色の名前が辞書に無いときだけ AI（同意があるとき） */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui, M = T.mix;
  const { esc, ICON } = U;
  const hasDOM = typeof document !== 'undefined';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const KINDS = [{ id: 'gel', name: 'ジェル' }, { id: 'polish', name: 'マニキュア' }];
  const mx = st => st.mix || (st.mix = { target: null, kind: 'gel' });
  const owned = st => st.myColors[mx(st).kind] || (st.myColors[mx(st).kind] = []);
  const newId = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  // 色に近い名前（辞書の中でいちばん近い色）
  function nearName(hex) {
    const t = M.spec(hex).lab; let best = null;
    (T.COLORS || []).concat(M.PRIMARIES).forEach(c => { const d = Math.hypot(...M.spec(c.hex).lab.map((v, i) => v - t[i])); if (!best || d < best.d) best = { d, name: c.name }; });
    return best ? `${best.name}っぽい色` : '取った色';
  }
  const dot = (hex, cls = '') => `<i class="mx-dot${cls ? ' ' + cls : ''}" style="background:${HEX.test(hex) ? hex : '#ccc'}"></i>`;

  // ---- 画面
  function targetBlock(st) {
    const m = mx(st), t = m.target, d = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex);
    const fromDesign = d ? Array.from(new Set(['base', 'accent', 'tip', 'deep', 'light'].map(r => d.palette[r]).filter(h => HEX.test(h)))) : [];
    const mic = T.voice.listenAvailable() ? `<button class="iconbtn" data-act="mix-mic" aria-label="声で色の名前を言う">${ICON.mic}</button>` : '';
    return `<section class="mx-card">
      <h2 class="mx-h">作りたい色</h2>
      <div class="mx-target">${t ? `${dot(t.hex, 'big')}<div><b>${esc(t.name)}</b><span class="small muted">${esc(t.hex)}${t.by === 'ai' ? `・AI（${esc(t.model || 'Gemini')}）で読み取り` : ''}</span></div>` : `${dot('#EEE', 'big empty')}<div><b>まだ選んでいません</b><span class="small muted">色の名前・色の見本・写真から選べます</span></div>`}</div>
      <div class="mx-form"><input id="mx-word" class="kt-input" type="text" maxlength="30" placeholder="例：ミントグリーン、くすみピンク" value="${esc(m.word || '')}" enterkeyhint="search" autocomplete="off" aria-label="作りたい色の名前">${mic}<button class="btn rose" data-act="mix-word">${m.busy ? '…' : '探す'}</button></div>
      <div class="mx-tools"><label class="chip">${ICON.sliders}色を選ぶ<input id="mx-color-target" type="color" value="${t ? t.hex : '#A8DCC8'}" class="sr"></label><button class="chip" data-act="mix-photo" data-to="target">${ICON.camera}写真から</button></div>
      ${fromDesign.length ? `<div class="mx-from"><span class="small muted">いまのデザインの色</span>${fromDesign.map(h => `<button class="mx-swatch" data-act="mix-target" data-hex="${h}" aria-label="${h} を作りたい色にする">${dot(h)}</button>`).join('')}</div>` : ''}
    </section>`;
  }
  function ownedBlock(st) {
    const m = mx(st), list = owned(st), k = KINDS.find(x => x.id === m.kind);
    return `<section class="mx-card">
      <div class="mx-head"><h2 class="mx-h">持っている色</h2>${U.seg(KINDS, 'mix-kind', m.kind, 'aria-label="ジェルかマニキュアか"')}</div>
      <p class="small muted">${k.name}同士で混ぜます（ジェルとマニキュアは混ぜられません）。ラメ・マグネットは入れないでください。</p>
      <div class="mx-owned">${list.length ? list.map(c => `<span class="mx-chip">${dot(c.hex)}<span>${esc(c.name)}</span><button class="mx-x" data-act="mix-del" data-id="${esc(c.id)}" aria-label="${esc(c.name)} を外す">${ICON.close}</button></span>`).join('') : '<span class="small muted">まだありません。下のボタンから入れてください。</span>'}</div>
      <div class="mx-tools">
        <button class="chip" data-act="mix-shop">${ICON.bag}SHOPの色から</button>
        <label class="chip">${ICON.plus}色を選んで足す<input id="mx-color-own" type="color" value="#F5D000" class="sr"></label>
        <button class="chip" data-act="mix-photo" data-to="owned">${ICON.camera}写真から足す</button>
        <button class="chip" data-act="mix-primaries">三原色セット</button>
      </div>
    </section>`;
  }
  function recipeCard(st, r, i) {
    const m = mx(st), total = r.items.reduce((s, x) => s + x.parts, 0);
    const steps = `<ol class="mx-steps">${M.howTo(r, m.kind).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
    return `<article class="mx-recipe${i === 0 ? ' best' : ''}">
      <div class="mx-compare">${dot(m.target.hex, 'mid')}<span class="mx-arrow">→</span>${dot(r.hex, 'mid')}<div><b class="mx-level ${r.level.id}">${r.level.name}</b><span class="small muted">左が作りたい色、右が混ぜた色</span></div></div>
      <div class="mx-bar" aria-hidden="true">${r.items.map(x => `<i style="background:${x.hex};flex:${x.parts}"></i>`).join('')}</div>
      <p class="mx-ratio">${r.items.map(x => `${dot(x.hex, 'sm')}${esc(x.name)} <b class="num">${x.parts}</b>`).join('<span class="mx-colon">:</span>')}<span class="small muted">（${total > 1 ? '量の割合' : 'そのまま'}）</span></p>
      ${i === 0 ? steps : `<details class="mx-more"><summary>混ぜ方を見る</summary>${steps}</details>`}
      ${T.voice.available() ? `<button class="link" data-act="mix-say" data-i="${i}">${ICON.voice}読み上げる</button>` : ''}
    </article>`;
  }
  function results(st) {
    const m = mx(st), list = owned(st);
    if (!m.target) return '';
    // 2つ目からは「難しい」ものを出さない（読む量を減らす）
    const rs = (list.length ? M.recipes(list, m.target.hex) : []).filter((r, i) => i === 0 || r.level.id !== 'far');
    const buy = list.length ? M.suggestBuy(list, m.target.hex, m.kind) : null;
    const prim = (!rs.length || rs[0].level.id === 'far') ? M.withPrimaries(m.target.hex) : null;
    st.mixLast = rs;
    return `<section class="mx-card"><h2 class="mx-h">混ぜ方</h2>
      ${rs.length ? rs.map((r, i) => recipeCard(st, r, i)).join('') : '<p class="small muted">持っている色を入れると、混ぜ方を出します。</p>'}
      ${buy ? `<div class="mx-buy">${ICON.bag}<div><b>この1本を足すと、${esc(buy.recipe.level.name)}</b><span>${esc(T.shop ? T.shop.short(buy.item) : buy.item.name)}（${esc(buy.item.store)}・${buy.item.price}円）: ${esc(M.ratioText(buy.recipe))}</span></div></div>` : ''}
      ${prim ? `<div class="mx-buy">${dot(prim.hex, 'sm')}<div><b>三原色と白・黒があれば: ${esc(prim.level.name)}</b><span>${esc(M.ratioText(prim))}</span></div></div>` : ''}
    </section>`;
  }
  const TIPS = [
    '色の三原色は シアン（青緑）・マゼンタ（赤紫）・イエロー。これに白と黒があれば、たいていの色が作れます。',
    '絵の具と同じで、混ぜるほど暗く・くすみます。鮮やかな色は、混ぜるより1本買うほうがきれいです。',
    '多い色を先に出し、少ない色・暗い色を少しずつ足します。暗い色はほんの少しで大きく変わります。',
    '白を足すと明るいパステルに、反対の色（補色）を少し足すと、くすみカラーになります。',
    'ジェルは同じメーカー同士で混ぜるのが基本です。メーカーの説明書を優先してください。',
    '混ぜている間は日光やライトに当てないでください。余りは光を通さない容器に入れます。',
    '画面の色と実物の色は違います。1本に塗って硬化し、色を確かめてから全部に塗ります。',
  ];
  T.views.mix = st => {
    const m = mx(st);
    return `${U.bar({ back: true, title: '色を混ぜて作る' })}
      <section class="mix">
        <p class="mx-lead">持っている色を混ぜて、作りたい色に近づける混ぜ方を出します。</p>
        ${targetBlock(st)}
        ${m.target ? results(st) : ''}
        ${ownedBlock(st)}
        <details class="mx-card mx-tips"><summary>色の三原色と、混ぜ方のコツ</summary><ul class="notes">${TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>
        <p class="small muted">混ぜた色は計算の目安です（顔料の混ざり方の式で計算）。写真から取った色は送らず、この端末の中だけで使います。</p>
      </section>`;
  };

  // ---- シート: SHOP の単色から選ぶ
  function shopSheet(st, op) {
    const m = mx(st), list = owned(st), have = new Set(list.map(c => c.shop));
    const items = T.SHOP.ITEMS.filter(it => it.apply.paint && it.apply.paint.t === 'one_color' && (m.kind === 'polish' ? it.illo === 'polish' : it.illo === 'gel'));
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet${op}" role="dialog" aria-modal="true" aria-label="SHOPの色から選ぶ">
        <header class="sheet-head"><b>持っている色を選ぶ（${m.kind === 'polish' ? 'マニキュア' : 'ジェル'}）</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body"><div class="mx-shop">${items.map(it => `<button class="mx-shop-item" data-act="mix-shop-toggle" data-id="${it.id}" aria-pressed="${have.has(it.id)}">${dot(it.apply.paint.c.base)}<span>${esc(T.shop ? T.shop.short(it) : it.name)}<small>${esc(it.store)}</small></span>${have.has(it.id) ? ICON.check : ''}</button>`).join('')}</div></div>
        <footer class="sheet-foot"><button class="btn rose block" data-act="sheet-close">できた</button></footer>
      </section>`;
  }
  // ---- シート: 写真から色を取る（端末の中だけ）
  function photoSheet(st, op) {
    const m = mx(st), p = m.photo || {};
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet${op}" role="dialog" aria-modal="true" aria-label="写真から色を取る">
        <header class="sheet-head"><b>写真から色を取る</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <p class="small muted">取りたい所を指でタップ。ボトルより、塗ったチップや爪を明るい所で撮ると近い色になります。写真は送りません。</p>
          <div class="mx-photo"><canvas id="mx-canvas" data-act="mix-photo-pick" aria-label="写真。タップで色を取る"></canvas></div>
          <div class="mx-picked">${p.hex ? `${dot(p.hex, 'mid')}<b>${esc(p.hex)}</b>` : '<span class="small muted">まだ取っていません</span>'}</div>
        </div>
        <footer class="sheet-foot btnrow"><button class="btn ghost" data-act="mix-photo">別の写真</button><button class="btn rose" data-act="mix-photo-use" ${p.hex ? '' : 'disabled'}>${p.to === 'owned' ? '持っている色に足す' : '作りたい色にする'}</button></footer>
      </section>`;
  }
  T.sheets = Object.assign(T.sheets || {}, { 'mix-shop': shopSheet, 'mix-photo': photoSheet });

  // ---- 動き
  function setTarget(st, t) { mx(st).target = t; T.app.render(); }
  function addOwned(st, hex, name, shop) {
    const list = owned(st);
    if (list.length >= 60) { T.app.toast('持っている色は60色まで'); return; }
    if (list.some(c => c.hex === hex.toUpperCase() && (!shop || c.shop === shop))) { T.app.toast('もう入っています'); return; }
    list.push({ id: newId(), hex: hex.toUpperCase(), name: String(name).slice(0, 20), shop });
    T.app.persist(); T.app.render();
  }
  async function byWord(st, text) {
    const m = mx(st); m.word = String(text || '').trim().slice(0, 30);
    if (!m.word) { T.app.toast('色の名前を入れてください'); return; }
    const hit = M.wordColor(m.word);
    if (hit) { setTarget(st, hit); return; }
    if (!T.ai.available()) { T.app.toast('辞書に無い色です。「色を選ぶ」か「写真から」で選んでください'); T.app.render(); return; }
    if (T.ai.consent() == null) { m.pending = m.word; st.sheet = 'ai-consent'; T.app.render(); return; }
    if (!T.ai.usable()) { T.app.toast('辞書に無い色です（AIはオフ）。「色を選ぶ」で選んでください'); return; }
    m.busy = true; T.app.render();
    let r = null; try { r = await M.aiColor(m.word); } catch (e) { r = null; }
    m.busy = false;
    if (r) setTarget(st, r); else { T.app.toast('読み取れませんでした。「色を選ぶ」で選んでください'); T.app.render(); }
  }
  // 写真: 長い辺 720px に縮めて、端末の中だけで持つ
  function loadPhoto(st, file) {
    if (!file || !/^image\//.test(file.type)) return;
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const m = mx(st); m.photo = { to: m.photoTo || 'target', canvas: c, hex: null, x: null, y: null };
      st.sheet = 'mix-photo'; T.app.render();
    };
    img.onerror = () => { URL.revokeObjectURL(url); T.app.toast('写真を開けませんでした'); };
    img.src = url;
  }
  function drawPhoto() {
    const st = T.app.state, p = st.mix && st.mix.photo, cv = hasDOM && document.getElementById('mx-canvas');
    if (!p || !p.canvas || !cv) return;
    cv.width = p.canvas.width; cv.height = p.canvas.height;
    const g = cv.getContext('2d'); g.drawImage(p.canvas, 0, 0);
    if (p.x != null) { g.lineWidth = 3; g.strokeStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, 14, 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#2B2226'; g.lineWidth = 1.5; g.beginPath(); g.arc(p.x, p.y, 17, 0, Math.PI * 2); g.stroke(); }
  }
  function samplePhoto(p, x, y) {
    const g = p.canvas.getContext('2d'), r = 4, x0 = Math.max(0, Math.round(x) - r), y0 = Math.max(0, Math.round(y) - r);
    const w = Math.min(p.canvas.width - x0, r * 2 + 1), h = Math.min(p.canvas.height - y0, r * 2 + 1);
    const d = g.getImageData(x0, y0, w, h).data; let R = 0, G = 0, B = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
    return '#' + [R, G, B].map(v => Math.round(v / n).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  if (hasDOM) {
    window.addEventListener('tsume:render', () => { if (T.app.state.sheet === 'mix-photo') drawPhoto(); });
    document.addEventListener('change', e => {
      const t = e.target, st = T.app.state; if (!t) return;
      if (t.id === 'mx-color-target' && HEX.test(t.value)) setTarget(st, { hex: t.value.toUpperCase(), name: nearName(t.value), by: 'pick' });
      else if (t.id === 'mx-color-own' && HEX.test(t.value)) addOwned(st, t.value, nearName(t.value));
      else if (t.id === 'mx-file' && t.files && t.files[0]) { loadPhoto(st, t.files[0]); t.value = ''; }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'mx-word' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); byWord(T.app.state, e.target.value); } });
    document.addEventListener('input', e => { if (e.target && e.target.id === 'mx-word') mx(T.app.state).word = e.target.value; });
  }
  function fileInput() {
    let el = document.getElementById('mx-file');
    if (!el) { el = document.createElement('input'); el.type = 'file'; el.accept = 'image/*'; el.id = 'mx-file'; el.className = 'sr'; document.body.appendChild(el); }
    return el;
  }

  const prevConsent = T.actions['ai-consent'];
  Object.assign(T.actions, {
    'mix-open': (el, st) => { if (el && HEX.test(el.dataset.hex || '')) mx(st).target = { hex: el.dataset.hex.toUpperCase(), name: el.dataset.name || nearName(el.dataset.hex), by: 'design' }; T.app.go('mix'); },
    'mix-target': (el, st) => setTarget(st, { hex: el.dataset.hex.toUpperCase(), name: nearName(el.dataset.hex), by: 'design' }),
    'mix-word': (el, st) => { const i = hasDOM && document.getElementById('mx-word'); byWord(st, i ? i.value : mx(st).word); },
    'mix-mic': (el, st) => {
      const ok = T.voice.dictate(text => { if (!text) { T.app.toast('聞き取れませんでした'); return; } mx(st).word = text; byWord(st, text); });
      T.app.toast(ok ? '色の名前を言ってください（マイクの声はブラウザの音声認識に送られます）' : 'この端末ではマイクが使えません');
    },
    'mix-kind': (el, st) => { mx(st).kind = el.dataset.v === 'polish' ? 'polish' : 'gel'; T.app.render(); },
    'mix-del': (el, st) => { const k = mx(st).kind; st.myColors[k] = owned(st).filter(c => c.id !== el.dataset.id); T.app.persist(); T.app.render(); },
    'mix-shop': (el, st) => { st.sheet = 'mix-shop'; T.app.render(); },
    'mix-shop-toggle': (el, st) => {
      const it = T.SHOP.byId(el.dataset.id); if (!it) return;
      const k = mx(st).kind, list = owned(st), i = list.findIndex(c => c.shop === it.id);
      if (i >= 0) list.splice(i, 1); else if (list.length < 60) list.push({ id: newId(), hex: it.apply.paint.c.base.toUpperCase(), name: (T.shop ? T.shop.short(it) : it.name).slice(0, 20), shop: it.id });
      st.myColors[k] = list; T.app.persist(); T.app.render();
    },
    'mix-primaries': (el, st) => { M.PRIMARIES.forEach(p => { if (!owned(st).some(c => c.hex === p.hex)) owned(st).push({ id: newId(), hex: p.hex, name: p.name }); }); T.app.persist(); T.app.render(); T.app.toast('三原色と白・黒を入れました（持っていない色は × で外してください）'); },
    'mix-photo': (el, st) => { const m = mx(st); m.photoTo = el && el.dataset.to ? el.dataset.to : (m.photo && m.photo.to) || 'target'; if (hasDOM) fileInput().click(); },
    'mix-photo-pick': (el, st, ev) => {
      const p = mx(st).photo; if (!p || !ev) return;
      const r = el.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * p.canvas.width, y = ((ev.clientY - r.top) / r.height) * p.canvas.height;
      p.x = x; p.y = y; p.hex = samplePhoto(p, x, y); T.app.render();
    },
    'mix-photo-use': (el, st) => {
      const p = mx(st).photo; if (!p || !p.hex) return;
      st.sheet = null;
      if (p.to === 'owned') addOwned(st, p.hex, nearName(p.hex)); else setTarget(st, { hex: p.hex, name: nearName(p.hex), by: 'photo' });
    },
    'mix-say': (el, st) => {
      const r = (st.mixLast || [])[+el.dataset.i], m = mx(st); if (!r) return;
      T.voice.speak([`${m.target.name}は、${M.ratioText(r).replace(/ (\d+)/g, 'を$1').replace(/ : /g, '、')}の割合で混ぜると、${r.level.name}になります。`].concat(M.howTo(r, m.kind)));
    },
    'ai-consent': (el, st) => {
      prevConsent(el, st);
      const m = mx(st); if (st.view === 'mix' && m.pending) { const w = m.pending; m.pending = null; if (el.dataset.v === 'yes') byWord(st, w); }
    },
  });
  T.mixView = { nearName, samplePhoto };
})(typeof window !== 'undefined' ? window : globalThis);
