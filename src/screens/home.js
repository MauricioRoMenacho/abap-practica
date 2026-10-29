// SAP Easy Access: menú de usuario en árbol, como en el SAP GUI.
import { h } from "../ui.js";

// transacciones de "Favoritos" (también las usan otras pantallas)
const TX = [
  ["SE38", "Editor ABAP"],
  ["SE11", "Diccionario ABAP"],
  ["SE16", "Browser de datos"],
  ["SE84", "Sistema info repositorio"],
  ["ZJUEGOS", "Retos y juegos"],
];

// transacciones adicionales (accesos en otras pantallas)
export const MORE_TX = [["ZUI5", "SAPUI5 / Fiori (Business Application Studio)"], ["SE24", "Clases globales"], ["SE37", "Módulos de función"], ["SE91", "Clases de mensajes"], ["ST05", "Traza SQL"], ["SM12", "Bloqueos"], ["ZAYUDA", "Glosario, examen y constancia"]];

const MENU = [
  {
    name: "Herramientas",
    children: [
      {
        name: "ABAP Workbench",
        children: [
          { name: "Desarrollo", tx: [["SE38", "Editor ABAP"], ["SE24", "Class Builder"], ["SE37", "Function Builder"], ["SE91", "Mensajes"], ["SE80", "Object Navigator"]] },
          { name: "Diccionario", tx: [["SE11", "Diccionario ABAP"], ["SE16", "Browser de datos"], ["SE16N", "Visualización general de tablas"]] },
          { name: "Sistema de información", tx: [["SE84", "Sistema info repositorio"]] },
          { name: "Test", tx: [["ST05", "Traza de rendimiento"], ["SM12", "Entradas de bloqueo"]] },
        ],
      },
      { name: "SAP Fiori", tx: [["ZUI5", "Business Application Studio (SAPUI5)"]] },
    ],
  },
  { name: "Formación", tx: [["ZJUEGOS", "Retos y juegos"], ["ZAYUDA", "Glosario, examen y constancia"]] },
];

const keyOf = (path) => "abapp.home.tree." + path;

export function homeScreen(app) {
  const go = (code) => app.command(code);
  const leaf = (code, name, depth) =>
    h(
      "button",
      { class: "ea-leaf", style: { paddingLeft: 8 + depth * 18 + "px" }, title: code, ondblclick: () => go(code), onclick: (e) => e.currentTarget.focus(), onkeydown: (e) => e.key === "Enter" && go(code) },
      h("span", { class: "ea-tx" }),
      h("span", { class: "ea-code" }, code),
      h("span", {}, " - " + name),
    );
  const folder = (node, path, depth) => {
    const saved = localStorage.getItem(keyOf(path));
    const open = saved === null ? depth === 0 || path === "menu" || path === "menu.0" || path === "menu.0.0" : saved !== "0";
    const box = h("div", { class: "ea-group" + (open ? " open" : "") });
    box.append(
      h(
        "button",
        {
          class: "ea-node",
          style: { paddingLeft: 4 + depth * 18 + "px" },
          onclick: () => {
            const now = !box.classList.contains("open");
            box.classList.toggle("open", now);
            localStorage.setItem(keyOf(path), now ? "1" : "0");
          },
        },
        h("span", { class: "ea-caret" }),
        h("span", { class: "ea-folder" }),
        node.name,
      ),
      h("div", { class: "ea-kids" }, (node.children || []).map((c, i) => folder(c, path + "." + i, depth + 1)), (node.tx || []).map(([c, n]) => leaf(c, n, depth + 1))),
    );
    return box;
  };
  return {
    id: "HOME",
    tcode: "",
    title: "SAP Easy Access",
    cls: "home",
    toolbar: () => [
      { icon: "folder", label: "Otro menú", tip: "Menú SAP (estándar)", action: () => app.status("Solo existe el menú SAP en este sistema de práctica", "I") },
      { icon: "create", label: "Añadir a favoritos", tip: "Añadir a favoritos", action: () => app.status("Los favoritos son fijos en este sistema de práctica", "I") },
      "-",
      { icon: "guide", label: "Guía de práctica", text: true, action: () => app.toggleGuide(true) },
    ],
    render(el) {
      el.append(
        h(
          "div",
          { class: "easy-access" },
          h(
            "div",
            { class: "ea-tree" },
            folder({ name: "Favoritos", tx: TX }, "fav", 0),
            folder({ name: "Menú SAP", children: MENU }, "menu", 0),
          ),
          h(
            "div",
            { class: "ea-canvas" },
            h("div", { class: "ea-art" }, h("div", { class: "ea-art-logo" }, "NPL"), h("div", { class: "ea-art-text" }, "Sistema de práctica ABAP - mandante 100")),
            h("p", { class: "ea-hint" }, "Doble clic en una transacción del menú o escríbela en el campo de comandos y pulse Enter."),
          ),
        ),
      );
    },
  };
}
