/* tsumé — signature concepts (2/2) */
(function (global) {
  'use strict';
  const C = [];
  const P = (name, base, tip, accent, deep, light, metal) => ({ name, base, tip, accent, deep, light, metal });

  C.push({
    id: 'butterfly_dust', name: '蝶の鱗粉', en: 'Butterfly Dust',
    story: 'マグネットの上にオーロラの粉。角度で羽の色が変わる。中指だけ白いシアーにオーロラをのせ、翅の裏側に。',
    moods: ['art', 'glam', 'sheer'], fit: { oshi: 3, party: 2, outing: 2, date: 2, travel: 2, campus: 2, home: 1 },
    seasons: ['all', 'spring'], originality: 4, formality: 2, minTier: 'coin',
    palettes: [
      P('瑠璃蝶', '#3D4F7C', '#3D4F7C', '#BFD4F0', '#1F2A48', '#BFD4F0', '#C9C9CF'),
      P('紫蝶',   '#5B3F6E', '#5B3F6E', '#CDBEE3', '#2E1F3A', '#CDBEE3', '#C9C9CF'),
      P('翠蝶',   '#2E5E57', '#2E5E57', '#A9D8CE', '#17302C', '#A9D8CE', '#C9C9CF'),
    ],
    fingers: [{ t: 'butterfly' }, { t: 'butterfly' }, { t: 'aurora', over: 'sheer', c: { base: 'light' } }, { t: 'butterfly' }, { t: 'butterfly' }], accent: 2,
  });

  C.push({
    id: 'edge_of_space', name: '宇宙の端', en: 'Edge of Space',
    story: '深い紫のマグネットに、中指は極小ホロの星。薬指だけ銀のミラー、衛星のように。ペンライトの光を吸って返す。',
    moods: ['art', 'mode', 'glam'], fit: { oshi: 3, party: 3, home: 2, outing: 2, campus: 1, xmas: 1 },
    seasons: ['all', 'winter'], originality: 4, formality: 1, minTier: 'coin',
    palettes: [
      P('深紫', '#3A2748', '#3A2748', '#B79BD8', '#1C1124', '#B79BD8', '#C9C9CF'),
      P('深青', '#1F2A48', '#1F2A48', '#8FB0E0', '#0E1426', '#8FB0E0', '#C9C9CF'),
      P('黒曜', '#2B2226', '#2B2226', '#C9C9CF', '#120E10', '#C9C9CF', '#C9C9CF'),
    ],
    fingers: [{ t: 'magnet' }, { t: 'magnet' }, { t: 'holo_scatter', over: 'magnet', p: { micro: true } }, { t: 'mirror' }, { t: 'magnet' }], accent: 3,
  });

  C.push({
    id: 'stone_specimen', name: '石の標本', en: 'Specimen',
    story: '五本とも違う石。ターコイズ、ローズクォーツ、大理石、ラピス、べっ甲。金の脈で一つの標本箱にまとめる。',
    moods: ['art', 'natural'], fit: { travel: 3, outing: 3, home: 2, party: 1, graduation: 1, oshi: 1 },
    seasons: ['all'], originality: 5, formality: 2, minTier: 'coin', shapes: ['square', 'oval', 'ballerina'],
    palettes: [
      P('金脈', '#F2EDE6', '#F2EDE6', '#8FB7C5', '#4A2A14', '#FFFFFF', '#C8A96A'),
      P('銀脈', '#F2EDE6', '#F2EDE6', '#8FB7C5', '#4A2A14', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'gemstone', p: { kind: 'turquoise' } }, { t: 'gemstone', p: { kind: 'rose' } }, { t: 'marble' }, { t: 'gemstone', p: { kind: 'lapis' } }, { t: 'tortoise' }], accent: 3,
  });

  C.push({
    id: 'old_map', name: '古い地図', en: 'Old Map',
    story: '羊皮紙のセピアをにじませ、中指に金の海岸線を一本。行き先はまだ決めていない。',
    moods: ['art', 'natural', 'classic'], fit: { travel: 3, outing: 3, home: 2, office: 1, campus: 1 },
    seasons: ['all', 'autumn'], originality: 4, formality: 2, minTier: 'coin',
    palettes: [
      P('羊皮紙', '#E8D9C0', '#E8D9C0', '#B49A78', '#8E6A52', '#F7F0E2', '#C8A96A'),
      P('海図',   '#DCE3E0', '#DCE3E0', '#9DB4B0', '#4E6578', '#F2F5F3', '#C8A96A'),
      P('夕焼け地図', '#EFD9CC', '#EFD9CC', '#D9A88E', '#A0523B', '#FAF0E8', '#C8A96A'),
    ],
    fingers: [{ t: 'nuance' }, { t: 'nuance' }, { t: 'gold_crack', over: 'nuance', p: { coast: true } }, { t: 'nuance' }, { t: 'nuance' }], accent: 2,
  });

  C.push({
    id: 'camellia_one', name: '椿一輪', en: 'Camellia',
    story: '深紅のワンカラーに、薬指だけ白い椿を一輪。金の芯を点で打つ。振袖の赤を、指先で受ける。',
    moods: ['wa'], fit: { seijin: 3, newyear: 3, graduation: 2, party: 1, xmas: 1, yukata: 1 },
    seasons: ['winter', 'autumn', 'all'], originality: 3, formality: 5, minTier: 'coin',
    palettes: [
      P('紅椿', '#A61E2A', '#A61E2A', '#FFFFFF', '#5E0F17', '#FFFFFF', '#C8A96A'),
      P('白椿', '#F4EFE8', '#F4EFE8', '#B5262E', '#D9CFC2', '#FFFFFF', '#C8A96A'),
      P('黒椿', '#2B2226', '#2B2226', '#B5262E', '#120E10', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'one_color' }, { t: 'one_color' }, { t: 'camellia', over: 'one_color' }, { t: 'one_color' }], accent: 3,
  });

  C.push({
    id: 'mizuhiki_knot', name: '水引の結び', en: 'Mizuhiki',
    story: '白地に、赤と金の線であわじ結び。人差し指と小指は金の極細フレンチ。祝いの手。',
    moods: ['wa', 'classic'], fit: { seijin: 3, newyear: 3, graduation: 2, bridal: 2, nyugaku: 1, wedding_guest: 1 },
    seasons: ['winter', 'all'], originality: 4, formality: 5, minTier: 'coin',
    palettes: [
      P('紅白', '#F4EFE8', '#C8A96A', '#B5262E', '#D9CFC2', '#FFFFFF', '#C8A96A'),
      P('金銀', '#F4EFE8', '#C9C9CF', '#C8A96A', '#D9CFC2', '#FFFFFF', '#C9C9CF'),
      P('藍白', '#F4EFE8', '#C8A96A', '#2B4C7E', '#D9CFC2', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'skinny_french' }, { t: 'one_color' }, { t: 'mizuhiki', over: 'one_color' }, { t: 'skinny_french' }], accent: 3,
  });

  C.push({
    id: 'plum_and_gold', name: '小梅と金箔', en: 'Plum & Gold',
    story: '白のシアーに、小梅をドットで。中指には金箔を一片。古典の柄を、点と箔だけで。',
    moods: ['wa', 'sweet'], fit: { seijin: 3, newyear: 3, graduation: 3, nyugaku: 2, yukata: 2, date: 1, wedding_guest: 1 },
    seasons: ['winter', 'spring', 'all'], originality: 3, formality: 4, minTier: 'coin',
    palettes: [
      P('梅',   '#F7EDEA', '#F7EDEA', '#D96C7E', '#B5465A', '#FFFFFF', '#C8A96A'),
      P('紅梅', '#F7EDEA', '#F7EDEA', '#B5262E', '#8A1A22', '#FFFFFF', '#C8A96A'),
      P('白梅', '#E9B4BE', '#E9B4BE', '#FFFFFF', '#C98F99', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'plum', over: 'sheer' }, { t: 'gold_leaf', over: 'sheer' }, { t: 'plum', over: 'sheer' }, { t: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'indigo_gradation', name: '藍の濃淡', en: 'Indigo',
    story: '根元の水色から、先端の藍へ。中指には白い流水の線。浴衣の藍と、袴の紺に。',
    moods: ['wa', 'mode', 'sheer'], fit: { yukata: 3, graduation: 3, seijin: 2, outing: 2, party: 1, travel: 1 },
    seasons: ['summer', 'all'], originality: 3, formality: 3, minTier: 'coin',
    palettes: [
      P('藍',   '#DCE6EE', '#1F3A66', '#8FB7C5', '#1F3A66', '#FFFFFF', '#C9C9CF'),
      P('瑠璃', '#DDE4F2', '#2B4C9E', '#9FB9D6', '#2B4C9E', '#FFFFFF', '#C8A96A'),
      P('紫紺', '#E6DFEC', '#3B2A5E', '#B8A6CC', '#3B2A5E', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'gradient' }, { t: 'gradient' }, { t: 'ink', over: 'gradient', p: { kind: 'stream' } }, { t: 'gradient' }, { t: 'gradient' }], accent: 2,
  });

  C.push({
    id: 'ichimatsu_silver', name: '市松の銀', en: 'Ichimatsu',
    story: 'ベージュと銀の市松を人差し指に。薬指は一面の銀ミラー。古典の格子を、金属で。',
    moods: ['wa', 'mode'], fit: { graduation: 3, seijin: 2, newyear: 2, party: 2, outing: 2, office: 1 },
    seasons: ['all', 'winter'], originality: 4, formality: 4, minTier: 'coin', shapes: ['square', 'oval'],
    palettes: [
      P('砂銀', '#E7D9CF', '#E7D9CF', '#C9C9CF', '#B9A89C', '#FFFFFF', '#C9C9CF'),
      P('墨銀', '#2B2226', '#2B2226', '#C9C9CF', '#120E10', '#FFFFFF', '#C9C9CF'),
      P('朱金', '#B5262E', '#B5262E', '#C8A96A', '#7A1A20', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'check', over: 'one_color', p: { kind: 'ichimatsu' } }, { t: 'one_color' }, { t: 'mirror' }, { t: 'one_color' }], accent: 3,
  });

  C.push({
    id: 'marble_magnet', name: 'ビー玉マグネット', en: 'Marble Glass',
    story: 'クリア感の強いマグネットで、爪がビー玉になる。薬指には固めた雫をひとつ、硝子の中の硝子。',
    moods: ['sheer', 'glam', 'sweet'], fit: { outing: 3, date: 3, campus: 3, office: 2, party: 2, home: 2, travel: 2 },
    seasons: ['all', 'summer'], originality: 3, formality: 3, minTier: 'coin',
    palettes: [
      P('ビー玉',     '#CFE3E6', '#CFE3E6', '#9FC9CF', '#7FA9B0', '#FFFFFF', '#C9C9CF'),
      P('蜜柑ビー玉', '#F3DCC8', '#F3DCC8', '#E9B08A', '#C98E6A', '#FFFFFF', '#D9B98A'),
      P('葡萄ビー玉', '#E0D4EA', '#E0D4EA', '#B8A0D0', '#8E78A8', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'magnet', p: { clear: true } }, { t: 'magnet', p: { clear: true } }, { t: 'magnet', p: { clear: true } }, { t: 'droplet3d', over: 'magnet', p: { clear: true } }, { t: 'magnet', p: { clear: true } }], accent: 3,
  });

  C.push({
    id: 'sheer_tortoise_silk', name: 'シアーべっ甲と絹', en: 'Silk Tortoise',
    story: '超微粒子のマグネットと、透けるべっ甲を一本おきに。金からブロンズ、ココアへ。2026年秋の、奥行きと艶。',
    moods: ['classic', 'glam'], fit: { outing: 3, party: 3, office: 2, date: 2, graduation: 2, home: 1, mama: 1 },
    seasons: ['autumn', 'winter'], originality: 3, formality: 3, minTier: 'coin',
    palettes: [
      P('飴絹', '#C9A07E', '#C9A07E', '#D39A5A', '#5A3A22', '#F5E3C8', '#C8A96A'),
      P('ココア', '#A57A62', '#A57A62', '#B8773A', '#3E2416', '#EBD3C2', '#C8A96A'),
      P('ブロンズ', '#B0885C', '#B0885C', '#C98E4A', '#4A2A14', '#F0DDBE', '#C8A96A'),
    ],
    fingers: [{ t: 'magnet' }, { t: 'tortoise', p: { sheer: true } }, { t: 'magnet' }, { t: 'tortoise', p: { sheer: true } }, { t: 'magnet' }], accent: 3,
  });

  C.push({
    id: 'quilted_tweed', name: 'キルティングのツイード', en: 'Quilted Tweed',
    story: '親指と小指は千鳥のツイード、中指はキルティングの格子にパール。冬のコートの、ポケットの中。',
    moods: ['classic', 'sweet', 'mode'], fit: { xmas: 3, outing: 3, party: 2, date: 2, valentine: 2, office: 1, campus: 1 },
    seasons: ['winter', 'autumn'], originality: 4, formality: 3, minTier: 'coin',
    palettes: [
      P('千鳥', '#EDE4DC', '#EDE4DC', '#C9808A', '#2B2226', '#FFFFFF', '#E6DDD2'),
      P('栗ツイード', '#E6D8CC', '#E6D8CC', '#8E6A52', '#4F3222', '#FFFFFF', '#D9B98A'),
      P('紺ツイード', '#E3E6EC', '#E3E6EC', '#C9808A', '#1F2A48', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'tweed' }, { t: 'sugar_matte' }, { t: 'quilting', over: 'one_color' }, { t: 'sugar_matte' }, { t: 'tweed' }], accent: 2,
  });

  C.push({
    id: 'red_magnet_skinny', name: '赤マグネットの一筋', en: 'Red Line',
    story: '人差し指と薬指は赤のマグネット、残りはヌードに赤の極細ライン。線と面で、同じ赤を分ける。',
    moods: ['glam', 'classic', 'mode'], fit: { party: 3, date: 3, xmas: 3, outing: 2, graduation: 2, newyear: 2, office: 1 },
    seasons: ['autumn', 'winter'], originality: 3, formality: 3, minTier: 'coin',
    palettes: [
      P('紅',   '#F0DDD3', '#8F1D2C', '#8F1D2C', '#5E0F17', '#D98A98', '#C8A96A'),
      P('葡萄', '#F0DDD3', '#5E1F2E', '#5E1F2E', '#2E0F17', '#C98A9A', '#C8A96A'),
      P('朱',   '#F2E3D8', '#C9382E', '#C9382E', '#7A1A20', '#F0A090', '#C8A96A'),
    ],
    fingers: [{ t: 'skinny_french' }, { t: 'magnet', c: { base: 'accent' } }, { t: 'skinny_french' }, { t: 'magnet', c: { base: 'accent' } }, { t: 'skinny_french' }], accent: 3,
  });

  C.push({
    id: 'dusty_blue_ink', name: 'くすみブルーのインク', en: 'Dusty Ink',
    story: '彩度を落とした青のワンカラーに、人差し指と小指だけ濃い青のにじみ。秋の空気の色。',
    moods: ['art', 'classic', 'mode'], fit: { outing: 3, campus: 3, office: 2, home: 2, date: 2, travel: 1 },
    seasons: ['autumn', 'all'], originality: 3, formality: 2, minTier: 'coin',
    palettes: [
      P('青鼠', '#93A6B5', '#93A6B5', '#6E8599', '#4E6578', '#E7EEF2', '#C9C9CF'),
      P('灰桜', '#C9B0B4', '#C9B0B4', '#A88A90', '#7A5E66', '#F3E8EA', '#C9C9CF'),
      P('苔',   '#9BA68E', '#9BA68E', '#7A866C', '#55604A', '#EEF1E8', '#C8A96A'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'ink', over: 'one_color' }, { t: 'one_color' }, { t: 'one_color' }, { t: 'ink', over: 'one_color' }], accent: 1,
  });

  C.push({
    id: 'velvet_plum', name: '深みパープルのベルベット', en: 'Velvet Plum',
    story: 'ぶどうの紫を、起毛のベルベットに。薬指の根元に小さな石をひとつ。光の向きで毛並みが変わる。',
    moods: ['mode', 'glam', 'classic'], fit: { party: 3, xmas: 2, date: 2, outing: 2, graduation: 2, home: 1 },
    seasons: ['autumn', 'winter'], originality: 2, formality: 3, minTier: 'coin',
    palettes: [
      P('葡萄', '#4B2E5C', '#4B2E5C', '#B48BC8', '#2A1834', '#B48BC8', '#C9C9CF'),
      P('黒紫', '#2E1F3A', '#2E1F3A', '#9A7AB8', '#160E1C', '#9A7AB8', '#C9C9CF'),
      P('藤色', '#8C78A8', '#8C78A8', '#D8C8EA', '#5A4878', '#D8C8EA', '#C9C9CF'),
    ],
    fingers: [{ t: 'velvet' }, { t: 'velvet' }, { t: 'velvet' }, { t: 'stones_accent', over: 'velvet', p: { at: 'cuticle', n: 1 } }, { t: 'velvet' }], accent: 3,
  });

  C.push({
    id: 'something_blue', name: 'サムシングブルー', en: 'Something Blue',
    story: '白のシアーに、人差し指と小指は白硝子のフレンチ。薬指の根元、指輪で隠れる場所に、小さな青をひと粒。',
    moods: ['classic', 'sheer'], fit: { bridal: 3, wedding_guest: 1, nyugaku: 1, date: 1 },
    seasons: ['all'], originality: 3, formality: 5, minTier: 'coin', shapes: ['oval', 'almond', 'round'],
    palettes: [
      P('白藍', '#F6F2EE', '#FFFFFF', '#9FB9D6', '#C9BDB0', '#FFFFFF', '#C9C9CF'),
      P('白金', '#F6F2EE', '#FFFFFF', '#9FB9D6', '#C9BDB0', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'glass_french' }, { t: 'sheer' }, { t: 'stones_accent', over: 'sheer', p: { at: 'cuticle', n: 1 } }, { t: 'glass_french' }], accent: 3,
  });

  C.push({
    id: 'veil_lace', name: 'ヴェールのレース', en: 'Veil Lace',
    story: '絹白のシアーに、先端だけ白いレースの弧を連ねる。中指に真珠を3つ。ヴェールの裾を、爪に。',
    moods: ['classic', 'sheer', 'glam'], fit: { bridal: 3, wedding_guest: 1, nyugaku: 1, party: 1 },
    seasons: ['all'], originality: 4, formality: 5, minTier: 'coin', shapes: ['oval', 'almond'],
    palettes: [
      P('絹白', '#F8F3EF', '#F8F3EF', '#FFFFFF', '#D9CFC2', '#FFFFFF', '#E6DDD2'),
      P('象牙レース', '#F3E9DF', '#F3E9DF', '#FFFFFF', '#C9BDB0', '#FFFFFF', '#D9B98A'),
    ],
    fingers: [{ t: 'lace', over: 'sheer' }, { t: 'sheer' }, { t: 'pearls_tip', over: 'sheer' }, { t: 'lace', over: 'sheer' }, { t: 'sheer' }], accent: 2,
  });

  C.push({
    id: 'member_color', name: 'メンカラのフラッシュ', en: 'Member Color',
    story: '推しの色を人差し指と薬指に。白の指にはフラッシュラメ、カメラの光で爆発的に光る。ハートは極小、星はひとつ。',
    moods: ['glam', 'sweet', 'art'], fit: { oshi: 3, party: 1, campus: 1, home: 1 },
    seasons: ['all'], originality: 3, formality: 1, minTier: 'coin',
    palettes: [
      P('赤', '#D9282F', '#D9282F', '#D9282F', '#8A1A20', '#F6F1EC', '#C9C9CF'),
      P('桃', '#F08BA8', '#F08BA8', '#F08BA8', '#C9607E', '#F6F1EC', '#C9C9CF'),
      P('青', '#2E6DB4', '#2E6DB4', '#2E6DB4', '#1A4A80', '#F6F1EC', '#C9C9CF'),
      P('橙', '#F28C28', '#F28C28', '#F28C28', '#C06A14', '#F6F1EC', '#C9C9CF'),
      P('緑', '#3CA55C', '#3CA55C', '#3CA55C', '#247A3E', '#F6F1EC', '#C9C9CF'),
      P('黄', '#F2C230', '#F2C230', '#F2C230', '#C09A10', '#F6F1EC', '#C9C9CF'),
      P('紫', '#7A4BB0', '#7A4BB0', '#7A4BB0', '#52307A', '#F6F1EC', '#C9C9CF'),
      P('黒', '#2B2226', '#2B2226', '#2B2226', '#120E10', '#F6F1EC', '#C9C9CF'),
    ],
    fingers: [{ t: 'flash', over: 'one_color', c: { base: 'light' } }, { t: 'one_color' }, { t: 'flash', over: 'one_color', c: { base: 'light' } }, { t: 'heart_flakes', over: 'one_color', c: { accent: 'light' } }, { t: 'star_parts', over: 'one_color', c: { base: 'light' } }], accent: 3,
  });

  C.push({
    id: 'choco_milk', name: 'ショコラとミルク', en: 'Choco & Milk',
    story: 'チョコブラウンの上に、ミルクをたらし込む。中指はミルク色、小指には苺のハートを一枚。溶けかけの温度。',
    moods: ['sweet', 'classic'], fit: { valentine: 3, date: 3, outing: 2, home: 2, campus: 2, xmas: 1 },
    seasons: ['winter', 'all'], originality: 3, formality: 2, minTier: 'coin',
    palettes: [
      P('ショコラ', '#5A3B2E', '#5A3B2E', '#E58A98', '#3A2219', '#F6EDE4', '#D9B98A'),
      P('ホワイトチョコ', '#F3E9DC', '#F3E9DC', '#E58A98', '#C9B9A2', '#FFFDF8', '#D9B98A'),
      P('抹茶ショコラ', '#5E6B4A', '#5E6B4A', '#E58A98', '#3A4430', '#F0F2E6', '#D9B98A'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'drip', over: 'one_color' }, { t: 'one_color', c: { base: 'light' } }, { t: 'drip', over: 'one_color' }, { t: 'heart_flakes', over: 'one_color', c: { base: 'light' } }], accent: 1,
  });

  C.push({
    id: 'snowy_night', name: '雪の夜', en: 'Snowy Night',
    story: '深緑の上に、白い点を大小まばらに。中指には金箔。窓の外で降り始めた雪と、室内の灯り。',
    moods: ['glam', 'classic', 'sweet'], fit: { xmas: 3, party: 2, date: 2, newyear: 1, outing: 1 },
    seasons: ['winter'], originality: 2, formality: 3, minTier: 'coin',
    palettes: [
      P('深緑', '#2E4A3F', '#2E4A3F', '#FFFFFF', '#17302C', '#FFFFFF', '#C8A96A'),
      P('ボルドー', '#7A2E3B', '#7A2E3B', '#FFFFFF', '#4A1A22', '#FFFFFF', '#C8A96A'),
      P('夜紺', '#1F2A48', '#1F2A48', '#FFFFFF', '#101626', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'snow_dots', over: 'one_color' }, { t: 'gold_leaf', over: 'one_color' }, { t: 'snow_dots', over: 'one_color' }, { t: 'one_color' }], accent: 2,
  });

  C.push({
    id: 'weekend_peel', name: 'おうちピールオフ', en: 'Weekend Peel',
    story: '剥がせるベースに、好きな色を一枚。薬指に小さなホロをひとつ。週末だけの指先。月曜の朝に、剥がす。',
    moods: ['natural', 'sweet', 'art'], fit: { home: 3, campus: 3, mama: 2, outing: 1, office: 1 },
    seasons: ['all'], originality: 1, formality: 1, minTier: 'coin', lengths: ['short', 'medium'],
    palettes: [
      P('ラベンダー', '#CDBEE3', '#CDBEE3', '#CDBEE3', '#9D8EB8', '#FFFFFF', '#C9C9CF'),
      P('桃',       '#F2C8D0', '#F2C8D0', '#F2C8D0', '#C9A0A8', '#FFFFFF', '#C9C9CF'),
      P('テラコッタ', '#C98B70', '#C98B70', '#C98B70', '#9A6650', '#FFFFFF', '#D9B98A'),
      P('ミント',    '#C6E2D8', '#C6E2D8', '#C6E2D8', '#8FB8A8', '#FFFFFF', '#C9C9CF'),
    ],
    fingers: [{ t: 'peel_one' }, { t: 'peel_one' }, { t: 'peel_one' }, { t: 'holo_scatter', over: 'peel_one', p: { micro: true, n: 3 } }, { t: 'peel_one' }], accent: 3,
  });

  C.push({
    id: 'one_point_moon', name: 'ワンポイントの月', en: 'One Moon',
    story: '全部クリア。薬指の先に、小さな金の三日月だけ。何もしていないようで、月が出ている。',
    moods: ['classic', 'art', 'sheer'], fit: { office: 3, date: 3, outing: 3, wedding_guest: 2, party: 2, home: 2, nyugaku: 1, graduation: 1 },
    seasons: ['all', 'autumn'], originality: 4, formality: 3, minTier: 'coin',
    palettes: [
      P('夜明け', '#F5EEE9', '#F5EEE9', '#C8A96A', '#C9BDB0', '#FFFFFF', '#C8A96A'),
      P('銀月',   '#F5EEE9', '#F5EEE9', '#C9C9CF', '#C9BDB0', '#FFFFFF', '#C9C9CF'),
      P('薄紅の月', '#F7E6E6', '#F7E6E6', '#C8A96A', '#C9A7A0', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'sheer' }, { t: 'sheer' }, { t: 'sheer' }, { t: 'moon_gold', over: 'sheer' }, { t: 'sheer' }], accent: 3,
  });

  C.push({
    id: 'terracotta_check', name: 'テラコッタのチェック', en: 'Terracotta Check',
    story: 'テラコッタとカーキのチェックを人差し指と小指に。残りはテラコッタとベージュのワンカラー。秋のマフラーの柄。',
    moods: ['classic', 'sweet', 'natural'], fit: { outing: 3, campus: 3, office: 2, mama: 2, home: 2, date: 1 },
    seasons: ['autumn'], originality: 2, formality: 2, minTier: 'coin',
    palettes: [
      P('テラコッタ', '#EAD8CC', '#EAD8CC', '#6E7350', '#B5654A', '#FFFFFF', '#D9B98A'),
      P('マスタード', '#EFE4D0', '#EFE4D0', '#7A6A4A', '#C9A24B', '#FFFFFF', '#D9B98A'),
      P('ボルドー',   '#EADCDC', '#EADCDC', '#4A4A5E', '#7A2E3B', '#FFFFFF', '#D9B98A'),
    ],
    fingers: [{ t: 'one_color', c: { base: 'deep' } }, { t: 'check', over: 'one_color' }, { t: 'one_color', c: { base: 'deep' } }, { t: 'one_color' }, { t: 'check', over: 'one_color' }], accent: 1,
  });

  C.push({
    id: 'mustard_gold', name: 'マスタードと金の一筋', en: 'Mustard Line',
    story: 'こっくりした芥子色のワンカラーと、ヌードに金の極細ライン。薬指の根元には金の粒を並べる。',
    moods: ['classic', 'glam'], fit: { outing: 3, office: 2, graduation: 2, party: 2, mama: 2, home: 1 },
    seasons: ['autumn'], originality: 2, formality: 3, minTier: 'coin',
    palettes: [
      P('芥子', '#C9A24B', '#C8A96A', '#F2E3B6', '#9A7A2E', '#EFE0C8', '#C8A96A'),
      P('カーキ', '#6E7350', '#C8A96A', '#D9DCC8', '#4A4E34', '#EFE0C8', '#C8A96A'),
      P('テラコッタ', '#B5654A', '#C8A96A', '#F0D9C8', '#84422E', '#EFE0C8', '#C8A96A'),
    ],
    fingers: [{ t: 'one_color' }, { t: 'skinny_french', c: { base: 'light' } }, { t: 'one_color' }, { t: 'brion_line', over: 'one_color' }, { t: 'skinny_french', c: { base: 'light' } }], accent: 3,
  });

  C.push({
    id: 'khaki_nuance', name: 'カーキのニュアンス', en: 'Khaki Nuance',
    story: '苔色と土色を、境目なく雲のように。薬指に金箔を一片。山の朝の、霧の色。',
    moods: ['art', 'natural', 'classic'], fit: { outing: 3, office: 2, campus: 2, mama: 2, travel: 2, home: 2 },
    seasons: ['autumn'], originality: 3, formality: 2, minTier: 'coin',
    palettes: [
      P('苔',   '#E4DFD2', '#E4DFD2', '#6E7350', '#8E6A52', '#FFFFFF', '#C8A96A'),
      P('霧',   '#E6E4E0', '#E6E4E0', '#8A8F86', '#6E6A66', '#FFFFFF', '#C9C9CF'),
      P('枯葉', '#EADFD0', '#EADFD0', '#B5654A', '#8E6A52', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'nuance' }, { t: 'one_color' }, { t: 'nuance' }, { t: 'gold_leaf', over: 'nuance' }, { t: 'one_color' }], accent: 3,
  });

  global.TSUME = global.TSUME || {};
  global.TSUME.CONCEPTS = (global.TSUME.CONCEPTS || []).concat(C);
})(typeof window !== 'undefined' ? window : globalThis);
