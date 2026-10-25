/**
 * sw.js — Service worker: hace la app instalable y usable sin conexión.
 *
 * Estrategias:
 * - Archivos de la app (HTML, CSS, JS, iconos): primero la red (con un límite
 *   de espera corto) y, si no hay conexión, la copia guardada. Así, con
 *   internet siempre se usa la última versión publicada sin tener que tocar
 *   nada aquí, y sin internet la app sigue funcionando.
 * - vendor/ (librerías, fuentes y OCR, con la versión en el nombre): primero la
 *   copia guardada; no cambian nunca. El OCR (vendor/tesseract, ~10 MB) no se
 *   descarga por adelantado: se guarda la primera vez que se usa.
 *
 * Solo hay que cambiar VERSION si se añaden o quitan archivos de las listas.
 */

const VERSION = '3';
const SHELL_CACHE = `fh-shell-v${VERSION}`;
const VENDOR_CACHE = `fh-vendor-v${VERSION}`;
const NETWORK_TIMEOUT_MS = 3500;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/state.js',
  'js/db.js',
  'js/ui.js',
  'js/pwa.js',
  'js/ambience.js',
  'js/outpostUI.js',
  'js/flowchartUI.js',
  'js/narratorUI.js',
  'js/speech.js',
  'js/galleryUI.js',
  'js/chronicleUI.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
];

const VENDOR = [
  'vendor/tailwind-3.4.16.js',
  'vendor/lucide-0.468.0.min.js',
  'vendor/html2canvas-1.4.1.min.js',
  'vendor/jspdf-2.5.1.umd.min.js',
  'vendor/fonts/fonts.css',
  'vendor/fonts/cinzel-latin.woff2',
  'vendor/fonts/cinzel-latin-ext.woff2',
  'vendor/fonts/inter-latin.woff2',
  'vendor/fonts/inter-latin-ext.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
      const vendor = await caches.open(VENDOR_CACHE);
      await vendor.addAll(VENDOR);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, VENDOR_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith('fh-') && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

/** Primero red (con límite de espera); si falla, la copia guardada. */
async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), NETWORK_TIMEOUT_MS));
  const first = await Promise.race([network, timeout]);
  if (first && first !== 'timeout') return first;

  const cached =
    (await cache.match(request, { ignoreSearch: true })) ??
    (request.mode === 'navigate' ? await cache.match('index.html') : undefined);
  if (cached) return cached;
  // Sin copia: esperar a la red aunque tarde.
  const late = await network;
  return late ?? new Response('Sin conexión', { status: 503, statusText: 'Offline' });
}

/** Primero la copia guardada; si no está, red y se guarda. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return; // la app no usa nada externo
  const inVendor = url.pathname.includes('/vendor/');
  event.respondWith(inVendor ? cacheFirst(request, VENDOR_CACHE) : networkFirst(request));
});

/** La app pide refrescar la copia de todos sus archivos (al arrancar con conexión). */
self.addEventListener('message', (event) => {
  if (event.data === 'refresh-shell') {
    event.waitUntil(
      caches.open(SHELL_CACHE).then((cache) =>
        Promise.all(
          SHELL.map((u) =>
            fetch(new Request(u, { cache: 'no-cache' }))
              .then((r) => r.ok && cache.put(u, r))
              .catch(() => {}),
          ),
        ),
      ),
    );
  }
});
