/* tsumé — 「つくる」: 道具の入口をまとめた画面（ことばで咲く・色を混ぜる・シール工房・描く・レシピ・筆・みんなのデザイン・取り込み・AI）。
   まだ入っていない道具（画面が無いもの）は出さない */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui;
  const { esc, ICON } = U;
  const TOOLS = [
    { view: 'kotoba', icon: 'sparkle', name: 'ことばで咲く', note: '一行の言葉から、その色で作れる3案' },
    { view: 'mix', icon: 'drop', name: '色を混ぜて作る', note: '持っている色で、作りたい色の混ぜ方' },
    { view: 'stickers', icon: 'wand', name: 'シール工房', note: '自分のシールをデザインして、家で印刷' },
    { view: 'draw', icon: 'wand', name: '描く', note: '爪に描いて、描いた順から作り方を出す' },
    { view: 'recipes', icon: 'list', name: '描き方レシピ', note: 'お花・バラ・ワンコなどを、筆と順番つきで' },
    { view: 'brushes', icon: 'book', name: '筆の図鑑', note: 'どの筆で、何が描けるか', go: st => { st.matTab = 'brushes'; T.app.go('materials'); } },
    { view: 'gallery', icon: 'heart', name: 'みんなのデザイン', note: '作り方つきのデザインを見て、試着する' },
    { view: 'scan', icon: 'camera', name: 'パーツを取り込む', note: '持っているパーツ・シールを写真から' },
    { view: 'aigen', icon: 'sparkle', name: 'AIでシール絵', note: 'ワンコ・バラなどの絵を作って、シールに', ai: true },
    { view: 'aivision', icon: 'camera', name: '写真から作り方', note: 'ネイルの写真から、筆と順番を出す', ai: true },
  ];
  const has = t => (t.view === 'brushes' ? !!(T.brushes && T.brushes.book) : !!T.views[t.view]);
  T.views.lab = st => `${U.bar({ back: true, title: 'つくる・まなぶ' })}
    <section class="lab">
      ${TOOLS.filter(has).map(t => `<button class="lab-card" data-act="lab-go" data-view="${t.view}">${ICON[t.icon] || ICON.sparkle}<span><b>${esc(t.name)}</b><small>${esc(t.note)}${t.ai ? '（AI・18歳以上）' : ''}</small></span>${ICON.chev}</button>`).join('')}
    </section>`;
  Object.assign(T.actions, {
    'lab-go': (el, st) => { const t = TOOLS.find(x => x.view === el.dataset.view); if (!t) return; if (t.go) t.go(st); else T.app.go(t.view); },
  });
  T.lab = { TOOLS };
})(typeof window !== 'undefined' ? window : globalThis);
