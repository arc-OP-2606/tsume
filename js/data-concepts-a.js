/* tsumé — signature concepts (1/2)
   fingers: 親指→小指の5本。t=技法, over=下地技法, c=色役割の差し替え, p=描画パラメータ。
   palettes: base/tip/accent/deep/light/metal の6役割。fit: シーン適合 0-3。originality 1-5。formality 1-5。 */
(function (global) {
  'use strict';
  const C = [];
  const P = (name, base, tip, accent, deep, light, metal) => ({ name, base, tip, accent, deep, light, metal });

  C.push({
    id: 'glass_drop', name: '硝子の雫', en: 'Glass Drop',
    story: 'クリアの上に、先端だけ色硝子。薬指にひと粒、固めた雫。光が入るたびに、爪の奥で水が動く。',
    moods: ['sheer', 'classic'], fit: { wedding_guest: 3, date: 3, bridal: 2, office: 2, nyugaku: 2, outing: 1, party: 1 },
    seasons: ['all'], originality: 3, formality: 4, minTier: 'coin', shapes: ['oval', 'almond', 'round'],
    palettes: [
      P('月白', '#F5EEE9', '#BDD3DA', '#D9B98A', '#8FAAB4', '#FFFFFF', '#D9B98A'),
      P('薄紅', '#F7E9E6', '#E8B9C0', '#D9B98A', '#C98F99', '#FFFFFF', '#D9B98A'),
      P('藤',   '#F4EFF2', '#CFC3E0', '#C9C9CF', '#9D8EB8', '#FFFFFF', '#C9C9CF'),
      P('若草', '#F4F1EA', '#C9D8B8', '#D9B98A', '#8FA882', '#FFFFFF', '#D9B98A'),
    ],
    fingers: [{ t: 'glass_french' }, { t: 'glass_french' }, { t: 'sheer' }, { t: 'droplet3d', over: 'sheer' }, { t: 'glass_french' }], accent: 3,
  });

  C.push({
    id: 'morning_aurora', name: '朝靄のオーロラ', en: 'Morning Haze',
    story: '乳白のシアーに、オーロラの膜をひと刷毛。角度で桃にも青にも揺れる。薬指に真珠がひと粒、朝の露のように。',
    moods: ['sheer', 'sweet', 'natural'], fit: { date: 3, campus: 3, outing: 2, travel: 2, bridal: 2, office: 1, nyugaku: 2, home: 2 },
    seasons: ['spring', 'summer', 'all'], originality: 2, formality: 3, minTier: 'coin',
    palettes: [
      P('乳白', '#F6F0EC', '#F6F0EC', '#E9C7CF', '#CDBBD6', '#FFFFFF', '#E6DDD2'),
      P('桃',   '#F8E6E6', '#F8E6E6', '#F0B9C4', '#D49AA8', '#FFFFFF', '#E6DDD2'),
      P('水',   '#E9F2F4', '#E9F2F4', '#BCD9E2', '#9DBECB', '#FFFFFF', '#DDE3EA'),
    ],
    fingers: [{ t: 'aurora', over: 'sheer' }, { t: 'aurora', over: 'sheer' }, { t: 'sheer' }, { t: 'pearls_tip', over: 'aurora' }, { t: 'aurora', over: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'thin_ice', name: '薄氷', en: 'Thin Ice',
    story: 'クリアを不揃いに盛って、光を割る。凹凸が影を落とし、冬の朝の水たまりになる。薬指には極小のホロを、気泡のように。',
    moods: ['sheer', 'art', 'mode'], fit: { travel: 3, outing: 2, xmas: 2, party: 2, date: 2, home: 2, oshi: 1 },
    seasons: ['winter', 'summer'], originality: 4, formality: 2, minTier: 'coin', shapes: ['square', 'ballerina', 'oval'],
    palettes: [
      P('氷',   '#E9F2F5', '#E9F2F5', '#BFD6DE', '#A9C4CE', '#FFFFFF', '#C9C9CF'),
      P('雪',   '#F4F1EC', '#F4F1EC', '#DDD7CE', '#C2BAB0', '#FFFFFF', '#C9C9CF'),
      P('薄紫氷', '#EEEAF3', '#EEEAF3', '#CFC3E0', '#AFA0C8', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'ice', over: 'sheer' }, { t: 'sheer' }, { t: 'ice', over: 'sheer' }, { t: 'holo_scatter', over: 'sheer', p: { micro: true } }, { t: 'ice', over: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'minamo', name: '水面', en: 'Minamo',
    story: '水色のシアーに、藍の線をゆらりと流す。中指だけ、金箔を一片。池の底に沈んだ小判のように。',
    moods: ['sheer', 'wa', 'art'], fit: { yukata: 3, travel: 3, date: 2, outing: 2, home: 2, campus: 1 },
    seasons: ['summer'], originality: 4, formality: 2, minTier: 'coin',
    palettes: [
      P('水色', '#E6F1F2', '#E6F1F2', '#8FB7C5', '#3C6E8F', '#FFFFFF', '#C8A96A'),
      P('青磁', '#DFE9E3', '#DFE9E3', '#9BBFAE', '#3E6E5E', '#FFFFFF', '#C8A96A'),
      P('夕映え', '#F4E8E2', '#F4E8E2', '#E0A98E', '#A0523B', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'ink', over: 'sheer', p: { kind: 'wave' } }, { t: 'sheer' }, { t: 'gold_leaf', over: 'sheer' }, { t: 'ink', over: 'sheer', p: { kind: 'wave' } }, { t: 'sheer' }], accent: 2,
  });

  C.push({
    id: 'kintsugi', name: '白磁と金継ぎ', en: 'Kintsugi',
    story: '生成りのワンカラーに、器の割れ目のような金の線を一本。欠けを隠さず、金で継ぐ。静かで、誰とも違う。',
    moods: ['classic', 'wa', 'art'], fit: { office: 3, outing: 3, nyugaku: 3, newyear: 3, wedding_guest: 2, seijin: 2, graduation: 2, date: 2, home: 2, party: 1 },
    seasons: ['all'], originality: 5, formality: 4, minTier: 'coin', shapes: ['square', 'oval', 'round'],
    palettes: [
      P('生成り', '#F3ECE2', '#F3ECE2', '#D9CFC2', '#D9CFC2', '#FFFFFF', '#C8A96A'),
      P('青磁',   '#D8E3DC', '#D8E3DC', '#B9CCC1', '#8FA89B', '#FFFFFF', '#C8A96A'),
      P('墨',     '#2B2226', '#2B2226', '#4A3E43', '#1A1416', '#FFFFFF', '#C8A96A'),
      P('薄紅磁', '#F2E1DC', '#F2E1DC', '#E1C8C1', '#D9CFC2', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'gold_leaf', over: 'one_color', p: { tiny: true } }, { t: 'one_color' }, { t: 'one_color' }, { t: 'gold_crack', over: 'one_color' }, { t: 'one_color' }], accent: 3,
  });

  C.push({
    id: 'silk_beige', name: '絹のベージュ', en: 'Silk Beige',
    story: '超微粒子のマグネットを、肌の延長の色で。光が動くたび、絹の生地が揺れる。会議室でも、よく見ると美しい。',
    moods: ['classic', 'natural'], fit: { office: 3, mama: 3, nyugaku: 2, date: 2, outing: 2, wedding_guest: 2, home: 2, graduation: 1 },
    seasons: ['all', 'autumn'], originality: 2, formality: 3, minTier: 'coin',
    palettes: [
      P('絹',   '#C9AE9A', '#C9AE9A', '#C9AE9A', '#9A7F6C', '#FFF5EA', '#D9B98A'),
      P('真珠灰', '#B8AEAE', '#B8AEAE', '#B8AEAE', '#8A8080', '#FFFFFF', '#C9C9CF'),
      P('桜鼠', '#C9A9AC', '#C9A9AC', '#C9A9AC', '#9A7A7E', '#FFF2F0', '#D9B98A'),
      P('焙じ茶', '#A5806A', '#A5806A', '#A5806A', '#6E5243', '#F5E3CF', '#D9B98A'),
    ],
    fingers: [{ t: 'magnet' }, { t: 'magnet' }, { t: 'magnet' }, { t: 'magnet' }, { t: 'magnet' }], accent: 3,
  });

  C.push({
    id: 'pearl_morning', name: '真珠の朝', en: 'Pearl Morning',
    story: 'ピンクベージュのワンカラー。薬指の根元に、小粒のパールを3つ。式の朝、鏡の前で、ちゃんと整った手。',
    moods: ['classic'], fit: { nyugaku: 3, wedding_guest: 3, office: 2, date: 2, bridal: 2, newyear: 1, graduation: 2 },
    seasons: ['all'], originality: 2, formality: 4, minTier: 'coin',
    palettes: [
      P('桜貝', '#F2D9D3', '#F2D9D3', '#F2D9D3', '#C9A7A0', '#FFFDF8', '#E6DDD2'),
      P('象牙', '#F3E9DF', '#F3E9DF', '#F3E9DF', '#C9BDB0', '#FFFDF8', '#E6DDD2'),
      P('藤鼠', '#D9CFDC', '#D9CFDC', '#D9CFDC', '#A89BB0', '#FFFDF8', '#E6DDD2'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'one_color' }, { t: 'one_color' }, { t: 'pearls_tip', over: 'one_color', p: { at: 'cuticle' } }, { t: 'one_color' }], accent: 3,
  });

  C.push({
    id: 'skinny_gold', name: 'スキニーゴールド', en: 'Skinny Gold',
    story: 'ヌードの上に、髪一本分の金のライン。それだけ。近づいた人だけが気づく、いちばん贅沢な控えめ。',
    moods: ['classic', 'mode'], fit: { office: 3, wedding_guest: 3, graduation: 2, party: 2, nyugaku: 2, date: 2, outing: 2, newyear: 2 },
    seasons: ['all'], originality: 2, formality: 4, minTier: 'coin', shapes: ['square', 'oval', 'almond'],
    palettes: [
      P('砂',   '#EAD5C8', '#C8A96A', '#C8A96A', '#B09485', '#FFFFFF', '#C8A96A'),
      P('白磁', '#F4EFE8', '#C9C9CF', '#C9C9CF', '#C9BDB0', '#FFFFFF', '#C9C9CF'),
      P('墨',   '#2B2226', '#C8A96A', '#C8A96A', '#1A1416', '#FFFFFF', '#C8A96A'),
      P('薔薇', '#E8C6C4', '#D8A08A', '#D8A08A', '#B08A88', '#FFFFFF', '#D8A08A'),
    ],
    fingers: [{ t: 'skinny_french' }, { t: 'skinny_french' }, { t: 'sheer' }, { t: 'skinny_french' }, { t: 'skinny_french' }], accent: 3,
  });

  C.push({
    id: 'moon_tortoise', name: '月光のべっ甲', en: 'Moonlit Tortoise',
    story: '飴色の中に焦げ茶を沈めたべっ甲。薬指は素肌色の夜空に、金箔の三日月。秋の夜、手元だけが琥珀に灯る。',
    moods: ['glam', 'wa', 'classic'], fit: { party: 3, outing: 3, date: 2, home: 2, xmas: 2, graduation: 2, office: 1, newyear: 2 },
    seasons: ['autumn', 'winter'], originality: 4, formality: 3, minTier: 'coin',
    palettes: [
      P('琥珀', '#B8773A', '#B8773A', '#E9B96E', '#4A2A14', '#F3E3D3', '#C8A96A'),
      P('飴',   '#D39A5A', '#D39A5A', '#F0CB8C', '#6E4423', '#F6EADC', '#C8A96A'),
      P('鼈甲黒', '#5A3A22', '#5A3A22', '#A86B3A', '#1E120A', '#F3E3D3', '#C8A96A'),
    ],
    fingers: [{ t: 'tortoise' }, { t: 'sheer', c: { base: 'light' } }, { t: 'tortoise' }, { t: 'moon_gold', over: 'sheer', c: { base: 'light' } }, { t: 'lame_grad', over: 'sheer', c: { base: 'light' } }], accent: 3,
  });

  C.push({
    id: 'stardust', name: '星屑のラメグラ', en: 'Stardust',
    story: '先端から根元へ薄れていくラメ。薬指には小さな星をひとつ。ライトを浴びると、指先から星がこぼれる。',
    moods: ['glam', 'sweet'], fit: { oshi: 3, party: 3, xmas: 3, date: 2, campus: 2, yukata: 2, home: 1 },
    seasons: ['all', 'winter'], originality: 2, formality: 2, minTier: 'coin',
    palettes: [
      P('銀河', '#F3E8E4', '#F3E8E4', '#E58AA8', '#C9BDB0', '#FFFFFF', '#C9C9CF'),
      P('金砂', '#F3E8E4', '#F3E8E4', '#D9B77A', '#C9BDB0', '#FFFFFF', '#D9B77A'),
      P('夜空', '#1F2A48', '#1F2A48', '#BFD4F0', '#101626', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'lame_grad', over: 'sheer' }, { t: 'sheer' }, { t: 'lame_grad', over: 'sheer' }, { t: 'star_parts', over: 'lame_grad' }, { t: 'lame_grad', over: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'champagne', name: 'シャンパンの泡', en: 'Champagne',
    story: '淡いゴールドのシアーに、大小のホロをまばらに。グラスの縁で弾ける泡。乾杯のたび、手元が光る。',
    moods: ['glam', 'classic'], fit: { party: 3, xmas: 3, wedding_guest: 2, date: 2, newyear: 2, bridal: 1 },
    seasons: ['all', 'winter'], originality: 3, formality: 4, minTier: 'coin',
    palettes: [
      P('泡',   '#F2E6D2', '#F2E6D2', '#E6CFA0', '#C9B080', '#FFFFFF', '#D9B77A'),
      P('薄紅泡', '#F6E3E0', '#F6E3E0', '#E9BDC0', '#C99A9E', '#FFFFFF', '#E6DDD2'),
      P('白泡', '#F6F1EC', '#F6F1EC', '#DDE3EA', '#B9C7D6', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'holo_scatter', over: 'sheer', p: { bubbles: true } }, { t: 'sheer' }, { t: 'holo_scatter', over: 'sheer', p: { bubbles: true } }, { t: 'sheer' }, { t: 'holo_scatter', over: 'sheer', p: { bubbles: true } }], accent: 0,
  });

  C.push({
    id: 'rock_sugar', name: '氷砂糖', en: 'Rock Sugar',
    story: '透明の上に、極小の粒を砂糖のように敷く。100均ならガラスブリオン、ご褒美ならクリスタルピクシー。同じ設計で、輝きの階調だけが変わる。',
    moods: ['glam', 'sheer'], fit: { party: 3, bridal: 3, wedding_guest: 2, date: 2, xmas: 2, oshi: 1 },
    seasons: ['all'], originality: 4, formality: 4, minTier: 'coin', shapes: ['oval', 'almond'],
    palettes: [
      P('透',   '#F6F0EC', '#F6F0EC', '#DDE3EA', '#C9BDB0', '#FFFFFF', '#DDE3EA'),
      P('淡桃', '#F7E6E6', '#F7E6E6', '#F0C9D0', '#C9A7A0', '#FFFFFF', '#F0C9D0'),
      P('淡金', '#F4ECDF', '#F4ECDF', '#E6CFA0', '#C9B080', '#FFFFFF', '#E6CFA0'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'pixie', over: 'sheer', p: { at: 'cuticle' } }, { t: 'sheer' }, { t: 'pixie', over: 'sheer', p: { at: 'tip' } }, { t: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'suminagashi', name: '墨流し', en: 'Suminagashi',
    story: '白の上で、墨をにじませる。同じ模様は二度とできない。中指に金箔を一片。書と、金屏風。',
    moods: ['art', 'mode', 'wa'], fit: { outing: 3, home: 3, graduation: 2, party: 2, yukata: 2, oshi: 1, seijin: 1, office: 1 },
    seasons: ['all'], originality: 5, formality: 3, minTier: 'coin', shapes: ['square', 'ballerina', 'oval'],
    palettes: [
      P('墨',   '#F7F3EE', '#F7F3EE', '#8A8083', '#2B2226', '#FFFFFF', '#C8A96A'),
      P('藍墨', '#F5F5F2', '#F5F5F2', '#7D93A6', '#2B4C7E', '#FFFFFF', '#C8A96A'),
      P('朱墨', '#F7F1EC', '#F7F1EC', '#D98B7E', '#B5262E', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'ink', over: 'one_color' }, { t: 'one_color' }, { t: 'gold_leaf', over: 'one_color' }, { t: 'ink', over: 'one_color' }, { t: 'one_color' }], accent: 3,
  });

  C.push({
    id: 'night_mirror', name: '夜の鏡', en: 'Night Mirror',
    story: 'マットな黒の中に、薬指だけ鏡。人差し指は先端だけ銀。光を吸う面と、返す面。',
    moods: ['mode'], fit: { party: 3, oshi: 2, outing: 2, home: 2, xmas: 2, graduation: 1 },
    seasons: ['all', 'winter'], originality: 3, formality: 3, minTier: 'coin', shapes: ['square', 'ballerina', 'almond'],
    palettes: [
      P('黒銀', '#1E1A1D', '#C9C9CF', '#C9C9CF', '#0E0B0D', '#FFFFFF', '#C9C9CF'),
      P('黒金', '#1E1A1D', '#C8A96A', '#C8A96A', '#0E0B0D', '#FFFFFF', '#C8A96A'),
      P('葡萄銀', '#3B2430', '#C9C9CF', '#C9C9CF', '#1E1018', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'sugar_matte' }, { t: 'mirror_french', over: 'sugar_matte' }, { t: 'sugar_matte' }, { t: 'mirror' }, { t: 'sugar_matte' }], accent: 3,
  });

  C.push({
    id: 'bordeaux_soiree', name: 'ボルドーの夜会', en: 'Bordeaux Soirée',
    story: '葡萄色のマグネットに、薬指だけ金のミラー。シャンデリアの下で、ワイングラスの縁が光る。',
    moods: ['glam', 'mode', 'classic'], fit: { party: 3, xmas: 3, date: 2, outing: 2, graduation: 2, newyear: 1 },
    seasons: ['autumn', 'winter'], originality: 2, formality: 4, minTier: 'coin',
    palettes: [
      P('葡萄', '#5E1F2E', '#5E1F2E', '#C98A9A', '#2E0F17', '#D9A0AE', '#C8A96A'),
      P('黒葡萄', '#3B1620', '#3B1620', '#A8707E', '#1A0A0E', '#C98A9A', '#C8A96A'),
      P('梅酒', '#8A3A3F', '#8A3A3F', '#D99A98', '#4A1F22', '#E8B8B4', '#C8A96A'),
    ],
    fingers: [{ t: 'magnet' }, { t: 'magnet' }, { t: 'magnet' }, { t: 'mirror' }, { t: 'magnet' }], accent: 3,
  });

  C.push({
    id: 'iron_rose', name: '鉄とローズ', en: 'Iron & Rose',
    story: 'グレージュのマットに、中指だけローズゴールドのスタッズを一点。金属と肌。硬さと柔らかさ。',
    moods: ['mode', 'classic'], fit: { outing: 3, office: 2, home: 2, party: 2, campus: 2, date: 1 },
    seasons: ['all', 'autumn'], originality: 3, formality: 3, minTier: 'coin', shapes: ['square', 'ballerina'],
    palettes: [
      P('鉄灰', '#8C8489', '#8C8489', '#D8A08A', '#5E585C', '#FFFFFF', '#D8A08A'),
      P('砂岩', '#B8A79A', '#B8A79A', '#D8A08A', '#857568', '#FFFFFF', '#D8A08A'),
      P('墨鉄', '#4A4448', '#4A4448', '#D8A08A', '#2B2226', '#FFFFFF', '#D8A08A'),
    ],
    fingers: [{ t: 'sugar_matte' }, { t: 'sugar_matte' }, { t: 'studs', over: 'sugar_matte' }, { t: 'sugar_matte' }, { t: 'sugar_matte' }], accent: 2,
  });

  C.push({
    id: 'milktea_marble', name: 'ミルクティーの大理石', en: 'Milk Tea Marble',
    story: 'ミルクティー色の白地に、紅茶の脈を細く。中指は少し濃いミルクティーのワンカラー。カフェの窓際の色。',
    moods: ['sweet', 'classic'], fit: { campus: 3, date: 3, outing: 3, office: 2, mama: 2, valentine: 2, home: 2 },
    seasons: ['all', 'autumn'], originality: 3, formality: 3, minTier: 'coin',
    palettes: [
      P('ミルクティー', '#EFE1D3', '#EFE1D3', '#C9A98E', '#B99A80', '#FFFFFF', '#D9B98A'),
      P('抹茶ラテ', '#E8E6D8', '#E8E6D8', '#A9B08C', '#8E9A74', '#FFFFFF', '#D9B98A'),
      P('苺ミルク', '#F6E3E3', '#F6E3E3', '#E2A9B2', '#CB8E99', '#FFFFFF', '#D9B98A'),
    ],
    fingers: [{ t: 'marble' }, { t: 'one_color' }, { t: 'one_color', c: { base: 'accent' } }, { t: 'marble' }, { t: 'one_color' }], accent: 3,
  });

  C.push({
    id: 'strawberry_cheek', name: '苺のチーク', en: 'Strawberry Cheek',
    story: '中央だけ、頬のようにぽっと赤く。薬指に極小のハートをひとつ。近くで見られる日の、血色の指先。',
    moods: ['sweet'], fit: { date: 3, campus: 3, valentine: 3, home: 2, outing: 2, oshi: 1 },
    seasons: ['all', 'spring'], originality: 2, formality: 2, minTier: 'coin',
    palettes: [
      P('苺',   '#F7E8E6', '#F7E8E6', '#E06A7E', '#C9485E', '#FFFFFF', '#E6DDD2'),
      P('杏',   '#F8EBE2', '#F8EBE2', '#F2A17B', '#D9825E', '#FFFFFF', '#E6DDD2'),
      P('葡萄', '#F2E8EE', '#F2E8EE', '#B07CA8', '#8E5C86', '#FFFFFF', '#E6DDD2'),
    ],
    fingers: [{ t: 'cheek' }, { t: 'cheek' }, { t: 'cheek' }, { t: 'heart_flakes', over: 'cheek' }, { t: 'cheek' }], accent: 3,
  });

  C.push({
    id: 'ribbon_promise', name: 'リボンの約束', en: 'Ribbon',
    story: '桃色のシアーに、薬指だけ細い白いリボン。人差し指にはパールを3つ。約束は小さく結ぶ。',
    moods: ['sweet'], fit: { date: 3, campus: 2, oshi: 2, valentine: 2, xmas: 1, bridal: 1 },
    seasons: ['all'], originality: 3, formality: 2, minTier: 'coin',
    palettes: [
      P('桃リボン', '#F6E3E3', '#F6E3E3', '#FFFFFF', '#E8A0B0', '#FFFFFF', '#E6DDD2'),
      P('黒リボン', '#F3ECE6', '#F3ECE6', '#2B2226', '#B09485', '#FFFFFF', '#E6DDD2'),
      P('紅リボン', '#F7EEEA', '#F7EEEA', '#B5262E', '#C9A7A0', '#FFFFFF', '#E6DDD2'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'pearls_tip', over: 'sheer' }, { t: 'sheer' }, { t: 'ribbon', over: 'sheer' }, { t: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'tiny_hearts', name: '小さなハート箔', en: 'Tiny Hearts',
    story: 'ヌードピンクに、極小のハートフレークを3枚ずつ。うるさくならない大きさで、ちゃんと可愛い。',
    moods: ['sweet'], fit: { date: 3, campus: 3, oshi: 3, valentine: 3, home: 2, outing: 1 },
    seasons: ['all'], originality: 2, formality: 1, minTier: 'coin',
    palettes: [
      P('桜',   '#F5DCD8', '#F5DCD8', '#D9465F', '#C9A7A0', '#FFFFFF', '#E6DDD2'),
      P('蜜',   '#F6EBDD', '#F6EBDD', '#D9B77A', '#C9B080', '#FFFFFF', '#D9B77A'),
      P('白ハート', '#E9B4BE', '#E9B4BE', '#FFFFFF', '#C98F99', '#FFFFFF', '#E6DDD2'),
    ],
    fingers: [{ t: 'heart_flakes', over: 'sheer' }, { t: 'sheer' }, { t: 'heart_flakes', over: 'sheer' }, { t: 'sheer' }, { t: 'heart_flakes', over: 'sheer' }], accent: 2,
  });

  C.push({
    id: 'bare_glow', name: '素肌のグロウ', en: 'Bare Glow',
    story: '地爪の色に近いシアーを一枚。何もしていないように見えて、手がきれい。面接室で、いちばん強い。',
    moods: ['natural'], fit: { interview: 3, office: 3, mama: 3, nyugaku: 2, campus: 2, wedding_guest: 1, home: 1 },
    seasons: ['all'], originality: 1, formality: 5, minTier: 'coin', shapes: ['round', 'oval'], lengths: ['short', 'medium'],
    palettes: [
      P('素肌', '#EFD3C8', '#EFD3C8', '#EFD3C8', '#C9A79A', '#FFFFFF', '#E6DDD2'),
      P('血色', '#F0C9C4', '#F0C9C4', '#F0C9C4', '#C99A98', '#FFFFFF', '#E6DDD2'),
      P('乳白', '#F3E6E0', '#F3E6E0', '#F3E6E0', '#C9BDB0', '#FFFFFF', '#E6DDD2'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'sheer' }, { t: 'sheer' }, { t: 'sheer' }, { t: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'sandy_shore', name: '砂浜', en: 'Sandy Shore',
    story: '白砂のマットに、中指だけシェルを埋め込む。砂の肌と、貝の光。サンダルの足にも。',
    moods: ['natural', 'sheer'], fit: { travel: 3, outing: 2, home: 2, yukata: 1, date: 1 },
    seasons: ['summer'], originality: 3, formality: 2, minTier: 'coin',
    palettes: [
      P('白砂', '#EADFCF', '#EADFCF', '#F4EEE6', '#C9B9A2', '#FFFFFF', '#D9B98A'),
      P('珊瑚砂', '#F0D5C8', '#F0D5C8', '#F8E8E0', '#C9A999', '#FFFFFF', '#D9B98A'),
      P('黒砂', '#8C8178', '#8C8178', '#D9D2C8', '#5E554D', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'sugar_matte' }, { t: 'sugar_matte' }, { t: 'shell_inlay', over: 'sheer' }, { t: 'sugar_matte' }, { t: 'sugar_matte' }], accent: 2,
  });

  C.push({
    id: 'walnut_oat', name: 'くるみとオートミール', en: 'Walnut & Oat',
    story: '胡桃色とオートミール色を、一本おきに。アートはない。色の間隔だけで、秋の朝食の温度になる。',
    moods: ['natural', 'classic'], fit: { office: 3, mama: 3, outing: 3, campus: 2, home: 2, nyugaku: 1 },
    seasons: ['autumn', 'winter'], originality: 2, formality: 3, minTier: 'coin',
    palettes: [
      P('胡桃', '#D9C3B0', '#D9C3B0', '#8E6A52', '#6E5243', '#FFFFFF', '#D9B98A'),
      P('栗',   '#E3D3C6', '#E3D3C6', '#7A4E36', '#4F3222', '#FFFFFF', '#D9B98A'),
      P('焙じ茶', '#E0D2C2', '#E0D2C2', '#A5806A', '#6E5243', '#FFFFFF', '#D9B98A'),
    ],
    fingers: [{ t: 'one_color', c: { base: 'accent' } }, { t: 'one_color' }, { t: 'one_color', c: { base: 'accent' } }, { t: 'one_color' }, { t: 'one_color', c: { base: 'accent' } }], accent: 2,
  });

  C.push({
    id: 'goldfish_bowl', name: '金魚の硝子鉢', en: 'Goldfish Bowl',
    story: 'クリアの硝子鉢に、朱の金魚がひらりと泳ぐ。薬指には水泡のホロ。夏祭りの帰り道、袋の中で揺れていたあの色。',
    moods: ['art', 'wa', 'sheer'], fit: { yukata: 3, travel: 2, outing: 2, home: 2, date: 1, oshi: 1 },
    seasons: ['summer'], originality: 5, formality: 1, minTier: 'coin',
    palettes: [
      P('硝子', '#E9F3F5', '#E9F3F5', '#D9412F', '#2B4C7E', '#FFFFFF', '#C8A96A'),
      P('黒出目金', '#EDF2F0', '#EDF2F0', '#2B2226', '#2B4C7E', '#FFFFFF', '#C8A96A'),
      P('夕暮れの鉢', '#F6EBE4', '#F6EBE4', '#D9412F', '#8E5C86', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'ink', over: 'sheer', p: { kind: 'fish' } }, { t: 'sheer' }, { t: 'holo_scatter', over: 'sheer', p: { bubbles: true, micro: true } }, { t: 'ink', over: 'sheer', p: { kind: 'fish' } }], accent: 1,
  });

  C.push({
    id: 'firework_afterglow', name: '花火の余韻', en: 'Afterglow',
    story: '夜空の紺に、薬指だけ金と銀の細線を放射させる。小指には小さなホロを火の粉のように。音が消えたあとの、空。',
    moods: ['art', 'wa', 'glam'], fit: { yukata: 3, oshi: 2, party: 2, travel: 1, date: 1 },
    seasons: ['summer'], originality: 4, formality: 1, minTier: 'coin',
    palettes: [
      P('夜空', '#1E2A4A', '#1E2A4A', '#E0C27A', '#101626', '#FFFFFF', '#C8A96A'),
      P('藍',   '#2B4C7E', '#2B4C7E', '#F0D9A0', '#16294A', '#FFFFFF', '#C8A96A'),
      P('墨空', '#2B2226', '#2B2226', '#E0C27A', '#1A1416', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'one_color' }, { t: 'one_color' }, { t: 'firework', over: 'one_color' }, { t: 'holo_scatter', over: 'one_color', p: { micro: true } }], accent: 3,
  });

  global.TSUME = global.TSUME || {};
  global.TSUME.CONCEPTS = (global.TSUME.CONCEPTS || []).concat(C);
})(typeof window !== 'undefined' ? window : globalThis);
