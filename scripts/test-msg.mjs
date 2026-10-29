import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb(); await eng.syncSchema([]);
const xml = (n, msgs) => `<?xml version="1.0" encoding="utf-8"?>
<abapGit version="v1.0.0" serializer="LCL_OBJECT_MSAG" serializer_version="v1.0.0">
 <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">
  <asx:values>
   <T100A><ARBGB>${n}</ARBGB><MASTERLANG>S</MASTERLANG><STEXT>x</STEXT></T100A>
   <T100>${Object.entries(msgs).map(([k,v])=>`<T100><SPRSL>S</SPRSL><ARBGB>${n}</ARBGB><MSGNR>${k}</MSGNR><TEXT>${v}</TEXT></T100>`).join("")}</T100>
  </asx:values>
 </asx:abap>
</abapGit>`;
const ctx = { tables: Object.values(STANDARD_TABLES), texts: {}, extraFiles: [{ filename: "zventas.msag.xml", contents: xml("ZVENTAS", {"001": "El cliente &1 no existe en la sociedad &2", "002": "Hola &1"}) }, { filename: "00.msag.xml", contents: xml("00", {"001": "&1&2&3&4"}) }],
  msgTexts: { ZVENTAS: { "001": "El cliente &1 no existe en la sociedad &2", "002": "Hola &1" }, "00": { "001": "&1&2&3&4&5&6&7&8" } } };
const ui = { status: (t, ty) => console.log("[STATUS]", ty, t), popup: async (t) => console.log("[POPUP]", t), alv: async () => {}, selectionScreen: async (m, v) => v };
const r = await eng.run({ name: "ZMSG", source: fs.readFileSync(process.argv[2], "utf8") }, ctx, ui);
console.log(r.status, r.type, r.text, r.errors || "", "\n" + r.list.join("\n"));
