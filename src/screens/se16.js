// SE16 - Browser de datos: buscar, ver, crear, modificar y borrar registros.
import { h, dialog, confirm, input, field } from "../ui.js";
import { store } from "../store.js";
import { findTable } from "./se11.js";
import { formatCell } from "./alv.js";
import { DDIC_TYPES } from "../engine/ddic.js";
import { STANDARD_TABLES } from "../engine/standard.js";
import { tableDef, f4Values, checkForeignKey } from "../ddic-repo.js";
import { pickFrom } from "./se11.js";

const KIND = { CHAR: "C", CLNT: "C", CUKY: "C", UNIT: "C", LANG: "C", STRING: "C", NUMC: "N", INT1: "I", INT2: "I", INT4: "I", DEC: "P", CURR: "P", QUAN: "P", DATS: "D", TIMS: "T", FLTP: "F" };

function colInfo(f) {
  return { kind: KIND[f.type] || "C", decimals: Number(f.decimals) || 0 };
}

function activeDef(n) {
  return tableDef(n);
}

export function toDb(f, raw) {
  const t = DDIC_TYPES[f.type];
  let s = String(raw ?? "").trim();
  switch (f.type) {
    case "CLNT":
      return { value: "100" };
    case "NUMC":
      if (s === "") s = "0";
      if (!/^\d+$/.test(s)) return { error: `${f.name}: introduzca solo dígitos` };
      if (s.length > f.length) return { error: `${f.name}: máximo ${f.length} dígitos` };
      return { value: s.padStart(f.length, "0") };
    case "INT1":
    case "INT2":
    case "INT4":
      if (s === "") return { value: 0 };
      if (!/^-?\d+$/.test(s.replace(/[,.](?=\d{3}\b)/g, ""))) return { error: `${f.name}: introduzca un número entero` };
      return { value: Number(s.replace(/[,.](?=\d{3}\b)/g, "")) };
    case "DEC":
    case "CURR":
    case "QUAN":
    case "FLTP": {
      if (s === "") return { value: 0 };
      const norm = store.data.settings.decimalNotation === " " ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
      if (!/^-?\d*(\.\d+)?$/.test(norm)) return { error: `${f.name}: introduzca un número` };
      const [i, d = ""] = norm.replace("-", "").split(".");
      if (f.type !== "FLTP") {
        if (d.length > (Number(f.decimals) || 0)) return { error: `${f.name}: máximo ${f.decimals || 0} decimales` };
        if (i.length > f.length - (Number(f.decimals) || 0)) return { error: `${f.name}: número demasiado grande` };
      }
      return { value: Number(norm) };
    }
    case "DATS": {
      if (s === "") return { value: "00000000" };
      let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
      let v = null;
      if (m) v = m[3] + m[2].padStart(2, "0") + m[1].padStart(2, "0");
      else if (/^\d{8}$/.test(s)) v = s;
      if (!v) return { error: `${f.name}: fecha no válida (DD.MM.AAAA)` };
      const d = new Date(+v.substring(0, 4), +v.substring(4, 6) - 1, +v.substring(6, 8));
      if (d.getMonth() + 1 !== +v.substring(4, 6)) return { error: `${f.name}: la fecha no existe` };
      return { value: v };
    }
    case "TIMS": {
      if (s === "") return { value: "000000" };
      const v = s.replace(/:/g, "");
      if (!/^\d{4,6}$/.test(v)) return { error: `${f.name}: hora no válida (HH:MM:SS)` };
      return { value: v.padEnd(6, "0") };
    }
    default:
      if (t?.fixedLen && s.length > t.fixedLen) return { error: `${f.name}: máximo ${t.fixedLen} caracteres` };
      if (f.type === "CHAR" && s.length > f.length) return { error: `${f.name}: máximo ${f.length} caracteres` };
      if (["CUKY", "UNIT", "LANG"].includes(f.type)) s = s.toUpperCase();
      return { value: s };
  }
}

function toInput(f, v) {
  if (v === null || v === undefined) return "";
  const c = colInfo(f);
  if (c.kind === "D") return v === "00000000" ? "" : formatCell(v, c);
  if (c.kind === "T") return formatCell(v, c);
  if (c.kind === "P") return formatCell(v, c, store.data.settings.decimalNotation);
  return String(v).replace(/\s+$/, "");
}

