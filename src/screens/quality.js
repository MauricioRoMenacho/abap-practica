// Calidad: resultados de ATC / Code Inspector y de ABAP Unit.
import { h } from "../ui.js";
import { store } from "../store.js";
import { PRIO_LABEL } from "../engine/atc.js";

const ICON = { 1: "error", 2: "warning", 3: "info" };

export function atcScreen(app, name, findings, openAt) {
  let filter = 0;
  let el0;
  const render = () => {
    const counts = [1, 2, 3].map((p) => findings.filter((f) => f.prio === p).length);
    const list = filter ? findings.filter((f) => f.prio === filter) : findings;
    el0.replaceChildren(
      h(
        "div",
        { class: "panel wide" },
        h("div", { class: "row" }, h("b", {}, `ATC - Resultados para ${name}`), h("span", { class: "muted" }, ` (variante de comprobación: DEFAULT del simulador, ${new Date().toLocaleString("es-ES")})`)),
        h(
          "div",
          { class: "atc-summary" },
          [0, 1, 2, 3].map((p) =>
            h(
              "button",
              { class: "atc-chip" + (filter === p ? " active" : "") + (p ? " p" + p : ""), onclick: () => { filter = p; render(); } },
              p ? h("span", { class: "atc-dot p" + p }) : null,
              p ? `${PRIO_LABEL[p]}: ${counts[p - 1]}` : `Todos: ${findings.length}`,
            ),
          ),
        ),
        findings.length === 0
          ? h("div", { class: "atc-clean" }, "No se encontraron problemas. El código cumple todas las comprobaciones.")
          : h(
              "table",
              { class: "grid-table atc" },
              h("thead", {}, h("tr", {}, ["Prio.", "Comprobación", "Mensaje", "Objeto", "Línea"].map((x) => h("th", {}, x)))),
              h(
                "tbody",
                {},
                list.map((f) =>
                  h(
                    "tr",
                    { class: "clickable", title: "Doble clic: ir al código", ondblclick: () => openAt(f.obj, f.row) },
                    h("td", {}, h("span", { class: "atc-dot p" + f.prio, title: PRIO_LABEL[f.prio] }), " ", f.prio),
                    h("td", {}, h("b", {}, f.title)),
                    h("td", {}, h("div", {}, f.help), h("div", { class: "muted small mono" }, f.message)),
                    h("td", { class: "mono" }, f.obj),
                    h("td", { class: "num" }, h("a", { href: "#", onclick: (e) => { e.preventDefault(); openAt(f.obj, f.row); } }, f.row)),
                  ),
                ),
              ),
            ),
        h("p", { class: "hint" }, "El ATC (ABAP Test Cockpit) revisa la calidad del código: rendimiento, seguridad, robustez y convenciones. En proyectos reales, los errores de prioridad 1 y 2 suelen bloquear el transporte a producción. Haga clic en la línea para ir al código."),
      ),
    );
  };
  return {
    id: "ATC",
    tcode: "SE38",
    title: `ABAP Test Cockpit: resultados de ${name}`,
    toolbar: () => [],
    render(el) {
      el0 = el;
      render();
    },
  };
}

export function unitScreen(app, name, results, openAt) {
  let sel = null;
  let el0;
  const all = results.flatMap((c) => c.methods.map((m) => ({ ...m, cls: c.name })));
  const failed = all.filter((m) => m.status !== "ok");
  const render = () => {
    const detail = sel
      ? h(
          "div",
          { class: "unit-detail" },
          h("h3", {}, `${sel.cls}->${sel.name}`),
          sel.status === "ok"
            ? h("p", { class: "unit-ok" }, "La prueba se ejecutó sin errores.")
            : h(
                "div",
                {},
                h("p", { class: sel.status === "fail" ? "unit-fail" : "unit-err" }, sel.status === "fail" ? "Aserción fallida" : "Excepción en tiempo de ejecución"),
                h("p", {}, h("b", {}, "Mensaje: "), sel.msg || ""),
                sel.expected !== undefined && sel.status === "fail" ? h("p", {}, h("b", {}, "Esperado: "), h("span", { class: "mono" }, sel.expected)) : null,
                sel.actual !== undefined && sel.status === "fail" ? h("p", {}, h("b", {}, "Obtenido: "), h("span", { class: "mono" }, sel.actual)) : null,
              ),
          h("p", { class: "muted small" }, `Duración: ${sel.ms} ms`),
          h("button", { class: "btn", onclick: () => openAt(name, sel.row) }, "Ir al método de prueba"),
        )
      : h("div", { class: "unit-detail muted" }, "Seleccione un método de prueba para ver el detalle.");
    el0.replaceChildren(
      h(
        "div",
        { class: "panel wide" },
        h(
          "div",
          { class: "unit-banner " + (all.length === 0 ? "none" : failed.length ? "bad" : "good") },
          all.length === 0
            ? "No se encontraron clases de prueba (FOR TESTING) en el programa."
            : failed.length
              ? `${failed.length} de ${all.length} prueba(s) con errores`
              : `Las ${all.length} prueba(s) se ejecutaron correctamente`,
        ),
        h(
          "div",
          { class: "unit-layout" },
          h(
            "div",
            { class: "unit-tree" },
            h("div", { class: "unit-node prog" }, h("span", { class: "ico ico-editor" }), name),
            results.map((c) =>
              h(
                "div",
                {},
                h("div", { class: "unit-node cls" }, h("span", { class: "unit-st " + (c.error || c.methods.some((m) => m.status !== "ok") ? "bad" : "good") }), c.name, h("span", { class: "muted small" }, ` ${c.risk ? "RISK LEVEL " + c.risk : ""} ${c.duration ? "DURATION " + c.duration : ""}`)),
                c.error ? h("div", { class: "unit-node meth unit-err" }, c.error) : null,
                c.methods.map((m) =>
                  h(
                    "div",
                    { class: "unit-node meth" + (sel && sel.cls === c.name && sel.name === m.name ? " active" : ""), onclick: () => { sel = { ...m, cls: c.name }; render(); } },
                    h("span", { class: "unit-st " + (m.status === "ok" ? "good" : m.status === "fail" ? "bad" : "err") }),
                    m.name,
                    m.status !== "ok" ? h("span", { class: "muted small" }, " - " + (m.msg || "").slice(0, 60)) : null,
                  ),
                ),
              ),
            ),
          ),
          detail,
        ),
        h("p", { class: "hint" }, "Verde: la prueba pasó. Rojo: una aserción (cl_abap_unit_assert) falló. Naranja: excepción no capturada durante la prueba. Las pruebas unitarias no ejecutan el programa: solo los métodos FOR TESTING."),
      ),
    );
  };
  return {
    id: "AUNIT",
    tcode: "SE38",
    title: `ABAP Unit: resultados de ${name}`,
    toolbar: () => [],
    render(el) {
      el0 = el;
      if (!sel && failed.length) sel = failed[0];
      render();
    },
  };
}

export function recordQuality(kind, name, data) {
  ((store.data.quality ||= {})[kind] ||= {})[name] = { at: new Date().toISOString(), ...data };
  store.save();
}
