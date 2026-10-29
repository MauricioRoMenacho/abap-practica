// Ejecución de programas: pantalla de selección, lista, ALV y volcado (dump).
import { h, dialog, download } from "../ui.js";
import { store } from "../store.js";
import { alvScreen } from "./alv.js";
import { debuggerScreen } from "./debugger.js";
import { formatDate, formatTime } from "../engine/output.js";

const selMemory = {};

export async function runProgram(app, name, opts = {}) {
  const { ctxFor, editorScreen } = await import("./se38.js");
  const p = store.program(name);
  if (!p) return app.status(`El programa ${name} no existe`, "E");
  if (p.activeSource === null) return app.status(`El programa ${name} no está activo. Actívelo primero (Ctrl+F3)`, "E");
  const ctx = ctxFor(name);
  ctx.debug = { startStep: opts.debug === "step", breakpoints: new Set(Object.keys(store.data.breakpoints || {})) };
  const session = opts.session || { selScreen: null, name };
  const runRecord = { at: new Date().toISOString(), hadScreen: false, alvs: [], listLines: 0 };

  // ---- depurador: la pantalla se reutiliza entre paradas ----
  let dbgScreen = null;
  let dbgTimer = null;
  const removeDebugger = () => {
    clearTimeout(dbgTimer);
    if (!dbgScreen) return;
    const i = app.stack.indexOf(dbgScreen);
    if (i >= 0) {
      const wasTop = i === app.stack.length - 1;
      app.stack.splice(i, 1);
      if (wasTop && app.current()) app.show(app.current());
    }
    dbgScreen = null;
  };
  const onDbgAction = (action) => {
    if (action === "run" || action === "stop") return removeDebugger();
    // paso a paso: si no hay otra parada enseguida, se cierra el depurador
    clearTimeout(dbgTimer);
    dbgTimer = setTimeout(removeDebugger, 300);
  };

  const ui = {
    debug: (state) =>
      new Promise((resolve) => {
        clearTimeout(dbgTimer);
        stopBusy();
        if (!store.data.debugUsed) {
          store.data.debugUsed = true;
          store.save();
        }
        if (dbgScreen && app.current() === dbgScreen) dbgScreen.update(state, resolve);
        else {
          if (dbgScreen) removeDebugger();
          dbgScreen = debuggerScreen(app, state, resolve, onDbgAction);
          app.push(dbgScreen);
        }
      }),
    status: (t, ty) => app.status(t, ty),
    popup: (t, like) => dialog({ title: "Información", body: t, icon: like === "E" ? "error" : like === "W" ? "warning" : "info" }),
    selectionScreen: (meta, values, msg) =>
      new Promise((resolve) => {
        runRecord.hadScreen = true;
        const initial = selMemory[name] && !msg ? selMemory[name] : values;
        if (session.selScreen && app.current() === session.selScreen) {
          session.selScreen.activate(meta, initial, msg, resolve);
        } else {
          session.selScreen = selectionScreen(app, name, p.title, ctx);
          session.selScreen.prepare(meta, initial, msg, resolve);
          app.push(session.selScreen);
        }
        if (msg) app.status(msg.text, msg.type);
      }),
    alv: (snap) =>
      new Promise((resolve) => {
        runRecord.alvs.push(summarizeAlv(snap));
        app.push(alvScreen(app, snap, p.title, resolve));
      }),
  };

  app.status("");
  app.statusMsg.className = "status-msg st-busy";
  app.statusMsg.replaceChildren(h("span", { class: "spinner" }), h("span", {}, `Ejecutando ${name}...`));
  app.statusbar.classList.add("working");
  document.body.classList.add("busy");
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  let res;
  const stopBusy = () => {
    document.body.classList.remove("busy");
    app.statusbar.classList.remove("working");
    if (app.statusMsg.classList.contains("st-busy")) app.status("");
  };
  // la barra de progreso se detiene mientras el programa espera al usuario
  for (const k of ["selectionScreen", "alv", "popup"]) {
    const orig = ui[k];
    ui[k] = (...a) => {
      stopBusy();
      removeDebugger();
      return orig(...a);
    };
  }
  try {
    res = await app.engine.run({ name, source: p.activeSource }, ctx, ui);
  } finally {
    stopBusy();
    removeDebugger();
  }
  if (session.selScreen?.lastValues) selMemory[name] = session.selScreen.lastValues;

  runRecord.status = res.status;
  runRecord.listLines = res.list?.length || 0;
  runRecord.hadScreen = res.hadScreen;
  if (res.status !== "syntax" && res.status !== "cancel") {
    store.data.runs[name] = runRecord;
    store.save();
  }

  const rerunIfScreen = () => {
    if (session.selScreen && app.stack.includes(session.selScreen)) {
      // volver a la pantalla de selección, como en SAP
      while (app.current() !== session.selScreen && app.stack.length > 1) {
        const s = app.stack.pop();
        s.destroy?.();
      }
      app.show(session.selScreen);
      runProgram(app, name, { ...opts, debug: undefined, session });
      return true;
    }
    return false;
  };

  switch (res.status) {
    case "syntax":
      app.status(`El programa ${name} tiene errores de sintaxis`, "E");
      if (opts.onSyntax) opts.onSyntax(res.errors);
      else app.push(editorScreen(app, name, "change", { errors: res.errors }));
      return;
    case "cancel":
      if (session.selScreen && app.current() === session.selScreen) {
        app.stack.pop();
        session.selScreen = null;
        app.show(app.current());
      }
      return;
    case "dump":
      app.push(dumpScreen(app, name, res.dump, () => rerunIfScreen()));
      return;
    case "message":
      if (res.list?.length && res.type !== "E") break;
      if (session.selScreen && app.stack.includes(session.selScreen)) {
        app.status(res.text, res.displayLike || res.type);
        rerunIfScreen();
        app.status(res.text, res.displayLike || res.type);
      } else {
        app.status(res.text, res.displayLike || res.type);
      }
      return;
  }
  if (res.list?.length) {
    app.push(listScreen(app, name, p.title, res.list, () => rerunIfScreen()));
  } else if (session.selScreen && app.current() === session.selScreen) {
    runProgram(app, name, { ...opts, debug: undefined, session });
  } else if (res.status === "ok" && runRecord.alvs.length === 0) {
    app.status(app.statusMsg.textContent || "El programa terminó sin generar salida (sin WRITE ni ALV)", app.statusMsg.textContent ? undefined : "I");
  }
}

