import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { runProgram } from "./run.js";
import { preprocess } from "../engine/preprocess.js";

export function validProgName(n) {
  if (!n) return "Indique un nombre de programa";
  if (!/^[YZ]/.test(n)) return "Inicie el nombre con Y o Z (espacio de nombres del cliente)";
  if (!/^[YZ][A-Z0-9_]{0,29}$/.test(n)) return "El nombre solo puede tener letras, números y _ (máx. 30)";
  return null;
}

export async function pickProgram() {
  const progs = store.programs();
  if (progs.length === 0) {
    await dialog({ title: "Programas", body: "Todavía no has creado ningún programa." });
    return null;
  }
  let chosen = null;
  const list = h(
    "div",
    { class: "f4-list" },
    progs.map((p) =>
      h(
        "button",
        {
          class: "f4-row",
          onclick: (e) => {
            chosen = p.name;
            e.currentTarget.closest(".dlg-overlay").querySelector(".btn-primary").click();
          },
        },
        h("b", {}, p.name),
        h("span", {}, p.title),
      ),
    ),
  );
  const r = await dialog({ title: "Programas (F4)", body: list, buttons: [{ label: "Cancelar", value: false }, { label: "", value: true, primary: true }], width: "520px", onOpen: (o) => (o.querySelector(".btn-primary").style.display = "none") });
  return r ? chosen : null;
}

export function se38Screen(app, presetName) {
  let nameInput;
  let sub = "src";
  const name = () => nameInput.value.trim().toUpperCase();
  const check = (mustExist) => {
    const n = name();
    const err = validProgName(n);
    if (err) {
      app.status(err, "E");
      return null;
    }
    if (mustExist && !store.program(n)) {
      app.status(`El programa ${n} no existe`, "E");
      return null;
    }
    store.data.lastProg = n;
    store.save();
    return n;
  };
  const open = (mode) => {
    const n = check(true);
    if (!n) return;
    if (sub === "txt") app.push(textElementsScreen(app, n, mode));
    else if (sub === "attr") editAttributes(app, n);
    else app.push(editorScreen(app, n, mode));
  };
  const create = async () => {
    const n = check(false);
    if (!n) return;
    if (store.program(n)) {
      app.status(`El programa ${n} ya existe`, "E");
      return;
    }
    const title = input({ maxlength: 70, placeholder: "Ej.: Mi primer programa" });
    const ok = await dialog({
      title: `Atributos de programa ${n}`,
      width: "560px",
      body: h(
        "div",
        { class: "form-grid" },
        h("label", { class: "required" }, "Título"),
        title,
        h("label", {}, "Tipo"),
        h("select", { class: "sap-input", disabled: true }, h("option", {}, "Programa ejecutable")),
        h("label", {}, "Idioma original"),
        h("input", { class: "sap-input", value: "ES", disabled: true }),
        h("p", { class: "hint", style: { gridColumn: "1 / -1" } }, "En un sistema real ahora pediría paquete y orden de transporte. Aquí se graba directamente como objeto local."),
      ),
      buttons: [
        { label: "Grabar", value: () => title.value.trim(), primary: true },
        { label: "Cancelar", value: false },
      ],
    });
    if (!ok) {
      if (ok === "") app.status("Indique un título para el programa", "E");
      return;
    }
    store.createProgram(n, ok);
    app.status(`Programa ${n} creado`, "S");
    app.push(editorScreen(app, n, "change"));
  };
  const del = async () => {
    const n = check(true);
    if (!n) return;
    if (!(await confirm(`¿Borrar el programa ${n} con todos sus textos?`, "Borrar programa", "Borrar", "Cancelar"))) return;
    store.deleteProgram(n);
    app.status(`Programa ${n} borrado`, "S");
  };
  const copy = async () => {
    const n = check(true);
    if (!n) return;
    const target = input({ maxlength: 30, value: n + "_COPIA" });
    const t = await dialog({ title: `Copiar programa ${n}`, body: field("Programa destino", target), buttons: [{ label: "Copiar", value: () => target.value.trim().toUpperCase(), primary: true }, { label: "Cancelar", value: false }] });
    if (!t) return;
    const err = validProgName(t);
    if (err) return app.status(err, "E");
    if (store.program(t)) return app.status(`El programa ${t} ya existe`, "E");
    const src = store.program(n);
    const p = store.createProgram(t, src.title);
    p.source = src.source.replace(new RegExp(`REPORT\\s+${n}`, "i"), `REPORT ${t.toLowerCase()}`);
    p.texts = JSON.parse(JSON.stringify(src.texts));
    p.seltexts = JSON.parse(JSON.stringify(src.seltexts));
    store.save();
    nameInput.value = t;
    app.status(`Programa ${n} copiado a ${t}`, "S");
  };
  return {
    id: "SE38",
    tcode: "SE38",
    title: "ABAP Editor: Pantalla inicial",
    toolbar: () => [
      { icon: "exec", label: "Ejecutar", key: "F8", action: () => { const n = check(true); if (n) runProgram(app, n); } },
      { icon: "check", tip: "Verificar", key: "Ctrl+F2", action: () => { const n = check(true); if (n) app.push(editorScreen(app, n, "show", { autoCheck: true })); } },
      "-",
      { icon: "copy", tip: "Copiar", action: copy },
      { icon: "delete", tip: "Borrar", action: del },
    ],
    keys: { F7: () => open("show"), F6: () => open("change") },
    onEnter: () => open("show"),
    render(el) {
      nameInput = input({ maxlength: 30, value: presetName || store.data.lastProg || "", class: "sap-input upper w-30", autofocus: true });
      const radios = [
        ["src", "Código fuente"],
        ["attr", "Atributos"],
        ["txt", "Elementos de texto (traducción)"],
      ];
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          h(
            "div",
            { class: "row" },
            field("Programa", nameInput, { required: true }),
            h("button", { class: "btn f4", title: "Ayuda para búsqueda (F4)", onclick: async () => { const p = await pickProgram(); if (p) nameInput.value = p; } }, "F4"),
            h("button", { class: "btn", onclick: create }, h("span", { class: "ico ico-create" }), "Crear"),
          ),
          h(
            "fieldset",
            { class: "group" },
            h("legend", {}, "Subobjetos"),
            radios.map(([v, l]) =>
              h(
                "label",
                { class: "radio" },
                h("input", { type: "radio", name: "sub", value: v, checked: v === "src", onchange: () => (sub = v) }),
                l,
              ),
            ),
          ),
          h(
            "div",
            { class: "row buttons" },
            h("button", { class: "btn", onclick: () => open("show"), title: "F7" }, h("span", { class: "ico ico-display" }), "Visualizar"),
            h("button", { class: "btn btn-primary", onclick: () => open("change"), title: "F6" }, h("span", { class: "ico ico-change" }), "Modificar"),
          ),
          h("p", { class: "hint" }, "Los programas propios deben empezar por Z o Y. Ejemplo: ZP1_HOLA."),
        ),
      );
      nameInput.addEventListener("input", () => (nameInput.value = nameInput.value.toUpperCase()));
      nameInput.addEventListener("keydown", async (e) => {
        if (e.key === "F4") {
          e.preventDefault();
          const p = await pickProgram();
          if (p) nameInput.value = p;
        }
      });
    },
  };
}

