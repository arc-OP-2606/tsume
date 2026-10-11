/* tsumé — Gemini を中継（relay/）経由で呼ぶ。モデルは中継が選ぶ（gemini-3.8-flash 以上の最新へ自動で切り替わる）。
   中継が無い・同意が無い・失敗・時間切れのときは null を返す。呼ぶ側は辞書の結果を使う */
(function (global) {
  'use strict';
  const T = global.TSUME;
  const KEY = 'tsume.ai.v1';
  const relay = () => (T.CONFIG && T.CONFIG.relayUrl ? String(T.CONFIG.relayUrl).replace(/\/$/, '') : '');
  const available = () => !!relay() && typeof fetch === 'function';
  function consent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } } // 'yes' | 'no' | null
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  const usable = () => available() && consent() === 'yes';
  // 人の名前らしい語（「〜さん」「〜くん」「〜様」の前）は送る前に伏せる
  const mask = s => String(s || '').replace(/[^\s、。・,]{1,12}(さん|くん|ちゃん|様|さま)/g, '○○$1').slice(0, 200);
  /** JSON で答えさせる。返り値 { data, model } か null */
  async function generateJSON(prompt, schema, opts) {
    if (!usable()) return null;
    opts = opts || {};
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, opts.timeout || 25000);
    try {
      const headers = { 'content-type': 'application/json' };
      if (T.CONFIG.relayToken) headers['x-tsume-token'] = T.CONFIG.relayToken;
      const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: opts.temperature == null ? 0.7 : opts.temperature, responseMimeType: 'application/json', responseSchema: schema, maxOutputTokens: opts.maxTokens || 1024 } };
      const r = await fetch(relay() + '/v1/generate', { method: 'POST', headers, body: JSON.stringify({ body }), signal: ctrl ? ctrl.signal : undefined });
      if (!r.ok) return null;
      const j = await r.json(), c = (j.candidates || [])[0];
      const text = c && c.content && Array.isArray(c.content.parts) ? c.content.parts.map(p => p.text || '').join('') : '';
      return { data: JSON.parse(text), model: r.headers.get('x-tsume-model') || '' };
    } catch (e) { return null; } finally { clearTimeout(timer); }
  }
  T.ai = { available, consent, setConsent, usable, mask, generateJSON };
})(typeof window !== 'undefined' ? window : globalThis);