function summarizeAlv(s) {
  return {
    rows: s.rows.length,
    columns: s.columns.map((c) => c.name),
    hidden: s.columns.filter((c) => c.hidden).map((c) => c.name),
    relabeled: s.columns.filter((c) => c.label && c.label !== c.name).map((c) => c.name),
    allFunctions: s.allFunctions,
    defaultFunctions: s.defaultFunctions,
    optimize: s.optimize,
    header: s.header,
    striped: s.striped,
    sorts: s.sorts,
    aggregations: s.aggregations,
    ddicName: s.ddicName || null,
  };
}

// ---------------------------------------------------------------- pantalla de selección
function selectionScreen(app, name, title, ctx) {
  let meta;
  let values;
  let resolver = null;
  let formEl;
  const scr = {
    id: "SELSCREEN",
    tcode: "SE38",
    title: () => title,
    lastValues: null,
    toolbar: () => [{ icon: "exec", label: "Ejecutar", key: "F8", action: () => execute(), primary: true }],
    onEnter: () => execute(),
    prepare(m, v, msg, res) {
      meta = m;
      values = JSON.parse(JSON.stringify(v || {}));
      resolver = res;
    },
    activate(m, v, msg, res) {
      scr.prepare(m, v, msg, res);
      if (formEl) renderForm();
    },
    render(el) {
      formEl = h("div", { class: "selscreen" });
      el.append(formEl);
      renderForm();
    },
    async onBack() {
      if (resolver) {
        const r = resolver;
        resolver = null;
        r(null);
        return true;
      }
      return false;
    },
  };

  const label = (n) => ctx.seltexts?.[n.toUpperCase()] || n.toUpperCase();

  const displayValue = (s, raw) => {
    if (raw === undefined || raw === null) return "";
    if (s.info?.kind === "D" && /^\d{8}$/.test(String(raw))) return raw === "00000000" ? "" : formatDate(raw);
    if (s.info?.kind === "T" && /^\d{6}$/.test(String(raw))) return formatTime(raw);
    if ((s.info?.kind === "I" || s.info?.kind === "P") && (raw === 0 || raw === "0")) return "";
    return String(raw);
  };

  const widthFor = (s) => {
    const k = s.info?.kind;
    if (k === "D") return 11;
    if (k === "T") return 9;
    if (k === "I") return 12;
    if (k === "P") return 16;
    if (k === "STRING") return 40;
    return Math.min(Math.max(s.info?.length || s.length || 10, 3), 45);
  };

  function renderForm() {
    if (!formEl) return;
    const root = h("div", { class: "sel-root" });
    const stack = [root];
    const cur = () => stack[stack.length - 1];
    for (const s of meta.screen) {
      if (s.kind === "begin") {
        const fs = h("fieldset", { class: "sel-block" + (s.frame ? " framed" : "") }, s.title ? h("legend", {}, s.title) : null);
        cur().append(fs);
        stack.push(fs);
      } else if (s.kind === "end") {
        if (stack.length > 1) stack.pop();
      } else if (s.kind === "skip") {
        cur().append(h("div", { class: "sel-skip" }));
      } else if (s.kind === "uline") {
        cur().append(h("hr", { class: "sel-uline" }));
      } else if (s.kind === "comment") {
        cur().append(h("div", { class: "sel-comment" }, s.text));
      } else if (s.kind === "param") {
        if (s.hidden) continue;
        if (s.checkbox) {
          const cb = h("input", { type: "checkbox", checked: values[s.name] === "X" || values[s.name] === true, onchange: (e) => (values[s.name] = e.target.checked) });
          cur().append(h("label", { class: "sel-row sel-check" }, cb, h("span", {}, label(s.name))));
        } else if (s.radio) {
          const rb = h("input", {
            type: "radio",
            name: "rg_" + s.radio,
            checked: values[s.name] === "X" || values[s.name] === true,
            onchange: () => {
              for (const o of meta.screen) if (o.radio === s.radio) values[o.name] = o.name === s.name;
            },
          });
          cur().append(h("label", { class: "sel-row sel-check" }, rb, h("span", {}, label(s.name))));
        } else {
          const inp = h("input", {
            class: "sap-input" + (s.obligatory ? " obligatory" : "") + (s.info?.kind === "I" || s.info?.kind === "P" ? " num" : "") + (s.lowercase || s.info?.kind === "STRING" ? "" : " upper"),
            style: { width: widthFor(s) + 1 + "ch" },
            value: displayValue(s, values[s.name]),
            maxlength: s.info?.kind === "C" ? s.info.length : undefined,
            placeholder: s.info?.kind === "D" ? "DD.MM.AAAA" : s.info?.kind === "T" ? "HH:MM:SS" : "",
            "data-name": s.name,
            oninput: (e) => {
              values[s.name] = e.target.value;
              e.target.classList.remove("missing");
            },
          });
          if (s.info?.kind === "D") inp.after;
          cur().append(h("div", { class: "sel-row" }, h("label", { class: "sel-label" + (s.obligatory ? " required" : "") }, label(s.name)), inp));
        }
      } else if (s.kind === "selopt") {
        const rows = (values[s.name] = Array.isArray(values[s.name]) ? values[s.name] : []);
        if (rows.length === 0) rows.push({ sign: "I", option: "", low: "", high: "" });
        const first = rows[0];
        const mk = (key) =>
          h("input", {
            class: "sap-input" + (s.lowercase ? "" : " upper") + (s.obligatory && key === "low" ? " obligatory" : ""),
            style: { width: widthFor(s) + 1 + "ch" },
            value: displayValue(s, first[key]),
            placeholder: s.info?.kind === "D" ? "DD.MM.AAAA" : "",
            "data-name": s.name + "-" + key,
            oninput: (e) => {
              first[key] = e.target.value;
              first.option = "";
              e.target.classList.remove("missing");
            },
          });
        const multi = h(
          "button",
          { class: "multi-btn" + (rows.length > 1 || (first.sign === "E" && first.low) ? " filled" : ""), title: "Selección múltiple", onclick: () => multiSelect(s) },
          h("span", { class: "ico ico-arrow" }),
        );
        cur().append(
          h(
            "div",
            { class: "sel-row" },
            h("label", { class: "sel-label" + (s.obligatory ? " required" : "") }, label(s.name)),
            mk("low"),
            s.noIntervals ? null : h("span", { class: "sel-a" }, "a"),
            s.noIntervals ? null : mk("high"),
            s.noExtension ? null : multi,
          ),
        );
      }
    }
    formEl.replaceChildren(root);
    setTimeout(() => formEl.querySelector("input.sap-input")?.focus(), 10);
  }

  async function multiSelect(s) {
    const rows = values[s.name].map((r) => ({ ...r }));
    while (rows.length < 8) rows.push({ sign: "I", option: "", low: "", high: "" });
    const tbody = h(
      "tbody",
      {},
      rows.map((r) =>
        h(
          "tr",
          {},
          h("td", {}, h("select", { class: "sap-input", onchange: (e) => (r.sign = e.target.value) }, ["I", "E"].map((x) => h("option", { value: x, selected: r.sign === x }, x === "I" ? "Incluir" : "Excluir")))),
          h("td", {}, h("select", { class: "sap-input", onchange: (e) => (r.option = e.target.value) }, ["", "EQ", "NE", "BT", "NB", "GT", "GE", "LT", "LE", "CP", "NP"].map((x) => h("option", { value: x, selected: r.option === x }, x || "(auto)")))),
          h("td", {}, h("input", { class: "sap-input upper", value: displayValue(s, r.low), oninput: (e) => (r.low = e.target.value) })),
          h("td", {}, h("input", { class: "sap-input upper", value: displayValue(s, r.high), oninput: (e) => (r.high = e.target.value) })),
        ),
      ),
    );
    const ok = await dialog({
      title: `Selección múltiple para ${label(s.name)}`,
      width: "640px",
      body: h("div", {}, h("table", { class: "grid-table" }, h("thead", {}, h("tr", {}, h("th", {}, "Signo"), h("th", {}, "Opción"), h("th", {}, "Desde"), h("th", {}, "Hasta"))), tbody), h("p", { class: "hint" }, "Opción (auto): EQ para un valor, BT si hay 'Hasta', CP si usas * o +.")),
      buttons: [
        { label: "Aceptar (F8)", value: true, primary: true },
        { label: "Cancelar", value: false },
      ],
    });
    if (!ok) return;
    values[s.name] = rows.filter((r) => r.low !== "" || r.high !== "");
    renderForm();
  }

  function execute() {
    if (!resolver) return;
    // campos obligatorios
    let missing = false;
    for (const s of meta.screen) {
      if (!s.obligatory) continue;
      if (s.kind === "param") {
        const v = values[s.name];
        if (v === undefined || v === null || String(v).trim() === "" || v === 0) {
          missing = true;
          formEl.querySelector(`[data-name="${s.name}"]`)?.classList.add("missing");
        }
      } else if (s.kind === "selopt") {
        if (!values[s.name]?.some((r) => r.low)) {
          missing = true;
          formEl.querySelector(`[data-name="${s.name}-low"]`)?.classList.add("missing");
        }
      }
    }
    if (missing) {
      app.status("Rellene todos los campos obligatorios", "E");
      return;
    }
    const r = resolver;
    resolver = null;
    scr.lastValues = JSON.parse(JSON.stringify(values));
    app.status("");
    r(JSON.parse(JSON.stringify(values)));
  }

  return scr;
}

