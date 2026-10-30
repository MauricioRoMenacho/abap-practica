import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { runProgram } from "./run.js";
import { preprocess } from "../engine/preprocess.js";
import { expandIncludes, collectIncludes } from "../engine/includes.js";
import { toggleBreakpoint } from "./debugger.js";

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
        h("span", {}, p.title + (p.type === "I" ? " (include)" : "")),
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
    const type = h("select", { class: "sap-input" }, h("option", { value: "1" }, "1 - Programa ejecutable"), h("option", { value: "I" }, "I - Programa include"));
    const ok = await dialog({
      title: `Atributos de programa ${n}`,
      width: "560px",
      body: h(
        "div",
        { class: "form-grid" },
        h("label", { class: "required" }, "Título"),
        title,
        h("label", {}, "Tipo"),
        type,
        h("label", {}, "Idioma original"),
        h("input", { class: "sap-input", value: "ES", disabled: true }),
        h("p", { class: "hint", style: { gridColumn: "1 / -1" } }, "Un include no se ejecuta solo: contiene parte del código y se inserta en un programa con la instrucción INCLUDE. En un sistema real ahora pediría paquete y orden de transporte; aquí se graba directamente como objeto local."),
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
    store.createProgram(n, ok, type.value);
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
    const p = store.createProgram(t, src.title, src.type || "1");
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
      { icon: "exec", label: "Ejecutar", key: "F8", action: () => { const n = check(true); if (n) runOrMain(app, n); } },
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

  const isInc = () => prog().type === "I";
  const kind = () => (isInc() ? "Include" : "Report");

  const updateHeader = () => {
    const p = prog();
    const inactive = p.activeSource === null || p.activeSource !== p.source || dirty();
    const mains = isInc() ? store.mainProgramsOf(n) : [];
    headerEl.replaceChildren(
      h("span", { class: "eh-label" }, kind()),
      h("b", {}, n),
      h("span", { class: "badge " + (inactive ? "badge-warn" : "badge-ok") }, inactive ? "Inactivo" : "Activo"),
      dirty() ? h("span", { class: "badge badge-dirty" }, "modificado sin grabar") : null,
      h("span", { class: "eh-title" }, p.title),
      isInc() ? h("span", { class: "eh-title" }, mains.length ? "Programa principal: " + mains.join(", ") : "Aún no está incluido en ningún programa") : null,
    );
  };

  const save = (silent) => {
    if (mode !== "change") return true;
    const p = prog();
    p.source = editor.getValue();
    p.changed = new Date().toISOString();
    store.save();
    updateHeader();
    if (!silent) app.status(`Se ha grabado ${isInc() ? "el include" : "el programa"} ${n} (inactivo)`, "S");
    return true;
  };
  const saveBusy = () => {
    if (mode !== "change") return app.status("Cambie a modo modificar (Ctrl+F1) para grabar", "W");
    return app.busy(`Grabando ${n}...`, () => save(false), 250);
  };

  const openObject = async (obj, line, errors) => {
    if (obj === n) {
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: 1 });
      editor.focus();
      return;
    }
    if (mode === "change") save(true);
    app.push(editorScreen(app, obj, mode, { errors: errors || [], gotoLine: line }));
  };

  const showErrors = async (errors, title) => {
    lastErrors = errors;
    const { setMarkers } = await import("../editor.js");
    if (!editor) return;
    setMarkers(editor, errors.filter((e) => !e.obj || e.obj === n));
    if (!errors.length) {
      errorsEl.replaceChildren();
      errorsEl.classList.remove("open");
      return;
    }
    const multi = errors.some((e) => e.obj && e.obj !== n);
    errorsEl.classList.add("open");
    errorsEl.replaceChildren(
      h("div", { class: "err-head" }, h("span", { class: "ico ico-error" }), title || `${errors.length} error(es) de sintaxis`, h("button", { class: "err-close", onclick: () => errorsEl.classList.remove("open") }, h("span", { class: "ico ico-close" }))),
      h(
        "table",
        { class: "err-table" },
        h("tr", {}, multi ? h("th", {}, "Objeto") : null, h("th", {}, "Línea"), h("th", {}, "Mensaje")),
        errors.map((e) =>
          h(
            "tr",
            {
              title: e.obj && e.obj !== n ? `Abrir ${e.obj}` : "",
              onclick: () => {
                if (e.obj && e.obj !== n) return openObject(e.obj, e.row, errors.filter((x) => x.obj === e.obj));
                editor.revealLineInCenter(e.row);
                editor.setPosition({ lineNumber: e.row, column: e.col });
                editor.focus();
              },
            },
            multi ? h("td", { class: "mono" }, e.obj || n) : null,
            h("td", { class: "num" }, e.row),
            h("td", {}, e.message),
          ),
        ),
      ),
    );
  };

  // verifica el objeto: un include se verifica dentro de su programa principal
  const runCheck = () => {
    if (!isInc()) {
      return { errors: app.engine.check({ name: n, source: editor.getValue() }, ctxFor(n, "edit")).errors, main: n };
    }
    const mains = store.mainProgramsOf(n);
    if (mains.length) {
      const main = store.program(mains[0]);
      return { errors: app.engine.check({ name: main.name, source: main.source }, ctxFor(main.name, "edit")).errors, main: main.name };
    }
    const wrapper = `REPORT zz_check_${n.toLowerCase().substring(0, 15)}.\nINCLUDE ${n}.`;
    const res = app.engine.check({ name: "ZZ_CHECK", source: wrapper }, ctxFor(n, "edit"));
    return { errors: res.errors.filter((e) => e.obj !== "ZZ_CHECK"), main: null };
  };

  const doCheck = async (inner) => {
    save(true);
    if (!inner) return app.busy(`Verificando sintaxis de ${n}...`, () => doCheck(true));
    const { errors, main } = runCheck();
    await showErrors(errors);
    const what = isInc() ? `El include ${n}` : `El programa ${n}`;
    if (errors.length) app.status(`${what} tiene errores de sintaxis` + (isInc() && main ? ` (verificado dentro de ${main})` : ""), "E");
    else app.status(`${what} no tiene errores de sintaxis` + (isInc() && main ? ` (verificado dentro de ${main})` : ""), "S");
    return errors.length === 0;
  };

  // objetos inactivos relacionados (como la "lista de objetos inactivos" de SAP)
  const inactiveObjects = () => {
    const inactive = (x) => {
      const q = store.program(x);
      return q && (q.activeSource === null || q.activeSource !== q.source);
    };
    const incsOf = (main) => [...collectIncludes(store.program(main).source, (x) => (store.isInclude(x) ? store.program(x).source : null))];
    const list = [n];
    const mains = isInc() ? store.mainProgramsOf(n) : [n];
    for (const m of mains) {
      if (m !== n && inactive(m)) list.push(m);
      for (const inc of incsOf(m)) if (inc !== n && inactive(inc) && !list.includes(inc)) list.push(inc);
    }
    return list;
  };

  const worklistDialog = async (list) => {
    const checks = {};
    const rows = list.map((o) => {
      const q = store.program(o);
      const cb = h("input", { type: "checkbox", checked: true });
      checks[o] = cb;
      return h(
        "tr",
        { onclick: (e) => { if (e.target !== cb) cb.checked = !cb.checked; } },
        h("td", { class: "center" }, cb),
        h("td", {}, q.type === "I" ? "Include" : "Programa"),
        h("td", { class: "mono" }, h("b", {}, o)),
        h("td", {}, q.title || ""),
        h("td", { class: "mono" }, store.data.settings.user || "ALUMNO"),
      );
    });
    const setAll = (v) => Object.values(checks).forEach((c) => (c.checked = v));
    const body = h(
      "div",
      { class: "worklist" },
      h("div", { class: "worklist-bar" }, h("button", { class: "btn small", onclick: () => setAll(true), title: "Seleccionar todo" }, "Seleccionar todo"), h("button", { class: "btn small", onclick: () => setAll(false), title: "Deseleccionar todo" }, "Deseleccionar")),
      h(
        "table",
        { class: "grid-table worklist-table" },
        h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "Tipo de objeto"), h("th", {}, "Nombre"), h("th", {}, "Descripción"), h("th", {}, "Usuario"))),
        h("tbody", {}, rows),
      ),
      h("p", { class: "hint" }, "Marque los objetos que se deben activar. Un programa se verifica junto con sus includes: si deja un include sin marcar, se usa su versión activa."),
    );
    const r = await dialog({
      title: `Objetos inactivos de ${store.data.settings.user || "ALUMNO"}`,
      width: "720px",
      body,
      buttons: [
        { label: "Continuar", primary: true, value: () => list.filter((o) => checks[o].checked) },
        { label: "Cancelar", value: null },
      ],
    });
    return r;
  };

  const activate = async (inner) => {
    if (mode === "change") save(true);
    let selected = [n];
    if (inner !== true) {
      const list = inactiveObjects();
      if (list.length > 1) {
        const r = await worklistDialog(list);
        if (!r) {
          app.status("Activación cancelada", "W");
          return false;
        }
        if (!r.length) {
          app.status("No se seleccionó ningún objeto", "W");
          return false;
        }
        selected = r;
      }
      return app.busy(`Activando ${selected.length > 1 ? selected.length + " objetos" : n}: verificando y generando...`, () => activateObjects(selected), 550);
    }
    return activateObjects(selected);
  };

  // verifica y activa los objetos marcados
  const activateObjects = async (selected) => {
    const sel = new Set(selected);
    const srcOf = (x) => (sel.has(x) ? store.program(x).source : store.program(x).activeSource);
    const resolveInclude = (inc) => {
      const ip = store.program(inc);
      if (!ip) return null;
      if (ip.type !== "I") return { error: "notinclude" };
      const src = srcOf(inc);
      if (src === null || src === undefined) return { error: "inactive" };
      return { source: src };
    };
    // programas que hay que verificar: los marcados y, para cada include marcado, su programa principal
    const toCheck = new Set(selected.filter((x) => store.program(x).type !== "I"));
    let looseIncludes = [];
    for (const x of selected.filter((y) => store.program(y).type === "I")) {
      const mains = store.mainProgramsOf(x);
      if (!mains.length) looseIncludes.push(x);
      else if (!mains.some((m) => toCheck.has(m))) toCheck.add(mains[0]);
    }
    const errors = [];
    for (const m of toCheck) {
      const src = srcOf(m) ?? store.program(m).source;
      const ctx = { ...ctxFor(m, "edit"), resolveInclude };
      errors.push(...app.engine.check({ name: m, source: src }, ctx).errors);
    }
    for (const x of looseIncludes) {
      const wrapper = `REPORT zz_check_${x.toLowerCase().substring(0, 15)}.\nINCLUDE ${x}.`;
      const res = app.engine.check({ name: "ZZ_CHECK", source: wrapper }, { ...ctxFor(x, "edit"), resolveInclude });
      errors.push(...res.errors.filter((e) => e.obj !== "ZZ_CHECK"));
    }
    await showErrors(errors);
    if (errors.length) {
      const objs = [...new Set(errors.map((e) => e.obj || n))];
      app.status(`No se pudo activar: hay errores de sintaxis en ${objs.join(", ")}`, "E");
      return false;
    }
    const now = new Date().toISOString();
    for (const x of selected) {
      const q = store.program(x);
      q.activeSource = q.source;
      q.changed = now;
    }
    store.save();
    updateHeader();
    app.status(selected.length > 1 ? `Se activaron ${selected.length} objetos: ${selected.join(", ")}` : `Se ha activado el objeto ${n}`, "S");
    return true;
  };

  const execute = async (debugMode) => {
    const runOpts = typeof debugMode === "string" ? { debug: debugMode } : {};
    if (mode === "change") save(true);
    if (isInc()) {
      const mains = store.mainProgramsOf(n);
      if (!mains.length) return app.status(`Los includes no se pueden ejecutar. Inclúyalo en un programa con INCLUDE ${n}.`, "E");
      const r = await dialog({ title: "Include", icon: "question", body: `Un include no se puede ejecutar solo. ¿Ejecutar el programa principal ${mains[0]}?`, buttons: [{ label: "Ejecutar " + mains[0], value: true, primary: true }, { label: "Cancelar", value: false }] });
      if (!r) return;
      const ip = prog();
      if (ip.activeSource !== ip.source && !(await activate())) return;
      return runOrMain(app, mains[0], { ...runOpts, onSyntax: (errors) => showErrors(errors) });
    }
    const p = prog();
    const incs = [...collectIncludes(p.source, (x) => (store.isInclude(x) ? store.program(x).source : null))];
    const inactiveIncs = incs.filter((x) => store.program(x).activeSource !== store.program(x).source);
    if (p.activeSource === null || p.activeSource !== editor.getValue() || inactiveIncs.length) {
      const r = await dialog({
        title: "Versión inactiva",
        icon: "question",
        body:
          p.activeSource === null
            ? `El programa ${n} todavía no está activo. ¿Activarlo y ejecutarlo?`
            : inactiveIncs.length && p.activeSource === editor.getValue()
              ? `Hay includes con cambios sin activar (${inactiveIncs.join(", ")}). ¿Activar y ejecutar?`
              : `El programa ${n} tiene cambios sin activar. Se ejecuta siempre la versión ACTIVA. ¿Activar y ejecutar?`,
        buttons: [
          { label: "Activar y ejecutar", value: "act", primary: true },
          p.activeSource !== null ? { label: "Ejecutar versión activa", value: "old" } : null,
          { label: "Cancelar", value: false },
        ].filter(Boolean),
      });
      if (!r) return;
      if (r === "act" && !(await activate())) return;
    }
    await app.busy(`Generando programa ${n}...`, async () => {}, 300);
    runProgram(app, n, {
      ...runOpts,
      onSyntax: (errors) => showErrors(errors),
    });
  };

  // programa que se analiza: un include se analiza dentro de su programa principal
  const qualityTarget = () => {
    if (!isInc()) return { name: n, source: editor.getValue() };
    const mains = store.mainProgramsOf(n);
    if (!mains.length) return null;
    const mp = store.program(mains[0]);
    return { name: mp.name, source: mp.source };
  };
  const goFromResult = (obj, line) => {
    if (obj === n) {
      opts.gotoLine = line;
      app.back();
    } else {
      app.back();
      openObject(obj, line);
    }
  };
  const runAtc = async (inner) => {
    if (inner !== true) return app.busy(`ATC: comprobando la calidad de ${n}...`, () => runAtc(true), 500);
    save(true);
    const t = qualityTarget();
    if (!t) return app.status("Incluya primero este include en un programa", "W");
    const chk = app.engine.check(t, ctxFor(t.name, "edit"));
    if (chk.errors.length) {
      await showErrors(chk.errors);
      return app.status("Corrija primero los errores de sintaxis", "E");
    }
    const findings = app.engine.atc(t, ctxFor(t.name, "edit"));
    const { atcScreen, recordQuality } = await import("./quality.js");
    recordQuality("atc", t.name, { p1: findings.filter((f) => f.prio === 1).length, p2: findings.filter((f) => f.prio === 2).length, p3: findings.filter((f) => f.prio === 3).length });
    app.status(findings.length ? `ATC: ${findings.length} mensaje(s) para ${t.name}` : `ATC: sin mensajes para ${t.name}`, findings.some((f) => f.prio === 1) ? "E" : findings.length ? "W" : "S");
    app.push(atcScreen(app, t.name, findings, (obj, line) => goFromResult(obj, line)));
  };
  const runUnit = async (inner) => {
    if (inner !== true) return app.busy(`ABAP Unit: ejecutando las pruebas de ${n}...`, () => runUnit(true), 500);
    save(true);
    const t = qualityTarget();
    if (!t) return app.status("Incluya primero este include en un programa", "W");
    const ctx = { ...ctxFor(t.name, "edit"), unit: true };
    const ui = { status: () => {}, popup: async () => {}, alv: async () => {}, selectionScreen: async (m, v) => v, confirm: async () => "1", fileRead: async () => null };
    const res = await app.engine.run(t, ctx, ui);
    if (res.status === "syntax") {
      await showErrors(res.errors);
      return app.status("Corrija primero los errores de sintaxis", "E");
    }
    if (res.status !== "unit") return app.status("No se pudieron ejecutar las pruebas: " + (res.dump?.text || res.text || res.status), "E");
    const all = res.unit.flatMap((c) => c.methods);
    const bad = all.filter((m) => m.status !== "ok").length;
    const { unitScreen, recordQuality } = await import("./quality.js");
    recordQuality("unit", t.name, { total: all.length, failed: bad });
    if (!all.length) app.status("No hay clases de prueba (FOR TESTING) en el programa", "W");
    else app.status(bad ? `ABAP Unit: ${bad} de ${all.length} prueba(s) fallaron` : `ABAP Unit: ${all.length} prueba(s) correctas`, bad ? "E" : "S");
    app.push(unitScreen(app, t.name, res.unit, (obj, line) => goFromResult(obj, line)));
  };

  const navigateInclude = async (inc) => {
    const ip = store.program(inc);
    if (ip) {
      if (ip.type !== "I") return app.status(`${inc} no es un include`, "W");
      return openObject(inc, 1);
    }
    const err = validProgName(inc);
    if (err) return app.status(err, "E");
    const ok = await confirm(`El include ${inc} no existe. ¿Desea crearlo?`, "Crear include", "Crear", "Cancelar");
    if (!ok) return;
    store.createProgram(inc, `Include de ${n}`, "I");
    app.status(`Include ${inc} creado`, "S");
    openObject(inc, 1);
  };

  const pretty = async (inner) => {
    if (mode !== "change") return app.status("Cambie a modo modificar (Ctrl+F1)", "W");
    if (inner !== true) return app.busy("Pretty Printer: formateando el código...", () => pretty(true));
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
    title: () => `ABAP Editor: ${mode === "change" ? "Modificar" : "Visualizar"} ${kind()} ${n}`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: toggleMode },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: doCheck },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate },
      { icon: "exec", label: "Ejecutar", key: "F8", action: () => execute(), primary: true },
      { icon: "debug", label: "Depurar", tip: "Ejecutar en el depurador, deteniéndose en la primera instrucción", action: () => execute("step") },
      "-",
      { icon: "pretty", label: "Pretty Printer", key: "Shift+F1", action: pretty, disabled: mode !== "change" },
      { icon: "search", label: "ATC", tip: "ABAP Test Cockpit: revisión de calidad del código", action: runAtc },
      { icon: "unit", label: "Prueba unitaria", tip: "Ejecutar las pruebas ABAP Unit (Ctrl+Shift+F10)", key: "Ctrl+Shift+F10", action: runUnit },
      { icon: "text", label: "Elementos de texto", action: () => { const target = isInc() ? store.mainProgramsOf(n)[0] : n; if (!target) return app.status("Los elementos de texto pertenecen al programa principal: incluya primero este include en un programa", "W"); app.push(textElementsScreen(app, target, mode)); } },
    ],
    keys: { "Ctrl+S": () => saveBusy() },
    render(el) {
      headerEl = h("div", { class: "editor-head" });
      const host = h("div", { class: "editor-host" });
      errorsEl = h("div", { class: "err-panel" });
      el.append(headerEl, host, errorsEl);
      import("../editor.js").then(({ createEditor }) => {
        editor = createEditor(host, prog().source, mode !== "change");
        editor.onDidChangeModelContent(() => updateHeader());
        // puntos de parada: clic en el margen izquierdo (como en SE38)
        import("../editor.js").then(({ monaco }) => {
          const deco = editor.createDecorationsCollection([]);
          const paint = () => {
            const bps = store.data.breakpoints || {};
            deco.set(
              Object.keys(bps)
                .filter((k) => k.startsWith(n + ":"))
                .map((k) => Number(k.split(":")[1]))
                .map((line) => ({ range: new monaco.Range(line, 1, line, 1), options: { isWholeLine: false, glyphMarginClassName: "bp-glyph", glyphMarginHoverMessage: { value: "Punto de parada" } } })),
            );
          };
          paint();
          editor.onMouseDown((e) => {
            const T = monaco.editor.MouseTargetType;
            if (e.target.type !== T.GUTTER_GLYPH_MARGIN && e.target.type !== T.GUTTER_LINE_NUMBERS) return;
            const line = e.target.position?.lineNumber;
            if (!line) return;
            const on = toggleBreakpoint(n, line);
            paint();
            app.status(on ? `Punto de parada en la línea ${line}: al ejecutar, el programa se detendrá ahí` : `Punto de parada de la línea ${line} borrado`, "S");
          });
        });
        // navegación: doble clic sobre el nombre de un INCLUDE lo abre (o lo crea)
        editor.onMouseDown((e) => {
          if (e.event.browserEvent.detail !== 2 || !e.target.position) return;
          const pos = e.target.position;
          const text = editor.getModel().getLineContent(pos.lineNumber);
          const m = text.match(/^(\s*INCLUDE\s+)([A-Za-z0-9_/]+)/i);
          if (!m || /^(TYPE|STRUCTURE)$/i.test(m[2])) return;
          const from = m[1].length + 1;
          if (pos.column < from || pos.column > from + m[2].length) return;
          setTimeout(() => navigateInclude(m[2].toUpperCase()), 0);
        });
        // doble clic sobre el nombre de un módulo de función: abre SE37
        editor.onMouseDown((e) => {
          if (e.event.browserEvent.detail !== 2 || !e.target.position) return;
          const pos = e.target.position;
          const text = editor.getModel().getLineContent(pos.lineNumber);
          const m = text.match(/^(\s*CALL\s+FUNCTION\s+')([A-Za-z0-9_/]+)'/i);
          if (!m) return;
          if (pos.column < m[1].length + 1 || pos.column > m[1].length + 1 + m[2].length) return;
          setTimeout(async () => {
            const { openFm } = await import("./se37.js");
            const { moduleByName } = await import("../fm-repo.js");
            if (!moduleByName(m[2])) return app.status(`El módulo de función ${m[2].toUpperCase()} no existe. Créelo en SE37.`, "W");
            if (mode === "change") save(true);
            store.data.lastFm = m[2].toUpperCase();
            openFm(app, m[2].toUpperCase());
          }, 0);
        });
        if (opts.gotoLine) {
          editor.revealLineInCenter(opts.gotoLine);
          editor.setPosition({ lineNumber: opts.gotoLine, column: 1 });
          opts.gotoLine = null;
        }
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

export function ctxFor(name, mode = "active") {
  const p = store.program(name);
  const lang = store.data.settings.lang || "S";
  const other = lang === "S" ? "E" : "S";
  const texts = { ...(p?.texts?.[other] || {}), ...Object.fromEntries(Object.entries(p?.texts?.[lang] || {}).filter(([, v]) => v)) };
  const seltexts = { ...(p?.seltexts?.[other] || {}), ...Object.fromEntries(Object.entries(p?.seltexts?.[lang] || {}).filter(([, v]) => v)) };
  return {
    tables: allTablesForEngine(),
    texts,
    seltexts,
    user: store.data.settings.user,
    lang: lang === "E" ? "EN" : "ES",
    decimalNotation: store.data.settings.decimalNotation,
    ...repoContext(),
    // INCLUDE: en ejecución se usa la versión activa; al verificar, la grabada
    resolveInclude: (inc) => {
      const ip = store.program(inc);
      if (!ip) return null;
      if (ip.type !== "I") return { error: "notinclude" };
      const src = mode === "active" ? ip.activeSource : ip.source;
      if (src === null || src === undefined) return { error: "inactive" };
      return { source: src };
    },
  };
}

// F8 sobre un include: se ejecuta su programa principal
export function runOrMain(app, name, opts) {
  if (store.isInclude(name)) {
    const mains = store.mainProgramsOf(name);
    if (!mains.length) return app.status(`Los includes no se pueden ejecutar. Inclúyalo en un programa con INCLUDE ${name}.`, "E");
    app.status(`${name} es un include: se ejecuta su programa principal ${mains[0]}`, "I");
    return runProgram(app, mains[0], opts);
  }
  return runProgram(app, name, opts);
}

// código del programa con sus includes expandidos (para buscar textos, parámetros...)
export function expandedSource(name) {
  const p = store.program(name);
  if (!p) return "";
  return expandIncludes(p.source, name, (inc) => {
    const ip = store.program(inc);
    return ip && ip.type === "I" ? { source: ip.source } : null;
  }).source;
}

import { STANDARD_TABLES } from "../engine/standard.js";
import { allMsgClasses, msagXml, msgTexts } from "./se91.js";
import { allTablesForEngine, ddicExtraFiles } from "../ddic-repo.js";
import { userFugrFiles } from "../fm-repo.js";

// objetos del repositorio que todo programa puede usar (mensajes, diccionario, funciones...)
export function repoContext(fmOverride) {
  const lang = store.data.settings.lang || "S";
  const extraFiles = [];
  for (const mc of Object.values(allMsgClasses())) extraFiles.push({ filename: mc.name.toLowerCase() + ".msag.xml", contents: msagXml(mc) });
  extraFiles.push(...ddicExtraFiles());
  extraFiles.push(...userFugrFiles(fmOverride));
  for (const c of Object.values(store.data.classes || {})) {
    const src = fmOverride?.classOverride?.name === c.name ? fmOverride.classOverride.source : c.activeSource;
    if (src) extraFiles.push({ filename: c.name.toLowerCase() + ".clas.abap", contents: src });
  }
  return { extraFiles, msgTexts: msgTexts(lang) };
}

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
    const src = expandedSource(n);
    for (const m of src.matchAll(/TEXT-([A-Za-z0-9]{3})/gi)) ids.add(m[1].toUpperCase());
    for (const m of src.matchAll(/'(?:[^'\n]|'')*'\(([A-Za-z0-9]{3})\)/g)) ids.add(m[1].toUpperCase());
    return [...ids].sort();
  };
  const rowsSel = () => {
    try {
      const { meta } = preprocess(expandedSource(n), n, {});
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
