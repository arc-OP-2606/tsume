/* tsumé — 外とつなぐ設定。relayUrl が空のあいだは AI を使わず、辞書だけで動く（relay/README.md） */
(function (global) {
  'use strict';
  const T = global.TSUME || (global.TSUME = {});
  T.CONFIG = {
    relayUrl: 'https://tsume-relay.natsu-sui.workers.dev', /* relay/ をデプロイした URL（空にすると AI を使わない） */
    relayToken: '950355637af4b72eacdaf0079cac7395', /* 中継の APP_TOKEN と同じ値 */
  };
})(typeof window !== 'undefined' ? window : globalThis);
