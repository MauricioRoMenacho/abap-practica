// ST05 - Traza SQL y SM12 - Entradas de bloqueo.
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
};

export function persistTrace(engine) {
  const st = (store.data.st05 ||= { active: false });
  st.active = engine.sqlTrace.active;
  st.records = engine.sqlTrace.records.slice(-400);
  store.save();
}

export function st05Screen(app) {
  const tr = app.engine.sqlTrace;
  let view = "main";
  let el0;
  const setActive = (on) => {
    tr.active = on;
    if (on) (store.data.st05 ||= {}).everActive = true;
    persistTrace(app.engine);
    app.status(on ? "Traza SQL activada: ejecute ahora su programa y vuelva a ST05 para visualizarla" : "Traza SQL desactivada", "S");
    render();
  };
  const clear = async () => {
    if (!(await confirm("¿Borrar todos los registros de la traza?", "Borrar traza", "Borrar", "Cancelar"))) return;
    tr.records.length = 0;
    persistTrace(app.engine);
    render();
  };
  const render = () => {
    const el = el0;
    el.replaceChildren();
    if (view === "main") {
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          h("h3", {}, "Traza de rendimiento"),
          h("label", { class: "radio" }, h("input", { type: "checkbox", checked: true, disabled: true }), h("span", { class: "radio-l" }, "Traza SQL")),
          h("label", { class: "radio disabled" }, h("input", { type: "checkbox", disabled: true }), h("span", { class: "radio-l" }, "Traza de bloqueos / RFC / búfer"), h("span", { class: "muted small" }, "no disponible en el simulador")),
          h("div", { class: "trace-state " + (tr.active ? "on" : "off") }, tr.active ? `Traza ACTIVA para el usuario ${store.data.settings.user || "ALUMNO"}` : "Traza desactivada", h("span", { class: "muted small" }, ` - ${tr.records.length} registro(s) grabados`)),
          h(
            "div",
            { class: "row buttons" },
            h("button", { class: "btn btn-primary", disabled: tr.active, onclick: () => setActive(true) }, "Activar traza"),
            h("button", { class: "btn", disabled: !tr.active, onclick: () => setActive(false) }, "Desactivar traza"),
            h("button", { class: "btn", onclick: () => { view = "list"; app.refreshChrome(); render(); } }, "Visualizar traza"),
            h("button", { class: "btn", onclick: clear }, "Borrar traza"),
          ),
          h("p", { class: "hint" }, "Uso típico: 1) Activar traza. 2) Ejecutar el programa. 3) Desactivar traza. 4) Visualizar. Cada acceso a la base de datos (SELECT, INSERT, UPDATE, DELETE) queda registrado con su duración y número de registros. Si ves la misma sentencia repetida muchas veces, probablemente hay un SELECT dentro de un LOOP: cámbialo por un JOIN o por FOR ALL ENTRIES."),
        ),
      );
      return;
    }
    const recs = tr.records;
    // sentencias idénticas
    const groups = new Map();
    for (const r of recs) {
      if (r.op === "COMMIT" || r.op === "ROLLBACK") continue;
      const k = r.sql;
      const g = groups.get(k) || { sql: r.sql, op: r.op, table: r.table, count: 0, rows: 0, us: 0 };
      g.count++;
      g.rows += r.rows;
      g.us += r.us;
      groups.set(k, g);
    }
    // "estructura idéntica": misma sentencia con distintos valores
    const shape = (sql) => sql.replace(/'(?:[^']|'')*'/g, "?").replace(/\b\d+(\.\d+)?\b/g, "?");
    const shapes = new Map();
    for (const r of recs) {
      if (r.op !== "SELECT") continue;
      const k = shape(r.sql);
      shapes.set(k, (shapes.get(k) || 0) + 1);
    }
    const repeated = [...shapes.entries()].filter(([, c]) => c > 3).sort((a, b) => b[1] - a[1]);
    const total = recs.reduce((a, r) => a + r.us, 0);
    const byProg = [...new Set(recs.map((r) => r.program))];
    el.append(
      h(
        "div",
        { class: "panel wide" },
        h("div", { class: "row" }, h("b", {}, `Traza SQL: ${recs.length} sentencia(s)`), h("span", { class: "muted" }, ` - duración total ${total.toLocaleString("es-ES")} µs - programas: ${byProg.join(", ") || "-"}`)),
        repeated.length
          ? h(
              "div",
              { class: "trace-warn" },
              h("b", {}, "Aviso de rendimiento: "),
              `hay ${repeated.length} sentencia(s) SELECT con la misma estructura ejecutadas muchas veces (la más repetida: ${repeated[0][1]} veces). Suele ser un SELECT dentro de un LOOP; usa JOIN o FOR ALL ENTRIES para leer todo de una vez.`,
            )
          : null,
        h(
          "table",
          { class: "grid-table trace" },
          h("thead", {}, h("tr", {}, ["Hora", "Duración (µs)", "Programa", "Operación", "Tabla", "Registros", "Sentencia"].map((x) => h("th", {}, x)))),
          h(
            "tbody",
            {},
            recs.length
              ? recs.slice(-500).map((r) => h("tr", { class: r.us > 5000 ? "slow" : "" }, h("td", { class: "mono" }, fmtTime(r.at)), h("td", { class: "num" }, r.us.toLocaleString("es-ES")), h("td", { class: "mono" }, r.program), h("td", {}, r.op), h("td", { class: "mono" }, r.table), h("td", { class: "num" }, r.rows), h("td", { class: "mono sql" }, r.sql)))
              : h("tr", {}, h("td", { colspan: 7, class: "muted" }, "No hay registros. Active la traza y ejecute un programa que acceda a la base de datos.")),
          ),
        ),
        groups.size
          ? h(
              "div",
              {},
              h("h3", {}, "Sentencias idénticas (resumen)"),
              h(
                "table",
                { class: "grid-table trace" },
                h("thead", {}, h("tr", {}, ["Ejecuciones", "Registros", "Duración (µs)", "Operación", "Tabla", "Sentencia"].map((x) => h("th", {}, x)))),
                h("tbody", {}, [...groups.values()].sort((a, b) => b.count - a.count).map((g) => h("tr", { class: g.count > 1 ? "dup" : "" }, h("td", { class: "num" }, g.count), h("td", { class: "num" }, g.rows), h("td", { class: "num" }, g.us.toLocaleString("es-ES")), h("td", {}, g.op), h("td", { class: "mono" }, g.table), h("td", { class: "mono sql" }, g.sql)))),
              ),
              h("p", { class: "hint" }, "Las filas resaltadas se ejecutaron más de una vez exactamente igual: son lecturas repetidas que se podrían evitar (por ejemplo, guardando el resultado en una tabla interna)."),
            )
          : null,
      ),
    );
  };
  return {
    id: "ST05",
    tcode: "ST05",
    title: () => (view === "main" ? "Análisis de rendimiento (ST05)" : "Traza SQL: lista de sentencias"),
    toolbar: () =>
      view === "main"
        ? [{ icon: "display", label: "Visualizar traza", action: () => { view = "list"; app.refreshChrome(); render(); } }]
        : [
            { icon: "refresh", label: "Refrescar", action: render },
            { icon: "delete", label: "Borrar traza", action: clear },
          ],
    onBack: () => {
      if (view === "list") {
        view = "main";
        app.refreshChrome();
        render();
        return true;
      }
      return false;
    },
    render(el) {
      el0 = el;
      render();
    },
    resumed() {
      if (el0) render();
    },
  };
}

