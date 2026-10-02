/**
 * VidFast Pro AdBlocker & Popunder Filter Service Worker
 * Intercepts outbound network requests and drops ad network telemetry and popunders.
 */
const AD_DOMAINS = [
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'onclickads.net',
  'adcash.com',
  'exoclick.com',
  'juicyads.com',
  'trafficjunky.net',
  'adsterra.com',
  'hilltopads.net',
  'clickadu.com',
  'mgid.com',
  'revcontent.com',
  'taboola.com',
  'outbrain.com',
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'popunder',
  'adnetwork',
  'trackingscript',
  'bet365',
  '1xbet',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (AD_DOMAINS.some((d) => url.toLowerCase().includes(d))) {
    event.respondWith(new Response('', { status: 204, statusText: 'Blocked by VidFast AdShield' }));
  }
});
