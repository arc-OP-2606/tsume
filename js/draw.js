/* tsumé — 描くモード（計算と保存）。大きな1本の爪に描いた線から、作り方の手順・シール・保存を作る。画面は js/views-draw.js。
   座標は爪の横幅を 0〜100、長さを 0〜100 にした値（爪の長さを変えても同じ絵）。線の太さ w は、爪の横幅 100 に対する値。
   点は [x, y] か [x, y, 筆圧 0〜1]（タッチペンのときだけ） */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const HEX = /^#[0-9a-fA-F]{6}$/, ID = /^[\w-]{1,40}$/;
  const KEY = 'tsume.drawings.v1', MAX_SAVED = 20, MAX_STROKES = 300, MAX_PTS = 800, MAX_TOTAL = 6000;
  const SHAPES = () => (T.SHAPES || []).map(s => s.id), LENGTHS = () => (T.LENGTHS || []).map(l => l.id);
  const FINGERS = ['親指', '人差し指', '中指', '薬指', '小指'];
  // よく使う10色
  const COLORS = [
    { hex: '#FFFFFF', name: '白' }, { hex: '#1E1A1C', name: '黒' }, { hex: '#C8323E', name: '赤' }, { hex: '#E89AAE', name: 'ピンク' }, { hex: '#D9B99B', name: 'ベージュ' },
    { hex: '#C8A96A', name: 'ゴールド' }, { hex: '#2E4A8B', name: '青' }, { hex: '#4F8A5B', name: '緑' }, { hex: '#F2C94C', name: '黄色' }, { hex: '#8E6BB8', name: '紫' },
  ];
  // 太さは 細・中・太（爪の横幅 100 に対して）
  const TOOLS = {
    liner: { name: 'ライナー', sizes: [1.2, 2, 3.2] },
    brush: { name: '太筆', sizes: [6, 9, 13] },
    dot: { name: 'ドット', sizes: [3, 5, 8] },
    bg: { name: '地色' },
  };
  const KIND_NAME = { base: '地色', fill: '太筆の面', coat: 'クリア', line: '線', dot: '点', top: 'トップ' };
  const fin = v => typeof v === 'number' && isFinite(v);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = v => Math.round(v * 10) / 10;
  const f = n => (Math.round(n * 100) / 100).toString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeName = s => String(s == null ? '' : s).replace(/[<>&"'`]/g, '').trim().slice(0, 20);
  const newId = p => (p || 'd') + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);

  // ---- 掃除（保存データ・ほかの画面から来た絵）。知らない道具・壊れた点は捨てる
  function clean(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.id !== 'string' || !ID.test(v.id)) return null;
    const strokes = []; let total = 0;
    (Array.isArray(v.strokes) ? v.strokes : []).slice(0, MAX_STROKES).forEach(s => {
      if (!s || typeof s !== 'object' || !TOOLS[s.t] || s.t === 'bg' || !HEX.test(s.c || '')) return;
      let pts = (Array.isArray(s.pts) ? s.pts : []).slice(0, MAX_PTS).filter(q => Array.isArray(q) && fin(q[0]) && fin(q[1])).map(q => {
        const o = [r1(clamp(q[0], 0, 100)), r1(clamp(q[1], 0, 100))];
        if (fin(q[2])) o.push(Math.round(clamp(q[2], 0, 1) * 100) / 100);
        return o;
      });
      if (s.t === 'dot') pts = pts.slice(0, 1);
      if (!pts.length || total + pts.length > MAX_TOTAL) return;
      total += pts.length;
      strokes.push({ t: s.t, c: s.c.toUpperCase(), w: fin(s.w) ? clamp(s.w, 0.5, 20) : 2, pts });
    });
    const bg = HEX.test(v.bg || '') ? v.bg.toUpperCase() : null;
    const src = v.names && typeof v.names === 'object' ? v.names : {}, names = {};
    const str = k => (Object.prototype.hasOwnProperty.call(src, k) && typeof src[k] === 'string' ? src[k] : '');
    new Set(strokes.map(s => s.c).concat(bg ? [bg] : [])).forEach(h => { const n = safeName(str(h) || str(h.toLowerCase())); if (n) names[h] = n; });
    return {
      id: v.id, v: 1, ts: fin(v.ts) ? Math.round(clamp(v.ts, 0, 1e13)) : 0,
      finger: fin(v.finger) ? Math.round(clamp(v.finger, 0, 4)) : 2,
      shape: SHAPES().includes(v.shape) ? v.shape : 'oval', length: LENGTHS().includes(v.length) ? v.length : 'medium',
      bg, names, strokes,
    };
  }
  /** 新しい白紙の絵。o: { finger, shape, length, bg } */
  function blank(o) {
    o = o || {};
    return clean({ id: newId('d'), ts: Date.now(), finger: fin(o.finger) ? o.finger : 2, shape: o.shape, length: o.length, bg: o.bg || null, names: o.names || {}, strokes: [] });
  }

  // ---- 端末に保存（最大20枚。新しい順）
  function hasStore() { try { return typeof localStorage !== 'undefined' && !!localStorage; } catch (e) { return false; } }
  function rawAll() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function readAll(raw) { try { const v = JSON.parse(raw === undefined ? rawAll() : raw); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function writeAll(arr) {
    if (!hasStore()) return false;
    let a = arr.slice(0, MAX_SAVED);
    // 入りきらないときは、古い絵から外して入れ直す
    for (;;) {
      try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { if (a.length <= 1) return false; a = a.slice(0, -1); }
    }
  }
  // 画面は1本描くたびに描き直すので、保存の中身が変わっていなければ前の掃除の結果を使う（20枚×6000点でも重くしない）
  let cache = { raw: undefined, list: [] };
  function list() {
    const raw = rawAll();
    if (raw === cache.raw) return cache.list.slice();
    const seen = new Set();
    const out = readAll(raw).map(clean).filter(d => d && !seen.has(d.id) && seen.add(d.id)).sort((a, b) => b.ts - a.ts).slice(0, MAX_SAVED);
    cache = { raw, list: out };
    return out.slice();
  }
  /** 保存（同じ id は上書き）。保存した絵を返す。保存できなければ null */
  function save(drawing) {
    const c = clean(drawing); if (!c) return null;
    c.ts = Date.now();
    return writeAll([c].concat(list().filter(x => x.id !== c.id))) ? clean(c) : null;
  }
  function remove(id) {
    const all = list(), next = all.filter(x => x.id !== id);
    return next.length !== all.length && writeAll(next);
  }
  // 開いた絵は書き換えるので、一覧とは別の物を返す
  const get = id => { const x = list().find(v => v.id === id); return x ? clean(x) : null; };

  // ---- 色の名前（絵が持つ名前 → よく使う色 → 持っている色 → 近い色の名前 → 色の番号）
  function nameOf(d, hex) {
    const h = String(hex || '').toUpperCase();
    if (d && d.names && d.names[h]) return d.names[h];
    const c = COLORS.find(x => x.hex === h); if (c) return c.name;
    const st = T.app && T.app.state, own = st && st.myColors && Array.isArray(st.myColors.gel) ? st.myColors.gel.find(x => x.hex === h) : null;
    if (own) return safeName(own.name) || h;
    try { if (T.mixView && T.mixView.nearName) return T.mixView.nearName(h); } catch (e) { /* 色の計算が無い */ }
    return h;
  }

  // ---- 筆（描き方レシピの担当が T.BRUSHES を作っていれば、その id。無ければ名前）
  const BRUSH_NAME = { base: '平筆', fill: '太筆', line: 'ライナー', dot: 'ドットペン', top: '平筆' };
  const BRUSH_RE = { line: /liner|ライナー|細/i, fill: /flat|oval|square|平|オーバル|スクエア|フラット|太/i, dot: /dot|ドット/i, base: /flat|平|フラット|base|ベース/i, top: /flat|平|フラット|top|トップ/i };
  const BRUSH_KEYS = { line: ['liner', 'line'], fill: ['fill', 'brush', 'flat', 'paint'], dot: ['dot', 'dotting', 'dots'], base: ['base', 'one_color'], top: ['top'] };
  // 筆の「描けるもの」（T.BRUSHES.LIST の draws）で選ぶ。太筆の面は小さな面を塗る筆（8mm の平筆は大きすぎる）
  const BRUSH_DRAWS = { fill: ['小さな面', '太い線'], line: ['細かい線', '細い線'], long: ['長い線'], dot: ['点'], base: ['地色', 'ベースとトップ'], top: ['ベースとトップ'] };
  function brushList() {
    const B = T.BRUSHES, L = B && B.LIST;
    if (Array.isArray(L)) return L.filter(b => b && typeof b === 'object' && typeof b.id === 'string');
    if (L && typeof L === 'object') return Object.keys(L).filter(id => L[id] && typeof L[id] === 'object').map(id => Object.assign({}, L[id], { id }));
    return [];
  }
  /** o.long: 長い線（毛の長いライナーがあれば、そちら） */
  function brushFor(role, o) {
    const fb = { id: null, name: BRUSH_NAME[role] || BRUSH_NAME.base }, all = brushList();
    if (role === 'coat') return brushFor('top');
    if (!all.length) return fb;
    const pick = b => ({ id: b.id, name: safeName(b.name) || fb.name });
    const tech = T.BRUSHES.BY_TECH;
    if (tech && typeof tech === 'object') {
      for (const k of BRUSH_KEYS[role]) {
        for (const id of [].concat(tech[k] || [])) { const b = typeof id === 'string' && all.find(x => x.id === id); if (b) return pick(b); }
      }
    }
    const words = (role === 'line' && o && o.long ? BRUSH_DRAWS.long : []).concat(BRUSH_DRAWS[role] || []);
    for (const w of words) { const b = all.find(x => Array.isArray(x.draws) && x.draws.includes(w)); if (b) return pick(b); }
    const label = b => `${b.id} ${b.name || ''}`;
    const hits = all.filter(x => BRUSH_RE[role].test(label(x)) && (role === 'line' || !BRUSH_RE.line.test(label(x))));
    const b = (role === 'line' && o && o.long && hits.find(x => /長い|ロング|long|_l$/i.test(label(x)))) || hits[0];
    if (b) return pick(b);
    return role === 'base' || role === 'top' ? brushFor('fill') : fb;
  }

  // ---- 手順の並び。地色は最初、トップは最後。間（面・線・点）は T.BRUSHES.ORDER_RULE があればそれに従う。
  // ORDER_RULE は決まりの文の並び（{ text }）。「面 → 線 → 点」の矢印・「薄い色から濃い色へ」「白のハイライトは最後」
  // 「ノンワイプ…線」「ライナー用のジェル」「少し描いては仮硬化」を読む。短い名前の並び（['面', '線', '点']）も読める
  const ART = ['fill', 'line', 'dot'];
  const KIND_RE = [['base', /base|ground|地|ベース/i], ['top', /top|トップ/i], ['dot', /dot|点|ドット/i], ['line', /line|線|ライナー/i], ['fill', /fill|brush|flat|面|太|塗/i]];
  const kindOf = x => { const s = typeof x === 'string' ? x : x && typeof x === 'object' ? String(x.kind || x.id || '') : ''; const hit = KIND_RE.find(([, re]) => re.test(s)); return hit ? hit[0] : null; };
  function rules() {
    const R = T.BRUSHES && T.BRUSHES.ORDER_RULE, out = { order: ART.slice(), lightFirst: false, whiteLast: false, coat: false, linerGel: false, bit: false };
    if (!R || (typeof R !== 'object' && typeof R !== 'string')) return out;
    const items = (Array.isArray(R) ? R : typeof R === 'string' ? [R] : Array.isArray(R.order) ? R.order : []).filter(x => !(x && typeof x === 'object' && x.tentative)); // 目安（tentative）の行は、並べ替えの根拠にしない
    const texts = items.map(x => (typeof x === 'string' ? x : x && typeof x === 'object' && typeof x.text === 'string' ? x.text : '')).filter(Boolean);
    const arrow = texts.find(t => t.includes('→') && t.split('→').map(kindOf).filter(k => ART.includes(k)).length >= 2);
    const seq = arrow ? arrow.split('→').map(kindOf)
      : items.map(x => (typeof x === 'string' ? (x.length <= 12 && !x.includes('。') ? kindOf(x) : null) : x && typeof x === 'object' && (x.kind || x.id) ? kindOf(x) : null));
    const ranked = []; seq.forEach(k => { if (ART.includes(k) && !ranked.includes(k)) ranked.push(k); });
    out.order = ranked.concat(ART.filter(k => !ranked.includes(k)));
    const any = re => texts.some(t => re.test(t));
    out.lightFirst = R.lightFirst === true || any(/薄い色から濃い色|明るい色から/) || (typeof R.colors === 'string' && /薄い|明るい|light/i.test(R.colors));
    out.whiteLast = any(/白.{0,12}最後/);
    out.coat = texts.some(t => /ノンワイプ/.test(t) && /線/.test(t));
    out.linerGel = any(/ライナー用/);
    out.bit = any(/少し描いては仮硬化/);
    return out;
  }
  const lumOf = hex => (T.colorUtil && T.colorUtil.lum ? T.colorUtil.lum(hex) : 0.5);

  const CURE_FULL = '（時間はお使いのジェルとライトの説明書で）';
  const TAIL = {
    change: '色を変える前に仮硬化（秒数はお使いのジェルの説明書で）。',
    next: '次へ進む前に仮硬化（秒数はお使いのジェルの説明書で）。',
    last: `描き終えたら硬化${CURE_FULL}。`,
  };
  /** 描いた線から作り方を組む → [{ text, brush, color, cure, kind, brushName, colorName, count }]。cure は 'full'（硬化）か 'tack'（仮硬化） */
  // 線の長さ（爪の横幅 100 に対して）
  const lenOf = (s, L) => s.pts.reduce((n, q, i) => (i ? n + Math.hypot(q[0] - s.pts[i - 1][0], ((q[1] - s.pts[i - 1][1]) * L) / 100) : 0), 0);
  function stepsFrom(drawing) {
    if (!drawing || typeof drawing !== 'object') return [];
    const d = clean(typeof drawing.id === 'string' && ID.test(drawing.id) ? drawing : Object.assign({}, drawing, { id: 'tmp' })); if (!d) return [];
    const R = rules(), L = lengthOf(d), KIND = { brush: 'fill', liner: 'line', dot: 'dot' }, groups = { fill: [], line: [], dot: [] };
    d.strokes.forEach(s => { const k = KIND[s.t], g = groups[k]; let e = g.find(x => x.c === s.c); if (!e) g.push(e = { c: s.c, n: 0, len: 0 }); e.n++; e.len = Math.max(e.len, lenOf(s, L)); });
    if (R.lightFirst) ART.forEach(k => groups[k].sort((a, b) => lumOf(b.c) - lumOf(a.c)));
    const step = (kind, text, color, cure, count, bo) => { const b = brushFor(kind, bo); return { kind, text, brush: b.id || b.name, brushName: b.name, color: color || null, colorName: color ? nameOf(d, color) : null, cure, count: count || 0 }; };
    // 面・線・点（色ごと）。白のハイライト（白い線・点）は最後に、と決まりにあれば最後へ
    let art = [];
    R.order.forEach(kind => groups[kind].forEach(g => art.push({ kind, c: g.c, n: g.n, long: g.len > 45 })));
    if (R.whiteLast) { const hi = a => a.kind !== 'fill' && lumOf(a.c) > 0.9; art = art.filter(a => !hi(a)).concat(art.filter(hi)); }
    // 細い線の前にノンワイプのクリア（決まりにあるとき）
    const firstLine = art.findIndex(a => a.kind === 'line');
    if (R.coat && firstLine >= 0) art.splice(firstLine, 0, { kind: 'coat' });
    const out = [];
    const bgName = d.bg ? nameOf(d, d.bg) : '';
    out.push(d.bg
      ? step('base', `ベースジェルを塗って硬化したら、地色の${bgName}を薄く塗って硬化${CURE_FULL}。ムラがあれば、もう一度塗って硬化。`, d.bg, 'full')
      : step('base', `ベースジェルを薄く塗って硬化${CURE_FULL}。地色は塗らず、爪の色を生かす。`, null, 'full'));
    const firstLineAt = art.findIndex(a => a.kind === 'line'); // 線のコツは最初の線にだけ書く
    art.forEach((a, i) => {
      if (a.kind === 'coat') { out.push(step('coat', `細い線の前に、ノンワイプのクリア（またはマットコート）を薄く塗って硬化${CURE_FULL}。表面がべたついたままだと、線がぼけるため。`, null, 'full')); return; }
      const nm = nameOf(d, a.c), b = brushFor(a.kind, { long: a.long }).name, next = art[i + 1];
      const tail = !next ? TAIL.last : next.kind === 'coat' || next.c === a.c ? TAIL.next : TAIL.change;
      const body = a.kind === 'fill' ? `${nm}を${b}に取り、描いた面を塗る。`
        : a.kind === 'line' ? `${nm}を${b}に少なめに取り、線（${a.n}本）を描く。${i === firstLineAt ? `${R.linerGel ? '線には、流れにくいライナー用のジェルが向く。' : ''}${R.bit ? '長い線は、少し描いては仮硬化。' : ''}` : ''}`
          : `${nm}を${b}に取り、点（${a.n}個）を置く。押しつけず、置くだけ。`;
      out.push(step(a.kind, body + tail, a.c, next ? 'tack' : 'full', a.n, { long: a.long }));
    });
    out.push(step('top', `トップジェルを全体と先端の断面に塗って硬化${CURE_FULL}。拭き取りが要るかは、トップジェルの説明書で。`, null, 'full'));
    return out;
  }

  // ---- 形と描画
  function geom(d) {
    try { const g = T.nailPath(d.shape, d.length); if (g && g.d && fin(g.L)) return g; } catch (e) { /* render.js が無い */ }
    return { d: 'M0,0 H100 V136 H0 Z', L: 136 };
  }
  const lengthOf = d => geom(d || {}).L;
  const pathOf = d => geom(d || {}).d;
  /** 筆圧つきの点の太さ（筆圧 0.5 で元の太さ。0.6〜1.4倍） */
  const widthAt = (s, p) => s.w * (fin(p) ? 0.6 + 0.8 * clamp(p, 0, 1) : 1);
  function avgWidth(s) {
    const ps = s.pts.map(q => q[2]).filter(fin);
    return ps.length ? widthAt(s, ps.reduce((a, b) => a + b, 0) / ps.length) : s.w;
  }
  const mid = (a, b) => (fin(a) && fin(b) ? (a + b) / 2 : fin(a) ? a : b);
  /** 1本の線の SVG（爪の座標 100×L） */
  function strokeSvg(s, L) {
    const P = s.pts.map(q => [q[0], (q[1] * L) / 100, q[2]]);
    if (s.t === 'dot' || P.length === 1) return `<circle cx="${f(P[0][0])}" cy="${f(P[0][1])}" r="${f(widthAt(s, P[0][2]) / 2)}" fill="${s.c}"/>`;
    const line = (pts, w) => `<path d="M${pts.map(q => `${f(q[0])},${f(q[1])}`).join(' L')}" fill="none" stroke="${s.c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (!P.some(q => fin(q[2]))) return line(P, s.w);
    // 筆圧: 太さが同じくらいの区間ごとにまとめる
    const ws = []; for (let i = 1; i < P.length; i++) ws.push(Math.max(0.5, Math.round(widthAt(s, mid(P[i - 1][2], P[i][2])) * 4) / 4));
    let out = '', start = 0;
    for (let i = 1; i <= ws.length; i++) if (i === ws.length || ws[i] !== ws[start]) { out += line(P.slice(start, i + 1), ws[start]); start = i; }
    return out;
  }
  let uid = 0;
  /** 絵の SVG（爪＋線）。o: { px, cls, linesCls, label } */
  function svg(drawing, o) {
    o = o || {};
    const d = clean(drawing); if (!d) return '';
    const { d: path, L } = geom(d), id = 'dwc' + (uid++).toString(36);
    const spec = d.bg ? { t: 'one_color', c: { base: d.bg } } : { t: 'bare_gloss' };
    let nail = '';
    try { nail = T.renderNail ? T.renderNail(spec, {}, { shape: d.shape, length: d.length, seed: 5, finger: d.finger }) : ''; } catch (e) { nail = ''; }
    if (!nail) nail = `<path d="${path}" fill="${d.bg || '#F0D2C6'}"/>`;
    const size = o.px ? ` width="${Math.round(o.px)}" height="${Math.round((o.px * (L + 12)) / 112)}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 ${L + 12}"${size}${o.cls ? ` class="${esc(o.cls)}"` : ''} role="img" aria-label="${esc(o.label || '描いた爪')}"><defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs>${nail}<g clip-path="url(#${id})"${o.linesCls ? ` class="${esc(o.linesCls)}"` : ''}>${d.strokes.map(s => strokeSvg(s, L)).join('')}</g><path d="${path}" fill="none" stroke="rgba(70,30,35,0.22)" stroke-width="1.3"/></svg>`;
  }

  // ---- シールにする（シール工房の「手描き」と同じ形: 100×100 の箱、太さ 0.5〜20）
  function insideFn(d) {
    if (typeof Path2D === 'undefined' || typeof document === 'undefined') return null;
    try { const g = document.createElement('canvas').getContext('2d'), p = new Path2D(pathOf(d)); return g ? (x, y) => g.isPointInPath(p, x, y) : null; } catch (e) { return null; }
  }
  function ownWidths() {
    try { const v = JSON.parse(localStorage.getItem('tsume.nailwidths.v1')); if (Array.isArray(v) && v.length === 5 && v.every(x => fin(x) && x >= 5 && x <= 22)) return v; } catch (e) { /* 無い */ }
    return null;
  }
  /** 爪の横幅（mm）。シール工房で測った自分の爪 → 手のセット M の目安 */
  function nailWidthMm(finger) {
    const own = ownWidths(); if (own) return own[finger];
    const H = T.stickers && T.stickers.HANDS && T.stickers.HANDS.M;
    return (Array.isArray(H) ? H : [15, 12, 13, 12, 9.5])[finger];
  }
  /** o: { count, id, inside(x, y) | null }。爪の外にはみ出した線は切る（ブラウザだけ。inside: null で切らない） */
  function toSticker(drawing, o) {
    o = o || {};
    const d = clean(drawing); if (!d) return null;
    const L = lengthOf(d), k = 100 / Math.max(100, L), inside = o.inside === undefined ? insideFn(d) : o.inside;
    const strokes = [];
    d.strokes.forEach(s => {
      const w = clamp(avgWidth(s) * k, 0.5, 20);
      let run = [];
      const flush = () => { if (run.length) strokes.push({ c: s.c, w: Math.round(w * 100) / 100, pts: run }); run = []; };
      s.pts.forEach(q => {
        const X = q[0], Y = (q[1] * L) / 100;
        if (typeof inside === 'function' && !inside(X, Y)) { flush(); return; }
        run.push([r1(clamp(50 + (X - 50) * k, 0, 100)), r1(clamp(50 + (Y - L / 2) * k, 0, 100))]);
      });
      flush();
    });
    if (!strokes.length) return null;
    // シールの箱は正方形。爪の長さ（＝横幅 × L/100）を箱の一辺にする
    const mm = Math.round(((nailWidthMm(d.finger) * Math.max(100, L)) / 100) * 2) / 2;
    const item = { id: ID.test(o.id || '') ? o.id : newId('w'), type: 'draw', kind: 'draw', w: mm, count: fin(o.count) ? o.count : 2, seed: 1, p: {}, strokes: strokes.slice(0, 400) };
    return T.stickers && T.stickers.cleanItem ? T.stickers.cleanItem(item) : item;
  }
  /** 白に近い線があるか（家庭用のプリンターでは白が刷れない） */
  const hasWhite = drawing => { const d = clean(drawing); return !!d && d.strokes.some(s => lumOf(s.c) > 0.9); };

  T.draw = { KEY, MAX_SAVED, COLORS, TOOLS, FINGERS, KIND_NAME, blank, clean, list, save, remove, get, nameOf, brushFor, stepsFrom, lengthOf, pathOf, widthAt, strokeSvg, svg, toSticker, nailWidthMm, hasWhite };
})(typeof window !== 'undefined' ? window : globalThis);
