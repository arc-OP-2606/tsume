/* tsumé — 自分のパーツ・シールを写真から取り込む（計算・画像の保存）。切り抜きは端末の中だけで、AI は使わない。
   cutout などの計算は DOM の無い node でも動く（test/scan.test.js）。画像は IndexedDB（'tsume' / 'images'）、使えなければメモリだけ */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const hasDOM = typeof document !== 'undefined';
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const KEY = /^[\w-]{1,60}$/;
  const COIN_MM = 20; // 1円玉の直径（造幣局「現在製造している貨幣」で確認 2026-10-12）
  const NAIL_MM = 13; // 爪の横幅の目安。爪の上に描くとき、パーツの mm をこの幅に対する割合にする
  const MAX_SIDE = 1536, PNG_SIDE = 256;
  const KINDS = [{ id: 'stone', name: 'ストーン' }, { id: 'pearl', name: 'パール' }, { id: 'metal', name: 'メタル' }, { id: 'sticker', name: 'シール' }, { id: 'other', name: 'その他' }];
  const DEFAULT_MM = { stone: 3, pearl: 3, metal: 5, sticker: 6, other: 4 };
  const SENS = { low: { k: 0.7, shadow: 1 }, mid: { k: 1, shadow: 0.75 }, high: { k: 1.4, shadow: 0.5 } };
  const f1 = v => (Math.round(v * 10) / 10).toString();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clampMm = v => (typeof v === 'number' && isFinite(v) ? clamp(Math.round(v * 10) / 10, 1, 30) : 4);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hex2 = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  const toHex = (r, g, b) => ('#' + hex2(r) + hex2(g) + hex2(b)).toUpperCase();

  // ---- 背景の色: 縁の画素に「明るさの傾き」つきの平面を当てはめる（照明のむらに強い）。外れ値は2回除く
  function solve3(A, b) {
    const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(A); if (Math.abs(D) < 1e-9) return null;
    return [0, 1, 2].map(i => det(A.map((row, r) => row.map((v, c) => (c === i ? b[r] : v)))) / D);
  }
  function fitPlane(S) { // S: [fx, fy, r, g, b]（fx・fy は 0〜1）
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0; const bz = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (const s of S) { n++; sx += s[0]; sy += s[1]; sxx += s[0] * s[0]; sxy += s[0] * s[1]; syy += s[1] * s[1]; for (let c = 0; c < 3; c++) { const v = s[2 + c]; bz[c][0] += v; bz[c][1] += v * s[0]; bz[c][2] += v * s[1]; } }
    const A = [[n, sx, sy], [sx, sxx, sxy], [sy, sxy, syy]];
    return bz.map(b => solve3(A, b) || [b[0] / Math.max(1, n), 0, 0]);
  }
  const at = (P, fx, fy) => P.map(p => p[0] + p[1] * fx + p[2] * fy);
  // 色の差: 明るさ（暗くなる方向は影かもしれないので弱める）と色み
  function diff(r, g, b, R, G, B, sw) {
    const y = 0.299 * r + 0.587 * g + 0.114 * b, Y = 0.299 * R + 0.587 * G + 0.114 * B;
    let dy = y - Y; if (dy < 0) dy *= sw;
    const dcb = (b - y) - (B - Y), dcr = (r - y) - (R - Y);
    return Math.sqrt(dy * dy + dcb * dcb + dcr * dcr);
  }
  const pct = (arr, q) => { if (!arr.length) return 0; const a = arr.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(q * a.length))]; };
  function robustBg(S) {
    let keep = S, P = fitPlane(keep);
    const res = list => list.map(s => { const c = at(P, s[0], s[1]); return diff(s[2], s[3], s[4], c[0], c[1], c[2], 1); });
    for (let it = 0; it < 2; it++) {
      const d = res(keep), cut = Math.max(pct(d, 0.5) * 3, 12), next = keep.filter((s, i) => d[i] <= cut);
      if (next.length < 12) break;
      keep = next; P = fitPlane(keep);
    }
    return { P, noise: pct(res(keep), 0.9), n: keep.length };
  }
  function borderSamples(img) {
    const { width: W, height: H, data } = img, band = Math.max(2, Math.round(Math.min(W, H) * 0.02));
    const step = Math.max(1, Math.floor(Math.sqrt((2 * band * (W + H)) / 6000))), S = [];
    const push = (x, y) => { const j = (y * W + x) * 4; S.push([x / (W - 1 || 1), y / (H - 1 || 1), data[j], data[j + 1], data[j + 2]]); };
    for (let y = 0; y < H; y += step) {
      const edgeRow = y < band || y >= H - band;
      for (let x = 0; x < W; x += step) if (edgeRow || x < band || x >= W - band) push(x, y);
    }
    return S;
  }

  // ---- 2値の画像の操作（正方形の窓。端の外は数えない）
  function boxOp(m, W, H, r, erode) {
    if (r < 1) return m;
    const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
    const pass = (src, dst, len, lines, idx) => {
      for (let l = 0; l < lines; l++) {
        let c = 0;
        for (let k = 0; k <= r && k < len; k++) c += src[idx(l, k)];
        for (let k = 0; k < len; k++) {
          const lo = k - r, hi = k + r, n = Math.min(hi, len - 1) - Math.max(lo, 0) + 1;
          dst[idx(l, k)] = erode ? (c === n ? 1 : 0) : (c > 0 ? 1 : 0);
          if (hi + 1 < len) c += src[idx(l, hi + 1)];
          if (lo >= 0) c -= src[idx(l, lo)];
        }
      }
    };
    pass(m, tmp, W, H, (y, x) => y * W + x);
    pass(tmp, out, H, W, (x, y) => y * W + x);
    return out;
  }
  // つながった塊（8近傍）に番号をつける
  function label(m, W, H) {
    const N = W * H, lab = new Int32Array(N), stack = new Int32Array(N), comps = [];
    let n = 0;
    for (let i = 0; i < N; i++) {
      if (!m[i] || lab[i]) continue;
      n++; let sp = 0, area = 0, x0 = W, y0 = H, x1 = -1, y1 = -1, sx = 0, sy = 0;
      stack[sp++] = i; lab[i] = n;
      while (sp) {
        const p = stack[--sp], x = p % W, y = (p - x) / W;
        area++; sx += x; sy += y;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= H) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= W) continue;
            const q = yy * W + xx; if (m[q] && !lab[q]) { lab[q] = n; stack[sp++] = q; }
          }
        }
      }
      comps.push({ id: n, area, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, cx: sx / area, cy: sy / area, edge: x0 === 0 || y0 === 0 || x1 === W - 1 || y1 === H - 1 });
    }
    return { lab, comps };
  }
  // 塊の中の小さな穴（透明なストーンの真ん中など）を埋める。大きな穴（輪のパーツ）は残す
  function fillHoles(m, W, H, maxHole) {
    const inv = new Uint8Array(W * H); for (let i = 0; i < inv.length; i++) inv[i] = m[i] ? 0 : 1;
    const { lab, comps } = label(inv, W, H), fill = new Uint8Array(comps.length + 1);
    comps.forEach(c => { if (!c.edge && c.area <= maxHole) fill[c.id] = 1; });
    const out = m.slice(); for (let i = 0; i < out.length; i++) if (!out[i] && fill[lab[i]]) out[i] = 1;
    return out;
  }
  function segment(img, P, thr, sw) {
    const { width: W, height: H, data } = img, m = new Uint8Array(W * H), t2 = thr * thr;
    const [pr, pg, pb] = P, ix = 1 / (W - 1 || 1), iy = 1 / (H - 1 || 1), dR = pr[1] * ix, dG = pg[1] * ix, dB = pb[1] * ix;
    for (let y = 0; y < H; y++) {
      const fy = y * iy;
      let R = pr[0] + pr[2] * fy, G = pg[0] + pg[2] * fy, B = pb[0] + pb[2] * fy;
      for (let x = 0, i = y * W; x < W; x++, i++, R += dR, G += dG, B += dB) {
        const j = i << 2, r = data[j], g = data[j + 1], b = data[j + 2];
        const yy = 0.299 * r + 0.587 * g + 0.114 * b, Y = 0.299 * R + 0.587 * G + 0.114 * B;
        let dy = yy - Y; if (dy < 0) dy *= sw;
        const dcb = (b - yy) - (B - Y), dcr = (r - yy) - (R - Y);
        if (dy * dy + dcb * dcb + dcr * dcr > t2) m[i] = 1;
      }
    }
    return m;
  }
  function pass(img, bg, o) {
    const { width: W, height: H } = img, N = W * H, sens = SENS[o.sens] || SENS.mid;
    const thr = o.thresh || clamp(bg.noise * 2.5 + 10, 16, 90) * sens.k;
    const r = Math.max(1, Math.round(Math.max(W, H) / 700));
    const raw = segment(img, bg.P, thr, sens.shadow);
    let m = boxOp(boxOp(raw, W, H, r, true), W, H, r, false); // 開く: 小さなごみを消す
    const grow = boxOp(m, W, H, r, false); for (let i = 0; i < N; i++) m[i] = grow[i] & raw[i]; // 開いて欠けたふちを戻す（大きさを正しく）
    m = boxOp(boxOp(m, W, H, r + 1, false), W, H, r + 1, true); // 閉じる: 切れた所をつなぐ
    m = fillHoles(m, W, H, Math.max(16, Math.round(N * 0.0004)));
    return Object.assign(label(m, W, H), { thr });
  }
  function rgbOf(img, lab, c, central) {
    const { width: W, data } = img;
    const hw = central ? c.w * 0.25 : Infinity, hh = central ? c.h * 0.25 : Infinity;
    let R = 0, G = 0, B = 0, n = 0;
    for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) {
      if (lab[y * W + x] !== c.id || Math.abs(x - c.cx) > hw || Math.abs(y - c.cy) > hh) continue;
      const j = (y * W + x) * 4; R += data[j]; G += data[j + 1]; B += data[j + 2]; n++;
    }
    return n ? [R / n, G / n, B / n, n] : null;
  }

  /** 写真（ImageData か {width,height,data}）から、パーツを1個ずつ。返り値 [{ x, y, w, h, area, color, cx, cy, edge, mask }]
   *  opts: { sens: 'low'|'mid'|'high', minArea, maxPieces, mask:false で mask を付けない } */
  function cutout(img, opts) {
    const o = opts || {};
    if (!img || !(img.width > 2) || !(img.height > 2) || !img.data || img.data.length < img.width * img.height * 4) return [];
    const { width: W, height: H } = img, N = W * H;
    const minArea = o.minArea || Math.max(16, Math.round(N * 0.00002)), maxPieces = o.maxPieces || 60;
    let bg = robustBg(borderSamples(img)), res = pass(img, bg, o), paper = false;
    // 紙が画面より小さいと、紙ごと1つの大きな塊になる → 紙の色を背景にしてやり直し、まわり（机）は捨てる
    const giant = res.comps.filter(c => c.area > N * 0.3).sort((a, b) => b.area - a.area)[0];
    if (giant) {
      const S = [], step = Math.max(1, Math.round(Math.sqrt(giant.area / 4000)));
      for (let y = giant.y; y < giant.y + giant.h; y += step) for (let x = giant.x; x < giant.x + giant.w; x += step) {
        if (res.lab[y * W + x] !== giant.id) continue;
        const j = (y * W + x) * 4; S.push([x / (W - 1 || 1), y / (H - 1 || 1), img.data[j], img.data[j + 1], img.data[j + 2]]);
      }
      if (S.length >= 12) { bg = robustBg(S); res = pass(img, bg, o); paper = true; }
    }
    let comps = res.comps.filter(c => c.area >= minArea && c.area <= N * 0.3 && !(paper && c.edge && c.area > N * 0.02));
    const many = comps.length > maxPieces;
    if (many) comps = comps.sort((a, b) => b.area - a.area).slice(0, maxPieces);
    const rowH = Math.max(16, pct(comps.map(c => c.h), 0.5));
    comps.sort((a, b) => (Math.round(a.cy / rowH) - Math.round(b.cy / rowH)) || (a.cx - b.cx));
    const out = comps.map(c => {
      const rgb = (() => { const a = rgbOf(img, res.lab, c, true); return a && a[3] >= 4 ? a : rgbOf(img, res.lab, c, false); })();
      const p = { x: c.x, y: c.y, w: c.w, h: c.h, area: c.area, color: rgb ? toHex(rgb[0], rgb[1], rgb[2]) : '#CCCCCC', cx: Math.round(c.cx), cy: Math.round(c.cy), edge: c.edge };
      if (o.mask !== false) { const mk = new Uint8Array(c.w * c.h); for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (res.lab[(c.y + y) * W + c.x + x] === c.id) mk[y * c.w + x] = 1; p.mask = mk; }
      return p;
    });
    const bgc = at(bg.P, 0.5, 0.5);
    out.meta = { bg: toHex(bgc[0], bgc[1], bgc[2]), thr: Math.round(res.thr), paper, many, width: W, height: H };
    return out;
  }

  /** 切り抜き1個 → 透明な背景の RGBA（ふちの内側を少しぼかす）。node でも動く */
  function cropRGBA(img, p, pad) {
    pad = pad == null ? 2 : pad;
    const W = p.w + pad * 2, H = p.h + pad * 2, out = new Uint8ClampedArray(W * H * 4);
    const mk = (x, y) => (x < 0 || y < 0 || x >= p.w || y >= p.h ? 0 : p.mask ? p.mask[y * p.w + x] : 1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = p.x - pad + x, sy = p.y - pad + y, o = (y * W + x) * 4;
      if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue;
      if (!mk(x - pad, y - pad)) continue; // 塊の外は透明（紙の色のふちを残さない）
      let a = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += mk(x - pad + dx, y - pad + dy);
      const j = (sy * img.width + sx) * 4;
      out[o] = img.data[j]; out[o + 1] = img.data[j + 1]; out[o + 2] = img.data[j + 2]; out[o + 3] = Math.round((a / 9) * 255);
    }
    return { width: W, height: H, data: out };
  }

  // ---- ブラウザだけ: 写真を読む・PNG にする
  function canvasBlob(c, type, q) {
    return new Promise(res => {
      try {
        if (c.toBlob) { c.toBlob(b => res(b || null), type || 'image/png', q); return; }
        const u = c.toDataURL(type || 'image/png', q), bin = atob(u.split(',')[1]), a = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
        res(new Blob([a], { type: type || 'image/png' }));
      } catch (e) { res(null); }
    });
  }
  /** 写真のファイル → 長い辺 1536px までの canvas（端末の中だけ） */
  function fileToCanvas(file, maxSide) {
    return new Promise(res => {
      // 種類が空のファイル（Android の一部の写真の選び方）は、読めるかどうかを Image に任せる
      if (!hasDOM || !file || (file.type && !/^image\//.test(file.type))) { res(null); return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, (maxSide || MAX_SIDE) / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c);
      };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    });
  }
  /** 切り抜き1個 → 透明な背景の PNG（長い辺 256px まで）。canvas は切り抜きに使った写真 */
  async function toPng(canvas, p) {
    if (!hasDOM || !canvas || !canvas.getContext || !p) return null;
    try {
      const pad = 2, x0 = Math.max(0, p.x - pad), y0 = Math.max(0, p.y - pad);
      const x1 = Math.min(canvas.width, p.x + p.w + pad), y1 = Math.min(canvas.height, p.y + p.h + pad);
      const reg = canvas.getContext('2d').getImageData(x0, y0, x1 - x0, y1 - y0);
      const crop = cropRGBA(reg, Object.assign({}, p, { x: p.x - x0, y: p.y - y0 }), pad);
      const c1 = document.createElement('canvas'); c1.width = crop.width; c1.height = crop.height;
      const g1 = c1.getContext('2d'), id = g1.createImageData(crop.width, crop.height); id.data.set(crop.data); g1.putImageData(id, 0, 0);
      const k = Math.min(1, PNG_SIDE / Math.max(crop.width, crop.height));
      let out = c1;
      if (k < 1) {
        out = document.createElement('canvas'); out.width = Math.max(1, Math.round(crop.width * k)); out.height = Math.max(1, Math.round(crop.height * k));
        const g = out.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(c1, 0, 0, out.width, out.height);
      }
      return await canvasBlob(out, 'image/png');
    } catch (e) { return null; }
  }

  // ---- 大きさ・種類・色の名前
  /** 1円玉（直径 20mm）の塊から、パーツの長い辺の mm（小数1けた）。測れなければ null */
  function mmFromCoin(coin, box) {
    if (!coin || !box) return null;
    const d = (coin.w + coin.h) / 2; if (!(d > 4) || !(box.w > 0) || !(box.h > 0)) return null;
    return Math.round((Math.max(box.w, box.h) * COIN_MM / d) * 10) / 10;
  }
  function hsl(hex) {
    const n = parseInt(String(hex || '#CCCCCC').slice(1), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    if (!d) return { h: 0, s: 0, l, c: 0 };
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
    return { h, s: d / (1 - Math.abs(2 * l - 1)), l, c: d };
  }
  const shapeOf = p => ({ aspect: p.w / p.h, fill: p.area / (Math.PI / 4 * p.w * p.h) });
  const isRound = p => { const s = shapeOf(p); return s.aspect > 0.8 && s.aspect < 1.25 && s.fill > 0.85 && s.fill < 1.12; };
  const isGold = c => c.h > 36 && c.h < 58 && c.s > 0.25 && c.s < 0.8 && c.l > 0.35 && c.l < 0.75;
  /** 種類の見当（色と形から。あとで直せる） */
  function guessKind(p) {
    const c = hsl(p.color), round = isRound(p);
    if (round && c.c < 0.1 && c.l > 0.72) return 'pearl';
    if (isGold(c) || (!round && c.c < 0.08 && c.l > 0.45 && c.l < 0.82)) return 'metal';
    if (round) return 'stone';
    return 'other';
  }
  /** 1円玉らしい塊（丸い・灰色・いちばん大きい）。無ければ -1 */
  function guessCoin(list) {
    let best = -1;
    (list || []).forEach((p, i) => {
      const c = hsl(p.color);
      if (p.edge || !isRound(p) || c.c > 0.12 || c.l < 0.3 || c.l > 0.92) return;
      if (best < 0 || p.area > list[best].area) best = i;
    });
    return best;
  }
  function colorWord(hex) {
    const c = hsl(hex);
    if (c.l < 0.16) return 'ブラック';
    if (c.c < 0.07 || c.s < 0.1) return c.l > 0.86 ? 'ホワイト' : c.l < 0.3 ? 'ブラック' : 'グレー';
    if (isGold(c)) return 'ゴールド';
    const h = c.h;
    if (h < 15 || h >= 345) return c.l > 0.7 ? 'ピンク' : c.l < 0.3 ? 'ボルドー' : 'レッド';
    if (h < 40) return c.l < 0.4 ? 'ブラウン' : c.s < 0.45 || c.l > 0.78 ? 'ベージュ' : 'オレンジ';
    if (h < 68) return c.l > 0.8 ? 'クリーム' : 'イエロー';
    if (h < 160) return c.l > 0.72 ? 'ミント' : 'グリーン';
    if (h < 200) return c.l > 0.7 ? 'ミント' : 'ターコイズ';
    if (h < 255) return c.l > 0.75 ? 'ライトブルー' : c.l < 0.3 ? 'ネイビー' : 'ブルー';
    if (h < 290) return c.l > 0.72 ? 'ラベンダー' : 'パープル';
    return c.l > 0.6 ? 'ピンク' : 'マゼンタ';
  }
  const metalWord = hex => { const w = colorWord(hex); return w === 'グレー' || w === 'ホワイト' ? 'シルバー' : w; };
  function nameFor(kind, hex) {
    const w = colorWord(hex);
    if (kind === 'pearl') return (w === 'グレー' ? 'ホワイト' : w) + 'パール';
    if (kind === 'metal') return metalWord(hex) + 'のメタルパーツ';
    if (kind === 'stone') return w + 'のストーン';
    if (kind === 'sticker') return w + 'のシール';
    return w + 'のパーツ';
  }
  function nameIdeas(kind, hex) {
    const w = colorWord(hex), base = nameFor(kind, hex);
    const more = {
      stone: ['クリアストーン', 'オーロラストーン', 'ラインストーン', 'しずくストーン'],
      pearl: ['半円パール', 'ミニパール', 'ホワイトパール'],
      metal: ['スタッズ', 'ブリオン', 'チャーム', 'チェーン', `${metalWord(hex)}のハート`, `${metalWord(hex)}の星`],
      sticker: ['お花のシール', 'ハートのシール', 'リボンのシール', 'レースのシール'],
      other: ['ビジュー', '3Dフラワー', 'ホログラム', `${w}のリボン`],
    }[kind] || [];
    return Array.from(new Set([base].concat(more))).slice(0, 6);
  }
  const cleanName = s => String(s == null ? '' : s).replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);

  // ---- JAN（袋のバーコード）
  function janOk(s) {
    s = String(s == null ? '' : s);
    if (!/^(\d{8}|\d{13})$/.test(s)) return false;
    const d = s.split('').map(Number), chk = d.pop();
    let sum = 0; d.reverse().forEach((v, i) => { sum += v * (i % 2 === 0 ? 3 : 1); });
    return (10 - (sum % 10)) % 10 === chk;
  }
  const janDigits = s => String(s == null ? '' : s).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\D/g, '');
  const findJan = code => ((T.SHOP && T.SHOP.ITEMS) || []).find(it => it.jan && it.jan === code) || null;
  let bcReady = null;
  /** BarcodeDetector で ean_13 が読めるか（Promise<boolean>） */
  function barcodeSupported() {
    if (bcReady) return bcReady;
    bcReady = (async () => {
      try { if (typeof global.BarcodeDetector !== 'function') return false; const f = await global.BarcodeDetector.getSupportedFormats(); return Array.isArray(f) && f.includes('ean_13'); } catch (e) { return false; }
    })();
    return bcReady;
  }
  /** 画像（canvas など）からバーコード。null = 読めない端末・失敗、'' = 見つからない */
  async function readBarcode(source) {
    if (!(await barcodeSupported())) return null;
    try {
      const det = new global.BarcodeDetector({ formats: ['ean_13'] }), codes = await det.detect(source);
      return (codes || []).map(c => String(c.rawValue || '')).find(janOk) || '';
    } catch (e) { return null; }
  }

  // ---- AI の結果を切り抜きの塊に当てはめる（box は [ymin, xmin, ymax, xmax] の 0〜1000）
  const AI_KIND = [[/stone|rhine|crystal|bijou|ストーン|ビジュー/i, 'stone'], [/pearl|パール/i, 'pearl'], [/metal|stud|charm|bullion|chain|メタル|スタッズ|チャーム|ブリオン|チェーン/i, 'metal'], [/sticker|seal|decal|シール/i, 'sticker']];
  const aiKind = k => { const s = String(k || ''); if (KINDS.some(x => x.id === s)) return s; const hit = AI_KIND.find(([re]) => re.test(s)); return hit ? hit[1] : 'other'; };
  function matchAi(pieces, items, W, H) {
    const boxes = (Array.isArray(items) ? items : []).map(it => {
      const b = it && Array.isArray(it.box) && it.box.length === 4 && it.box.every(v => typeof v === 'number' && isFinite(v)) ? it.box : null; if (!b) return null;
      const y0 = clamp(b[0], 0, 1000) / 1000 * H, x0 = clamp(b[1], 0, 1000) / 1000 * W, y1 = clamp(b[2], 0, 1000) / 1000 * H, x1 = clamp(b[3], 0, 1000) / 1000 * W;
      return x1 > x0 && y1 > y0 ? { x0, y0, x1, y1, kind: aiKind(it.kind), name: cleanName(it.name) } : null;
    }).filter(Boolean);
    return (pieces || []).map(p => {
      let best = null, bestS = 0;
      boxes.forEach(b => {
        const ix = Math.max(0, Math.min(p.x + p.w, b.x1) - Math.max(p.x, b.x0)), iy = Math.max(0, Math.min(p.y + p.h, b.y1) - Math.max(p.y, b.y0));
        const inter = ix * iy, ba = (b.x1 - b.x0) * (b.y1 - b.y0), uni = p.w * p.h + ba - inter, iou = uni > 0 ? inter / uni : 0;
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2, inside = cx >= b.x0 && cx <= b.x1 && cy >= b.y0 && cy <= b.y1 && ba <= p.w * p.h * 6;
        const s = Math.max(iou, inside ? 0.25 : 0);
        if (s > bestS) { bestS = s; best = b; }
      });
      return best && bestS >= 0.2 ? { kind: best.kind, name: best.name } : null;
    });
  }

  // ---- 画像の保存（IndexedDB 'tsume' の 'images'。ほかの機能の入れ物は消さない）
  const mem = new Map(); // key → { blob, url }
  let dbp = null;
  const DB = 'tsume', STORE = 'images';
  function openDb() {
    if (dbp) return dbp;
    dbp = new Promise(res => {
      let factory = null; try { factory = global.indexedDB || null; } catch (e) { factory = null; }
      if (!factory) { res(null); return; }
      const ready = db => { db.onversionchange = () => { try { db.close(); } catch (e) {} dbp = null; }; res(db); };
      const upgrade = rq => () => { const db = rq.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
      try {
        const rq = factory.open(DB);
        rq.onupgradeneeded = upgrade(rq);
        rq.onerror = () => res(null); rq.onblocked = () => res(null);
        rq.onsuccess = () => {
          const db = rq.result;
          if (db.objectStoreNames.contains(STORE)) { ready(db); return; }
          // 入れ物が無い（ほかの機能が先に作った DB）→ 版を1つ上げて足す
          const v = db.version + 1; db.close();
          const r2 = factory.open(DB, v);
          r2.onupgradeneeded = upgrade(r2); r2.onerror = () => res(null); r2.onblocked = () => res(null);
          r2.onsuccess = () => ready(r2.result);
        };
      } catch (e) { res(null); }
    });
    return dbp;
  }
  function req(db, mode, fn) {
    return new Promise((res, rej) => {
      try {
        const tx = db.transaction(STORE, mode), r = fn(tx.objectStore(STORE));
        tx.oncomplete = () => res(r ? r.result : undefined); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error);
      } catch (e) { rej(e); }
    });
  }
  function blobBuf(b) {
    if (b.arrayBuffer) return b.arrayBuffer();
    return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsArrayBuffer(b); });
  }
  function remember(key, blob) { const old = mem.get(key); if (old && old.url && old.blob !== blob) revoke(old.url); mem.set(key, { blob, url: old && old.blob === blob ? old.url : null }); }
  function revoke(u) { try { if (u && global.URL && URL.revokeObjectURL) URL.revokeObjectURL(u); } catch (e) {} }
  const idb = {
    /** 保存。端末に残せたら true（メモリには必ず入る） */
    async put(key, blob) {
      if (!KEY.test(key || '') || !blob) return false;
      remember(key, blob);
      const db = await openDb(); if (!db) return false;
      try { const buf = await blobBuf(blob); await req(db, 'readwrite', s => s.put({ type: blob.type || 'image/png', buf }, key)); return true; } catch (e) { return false; }
    },
    async get(key) {
      if (!KEY.test(key || '')) return null;
      const m = mem.get(key); if (m) return m.blob;
      const db = await openDb(); if (!db) return null;
      try {
        const v = await req(db, 'readonly', s => s.get(key));
        if (!v || !v.buf) return null;
        const blob = new Blob([v.buf], { type: v.type || 'image/png' }); remember(key, blob); return blob;
      } catch (e) { return null; }
    },
    async del(key) {
      const m = mem.get(key); if (m) revoke(m.url); mem.delete(key);
      const db = await openDb(); if (!db) return false;
      try { await req(db, 'readwrite', s => s.delete(key)); return true; } catch (e) { return false; }
    },
    async list() {
      const db = await openDb(); if (!db) return Array.from(mem.keys());
      try {
        return await new Promise((res, rej) => {
          const tx = db.transaction(STORE, 'readonly'), s = tx.objectStore(STORE), keys = [];
          if (s.getAllKeys) { const r = s.getAllKeys(); r.onsuccess = () => res(r.result.map(String)); r.onerror = () => rej(r.error); return; }
          const c = s.openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { keys.push(String(cur.key)); cur.continue(); } else res(keys); }; c.onerror = () => rej(c.error);
        });
      } catch (e) { return Array.from(mem.keys()); }
    },
    /** 端末に残せるか（Promise<boolean>） */
    async ok() { return !!(await openDb()); },
  };
  const keyOf = ref => { const m = /^idb:([\w-]{1,60})$/.exec(String(ref || '')); return m ? m[1] : null; };
  /** 'idb:…' → 表示に使える URL（メモリに読んであるときだけ）。無ければ null */
  function src(ref) {
    const k = keyOf(ref), m = k && mem.get(k);
    if (!m) return null;
    if (!m.url) { try { m.url = global.URL && URL.createObjectURL ? URL.createObjectURL(m.blob) : null; } catch (e) { m.url = null; } }
    return m.url;
  }
  /** 使っている画像の鍵（持ってる・飾ったデザイン・マイデザイン） */
  function refsInUse(st) {
    const keys = new Set(), add = r => { const k = keyOf(r); if (k) keys.add(k); };
    const walk = c => { if (!c || typeof c !== 'object') return; ['left', 'right', 'foot'].forEach(side => (Array.isArray(c[side]) ? c[side] : []).forEach(list => (Array.isArray(list) ? list : []).forEach(t => { if (t && t.k === 'photo') add(t.ref); }))); };
    ((st && st.myColors && st.myColors.items) || []).forEach(it => it && add(it.img));
    Object.keys((st && st.custom) || {}).forEach(k => walk(st.custom[k]));
    ((st && st.saved) || []).forEach(x => walk(x && x.toppings));
    return keys;
  }
  const LOADED = Date.now();
  /** 鍵 'ph_<Date.now() の36進8けた>…' から作った時刻（読めなければ 0） */
  const bornOf = k => { const m = /^ph_([0-9a-z]{8})/.exec(k); return m ? parseInt(m[1], 36) : 0; };
  /** 起動時: 使っている画像をメモリに読み、描き直す。どこからも使われない 'ph_' の画像は消す
   *  （持ってるの保存が読めないときは消さない: 保存が壊れていても画像は残す。
   *   この画面を開いたあとに作られた画像も消さない: 別のタブで今入れたパーツを消さないように） */
  async function warm() {
    const st = T.app && T.app.state; if (!st) return -1;
    let saved = null; try { saved = global.localStorage.getItem('tsume.mycolors.v1'); } catch (e) { saved = null; }
    const keys = await idb.list(), used = refsInUse(st); let n = 0;
    for (const k of keys) {
      if (used.has(k)) { if (await idb.get(k)) n++; } else if (saved != null && /^ph_/.test(k) && bornOf(k) < LOADED - 60000) await idb.del(k);
    }
    if (n && T.app && T.app.render) T.app.render();
    return n;
  }

  // ---- 爪の上に描く（render-topping の 'photo'）。大きさは mm を爪の幅 13mm に対する割合に
  let uid = 0;
  /** item: { k:'photo', ref:'idb:…', mm, v: 種類, col }。scale は S/M/L の倍率。defs があれば影をつける */
  function partSvg(item, scale, defs) {
    const mm = clampMm(item && item.mm), side = mm / NAIL_MM * 100 * (scale > 0 ? scale : 1), h = side / 2, url = src(item && item.ref);
    if (!url) {
      const col = HEX.test((item && item.col) || '') ? item.col : '#CCCCCC';
      return `<circle r="${f1(h * 0.8)}" fill="${col}" stroke="#FFFFFF" stroke-width="${f1(Math.max(0.6, side * 0.05))}" stroke-dasharray="${f1(side * 0.12)} ${f1(side * 0.08)}" opacity="0.9"/>`;
    }
    let filter = '';
    if (Array.isArray(defs)) {
      const id = 'scp' + (uid++).toString(36), flat = item.v === 'sticker';
      defs.push(`<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="${f1(Math.max(0.5, side * 0.04))}"/><feOffset dx="${f1(side * 0.03)}" dy="${f1(side * (flat ? 0.03 : 0.07))}"/><feComponentTransfer><feFuncA type="linear" slope="${flat ? 0.25 : 0.4}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
      filter = ` filter="url(#${id})"`;
    }
    return `<image href="${esc(url)}" x="${f1(-h)}" y="${f1(-h)}" width="${f1(side)}" height="${f1(side)}" preserveAspectRatio="xMidYMid meet"${filter}/>`;
  }
  /** エディタの当たり判定・選択の輪に使う半径（爪の幅 100 に対して） */
  const unitOf = t => clampMm(t && t.mm) / NAIL_MM * 100 / 2;
  /** 持ってる（写真）→ 爪にのせるパーツ。z: 1 で、S/M/L に関係なく測った大きさ（mm）のまま置く（あとで大きさは変えられる） */
  const partOf = it => ({ k: 'photo', v: KINDS.some(x => x.id === it.kind) ? it.kind : 'other', ref: it.img, mm: clampMm(it.mm), col: HEX.test(it.color || '') ? it.color : '#CCCCCC', z: 1 });
  /** 共有リンク・ギャラリー用: 写真のパーツ → 色と大きさの近い、ふつうのパーツ（画像は送らない。受け取った人の材料に「手持ち」と出ないように）。
   *  share.js の cleanItem が呼ぶ。作れなければ null */
  function toShared(t) {
    const D = T.TOPPINGS; if (!t || typeof t !== 'object' || t.k !== 'photo' || !D || !D.KINDS) return null;
    const col = HEX.test(t.col || '') ? t.col.toUpperCase() : '#CCCCCC', rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const near = (map, field) => { const c = rgb(col); let best = null, bd = Infinity; Object.keys(map || {}).forEach(k => { const v = map[k] && map[k][field]; if (!HEX.test(v || '')) return; const q = rgb(v), d = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2 + (q[2] - c[2]) ** 2; if (d < bd) { bd = d; best = k; } }); return best; };
    const mm = clampMm(t.mm);
    let o;
    if (t.v === 'pearl') o = { k: 'pearl', v: near(D.PEARLS, 'c1') || 'white' };
    else if (t.v === 'metal') o = mm > 4 ? { k: 'charm', v: near(D.METALS, 'hex') || 'gold', shape: 'star' } : { k: 'stud', v: near(D.METALS, 'hex') || 'gold', shape: 'round' };
    else if (t.v === 'sticker') o = { k: 'sticker', v: 'flower', col };
    else o = { k: 'stone', v: near(D.STONES, 'base') || 'clear' };
    const kd = D.KINDS[o.k]; if (!kd || !kd.unit) return null;
    const sc = typeof t.z === 'number' && isFinite(t.z) ? t.z : (D.SIZES && D.SIZES[t.s]) || 1;
    const z = Math.round(clamp(mm / NAIL_MM * 100 / 2 * sc / kd.unit, 0.4, 2.5) * 100) / 100;
    const s = Object.keys(D.SIZES || { M: 1 }).reduce((a, b) => (Math.abs(D.SIZES[b] - z) < Math.abs(D.SIZES[a] - z) ? b : a), 'M');
    return Object.assign(o, { x: t.x, y: t.y, z, s }, typeof t.r === 'number' && isFinite(t.r) ? { r: t.r } : {});
  }
  /** パーツの名前（持ってるの名前。無ければ種類） */
  function nameOf(t) {
    const st = T.app && T.app.state, it = ((st && st.myColors && st.myColors.items) || []).find(x => x && x.img === t.ref);
    if (it && it.name) return it.name;
    const k = KINDS.find(x => x.id === t.v); return k && k.id !== 'other' ? `持ってる${k.name}` : '持ってるパーツ';
  }
  let seq = 0;
  const newId = (pre) => (pre || 'ph') + '_' + Date.now().toString(36) + (seq++ % 1296).toString(36) + Math.floor(Math.random() * 46656).toString(36);

  T.scan = { COIN_MM, NAIL_MM, MAX_SIDE, PNG_SIDE, KINDS, DEFAULT_MM, cutout, cropRGBA, toPng, fileToCanvas, canvasBlob, mmFromCoin, guessKind, guessCoin, colorWord, nameFor, nameIdeas, cleanName, clampMm, janOk, janDigits, findJan, barcodeSupported, readBarcode, matchAi, aiKind, idb, src, keyOf, refsInUse, warm, partSvg, partOf, toShared, nameOf, unitOf, newId, _mem: mem };

  if (hasDOM) {
    barcodeSupported();
    let tries = 0;
    const start = () => { setTimeout(() => { warm().then(n => { if (n < 0 && ++tries < 20) start(); }, () => {}); }, tries ? 250 : 0); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
