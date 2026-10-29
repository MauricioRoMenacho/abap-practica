// ZUI5 - Entorno de desarrollo SAPUI5 (al estilo de SAP Business Application Studio):
// árbol de archivos, editor, vista previa en vivo y consola.
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { TEMPLATES, createProject, languageOf, appId } from "../ui5/templates.js";
import { publishProject, previewUrl, cdnUrl } from "../ui5/vfs.js";

export const ui5Projects = () => (store.data.ui5Projects ||= {});
const validName = (n) => /^z[a-z0-9]{2,29}$/.test(n);

// ---------------------------------------------------------------- validación de archivos
export function validateFile(path, content) {
  const errs = [];
  if (path.endsWith(".json")) {
    try {
      JSON.parse(content);
    } catch (e) {
      const m = e.message.match(/position (\d+)/);
      let row = 1;
      let col = 1;
      if (m) {
        const pre = content.slice(0, Number(m[1]));
        row = pre.split("\n").length;
        col = pre.length - pre.lastIndexOf("\n");
      }
      const lm = e.message.match(/line (\d+) column (\d+)/);
      if (lm) {
        row = Number(lm[1]);
        col = Number(lm[2]);
      }
      errs.push({ row, col, message: "JSON no válido: " + e.message.replace(/^JSON\.parse: /, "") + " (revise comas, comillas dobles y llaves)" });
    }
  } else if (path.endsWith(".xml") || path.endsWith(".html")) {
    if (path.endsWith(".xml")) {
      const doc = new DOMParser().parseFromString(content, "application/xml");
      const pe = doc.getElementsByTagName("parsererror")[0];
      if (pe) {
        const t = pe.textContent || "";
        const lm = t.match(/line (\d+) at column (\d+)/i) || t.match(/(\d+):(\d+)/);
        errs.push({ row: lm ? Number(lm[1]) : 1, col: lm ? Number(lm[2]) : 1, message: "XML no válido: " + t.split("\n").find((x) => x.trim() && !/^This page contains/.test(x))?.trim() + " (revise que cada etiqueta se cierre y que los atributos tengan comillas)" });
      }
    }
  } else if (path.endsWith(".js")) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(content);
    } catch (e) {
      errs.push({ row: 1, col: 1, message: "Error de sintaxis JavaScript: " + e.message });
    }
  }
  return errs;
}

// ---------------------------------------------------------------- pantalla inicial
export function zui5Screen(app) {
  let el0;
  const render = () => {
    const list = Object.values(ui5Projects()).sort((a, b) => (b.changed || b.created).localeCompare(a.changed || a.created));
    el0.replaceChildren(
      h(
        "div",
        { class: "panel wide" },
        h("div", { class: "row" }, h("b", {}, "Proyectos SAPUI5"), h("span", { class: "muted small" }, " - entorno de desarrollo al estilo de SAP Business Application Studio")),
        list.length
          ? h(
              "table",
              { class: "grid-table" },
              h("thead", {}, h("tr", {}, ["Proyecto", "Id de la aplicación", "Título", "Plantilla", "Modificado", ""].map((x) => h("th", {}, x)))),
              h(
                "tbody",
                {},
                list.map((p) =>
                  h(
                    "tr",
                    { class: "clickable", ondblclick: () => app.push(ideScreen(app, p.name)) },
                    h("td", { class: "mono" }, h("a", { href: "#", onclick: (e) => { e.preventDefault(); app.push(ideScreen(app, p.name)); } }, p.name)),
                    h("td", { class: "mono" }, appId(p.name)),
                    h("td", {}, p.title),
                    h("td", {}, TEMPLATES.find((t) => t.id === p.template)?.title || p.template),
                    h("td", { class: "muted small" }, new Date(p.changed || p.created).toLocaleString("es-PE")),
                    h("td", {}, h("button", { class: "btn small", title: "Borrar proyecto", onclick: async () => { if (!(await confirm(`¿Borrar el proyecto ${p.name} y todos sus archivos?`, "Borrar", "Borrar", "Cancelar"))) return; delete ui5Projects()[p.name]; store.save(); render(); } }, h("span", { class: "ico ico-delete" }))),
                  ),
                ),
              ),
            )
          : h("p", { class: "muted" }, "Todavía no tienes proyectos. Crea uno con el botón Nuevo proyecto (o sigue la guía UI5 Paso 1)."),
        h("div", { class: "row buttons" }, h("button", { class: "btn btn-primary", onclick: () => newProject(app) }, h("span", { class: "ico ico-create" }), "Nuevo proyecto")),
        h("p", { class: "hint" }, `La vista previa usa SAPUI5 real desde el CDN de SAP (${cdnUrl()}). Necesitas conexión a internet. Tus proyectos se guardan en este navegador.`),
      ),
    );
  };
  return {
    id: "ZUI5",
    tcode: "ZUI5",
    title: "SAPUI5: proyectos (Business Application Studio)",
    toolbar: () => [{ icon: "create", label: "Nuevo proyecto", text: true, action: () => newProject(app) }],
    render(el) {
      el0 = el;
      render();
    },
    resumed() {
      if (el0) render();
    },
  };
}

