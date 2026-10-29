// SE37 - Function Builder: grupos de funciones y módulos de función.
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { PARAM_KINDS, emptyParams, fgroups, allModules, moduleByName, allGroups, isFmActive, fmFilename, fmFullSource, bodyFromSource, userFugrFiles, structureNames } from "../fm-repo.js";
import { fmSource } from "../engine/fugr.js";
import { pickFrom } from "./se11.js";

const upper = (e) => (e.target.value = e.target.value.toUpperCase());
const validFm = (n) => /^[YZ][A-Z0-9_]{1,29}$/.test(n);
const validGroup = (n) => /^[YZ][A-Z0-9_]{1,25}$/.test(n);

async function createGroupDialog(app, preset = "") {
  const nameI = input({ maxlength: 26, value: preset, class: "sap-input upper w-30", oninput: upper });
  const descI = input({ maxlength: 60, placeholder: "Ej.: Funciones de vuelos" });
  const r = await dialog({
    title: "Crear grupo de funciones",
    body: h("div", {}, field("Grupo de funciones", nameI, { required: true }), field("Texto breve", descI, { required: true }), h("p", { class: "hint" }, "Un grupo de funciones agrupa módulos de función que comparten datos globales (include TOP). En SAP real es un programa de tipo F (SAPL + nombre del grupo).")),
    buttons: [{ label: "Grabar", primary: true, value: () => ({ name: nameI.value.trim().toUpperCase(), description: descI.value.trim() }) }, { label: "Cancelar", value: null }],
  });
  if (!r) return null;
  if (!validGroup(r.name)) return app.status("El grupo debe empezar por Z o Y (máximo 26 caracteres)", "E"), null;
  if (allGroups()[r.name]) return app.status(`El grupo de funciones ${r.name} ya existe`, "E"), null;
  if (!r.description) return app.status("Indique un texto breve", "E"), null;
  (store.data.fgroups ||= {})[r.name] = { name: r.name, description: r.description, top: "* Datos globales del grupo de funciones (visibles en todos sus módulos)\n", activeTop: null, created: new Date().toISOString() };
  store.save();
  app.status(`Grupo de funciones ${r.name} creado`, "S");
  return r.name;
}

