/* tsumé — 外とつなぐ設定。relayUrl が空のあいだは AI を使わず、辞書だけで動く（relay/README.md） */
(function (global) {
  'use strict';
  const T = global.TSUME || (global.TSUME = {});
  T.CONFIG = {
    relayUrl: '',   /* 例: 'https://tsume-relay.<account>.workers.dev'（デプロイ後に入れる） */
    relayToken: '', /* 中継の APP_TOKEN と同じ値 */
  };
})(typeof window !== 'undefined' ? window : globalThis);
