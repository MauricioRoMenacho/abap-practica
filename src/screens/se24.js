// SE24 - Class Builder: clases globales (editor basado en código fuente).
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { pickFrom } from "./se11.js";

const upper = (e) => (e.target.value = e.target.value.toUpperCase());

export function classTemplate(n, desc, opts = {}) {
  const l = n.toLowerCase();
  return `CLASS ${l} DEFINITION
  PUBLIC${opts.final ? "\n  FINAL" : ""}
  CREATE PUBLIC.

  " ${desc}
  PUBLIC SECTION.
    METHODS constructor.

  PROTECTED SECTION.

  PRIVATE SECTION.
ENDCLASS.


CLASS ${l} IMPLEMENTATION.

  METHOD constructor.
  ENDMETHOD.

ENDCLASS.`;
}

const classes = () => store.data.classes || {};

export function se24Screen(app) {
  let nameI;
  const name = () => nameI.value.trim().toUpperCase();
  const open = (mode) => {
    const n = name();
    if (!n) return app.status("Indique una clase", "E");
    if (!classes()[n]) return app.status(`La clase ${n} no existe (las clases estándar del simulador no se muestran en SE24)`, "E");
    store.data.lastClass = n;
    store.save();
    app.push(classScreen(app, n, mode));
  };
  const create = async () => {
    const n = name();
    if (!/^[YZ]C[LX]_[A-Z0-9_]{1,26}$/.test(n)) return app.status("El nombre debe ser ZCL_... (clase) o ZCX_... (excepción). Ej.: ZCL_CALCULADORA", "E");
    if (classes()[n]) return app.status(`La clase ${n} ya existe`, "E");
    const descI = input({ maxlength: 60, placeholder: "Ej.: Cálculos de precios" });
    const finalI = h("input", { type: "checkbox", checked: true });
    const r = await dialog({
      title: `Crear clase ${n}`,
      body: h("div", {}, field("Descripción", descI, { required: true }), h("label", { class: "radio" }, finalI, h("span", { class: "radio-l" }, "Final (no se puede heredar de ella)")), h("p", { class: "hint" }, "Una clase global se guarda en el repositorio y cualquier programa puede usarla (a diferencia de una clase local lcl_, que solo existe dentro de su programa).")),
      buttons: [{ label: "Grabar", primary: true, value: () => descI.value.trim() || null }, { label: "Cancelar", value: false }],
    });
    if (r === false || r === undefined) return;
    if (!r) return app.status("Indique una descripción", "E");
    const isEx = n.startsWith("ZCX") || n.startsWith("YCX");
    const src = isEx
      ? `CLASS ${n.toLowerCase()} DEFINITION\n  PUBLIC\n  INHERITING FROM cx_static_check\n  CREATE PUBLIC.\n\n  PUBLIC SECTION.\n    DATA mv_texto TYPE string READ-ONLY.\n    METHODS constructor\n      IMPORTING iv_texto  TYPE string OPTIONAL\n                previous LIKE previous OPTIONAL.\n    METHODS if_message~get_text REDEFINITION.\nENDCLASS.\n\n\nCLASS ${n.toLowerCase()} IMPLEMENTATION.\n\n  METHOD constructor.\n    super->constructor( previous = previous ).\n    mv_texto = iv_texto.\n  ENDMETHOD.\n\n  METHOD if_message~get_text.\n    result = mv_texto.\n  ENDMETHOD.\n\nENDCLASS.`
      : classTemplate(n, r, { final: finalI.checked });
    (store.data.classes ||= {})[n] = { name: n, description: r, source: src, activeSource: null, created: new Date().toISOString() };
    store.data.lastClass = n;
    store.save();
    app.status(`Clase ${n} creada (inactiva)`, "S");
    app.push(classScreen(app, n, "change"));
  };
  const del = async () => {
    const n = name();
    if (!classes()[n]) return app.status(`La clase ${n} no existe`, "E");
    if (!(await confirm(`¿Borrar la clase ${n}?`, "Borrar", "Borrar", "Cancelar"))) return;
    delete store.data.classes[n];
    store.save();
    app.status(`Clase ${n} borrada`, "S");
  };
  const pick = async () => {
    const items = Object.values(classes()).map((c) => [c.name, c.description]);
    if (!items.length) return app.status("Todavía no hay clases globales", "I");
    const r = await pickFrom("Clases (F4)", items);
    if (r) nameI.value = r;
  };
  return {
    id: "SE24",
    tcode: "SE24",
    title: "Class Builder: Acceso",
    toolbar: () => [{ icon: "delete", tip: "Borrar", action: del }],
    keys: { F7: () => open("show"), F6: () => open("change"), F5: create, F4: pick },
    onEnter: () => open("show"),
    render(el) {
      nameI = input({ maxlength: 30, value: store.data.lastClass || "", class: "sap-input upper w-30", autofocus: true, oninput: upper });
      nameI.addEventListener("keydown", (e) => {
        if (e.key === "F4") {
          e.preventDefault();
          pick();
        }
      });
      const list = Object.values(classes());
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          field("Clase/interfaz", h("div", { class: "row" }, nameI, h("button", { class: "btn f4", onclick: pick }, "F4")), { required: true }),
          h(
            "div",
            { class: "row buttons" },
            h("button", { class: "btn", onclick: () => open("show") }, h("span", { class: "ico ico-display" }), "Visualizar"),
            h("button", { class: "btn", onclick: () => open("change") }, h("span", { class: "ico ico-change" }), "Modificar"),
            h("button", { class: "btn btn-primary", onclick: create }, h("span", { class: "ico ico-create" }), "Crear"),
          ),
          h("div", { class: "chips" }, h("span", { class: "muted small" }, "Tus clases: "), list.length ? list.map((c) => h("button", { class: "chip", title: c.description, onclick: () => { nameI.value = c.name; open("show"); } }, c.name)) : h("span", { class: "muted small" }, "ninguna todavía")),
          h("p", { class: "hint" }, "Convención: ZCL_ para clases, ZCX_ para clases de excepción. SE24 se muestra aquí en modo \"basado en código fuente\" (igual que en Eclipse/ADT): se escribe la DEFINITION y la IMPLEMENTATION completas."),
        ),
      );
    },
  };
}