async function editAttributes(app, n) {
  const p = store.program(n);
  const title = input({ maxlength: 70, value: p.title });
  const ok = await dialog({
    title: `Atributos de programa ${n}`,
    width: "560px",
    body: h("div", { class: "form-grid" }, h("label", {}, "Título"), title, h("label", {}, "Creado"), h("span", {}, new Date(p.created).toLocaleString()), h("label", {}, "Última modificación"), h("span", {}, new Date(p.changed).toLocaleString())),
    buttons: [
      { label: "Grabar", value: true, primary: true },
      { label: "Cancelar", value: false },
    ],
  });
  if (ok && title.value.trim()) {
    p.title = title.value.trim();
    store.save();
    app.status("Atributos grabados", "S");
  }
}

// ---------------------------------------------------------------- Editor
export function editorScreen(app, n, initialMode, opts = {}) {
  let mode = initialMode;
  let editor = null;
  let errorsEl;
  let headerEl;
  let lastErrors = [];
  const prog = () => store.program(n);
  const dirty = () => editor && editor.getValue() !== prog().source;

  const updateHeader = () => {
    const p = prog();
    const inactive = p.activeSource === null || p.activeSource !== p.source || dirty();
    headerEl.replaceChildren(
      h("span", { class: "eh-label" }, "Report"),
      h("b", {}, n),
      h("span", { class: "badge " + (inactive ? "badge-warn" : "badge-ok") }, inactive ? "Inactivo" : "Activo"),
      dirty() ? h("span", { class: "badge badge-dirty" }, "modificado sin grabar") : null,
      h("span", { class: "eh-title" }, p.title),
    );
  };

  const save = (silent) => {
    if (mode !== "change") return true;
    const p = prog();
    p.source = editor.getValue();
    p.changed = new Date().toISOString();
    store.save();
    updateHeader();
    if (!silent) app.status(`Se ha grabado el programa ${n} (inactivo)`, "S");
    return true;
  };

  const showErrors = async (errors, title) => {
    lastErrors = errors;
    const { setMarkers } = await import("../editor.js");
    setMarkers(editor, errors);
    if (!errors.length) {
      errorsEl.replaceChildren();
      errorsEl.classList.remove("open");
      return;
    }
    errorsEl.classList.add("open");
    errorsEl.replaceChildren(
      h("div", { class: "err-head" }, h("span", { class: "ico ico-error" }), title || `${errors.length} error(es) de sintaxis`, h("button", { class: "err-close", onclick: () => errorsEl.classList.remove("open") }, "✕")),
      h(
        "table",
        { class: "err-table" },
        h("tr", {}, h("th", {}, "Línea"), h("th", {}, "Mensaje")),
        errors.map((e) =>
          h(
            "tr",
            {
              onclick: () => {
                editor.revealLineInCenter(e.row);
                editor.setPosition({ lineNumber: e.row, column: e.col });
                editor.focus();
              },
            },
            h("td", { class: "num" }, e.row),
            h("td", {}, e.message),
          ),
        ),
      ),
    );
  };

  const doCheck = async () => {
    save(true);
    app.status("Verificando...", "I");
    await new Promise((r) => setTimeout(r, 10));
    const { errors } = app.engine.check({ name: n, source: editor.getValue() }, ctxFor(n));
    await showErrors(errors);
    if (errors.length) app.status(`El programa ${n} tiene errores de sintaxis`, "E");
    else app.status(`El programa ${n} no tiene errores de sintaxis`, "S");
    return errors.length === 0;
  };

  const activate = async () => {
    if (mode === "change") save(true);
    const ok = await doCheck();
    if (!ok) {
      app.status(`No se pudo activar: el programa ${n} tiene errores de sintaxis`, "E");
      return false;
    }
    const p = prog();
    p.activeSource = editor.getValue();
    p.changed = new Date().toISOString();
    store.save();
    updateHeader();
    app.status(`Se ha activado el objeto ${n}`, "S");
    return true;
  };

  const execute = async () => {
    if (mode === "change") save(true);
    const p = prog();
    if (p.activeSource === null || p.activeSource !== editor.getValue()) {
      const r = await dialog({
        title: "Versión inactiva",
        icon: "question",
        body: p.activeSource === null ? `El programa ${n} todavía no está activo. ¿Activarlo y ejecutarlo?` : `El programa ${n} tiene cambios sin activar. Se ejecuta siempre la versión ACTIVA. ¿Activar y ejecutar?`,
        buttons: [
          { label: "Activar y ejecutar", value: "act", primary: true },
          p.activeSource !== null ? { label: "Ejecutar versión activa", value: "old" } : null,
          { label: "Cancelar", value: false },
        ].filter(Boolean),
      });
      if (!r) return;
      if (r === "act" && !(await activate())) return;
    }
    runProgram(app, n, {
      onSyntax: (errors) => showErrors(errors),
    });
  };

  const pretty = async () => {
    if (mode !== "change") return app.status("Cambie a modo modificar (Ctrl+F1)", "W");
    const { prettyPrint } = await import("../pretty.js");
    try {
      const out = prettyPrint(editor.getValue());
      if (out !== null) {
        const pos = editor.getPosition();
        editor.pushUndoStop();
        editor.executeEdits("pretty", [{ range: editor.getModel().getFullModelRange(), text: out }]);
        editor.setPosition(pos);
        app.status("Pretty Printer aplicado", "S");
      } else app.status("Corrija primero los errores de sintaxis", "W");
    } catch (e) {
      app.status("No se pudo formatear: " + e.message, "E");
    }
  };

  const toggleMode = () => {
    if (mode === "change") {
      if (dirty()) save(true);
      mode = "show";
    } else mode = "change";
    editor.updateOptions({ readOnly: mode !== "change" });
    app.refreshChrome();
    app.status(mode === "change" ? "Modo modificar" : "Modo visualizar", "S");
  };

  return {
    id: "SE38-ED",
    tcode: "SE38",
    cls: "editor-screen",
    title: () => `ABAP Editor: ${mode === "change" ? "Modificar" : "Visualizar"} Report ${n}`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: toggleMode },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: doCheck },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate },
      { icon: "exec", label: "Ejecutar", key: "F8", action: execute, primary: true },
      "-",
      { icon: "pretty", label: "Pretty Printer", key: "Shift+F1", action: pretty, disabled: mode !== "change" },
      { icon: "text", label: "Elementos de texto", action: () => app.push(textElementsScreen(app, n, mode)) },
    ],
    keys: { "Ctrl+S": () => save(false) },
    render(el) {
      headerEl = h("div", { class: "editor-head" });
      const host = h("div", { class: "editor-host" });
      errorsEl = h("div", { class: "err-panel" });
      el.append(headerEl, host, errorsEl);
      import("../editor.js").then(({ createEditor }) => {
        editor = createEditor(host, prog().source, mode !== "change");
        editor.onDidChangeModelContent(() => updateHeader());
        updateHeader();
        editor.focus();
        if (lastErrors.length) showErrors(lastErrors);
        if (opts.autoCheck) {
          opts.autoCheck = false;
          doCheck();
        }
        if (opts.errors) {
          showErrors(opts.errors);
          opts.errors = null;
        }
      });
    },
    focus() {
      editor?.focus();
    },
    hidden() {
      if (editor && mode === "change" && dirty()) save(true);
    },
    resumed() {},
    async canLeave() {
      if (!dirty()) return true;
      const r = await dialog({
        title: "Salir del editor",
        icon: "question",
        body: "¿Desea grabar los cambios?",
        buttons: [
          { label: "Sí", value: "y", primary: true },
          { label: "No", value: "n" },
          { label: "Cancelar", value: false },
        ],
      });
      if (r === "y") save(false);
      if (r === "n") editor.setValue(prog().source);
      return !!r;
    },
    destroy() {
      editor?.dispose();
      editor = null;
    },
  };
}

