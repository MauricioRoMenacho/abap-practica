// Página inicial: menú SAP Easy Access + panel de progreso y accesos rápidos.
import { h } from "../ui.js";
import { store } from "../store.js";

// transacciones de la columna "Favoritos" (también las usa la ayuda)
const TX = [
  ["SE38", "Editor ABAP", "Crear, modificar, activar y ejecutar programas", "editor"],
  ["SE11", "Diccionario ABAP", "Tablas, elementos de datos y dominios", "ddic"],
  ["SE16", "Browser de datos", "Ver, buscar e insertar registros", "table"],
  ["SE84", "Sistema info repositorio", "Buscar programas, tablas y clases", "search"],
  ["ZJUEGOS", "Retos y juegos", "Completa código, adivina la salida y gana puntos", "game"],
];

// transacciones adicionales (árbol y accesos rápidos)
export const MORE_TX = [["ZUI5", "SAPUI5 / Fiori (Business Application Studio)"], ["SE24", "Clases globales"], ["SE37", "Módulos de función"], ["SE91", "Clases de mensajes"], ["ST05", "Traza SQL"], ["SM12", "Bloqueos"], ["ZAYUDA", "Glosario, examen y constancia"]];

// menú SAP en forma de árbol (como SAP Easy Access)
const MENU = [
  {
    name: "Herramientas - ABAP Workbench",
    children: [
      { name: "Desarrollo", tx: [["SE38", "Editor ABAP"], ["SE24", "Class Builder"], ["SE37", "Function Builder"], ["SE91", "Mensajes"]] },
      { name: "Diccionario", tx: [["SE11", "Diccionario ABAP"], ["SE16", "Browser de datos"], ["SE16N", "Visualización general de tablas"]] },
      { name: "Sistema de información", tx: [["SE84", "Sistema info repositorio"], ["SE80", "Object Navigator"]] },
      { name: "Test y rendimiento", tx: [["ST05", "Traza de rendimiento"], ["SM12", "Entradas de bloqueo"]] },
    ],
  },
  { name: "SAP Fiori / SAPUI5", tx: [["ZUI5", "Business Application Studio"]] },
  { name: "Formación", tx: [["ZJUEGOS", "Retos y juegos"], ["ZAYUDA", "Glosario, examen y constancia"]] },
];

const GROUPS = [
  { title: "Desarrollo ABAP", tx: [["SE38", "Editor ABAP", "editor"], ["SE24", "Clases globales", "create"], ["SE37", "Módulos de función", "exec"], ["SE91", "Mensajes", "text"]] },
  { title: "Diccionario y datos", tx: [["SE11", "Diccionario", "ddic"], ["SE16", "Browser de datos", "table"], ["SE84", "Buscar objetos", "search"]] },
  { title: "Calidad y rendimiento", tx: [["ST05", "Traza SQL", "debug"], ["SM12", "Bloqueos", "lock"]] },
  { title: "SAP Fiori", tx: [["ZUI5", "SAPUI5 / BAS", "layout"]] },
  { title: "Formación", tx: [["ZJUEGOS", "Retos y juegos", "game"], ["ZAYUDA", "Ayuda y examen", "help"]] },
];

const openKey = (path) => "abapp.home.tree." + path;

