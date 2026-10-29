import fs from "fs"; import path from "path";
import { Engine } from "../src/engine/engine.js";
import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";
import { STANDARD_TABLES } from "../src/engine/standard.js";
import { domainToXml, dtelToXml } from "../src/engine/ddic.js";
const dir = "src/engine/abaplib";
const libFiles = fs.readdirSync(dir).map(f => ({ filename: f, contents: fs.readFileSync(path.join(dir, f), "utf8") }));
const eng = new Engine({ libFiles, createDbClient: () => new SQLiteDatabaseClient() });
await eng.openDb();
const doma = { name: "ZD_ESTADO", description: "Estado", type: "CHAR", length: 1, values: [{ low: "A", text: "Activo" }, { low: "I", text: "Inactivo" }] };
const doma2 = { name: "ZD_NOTA", description: "Nota", type: "DEC", length: 4, decimals: 1 };
const dtel = { name: "ZDE_ESTADO", description: "Estado del alumno", domain: "ZD_ESTADO", labels: { short: "Estado", medium: "Estado alumno", long: "Estado del alumno" } };
const dtel2 = { name: "ZDE_NOTA", description: "Nota final", domain: "ZD_NOTA", labels: { medium: "Nota final" } };
const extra = [
  { filename: "zd_estado.doma.xml", contents: domainToXml(doma) }, { filename: "zd_nota.doma.xml", contents: domainToXml(doma2) },
  { filename: "zde_estado.dtel.xml", contents: dtelToXml(dtel) }, { filename: "zde_nota.dtel.xml", contents: dtelToXml(dtel2) }];
const tab = { name: "ZALUM2", description: "Alumnos 2", fields: [
  { name: "MANDT", type: "CLNT", key: true }, { name: "ID", type: "NUMC", length: 4, key: true },
  { name: "ESTADO", dtel: "ZDE_ESTADO", type: "CHAR", length: 1 }, { name: "NOTA", dtel: "ZDE_NOTA", type: "DEC", length: 4, decimals: 1 }] };
await eng.syncSchema([tab], extra);
console.log(eng.query(`SELECT sql FROM sqlite_master WHERE name='zalum2'`)[0].sql);
const src = `REPORT zt.
DATA lv_nota TYPE zde_nota.
DATA ls TYPE zalum2.
ls-id = '0001'. ls-estado = 'A'. ls-nota = '15.5'.
INSERT zalum2 FROM ls.
SELECT * FROM zalum2 INTO TABLE @DATA(lt).
LOOP AT lt INTO ls. WRITE: / ls-id, ls-estado, ls-nota. ENDLOOP.
lv_nota = '12.3'. WRITE / lv_nota.`;
const r = await eng.run({ name: "ZT", source: src }, { tables: [...Object.values(STANDARD_TABLES), tab], extraFiles: extra, texts: {} }, { status() {}, popup: async () => {}, alv: async () => {}, selectionScreen: async (m, v) => v });
console.log(r.status, r.errors || r.dump || "", "\n" + r.list.join("\n"));
