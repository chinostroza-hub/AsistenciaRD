const CACHE_NAME = 'ugel-asistencia-v1.0.3';
const ASSETS = [
    'asistencia.html',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
];

// 1. Instalar y guardar los archivos en el disco duro del celular
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// 2. Limpiar versiones antiguas para no saturar la memoria
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    )));
    self.clients.claim();
});

// 3. Interceptar las peticiones de red (MAGIA OFFLINE)
self.addEventListener('fetch', e => {
    // Ignorar peticiones que no sean GET o que vayan a Google Sheets (esos no se cachean)
    if (e.request.method !== 'GET' || e.request.url.includes('script.google.com')) return;

    e.respondWith(
        caches.match(e.request).then(cachedRes => {
            // Si ya está en la memoria del celular, lo devuelve de inmediato
            if (cachedRes) return cachedRes;
            
            // Si no está, intenta descargarlo de internet
            return fetch(e.request).then(fetchRes => {
                const clone = fetchRes.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request.url, clone));
                return fetchRes;
            }).catch(() => {
                // Si falla (no hay internet en absoluto), muestra la página principal guardada
                if (e.request.mode === 'navigate') {
                    return caches.match('asistencia.html');
                }
            });
        })
    );
});