export function homeScreen(app) {
  let el0;
  const go = (code) => app.command(code);
  const leaf = (code, name) => h("button", { class: "tree-leaf", title: `Doble clic o Enter: abrir ${code}`, ondblclick: () => go(code), onclick: (e) => e.currentTarget.focus(), onkeydown: (e) => e.key === "Enter" && go(code) }, h("span", { class: "ico ico-tx" }), h("b", {}, code), h("span", { class: "tree-tx" }, name));
  const folder = (node, path, depth) => {
    const key = openKey(path);
    const saved = localStorage.getItem(key);
    // por defecto: abiertas las carpetas de primer nivel y "Herramientas"; las subcarpetas cerradas
    const open = saved === null ? depth <= 1 : saved !== "0";
    const box = h("div", { class: "tree-group" + (open ? " open" : "") });
    const head = h(
      "button",
      {
        class: "tree-node",
        style: { paddingLeft: 4 + depth * 14 + "px" },
        onclick: () => {
          const now = !box.classList.contains("open");
          box.classList.toggle("open", now);
          localStorage.setItem(key, now ? "1" : "0");
        },
      },
      h("span", { class: "tree-caret" }),
      h("span", { class: "ico ico-folder" }),
      node.name,
    );
    const kids = h("div", { class: "tree-kids", style: { "--d": depth + 1 } }, (node.children || []).map((c, i) => folder(c, path + "." + i, depth + 1)), (node.tx || []).map(([c, n]) => leaf(c, n)));
    box.append(head, kids);
    return box;
  };

  const progress = async () => {
    const { GUIDES } = await import("../guides.js");
    const done = store.data.guideDone || {};
    const isDone = (s) => !!done[s.id] || !!store.data.manual?.[s.id];
    const track = (pred) => {
      const gs = GUIDES.filter(pred);
      const steps = gs.flatMap((g) => g.steps.map((s) => ({ g, s })));
      const ok = steps.filter((x) => isDone(x.s)).length;
      const next = steps.find((x) => !isDone(x.s));
      return { gs, total: steps.length, ok, next };
    };
    return { abap: track((g) => !g.id.startsWith("u")), ui5: track((g) => g.id.startsWith("u")) };
  };

  const openStep = (g, s) => {
    app.toggleGuide(true);
    app.guide?.goto?.(g.id, s?.id);
  };

  const render = async () => {
    const el = el0;
    const p = await progress();
    if (!el.isConnected && el !== el0) return;
    const user = store.data.settings.user || "ALUMNO";
    const hour = new Date().getHours();
    const saludo = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
    const progs = store.programs();
    const recent = [...progs].sort((a, b) => (b.changed || b.created || "").localeCompare(a.changed || a.created || "")).slice(0, 5);
    const games = store.data.games || {};
    const { levelFor } = await import("../games/data.js");
    const points = Object.values(games).reduce((a, g) => a + (g.points || 0), 0);
    const lvl = levelFor(points);
    const stats = [
      ["Programas", progs.length, "SE38"],
      ["Tablas Z", store.tables().length, "SE11"],
      ["Clases globales", Object.keys(store.data.classes || {}).length, "SE24"],
      ["Módulos de función", Object.keys(store.data.fmodules || {}).length, "SE37"],
      ["Proyectos SAPUI5", Object.keys(store.data.ui5Projects || {}).length, "ZUI5"],
      ["Puntos en retos", points, "ZJUEGOS"],
    ];
    const trackCard = (title, sub, t, icon) => {
      const pct = t.total ? Math.round((t.ok / t.total) * 100) : 0;
      return h(
        "div",
        { class: "track-card" },
        h("div", { class: "track-head" }, h("span", { class: "ico ico-big ico-" + icon }), h("div", {}, h("div", { class: "track-title" }, title), h("div", { class: "muted small" }, sub)), h("div", { class: "track-pct" }, pct + "%")),
        h("div", { class: "progress" }, h("div", { class: "progress-bar", style: { width: pct + "%" } })),
        h("div", { class: "muted small" }, `${t.ok} de ${t.total} ejercicios completados`),
        h(
          "div",
          { class: "track-steps" },
          t.gs.map((g) => {
            const n = g.steps.filter((s) => !!(store.data.guideDone || {})[s.id] || !!store.data.manual?.[s.id]).length;
            const full = n === g.steps.length;
            return h("button", { class: "track-step" + (full ? " full" : n ? " half" : ""), title: `${g.title} - ${g.subtitle} (${n}/${g.steps.length})`, onclick: () => openStep(g, null) }, g.title.replace(/^UI5 /, "").replace("Proyecto final", "Proyecto"));
          }),
        ),
        t.next
          ? h("div", { class: "track-next" }, h("div", {}, h("div", { class: "muted small" }, "Siguiente ejercicio"), h("b", {}, `${t.next.g.title}: ${t.next.s.title}`)), h("button", { class: "btn btn-primary", onclick: () => openStep(t.next.g, t.next.s) }, "Continuar"))
          : h("div", { class: "track-next done" }, "Ruta completada. Revisa ZAYUDA para el examen y la constancia."),
      );
    };
    const right = h(
      "div",
      { class: "welcome home-dash" },
      h(
        "div",
        { class: "dash-hero" },
        h("div", {}, h("h1", {}, `${saludo}, ${user}`), h("p", { class: "lead" }, "Sistema de práctica ABAP y SAPUI5. Escribe una transacción en el campo de comandos (arriba a la izquierda) o elige un acceso rápido. Todo se guarda en tu navegador.")),
        h("div", { class: "sys-box" }, h("div", {}, h("span", { class: "muted" }, "Sistema "), h("b", {}, "NPL")), h("div", {}, h("span", { class: "muted" }, "Mandante "), h("b", {}, "100")), h("div", {}, h("span", { class: "muted" }, "Idioma "), h("b", {}, store.data.settings.lang === "E" ? "EN" : "ES")), h("div", {}, h("span", { class: "muted" }, new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })))),
      ),
      h("div", { class: "track-row" }, trackCard("Ruta ABAP", "Paso 0 a 7 y proyecto final", p.abap, "editor"), trackCard("Ruta SAPUI5 / Fiori", "Temario C_FIORD: UI5 Paso 0 a 9", p.ui5, "layout")),
      h(
        "div",
        { class: "stat-row" },
        stats.map(([label, n, tx]) => h("button", { class: "stat", title: "Abrir " + tx, onclick: () => go(tx) }, h("span", { class: "stat-n" }, n), h("span", { class: "stat-l" }, label))),
        h("button", { class: "stat level", title: "Abrir ZJUEGOS", onclick: () => go("ZJUEGOS") }, h("span", { class: "stat-n small" }, lvl.name), h("span", { class: "stat-l" }, "Nivel")),
      ),
      h("h2", { class: "dash-h" }, "Accesos rápidos"),
      h(
        "div",
        { class: "tile-groups" },
        GROUPS.map((gr) =>
          h(
            "div",
            { class: "tile-group" },
            h("div", { class: "tile-group-title" }, gr.title),
            h("div", { class: "tiles" }, gr.tx.map(([code, name, icon]) => h("button", { class: "tile", onclick: () => go(code), title: TX.find((t) => t[0] === code)?.[2] || MORE_TX.find((t) => t[0] === code)?.[1] || name }, h("span", { class: "ico ico-" + icon }), h("span", { class: "tile-name" }, name), h("span", { class: "tile-code" }, code)))),
          ),
        ),
      ),
      h(
        "div",
        { class: "dash-bottom" },
        h(
          "div",
          { class: "dash-box" },
          h("h2", { class: "dash-h" }, "Últimos programas"),
          recent.length
            ? h(
                "table",
                { class: "grid-table recent" },
                h(
                  "tbody",
                  {},
                  recent.map((r) =>
                    h(
                      "tr",
                      { class: "clickable", title: "Abrir en SE38", onclick: async () => { const { editorScreen } = await import("./se38.js"); app.push(editorScreen(app, r.name, "change")); } },
                      h("td", { class: "mono" }, h("b", {}, r.name)),
                      h("td", {}, r.title || ""),
                      h("td", {}, h("span", { class: "badge " + (r.activeSource !== null && r.activeSource === r.source ? "badge-ok" : "badge-warn") }, r.activeSource !== null && r.activeSource === r.source ? "Activo" : "Inactivo")),
                      h("td", { class: "muted small" }, r.changed || r.created ? new Date(r.changed || r.created).toLocaleDateString("es-PE") : ""),
                    ),
                  ),
                ),
              )
            : h("p", { class: "muted" }, "Todavía no has creado programas. Empieza con la guía: Paso 1, \"Crea tu primer programa\"."),
        ),
        h(
          "div",
          { class: "dash-box" },
          h("h2", { class: "dash-h" }, "Datos de ejemplo"),
          h("p", { class: "small" }, "Tablas estándar con datos para practicar SELECT, JOIN y ALV:"),
          h(
            "div",
            { class: "chips" },
            [["Vuelos", "SCARR, SPFLI, SFLIGHT, SBOOK, SCUSTOM"], ["Finanzas", "T001, T005, TCURC"], ["Ventas", "KNA1, VBAK, VBAP"], ["Compras", "LFA1, EKKO, EKPO"], ["Materiales", "MARA, MAKT"], ["Personal", "PA0001, PA0002, PA0008"]].map(([a, t]) => h("button", { class: "chip", title: t + " - abrir SE16", onclick: () => go("SE16") }, h("b", {}, a), " " + t)),
          ),
          h("p", { class: "muted small" }, "Atajos: /n + transacción cambia de transacción, /o abre otra sesión, F3 vuelve atrás, F8 ejecuta, Ctrl+F2 verifica, Ctrl+F3 activa."),
        ),
      ),
    );
    const left = h(
      "div",
      { class: "tree" },
      h("div", { class: "tree-title" }, "Menú SAP Easy Access"),
      folder({ name: "Favoritos", tx: TX.map(([c, n]) => [c, n]) }, "fav", 0),
      folder({ name: "Menú SAP", children: MENU }, "menu", 0),
      h("p", { class: "tree-hint" }, "Doble clic para abrir una transacción, o escríbela en el campo de comandos."),
    );
    el.replaceChildren(h("div", { class: "home-grid" }, left, right));
  };

  return {
    id: "HOME",
    tcode: "",
    title: "Menú SAP Easy Access",
    cls: "home",
    toolbar: () => [],
    render(el) {
      el0 = el;
      render();
    },
    resumed() {
      if (el0) render();
    },
  };
}
