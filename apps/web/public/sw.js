/* Service worker: офлайн-кеш + сетевые стратегии для Fullstack Core.
   Обновление: поднять VERSION и пересобрать приложение. */
const VERSION = 'fullstack-core-v1'
const STATIC_CACHE = `${VERSION}-static`
const PAGE_CACHE = `${VERSION}-pages`

const PRECACHE = ['/', '/icons/icon-192.png', '/icons/icon-512.png', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Навигация: сначала сеть, при ошибке — офлайн-фолбэк из кеша последних страниц.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          return caches.match('/')
        })
        .catch(() => new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))
    )
    return
  }

  // Статика Next (chunks/стили) и приложение: кешируем успешные ответы, fallback на сеть.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          })
      )
    )
    return
  }

  // Остальное (favicon, manifest, inline-скрипты): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
    )
  )
})