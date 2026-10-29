// SE84 - Sistema de información del repositorio: búsqueda de objetos.
import { h, input, field } from "../ui.js";
import { store } from "../store.js";
import { STANDARD_TABLES } from "../engine/standard.js";

function wildcard(p) {
  const s = (p || "*").trim().toUpperCase() || "*";
  return new RegExp("^" + s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
}

export function se84Screen(app) {
  let nameInput;
  let typeSel;
  let descInput;
  let stdCheck;
  const search = () => {
    const re = wildcard(nameInput.value);
    const desc = descInput.value.trim().toUpperCase();
    const type = typeSel.value;
    const out = [];
    if (type !== "TABL") {
      for (const p of store.programs()) {
        if (type === "PROG" && p.type === "I") continue;
        if (type === "INCL" && p.type !== "I") continue;
        out.push({ type: "PROG", sub: p.type === "I" ? "I" : "1", name: p.name, desc: p.title, status: p.activeSource === null ? "Nuevo" : p.activeSource === p.source ? "Activo" : "Inactivo", changed: p.changed });
      }
    }
    if (type !== "PROG" && type !== "INCL") {
      for (const t of store.tables()) out.push({ type: "TABL", name: t.name, desc: t.description, status: t.active ? "Activo" : "Nuevo", changed: t.created });
      if (stdCheck.checked) for (const t of Object.values(STANDARD_TABLES)) out.push({ type: "TABL", name: t.name, desc: t.description, status: "Activo (estándar)" });
    }
    const res = out.filter((o) => re.test(o.name) && (!desc || (o.desc || "").toUpperCase().includes(desc)));
    app.push(resultScreen(app, res));
  };
  return {
    id: "SE84",
    tcode: "SE84",
    title: "Sistema de información del repositorio",
    toolbar: () => [{ icon: "exec", label: "Ejecutar", key: "F8", action: search, primary: true }],
    onEnter: search,
    render(el) {
      nameInput = input({ value: "Z*", class: "sap-input upper w-30", autofocus: true, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
      descInput = input({ class: "sap-input w-30" });
      typeSel = h("select", { class: "sap-input" }, h("option", { value: "ALL" }, "Todos los objetos"), h("option", { value: "PROG" }, "Programas ejecutables"), h("option", { value: "INCL" }, "Includes"), h("option", { value: "TABL" }, "Tablas base de datos"));
      stdCheck = h("input", { type: "checkbox" });
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          h("div", { class: "tree-node open" }, h("span", { class: "ico ico-folder" }), "Repository Information System › Objetos de desarrollo"),
          field("Tipo de objeto", typeSel),
          field("Nombre", nameInput),
          field("Descripción breve", descInput),
          h("label", { class: "radio" }, stdCheck, "Incluir tablas estándar (vuelos, FI, SD, MM, HR)"),
          h("p", { class: "hint" }, "Usa * como comodín. Ejemplos: Z*, ZP1*, *ALV*."),
        ),
      );
    },
  };
}

function resultScreen(app, res) {
  const open = async (o) => {
    if (o.type === "PROG") {
      const { editorScreen } = await import("./se38.js");
      store.data.lastProg = o.name;
      app.push(editorScreen(app, o.name, "show"));
    } else {
      const { se11Screen } = await import("./se11.js");
      store.data.lastTable = o.name;
      store.save();
      const s = se11Screen(app);
      app.push(s);
      setTimeout(() => s.keys.F7(), 30);
    }
  };
  return {
    id: "SE84-RES",
    tcode: "SE84",
    cls: "alv-screen",
    title: () => `Sistema info repositorio: ${res.length} acierto(s)`,
    toolbar: () => [],
    render(el) {
      el.append(
        h(
          "div",
          { class: "alv-wrap" },
          h(
            "table",
            { class: "alv striped optimize" },
            h("thead", {}, h("tr", {}, h("th", {}, "Tipo"), h("th", {}, "Nombre del objeto"), h("th", {}, "Descripción breve"), h("th", {}, "Estado"), h("th", {}, "Modificado"))),
            h(
              "tbody",
              {},
              res.map((o) =>
                h(
                  "tr",
                  { class: "clickable", ondblclick: () => open(o), title: "Doble clic para abrir" },
                  h("td", {}, h("span", { class: "ico ico-" + (o.type === "PROG" ? (o.sub === "I" ? "include" : "editor") : "ddic") }), o.type === "PROG" ? (o.sub === "I" ? " Include" : " Programa") : " Tabla"),
                  h("td", { class: "mono" }, h("b", {}, o.name)),
                  h("td", {}, o.desc || ""),
                  h("td", {}, o.status),
                  h("td", {}, o.changed ? new Date(o.changed).toLocaleString("es-PE") : ""),
                ),
              ),
            ),
          ),
          res.length ? null : h("div", { class: "alv-empty" }, "No se encontraron objetos con esos criterios"),
        ),
      );
    },
  };
}
