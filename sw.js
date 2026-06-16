// ══════════════════════════════════════
// sw.js - Service Worker（オフライン対応）
// ══════════════════════════════════════

const CACHE_NAME = 'denshi-yachou-v2';

// キャッシュするファイル一覧
// ※ NotoSansJP.b64.js は除外
const CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/calc.js',
  '/js/export.js',
  '/pages/create.html',
  '/pages/input.html',
  '/pages/check.html',
  '/pages/export.html',
  '/pages/master.html',
  '/pages/history.html',
  '/pages/settings.html',
  '/pages/guide.html',
  '/pages/tutorial.html',
];

// インストール時にキャッシュする
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_FILES))
      .catch(err => console.warn('キャッシュ失敗:', err))
  );
});

// 古いキャッシュを全て削除する
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            console.log('古いキャッシュ削除:', k);
            return caches.delete(k);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// リクエスト時：キャッシュ優先・なければネット取得
self.addEventListener('fetch', event => {
  // Chrome拡張やPostMessageは無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            // 正常なレスポンスのみキャッシュ
            if (
              response &&
              response.status === 200 &&
              response.type === 'basic'
            ) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // オフライン時はホーム画面を返す
            return caches.match('/index.html');
          });
      })
  );
});