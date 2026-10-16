// Service worker Caliumi Racing — rende il sito installabile come app
// (più avanti servirà anche per le notifiche push)
const VERSIONE = "v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Solo per l'apertura delle pagine: se manca la connessione mostra un messaggio invece della pagina bianca
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Caliumi Racing – Offline</title></head>
          <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">
          <div><h1 style="color:#F5D300;font-style:italic;margin:0 0 8px">CALIUMI <span style="color:#E10600">Racing</span></h1>
          <p style="opacity:.8">Sei offline. Riconnettiti per leggere le ultime notizie.</p>
          <button onclick="location.reload()" style="margin-top:12px;background:#F5D300;color:#000;border:0;border-radius:8px;padding:10px 18px;font-weight:700">Riprova</button></div>
          </body></html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        )
    )
  );
});