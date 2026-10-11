/* tsumé — signature concepts (3/3): 写真から起こした案とメンズ */
(function (global) {
  'use strict';
  const C = [];
  const P = (name, base, tip, accent, deep, light, metal) => ({ name, base, tip, accent, deep, light, metal });

  // 塾長提供の写真（マスタード地に水彩の白花・線描きの蝶・オーロラストーン・金のふち）から
  C.push({
    id: 'mustard_blossom', name: '芥子色の白花', en: 'Mustard Blossom',
    story: 'こっくりした芥子色に、白を水で薄めた花をにじませる。蝶は塗らずに線だけ。片側に金のふち、花の芯にオーロラの一粒。十本すべて配置が違う、一点ものの手。',
    moods: ['art', 'glam', 'classic'], fit: { outing: 3, date: 3, party: 2, travel: 2, wedding_guest: 1, office: 1, seijin: 1, oshi: 1 },
    seasons: ['autumn', 'spring', 'all'], originality: 5, formality: 3, minTier: 'coin', shapes: ['square', 'ballerina', 'oval'], lengths: ['short', 'medium'],
    palettes: [
      P('芥子', '#E2A83A', '#E2A83A', '#FFFFFF', '#B8832A', '#FFFFFF', '#C8A96A'),
      P('珊瑚', '#E88C78', '#E88C78', '#FFFFFF', '#B5604F', '#FFFFFF', '#C8A96A'),
      P('薄荷', '#9ECFC4', '#9ECFC4', '#FFFFFF', '#5F9E92', '#FFFFFF', '#C9C9CF'),
      P('墨',   '#2B2226', '#2B2226', '#FFFFFF', '#120E10', '#FFFFFF', '#C8A96A'),
      P('瑠璃', '#2F4F8F', '#2F4F8F', '#FFFFFF', '#1B2F5E', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [
      { t: 'watercolor_flower', over: 'one_color', p: { big: true } },
      { t: 'butterfly_line', over: 'one_color', p: { size: 0.9, y: 0.42 }, layers: [{ t: 'gold_edge', p: { side: 'right' } }] },
      { t: 'watercolor_flower', over: 'one_color', p: { big: true } },
      { t: 'watercolor_flower', over: 'one_color', p: { big: false }, layers: [{ t: 'stones_accent', p: { n: 1, at: 'tip' }, c: { accent: 'light' } }] },
      { t: 'butterfly_line', over: 'one_color', p: { size: 0.7, y: 0.5 }, layers: [{ t: 'gold_edge', p: { side: 'left' } }] },
    ],
    right: [
      { t: 'watercolor_flower', over: 'one_color', p: { big: false } },
      { t: 'watercolor_flower', over: 'one_color', p: { big: true }, layers: [{ t: 'stones_accent', p: { n: 1, at: 'tip' }, c: { accent: 'light' } }] },
      { t: 'butterfly_line', over: 'one_color', p: { size: 0.9, y: 0.45 }, layers: [{ t: 'gold_edge', p: { side: 'left' } }] },
      { t: 'watercolor_flower', over: 'one_color', p: { big: true } },
      { t: 'watercolor_flower', over: 'one_color', p: { big: false, stone: false }, layers: [{ t: 'gold_edge', p: { side: 'right' } }] },
    ],
    accent: 3,
  });

  // 写真右下のメンズチップ（海の碧に亀）から
  C.push({
    id: 'ocean_turtle', name: '海の碧と亀', en: 'Ocean Turtle',
    story: '深い海の碧に白い泡の脈。親指に金の亀、薬指にヒトデ。短い爪でも成立する、男性にも似合う海。',
    moods: ['mens', 'art', 'natural'], fit: { travel: 3, yukata: 2, outing: 2, home: 2, oshi: 1, date: 1, party: 1 },
    seasons: ['summer', 'all'], originality: 5, formality: 2, minTier: 'coin', shapes: ['square', 'round'], lengths: ['short', 'medium'],
    palettes: [
      P('碧',   '#2E6B8A', '#2E6B8A', '#E8907A', '#163E55', '#CFE6EE', '#C8A96A'),
      P('群青', '#1F3F7A', '#1F3F7A', '#F0B090', '#10244A', '#C8D8F0', '#C8A96A'),
      P('翠',   '#1E6F6A', '#1E6F6A', '#E8907A', '#0F3E3B', '#C6E6E0', '#C9C9CF'),
    ],
    fingers: [
      { t: 'gemstone', p: { kind: 'ocean' }, layers: [{ t: 'turtle_gold', p: { y: 0.5, rot: -20 } }] },
      { t: 'one_color' },
      { t: 'gemstone', p: { kind: 'ocean' } },
      { t: 'starfish', over: 'one_color', p: { y: 0.42, size: 10 }, layers: [{ t: 'lame_grad', c: { metal: 'light' } }] },
      { t: 'one_color' },
    ],
    accent: 0,
  });

  C.push({
    id: 'mens_matte_stud', name: '黒マットと一点の銀', en: 'Matte & Stud',
    story: '全部マットの黒。薬指の根元に銀のスタッズをひとつ。光らないことが、いちばん強い。',
    moods: ['mens', 'mode'], fit: { outing: 3, party: 3, oshi: 2, home: 2, date: 2, office: 1 },
    seasons: ['all'], originality: 3, formality: 3, minTier: 'coin', shapes: ['square', 'round'], lengths: ['short'],
    palettes: [
      P('黒銀', '#2B2226', '#2B2226', '#C9C9CF', '#120E10', '#C9C9CF', '#C9C9CF'),
      P('鉄紺', '#1F2A48', '#1F2A48', '#C9C9CF', '#101626', '#C9C9CF', '#C9C9CF'),
      P('オリーブ', '#4A4E34', '#4A4E34', '#C8A96A', '#2A2C1E', '#C8A96A', '#C8A96A'),
    ],
    fingers: [{ t: 'sugar_matte' }, { t: 'sugar_matte' }, { t: 'sugar_matte' }, { t: 'studs', over: 'sugar_matte' }, { t: 'sugar_matte' }],
    accent: 3,
  });

  C.push({
    id: 'mens_clear_navy', name: 'クリアに紺の一筋', en: 'Navy Line',
    story: '素爪に艶のクリア。人差し指と薬指の先に、紺の極細ラインだけ。仕事の手で、清潔に。',
    moods: ['mens', 'natural', 'classic'], fit: { office: 3, interview: 1, outing: 2, date: 2, home: 2, travel: 1 },
    seasons: ['all'], originality: 2, formality: 4, minTier: 'coin', shapes: ['square', 'round'], lengths: ['short'],
    palettes: [
      P('紺',   '#F3EAE4', '#1F2A48', '#1F2A48', '#C9BDB0', '#FFFFFF', '#C9C9CF'),
      P('墨',   '#F3EAE4', '#2B2226', '#2B2226', '#C9BDB0', '#FFFFFF', '#C9C9CF'),
      P('深緑', '#F3EAE4', '#2E4A3F', '#2E4A3F', '#C9BDB0', '#FFFFFF', '#C8A96A'),
    ],
    fingers: [{ t: 'bare_gloss' }, { t: 'skinny_french', c: { base: 'base' } }, { t: 'bare_gloss' }, { t: 'skinny_french', c: { base: 'base' } }, { t: 'bare_gloss' }],
    accent: 3,
  });

  global.TSUME = global.TSUME || {};
  global.TSUME.CONCEPTS = (global.TSUME.CONCEPTS || []).concat(C);
})(typeof window !== 'undefined' ? window : globalThis);
