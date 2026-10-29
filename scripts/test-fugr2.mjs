import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
import { stdLibFiles } from "../src/engine/stdlib.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles: [...libFiles, ...stdLibFiles()], createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb(); await eng.syncSchema([]); eng.sqlTrace.active = !!process.env.TRACE;
globalThis.__abapPopupConfirm = async (o) => { console.log("[CONFIRM]", JSON.stringify(o)); return "1"; };
globalThis.__abapEnqueue = (t, k) => (k === "0001" ? "JUAN" : "");
globalThis.__abapDequeue = () => {};
globalThis.__abapFileRead = async () => ["A\t1", "B\t2"];
globalThis.__abapFileWrite = (n, l) => console.log("[WRITE FILE]", n, l);
const src = fs.readFileSync(process.argv[2], "utf8");
const r = await eng.run({ name: "ZT", source: src }, { tables: Object.values(STANDARD_TABLES), texts: {} }, { status: (t)=>console.log("[S]",t), popup: async (t) => console.log("[POPUP]", t), alv: async () => {}, selectionScreen: async (m, v) => v, fileRead: async () => ["AA\tAmerican Airlines\tUSD", "LA\tLATAM\tPEN"], confirm: async () => "1" });
console.log(r.status, JSON.stringify(r.errors || r.dump || ""), "\n" + r.list.join("\n"));
if (process.env.TRACE) { const c={}; for (const r of eng.sqlTrace.records) c[r.op+" "+r.table]=(c[r.op+" "+r.table]||0)+1; console.log(c, eng.sqlTrace.records.slice(-2)); }
