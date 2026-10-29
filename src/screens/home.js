import { h } from "../ui.js";
import { store } from "../store.js";

const TX = [
  ["SE38", "Editor ABAP", "Crear, modificar, activar y ejecutar programas", "editor"],
  ["SE11", "Diccionario ABAP", "Crear tablas transparentes con sus campos", "ddic"],
  ["SE16", "Browser de datos", "Ver, buscar e insertar registros en las tablas", "table"],
  ["SE84", "Sistema info repositorio", "Buscar programas y tablas por nombre", "search"],
  ["ZJUEGOS", "Retos y juegos", "Completa código, adivina la salida, corrige errores y gana puntos", "game"],
];

export function homeScreen(app) {
  return {
    id: "HOME",
    tcode: "",
    title: "Menú SAP Easy Access",
    cls: "home",
    toolbar: () => [],
    render(el) {
      const progs = store.programs().length;
      const tabs = store.tables().length;
      el.append(
        h(
          "div",
          { class: "home-grid" },
          h(
            "div",
            { class: "tree" },
            h("div", { class: "tree-node open" }, h("span", { class: "ico ico-folder" }), "Favoritos"),
            TX.map(([code, name]) =>
              h("button", { class: "tree-leaf", ondblclick: () => app.command(code), onclick: (e) => e.currentTarget.focus(), onkeydown: (e) => e.key === "Enter" && app.command(code) }, h("span", { class: "ico ico-tx" }), h("b", {}, code), " - " + name),
            ),
            h("div", { class: "tree-node open" }, h("span", { class: "ico ico-folder" }), "Menú SAP"),
            h("div", { class: "tree-leaf muted" }, h("span", { class: "ico ico-folder-c" }), "Herramientas › ABAP Workbench"),
            h("p", { class: "tree-hint" }, "Doble clic para abrir una transacción, o escríbela en el campo de comandos de arriba."),
          ),
          h(
            "div",
            { class: "welcome" },
            h("h1", {}, "Bienvenido a tu sistema de práctica ABAP"),
            h("p", { class: "lead" }, "Aquí puedes practicar como en un sistema real: escribe una transacción en el ", h("b", {}, "campo de comandos"), " (arriba a la izquierda) y pulsa Enter. No hay paquetes ni órdenes de transporte: todo se guarda como objeto local en tu navegador."),
            h(
              "div",
              { class: "tx-cards" },
              TX.map(([code, name, desc, icon]) =>
                h(
                  "button",
                  { class: "tx-card", onclick: () => app.command(code) },
                  h("span", { class: "ico ico-big ico-" + icon }),
                  h("span", { class: "tx-code" }, code),
                  h("span", { class: "tx-name" }, name),
                  h("span", { class: "tx-desc" }, desc),
                ),
              ),
            ),
            h(
              "div",
              { class: "start-box" },
              h("div", {}, h("h2", {}, "¿Primera vez?"), h("p", {}, "Abre la ", h("b", {}, "Guía de práctica"), " (botón arriba a la derecha) y sigue el Paso 1. Cada ejercicio se marca solo cuando lo completas.")),
              h("button", { class: "btn btn-primary", onclick: () => app.toggleGuide(true) }, "Abrir la guía"),
            ),
            h("p", { class: "muted small" }, `Tus objetos: ${progs} programa(s), ${tabs} tabla(s). Tablas estándar de ejemplo: vuelos (SCARR, SFLIGHT, SBOOK...), finanzas (T001), ventas (KNA1, VBAK, VBAP), compras (LFA1, EKKO, EKPO), materiales (MARA, MAKT) y personal (PA0001, PA0002, PA0008).`),
          ),
        ),
      );
    },
  };
}
