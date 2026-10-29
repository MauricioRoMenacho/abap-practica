// SE11: dominios y elementos de datos.
import { h, dialog, field } from "../ui.js";
import { store } from "../store.js";
import { DDIC_TYPES, validateDomain, validateDtel } from "../engine/ddic.js";
import { domains, dtels, activeDomain, activeTablesResolved, ddicExtraFiles } from "../ddic-repo.js";
import { pickFrom } from "./se11.js";

const TYPES = Object.entries(DDIC_TYPES).filter(([k]) => k !== "CLNT");

function typeEditor(obj, ro, onChange) {
  const t = DDIC_TYPES[obj.type] || {};
  return h(
    "div",
    { class: "form-grid" },
    h("label", {}, "Tipo de datos"),
    h(
      "select",
      {
        class: "sap-input mono",
        disabled: ro,
        onchange: (e) => {
          obj.type = e.target.value;
          const nt = DDIC_TYPES[obj.type];
          if (nt.fixedLen !== undefined) obj.length = nt.fixedLen;
          else if (!obj.length) obj.length = 10;
          if (!nt.decimals) obj.decimals = 0;
          onChange(true);
        },
      },
      TYPES.map(([k, v]) => h("option", { value: k, selected: obj.type === k }, `${k} - ${v.label}`)),
    ),
    h("label", {}, "Longitud"),
    h("input", { class: "sap-input num", style: { width: "8ch" }, value: t.fixedLen !== undefined ? t.fixedLen : obj.length ?? "", readonly: ro || t.fixedLen !== undefined, oninput: (e) => { obj.length = Number(e.target.value) || ""; onChange(); } }),
    h("label", {}, "Decimales"),
    h("input", { class: "sap-input num", style: { width: "6ch" }, value: t.decimals ? obj.decimals ?? 0 : "", readonly: ro || !t.decimals, oninput: (e) => { obj.decimals = Number(e.target.value) || 0; onChange(); } }),
  );
}

function statusBadge(obj, dirty) {
  if (!obj.active) return ["Nuevo", "badge-warn"];
  const { active, ...rest } = obj;
  const same = JSON.stringify(strip(rest)) === JSON.stringify(strip(active));
  return same && !dirty ? ["Activo", "badge-ok"] : ["Revisado (inactivo)", "badge-warn"];
}
const strip = (o) => JSON.parse(JSON.stringify({ ...o, active: undefined }));

