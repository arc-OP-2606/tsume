/* tsumé — シール工房の「素材・買える店・作り方」。2026-10-12 に各ページを開いて確かめたもの（価格は表示どおりの目安）。
   販売終了・廃止のもの（キヤノン NL-101、サンワ LB-TATHK1W/2C）は載せない。ink: 合うインク（dye=染料 pigment=顔料 laser=レーザー） */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const A = asin => `https://www.amazon.co.jp/dp/${asin}`;
  const MATERIALS = [
    // ---- 転写シール（タトゥー型）: 刷った紙に透明の糊シートを貼り合わせ、爪に押し当てる。絵は左右反転で刷る
    { id: 'aone52113', type: 'tattoo', name: 'エーワン 転写シール 透明 はがき 52113（9セット）', maker: 'エーワン', ink: ['dye'], mirror: true, size: 'はがき', price: '2,145円（公式）', good: 'メーカーが「ネイルシールにも」と書いている。染料インクのプリンター（キヤノン PIXUS、エプソンの多くの機種）向け。', caution: '顔料インクでは色が乗らない。同じ紙に2回は刷れない。余白も転写されるので、柄のきわで切る。', shops: [{ shop: 'エーワン公式', url: 'https://www.a-one.co.jp/product/search/detail.php?id=52113' }] },
    { id: 'aone51113', type: 'tattoo', name: 'エーワン 転写シール 透明 はがき 51113（3セット）', maker: 'エーワン', ink: ['dye'], mirror: true, size: 'はがき・厚み0.21mm（台紙こみ）', price: '公式814円・ハンズ770円・Amazon 481円', good: 'お試しに。52113 と同じ種類の少ない枚数。', caution: '染料インク専用。', shops: [{ shop: 'エーワン公式', url: 'https://www.a-one.co.jp/product/search/detail.php?id=51113' }, { shop: 'ハンズ', url: 'https://hands.net/goods/4906186511131/' }, { shop: 'Amazon', url: A('B000BKP2N4') }] },
    { id: 'elecomtat', type: 'tattoo', name: 'エレコム 手作りタトゥーシール 透明 EJP-TAT（はがき・3セット）', maker: 'エレコム', ink: ['dye', 'pigment'], mirror: null, size: 'はがき', price: 'ツクモ 968円', good: '染料・顔料のどちらのインクにも対応。「ネイルにも使えます」と書かれている。', shops: [{ shop: 'ツクモ', url: 'https://shop.tsukumo.co.jp/goods/4953103119512/' }] },
    { id: 'elecomtathw', type: 'tattoo', name: 'エレコム 手作りタトゥーシール 白 EJP-TATHW（はがき・3セット）', maker: 'エレコム', ink: ['dye'], mirror: null, size: 'はがき', price: 'ツクモ 858円・Amazon 485円', good: '白地なので、濃い色の爪の上でも柄が見える。「爪にも貼り付け可能」。', caution: '対応インクの種類は書かれていない（染料なら確実）。切った形の白い縁が出る。', shops: [{ shop: 'ツクモ', url: 'https://shop.tsukumo.co.jp/goods/4953103218307/' }, { shop: 'Amazon', url: A('B0028AEEV6') }] },
    { id: 'collepe', type: 'tattoo', name: 'collepe（コレペ）インクジェット用転写シール 透明・ホワイト', maker: '名文社', ink: ['dye'], mirror: null, size: 'はがき・A4', price: '公式 550円（5セット）〜・Amazon はがき透明 600円', good: '枚数を選べる。「ネイルシールとしても」と書かれている。', caution: '染料インク専用（顔料は不可）。', shops: [{ shop: 'collepe公式', url: 'https://www.collepe.com/SHOP/TATHC.html' }, { shop: 'Amazon（はがき透明）', url: A('B08FC2MPK8') }, { shop: 'Amazon（A4白）', url: A('B08FC28VWS') }] },
    { id: 'kyowa4738', type: 'tattoo', name: 'オリジナルネイル転写シート 透明 4738（名刺サイズ）', maker: '協和紙工', ink: ['dye', 'pigment'], mirror: true, size: '名刺サイズ（約5.5×9.1cm）', price: 'Amazon 499円', good: 'ネイル専用の小さいシート。インクジェット専用。', caution: '染料・顔料の別は書かれていない。名刺サイズなので、アプリの紙は「L判」で刷って切る。', shops: [{ shop: 'Amazon', url: A('B0DQNK5BJ4') }, { shop: '楽天', url: 'https://item.rakuten.co.jp/clickworks/b0dqnk5bj4/' }] },
    // ---- 水転写デカール: 水に浸して台紙から滑らせて貼る。反転しない。インクを封じるコートが要るものがある
    { id: 'bbestcl', type: 'decal', name: 'BBEST 水転写シート 透明 WTSA44-CL（A4・4枚）', maker: 'BBEST', ink: ['dye', 'pigment'], mirror: false, size: 'A4', price: 'Amazon 950円', good: 'スプレー（コート）不要と書かれている。用途に「ネイル」。インクジェット専用。', caution: '乾くとやや乳白色。レーザー不可。', shops: [{ shop: 'Amazon', url: A('B0DP8DV6S1') }] },
    { id: 'bbestwh', type: 'decal', name: 'BBEST 水転写シート 白 WTSA44-WH（A4・4枚）', maker: 'BBEST', ink: ['dye', 'pigment', 'laser'], mirror: false, size: 'A4', price: 'Amazon 950円', good: 'インクジェットとレーザーの両方に使える白地。', caution: '凹凸のある面には貼れない（つやのある硬化面に）。', shops: [{ shop: 'Amazon', url: A('B0DP8FWBC2') }] },
    { id: 'tod', type: 'decal', name: 'TransOurDream 水転写シート 透明 JP-6-5 ／ 白 JP-7-5（A4・5枚）', maker: 'TransOurDream', ink: ['dye', 'pigment'], mirror: false, size: 'A4', price: 'Amazon 透明899円・白849円', good: '染料・顔料のどちらのインクにも対応。', caution: 'ネイルとコートの記載は無い。インクを封じるクリアを薄く吹くと安心。', shops: [{ shop: 'Amazon（透明）', url: A('B0FW9TXWHT') }, { shop: 'Amazon（白）', url: A('B0H1BY38FC') }] },
    { id: 'hiqwb', type: 'decal', name: 'ハイキューパーツ インクジェットデカール 白ベース INKJ-T05WB-V2（A4・5枚）', maker: 'ハイキューパーツ', ink: ['pigment'], mirror: false, size: 'A4', price: '公式1,100円・Amazon 891円', good: '全色顔料インクのプリンター向け。白い柄を形どおりに切って使える。', caution: '「模型専用」表記（ネイルは想定外）。刷ったあと模型用クリアを薄く5〜6回吹くのが必須（換気し、手や爪から離れた所で）。染料インクはにじむ。下に40mmの余白が要る。', shops: [{ shop: 'ハイキューパーツ公式', url: 'https://www.hiqparts.com/item/4573211380149.html' }, { shop: 'Amazon', url: A('B0FPKSF9P1') }] },
    { id: 'asub', type: 'decal', name: 'A-SUB 水転写シート マット 白（A4）', maker: 'A-SUB', ink: ['dye', 'pigment', 'laser'], mirror: false, size: 'A4', price: 'Amazon 749円', good: 'インクジェット・レーザー両用、スプレー不要。用途例に「ネイルチップ」。', shops: [{ shop: 'Amazon', url: A('B09JZCN3QK') }] },
    // ---- レーザー用（金・銀の箔をのせられる）
    { id: 'hiqth', type: 'decal', name: 'ハイキューパーツ クリアデカールTH はがき（10枚）', maker: 'ハイキューパーツ', ink: ['laser'], mirror: false, size: 'はがき・約12ミクロン', price: '公式770円', good: 'レーザープリンター用でとても薄い（約0.012mm）。刷った黒に金・銀の箔をのせられる。', caution: 'インクジェット不可。用紙設定は厚紙か普通紙・手差し。', shops: [{ shop: 'ハイキューパーツ公式', url: 'https://www.hiqparts.com/item/4582370704246.html' }] },
    { id: 'miracle', type: 'decal', name: 'ミラクル工業 トナータイプ水転写シール（A4・2セット）', maker: 'ミラクル工業', ink: ['laser'], mirror: false, size: 'A4', price: '（公式に価格の記載なし）', good: 'レーザー・コピー機専用。公式に「爪に貼って仕上げにジェルコートすればネイルシール」。', shops: [{ shop: 'ミラクル工業公式', url: 'https://miracle-kogyo.jp/our_products/for_domestic/miracle_sheet/ms_laser/' }] },
    { id: 'paoon', type: 'decal', name: '象のロケット クリアデカールシート Z-CDCA4（5枚）', maker: '象のロケット', ink: ['laser'], mirror: false, size: 'A4・10ミクロン以下', price: '1,000円（5枚）', good: 'ネイルの作例がある薄いデカール。', caution: 'レーザーは機種による。注文はメール。', shops: [{ shop: '象のロケット', url: 'https://www.paoon.com/decal/gwnytxtth.html' }, { shop: 'ネイルの作例', url: 'https://www.paoon.com/decal/bbwidhcwd.html' }] },
  ];
  // 金・銀・白の箔、ホロ、立体に使うもの
  const EXTRAS = [
    { id: 'leaf', name: '吉田金糸店 スタンピングリーフ 金 S-1・銀 S-2（各20枚）／マット白 S-31', good: 'レーザーで刷った所にだけ、熱で箔が付く（トナー箔押し）。', price: 'ハンズ 金・銀 550円・マット白 825円', shops: [{ shop: 'ハンズ（金）', url: 'https://hands.net/goods/2430001557872/' }, { shop: 'ハンズ（銀）', url: 'https://hands.net/goods/2430001557834/' }, { shop: 'ハンズ（マット白）', url: 'https://hands.net/goods/2430001557841/' }] },
    { id: 'laminator', name: 'アイリスオーヤマ 4本ローラーラミネーター LFA34AR', good: '箔を付けるのに使う（アイロン中温 約150℃でもできる）。', price: '価格.com 最安 8,891円（2026年10月）', shops: [{ shop: '価格.com', url: 'https://kakaku.com/item/K0001032870/' }] },
    { id: 'aurora', name: 'ICE GEL アイスオーロラフィルム（3cm×100cm）', good: 'ホロ・オーロラは、このネイル用フィルムを下に敷き、透明デカールを上に貼る。', price: '650円（メーカー価格）', shops: [{ shop: 'ビューティガレージ', url: 'https://www.beautygarage.jp/p/194039' }] },
    { id: 'foilgel', name: 'Naility! ホイル転写ジェル', good: '刷った線をガイドに細筆で塗り、ネイル用ホイルをのせる（線の上だけ金にする）。', price: '1,400円（メーカー価格）', shops: [{ shop: 'ビューティガレージ', url: 'https://www.beautygarage.jp/p/262881' }] },
    { id: 'nelgel', name: 'Raygel ネルジェル Clear（4g）', good: '立体（ぷっくり）は、貼って硬化した上に、かためのクリアジェルで盛る。', price: '1,100円（メーカー価格）', shops: [{ shop: 'ビューティガレージ', url: 'https://www.beautygarage.jp/p/165297' }] },
  ];
  T.STICKER_GUIDE = {
    checked: '2026年10月12日',
    INKS: [{ id: 'dye', name: '染料インク' }, { id: 'pigment', name: '顔料インク' }, { id: 'laser', name: 'レーザー' }],
    inkHelp: 'インクジェットのプリンターは「染料」か「顔料」。キヤノン PIXUS やエプソンの多くの家庭用は「染料」。全色顔料の機種もある。プリンターの説明書かインクの箱で確かめてください。',
    materials: MATERIALS, extras: EXTRAS,
    thickness: '分厚いシールは、爪のカーブに沿わず端が浮きやすくなります。家で刷るデカールは膜が薄く、たとえばレーザー用の薄いデカールは、爪に残る層がメーカー表示で約10〜12ミクロン（0.01mm）です。皮ふにかけずに貼り、トップジェルで端まで包めば浮きにくくなります（目安。まず1本で試して、数日後の浮きを確かめてください）。',
    makeSteps: [
      'プリンターのインク（染料・顔料・レーザー）に合う素材を選ぶ。合わないとインクが乗らない・にじむ。',
      'まず普通紙にテスト印刷して、目盛りの長さを定規で測る（ずれていたらアプリに入れて補正）。',
      '「転写シール（タトゥー型）」は左右反転をオンにして刷る。「水転写デカール」は反転しない。',
      '素材の説明書どおりの用紙設定で刷る（例: エーワンはキヤノンなら「写真用紙光沢・きれい」）。1枚ずつ取り出す。',
      'よく乾かす（エーワンはドライヤー1分以上、自然乾燥なら半日）。',
      'インクを封じる: 水転写デカールは、切る前にクリアスプレーを薄く5〜6回（不要と書かれた素材は省略）。タトゥー型は付属の糊シートを貼り合わせる。',
      '柄のきわで切る（余白も転写されるため）。爪より大きいもの・皮ふにかかるものは切り詰める。',
    ],
    applySteps: [
      '爪の油分を拭き、ベース→カラーを硬化し、未硬化ジェルを拭き取る（つやのある面に貼る）。透明のシールは白か淡い色の上に。',
      '水転写デカールは、台紙の裏まで水がしみてスライドできるまで水に浸す（目安10秒ほど。浸しすぎるとはがれる）。',
      '爪の上に滑らせて置き、濡れているうちに濡らした筆で位置を直す。',
      '中央から外へ、綿棒やシリコンプッシャーで水と空気を押し出し、完全に乾かす。',
      'トップジェルを薄く2回に分けて、毎回エッジ（先端の断面）まで塗って硬化する。熱いと感じたらすぐ手を出す。',
    ],
    pitfalls: [
      { q: '水に入れたら絵が溶けた・にじんだ', a: 'インクを封じていない。刷り直して、よく乾かす→クリアを薄く何回も吹く→乾かしてから切る。' },
      { q: '色が乗らない・プリンターが汚れた', a: '素材とインクが合っていない（エーワンは染料専用、ハイキューパーツは顔料推奨）。インクの種類を確かめて素材を選び直す。' },
      { q: '白が出ない・下地の色で柄が沈む', a: '家庭用インクジェットには白インクが無い。透明の素材は白か淡い色の上で使う。白い柄は白地の素材を形どおりに切る。' },
      { q: '絵が左右逆になった', a: 'タトゥー型は反転して刷る。水転写デカールは反転しない。素材に合わせてアプリの「左右反転」を切り替える。' },
      { q: '端が浮く・めくれる', a: '皮ふや甘皮にかかっている、爪の先から出ている、エッジにトップを塗っていない、のどれか。皮ふから離して、エッジまでトップで包む。' },
      { q: '細かい白い気泡が入った', a: 'つや消しの面に貼った。硬化して未硬化ジェルを拭いた、つやのある面に貼る。' },
      { q: '印刷が小さい・大きい', a: '「用紙に合わせる」や「フチなし」で刷った。「実際のサイズ（100%）」「フチあり」で刷り、テスト印刷の目盛りで補正する。' },
    ],
    special: {
      gold: '金・銀は、インクジェットでは刷れません。レーザープリンターで黒一色（K100%）に刷った所に、スタンピングリーフ（トナー用の箔）を重ねて、ラミネーターかアイロン（中温 約150℃）で付けます。レーザー用の薄いデカール（クリアデカールTH など）に刷れば、金・銀のシールになります。箔は小さく切って1枚だけ重ね、最初は小さく試してください。',
      white: '家庭用のインクジェットには白インクがありません。白い柄は、白地の素材に刷って形どおりに切るか、レーザーで刷ってマット白の箔を付けます。',
      raised: '立体（ぷっくりしたリボン・お花・レース）は印刷ではできません。貼ってトップジェルで硬化したあと、かためのクリアジェルや3Dジェルで模様の上に盛って硬化します。',
      holo: 'ホロ・オーロラは、ネイル用のオーロラフィルムを先に爪にのせ、その上に透明のデカールを貼ると、柄のすき間から光ります。',
    },
    printing: {
      web: 'パソコンの Chrome などは「印刷する」でそのまま刷れます。倍率は「デフォルト」か「100%」、余白は「なし」、ヘッダーとフッターはオフ。PDF なら「実際のサイズ」で。',
      ios: 'アプリでは「印刷する」で PDF を作り、共有シートの「プリント」から AirPrint で刷ります。iPhone の Safari（Web版）は「PDFを作る」が確実です。',
      android: 'アプリでは「印刷する」で PDF を作り、共有シートからプリンターのアプリか「印刷」へ。',
      scale: 'プリンターの「フチなし」はオフ（拡大されて実寸にならない）。「用紙に合わせる」は選ばない（3〜4%小さくなる）。',
    },
    copyright: '自分で使う分だけにしてください。キャラクターやブランドの柄を写したシールを、売ったり配ったりしないでください。インクは爪の上だけに置き、トップジェルで包んで肌に触れないようにします。',
  };
})(typeof window !== 'undefined' ? window : globalThis);
