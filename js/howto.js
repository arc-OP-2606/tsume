/* tsumé — デザインと選択から「キレイに作る手順」と、パーツ以外の小物を組む */
(function (global) {
  'use strict';
  const T = global.TSUME, H = T.HOWTO;
  const LV = ['first', 'some', 'expert'];
  const levelOf = sel => (LV.includes(sel.level) ? sel.level : 'some');
  const methodOf = sel => (sel.method === 'polish' ? 'polish' : 'gel');
  const familyOf = tid => H.TECH_FAMILY[tid] || 'color';
  const uniq = a => Array.from(new Set(a));
  const techsOf = f => [f.over, f.t].concat((f.layers || []).map(l => l.t)).filter(Boolean);
  const specsOf = d => (d.foot ? d.foot : d.left.concat(d.right));
  /** タイマーなどで手順を見分ける名前（段階や色を変えても同じ手順なら同じ） */
  const stepId = s => s.tid || s.kind || `${s.stage}:${s.title}`;
  // {cure} などをやり方の言葉に。空になった行は捨てる。やり方で分かれている値（{ gel, polish }）は選ぶ
  const say = (lines, W) => (lines || []).map(l => l.replace(/\{(\w+)\}/g, (_, k) => W[k] || '')).filter(l => l.replace(/[。\s]/g, '').length);
  const pick = (x, m) => (x && !Array.isArray(x) && typeof x === 'object' ? x[m] : x);

  function timerFor(kind, m) {
    if (!kind) return null;
    if (m === 'polish') return kind === 'top' ? { sec: H.CURE.polish_top, label: '乾くまで（速乾で約10分）' } : { sec: kind === 'base' ? H.CURE.polish_base : H.CURE.polish_coat, label: '乾かす（目安）' };
    if (kind === 'magnet') return { sec: H.CURE.magnet, label: '1本ずつライトで硬化' };
    if (kind === 'relief') return { sec: H.CURE.relief, label: 'ライトで硬化（熱ければすぐ出す）' };
    return { sec: H.CURE.gel, label: 'ライトで硬化' };
  }

  /** 手順。stage は engine.specAtStep が使う（0 準備・1 ベース・2 色・3 アート・4 トッピング・5 トップと仕上げ） */
  function steps(design, sel) {
    const lv = levelOf(sel), m = methodOf(sel), out = [];
    // チップは台の上で作るので、手の硬化の順番（親指は別に）は言わない
    const W = Object.assign({}, H.WORDS[m], sel.method === 'tip' ? { thumb: '' } : {});
    const step = o => Object.assign({ how: [], tools: [], timer: null }, o, {
      how: say(o.how, W),
      tip: o.tip ? say([pick(o.tip, m)], W)[0] || null : null,
      fix: (pick(o.fix, m) || []).map(([q, a]) => [say([q], W)[0], say([a], W)[0]]),
    });
    const specs = specsOf(design), techs = uniq(specs.flatMap(techsOf)).filter(tid => tid !== 'bare_gloss' && T.TECHNIQUES[tid]);
    out.push(step({ kind: 'prep-list', title: '用意するもの', body: '材料と道具をそろえて、手元に並べる。', stage: 0, how: H.PROMISES, tip: lv === 'first' ? 'はじめては、いきなり爪に塗らず、チップで1本試すと安心。' : m === 'gel' ? 'ライトとジェルが合っているか（LED・UV）を、先に確かめる。' : null }));
    H.PREP[m][lv].forEach(p => out.push(step({ title: p.title, body: p.how[0], how: p.how, tools: p.tools, tip: p.tip, stage: 0 })));
    if (sel.method === 'tip') out.push(step({ title: H.TIP_FIT.title, body: H.TIP_FIT.how[0], how: H.TIP_FIT.how, tools: H.TIP_FIT.tools, tip: H.TIP_FIT.tip, stage: 0 }));
    const peel = m === 'gel' && techs.includes('peel_one');
    out.push(step({ title: peel ? 'ピールオフベース' : W.base, body: m === 'polish' ? '薄く1度塗り。' : '薄く塗って硬化。', how: H.BASE.how[lv], tools: m === 'polish' ? ['remover'] : [], tip: peel ? H.PEEL_TIP : H.BASE.tip, fix: H.BASE.fix, timer: timerFor('base', m), stage: 1 }));
    // 色（stage 2）を先に、アート（stage 3）を後に。並びが変わっても specAtStep は tid で見る
    const techSteps = techs.map(tid => {
      const t = T.TECHNIQUES[tid], fam = H.FAMILY[familyOf(tid)];
      const glue = familyOf(tid) === 'parts' ? [m === 'polish' ? 'nail_glue' : 'parts_gel'] : [];
      const tools = fam.tools.concat(glue, lv === 'first' ? fam.toolsFirst || [] : [], lv === 'some' ? fam.toolsSome || [] : [], t.mats.filter(id => id !== 'top_gel'));
      return step({ title: t.name, body: t.desc, how: fam.how[lv], tools: uniq(tools.map(id => T.engine.matForMethod(id, sel.method)).filter(Boolean)), tip: fam.tip, fix: fam.fix, timer: timerFor(fam.timer, m), stage: T.engine.BASE_TECHS.includes(tid) ? 2 : 3, tid });
    });
    techSteps.filter(s => s.stage === 2).concat(techSteps.filter(s => s.stage === 3)).forEach(s => out.push(s));
    const kinds = uniq(specs.flatMap(f => (f.toppings || []).map(t => t.k)));
    if (kinds.length) {
      const tips = uniq(kinds.map(k => H.TOPPING[k].tip));
      out.push(step({
        title: 'トッピング', body: (lv === 'first' ? 'パーツは1本ずつ。' : '') + '大きいパーツから置き、小さいパーツですき間を埋める。',
        how: uniq(kinds.flatMap(k => H.TOPPING[k][m])), tools: [m === 'polish' ? 'nail_glue' : 'parts_gel', 'tweezers'], tip: tips.slice(0, 2).join(''),
        fix: [['パーツが取れる', '接着が少ない。まわりを囲むように足して、{again}。'], ['引っかかる', '先端・角・サイドは避け、中央から根元寄りに。まわりを囲んで段差をなくす。']],
        timer: timerFor('coat', m), stage: 4, tid: 'topping',
      }));
    }
    out.push(step({ title: W.top, body: m === 'polish' ? 'たっぷり1度。エッジを包む。' : 'パーツのまわりを囲み、エッジを包む。', how: H.TOP.how[lv].concat(m === 'polish' ? [H.TOP_POLISH_NOTE] : []), tip: H.TOP.tip, fix: H.TOP.fix, timer: timerFor('top', m), stage: 5 }));
    if (m === 'gel' && techs.includes('sugar_matte')) out.push(step(Object.assign({ body: H.MATTE_TOP.how[0], timer: timerFor('coat', m), stage: 5 }, H.MATTE_TOP)));
    if (sel.method === 'tip') out.push(step(Object.assign({ body: H.TIP_ON.how[0], stage: 5 }, H.TIP_ON)));
    out.push(step({ title: H.FINISH.title, body: H.FINISH.how[0], how: H.FINISH.how, tools: H.FINISH.tools, tip: H.FINISH.tip, stage: 5 }));
    out.push(step({ kind: 'check', title: '仕上がりチェック', body: 'できあがりを、5つの点で確かめる。', how: H.CHECK, tip: H.AFTERCARE[m], stage: 5 }));
    return out;
  }

  /** パーツ以外の小物も含め、手順の「使うもの」は全部材料に入れる（用意するもの・材料と食い違わないように） */
  const extras = (design, sel) => uniq(steps(design, sel).flatMap(s => s.tools)).filter(id => T.MATERIALS[id]);

  T.howto = { steps, extras, familyOf, levelOf, stepId };
})(typeof window !== 'undefined' ? window : globalThis);
