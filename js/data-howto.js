/* tsumé — キレイに作る知識。段階別のやり方・使うもの・コツ・失敗の直し方・タイマー。中身は 2026-10-11 の調査（SOURCES）に基づく */
(function (global) {
  'use strict';
  const T = global.TSUME;
  // 文中の {…} はやり方で言い換える（空になった行は出さない）
  const WORDS = {
    gel: {
      cure: '硬化する', load: '筆の片面の半分に軽くのるくらい、少なめに取る', gap: '約1mm', wipe: 'ウッドスティックで拭き取る（皮膚についたまま固めない）',
      thumb: '片手4本を硬化したら、親指だけ別に硬化する', top: 'トップジェル', base: 'ベースジェル', glue: 'パーツ用ジェル',
      tack: '数秒だけ仮硬化して', erase: '固める前ならクリーナーで消して', cleaner: 'クリーナー', magnet: 'マグネットジェル',
      magnetfix: 'すぐにその1本だけ硬化する。これを1本ずつくり返す。', level: '硬化の前に数秒待つと、表面が自然に平らになる。',
      peel: '数秒だけ仮硬化してから、ピンセットでシールをはがす', guardoff: '硬化の前に、はみ出し防止をはがす',
      paint: 'ジェル', again: 'もう一度硬化する', before: '固める前', cured: '硬化して', magnetsome: '1本ずつ「塗る → 磁石 → すぐ硬化」。',
    },
    polish: {
      cure: '乾かす', load: 'ハケの片面をボトルの口でしごき、量を少なめにする', gap: 'ほんの少し', wipe: '除光液を含ませた綿付きのスティックで軽くこする',
      thumb: '', top: 'トップコート', base: 'ベースコート', glue: 'ネイルグルー',
      tack: '少し乾かして', erase: '乾く前なら除光液を含ませた綿付きのスティックで消して', cleaner: '除光液', magnet: 'マグネットポリッシュ',
      magnetfix: '塗ったらすぐ磁石をあてる（乾き始めると光が動かない）。1本ずつくり返す。', level: '',
      peel: '乾ききる前に、シールをゆっくりはがす', guardoff: '塗り終えたら、はみ出し防止をはがす',
      paint: 'マニキュア', again: '押さえ直して乾かす', before: '乾く前', cured: '乾かして', magnetsome: '1本ずつ「塗る → すぐ磁石」。乾き始めると光が動かない。',
    },
  };
  // 硬化・乾燥の目安（秒）。ライトとジェル・マニキュアの説明書を優先（100均のジェルは LED 約1分・UV 約2分）
  const CURE = { gel: 60, magnet: 60, relief: 90, polish_base: 120, polish_coat: 120, polish_top: 600 };

  // ---- 準備（段階で分け方を変える。はじめては4手順、慣れてきたは2、得意は1）
  const P = {
    shape: { title: '形を整える', how: ['ファイルは一方向にだけ動かす（往復させない）。', '10本の長さと形をそろえる。'], tools: ['file_set'], tip: '先に長さをそろえると、塗った後もそろって見える。' },
    cuticle: { title: '甘皮を押し上げる', how: ['甘皮をやわらかくしてから（キューティクルリムーバーがあれば使う）、ウッドスティックを寝かせ、力を入れずに小さな円を描いて押し上げる。', '爪の表面に残る白い薄皮（ルースキューティクル）は、こすって取り除く。残すと、その上から浮いてくる。'], tools: ['pusher'], tip: '根元がきれいなほど、塗った境目がきれいに見える。強くこすりすぎない。' },
    buff: { title: '表面のツヤを消す', how: ['180〜220Gのスポンジバッファーで、表面のツヤを軽く消す（削りすぎない）。', '根元とサイドのきわも、やさしく。', '粉はブラシかワイプで払う。'], tools: ['buffer'], tip: 'ツヤが残っているとジェルが密着せず、浮きやすい。' },
    oil: { title: '油分を拭く', how: ['エタノールかジェルクリーナーを含ませたワイプで、甘皮のまわりから全体を拭く。', 'ここから先は、爪にも髪にも触らない。'], tools: ['cleaner'], tip: '浮きやはがれの一番の原因は、残った油分と薄皮。' },
    oilPolish: { title: '油分を拭く', how: ['消毒用エタノールで爪の表面を拭く（除光液より油分が残りにくい）。', 'ここから先は、爪にも髪にも触らない。'], tools: ['cleaner'], tip: '油分が残ると、はじかれてムラになる。' },
  };
  const merge = (title, list) => ({ title, how: list.flatMap(x => x.how.slice(0, 2)), tools: Array.from(new Set(list.flatMap(x => x.tools))), tip: list[list.length - 1].tip });
  const NIPPER_TIP = 'ニッパーは白く浮いた所だけ。切りすぎるとささくれの原因になる（ケアは1週間〜10日に1回）。';
  const PREP = {
    gel: {
      first: [P.shape, P.cuticle, P.buff, P.oil],
      some: [merge('形と甘皮を整える', [P.shape, P.cuticle]), merge('表面を整えて油分を拭く', [P.buff, P.oil])],
      expert: [{ title: '下ごしらえ', how: ['形をそろえ、甘皮を押し上げる。', 'ルースキューティクルは、白く浮いた所だけをニッパーの刃を寝かせて切る。', '180〜220Gでツヤを消す。', '粉と油分を拭く。'], tools: ['file_set', 'pusher', 'nipper', 'buffer', 'cleaner'], tip: NIPPER_TIP }],
    },
    polish: {
      first: [P.shape, P.cuticle, P.oilPolish],
      some: [merge('形と甘皮を整える', [P.shape, P.cuticle]), P.oilPolish],
      expert: [{ title: '下ごしらえ', how: ['形をそろえ、甘皮を押し上げる。', 'ルースキューティクルは、白く浮いた所だけをニッパーの刃を寝かせて切る。', '油分を拭く。'], tools: ['file_set', 'pusher', 'nipper', 'cleaner'], tip: NIPPER_TIP }],
    },
  };
  const TIP_ON = { title: 'チップをつける', how: ['チップ用の両面テープを、自分の爪の大きさに合わせて貼る。', 'チップの根元を自分の爪の根元に合わせ、10秒押さえる。', '外すときは、横からゆっくりはがす。'], tools: ['tip_tape'], tip: 'つける前に、自分の爪の油分をエタノールで拭いておくと取れにくい。' };
  const TIP_FIT = { title: 'チップを合わせる', how: ['10本ぶん、自分の爪の幅に合うサイズを選ぶ（迷ったら大きい方を削る）。', '根元のカーブをファイルで自分の爪に合わせる。', 'チップの表面のツヤを軽く消し、エタノールで拭く。'], tools: ['tips', 'file_set'], tip: 'サイズが合うと、浮かずに自然に見える。' };
  // 最初に見せる「これだけは」（調査で効果が大きい順）
  const PROMISES = ['拭いたら、もう爪に触らない', '1層ずつ薄く塗る', '毎回、先端の断面（エッジ）も塗る'];

  // ---- ベース・トップ・仕上げ
  const BASE = {
    how: {
      first: ['{load}。', '根元とサイドの肌から{gap}あけて、薄く塗る。', 'サイドは、別の指で皮膚を軽く引き、筆をトントンと当てて塗る。', '先端の断面（エッジ）にも塗る。', 'はみ出したら、今のうちに{wipe}。', '{thumb}'],
      some: ['薄く塗る。根元とサイドは{gap}あけ、エッジも塗る。', '{thumb}'],
      expert: ['薄く、エッジまで。肌に触れないきわで止める。'],
    },
    tip: { gel: 'ジェルは肌につけない。かぶれや浮きの原因になる。', polish: 'ベースは薄く。色がきれいにのり、爪も染まりにくい。' },
    fix: {
      gel: [['はみ出した', '固まる前にウッドスティックで取る。固まった後はファイルで軽く削る。'], ['すぐ浮いてくる', '薄皮・油分の残りか、エッジの塗り忘れ。浮いた所をグルーで貼り直さない（緑膿菌の原因）。オフして塗り直す。'], ['硬化中に熱い', 'すぐライトから手を出す。厚く塗りすぎ。次は薄く重ねる。']],
      polish: [['はみ出した', '乾く前に、除光液を含ませた綿付きのスティックで軽くこする。'], ['すぐはがれる', '油分が残っているか、エッジの塗り忘れ。次はエタノールで拭いてから。']],
    },
  };
  const TOP = {
    how: {
      first: ['{top}を多めに取り、爪の中央にのせてから広げる。', 'パーツのまわりは囲むように。ストーンの表面には塗らない。', 'エッジを包むように塗る。', 'はみ出しを{wipe}。', '{thumb}'],
      some: ['中央にのせて広げる。パーツはまわりだけ、エッジも包む。', '{thumb}'],
      expert: ['表面を平らに整え、エッジを包む。パーツの表面は避ける。'],
    },
    tip: 'トップの前に、横から見て表面が平らか確かめる。',
    fix: {
      gel: [['表面がでこぼこ', 'トップをもう一度、薄く重ねる。'], ['べたつきが残る', '拭き取りタイプなら正常。クリーナーで拭く。ノンワイプでべたつくなら、もう一度照射する。'], ['硬化中に熱い', 'すぐライトから手を出す。厚く塗りすぎ。']],
      polish: [['表面がでこぼこ', '乾いてから、トップコートを薄くもう一度。'], ['よれた・指紋がついた', '乾く前に触った。乾いてから薄く重ねて直す。'], ['気泡ができた', 'ボトルを振らない。両手ではさんで転がして混ぜる。']],
    },
  };
  const TOP_POLISH_NOTE = '乾くまで、速乾タイプで約10分、ふつうは30分以上。爪先で軽くたたいて、カチッと音がすれば乾いている。';
  const FINISH = { title: '仕上げ', how: ['ネイルオイルを根元に1滴ずつ。指でなじませる。', '肌についた{paint}があれば落とす。'], tools: ['cuticle_oil'], tip: 'オイルは1日に数回。乾燥すると浮きや欠けの原因になる。' };
  const CHECK = ['根元とサイドに、肌との境目がそろっている', '先端の断面（エッジ）まで塗れている', '横から見て、表面が平らで光がまっすぐ映る', 'パーツを指でなでても、引っかからない・動かない', '肌にはみ出しやベタつきがない'];
  const AFTERCARE = {
    gel: '長持ちのコツ: オイルは1日に数回。水仕事は手袋をして、長湯・サウナは控える。2〜3週間でつけ替え。はがさずに、表面を削ってからアセトンでオフ。',
    polish: '長持ちのコツ: 2〜3日ごとにトップコートだけ塗り直す（もちは7〜10日）。水仕事は手袋を。',
  };

  // ---- 技法の系統。how は段階別、tools は使うもの（はじめては toolsFirst、慣れてきたは toolsSome も足す）
  const FAMILY = {
    color: {
      name: '塗り', tools: [], timer: 'coat',
      how: {
        first: ['ボトルは振らずに、両手ではさんで転がして混ぜる（気泡を防ぐ）。', '{load}。', '根元を{gap}あけ、中央 → 左 → 右の3回で塗る。', '先端の断面（エッジ）もなぞる。', 'はみ出しは今のうちに{wipe}。', '{level}', '{thumb}', '2度目も同じように薄く。'],
        some: ['薄く2度塗り。1度目はムラがあってよい。', '根元とサイドを{gap}あけ、エッジも毎回塗る。', '{level}', '{thumb}'],
        expert: ['2度塗り。2度目で根元のきわを筆先で整える。'],
      },
      tip: '厚く1回より、薄く2回。厚いと縮んだり、浮いたりする。',
      fix: [['ムラになる', '1度目はムラでよい。2度目を薄く重ねると均一になる。'], ['縮んだ・よれた', '量が多すぎる。少なめにして、薄く2度に分ける。'], ['気泡ができた', 'ボトルを振らない。両手ではさんで転がして混ぜる。']],
    },
    grad: {
      name: 'グラデーション', tools: ['sponge'], toolsFirst: ['skin_guard'], toolsSome: ['skin_guard'], timer: 'coat',
      how: {
        first: ['爪のまわりの肌に、はみ出し防止を2〜3度塗って乾かす（爪の上には塗らない）。', 'スポンジに色をのせ、紙で一度叩いて量を減らす。', '先端から3分の1に、トントンと叩く。根元へ向かうほど軽く。', '{guardoff}。', '{cure}。足りない所だけ、もう一度。'],
        some: ['はみ出し防止を塗ってから、スポンジで先端から叩く。境目だけ少しずらしてぼかす。', '薄く2回に分けて色を重ねる。'],
        expert: ['筆でぼかすなら、境目にクリアを少し足して溶かす。'],
      },
      tip: '色は「足す」より「重ねる」。1回で濃くしない。',
      fix: [['境目がくっきりする', 'スポンジを少しずらして、境目だけ軽く叩く。'], ['肌に色がつく', 'はみ出し防止を先に塗る。天然ゴムでかぶれたことがある人は使わず、綿棒で拭き取る。']],
    },
    french: {
      name: 'フレンチ', tools: ['art_brush'], toolsFirst: ['nail_tape', 'practice_tips'], toolsSome: ['nail_tape'], timer: 'coat',
      how: {
        first: ['ガイドシールは一度手の甲に貼って粘着を弱めてから、先端の少し下に貼る。左右の高さをそろえ、指で押さえて空気を抜く。', 'シールより先を塗る。シールの上にはみ出してよい。', '{peel}。', '線のガタつきは、細筆に{cleaner}を含ませてなぞって整える。', '{cure}。'],
        some: ['ガイドシールを使うか、筆の側面を寝かせて片側から中央へ線を引く。反対側も同じ。', '先端の断面も塗る。', '線が太くなったら、内側を{cleaner}を含ませた筆で削る。'],
        expert: ['筆一本で左右から中央へ。{before}なら直せるので、10本で角度をそろえる。'],
      },
      tip: 'スマイルライン（色の境目）は、爪の形に合わせて左右の高さをそろえる。',
      fix: [['左右の高さが違う', '低い方に合わせて、高い方を筆と{cleaner}で削る。'], ['シールの下に色が流れた', 'シールは指でしっかり押さえ、空気を抜く。色は少なめに。']],
    },
    magnet: {
      name: 'マグネット', tools: ['magnet_stick'], toolsFirst: ['skin_guard'], toolsSome: ['skin_guard'], timer: 'magnet',
      how: {
        first: ['下に黒か濃い色を塗っておくと、光がよく出る。', '{magnet}はよく混ぜてから、少し厚めに1本だけ塗る。', '磁石を爪から5mmほど離して、5〜10秒あてる。', '{magnetfix}'],
        some: ['{magnetsome}', '磁石の角度で光の線の向きが決まる。'],
        expert: ['磁石を動かす速さと角度で、光の幅とにじみを作る。'],
      },
      tip: { gel: 'まとめて塗ると、待つ間に光が流れる。1本ずつすぐ硬化する。', polish: 'まとめて塗ると、乾き始めて光が動かなくなる。1本ずつ塗って、すぐ磁石。' },
      fix: [['光がぼやける', '厚みが足りないか、時間がたった。塗り直して磁石をあて直す。'], ['磁石に{paint}がつく', '近づけすぎ。5mmほど離す。']],
    },
    powder: {
      name: 'パウダー', tools: [], toolsFirst: ['skin_guard'], timer: 'coat',
      how: {
        first: ['ノンワイプのトップを塗って、しっかり硬化する。', '付属のチップでパウダーを少しずつ擦り込む。', '余分な粉をブラシで払う。爪のまわりの粉も落とす。', 'トップでエッジまで包む（はがれ防止）。'],
        some: ['ノンワイプトップ → 硬化 → 擦り込む → 粉を払う → トップでエッジまで包む。'],
        expert: ['擦り込む圧と回数で、ツヤの強さを変える。'],
      },
      tip: '下のトップは「ノンワイプ」を使う。拭くタイプだと光らない。',
      fix: [['光らない・くもる', 'ベタつきが残っている。ノンワイプトップで、硬化をしっかり。'], ['端からはがれる', 'エッジまでトップで包んでいない。']],
    },
    glitter: {
      name: 'ラメ・ホロ', tools: ['tweezers'], toolsFirst: ['skin_guard'], timer: 'coat',
      how: {
        first: ['ラメは筆でトントンとのせる（塗り広げない）。', '大きいホロは、ピンセットで1枚ずつ置く。', 'トップを2回に分けて、表面を平らにする。'],
        some: ['ラメは密な所と粗い所を作る。ホロは大小を混ぜて不規則に。', 'トップは2回で平らに。'],
        expert: ['ホロの向きを少しずつ変えて、光り方にばらつきを作る。'],
      },
      tip: 'ラメやホロの角は、トップで2回包むと引っかからない。',
      fix: [['表面がザラザラ', 'トップを2回。1回目を{cured}から2回目。']],
    },
    brush: {
      name: '筆のアート', tools: ['art_brush'], toolsFirst: ['practice_tips'], timer: 'coat',
      how: {
        first: ['いきなり爪に描かず、まずチップで1本練習する。', '手首をテーブルにつけ、描く方の爪を少しずつ回しながら描く。', '筆に取る量は「少なすぎる」くらいで。', '1筆描くごとに{tack}おくと、にじまない。', '線がゆれたら、{erase}やり直せる。'],
        some: ['手首を固定して、爪を回しながら描く。', '描くたびに{tack}、にじみを止める。'],
        expert: ['にじませたい所は、{before}に色を重ねる。'],
      },
      tip: '筆を動かすより、爪の方を回す。線がまっすぐになる。',
      fix: [['線がガタガタ', '{erase}描き直す。'], ['にじむ', '下の層が固まっていない。{tack}から描く。']],
    },
    dots: {
      name: 'ドット', tools: ['dotting'], timer: 'coat',
      how: {
        first: ['ドットペンに色を取ったら、一度紙に置いてから爪へ。', '点は「置く」だけ。押しつけない。', '1回取るごとに1〜2点。だんだん小さくなるのを使う。'],
        some: ['大きさを変えたい時は、ペンを替えるか取り直す。'],
        expert: ['点の間隔をわざと不ぞろいにすると、手描きらしく見える。'],
      },
      tip: 'ペン先をそっと触れて、まっすぐ上に離す。',
      fix: [['点がつぶれる', '押しつけている。ペン先をそっと触れて離す。']],
    },
    foil: {
      name: 'ホイル・金箔', tools: ['tweezers'], timer: 'coat',
      how: {
        first: ['トップを薄く塗り、{before}にホイルをのせる。', 'ピンセットで置いて、綿棒で軽く押さえる。', 'トップで2回包んで、端が浮かないようにする。'],
        some: ['ちぎった形のまま置き、トップで2回包む。'],
        expert: ['重ねる枚数で、金の濃さに強弱をつける。'],
      },
      tip: '金箔は整えすぎない。ちぎった形のまま置くと上品。',
      fix: [['端が浮く', 'トップで2回包む。']],
    },
    relief: {
      name: '盛り', tools: [], timer: 'relief',
      how: {
        first: ['盛るジェルは1回に少しずつ取る。', '盛ったら流れる前に、その1本だけすぐ硬化する。', '熱いと感じたら、すぐライトから手を出す（厚い所ほど熱くなる）。'],
        some: ['1本ずつ「盛る → すぐ硬化」。高さは2回に分けて出す。'],
        expert: ['盛りの高さに強弱をつけ、光の入り方を作る。'],
      },
      tip: '1本ずつ盛って、すぐ固める。まとめると流れて平らになる。',
      fix: [['流れて平らになる', '盛ったらすぐ硬化。かためのジェル（アイシング用）を使う。'], ['硬化中に熱い', 'すぐライトから手を出す。1回に盛る量を減らす。']],
    },
    sticker: {
      name: 'シール', tools: ['tweezers'], timer: 'coat',
      how: {
        first: ['シールはピンセットで台紙からはがす。', '中央から外へ空気を押し出すように貼る。', 'はみ出た所はハサミで切るか、ファイルで落とす。', '{top}で封じて、端が浮かないようにする。'],
        some: ['中央から外へ貼り、{top}で封じる。'],
        expert: ['シールの上に色を重ねて、手描きのように見せる。'],
      },
      tip: 'シールの端は、トップで包むと浮かない。',
      fix: [['しわ・気泡', '貼り直せるうちに、中央から外へ押し出す。']],
    },
    parts: {
      name: 'パーツ', tools: ['tweezers'], timer: 'coat',
      how: {
        first: ['置く場所に{glue}を少し（パーツの半分くらいの量）。', 'ピンセットでパーツを拾い、置いて軽く押す。', '{cure}。大きいパーツは、まわりを囲んでもう一度。'],
        some: ['{glue}で置き、まわりを囲んで{cure}。'],
        expert: ['パーツとパーツの間のすき間を筆で埋めて、段差をなくす。'],
      },
      tip: 'パーツの表面にはトップを塗らない。まわりだけを囲むと、輝きが残る。',
      fix: [['パーツが取れる', '接着が少ない。まわりを囲むように足して、{again}。']],
    },
    matte: {
      name: 'マット', tools: [], timer: 'coat',
      how: {
        first: ['色を薄く2度塗りして、{cure}。', 'この指は、ほかの指のトップのあとに、マットトップを重ねて仕上げる。'],
        some: ['2度塗りして{cure}。仕上げにマットトップを重ねる指。'],
        expert: ['2度塗りで色を整える。仕上げはマットトップ。'],
      },
      tip: 'マットトップは薄く。厚いとムラになる。',
      fix: [['ツヤが残る', '塗れていない所がある。マットトップをもう一度、薄く重ねる。']],
    },
  };
  const MATTE_TOP = { title: 'マットトップ（シュガーの指）', how: ['トップを硬化したあと、シュガー質感の指だけにマットトップを薄く塗る。', '{cure}。'], tools: ['top_matte'], tip: 'マットの指は指紋がつきやすい。硬化するまで触らない。' };
  const PEEL_TIP = 'はがせるベースは、長持ちより手軽さ向き。週末だけのネイルに。';
  const TECH_FAMILY = {
    one_color: 'color', sheer: 'color', bare_gloss: 'color', peel_one: 'color', sugar_matte: 'matte', glitter_polish: 'glitter', magnet_polish: 'magnet',
    gradient: 'grad', lame_grad: 'grad', aura: 'grad', cheek: 'grad', nuance: 'grad',
    french: 'french', skinny_french: 'french', glass_french: 'french', mirror_french: 'french',
    magnet: 'magnet', magnet_line: 'magnet', velvet: 'magnet', butterfly: 'magnet',
    mirror: 'powder', aurora: 'powder',
    flash: 'glitter', holo_scatter: 'glitter', heart_flakes: 'glitter',
    tortoise: 'brush', marble: 'brush', ink: 'brush', gold_crack: 'brush', flower_paint: 'brush', camellia: 'brush', mizuhiki: 'brush', firework: 'brush', check: 'brush', tweed: 'brush', ribbon: 'brush', lace: 'brush', drip: 'brush', gemstone: 'brush', watercolor_flower: 'brush', butterfly_line: 'brush',
    dots: 'dots', plum: 'dots', snow_dots: 'dots',
    gold_leaf: 'foil', moon_gold: 'foil', gold_edge: 'foil',
    droplet3d: 'relief', ice: 'relief', quilting: 'relief', shell_inlay: 'relief', flower_pressed: 'relief',
    sticker_art: 'sticker',
    stones_accent: 'parts', pixie: 'parts', pearls_tip: 'parts', brion_line: 'parts', studs: 'parts', star_parts: 'parts', turtle_gold: 'parts', starfish: 'parts',
  };

  // ---- トッピングの付け方（種類別。ジェルは高粘度のパーツ用ジェル、マニキュアはネイルグルー）
  const STONE_GEL = ['置く場所にパーツ用ジェルを少し（パーツの半分くらいの量）。', 'ピンセットで置き、位置が決まったら5秒ほど仮硬化する。', 'まわりを囲むようにトップを塗って本硬化（ストーンの表面には塗らない）。'];
  const STONE_POLISH = ['ネイルグルーを少し置き（皮膚につけない）、ピンセットでのせて10秒押さえる。', '乾いたら、トップコートはまわりだけ薄く（厚いとストーンがくもる）。'];
  const BIG_GEL = ['重いので、爪の中央より根元寄りの平らな所に置く。', 'パーツ用ジェルを置き、のせて仮硬化。', 'まわりと下のすき間をジェルで埋めて、本硬化。'];
  const BIG_POLISH = ['根元寄りの平らな所に。ネイルグルーを少し置く（皮膚につけない）。', 'のせたら20秒押さえる。乾いたら、まわりをトップコートで囲む。'];
  const TOPPING = {
    stone: { gel: STONE_GEL, polish: STONE_POLISH, tip: 'ストーンの表面にトップを塗ると、光らなくなる。' },
    pearl: { gel: STONE_GEL, polish: STONE_POLISH, tip: 'パールは少し沈めるように押すと、取れにくい。' },
    bullion: { gel: ['トップジェルを細く塗り、固める前にブリオンを並べる。', '仮硬化してから、上からトップで包んで本硬化（小さいので包んでよい）。'], polish: ['トップコートが乾く前にブリオンを置く（速乾タイプは不向き）。', '乾いたら、上からトップコートで包む。'], tip: '1粒ずつ並べるなら、先の曲がったピンセットが拾いやすい。' },
    stud: { gel: STONE_GEL, polish: STONE_POLISH, tip: '平らな面を下に。四角や三角は、角の向きを爪の向きにそろえる。' },
    charm: { gel: ['裏の平らな所を下にして、根元寄りの平らな所に置く。', 'パーツ用ジェルで置いて仮硬化。', 'まわりのすき間をジェルで埋めて本硬化。'], polish: BIG_POLISH, tip: '先端・角・サイドは髪や服に引っかかる。中央から根元寄りに置く。' },
    bijou: { gel: BIG_GEL, polish: BIG_POLISH, tip: '大きいパーツから置き、すき間を小粒で埋める。指でなでて引っかからないか確かめる。' },
    flower3d: { gel: BIG_GEL, polish: BIG_POLISH, tip: '花びらの下にすき間を作らない（ジェルで埋める）。' },
    chain: { gel: ['チェーンは先に、爪の幅に合わせて切る。', 'パーツ用ジェルを線のように塗り、チェーンを置いて仮硬化。', '両端をトップで包んで本硬化。'], polish: ['爪の幅に合わせて切る。', 'トップコートが乾く前にのせて押さえる。乾いたら両端をトップコートで包む。'], tip: '端が引っかかりやすい。両端を多めに包む。' },
  };

  // パーツ以外に要る小物（キレイに仕上げる道具）。初回だけ買えば使い回せるので once
  Object.assign(T.MATERIALS, {
    buffer: { name: 'スポンジバッファー（180G前後）', cat: 'kit', once: true, tiers: { coin: { p: 'スポンジファイル 100/180', s: 'ダイソー', y: 110 }, kodawari: { p: 'スポンジバッファー 100/180', s: 'PRESTO', y: 350 } } },
    nail_tape: { name: 'フレンチのガイドシール', cat: 'kit', once: true, tiers: { coin: { p: 'フレンチネイルガイドシール 180枚', s: 'キャンドゥ', y: 110 } } },
    parts_gel: { name: 'パーツ用ジェル（高粘度）', cat: 'kit', once: true, tiers: { coin: { p: 'ビジュージェル 高粘度', s: 'キャンドゥ', y: 330 }, kodawari: { p: 'パーツジェル 4g', s: 'rieugel', y: 2500 } } },
    skin_guard: { name: 'はみ出し防止（肌に塗ってはがす）', cat: 'kit', once: true, tiers: { coin: { p: 'はみだしネイル 塗るだけブロック', s: 'セリア', y: 110 } } },
    practice_tips: { name: '練習用のネイルチップ', cat: 'kit', once: true, tiers: { coin: { p: 'ネイルチップ 72枚', s: 'ダイソー', y: 110 } } },
    remover: { name: '除光液', cat: 'kit', once: true, tiers: { coin: { p: '除光液', s: 'ダイソー', y: 110 } } },
    nipper: { name: 'キューティクルニッパー', cat: 'kit', once: true, tiers: { coin: { p: 'キューティクルニッパー', s: 'ダイソー', y: 220 }, kodawari: { p: 'NAILERS\' キューティクルニッパー', s: 'ビューティガレージ', y: 4000 } } },
  });

  // 調べた出どころ（2026-10-11）。使い方の画面に出す
  const SOURCES = [
    ['ジェルネイルを安全に楽しむために（JNA監修）', 'https://www.nail.or.jp/media/pdf/eisei/gelnail.pdf'],
    ['ジェルネイルの硬化熱（国民生活センター）', 'https://www.kokusen.go.jp/news/data/n-20180906_3.html'],
    ['セルフジェルの塗り方（All About 黒崎えり子）', 'https://allabout.co.jp/gm/gc/469953/'],
    ['ジェルが浮く原因（All About 黒崎えり子）', 'https://allabout.co.jp/gm/gc/469863'],
    ['甘皮ケアとジェルの塗り方（美的.com）', 'https://www.biteki.com/nail/nail-howto/939041'],
    ['マニキュアをきれいに塗るコツ（美的.com uka 監修）', 'https://www.biteki.com/nail/nail-howto/297245'],
    ['ストーンの付け方（LIPS 石堂公誉 監修）', 'https://lipscosme.com/articles/5198'],
    ['Perfect Lesson（ビューティガレージ）', 'https://www.beautygarage.jp/pickup/nail_perfectlesson'],
  ];

  T.HOWTO = { WORDS, CURE, PREP, TIP_FIT, TIP_ON, PROMISES, BASE, TOP, TOP_POLISH_NOTE, MATTE_TOP, PEEL_TIP, FINISH, CHECK, AFTERCARE, FAMILY, TECH_FAMILY, TOPPING, SOURCES };
})(typeof window !== 'undefined' ? window : globalThis);