export async function newProject(app, preset = {}) {
  const nameI = input({ value: preset.name || "", placeholder: "ej.: zvuelos", class: "sap-input mono", oninput: (e) => (e.target.value = e.target.value.toLowerCase()) });
  const titleI = input({ value: preset.title || "", placeholder: "ej.: Vuelos disponibles" });
  const tplSel = h("select", { class: "sap-input" }, TEMPLATES.map((t) => h("option", { value: t.id, selected: t.id === (preset.template || "basic") }, t.title)));
  const tplText = h("p", { class: "hint" }, TEMPLATES.find((t) => t.id === (preset.template || "basic")).text);
  tplSel.onchange = () => (tplText.textContent = TEMPLATES.find((t) => t.id === tplSel.value).text);
  const r = await dialog({
    title: "Nuevo proyecto SAPUI5 (generador de plantillas)",
    width: "560px",
    body: h("div", {}, field("Plantilla", tplSel), tplText, field("Nombre del módulo", nameI, { required: true }), h("p", { class: "muted small" }, `Solo minúsculas y números, empezando por z. El id de la aplicación será ${"zui5.<nombre>"} (namespace + nombre).`), field("Título de la aplicación", titleI, { required: true })),
    buttons: [{ label: "Finalizar", primary: true, value: () => ({ name: nameI.value.trim(), title: titleI.value.trim(), template: tplSel.value }) }, { label: "Cancelar", value: null }],
  });
  if (!r) return;
  if (!validName(r.name)) return app.status("Nombre no válido: minúsculas y números, empezando por z (3 a 30 caracteres)", "E");
  if (ui5Projects()[r.name]) return app.status(`El proyecto ${r.name} ya existe`, "E");
  if (!r.title) return app.status("Indique un título", "E");
  await app.busy("Generando el proyecto a partir de la plantilla...", async () => {
    ui5Projects()[r.name] = { name: r.name, title: r.title, template: r.template, files: createProject(r.template, r.name, r.title, app.engine), created: new Date().toISOString() };
    store.data.lastUi5 = r.name;
    store.save();
  }, 500);
  app.status(`Proyecto ${r.name} generado`, "S");
  app.push(ideScreen(app, r.name));
}

// ---------------------------------------------------------------- IDE

