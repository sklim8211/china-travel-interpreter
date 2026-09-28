/* 10단계: 오프라인 대비 — 최소 캐싱 서비스워커
   지금 이 순간 카드 / SOS / 숙소정보는 localStorage에만 의존하므로,
   이 앱의 뼈대(HTML)와 정적 자산(음성·캐릭터 이미지)만 캐시해두면
   인터넷이 없어도 화면 자체는 열리고, 그 안의 정보는 그대로 보인다. */
const CACHE_NAME = 'cti-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/china-travel-interpreter-prototype.html',
  '/assets/gibyeori/joy.png',
  '/assets/gibyeori/nod.png',
  '/assets/gibyeori/relieved.png',
  '/assets/gibyeori/anxious.png',
  '/assets/gibyeori/poke.png',
  '/audio/en/hospital-01.mp3',
  '/audio/en/hospital-02.mp3',
  '/audio/en/hospital-03.mp3',
  '/audio/en/hospital-04.mp3',
  '/audio/en/hospital-05.mp3',
  '/audio/en/hospital-06.mp3',
  '/audio/en/pharmacy-01.mp3',
  '/audio/en/pharmacy-02.mp3',
  '/audio/en/pharmacy-03.mp3',
  '/audio/en/pharmacy-04.mp3',
  '/audio/en/pharmacy-05.mp3',
  '/audio/en/pharmacy-06.mp3',
  '/audio/en/hotel-01.mp3',
  '/audio/en/hotel-02.mp3',
  '/audio/en/hotel-03.mp3',
  '/audio/en/hotel-04.mp3',
  '/audio/en/police-01.mp3',
  '/audio/en/police-02.mp3',
  '/audio/en/police-03.mp3',
  '/audio/en/police-04.mp3',
  '/audio/en/police-05.mp3',
  '/audio/en/police-06.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(CORE_ASSETS.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 다른 도메인(챗GPT·번역기 등)은 건드리지 않음

  const isHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHtml) {
    // 화면(HTML)은 최신 내용을 우선 시도하고, 오프라인이면 마지막으로 저장된 화면을 보여줌
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/china-travel-interpreter-prototype.html')))
    );
    return;
  }

  // 이미지·음성 같은 정적 자산은 캐시를 우선 쓰고, 없으면 받아와서 다음을 위해 저장
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});