export function se16Screen(app) {
  let nameInput;
  const go = () => {
    const n = nameInput.value.trim().toUpperCase();
    if (!n) return app.status("Indique un nombre de tabla", "E");
    const f = findTable(n);
    if (!f) return app.status(`La tabla ${n} no existe`, "E");
    if (!activeDef(n)) return app.status(`La tabla ${n} no está activa (actívela en SE11)`, "E");
    store.data.lastTable = n;
    store.save();
    app.push(se16SelScreen(app, n));
  };
  return {
    id: "SE16",
    tcode: "SE16",
    title: "Data Browser: Acceso",
    toolbar: () => [{ icon: "table", label: "Contenido tabla", key: "F7", action: go }],
    onEnter: go,
    render(el) {
      nameInput = input({ maxlength: 16, value: store.data.lastTable || "", class: "sap-input upper w-20", autofocus: true, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
      const groups = {};
      for (const t of Object.values(STANDARD_TABLES)) (groups[t.area || "Otros"] ||= []).push(t);
      const mine = store.tables().filter((t) => t.active);
      const chip = (t) => h("button", { class: "chip", title: t.description, onclick: () => { nameInput.value = t.name; go(); } }, t.name);
      el.append(
        h(
          "div",
          { class: "panel narrow" },
          field("Nombre de tabla", nameInput, { required: true }),
          h(
            "div",
            { class: "table-groups" },
            mine.length ? h("div", { class: "tg-row" }, h("span", { class: "tg-label" }, "Mis tablas"), h("div", { class: "chips" }, mine.map(chip))) : null,
            Object.entries(groups).map(([area, list]) => h("div", { class: "tg-row" }, h("span", { class: "tg-label" }, area), h("div", { class: "chips" }, list.map(chip)))),
          ),
        ),
      );
    },
  };
}

function se16SelScreen(app, n) {
  const def = activeDef(n);
  const inputs = {};
  let maxInput;
  const execute = (countOnly) => {
    const where = [];
    const params = [];
    for (const f of def.fields) {
      if (f.type === "CLNT" || f.type === "STRING") continue;
      const lo = inputs[f.name].lo.value.trim();
      const hi = inputs[f.name].hi.value.trim();
      if (!lo && !hi) continue;
      const col = `"${f.name.toLowerCase()}"`;
      if (lo && /[*+]/.test(lo) && !hi) {
        where.push(`${col} LIKE ?`);
        params.push(lo.replace(/\*/g, "%").replace(/\+/g, "_"));
        continue;
      }
      const a = toDb(f, lo);
      if (a.error) return app.status(a.error, "E");
      if (hi) {
        const b = toDb(f, hi);
        if (b.error) return app.status(b.error, "E");
        where.push(`${col} BETWEEN ? AND ?`);
        params.push(a.value, b.value);
      } else {
        where.push(`${col} = ?`);
        params.push(a.value);
      }
    }
    const w = where.length ? " WHERE " + where.join(" AND ") : "";
    if (countOnly) {
      const r = app.engine.query(`SELECT COUNT(*) AS c FROM "${n.toLowerCase()}"${w}`, params);
      dialog({ title: "Número de entradas", icon: "info", body: `Número de entradas que cumplen los criterios de selección: ${r[0].c}` });
      return;
    }
    const max = Number(maxInput.value) || 200;
    const keys = def.fields.filter((f) => f.key).map((f) => `"${f.name.toLowerCase()}"`);
    app.push(se16DataScreen(app, n, { where: w, params, max, order: keys.join(", ") }));
  };
  return {
    id: "SE16-SEL",
    tcode: "SE16",
    title: () => `Data Browser: Tabla ${n}: Pantalla de selección`,
    toolbar: () => [
      { icon: "exec", label: "Ejecutar", key: "F8", action: () => execute(false), primary: true },
      { icon: "count", label: "Número de entradas", action: () => execute(true) },
    ],
    onEnter: () => execute(false),
    render(el) {
      maxInput = h("input", { class: "sap-input num", value: "200", style: { width: "8ch" } });
      el.append(
        h(
          "div",
          { class: "panel" },
          h("p", { class: "muted" }, def.description),
          h(
            "div",
            { class: "sel-root" },
            def.fields
              .filter((f) => f.type !== "CLNT" && f.type !== "STRING")
              .map((f) => {
                const w = Math.min(Math.max(f.type === "DATS" ? 11 : f.type === "TIMS" ? 9 : Number(f.length) || 10, 4), 30) + 1 + "ch";
                inputs[f.name] = { lo: h("input", { class: "sap-input", style: { width: w } }), hi: h("input", { class: "sap-input", style: { width: w } }) };
                return h("div", { class: "sel-row" }, h("label", { class: "sel-label", title: f.description }, f.name), inputs[f.name].lo, h("span", { class: "sel-a" }, "a"), inputs[f.name].hi);
              }),
            h("div", { class: "sel-skip" }),
            h("div", { class: "sel-row" }, h("label", { class: "sel-label" }, "Nº máx. aciertos"), maxInput),
          ),
          h("p", { class: "hint" }, "Deja los campos vacíos para ver todo. Usa * como comodín (ej.: L* ) o 'desde - a' para rangos."),
        ),
      );
    },
  };
}

export function se16DataScreen(app, n, q = {}) {
  const def = activeDef(n);
  const fields = def.fields;
  let rows = [];
  let sel = new Set();
  let gridEl;
  let headEl;
  const isStd = !!findTable(n)?.standard;
  const load = () => {
    const max = q.max || 200;
    const order = q.order || fields.filter((f) => f.key).map((f) => `"${f.name.toLowerCase()}"`).join(", ");
    rows = app.engine.query(`SELECT * FROM "${n.toLowerCase()}"${q.where || ""}${order ? " ORDER BY " + order : ""} LIMIT ${max}`, q.params || []);
    sel = new Set();
  };
  const keyOf = (r) => fields.filter((f) => f.key).map((f) => r[f.name.toLowerCase()]);
  const render = () => {
    headEl.replaceChildren(h("span", { class: "eh-label" }, "Tabla:"), h("b", {}, n), h("span", { class: "eh-label" }, "Entradas visualizadas:"), h("b", {}, rows.length), isStd ? h("span", { class: "muted small" }, "(tabla estándar: los cambios se pueden revertir en Sistema → Restaurar datos de las tablas estándar)") : null);
    const table = h(
      "table",
      { class: "alv striped optimize" },
      h("thead", {}, h("tr", {}, h("th", { class: "rowsel" }), fields.map((f) => h("th", { class: (f.key ? "key " : "") + (["P", "I", "F"].includes(colInfo(f).kind) ? "num" : ""), title: f.description }, f.name)))),
      h(
        "tbody",
        {},
        rows.map((r, i) =>
          h(
            "tr",
            { class: sel.has(i) ? "selrow" : "", ondblclick: () => edit(i, "show") },
            h("td", { class: "rowsel", onclick: () => { sel.has(i) ? sel.delete(i) : sel.add(i); render(); } }),
            fields.map((f) => {
              const c = colInfo(f);
              return h("td", { class: (f.key ? "key " : "") + (["P", "I", "F"].includes(c.kind) ? "num" : "") }, formatCell(r[f.name.toLowerCase()], c, store.data.settings.decimalNotation));
            }),
          ),
        ),
      ),
    );
    gridEl.replaceChildren(table);
    if (!rows.length) gridEl.append(h("div", { class: "alv-empty" }, "No hay entradas en la tabla para estos criterios de selección"));
  };

  const edit = async (idx, mode) => {
    const r = idx === null ? null : rows[idx];
    const ins = {};
    const ro = mode === "show";
    const form = h(
      "div",
      { class: "form-grid entry" },
      fields.map((f) => {
        const isKeyLocked = (mode === "change" && f.key) || f.type === "CLNT";
        const val = r ? toInput(f, r[f.name.toLowerCase()]) : f.type === "CLNT" ? "100" : "";
        const el =
          f.type === "STRING"
            ? h("textarea", { class: "sap-input", rows: 2, readonly: ro })
            : h("input", { class: "sap-input" + (["P", "I", "F"].includes(colInfo(f).kind) ? " num" : ""), value: val, readonly: ro || isKeyLocked, placeholder: f.type === "DATS" ? "DD.MM.AAAA" : f.type === "TIMS" ? "HH:MM:SS" : "", maxlength: f.type === "CHAR" ? f.length : undefined });
        if (f.type === "STRING") el.value = val;
        ins[f.name] = el;
        // F4: valores fijos del dominio o tabla de verificación
        const hasF4 = !ro && !isKeyLocked && (f.fixedValues?.length || f.checkTable || f.valueTable);
        const openF4 = async () => {
          const r = f4Values(app.engine, f);
          if (!r || !r.rows.length) return app.status("No hay valores posibles para este campo", "W");
          const chosen = await pickFrom(`${f.name}: valores posibles` + (r.table ? ` (${r.table})` : ""), r.rows.map((x) => [x.value, x.text]));
          if (chosen !== null) el.value = chosen;
        };
        if (hasF4) el.addEventListener("keydown", (e) => { if (e.key === "F4") { e.preventDefault(); e.stopPropagation(); openF4(); } });
        const ctl = hasF4 ? h("div", { class: "row", style: { margin: 0, flexWrap: "nowrap" } }, el, h("button", { class: "btn f4", title: "Valores posibles (F4)", onclick: (e) => { e.preventDefault(); openF4(); } }, "F4")) : el;
        return [h("label", { class: f.key ? "required" : "", title: f.description }, f.name, h("span", { class: "muted small" }, " " + (f.description || ""))), ctl];
      }),
    );
    const title = mode === "show" ? `Tabla ${n}: Visualizar entrada` : mode === "change" ? `Tabla ${n}: Modificar entrada` : `Tabla ${n}: Crear entrada`;
    for (;;) {
      const ok = await dialog({
        title,
        width: "620px",
        body: form,
        buttons: ro
          ? [{ label: "Cerrar", value: false, primary: true }]
          : [
              { label: "Grabar", value: true, primary: true },
              { label: "Cancelar", value: false },
            ],
      });
      if (!ok || ro) return;
      const values = {};
      let err = null;
      for (const f of fields) {
        const c = toDb(f, ins[f.name].value);
        if (c.error) {
          err = c.error;
          break;
        }
        let v = c.value;
        if (typeof v === "string" && f.domain && !f.lowercase) v = v.toUpperCase();
        // valores fijos del dominio
        if (f.fixedValues?.length && v !== "" && !f.fixedValues.some((x) => x.low === v)) {
          err = `${f.name}: el valor "${v}" no está en el ámbito de valores del dominio ${f.domain} (pulse F4 para ver los valores posibles)`;
          break;
        }
        // clave externa: el valor debe existir en la tabla de verificación
        if (f.checkTable && v !== "" && !checkForeignKey(app.engine, f, v)) {
          err = `${f.name}: la entrada "${v}" no existe en la tabla de verificación ${f.checkTable} (pulse F4)`;
          break;
        }
        values[f.name.toLowerCase()] = v;
      }
      if (err) {
        app.status(err, "E");
        await dialog({ title: "Error", icon: "error", body: err });
        continue;
      }
      try {
        const cols = Object.keys(values);
        if (mode === "change") {
          const keyCols = fields.filter((f) => f.key).map((f) => f.name.toLowerCase());
          const setCols = cols.filter((c) => !keyCols.includes(c));
          app.engine.exec(`UPDATE "${n.toLowerCase()}" SET ${setCols.map((c) => `"${c}" = ?`).join(", ")} WHERE ${keyCols.map((c) => `"${c}" = ?`).join(" AND ")}`, [...setCols.map((c) => values[c]), ...keyOf(r)]);
          app.status("Registro modificado", "S");
        } else {
          app.engine.exec(`INSERT INTO "${n.toLowerCase()}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`, cols.map((c) => values[c]));
          app.status("Se ha insertado una entrada en la base de datos", "S");
        }
      } catch (e) {
        if (/UNIQUE|PRIMARY/i.test(e.message)) {
          await dialog({ title: "Error", icon: "error", body: "Ya existe una entrada con la misma clave" });
          continue;
        }
        app.status("Error de base de datos: " + e.message, "E");
        return;
      }
      app.engine.persist();
      store.save();
      load();
      render();
      return;
    }
  };

  const selected = () => {
    if (sel.size === 0) {
      app.status("Seleccione una línea (clic en el cuadro a la izquierda)", "W");
      return null;
    }
    return [...sel];
  };

  return {
    id: "SE16-DATA",
    tcode: "SE16",
    cls: "alv-screen",
    title: () => `Data Browser: Tabla ${n}`,
    toolbar: () => [
      { icon: "display", tip: "Visualizar", action: () => { const s = selected(); if (s) edit(s[0], "show"); } },
      { icon: "change", tip: "Modificar", action: () => { const s = selected(); if (s) edit(s[0], "change"); } },
      { icon: "create", label: "Crear entrada", action: () => edit(null, "create"), primary: true },
      {
        icon: "delete",
        tip: "Borrar",
        action: async () => {
          const s = selected();
          if (!s) return;
          if (!(await confirm(`¿Borrar ${s.length} entrada(s)?`, "Borrar", "Borrar", "Cancelar"))) return;
          const keyCols = fields.filter((f) => f.key).map((f) => f.name.toLowerCase());
          for (const i of s) app.engine.exec(`DELETE FROM "${n.toLowerCase()}" WHERE ${keyCols.map((c) => `"${c}" = ?`).join(" AND ")}`, keyOf(rows[i]));
          app.engine.persist();
          store.save();
          app.status(`${s.length} entrada(s) borrada(s)`, "S");
          load();
          render();
        },
      },
      "-",
      { icon: "refresh", tip: "Actualizar", action: () => { load(); render(); } },
    ],
    render(el) {
      headEl = h("div", { class: "editor-head" });
      gridEl = h("div", { class: "alv-wrap" });
      el.append(headEl, gridEl);
      load();
      render();
    },
    resumed() {},
  };
}
