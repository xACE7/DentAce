/* DentAce — service-worker KILL SWITCH.
   A previously-registered service worker was caching pages/CSS and breaking dev updates,
   so edits never appeared to change anything. This version takes control, deletes every
   cache, unregisters itself, and reloads any open tabs — after which the browser talks
   straight to the server again (no SW in the middle). */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        clients.forEach((client) => client.navigate(client.url));
      } catch (e) {
        /* ignore */
      }
    })()
  );
});

/* No fetch handler on purpose → the browser bypasses this worker for every request. */
