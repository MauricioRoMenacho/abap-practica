// Repositorio de grupos de funciones y módulos de función (SE37).
import { store } from "./store.js";
import { STD_FUGR, STD_STRUCTURES } from "./engine/stdlib.js";
import { fugrFiles, fmSource } from "./engine/fugr.js";

export const PARAM_KINDS = [
  ["import", "Importación"],
  ["export", "Exportación"],
  ["changing", "Modificación"],
  ["tables", "Tablas"],
  ["exceptions", "Excepciones"],
];

export const emptyParams = () => ({ import: [], export: [], changing: [], tables: [], exceptions: [] });

export function fgroups() {
  return store.data.fgroups || {};
}

export function userModules() {
  return store.data.fmodules || {};
}

export function stdModules() {
  const out = {};
  for (const m of STD_FUGR.modules) out[m.name] = { ...m, group: STD_FUGR.name, standard: true, activeBody: m.body, activeParams: m.params };
  return out;
}

export function allModules() {
  return { ...stdModules(), ...userModules() };
}

export function moduleByName(n) {
  return allModules()[String(n || "").toUpperCase()] || null;
}

export function allGroups() {
  return { [STD_FUGR.name]: { name: STD_FUGR.name, description: STD_FUGR.description, standard: true }, ...fgroups() };
}

export function isFmActive(m) {
  return m.standard || (m.activeBody != null && m.activeBody === m.body && JSON.stringify(m.activeParams) === JSON.stringify(m.params));
}

export function fmFilename(m) {
  return `${m.group.toLowerCase()}.fugr.${m.name.toLowerCase()}.abap`;
}

export function fmFullSource(m, edited) {
  return edited ? fmSource({ name: m.name, params: m.params }, m.body) : fmSource({ name: m.name, params: m.activeParams }, m.activeBody);
}

// Fuente completa (FUNCTION ... ENDFUNCTION) -> solo el cuerpo
export function bodyFromSource(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  let start = lines.findIndex((l) => /^\s*FUNCTION\s+/i.test(l));
  if (start < 0) start = -1;
  let i = start + 1;
  while (i < lines.length && /^\s*\*"/.test(lines[i])) i++;
  let end = lines.length - 1;
  while (end >= i && !/^\s*ENDFUNCTION\s*\.?\s*$/i.test(lines[end])) end--;
  if (end < i) end = lines.length;
  return lines.slice(i, end).join("\n").replace(/\s+$/, "");
}

// Archivos abapGit de los grupos de funciones del usuario.
// override: { name, params, body } = versión grabada (no activa) de un módulo, para verificarlo.
export function userFugrFiles(override) {
  const files = [];
  const mods = Object.values(userModules());
  for (const g of Object.values(fgroups())) {
    const modules = [];
    for (const m of mods.filter((x) => x.group === g.name)) {
      if (override && override.name === m.name) modules.push({ name: m.name, description: m.description, params: override.params, body: override.body });
      else if (m.activeBody != null) modules.push({ name: m.name, description: m.description, params: m.activeParams, body: m.activeBody });
    }
    if (!modules.length && !(override && override.group === g.name)) continue;
    const top = override?.topGroup === g.name ? override.top : g.activeTop ?? g.top ?? "";
    files.push(...fugrFiles({ name: g.name, description: g.description, top, modules }));
  }
  return files;
}

export function structureNames() {
  return STD_STRUCTURES.map((s) => s.name);
}
