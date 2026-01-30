const CACHE_NAME = 'cbs-podcast-v4';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './cbs_icon.png',
  './styles.css',
  './app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API 요청 (뉴스 목록) 처리: Network First (네트워크 우선, 실패 시 캐시)
  if (url.href.includes('cbs.co.kr/board/list')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 유효한 응답이면 캐시에 저장 후 반환
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 조회
          return caches.match(event.request);
        })
    );
    return;
  }

  // 기본 리소스 처리: Cache First (캐시 우선, 없으면 네트워크)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
