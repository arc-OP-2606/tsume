/* tsumé — 「わたしの手」: 画面に置いた指先の位置から、手の左右と爪の大きさ（3段階）を出す。端末内だけ。
   実機の試し（2026-10-13・iPhone 横向き・指をくっつけて3回）で、隣の指の横の間隔は1回ごとに±15%ぶれた。
   そのため指ごとの比は取らず、手全体の大きさを3段階に丸める。mm は目安（画面の点→mm は機種で違う） */
(function (global) {
  'use strict';
  const T = global.TSUME = global.TSUME || {};
  const KEY = 'tsume.hand.v1';
  const PX_PER_MM = 6.0;      // iPhone（3倍）でおよそ6点で1mm。目安
  const NAIL_PER_GAP = 0.92;  // 指の間隔→爪の幅（塾長の手: 間隔 約13.6mm、爪 約12.5mm）
  const SIZES = {
    S: { name: '小さめ', w: 0.9, mm: 9 },
    M: { name: 'ふつう', w: 1, mm: 10 },
    L: { name: '大きめ', w: 1.12, mm: 12 },
  };
  const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
  /** points: [{x,y}] 3〜5本（親指が入っていてもよい）。landscape: 横向きか */
  function fit(points, landscape) {
    if (!Array.isArray(points) || points.length < 3) return null;
    const along = p => (landscape ? p.x : p.y), across = p => (landscape ? p.y : p.x);
    let s = points.slice().sort((a, b) => along(a) - along(b));
    // 親指: ほかより大きく離れて低い所にある1本は外す
    if (s.length === 5) { const d0 = along(s[1]) - along(s[0]), d4 = along(s[4]) - along(s[3]); s = d0 > d4 ? s.slice(1) : s.slice(0, 4); }
    // 小指: 両端のうち先端が手前（短い）ほう。左手を横向きに置くと小指は左
    const pinkyFirst = across(s[0]) >= across(s[s.length - 1]);
    const side = landscape ? (pinkyFirst ? 'left' : 'right') : null;
    const fingers = pinkyFirst ? s : s.slice().reverse();
    // 小指と薬指の間は斜めに離れるので使わない。真ん中の隣どうしの横の間隔だけ
    const gaps = []; for (let i = 2; i < fingers.length; i++) gaps.push(Math.abs(along(fingers[i]) - along(fingers[i - 1])));
    const nailMm = (median(gaps) / PX_PER_MM) * NAIL_PER_GAP;
    return { side, nailMm: Math.round(nailMm * 10) / 10 };
  }
  /** 2回以上の結果をまとめて、3段階に丸める（女性の既定がふつう。塾長の指定: 女性は男性の約0.8） */
  function decide(results) {
    const ok = results.filter(Boolean); if (!ok.length) return null;
    const mm = median(ok.map(r => r.nailMm));
    const size = mm < 9.5 ? 'S' : mm < 11.3 ? 'M' : 'L';
    const sides = ok.map(r => r.side).filter(Boolean);
    const side = sides.filter(v => v === 'left').length >= sides.filter(v => v === 'right').length ? 'left' : 'right';
    return { size, side, nailMm: Math.round(mm * 10) / 10 };
  }
  function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); return v && SIZES[v.size] ? v : null; } catch (e) { return null; } }
  function save(v) { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); return true; } catch (e) { return false; } }
  let mine = null; try { mine = typeof localStorage !== 'undefined' ? load() : null; } catch (e) {}
  T.handFit = {
    fit, decide, SIZES, KEY,
    get: () => mine,
    set: v => { mine = v && SIZES[v.size] ? { size: v.size, side: v.side, nailMm: v.nailMm, at: Date.now() } : null; save(mine); },
    /** 手の絵の幅の倍率（保存していなければ 1 = 今までと同じ絵） */
    widthScale: () => (mine ? SIZES[mine.size].w : 1),
  };
})(typeof window !== 'undefined' ? window : globalThis);