function classScreen(app, n, initialMode) {
  let mode = initialMode;
  let editor = null;
  let headEl;
  let errorsEl;
  let tab = "code";
  let body;
  const c = () => store.data.classes[n];
  const dirty = () => editor && editor.getValue() !== c().source;
  const save = (silent) => {
    if (mode !== "change" || !editor) return;
    c().source = editor.getValue();
    c().changed = new Date().toISOString();
    store.save();
    updateHead();
    if (!silent) app.status(`Clase ${n} grabada (inactiva)`, "S");
  };
  const updateHead = () => {
    const inactive = c().activeSource !== c().source || dirty();
    headEl.replaceChildren(h("span", { class: "eh-label" }, "Clase"), h("b", {}, n), h("span", { class: "badge " + (inactive ? "badge-warn" : "badge-ok") }, inactive ? "Inactiva" : "Activa"), h("span", { class: "eh-title" }, c().description));
  };
  const showErrors = async (errors) => {
    if (editor) {
      const { setMarkers } = await import("../editor.js");
      setMarkers(editor, errors);
    }
    if (!errors.length) {
      errorsEl.classList.remove("open");
      errorsEl.replaceChildren();
      return;
    }
    errorsEl.classList.add("open");
    errorsEl.replaceChildren(
      h("div", { class: "err-head" }, h("span", { class: "ico ico-error" }), `${errors.length} error(es) de sintaxis`, h("button", { class: "err-close", onclick: () => errorsEl.classList.remove("open") }, h("span", { class: "ico ico-close" }))),
      h("table", { class: "err-table" }, h("tr", {}, h("th", {}, "Línea"), h("th", {}, "Mensaje")), errors.map((e) => h("tr", { onclick: () => { editor?.revealLineInCenter(e.row); editor?.setPosition({ lineNumber: e.row, column: e.col || 1 }); editor?.focus(); } }, h("td", { class: "num" }, e.row), h("td", {}, e.message)))),
    );
  };
  const check = async (inner) => {
    if (inner !== true) return app.busy(`Verificando ${n}...`, () => check(true));
    save(true);
    const src = editor ? editor.getValue() : c().source;
    const errs = [];
    const m = src.match(/^\s*CLASS\s+([\w/]+)\s+DEFINITION/im);
    if (!m || m[1].toUpperCase() !== n) errs.push({ row: 1, col: 1, message: `La definición debe ser CLASS ${n.toLowerCase()} DEFINITION PUBLIC ...` });
    else if (!/DEFINITION[\s\S]*?\bPUBLIC\b[\s\S]*?\./i.test(src.slice(src.search(/DEFINITION/i), src.search(/DEFINITION/i) + 200))) errs.push({ row: 1, col: 1, message: "Una clase global debe declararse con la adición PUBLIC" });
    const { ctxFor, repoContext } = await import("./se38.js");
    const ctx = { ...ctxFor("ZZ_CLASS_CHECK", "edit"), ...repoContext({ classOverride: { name: n, source: src } }) };
    errs.push(...app.engine.checkFile(n.toLowerCase() + ".clas.abap", ctx));
    await showErrors(errs);
    app.status(errs.length ? `La clase ${n} tiene errores de sintaxis` : `La clase ${n} no tiene errores de sintaxis`, errs.length ? "E" : "S");
    return errs.length === 0;
  };
  const activate = async (inner) => {
    if (inner !== true) return app.busy(`Activando ${n}...`, () => activate(true), 500);
    if (!(await check(true))) return app.status(`No se pudo activar: la clase ${n} tiene errores`, "E");
    c().activeSource = c().source;
    store.save();
    updateHead();
    app.status(`Clase ${n} activada: ya se puede usar en cualquier programa (NEW ${n.toLowerCase()}( ) o ${n.toLowerCase()}=>metodo( ))`, "S");
  };
  const methodsOverview = () => {
    const src = editor ? editor.getValue() : c().source;
    const def = src.split(/\bENDCLASS\b/i)[0] || "";
    const rows = [];
    let vis = "";
    for (const line of def.split("\n")) {
      const v = line.match(/^\s*(PUBLIC|PROTECTED|PRIVATE)\s+SECTION/i);
      if (v) vis = v[1].toUpperCase();
      const mm = line.match(/^\s*(CLASS-METHODS|METHODS|DATA|CLASS-DATA|CONSTANTS|EVENTS)\b:?\s+([\w~]+)/i);
      if (mm) rows.push([mm[2], /METHODS/i.test(mm[1]) ? "Método" : /EVENTS/i.test(mm[1]) ? "Evento" : "Atributo", /^CLASS-|CONSTANTS/i.test(mm[1]) ? "Estático" : "Instancia", { PUBLIC: "Público", PROTECTED: "Protegido", PRIVATE: "Privado" }[vis] || ""]);
    }
    return h(
      "div",
      { class: "panel" },
      h("table", { class: "grid-table" }, h("thead", {}, h("tr", {}, ["Componente", "Tipo", "Nivel", "Visibilidad"].map((x) => h("th", {}, x)))), h("tbody", {}, rows.length ? rows.map((r) => h("tr", {}, r.map((x, i) => h("td", { class: i === 0 ? "mono" : "" }, x)))) : h("tr", {}, h("td", { colspan: 4, class: "muted" }, "Sin componentes")))),
      h("p", { class: "hint" }, "Resumen de los componentes declarados en la DEFINITION. Nivel estático: se usa con =>, sin crear objeto. Nivel instancia: se usa con -> sobre un objeto creado con NEW."),
    );
  };
  const render = () => {
    if (editor) {
      if (mode === "change") c().source = editor.getValue();
      editor.dispose();
      editor = null;
    }
    const tabs = h("div", { class: "tabs" }, [["attr", "Propiedades"], ["comp", "Componentes"], ["code", "Código fuente"]].map(([k, l]) => h("button", { class: "tab" + (tab === k ? " active" : ""), onclick: () => { if (editor && mode === "change") save(true); tab = k; render(); } }, l)));
    let content;
    if (tab === "attr") content = h("div", { class: "panel" }, field("Descripción", h("input", { class: "sap-input", value: c().description, readonly: mode !== "change", style: { width: "60ch" }, oninput: (e) => { c().description = e.target.value; store.save(); } })), field("Instanciación", h("span", {}, /CREATE\s+PRIVATE/i.test(c().source) ? "Privada" : /CREATE\s+PROTECTED/i.test(c().source) ? "Protegida" : "Pública")), field("Final", h("span", {}, /\bFINAL\b/i.test(c().source.split(/\./)[0]) ? "Sí" : "No")));
    else if (tab === "comp") content = methodsOverview();
    else {
      const host = h("div", { class: "editor-host" });
      content = host;
      import("../editor.js").then(({ createEditor }) => {
        if (!body.contains(host)) return;
        editor = createEditor(host, c().source, mode !== "change");
        editor.onDidChangeModelContent(() => updateHead());
        editor.focus();
      });
    }
    body.replaceChildren(tabs, h("div", { class: "tab-body" + (tab === "code" ? " fm-code" : "") }, content));
  };
  return {
    id: "SE24-CL",
    tcode: "SE24",
    cls: "editor-screen",
    title: () => `Class Builder: ${mode === "change" ? "Modificar" : "Visualizar"} clase ${n}`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: () => { if (mode === "change") save(true); mode = mode === "change" ? "show" : "change"; app.refreshChrome(); render(); } },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: check },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate },
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
      save(true);
    },
    async canLeave() {
      save(true);
      return true;
    },
    destroy() {
      editor?.dispose();
      editor = null;
    },
  };
}
