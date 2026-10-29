import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
import { stdLibFiles } from "../src/engine/stdlib.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).filter(f => !f.endsWith(".md")).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles: [...libFiles, ...stdLibFiles()], createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb(); await eng.syncSchema([]);
const ui = { status(){}, popup: async () => {}, alv: async () => {}, selectionScreen: async (m, v) => v };
const r = await eng.run({ name: "ZP7_INTERACTIVA", source: fs.readFileSync(process.argv[2], "utf8") }, { tables: Object.values(STANDARD_TABLES), texts: {} }, ui);
console.log(r.status, r.errors || r.dump || "", r.list, r.hideLines);
if (r.lineSelect) { const d = await r.lineSelect(0, 3, r.list[3]); console.log(d.status, d.dump || "", d.list); }
