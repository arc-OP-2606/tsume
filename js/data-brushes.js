/* tsumé — 筆の図鑑・技法ごとのおすすめの筆・重ねる順番の決まり・描き方レシピ。
   2026-10-12 に SOURCES の各ページを開いて確かめた用途だけを書く（文章は写さずに書き直し）。キャラクターの描き方は入れない。
   値段は、お店のサイトで見えたものだけ。技法と筆の組み合わせ（BY_TECH）は、メーカーの説明する用途をもとにした目安。
   レシピの手順の筆は、出典に筆の名前が無い所を目安（brushTentative）にする。 */
(function (global) {
  'use strict';
  const T = global.TSUME = global.TSUME || {};

  const U = {
    pregel: 'https://pregel.jp/products_brush.html.php',
    md: 'https://www.nail-partner.com/?products=54332',
    jelly: 'https://www.jellynail.net/onlineshop/products/detail/163',
    multi: 'https://www.beautygarage.jp/p/260938',
    seria: 'https://www.seria-group.com/products/nail_goods.html',
    daiso: 'https://jp.daisonet.com/products/4549131928464',
    daisoSet: 'https://jpbulk.daisonet.com/products/4550480518329',
    awaBrush: 'https://awa-channel.srr-p.com/wordpress/23404/',
    awaFlower: 'https://awa-channel.srr-p.com/wordpress/10494/',
    jellyCure: 'https://www.jellynail.net/howto/apply/',
    nelpara: 'https://nelpara.com/user_data/howto_nail_094_cotton_flower_nail.php',
    petal: 'https://niinonozomi.blogs.co.jp/hanabira/',
    rose: 'https://niinonozomi.blogs.co.jp/gelnail-bara/',
    sideRose: 'https://selfnailbook.com/rose-painting/',
    dog: 'https://irotoironail.com/dog-nail/',
    wipe: 'https://cin-cia.com/jelnail-hukitori/',
    paragel: 'https://paragel.jp/faq/',
    liner: 'https://pregel.jp/products.html.php',
    frame: 'https://www.iro-shop.com/blog/2024/10/11/%E5%9B%B2%E3%81%BF%E3%83%8D%E3%82%A4%E3%83%AB%E3%81%AE%E3%82%84%E3%82%8A%E6%96%B9%E3%82%84%E4%BA%BA%E6%B0%97%E3%81%AE%E3%82%A2%E3%83%BC%E3%83%88%E3%81%A8%E3%81%AF%EF%BC%9F%E3%82%BB%E3%83%AB%E3%83%95/',
    nail7: 'https://nailschool.nail7.jp/self-zyerunail-zyoukyu-nailschool/zyerunail-a-to-kakikata-yarikata-rensyuuhou.html',
    dots: 'https://www.nailquick.co.jp/article/n-20160626/',
    straight: 'https://nailnailsnail.com/how-to-draw-straight-line-art/',
  };

  // ---- 筆。shape は views-recipes.js の絵の種類。cheap=100均（値段は確かめたものだけ）、pro=こだわりの品（tax: 税込と確かめた値段）
  const LIST = [
    { id: 'brush_flat', name: 'スクエア（平筆）', shape: 'flat',
      uses: '何にでも使える基本の筆。ベース・カラー・トップを塗る。',
      draws: ['地色', 'ベースとトップ'],
      cheap: { name: 'ネイルブラシセット（スクエア・フレンチ・オーバル・アートの4本）', store: 'ダイソー', price: 330, note: 'まとめ買い用サイトの表示' },
      pro: { name: 'FB-5 スクエア平筆（筆先8mm）', maker: 'プリジェル', url: U.pregel, price: 2447, tax: true },
      verified: true, src: [U.pregel, U.md, U.daisoSet] },
    { id: 'brush_oval', name: 'オーバル', shape: 'oval',
      uses: '先が丸く、根元（甘皮のきわ）のカーブに沿って塗りやすい。はじめてでも扱いやすい。',
      draws: ['根元のきわ', '地色'],
      cheap: { name: 'ジェルネイルブラシ オーバル', store: 'セリア', note: 'ダイソーの4本セットにも入っている' },
      pro: { name: 'OB-5 平筆（オーバル型・筆先8mm）', maker: 'プリジェル', url: U.pregel, price: 2475, tax: true },
      verified: true, src: [U.pregel, U.md, U.seria, U.daisoSet] },
    { id: 'brush_oval_mini', name: 'ミニオーバル', shape: 'oval_mini',
      uses: '小さな丸い平筆。奥行きをつける、細かいアートに。片側に白、もう片側に色を取ると、2色の花びらが描ける。',
      draws: ['花びら', '2色の花びら', '小さな面'],
      cheap: null,
      pro: { name: 'OB-SS ミニ平筆（約4×2mm）', maker: 'プリジェル', url: U.pregel, price: 2227, tax: true },
      verified: true, src: [U.pregel, U.awaFlower] },
    { id: 'brush_angular', name: '斜め（アンギュラー）', shape: 'angular',
      uses: '毛先が斜め。花びらやレースの、ふんわりしたグラデーションに。フレンチにも向く。左右に2色を取って、パレットでならしてから描く花びらにも。',
      draws: ['花びら', 'レース', 'フレンチ'],
      cheap: { name: 'ネイルブラシセットの「フレンチブラシ」', store: 'ダイソー', note: 'フレンチライン用。毛先が斜めかは未確認' },
      pro: { name: 'AB-SS ミニ斜め平筆（約6×3.5mm）', maker: 'プリジェル', url: U.pregel, price: 2240, tax: true },
      verified: true, src: [U.pregel, U.md, U.sideRose, U.daisoSet] },
    { id: 'brush_liner_s', name: 'ライナー（短い毛）', shape: 'liner_s',
      uses: '毛が短く、小回りがきく。細かい描き込み、花びら、ドット柄に。はじめてでも扱いやすい。',
      draws: ['細かい線', '細かい描き込み', '花びら'],
      cheap: { name: 'ネイルブラシ（アート）', store: 'ダイソー', price: 110, note: '細かい模様用の細筆（毛の長さは未確認）。セリアの「ジェルネイルブラシ ライン」もある（値段は未確認）' },
      pro: { name: 'マルチライナーS（毛丈約5mm）', maker: 'プリジェル', url: U.multi },
      verified: true, src: [U.awaBrush, U.md, U.multi, U.daiso, U.seria] },
    { id: 'brush_liner_l', name: 'ライナー（長い毛）', shape: 'liner_l',
      uses: '毛が長く、しなる。長い直線、囲み、ニュアンスの線、天然石の模様に。ジェルを引っぱるアート（ピーコック）にも。',
      draws: ['長い線', '囲み', 'なめらかな曲線'],
      cheap: null,
      pro: { name: 'ネイルブラシ アート #02 ロングライナー（毛丈約11mm）', maker: 'Jelly Nail', url: U.jelly, price: 1750, tax: true },
      verified: true, src: [U.awaBrush, U.jelly, U.md, U.rose] },
    { id: 'brush_fine', name: '極細アート筆', shape: 'fine',
      uses: '毛が少なく、とても細い。ごく細かいアートに。',
      draws: ['極細の線', '細かい模様'],
      cheap: null,
      pro: { name: 'RB 100/0（筆先約4mm）', maker: 'プリジェル', url: U.pregel, price: 2200, tax: true },
      verified: true, src: [U.pregel] },
    { id: 'brush_almond', name: 'アーモンド', shape: 'almond',
      uses: '葉の形の筆。1筆で小さな葉や花びら、2筆で大きな葉や花びらが描ける。',
      draws: ['葉', '花びら'],
      cheap: null,
      pro: { name: 'YUKAKO アーモンド（幅2mm×長さ7.5mm）', maker: 'プリジェル', url: U.pregel, price: 2860, tax: true },
      verified: true, src: [U.pregel] },
    { id: 'brush_round', name: 'ラウンド', shape: 'round',
      uses: '丸くふくらんで、先が尖る。極太から極細まで、1本でいろいろな線が描ける。',
      draws: ['太い線', '細い線'],
      cheap: null,
      pro: { name: 'ラウンドペイント筆（筆先約11mm）', maker: 'プリジェル', url: U.pregel, price: 2750, tax: true },
      verified: true, src: [U.pregel] },
    { id: 'dotting', name: 'ドットペン', shape: 'dot',
      uses: '先が玉の道具。点を置く。ドットの花に。細かい点なら、つまようじの先でも代わりになる。',
      draws: ['点', 'ドットの花'],
      cheap: { name: '2WAYネイルブラシ ドット×ライン', store: 'セリア' },
      pro: null, proNote: '細かい点なら、つまようじの先でも代わりになる',
      verified: true, src: [U.nelpara, U.dots, U.seria] },
    { id: 'brush_tap', name: 'タップ（ジャギー）', shape: 'tap',
      uses: 'ふさふさの筆で、叩いて使う。タイダイ、大理石、天然石のぼかしが簡単にできる。',
      draws: ['ぼかし', '大理石', '天然石'],
      cheap: null,
      pro: { name: 'ラウンドタップ筆（筆先約5mm×幅4mm）', maker: 'プリジェル', url: U.pregel, price: 2999, tax: true },
      verified: true, src: [U.pregel, U.md] },
    { id: 'brush_comb', name: 'コーム（シャギー）', shape: 'comb',
      uses: '毛先がくしのように分かれている。細い線を一度に何本も描ける。ツイード柄に。',
      draws: ['何本もの線', 'ツイード'],
      cheap: null,
      pro: { name: 'コーム筆（筆先約8mm×幅4mm）', maker: 'プリジェル', url: U.pregel, price: 2818, tax: true },
      verified: true, src: [U.pregel, U.md] },
    { id: 'brush_point', name: 'ポイント', shape: 'point',
      uses: '先が尖った筆。はみ出しの直し、ニュアンスアートのぼかし、フレンチの線（スマイルライン）の整えに。',
      draws: ['はみ出しの直し', 'ぼかし'],
      cheap: null,
      pro: { name: 'ポイント', maker: 'MD-GEL', url: U.md, link: '発売の案内', note: '「8/15販売開始」の案内のページ。今も売っているかは未確認' },
      verified: true, src: [U.md] },
  ];

  // ---- 今ある技法（材料に art_brush を使う20個）に勧める筆。メーカーの用途からの目安
  const BY_TECH = {
    french: ['brush_angular', 'brush_point'],
    skinny_french: ['brush_liner_l', 'brush_point'],
    glass_french: ['brush_angular'],
    mirror_french: ['brush_angular'],
    tortoise: ['brush_tap'],
    marble: ['brush_tap', 'brush_liner_l'],
    ink: ['brush_liner_s', 'brush_point'],
    gold_crack: ['brush_liner_l'],
    flower_paint: ['brush_oval_mini', 'brush_almond', 'brush_liner_s'],
    camellia: ['brush_oval_mini', 'dotting'],
    mizuhiki: ['brush_liner_l'],
    firework: ['dotting', 'brush_liner_l'],
    check: ['brush_liner_l'],
    tweed: ['brush_comb'],
    moon_gold: ['brush_liner_s'],
    ribbon: ['brush_liner_s'],
    lace: ['brush_angular', 'brush_liner_s'],
    gemstone: ['brush_tap', 'brush_liner_l'],
    watercolor_flower: ['brush_oval_mini', 'brush_point'],
    butterfly_line: ['brush_fine', 'brush_liner_s'],
  };

  // ---- 重ねる順番の決まり（アプリの中でこれ1つ）。tentative: 一次情報で確かめていない目安
  const ORDER_RULE = [
    { text: '地色を塗って硬化してから、絵を描きはじめる。', tentative: false, src: [U.nelpara, U.dog, U.rose] },
    { text: '細い線は、表面のべたつき（未硬化ジェル）が残っているとぼける。未硬化ジェルが出ないクリア（ノンワイプ）か、マットコートを塗って硬化してから描く。ベースやカラーの未硬化ジェルを途中で拭くと、はがれやすくなる。', tentative: false, src: [U.rose, U.awaFlower, U.wipe] },
    { text: '色を変える前に、仮硬化する。', tentative: false, src: [U.nail7] },
    { text: '細い線は、少し描いては仮硬化する。きれいに描けた所から固めていく。', tentative: false, src: [U.nail7] },
    { text: '同じ色の点や小花は、いくつか描いてからまとめて仮硬化してよい。', tentative: false, src: [U.nelpara] },
    { text: '仮硬化の時間は、お使いのジェルの説明書に従う（ジェルの種類によって違う）。ライナー用のジェルには、硬化を長めにと指示する商品もある。', tentative: false, src: [U.jellyCure, U.liner] },
    { text: '線や細かい柄には、流れにくいアート用（ライナー用）のジェルを使う。1回に塗る量が多いと、固まりきらない。', tentative: false, src: [U.liner, U.straight, U.paragel] },
    { text: '輪郭の線を先に描き、線の下をなぞるように縁取ってから、内側を塗る順もある（顔のモチーフなど）。', tentative: false, src: [U.nail7] },
    { text: '面（花びら・顔・耳）→ 線 → 小さな点（花の中心・目・鼻）の順に描く。', tentative: true },
    { text: '薄い色から濃い色へ。白のハイライトは最後に置く。', tentative: true },
    { text: 'わざと固める前に混ぜる所（1本の筆に2色を取った1筆、墨流し、水彩の白花、たらし込み、べっ甲のぼかし）は、混ぜ終わるまで仮硬化しない。', tentative: true },
    { text: '最後にトップを塗って、本硬化する。', tentative: false, src: [U.nelpara, U.dog] },
    { text: '線が震えるときは、肘をつき、筆を持つ手の小指を描く指に当てる。筆は寝かせすぎず、筆先で引く。', tentative: false, src: [U.frame] },
  ];
  /** ほかの画面や AI に渡す文。目安の行には「（目安）」を付ける */
  const ruleLines = () => ORDER_RULE.map(r => (r.tentative ? '（目安）' : '') + r.text);

  // ---- うまくいかないとき（経験別）。どの答えも src のページで確かめたもの
  const FIX = {
    shake: { q: '線が震える', src: [U.frame, U.nail7], a: {
      first: '肘をつき、筆を持つ手の小指を、描く指に当てて手を固定する。',
      some: '筆を寝かせすぎず、筆先で細く引く。',
      expert: '少し描いては硬化する。きれいに描けた所から固めていく。' } },
    thick: { q: '線が太る', src: [U.nail7, U.straight], a: {
      first: '筆に取るジェルを少なくする。',
      some: '筆を少し浮かせて、筆先だけで描く。',
      expert: '太った線は、横から地色を重ねて細く見せる。' } },
    bleed: { q: 'にじむ・ぼける', src: [U.rose, U.awaFlower, U.liner, U.straight, U.nail7], a: {
      first: '下の表面がべたついていると、線がぼける。未硬化ジェルが出ないクリア（ノンワイプ）かマットコートを塗って、硬化してから描く。',
      some: '流れにくい、アート用（ライナー用）のジェルを使う。',
      expert: '色を変える前に、必ず仮硬化する。' } },
    flow: { q: '流れる・広がる', src: [U.nail7, U.straight, U.liner, U.wipe], a: {
      first: '筆に取る量を少なくして、少し描いたら仮硬化する。',
      some: 'やわらかいジェルは流れて、線がぼやける。ライナー用の、かためのジェルに替える。',
      expert: 'ノンワイプのトップは粘度が低く、広がりやすい。線は、ライナー用のジェルで描く。' } },
    cure: { q: '固まらない', src: [U.paragel, U.liner], a: {
      first: '1回に塗る量が多いと、固まりきらない。量を減らして、薄く。',
      some: 'ライナー用のジェルには、硬化を長めにと指示する商品もある。説明書の時間に合わせる。',
      expert: 'ライトの光が弱っていないか確かめる。UVライトでは、色によって固まる速さが違う。' } },
    dot: { q: '点の大きさがそろわない', src: [U.dots, U.nelpara], a: {
      first: '細かい点は、つまようじの先にジェルをつけて、乗せるだけでもよい。',
      some: '同じ大きさの点を、同じ間隔で置くときれいに見える。全体のバランスを見ながら置く。',
      expert: '点を大きくしたいときは、ジェルを足さずに、ドットペンを点の上で回す。' } },
    petal: { q: '花びらがきれいに描けない', src: [U.petal], a: {
      first: '筆先の3分の1くらいに、色を軽くなじませて取る。',
      some: '花びらの中心の方が濃くなるように、色を置く。2色目は、半透明の色だとほどよくつく。',
      expert: '外側の花びらから、間をあけて描く。硬化してから、間に花びらを足す。' } },
  };

  // ---- お手本の絵。爪の中の 100×100（上が爪の先）。各手順の add が積み重なる
  const r1 = n => Math.round(n * 10) / 10;
  const rad = d => (d * Math.PI) / 180;
  const pt = (x, y) => `${r1(x)},${r1(y)}`;
  /** (cx, cy) から deg の向きへ、長さ len・幅 wid の形の、局所座標 (u: 向き, v: 横) → 絵の座標 */
  const frameOf = (cx, cy, deg) => { const a = rad(deg); return (u, v) => pt(cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)); };
  /** kind: 'petal'（外が丸い）/ 'leaf'（両端が尖る） */
  function blade(cx, cy, deg, len, wid, c, kind) {
    const P = frameOf(cx, cy, deg);
    if (kind === 'leaf') return { t: 'path', fill: true, c, d: `M${P(0, 0)} C${P(len * 0.3, -wid)} ${P(len * 0.7, -wid * 0.8)} ${P(len, 0)} C${P(len * 0.7, wid * 0.8)} ${P(len * 0.3, wid)} ${P(0, 0)} Z` };
    return { t: 'path', fill: true, c, d: `M${P(len * 0.12, 0)} C${P(len * 0.35, -wid * 0.55)} ${P(len * 0.95, -wid * 0.5)} ${P(len, 0)} C${P(len * 0.95, wid * 0.5)} ${P(len * 0.35, wid * 0.55)} ${P(len * 0.12, 0)} Z` };
  }
  /** 花びら（blade の petal）の、中心側の部分だけ（t: 縁の曲線のどこまで）。1枚の花びらの中で2色に見せる */
  function bladeInner(cx, cy, deg, len, wid, c, t) {
    const P = frameOf(cx, cy, deg), L = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    const p0 = [len * 0.12, 0], p1 = [len * 0.35, -wid * 0.55], p2 = [len * 0.95, -wid * 0.5], p3 = [len, 0];
    const a = L(p0, p1, t), b = L(p1, p2, t), c2 = L(p2, p3, t), d = L(a, b, t), e = L(b, c2, t), q = L(d, e, t);
    const m = ([u, v]) => P(u, -v), bulge = len * 0.12;
    return { t: 'path', fill: true, c, d: `M${P(...p0)} C${P(...a)} ${P(...d)} ${P(...q)} C${P(q[0] + bulge, q[1] * 0.45)} ${P(q[0] + bulge, -q[1] * 0.45)} ${m(q)} C${m(d)} ${m(a)} ${P(...p0)} Z` };
  }
  /** 円の線（4本の3次ベジエ） */
  function ring(cx, cy, r, w, c) {
    const k = r * 0.5523, p = (x, y) => pt(cx + x, cy + y);
    return { t: 'path', w, c, d: `M${p(r, 0)} C${p(r, k)} ${p(k, r)} ${p(0, r)} C${p(-k, r)} ${p(-r, k)} ${p(-r, 0)} C${p(-r, -k)} ${p(-k, -r)} ${p(0, -r)} C${p(k, -r)} ${p(r, -k)} ${p(r, 0)} Z` };
  }
  /** 五角形の頂点の5点 */
  const five = (cx, cy, d, r, c) => [0, 1, 2, 3, 4].map(k => ({ t: 'dot', x: r1(cx + d * Math.cos(rad(-90 + 72 * k))), y: r1(cy + d * Math.sin(rad(-90 + 72 * k))), r, c }));
  const line = (pts, w, c) => ({ t: 'line', pts, w, c });
  const stroke = (d, w, c) => ({ t: 'path', d, w, c });
  const fill = (d, c) => ({ t: 'path', d, c, fill: true });
  const dot = (x, y, r, c) => ({ t: 'dot', x, y, r, c });

  /** 図形を (cx, cy) を中心に k 倍する（パスは絶対座標の組だけ） */
  function zoom(s, z) {
    if (!z) return s;
    const [cx, cy, k] = z, X = x => r1(cx + (x - cx) * k), Y = y => r1(cy + (y - cy) * k);
    if (s.t === 'dot') return Object.assign({}, s, { x: X(s.x), y: Y(s.y), r: r1(s.r * k) });
    if (s.t === 'line') return Object.assign({}, s, { pts: s.pts.map(([x, y]) => [X(x), Y(y)]), w: r1(s.w * k) });
    let i = 0;
    const d = s.d.replace(/-?\d+(\.\d+)?/g, n => String(i++ % 2 ? Y(+n) : X(+n)));
    return Object.assign({}, s, { d }, s.w ? { w: r1(s.w * k) } : {});
  }
  /** 手順の筆が「出典で名前が出ている」か。平筆で地色・コート・トップを塗るのは、メーカーの説明する用途どおり */
  const brushSure = s => !s.brush || !!s.sure || s.brush === 'brush_flat';
  function build(def) {
    const art = [];
    const steps = def.steps.map(s => {
      (s.add || []).forEach(x => art.push(zoom(x, def.zoom)));
      return { text: s.text, brush: s.brush || null, brushTentative: !brushSure(s), role: s.role || null, cure: s.cure || 'none', tentative: !!s.tentative, art: art.length };
    });
    const brushes = Array.from(new Set(steps.map(s => s.brush).filter(Boolean)));
    return { id: def.id, name: def.name, lead: def.lead, level: def.level, minutes: def.minutes, brushes, colors: def.colors, steps, art, fixes: def.fixes.map(k => FIX[k]), src: def.src };
  }

  // ドットフラワー（ネルパラのコットンフラワーの流れ。中心の黄色は足したもの）
  const DF = { base: '#EDBFC6', white: '#FFFFFF', center: '#F2C14E' };
  const flowers = [[40, 30, 7.5], [62, 62, 7.5], [36, 83, 6.5]];
  const dotFlower = build({
    id: 'dot_flower', name: 'ドットフラワー', level: 'first', minutes: 15,
    lead: 'ドットペンで5つの点を置いて、円でつなぐ。いちばん簡単な花。',
    colors: [{ role: '地色', hex: DF.base, name: 'くすみピンク' }, { role: '花びら', hex: DF.white, name: '白' }, { role: '中心', hex: DF.center, name: '黄色' }, { role: '線', hex: DF.white, name: '白' }],
    steps: [
      { text: '地色を塗って、硬化する。', brush: 'brush_flat', role: '地色', cure: 'full' },
      { text: 'ドットペンに白を取り、五角形の角の位置に5つの点を置く。花の形の目印になる。', brush: 'dotting', sure: true, role: '花びら', add: flowers.flatMap(([x, y, d]) => five(x, y, d, 2.4, DF.white)) },
      { text: '5つの点の内側に、円を描く。点からジェルを引っぱって、つなぐように。', brush: 'dotting', sure: true, role: '花びら', add: flowers.map(([x, y, d]) => ring(x, y, d * 0.74, d > 7 ? 2.2 : 1.9, DF.white)) },
      { text: 'ジェルを足さずに、ドットペンを点の上で回して、点をひと回り大きくする。花をいくつか描いたら、まとめて仮硬化する。', brush: 'dotting', sure: true, role: '花びら', cure: 'tack', add: flowers.flatMap(([x, y, d]) => five(x, y, d, d > 7 ? 3.7 : 3.2, DF.white)) },
      { text: '花の中心に、黄色の小さな点を置いて仮硬化する。', brush: 'dotting', role: '中心', cure: 'tack', tentative: true, add: flowers.map(([x, y]) => dot(x, y, 2, DF.center)) },
      { text: 'ライナーに白を少し取り、花のすき間に細い縦線を数本入れる。', brush: 'brush_liner_s', sure: true, role: '線', add: [line([[56, 4], [56, 48]], 1, DF.white), line([[26, 45], [26, 72]], 1, DF.white), line([[75, 14], [75, 50]], 1, DF.white)] },
      { text: '続けて横線も入れて、仮硬化する。', brush: 'brush_liner_s', sure: true, role: '線', cure: 'tack', add: [line([[18, 47], [82, 47]], 1, DF.white), line([[48, 77], [82, 77]], 1, DF.white), line([[54, 20], [82, 20]], 1, DF.white)] },
      { text: 'トップを塗って、本硬化する。', brush: 'brush_flat', cure: 'full' },
    ],
    fixes: ['dot', 'thick', 'shake', 'cure'],
    src: [U.nelpara, U.dots],
  });

  // 2色の花びら（ミニオーバルの片側に白、もう片側に色）。1枚の花びらの中心側を色にする
  const TC = { base: '#E8B79A', white: '#FFFFFF', pink: '#D46A7E', leaf: '#7E9A6E', gold: '#C9A24B' };
  const petals = (cx, cy, len, wid, rot) => {
    const angles = [0, 1, 2, 3, 4].map(k => -90 + 72 * k + rot);
    return angles.map(a => blade(cx, cy, a, len, wid, TC.white)).concat(angles.map(a => bladeInner(cx, cy, a, len, wid, TC.pink, 0.42)));
  };
  const twoColor = build({
    id: 'two_color_petal', name: '2色の花びら', level: 'some', minutes: 25,
    lead: '1本の筆に白と色を取って、1筆で2色の花びらに。',
    colors: [{ role: '地色', hex: TC.base, name: 'アプリコット' }, { role: '花びら', hex: TC.white, name: '白' }, { role: '花びら', hex: TC.pink, name: 'ローズピンク' }, { role: '葉', hex: TC.leaf, name: 'くすみグリーン' }, { role: '中心', hex: TC.gold, name: 'ゴールドのラメ' }],
    steps: [
      { text: '地色を塗って硬化する。', brush: 'brush_flat', role: '地色', cure: 'full' },
      { text: 'にじみ止めに、マットコートを塗って硬化する。', brush: 'brush_flat', cure: 'full' },
      { text: 'パレットに白と色を出す。ミニオーバル筆の片側に白、もう片側に色を取る。', brush: 'brush_oval_mini', sure: true, role: '花びら' },
      { text: '大きい花の花びらを5枚描く。色の側を花の中心に向けると、中心が濃くなる。描けたら仮硬化する。', brush: 'brush_oval_mini', sure: true, role: '花びら', cure: 'tack', tentative: true, add: petals(50, 38, 15, 11, 0) },
      { text: '小さい花も同じように描いて、仮硬化する。', brush: 'brush_oval_mini', sure: true, role: '花びら', cure: 'tack', add: petals(34, 76, 10, 8, 18) },
      { text: '緑で葉を足して、仮硬化する。', brush: 'brush_oval_mini', role: '葉', cure: 'tack', add: [blade(62, 54, 40, 14, 4.5, TC.leaf, 'leaf'), blade(38, 50, 150, 12, 4, TC.leaf, 'leaf'), blade(44, 80, 20, 11, 3.6, TC.leaf, 'leaf')] },
      { text: '花の中心とすき間に、ラメを置いて仮硬化する。', brush: 'brush_liner_s', role: '中心', cure: 'tack', add: [dot(50, 38, 2.6, TC.gold), dot(34, 76, 1.9, TC.gold), dot(68, 22, 1.1, TC.gold), dot(28, 26, 1, TC.gold), dot(64, 78, 1.2, TC.gold), dot(72, 66, 0.9, TC.gold)] },
      { text: 'トップを塗って、本硬化する。', brush: 'brush_flat', cure: 'full' },
    ],
    fixes: ['petal', 'bleed', 'flow', 'cure'],
    src: [U.awaFlower, U.petal],
  });

  // バラ（中心の点 → 囲む花びら → 足す → 葉 → ツタ）。花びらは毛足が長く毛量の少ない筆
  const RS = { base: '#F4ECE6', rose: '#C25B6E', leaf: '#6F8F62' };
  const rose = build({
    id: 'rose', name: 'バラ', level: 'expert', minutes: 25,
    lead: '中心の点から、花びらを外へ足していく。花びらが多く長いほど、大人っぽい。',
    colors: [{ role: '地色', hex: RS.base, name: 'ミルク' }, { role: '花', hex: RS.rose, name: 'ローズ' }, { role: '葉', hex: RS.leaf, name: 'グリーン' }],
    steps: [
      { text: '地色を塗って硬化する。', brush: 'brush_flat', role: '地色', cure: 'full' },
      { text: '未硬化ジェル（べたつき）が残っていると、細い線がぼける。未硬化ジェルが出ないクリア（ノンワイプ）を塗って、硬化しておく。', brush: 'brush_flat', cure: 'full' },
      { text: 'バラの中心を決めて、ちょんと点を描く。きれいな丸でなくてよい。', brush: 'brush_liner_l', sure: true, role: '花', add: [dot(50, 39.5, 2.4, RS.rose)] },
      { text: '点を囲むように、花びらを2枚描く。太い所から細い方へ、ジェルを引っぱって、すっとした形に。', brush: 'brush_liner_l', sure: true, role: '花', add: [fill('M44.5,38 C45,31.5 54.5,30.5 56.5,36.5 C53.5,34.2 48,34.2 44.5,38 Z', RS.rose), fill('M55.5,41.5 C54.5,47.5 45,48 43.5,42.5 C47,45.2 52,45.2 55.5,41.5 Z', RS.rose)] },
      { text: '花びらの細い所に重ねるように、外側へ花びらを足していく。描けたら仮硬化する。', brush: 'brush_liner_l', sure: true, role: '花', cure: 'tack', add: [fill('M39.5,39.5 C38.5,28 52,22.5 61,29.5 C53,27 44,30 39.5,39.5 Z', RS.rose), fill('M62.5,32 C68.5,40 65,51.5 54,53.5 C60.5,49 63.5,41 62.5,32 Z', RS.rose), fill('M50.5,53.5 C41,55 35,48.5 37,41.5 C39.5,47.5 44,52 50.5,53.5 Z', RS.rose), fill('M58.5,25.5 C65,26 69.5,33 68.5,40 C67,33.5 63.5,28.5 58.5,25.5 Z', RS.rose)] },
      { text: '緑で葉を描く。習字の「とめ」と「はらい」のように、置いて、すっと抜く。仮硬化する。', brush: 'brush_almond', role: '葉', cure: 'tack', add: [blade(42, 54, 150, 15, 4.6, RS.leaf, 'leaf'), blade(58, 55, 30, 15, 4.6, RS.leaf, 'leaf')] },
      { text: 'ライナーで、ツタを爪の外へ続くように描いて、仮硬化する。爪の中に収めると、窮屈に見える。', brush: 'brush_liner_l', sure: true, role: '葉', cure: 'tack', add: [stroke('M49,56 C46,65 52,72 46,82 C42,89 44,95 40,100', 1.2, RS.leaf), blade(48, 73, -15, 9, 2.8, RS.leaf, 'leaf')] },
      { text: 'トップを塗って、本硬化する。', brush: 'brush_flat', cure: 'full' },
    ],
    fixes: ['thick', 'bleed', 'flow', 'shake'],
    src: [U.rose],
  });

  // ワンコの顔（淡いベージュ → 耳 → 顔 → 目と鼻 → かすれたリボン → マット）
  const DG = { base: '#EFE2D2', ear: '#C38E5F', line: '#4B3226' };
  const half = (a, b, k) => [r1(a[0] + (b[0] - a[0]) * k), r1(a[1] + (b[1] - a[1]) * k)];
  /** 途切れた線（かすれ）。a → b を2本に分けて、間をあける */
  const dry = (a, b, w, c) => [line([a, half(a, b, 0.42)], w, c), line([half(a, b, 0.58), b], w, c)];
  /** かすれたリボン: 左右の羽の縁と、中の1本を、途切れた短い線で描く */
  const bow = (cx, cy, w, c) => [-1, 1].flatMap(s => {
    const X = dx => cx + s * dx, C = [X(1), cy], top = [X(5.6), cy - 3.4], bot = [X(5.6), cy + 3.4];
    return dry(C, top, w, c).concat(dry(top, bot, w, c), dry(bot, C, w, c), dry([X(3.6), cy - 1.6], [X(3.6), cy + 1.6], w * 0.8, c));
  }).concat([dot(cx, cy, 1.1, c)]);
  const dog = build({
    id: 'dog', name: 'ワンコの顔', level: 'some', minutes: 20, zoom: [50, 52, 1.22],
    lead: '耳はムラがあっても大丈夫。目と鼻を近づけるとかわいい。',
    colors: [{ role: '地色', hex: DG.base, name: '淡いベージュ' }, { role: '耳', hex: DG.ear, name: 'キャメル' }, { role: '線', hex: DG.line, name: 'こげ茶' }],
    steps: [
      { text: '淡いベージュを全体に塗って、硬化する。', brush: 'brush_flat', role: '地色', cure: 'full' },
      { text: '明るい茶（キャメル）で、耳を2つ描く。少しムラがあると、毛並みに見える。仮硬化する。', brush: 'brush_oval_mini', role: '耳', cure: 'tack', add: [fill('M38,40 C30,40 25,50 27,60 C28,66 34,67 37,61 C39,55 40,47 38,40 Z', DG.ear), fill('M62,40 C70,40 75,50 73,60 C72,66 66,67 63,61 C61,55 60,47 62,40 Z', DG.ear)] },
      { text: 'こげ茶で、顔の輪郭を描く。', brush: 'brush_liner_s', role: '線', add: [stroke('M38,44 C40,35 60,35 62,44 C64,54 62,66 50,67 C38,66 36,54 38,44 Z', 1.5, DG.line)] },
      { text: '同じ色で目と鼻を置き、口も描く。目と鼻を近づけると、かわいい顔になる。仮硬化する。', brush: 'dotting', role: '線', cure: 'tack', add: [dot(44.5, 51, 1.7, DG.line), dot(55.5, 51, 1.7, DG.line), fill('M47.5,55.5 C47.5,54 52.5,54 52.5,55.5 C52.5,57.3 50,58.5 50,58.5 C50,58.5 47.5,57.3 47.5,55.5 Z', DG.line), stroke('M47,60 C48,62 50,61.5 50,58.5 C50,61.5 52,62 53,60', 1, DG.line)] },
      { text: 'こげ茶でリボンを描く。べた塗りせず、わざとかすれさせると、おしゃれ。仮硬化する。', brush: 'brush_liner_s', role: '線', cure: 'tack', add: bow(61, 37, 0.9, DG.line) },
      { text: 'マットコートを塗って、本硬化する。', brush: 'brush_flat', cure: 'full' },
    ],
    fixes: ['bleed', 'thick', 'shake', 'cure'],
    src: [U.dog],
  });

  // ネコの顔（しま模様）。輪郭を先に描いて、線の下をなぞるように縁取ってから中を塗る型
  const CT = { base: '#EFE6DC', line: '#3A3033', face: '#B9B2B4', stripe: '#857C80', pink: '#E89AA6' };
  const CAT_FACE = 'M34,52 L33,33 L43.5,41.5 C47.5,40.3 52.5,40.3 56.5,41.5 L67,33 L66,52 C67,63 60,70 50,70 C40,70 33,63 34,52 Z';
  const cat = build({
    id: 'cat', name: 'ネコの顔', level: 'some', minutes: 20, zoom: [50, 52, 1.2],
    lead: 'しま模様のネコ。輪郭を先に描いて、内側を塗る。',
    colors: [{ role: '地色', hex: CT.base, name: 'オートミール' }, { role: '線', hex: CT.line, name: 'こげ茶' }, { role: '顔', hex: CT.face, name: 'グレー' }, { role: '模様', hex: CT.stripe, name: '濃いグレー' }, { role: '耳と鼻', hex: CT.pink, name: 'ピンク' }],
    steps: [
      { text: '地色を塗って硬化する。', brush: 'brush_flat', role: '地色', cure: 'full' },
      { text: 'こげ茶で、耳と顔の輪郭を先に描いて、仮硬化する。', brush: 'brush_liner_s', role: '線', cure: 'tack', add: [stroke(CAT_FACE, 1.6, CT.line)] },
      { text: '輪郭の線の下をなぞるように縁取ってから、内側をグレーで塗る。仮硬化する。', brush: 'brush_oval_mini', role: '顔', cure: 'tack', add: [fill(CAT_FACE, CT.face)] },
      { text: '耳の内側をピンクで塗って、仮硬化する。', brush: 'brush_liner_s', role: '耳と鼻', cure: 'tack', add: [fill('M35.4,46 L35,37.6 C37.5,39.2 39.5,40.6 41,42.2 C38.8,42.8 36.8,44.2 35.4,46 Z', CT.pink), fill('M64.6,46 L65,37.6 C62.5,39.2 60.5,40.6 59,42.2 C61.2,42.8 63.2,44.2 64.6,46 Z', CT.pink)] },
      { text: '濃いグレーで、おでこにしま模様を3本描いて、仮硬化する。', brush: 'brush_liner_s', role: '模様', cure: 'tack', add: [line([[50, 42.8], [50, 46.8]], 1.2, CT.stripe), line([[46.3, 43.3], [47, 46.6]], 1.2, CT.stripe), line([[53.7, 43.3], [53, 46.6]], 1.2, CT.stripe)] },
      { text: 'こげ茶で、目を2つ置く。', brush: 'dotting', role: '線', add: [dot(43.5, 53, 2.1, CT.line), dot(56.5, 53, 2.1, CT.line)] },
      { text: '同じ色で、口とひげを描いて、仮硬化する。', brush: 'brush_liner_s', role: '線', cure: 'tack', add: [stroke('M50,58.6 C49.6,60.6 47.6,61 46.8,59.8', 0.8, CT.line), stroke('M50,58.6 C50.4,60.6 52.4,61 53.2,59.8', 0.8, CT.line), line([[40, 59], [29, 57.5]], 0.8, CT.line), line([[40, 61], [29.5, 62.5]], 0.8, CT.line), line([[60, 59], [71, 57.5]], 0.8, CT.line), line([[60, 61], [70.5, 62.5]], 0.8, CT.line)] },
      { text: 'ピンクで、鼻を小さな点で置いて、仮硬化する。', brush: 'dotting', role: '耳と鼻', cure: 'tack', add: [dot(50, 57.4, 1.4, CT.pink)] },
      { text: 'トップを塗って、本硬化する。', brush: 'brush_flat', cure: 'full' },
    ],
    fixes: ['shake', 'thick', 'dot', 'bleed'],
    src: [U.nail7],
  });

  // 細いライン（囲み ＋ ニュアンスの線）
  const LN = { base: '#EADFD8', line: '#3B3035' };
  const thinLine = build({
    id: 'thin_line', name: '細いライン', level: 'first', minutes: 15,
    lead: '囲みとカーブの線。手の置き方で、線は変わる。',
    colors: [{ role: '地色', hex: LN.base, name: 'グレージュ' }, { role: '線', hex: LN.line, name: 'ブラウンブラック' }],
    steps: [
      { text: '地色を塗って硬化する。', brush: 'brush_flat', role: '地色', cure: 'full' },
      { text: '線がぼけないように、未硬化ジェルが出ないクリア（ノンワイプ）を塗って、硬化しておく。', brush: 'brush_flat', cure: 'full' },
      { text: '肘をつき、筆を持つ手の小指を、描く指に当てて手を固定する。' },
      { text: 'ライナーにジェルを少しだけ取る。筆を寝かせすぎず、筆先で片側の線を引く。少し描いては仮硬化する。', brush: 'brush_liner_l', sure: true, role: '線', cure: 'tack', add: [stroke('M24,92 L24,36 C24,19 35,8 50,8', 1.3, LN.line)] },
      { text: '反対側も同じように描いて、仮硬化する。', brush: 'brush_liner_l', sure: true, role: '線', cure: 'tack', add: [stroke('M50,8 C65,8 76,19 76,36 L76,92', 1.3, LN.line)] },
      { text: '内側に、ゆるいカーブの線を1本。少し描いては仮硬化する。', brush: 'brush_liner_l', sure: true, role: '線', cure: 'tack', add: [stroke('M31,86 C38,70 56,76 60,58 C63,46 56,38 62,24', 1.1, LN.line)] },
      { text: 'トップを塗って、本硬化する。', brush: 'brush_flat', cure: 'full' },
    ],
    fixes: ['shake', 'thick', 'bleed', 'flow', 'cure'],
    src: [U.frame, U.nail7, U.awaBrush, U.rose],
  });

  const RECIPES = [dotFlower, thinLine, twoColor, dog, cat, rose];

  // 開いて確かめたページ（2026-10-12）
  const SOURCES = [
    ['筆の種類と用途（プリジェル）', U.pregel],
    ['ブラシの用途（MD-GEL・ネイルパートナー）', U.md],
    ['ロングライナー #02（Jelly Nail）', U.jelly],
    ['マルチライナーS（ビューティガレージ）', U.multi],
    ['セルフネイルの商品（セリア）', U.seria],
    ['ネイルブラシ（アート）（ダイソー）', U.daiso],
    ['ネイルブラシセット（ダイソー まとめ買い）', U.daisoSet],
    ['長い筆と短い筆の使い分け（あわちゃんねる）', U.awaBrush],
    ['2色の小花（あわちゃんねる）', U.awaFlower],
    ['ジェルの塗り方と仮硬化（Jelly Nail）', U.jellyCure],
    ['コットンフラワーネイル（ネルパラ）', U.nelpara],
    ['花びらの描き方（個人ブログ）', U.petal],
    ['バラの描き方（個人ブログ）', U.rose],
    ['サイドローディングのバラ（セルフネイルブック）', U.sideRose],
    ['ワンコのネイル（irotoiro nail）', U.dog],
    ['未硬化ジェルの拭き取り（cin-cia）', U.wipe],
    ['よくある質問（パラジェル）', U.paragel],
    ['ライナーシリーズ（プリジェル）', U.liner],
    ['囲みネイルのやり方（iro-shop）', U.frame],
    ['ジェルアートの描き方と練習法（nail7）', U.nail7],
    ['ドットネイルのやり方（ネイルクイック）', U.dots],
    ['直線を描くコツ（nailnailsnail）', U.straight],
  ];

  T.BRUSHES = { LIST, BY_TECH, ORDER_RULE, RECIPES, SOURCES, FIX, ruleLines };
})(typeof window !== 'undefined' ? window : globalThis);