// ---------------------------------------------------------------- lista (WRITE)
function listScreen(app, name, title, lines, onBack) {
  return {
    id: "LIST",
    tcode: "SE38",
    title: () => title,
    toolbar: () => [
      { icon: "print", label: "Imprimir / PDF", action: () => window.print() },
      { icon: "download", label: "Fichero local", tip: "Guardar la lista como .txt", action: () => download(`${name}.txt`, lines.join("\n")) },
    ],
    render(el) {
      const d = new Date();
      const header = `${title}`.padEnd(70) + d.toLocaleDateString("es-PE") + "   1";
      el.append(h("div", { class: "list-wrap" }, h("pre", { class: "list-out" }, h("span", { class: "list-head" }, header + "\n" + "-".repeat(Math.max(header.length, 80)) + "\n"), lines.join("\n"))));
    },
    async onBack() {
      app.stack.pop();
      if (onBack()) return true;
      app.show(app.current());
      return true;
    },
  };
}

// ---------------------------------------------------------------- dump (ST22)
function dumpScreen(app, name, dump, onBack) {
  return {
    id: "DUMP",
    tcode: "ST22",
    title: () => "Error en tiempo de ejecución",
    toolbar: () => [{ icon: "change", label: "Ir al editor", action: async () => { const { editorScreen } = await import("./se38.js"); app.stack.pop(); app.push(editorScreen(app, name, "change")); } }],
    render(el) {
      el.append(
        h(
          "div",
          { class: "dump" },
          h("div", { class: "dump-title" }, "Error en tiempo de ejecución", h("span", { class: "dump-code" }, dump.error)),
          dump.exception ? h("div", { class: "dump-kv" }, h("b", {}, "Excepción"), h("span", { class: "mono" }, dump.exception)) : null,
          h("div", { class: "dump-kv" }, h("b", {}, "Programa"), h("span", { class: "mono" }, name)),
          h("div", { class: "dump-kv" }, h("b", {}, "Fecha y hora"), h("span", {}, new Date().toLocaleString("es-PE"))),
          h("h3", {}, "¿Qué ha sucedido?"),
          h("p", {}, dump.title + ". " + dump.text),
          dump.detail ? h("p", { class: "mono small" }, dump.detail) : null,
          h("h3", {}, "¿Qué puede hacer?"),
          h(
            "ul",
            {},
            dump.error === "UNCAUGHT_EXCEPTION" ? h("li", {}, "Capture la excepción con TRY ... CATCH " + (dump.exception || "cx_root").toLowerCase() + " INTO DATA(lx_error). ... ENDTRY.") : null,
            dump.error === "TIME_OUT" ? h("li", {}, "Revise los bucles DO / WHILE / LOOP y asegúrese de que terminan (EXIT, condición que cambia).") : null,
            h("li", {}, "Corrija el programa en el editor (botón 'Ir al editor') y vuelva a ejecutarlo."),
          ),
        ),
      );
    },
    async onBack() {
      app.stack.pop();
      if (onBack()) return true;
      app.show(app.current());
      return true;
    },
  };
}
