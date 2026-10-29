// Pantalla del depurador ABAP: código con la línea actual, variables y campos SY.
import { h, esc } from "../ui.js";
import { store } from "../store.js";

const colorCache = new Map();

async function colorized(obj, source) {
  const key = obj + "\u0000" + source;
  if (colorCache.has(key)) return colorCache.get(key);
  let lines;
  try {
    const { monaco } = await import("../editor.js");
    const html = await monaco.editor.colorize(source, "abap", { tabSize: 2 });
    lines = html.split(/<br\/?>/);
  } catch {
    lines = source.split("\n").map(esc);
  }
  colorCache.set(key, lines);
  return lines;
}

export function toggleBreakpoint(obj, line) {
  const bps = (store.data.breakpoints ||= {});
  const k = `${obj}:${line}`;
  if (bps[k]) delete bps[k];
  else bps[k] = true;
  store.save();
  return !!bps[k];
}

export function debuggerScreen(app, initialState, initialResolve, onAction) {
  let state = initialState;
  let resolve = initialResolve;
  let selected = null;
  let srcEl;
  let varsEl;
  let detailEl;
  let headEl;
  let syEl;

  const act = (action) => {
    if (!resolve) return;
    const r = resolve;
    resolve = null;
    r(action);
    onAction(action);
  };

  const renderSource = async () => {
    const p = store.program(state.obj);
    const source = p ? (p.activeSource ?? p.source) : "";
    const lines = await colorized(state.obj, source);
    const bps = store.data.breakpoints || {};
    srcEl.replaceChildren(
      ...lines.map((html, i) => {
        const n = i + 1;
        const isCur = n === state.line;
        const hasBp = !!bps[`${state.obj}:${n}`];
        return h(
          "div",
          { class: "dbg-line" + (isCur ? " current" : "") },
          h(
            "span",
            {
              class: "dbg-gutter" + (hasBp ? " bp" : ""),
              title: "Clic: poner o quitar punto de parada",
              onclick: () => {
                toggleBreakpoint(state.obj, n);
                renderSource();
              },
            },
            isCur ? h("span", { class: "ico ico-arrow dbg-arrow" }) : null,
          ),
          h("span", { class: "dbg-num" }, n),
          h("span", { class: "dbg-code", html: html || " " }),
        );
      }),
    );
    const cur = srcEl.querySelector(".current");
    cur?.scrollIntoView({ block: "center" });
  };

  const valueText = (v) => {
    switch (v.kind) {
      case "simple":
        return v.value;
      case "table":
        return `${v.count} línea(s)`;
      case "struct":
        return v.fields
          .slice(0, 4)
          .map((f) => (f.kind === "simple" ? f.value : "…"))
          .join(" | ") + (v.fields.length > 4 ? " …" : "");
      case "unassigned":
        return "(field-symbol no asignado)";
      case "na":
        return v.note ? `(${v.note})` : "(no disponible)";
      default:
        return "…";
    }
  };

  const renderVars = () => {
    const vars = state.vars || [];
    varsEl.replaceChildren(
      h(
        "table",
        { class: "dbg-vars" },
        h("thead", {}, h("tr", {}, h("th", {}, "Variable"), h("th", {}, "Tipo"), h("th", {}, "Valor"))),
        h(
          "tbody",
          {},
          vars.length === 0 ? h("tr", {}, h("td", { colspan: 3, class: "muted" }, "No hay variables en este punto")) : null,
          vars.map((v) =>
            h(
              "tr",
              {
                class: (selected === v.name ? "sel " : "") + (v.kind === "table" || v.kind === "struct" ? "expandable" : ""),
                onclick: () => {
                  selected = v.name;
                  renderVars();
                  renderDetail();
                },
              },
              h("td", { class: "mono" }, v.name),
              h("td", { class: "muted small" }, v.type || (v.kind === "na" ? "" : v.kind)),
              h("td", { class: "mono val" }, valueText(v)),
            ),
          ),
        ),
      ),
    );
  };

  const renderDetail = () => {
    const v = (state.vars || []).find((x) => x.name === selected);
    if (!v || (v.kind !== "table" && v.kind !== "struct")) {
      detailEl.replaceChildren(h("p", { class: "muted small" }, "Haz clic en una tabla interna, estructura u objeto para ver su contenido."));
      return;
    }
    if (v.kind === "struct") {
      detailEl.replaceChildren(
        h("div", { class: "dbg-detail-title" }, `${v.name} · ${v.type}`),
        h(
          "table",
          { class: "dbg-vars" },
          h("thead", {}, h("tr", {}, h("th", {}, "Componente"), h("th", {}, "Tipo"), h("th", {}, "Valor"))),
          h(
            "tbody",
            {},
            v.fields.map((f) => h("tr", {}, h("td", { class: "mono" }, f.name), h("td", { class: "muted small" }, f.type || ""), h("td", { class: "mono val" }, valueText(f)))),
          ),
        ),
      );
      return;
    }
    detailEl.replaceChildren(
      h("div", { class: "dbg-detail-title" }, `${v.name} · ${v.type} · ${v.count} línea(s)` + (v.count > v.data.length ? ` (se muestran ${v.data.length})` : "")),
      h(
        "div",
        { class: "dbg-table-wrap" },
        h(
          "table",
          { class: "alv striped optimize" },
          h("thead", {}, h("tr", {}, h("th", { class: "rowsel" }, "#"), v.columns.map((c) => h("th", {}, c)))),
          h(
            "tbody",
            {},
            v.data.map((r, i) =>
              h(
                "tr",
                { class: state.sy?.tabix && Number(state.sy.tabix) === i + 1 ? "selrow" : "" },
                h("td", { class: "rowsel" }, i + 1),
                r.map((c) => h("td", {}, c)),
              ),
            ),
          ),
        ),
      ),
    );
  };

  const renderHead = () => {
    const p = store.program(state.obj);
    headEl.replaceChildren(
      h("span", { class: "eh-label" }, p?.type === "I" ? "Include" : "Programa"),
      h("b", {}, state.obj),
      h("span", { class: "eh-label" }, "Línea"),
      h("b", {}, state.line),
      h("span", { class: "badge badge-warn" }, "Detenido: " + state.reason),
    );
    syEl.replaceChildren(
      ...[
        ["sy-subrc", state.sy?.subrc],
        ["sy-tabix", state.sy?.tabix],
        ["sy-index", state.sy?.index],
        ["sy-dbcnt", state.sy?.dbcnt],
        ["sy-uname", state.sy?.uname],
        ["sy-datum", state.sy?.datum],
      ].map(([k, v]) => h("div", { class: "dbg-sy" }, h("span", { class: "mono muted" }, k), h("b", { class: "mono" }, v ?? ""))),
    );
  };

  const renderAll = () => {
    renderHead();
    renderSource();
    if (selected && !(state.vars || []).some((v) => v.name === selected)) selected = null;
    renderVars();
    renderDetail();
  };

  return {
    id: "DEBUGGER",
    tcode: "SE38",
    cls: "debugger-screen",
    title: () => "Depurador ABAP",
    toolbar: () => [
      { icon: "step", label: "Paso a paso", key: "F5", tip: "Ejecuta la siguiente instrucción, entrando en FORMs y métodos", action: () => act("step") },
      { icon: "stepover", label: "Ejecutar", key: "F6", tip: "Siguiente instrucción sin entrar en FORMs ni métodos", action: () => act("over") },
      { icon: "exec", label: "Continuar", key: "F8", tip: "Continúa hasta el próximo punto de parada o el final", action: () => act("run"), primary: true },
      "-",
      { icon: "cancel", label: "Finalizar", tip: "Termina el programa", action: () => act("stop") },
    ],
    update(newState, newResolve) {
      state = newState;
      resolve = newResolve;
      if (headEl) renderAll();
    },
    render(el) {
      headEl = h("div", { class: "editor-head" });
      srcEl = h("div", { class: "dbg-src" });
      varsEl = h("div", { class: "dbg-varsbox" });
      detailEl = h("div", { class: "dbg-detail" });
      syEl = h("div", { class: "dbg-syrow" });
      el.append(
        headEl,
        h(
          "div",
          { class: "dbg-grid" },
          h("div", { class: "dbg-left" }, srcEl),
          h("div", { class: "dbg-right" }, h("div", { class: "dbg-section" }, "Campos del sistema"), syEl, h("div", { class: "dbg-section" }, "Variables"), varsEl, h("div", { class: "dbg-section" }, "Detalle"), detailEl),
        ),
      );
      renderAll();
    },
    async onBack() {
      act("run");
      return true;
    },
  };
}
