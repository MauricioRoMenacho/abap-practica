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

  const activate = async (inner) => {
    if (inner !== true) return app.busy(`Activando ${n}: verificando y generando...`, () => activate(true), 550);
    if (mode === "change") save(true);
    const ok = await doCheck(true);
    if (!ok) {
      app.status(`No se pudo activar: ${isInc() ? "el include" : "el programa"} ${n} tiene errores de sintaxis`, "E");
      return false;
    }
    const p = prog();
    p.activeSource = editor.getValue();
    p.changed = new Date().toISOString();
    // al activar un programa se activan también sus includes inactivos (lista de objetos inactivos)
    let extra = 0;
    for (const inc of collectIncludes(p.source, (x) => (store.isInclude(x) ? store.program(x).source : null))) {
      const ip = store.program(inc);
      if (ip.activeSource !== ip.source) {
        ip.activeSource = ip.source;
        extra++;
      }
    }
    store.save();
    updateHeader();
    app.status(extra ? `Se activaron ${extra + 1} objetos: ${n} y ${extra} include(s)` : `Se ha activado el objeto ${n}`, "S");
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