// ---------------------------------------------------------------- SM12
export function sm12Screen(app) {
  let el0;
  const sel = new Set();
  const save = () => app.engine.onLocksChange?.(app.engine.locks);
  const render = () => {
    const locks = app.engine.locks;
    el0.replaceChildren(
      h(
        "div",
        { class: "panel wide" },
        h("div", { class: "row" }, h("b", {}, `Entradas de bloqueo: ${locks.length}`)),
        h(
          "table",
          { class: "grid-table" },
          h("thead", {}, h("tr", {}, ["", "Cliente", "Usuario", "Hora", "Modo", "Tabla", "Argumento de bloqueo", "Programa"].map((x) => h("th", {}, x)))),
          h(
            "tbody",
            {},
            locks.length
              ? locks.map((l, i) =>
                  h(
                    "tr",
                    {},
                    h("td", {}, h("input", { type: "checkbox", checked: sel.has(i), onchange: (e) => (e.target.checked ? sel.add(i) : sel.delete(i)) })),
                    h("td", { class: "mono" }, "100"),
                    h("td", { class: "mono" }, l.user),
                    h("td", { class: "mono" }, new Date(l.time).toLocaleTimeString("es-ES", { hour12: false })),
                    h("td", {}, l.mode || "E"),
                    h("td", { class: "mono" }, l.table),
                    h("td", { class: "mono" }, l.key || "(toda la tabla)"),
                    h("td", { class: "mono" }, l.program || ""),
                  ),
                )
              : h("tr", {}, h("td", { colspan: 8, class: "muted" }, "No hay entradas de bloqueo.")),
          ),
        ),
        h(
          "p",
          { class: "hint" },
          "Un bloqueo (ENQUEUE) evita que dos usuarios modifiquen el mismo registro a la vez. Se libera con DEQUEUE o al terminar el programa. Para practicar, simula que un compañero tiene bloqueado un registro: tu programa recibirá la excepción FOREIGN_LOCK (sy-subrc <> 0) y sy-msgv1 dirá quién lo bloquea. Modo E = bloqueo exclusivo.",
        ),
      ),
    );
  };
  const simulate = async () => {
    const tab = input({ class: "sap-input upper", value: "SCUSTOM", oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
    const key = input({ class: "sap-input", placeholder: "Ej.: 00000001 (vacío = toda la tabla)" });
    const user = input({ class: "sap-input upper", value: "COMPANERO", maxlength: 12, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
    const r = await dialog({
      title: "Simular bloqueo de otro usuario",
      body: h("div", {}, field("Tabla", tab, { required: true }), field("Argumento (clave)", key), field("Usuario", user, { required: true })),
      buttons: [{ label: "Crear bloqueo", primary: true, value: () => ({ table: tab.value.trim(), key: key.value.trim(), user: user.value.trim() || "COMPANERO" }) }, { label: "Cancelar", value: null }],
    });
    if (!r || !r.table) return;
    if (r.user === (store.data.settings.user || "ALUMNO")) return app.status("Use otro nombre de usuario distinto al suyo", "E");
    app.engine.locks.push({ ...r, mode: "E", program: "(simulado)", time: new Date().toISOString() });
    save();
    app.status(`Bloqueo de ${r.user} sobre ${r.table} ${r.key} creado`, "S");
    render();
  };
  const del = async () => {
    if (!sel.size) return app.status("Seleccione las entradas a borrar", "W");
    if (!(await confirm(`¿Borrar ${sel.size} entrada(s) de bloqueo? En un sistema real esto solo lo hace un administrador cuando el bloqueo quedó colgado.`, "Borrar bloqueos", "Borrar", "Cancelar"))) return;
    app.engine.locks = app.engine.locks.filter((_, i) => !sel.has(i));
    sel.clear();
    save();
    app.status("Entradas de bloqueo borradas", "S");
    render();
  };
  return {
    id: "SM12",
    tcode: "SM12",
    title: "Seleccionar entradas de bloqueo (SM12)",
    toolbar: () => [
      { icon: "refresh", label: "Refrescar", action: render },
      { icon: "create", label: "Simular bloqueo de otro usuario", action: simulate },
      { icon: "delete", label: "Borrar", action: del },
    ],
    render(el) {
      el0 = el;
      render();
    },
    resumed() {
      if (el0) render();
    },
  };
}
