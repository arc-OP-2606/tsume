/* tsumé — core data: tiers, materials, techniques, scenes, moods, shapes, seasons
   価格は 2026-10 のWeb調査に基づく目安（税込・店や時期で変動）。 */
(function (global) {
  'use strict';

  const TIERS = ['coin', 'petit', 'kodawari', 'luxe'];
  const TIER_INFO = {
    coin:     { label: 'ワンコイン',     range: '〜550円',   desc: '100均の材料だけで。セリア・キャンドゥ・ダイソー。' },
    petit:    { label: 'プチプラ',       range: '〜2,000円', desc: '100均に、専門店のパーツやOPIを少し足して。' },
    kodawari: { label: 'こだわり',       range: '〜6,000円', desc: 'プロ用ジェル（プリジェル・ageha）と上質なパーツ。' },
    luxe:     { label: 'ラグジュアリー', range: '上限なし',  desc: 'スワロフスキー、本金箔、メゾンのヴェルニ。' },
  };

  // 素材。tiers: その予算段階で選ぶ商品（p=商品, s=店, y=円）。無い段階は下位を流用。
  const MATERIALS = {
    base_gel:   { name: 'ベースジェル', cat: 'gel', tiers: { coin: { p: 'ベースコート（ジェル）', s: 'セリア', y: 110 }, kodawari: { p: 'エクセレントベース', s: 'プリジェル', y: 2200 }, luxe: { p: 'プレミアムベース', s: 'KOKOIST', y: 2800 } } },
    top_gel:    { name: 'トップジェル', cat: 'gel', tiers: { coin: { p: 'ノンワイプトップコート', s: 'セリア', y: 110 }, kodawari: { p: 'トップシャイン', s: 'プリジェル', y: 2200 }, luxe: { p: 'プレミアムトップ', s: 'KOKOIST', y: 2800 } } },
    top_matte:  { name: 'マットトップ', cat: 'gel', tiers: { coin: { p: 'ノンワイプマットコート', s: 'セリア', y: 110 }, kodawari: { p: 'マットトップ', s: 'ageha', y: 1540 } } },
    color_gel:  { name: 'カラージェル（1色）', cat: 'gel', per: 'color', tiers: { coin: { p: 'カラージェル', s: 'セリア / キャンドゥ', y: 110 }, petit: { p: 'カラージェル', s: 'ネイル工房', y: 330 }, kodawari: { p: 'カラーEX', s: 'プリジェル', y: 1760 }, luxe: { p: 'カラージェル', s: 'KOKOIST', y: 1540 } } },
    sheer_gel:  { name: 'シアーカラージェル', cat: 'gel', tiers: { coin: { p: 'パルカラージェル（シアー系）', s: 'キャンドゥ', y: 110 }, kodawari: { p: 'シアーカラージェル', s: 'ageha', y: 1078 }, luxe: { p: 'シアーカラー', s: 'KOKOIST', y: 1540 } } },
    color_base: { name: 'カラーベースコート', cat: 'gel', tiers: { coin: { p: 'カラーベースコート（ソフトベージュ/ピンク）', s: 'セリア', y: 110 }, kodawari: { p: 'カラーベース', s: 'プリジェル', y: 1980 } } },
    magnet_gel: { name: 'マグネットジェル', cat: 'gel', tiers: { coin: { p: 'マグネットジェル（10〜13色）', s: 'ダイソー / キャンドゥ', y: 110 }, kodawari: { p: 'マグネットジェル', s: 'プリジェル', y: 1980 }, luxe: { p: 'シルキーマグネット', s: 'KOKOIST', y: 2200 } } },
    magnet_stick:{ name: 'マグネット棒', cat: 'tool', tiers: { coin: { p: 'ネイルマグネット', s: 'キャンドゥ', y: 110 }, kodawari: { p: 'プロ用マグネット', s: '専門店', y: 880 } } },
    mirror_powder:{ name: 'ミラーパウダー', cat: 'powder', tiers: { coin: { p: 'ミラーパウダー', s: 'セリア', y: 110 }, kodawari: { p: 'ミラーパウダー', s: '専門店', y: 1320 } } },
    aurora_powder:{ name: 'オーロラパウダー', cat: 'powder', tiers: { coin: { p: 'オーロラパウダー / ユニコーンパウダー', s: 'ダイソー / セリア', y: 110 }, kodawari: { p: 'オーロラパウダー', s: '専門店', y: 1320 } } },
    glitter:    { name: 'グリッター', cat: 'parts', tiers: { coin: { p: 'グリッター6個セット', s: 'ダイソー', y: 110 }, petit: { p: 'グリッターミックス', s: '専門店', y: 330 } } },
    flash_gel:  { name: 'フラッシュラメジェル', cat: 'gel', tiers: { coin: { p: 'フラッシュラメ', s: 'セリア', y: 110 }, kodawari: { p: 'フラッシュジェル', s: '専門店', y: 1650 } } },
    holo:       { name: 'ホログラム', cat: 'parts', tiers: { coin: { p: 'ホログラム', s: 'セリア', y: 110 }, petit: { p: 'ホログラムセット', s: '専門店', y: 330 } } },
    stones_small:{ name: '極小ストーン・ブリオン', cat: 'parts', tiers: { coin: { p: 'ネイルストーン（極小）', s: 'ダイソー', y: 110 }, petit: { p: 'ガラスブリオン', s: 'ネイル工房', y: 198 }, luxe: { p: 'クリスタルピクシー 5g', s: 'スワロフスキー', y: 4950 } } },
    stone_accent:{ name: 'アクセントストーン', cat: 'parts', tiers: { coin: { p: 'ネイルストーン', s: 'セリア', y: 110 }, petit: { p: '高級平底クリスタル', s: 'グレースガーデン', y: 330 }, luxe: { p: 'フラットバック', s: 'スワロフスキー', y: 880 } } },
    pearls:     { name: 'パール（半円）', cat: 'parts', tiers: { coin: { p: 'パールパーツ', s: 'セリア', y: 110 }, petit: { p: '半円パール', s: '専門店', y: 220 } } },
    brion:      { name: 'メタルブリオン', cat: 'parts', tiers: { coin: { p: 'ブリオン', s: 'セリア', y: 110 }, petit: { p: 'メタルブリオン 1mm', s: 'ネイル工房', y: 105 } } },
    studs:      { name: 'スタッズ', cat: 'parts', tiers: { coin: { p: 'メタルパーツ', s: 'キャンドゥ', y: 110 }, petit: { p: 'デザインスタッズ', s: 'BLAZE', y: 298 } } },
    foil_gold:  { name: 'ゴールドホイル・金箔', cat: 'parts', tiers: { coin: { p: 'ネイルホイル（金）', s: 'セリア', y: 110 }, luxe: { p: '本金箔（ネイル用）', s: '専門店', y: 1100 } } },
    foil_silver:{ name: 'シルバーホイル', cat: 'parts', tiers: { coin: { p: 'ネイルホイル（銀）', s: 'セリア', y: 110 } } },
    shell:      { name: 'クラッシュシェル', cat: 'parts', tiers: { coin: { p: 'シェルパーツ', s: 'ダイソー', y: 110 }, petit: { p: '天然シェル', s: '専門店', y: 275 } } },
    dried_flower:{ name: '押し花・ドライフラワー', cat: 'parts', tiers: { coin: { p: 'ドライフラワー', s: 'セリア', y: 110 }, petit: { p: '押し花セット', s: '専門店', y: 440 } } },
    flakes:     { name: 'ハート・星フレーク', cat: 'parts', tiers: { coin: { p: 'ネイル用フレーク（ハート・星）', s: 'キャンドゥ', y: 110 } } },
    art_gel:    { name: 'アートジェル（ライン用）', cat: 'art', tiers: { coin: { p: 'ハードラインジェル', s: 'キャンドゥ', y: 110 }, kodawari: { p: 'アートジェル', s: 'プリジェル', y: 1760 } } },
    art_brush:  { name: 'アート筆（細筆）', cat: 'tool', tiers: { coin: { p: '2WAYネイルブラシ', s: 'セリア', y: 110 }, kodawari: { p: 'アートブラシ', s: '専門店', y: 1650 } } },
    sticker:    { name: 'ネイルシール', cat: 'parts', tiers: { coin: { p: 'ネイルシール（着物・リボン・花）', s: 'キャンドゥ / セリア', y: 110 }, petit: { p: 'ジェルネイルシール', s: 'ダイソー', y: 330 } } },
    peel_base:  { name: 'ピールオフベース', cat: 'gel', tiers: { coin: { p: 'ピールオフベースコート', s: 'セリア', y: 110 }, kodawari: { p: 'ピールオフベース', s: '専門店', y: 1650 } } },
    icing_gel:  { name: 'クリアアイシングジェル（ぷっくり用）', cat: 'gel', tiers: { coin: { p: 'クリアアイシングジェル', s: 'セリア', y: 110 }, kodawari: { p: 'ビルダージェル', s: 'プリジェル', y: 2200 } } },
    sponge:     { name: 'メイクスポンジ', cat: 'tool', tiers: { coin: { p: 'メイクスポンジ', s: 'ダイソー', y: 110 } } },
    dotting:    { name: 'ドットペン', cat: 'tool', tiers: { coin: { p: 'ドットペン', s: 'セリア', y: 110 } } },
    tweezers:   { name: 'ピンセット', cat: 'tool', tiers: { coin: { p: 'ネイル用ピンセット', s: 'セリア', y: 110 }, kodawari: { p: 'プロ用ピンセット', s: '専門店', y: 1320 } } },
    polish_color:{ name: 'マニキュア（1色）', cat: 'polish', per: 'color', tiers: { coin: { p: 'GENEネイル / ACネイルエナメル', s: 'ダイソー / セリア', y: 110 }, petit: { p: 'ネイルラッカー', s: 'OPI', y: 1650 }, kodawari: { p: 'インフィニットシャイン', s: 'OPI', y: 2420 }, luxe: { p: 'ル ヴェルニ', s: 'シャネル', y: 5280 } } },
    polish_sheer:{ name: 'シアーマニキュア', cat: 'polish', tiers: { coin: { p: '水性マニキュア ヌーディーピンク', s: 'キャンドゥ', y: 110 }, petit: { p: 'ネイルラッカー（シアー）', s: 'OPI', y: 1650 }, luxe: { p: 'ヴェルニ', s: 'ディオール', y: 4620 } } },
    polish_top: { name: 'トップコート', cat: 'polish', tiers: { coin: { p: 'グロッシートップコート', s: 'セリア', y: 110 }, kodawari: { p: 'トップコート', s: 'OPI', y: 1650 } } },
    polish_base:{ name: 'ベースコート', cat: 'polish', tiers: { coin: { p: 'GENEネイル ベースコート', s: 'ダイソー', y: 110 }, kodawari: { p: 'ベースコート', s: 'OPI', y: 1650 } } },
    polish_magnet:{ name: 'マグネットポリッシュ', cat: 'polish', tiers: { coin: { p: 'マグアートネイル', s: 'キャンドゥ', y: 110 } } },
    polish_glitter:{ name: 'ラメマニキュア', cat: 'polish', tiers: { coin: { p: 'ラメネイル', s: 'ダイソー', y: 110 }, petit: { p: 'ネイルラッカー（グリッター）', s: 'OPI', y: 1650 } } },
    tips:       { name: 'ネイルチップ', cat: 'tool', tiers: { coin: { p: 'ネイルチップ 120枚', s: 'ダイソー', y: 110 }, petit: { p: 'クリアチップ', s: '専門店', y: 550 } } },
    tip_tape:   { name: 'チップ用両面テープ', cat: 'tool', tiers: { coin: { p: 'ネイルチップ用両面粘着テープ', s: 'セリア', y: 110 } } },
    led_lamp:   { name: 'UV/LEDライト', cat: 'tool', once: true, tiers: { coin: { p: 'UV-LEDライト', s: 'ダイソー', y: 330 }, petit: { p: 'ドーム型 UV-LEDネイルライト', s: 'キャンドゥ', y: 1100 }, kodawari: { p: 'LEDライト', s: '専門店', y: 7500 } } },
    file_set:   { name: 'エメリーボード・ファイル', cat: 'tool', once: true, tiers: { coin: { p: 'エメリーボード', s: 'セリア', y: 110 } } },
    pusher:     { name: 'プッシャー・ウッドスティック', cat: 'tool', once: true, tiers: { coin: { p: 'ウッドスティック', s: 'ダイソー', y: 110 } } },
    cleaner:    { name: '消毒用エタノール・ワイプ', cat: 'tool', once: true, tiers: { coin: { p: '消毒用エタノール', s: 'ダイソー', y: 110 } } },
    cuticle_oil:{ name: 'ネイルオイル', cat: 'tool', once: true, tiers: { coin: { p: 'フレグランスネイルオイル', s: 'ダイソー', y: 110 }, luxe: { p: 'ネイルオイル', s: 'uka', y: 3300 } } },
    skin_clip:  { name: 'スキンダウンクリップ', cat: 'tool', once: true, tiers: { coin: { p: 'スキンダウンクリップ 10個', s: 'セリア', y: 110 } } },
    metal_charm:{ name: 'メタルチャーム（亀・貝など）', cat: 'parts', tiers: { coin: { p: 'メタルパーツ（マリン）', s: 'セリア / キャンドゥ', y: 110 }, petit: { p: 'メタルチャーム', s: '専門店', y: 330 }, luxe: { p: 'ゴールドチャーム', s: '専門店', y: 1100 } } },
    summer_parts:{ name: 'ヒトデ・貝のパーツ', cat: 'parts', tiers: { coin: { p: 'ネイルパーツ サマーシー', s: 'キャンドゥ', y: 110 }, petit: { p: 'ヒトデパーツ', s: '専門店', y: 275 } } },
  };

  // 技法。d=難易度1-5, m=1本あたりの分, mats=必要素材, polish: マニキュアで可能か（文字列なら代替技法）, easy=利き手側の簡略版
  const TECHNIQUES = {
    one_color:    { name: 'ワンカラー', d: 1, m: 3, mats: ['color_gel'], polish: true, easy: null, desc: '均一に2度塗り。' },
    sheer:        { name: 'シアーワンカラー', d: 1, m: 3, mats: ['sheer_gel'], polish: true, easy: null, desc: '地爪が透ける薄塗り。' },
    bare_gloss:   { name: '艶トップのみ', d: 1, m: 2, mats: [], polish: true, easy: null, desc: '素爪に艶だけ。' },
    gradient:     { name: 'グラデーション', d: 2, m: 5, mats: ['color_gel', 'sponge'], polish: true, easy: 'sheer', desc: '先端に向けて濃く。スポンジで境目をぼかす。' },
    lame_grad:    { name: 'ラメグラデーション', d: 2, m: 4, mats: ['glitter'], polish: 'lame_grad', easy: null, desc: '先端にラメを密に、根元へ薄く。' },
    french:       { name: 'フレンチ', d: 3, m: 5, mats: ['color_gel', 'art_brush'], polish: true, easy: 'sheer', desc: '先端に色。スマイルラインは筆の側面で。' },
    skinny_french:{ name: 'スキニーフレンチ', d: 4, m: 5, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sheer', desc: '髪一本分の極細ライン。' },
    glass_french: { name: 'ガラスフレンチ', d: 3, m: 5, mats: ['sheer_gel', 'art_brush'], polish: 'sheer', easy: 'sheer', desc: '透ける色硝子のような先端。' },
    magnet:       { name: 'マグネット', d: 2, m: 4, mats: ['magnet_gel', 'magnet_stick'], polish: 'magnet_polish', easy: null, desc: '厚めに塗り、磁石を5秒近づける。' },
    magnet_line:  { name: 'キャッツアイ（マグネットライン）', d: 3, m: 5, mats: ['magnet_gel', 'magnet_stick'], polish: 'magnet_polish', easy: 'magnet', desc: '磁石を斜めに固定し、一本の光の線を作る。' },
    velvet:       { name: 'ベルベット', d: 3, m: 5, mats: ['magnet_gel', 'magnet_stick'], polish: 'magnet_polish', easy: 'magnet', desc: '磁石を動かし、起毛のような多方向の光に。' },
    magnet_polish:{ name: 'マグネット（マニキュア）', d: 2, m: 4, mats: ['polish_magnet', 'magnet_stick'], polish: true, easy: null, desc: 'マグアートネイルを厚めに塗り、すぐ磁石。' },
    mirror:       { name: 'ミラー', d: 2, m: 4, mats: ['mirror_powder', 'top_gel'], polish: 'glitter_polish', easy: null, desc: 'ノンワイプトップを硬化後、パウダーを擦り込む。' },
    mirror_french:{ name: 'ミラーフレンチ', d: 3, m: 6, mats: ['mirror_powder', 'art_brush'], polish: 'glitter_polish', easy: 'mirror', desc: '先端だけ鏡に。' },
    glitter_polish:{ name: 'ラメ（マニキュア）', d: 1, m: 3, mats: ['polish_glitter'], polish: true, easy: null, desc: 'ラメマニキュアを重ねる。' },
    aurora:       { name: 'オーロラ', d: 2, m: 4, mats: ['aurora_powder'], polish: 'sheer', easy: null, desc: '白〜淡色の上に薄く擦り込むと虹の膜に。' },
    flash:        { name: 'フラッシュラメ', d: 1, m: 3, mats: ['flash_gel'], polish: 'glitter_polish', easy: null, desc: 'カメラのフラッシュで爆発的に光る反射ラメ。' },
    holo_scatter: { name: 'ホロ散らし', d: 2, m: 4, mats: ['holo', 'tweezers'], polish: true, easy: null, desc: '大小のホロを不均一に。' },
    tortoise:     { name: 'べっ甲', d: 4, m: 8, mats: ['color_gel', 'sheer_gel', 'art_brush'], polish: false, easy: 'magnet', desc: '飴色の上に焦げ茶をぼかし、シアーで奥へ沈める。' },
    marble:       { name: '大理石', d: 4, m: 8, mats: ['color_gel', 'art_brush'], polish: false, easy: 'one_color', desc: '白地に細い脈。筆を引きずらず、置く。' },
    ink:          { name: '墨流し・インク', d: 4, m: 7, mats: ['art_gel', 'art_brush'], polish: false, easy: 'one_color', desc: '未硬化の上で墨をにじませる。' },
    nuance:       { name: 'ニュアンス', d: 3, m: 6, mats: ['color_gel', 'sheer_gel'], polish: false, easy: 'sheer', desc: '2〜3色を境目なく、雲のように。' },
    stones_accent:{ name: 'ストーン', d: 2, m: 4, mats: ['stone_accent', 'tweezers'], polish: true, easy: null, desc: '1〜3粒。置くだけで表情が決まる。' },
    pixie:        { name: '極小粒敷き', d: 3, m: 6, mats: ['stones_small', 'tweezers'], polish: 'stones_accent', easy: 'stones_accent', desc: '根元や先端に砂糖のように敷き詰める。' },
    pearls_tip:   { name: 'パール', d: 2, m: 3, mats: ['pearls', 'tweezers'], polish: true, easy: null, desc: '小粒パールを3つ、呼吸するように並べる。' },
    brion_line:   { name: 'ブリオンライン', d: 3, m: 5, mats: ['brion', 'tweezers'], polish: true, easy: 'pearls_tip', desc: 'キューティクルラインに沿って金の粒。' },
    studs:        { name: 'スタッズ', d: 2, m: 3, mats: ['studs', 'tweezers'], polish: true, easy: null, desc: 'メタルを1点。' },
    gold_leaf:    { name: '金箔・ホイル', d: 2, m: 4, mats: ['foil_gold', 'tweezers'], polish: true, easy: null, desc: 'ちぎって置く。整えない。' },
    gold_crack:   { name: '金継ぎライン', d: 4, m: 6, mats: ['foil_gold', 'art_brush'], polish: 'gold_leaf', easy: 'gold_leaf', desc: '器の割れ目のような一本の金線。' },
    shell_inlay:  { name: 'シェル埋め込み', d: 3, m: 6, mats: ['shell', 'icing_gel'], polish: 'sticker_art', easy: 'gold_leaf', desc: 'クリアで埋めて平らに。' },
    flower_pressed:{ name: '押し花', d: 3, m: 6, mats: ['dried_flower', 'icing_gel', 'tweezers'], polish: 'sticker_art', easy: 'sticker_art', desc: '花びらを1枚ずつ、重ねすぎない。' },
    flower_paint: { name: '手描きフラワー', d: 5, m: 10, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '花弁は5筆。中心を最後に。' },
    camellia:     { name: '椿', d: 4, m: 8, mats: ['color_gel', 'art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '丸い花弁を重ね、金の芯を点で。' },
    plum:         { name: '小梅', d: 2, m: 4, mats: ['color_gel', 'dotting'], polish: true, easy: null, desc: 'ドットペンで5つの点を円に。' },
    mizuhiki:     { name: '水引', d: 4, m: 7, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '赤と金の線で、あわじ結び。' },
    firework:     { name: '花火', d: 3, m: 6, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'holo_scatter', desc: '一点から放射する細線。先に小さな点。' },
    droplet3d:    { name: 'うるうる雫', d: 3, m: 5, mats: ['icing_gel'], polish: false, easy: 'stones_accent', desc: 'アイシングジェルを盛って硬化。' },
    ice:          { name: '氷ネイル', d: 3, m: 6, mats: ['icing_gel'], polish: false, easy: 'sheer', desc: 'クリアをランダムに盛り、凹凸で光を割る。' },
    cheek:        { name: 'チークネイル', d: 2, m: 4, mats: ['sheer_gel', 'color_gel'], polish: true, easy: null, desc: '中央だけ、頬のようにぽっと赤く。' },
    check:        { name: 'チェック', d: 3, m: 6, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'one_color', desc: '縦横2本ずつ。交点を少し濃く。' },
    tweed:        { name: 'ツイード', d: 4, m: 8, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'one_color', desc: 'かすれた短い線を3色で織る。' },
    quilting:     { name: 'キルティング', d: 4, m: 8, mats: ['icing_gel', 'pearls'], polish: false, easy: 'one_color', desc: '斜め格子を盛り、交点にパール。' },
    dots:         { name: 'ドット', d: 1, m: 3, mats: ['dotting'], polish: true, easy: null, desc: '大きさを揃えない。' },
    heart_flakes: { name: 'ハート・星フレーク', d: 2, m: 3, mats: ['flakes'], polish: true, easy: null, desc: '極小フレークを3〜5枚。' },
    sticker_art:  { name: 'ネイルシール', d: 1, m: 2, mats: ['sticker'], polish: true, easy: null, desc: '貼ってトップで封じる。' },
    moon_gold:    { name: '金の月', d: 3, m: 5, mats: ['foil_gold', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '三日月をホイルで。' },
    star_parts:   { name: '星パーツ', d: 2, m: 3, mats: ['studs', 'tweezers'], polish: true, easy: null, desc: '小さな星を1つ。' },
    ribbon:       { name: 'リボン', d: 3, m: 5, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '細い2本の輪と、垂れる2本。' },
    lace:         { name: 'レース', d: 4, m: 8, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '先端に小さな弧を連ねる。' },
    drip:         { name: 'たらし込み', d: 3, m: 5, mats: ['color_gel'], polish: true, easy: 'one_color', desc: '根元から色を垂らす。' },
    snow_dots:    { name: '雪ドット', d: 2, m: 3, mats: ['dotting'], polish: true, easy: null, desc: '白い点を大小まばらに。' },
    sugar_matte:  { name: 'シュガー質感', d: 2, m: 4, mats: ['top_matte'], polish: 'one_color', easy: null, desc: 'マットトップで砂糖のような肌に。' },
    peel_one:     { name: 'ピールオフワンカラー', d: 1, m: 3, mats: ['peel_base', 'color_gel'], polish: true, easy: null, desc: '剥がせるベースで、週末だけ。' },
    gemstone:     { name: '天然石', d: 4, m: 8, mats: ['color_gel', 'sheer_gel', 'foil_gold', 'art_brush'], polish: false, easy: 'magnet', desc: '色を沈め、金の脈を一本。' },
    aura:         { name: 'オーラ', d: 2, m: 4, mats: ['color_gel', 'sponge'], polish: true, easy: null, desc: '中央から外へ、光がにじむ。' },
    butterfly:    { name: '偏光の蝶', d: 3, m: 5, mats: ['aurora_powder', 'magnet_gel', 'magnet_stick'], polish: false, easy: 'aurora', desc: 'マグネットの上にオーロラ。角度で羽の色。' },
    watercolor_flower: { name: '水彩の白花', d: 4, m: 9, mats: ['art_gel', 'art_brush', 'sheer_gel'], polish: 'sticker_art', easy: 'sticker_art', desc: '白を水で薄め、花弁を一枚ずつ置いてにじませる。中心は濃く。' },
    butterfly_line: { name: '線描きの蝶', d: 4, m: 6, mats: ['art_gel', 'art_brush'], polish: 'sticker_art', easy: 'sticker_art', desc: '白の細筆で羽の輪郭だけ。塗らない。' },
    gold_edge:    { name: '金のふち', d: 2, m: 3, mats: ['foil_gold', 'tweezers'], polish: true, easy: null, desc: '爪の片側に沿ってホイルをちぎって貼る。' },
    turtle_gold:  { name: '金の亀', d: 2, m: 3, mats: ['metal_charm', 'tweezers'], polish: true, easy: null, desc: 'メタルの亀パーツをトップで包む。' },
    starfish:     { name: 'ヒトデ', d: 2, m: 3, mats: ['summer_parts', 'tweezers'], polish: true, easy: null, desc: 'ヒトデのパーツをひとつ。砂のように微細ラメを少し。' },
  };

  const MOODS = [
    { id: 'sheer',   name: '透明感', en: 'Sheer',   desc: '地爪が透ける、硝子のような軽さ。', swatch: { t: 'glass_french', c: { base: '#F6EDE9', tip: '#BFD3DA' } } },
    { id: 'classic', name: '上品',   en: 'Classic', desc: '控えめで、よく見ると美しい。', swatch: { t: 'skinny_french', c: { base: '#EFD9CF', tip: '#C8A96A' } } },
    { id: 'glam',    name: '華やか', en: 'Glam',    desc: '光を集める。写真に強い。', swatch: { t: 'lame_grad', c: { base: '#F3E3DD', accent: '#D9B77A' } } },
    { id: 'mode',    name: 'モード', en: 'Mode',    desc: '辛口。黒と金属と余白。', swatch: { t: 'mirror_french', c: { base: '#2A2326', tip: '#C9C9CF' } } },
    { id: 'sweet',   name: '甘め',   en: 'Sweet',   desc: 'ミルクと苺とリボン。', swatch: { t: 'cheek', c: { base: '#F7E6E4', accent: '#E58A98' } } },
    { id: 'natural', name: 'ナチュラル', en: 'Natural', desc: '素肌の延長。手がきれいに見える。', swatch: { t: 'sheer', c: { base: '#F1D8CC' } } },
    { id: 'art',     name: 'アート', en: 'Art',     desc: '誰とも被らない。小さな作品。', swatch: { t: 'ink', c: { base: '#F7F3EE', accent: '#2B2226', metal: '#C8A96A' } } },
    { id: 'wa',      name: '和モダン', en: 'Wa',    desc: '金と朱と白。古典を今の手に。', swatch: { t: 'camellia', c: { base: '#F4EFE8', accent: '#B5262E', metal: '#C8A96A' } } },
    { id: 'mens',    name: 'メンズ', en: 'Men',     desc: '短い爪に映える、辛口のワンポイント。', swatch: { t: 'gemstone', p: { kind: 'ocean' }, layers: [{ t: 'turtle_gold' }], c: { base: '#2E6B8A', metal: '#C8A96A', light: '#CFE6EE' } } },
  ];

  const SHAPES = [
    { id: 'round',     name: 'ラウンド',  desc: 'どんな指にも。小さい爪が上品に。' },
    { id: 'oval',      name: 'オーバル',  desc: '指が長く見える。いちばん人気。' },
    { id: 'square',    name: 'スクエア',  desc: '今の気分。強さと潔さ。' },
    { id: 'almond',    name: 'アーモンド', desc: '節が目立つ指をなめらかに。' },
    { id: 'ballerina', name: 'バレリーナ', desc: '細く、長く、モードに。' },
  ];
  const LENGTHS = [
    { id: 'short',  name: 'ショート',  desc: '日常に。' },
    { id: 'medium', name: 'ミディアム', desc: 'いちばん描きやすい。' },
    { id: 'long',   name: 'ロング',    desc: 'アートが映える。' },
  ];
  const SCOPES = [
    { id: 'full',   name: '両手10本', desc: '全部の指に。' },
    { id: 'accent', name: 'ワンポイント', desc: '薬指だけ。他は素肌色。' },
    { id: 'asym',   name: 'アシンメトリー', desc: '左右で違う。' },
    { id: 'foot',   name: 'フット', desc: '足の爪に。' },
  ];
  const METHODS = [
    { id: 'gel',    name: 'ジェル', desc: 'ライトで固める。3週間もつ。' },
    { id: 'polish', name: 'マニキュア', desc: 'ライト不要。除光液で落とせる。' },
    { id: 'tip',    name: 'ネイルチップ', desc: '外して作る。利き手の心配なし。' },
  ];
  const TIMES = [
    { id: 't30',  name: '30分',   min: 30 },
    { id: 't60',  name: '1時間',  min: 60 },
    { id: 't120', name: '2時間〜', min: 150 },
  ];
  const LEVELS = [
    { id: 'first',  name: 'はじめて',   max: 2 },
    { id: 'some',   name: '慣れてきた', max: 4 },
    { id: 'expert', name: '得意',       max: 5 },
  ];
  const HANDS = [
    { id: 'right', name: '右利き' },
    { id: 'left',  name: '左利き' },
  ];

  // シーン。formality 1-5。tips=マナーメモ。light=光の環境。favor/avoid=技法。hues=似合う色の言葉。accentHand=写真に映る手。
  const SCENES = [
    { id: 'office', group: 'daily', name: 'オフィス', short: '仕事の日', formality: 3, light: 'indoor',
      tips: ['ベージュ・ピンク・グレージュのシアーが知的に見える', 'ラメは微細なものを1本まで', 'ショート〜ミディアムが書類に強い'],
      favor: ['sheer', 'skinny_french', 'magnet', 'one_color', 'pearls_tip'], avoid: ['firework', 'holo_scatter', 'flash', 'camellia', 'mirror'], hues: ['ベージュ', 'ピンクベージュ', 'グレージュ'], moods: ['classic', 'natural', 'sheer'] },
    { id: 'campus', group: 'daily', name: '学校・キャンパス', short: '学校の日', formality: 2, light: 'daylight',
      tips: ['規則があるなら、ピールオフベースで週末だけ', '昼の光にはくすみ色とニュアンスが映える'],
      favor: ['peel_one', 'nuance', 'cheek', 'dots', 'sticker_art'], avoid: ['pixie', 'quilting'], hues: ['ミルクティー', 'くすみピンク', 'ラベンダー'], moods: ['sweet', 'natural', 'sheer'] },
    { id: 'mama', group: 'daily', name: 'ママの日常', short: '子どもと過ごす日', formality: 2, light: 'daylight',
      tips: ['引っかからないパーツ無し、またはフラットな埋め込み', 'ショートで、剥がれても目立たないシアー'],
      favor: ['sheer', 'magnet', 'gradient', 'shell_inlay', 'one_color'], avoid: ['stones_accent', 'droplet3d', 'studs', 'pixie', 'star_parts'], hues: ['ピンクベージュ', 'ミルク', 'テラコッタ'], moods: ['natural', 'classic'] },
    { id: 'home', group: 'daily', name: 'おうち・在宅', short: '家にいる日', formality: 1, light: 'indoor',
      tips: ['誰にも見せない日こそ、自分の好きな色を', '手を洗う回数が多いなら、トップを厚めに'],
      favor: ['one_color', 'magnet', 'aura', 'nuance', 'cheek'], avoid: [], hues: ['好きな色'], moods: ['sweet', 'art', 'natural', 'mode'] },
    { id: 'outing', group: 'daily', name: 'おでかけ・カフェ', short: '街に出る日', formality: 2, light: 'daylight',
      tips: ['カップを持つ手が写る。親指と人差し指に小さな見どころを', '服の色とひとつだけ揃える'],
      favor: ['nuance', 'magnet', 'gold_leaf', 'marble', 'check'], avoid: [], hues: ['テラコッタ', 'くすみブルー', 'キャメル'], moods: ['art', 'classic', 'sweet', 'mode'] },

    { id: 'wedding_guest', group: 'special', name: '結婚式お呼ばれ', short: 'ゲストとして', formality: 5, light: 'indoor',
      tips: ['花嫁より控えめに。白一色・大ぶりストーン・黒・ロングは避ける', 'ベージュ、ピンク、シアーに、細いゴールドか小粒パール', '親族ならさらに静かに。ワンカラーかスキニーフレンチ'],
      favor: ['glass_french', 'skinny_french', 'pearls_tip', 'sheer', 'gradient', 'brion_line'], avoid: ['one_color_white', 'stones_accent', 'mirror', 'firework', 'holo_scatter', 'flash', 'camellia'], hues: ['ピンクベージュ', 'シャンパン', 'シアーピンク'], moods: ['classic', 'sheer'] },
    { id: 'bridal', group: 'special', name: '自分の結婚式', short: '花嫁として', formality: 5, light: 'photo',
      tips: ['指輪交換で左手薬指がアップになる。そこに主役を', 'ドレスの刺繍やレースの要素をひとつ拾う', 'サムシングブルーは、見えない場所に小さく'],
      favor: ['lace', 'pearls_tip', 'glass_french', 'flower_pressed', 'gradient', 'pixie', 'skinny_french'], avoid: ['mirror', 'firework', 'camellia', 'tortoise'], hues: ['ホワイト', 'アイボリー', 'シャンパン', 'ペールブルー'], moods: ['classic', 'sheer', 'glam'], accentHand: 'left' },
    { id: 'seijin', group: 'special', name: '成人式', short: '振袖の日', formality: 5, light: 'photo',
      tips: ['振袖の柄から2色拾う。帯の色を金か銀で受ける', '2026年はくすみ古典・白地・黒地ワンポイントが人気。派手すぎず、写真に映える', '椿・梅・水引・金箔。和の要素はひとつに絞ると大人っぽい'],
      favor: ['camellia', 'plum', 'mizuhiki', 'gold_leaf', 'gold_crack', 'magnet', 'skinny_french'], avoid: ['peel_one', 'tweed', 'check'], hues: ['朱', '白', '金', '藍', 'くすみ緑'], moods: ['wa', 'glam', 'classic'] },
    { id: 'graduation', group: 'special', name: '卒業式・袴', short: '袴の日', formality: 4, light: 'photo',
      tips: ['袴の色（紺・緑・紫・赤）を主役に、金の一筋で締める', '証書を受け取る右手が写真に残る'],
      favor: ['gradient', 'skinny_french', 'gold_crack', 'plum', 'magnet', 'check'], avoid: ['holo_scatter', 'firework'], hues: ['紺', '深緑', '紫', 'えんじ'], moods: ['wa', 'classic', 'mode'], accentHand: 'right' },
    { id: 'nyugaku', group: 'special', name: '入学式・式典', short: '式に出る日', formality: 4, light: 'daylight',
      tips: ['主役は子ども。ベージュかピンクのワンカラーにパール1粒', '写真では淡い色ほど手が白く見える'],
      favor: ['sheer', 'one_color', 'pearls_tip', 'skinny_french', 'gradient'], avoid: ['mirror', 'flash', 'holo_scatter', 'stones_accent'], hues: ['ピンクベージュ', 'オフホワイト', 'ラベンダー'], moods: ['classic', 'natural'] },
    { id: 'yukata', group: 'special', name: '浴衣・夏祭り', short: '浴衣の日', formality: 2, light: 'night',
      tips: ['浴衣と反対色をアクセントに。紺の浴衣なら朱や金', '夜の光には、花火の細線とホロが映える', 'フットネイルも揃えると帯まわりがまとまる'],
      favor: ['firework', 'ink', 'plum', 'holo_scatter', 'gradient', 'glass_french'], avoid: ['tweed', 'quilting', 'check'], hues: ['藍', 'ペールブルー', '朱', '金魚の赤'], moods: ['wa', 'sheer', 'art', 'glam'] },
    { id: 'date', group: 'special', name: 'デート・記念日', short: 'ふたりの日', formality: 3, light: 'indoor',
      tips: ['手を取られたときの、近距離で美しいもの。繊細な透け感と小さな一粒', '血色のピンクは手を若く見せる'],
      favor: ['cheek', 'glass_french', 'droplet3d', 'pearls_tip', 'heart_flakes', 'sheer', 'ribbon'], avoid: ['mirror', 'tweed', 'firework'], hues: ['ピンク', 'ミルクティー', 'ローズ'], moods: ['sweet', 'sheer', 'classic'] },
    { id: 'oshi', group: 'special', name: '推し活・ライブ', short: '推しに会う日', formality: 1, light: 'night',
      tips: ['メンバーカラーを主役に。残りの指は白かクリアで色を立てる', 'うちわやペンライトを持つ手が写真に残る', 'フラッシュラメは、カメラのフラッシュで爆発的に光る'],
      favor: ['flash', 'holo_scatter', 'heart_flakes', 'star_parts', 'lame_grad', 'one_color', 'aura'], avoid: ['tortoise', 'tweed'], hues: ['メンバーカラー'], moods: ['glam', 'sweet', 'art'], accentHand: 'left' },
    { id: 'travel', group: 'special', name: '旅行・リゾート', short: '旅に出る日', formality: 1, light: 'daylight',
      tips: ['海ならターコイズとシェル、街なら地図の色。行き先の色を一色', 'サンダルならフットを先に決める'],
      favor: ['shell_inlay', 'aurora', 'gemstone', 'sugar_matte', 'gradient', 'magnet'], avoid: ['quilting', 'tweed'], hues: ['ターコイズ', '白砂', 'テラコッタ', 'セピア'], moods: ['natural', 'art', 'sheer', 'glam'] },
    { id: 'party', group: 'special', name: 'パーティー・年末', short: '夜の集まり', formality: 4, light: 'night',
      tips: ['シャンデリアの光にはミラーとビジューが映える', 'ボルドーかブラックに、金属をひとつ'],
      favor: ['mirror', 'mirror_french', 'magnet_line', 'holo_scatter', 'stones_accent', 'velvet', 'pixie'], avoid: ['peel_one', 'sticker_art'], hues: ['ボルドー', 'ブラック', 'シャンパンゴールド'], moods: ['glam', 'mode', 'classic'] },
    { id: 'interview', group: 'special', name: '就活・面接', short: '面接の日', formality: 5, light: 'indoor',
      tips: ['地爪の色に近いシアーピンクか、クリアの艶だけ', 'ショートで、形はラウンドかオーバル', '何もしていないように見えて、手がきれい。それが正解'],
      favor: ['bare_gloss', 'sheer'], avoid: ['french', 'glitter_polish', 'magnet', 'stones_accent', 'mirror', 'lame_grad', 'one_color'], hues: ['地爪色', 'シアーピンク'], moods: ['natural'] },
    { id: 'valentine', group: 'special', name: 'バレンタイン', short: 'チョコレートの日', formality: 2, light: 'indoor',
      tips: ['チョコブラウンとミルクのたらし込み', 'ハートは極小フレークを一枚だけ'],
      favor: ['drip', 'heart_flakes', 'cheek', 'one_color', 'magnet'], avoid: ['firework'], hues: ['チョコブラウン', 'ミルク', '苺'], moods: ['sweet', 'classic'] },
    { id: 'xmas', group: 'special', name: 'クリスマス', short: '聖夜', formality: 3, light: 'night',
      tips: ['深緑・ボルドー・ゴールドの三色から二色', '雪はドットで。大小まばらに'],
      favor: ['snow_dots', 'magnet', 'gold_leaf', 'velvet', 'stones_accent', 'star_parts'], avoid: ['peel_one'], hues: ['深緑', 'ボルドー', 'ゴールド', '雪白'], moods: ['glam', 'classic', 'sweet'] },
    { id: 'newyear', group: 'special', name: 'お正月・初詣', short: '新年', formality: 3, light: 'daylight',
      tips: ['白地に金と朱。水引か小梅をひとつ', '初詣の手袋を外した瞬間に、きれいな指先'],
      favor: ['mizuhiki', 'plum', 'gold_leaf', 'gold_crack', 'one_color'], avoid: ['tweed'], hues: ['白', '金', '朱'], moods: ['wa', 'classic'] },
  ];

  const LIGHTS = {
    indoor:   { name: '室内の照明', note: 'マット・シアー・パールが上品に見える光。' },
    daylight: { name: '屋外の昼光', note: 'くすみ色とニュアンスがいちばん美しく出る光。' },
    night:    { name: '夜のライト', note: 'ミラー・フラッシュ・ホロが生きる光。' },
    photo:    { name: '写真とフラッシュ', note: '淡い色は白く飛ぶ。中間色と金属で輪郭を。' },
  };

  const SEASONS = {
    spring: { name: '春', months: [3, 4, 5], words: ['桜', '若葉', 'ラベンダー'], colors: [['桜', '#F2C8D0'], ['ラベンダー', '#E7D7F0'], ['若葉', '#D8E7D0'], ['クリーム', '#FFF3DC'], ['アプリコット', '#F6D7B9'], ['空', '#C6DDF2']], favor: ['flower_pressed', 'cheek', 'aurora', 'nuance', 'sheer'] },
    summer: { name: '夏', months: [6, 7, 8], words: ['硝子', '氷', '海'], colors: [['ターコイズ', '#9ED3D3'], ['白砂', '#F5F0E6'], ['コーラル', '#F7A1A1'], ['藍', '#2B4C7E'], ['レモン', '#FFE27A'], ['氷', '#E8F6F8']], favor: ['glass_french', 'ice', 'shell_inlay', 'droplet3d', 'firework'] },
    autumn: { name: '秋', months: [9, 10, 11], words: ['べっ甲', 'ボルドー', 'マスタード'], colors: [['ボルドー', '#7A2E3B'], ['テラコッタ', '#B5654A'], ['マスタード', '#C9A24B'], ['カーキ', '#6E7350'], ['くすみブルー', '#7D93A6'], ['深みパープル', '#5B3F6E']], favor: ['magnet', 'tortoise', 'check', 'velvet', 'sugar_matte', 'nuance'] },
    winter: { name: '冬', months: [12, 1, 2], words: ['雪', 'ベルベット', 'ツイード'], colors: [['雪白', '#F4F1EC'], ['深緑', '#2E4A3F'], ['深紅', '#8C1F2F'], ['アイスブルー', '#B9C7D6'], ['ゴールド', '#C8A96A'], ['プラム', '#3B2F3A']], favor: ['velvet', 'quilting', 'tweed', 'snow_dots', 'mirror', 'ice'] },
  };

  // 色から探す
  const COLORS = [
    ['ヌード', '#EFD3C8'], ['ミルク', '#F4EBE2'], ['ピンクベージュ', '#E8C6C4'], ['ピンク', '#F2B8C6'], ['ローズ', '#C9808A'], ['赤', '#C9382E'], ['ボルドー', '#7A2E3B'],
    ['オレンジ', '#F28C28'], ['テラコッタ', '#B5654A'], ['マスタード', '#E2A83A'], ['カーキ', '#6E7350'], ['ミント', '#C6E2D8'], ['グリーン', '#3CA55C'], ['ターコイズ', '#5FB3B3'],
    ['海の碧', '#2E6B8A'], ['くすみブルー', '#7D93A6'], ['ネイビー', '#1F2A48'], ['ラベンダー', '#CDBEE3'], ['パープル', '#5B3F6E'], ['グレージュ', '#B8AEAE'], ['ブラック', '#2B2226'], ['ホワイト', '#F6F2EE'], ['ゴールド', '#C8A96A'], ['シルバー', '#C9C9CF'],
  ].map(([name, hex]) => ({ name, hex }));

  // サロン相場（2026-10 調査目安）
  const SALON = { one_color: [4500, 6380], magnet: [5000, 7500], art: [6000, 7000] };

  global.TSUME = Object.assign(global.TSUME || {}, {
    TIERS, TIER_INFO, MATERIALS, TECHNIQUES, MOODS, SHAPES, LENGTHS, SCOPES, METHODS, TIMES, LEVELS, HANDS, SCENES, LIGHTS, SEASONS, SALON, COLORS,
  });
})(typeof window !== 'undefined' ? window : globalThis);
