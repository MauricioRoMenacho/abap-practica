// SE11 - Diccionario ABAP: tablas transparentes.
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { DDIC_TYPES, validateTable, fieldLength } from "../engine/ddic.js";
import { STANDARD_TABLES } from "../engine/standard.js";

export function findTable(name) {
  const n = name.toUpperCase();
  if (STANDARD_TABLES[n]) return { def: STANDARD_TABLES[n], standard: true };
  const t = store.table(n);
  if (t) return { def: t, standard: false };
  return null;
}

async function pickTable() {
  const all = [...Object.values(STANDARD_TABLES), ...store.tables()];
  let chosen = null;
  const list = h(
    "div",
    { class: "f4-list" },
    all.map((t) =>
      h(
        "button",
        {
          class: "f4-row",
          onclick: (e) => {
            chosen = t.name;
            e.currentTarget.closest(".dlg-overlay").querySelector(".btn-primary").click();
          },
        },
        h("b", {}, t.name),
        h("span", {}, t.description + (t.standard ? " (estándar)" : t.active ? "" : " (inactiva)")),
      ),
    ),
  );
  const r = await dialog({ title: "Tablas (F4)", body: list, width: "520px", buttons: [{ label: "Cancelar", value: false }, { label: "", value: true, primary: true }], onOpen: (o) => (o.querySelector(".btn-primary").style.display = "none") });
  return r ? chosen : null;
}

export function se11Screen(app) {
  let nameInput;
  const name = () => nameInput.value.trim().toUpperCase();
  const open = (mode) => {
    const n = name();
    if (!n) return app.status("Indique un nombre de tabla", "E");
    const f = findTable(n);
    if (!f) return app.status(`La tabla ${n} no existe`, "E");
    store.data.lastTable = n;
    store.save();
    if (f.standard && mode === "change") app.status("Las tablas estándar no se pueden modificar (solo visualizar)", "W");
    app.push(tableScreen(app, n, f.standard ? "show" : mode));
  };
  const create = () => {
    const n = name();
    if (!n) return app.status("Indique un nombre de tabla", "E");
    if (!/^[YZ]/.test(n)) return app.status("Inicie el nombre con Y o Z (espacio de nombres del cliente)", "E");
    if (!/^[YZ][A-Z0-9_]{1,15}$/.test(n)) return app.status("Nombre no válido: máximo 16 caracteres (letras, números, _)", "E");
    if (findTable(n)) return app.status(`La tabla ${n} ya existe`, "E");
    store.data.tables[n] = {
      name: n,
      description: "",
      deliveryClass: "A",
      fields: [{ name: "MANDT", key: true, type: "CLNT", length: 3, decimals: 0, description: "Mandante" }],
      active: null,
      created: new Date().toISOString(),
    };
    store.data.lastTable = n;
    store.save();
    app.push(tableScreen(app, n, "change", true));
  };
  const del = async () => {
    const n = name();
    const f = findTable(n);
    if (!f) return app.status(`La tabla ${n} no existe`, "E");
    if (f.standard) return app.status("Las tablas estándar no se pueden borrar", "E");
    if (!(await confirm(`¿Borrar la tabla ${n} y TODOS sus datos?`, "Borrar tabla", "Borrar", "Cancelar"))) return;
    delete store.data.tables[n];
    store.save();
    await app.engine.syncSchema(store.activeTables());
    app.status(`Tabla ${n} borrada`, "S");
  };
  return {
    id: "SE11",
    tcode: "SE11",
    title: "Diccionario ABAP: Acceso",
    toolbar: () => [{ icon: "delete", tip: "Borrar", action: del }],
    keys: { F7: () => open("show"), F6: () => open("change"), F5: create },
    onEnter: () => open("show"),
    render(el) {
      nameInput = input({ maxlength: 16, value: store.data.lastTable || "", class: "sap-input upper w-20", autofocus: true, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
      nameInput.addEventListener("keydown", async (e) => {
        if (e.key === "F4") {
          e.preventDefault();
          const p = await pickTable();
          if (p) nameInput.value = p;
        }
      });
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          h(
            "div",
            { class: "radio-list" },
            h("label", { class: "radio" }, h("input", { type: "radio", name: "obj", checked: true }), h("span", { class: "radio-l" }, "Tabla base datos"), nameInput, h("button", { class: "btn f4", title: "F4", onclick: async () => { const p = await pickTable(); if (p) nameInput.value = p; } }, "F4")),
            h("label", { class: "radio disabled" }, h("input", { type: "radio", name: "obj", disabled: true }), h("span", { class: "radio-l" }, "Vista"), h("span", { class: "muted small" }, "próximamente")),
            h("label", { class: "radio disabled" }, h("input", { type: "radio", name: "obj", disabled: true }), h("span", { class: "radio-l" }, "Tipo de datos"), h("span", { class: "muted small" }, "próximamente")),
            h("label", { class: "radio disabled" }, h("input", { type: "radio", name: "obj", disabled: true }), h("span", { class: "radio-l" }, "Dominio"), h("span", { class: "muted small" }, "próximamente")),
          ),
          h(
            "div",
            { class: "row buttons" },
            h("button", { class: "btn", onclick: () => open("show"), title: "F7" }, h("span", { class: "ico ico-display" }), "Visualizar"),
            h("button", { class: "btn", onclick: () => open("change"), title: "F6" }, h("span", { class: "ico ico-change" }), "Modificar"),
            h("button", { class: "btn btn-primary", onclick: create, title: "F5" }, h("span", { class: "ico ico-create" }), "Crear"),
          ),
          h("p", { class: "hint" }, "Tablas estándar para practicar (pulsa F4 para verlas todas): vuelos SCARR, SPFLI, SFLIGHT, SBOOK, SCUSTOM; finanzas T001, T005, TCURC; ventas KNA1, VBAK, VBAP; compras LFA1, EKKO, EKPO; materiales MARA, MAKT; personal PA0001, PA0002, PA0008."),
        ),
      );
    },
  };
}