export function se37Screen(app, preset) {
  let nameI;
  const name = () => nameI.value.trim().toUpperCase();
  const open = (mode) => {
    const n = name();
    if (!n) return app.status("Indique un módulo de función", "E");
    const m = moduleByName(n);
    if (!m) return app.status(`El módulo de función ${n} no existe`, "E");
    store.data.lastFm = n;
    store.save();
    app.push(fmScreen(app, n, m.standard ? "show" : mode));
  };
  const create = async () => {
    const n = name();
    if (!validFm(n)) return app.status("El nombre debe empezar por Z o Y (máximo 30 caracteres). Ej.: Z_SUMAR", "E");
    if (moduleByName(n)) return app.status(`El módulo de función ${n} ya existe`, "E");
    const groups = Object.values(fgroups());
    const grpSel = h("select", { class: "sap-input" }, groups.map((g) => h("option", { value: g.name }, `${g.name} - ${g.description}`)));
    const descI = input({ maxlength: 74, placeholder: "Ej.: Suma dos números" });
    const newGrp = h("button", { class: "btn", onclick: async (e) => { e.preventDefault(); const g = await createGroupDialog(app, "ZFG_" + n.replace(/^[YZ]_?/, "").substring(0, 20)); if (g) { grpSel.append(h("option", { value: g, selected: true }, g)); grpSel.value = g; } } }, h("span", { class: "ico ico-create" }), "Crear grupo");
    const r = await dialog({
      title: `Crear módulo de función ${n}`,
      body: h("div", {}, field("Grupo de funciones", h("div", { class: "row" }, grpSel, newGrp), { required: true }), field("Texto breve", descI, { required: true }), groups.length ? null : h("p", { class: "hint" }, "Todavía no tienes grupos de funciones: crea uno primero con el botón Crear grupo.")),
      buttons: [{ label: "Grabar", primary: true, value: () => ({ group: grpSel.value, description: descI.value.trim() }) }, { label: "Cancelar", value: null }],
    });
    if (!r) return;
    if (!r.group) return app.status("Indique un grupo de funciones", "E");
    if (!r.description) return app.status("Indique un texto breve", "E");
    (store.data.fmodules ||= {})[n] = { name: n, group: r.group, description: r.description, params: emptyParams(), body: "", activeBody: null, activeParams: null, created: new Date().toISOString() };
    store.data.lastFm = n;
    store.save();
    app.status(`Módulo de función ${n} creado en el grupo ${r.group} (inactivo)`, "S");
    app.push(fmScreen(app, n, "change", { tab: "import" }));
  };
  const del = async () => {
    const n = name();
    const m = store.data.fmodules?.[n];
    if (!m) return app.status(`El módulo de función ${n} no existe o es estándar`, "E");
    if (!(await confirm(`¿Borrar el módulo de función ${n}?`, "Borrar", "Borrar", "Cancelar"))) return;
    delete store.data.fmodules[n];
    store.save();
    app.status(`Módulo de función ${n} borrado`, "S");
  };
  const test = () => {
    const n = name();
    if (!moduleByName(n)) return app.status(`El módulo de función ${n} no existe`, "E");
    testFm(app, n);
  };
  const pick = async () => {
    const items = Object.values(allModules())
      .sort((a, b) => (a.standard === b.standard ? a.name.localeCompare(b.name) : a.standard ? 1 : -1))
      .map((m) => [m.name, `${m.description} (${m.group})`]);
    const r = await pickFrom("Módulos de función (F4)", items);
    if (r) nameI.value = r;
  };
  return {
    id: "SE37",
    tcode: "SE37",
    title: "Function Builder: Acceso",
    toolbar: () => [
      { icon: "exec", label: "Probar", key: "F8", action: test },
      { icon: "delete", tip: "Borrar", action: del },
      "-",
      { icon: "create", label: "Grupo de funciones", tip: "Crear grupo de funciones", action: () => createGroupDialog(app) },
    ],
    keys: { F7: () => open("show"), F6: () => open("change"), F5: create, F4: pick },
    onEnter: () => open("show"),
    render(el) {
      nameI = input({ maxlength: 30, value: preset || store.data.lastFm || "", class: "sap-input upper w-30", autofocus: true, oninput: upper });
      nameI.addEventListener("keydown", (e) => {
        if (e.key === "F4") {
          e.preventDefault();
          pick();
        }
      });
      const mods = Object.values(allModules());
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          field("Módulo de función", h("div", { class: "row" }, nameI, h("button", { class: "btn f4", title: "F4", onclick: pick }, "F4")), { required: true }),
          h(
            "div",
            { class: "row buttons" },
            h("button", { class: "btn", onclick: () => open("show") }, h("span", { class: "ico ico-display" }), "Visualizar"),
            h("button", { class: "btn", onclick: () => open("change") }, h("span", { class: "ico ico-change" }), "Modificar"),
            h("button", { class: "btn btn-primary", onclick: create }, h("span", { class: "ico ico-create" }), "Crear"),
            h("button", { class: "btn", onclick: test }, h("span", { class: "ico ico-exec" }), "Probar (F8)"),
          ),
          h("div", { class: "chips" }, h("span", { class: "muted small" }, "Tuyos: "), mods.filter((m) => !m.standard).length ? mods.filter((m) => !m.standard).map((m) => h("button", { class: "chip", title: m.description, onclick: () => { nameI.value = m.name; open("show"); } }, m.name)) : h("span", { class: "muted small" }, "ninguno todavía")),
          h("div", { class: "chips" }, h("span", { class: "muted small" }, "Estándar: "), mods.filter((m) => m.standard).map((m) => h("button", { class: "chip", title: m.description, onclick: () => { nameI.value = m.name; open("show"); } }, m.name))),
          h("p", { class: "hint" }, "Un módulo de función es un bloque de código reutilizable con una interfaz fija (parámetros de importación, exportación, tablas y excepciones). Se llama desde cualquier programa con CALL FUNCTION 'NOMBRE'. Las BAPIs son módulos de función estándar que SAP publica para leer y modificar datos de negocio."),
        ),
      );
    },
  };
}

