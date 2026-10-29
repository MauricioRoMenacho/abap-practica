// SE91 - Clases de mensajes.
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";

export const STANDARD_MSG = {
  "00": {
    name: "00",
    description: "Mensajes generales del sistema",
    standard: true,
    messages: {
      "001": { S: "&1&2&3&4&5&6&7&8", E: "&1&2&3&4&5&6&7&8" },
      "208": { S: "&1", E: "&1" },
      "398": { S: "& & & &", E: "& & & &" },
    },
  },
};

export function allMsgClasses() {
  return { ...STANDARD_MSG, ...(store.data.msgClasses || {}) };
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// XML abapGit para que la verificación de sintaxis conozca la clase de mensajes
export function msagXml(mc) {
  const rows = Object.entries(mc.messages || {})
    .map(([nr, t]) => `<T100><SPRSL>S</SPRSL><ARBGB>${esc(mc.name)}</ARBGB><MSGNR>${nr}</MSGNR><TEXT>${esc(t.S || t.E || "")}</TEXT></T100>`)
    .join("");
  return `<?xml version="1.0" encoding="utf-8"?>
<abapGit version="v1.0.0" serializer="LCL_OBJECT_MSAG" serializer_version="v1.0.0">
 <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
   <T100A><ARBGB>${esc(mc.name)}</ARBGB><MASTERLANG>S</MASTERLANG><STEXT>${esc(mc.description)}</STEXT></T100A>
   <T100>${rows}</T100>
  </asx:values>
 </asx:abap>
</abapGit>`;
}

// textos para el motor: { ZCLASE: { "001": "texto" } } en el idioma de inicio de sesión
export function msgTexts(lang) {
  const out = {};
  for (const mc of Object.values(allMsgClasses())) {
    out[mc.name.toUpperCase()] = {};
    for (const [nr, t] of Object.entries(mc.messages || {})) {
      let txt = (lang === "E" ? t.E || t.S : t.S || t.E) || "";
      // "&" sin número: se reemplaza en orden (&1, &2, ...)
      let k = 0;
      txt = txt.replace(/&(?!\d)/g, () => "&" + ++k);
      out[mc.name.toUpperCase()][nr] = txt;
    }
  }
  return out;
}

export function se91Screen(app) {
  let nameInput;
  const name = () => nameInput.value.trim().toUpperCase();
  const open = (mode) => {
    const n = name();
    if (!n) return app.status("Indique una clase de mensajes", "E");
    const mc = allMsgClasses()[n];
    if (!mc) return app.status(`La clase de mensajes ${n} no existe`, "E");
    store.data.lastMsgClass = n;
    store.save();
    app.push(msgClassScreen(app, n, mc.standard ? "show" : mode));
  };
  const create = async () => {
    const n = name();
    if (!/^[YZ][A-Z0-9_]{0,19}$/.test(n)) return app.status("El nombre debe empezar por Z o Y (máximo 20 caracteres)", "E");
    if (allMsgClasses()[n]) return app.status(`La clase de mensajes ${n} ya existe`, "E");
    const desc = input({ maxlength: 60, placeholder: "Ej.: Mensajes del módulo de ventas" });
    const d = await dialog({ title: `Crear clase de mensajes ${n}`, body: field("Descripción breve", desc, { required: true }), buttons: [{ label: "Grabar", value: () => desc.value.trim(), primary: true }, { label: "Cancelar", value: false }] });
    if (!d) return d === "" ? app.status("Indique una descripción", "E") : undefined;
    (store.data.msgClasses ||= {})[n] = { name: n, description: d, messages: {} };
    store.data.lastMsgClass = n;
    store.save();
    app.status(`Clase de mensajes ${n} creada`, "S");
    app.push(msgClassScreen(app, n, "change"));
  };
  const del = async () => {
    const n = name();
    if (!store.data.msgClasses?.[n]) return app.status(`La clase de mensajes ${n} no existe o es estándar`, "E");
    if (!(await confirm(`¿Borrar la clase de mensajes ${n}?`, "Borrar", "Borrar", "Cancelar"))) return;
    delete store.data.msgClasses[n];
    store.save();
    app.status(`Clase de mensajes ${n} borrada`, "S");
  };
  return {
    id: "SE91",
    tcode: "SE91",
    title: "Mantenimiento de mensajes: Acceso",
    toolbar: () => [{ icon: "delete", tip: "Borrar", action: del }],
    keys: { F7: () => open("show"), F6: () => open("change"), F5: create },
    onEnter: () => open("show"),
    render(el) {
      nameInput = input({ maxlength: 20, value: store.data.lastMsgClass || "", class: "sap-input upper w-20", autofocus: true, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
      const list = Object.values(allMsgClasses());
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          field("Clase de mensajes", nameInput, { required: true }),
          h(
            "div",
            { class: "row buttons" },
            h("button", { class: "btn", onclick: () => open("show") }, h("span", { class: "ico ico-display" }), "Visualizar"),
            h("button", { class: "btn", onclick: () => open("change") }, h("span", { class: "ico ico-change" }), "Modificar"),
            h("button", { class: "btn btn-primary", onclick: create }, h("span", { class: "ico ico-create" }), "Crear"),
          ),
          h("div", { class: "chips" }, h("span", { class: "muted small" }, "Existentes: "), list.map((mc) => h("button", { class: "chip", title: mc.description, onclick: () => { nameInput.value = mc.name; open("show"); } }, mc.name))),
          h("p", { class: "hint" }, "Uso en el código: MESSAGE e001(zventas) WITH lv_valor. — e = tipo (S, I, W, E, A), 001 = número, zventas = clase. &1 a &4 se reemplazan por los valores de WITH."),
        ),
      );
    },
  };
}

function msgClassScreen(app, n, initialMode) {
  let mode = initialMode;
  let body;
  const mc = () => allMsgClasses()[n];
  const readForm = () => {
    if (mode !== "change" || !body) return;
    const m = store.data.msgClasses[n];
    const msgs = {};
    body.querySelectorAll("tr[data-msg]").forEach((tr) => {
      const nr = tr.querySelector(".m-nr").value.trim();
      const es = tr.querySelector(".m-es").value;
      const en = tr.querySelector(".m-en").value;
      if (!/^\d{1,3}$/.test(nr) || (!es && !en)) return;
      msgs[nr.padStart(3, "0")] = { S: es, E: en };
    });
    m.messages = msgs;
    const d = body.querySelector(".m-desc");
    if (d) m.description = d.value;
  };
  const save = () => {
    if (mode !== "change") return;
    readForm();
    store.save();
    app.status(`Mensajes de ${n} grabados`, "S");
  };
  const render = () => {
    const ro = mode !== "change";
    const c = mc();
    const tbody = h("tbody");
    const addRow = (nr = "", es = "", en = "") =>
      tbody.append(
        h(
          "tr",
          { "data-msg": "1" },
          h("td", {}, h("input", { class: "sap-input m-nr mono", value: nr, maxlength: 3, readonly: ro, style: { width: "6ch" } })),
          h("td", {}, h("input", { class: "sap-input m-es", value: es, maxlength: 73, readonly: ro })),
          h("td", {}, h("input", { class: "sap-input m-en", value: en, maxlength: 73, readonly: ro })),
        ),
      );
    for (const [nr, t] of Object.entries(c.messages || {}).sort()) addRow(nr, t.S || "", t.E || "");
    if (!ro) {
      const next = String(Math.max(0, ...Object.keys(c.messages || {}).map(Number)) + 1).padStart(3, "0");
      addRow(next);
    }
    body.replaceChildren(
      h("div", { class: "row" }, field("Descripción breve", h("input", { class: "sap-input m-desc", value: c.description, readonly: ro, style: { width: "50ch" } }))),
      h("table", { class: "grid-table texts" }, h("thead", {}, h("tr", {}, h("th", { style: { width: "80px" } }, "Mensaje"), h("th", {}, "Texto (ES - original)"), h("th", {}, "Traducción (EN)"))), tbody),
      ro ? null : h("button", { class: "btn", onclick: () => { readForm(); const all = Object.keys(store.data.msgClasses[n].messages).map(Number); addRow(String(Math.max(0, ...all, ...[...tbody.querySelectorAll(".m-nr")].map((x) => Number(x.value) || 0)) + 1).padStart(3, "0")); } }, "+ Añadir mensaje"),
      h("p", { class: "hint" }, "Usa &1, &2, &3 y &4 (o & solo) para los valores que se pasan con WITH. Ejemplo: \"El cliente &1 no existe en la sociedad &2\"."),
    );
  };
  return {
    id: "SE91-MSG",
    tcode: "SE91",
    title: () => `Mantenimiento de mensajes: ${mode === "change" ? "Modificar" : "Visualizar"} ${n}`,
    toolbar: () => [
      { icon: mode === "change" ? "display" : "change", tip: "Visualizar ↔ Modificar", key: "Ctrl+F1", action: () => { if (mc().standard) return app.status("Las clases estándar solo se pueden visualizar", "W"); if (mode === "change") save(); mode = mode === "change" ? "show" : "change"; app.refreshChrome(); render(); } },
      { icon: "save", label: "Grabar", action: save },
    ],
    keys: { "Ctrl+S": save },
    render(el) {
      body = h("div", { class: "panel wide" });
      el.append(h("div", { class: "editor-head" }, h("span", { class: "eh-label" }, "Clase de mensajes"), h("b", {}, n), mc().standard ? h("span", { class: "badge" }, "Estándar - solo lectura") : null), body);
      render();
    },
    canLeave: async () => {
      if (mode === "change") save();
      return true;
    },
  };
}
