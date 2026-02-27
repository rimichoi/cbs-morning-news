const CACHE_NAME = 'cbs-podcast-v6';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './cbs_icon.png',
  './styles.css',
  './app.js'
];

self.addEventListener('install', (event) => {
  // 즉시 활성화
  self.skipWaiting();
  
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

  // 앱 리소스 처리: Network First with Cache Fallback
  // (앱 업데이트를 즉시 반영하면서 오프라인도 지원)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 응답이 있으면 캐시 업데이트
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 조회
        return caches.match(event.request);
      })
  );
});

// 오래된 캐시 정리 및 즉시 제어권 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 모든 클라이언트에 대해 즉시 제어권 획득
      return self.clients.claim();
    })
  );
});
