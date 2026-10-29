// Grupos de funciones (FUGR) en formato abapGit, para que el motor conozca
// los módulos de función y CALL FUNCTION funcione.

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const progdir = (name, subc) => `<?xml version="1.0" encoding="utf-8"?>
<abapGit version="v1.0.0">
 <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
   <PROGDIR><NAME>${name}</NAME><SUBC>${subc}</SUBC><FIXPT>X</FIXPT><UCCHECK>X</UCCHECK></PROGDIR>
  </asx:values>
 </asx:abap>
</abapGit>`;

// p: {name, type, optional, default, byValue}
const pXml = (tag, p) =>
  `<${tag}><PARAMETER>${esc(p.name.toUpperCase())}</PARAMETER>${p.default ? `<DEFAULT>${esc(p.default)}</DEFAULT>` : ""}${p.optional ? "<OPTIONAL>X</OPTIONAL>" : ""}${p.byValue ? "" : "<REFERENCE>X</REFERENCE>"}${p.type ? `<TYP>${esc(p.type.toUpperCase())}</TYP>` : ""}</${tag}>`;

export function interfaceComment(m) {
  const P = m.params || {};
  const lines = ['*"----------------------------------------------------------------------', '*"*"Interfase local:'];
  const sec = (title, list, fmt) => {
    if (!list?.length) return;
    lines.push(`*"  ${title}`);
    for (const p of list) lines.push(`*"     ${fmt(p)}`);
  };
  const typing = (p) => (p.type ? ` TYPE  ${p.type.toUpperCase()}` : "");
  const val = (p, s) => (p.byValue ? `VALUE(${s})` : `REFERENCE(${s})`);
  sec("IMPORTING", P.import, (p) => `${val(p, p.name.toUpperCase())}${typing(p)}${p.default ? ` DEFAULT ${p.default}` : ""}${p.optional ? " OPTIONAL" : ""}`);
  sec("EXPORTING", P.export, (p) => `${val(p, p.name.toUpperCase())}${typing(p)}`);
  sec("CHANGING", P.changing, (p) => `${val(p, p.name.toUpperCase())}${typing(p)}${p.optional ? " OPTIONAL" : ""}`);
  sec("TABLES", P.tables, (p) => `${p.name.toUpperCase()}${p.type ? ` STRUCTURE  ${p.type.toUpperCase()}` : ""}${p.optional ? " OPTIONAL" : ""}`);
  sec("EXCEPTIONS", P.exceptions, (p) => p.name.toUpperCase());
  lines.push('*"----------------------------------------------------------------------');
  return lines.join("\n");
}

// cuerpo del módulo de función (sin FUNCTION / ENDFUNCTION) -> fuente completa
export function fmSource(m, body) {
  return `FUNCTION ${m.name.toLowerCase()}.\n${interfaceComment(m)}\n${(body ?? m.body ?? "").replace(/\s+$/, "")}\n\nENDFUNCTION.`;
}

// group: {name, description, top, modules: [{name, description, params, body}]}
export function fugrFiles(group) {
  const g = group.name.toLowerCase();
  const G = group.name.toUpperCase();
  const fns = group.modules
    .map((m) => {
      const P = m.params || {};
      return `<item><FUNCNAME>${esc(m.name.toUpperCase())}</FUNCNAME><SHORT_TEXT>${esc(m.description || m.name)}</SHORT_TEXT>${P.import?.length ? `<IMPORT>${P.import.map((p) => pXml("RSIMP", p)).join("")}</IMPORT>` : ""}${P.changing?.length ? `<CHANGING>${P.changing.map((p) => pXml("RSCHA", p)).join("")}</CHANGING>` : ""}${P.export?.length ? `<EXPORT>${P.export.map((p) => pXml("RSEXP", { ...p, optional: false })).join("")}</EXPORT>` : ""}${P.tables?.length ? `<TABLES>${P.tables.map((p) => `<RSTBL><PARAMETER>${esc(p.name.toUpperCase())}</PARAMETER>${p.type ? `<DBSTRUCT>${esc(p.type.toUpperCase())}</DBSTRUCT>` : ""}${p.optional ? "<OPTIONAL>X</OPTIONAL>" : ""}</RSTBL>`).join("")}</TABLES>` : ""}${P.exceptions?.length ? `<EXCEPTION>${P.exceptions.map((e) => `<RSEXC><EXCEPTION>${esc(e.name.toUpperCase())}</EXCEPTION></RSEXC>`).join("")}</EXCEPTION>` : ""}</item>`;
    })
    .join("");
  const files = [
    {
      filename: `${g}.fugr.xml`,
      contents: `<?xml version="1.0" encoding="utf-8"?>
<abapGit version="v1.0.0" serializer="LCL_OBJECT_FUGR" serializer_version="v1.0.0">
 <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
   <AREAT>${esc(group.description || G)}</AREAT>
   <INCLUDES><SOBJ_NAME>L${G}TOP</SOBJ_NAME><SOBJ_NAME>SAPL${G}</SOBJ_NAME></INCLUDES>
   <FUNCTIONS>${fns}</FUNCTIONS>
  </asx:values>
 </asx:abap>
</abapGit>`,
    },
    { filename: `${g}.fugr.l${g}top.abap`, contents: `FUNCTION-POOL ${g}.\n${group.top || ""}\n` },
    { filename: `${g}.fugr.l${g}top.xml`, contents: progdir(`L${G}TOP`, "I") },
    { filename: `${g}.fugr.sapl${g}.abap`, contents: `INCLUDE l${g}top.\nINCLUDE l${g}uxx.\n` },
    { filename: `${g}.fugr.sapl${g}.xml`, contents: progdir(`SAPL${G}`, "F") },
  ];
  for (const m of group.modules) files.push({ filename: `${g}.fugr.${m.name.toLowerCase()}.abap`, contents: fmSource(m, m.body) });
  return files;
}
