import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient(), onDbChange: () => {} });
await eng.openDb();
const zal = { name: "ZALUMNOS", description: "Alumnos", fields: [
  { name: "MANDT", type: "CLNT", key: true, description: "Mandante" },
  { name: "ID", type: "NUMC", length: 4, key: true, description: "Código" },
  { name: "NOMBRE", type: "CHAR", length: 30, description: "Nombre" },
  { name: "NOTA", type: "DEC", length: 4, decimals: 1, description: "Nota" },
  { name: "FECHA", type: "DATS", description: "Fecha" },
  { name: "OBS", type: "STRING", description: "Obs" },
]};
await eng.syncSchema([zal]);
const { STANDARD_TABLES } = await import("../src/engine/standard.js");
const tables = [...Object.values(STANDARD_TABLES), zal];
const ui = {
  status: (t, ty) => console.log("[STATUS]", ty, t),
  popup: async (t) => console.log("[POPUP]", t),
  alv: async (s) => console.log("[ALV]", JSON.stringify({...s, rows: s.rows.slice(0,3), n: s.rows.length})),
  selectionScreen: async (meta, values, msg) => { console.log("[SEL]", JSON.stringify(meta.screen), JSON.stringify(values), msg); return process.env.SELV ? JSON.parse(process.env.SELV) : values; },
};
const src = fs.readFileSync(process.argv[2], "utf8");
const r = await eng.run({ name: "ZTEST", source: src }, { tables, texts: { "001": "Datos de entrada" }, user: "MAURICIO" }, ui);
console.log(JSON.stringify({ ...r, list: undefined }, null, 1));
console.log(r.list?.join("\n"));
