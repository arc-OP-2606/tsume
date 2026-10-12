/* tsumé — 色を混ぜる（調色）。持っている色から、作りたい色に近い混ぜ方（色と割合）を探す。
   混ざり方は絵の具と同じ減法混色。顔料の Kubelka–Munk の式（js/vendor/spectral.js・MIT）で、色を光の波長ごとに混ぜて計算する。
   画面の色と実物、メーカーで違うので、結果は目安。AI は「色の名前 → 色」の読み取りだけに使う */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const SP = global.spectral || (typeof require === 'function' ? require('./vendor/spectral.js') : null);
  const HEX = /^#[0-9a-fA-F]{6}$/;
  // 反射率の下限。実物の黒いジェルも少しは光を返す。0 に近いままだと、黒が1すくいで何でも真っ黒にしてしまう
  const FLOOR = 0.03;
  const cache = new Map();
  function spec(hex) {
    const h = String(hex).toUpperCase(); if (cache.has(h)) return cache.get(h);
    const c = new SP.Color(h), R = c.R.map(r => Math.min(1, Math.max(FLOOR, r)));
    const o = { hex: h, ks: R.map(r => ((1 - r) * (1 - r)) / (2 * r)), lab: new SP.Color(R).OKLab };
    cache.set(h, o); return o;
  }
  const KM = ks => 1 + ks - Math.sqrt(ks * ks + 2 * ks);
  /** [[spec, 割合], …] を混ぜる。{ lab, color }（hex はあとで） */
  function mixSpecs(list) {
    const n = list[0][0].ks.length, total = list.reduce((s, x) => s + x[1], 0), R = new Array(n);
    for (let i = 0; i < n; i++) { let k = 0; for (let j = 0; j < list.length; j++) k += list[j][0].ks[i] * list[j][1]; R[i] = KM(k / total); }
    const c = new SP.Color(R);
    return { lab: c.OKLab, color: c };
  }
  const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  /** 見た目の近さ（OKLab の距離。0.02 で見分けがつき始める）。色味（色相）が大きく違うときは、近くても「難しい」にする */
  function level(d, tl, rl) {
    const ct = Math.hypot(tl[1], tl[2]), cr = Math.hypot(rl[1], rl[2]);
    let dh = Math.abs(Math.atan2(tl[2], tl[1]) - Math.atan2(rl[2], rl[1])) * 180 / Math.PI; if (dh > 180) dh = 360 - dh;
    if (ct > 0.04 && (cr < 0.015 || dh > 35) && d >= 0.02) return { id: 'far', name: '持っている色では難しい' };
    if (d < 0.02) return { id: 'same', name: 'ほぼ同じ色' };
    if (d < 0.04) return { id: 'near', name: 'かなり近い色' };
    if (d < 0.065) return { id: 'mood', name: '近い雰囲気の色' };
    return { id: 'far', name: '持っている色では難しい' };
  }
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // 淡い色は白をたっぷり（20:1 など）使う。多くしてよいのは1色だけ（ほかは少しずつ）
  const BIG = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 30, 40], SMALL = [1, 2, 3, 4], RATIO2 = [], RATIO3 = [], seenR = new Set();
  const addR = (list, r) => { const g = r.reduce(gcd), k = r.map(x => x / g).join(':'); if (!seenR.has(k)) { seenR.add(k); list.push(r.map(x => x / g)); } };
  BIG.forEach(a => SMALL.concat([5, 6]).forEach(b => { addR(RATIO2, [a, b]); addR(RATIO2, [b, a]); }));
  BIG.forEach(a => SMALL.forEach(b => SMALL.forEach(c => { addR(RATIO3, [a, b, c]); addR(RATIO3, [b, a, c]); addR(RATIO3, [b, c, a]); })));

  /** 持っている色（[{ id, hex, name }]）で、作りたい色に近い混ぜ方を探す。色の組み合わせが違うものを max 件 */
  function recipes(owned, targetHex, o) {
    o = o || {};
    const max = o.max || 3, cands = owned.filter(c => c && HEX.test(c.hex)).slice(0, 60).map(c => Object.assign({ s: spec(c.hex) }, c));
    if (!HEX.test(targetHex) || !cands.length) return [];
    const tl = spec(targetHex).lab, all = [];
    const push = (items, m) => all.push({ items, lab: m.lab, color: m.color, d: dE(m.lab, tl) });
    cands.forEach(c => push([[c, 1]], mixSpecs([[c.s, 1]])));
    for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++)
      RATIO2.forEach(([a, b]) => push([[cands[i], a], [cands[j], b]], mixSpecs([[cands[i].s, a], [cands[j].s, b]])));
    // 3色は、2色までで目標に近づけた色だけで試す（数が多いと遅い）
    const best = new Map();
    all.forEach(r => r.items.forEach(([c]) => { if (!best.has(c.id) || best.get(c.id) > r.d) best.set(c.id, r.d); }));
    const top = cands.filter(c => best.has(c.id)).sort((a, b) => best.get(a.id) - best.get(b.id)).slice(0, 8);
    for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) for (let k = j + 1; k < top.length; k++)
      RATIO3.forEach(([a, b, c]) => push([[top[i], a], [top[j], b], [top[k], c]], mixSpecs([[top[i].s, a], [top[j].s, b], [top[k].s, c]])));
    // 色の数が少なく、割合が単純なほうを少しだけ優先する（量りやすい）
    // 色味（色相）がずれたものは、距離が近くても後ろへ
    const ct = Math.hypot(tl[1], tl[2]), th = Math.atan2(tl[2], tl[1]);
    const hueOff = r => { if (ct <= 0.04) return 0; let dh = Math.abs(Math.atan2(r.lab[2], r.lab[1]) - th) * 180 / Math.PI; if (dh > 180) dh = 360 - dh; return dh > 35 || Math.hypot(r.lab[1], r.lab[2]) < 0.015 ? 0.05 : 0; };
    const score = r => r.d + hueOff(r) + 0.006 * (r.items.length - 1) + 0.0003 * r.items.reduce((s, x) => s + x[1], 0);
    all.forEach(r => { r.sc = score(r); });
    all.sort((a, b) => a.sc - b.sc);
    const seen = new Set(), out = [];
    for (const r of all) {
      const key = r.items.map(([c]) => c.id).sort().join('+');
      if (seen.has(key)) continue; seen.add(key);
      out.push(finish(r, tl));
      if (out.length >= max) break;
    }
    return out;
  }
  function finish(r, tl) {
    const items = r.items.map(([c, parts]) => ({ id: c.id, hex: c.hex, name: c.name, parts, light: c.s.lab[0] })).sort((a, b) => b.parts - a.parts || b.light - a.light);
    return { items, hex: r.color.toString({ format: 'hex' }), d: Math.round(r.d * 1000) / 1000, level: level(r.d, tl, r.lab) };
  }
  /** 持っている色に1本足すなら（SHOP の単色から）。今より大きく近づくときだけ返す */
  function suggestBuy(owned, targetHex, kind) {
    if (!T.SHOP || !HEX.test(targetHex)) return null;
    const now = recipes(owned, targetHex, { max: 1 })[0], nowD = now ? now.d : 1;
    if (now && now.level.id === 'same') return null;
    const have = new Set(owned.map(c => c.shop).filter(Boolean));
    const shop = T.SHOP.ITEMS.filter(it => it.apply.paint && it.apply.paint.t === 'one_color' && (kind === 'polish' ? it.illo === 'polish' : it.illo === 'gel') && !have.has(it.id));
    let best = null;
    shop.forEach(it => {
      const r = recipes(owned.concat([{ id: 'buy:' + it.id, hex: it.apply.paint.c.base, name: T.shop ? T.shop.short(it) : it.name }]), targetHex, { max: 1 })[0];
      if (r && r.items.some(x => x.id === 'buy:' + it.id) && (!best || r.d < best.recipe.d)) best = { item: it, recipe: r };
    });
    return best && best.recipe.level.id !== 'far' && best.recipe.d < Math.min(0.05, nowD - 0.02) ? best : null;
  }
  /** 混ぜ方の手順（読み上げにも使う） */
  function howTo(r, kind) {
    const it = r.items, unit = kind === 'polish' ? '滴' : 'すくい';
    if (it.length === 1) return [`${it[0].name}をそのまま使う。`];
    const few = it[0].parts >= 8 * Math.max(...it.slice(1).map(x => x.parts));
    const steps = [few ? `${it[0].name}をパレット（アルミホイルでもよい）に多めに出す（割合 ${it[0].parts}）。` : `${it[0].name}を${it[0].parts}${unit}、パレット（アルミホイルでもよい）に出す。`];
    it.slice(1).forEach(x => steps.push(`${x.name}を${few ? `つまようじの先ほどずつ（割合 ${x.parts}）足し、色を見ながら` : `${x.parts}${unit}`}${!few && x.light < 0.5 ? '。暗い色・濃い色は強いので、半分ずつ足して色を見ながら' : ''}混ぜる。`));
    steps.push(kind === 'polish' ? '混ぜたら早めに塗る。マニキュアは同じメーカー同士で。' : 'スティックでムラが消えるまで混ぜ、1本に薄く塗って硬化し、色を確かめる（硬化で少し変わる）。');
    return steps;
  }
  const ratioText = r => r.items.map(x => `${x.name} ${x.parts}`).join(' : ');

  // ---- 色の名前 → 色。辞書（基本の色名・色から探すの色・ことばの辞書）を先に、無ければ AI
  const BASIC = [['赤', '#D7263D'], ['朱色', '#E8462F'], ['ピンク', '#F2A0B8'], ['桃色', '#F4A7B9'], ['オレンジ', '#F28C28'], ['橙', '#F08300'], ['黄色', '#F5D000'], ['黄', '#F5D000'], ['レモン', '#F7E35A'],
    ['黄緑', '#A6CE39'], ['緑', '#2E9A55'], ['深緑', '#1E5B3A'], ['エメラルド', '#1F9E89'], ['ミントグリーン', '#A8DCC8'], ['セージ', '#A7B39A'], ['モスグリーン', '#6B7A3C'], ['オリーブ', '#808036'],
    ['水色', '#8FD3F0'], ['空色', '#8EC9EE'], ['青', '#2051A8'], ['藍色', '#22346B'], ['紺', '#1F2A48'], ['紫', '#6A3D9A'], ['茶色', '#7B4B2A'], ['茶', '#7B4B2A'], ['ベージュ', '#DCC2A8'],
    ['白', '#F6F2EE'], ['黒', '#2B2226'], ['灰色', '#9C9A9E'], ['グレー', '#9C9A9E'], ['ワインレッド', '#7A1E33'], ['コーラル', '#F28B7C'], ['サーモンピンク', '#F4A08C'], ['くすみピンク', '#D8A7AE'],
    ['シアン', '#00A0E9'], ['マゼンタ', '#E4007F'], ['イエロー', '#FFE100']];
  function dictionary() {
    const m = new Map();
    BASIC.forEach(([w, h]) => m.set(w, h));
    (T.COLORS || []).forEach(c => { if (!m.has(c.name)) m.set(c.name, c.hex); });
    ((T.KOTOBA && T.KOTOBA.WORDS) || []).forEach(e => { if (e.colors && e.colors[0] && !m.has(e.w)) m.set(e.w, e.colors[0]); });
    return m;
  }
  let dict = null;
  /** 辞書で読む。長い名前から当てる（「ミントグリーン」を「グリーン」より先に） */
  function wordColor(text) {
    const t = String(text || '').trim(); if (!t) return null;
    if (HEX.test(t)) return { hex: t.toUpperCase(), name: t.toUpperCase(), by: 'hex' };
    dict = dict || dictionary();
    if (dict.has(t)) return { hex: dict.get(t), name: t, by: 'dict' };
    const hit = Array.from(dict.keys()).filter(w => t.includes(w)).sort((a, b) => b.length - a.length)[0];
    return hit ? { hex: dict.get(hit), name: hit, by: 'dict' } : null;
  }
  async function aiColor(text) {
    const schema = { type: 'OBJECT', properties: { hex: { type: 'STRING' }, name: { type: 'STRING' } }, required: ['hex', 'name'] };
    const prompt = `ネイル（ジェル・マニキュア）の色として、次の色の名前を #RRGGBB の1色にする。name は日本語の短い色名。\n色の名前: 「${T.ai.mask(text).slice(0, 40)}」`;
    const r = await T.ai.generateJSON(prompt, schema, { temperature: 0.2, maxTokens: 256 });
    const d = r && r.data;
    if (!d || typeof d.hex !== 'string' || !HEX.test(d.hex)) return null;
    return { hex: d.hex.toUpperCase(), name: String(d.name || text).replace(/[<>&"'`]/g, '').slice(0, 16), by: 'ai', model: r.model };
  }
  /** 三原色の目安（解説と「三原色セット」） */
  const PRIMARIES = [{ name: 'シアン', hex: '#00A0E9' }, { name: 'マゼンタ', hex: '#E4007F' }, { name: 'イエロー', hex: '#FFE100' }, { name: 'ホワイト', hex: '#F6F2EE' }, { name: 'ブラック', hex: '#2B2226' }];
  /** 三原色と白・黒があったら、どう混ぜるか（「持っていると何でも作れる」の見本） */
  const withPrimaries = targetHex => recipes(PRIMARIES.map(p => ({ id: 'p:' + p.name, hex: p.hex, name: p.name })), targetHex, { max: 1 })[0] || null;
  T.mix = { withPrimaries, spec, mixSpecs, recipes, suggestBuy, howTo, ratioText, level, wordColor, aiColor, PRIMARIES, mixHex: list => mixSpecs(list.map(([h, p]) => [spec(h), p])).color.toString({ format: 'hex' }) };
})(typeof window !== 'undefined' ? window : globalThis);