export function ctxFor(name) {
  const p = store.program(name);
  const lang = store.data.settings.lang || "S";
  const other = lang === "S" ? "E" : "S";
  const texts = { ...(p?.texts?.[other] || {}), ...Object.fromEntries(Object.entries(p?.texts?.[lang] || {}).filter(([, v]) => v)) };
  const seltexts = { ...(p?.seltexts?.[other] || {}), ...Object.fromEntries(Object.entries(p?.seltexts?.[lang] || {}).filter(([, v]) => v)) };
  return {
    tables: [...app_standard(), ...store.activeTables()],
    texts,
    seltexts,
    user: store.data.settings.user,
    lang: lang === "E" ? "EN" : "ES",
    decimalNotation: store.data.settings.decimalNotation,
  };
}

import { STANDARD_TABLES } from "../engine/standard.js";
function app_standard() {
  return Object.values(STANDARD_TABLES);
}

// ---------------------------------------------------------------- Elementos de texto
export function textElementsScreen(app, n, initialMode) {
  let tab = "sym";
  let body;
  let mode = initialMode;
  const p = () => store.program(n);
  const rowsSym = () => {
    const t = p().texts || { S: {}, E: {} };
    const ids = new Set([...Object.keys(t.S || {}), ...Object.keys(t.E || {})]);
    // símbolos usados en el código
    for (const m of (p().source || "").matchAll(/TEXT-([A-Za-z0-9]{3})/gi)) ids.add(m[1].toUpperCase());
    for (const m of (p().source || "").matchAll(/'(?:[^'\n]|'')*'\(([A-Za-z0-9]{3})\)/g)) ids.add(m[1].toUpperCase());
    return [...ids].sort();
  };
  const rowsSel = () => {
    try {
      const { meta } = preprocess(p().source, n, {});
      return [...meta.params.map((x) => x.name.toUpperCase()), ...meta.selopts.map((x) => x.name.toUpperCase())];
    } catch {
      return [];
    }
  };
  const save = () => {
    if (mode !== "change") return;
    const prog = p();
    prog.texts = { S: {}, E: {} };
    prog.seltexts = prog.seltexts || { S: {}, E: {} };
    body.querySelectorAll("tr[data-sym]").forEach((tr) => {
      const id = tr.querySelector(".sym-id").value.trim().toUpperCase();
      if (!/^[A-Z0-9]{3}$/.test(id)) return;
      prog.texts.S[id] = tr.querySelector(".t-es").value;
      prog.texts.E[id] = tr.querySelector(".t-en").value;
    });
    body.querySelectorAll("tr[data-sel]").forEach((tr) => {
      const id = tr.dataset.sel;
      prog.seltexts.S[id] = tr.querySelector(".t-es").value;
      prog.seltexts.E[id] = tr.querySelector(".t-en").value;
    });
    store.save();
    app.status("Elementos de texto grabados", "S");
  };
  const render = () => {
    const prog = p();
    const ro = mode !== "change";
    if (tab === "sym") {
      const tbody = h("tbody");
      const addRow = (id = "", es = "", en = "") =>
        tbody.append(
          h(
            "tr",
            { "data-sym": "1" },
            h("td", {}, h("input", { class: "sap-input sym-id upper", value: id, maxlength: 3, readonly: ro, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) })),
            h("td", {}, h("input", { class: "sap-input t-es", value: es, maxlength: 132, readonly: ro })),
            h("td", {}, h("input", { class: "sap-input t-en", value: en, maxlength: 132, readonly: ro })),
          ),
        );
      for (const id of rowsSym()) addRow(id, prog.texts?.S?.[id] || "", prog.texts?.E?.[id] || "");
      if (!ro) addRow();
      body.replaceChildren(
        h("p", { class: "hint" }, "Los símbolos de texto se usan en el código como TEXT-001 o 'Texto por defecto'(001). Escribe la traducción al inglés: al cambiar el idioma (Sistema → Usuario e idioma) el programa mostrará ese texto."),
        h("table", { class: "grid-table texts" }, h("thead", {}, h("tr", {}, h("th", { style: { width: "70px" } }, "Sím."), h("th", {}, "Texto (ES - original)"), h("th", {}, "Traducción (EN)"))), tbody),
        ro ? null : h("button", { class: "btn", onclick: () => addRow() }, "+ Añadir símbolo"),
      );
    } else {
      const ids = rowsSel();
      body.replaceChildren(
        h("p", { class: "hint" }, "Los textos de selección son las etiquetas que aparecen junto a cada PARAMETERS / SELECT-OPTIONS en la pantalla de selección."),
        ids.length === 0
          ? h("p", {}, "El programa no tiene PARAMETERS ni SELECT-OPTIONS.")
          : h(
              "table",
              { class: "grid-table texts" },
              h("thead", {}, h("tr", {}, h("th", { style: { width: "120px" } }, "Nombre"), h("th", {}, "Texto (ES - original)"), h("th", {}, "Traducción (EN)"))),
              h(
                "tbody",
                {},
                ids.map((id) =>
                  h(
                    "tr",
                    { "data-sel": id },
                    h("td", { class: "mono" }, id),
                    h("td", {}, h("input", { class: "sap-input t-es", value: prog.seltexts?.S?.[id] || "", maxlength: 30, readonly: ro })),
                    h("td", {}, h("input", { class: "sap-input t-en", value: prog.seltexts?.E?.[id] || "", maxlength: 30, readonly: ro })),
                  ),
                ),
              ),
            ),
      );
    }
  };
  let tabsEl;
  const setTab = (t) => {
    if (mode === "change") save();
    tab = t;
    tabsEl.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
    render();
  };
  return {
    id: "SE38-TXT",
    tcode: "SE38",
    title: () => `Elementos de texto: ${mode === "change" ? "Modificar" : "Visualizar"} programa ${n}`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: () => { if (mode === "change") save(); mode = mode === "change" ? "show" : "change"; app.refreshChrome(); render(); } },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: () => { save(); app.status("Elementos de texto activados", "S"); } },
    ],
    keys: { "Ctrl+S": () => save() },
    render(el) {
      tabsEl = h(
        "div",
        { class: "tabs" },
        h("button", { class: "tab active", "data-tab": "sym", onclick: () => setTab("sym") }, "Símbolos de texto"),
        h("button", { class: "tab", "data-tab": "sel", onclick: () => setTab("sel") }, "Textos de selección"),
      );
      body = h("div", { class: "tab-body" });
      el.append(h("div", { class: "panel wide" }, h("div", { class: "row" }, h("span", { class: "eh-label" }, "Programa"), h("b", {}, n), h("span", { class: "muted" }, p().title)), tabsEl, body));
      render();
    },
    canLeave: async () => {
      if (mode === "change") save();
      return true;
    },
  };
}
