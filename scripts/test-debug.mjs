import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb(); await eng.syncSchema([]);
const src = fs.readFileSync(process.argv[2], "utf8");
let stops = 0;
const actions = (process.env.ACTIONS || "step").split(",");
const ui = { status: () => {}, popup: async () => {}, alv: async () => {}, selectionScreen: async (m, v) => v,
  debug: async (st) => { const a = actions[Math.min(stops, actions.length - 1)]; stops++; if (stops <= 40) console.log(`[DBG] ${st.obj}:${st.line} (${st.reason}) sy-subrc=${st.sy.subrc} tabix=${st.sy.tabix} ->`, st.vars.map(v => v.name + "=" + (v.kind === "simple" ? v.value : v.kind === "table" ? `[${v.count}]` : v.kind === "struct" ? "{" + v.fields.map(f=>f.name+":"+(f.value??f.kind)).join(",").slice(0,60) + "}" : v.kind + (v.note ? "(" + v.note + ")" : ""))).join(" ").slice(0, 230), "=>", a); return a; } };
const bps = new Set((process.env.BPS || "").split(",").filter(Boolean));
const r = await eng.run({ name: "ZDBG", source: src }, { tables: Object.values(STANDARD_TABLES), texts: {}, debug: { startStep: !process.env.BPS, breakpoints: bps } }, ui);
console.log(r.status, r.dump || r.errors || "", "stops:", stops, "\n" + r.list.join("\n"));