// ---------------------------------------------------------------- dominio
export function domainScreen(app, n, initialMode, isNew) {
  let mode = initialMode;
  let tab = "def";
  let dirty = !!isNew;
  let body;
  let headEl;
  const obj = () => domains()[n];
  let work = JSON.parse(JSON.stringify({ ...obj(), active: undefined }));
  const markDirty = (rerender) => {
    dirty = true;
    renderHead();
    if (rerender) render();
  };
  const save = (silent) => {
    if (mode !== "change") return;
    Object.assign(obj(), JSON.parse(JSON.stringify(work)));
    store.save();
    dirty = false;
    renderHead();
    if (!silent) app.status(`Dominio ${n} grabado (inactivo)`, "S");
  };
  const check = () => {
    const errors = validateDomain({ ...work, name: n });
    if (errors.length) {
      dialog({ title: "Verificación del dominio", icon: "error", body: h("ul", { class: "err-list" }, errors.map((e) => h("li", {}, e))) });
      app.status(`El dominio ${n} tiene errores`, "E");
      return false;
    }
    app.status(`El dominio ${n} es correcto`, "S");
    return true;
  };
  const activate = () =>
    app.busy(`Activando dominio ${n}...`, async () => {
      if (mode === "change") save(true);
      if (!check()) return;
      obj().active = strip({ ...work, name: n });
      store.save();
      await app.engine.syncSchema(activeTablesResolved(), ddicExtraFiles());
      app.status(`Se ha activado el dominio ${n}`, "S");
      renderHead();
    });
  const renderHead = () => {
    const [st, cls] = statusBadge(obj(), dirty);
    headEl.replaceChildren(h("span", { class: "eh-label" }, "Dominio"), h("b", {}, n), h("span", { class: "badge " + cls }, st));
  };
  const render = () => {
    const ro = mode !== "change";
    const tabs = h(
      "div",
      { class: "tabs" },
      [
        ["def", "Definición"],
        ["values", "Ámbito valores"],
      ].map(([k, l]) => h("button", { class: "tab" + (tab === k ? " active" : ""), onclick: () => { tab = k; render(); } }, l)),
    );
    let tb;
    if (tab === "def") {
      tb = h(
        "div",
        {},
        typeEditor(work, ro, (rr) => markDirty(rr)),
        h("label", { class: "radio" }, h("input", { type: "checkbox", checked: !!work.lowercase, disabled: ro, onchange: (e) => { work.lowercase = e.target.checked; markDirty(); } }), "Minúsculas (si no se marca, los textos se guardan en mayúsculas)"),
        h("p", { class: "hint" }, "El dominio define las características técnicas (tipo y longitud) y los valores permitidos. Varios elementos de datos pueden usar el mismo dominio."),
      );
    } else {
      const tbody = h("tbody");
      const vals = (work.values ||= []);
      const addRow = (v) =>
        tbody.append(
          h(
            "tr",
            {},
            h("td", {}, h("input", { class: "sap-input mono", value: v.low, readonly: ro, maxlength: 10, style: { width: "12ch" }, oninput: (e) => { v.low = e.target.value; markDirty(); } })),
            h("td", {}, h("input", { class: "sap-input", value: v.text, readonly: ro, maxlength: 60, oninput: (e) => { v.text = e.target.value; markDirty(); } })),
            ro ? null : h("td", {}, h("button", { class: "mini danger", onclick: () => { vals.splice(vals.indexOf(v), 1); markDirty(true); } }, h("span", { class: "ico ico-close" }))),
          ),
        );
      vals.forEach(addRow);
      tb = h(
        "div",
        {},
        h("p", { class: "hint" }, "Valores fijos: solo se aceptan estos valores (SE16 los valida y la tecla F4 los muestra). Déjalo vacío si cualquier valor es válido."),
        h("table", { class: "grid-table texts" }, h("thead", {}, h("tr", {}, h("th", { style: { width: "130px" } }, "Valor fijo"), h("th", {}, "Descripción breve"), ro ? null : h("th", {}, ""))), tbody),
        ro ? null : h("button", { class: "btn", onclick: () => { vals.push({ low: "", text: "" }); markDirty(true); } }, "+ Añadir valor"),
        h("div", { class: "row" }, field("Tabla de valores", h("input", { class: "sap-input upper mono", value: work.valueTable || "", readonly: ro, maxlength: 16, style: { width: "18ch" }, oninput: (e) => { e.target.value = e.target.value.toUpperCase(); work.valueTable = e.target.value.trim(); markDirty(); } }))),
        h("p", { class: "hint" }, "Tabla de valores: tabla cuyo contenido sirve como lista de valores posibles (se propone como tabla de verificación)."),
      );
    }
    body.replaceChildren(
      h("div", { class: "row" }, field("Descripción breve", h("input", { class: "sap-input", value: work.description || "", readonly: ro, maxlength: 60, style: { width: "46ch" }, oninput: (e) => { work.description = e.target.value; markDirty(); } }), { required: true })),
      tabs,
      h("div", { class: "tab-body" }, tb),
    );
  };
  return {
    id: "SE11-DOMA",
    tcode: "SE11",
    title: () => `Diccionario: ${mode === "change" ? "Modificar" : "Visualizar"} dominio`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: () => { if (mode === "change") save(true); mode = mode === "change" ? "show" : "change"; app.refreshChrome(); render(); } },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: () => app.busy(`Verificando dominio ${n}...`, () => check(), 300) },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate, primary: true },
    ],
    keys: { "Ctrl+S": () => save(false) },
    render(el) {
      headEl = h("div", { class: "editor-head" });
      body = h("div", { class: "panel wide" });
      el.append(headEl, body);
      renderHead();
      render();
    },
    canLeave: async () => {
      if (mode === "change" && dirty) save(true);
      return true;
    },
  };
}

