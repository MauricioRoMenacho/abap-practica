// ALV grid (CL_SALV_TABLE) a pantalla completa.
import { h, dialog, download } from "../ui.js";
import { formatDate, formatTime, formatNumber } from "../engine/output.js";

const NUMERIC = new Set(["I", "P", "F", "INT8"]);

export function formatCell(v, col, notation) {
  if (v === null || v === undefined) return "";
  switch (col.kind) {
    case "D":
      return v === "00000000" || v === "" ? "" : formatDate(v);
    case "T":
      return formatTime(v);
    case "P":
      return formatNumber(v, col.decimals || 0, notation);
    case "I":
    case "INT8":
      return formatNumber(v, 0, notation);
    case "F":
      return String(v);
    default:
      return String(v);
  }
}

export function alvScreen(app, snap, progTitle, onClose) {
  const notation = snap.decimalNotation ?? "X";
  const cols = snap.columns.map((c, i) => ({ ...c, idx: i }));
  let visible = cols.filter((c) => !c.hidden);
  let sorts = snap.sorts.map((s) => ({ ...s }));
  let totals = new Set(snap.aggregations.map((a) => a.name));
  const aggType = Object.fromEntries(snap.aggregations.map((a) => [a.name, a.type]));
  let filters = []; // {name, text}
  let selCol = null;
  let selRow = null;
  let gridEl;
  let infoEl;
  const hasFunctions = snap.allFunctions || snap.defaultFunctions;

  const colByName = (n) => cols.find((c) => c.name === n);

  const currentRows = () => {
    let rows = snap.rows.map((r, i) => ({ r, i }));
    for (const f of filters) {
      const c = colByName(f.name);
      const t = f.text.toUpperCase();
      rows = rows.filter(({ r }) => {
        const val = r[c.idx];
        if (f.op === "eq") return String(formatCell(val, c, notation)).toUpperCase() === t || String(val).toUpperCase() === t;
        return String(formatCell(val, c, notation)).toUpperCase().includes(t) || String(val).toUpperCase().includes(t);
      });
    }
    if (sorts.length) {
      rows.sort((a, b) => {
        for (const s of sorts) {
          const c = colByName(s.name);
          if (!c) continue;
          let x = a.r[c.idx];
          let y = b.r[c.idx];
          if (NUMERIC.has(c.kind)) {
            x = Number(x);
            y = Number(y);
          } else {
            x = String(x);
            y = String(y);
          }
          if (x < y) return s.down ? 1 : -1;
          if (x > y) return s.down ? -1 : 1;
        }
        return a.i - b.i;
      });
    }
    return rows.map((x) => x.r);
  };

  const aggregate = (rows, c) => {
    const vals = rows.map((r) => Number(r[c.idx]) || 0);
    const t = aggType[c.name] ?? 1;
    if (!vals.length) return 0;
    if (t === 2) return Math.min(...vals);
    if (t === 3) return Math.max(...vals);
    if (t === 4) return vals.reduce((a, b) => a + b, 0) / vals.length;
    return vals.reduce((a, b) => a + b, 0);
  };

  const render = () => {
    const rows = currentRows();
    infoEl.textContent = `${rows.length} registro(s)` + (filters.length ? ` · filtro activo` : "") + (sorts.length ? ` · ordenado por ${sorts.map((s) => colByName(s.name)?.label || s.name).join(", ")}` : "");
    if (snap.listDisplay) {
      renderList(rows);
      return;
    }
    const table = h("table", { class: "alv" + (snap.striped ? " striped" : "") + (snap.optimize ? " optimize" : "") });
    const thead = h(
      "tr",
      {},
      h("th", { class: "rowsel" }),
      visible.map((c) => {
        const s = sorts.find((x) => x.name === c.name);
        return h(
          "th",
          {
            class: (c.keyField ? "key " : "") + (selCol === c.name ? "sel " : "") + (NUMERIC.has(c.kind) ? "num" : ""),
            style: !snap.optimize ? { width: Math.max(c.outlen || c.length || 10, c.label.length / 1.5, 4) + 2 + "ch" } : undefined,
            title: `${c.label} (${c.name})`,
            onclick: () => {
              selCol = selCol === c.name ? null : c.name;
              render();
            },
          },
          c.label,
          s ? h("span", { class: "sort-ind" }, s.down ? " ▼" : " ▲") : null,
          totals.has(c.name) ? h("span", { class: "sum-ind" }, " Σ") : null,
        );
      }),
    );
    const tbody = h("tbody");
    const subtotalCol = sorts.find((s) => s.subtotal)?.name;
    let groupStart = 0;
    const pushSubtotal = (from, to, key) => {
      if (!totals.size) return;
      const part = rows.slice(from, to);
      tbody.append(
        h(
          "tr",
          { class: "subtotal" },
          h("td", { class: "rowsel" }, "·"),
          visible.map((c) => h("td", { class: NUMERIC.has(c.kind) ? "num" : "" }, totals.has(c.name) ? formatCell(aggregate(part, c), c, notation) : c.name === subtotalCol ? key : "")),
        ),
      );
    };
    rows.forEach((r, i) => {
      if (subtotalCol && i > 0) {
        const c = colByName(subtotalCol);
        if (r[c.idx] !== rows[i - 1][c.idx]) {
          pushSubtotal(groupStart, i, formatCell(rows[i - 1][c.idx], c, notation));
          groupStart = i;
        }
      }
      tbody.append(
        h(
          "tr",
          {
            class: selRow === r ? "selrow" : "",
            ondblclick: () => detail(r),
          },
          h("td", { class: "rowsel", onclick: () => { selRow = selRow === r ? null : r; render(); } }),
          visible.map((c) => h("td", { class: (NUMERIC.has(c.kind) ? "num " : "") + (c.keyField ? "key " : "") + (selCol === c.name ? "sel" : "") }, formatCell(r[c.idx], c, notation))),
        ),
      );
    });
    if (subtotalCol && rows.length) {
      const c = colByName(subtotalCol);
      pushSubtotal(groupStart, rows.length, formatCell(rows[rows.length - 1][c.idx], c, notation));
    }
    if (totals.size && rows.length) {
      tbody.append(
        h(
          "tr",
          { class: "total" },
          h("td", { class: "rowsel" }, "Σ"),
          visible.map((c) => h("td", { class: NUMERIC.has(c.kind) ? "num" : "" }, totals.has(c.name) ? formatCell(aggregate(rows, c), c, notation) : "")),
        ),
      );
    }
    table.append(h("thead", {}, thead), tbody);
    gridEl.replaceChildren(table);
    if (!rows.length) gridEl.append(h("div", { class: "alv-empty" }, "No hay datos para visualizar"));
  };

  const renderList = (rows) => {
    const widths = visible.map((c) => Math.max(c.label.length, ...rows.map((r) => formatCell(r[c.idx], c, notation).length), 1));
    const line = (vals) => "|" + vals.map((v, i) => (NUMERIC.has(visible[i].kind) ? String(v).padStart(widths[i]) : String(v).padEnd(widths[i]))).join("|") + "|";
    const sep = "-".repeat(widths.reduce((a, b) => a + b + 1, 1));
    const out = [sep, line(visible.map((c) => c.label)), sep, ...rows.map((r) => line(visible.map((c) => formatCell(r[c.idx], c, notation)))), sep];
    gridEl.replaceChildren(h("pre", { class: "list-out" }, out.join("\n")));
  };

  const needCol = () => {
    if (!selCol) {
      app.status("Seleccione primero una columna (clic en su cabecera)", "W");
      return null;
    }
    return colByName(selCol);
  };

  const detail = (r) => {
    const row = r || selRow;
    if (!row) return app.status("Seleccione una fila (clic a la izquierda de la fila) o haga doble clic", "W");
    dialog({
      title: "Detalle",
      width: "560px",
      body: h(
        "table",
        { class: "kv detail" },
        h("tr", {}, h("th", {}, "Columna"), h("th", {}, "Valor")),
        cols.map((c) => h("tr", {}, h("td", {}, c.label, h("span", { class: "muted small" }, ` ${c.name}`)), h("td", { class: NUMERIC.has(c.kind) ? "num" : "" }, formatCell(row[c.idx], c, notation)))),
      ),
    });
  };

  const exportCsv = () => {
    const rows = currentRows();
    const q = (s) => {
      s = String(s ?? "");
      return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [visible.map((c) => q(c.label)).join(";"), ...rows.map((r) => visible.map((c) => q(formatCell(r[c.idx], c, notation))).join(";"))].join("\r\n");
    download(`${(snap.header || progTitle || "alv").replace(/[^\w\- ]+/g, "").trim() || "alv"}.csv`, "﻿" + csv, "text/csv");
    app.status(`Se exportaron ${rows.length} registro(s) a hoja de cálculo (CSV)`, "S");
  };

  const filter = async () => {
    const c = needCol();
    if (!c) return;
    const inp = h("input", { class: "sap-input", value: filters.find((f) => f.name === c.name)?.text || "" });
    const v = await dialog({
      title: `Filtrar: ${c.label}`,
      body: h("div", {}, h("label", { class: "sap-label" }, "Valor (contiene)"), inp),
      buttons: [
        { label: "Aplicar", value: () => inp.value, primary: true },
        { label: "Cancelar", value: null },
      ],
    });
    if (v === null || v === undefined) return;
    filters = filters.filter((f) => f.name !== c.name);
    if (v.trim()) filters.push({ name: c.name, text: v.trim() });
    render();
  };

  const chooseColumns = async () => {
    const checks = cols.map((c) => ({ c, el: h("input", { type: "checkbox", checked: visible.includes(c) }) }));
    const ok = await dialog({
      title: "Modificar layout",
      body: h(
        "div",
        { class: "col-chooser" },
        checks.map(({ c, el }) => h("label", { class: "radio" }, el, `${c.label} `, h("span", { class: "muted small" }, c.name))),
      ),
      buttons: [
        { label: "Aceptar", value: true, primary: true },
        { label: "Cancelar", value: false },
      ],
    });
    if (!ok) return;
    visible = checks.filter((x) => x.el.checked).map((x) => x.c);
    render();
  };

  const sortBy = (down) => {
    const c = needCol();
    if (!c) return;
    sorts = [{ name: c.name, down, subtotal: false }];
    render();
  };

  const toggleTotal = () => {
    const c = needCol();
    if (!c) return;
    if (!NUMERIC.has(c.kind)) return app.status("Solo se pueden totalizar columnas numéricas", "W");
    if (totals.has(c.name)) totals.delete(c.name);
    else totals.add(c.name);
    render();
  };

  const subtotal = () => {
    const c = needCol();
    if (!c) return;
    if (!totals.size) return app.status("Primero calcule un total (Σ) sobre una columna numérica", "W");
    sorts = [{ name: c.name, down: false, subtotal: true }];
    render();
  };

  return {
    id: "ALV",
    tcode: "SE38",
    cls: "alv-screen",
    title: () => snap.header || progTitle,
    toolbar: () =>
      hasFunctions && !snap.listDisplay
        ? [
            { icon: "detail", tip: "Detalle", action: () => detail() },
            "-",
            { icon: "sortup", tip: "Orden ascendente", action: () => sortBy(false) },
            { icon: "sortdown", tip: "Orden descendente", action: () => sortBy(true) },
            { icon: "filter", tip: "Fijar filtro", action: filter },
            filters.length ? { icon: "nofilter", tip: "Borrar filtros", action: () => { filters = []; render(); } } : null,
            "-",
            { icon: "sum", tip: "Total (Σ)", action: toggleTotal },
            snap.allFunctions ? { icon: "subtotal", tip: "Subtotales", action: subtotal } : null,
            "-",
            snap.allFunctions ? { icon: "layout", tip: "Modificar layout (columnas)", action: chooseColumns } : null,
            { icon: "excel", tip: "Hoja de cálculo (exportar CSV)", action: exportCsv },
            { icon: "print", tip: "Imprimir / PDF", action: () => window.print() },
          ].filter(Boolean)
        : [],
    render(el) {
      infoEl = h("div", { class: "alv-info" });
      gridEl = h("div", { class: "alv-wrap" });
      el.append(gridEl, infoEl);
      render();
      if (!hasFunctions) app.status("ALV sin barra de funciones. Tip: lo_alv->get_functions( )->set_all( abap_true ).", "I");
    },
    async onBack() {
      app.stack.pop();
      app.show(app.current());
      onClose();
      return true;
    },
  };
}
