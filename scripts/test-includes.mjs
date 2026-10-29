import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb(); await eng.syncSchema([]);
const ed = "scripts/ejemplos/includes";
const src = (n) => { const f = path.join(ed, n.toLowerCase() + ".abap"); return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null; };
const ctx = { tables: Object.values(STANDARD_TABLES), texts: {}, resolveInclude: (n) => { const s = src(n); return s === null ? null : { source: s }; } };
const ui = { status: (t, ty) => console.log("[STATUS]", ty, t), popup: async (t) => console.log("[POPUP]", t), alv: async () => {},
  selectionScreen: async (meta, values) => { console.log("[SEL]", meta.screen.map(s=>s.kind+":"+(s.name||"")).join(" ")); return { ...values, s_carr: [{ sign: "I", option: "", low: "L*", high: "" }] }; } };
let r = await eng.run({ name: "ZP1_REPORTE", source: src("ZP1_REPORTE") }, ctx, ui);
console.log(r.status, r.errors || r.dump || "", "\n" + r.list.join("\n"));
// error in include
const bad = src("ZP1_REPORTE_F01").replace("ULINE.", "ULIN.");
const ctx2 = { ...ctx, resolveInclude: (n) => n === "ZP1_REPORTE_F01" ? { source: bad } : ctx.resolveInclude(n) };
console.log(JSON.stringify(eng.check({ name: "ZP1_REPORTE", source: src("ZP1_REPORTE") }, ctx2).errors.map(e => [e.obj, e.row, e.message])));
console.log(JSON.stringify(eng.check({ name: "ZP1_REPORTE", source: src("ZP1_REPORTE") + "\nINCLUDE zno_existe." }, ctx).errors.map(e => [e.obj, e.row, e.message])));
