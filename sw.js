// Service worker: guarda os arquivos do app no celular pra ele abrir mesmo sem internet.
// Quando mudar algum arquivo do app, aumente a versão abaixo (v2, v3...) pra forçar a atualização.
const CACHE = 'rotina-v4';
const ARQUIVOS = ['./', './index.html', './regras.js?v=1.3.0', './animacoes.js?v=1.3.0', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(chaves =>
    Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// tenta a internet primeiro (pega atualizações); sem internet, usa o que está guardado
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const id = (e.notification.data && e.notification.data.materia) || '';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    const c = lista[0];
    if (c) { c.postMessage({ tipo: 'abrir-materia', id }); return c.focus(); }
    return clients.openWindow('./?materia=' + encodeURIComponent(id));
  }));
});
