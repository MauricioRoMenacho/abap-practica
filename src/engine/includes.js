// Expansión de INCLUDEs: inserta el código de los programas include en el
// programa principal, guardando de qué objeto y línea viene cada línea.

const INCLUDE_RE = /^(\s*)INCLUDE\s+([A-Za-z0-9_/]+)(\s+IF\s+FOUND)?\s*\.\s*(".*)?$/i;

export function findIncludes(source) {
  const out = [];
  (source || "").split("\n").forEach((line, i) => {
    const m = line.match(INCLUDE_RE);
    if (m && !/^(TYPE|STRUCTURE)$/i.test(m[2])) out.push({ name: m[2].toUpperCase(), row: i + 1, col: m[1].length + 1, ifFound: !!m[3] });
  });
  return out;
}

// resolve(name) -> { source } | { error: "inactive" } | null
export function expandIncludes(source, objName, resolve, stack = []) {
  const name = objName.toUpperCase();
  const lines = [];
  const map = [];
  const errors = [];
  const src = (source || "").split("\n");
  src.forEach((line, i) => {
    const m = line.match(INCLUDE_RE);
    if (!m || /^(TYPE|STRUCTURE)$/i.test(m[2])) {
      lines.push(line);
      map.push({ obj: name, line: i + 1 });
      return;
    }
    const inc = m[2].toUpperCase();
    const col = m[1].length + 9;
    const keep = () => {
      lines.push("");
      map.push({ obj: name, line: i + 1 });
    };
    if (inc === name || stack.includes(inc)) {
      errors.push({ obj: name, row: i + 1, col, endCol: col + inc.length, message: `El include ${inc} se incluye a sí mismo (recursión)` });
      return keep();
    }
    if (stack.length > 8) {
      errors.push({ obj: name, row: i + 1, col, endCol: col + inc.length, message: "Demasiados niveles de INCLUDE anidados" });
      return keep();
    }
    const r = resolve(inc);
    if (!r || r.error) {
      if (!m[3]) {
        const message =
          r?.error === "inactive"
            ? `El include ${inc} no está activo. Actívelo (Ctrl+F3)`
            : r?.error === "notinclude"
              ? `${inc} no es un programa de tipo include`
              : `El include ${inc} no existe (doble clic sobre el nombre para crearlo)`;
        errors.push({ obj: name, row: i + 1, col, endCol: col + inc.length, message });
      }
      return keep();
    }
    const sub = expandIncludes(r.source, inc, resolve, [...stack, name]);
    if (sub.lines.length === 0) return keep();
    lines.push(...sub.lines);
    map.push(...sub.map);
    errors.push(...sub.errors);
  });
  return { source: lines.join("\n"), lines, map, errors };
}

// todos los includes (recursivo) usados por un programa
export function collectIncludes(source, getSource, seen = new Set()) {
  for (const inc of findIncludes(source)) {
    if (seen.has(inc.name)) continue;
    const s = getSource(inc.name);
    if (s === null || s === undefined) continue;
    seen.add(inc.name);
    collectIncludes(s, getSource, seen);
  }
  return seen;
}
