// Sistema de archivos virtual de la vista previa (Cache Storage + service worker).
const CACHE = "ui5-preview-v1";
export const DEFAULT_CDN = "https://ui5.sap.com/1.136.11";

export function cdnUrl() {
  try {
    return localStorage.getItem("abapp.ui5cdn") || DEFAULT_CDN;
  } catch {
    return DEFAULT_CDN;
  }
}

const MIME = {
  html: "text/html; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  properties: "text/plain; charset=utf-8",
  css: "text/css; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

let ready = null;
export function ensureServiceWorker() {
  if (ready) return ready;
  ready = (async () => {
    if (!("serviceWorker" in navigator) || !("caches" in window)) throw new Error("Este navegador no permite la vista previa (falta Service Worker).");
    const reg = await navigator.serviceWorker.register("/ui5-sw.js", { scope: "/ui5preview/" });
    const sw = reg.active || reg.waiting || reg.installing;
    if (sw && sw.state !== "activated") {
      await new Promise((resolve) => {
        sw.addEventListener("statechange", () => sw.state === "activated" && resolve());
        setTimeout(resolve, 4000);
      });
    }
    return reg;
  })();
  ready.catch(() => (ready = null));
  return ready;
}

// Publica los archivos de webapp/ del proyecto en /ui5preview/<proyecto>/
export async function publishProject(name, files) {
  await ensureServiceWorker();
  const cache = await caches.open(CACHE);
  const base = `${location.origin}/ui5preview/${name}/`;
  for (const req of await cache.keys()) if (req.url.startsWith(base)) await cache.delete(req);
  await cache.put(`${location.origin}/ui5preview/__config.json`, new Response(JSON.stringify({ cdn: cdnUrl() }), { headers: { "Content-Type": "application/json" } }));
  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith("webapp/")) continue;
    const rel = path.slice("webapp/".length);
    const ext = rel.split(".").pop().toLowerCase();
    await cache.put(base + rel, new Response(content, { headers: { "Content-Type": MIME[ext] || "text/plain; charset=utf-8", "Cache-Control": "no-store" } }));
  }
  return base;
}

export function previewUrl(name, file = "index.html") {
  return `/ui5preview/${name}/${file}`;
}
