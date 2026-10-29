// Diccionario del usuario: resuelve elementos de datos y dominios, y genera
// los archivos que necesita el motor para conocerlos.
import { store } from "./store.js";
import { domainToXml, dtelToXml } from "./engine/ddic.js";
import { STANDARD_TABLES } from "./engine/standard.js";

export const domains = () => (store.data.domains ||= {});
export const dtels = () => (store.data.dataElements ||= {});

export const activeDomain = (n) => domains()[String(n || "").toUpperCase()]?.active || null;
export const activeDtel = (n) => dtels()[String(n || "").toUpperCase()]?.active || null;

// tipo técnico de un elemento de datos (directo o a través de su dominio)
export function dtelTechnical(e) {
  if (!e) return null;
  if (e.domain) {
    const d = activeDomain(e.domain);
    if (!d) return null;
    return { type: d.type, length: d.length, decimals: d.decimals, domain: d.name, fixedValues: (d.values || []).filter((v) => v.low !== ""), lowercase: !!d.lowercase, valueTable: d.valueTable || "" };
  }
  return { type: e.type, length: e.length, decimals: e.decimals, domain: "", fixedValues: [], lowercase: false, valueTable: "" };
}

export function resolveField(f) {
  if (!f.dtel) return { ...f };
  const e = activeDtel(f.dtel);
  const tech = dtelTechnical(e);
  if (!tech) return { ...f, type: f.type || "CHAR", length: f.length || 10 };
  const l = e.labels || {};
  return { ...f, ...tech, description: f.description || l.medium || l.long || e.description, labels: l, dtelDescription: e.description };
}

export function resolveTable(def) {
  return { ...def, fields: def.fields.map(resolveField) };
}

export function activeTablesResolved() {
  return store.activeTables().map(resolveTable);
}

export function allTablesForEngine() {
  return [...Object.values(STANDARD_TABLES), ...activeTablesResolved()];
}

// archivos XML de dominios y elementos de datos activos
export function ddicExtraFiles() {
  const files = [];
  for (const d of Object.values(domains())) if (d.active) files.push({ filename: d.name.toLowerCase() + ".doma.xml", contents: domainToXml(d.active) });
  for (const e of Object.values(dtels())) if (e.active) files.push({ filename: e.name.toLowerCase() + ".dtel.xml", contents: dtelToXml(e.active) });
  return files;
}

// tabla activa (estándar o Z), ya resuelta
export function tableDef(name) {
  const n = String(name || "").toUpperCase();
  if (STANDARD_TABLES[n]) return STANDARD_TABLES[n];
  const t = store.table(n);
  return t?.active ? resolveTable(t.active) : null;
}

// ayuda de búsqueda (F4): valores fijos del dominio o contenido de la tabla de verificación
export function f4Values(engine, field) {
  if (!field) return null;
  if (field.fixedValues?.length) return { kind: "fixed", rows: field.fixedValues.map((v) => ({ value: v.low, text: v.text })) };
  const check = field.checkTable || field.valueTable;
  if (check) {
    const t = tableDef(check);
    if (!t) return null;
    const keys = t.fields.filter((x) => x.key && x.type !== "CLNT");
    const keyField = keys.find((k) => k.name === field.name) || keys[keys.length - 1] || keys[0];
    const textField = t.fields.find((x) => !x.key && (x.type === "CHAR" || x.type === "STRING"));
    try {
      const rows = engine.query(`SELECT * FROM "${t.name.toLowerCase()}" ORDER BY "${keyField.name.toLowerCase()}" LIMIT 500`);
      return {
        kind: "table",
        table: t.name,
        rows: rows.map((r) => ({ value: String(r[keyField.name.toLowerCase()] ?? "").trim(), text: textField ? String(r[textField.name.toLowerCase()] ?? "").trim() : "" })),
      };
    } catch {
      return null;
    }
  }
  return null;
}

// ¿el valor existe en la tabla de verificación?
export function checkForeignKey(engine, field, value) {
  const check = field.checkTable;
  if (!check || value === "" || value === null || value === undefined) return true;
  const t = tableDef(check);
  if (!t) return true;
  const keys = t.fields.filter((x) => x.key && x.type !== "CLNT");
  const keyField = keys.find((k) => k.name === field.name) || keys[keys.length - 1] || keys[0];
  try {
    return engine.query(`SELECT COUNT(*) AS c FROM "${t.name.toLowerCase()}" WHERE "${keyField.name.toLowerCase()}" = ?`, [value])[0].c > 0;
  } catch {
    return true;
  }
}
