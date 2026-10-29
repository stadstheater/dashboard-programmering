// Eerst het netwerk, zodat je altijd de nieuwste versie ziet. Zonder verbinding valt de app terug op wat eerder is geladen.
const CACHE = 'coulisse-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const verzoek = e.request
  if (verzoek.method !== 'GET' || new URL(verzoek.url).origin !== location.origin) return
  e.respondWith(
    fetch(verzoek)
      .then((antwoord) => {
        if (antwoord.ok) {
          const kopie = antwoord.clone()
          caches.open(CACHE).then((c) => c.put(verzoek.mode === 'navigate' ? '/' : verzoek, kopie))
        }
        return antwoord
      })
      .catch(() => caches.match(verzoek.mode === 'navigate' ? '/' : verzoek).then((m) => m ?? Response.error())),
  )
})
