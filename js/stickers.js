/* tsumé — シール工房（計算と描画）。自分の模様・モチーフ・手描きを、爪の実寸のシートにして家のプリンターで刷る。
   単位はすべて mm。SVG の viewBox を mm にして、印刷・PDF でも 1mm＝1mm にする */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const f = n => (Math.round(n * 100) / 100).toString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const col = (c, d) => (HEX.test(c || '') ? c : d);
  // 同じ seed なら同じ形（「少し変える」は seed を変える）
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }

  // ---- 爪の形（先端が上）。w×h mm
  function nailPath(w, h, shape) {
    if (shape === 'square') { const r = w * 0.18; return `M${f(r)},0 H${f(w - r)} Q${f(w)},0 ${f(w)},${f(r)} V${f(h * 0.86)} Q${f(w)},${f(h)} ${f(w * 0.5)},${f(h)} Q0,${f(h)} 0,${f(h * 0.86)} V${f(r)} Q0,0 ${f(r)},0 Z`; }
    if (shape === 'almond') return `M${f(w / 2)},0 C${f(w * 0.8)},${f(h * 0.03)} ${f(w * 0.96)},${f(h * 0.2)} ${f(w * 0.98)},${f(h * 0.42)} C${f(w)},${f(h * 0.62)} ${f(w * 0.96)},${f(h * 0.94)} ${f(w / 2)},${f(h)} C${f(w * 0.04)},${f(h * 0.94)} 0,${f(h * 0.62)} ${f(w * 0.02)},${f(h * 0.42)} C${f(w * 0.04)},${f(h * 0.2)} ${f(w * 0.2)},${f(h * 0.03)} ${f(w / 2)},0 Z`;
    // oval（ラウンド）
    return `M${f(w / 2)},0 C${f(w * 0.86)},0 ${f(w)},${f(h * 0.12)} ${f(w)},${f(h * 0.36)} V${f(h * 0.8)} Q${f(w)},${f(h)} ${f(w / 2)},${f(h)} Q0,${f(h)} 0,${f(h * 0.8)} V${f(h * 0.36)} C0,${f(h * 0.12)} ${f(w * 0.14)},0 ${f(w / 2)},0 Z`;
  }

  // ---- モチーフ（小さなシール）。中心 (0,0)、大きさ 1（半径 0.5 の箱）で描き、あとで mm に拡大する
  const MOTIFS = {
    heart: { name: 'ハート', draw: (p, r) => { const k = 0.18 + p.round * 0.12; return `M0,0.42 C${-0.5 - k * 0.2},0.02 -0.52,-0.42 -0.24,-0.42 C-0.08,-0.42 0,-0.3 0,-0.2 C0,-0.3 0.08,-0.42 0.24,-0.42 C0.52,-0.42 ${0.5 + k * 0.2},0.02 0,0.42 Z`; } },
    heart2: { name: 'ハート（二重線）', line: true, draw: () => 'M0,0.42 C-0.54,0.02 -0.52,-0.42 -0.24,-0.42 C-0.08,-0.42 0,-0.3 0,-0.2 C0,-0.3 0.08,-0.42 0.24,-0.42 C0.52,-0.42 0.54,0.02 0,0.42 Z M0,0.24 C-0.34,0 -0.33,-0.26 -0.16,-0.26 C-0.06,-0.26 0,-0.18 0,-0.12 C0,-0.18 0.06,-0.26 0.16,-0.26 C0.33,-0.26 0.34,0 0,0.24 Z' },
    ribbon: { name: 'リボン', draw: p => { const l = 0.3 + p.size * 0.14, t = 0.18 + p.tail * 0.2; return `M0,0 C${-l * 0.5},${-l * 0.9} ${-l * 1.55},${-l * 0.6} ${-l * 1.5},0 C${-l * 1.55},${l * 0.6} ${-l * 0.5},${l * 0.9} 0,0 Z M0,0 C${l * 0.5},${-l * 0.9} ${l * 1.55},${-l * 0.6} ${l * 1.5},0 C${l * 1.55},${l * 0.6} ${l * 0.5},${l * 0.9} 0,0 Z M-0.03,0.04 L${f(-0.12 - t * 0.4)},${f(0.2 + t)} L${f(-0.02 - t * 0.2)},${f(0.18 + t * 0.8)} Z M0.03,0.04 L${f(0.12 + t * 0.4)},${f(0.2 + t)} L${f(0.02 + t * 0.2)},${f(0.18 + t * 0.8)} Z M-0.07,-0.06 h0.14 v0.12 h-0.14 Z`; } },
    flower: { name: 'お花', draw: p => { const n = 5 + Math.round(p.petals * 3), rr = 0.15 + p.round * 0.08, dist = 0.5 - rr; let d = ''; for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n - Math.PI / 2, cx = Math.cos(a) * dist, cy = Math.sin(a) * dist; d += `M${f(cx + rr)},${f(cy)} a${f(rr)},${f(rr)} 0 1,0 ${f(-2 * rr)},0 a${f(rr)},${f(rr)} 0 1,0 ${f(2 * rr)},0 Z `; } return d; }, center: true },
    sakura: { name: '桜', draw: () => { let d = ''; for (let i = 0; i < 5; i++) { const a = (Math.PI * 2 * i) / 5 - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), px = (x, y) => `${f(x * ca - y * sa)},${f(x * sa + y * ca)}`; d += `M${px(0.04, 0)} C${px(0.12, -0.2)} ${px(0.42, -0.16)} ${px(0.46, -0.04)} L${px(0.4, 0)} L${px(0.46, 0.04)} C${px(0.42, 0.16)} ${px(0.12, 0.2)} ${px(0.04, 0)} Z `; } return d; }, center: true },
    butterfly: { name: 'ちょうちょ', draw: p => { const u = 0.38 + p.size * 0.08; return `M-0.02,-0.02 C${-u * 0.4},${-u * 1.25} ${-u * 1.35},${-u * 1.1} ${-u * 1.05},${-u * 0.15} C${-u * 1.2},${u * 0.6} ${-u * 0.5},${u * 0.9} -0.02,0.06 Z M0.02,-0.02 C${u * 0.4},${-u * 1.25} ${u * 1.35},${-u * 1.1} ${u * 1.05},${-u * 0.15} C${u * 1.2},${u * 0.6} ${u * 0.5},${u * 0.9} 0.02,0.06 Z M-0.025,-0.2 h0.05 v0.42 h-0.05 Z`; } },
    star: { name: '星', draw: p => { const n = 4 + Math.round(p.points * 2), r2 = 0.16 + p.round * 0.16; let d = ''; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n - Math.PI / 2, r = i % 2 ? r2 : 0.5; d += (i ? 'L' : 'M') + `${f(Math.cos(a) * r)},${f(Math.sin(a) * r)} `; } return d + 'Z'; } },
    moon: { name: '月', draw: p => { const k = 0.2 + p.size * 0.18; return `M0.1,-0.46 A0.46,0.46 0 1,0 0.1,0.46 A${f(0.46 - k * 0.2)},${f(0.46 - k * 0.2)} 0 1,1 0.1,-0.46 Z`; } },
    sparkle: { name: 'キラッ', draw: p => { const k = 0.06 + p.round * 0.08; return `M0,-0.5 Q${k},${-k} 0.5,0 Q${k},${k} 0,0.5 Q${-k},${k} -0.5,0 Q${-k},${-k} 0,-0.5 Z`; } },
    leaf: { name: 'リーフ', draw: p => { const b = 0.18 + p.size * 0.12; return `M0,-0.5 C${b},-0.3 ${b},0.25 0,0.45 C${-b},0.25 ${-b},-0.3 0,-0.5 Z M-0.01,0.45 L0.01,0.45 L0.01,0.5 L-0.01,0.5 Z`; } },
    paw: { name: '肉球', draw: () => 'M0,0.08 C0.22,0.08 0.3,0.3 0.2,0.4 C0.1,0.48 -0.1,0.48 -0.2,0.4 C-0.3,0.3 -0.22,0.08 0,0.08 Z M-0.32,-0.08 a0.1,0.13 -20 1,0 0.001,0 Z M0.32,-0.08 a0.1,0.13 20 1,0 0.001,0 Z M-0.13,-0.32 a0.1,0.13 -5 1,0 0.001,0 Z M0.13,-0.32 a0.1,0.13 5 1,0 0.001,0 Z' },
    line: { name: 'ライン', line: true, draw: p => { if (p.wave > 0.6) { let d = 'M-0.5,0'; for (let i = 0; i < 6; i++) d += ` Q${f(-0.5 + (i + 0.5) / 6)},${i % 2 ? 0.08 : -0.08} ${f(-0.5 + (i + 1) / 6)},0`; return d; } if (p.wave > 0.3) { let d = 'M-0.5,0'; for (let i = 1; i <= 8; i++) d += ` L${f(-0.5 + i / 8)},${i % 2 ? -0.06 : 0.06}`; return d; } return 'M-0.5,0 L0.5,0'; }, wide: true },
    chain: { name: 'チェーン', line: true, draw: () => { let d = ''; for (let i = 0; i < 7; i++) { const x = -0.43 + i * 0.143; d += `M${f(x + 0.07)},0 A0.07,0.05 0 1,0 ${f(x - 0.07)},0 A0.07,0.05 0 1,0 ${f(x + 0.07)},0 Z `; } return d; }, wide: true },
    lace: { name: 'レース', draw: () => { let d = 'M-0.5,-0.1 H0.5 V0'; for (let i = 0; i < 6; i++) { const x = 0.5 - i / 6; d += ` A${f(1 / 12)},${f(1 / 12)} 0 0,1 ${f(x - 1 / 6)},0`; } d += ' Z'; for (let i = 0; i < 6; i++) d += ` M${f(-0.5 + (i + 0.5) / 6 + 0.025)},0.02 a0.025,0.025 0 1,0 -0.05,0 a0.025,0.025 0 1,0 0.05,0 Z`; return d; }, wide: true, evenodd: true },
  };
  /** モチーフの SVG（中心 cx,cy、大きさ s mm） */
  function motifSvg(item, cx, cy, s) {
    const m = MOTIFS[item.kind] || MOTIFS.heart, p = Object.assign({ round: 0.5, size: 0.5, tail: 0.5, petals: 0, points: 0.5, wave: 0 }, item.p || {});
    const fill = col(p.color, '#C8A96A'), line = col(p.line, '#2B2226'), style = m.line ? 'line' : p.style || 'fill';
    const w = m.wide ? s * 1.6 : s, sx = w, sy = m.wide ? s * 0.6 : s;
    const lw = Math.max(0.12, (p.lw || 0.3)) / Math.min(sx, sy);
    const tf = `translate(${f(cx)},${f(cy)}) rotate(${f(p.rot || 0)}) scale(${f(sx)},${f(sy)})`;
    const d = m.draw(p, rng(item.seed || 1));
    const rule = m.evenodd ? ' fill-rule="evenodd"' : '';
    const body = style === 'line' ? `<path d="${d}" fill="none" stroke="${m.line ? fill : line}" stroke-width="${f(lw)}" stroke-linecap="round" stroke-linejoin="round"/>`
      : style === 'both' ? `<path d="${d}" fill="${fill}"${rule} stroke="${line}" stroke-width="${f(lw)}" stroke-linejoin="round"/>` : `<path d="${d}" fill="${fill}"${rule}/>`;
    const center = m.center ? `<circle r="0.09" fill="${col(p.center, '#F2D36B')}"/>` : '';
    return `<g transform="${tf}">${body}${center}</g>`;
  }

  // ---- 模様（爪の形に全面）。0..w × 0..h に描く
  const PATTERNS = {
    leopard: { name: 'レオパード（豹柄）', colors: ['#E8C9A0', '#8A5A2B', '#2B1E16'], labels: ['地', '中', 'ふち'] },
    tortoise: { name: 'べっ甲', colors: ['#D99A4E', '#8A4A1E', '#3B1A0C'], labels: ['明るい', '中', '濃い'] },
    dots: { name: 'ドット', colors: ['#FFFFFF', '#2B2226'], labels: ['地', '水玉'] },
    stripe: { name: 'ストライプ', colors: ['#FFFFFF', '#C9808A'], labels: ['地', '線'] },
    gingham: { name: 'ギンガム', colors: ['#FFFFFF', '#C9808A'], labels: ['地', '格子'] },
    marble: { name: 'マーブル（ニュアンス）', colors: ['#F4EEE9', '#9C8F93', '#C8A96A'], labels: ['地', '線', '差し色'] },
    zebra: { name: 'ゼブラ', colors: ['#FFFFFF', '#1E1A1C'], labels: ['地', 'しま'] },
    flowers: { name: '小花', colors: ['#F7EEE9', '#E6A9B6', '#F2D36B'], labels: ['地', '花', '花芯'] },
    hearts: { name: 'ハート柄', colors: ['#FBE6EA', '#D9506A'], labels: ['地', 'ハート'] },
    french: { name: 'フレンチ', colors: ['#00000000', '#FFFFFF', '#C8A96A'], labels: ['地', '先端', 'ライン'] },
  };
  function patternSvg(item, w, h, idp) {
    const P = PATTERNS[item.kind] || PATTERNS.leopard, p = Object.assign({ density: 0.5, size: 0.5, angle: 0 }, item.p || {});
    const c = (P.colors || []).map((d, i) => col((p.colors || [])[i], d.length === 9 ? null : d));
    const R = rng(item.seed || 7), out = [], area = w * h;
    const bg = c[0] && !p.clear ? `<rect width="${f(w)}" height="${f(h)}" fill="${c[0]}"/>` : '';
    const blob = (x, y, r, fill, k) => { const n = 9; let d = ''; for (let i = 0; i <= n; i++) { const a = (Math.PI * 2 * i) / n, rr = r * (0.75 + R() * 0.5 * (k || 1)); d += (i ? 'L' : 'M') + `${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)} `; } return `<path d="${d}Z" fill="${fill}" stroke="${fill}" stroke-width="${f(r * 0.3)}" stroke-linejoin="round"/>`; };
    switch (item.kind) {
      case 'leopard': {
        // むらなく散らす（ずらした格子）。中が明るい茶、まわりに切れた黒い縁、あいだに小さな点
        const s = 0.9 + p.size * 1.3, g = s * (2.9 - p.density * 0.9);
        for (let y = -g / 2, row = 0; y < h + g; y += g * 0.86, row++) for (let x = (row % 2) * g / 2 - g / 2; x < w + g; x += g) {
          const cx = x + (R() - 0.5) * g * 0.5, cy = y + (R() - 0.5) * g * 0.5, r = s * (0.6 + R() * 0.45);
          if (R() < 0.18) { out.push(blob(cx, cy, r * 0.35, c[2])); continue; }
          out.push(blob(cx, cy, r * 0.62, c[1], 1.6));
          const parts = 2 + Math.floor(R() * 2), start = R() * Math.PI * 2;
          for (let j = 0; j < parts; j++) {
            const a0 = start + (j / parts) * Math.PI * 2 + R() * 0.3, span = (Math.PI * 2) / parts - 0.7 - R() * 0.5;
            const rr = r * (0.95 + R() * 0.2), wv = r * (0.32 + R() * 0.2);
            let d = '', steps = 5;
            for (let k = 0; k <= steps; k++) { const a = a0 + (span * k) / steps, q = rr * (0.92 + R() * 0.16); d += (k ? 'L' : 'M') + `${f(cx + Math.cos(a) * q)},${f(cy + Math.sin(a) * q)} `; }
            out.push(`<path d="${d}" fill="none" stroke="${c[2]}" stroke-width="${f(wv)}" stroke-linecap="round" stroke-linejoin="round"/>`);
          }
        }
        break;
      }
      case 'tortoise': {
        const n = Math.round((area / 9) * (0.6 + p.density));
        out.push(`<g filter="url(#${idp}-soft)">`);
        for (let i = 0; i < n; i++) { const dark = R() < 0.45; out.push(`<g opacity="${dark ? 0.85 : 0.6}">${blob(R() * w, R() * h, (dark ? 0.5 : 0.9) + R() * 1.4 * (0.5 + p.size), dark ? c[2] : c[1], 1.5)}</g>`); }
        out.push('</g>');
        break;
      }
      case 'dots': {
        const g = 1.6 + (1 - p.density) * 2.4, r = g * (0.18 + p.size * 0.18);
        for (let y = 0, row = 0; y < h + g; y += g * 0.87, row++) for (let x = (row % 2) * g / 2; x < w + g; x += g) out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c[1]}"/>`);
        break;
      }
      case 'stripe': case 'gingham': {
        const g = 1.2 + (1 - p.density) * 2.6, lw = g * (0.25 + p.size * 0.35), L = Math.hypot(w, h);
        const lines = ang => { let s = ''; for (let x = -L; x < L; x += g) s += `<rect x="${f(x)}" y="${f(-L)}" width="${f(lw)}" height="${f(2 * L)}" fill="${c[1]}"${item.kind === 'gingham' ? ' fill-opacity="0.55"' : ''}/>`; return `<g transform="translate(${f(w / 2)},${f(h / 2)}) rotate(${f(ang)})">${s}</g>`; };
        out.push(lines(p.angle || (item.kind === 'gingham' ? 0 : 35)));
        if (item.kind === 'gingham') out.push(lines((p.angle || 0) + 90));
        break;
      }
      case 'marble': {
        const n = 3 + Math.round(p.density * 4);
        for (let i = 0; i < n; i++) {
          const x0 = R() * w, y0 = -1, x3 = R() * w, y3 = h + 1;
          out.push(`<path d="M${f(x0)},${f(y0)} C${f(R() * w * 1.4 - w * 0.2)},${f(h * 0.3)} ${f(R() * w * 1.4 - w * 0.2)},${f(h * 0.7)} ${f(x3)},${f(y3)}" fill="none" stroke="${i % 3 === 2 ? c[2] : c[1]}" stroke-width="${f(0.15 + R() * 0.5 * (0.5 + p.size))}" stroke-linecap="round" opacity="${f(0.6 + R() * 0.4)}"/>`);
        }
        break;
      }
      case 'zebra': {
        const n = Math.round(h / (1.4 + (1 - p.density) * 1.6));
        for (let i = 0; i < n; i++) {
          const y = (i + 0.5) * (h / n), a = 0.4 + R() * 0.6 * (0.5 + p.size), side = R() < 0.5;
          const x0 = side ? -1 : w * (0.2 + R() * 0.3), x1 = side ? w * (0.5 + R() * 0.4) : w + 1;
          out.push(`<path d="M${f(x0)},${f(y - a)} Q${f((x0 + x1) / 2)},${f(y - a * 2.2)} ${f(x1)},${f(y)} Q${f((x0 + x1) / 2)},${f(y + a * 1.2)} ${f(x0)},${f(y + a)} Z" fill="${c[1]}"/>`);
        }
        break;
      }
      case 'flowers': case 'hearts': {
        const n = Math.round((area / 16) * (0.5 + p.density)), s = 1.6 + p.size * 2.4;
        for (let i = 0; i < n; i++) out.push(motifSvg({ kind: item.kind === 'flowers' ? 'flower' : 'heart', seed: i + 3, p: { color: c[1], center: c[2], rot: R() * 360, petals: 0, round: 0.6 } }, R() * w, R() * h, s * (0.7 + R() * 0.5)));
        break;
      }
      case 'french': {
        const d = h * (0.16 + p.size * 0.14), dip = d * (0.5 + p.density * 0.6);
        out.push(`<path d="M-1,-1 H${f(w + 1)} V${f(d)} Q${f(w / 2)},${f(d + dip)} -1,${f(d)} Z" fill="${c[1]}"/>`);
        if (c[2]) out.push(`<path d="M-1,${f(d)} Q${f(w / 2)},${f(d + dip)} ${f(w + 1)},${f(d)}" fill="none" stroke="${c[2]}" stroke-width="${f(0.25 + p.size * 0.3)}"/>`);
        break;
      }
    }
    return bg + out.join('');
  }

  // ---- 手描き（100×100 の箱の線を、mm に拡大）
  // ---- AI の絵（背景が透明の PNG）。s mm の正方形に収める
  const PNG = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
  function imageSvg(item, cx, cy, s) { return PNG.test(item.src || '') ? `<image href="${item.src}" x="${f(cx - s / 2)}" y="${f(cy - s / 2)}" width="${f(s)}" height="${f(s)}" preserveAspectRatio="xMidYMid meet"/>` : ''; }
  function drawSvg(item, cx, cy, s) {
    const k = s / 100, strokes = (item.strokes || []).slice(0, 400);
    return `<g transform="translate(${f(cx - s / 2)},${f(cy - s / 2)}) scale(${f(k)})">${strokes.map(st => {
      const pts = (st.pts || []).filter(q => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1])).slice(0, 2000);
      if (!pts.length) return '';
      const d = pts.length === 1 ? `M${f(pts[0][0])},${f(pts[0][1])} l0.01,0` : 'M' + pts.map(q => `${f(q[0])},${f(q[1])}`).join(' L');
      return `<path d="${d}" fill="none" stroke="${col(st.c, '#2B2226')}" stroke-width="${f(Math.max(0.5, Math.min(20, st.w || 3)))}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('')}</g>`;
  }

  // ---- 爪のサイズ（目安。親指→小指の横幅 mm。自分の爪を定規で測るのがいちばん）
  const HANDS = { S: [14, 11, 12, 11, 8.5], M: [15, 12, 13, 12, 9.5], L: [16.5, 13, 14, 13, 10.5] };
  const FINGERS = ['親指', '人差し指', '中指', '薬指', '小指'];
  const PAPERS = { a4: { name: 'A4', w: 210, h: 297 }, hagaki: { name: 'はがき', w: 100, h: 148 }, l: { name: 'L判（写真）', w: 89, h: 127 } };

  /** 試し刷りの目盛りの長さ（mm）。紙が広ければ 10cm（測りやすい） */
  const rulerLen = P => (P.w >= 140 ? 100 : 50);
  /** シートに置く1つ1つ（模様の手のセットは5本に分ける） */
  const PRINTABLE = ['sticker', 'flake'];
  function nailSpec(item, finger) {
    const U = T.ui, d = U && U.designFor(item.conceptId, item.paletteIndex); if (!d) return null;
    const specs = d.foot || d[item.side] || d.left, s = specs && specs[finger]; if (!s) return null;
    return { spec: Object.assign({}, s, { toppings: (s.toppings || []).filter(t => PRINTABLE.includes(t.k)) }), palette: d.palette };
  }
  function pieces(item) {
    const n = Math.max(1, Math.min(20, item.count || 1)), out = [];
    if (item.type === 'nail') {
      const ws = item.set === 'mine' && Array.isArray(item.widths) && item.widths.length === 5 ? item.widths : HANDS[item.set] || HANDS.M, L = T.nailPath ? T.nailPath(item.shape || 'oval', item.length || 'medium').L : 130;
      for (let k = 0; k < n; k++) (item.fingers || [0, 1, 2, 3, 4]).forEach(fi => out.push({ item, finger: fi, w: ws[fi], h: (ws[fi] * L) / 100, label: FINGERS[fi] }));
      return out;
    }
    if (item.type === 'pattern') {
      const ws = item.set === 'mine' && Array.isArray(item.widths) && item.widths.length === 5 ? item.widths : item.set && HANDS[item.set] ? HANDS[item.set] : [item.w || 12];
      for (let k = 0; k < n; k++) ws.forEach((w, i) => out.push({ item, w, h: w * (item.ratio || 1.3), label: item.set ? FINGERS[i] : '' }));
    } else {
      const s = item.w || 8, m = MOTIFS[item.kind];
      for (let k = 0; k < n; k++) out.push({ item, w: item.type === 'motif' && m && m.wide ? s * 1.6 : s, h: item.type === 'motif' && m && m.wide ? s * 0.6 : s });
    }
    return out;
  }
  /** 棚に並べるように詰める。はみ出した分は overflow で返す */
  function layout(items, paperId) {
    const P = PAPERS[paperId] || PAPERS.a4, M = 10, G = 3, top = 16, bottom = P.h - 22;
    const all = items.flatMap(pieces).sort((a, b) => b.h - a.h);
    let x = M, y = top, rowH = 0; const placed = [], overflow = [];
    for (const pc of all) {
      const ph = pc.h + (pc.label ? 3 : 0); // 指の名前の分
      if (x + pc.w > P.w - M) { x = M; y += rowH + G; rowH = 0; }
      if (y + ph > bottom || pc.w > P.w - 2 * M) { overflow.push(pc); continue; }
      placed.push(Object.assign({ x, y }, pc)); x += pc.w + G; rowH = Math.max(rowH, ph);
    }
    return { paper: P, placed, overflow };
  }
  function pieceSvg(pc, i, guides) {
    const it = pc.item, idp = 'p' + i;
    let body = '';
    if (it.type === 'pattern') {
      const d = nailPath(pc.w, pc.h, it.shape);
      body = `<defs><clipPath id="${idp}-c"><path d="${d}"/></clipPath><filter id="${idp}-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.35"/></filter></defs>
        <g clip-path="url(#${idp}-c)">${patternSvg(it, pc.w, pc.h, idp)}</g>${guides ? `<path d="${d}" fill="none" stroke="#B9B2B4" stroke-width="0.12" stroke-dasharray="0.6 0.5"/>` : ''}`;
    } else if (it.type === 'nail') {
      const ns = nailSpec(it, pc.finger), k = pc.w / 100;
      body = ns && T.renderNail ? `<g transform="scale(${f(k)})">${T.renderNail(ns.spec, ns.palette, { shape: it.shape || 'oval', length: it.length || 'medium', seed: 11, finger: pc.finger, print: true })}</g>` : '';
      if (guides && T.nailPath) body += `<g transform="scale(${f(k)})"><path d="${T.nailPath(it.shape || 'oval', it.length || 'medium').d}" fill="none" stroke="#B9B2B4" stroke-width="${f(0.12 / k)}" stroke-dasharray="${f(0.6 / k)} ${f(0.5 / k)}"/></g>`;
    } else if (it.type === 'draw') body = drawSvg(it, pc.w / 2, pc.h / 2, pc.w);
    else if (it.type === 'image') body = imageSvg(it, pc.w / 2, pc.h / 2, pc.w);
    else body = motifSvg(it, pc.w / 2, pc.h / 2, pc.item.w || 8);
    const label = pc.label ? `<text x="${f(pc.w / 2)}" y="${f(pc.h + 2.2)}" font-size="1.8" text-anchor="middle" fill="#9C9A9E" font-family="sans-serif">${esc(pc.label)}</text>` : '';
    return `<g transform="translate(${f(pc.x)},${f(pc.y)})">${body}${label}</g>`;
  }
  /** 爪の幅をはかる目盛り。紙を爪に当てて、ぴったりの番号（＝横幅 mm）を選ぶ */
  function gaugeSvg(P) {
    let x = 10, y = 22, out = `<text x="10" y="18" font-size="2.8" font-family="sans-serif" fill="#6A5A5E">爪の幅をはかる: 切り取って爪に当て、いちばん合う数字（横幅 mm）をアプリの「自分の爪」に入れる</text>`;
    for (let w = 8; w <= 18; w += 1) {
      const h = w * 1.25; if (x + w > P.w - 10) { x = 10; y += 26; }
      out += `<g transform="translate(${f(x)},${f(y)})"><path d="${nailPath(w, h, 'oval')}" fill="none" stroke="#6A5A5E" stroke-width="0.2"/><text x="${f(w / 2)}" y="${f(h + 3.2)}" font-size="2.6" text-anchor="middle" font-family="sans-serif" fill="#6A5A5E">${w}</text></g>`;
      x += w + 4;
    }
    return out;
  }
  /** シート全体の SVG（mm）。下に 5cm の目盛り（実寸の確かめ） */
  function sheetSvg(sheet, o) {
    o = o || {};
    const L = layout(sheet.items || [], sheet.paper), P = L.paper;
    const RL = rulerLen(P), ticks = Array.from({ length: RL / 10 + 1 }, (_, i) => `M${i * 10},${i % 5 ? -1.2 : -2} V${i % 5 ? 1.2 : 2}`).join(' ');
    const ruler = `<g transform="translate(10,${f(P.h - 18)})" font-family="sans-serif" fill="#6A5A5E"><path d="M0,0 H${RL} ${ticks}" stroke="#6A5A5E" stroke-width="0.25" fill="none"/><rect x="${RL + 6}" y="-5" width="10" height="10" fill="none" stroke="#6A5A5E" stroke-width="0.25"/><text x="0" y="10" font-size="2.6">この線が ${RL / 10}cm、四角が 1cm なら実寸どおり（印刷は「実際のサイズ・100%」で）</text></g>`;
    const head = `<text x="10" y="10" font-size="3" font-family="sans-serif" fill="#9C9A9E">tsumé シール工房 ・ ${esc(P.name)}${sheet.mirror ? ' ・ 左右反転' : ''}</text>`;
    const pcs = L.placed.map((pc, i) => pieceSvg(pc, i, sheet.guides !== false)).join('') + (sheet.gauge ? gaugeSvg(P) : '');
    const content = sheet.mirror ? `<g transform="translate(${P.w},0) scale(-1,1)">${pcs}</g>` : pcs;
    const size = o.px ? `width="${o.px}" height="${Math.round((o.px * P.h) / P.w)}"` : `width="${P.w}mm" height="${P.h}mm"`;
    // 倍率の補正（テスト印刷の 5cm が 49mm なら 50/49 倍にして刷る）
    const k = sheet.scale && sheet.scale !== 1 ? sheet.scale : 1, inner = head + content + ruler;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" ${size} viewBox="0 0 ${P.w} ${P.h}"><rect width="${P.w}" height="${P.h}" fill="#FFFFFF"/>${k === 1 ? inner : `<g transform="scale(${k.toFixed(4)})">${inner}</g>`}</svg>`, layout: L };
  }
  /** 1つだけの見本（画面用）。爪の上にのせた形で */
  function previewSvg(item, px) {
    const W = 20, H = 26, nail = nailPath(W, H, item.shape || 'oval');
    let body;
    if (item.type === 'nail') {
      const ns = nailSpec(item, (item.fingers || [0])[0]); if (!ns || !T.renderNail) return '';
      const L = T.nailPath(item.shape || 'oval', item.length || 'medium').L;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 112 ${L + 12}" width="${px}" height="${Math.round((px * (L + 12)) / 112)}" class="st-preview">${T.renderNail(ns.spec, ns.palette, { shape: item.shape || 'oval', length: item.length || 'medium', seed: 11, finger: (item.fingers || [0])[0] })}</svg>`;
    }
    if (item.type === 'pattern') body = `<defs><clipPath id="pv-c"><path d="${nail}"/></clipPath><filter id="pv-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.35"/></filter></defs><path d="${nail}" fill="#F3D9D2"/><g clip-path="url(#pv-c)">${patternSvg(item, W, H, 'pv')}</g>`;
    else body = `<path d="${nail}" fill="#F3D9D2"/>${item.type === 'draw' ? drawSvg(item, W / 2, H / 2, 16) : item.type === 'image' ? imageSvg(item, W / 2, H * 0.55, 14) : motifSvg(item, W / 2, H * 0.55, Math.min(14, (item.w || 8) * 1.4))}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${W + 4} ${H + 4}" width="${px}" height="${Math.round((px * (H + 4)) / (W + 4))}" class="st-preview">${body}<path d="${nail}" fill="none" stroke="#C9A9A4" stroke-width="0.3"/></svg>`;
  }

  // ---- PDF（画像1枚を実寸のページに入れる最小の PDF。印刷ダイアログの倍率に左右されにくい）
  function pdfFromJpeg(jpeg, pxW, pxH, mmW, mmH) {
    const pt = mm => (mm * 72) / 25.4, W = pt(mmW).toFixed(2), H = pt(mmH).toFixed(2);
    const enc = s => new TextEncoder().encode(s), parts = [], offs = [];
    let len = 0; const push = b => { parts.push(b); len += b.length; };
    const obj = (n, body) => { offs[n] = len; push(enc(`${n} 0 obj\n`)); body(); push(enc('\nendobj\n')); };
    push(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    obj(1, () => push(enc('<< /Type /Catalog /Pages 2 0 R >>')));
    obj(2, () => push(enc('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')));
    obj(3, () => push(enc(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`)));
    obj(4, () => { push(enc(`<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`)); push(jpeg); push(enc('\nendstream')); });
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(5, () => push(enc(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)));
    const xref = len;
    let x = 'xref\n0 6\n0000000000 65535 f \n'; for (let n = 1; n <= 5; n++) x += String(offs[n]).padStart(10, '0') + ' 00000 n \n';
    push(enc(`${x}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
    const out = new Uint8Array(len); let o = 0; parts.forEach(b => { out.set(b, o); o += b.length; }); return out;
  }
  /** シートを画像にして PDF にする（ブラウザだけ）。iPhone の画像の上限（約1600万画素）を超えない解像度にする */
  function sheetPdf(sheet) {
    const P = PAPERS[sheet.paper] || PAPERS.a4;
    const dpi = Math.min(600, Math.floor(Math.sqrt(15e6 / ((P.w / 25.4) * (P.h / 25.4)))));
    const pxW = Math.round((P.w / 25.4) * dpi), pxH = Math.round((P.h / 25.4) * dpi);
    const { svg } = sheetSvg(sheet, { px: pxW });
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
        const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, pxW, pxH); g.drawImage(img, 0, 0, pxW, pxH);
        c.toBlob(b => { if (!b) { reject(new Error('jpeg')); return; } b.arrayBuffer().then(buf => resolve({ pdf: pdfFromJpeg(new Uint8Array(buf), pxW, pxH, P.w, P.h), dpi })); }, 'image/jpeg', 0.93);
      };
      img.onerror = () => reject(new Error('svg'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  // 1〜2色しか言われなかったときは、模様の役（地・中・ふち など）に合う濃さを作る
  function paletteFrom(kind, cs) {
    const P = PATTERNS[kind], n = P.colors.length, cu = T.colorUtil;
    if (!cs.length || !cu) return cs;
    if (kind === 'french') return [null, cs[0], cs[1] || '#C8A96A'];
    if (cs.length >= n) return cs.slice(0, n);
    const out = cs.slice();
    if (n === 2) out[1] = out[1] || cu.darken(cs[0], 0.45);
    if (n === 3) { out[1] = out[1] || cu.darken(cs[0], 0.35); out[2] = cu.darken(out[1], 0.6); }
    return out;
  }
  // ---- ことばで模様（辞書 → だめなら AI）
  const PWORDS = [[/レオパード|豹柄|ヒョウ|ひょう/, 'leopard'], [/べっ甲|べっこう|鼈甲/, 'tortoise'], [/ドット|水玉|みずたま/, 'dots'], [/ストライプ|しましま|ボーダー/, 'stripe'], [/ギンガム|チェック/, 'gingham'], [/マーブル|大理石|ニュアンス/, 'marble'], [/ゼブラ|しまうま/, 'zebra'], [/小花|花柄|フラワー/, 'flowers'], [/ハート/, 'hearts'], [/フレンチ/, 'french']];
  function wordsToPattern(text) {
    const t = String(text || ''), hit = PWORDS.find(([re]) => re.test(t));
    if (!hit) return null;
    const rest = t.replace(hit[0], ' ').split(/[、,・と\s]+/).filter(Boolean), found = [];
    rest.forEach(w => { const c = T.mix && T.mix.wordColor(w); if (c && found.length < 3) found.push(c.hex); });
    return { kind: hit[1], colors: paletteFrom(hit[1], found) };
  }
  async function aiPattern(text) {
    const kinds = Object.keys(PATTERNS);
    const schema = { type: 'OBJECT', properties: { kind: { type: 'STRING', enum: kinds }, colors: { type: 'ARRAY', items: { type: 'STRING' } }, density: { type: 'NUMBER' }, size: { type: 'NUMBER' } }, required: ['kind', 'colors'] };
    const prompt = `ネイルシールの模様を決める。言葉: 「${T.ai.mask(text).slice(0, 60)}」\nkind は ${kinds.map(k => `${k}=${PATTERNS[k].name}`).join(', ')} から1つ。colors は #RRGGBB を順に（${'地・主な色・差し色'}）最大3つ。density と size は 0〜1。`;
    const r = await T.ai.generateJSON(prompt, schema, { temperature: 0.5, maxTokens: 300 });
    const d = r && r.data;
    if (!d || !PATTERNS[d.kind]) return null;
    const colors = (Array.isArray(d.colors) ? d.colors : []).filter(c => typeof c === 'string' && HEX.test(c)).slice(0, 3).map(c => c.toUpperCase());
    const n = v => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5);
    return { kind: d.kind, colors, density: n(d.density), size: n(d.size), model: r.model };
  }

  // ---- 保存（端末内）の掃除
  const ID = /^[\w-]{1,40}$/;
  function cleanItem(it) {
    if (!it || typeof it !== 'object' || !ID.test(it.id || '')) return null;
    const type = ['pattern', 'motif', 'draw', 'nail', 'image'].includes(it.type) ? it.type : null; if (!type) return null;
    if (type === 'image') {
      if (typeof it.src !== 'string' || it.src.length > 200000 || !PNG.test(it.src)) return null;
      const n = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, v)) : d);
      return { id: it.id, type, kind: 'image', src: it.src, w: n(it.w, 4, 30, 10), count: Math.round(n(it.count, 1, 20, 1)), seed: 1, p: {}, motif: /^[a-z_]{1,24}$/.test(it.motif || '') ? it.motif : undefined };
    }
    if (type === 'nail') {
      const n = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, v)) : d);
      if (!/^[\w-]{1,40}$/.test(it.conceptId || '') || !(T.CONCEPTS || []).some(c => c.id === it.conceptId)) return null;
      const pi = typeof it.paletteIndex === 'string' ? (/^k[\w-]{1,40}$/.test(it.paletteIndex) ? it.paletteIndex : 0) : Math.round(n(it.paletteIndex, 0, 20, 0));
      const fingers = (Array.isArray(it.fingers) ? it.fingers : [0, 1, 2, 3, 4]).map(x => Math.round(n(x, 0, 4, 0))).filter((x, i, a) => a.indexOf(x) === i);
      const o = { id: it.id, type, kind: 'nail', conceptId: it.conceptId, paletteIndex: pi, side: ['left', 'right', 'foot'].includes(it.side) ? it.side : 'left', fingers: fingers.length ? fingers : [0, 1, 2, 3, 4], count: Math.round(n(it.count, 1, 10, 1)), seed: 1, p: {}, w: 12,
        shape: (T.SHAPES || []).some(x => x.id === it.shape) ? it.shape : 'oval', length: (T.LENGTHS || []).some(x => x.id === it.length) ? it.length : 'medium' };
      if (HANDS[it.set]) o.set = it.set; else if (it.set === 'mine' && Array.isArray(it.widths) && it.widths.length === 5) { o.set = 'mine'; o.widths = it.widths.map(w => n(w, 5, 22, 12)); } else o.set = 'M';
      return o;
    }
    if (type === 'pattern' && !PATTERNS[it.kind]) return null;
    if (type === 'motif' && !MOTIFS[it.kind]) return null;
    const num = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, v)) : d);
    const p = {}; const src = it.p && typeof it.p === 'object' ? it.p : {};
    ['color', 'line', 'center'].forEach(k => { if (HEX.test(src[k] || '')) p[k] = src[k]; });
    if (Array.isArray(src.colors)) p.colors = src.colors.slice(0, 3).map(c => (HEX.test(c || '') ? c : null));
    ['round', 'size', 'tail', 'petals', 'points', 'wave', 'density'].forEach(k => { if (src[k] != null) p[k] = num(src[k], 0, 1, 0.5); });
    if (src.rot != null) p.rot = num(src.rot, -360, 360, 0);
    if (src.angle != null) p.angle = num(src.angle, -180, 180, 0);
    if (src.lw != null) p.lw = num(src.lw, 0.1, 2, 0.3);
    if (['fill', 'line', 'both'].includes(src.style)) p.style = src.style;
    if (src.clear === true) p.clear = true;
    const o = { id: it.id, type, kind: it.kind, p, w: num(it.w, 3, 40, 10), count: Math.round(num(it.count, 1, 20, 1)), seed: Math.round(num(it.seed, 1, 1e9, 1)) };
    if (type === 'pattern') {
      o.shape = ['oval', 'square', 'almond'].includes(it.shape) ? it.shape : 'oval'; o.ratio = num(it.ratio, 1, 1.8, 1.3);
      if (HANDS[it.set]) o.set = it.set;
      else if (it.set === 'mine' && Array.isArray(it.widths) && it.widths.length === 5) { o.set = 'mine'; o.widths = it.widths.map(w => num(w, 5, 22, 12)); }
    }
    if (type === 'draw') { o.kind = 'draw'; o.strokes = (Array.isArray(it.strokes) ? it.strokes : []).slice(0, 400).map(s => ({ c: HEX.test((s && s.c) || '') ? s.c : '#2B2226', w: num(s && s.w, 0.5, 20, 3), pts: (s && Array.isArray(s.pts) ? s.pts : []).slice(0, 2000).filter(q => Array.isArray(q) && isFinite(q[0]) && isFinite(q[1])).map(q => [Math.max(0, Math.min(100, Math.round(q[0] * 10) / 10)), Math.max(0, Math.min(100, Math.round(q[1] * 10) / 10))]) })).filter(s => s.pts.length); }
    return o;
  }
  function cleanSheet(v) {
    const s = v && typeof v === 'object' ? v : {};
    const sc = typeof s.scale === 'number' && isFinite(s.scale) ? Math.max(0.9, Math.min(1.1, s.scale)) : 1;
    return { paper: PAPERS[s.paper] ? s.paper : 'a4', mirror: s.mirror === true, guides: s.guides !== false, scale: sc, items: (Array.isArray(s.items) ? s.items : []).map(cleanItem).filter(Boolean).slice(0, 40) };
  }

  T.stickers = { gaugeSvg, nailSpec, rulerLen, MOTIFS, PATTERNS, HANDS, FINGERS, PAPERS, nailPath, motifSvg, patternSvg, drawSvg, imageSvg, pieces, layout, sheetSvg, previewSvg, pdfFromJpeg, sheetPdf, wordsToPattern, aiPattern, cleanItem, cleanSheet, rng };
})(typeof window !== 'undefined' ? window : globalThis);
