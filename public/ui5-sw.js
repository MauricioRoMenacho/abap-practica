// Service worker de la vista previa de SAPUI5: sirve los archivos del proyecto
// (guardados en Cache Storage por el editor) como si fuera el servidor de desarrollo
// de Business Application Studio. "resources/" se redirige al CDN de SAPUI5.
const CACHE = "ui5-preview-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

const CAPTURE = `<script>(function(){var p=window.parent;function send(t,a){try{p.postMessage({__ui5console:true,type:t,text:Array.prototype.map.call(a,function(x){try{return x instanceof Error?(x.message+(x.stack?"\\n"+x.stack.split("\\n").slice(1,3).join("\\n"):"")):typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}}
["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){send(k,arguments);return o.apply(console,arguments)}});
window.addEventListener("error",function(e){send("error",[e.message+(e.filename?" ("+e.filename.split("/").pop()+":"+e.lineno+")":"")])});
window.addEventListener("unhandledrejection",function(e){send("error",[e.reason])});})();</script>`;

const SYNCXHR = `<script>(function(){var F=window.__ui5files||{};var o=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u,a){if(a===false){try{var x=new URL(u,location.href);if(x.origin===location.origin&&F[x.pathname]!==undefined){var t=/\\.xml$/.test(x.pathname)?"application/xml":/\\.json$/.test(x.pathname)?"application/json":"text/plain";arguments[1]=URL.createObjectURL(new Blob([F[x.pathname]],{type:t}))}}catch(e){}}return o.apply(this,arguments)}})();</script>`;

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/ui5preview/")) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      let path = url.pathname;
      if (path.endsWith("/")) path += "index.html";
      const hit = await cache.match(url.origin + path);
      if (hit) {
        if (path.endsWith(".html")) {
          let html = await hit.text();
          // las peticiones síncronas (XHR sync, p. ej. MockServer) no pasan por el service worker:
          // se incrustan los archivos del proyecto y se sirven desde memoria
          const prefix = path.replace(/[^/]*$/, "").replace(/^(\/ui5preview\/[^/]+\/).*$/, "$1");
          const files = {};
          for (const req of await cache.keys()) {
            const u = new URL(req.url);
            if (u.pathname.startsWith(prefix) && !u.pathname.endsWith(".html")) files[u.pathname] = await (await cache.match(req)).text();
          }
          const inject = `<script>window.__ui5files=${JSON.stringify(files).replace(/</g, "\\u003c")};</script>` + SYNCXHR + CAPTURE;
          html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html;
          return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
        }
        return hit.clone();
      }
      const m = path.match(/^\/ui5preview\/[^/]+\/(?:.*?\/)?(resources|test-resources)\/(.*)$/);
      if (m) {
        const cfgRes = await cache.match(url.origin + "/ui5preview/__config.json");
        const cfg = cfgRes ? await cfgRes.json() : { cdn: "https://ui5.sap.com/1.136.11" };
        return Response.redirect(`${cfg.cdn}/${m[1]}/${m[2]}${url.search}`, 302);
      }
      return new Response(`404 - No existe el archivo ${path.replace(/^\/ui5preview\/[^/]+\//, "")} en el proyecto`, { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    })(),
  );
});