// ---------------------------------------------------------------- módulo de función
export function openFm(app, n, mode = "show") {
  const m = moduleByName(n);
  if (!m) return app.status(`El módulo de función ${n} no existe`, "E");
  app.push(fmScreen(app, m.name, m.standard ? "show" : mode));
}

function fmScreen(app, n, initialMode, opts = {}) {
  let mode = initialMode;
  let tab = opts.tab || "code";
  let body;
  let editor = null;
  let errorsEl;
  let headEl;
  const fm = () => moduleByName(n);
  const ro = () => mode !== "change" || fm().standard;

  const readParams = () => {
    if (ro() || !body || tab === "code" || tab === "attr") return;
    const m = store.data.fmodules[n];
    const list = [];
    body.querySelectorAll("tr[data-p]").forEach((tr) => {
      const v = (c) => tr.querySelector("." + c);
      const nm = v("p-name").value.trim().toUpperCase();
      if (!nm) return;
      const p = { name: nm };
      if (tab !== "exceptions") {
        const t = v("p-type").value.trim().toUpperCase();
        if (t) p.type = t;
        if (v("p-opt")?.checked) p.optional = true;
        if (v("p-def")?.value.trim()) p.default = v("p-def").value.trim();
        if (tab !== "tables") p.byValue = v("p-val") ? v("p-val").checked : true;
      } else if (v("p-text")?.value.trim()) p.text = v("p-text").value.trim();
      list.push(p);
    });
    m.params[tab] = list;
  };
  const readCode = () => {
    if (ro() || !editor) return;
    store.data.fmodules[n].body = bodyFromSource(editor.getValue());
  };
  const readAttr = () => {
    if (ro() || tab !== "attr" || !body) return;
    const d = body.querySelector(".fm-desc");
    if (d) store.data.fmodules[n].description = d.value;
  };
  const readAll = () => {
    readParams();
    readCode();
    readAttr();
  };
  const save = (silent) => {
    if (ro()) return;
    readAll();
    store.data.fmodules[n].changed = new Date().toISOString();
    store.save();
    updateHead();
    if (!silent) app.status(`Módulo de función ${n} grabado (inactivo)`, "S");
  };

  const validateParams = (m) => {
    const errs = [];
    const seen = new Set();
    for (const [k, label] of PARAM_KINDS) {
      for (const p of m.params[k] || []) {
        if (!/^[A-Z][A-Z0-9_]{0,29}$/.test(p.name)) errs.push(`${label}: nombre de parámetro no válido "${p.name}"`);
        if (seen.has(p.name)) errs.push(`El parámetro ${p.name} está repetido`);
        seen.add(p.name);
        if (k === "tables" && p.type && !/^[A-Z0-9_]+$/.test(p.type)) errs.push(`Tablas: ${p.name} debe tener una estructura (tabla o estructura del diccionario)`);
      }
    }
    return errs;
  };

  const check = async (inner) => {
    if (inner !== true) return app.busy(`Verificando ${n}...`, () => check(true));
    save(true);
    const m = fm();
    if (m.standard) {
      app.status(`El módulo de función ${n} no tiene errores de sintaxis`, "S");
      return true;
    }
    const perr = validateParams(m);
    if (perr.length) {
      showErrors(perr.map((message) => ({ row: 0, col: 1, message })));
      app.status(perr[0], "E");
      return false;
    }
    const { ctxFor } = await import("./se38.js");
    const ctx = ctxFor("ZZ_FM_CHECK", "edit");
    ctx.extraFiles = ctx.extraFiles.filter((f) => !f.filename.startsWith(m.group.toLowerCase() + ".fugr."));
    ctx.extraFiles.push(...userFugrFiles({ name: n, group: m.group, params: m.params, body: m.body }).filter((f) => f.filename.startsWith(m.group.toLowerCase() + ".fugr.")));
    const errors = app.engine.checkFile(fmFilename(m), ctx);
    showErrors(errors);
    if (errors.length) app.status(`El módulo de función ${n} tiene errores de sintaxis`, "E");
    else app.status(`El módulo de función ${n} no tiene errores de sintaxis`, "S");
    return errors.length === 0;
  };
  const activate = async (inner) => {
    if (inner !== true) return app.busy(`Activando ${n}...`, () => activate(true), 500);
    if (fm().standard) return app.status("Los módulos estándar ya están activos", "S");
    const ok = await check(true);
    if (!ok) return app.status(`No se pudo activar: ${n} tiene errores`, "E");
    const m = store.data.fmodules[n];
    m.activeBody = m.body;
    m.activeParams = JSON.parse(JSON.stringify(m.params));
    const g = store.data.fgroups[m.group];
    if (g && g.activeTop !== g.top) g.activeTop = g.top;
    store.save();
    updateHead();
    app.status(`Módulo de función ${n} activado: ya se puede llamar con CALL FUNCTION '${n}'`, "S");
  };

  const showErrors = async (errors) => {
    if (!errorsEl) return;
    if (editor) {
      const { setMarkers } = await import("../editor.js");
      setMarkers(editor, errors.filter((e) => e.row > 0));
    }
    if (!errors.length) {
      errorsEl.classList.remove("open");
      errorsEl.replaceChildren();
      return;
    }
    errorsEl.classList.add("open");
    errorsEl.replaceChildren(
      h("div", { class: "err-head" }, h("span", { class: "ico ico-error" }), `${errors.length} error(es)`, h("button", { class: "err-close", onclick: () => errorsEl.classList.remove("open") }, h("span", { class: "ico ico-close" }))),
      h(
        "table",
        { class: "err-table" },
        h("tr", {}, h("th", {}, "Línea"), h("th", {}, "Mensaje")),
        errors.map((e) =>
          h(
            "tr",
            {
              onclick: () => {
                if (!e.row) return;
                if (tab !== "code") {
                  tab = "code";
                  render();
                }
                setTimeout(() => {
                  editor?.revealLineInCenter(e.row);
                  editor?.setPosition({ lineNumber: e.row, column: e.col || 1 });
                  editor?.focus();
                }, 50);
              },
            },
            h("td", { class: "num" }, e.row || ""),
            h("td", {}, e.message),
          ),
        ),
      ),
    );
  };

  const updateHead = () => {
    if (!headEl) return;
    const m = fm();
    const active = isFmActive(m);
    headEl.replaceChildren(
      h("span", { class: "eh-label" }, "Módulo de función"),
      h("b", {}, n),
      h("span", { class: "badge " + (active ? "badge-ok" : "badge-warn") }, active ? "Activo" : "Inactivo"),
      m.standard ? h("span", { class: "badge" }, "Estándar - solo lectura") : null,
      h("span", { class: "eh-title" }, m.description),
      h("span", { class: "eh-title" }, "Grupo: " + m.group),
    );
  };

  const paramTable = () => {
    const m = fm();
    const list = (m.params || {})[tab] || [];
    const R = ro();
    const tbody = h("tbody");
    const cols =
      tab === "exceptions"
        ? [["Excepción", "p-name"], ["Texto breve", "p-text"]]
        : tab === "tables"
          ? [["Parámetro", "p-name"], ["Tipo (estructura)", "p-type"], ["Opcional", "p-opt"]]
          : tab === "export"
            ? [["Parámetro", "p-name"], ["Tipo de referencia", "p-type"], ["Paso por valor", "p-val"]]
            : [["Parámetro", "p-name"], ["Tipo de referencia", "p-type"], ["Valor propuesto", "p-def"], ["Opcional", "p-opt"], ["Paso por valor", "p-val"]];
    const addRow = (p = {}) =>
      tbody.append(
        h(
          "tr",
          { "data-p": "1" },
          cols.map(([, c]) => {
            if (c === "p-opt") return h("td", { class: "center" }, h("input", { type: "checkbox", class: c, checked: !!p.optional, disabled: R }));
            if (c === "p-val") return h("td", { class: "center" }, h("input", { type: "checkbox", class: c, checked: p.byValue !== false && !!(p.byValue || !p.name), disabled: R }));
            const val = c === "p-name" ? p.name : c === "p-type" ? p.type : c === "p-def" ? p.default : p.text;
            return h("td", {}, h("input", { class: "sap-input mono " + c + (c === "p-text" ? "" : " upper"), value: val || "", readonly: R, maxlength: c === "p-text" ? 60 : 40, oninput: c === "p-text" || c === "p-def" ? undefined : upper }));
          }),
          R ? null : h("td", {}, h("button", { class: "btn small", title: "Borrar línea", onclick: (e) => { e.target.closest("tr").remove(); } }, h("span", { class: "ico ico-delete" }))),
        ),
      );
    for (const p of list) addRow(p);
    if (!R) addRow();
    const hints = {
      import: "Importación: valores que recibe la función (el programa los pasa con EXPORTING). Tipo de referencia: un tipo ABAP (I, STRING, D...), un elemento de datos o TABLA-CAMPO (p. ej. SFLIGHT-CARRID). Opcional: el llamador puede omitirlo.",
      export: "Exportación: valores que devuelve la función (el programa los recibe con IMPORTING).",
      changing: "Modificación: la función recibe el valor y lo puede cambiar (CHANGING en ambos lados).",
      tables: "Tablas: tablas internas que se pasan por referencia (TABLES). Es la forma antigua, pero las BAPIs la usan mucho (p. ej. RETURN STRUCTURE BAPIRET2). Estructuras disponibles: tablas de SE11 y " + structureNames().join(", ") + ".",
      exceptions: "Excepciones clásicas: la función las lanza con RAISE nombre. El programa las captura con EXCEPTIONS nombre = 1 OTHERS = 2 y luego revisa sy-subrc.",
    };
    return h(
      "div",
      {},
      h("table", { class: "grid-table" }, h("thead", {}, h("tr", {}, cols.map(([l]) => h("th", {}, l)), R ? null : h("th", {}, ""))), tbody),
      R ? null : h("button", { class: "btn", onclick: () => addRow() }, "+ Añadir línea"),
      h("p", { class: "hint" }, hints[tab]),
    );
  };

  const render = () => {
    if (editor) {
      readCode();
      editor.dispose();
      editor = null;
    }
    const m = fm();
    const TABS = [["attr", "Atributos"], ...PARAM_KINDS, ["code", "Código fuente"]];
    const tabs = h(
      "div",
      { class: "tabs" },
      TABS.map(([k, l]) => {
        const cnt = k !== "attr" && k !== "code" ? (m.params?.[k] || []).length : 0;
        return h("button", { class: "tab" + (tab === k ? " active" : ""), onclick: () => { readAll(); tab = k; render(); } }, l + (cnt ? ` (${cnt})` : ""));
      }),
    );
    let content;
    if (tab === "attr") {
      const g = allGroups()[m.group] || {};
      content = h(
        "div",
        { class: "panel" },
        field("Texto breve", h("input", { class: "sap-input fm-desc", value: m.description, readonly: ro(), style: { width: "60ch" } })),
        field("Grupo de funciones", h("span", { class: "mono" }, `${m.group} - ${g.description || ""}`)),
        field("Tipo de proceso", h("span", {}, "Módulo de función normal")),
        m.standard ? null : field("Datos globales", h("button", { class: "btn", onclick: () => app.push(topScreen(app, m.group, mode)) }, `Include L${m.group}TOP`)),
        h("p", { class: "hint" }, "En SAP real también existe \"Módulo de acceso remoto\" (RFC): se puede llamar desde otro sistema. Las BAPIs son de ese tipo."),
      );
    } else if (tab === "code") {
      const host = h("div", { class: "editor-host" });
      content = host;
      import("../editor.js").then(({ createEditor }) => {
        if (!body.contains(host)) return;
        const src = m.standard ? fmSource({ name: m.name, params: m.params }, m.body) : fmFullSource(m, true);
        editor = createEditor(host, src, ro());
        editor.onDidChangeModelContent(() => updateHead());
        editor.focus();
      });
    } else content = paramTable();
    body.replaceChildren(tabs, h("div", { class: "tab-body" + (tab === "code" ? " fm-code" : "") }, content));
  };

  const toggle = () => {
    if (fm().standard) return app.status("Los módulos de función estándar solo se pueden visualizar", "W");
    if (mode === "change") save(true);
    mode = mode === "change" ? "show" : "change";
    app.refreshChrome();
    render();
    updateHead();
  };

  return {
    id: "SE37-FM",
    tcode: "SE37",
    cls: "editor-screen",
    title: () => `Function Builder: ${ro() ? "Visualizar" : "Modificar"} módulo de función`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: toggle },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: check },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate },
      { icon: "exec", label: "Probar", key: "F8", primary: true, action: () => { save(true); testFm(app, n); } },
      "-",
      { icon: "save", label: "Grabar", action: () => save() },
    ],
    keys: { "Ctrl+S": () => save() },
    render(el) {
      headEl = h("div", { class: "editor-head" });
      body = h("div", { class: "fm-body" });
      errorsEl = h("div", { class: "err-panel" });
      el.append(headEl, body, errorsEl);
      updateHead();
      render();
    },
    hidden() {
      if (!ro()) save(true);
    },
    async canLeave() {
      if (!ro()) save(true);
      return true;
    },
    destroy() {
      editor?.dispose();
      editor = null;
    },
  };
}

