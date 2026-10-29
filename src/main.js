import { Buffer } from "buffer";
import "./style.css";

// el código ABAP transpilado usa Buffer (como en Node)
globalThis.Buffer = globalThis.Buffer || Buffer;
import { App } from "./app.js";
import { store } from "./store.js";
import { guidePanel, openGame } from "./guides.js";
import { homeScreen } from "./screens/home.js";
import { se38Screen } from "./screens/se38.js";
import { se11Screen } from "./screens/se11.js";
import { se16Screen } from "./screens/se16.js";
import { se84Screen } from "./screens/se84.js";
import { gamesScreen } from "./screens/games.js";
import { se91Screen } from "./screens/se91.js";

// guía de práctica sola, en pantalla completa (se abre en otra ventana)
async function bootGuideWindow() {
  const root = document.getElementById("app");
  document.body.classList.add("guide-window");
  document.title = "Guía de práctica · Práctica ABAP";
  const host = document.createElement("div");
  host.className = "guide-page-host";
  root.replaceChildren();
  const top = document.createElement("div");
  top.className = "guide-page-top";
  top.innerHTML = '<span class="brand-logo">ABAP</span><span class="gp-title">Guía de práctica</span><span class="gp-note">Los ejercicios se marcan solos mientras trabajas en la ventana del sistema.</span>';
  const page = document.createElement("div");
  page.className = "guide-page";
  page.append(top, host);
  root.append(page);
  guidePanel({ engine: null, standalone: true, toggleGuide: () => window.close() }, host);
}

async function boot() {
  if (new URLSearchParams(location.search).has("guia")) return bootGuideWindow();
  const root = document.getElementById("app");
  const [{ Engine }, { SQLiteDatabaseClient }, { libFiles }] = await Promise.all([import("./engine/engine.js"), import("@abaplint/database-sqlite"), import("./engine/lib.js")]);
  const wasmUrl = new URL("sql-wasm.wasm", document.baseURI).href;
  const engine = new Engine({
    libFiles,
    createDbClient: () => new SQLiteDatabaseClient({ sqlJs: { locateFile: () => wasmUrl } }),
    onDbChange: (bytes) => store.saveDb(bytes),
  });
  await engine.openDb(store.loadDb());
  await engine.syncSchema(store.activeTables());

  root.replaceChildren();
  const transactions = {
    HOME: (app) => homeScreen(app),
    SE38: (app) => se38Screen(app),
    SE11: (app) => se11Screen(app),
    SE16: (app) => se16Screen(app),
    SE16N: (app) => se16Screen(app),
    SE84: (app) => se84Screen(app),
    SE80: (app) => se84Screen(app),
    ZJUEGOS: (app) => gamesScreen(app),
    SE91: (app) => se91Screen(app),
  };
  const app = new App(root, { transactions, guide: guidePanel });
  app.engine = engine;
  window.__app = app;
  window.__openGame = (id) => openGame(app, id);
  app.guide.render();
  app.home();
  const hash = location.hash.replace("#", "").toUpperCase();
  if (hash && transactions[hash]) app.command(hash);
}

boot().catch((e) => {
  console.error(e);
  document.getElementById("app").innerHTML = `<div class="boot"><div class="boot-logo">ABAP</div><div class="boot-text">No se pudo iniciar: ${String(e.message || e)}</div></div>`;
});