// ---------------------------------------------------------------- elemento de datos
export function dtelScreen(app, n, initialMode, isNew) {
  let mode = initialMode;
  let tab = "type";
  let dirty = !!isNew;
  let body;
  let headEl;
  const obj = () => dtels()[n];
  let work = JSON.parse(JSON.stringify({ ...obj(), active: undefined }));
  work.labels ||= {};
  let useDomain = isNew ? true : !!work.domain;
  const markDirty = (rerender) => {
    dirty = true;
    renderHead();
    if (rerender) render();
  };
  const save = (silent) => {
    if (mode !== "change") return;
    if (!useDomain) work.domain = "";
    Object.assign(obj(), JSON.parse(JSON.stringify(work)));
    store.save();
    dirty = false;
    renderHead();
    if (!silent) app.status(`Elemento de datos ${n} grabado (inactivo)`, "S");
  };
  const check = () => {
    const errors = validateDtel({ ...work, domain: useDomain ? work.domain : "", name: n }, (d) => !!activeDomain(d));
    if (errors.length) {
      dialog({ title: "Verificación del elemento de datos", icon: "error", body: h("ul", { class: "err-list" }, errors.map((e) => h("li", {}, e))) });
      app.status(`El elemento de datos ${n} tiene errores`, "E");
      return false;
    }
    app.status(`El elemento de datos ${n} es correcto`, "S");
    return true;
  };
  const activate = () =>
    app.busy(`Activando elemento de datos ${n}...`, async () => {
      if (mode === "change") save(true);
      if (!check()) return;
      obj().active = strip({ ...work, domain: useDomain ? work.domain : "", name: n });
      store.save();
      await app.engine.syncSchema(activeTablesResolved(), ddicExtraFiles());
      app.status(`Se ha activado el elemento de datos ${n}`, "S");
      renderHead();
    });
  const renderHead = () => {
    const [st, cls] = statusBadge(obj(), dirty);
    headEl.replaceChildren(h("span", { class: "eh-label" }, "Elemento de datos"), h("b", {}, n), h("span", { class: "badge " + cls }, st));
  };
  const render = () => {
    const ro = mode !== "change";
    const tabs = h(
      "div",
      { class: "tabs" },
      [
        ["type", "Tipo de datos"],
        ["labels", "Denominación de campo"],
      ].map(([k, l]) => h("button", { class: "tab" + (tab === k ? " active" : ""), onclick: () => { tab = k; render(); } }, l)),
    );
    let tb;
    if (tab === "type") {
      const dom = activeDomain(work.domain);
      const domInput = h("input", {
        class: "sap-input upper mono" + (work.domain && !dom ? " missing" : ""),
        value: work.domain || "",
        readonly: ro || !useDomain,
        maxlength: 30,
        style: { width: "24ch" },
        oninput: (e) => {
          e.target.value = e.target.value.toUpperCase();
          work.domain = e.target.value.trim();
          markDirty();
        },
        onchange: () => setTimeout(render, 180),
        onkeydown: async (e) => {
          if (e.key !== "F4" || ro) return;
          e.preventDefault();
          const items = Object.values(domains()).filter((d) => d.active).map((d) => [d.name, d.description]);
          if (!items.length) return app.status("No hay dominios activos", "W");
          const r = await pickFrom("Dominios", items);
          if (r) {
            work.domain = r;
            markDirty(true);
          }
        },
      });
      tb = h(
        "div",
        {},
        h("label", { class: "radio" }, h("input", { type: "radio", name: "dt", checked: useDomain, disabled: ro, onchange: () => { useDomain = true; markDirty(true); } }), h("span", { class: "radio-l" }, "Tipo elemental: Dominio"), domInput),
        dom ? h("p", { class: "hint" }, `${dom.description} · ${dom.type} ${DDIC_TYPES[dom.type]?.needsLen ? dom.length : ""}${dom.decimals ? "," + dom.decimals : ""}${dom.values?.length ? " · " + dom.values.length + " valor(es) fijo(s)" : ""}`) : work.domain ? h("p", { class: "hint" }, "El dominio no existe o no está activo (F4 para elegir).") : null,
        h("label", { class: "radio" }, h("input", { type: "radio", name: "dt", checked: !useDomain, disabled: ro, onchange: () => { useDomain = false; markDirty(true); } }), h("span", { class: "radio-l" }, "Tipo predefinido")),
        useDomain ? null : typeEditor(work, ro, (rr) => markDirty(rr)),
      );
    } else {
      const l = work.labels;
      const row = (k, label, max) => [h("label", {}, `${label} (${max})`), h("input", { class: "sap-input", value: l[k] || "", readonly: ro, maxlength: max, style: { width: max + 2 + "ch" }, oninput: (e) => { l[k] = e.target.value; markDirty(); } })];
      tb = h(
        "div",
        {},
        h("div", { class: "form-grid" }, row("short", "Corto", 10), row("medium", "Mediano", 20), row("long", "Largo", 40), row("heading", "Encabezado", 55)),
        h("p", { class: "hint" }, "Estos textos aparecen automáticamente como cabecera de columna en los ALV, en SE16 y como etiqueta en las pantallas. Así no hay que escribirlos en cada programa."),
      );
    }
    body.replaceChildren(
      h("div", { class: "row" }, field("Descripción breve", h("input", { class: "sap-input", value: work.description || "", readonly: ro, maxlength: 60, style: { width: "46ch" }, oninput: (e) => { work.description = e.target.value; markDirty(); } }), { required: true })),
      tabs,
      h("div", { class: "tab-body" }, tb),
    );
  };
  return {
    id: "SE11-DTEL",
    tcode: "SE11",
    title: () => `Diccionario: ${mode === "change" ? "Modificar" : "Visualizar"} elemento de datos`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: () => { if (mode === "change") save(true); mode = mode === "change" ? "show" : "change"; app.refreshChrome(); render(); } },
      "-",
      { icon: "check", label: "Verificar", key: "Ctrl+F2", action: () => app.busy(`Verificando elemento de datos ${n}...`, () => check(), 300) },
      { icon: "activate", label: "Activar", key: "Ctrl+F3", action: activate, primary: true },
    ],
    keys: { "Ctrl+S": () => save(false) },
    render(el) {
      headEl = h("div", { class: "editor-head" });
      body = h("div", { class: "panel wide" });
      el.append(headEl, body);
      renderHead();
      render();
    },
    canLeave: async () => {
      if (mode === "change" && dirty) save(true);
      return true;
    },
  };
}
