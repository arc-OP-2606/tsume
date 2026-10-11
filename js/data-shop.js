/* tsumé — アイテムSHOP。セリア公式「セルフネイル」頁の掲載品（2026-10-11 確認、JAN は公式の表記）を中心に厳選。
   official: false は公式頁に無い品（第三者の色見本・ほかの店の一般的な品）。取扱は店舗で確認。イラストは tsumé が描く（商品写真は使わない） */
(function (global) {
  'use strict';
  const T = global.TSUME, D = T.TOPPINGS, M = T.MATERIALS;
  const SE = 'セリア';
  const se = o => Object.assign({ store: SE, price: 110, official: true }, o);
  const nf = o => Object.assign({ store: SE, price: 110, official: false }, o);
  const one = (id, name, hex) => nf({ id, name, cat: 'color', illo: 'gel', hex, apply: { paint: { t: 'one_color', c: { base: hex } } } });
  const enamel = (id, name, jan, hex) => se({ id, name: 'ネイルエナメル S ' + name, cat: 'color', illo: 'polish', jan, hex, apply: { paint: { t: 'one_color', c: { base: hex } } } });

  const ITEMS = [
    // ---- マグネット・ラメ（公式）
    se({ id: 'se_mag_silkypink', name: 'ジェルネイル ライト対応 マグネット シルキーピンク', cat: 'magnet', illo: 'magnet', jan: '4571696270863', hex: '#D9A3B3', apply: { paint: { t: 'magnet', c: { base: '#C98A9B', light: '#FFE6EE' } } } }),
    se({ id: 'se_mag_turquoise', name: 'ジェルネイル ライト対応 マグネット ターコイズグリーン', cat: 'magnet', illo: 'magnet', jan: '4571696270757', hex: '#3FA39B', apply: { paint: { t: 'magnet', c: { base: '#2E8C86', light: '#B8F0E6' } } } }),
    se({ id: 'se_lame_fpurple', name: 'ジェルネイル ライト対応 ラメ フェアリーダストパープル', cat: 'magnet', illo: 'glitter', jan: '4571696270702', hex: '#C9B6E8', apply: { paint: { t: 'glitter_polish', c: { base: '#E6DDF2', metal: '#B79BE0' } } } }),
    se({ id: 'se_lame_fblue', name: 'ジェルネイル ライト対応 ラメ フェアリーダストブルー', cat: 'magnet', illo: 'glitter', jan: '4571696270719', hex: '#A9C4EA', apply: { paint: { t: 'glitter_polish', c: { base: '#DDE8F5', metal: '#93B7E6' } } } }),
    se({ id: 'se_glitter_gold', name: 'ジェルネイル ライト対応 グリッター ゴールド', cat: 'magnet', illo: 'glitter', jan: '4571696270375', hex: '#D4AF5E', apply: { paint: { t: 'lame_grad', c: { base: '#F5EFE6', metal: '#D4AF5E' } } } }),
    se({ id: 'se_icing_clear', name: 'ジェルネイル ライト対応 アイシングジェル クリア', cat: 'magnet', illo: 'clear', jan: '4571696270313', hex: '#EEF3F7', apply: { paint: { t: 'droplet3d', c: { base: '#F6EEEA' } } } }),
    // ---- 色（公式のマニキュア＋第三者の色見本から基本色）
    enamel('se_en_freshgreen', 'フレッシュグリーン', '4980299071294', '#8CCB98'),
    enamel('se_en_horizonblue', 'ホライゾンブルー', '4980299071324', '#6FA8DC'),
    enamel('se_en_blueshell', 'ブルーシェル', '4980299073533', '#A7C4DE'),
    enamel('se_en_whitelavender', 'ホワイトラベンダー', '4980299076626', '#E2D9EE'),
    enamel('se_en_operamauve', 'オペラモーブ', '4980299072567', '#B07A98'),
    se({ id: 'se_en_lamegrape', name: 'ネイルエナメル S ラメ グレープ', cat: 'color', illo: 'polish', jan: '4980299076633', hex: '#6B4B86', apply: { paint: { t: 'glitter_polish', c: { base: '#6B4B86', metal: '#C9A6E8' } } } }),
    one('nf_matte_white', 'ジェルネイル マットカラー ホワイト', '#F8F5F1'),
    one('nf_matte_milkypink', 'ジェルネイル マットカラー ミルキーピンク', '#F3D3D6'),
    one('nf_matte_bakedpink', 'ジェルネイル マットカラー ベイクドピンク', '#C98F8F'),
    one('nf_matte_beige', 'ジェルネイル マットカラー ベージュ', '#DCC2A8'),
    one('nf_matte_red', 'ジェルネイル マットカラー レッド', '#B8323E'),
    one('nf_matte_navy', 'ジェルネイル マットカラー ネイビー', '#273556'),
    one('nf_matte_grey', 'ジェルネイル マットカラー グレー', '#9C9A9E'),
    one('nf_matte_black', 'ジェルネイル マットカラー ブラック', '#2B2729'),
    nf({ id: 'nf_sheer_strawberry', name: 'ジェルネイル シアー ストロベリーピンク', cat: 'color', illo: 'gel', hex: '#F2A3B5', apply: { paint: { t: 'sheer', c: { base: '#F2A3B5' } } } }),
    nf({ id: 'nf_sheer_bluegrey', name: 'ジェルネイル シアー ブルーグレー', cat: 'color', illo: 'gel', hex: '#A9B6C6', apply: { paint: { t: 'sheer', c: { base: '#A9B6C6' } } } }),
    nf({ id: 'nf_pearl_white', name: 'ジェルネイル パール パールホワイト', cat: 'magnet', illo: 'glitter', hex: '#F4EFE8', apply: { paint: { t: 'aurora', c: { base: '#F7F3EE' } } } }),
    nf({ id: 'nf_unicorn_pink', name: 'ジェルネイル ユニコーンカラー ピンク', cat: 'magnet', illo: 'glitter', hex: '#F6D9E3', apply: { paint: { t: 'aurora', c: { base: '#F6D9E3' } } } }),
    nf({ id: 'nf_flash_gold', name: 'ジェルネイル フラッシュ シャイニーハニーゴールド', cat: 'magnet', illo: 'glitter', hex: '#E2BE6E', apply: { paint: { t: 'flash', c: { base: '#E9C981', light: '#FFF1C2' } } } }),
    // ---- シール（公式）。模様は商品名のテーマから tsumé が描いたもの
    se({ id: 'se_st_sea', name: 'ネイルシール ぷっくり 海のいきもの', cat: 'sticker', illo: 'sticker', jan: '4570101331243', apply: { sticker: [['fish', '#7FB3E0'], ['shell', '#F3C6A8'], ['starfish', '#F2A65A']] } }),
    se({ id: 'se_st_hawaiian', name: 'ネイルシール ぷっくり ハワイアン', cat: 'sticker', illo: 'sticker', jan: '4570101331229', apply: { sticker: [['hibiscus', '#E8516F'], ['leaf', '#4E9F6B']] } }),
    se({ id: 'se_kid_ribbon', name: 'チアミーモア ポイントネイルシール リボン', cat: 'sticker', illo: 'sticker', jan: '4570101332363', apply: { sticker: [['ribbon', '#F28BA8'], ['heart', '#F6A9BF']] } }),
    se({ id: 'se_kid_flower', name: 'チアミーモア ポイントネイルシール フラワー', cat: 'sticker', illo: 'sticker', jan: '4570101332356', apply: { sticker: [['flower', '#F7A8C4'], ['cherry', '#D9435B']] } }),
    se({ id: 'se_kid_animal', name: 'チアミーモア ポイントネイルシール アニマル', cat: 'sticker', illo: 'sticker', jan: '4570101332370', apply: { sticker: [['paw', '#C08A6A'], ['star', '#F2C14E']] } }),
    se({ id: 'se_st_check', name: 'ネイルシール 細チェック ブラック&ホワイト', cat: 'sticker', illo: 'cover', jan: '4968583267288', apply: { paint: { cover: true, t: 'check', c: { base: '#FBFAF8', deep: '#2B2226', accent: '#2B2226' } } } }),
    se({ id: 'se_st_lace', name: 'ネイルシール レース風 ブラック&ホワイト', cat: 'sticker', illo: 'cover', jan: '4968583267219', apply: { paint: { cover: true, t: 'lace', c: { base: '#FBFAF8', light: '#2B2226' } } } }),
    se({ id: 'se_gst_creamsoda', name: 'ジェル風ネイルシールハンド きらきらクリームソーダ', cat: 'sticker', illo: 'cover', jan: '4542804166521', apply: { paint: { cover: true, t: 'aura', c: { base: '#EAF7EF', accent: '#7FD6B0' } } } }),
    se({ id: 'se_gst_sunshine', name: 'ジェルネイルシール サンシャインコレクション', cat: 'sticker', illo: 'cover', jan: '4570101331250', apply: { paint: { cover: true, t: 'gradient', c: { base: '#FFF6D8', tip: '#FFB547' } } } }),
    se({ id: 'se_gst_grace', name: 'ジェルネイルシール グレイスコレクション', cat: 'sticker', illo: 'cover', jan: '4570101330963', apply: { paint: { cover: true, t: 'marble', c: { base: '#F7F2EC', deep: '#C9A56A' } } } }),
    // ---- パーツ（公式）
    se({ id: 'se_pt_miniribbon', name: 'ネイルパーツ ミニリボン ホワイト&ブラック', cat: 'parts', illo: 'pack', jan: '4968583264850', apply: { part: [{ k: 'charm', v: 'white', shape: 'ribbon' }, { k: 'charm', v: 'black', shape: 'ribbon' }] } }),
    se({ id: 'se_holo_heart', name: 'ネイル用ホログラム プチハート 1g', cat: 'parts', illo: 'flake', jan: '4968988230252', apply: { flake: 'heart' } }),
  ];

  // ---- パーツ（100均の一般的な品。商品名と値段は素材データ＝2026-10 の調べ）
  const coin = mat => (M[mat] && M[mat].tiers.coin) || { p: '', s: '100均', y: 110 };
  const partLabel = it => (it.k === 'stone' ? D.STONES[it.v].name : it.k === 'pearl' ? D.PEARLS[it.v].name : it.k === 'charm' ? D.CHARMS[it.shape].name : it.k === 'bijou' ? D.BIJOUX[it.v].name : it.k === 'flower3d' ? D.FLOWERS[it.v].name : it.k === 'stud' ? D.STUDS[it.shape].name : (D.METALS[it.v] || D.METALS.gold).name);
  D.TRAY.forEach(tab => tab.items.forEach(it => {
    const k = D.KINDS[it.k], c = coin(k.mat), id = ['gp', it.k, it.v, it.shape].filter(Boolean).join('_');
    if (ITEMS.some(x => x.id === id)) return;
    ITEMS.push({ id, name: `${c.p || k.name} ${partLabel(it)}`, store: c.s, price: c.y, official: false, cat: 'parts', illo: 'pack', apply: { part: [Object.assign({}, it)] } });
  }));
  // ---- 専門店・ブランド（素材データのプチプラ・ラグジュアリーの品）
  const brand = (id, mat, tier, part, label) => { const t = M[mat] && M[mat].tiers[tier]; if (t) ITEMS.push({ id, name: label || t.p, store: t.s, price: t.y, official: false, cat: 'brand', illo: 'box', apply: { part: [part] } }); };
  brand('br_swaro_clear', 'stone_accent', 'luxe', { k: 'stone', v: 'clear' }, 'フラットバック クリスタル');
  brand('br_swaro_ab', 'stone_accent', 'luxe', { k: 'stone', v: 'aurora' }, 'フラットバック クリスタル オーロラ');
  brand('br_grace_clear', 'stone_accent', 'petit', { k: 'stone', v: 'champagne' });
  brand('br_pearl', 'pearls', 'petit', { k: 'pearl', v: 'white' });
  brand('br_bijou_ruby', 'bijou', 'petit', { k: 'bijou', v: 'ruby' }, 'ビジューパーツ ルビー');
  brand('br_bijou_sapphire', 'bijou', 'petit', { k: 'bijou', v: 'sapphire' }, 'ビジューパーツ サファイア');
  brand('br_charm_star', 'metal_charm', 'petit', { k: 'charm', v: 'gold', shape: 'star' }, 'メタルチャーム 星');
  brand('br_charm_moon', 'metal_charm', 'luxe', { k: 'charm', v: 'gold', shape: 'moon' }, 'ゴールドチャーム 月');
  brand('br_brion', 'brion', 'petit', { k: 'bullion', v: 'gold' });
  brand('br_studs', 'studs', 'petit', { k: 'stud', v: 'silver', shape: 'square' });
  brand('br_chain', 'chain', 'petit', { k: 'chain', v: 'gold' });

  const CATS = [{ id: 'color', name: '色' }, { id: 'magnet', name: 'マグネット・ラメ' }, { id: 'sticker', name: 'シール' }, { id: 'parts', name: 'パーツ' }, { id: 'brand', name: '専門店・ブランド' }];
  const byId = id => ITEMS.find(x => x.id === id) || null;
  T.SHOP = { ITEMS, CATS, byId, CHECKED: '2026-10-11' };
})(typeof window !== 'undefined' ? window : globalThis);
