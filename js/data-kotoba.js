/* tsumé — 「ことばで咲く」の辞書。言葉 → 色（1〜2色）と条件。AI が使えないときはこれだけで動く。
   書き方: [言葉, '色1/色2', 'キー:値 …']  s=季節 m=ムード sc=シーン t=予算 tm=時間 lv=経験 len=長さ */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const RAW = [
    // 季節の花・植物
    ['桜', '#F2C8D0/#FBEFF1', 's:spring m:sweet'], ['さくら', '#F2C8D0/#FBEFF1', 's:spring m:sweet'], ['夜桜', '#E9B7C6/#2C2440', 's:spring m:glam'],
    ['菜の花', '#F3D45A/#B9CF7A', 's:spring m:natural'], ['藤', '#B7A3D6/#EAE2F3', 's:spring m:classic'], ['ミモザ', '#F2D34E/#EAF0D8', 's:spring m:natural'],
    ['チューリップ', '#F07C8E/#F9D9DF', 's:spring m:sweet'], ['若葉', '#C9DFA8/#F1F6E6', 's:spring m:natural'], ['梅', '#E9A3B3/#F7E4E8', 's:winter m:wa'],
    ['紫陽花', '#8FA7D8/#C9B3DE', 's:summer m:sheer'], ['あじさい', '#8FA7D8/#C9B3DE', 's:summer m:sheer'], ['向日葵', '#F5C02E/#6B8E3A', 's:summer m:natural'], ['ひまわり', '#F5C02E/#6B8E3A', 's:summer m:natural'],
    ['朝顔', '#5A6FC8/#E8EAF6', 's:summer m:wa'], ['ハイビスカス', '#E8516F/#4E9F6B', 's:summer sc:travel'], ['睡蓮', '#F2C6D3/#9FC8B8', 's:summer m:sheer'],
    ['金木犀', '#F0A24A/#FBE3C2', 's:autumn m:natural'], ['きんもくせい', '#F0A24A/#FBE3C2', 's:autumn m:natural'], ['紅葉', '#C8452E/#E8A54A', 's:autumn m:wa'], ['もみじ', '#C8452E/#E8A54A', 's:autumn m:wa'],
    ['銀杏', '#E8C14A/#F6EBC8', 's:autumn m:natural'], ['コスモス', '#E8A0B8/#F8E6EC', 's:autumn m:sweet'], ['彼岸花', '#C8202E/#2E2224', 's:autumn m:mode'], ['どんぐり', '#9A6A3E/#D9BFA0', 's:autumn m:natural'],
    ['椿', '#B3243A/#F4EAE4', 's:winter m:wa'], ['水仙', '#F7E9A8/#F7F3EA', 's:winter m:sheer'], ['ポインセチア', '#C21F35/#2F6B47', 's:winter sc:xmas'], ['柊', '#2F6B47/#C21F35', 's:winter sc:xmas'],
    ['薔薇', '#C0304A/#F4D6DC', 'm:glam'], ['バラ', '#C0304A/#F4D6DC', 'm:glam'], ['百合', '#F6F1E7/#E9E2C8', 'm:classic'], ['ラベンダー', '#B9A5D8/#EEE8F6', 'm:sheer'],
    ['かすみ草', '#F7F5F2/#E3E9E4', 'm:sheer'], ['牡丹', '#D0577A/#F6DDE4', 'm:wa'], ['蓮', '#F0C4CF/#A8C9A0', 'm:wa'], ['ドライフラワー', '#C9A28C/#B9B39A', 'm:natural'],
    // 空・天気・自然
    ['夕焼け', '#F08A5D/#E85A70', 'm:glam'], ['夕暮れ', '#E9A07A/#7E6A9E', 'm:sheer'], ['朝焼け', '#F6B7A0/#F9E1C8', 'm:sheer'], ['星空', '#1E2A4A/#E8E2C8', 'm:glam'], ['夜空', '#1B2240/#8C93C8', 'm:mode'],
    ['月', '#F2E6B8/#2B2F4A', 'm:classic'], ['満月', '#F4E3A4/#22263E', 'm:classic'], ['雨', '#A9B9C8/#E6ECF1', 'm:sheer'], ['雨上がり', '#B9C9D6/#E8EEF2', 'm:sheer'], ['虹', '#F2A6B8/#A8D8E8', 'm:sweet'],
    ['雪', '#F4F6F8/#C9D8E6', 's:winter m:sheer'], ['雪の日', '#F4F6F8/#C9D8E6', 's:winter m:sheer'], ['晴れ', '#9CCBEF/#FFF6D6', 'm:natural'], ['曇り', '#C9C7C6/#EDEBE8', 'm:mode'], ['霧', '#DCE1E4/#F4F5F4', 'm:sheer'],
    ['海', '#3A7CA5/#BFE3EE', 's:summer sc:travel'], ['波', '#8CC6D9/#F2F8F9', 's:summer m:sheer'], ['砂浜', '#EADFC8/#9CCFD8', 's:summer sc:travel'], ['南国', '#2CB5A8/#F7C04A', 's:summer sc:travel'],
    ['森', '#4E6B4A/#C9D6B8', 'm:natural'], ['湖', '#6FA6B5/#E3F0F2', 'm:sheer'], ['氷', '#E8F6F8/#BFDDE6', 's:summer m:sheer'], ['オーロラ', '#B6E3D4/#C9B3E8', 'm:glam'], ['宇宙', '#231C3F/#B49BE0', 'm:glam'],
    // 食べ物・飲み物・お菓子
    ['ミルクティー', '#D9BFA6/#F3E8DC', 'm:natural'], ['紅茶', '#B5653A/#EBD3BC', 'm:classic'], ['抹茶', '#8FA35E/#E8E6D2', 'm:wa'], ['ほうじ茶', '#9C6B48/#E3CDB4', 'm:wa'], ['カフェラテ', '#C9A58A/#F1E6DA', 'm:natural'],
    ['チョコ', '#5A3A2E/#C9A58A', 's:winter m:classic'], ['チョコレート', '#5A3A2E/#C9A58A', 's:winter m:classic'], ['キャラメル', '#C08A4A/#F1DDC0', 'm:natural'], ['はちみつ', '#E8B04A/#FBEBC4', 'm:natural'],
    ['いちご', '#E0465E/#F9D9DE', 'm:sweet'], ['苺', '#E0465E/#F9D9DE', 'm:sweet'], ['いちごミルク', '#F6C9D0/#FFF4F2', 'm:sweet'], ['さくらんぼ', '#D9435B/#F7E1E4', 'm:sweet'], ['桃', '#F6C1B0/#FCE9E1', 'm:sweet'],
    ['レモン', '#F5E06A/#FFF9DE', 's:summer m:natural'], ['オレンジ', '#F29A43/#FDE7CC', 'm:natural'], ['ぶどう', '#6B4B86/#D8C8E8', 'm:classic'], ['メロン', '#B8D98A/#F2F8E6', 'm:sweet'],
    ['ソーダ', '#9FD8E8/#F3FBFD', 's:summer m:sheer'], ['クリームソーダ', '#7FD6B0/#F7EFE0', 's:summer m:sweet'], ['ラムネ', '#A9DCEB/#EEF8FB', 's:summer m:sheer'], ['かき氷', '#F28BA8/#A9D8EE', 's:summer m:sweet'],
    ['マカロン', '#F6C6D3/#C9E6D8', 'm:sweet'], ['ケーキ', '#F7E7DE/#E8A3B0', 'm:sweet'], ['プリン', '#F2D38A/#9A5A2E', 'm:sweet'], ['ワイン', '#7A2034/#E9CBD0', 'm:classic'], ['シャンパン', '#EFD9A8/#F9F2E2', 'm:glam'],
    ['栗', '#8A5A3A/#E9D3B8', 's:autumn m:natural'], ['かぼちゃ', '#E8892E/#4A3A2E', 's:autumn m:art'], ['ハロウィン', '#E8892E/#2B2226', 's:autumn m:art'],
    // 場所・時間・できごと
    ['帰り道', '#E9B98E/#8C7AA8', 'm:sheer'], ['放課後', '#F3C9A8/#B8C8E6', 'sc:campus m:sheer'], ['カフェ', '#C9A58A/#F3EAE0', 'sc:outing m:natural'], ['海辺', '#7FB8D0/#F1E6D2', 'sc:travel m:sheer'],
    ['旅行', '#4FA3C2/#F4E6CC', 'sc:travel'], ['旅', '#4FA3C2/#F4E6CC', 'sc:travel'], ['リゾート', '#2CB5A8/#F6E7C8', 'sc:travel'], ['京都', '#9C2E3B/#E8D5B8', 'm:wa'], ['パリ', '#E9CFD3/#2B2226', 'm:classic'],
    ['夏祭り', '#E8402F/#1E2A5A', 's:summer sc:yukata'], ['浴衣', '#2E3A6E/#F1E4D2', 's:summer sc:yukata'], ['花火', '#F5C02E/#1E2240', 's:summer sc:yukata'], ['お祭り', '#E8402F/#F5C02E', 'sc:yukata'],
    ['成人式', '#B3243A/#C8A96A', 's:winter sc:seijin'], ['振袖', '#B3243A/#C8A96A', 'sc:seijin m:wa'], ['卒業式', '#E9B7C6/#3A3A6E', 's:spring sc:graduation'], ['袴', '#7A2E5A/#E9C9D3', 'sc:graduation m:wa'],
    ['入学式', '#F2C8D0/#F4F1EC', 's:spring sc:nyugaku'], ['結婚式', '#F4EFE8/#E9D2C4', 'sc:wedding_guest m:classic'], ['お呼ばれ', '#F1E2DA/#C9A56A', 'sc:wedding_guest m:classic'], ['ウェディング', '#F7F3EE/#E8DCCF', 'sc:bridal m:classic'],
    ['デート', '#F0B6C0/#F8E8EA', 'sc:date m:sweet'], ['記念日', '#C0304A/#F2DDE0', 'sc:date m:glam'], ['ライブ', '#E8516F/#2B2226', 'sc:oshi m:glam'], ['推し', '#E8516F/#F7E3E8', 'sc:oshi'], ['推し活', '#E8516F/#F7E3E8', 'sc:oshi'],
    ['クリスマス', '#C21F35/#2F6B47', 's:winter sc:xmas'], ['バレンタイン', '#7A2E3B/#F2C8D0', 's:winter sc:valentine'], ['お正月', '#C21F35/#C8A96A', 's:winter sc:newyear m:wa'], ['初詣', '#C21F35/#F4EFE8', 's:winter sc:newyear m:wa'],
    ['パーティー', '#C8A96A/#2B2226', 'sc:party m:glam'], ['年末', '#C8A96A/#7A2E3B', 'sc:party'], ['オフィス', '#E9D9CF/#F4EEE9', 'sc:office m:classic'], ['仕事', '#E9D9CF/#F4EEE9', 'sc:office m:classic'],
    ['面接', '#F1E6DF/#F7F3EF', 'sc:interview m:classic'], ['就活', '#F1E6DF/#F7F3EF', 'sc:interview m:classic'], ['学校', '#F1DCD6/#E6EDF2', 'sc:campus m:natural'], ['子ども', '#F3DCCB/#E9EFE6', 'sc:mama m:natural'],
    ['おうち', '#EAD9CC/#F5EFE9', 'sc:home m:natural'], ['週末', '#E9B8C2/#F7EEF0', 'sc:outing'], ['夏休み', '#4FB3C8/#F7E07A', 's:summer'], ['ハワイ', '#2CB5A8/#E8516F', 's:summer sc:travel'],
    // 色の名前
    ['赤', '#B8323E', ''], ['レッド', '#B8323E', ''], ['ピンク', '#EFA3B5', 'm:sweet'], ['白', '#F8F5F1', 'm:sheer'], ['ホワイト', '#F8F5F1', 'm:sheer'], ['黒', '#2B2729', 'm:mode'], ['ブラック', '#2B2729', 'm:mode'],
    ['金', '#C8A96A', 'm:glam'], ['ゴールド', '#C8A96A', 'm:glam'], ['銀', '#C9CCD4', 'm:mode'], ['シルバー', '#C9CCD4', 'm:mode'], ['青', '#4A72B8', ''], ['ブルー', '#4A72B8', ''], ['水色', '#A9D3EC', 'm:sheer'],
    ['紫', '#7E5AA8', 'm:classic'], ['パープル', '#7E5AA8', 'm:classic'], ['緑', '#5E8F5A', 'm:natural'], ['グリーン', '#5E8F5A', 'm:natural'], ['黄色', '#F2D35A', ''], ['イエロー', '#F2D35A', ''],
    ['茶色', '#8A5A3A', 'm:natural'], ['ブラウン', '#8A5A3A', 'm:natural'], ['ベージュ', '#DCC2A8', 'm:natural'], ['グレー', '#9C9A9E', 'm:mode'], ['ネイビー', '#273556', 'm:classic'], ['ボルドー', '#7A2E3B', 's:autumn m:classic'],
    ['くすみ', '#B9A9A6/#D8CFCB', 'm:natural'], ['パステル', '#F6D3DC/#CFE6EE', 'm:sweet'], ['ミント', '#B6E3D4', 'm:sheer'], ['コーラル', '#F7A1A1', 'm:sweet'], ['テラコッタ', '#B5654A', 's:autumn m:natural'],
    ['カーキ', '#6E7350', 's:autumn m:mode'], ['マスタード', '#C9A24B', 's:autumn m:natural'], ['モノトーン', '#2B2729/#F8F5F1', 'm:mode'], ['ヌード', '#E9CDBE', 'm:natural'],
    // 気分・雰囲気（色を持たないものもある）
    ['透明感', '', 'm:sheer'], ['うるうる', '', 'm:sheer'], ['ふんわり', '', 'm:sheer'], ['上品', '', 'm:classic'], ['大人', '', 'm:classic'], ['大人っぽ', '', 'm:classic'], ['華やか', '', 'm:glam'], ['キラキラ', '', 'm:glam'], ['きらきら', '', 'm:glam'],
    ['かわいい', '', 'm:sweet'], ['可愛い', '', 'm:sweet'], ['甘い', '', 'm:sweet'], ['甘め', '', 'm:sweet'], ['クール', '', 'm:mode'], ['かっこいい', '', 'm:mode'], ['モード', '', 'm:mode'], ['ナチュラル', '', 'm:natural'], ['シンプル', '', 'm:natural'],
    ['和風', '', 'm:wa'], ['和', '', 'm:wa'], ['個性的', '', 'm:art'], ['アート', '', 'm:art'], ['ゆめかわ', '#F6C6E0/#C9E0F6', 'm:sweet'], ['レトロ', '#C98A5A/#6E8A7A', 'm:art'], ['韓国', '#F3E6E9/#E8D0D6', 'm:sheer'],
    // 条件
    ['初心者', '', 'lv:first'], ['はじめて', '', 'lv:first'], ['初めて', '', 'lv:first'], ['不器用', '', 'lv:first'], ['慣れてきた', '', 'lv:some'], ['得意', '', 'lv:expert'],
    ['10分', '', 'tm:t30'], ['時短', '', 'tm:t30'], ['すぐ', '', 'tm:t30'], ['じっくり', '', 'tm:t120'], ['100均', '', 't:coin'], ['プチプラ', '', 't:coin'], ['安く', '', 't:coin'], ['高級', '', 't:luxe'], ['ご褒美', '', 't:luxe'],
    ['ショート', '', 'len:short'], ['短い', '', 'len:short'], ['短め', '', 'len:short'], ['ロング', '', 'len:long'], ['長い', '', 'len:long'],
  ];
  const KEYS = { s: 'season', m: 'mood', sc: 'scene', t: 'tier', tm: 'time', lv: 'level', len: 'length' };
  const WORDS = RAW.map(([w, c, p]) => {
    const o = { w, colors: c ? c.split('/') : [] };
    (p || '').split(/\s+/).filter(Boolean).forEach(kv => { const [k, v] = kv.split(':'); if (KEYS[k]) o[KEYS[k]] = v; });
    return o;
  }).sort((a, b) => b.w.length - a.w.length);
  const EXAMPLES = ['金木犀の帰り道', '雨上がりの紫陽花', '推しのライブ、赤と黒で', '成人式 赤い振袖 初心者', 'クリームソーダみたいに', '10分でできる大人のベージュ'];
  T.KOTOBA = { WORDS, EXAMPLES };
})(typeof window !== 'undefined' ? window : globalThis);
