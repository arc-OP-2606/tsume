/* tsumé — ことばで咲く。一行の言葉 → 色と条件 → 作れる3案と、その組み合わせだけの名前。
   作れるかどうかはエンジン（propose・build）が保証する。AI（Gemini）は読み取りと名前の上乗せで、使えないときは辞書だけで動く */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, K = T.KOTOBA;
  const { mix, darken } = T.colorUtil;
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const COND = ['season', 'mood', 'scene', 'tier', 'time', 'level', 'length'];
  const LISTS = () => ({ season: Object.keys(T.SEASONS), mood: T.MOODS.map(x => x.id), scene: T.SCENES.map(x => x.id), tier: T.TIERS.slice(), time: T.TIMES.map(x => x.id), level: T.LEVELS.map(x => x.id), length: T.LENGTHS.map(x => x.id) });
  function hsl(hex) {
    const n = parseInt(hex.slice(1), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return { h: 0, s: 0, l };
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
    return { h, s: d / (1 - Math.abs(2 * l - 1)), l };
  }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

  /** 辞書で読む。長い言葉から先に当て、重なった短い言葉は数えない */
  function parse(text) {
    const src = String(text || '').slice(0, 120); let rest = src; const hits = [];
    K.WORDS.forEach(e => { if (rest.includes(e.w)) { hits.push(e); rest = rest.split(e.w).join('\u0000'); } });
    hits.sort((a, b) => src.indexOf(a.w) - src.indexOf(b.w));
    const colors = [];
    [0, 1].forEach(i => hits.forEach(h => { const c = h.colors[i]; if (c && colors.length < 3 && !colors.includes(c)) colors.push(c); }));
    const cond = {}; hits.forEach(h => COND.forEach(k => { if (h[k]) cond[k] = h[k]; }));
    return { words: hits.map(h => h.w), colors, cond };
  }

  /** 1〜3色から、デザイン案の配色の役（地・差し色・濃い色・明るい色・先端・金属）を作る */
  function palette(colors, name) {
    const cs = colors.filter(c => HEX.test(c)).slice(0, 3);
    const byL = cs.slice().sort((a, b) => hsl(a).l - hsl(b).l), dark = byL[0], lite = byL[byL.length - 1];
    const a = cs[0], b = cs[1] || mix(a, '#FFFFFF', 0.45);
    const warm = cs.some(c => { const x = hsl(c); return x.s > 0.2 && (x.h < 70 || x.h > 300); });
    return { name: name || 'ことばの色', base: a, accent: b, tip: b, deep: hsl(dark).l < 0.3 ? dark : darken(dark, 0.3), light: mix(lite, '#FFFFFF', 0.6), metal: warm ? '#C8A96A' : '#C9CCD4' };
  }

  // ---- AI（Gemini）での読み取り。決めてよい値の一覧を渡し、返ってきた値は全部確かめる
  function schema() {
    const L = LISTS(), str = enumv => (enumv ? { type: 'STRING', enum: enumv } : { type: 'STRING' });
    return { type: 'OBJECT', properties: {
      colors: { type: 'ARRAY', items: { type: 'OBJECT', properties: { hex: str(), name: str() }, required: ['hex', 'name'] } },
      season: str(L.season), mood: str(L.mood), scene: str(L.scene), tier: str(L.tier), time: str(L.time), level: str(L.level), length: str(L.length),
      name: str(), reason: str(),
    }, required: ['colors', 'name', 'reason'] };
  }
  function prompt(text) {
    const L = LISTS(), names = (list, src) => list.map(id => `${id}=${(src.find(x => x.id === id) || {}).name || id}`).join(', ');
    return [
      'あなたはセルフネイルのデザイナー。次の一行の言葉から、ネイルの色と条件を決める。',
      `言葉: 「${T.ai.mask(text)}」`,
      '決めること:',
      '- colors: 言葉から浮かぶ色を1〜3色。hex は #RRGGBB。name は日本語の色名（例: 金木犀色）。いちばん大事な色を先に。',
      `- 当てはまるときだけ: season（${L.season.join(', ')}）、mood（${names(L.mood, T.MOODS)}）、scene（${names(L.scene, T.SCENES)}）、tier（${L.tier.join(', ')}）、time（${L.time.join(', ')}）、level（${L.level.join(', ')}）、length（${L.length.join(', ')}）。`,
      '- name: このネイルの名前。16文字以内。言葉の情景を残す（例: 金木犀と放課後のシアー）。',
      '- reason: なぜこの色と仕上げにしたか。40文字以内。',
      '人の名前・作品名・商品名は書かない。',
    ].join('\n');
  }
  function check(data) {
    if (!data || typeof data !== 'object') return null;
    const L = LISTS(), out = { colors: [], cond: {} };
    (Array.isArray(data.colors) ? data.colors : []).forEach(c => { if (c && typeof c.hex === 'string' && HEX.test(c.hex) && out.colors.length < 3) out.colors.push(c.hex.toUpperCase()); });
    COND.forEach(k => { if (L[k].includes(data[k])) out.cond[k] = data[k]; });
    const clean = (s, n) => String(s || '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
    out.name = clean(data.name, 20); out.reason = clean(data.reason, 50);
    return out.colors.length || out.name ? out : null;
  }

  // ---- 3案を作る
  // 名前に使う仕上げ: 手の多くの指に使っている塗り（地の技法）
  function techName(d) {
    const n = {}; d.left.forEach(f => { const t = f.over || f.t; if (E.BASE_TECHS.includes(t)) n[t] = (n[t] || 0) + 1; });
    const top = Object.keys(n).sort((a, b) => n[b] - n[a])[0] || d.left[0].t, t = T.TECHNIQUES[top];
    return t ? t.name.replace(/（.*?）/, '').replace(/^シアーワンカラー$/, 'シアー') : 'ワンカラー';
  }
  function compose(st, text, read, ai) {
    const season = read.cond.season || st.season;
    const colors = read.colors.length ? read.colors : T.SEASONS[season].colors.slice(0, 2).map(x => x[1]);
    // 名前には情景の言葉を使う（条件の言葉は除き、シーンの言葉は他に無いときだけ）
    const entry = x => K.WORDS.find(e => e.w === x) || {};
    const scenic = read.words.filter(x => entry(x).colors && entry(x).colors.length);
    const w = scenic.filter(x => !entry(x).scene).concat(scenic.filter(x => entry(x).scene));
    const sel = Object.assign({}, st.sel, read.cond, { color: colors[0], colorName: w[0] || '' });
    if (read.cond.scene == null && !st.answered.scene) sel.scene = null;
    const picks = [], seen = new Set();
    E.propose(sel, { season, seed: 0 }).forEach(p => { if (picks.length < 3 && !seen.has(p.concept.id)) { seen.add(p.concept.id); picks.push(p.concept.id); } });
    const key = 'k' + hash(colors.join('') + '|' + read.words.join('|'));
    const pal = palette(colors, read.words.length ? read.words.slice(0, 2).join('と') : 'ことばの色');
    st.palettes[key] = pal;
    const first = picks.length ? E.build(T.CONCEPTS.find(c => c.id === picks[0]), sel, { season, paletteIndex: key, palette: pal }) : null;
    const tn = first ? techName(first) : 'シアー';
    const name = (ai && ai.name) || (w.length ? `${w.slice(0, 2).join('と')}の${tn}` : `${T.SEASONS[season].name}の${tn}`);
    const reason = (ai && ai.reason) || (w.length ? `「${w.slice(0, 2).join('」「')}」の色を、${tn}で指先に。` : '言葉に合う色が見つからなかったので、今の季節の色で咲かせました。');
    return { text, words: read.words, colors, cond: read.cond, sel, season, key, picks, name, reason, ai: ai && ai.model ? ai.model : null };
  }
  /** 辞書だけで、すぐに返す */
  function local(st, text) { return compose(st, text, parse(text), null); }
  /** AI が使えれば読み直して返す（使えなければ null） */
  async function withAI(st, text) {
    const r = await T.ai.generateJSON(prompt(text), schema(), { temperature: 0.8, maxTokens: 512 });
    const a = r && check(r.data); if (!a) return null;
    const dict = parse(text);
    const read = { words: dict.words, colors: a.colors.length ? a.colors : dict.colors, cond: Object.assign({}, a.cond, dict.cond) };
    return compose(st, text, read, { name: a.name, reason: a.reason, model: r.model || 'gemini' });
  }
  /** 「もっと甘く」などで条件だけ変えて組み直す（名前と色はそのまま） */
  function retune(st, r, cond) { return compose(st, r.text, { words: r.words, colors: r.colors, cond }, { name: r.name, reason: r.reason, model: r.ai }); }
  T.kotoba = { parse, palette, check, schema, prompt, local, withAI, retune };
})(typeof window !== 'undefined' ? window : globalThis);
