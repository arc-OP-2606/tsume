/* tsumé — 音声 tsumé ソムリエ（サンプル）。選んだ色・技法・トッピング・シーンを1つのパッケージとして、
   印象と「映える」角度・光・背景・撮り方を30〜60秒で語る。中身は知識（下の FACTS）から組み、AI（Gemini）は言い回しだけを整える。
   声は端末の読み上げ（外に送らない） */
(function (global) {
  'use strict';
  const T = global.TSUME, E = T.engine, U = T.ui;
  const { esc, ICON } = U;
  // [k, 文, 重み, 光の向き or 撮る角度]  k: angle=角度 light=光。光の向き: s=強い光 / w=やわらかい光（いちばん重い光の文と逆向きの文は使わない）。
  // angle の4つ目は「おすすめの1枚」で使う角度（いちばん重い角度の文に合わせる）
  const FAMILY = {
    magnet: [['angle', '爪を少し傾けると、光の線がすっと動きます。真上より、斜め45度から見せてください。', 9, '斜め45度から'], ['light', '光は強いほど線がくっきり。日なたや、スマホのライトを斜め上から当てると、線が一本に締まります。', 8, 's']],
    powder: [['angle', '角度で色や映り込みが変わる仕上げです。指をゆっくり回して、いちばん光る角度を探してください。', 8, 'いちばん光る角度で'], ['light', '太陽の下でいちばん表情が動きます。', 6, 's']],
    glitter: [['light', 'ラメやホロは、光の方へ指を向けるとちらっと虹色に。少し暗い場所でカメラのフラッシュを使うと、粒が一斉に光ります。', 8, 's']],
    color: [['light', '透け感やツヤは、窓際のやわらかい自然光でいちばんきれいに見えます。', 2, 'w']],
    grad: [['angle', '指先を少し下げて、色が流れて見える角度で。', 5, '指先を少し下げた角度で']],
    french: [['angle', '主役は指先のライン。指をそろえて、少し下から見上げる角度で。', 6, '少し下から']],
    brush: [['angle', '描いた線がつぶれないよう、真上から。', 4, '真上から']],
    dots: [['angle', 'ドットの丸さが伝わるよう、真上から。', 3, '真上から']],
    foil: [['light', '金箔は小さな光でもきらりと光ります。ライトの真下より、少し横からの光で。', 6]],
    relief: [['light', 'ぷっくりした所に光の点がのるよう、斜め上から光を当てて。', 6]],
    matte: [['light', 'マットはフラッシュを使わず、自然光で。砂糖のような質感が出ます。', 9, 'w']],
    sticker: [['angle', 'シールは平らなので、真正面からがいちばん形がきれいです。', 3, '真正面から']],
  };
  const KIND = {
    stone: [['light', 'ストーンは点の光に強い。太陽の下や、お店のスポットライトの下で指をゆっくり動かすと、きらっと光ります。', 10, 's']],
    pearl: [['light', 'パールはやわらかい光で艶が出ます。直射日光より、窓際の光で。', 7, 'w']],
    charm: [['light', '斜めからの光で、金属に影ができて立体感が出ます。', 6]],
    bullion: [['light', 'ブリオンの粒は、斜めの光で一粒ずつ光ります。', 4]],
    chain: [['light', 'チェーンは斜めの光で影が出て、立体感が増します。', 5]],
    flower3d: [['angle', '立体のお花は、真横に近い角度で、花びらの重なりを見せて。', 7, '真横に近い角度から']],
    sticker: [['angle', 'シールは真正面から。柄がゆがまずに写ります。', 3, '真正面から']],
    flake: [['light', 'ホログラムは、光の方へ向けると虹色に変わります。', 5, 's']],
  };
  // 背景の紙は1つに決める（黒: 光る粒や金属の輪郭が締まる／白: 色が澄み、レフ板にもなる）
  const DARK_BG = { stone: 'ストーンの輝き', stud: 'スタッズの形', charm: 'メタルパーツの輪郭', chain: 'チェーンの輪郭' };
  const MOOD_ADJ = { sheer: '透明感のある', classic: '上品な', glam: '華やかな', mode: 'モードな', sweet: '甘い', natural: 'ナチュラルな', art: 'アートな', wa: '和モダンな', mens: 'すっきりした' };
  const specsOf = d => d.foot || d.left;
  const CHARS_PER_SEC = 5.5, MAX = 330;
  const len = lines => lines.reduce((n, l) => n + l.text.length, 0);

  /** 知識から、読む文を組む。{ lines: [{ k, text }], sec } */
  function script(d, sel, season) {
    const specs = specsOf(d), sit = E.situation(sel, season);
    const techs = Array.from(new Set(specs.flatMap(E.techsOf)));
    const fams = Array.from(new Set(techs.map(t => T.howto.familyOf(t))));
    const kinds = Array.from(new Set(specs.flatMap(f => (f.toppings || []).map(t => t.k))));
    const moodId = sel.mood || (d.concept.moods || [])[0];
    const tops = T.toppings.summary(specs);
    const facts = [];
    const fact = (w0) => ([k, text, w, x]) => facts.push(k === 'angle' ? { k, text, w: w + w0, view: x } : { k, text, w: w + w0, tone: x });
    fams.forEach(f => (FAMILY[f] || []).forEach(fact(0)));
    kinds.forEach(kd => (KIND[kd] || []).forEach(fact(1)));
    const sorted = k => facts.filter(x => x.k === k).sort((a, b) => b.w - a.w).filter((x, i, a) => a.findIndex(y => y.text === x.text) === i);
    const lights = sorted('light'), tone = (lights.find(x => x.tone) || {}).tone || 'w';
    const light = lights.filter(x => !x.tone || x.tone === tone).filter((x, i, a) => !(x.w <= 2 && a.length > 1));
    const dark = kinds.find(k => DARK_BG[k]);
    const bg = { k: 'bg', text: dark ? `黒い紙や布の上だと、${DARK_BG[dark]}が際立ちます。` : '白い紙の上に手を置くと、色が澄んで見え、紙がレフ板の代わりにもなります。' };
    const intro = { k: 'intro', text: `${d.concept.name}。${d.palette.name}の${MOOD_ADJ[moodId] || ''}指先${tops ? `に、${tops}がアクセント` : ''}です。` };
    const note = sit.light.note, where = sit.scene ? `${sit.scene.name}の${sit.light.name}` : sit.light.name;
    const scene = { k: 'scene', text: /光。$/.test(note) ? `${where}は、${note.replace(/。$/, '')}です。` : `${where}では、${note}` };
    const best = tone === 's' ? '日なたや明るいライトの下で' : fams.includes('matte') ? '窓際の自然光で、フラッシュは使わず' : '窓際のやわらかい光で';
    const angles = sorted('angle'), view = (angles[0] || {}).view || '斜め45度から';
    const shot = { k: 'shot', text: `おすすめの1枚は、${best}、${dark ? '黒い紙' : '白い紙'}を下に敷いて、指をそろえて${view}。` };
    const lines = [intro, scene].concat(angles.slice(0, 1), light.slice(0, 2), [bg, shot]).map(x => ({ k: x.k, text: x.text }));
    // 60秒を超えそうなら、最後の1枚の前から外す（はじめの2文と最後の1枚は残す）
    while (len(lines) > MAX && lines.length > 4) lines.splice(lines.length - 2, 1);
    return { lines, sec: Math.round(len(lines) / CHARS_PER_SEC) };
  }

  // ---- AI（Gemini）で言い回しを整える。事実は足さない
  const KS = ['intro', 'scene', 'angle', 'light', 'bg', 'shot'];
  async function polish(base) {
    const schema = { type: 'OBJECT', properties: { lines: { type: 'ARRAY', items: { type: 'OBJECT', properties: { k: { type: 'STRING', enum: KS }, text: { type: 'STRING' } }, required: ['k', 'text'] } } }, required: ['lines'] };
    const prompt = ['あなたは「tsumé ソムリエ」。ネイルの魅力と、映える見せ方を語る案内役。',
      '次の事実だけを使って、声で読む台本に整える。事実を足さない・変えない。やわらかく上品な話し言葉で。',
      `全体で150〜320文字（30〜60秒）。k はそのまま残す。`,
      '事実:', JSON.stringify(base.lines)].join('\n');
    const r = await T.ai.generateJSON(prompt, schema, { temperature: 0.6, maxTokens: 1536 });
    if (!r || !r.data || !Array.isArray(r.data.lines)) return null;
    const lines = r.data.lines.filter(l => l && KS.includes(l.k) && typeof l.text === 'string').map(l => ({ k: l.k, text: l.text.replace(/[<>]/g, '').trim().slice(0, 120) })).filter(l => l.text);
    const chars = len(lines);
    if (lines.length < 3 || chars < 120 || chars > 380) return null;
    return { lines, sec: Math.round(chars / CHARS_PER_SEC), model: r.model || 'gemini' };
  }

  // ---- シート（読み上げと、読んでいる文の強調）
  const LABEL = { intro: '印象', scene: 'シーンの光', angle: '映える角度', light: '映える光', bg: '背景・紙', shot: 'おすすめの1枚' };
  function sheet(st, op) {
    const s = st.somm; if (!s) return '';
    const can = T.voice.available();
    return `<div class="sheet-back${op}" data-act="somm-close" aria-hidden="true"></div>
      <section class="sheet somm-sheet${op}" role="dialog" aria-modal="true" aria-label="tsumé ソムリエ">
        <header class="sheet-head"><b>tsumé ソムリエ</b><button class="iconbtn" data-act="somm-close" aria-label="閉じる">${ICON.close}</button></header>
        <div class="sheet-body">
          <div class="somm-top"><span class="somm-wave${s.playing ? ' on' : ''}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="small muted">約${s.sec}秒${s.ai ? `・言い回し: AI（${esc(s.ai)}）` : ''}${s.busy ? '・AIで整えています…' : ''}</span></div>
          <ol class="somm-lines">${s.lines.map((l, i) => `<li data-i="${i}"><span class="somm-k">${LABEL[l.k] || ''}</span>${esc(l.text)}</li>`).join('')}</ol>
          <p class="small muted">${can ? '声は端末の読み上げです（外には送りません）。' : 'この端末では読み上げが使えないので、文字でご覧ください。'}</p>
        </div>
        <footer class="sheet-foot">${can ? `<button class="btn rose block" data-act="somm-play">${s.playing ? '■ 止める' : `${ICON.play}聞く（約${s.sec}秒）`}</button>` : ''}</footer>
      </section>`;
  }
  const mark = i => { if (typeof document === 'undefined') return; document.querySelectorAll('.somm-lines li').forEach(li => li.classList.toggle('on', +li.dataset.i === i)); };
  function play(st) {
    const s = st.somm; if (!s) return;
    if (s.playing) { T.voice.stop(); s.playing = false; T.app.render(); return; }
    s.playing = true; T.app.render();
    T.voice.speak(s.lines.map(l => l.text), { onLine: mark, onEnd: () => { s.playing = false; if (st.sheet === 'sommelier') T.app.render(); } });
  }
  Object.assign(T.actions, {
    'somm-open': async (el, st) => {
      const d = st.current && U.designFor(st.current.conceptId, st.current.paletteIndex); if (!d) return;
      const base = script(d, st.sel, st.season);
      const mine = st.somm = Object.assign({ playing: false, busy: T.ai.usable(), ai: null }, base); st.sheet = 'sommelier'; T.app.render();
      if (!mine.busy) return;
      const r = await polish(base);
      if (st.somm !== mine || st.sheet !== 'sommelier') return; // 待つ間に閉じた・別のデザインで開き直した
      mine.busy = false; if (r && !mine.playing) Object.assign(mine, { lines: r.lines, sec: r.sec, ai: r.model });
      T.app.render();
    },
    'somm-play': (el, st) => play(st),
    'somm-close': (el, st) => { T.voice.stop(); if (st.somm) st.somm.playing = false; st.sheet = null; T.app.render(); },
  });
  // 戻る・Esc などでシートが閉じたときも、読み上げを止める
  if (typeof window !== 'undefined') window.addEventListener('tsume:render', () => { const st = T.app.state; if (st.somm && st.somm.playing && st.sheet !== 'sommelier') { T.voice.stop(); st.somm.playing = false; } });
  T.sommelier = { script, polish, sheet };
})(typeof window !== 'undefined' ? window : globalThis);
