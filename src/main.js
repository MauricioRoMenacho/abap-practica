import { Buffer } from "buffer";
import "./style.css";

// el código ABAP transpilado usa Buffer (como en Node)
globalThis.Buffer = globalThis.Buffer || Buffer;
import { App } from "./app.js";
import { store } from "./store.js";
import { guidePanel } from "./guides.js";
import { homeScreen } from "./screens/home.js";
import { se38Screen } from "./screens/se38.js";
import { se11Screen } from "./screens/se11.js";
import { se16Screen } from "./screens/se16.js";
import { se84Screen } from "./screens/se84.js";

async function boot() {
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
  };
  const app = new App(root, { transactions, guide: guidePanel });
  app.engine = engine;
  window.__app = app;
  app.guide.render();
  app.home();
  const hash = location.hash.replace("#", "").toUpperCase();
  if (hash && transactions[hash]) app.command(hash);
}

boot().catch((e) => {
  console.error(e);
  document.getElementById("app").innerHTML = `<div class="boot"><div class="boot-logo">ABAP</div><div class="boot-text">No se pudo iniciar: ${String(e.message || e)}</div></div>`;
});