export function ideScreen(app, name) {
  const proj = () => ui5Projects()[name];
  let current = store.data.ui5Open?.[name] || "webapp/view/Main.view.xml";
  let editor = null;
  let treeEl, edHost, tabEl, frame, consoleEl, statusEl, consoleCount;
  let consoleLines = [];
  let collapsed = new Set(["webapp/localService/mockdata/"]);
  const dirtySet = new Set();

  const fileTree = () => {
    // árbol de carpetas: primero las carpetas y después los archivos (como en BAS)
    const root = { dirs: {}, files: [] };
    for (const f of Object.keys(proj().files)) {
      const parts = f.split("/");
      let node = root;
      for (const d of parts.slice(0, -1)) node = node.dirs[d] ||= { dirs: {}, files: [] };
      node.files.push(f);
    }
    const rows = [h("div", { class: "ft-proj" }, h("span", { class: "ico ico-folder" }), name)];
    const walk = (node, prefix, depth) => {
      for (const d of Object.keys(node.dirs).sort()) {
        const key = prefix + d + "/";
        const open = !collapsed.has(key);
        rows.push(h("div", { class: "ft-dir", style: { paddingLeft: depth * 12 + 6 + "px" }, onclick: () => { open ? collapsed.add(key) : collapsed.delete(key); renderTree(); } }, h("span", { class: "ft-caret" }, open ? "v" : ">"), d));
        if (open) walk(node.dirs[d], key, depth + 1);
      }
      for (const f of node.files.sort()) {
        rows.push(
          h(
            "div",
            { class: "ft-file" + (f === current ? " active" : ""), style: { paddingLeft: depth * 12 + 18 + "px" }, title: f, onclick: () => openFile(f) },
            h("span", { class: "ft-ext ext-" + f.split(".").pop() }, f.split(".").pop().slice(0, 4)),
            f.split("/").pop(),
            dirtySet.has(f) ? h("span", { class: "ft-dirty" }, "*") : null,
          ),
        );
      }
    };
    walk(root, "", 0);
    return rows;
  };
  const renderTree = () => treeEl && treeEl.replaceChildren(...fileTree());

  const openFile = async (f) => {
    if (!proj().files[f] && proj().files[f] !== "") return;
    if (editor) syncFromEditor();
    current = f;
    (store.data.ui5Open ||= {})[name] = f;
    renderTree();
    tabEl.replaceChildren(h("span", { class: "mono" }, f), h("span", { class: "muted small" }, " " + languageOf(f).toUpperCase()));
    const { codeModel, createCodeEditor } = await import("../editor.js");
    const model = codeModel(`ui5:${name}:${f}`, proj().files[f], languageOf(f));
    if (!editor) {
      editor = createCodeEditor(edHost, model, false);
      editor.onDidChangeModelContent(() => {
        if (editor.getValue() !== proj().files[current]) dirtySet.add(current);
        else dirtySet.delete(current);
        renderTree();
      });
    } else editor.setModel(model);
    editor.focus();
  };
  const syncFromEditor = () => {
    if (!editor || !current) return;
    const v = editor.getValue();
    if (proj().files[current] !== v) {
      proj().files[current] = v;
    }
  };

  const saveAll = (silent) => {
    syncFromEditor();
    const p = proj();
    p.changed = new Date().toISOString();
    store.save();
    dirtySet.clear();
    renderTree();
    if (!silent) app.status(`Proyecto ${name} grabado`, "S");
  };

  const checkAll = async () => {
    const { setCodeMarkers, codeModel } = await import("../editor.js");
    const problems = [];
    for (const [f, c] of Object.entries(proj().files)) {
      const errs = validateFile(f, c);
      const m = codeModel(`ui5:${name}:${f}`, c, languageOf(f));
      setCodeMarkers(m, errs);
      for (const e of errs) problems.push({ file: f, ...e });
    }
    return problems;
  };

  const log = (type, text) => {
    consoleLines.push({ type, text, at: new Date() });
    if (consoleLines.length > 400) consoleLines.splice(0, consoleLines.length - 400);
    renderConsole();
  };
  const renderConsole = () => {
    if (!consoleEl) return;
    const errs = consoleLines.filter((l) => l.type === "error").length;
    consoleCount.textContent = errs ? `${errs} error(es)` : "";
    consoleEl.replaceChildren(
      ...consoleLines.slice(-200).map((l) =>
        h(
          "div",
          { class: "con-line con-" + l.type, onclick: l.file ? () => openFile(l.file).then(() => { editor?.revealLineInCenter(l.row); editor?.setPosition({ lineNumber: l.row, column: l.col || 1 }); }) : undefined },
          h("span", { class: "con-time" }, l.at.toLocaleTimeString("es-PE", { hour12: false })),
          h("span", { class: "con-type" }, l.type === "error" ? "ERROR" : l.type === "warn" ? "AVISO" : "INFO"),
          l.text,
        ),
      ),
    );
    consoleEl.scrollTop = consoleEl.scrollHeight;
  };

  const onMessage = (ev) => {
    if (!frame || ev.source !== frame.contentWindow || !ev.data?.__ui5console) return;
    const t = String(ev.data.text || "");
    if (ev.data.type === "log" || ev.data.type === "info") {
      if (!/^\s*$/.test(t) && !/(Device API logging|sap-ui-core|Theming|Rendering|^\d{4}-\d{2}-\d{2} )/.test(t)) log("info", t);
      return;
    }
    // filtrar avisos internos de UI5 que no aportan
    if (/Component-preload\.js|Device API logging|sap\.ui\.thirdparty|DEPRECATED|deprecated|sync XMLHttpRequest|was not found in|-preload|ResourceBundle.*not found|could not find any translatable text/i.test(t)) return;
    log(ev.data.type === "error" ? "error" : "warn", t);
  };
  window.addEventListener("message", onMessage);

  // resumen de lo que se ve en la vista previa (para las comprobaciones de la guía)
  const inspect = () => {
    try {
      const w = frame.contentWindow;
      const Element = w.sap?.ui?.require?.("sap/ui/core/Element");
      if (!Element?.registry) return null;
      const controls = {};
      const texts = [];
      const props = [];
      for (const c of Element.registry.all ? Element.registry.all() : []) {
        const t = c.getMetadata().getName();
        controls[t] = (controls[t] || 0) + 1;
        for (const g of ["getText", "getTitle", "getValue", "getDescription", "getNumber", "getHeaderText", "getInfo", "getLabel"]) {
          if (typeof c[g] === "function") {
            try {
              const v = c[g]();
              if (typeof v === "string" && v) texts.push(v);
            } catch {
              /* ignorar */
            }
          }
        }
        if (t === "sap.m.Input" || t === "sap.m.Text" || t === "sap.m.Title") props.push({ t, bound: !!c.getBindingInfo?.(t === "sap.m.Input" ? "value" : "text") });
      }
      const models = {};
      for (const c of Element.registry.all ? Element.registry.all() : []) {
        const oModels = c.oModels || {};
        for (const [k, m] of Object.entries(oModels)) models[k || "(default)"] = m.getMetadata().getName();
      }
      const comp = w.sap.ui.require("sap/ui/core/Component");
      const comps = comp?.registry?.all ? comp.registry.all() : [];
      for (const cc of comps) for (const [k, m] of Object.entries(cc.oModels || {})) models[k || "(default)"] = m.getMetadata().getName();
      const hash = w.location.hash;
      return { controls, texts: texts.slice(0, 500), bound: props.filter((x) => x.bound).length, models, hash };
    } catch (e) {
      return { error: e.message };
    }
  };
  const record = () => {
    const s = inspect();
    if (!s) return;
    const errors = consoleLines.filter((l) => l.type === "error").length;
    ((store.data.ui5Runs ||= {})[name] = { at: new Date().toISOString(), errors, ...s });
    store.save();
    app.guide?.refresh?.();
  };
  let recordTimer = null;

  const run = async () => {
    saveAll(true);
    const problems = await checkAll();
    consoleLines = [];
    if (problems.length) {
      for (const p of problems) consoleLines.push({ type: "error", text: `${p.file} línea ${p.row}: ${p.message}`, at: new Date(), file: p.file, row: p.row, col: p.col });
      renderConsole();
      statusEl.textContent = "No se pudo iniciar: corrija los errores";
      app.status(`Hay ${problems.length} error(es) en los archivos: revise la consola`, "E");
      return;
    }
    renderConsole();
    statusEl.textContent = "Iniciando servidor de desarrollo...";
    try {
      await publishProject(name, proj().files);
    } catch (e) {
      statusEl.textContent = "";
      return app.status(e.message, "E");
    }
    log("info", `> npm start  (ui5 serve) - http://localhost:8080/index.html  - SAPUI5 desde ${cdnUrl()}`);
    statusEl.textContent = "Cargando la aplicación...";
    frame.src = previewUrl(name) + "?t=" + Date.now();
    frame.onload = () => {
      statusEl.textContent = "Aplicación en ejecución";
      clearTimeout(recordTimer);
      recordTimer = setTimeout(record, 2500);
      setTimeout(record, 6000);
    };
  };

  const newFile = async () => {
    const pathI = input({ class: "sap-input mono", value: "webapp/view/", placeholder: "webapp/view/Detalle.view.xml" });
    const r = await dialog({ title: "Nuevo archivo", body: h("div", {}, field("Ruta del archivo", pathI, { required: true }), h("p", { class: "hint" }, "Ejemplos: webapp/view/Detalle.view.xml, webapp/controller/Detalle.controller.js, webapp/model/formatter.js, webapp/view/fragment/Ayuda.fragment.xml")), buttons: [{ label: "Crear", primary: true, value: () => pathI.value.trim() }, { label: "Cancelar", value: null }] });
    if (!r) return;
    if (!/^[\w\-./]+\.[a-z]+$/i.test(r) || r.includes("..")) return app.status("Ruta no válida", "E");
    if (proj().files[r] !== undefined) return app.status("El archivo ya existe", "E");
    const id = appId(name);
    const base = r.split("/").pop().replace(/\.(view|controller|fragment)?\.?(xml|js)$/, "");
    let content = "";
    if (r.endsWith(".view.xml")) content = `<mvc:View controllerName="${id}.controller.${base}"\n    xmlns:mvc="sap.ui.core.mvc"\n    xmlns="sap.m">\n    <Page id="page${base}" title="${base}">\n        <content>\n        </content>\n    </Page>\n</mvc:View>\n`;
    else if (r.endsWith(".controller.js")) content = `sap.ui.define([\n    "sap/ui/core/mvc/Controller"\n], (Controller) => {\n    "use strict";\n\n    return Controller.extend("${id}.controller.${base}", {\n        onInit() {\n        }\n    });\n});\n`;
    else if (r.endsWith(".fragment.xml")) content = `<core:FragmentDefinition\n    xmlns="sap.m"\n    xmlns:core="sap.ui.core">\n</core:FragmentDefinition>\n`;
    else if (r.endsWith(".js")) content = `sap.ui.define([], () => {\n    "use strict";\n\n    return {\n    };\n});\n`;
    else if (r.endsWith(".json")) content = "{\n}\n";
    proj().files[r] = content;
    collapsed.delete(r.slice(0, r.lastIndexOf("/") + 1));
    store.save();
    openFile(r);
    app.status(`Archivo ${r} creado`, "S");
  };
  const deleteFile = async () => {
    if (!current) return;
    if (["webapp/index.html", "webapp/manifest.json", "webapp/Component.js"].includes(current)) return app.status("Este archivo es obligatorio en una aplicación SAPUI5", "W");
    if (!(await confirm(`¿Borrar el archivo ${current}?`, "Borrar archivo", "Borrar", "Cancelar"))) return;
    delete proj().files[current];
    const { disposeModels } = await import("../editor.js");
    disposeModels(`ui5:${name}:${current}`);
    current = "webapp/view/Main.view.xml";
    store.save();
    openFile(proj().files[current] !== undefined ? current : Object.keys(proj().files)[0]);
  };

  return {
    id: "ZUI5-IDE",
    tcode: "ZUI5",
    cls: "editor-screen ui5-screen",
    title: () => `SAPUI5: ${name} - ${proj()?.title || ""}`,
    toolbar: () => [
      { icon: "save", label: "Grabar todo", key: "Ctrl+S", action: () => saveAll() },
      { icon: "exec", label: "Ejecutar (npm start)", key: "F8", action: run },
      "-",
      { icon: "create", label: "Nuevo archivo", text: true, action: newFile },
      { icon: "delete", label: "Borrar archivo", action: deleteFile },
      "-",
      { icon: "expand", label: "Abrir en pestaña nueva", text: true, action: async () => { saveAll(true); await publishProject(name, proj().files); window.open(previewUrl(name), "_blank"); } },
    ],
    keys: { "Ctrl+S": () => saveAll(), F8: run },
    render(el) {
      treeEl = h("div", { class: "ui5-tree" });
      tabEl = h("div", { class: "ui5-tab" });
      edHost = h("div", { class: "ui5-editor" });
      frame = h("iframe", { class: "ui5-frame", title: "Vista previa" });
      statusEl = h("span", { class: "muted small" }, "Pulse Ejecutar (F8) para ver la aplicación");
      consoleEl = h("div", { class: "ui5-console" });
      consoleCount = h("span", { class: "con-count" });
      el.append(
        h(
          "div",
          { class: "ui5-layout" },
          h("div", { class: "ui5-side" }, h("div", { class: "ui5-side-head" }, "EXPLORADOR"), treeEl),
          h("div", { class: "ui5-main" }, tabEl, edHost),
          h(
            "div",
            { class: "ui5-preview" },
            h("div", { class: "ui5-prev-head" }, h("b", {}, "Vista previa"), statusEl, h("button", { class: "btn small", title: "Volver a cargar (F8)", onclick: run }, h("span", { class: "ico ico-refresh" }))),
            frame,
            h("div", { class: "ui5-con-head" }, h("b", {}, "Consola"), consoleCount, h("button", { class: "btn small", onclick: () => { consoleLines = []; renderConsole(); } }, "Limpiar")),
            consoleEl,
          ),
        ),
      );
      renderTree();
      if (proj().files[current] === undefined) current = Object.keys(proj().files).find((f) => f.endsWith(".view.xml")) || Object.keys(proj().files)[0];
      openFile(current);
      store.data.lastUi5 = name;
    },
    hidden() {
      syncFromEditor();
      store.save();
    },
    async canLeave() {
      saveAll(true);
      return true;
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      editor?.dispose();
      editor = null;
    },
  };
}
