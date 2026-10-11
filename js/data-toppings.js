/* tsumé — トッピング（パーツ）のカタログ・置き方・量・シーンの決まり */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const STONES = {
    clear: { name: 'クリア', base: '#E9EEF4', dark: '#8893A3', light: '#FFFFFF' },
    aurora: { name: 'オーロラ', base: '#EFEDF6', dark: '#9590AE', light: '#FFFFFF', ab: true },
    pink: { name: 'ピンク', base: '#F5B3C6', dark: '#B4506F', light: '#FFE8EF' },
    blue: { name: 'ブルー', base: '#A9C6EE', dark: '#3F64A0', light: '#EAF2FF' },
    champagne: { name: 'シャンパン', base: '#EFD49C', dark: '#9C7233', light: '#FFF5DC' },
    black: { name: 'ブラック', base: '#4A4247', dark: '#100D0F', light: '#A79BA3' },
  };
  const PEARLS = { white: { name: 'ホワイト', c0: '#FFFFFF', c1: '#F3EDE6', c2: '#C3B6AA' }, cream: { name: 'クリーム', c0: '#FFFDF5', c1: '#F1E1C2', c2: '#C2A982' }, pink: { name: 'ピンク', c0: '#FFF8F9', c1: '#F4D9DB', c2: '#C49BA0' } };
  const METALS = { gold: { name: 'ゴールド', hex: '#D4AF5E' }, silver: { name: 'シルバー', hex: '#C9CCD4' }, rose: { name: 'ローズゴールド', hex: '#DDA293' }, white: { name: 'ホワイト', hex: '#F2EEE8' }, black: { name: 'ブラック', hex: '#3A3437' } };
  // シールの模様（tsumé が描く汎用の形。実際の商品の絵柄は写さない）
  const STICKERS = { ribbon: { name: 'リボン' }, flower: { name: 'お花' }, heart: { name: 'ハート' }, star: { name: '星' }, fish: { name: 'おさかな' }, shell: { name: '貝がら' }, starfish: { name: 'ヒトデ' }, hibiscus: { name: 'ハイビスカス' }, leaf: { name: 'リーフ' }, paw: { name: '肉球' }, cherry: { name: 'さくらんぼ' }, lace: { name: 'レース' } };
  const BIJOUX = { emerald: { name: 'エメラルド', hex: '#2E9B78' }, sapphire: { name: 'サファイア', hex: '#3253B5' }, ruby: { name: 'ルビー', hex: '#C62F4B' }, rose: { name: 'ローズ', hex: '#E897AE' }, clear: { name: 'クリア', hex: '#E9EEF4' }, black: { name: 'ブラック', hex: '#3A3337' } };
  const FLOWERS = { white: { name: 'ホワイト', tint: '#E9DCE0' }, pink: { name: 'ピンク', tint: '#F2B7C6' }, yellow: { name: 'イエロー', tint: '#F4D98A' } };
  const CHARMS = { star: { name: '星' }, moon: { name: '月' }, heart: { name: 'ハート' }, ribbon: { name: 'リボン' }, butterfly: { name: '蝶' }, shell: { name: '貝' }, flower: { name: '花' }, turtle: { name: '亀' } };
  const STUDS = { round: { name: '丸' }, square: { name: '四角' }, triangle: { name: '三角' } };
  const SIZES = { S: 0.72, M: 1, L: 1.38 };
  // mm = 大きさ M の実物の目安（爪の幅を約12mmとして描画の大きさから換算。S・L は SIZES の倍率）
  const KINDS = {
    stone: { name: 'ストーン', mat: 'stone_accent', minutes: 1, unit: 11, mm: 2.6 },
    pearl: { name: 'パール', mat: 'pearls', minutes: 1, unit: 11.5, mm: 2.8 },
    bullion: { name: 'ブリオン', mat: 'brion', minutes: 1, unit: 9, mm: 0.7 },
    stud: { name: 'スタッズ', mat: 'studs', minutes: 1, unit: 9, mm: 2.2 },
    charm: { name: 'メタルパーツ', mat: 'metal_charm', minutes: 1, unit: 24, mm: 5.2 },
    bijou: { name: 'ビジュー', mat: 'bijou', minutes: 2, unit: 14, big: true, mm: 3.9 },
    flower3d: { name: '3Dフラワー', mat: 'flower3d', minutes: 2, unit: 21, big: true, mm: 5.8 },
    chain: { name: 'チェーン', mat: 'chain', minutes: 2, unit: 20, big: true, mm: 1.6 },
    sticker: { name: 'シール', mat: 'sticker', minutes: 1, unit: 15, mm: 5, flat: true },
    flake: { name: 'ホログラム', mat: 'flakes', minutes: 1, unit: 4.2, mm: 1.2, flat: true },
  };
  const LAYOUTS = {
    one: { name: '根元にひと粒', items: [{ x: 0.5, y: 0.8, s: 'M' }] },
    three: { name: '根元に3粒', items: [{ x: 0.33, y: 0.83, s: 'S' }, { x: 0.5, y: 0.79, s: 'M' }, { x: 0.67, y: 0.83, s: 'S' }] },
    cluster: { name: 'かたまり', items: [{ x: 0.45, y: 0.7, s: 'L' }, { x: 0.68, y: 0.79, s: 'S' }, { x: 0.62, y: 0.58, s: 'S' }] },
    tipline: { name: '先端にライン', items: [0.18, 0.34, 0.5, 0.66, 0.82].map(x => ({ x, y: +(0.2 + Math.abs(x - 0.5) * 0.18).toFixed(3), s: 'S' })) },
    diagonal: { name: 'ななめ', items: [{ x: 0.32, y: 0.76, s: 'S' }, { x: 0.44, y: 0.62, s: 'M' }, { x: 0.57, y: 0.49, s: 'S' }, { x: 0.69, y: 0.36, s: 'S' }] },
    center: { name: '真ん中', items: [{ x: 0.5, y: 0.5, s: 'L' }] },
    vertical: { name: 'たてライン', items: [{ x: 0.5, y: 0.3, s: 'S' }, { x: 0.5, y: 0.45, s: 'S' }, { x: 0.5, y: 0.6, s: 'M' }, { x: 0.5, y: 0.76, s: 'S' }] },
  };
  const LEVELS = [{ id: 'none', name: 'なし' }, { id: 'one', name: 'ひと粒' }, { id: 'point', name: 'ポイント' }, { id: 'lots', name: 'たっぷり' }];
  const SCENE_RULES = {
    office: { def: 'one', cap: 'one', noBig: true, note: 'オフィスでは、ひと粒まで。' },
    campus: { def: 'point', cap: 'point', note: '学校の日は、ポイントまで。' },
    mama: { def: 'none', cap: 'one', flat: true, note: '子どもと過ごす日は、引っかからない小さなストーンをひと粒だけ。' },
    home: { def: 'point' }, outing: { def: 'point' },
    wedding_guest: { def: 'point', cap: 'point', noBig: true, note: '結婚式のお呼ばれは、大きなビジューを控えて上品に。' },
    bridal: { def: 'lots' }, seijin: { def: 'lots' }, graduation: { def: 'point' },
    nyugaku: { def: 'one', cap: 'one', noBig: true, note: '入学式・式典は、ひと粒まで。' },
    yukata: { def: 'point' }, date: { def: 'point' }, oshi: { def: 'lots' }, travel: { def: 'point' }, party: { def: 'lots' },
    interview: { def: 'none', cap: 'none', note: '就活・面接では、パーツはつけない。' },
    valentine: { def: 'point' }, xmas: { def: 'lots' }, newyear: { def: 'point' },
  };
  const NO_SCENE_RULE = { def: 'point' };
  const MOOD_KINDS = {
    sheer: [{ k: 'stone' }, { k: 'pearl' }, { k: 'stone' }],
    classic: [{ k: 'pearl' }, { k: 'bullion' }, { k: 'pearl' }],
    glam: [{ k: 'stone' }, { k: 'stone' }, { k: 'bijou' }],
    mode: [{ k: 'stud', shape: 'square' }, { k: 'chain' }, { k: 'stud', shape: 'round' }],
    sweet: [{ k: 'pearl' }, { k: 'charm', shape: 'ribbon' }, { k: 'charm', shape: 'heart' }],
    natural: [{ k: 'pearl' }, { k: 'pearl' }, { k: 'pearl' }],
    art: [{ k: 'charm', shape: 'star' }, { k: 'charm', shape: 'moon' }, { k: 'charm', shape: 'butterfly' }],
    wa: [{ k: 'charm', shape: 'flower' }, { k: 'pearl' }, { k: 'charm', shape: 'flower' }],
    mens: [{ k: 'charm', shape: 'turtle' }, { k: 'stud', shape: 'round' }, { k: 'charm', shape: 'turtle' }],
  };
  const TRAY = [
    { id: 'stone', name: 'ストーン', items: Object.keys(STONES).map(v => ({ k: 'stone', v })) },
    { id: 'pearl', name: 'パール・粒', items: Object.keys(PEARLS).map(v => ({ k: 'pearl', v })).concat([{ k: 'bullion', v: 'gold' }, { k: 'bullion', v: 'silver' }, { k: 'stud', v: 'gold', shape: 'round' }, { k: 'stud', v: 'silver', shape: 'square' }, { k: 'stud', v: 'gold', shape: 'triangle' }]) },
    { id: 'metal', name: 'メタル', items: Object.keys(CHARMS).map(shape => ({ k: 'charm', v: 'gold', shape })) },
    { id: 'bijou', name: 'ビジュー', items: Object.keys(BIJOUX).map(v => ({ k: 'bijou', v })) },
    { id: 'flower', name: 'お花・チェーン', items: Object.keys(FLOWERS).map(v => ({ k: 'flower3d', v })).concat([{ k: 'chain', v: 'gold' }, { k: 'chain', v: 'silver' }]) },
  ];
  // 価格は 2026-10 の調査目安（100均のネイルパーツ・グルー 110円、ネイル工房のビジュー 190〜380円、メタルパーツ 200〜500円）
  Object.assign(T.MATERIALS, {
    bijou: { name: 'ビジュー', cat: 'parts', tiers: { coin: { p: 'ネイルパーツ（ビジュー）', s: 'セリア / ダイソー', y: 110 }, petit: { p: 'ビジューパーツ', s: 'ネイル工房', y: 380 } } },
    chain: { name: 'ネイルチェーン', cat: 'parts', tiers: { coin: { p: 'ネイルパーツ（チェーン）', s: 'セリア / ダイソー', y: 110 }, petit: { p: 'メタルチェーン', s: '専門店', y: 330 } } },
    flower3d: { name: '3Dフラワー', cat: 'parts', tiers: { coin: { p: 'ネイルパーツ（フラワー）', s: 'セリア / ダイソー', y: 110 } } },
    nail_glue: { name: 'ネイルグルー', cat: 'tool', tiers: { coin: { p: 'ネイルグルー', s: 'セリア', y: 110 } } },
  });
  T.TOPPINGS = { STONES, PEARLS, METALS, BIJOUX, FLOWERS, CHARMS, STUDS, STICKERS, SIZES, KINDS, TRAY, LAYOUTS, LEVELS, SCENE_RULES, NO_SCENE_RULE, MOOD_KINDS };
})(typeof window !== 'undefined' ? window : globalThis);