// ---------------------------------------------------------------- include TOP (datos globales)
function topScreen(app, gname, mode) {
  let editor;
  const g = () => store.data.fgroups[gname];
  return {
    id: "SE37-TOP",
    tcode: "SE37",
    cls: "editor-screen",
    title: () => `Datos globales del grupo ${gname} (L${gname}TOP)`,
    toolbar: () => [{ icon: "save", label: "Grabar", action: () => { g().top = editor.getValue().replace(/^FUNCTION-POOL[^\n]*\n?/i, ""); store.save(); app.status(`Include L${gname}TOP grabado. Se activa al activar un módulo del grupo.`, "S"); } }],
    render(el) {
      const host = h("div", { class: "editor-host" });
      el.append(h("div", { class: "editor-head" }, h("span", { class: "eh-label" }, "Include"), h("b", {}, `L${gname}TOP`), h("span", { class: "eh-title" }, "Variables declaradas aquí conservan su valor entre llamadas a módulos del mismo grupo (memoria del grupo de funciones)")), host);
      import("../editor.js").then(({ createEditor }) => {
        editor = createEditor(host, `FUNCTION-POOL ${gname.toLowerCase()}.\n${g().top || ""}`, mode !== "change");
      });
    },
    canLeave: async () => {
      if (mode === "change" && editor) {
        g().top = editor.getValue().replace(/^FUNCTION-POOL[^\n]*\n?/i, "");
        store.save();
      }
      return true;
    },
    destroy() {
      editor?.dispose();
    },
  };
}

