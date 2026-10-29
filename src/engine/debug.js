// Depurador: instrumenta el código ABAP con puntos de parada y toma
// "fotografías" de las variables para mostrarlas en la pantalla de depuración.
import * as abaplint from "@abaplint/core";

const S = abaplint.Statements;
const SKIP_NAMES = [
  "Report", "Program", "Data", "DataBegin", "DataEnd", "Type", "TypeBegin", "TypeEnd", "Constant", "ConstantBegin", "ConstantEnd",
  "Parameter", "SelectOption", "SelectionScreen", "Tables", "FieldSymbol", "ClassDefinition", "ClassImplementation", "EndClass",
  "Public", "Private", "Protected", "MethodDef", "MethodImplementation", "EndMethod", "Form", "EndForm", "Else", "ElseIf", "EndIf",
  "EndLoop", "EndDo", "EndWhile", "When", "WhenOthers", "EndCase", "Catch", "Cleanup", "EndTry", "Initialization", "StartOfSelection",
  "EndOfSelection", "AtSelectionScreen", "TopOfPage", "AtLineSelection", "LoadOfProgram", "EndSelect", "Include", "TypePools",
  "ClassData", "ClassDataBegin", "ClassDataEnd", "Interface", "EndInterface", "Aliases", "InterfaceDef", "Ranges", "Define",
  "EndOfDefinition", "Events", "ClassDefinitionLoad", "InterfaceLoad", "TypeEnum", "EndAt", "At", "StaticBegin", "StaticEnd", "Static",
];
const SKIP = SKIP_NAMES.map((n) => S[n]).filter(Boolean);

function scopeVars(scope) {
  const out = [];
  const seen = new Set();
  let s = scope;
  let scopeId = "_program";
  let first = true;
  while (s) {
    const id = s.getIdentifier();
    if (id.stype === "_global" || id.stype === "_builtin") break;
    if (first && id.stype !== "_program") scopeId = id.stype + ":" + id.sname;
    first = false;
    for (const [name, v] of Object.entries(s.getData().vars)) {
      const up = name.toUpperCase();
      if (seen.has(up) || up === "SUPER") continue;
      seen.add(up);
      if (up === "ME") {
        out.push({ name: "ME", js: "this.me" });
        continue;
      }
      let js = name.toLowerCase();
      if (js.startsWith("<")) js = js.replace("<", "fs_").replace(">", "_");
      if (!/^[a-z_][a-z0-9_$]*$/.test(js)) continue;
      // atributos de la clase: se leen desde el objeto (o la clase si es estático)
      if (id.stype === "class_implementation" || id.stype === "class_definition") js = `(this.${js} ?? this.constructor?.${js})`;
      if (/^%_/.test(name)) continue;
      out.push({ name: up, js, meta: v.getMeta() });
    }
    s = s.getParent();
  }
  return { vars: out, scopeId };
}

export function instrument(source, map, progName) {
  const filename = progName.toLowerCase() + ".prog.abap";
  const reg = new abaplint.Registry().addFile(new abaplint.MemoryFile(filename, source));
  reg.parse();
  const obj = reg.getFirstObject();
  const file = obj?.getABAPFiles()[0];
  if (!file) return { source, table: [] };
  let sp = null;
  try {
    sp = new abaplint.SyntaxLogic(reg, obj).run().spaghetti;
  } catch {
    sp = null;
  }
  const lines = source.split("\n");
  const table = [];
  const inserts = [];
  let inDef = 0;
  let prevColon = null;
  for (const st of file.getStatements()) {
    const g = st.get();
    if (g instanceof S.ClassDefinition || g instanceof S.Interface) inDef++;
    if ((g instanceof S.EndClass || g instanceof S.EndInterface) && inDef > 0) {
      inDef--;
      continue;
    }
    const colon = st.getColon?.();
    const chained = colon && prevColon && colon.getRow() === prevColon.getRow() && colon.getCol() === prevColon.getCol();
    prevColon = colon;
    if (inDef > 0 || chained) continue;
    if (g instanceof abaplint.Unknown || g instanceof abaplint.Empty || g instanceof abaplint.Comment || g instanceof abaplint.NativeSQL) continue;
    if (SKIP.some((c) => g instanceof c)) continue;
    const start = st.getStart();
    let info = { vars: [], scopeId: "_program" };
    if (sp) {
      try {
        const scope = sp.lookupPosition(start, filename);
        if (scope) info = scopeVars(scope);
      } catch {
        /* sin información de alcance */
      }
    }
    const m = map[start.getRow() - 1] || { obj: progName.toUpperCase(), line: start.getRow() };
    const isBreak = g instanceof S.Break;
    table.push({ obj: m.obj, line: m.line, scope: info.scopeId, vars: info.vars });
    const id = table.length - 1;
    if (isBreak) {
      for (const t of st.getTokens()) {
        const l = lines[t.getRow() - 1];
        lines[t.getRow() - 1] = l.substring(0, t.getCol() - 1) + " ".repeat(t.getStr().length) + l.substring(t.getCol() - 1 + t.getStr().length);
      }
    }
    inserts.push({ row: start.getRow(), col: start.getCol(), text: `WRITE '@KERNEL await globalThis.__abapDbg(${id}, (n) => eval(n)${isBreak ? ", true" : ""});'. ` });
  }
  inserts.sort((a, b) => (a.row !== b.row ? b.row - a.row : b.col - a.col));
  for (const ins of inserts) {
    const l = lines[ins.row - 1];
    lines[ins.row - 1] = l.substring(0, ins.col - 1) + ins.text + l.substring(ins.col - 1);
  }
  return { source: lines.join("\n"), table };
}