function tableScreen(app, n, initialMode, isNew) {
  let mode = initialMode;
  let tab = "fields";
  let body;
  let headEl;
  const found = findTable(n);
  const standard = found.standard;
  // copia de trabajo
  let work = JSON.parse(JSON.stringify(found.def));
  let dirty = !!isNew;
  const status = () => {
    if (standard) return ["Activo", "badge-ok"];
    const t = store.table(n);
    if (!t.active) return ["Nuevo", "badge-warn"];
    const same = JSON.stringify(stripTable(t.active)) === JSON.stringify(stripTable(work));
    return same && !dirty ? ["Activo", "badge-ok"] : ["Revisado (inactivo)", "badge-warn"];
  };
  const markDirty = () => {
    dirty = true;
    renderHead();
  };
  const readForm = () => {
    if (mode !== "change") return;
    const d = body.querySelector(".t-desc");
    if (d) work.description = d.value;
    const dc = body.querySelector(".t-dc");
    if (dc) work.deliveryClass = dc.value;
  };
  const save = (silent) => {
    if (standard || mode !== "change") return;
    readForm();
    const t = store.table(n);
    t.description = work.description;
    t.deliveryClass = work.deliveryClass;
    t.fields = work.fields.map((f) => ({ ...f, name: (f.name || "").toUpperCase() }));
    store.save();
    dirty = false;
    renderHead();
    if (!silent) app.status(`Tabla ${n} grabada (inactiva)`, "S");
  };
  const check = () => {
    readForm();
    const errors = validateTable({ ...work, name: n });
    if (errors.length) {
      dialog({ title: "Verificación de la tabla", icon: "error", width: "560px", body: h("ul", { class: "err-list" }, errors.map((e) => h("li", {}, e))) });
      app.status(`La tabla ${n} tiene errores`, "E");
      return false;
    }
    app.status(`La tabla ${n} es correcta`, "S");
    return true;
  };
  const activate = async (inner) => {
    if (standard) return app.status("La tabla ya está activa", "S");
    if (inner !== true) return app.busy(`Activando tabla ${n}: ajustando la base de datos...`, () => activate(true), 550);
    if (mode === "change") save(true);
    if (!check()) return;
    const t = store.table(n);
    t.active = stripTable({ ...t, name: n });
    store.save();
    try {
      await app.engine.syncSchema(store.activeTables());
      app.status(`Se ha activado la tabla ${n} (base de datos ajustada)`, "S");
    } catch (e) {
      console.error(e);
      app.status("Error al crear la tabla en la base de datos: " + e.message, "E");
    }
    renderHead();
  };
  const toggle = () => {
    if (standard) return app.status("Las tablas estándar solo se pueden visualizar", "W");
    if (mode === "change") save(true);
    mode = mode === "change" ? "show" : "change";
    app.refreshChrome();
    render();
  };
  const content = async () => {
    if (!standard && !store.table(n).active) return app.status(`Active primero la tabla ${n} (Ctrl+F3)`, "E");
    const { se16DataScreen } = await import("./se16.js");
    app.push(se16DataScreen(app, n));
  };

  const renderHead = () => {
    const [st, cls] = status();
    headEl.replaceChildren(h("span", { class: "eh-label" }, "Tabla transp."), h("b", {}, n), h("span", { class: "badge " + cls }, st), standard ? h("span", { class: "badge" }, "Estándar - solo lectura") : null);
  };

  const render = () => {
    const ro = mode !== "change";
    const desc = h("input", { class: "sap-input t-desc", value: work.description || "", maxlength: 60, readonly: ro, oninput: (e) => { work.description = e.target.value; markDirty(); }, style: { width: "46ch" } });
    const tabs = h(
      "div",
      { class: "tabs" },
      h("button", { class: "tab" + (tab === "attr" ? " active" : ""), onclick: () => { readForm(); tab = "attr"; render(); } }, "Atributos de entrega y modificación"),
      h("button", { class: "tab" + (tab === "fields" ? " active" : ""), onclick: () => { readForm(); tab = "fields"; render(); } }, "Campos"),
      h("button", { class: "tab" + (tab === "tech" ? " active" : ""), onclick: () => { readForm(); tab = "tech"; render(); } }, "Opciones técnicas"),
    );
    let tabBody;
    if (tab === "attr") {
      tabBody = h(
        "div",
        { class: "form-grid" },
        h("label", {}, "Clase de entrega"),
        h(
          "select",
          { class: "sap-input t-dc", disabled: ro, onchange: (e) => { work.deliveryClass = e.target.value; markDirty(); } },
          [
            ["A", "A - Tabla de aplicación (datos maestros y de movimiento)"],
            ["C", "C - Tabla de customizing"],
            ["L", "L - Tabla para datos temporales"],
          ].map(([v, l]) => h("option", { value: v, selected: (work.deliveryClass || "A") === v }, l)),
        ),
        h("label", {}, "Browser de datos"),
        h("span", {}, "Visualización/actualización permitida (SE16)"),
      );
    } else if (tab === "tech") {
      tabBody = h("div", { class: "hint-box" }, h("p", {}, "En un sistema real aquí se definen la clase de datos (APPL0, APPL1...), la categoría de tamaño y el buffering."), h("p", {}, "En el simulador no hace falta: al activar, la tabla se crea directamente en la base de datos."));
    } else tabBody = fieldsGrid(ro);
    body.replaceChildren(h("div", { class: "row" }, field("Descripción breve", desc, { required: true })), tabs, h("div", { class: "tab-body" }, tabBody));
  };

  const fieldsGrid = (ro) => {
    const tbody = h("tbody");
    work.fields.forEach((f, i) => {
      const t = DDIC_TYPES[f.type] || {};
      const set = (k, v) => {
        f[k] = v;
        markDirty();
      };
      const lenInput = h("input", {
        class: "sap-input num",
        value: t.fixedLen !== undefined ? fieldLength(f) || "" : f.length ?? "",
        readonly: ro || t.fixedLen !== undefined,
        style: { width: "7ch" },
        oninput: (e) => set("length", Number(e.target.value) || ""),
      });
      const decInput = h("input", {
        class: "sap-input num",
        value: t.decimals ? f.decimals ?? 0 : "",
        readonly: ro || !t.decimals,
        style: { width: "5ch" },
        oninput: (e) => set("decimals", Number(e.target.value) || 0),
      });
      tbody.append(
        h(
          "tr",
          { class: f.key ? "keyrow" : "" },
          h("td", { class: "rownum" }, i + 1),
          h("td", {}, h("input", { class: "sap-input upper mono", value: f.name || "", maxlength: 30, readonly: ro, style: { width: "18ch" }, oninput: (e) => { e.target.value = e.target.value.toUpperCase(); set("name", e.target.value); } })),
          h("td", { class: "center" }, h("input", { type: "checkbox", checked: !!f.key, disabled: ro, onchange: (e) => { set("key", e.target.checked); render(); } })),
          h(
            "td",
            {},
            h(
              "select",
              {
                class: "sap-input mono",
                disabled: ro,
                onchange: (e) => {
                  f.type = e.target.value;
                  const nt = DDIC_TYPES[f.type];
                  if (nt.fixedLen !== undefined) f.length = nt.fixedLen;
                  else if (!f.length) f.length = 10;
                  if (!nt.decimals) f.decimals = 0;
                  markDirty();
                  render();
                },
              },
              Object.entries(DDIC_TYPES).map(([k, v]) => h("option", { value: k, selected: f.type === k, title: v.label }, k)),
            ),
          ),
          h("td", {}, lenInput),
          h("td", {}, decInput),
          h("td", {}, h("input", { class: "sap-input", value: f.description || "", maxlength: 60, readonly: ro, style: { width: "100%" }, oninput: (e) => set("description", e.target.value) })),
          ro
            ? null
            : h(
                "td",
                { class: "row-actions" },
                h("button", { class: "mini", title: "Subir", onclick: () => move(i, -1) }, h("span", { class: "ico ico-sortup" })),
                h("button", { class: "mini", title: "Bajar", onclick: () => move(i, 1) }, h("span", { class: "ico ico-sortdown" })),
                h("button", { class: "mini danger", title: "Borrar fila", onclick: () => { work.fields.splice(i, 1); markDirty(); render(); } }, h("span", { class: "ico ico-close" })),
              ),
        ),
      );
    });
    return h(
      "div",
      {},
      h(
        "table",
        { class: "grid-table fields" },
        h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "Campo"), h("th", {}, "Clave"), h("th", { title: "Tipo predefinido" }, "Tipo datos"), h("th", {}, "Longitud"), h("th", {}, "Decimales"), h("th", {}, "Descripción breve"), ro ? null : h("th", {}, ""))),
        tbody,
      ),
      ro
        ? null
        : h(
            "div",
            { class: "row" },
            h("button", { class: "btn", onclick: () => { work.fields.push({ name: "", key: false, type: "CHAR", length: 20, decimals: 0, description: "" }); markDirty(); render(); setTimeout(() => body.querySelector("tbody tr:last-child input")?.focus(), 10); } }, "+ Insertar campo"),
            h("span", { class: "hint" }, "Usamos tipos predefinidos (sin elementos de datos). El primer campo suele ser MANDT (CLNT) y los campos clave van al inicio."),
          ),
      h(
        "details",
        { class: "types-help" },
        h("summary", {}, "Ayuda: tipos de datos"),
        h("table", { class: "kv" }, Object.entries(DDIC_TYPES).map(([k, v]) => h("tr", {}, h("td", { class: "mono" }, k), h("td", {}, v.label)))),
      ),
    );
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= work.fields.length) return;
    [work.fields[i], work.fields[j]] = [work.fields[j], work.fields[i]];
    markDirty();
    render();
  };

  return {
    id: "SE11-TAB",
    tcode: "SE11",
    title: () => `Diccionario: ${mode === "change" ? "Modificar" : "Visualizar"} tabla`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: toggle },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: () => app.busy(`Verificando tabla ${n}...`, () => check(), 350) },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate, primary: !standard },
      "-",
      { icon: "table", label: "Contenido", tip: "Contenido de la tabla (SE16)", action: content },
    ],
    keys: { "Ctrl+S": () => (standard || mode !== "change" ? app.status("Nada que grabar", "W") : app.busy(`Grabando tabla ${n}...`, () => save(false), 250)) },
    render(el) {
      headEl = h("div", { class: "editor-head" });
      body = h("div", { class: "panel wide" });
      el.append(headEl, body);
      renderHead();
      render();
    },
    async canLeave() {
      if (standard || mode !== "change" || !dirty) return true;
      const r = await dialog({
        title: "Salir",
        icon: "question",
        body: "¿Desea grabar los cambios de la tabla?",
        buttons: [
          { label: "Sí", value: "y", primary: true },
          { label: "No", value: "n" },
          { label: "Cancelar", value: false },
        ],
      });
      if (r === "y") save(false);
      if (r === "n" && !store.table(n).active && !store.table(n).fields.some((f) => f.name !== "MANDT")) {
        // tabla nueva vacía: se descarta
      }
      return !!r;
    },
  };
}

function stripTable(t) {
  return {
    name: t.name,
    description: t.description || "",
    deliveryClass: t.deliveryClass || "A",
    fields: t.fields.map((f) => ({ name: (f.name || "").toUpperCase(), key: !!f.key, type: f.type, length: DDIC_TYPES[f.type]?.fixedLen ?? Number(f.length), decimals: DDIC_TYPES[f.type]?.decimals ? Number(f.decimals) || 0 : 0, description: f.description || "" })),
  };
}