// ---------------------------------------------------------------- entorno de prueba (F8)
const GENERIC = { CLIKE: "string", CSEQUENCE: "string", ANY: "string", DATA: "string", SIMPLE: "string", C: "c LENGTH 255", N: "n LENGTH 20", P: "p LENGTH 16 DECIMALS 2", NUMERIC: "p LENGTH 16 DECIMALS 2", X: "x LENGTH 32" };
const declType = (t) => (!t ? "string" : GENERIC[t] || t.toLowerCase());
const isStructType = (t) => !!t && (structureNames().includes(t) || (!t.includes("-") && !!store.data.tables?.[t]) || /^(SCARR|SPFLI|SFLIGHT|SBOOK|SCUSTOM|KNA1|MARA|VBAK|VBAP|T001)$/.test(t));

export function testProgram(m, values) {
  const P = m.activeParams || m.params;
  const L = ["REPORT zz_test_fm.", ""];
  const v = (p) => "lv_" + p.name.toLowerCase();
  const t = (p) => "lt_" + p.name.toLowerCase();
  for (const p of P.import || []) L.push(`DATA ${v(p)} TYPE ${declType(p.type)}.`);
  for (const p of P.export || []) L.push(`DATA ${v(p)} TYPE ${declType(p.type)}.`);
  for (const p of P.changing || []) L.push(`DATA ${v(p)} TYPE ${declType(p.type)}.`);
  for (const p of P.tables || []) L.push(`DATA ${t(p)} TYPE STANDARD TABLE OF ${p.type ? p.type.toLowerCase() : "string"} WITH DEFAULT KEY.`);
  L.push("DATA lv_t0 TYPE i.", "DATA lv_t1 TYPE i.", "FIELD-SYMBOLS <lv_comp> TYPE any.", "FIELD-SYMBOLS <ls_fila> TYPE any.", "");
  for (const p of [...(P.import || []), ...(P.changing || [])]) {
    const val = values[p.name];
    if (val === undefined || val === "" || isStructType(p.type)) continue;
    L.push(`${v(p)} = '${String(val).replace(/'/g, "''")}'.`);
  }
  const call = [`CALL FUNCTION '${m.name}'`];
  const sec = (kw, list, fn) => {
    const used = list.filter((p) => !(kw === "EXPORTING" && p.optional && (values[p.name] === undefined || values[p.name] === "")));
    if (!used.length) return;
    call.push(`  ${kw}`);
    for (const p of used) call.push(`    ${p.name.toLowerCase()} = ${fn(p)}`);
  };
  sec("EXPORTING", P.import || [], v);
  sec("IMPORTING", P.export || [], v);
  sec("CHANGING", P.changing || [], v);
  sec("TABLES", P.tables || [], t);
  const ex = P.exceptions || [];
  if (ex.length) {
    call.push("  EXCEPTIONS");
    ex.forEach((e, i) => call.push(`    ${e.name.toLowerCase()} = ${i + 1}`));
    call.push(`    OTHERS = ${ex.length + 1}`);
  }
  call[call.length - 1] += ".";
  L.push("GET RUN TIME FIELD lv_t0.", ...call, "GET RUN TIME FIELD lv_t1.", "");
  L.push(`WRITE: / 'Prueba del módulo de función ${m.name}' COLOR COL_HEADING.`, "ULINE.");
  if (ex.length) {
    L.push("CASE sy-subrc.", "  WHEN 0.", "    WRITE / 'Sin excepciones (sy-subrc = 0)' COLOR COL_POSITIVE.");
    ex.forEach((e, i) => L.push(`  WHEN ${i + 1}.`, `    WRITE / 'Excepción ${e.name} (sy-subrc = ${i + 1})' COLOR COL_NEGATIVE.`));
    L.push("  WHEN OTHERS.", "    WRITE / 'Excepción OTHERS' COLOR COL_NEGATIVE.", "ENDCASE.");
  }
  L.push("WRITE: / 'Tiempo de ejecución (microsegundos):', lv_t1 - lv_t0.", "SKIP.");
  const dumpValue = (label, name, struct) => {
    if (struct) {
      L.push(`WRITE / '${label}' COLOR COL_GROUP.`, "DO.", `  ASSIGN COMPONENT sy-index OF STRUCTURE ${name} TO <lv_comp>.`, "  IF sy-subrc <> 0.", "    EXIT.", "  ENDIF.", "  WRITE: / '   ', sy-index, <lv_comp>.", "ENDDO.");
    } else L.push(`WRITE: / '${label}' COLOR COL_GROUP, ${name}.`);
  };
  if ((P.export || []).length || (P.changing || []).length) L.push("WRITE / 'Parámetros de exportación / modificación' COLOR COL_HEADING.");
  for (const p of [...(P.export || []), ...(P.changing || [])]) dumpValue(p.name, v(p), isStructType(p.type));
  for (const p of P.tables || []) {
    L.push("SKIP.", `WRITE: / 'Tabla ${p.name}:' COLOR COL_HEADING, lines( ${t(p)} ), 'línea(s)'.`);
    L.push(`LOOP AT ${t(p)} ASSIGNING <ls_fila>.`, "  DO.", "    ASSIGN COMPONENT sy-index OF STRUCTURE <ls_fila> TO <lv_comp>.", "    IF sy-subrc <> 0.", "      IF sy-index = 1.", "        WRITE / <ls_fila>.", "      ENDIF.", "      EXIT.", "    ENDIF.", "    IF sy-index = 1.", "      WRITE / <lv_comp>.", "    ELSE.", "      WRITE <lv_comp>.", "    ENDIF.", "  ENDDO.", "ENDLOOP.");
  }
  return L.join("\n");
}

