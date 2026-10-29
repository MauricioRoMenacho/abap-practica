// Diccionario de datos (SE11): tipos predefinidos y conversión a XML abapGit
// para que el transpilador conozca las tablas transparentes.

export const DDIC_TYPES = {
  CLNT: { label: "Mandante", int: "C", fixedLen: 3 },
  CHAR: { label: "Texto (caracteres)", int: "C", needsLen: true, maxLen: 1333 },
  NUMC: { label: "Texto numérico", int: "N", needsLen: true, maxLen: 255 },
  INT1: { label: "Entero 1 byte", int: "b", fixedLen: 3, intLen: 1 },
  INT2: { label: "Entero 2 bytes", int: "s", fixedLen: 5, intLen: 2 },
  INT4: { label: "Entero 4 bytes", int: "X", fixedLen: 10, intLen: 4 },
  DEC: { label: "Número empaquetado", int: "P", needsLen: true, decimals: true, maxLen: 31 },
  CURR: { label: "Importe moneda", int: "P", needsLen: true, decimals: true, maxLen: 31 },
  QUAN: { label: "Cantidad", int: "P", needsLen: true, decimals: true, maxLen: 31 },
  CUKY: { label: "Clave de moneda", int: "C", fixedLen: 5 },
  UNIT: { label: "Unidad de medida", int: "C", fixedLen: 3 },
  LANG: { label: "Idioma", int: "C", fixedLen: 1 },
  DATS: { label: "Fecha AAAAMMDD", int: "D", fixedLen: 8 },
  TIMS: { label: "Hora HHMMSS", int: "T", fixedLen: 6 },
  FLTP: { label: "Coma flotante", int: "F", fixedLen: 16, intLen: 8 },
  STRING: { label: "String (longitud variable)", int: "g", fixedLen: 0, intLen: 8, ddic: "STRG" },
};

function pad(n, l = 6) {
  return String(n).padStart(l, "0");
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function fieldLength(f) {
  const t = DDIC_TYPES[f.type];
  if (!t) return 0;
  if (t.fixedLen !== undefined) return t.fixedLen;
  return Number(f.length) || 1;
}

function intLen(f) {
  const t = DDIC_TYPES[f.type];
  const len = fieldLength(f);
  if (t.intLen) return t.intLen;
  switch (t.int) {
    case "C":
    case "N":
    case "D":
    case "T":
      return len * 2;
    case "P":
      return Math.floor(len / 2) + 1;
    default:
      return len;
  }
}

export function tableToXml(def) {
  const fields = def.fields
    .map((f, i) => {
      const t = DDIC_TYPES[f.type];
      const dec = t.decimals ? `<DECIMALS>${pad(Number(f.decimals) || 0)}</DECIMALS>` : "";
      return `    <DD03P><FIELDNAME>${esc(f.name.toUpperCase())}</FIELDNAME><POSITION>${pad(i + 1, 4)}</POSITION>${f.key ? "<KEYFLAG>X</KEYFLAG>" : ""}<INTTYPE>${t.int}</INTTYPE><INTLEN>${pad(intLen(f))}</INTLEN>${f.key ? "<NOTNULL>X</NOTNULL>" : ""}<DATATYPE>${t.ddic || f.type}</DATATYPE><LENG>${pad(fieldLength(f))}</LENG>${dec}<DDTEXT>${esc(f.description)}</DDTEXT></DD03P>`;
    })
    .join("\n");
  const clidep = def.fields.some((f) => f.type === "CLNT") ? "<CLIDEP>X</CLIDEP>" : "";
  return `<?xml version="1.0" encoding="utf-8"?>
<abapGit version="v1.0.0" serializer="LCL_OBJECT_TABL" serializer_version="v1.0.0">
 <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
   <DD02V><TABNAME>${esc(def.name.toUpperCase())}</TABNAME><DDLANGUAGE>S</DDLANGUAGE><TABCLASS>TRANSP</TABCLASS>${clidep}<DDTEXT>${esc(def.description)}</DDTEXT><CONTFLAG>${def.deliveryClass || "A"}</CONTFLAG></DD02V>
   <DD03P_TABLE>
${fields}
   </DD03P_TABLE>
  </asx:values>
 </asx:abap>
</abapGit>`;
}

// Validación de una definición de tabla antes de activarla
export function validateTable(def) {
  const errors = [];
  if (!/^[YZ][A-Z0-9_]{1,15}$/i.test(def.name)) {
    errors.push("El nombre debe empezar por Z o Y y tener máximo 16 caracteres (letras, números, _).");
  }
  if (!def.description?.trim()) errors.push("Falta la descripción breve de la tabla.");
  if (def.fields.length === 0) errors.push("La tabla no tiene campos.");
  const seen = new Set();
  let keyEnded = false;
  def.fields.forEach((f, i) => {
    const n = (f.name || "").toUpperCase();
    const pos = `Campo ${i + 1}`;
    if (!/^[A-Z][A-Z0-9_]{0,29}$/.test(n)) errors.push(`${pos}: nombre "${f.name}" no válido.`);
    if (seen.has(n)) errors.push(`${pos}: el campo ${n} está repetido.`);
    seen.add(n);
    const t = DDIC_TYPES[f.type];
    if (!t) errors.push(`${pos} (${n}): tipo de datos "${f.type}" no válido.`);
    else if (t.needsLen) {
      const l = Number(f.length);
      if (!l || l < 1 || l > t.maxLen) errors.push(`${pos} (${n}): longitud entre 1 y ${t.maxLen}.`);
      if (t.decimals && (Number(f.decimals) || 0) >= l) errors.push(`${pos} (${n}): los decimales deben ser menores que la longitud.`);
    }
    if (f.key && keyEnded) errors.push(`${pos} (${n}): los campos clave deben ir al inicio de la tabla.`);
    if (!f.key) keyEnded = true;
    if (f.key && f.type === "STRING") errors.push(`${pos} (${n}): un STRING no puede ser campo clave.`);
  });
  if (!def.fields.some((f) => f.key)) errors.push("La tabla necesita al menos un campo clave.");
  const clnt = def.fields.findIndex((f) => f.type === "CLNT");
  if (clnt > 0) errors.push("El campo de mandante (CLNT) debe ser el primer campo.");
  if (clnt === 0 && !def.fields[0].key) errors.push("El campo de mandante debe ser clave.");
  return errors;
}
