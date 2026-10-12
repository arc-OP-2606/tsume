/* tsumé — 共有（F5）。今のデザインを小さなデータにして、リンク（#d=…）・カード画像（PNG）・共有シートで渡す。
   リンクの # より後ろはサーバーに送られない。受け取ったデータは必ず掃除してから使う（知らない値は捨てる。app.js の sanitizeCustom と同じ考え方）。
   QR は js/vendor/qrcode.js（qrcode-generator 2.0.4・MIT）。無ければ QR なしのカードにする */
(function (global) {
  'use strict';
  const T = global.TSUME;
  T.views = T.views || {};
  T.actions = T.actions || {};
  const hasDOM = typeof document !== 'undefined';
  const WEB = 'https://arc-op-2606.github.io/tsume/';
  const VER = 1, MAX_JSON = 6144, MAX_STR = 8192, MAX_PER_NAIL = 24, QR_MAX = 800;
  const HEX = /^#[0-9a-fA-F]{6}$/, ID = /^[\w-]{1,40}$/, WORD = /^[a-z0-9_]{1,24}$/, PKEY = /^k[\w-]{1,40}$/;
  const ROLES = ['base', 'tip', 'accent', 'deep', 'light', 'metal'];
  const SIDES = ['left', 'right', 'foot'];
  const SEL_KEYS = ['scene', 'tier', 'mood', 'topping', 'length', 'shape', 'scope', 'hand', 'method', 'time', 'level'];
  const NULLABLE = { scene: true, mood: true, topping: true };
  const own = (o, k) => !!o && typeof o === 'object' && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const num = v => typeof v === 'number' && isFinite(v);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clone = o => JSON.parse(JSON.stringify(o));
  const same = (a, b) => JSON.stringify(a == null ? null : a) === JSON.stringify(b == null ? null : b);
  const concept = id => (typeof id === 'string' && (T.CONCEPTS || []).find(c => c.id === id)) || null;
  const keyOf = (id, pi) => `${id}:${pi || 0}`;
  const xml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  // ---- 掃除（知らない値は捨てる。色は #rrggbb だけ。SVG にそのまま入るため）
  function options(k) {
    switch (k) {
      case 'scene': return T.SCENES;
      case 'tier': return (T.TIERS || []).map(id => ({ id }));
      case 'mood': return T.MOODS;
      case 'topping': return T.TOPPINGS && T.TOPPINGS.LEVELS;
      case 'length': return T.LENGTHS;
      case 'shape': return T.SHAPES;
      case 'scope': return T.SCOPES;
      case 'hand': return T.HANDS;
      case 'method': return T.METHODS;
      case 'time': return T.TIMES;
      case 'level': return T.LEVELS;
      default: return [];
    }
  }
  function cleanSel(s) {
    const def = T.engine.defaults(), out = {};
    SEL_KEYS.forEach(k => {
      const v = s && typeof s === 'object' ? s[k] : null;
      const ok = typeof v === 'string' && (options(k) || []).some(x => x.id === v);
      out[k] = ok ? v : (NULLABLE[k] ? null : def[k]);
    });
    return out;
  }
  const shopOk = id => !T.SHOP || !T.SHOP.byId || !!T.SHOP.byId(id);
  function cleanItem(t) {
    if (t && t.k === 'photo') t = T.scan && T.scan.toShared ? T.scan.toShared(t) : null; // 写真のパーツは画像（ref）を送らず、色と大きさの近いふつうのパーツにする
    const D = T.TOPPINGS;
    if (!t || typeof t !== 'object' || !own(D.KINDS, t.k) || !num(t.x) || !num(t.y)) return null;
    const o = { k: t.k, x: Math.round(clamp(t.x, 0, 1) * 1000) / 1000, y: Math.round(clamp(t.y, 0, 1) * 1000) / 1000 };
    if (own(D.SIZES, t.s)) o.s = t.s;
    if (WORD.test(t.v || '')) o.v = t.v;
    if (WORD.test(t.shape || '')) o.shape = t.shape;
    if (num(t.r)) { const r = Math.round(t.r) % 360; if (r) o.r = r; }
    if (num(t.z)) o.z = Math.round(clamp(t.z, 0.4, 2.5) * 100) / 100;
    if (HEX.test(t.col || '')) o.col = t.col;
    if (ID.test(t.shop || '') && shopOk(t.shop)) o.shop = t.shop;
    return o;
  }
  function cleanPaint(p) {
    if (!p || typeof p !== 'object' || !own(T.TECHNIQUES, p.t) || !p.c || typeof p.c !== 'object' || Array.isArray(p.c)) return null;
    const c = {}; Object.keys(p.c).forEach(r => { if (/^[a-z]{2,8}$/.test(r) && HEX.test(p.c[r])) c[r] = p.c[r]; });
    const o = { t: p.t, c };
    if (ID.test(p.shop || '') && shopOk(p.shop)) o.shop = p.shop;
    if (p.cover === true) o.cover = true;
    return o;
  }
  /** 1つのデザインの飾り { left, right, foot: 5本×パーツ, paint: { 手: 5本×塗り|null } } */
  function cleanCustom(cu) {
    if (!cu || typeof cu !== 'object' || Array.isArray(cu)) return null;
    const out = {};
    SIDES.forEach(side => { if (Array.isArray(cu[side]) && cu[side].length === 5) out[side] = cu[side].map(l => (Array.isArray(l) ? l.slice(0, MAX_PER_NAIL).map(cleanItem).filter(Boolean) : [])); });
    if (cu.paint && typeof cu.paint === 'object' && !Array.isArray(cu.paint)) {
      const paint = {};
      SIDES.forEach(side => { const a = cu.paint[side]; if (Array.isArray(a) && a.length === 5) { const list = a.map(cleanPaint); if (list.some(Boolean)) paint[side] = list; } });
      if (Object.keys(paint).length) out.paint = paint;
    }
    return Object.keys(out).length ? out : null;
  }
  function cleanPalette(p) {
    if (!p || typeof p !== 'object' || !ROLES.every(r => HEX.test(p[r]))) return null;
    const name = typeof p.name === 'string' ? p.name.replace(/[\u0000-\u001F<>&"'`\\]/g, '').trim().slice(0, 30) : '';
    const o = { name: name || 'ことばの色' }; ROLES.forEach(r => { o[r] = p[r]; });
    return o;
  }
  /** 共有データを掃除する。使えなければ null */
  function clean(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    const c = concept(o.conceptId); if (!c) return null;
    const out = { v: VER, conceptId: c.id, paletteIndex: 0 };
    if (typeof o.paletteIndex === 'string') {
      const p = PKEY.test(o.paletteIndex) ? cleanPalette(o.palette) : null;
      if (p) { out.paletteIndex = o.paletteIndex; out.palette = p; }
    } else if (Number.isInteger(o.paletteIndex) && o.paletteIndex >= 0 && o.paletteIndex < c.palettes.length) out.paletteIndex = o.paletteIndex;
    out.sel = cleanSel(o.sel);
    const cu = cleanCustom(o.custom); if (cu) out.custom = cu;
    out.skin = own(T.SKINS, o.skin) ? o.skin : 'natural';
    return out;
  }

  /** 今のデザイン（st.current）を共有データに */
  function pack(st) {
    const cur = st && st.current, c = cur && concept(cur.conceptId); if (!c) return null;
    const o = { conceptId: c.id, paletteIndex: cur.paletteIndex, sel: st.sel, custom: (st.custom || {})[keyOf(c.id, cur.paletteIndex)], skin: st.skin };
    if (typeof cur.paletteIndex === 'string') o.palette = (st.palettes || {})[cur.paletteIndex];
    else o.paletteIndex = +cur.paletteIndex || 0;
    return clean(o);
  }

  // ---- リンク用の短い形（キーを1文字に、パーツは配列に、右手が左手と同じなら 1）。
  //      肌の色はリンクに入れない（受け取った人は自分の肌の色で見る。送る人の肌の色を外に出さない）
  function itemW(t) {
    const a = [t.k, Math.round(t.x * 1000), Math.round(t.y * 1000), t.s || '', t.v || '', t.shape || '', t.r || 0, t.col || '', t.shop || '', t.z ? Math.round(t.z * 100) : 0];
    while (a.length > 3 && (a[a.length - 1] === '' || a[a.length - 1] === 0)) a.pop();
    return a;
  }
  function itemU(a) {
    if (!Array.isArray(a)) return null;
    const o = { k: a[0], x: num(a[1]) ? a[1] / 1000 : NaN, y: num(a[2]) ? a[2] / 1000 : NaN };
    if (a[3]) o.s = a[3]; if (a[4]) o.v = a[4]; if (a[5]) o.shape = a[5];
    if (num(a[6]) && a[6]) o.r = a[6]; if (a[7]) o.col = a[7]; if (a[8]) o.shop = a[8]; if (num(a[9]) && a[9]) o.z = a[9] / 100;
    return o;
  }
  const paintW = p => (p ? [p.t, p.c].concat(p.shop || p.cover ? [p.shop || ''] : [], p.cover ? [1] : []) : 0);
  const paintU = a => (Array.isArray(a) ? { t: a[0], c: a[1], shop: a[2] || undefined, cover: a[3] === 1 } : null);
  function toWire(o) {
    const w = { v: VER, c: o.conceptId, p: o.paletteIndex, s: SEL_KEYS.map(k => o.sel[k] || '').join('.') };
    if (o.palette) w.q = [o.palette.name].concat(ROLES.map(r => o.palette[r]));
    const cu = o.custom;
    if (cu) {
      const u = {}, lists = a => a.map(l => l.map(itemW)), paints = a => a.map(paintW), pt = cu.paint || {};
      if (cu.left) u.l = lists(cu.left);
      if (cu.right) u.r = cu.left && same(cu.left, cu.right) ? 1 : lists(cu.right);
      if (cu.foot) u.f = lists(cu.foot);
      if (pt.left) u.pl = paints(pt.left);
      if (pt.right) u.pr = pt.left && same(pt.left, pt.right) ? 1 : paints(pt.right);
      if (pt.foot) u.pf = paints(pt.foot);
      w.u = u;
    }
    return w;
  }
  function fromWire(w) {
    const vals = typeof w.s === 'string' ? w.s.split('.') : [], sel = {};
    SEL_KEYS.forEach((k, i) => { sel[k] = vals[i] || null; });
    const o = { conceptId: w.c, paletteIndex: w.p, sel };
    if (Array.isArray(w.q) && w.q.length === 7) { o.palette = { name: w.q[0] }; ROLES.forEach((r, i) => { o.palette[r] = w.q[i + 1]; }); }
    const u = w.u;
    if (u && typeof u === 'object' && !Array.isArray(u)) {
      const lists = a => (Array.isArray(a) ? a.map(l => (Array.isArray(l) ? l.slice(0, MAX_PER_NAIL).map(itemU) : [])) : undefined);
      const paints = a => (Array.isArray(a) ? a.map(paintU) : undefined);
      o.custom = { left: lists(u.l), right: u.r === 1 ? lists(u.l) : lists(u.r), foot: lists(u.f), paint: { left: paints(u.pl), right: u.pr === 1 ? paints(u.pl) : paints(u.pr), foot: paints(u.pf) } };
    }
    return o;
  }

  // ---- base64url（UTF-8）
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function utf8(s) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(s);
    const b = unescape(encodeURIComponent(s)), out = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
    return out;
  }
  function fromUtf8(bytes) {
    if (typeof TextDecoder === 'function') return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    let b = ''; for (let i = 0; i < bytes.length; i++) b += String.fromCharCode(bytes[i]);
    return decodeURIComponent(escape(b));
  }
  function b64u(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const left = bytes.length - i, n = (bytes[i] << 16) | ((left > 1 ? bytes[i + 1] : 0) << 8) | (left > 2 ? bytes[i + 2] : 0);
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (left > 1 ? B64[(n >> 6) & 63] : '') + (left > 2 ? B64[n & 63] : '');
    }
    return out;
  }
  function unb64u(s) {
    if (s.length % 4 === 1) return null;
    const out = new Uint8Array(Math.floor((s.length * 3) / 4)); let buf = 0, bits = 0, o = 0;
    for (let i = 0; i < s.length; i++) {
      const v = B64.indexOf(s[i]); if (v < 0) return null;
      buf = ((buf << 6) | v) & 0xffffff; bits += 6;
      if (bits >= 8) { bits -= 8; out[o++] = (buf >> bits) & 255; }
    }
    return out.subarray(0, o);
  }
  const b64std = bytes => { const s = b64u(bytes).replace(/-/g, '+').replace(/_/g, '/'); return s + '==='.slice((s.length + 3) % 4); };

  /** 共有データ → リンク用の文字列（大きすぎる・使えないときは null） */
  function encode(obj) {
    const o = clean(obj); if (!o) return null;
    const bytes = utf8(JSON.stringify(toWire(o)));
    return bytes.length > MAX_JSON ? null : b64u(bytes);
  }
  /** リンク・#d=…・文字列 → 掃除した共有データか null */
  function decode(str) {
    if (typeof str !== 'string') return null;
    let s = str.trim(); const i = s.indexOf('#d=');
    if (i >= 0) s = s.slice(i + 3); else if (s.slice(0, 2) === 'd=') s = s.slice(2);
    s = s.split(/[&?#\s]/)[0];
    if (!s || s.length > MAX_STR || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
    const bytes = unb64u(s); if (!bytes || !bytes.length || bytes.length > MAX_JSON) return null;
    let j; try { j = JSON.parse(fromUtf8(bytes)); } catch (e) { return null; }
    if (!j || typeof j !== 'object' || Array.isArray(j)) return null;
    return clean(own(j, 'c') ? fromWire(j) : j);
  }
  const link = obj => { const s = encode(obj); return s ? WEB + '#d=' + s : null; };

  // ---- デザインを組み立てる（状態は変えない）
  function selOf(o) { return Object.assign(T.engine.defaults(), o.sel); }
  function design(obj) {
    const o = clean(obj); if (!o) return null;
    return T.engine.build(concept(o.conceptId), selOf(o), { season: T.app && T.app.state ? T.app.state.season : undefined, paletteIndex: o.paletteIndex, palette: o.palette || undefined, toppings: o.custom || undefined });
  }
  /** 手の絵（SVG 文字列）。opts.skin で肌の色を変える（受け取った人は自分の肌の色で見る） */
  function handArt(obj, opts) {
    opts = opts || {};
    const o = clean(obj); if (!o) return '';
    const d = design(o), sel = selOf(o), side = sel.hand === 'left' ? 'right' : 'left', skin = opts.skin || o.skin;
    if (d.foot) return T.renderFoot(d.foot, d.palette, { seed: 11, skin });
    return T.renderHand(side === 'left' ? d.left : d.right, d.palette, { side, skin, shape: sel.shape, length: sel.length, seed: 11, viewBox: opts.viewBox || '50 50 320 380' });
  }

  /** 開く: st.sel / st.current / st.custom / st.palettes に入れて作り方へ。
      自分で飾った同じデザイン（同じ配色）があれば消さずに、別の配色の番号で開く */
  function open(obj, st, opts) {
    opts = opts || {};
    const o = clean(obj), app = T.app; if (!o || !app) return false;
    st = st || app.state;
    st.palettes = st.palettes || {}; st.custom = st.custom || {};
    const c = concept(o.conceptId);
    let pi = o.paletteIndex;
    if (o.palette) {
      const have = st.palettes[pi];
      if (have && !same(cleanPalette(have), o.palette)) pi = 'ks' + hash(JSON.stringify(o.palette));
      st.palettes[pi] = clone(o.palette);
    }
    const mine = st.custom[keyOf(c.id, pi)];
    if (mine && !same(cleanCustom(mine), o.custom || null)) {
      const pal = cleanPalette(o.palette || c.palettes[o.paletteIndex]);
      pi = 'ks' + hash(c.id + JSON.stringify(o.custom || null) + JSON.stringify(pal));
      st.palettes[pi] = pal;
    }
    const k = keyOf(c.id, pi);
    if (o.custom) st.custom[k] = clone(o.custom); else delete st.custom[k];
    st.sel = Object.assign(T.engine.defaults(), o.sel);
    st.current = { conceptId: c.id, paletteIndex: pi };
    st.side = null; st.tab = 'look'; st.stepIdx = 0; st.sheet = null;
    app.persist();
    app.go('detail', opts.replace ? { replace: true } : undefined);
    if (opts.toast !== false) app.toast(opts.toast || 'デザインを開きました。あなたの肌の色で見ています');
    return true;
  }
  /** 起動時と、アドレスが #d=… に変わったとき。開けたら true。
      #d=… はアドレスから外す（戻るで #d=… に戻って、また開いてしまわないように） */
  let lastHash = null;
  function openFromHash(st) {
    if (!hasDOM) return false;
    const h = location.hash || '';
    if (!/^#d=/.test(h) || h === lastHash) return false;
    lastHash = h;
    const o = decode(h);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* 外せなくても開く */ }
    if (!o) { setTimeout(() => T.app && T.app.toast('このリンクは開けませんでした（途中で切れているかもしれません）'), 400); return false; }
    return open(o, st, { replace: true });
  }

  // ---- カード画像（1080×1350 の SVG → canvas → PNG。文字は端末の文字を使う。外のフォントは読まない）
  const W = 1080, H = 1350;
  const SERIF = "'Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','Noto Serif CJK JP',serif";
  const SANS = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic','Noto Sans JP','Noto Sans CJK JP',sans-serif";
  const LATIN = "'Didot','Bodoni 72','Georgia','Times New Roman',serif";
  const BASIC = ['base_gel', 'top_gel', 'peel_base', 'polish_base', 'polish_top'];
  const mainMaterials = d => d.materials.filter(m => !m.once && m.cat !== 'tool' && !BASIC.includes(m.id)).slice(0, 3);
  const cw = ch => (/[\x20-\x7E]/.test(ch) ? 0.56 : 1);
  /** 文字数（全角=1）で折り返す。入りきらない最後の行は … */
  function wrap(text, max, lines) {
    const out = []; let cur = '', w = 0;
    const chars = Array.from(String(text || ''));
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i], c = cw(ch);
      if (w + c > max && cur) {
        if (out.length === lines - 1) { out.push(cur.replace(/.$/u, '…')); return out; }
        out.push(cur); cur = ''; w = 0;
        if (ch === ' ') continue;
      }
      cur += ch; w += c;
    }
    if (cur) out.push(cur);
    return out;
  }
  const qrLib = () => global.qrcode || (typeof require === 'function' ? (() => { try { return require('./vendor/qrcode.js'); } catch (e) { return null; } })() : null);
  /** QR の黒い所を1本の path に（横につながる所はまとめる） */
  function qrPath(text) {
    const Q = qrLib(); if (!Q) return null;
    let q; try { q = Q(0, 'L'); q.addData(text); q.make(); } catch (e) { return null; }
    const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) { if (q.isDark(r, c)) { let e = c; while (e < n && q.isDark(r, e)) e++; d += `M${c} ${r}h${e - c}v1h${c - e}z`; c = e; } else c++; }
    }
    return { n, d };
  }
  const text = (x, y, size, fill, s, o) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="${(o && o.font) || SANS}"${o && o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o && o.weight ? ` font-weight="${o.weight}"` : ''}${o && o.ls ? ` letter-spacing="${o.ls}"` : ''}>${xml(s)}</text>`;
  /** カードの SVG（文字列）。opts.skin で肌の色を変える */
  function cardSvg(obj, opts) {
    opts = opts || {};
    const o = clean(obj); if (!o) return null;
    const d = design(o), sel = selOf(o), url = link(o);
    const INK = '#2B2226', INK2 = '#7A6B6F', GOLD = '#8A6A2F', ROSE = '#C9808A', BG = '#FAF6F2', PANEL = '#F3ECE6';
    const out = [`<rect width="${W}" height="${H}" fill="${BG}"/>`];
    // 見出し
    out.push(`<text x="72" y="118" font-size="62" fill="${INK}" font-family="${LATIN}" letter-spacing="2">tsum<tspan fill="${ROSE}">é</tspan></text>`);
    out.push(text(1008, 112, 24, INK2, 'セルフネイル・アトリエ', { anchor: 'end', ls: 2 }));
    out.push(`<rect x="72" y="148" width="936" height="2" fill="#C8A96A"/>`);
    const name = d.concept.name, nameSize = Math.min(64, Math.floor(900 / Math.max(1, Array.from(name).reduce((n, ch) => n + cw(ch), 0))));
    out.push(text(72, 236, nameSize, INK, name, { font: SERIF }));
    const scene = d.scene ? d.scene.name : '';
    out.push(text(72, 290, 28, INK2, [d.palette.name, scene].filter(Boolean).join(' ・ '), {}));
    // 手の絵（左）
    out.push(`<rect x="56" y="322" width="572" height="640" rx="40" fill="${PANEL}"/>`);
    const art = handArt(o, { skin: opts.skin || o.skin, viewBox: '64 80 304 344' });
    const box = d.foot ? { x: 76, y: 476, w: 532, h: 333 } : { x: 70, y: 336, w: 544, h: 612 };
    out.push(art.replace(/^<svg /, `<svg x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" preserveAspectRatio="xMidYMid meet" `));
    // おもな材料（右。1つ3行で高さを決める）
    out.push(text(664, 362, 24, GOLD, 'おもな材料', { ls: 3, weight: 700 }));
    mainMaterials(d).forEach((m, i) => {
      const y = 414 + i * 118;
      out.push(text(664, y, 28, INK, wrap(m.name, 12, 1)[0], {}));
      out.push(text(664, y + 36, 22, INK2, wrap(m.product, 15, 1)[0], {}));
      out.push(text(664, y + 68, 22, INK2, wrap(`${m.store}・約${m.subtotal.toLocaleString('ja-JP')}円`, 15, 1)[0], {}));
    });
    // めやす
    out.push(`<rect x="664" y="770" width="344" height="1.5" fill="#E9DDD6"/>`);
    out.push(text(664, 812, 24, GOLD, 'めやす', { ls: 3, weight: 700 }));
    out.push(text(664, 856, 28, INK, `材料 約${d.cost.total.toLocaleString('ja-JP')}円`, {}));
    out.push(text(664, 898, 28, INK, `時間 約${d.est.minutes}分`, {}));
    out.push(text(664, 940, 28, INK, `むずかしさ ${'●'.repeat(d.est.difficulty)}${'○'.repeat(Math.max(0, 5 - d.est.difficulty))}`, {}));
    // QR とことば（下）
    const qrText = url && url.length <= QR_MAX ? url : WEB, qr = qrPath(qrText);
    if (qr) {
      // 1マスを整数の px にする（にじむと読みにくい）。白いふちは4マス
      const n = qr.n + 8, k = Math.max(3, Math.floor(340 / n)), Q = n * k, QX = W - 72 - Q, QY = 990 + Math.round((340 - Q) / 2);
      out.push(`<rect x="${QX}" y="${QY}" width="${Q}" height="${Q}" fill="#FFFFFF"/><g transform="translate(${QX + 4 * k} ${QY + 4 * k}) scale(${k})"><path d="${qr.d}" fill="#111111" shape-rendering="crispEdges"/></g>`);
    }
    const toDesign = !!qr && qrText === url;
    const lead = toDesign ? ['QRを読みとると、', 'このデザインを試着できます'] : ['tsumé で、', '作り方と材料が見られます'];
    out.push(text(72, 1072, 34, INK, lead[0], { font: SERIF }));
    out.push(text(72, 1120, 34, INK, lead[1], { font: SERIF }));
    out.push(text(72, 1176, 22, INK2, toDesign ? '自分の肌の色の手で、材料と手順も見られます' : 'リンクはメッセージに付いています', {}));
    out.push(text(72, 1220, 22, INK2, 'arc-op-2606.github.io/tsume', { font: LATIN }));
    out.push(text(72, 1300, 17, '#7C6C70', '価格は2026年10月の調査に基づく目安（税込）。店・時期で変わります。', {}));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
  }
  /** カード画像（PNG の Blob）。ブラウザだけ */
  function card(obj, opts) {
    const svg = cardSvg(obj, opts);
    if (!svg) return Promise.reject(new Error('design'));
    if (!hasDOM || typeof Image === 'undefined') return Promise.reject(new Error('no-dom'));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = W; c.height = H;
          const g = c.getContext('2d'); g.fillStyle = '#FAF6F2'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H);
          c.toBlob(b => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error('svg'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  // ---- 送る（アプリ: ファイル付きの共有シート／Web: navigator.share（ファイル付き）／どちらも無理なら画像を保存してリンクをコピー）
  const cancelled = e => !!e && (e.name === 'AbortError' || /cancel/i.test(String(e.message || e)));
  function legacyCopy(txt) {
    if (!hasDOM) return false;
    const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove(); return ok;
  }
  function copyText(txt) {
    if (!txt) return Promise.resolve(false);
    try { if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(() => true, () => legacyCopy(txt)); } catch (e) { /* 下へ */ }
    return Promise.resolve(legacyCopy(txt));
  }
  function download(blob, name) {
    if (!hasDOM || !blob) return false;
    const u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
    return true;
  }
  async function nativeFile(blob, name, o) {
    const n = T.native; if (!n || !n.isNative || !blob) return false;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (n.shareFile) return n.shareFile(bytes, name, o);
    const P = global.Capacitor && global.Capacitor.Plugins;
    if (P && P.Filesystem && P.Share) {
      const r = await P.Filesystem.writeFile({ path: name, data: b64std(bytes), directory: 'CACHE' });
      await P.Share.share({ title: o.title, text: o.text, url: o.url || undefined, files: [r.uri] });
      return true;
    }
    if (n.sharePdf) { const c = await copyText(o.url); if (c && T.app) T.app.toast('リンクはコピーしました。メッセージに貼ってください'); await n.sharePdf(bytes, name); return 'copied'; }
    return false;
  }
  function message(o) {
    const d = design(o), url = link(o);
    return { title: `tsumé — ${d.concept.name}`, text: `tsumé のネイル「${d.concept.name}」${url ? '\nリンクを開くと、自分の手で試着できます。' : ''}`, url };
  }
  /** 共有する。opts.blob に作ってあるカード画像を渡すと、すぐ共有シートを開ける（Web はタップの直後でないと開けない）。
      返り値: 'shared' | 'saved'（画像を保存してリンクをコピー）| 'image'（画像だけ保存）| 'copied'（リンクだけコピー）| false（やめた・できない） */
  async function share(obj, opts) {
    opts = opts || {};
    const o = clean(obj); if (!o) return false;
    const m = message(o), name = `tsume-${o.conceptId}.png`, n = T.native, blob = opts.blob || null;
    const full = m.url ? `${m.text}\n${m.url}` : m.text;
    try {
      if (n && n.isNative) {
        const b = blob || await card(o).catch(() => null);
        const r = await nativeFile(b, name, m).catch(e => { if (cancelled(e)) throw e; return false; });
        if (r) return 'shared';
        await n.share({ title: m.title, text: m.text, url: m.url || undefined, dialogTitle: '共有する' });
        return 'shared';
      }
      if (typeof navigator !== 'undefined' && navigator.share) {
        const file = blob && typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
        // ファイルと一緒だと URL が落ちる共有先があるので、リンクは本文にも入れる
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: m.title, text: full }); return 'shared'; }
        await navigator.share({ title: m.title, text: m.text, url: m.url || WEB }); return 'shared';
      }
    } catch (e) {
      if (cancelled(e)) return false;
    }
    const saved = download(blob, name), copied = await copyText(m.url);
    return saved && copied ? 'saved' : saved ? 'image' : copied ? 'copied' : false;
  }

  // ---- 共有シート（作り方の画面の［共有］から）
  let prep = { key: null, obj: null, blob: null, img: null, busy: false, fail: false };
  function prepare(obj) {
    const key = JSON.stringify(obj);
    if (prep.key === key) return prep;
    if (prep.img && hasDOM) URL.revokeObjectURL(prep.img);
    prep = { key, obj, blob: null, img: null, busy: true, fail: false };
    const mine = prep;
    card(obj).then(b => { mine.blob = b; mine.img = URL.createObjectURL(b); }, () => { mine.fail = true; }).then(() => {
      mine.busy = false;
      if (prep === mine && T.app && T.app.state.sheet === 'sh-share') T.app.render();
    });
    return prep;
  }
  function shareSheet(st, op) {
    const U = T.ui, o = pack(st), ICON = U.ICON;
    const p = o ? prepare(o) : null, url = o && link(o), canPost = !!(T.gallery && T.gallery.canPost && T.gallery.canPost() && T.actions['gl-post-open']);
    const preview = !p ? '<p class="small muted">デザインを選んでください。</p>'
      : p.img ? `<img class="sh-img" src="${p.img}" alt="送る画像の見本（手の絵・材料・目安・QRコード）">`
      : `<div class="sh-wait">${p.fail ? 'この端末では画像を作れませんでした。リンクだけ送れます。' : '画像を作っています…'}</div>`;
    return `<div class="sheet-back${op}" data-act="sheet-close" aria-hidden="true"></div>
      <section class="sheet sh-sheet${op}" role="dialog" aria-modal="true" aria-label="共有する">
        <header class="sheet-head"><b>共有する</b><button class="iconbtn" data-act="sheet-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <div class="sh-preview">${preview}</div>
          <p class="small">画像には、手の絵・材料・目安・QRコードが入ります。リンクを開くと、受け取った人が自分の手で試着できます。</p>
          ${url ? '' : '<p class="cap-note">飾りが多すぎて、リンクにできません。画像だけ送れます。</p>'}
          <ul class="notes"><li>送るのはデザインだけです。名前や写真は入りません。</li><li>キャラクターやロゴ、人の作品をまねた柄は、送らないでください。</li></ul>
        </div>
        <footer class="sheet-foot sh-foot">
          <button class="btn rose block" data-act="sh-send" ${o ? '' : 'disabled'}>${ICON.share}画像とリンクを送る</button>
          <div class="sh-row"><button class="btn ghost" data-act="sh-copy" ${url ? '' : 'disabled'}>リンクをコピー</button><button class="btn ghost" data-act="sh-save" ${p && p.blob ? '' : 'disabled'}>画像を保存</button></div>
          <div class="sh-row">${T.actions.share ? '<button class="link" data-act="share">レシピを文章で送る</button>' : ''}${canPost ? `<button class="link" data-act="gl-post-open">${ICON.sparkle}みんなに見せる（投稿）</button>` : ''}</div>
        </footer>
      </section>`;
  }
  T.sheets = Object.assign(T.sheets || {}, { 'sh-share': shareSheet });

  Object.assign(T.actions, {
    'sh-open': (el, st) => { const o = pack(st); if (!o) { T.app.toast('デザインを選んでください'); return; } prepare(o); st.sheet = 'sh-share'; T.app.render(); },
    'sh-send': (el, st) => {
      const o = pack(st); if (!o) return;
      const b = prep.key === JSON.stringify(o) ? prep.blob : null;
      share(o, { blob: b }).then(r => {
        if (r === 'saved') T.app.toast('画像を保存して、リンクをコピーしました');
        else if (r === 'image') T.app.toast('画像を保存しました');
        else if (r === 'copied') T.app.toast('リンクをコピーしました。メッセージに貼ってください');
        // false は「やめた」か「できない」。共有の仕組みが無いのに false なら、できなかった
        else if (r === false && !(typeof navigator !== 'undefined' && navigator.share) && !(T.native && T.native.isNative)) T.app.toast('この端末では送れませんでした。「リンクをコピー」を使ってください');
      });
    },
    'sh-copy': (el, st) => { const u = link(pack(st)); if (!u) return; copyText(u).then(ok => T.app.toast(ok ? 'リンクをコピーしました' : 'コピーできませんでした')); },
    'sh-save': (el, st) => {
      const o = pack(st); if (!o || prep.key !== JSON.stringify(o) || !prep.blob) return;
      const name = `tsume-${o.conceptId}.png`;
      if (T.native && T.native.isNative) { nativeFile(prep.blob, name, message(o)).catch(() => {}); return; }
      if (download(prep.blob, name)) T.app.toast('画像を保存しました');
    },
  });
  if (hasDOM) window.addEventListener('hashchange', () => { if (/^#d=/.test(location.hash || '') && T.app) openFromHash(T.app.state); });

  T.share = { pack, clean, cleanCustom, cleanPalette, cleanSel, encode, decode, link, open, openFromHash, design, handArt, cardSvg, card, share, copyText, wrap, qrPath, WEB, MAX_JSON, MAX_STR, QR_MAX };
})(typeof window !== 'undefined' ? window : globalThis);
