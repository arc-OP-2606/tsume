/* tsumé — ことばで咲く（画面）。一行の言葉で爪の花がその色に咲き、名前つきの作れる3案が出る */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  const { esc, yen, ICON } = U;
  const TUNES = [['mood', 'sweet', 'もっと甘く'], ['mood', 'classic', '大人っぽく'], ['time', 't30', '10分で'], ['tier', 'coin', '100均だけで'], ['level', 'first', '初心者向け']];
  const kt = st => st.kotoba || (st.kotoba = { text: '', result: null, busy: false });
  // req: 咲かせる・調整するたびに進める。AI の返事は、そのあいだに次の操作が無かったときだけ使う
  const designOf = (st, r, id) => { const c = U.byId(T.CONCEPTS, id); return c && E.build(c, r.sel, { season: r.season, paletteIndex: r.key, palette: st.palettes[r.key] }); };

  function aiNote(st) {
    if (!T.ai.available()) return '言葉の辞書で読み取ります（端末の中だけで動きます）。';
    const c = T.ai.consent();
    if (c === 'yes') return `AI（Google Gemini）で読み取ります。人の名前は入れないでください。<button class="link" data-act="ai-off">AIを使わない</button>`;
    if (c === 'no') return `辞書で読み取っています。<button class="link" data-act="ai-ask">AIで読み取る</button>`;
    return `<button class="link" data-act="ai-ask">${ICON.sparkle}AIで、もっと言葉に寄せて読み取る</button>`;
  }
  function card(st, r, id, i) {
    const d = designOf(st, r, id); if (!d) return '';
    const tops = T.toppings.summary(d.left);
    return `<article class="kt-card" aria-label="${i + 1}案目 ${esc(d.concept.name)}">
      ${U.chart(d, 'left', { sel: r.sel })}
      <div class="kt-card-body"><b>${esc(d.concept.name)}</b><span class="small muted">トッピング：${esc(tops || 'なし（塗りだけ）')}</span>
      <span class="pmeta"><span>${ICON.yen}${yen(d.cost.total)}</span><span>${ICON.clock}${d.est.minutes}分</span>${U.diff(d.est.difficulty)}</span></div>
      <button class="btn" data-act="kotoba-open" data-id="${d.concept.id}">作り方を見る</button>
    </article>`;
  }
  function result(st, r) {
    const k = kt(st);
    return `<div class="kt-result" aria-live="polite">
      <h2 class="kt-name">${esc(r.name)}</h2>
      <p class="kt-reason">${esc(r.reason)}</p>
      <div class="kt-swatches" aria-hidden="true">${r.colors.map(c => `<i style="background:${c}"></i>`).join('')}</div>
      <p class="kt-by">${r.ai ? `AI（${esc(r.ai)}）で読み取り` : '辞書で読み取り'}${k.busy ? '<span class="kt-busy">AIで読み直しています…</span>' : ''}</p>
      <div class="kt-tune">${TUNES.map(([key, v, label]) => `<button class="chip" data-act="kotoba-tune" data-key="${key}" data-v="${v}" aria-pressed="${r.sel[key] === v}">${label}</button>`).join('')}</div>
      <div class="kt-cards">${r.picks.map((id, i) => card(st, r, id, i)).join('')}</div>
    </div>`;
  }
  T.views.kotoba = st => {
    const k = kt(st), r = k.result;
    return `${U.bar({ back: true, title: 'ことばで咲く' })}
      <section class="kotoba">
        <div class="kt-bloom">${T.renderBloom(st.season, { size: 260, colors: r ? r.colors : [] })}</div>
        <p class="kt-lead">ネイルにしたい情景や気分を、一行で。</p>
        <div class="kt-form"><input id="kt-input" class="kt-input" type="text" maxlength="60" value="${esc(k.draft != null ? k.draft : k.text)}" placeholder="例：金木犀の帰り道" enterkeyhint="go" autocomplete="off" aria-label="ネイルにしたい言葉"><button class="btn rose" data-act="kotoba-go">${ICON.sparkle}咲かせる</button></div>
        <div class="kt-ex" data-keep-scroll="kt-ex">${T.KOTOBA.EXAMPLES.map(ex => `<button class="chip" data-act="kotoba-ex" data-text="${esc(ex)}">${esc(ex)}</button>`).join('')}</div>
        <p class="small muted kt-note">${aiNote(st)}</p>
        ${r ? result(st, r) : ''}
      </section>`;
  };
  // AIを使う前の確認
  function consentSheet(st, op) {
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet ai-sheet${op}" role="dialog" aria-modal="true" aria-label="AIで読み取る">
        <header class="sheet-head"><b>AIで読み取る</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <p>打った言葉は、読み取りのときだけ tsumé の中継サーバーを通して <b>Google Gemini</b> に送られます。tsumé ソムリエの言い回しを整えるときは、デザインの説明（色・技法・シーン）を送ります。tsumé は保存しません。</p>
          <ul class="notes"><li>人の名前・住所など、個人がわかることは入れないでください（「〜さん」は自動で伏せます）。</li><li>AIが使えないときは、辞書で読み取ります。</li><li>あとから「使い方」でオフにできます。</li></ul>
        </div>
        <footer class="sheet-foot btnrow"><button class="btn ghost" data-act="ai-consent" data-v="no">使わない</button><button class="btn rose" data-act="ai-consent" data-v="yes">AIを使う</button></footer>
      </section>`;
  }

  async function bloom(st, text) {
    const k = kt(st);
    k.text = k.draft = String(text || '').trim().slice(0, 60);
    if (!k.text) { T.app.toast('言葉を入れてください'); return; }
    const my = k.req = (k.req || 0) + 1;
    k.result = T.kotoba.local(st, k.text); k.busy = T.ai.usable(); T.app.persist(); T.app.render();
    if (T.ai.available() && T.ai.consent() == null) { st.sheet = 'ai-consent'; T.app.render(); return; }
    if (!k.busy) return;
    let r = null;
    try { r = await T.kotoba.withAI(st, k.text); } catch (e) { r = null; }
    if (kt(st).req !== my) return;
    k.busy = false; if (r) k.result = r; T.app.persist();
    if (st.view === 'kotoba') patchResult(st);
  }
  // 入力中の文字・フォーカス・変換を壊さないよう、花と結果だけ差し替える
  function patchResult(st) {
    const k = kt(st), res = typeof document !== 'undefined' && document.querySelector('.kt-result'), bl = res && document.querySelector('.kt-bloom');
    if (!res || !bl || st.sheet || !k.result) { T.app.render(); return; }
    res.outerHTML = result(st, k.result); bl.innerHTML = T.renderBloom(st.season, { size: 260, colors: k.result.colors });
  }
  const input = () => { const el = typeof document !== 'undefined' && document.getElementById('kt-input'); return el ? el.value : ''; };
  if (typeof document !== 'undefined') {
    // Safari は変換を確定する Enter でも isComposing が false のことがある（keyCode 229）
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'kt-input' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); bloom(T.app.state, e.target.value); } });
    document.addEventListener('input', e => { if (e.target && e.target.id === 'kt-input') kt(T.app.state).draft = e.target.value; });
  }

  Object.assign(T.actions, {
    'kotoba-go': (el, st) => bloom(st, input()),
    'kotoba-ex': (el, st) => bloom(st, el.dataset.text),
    'kotoba-tune': (el, st) => {
      const r = kt(st).result; if (!r) return;
      const key = el.dataset.key, v = r.sel[key] === el.dataset.v ? null : el.dataset.v;
      const cond = Object.assign({}, r.cond); if (v) cond[key] = v; else delete cond[key];
      const k = kt(st); k.req = (k.req || 0) + 1; k.busy = false;
      k.result = T.kotoba.retune(st, r, cond); T.app.render();
    },
    'kotoba-open': (el, st) => {
      const r = kt(st).result; if (!r) return;
      st.sel = Object.assign({}, st.sel, r.sel); st.current = { conceptId: el.dataset.id, paletteIndex: r.key };
      st.side = null; st.tab = 'look'; st.stepIdx = 0; T.app.persist(); T.app.go('detail');
    },
    'ai-ask': (el, st) => { st.sheet = 'ai-consent'; T.app.render(); },
    'ai-off': (el, st) => { T.ai.setConsent('no'); T.app.render(); T.app.toast('AIを使わず、辞書で読み取ります'); },
    'ai-consent': (el, st) => {
      T.ai.setConsent(el.dataset.v === 'yes' ? 'yes' : 'no'); st.sheet = null; T.app.render();
      const k = kt(st); if (el.dataset.v === 'yes' && k.text && st.view === 'kotoba') bloom(st, k.text);
    },
  });
  T.kotobaView = { consentSheet };
})(typeof window !== 'undefined' ? window : globalThis);
