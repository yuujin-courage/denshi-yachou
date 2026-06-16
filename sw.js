// ══════════════════════════════════════
// sw.js - Service Worker（オフライン対応）
// ══════════════════════════════════════

const CACHE_NAME = 'denshi-yachou-v1';

// キャッシュするファイル一覧
const CACHE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/db.js',
  '/js/calc.js',
  '/js/export.js',
  '/js/NotoSansJP.b64.js',
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
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除する
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// リクエスト時：キャッシュ優先・なければネット取得
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});