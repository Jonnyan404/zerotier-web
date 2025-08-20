const CACHE_NAME = 'zt-dashboard-v2';  // 更新版本号
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

self.addEventListener('install', evt => {
  console.log('SW installing...');
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets:', STATIC_ASSETS);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW installed successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('SW install failed:', err);
        // 即使部分缓存失败也继续安装
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', evt => {
  console.log('SW activating...');
  evt.waitUntil(
    // 清理旧缓存
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW activated');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);

  // 不拦截跨域请求
  if (url.origin !== location.origin) {
    return;
  }

  // API: network-first
  if (url.pathname === '/api/nodes') {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(evt.request))
    );
    return;
  }

  // 导航请求：network-first
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
          }
          return res;
        })
        .catch(err => {
          console.log('Network failed for navigation, trying cache:', err);
          return caches.match('/index.html')
            .then(cached => {
              if (cached) return cached;
              return new Response('网络连接失败，请检查网络后重试', { 
                status: 503, 
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
        })
    );
    return;
  }

  // 其它静态资源：network-first
  evt.respondWith(
    fetch(evt.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(evt.request))
  );
});