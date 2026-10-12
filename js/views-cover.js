/* tsumé — 表紙（爪の花） */
(function (global) {
  'use strict';
  const T = global.TSUME, U = T.ui;
  const STAR = 'M 0 -10 C 1.4 -1.4 1.4 -1.4 10 0 C 1.4 1.4 1.4 1.4 0 10 C -1.4 1.4 -1.4 1.4 -10 0 C -1.4 -1.4 -1.4 -1.4 0 -10 Z';
  const spark = (x, y, size, delay, gold) => `<svg class="spark${gold ? ' gold' : ''}" viewBox="-11 -11 22 22" aria-hidden="true" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s"><path d="${STAR}" fill="currentColor"/></svg>`;
  T.views.cover = st => {
    const s = T.SEASONS[st.season];
    return `<section class="cover">
      <div class="cover-bloom">${T.renderBloom(st.season, { size: 340 })}${spark(12, 18, 16, 0.2)}${spark(84, 10, 22, 1.4)}${spark(90, 78, 14, 2.3)}${spark(8, 82, 18, 0.9)}${spark(50, 2, 12, 2.8, true)}</div>
      <div class="cover-text">
        <div class="eyebrow">Self nail atelier</div>
        <div class="cover-logo latin">tsum<em>é</em></div>
        <h1 class="cover-h">指先に、<br>その日のための物語を。</h1>
        <p class="cover-p">選ぶだけで、塗りからトッピングまで。</p>
      </div>
      <div class="cover-cta">
        <button class="btn rose big" data-act="enter">はじめる</button>
        <div class="cover-links"><button class="link cover-kotoba" data-act="nav" data-view="kotoba">${U.ICON.sparkle}ことばで咲かせる${U.ICON.chev}</button><button class="link cover-kotoba" data-act="nav" data-view="mix">${U.ICON.drop}持っている色で、色を作る${U.ICON.chev}</button><button class="link cover-kotoba" data-act="nav" data-view="stickers">${U.ICON.wand}自分のシールを作る${U.ICON.chev}</button><button class="link cover-kotoba" data-act="nav" data-view="lab">${U.ICON.sparkle}ほかの道具（描く・レシピ・みんなのデザイン）${U.ICON.chev}</button></div>
        <p class="cover-foot">${U.esc(s.name)}の色 ・ ${T.CONCEPTS.length}のデザイン ・ 100均から高級素材まで</p>
      </div>
    </section>`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