async function testFm(app, n) {
  const m = moduleByName(n);
  if (!isFmActive(m) && m.activeBody == null) return app.status(`El módulo de función ${n} no está activo. Actívelo primero (Ctrl+F3)`, "E");
  if (!isFmActive(m)) app.status(`Atención: se prueba la versión activa de ${n}; hay cambios sin activar`, "W");
  const P = m.activeParams || m.params;
  const inputs = {};
  const rows = [...(P.import || []), ...(P.changing || [])].map((p) => {
    const struct = isStructType(p.type);
    const inp = input({ class: "sap-input", value: store.data.fmTestValues?.[n]?.[p.name] ?? (p.default ? p.default.replace(/^'|'$/g, "") : ""), disabled: struct, placeholder: struct ? "estructura: se pasa vacía" : "" });
    inputs[p.name] = inp;
    return h("tr", {}, h("td", { class: "mono" }, p.name), h("td", { class: "mono muted" }, p.type || "(genérico)"), h("td", {}, inp), h("td", { class: "muted small" }, p.optional ? "opcional" : "obligatorio"));
  });
  const bodyEl = h(
    "div",
    { class: "fm-test" },
    h("p", {}, `Entorno de prueba para el módulo de función ${n}. Indique los parámetros de importación y pulse Ejecutar.`),
    rows.length ? h("table", { class: "grid-table" }, h("thead", {}, h("tr", {}, h("th", {}, "Parámetro"), h("th", {}, "Tipo"), h("th", {}, "Valor"), h("th", {}, ""))), h("tbody", {}, rows)) : h("p", { class: "muted" }, "Este módulo no tiene parámetros de importación."),
    h("p", { class: "hint" }, "Fechas en formato interno AAAAMMDD (p. ej. 20260124). El resultado se muestra como lista, igual que el entorno de prueba de SE37."),
  );
  const ok = await dialog({ title: `Probar módulo de función ${n}`, body: bodyEl, width: "640px", buttons: [{ label: "Ejecutar (F8)", primary: true, value: true }, { label: "Cancelar", value: false }] });
  if (!ok) return;
  const values = Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value]));
  (store.data.fmTestValues ||= {})[n] = values;
  store.save();
  const { runProgram } = await import("./run.js");
  runProgram(app, "ZZ_TEST_FM", { virtual: { name: "ZZ_TEST_FM", title: `Prueba de ${n}`, activeSource: testProgram(m, values) } });
}
