import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
import { GAMES, fillSolution, compareOutput, normLine, MAX_POINTS } from "../src/games/data.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb(); await eng.syncSchema([]);
const ctx = { tables: Object.values(STANDARD_TABLES), texts: {} };
const ui = { status: () => {}, popup: async () => {}, alv: async (s) => { ui.alvs++; }, alvs: 0, selectionScreen: async (m, v) => v };
const run = async (src) => eng.run({ name: "ZJUEGO", source: src }, ctx, ui);
let bad = 0;
for (const g of GAMES) {
  let msg = "";
  if (g.type === "fill") {
    const r = await run(fillSolution(g.code)); msg = r.status + " | " + (r.list||[]).join(" / ") + (r.errors ? JSON.stringify(r.errors.map(e=>e.message)) : "") + (r.dump ? r.dump.text : "");
    if (r.status !== "ok") bad++;
  } else if (g.type === "predict") {
    const r = await run("REPORT zjuego.\n" + g.code); const got = (r.list||[]).map(normLine).join(" ");
    const ok = got === normLine(g.options[g.answer]); if (!ok) bad++;
    msg = (ok ? "OK " : "MISMATCH ") + r.status + " got=" + got + " expected=" + g.options[g.answer] + (r.errors ? JSON.stringify(r.errors.map(e=>e.message)) : "");
  } else {
    const exp = typeof g.expected === "function" ? g.expected(eng) : g.expected;
    const rs = await run(g.solution); const cs = compareOutput(rs.list || [], exp);
    let bug = "";
    if (g.type === "fix") { const rb = await run(g.code); const cb = compareOutput(rb.list || [], exp); bug = " buggyFails=" + !(rb.status === "ok" && cb.ok); if (rb.status==="ok" && cb.ok) bad++; }
    if (!cs.ok) bad++;
    msg = "solution " + (cs.ok ? "OK" : "FAIL got=" + JSON.stringify(cs.got) + " exp=" + JSON.stringify(cs.expected) + (rs.errors ? JSON.stringify(rs.errors.map(e=>e.message)) : "")) + bug;
  }
  console.log(g.id, g.title.padEnd(28), msg.slice(0, 220));
}
console.log("BAD:", bad, "MAX_POINTS", MAX_POINTS);