function typeLabel(v, T) {
  if (v instanceof T.Date) return "D";
  if (v instanceof T.Time) return "T";
  if (v instanceof T.Numc) return `N(${v.getLength()})`;
  if (v instanceof T.Character) return `C(${v.getLength()})`;
  if (v instanceof T.Packed) return `P(${v.getLength()}) DEC ${v.getDecimals()}`;
  if (T.Integer8 && v instanceof T.Integer8) return "INT8";
  if (v instanceof T.Integer) return "I";
  if (v instanceof T.Float) return "F";
  if (v instanceof T.String) return "STRING";
  if (T.XString && v instanceof T.XString) return "XSTRING";
  if (v instanceof T.Hex) return `X(${v.getLength()})`;
  return "";
}

function simpleValue(v) {
  try {
    const raw = v.get();
    if (typeof raw === "string") return raw.replace(/\s+$/, "");
    return String(raw);
  } catch {
    return "";
  }
}

export function snapshot(v, abap, depth = 0) {
  const T = abap.types;
  if (v === undefined || v === null) return { kind: "na" };
  try {
    if (v instanceof T.FieldSymbol) {
      const p = v.getPointer();
      return p ? { ...snapshot(p, abap, depth), fs: true } : { kind: "unassigned" };
    }
    if (v instanceof T.Structure) {
      const fields = Object.entries(v.get()).map(([k, x]) => ({ name: k.toUpperCase(), ...(depth < 2 ? snapshot(x, abap, depth + 1) : { kind: "more" }) }));
      return { kind: "struct", type: "Estructura", fields };
    }
    if (v instanceof T.Table || v instanceof T.HashedTable) {
      const rows = v.array();
      const rowType = v.getRowType();
      const isStruct = rowType instanceof T.Structure;
      const columns = isStruct ? Object.keys(rowType.get()).map((k) => k.toUpperCase()) : ["TABLE_LINE"];
      const data = rows.slice(0, 200).map((r) => {
        const x = r instanceof T.FieldSymbol || r instanceof T.DataReference ? r.getPointer() : r;
        if (isStruct && x?.get) return Object.values(x.get()).map((c) => (c instanceof T.Structure || c instanceof T.Table ? "[...]" : simpleValue(c)));
        return [x instanceof T.ABAPObject ? (x.get() ? "{O:" + (x.get().constructor?.INTERNAL_NAME || "") + "}" : "INITIAL") : simpleValue(x)];
      });
      const kind = v instanceof T.HashedTable ? "HASHED" : v.getOptions?.()?.primaryKey?.type === "SORTED" ? "SORTED" : "STANDARD";
      return { kind: "table", type: `Tabla ${kind}`, count: rows.length, columns, data };
    }
    if (v instanceof T.ABAPObject) {
      const o = v.get();
      if (!o) return { kind: "simple", type: "REF TO", value: "INITIAL" };
      return snapshotObject(o, abap, depth);
    }
    if (v instanceof T.DataReference) {
      const p = v.getPointer();
      if (!p) return { kind: "simple", type: "REF TO DATA", value: "INITIAL" };
      return depth < 2 ? { ...snapshot(p, abap, depth + 1), ref: true } : { kind: "more" };
    }
    if (typeof v === "object" && v.constructor?.INTERNAL_NAME) return snapshotObject(v, abap, depth);
    return { kind: "simple", type: typeLabel(v, T), value: simpleValue(v) };
  } catch (e) {
    return { kind: "na", error: String(e?.message || e) };
  }
}

function snapshotObject(o, abap, depth) {
  const T = abap.types;
  const cls = String(o.constructor?.INTERNAL_NAME || "").replace(/^PROG-[^-]+-/, "");
  if (depth >= 2) return { kind: "simple", type: "REF TO " + cls, value: "{O:" + cls + "}" };
  const fields = [];
  for (const [k, x] of Object.entries(o)) {
    if (k === "me" || k.startsWith("FRIENDS") || k === "INTERNAL_ID" || k === "EXTRA_CX") continue;
    if (!(x instanceof T.Character || x instanceof T.Integer || x instanceof T.Packed || x instanceof T.String || x instanceof T.Structure || x instanceof T.Table || x instanceof T.HashedTable || x instanceof T.ABAPObject || x instanceof T.Date || x instanceof T.Time || x instanceof T.Numc || x instanceof T.Float || x instanceof T.DataReference)) continue;
    fields.push({ name: k.toUpperCase().replace("$", "~"), ...snapshot(x, abap, depth + 1) });
  }
  return { kind: "struct", type: "Objeto " + cls, fields };
}
