import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb();
const zal = { name: "ZALUMNOS", description: "Alumnos", fields: [
  { name: "MANDT", type: "CLNT", key: true, description: "Mandante" },
  { name: "ID", type: "NUMC", length: 4, key: true, description: "Código" },
  { name: "NOMBRE", type: "CHAR", length: 40, description: "Nombre" },
  { name: "CURSO", type: "CHAR", length: 20, description: "Curso" },
  { name: "NOTA", type: "DEC", length: 4, decimals: 1, description: "Nota" },
  { name: "FECHA_ING", type: "DATS", description: "Fecha ingreso" }]};
await eng.syncSchema([zal]);
eng.insertRows("ZALUMNOS", [{mandt:"100",id:"0001",nombre:"Ana",curso:"ABAP",nota:17.5,fecha_ing:"20260301"},{mandt:"100",id:"0002",nombre:"Luis",curso:"ABAP",nota:12,fecha_ing:"20260315"},{mandt:"100",id:"0003",nombre:"Rosa",curso:"FIORI",nota:19,fecha_ing:"20260420"}]);
const ui = { status: (t, ty) => console.log("[STATUS]", ty, t), popup: async (t) => console.log("[POPUP]", t),
  alv: async (s) => console.log("[ALV]", s.header, s.rows.length, JSON.stringify(s.rows), JSON.stringify(s.aggregations), s.columns.map(c=>c.label).join("|")),
  selectionScreen: async (meta, values) => ({ ...values, s_curso: [{ sign: "I", option: "", low: "ABAP", high: "" }] }) };
for (const f of process.argv.slice(2)) {
  const r = await eng.run({ name: path.basename(f, ".abap").toUpperCase(), source: fs.readFileSync(f, "utf8") }, { tables: [...Object.values(STANDARD_TABLES), zal], texts: {} }, ui);
  console.log(f, r.status, r.dump || "", r.errors || "", r.list.join("\n"));
}
