// Motor: verifica, transpila y ejecuta programas ABAP en el navegador.
import * as abaplint from "@abaplint/core";
import { Transpiler, config as transpilerConfig } from "@abaplint/transpiler";
import { TranspileTypes } from "@abaplint/transpiler/build/src/transpile_types.js";
import { ABAP, MemoryConsole } from "@abaplint/runtime";
import { preprocess } from "./preprocess.js";
import { expandIncludes } from "./includes.js";
import { instrument, snapshot } from "./debug.js";
import { tableToXml } from "./ddic.js";
import { STANDARD_TABLES, standardRows } from "./standard.js";
import { formatValue, ListOutput } from "./output.js";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export class AbapMessageStop extends Error {
  constructor(type, text, displayLike) {
    super(text);
    this.msgType = type;
    this.displayLike = displayLike;
  }
}
export class AbapCancel extends Error {}
export class AbapTimeout extends Error {}

const ERROR_TEXTS = {
  check_syntax: null,
  parser_error: "Error de sintaxis",
  unknown_types: null,
};

function lintConfig() {
  const c = JSON.parse(JSON.stringify(transpilerConfig));
  // reglas que en un SAP real no son errores de sintaxis
  delete c.rules.avoid_use;
  delete c.rules.forbidden_identifier;
  delete c.rules.when_others_last;
  delete c.rules.form_no_dash;
  delete c.rules.allowed_object_types;
  return new abaplint.Config(JSON.stringify(c));
}

function translateIssue(msg) {
  // pequeñas traducciones de mensajes frecuentes
  return msg
    .replace(/^Statement does not exist in the configured ABAP version ?\(or a parser error\), "(.*)"$/, 'La instrucción "$1" no existe o tiene un error de sintaxis (¿falta un punto o está mal escrita?)')
    .replace(/^Statement does not exist in ABAPopen-abap\(or a parser error\)/, "La instrucción no existe o tiene un error de sintaxis")
    .replace(/^Statement does not exist in ABAP.*\(or a parser error\)/, "La instrucción no existe o tiene un error de sintaxis")
    .replace(/^"([^"]+)" not found, findTop$/, 'El campo "$1" no existe (¿falta declararlo con DATA?)')
    .replace(/^"([^"]+)" not found/, 'No se encontró "$1" (¿falta declararlo?)')
    .replace(/^Database table or view "([^"]+)" not found/, 'La tabla "$1" no existe o no está activa (SE11)')
    .replace(/^Variable "([^"]+)" contains unknown: (.*)/, 'La variable "$1" usa un tipo desconocido: $2')
    .replace(/^Type "([^"]+)" not found/, 'El tipo "$1" no existe')
    .replace(/^Method "([^"]+)" not found/, 'El método "$1" no existe')
    .replace(/^Class "([^"]+)" not found/, 'La clase "$1" no existe')
    .replace(/^Expected "([^"]+)"/, 'Se esperaba "$1"')
    .replace(/^FORM definition "([^"]+)" not found/, 'No existe la subrutina FORM "$1" (¿falta crearla o falta un INCLUDE?)');
}

export class Engine {
  constructor({ libFiles, createDbClient, onDbChange }) {
    this.libFiles = libFiles; // [{filename, contents}]
    this.createDbClient = createDbClient;
    this.onDbChange = onDbChange;
    this.db = null;
    this.libReg = null;
  }

  // ---------------- base de datos ----------------
  async openDb(bytes) {
    this.db = this.createDbClient();
    // el cliente sqlite usa el global "abap" para sy-dbsys
    if (!globalThis.abap) globalThis.abap = new ABAP({ console: new MemoryConsole() });
    await this.db.connect(bytes || undefined);
    await this.db.execute(`CREATE TABLE IF NOT EXISTS "zz_meta" ("tab" TEXT PRIMARY KEY, "ddl" TEXT)`);
  }

  async ddlFor(tables) {
    const files = tables.map((t) => new abaplint.MemoryFile(t.name.toLowerCase() + ".tabl.xml", tableToXml(t)));
    const reg = new abaplint.Registry(lintConfig()).addFiles(files);
    reg.parse();
    const res = await new Transpiler({ unknownTypes: "runtimeError" }).run(reg);
    const map = {};
    for (const ddl of res.databaseSetup.schemas.sqlite) {
      const m = ddl.match(/^CREATE TABLE '([^']+)'/);
      if (m) map[m[1].toUpperCase()] = ddl;
    }
    return map;
  }

  sqliteRaw() {
    // acceso directo a sql.js
    return this.db.sqlite;
  }

  query(sql, params) {
    const db = this.sqliteRaw();
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  exec(sql, params) {
    this.sqliteRaw().run(sql, params);
  }

  // sincroniza el esquema SQLite con las tablas activas de SE11
  async syncSchema(userTables) {
    const all = [...Object.values(STANDARD_TABLES), ...userTables];
    const ddl = await this.ddlFor(all);
    const meta = Object.fromEntries(this.query(`SELECT "tab", "ddl" FROM "zz_meta"`).map((r) => [r.tab, r.ddl]));
    const seed = standardRows();
    let changed = false;
    for (const t of all) {
      const name = t.name.toUpperCase();
      const lname = name.toLowerCase();
      const d = ddl[name];
      if (!d) continue;
      if (meta[name] === d) continue;
      changed = true;
      const exists = this.query(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [lname]).length > 0;
      if (exists) {
        const oldCols = this.query(`PRAGMA table_info("${lname}")`).map((c) => c.name);
        this.exec(`ALTER TABLE "${lname}" RENAME TO "${lname}__old"`);
        this.exec(d);
        const newCols = this.query(`PRAGMA table_info("${lname}")`).map((c) => c.name);
        const common = newCols.filter((c) => oldCols.includes(c)).map((c) => `"${c}"`).join(", ");
        if (common) {
          try {
            this.exec(`INSERT OR IGNORE INTO "${lname}" (${common}) SELECT ${common} FROM "${lname}__old"`);
          } catch (e) {
            console.warn("migración", e);
          }
        }
        this.exec(`DROP TABLE "${lname}__old"`);
      } else {
        this.exec(d);
        if (seed[name]) this.insertRows(name, seed[name]);
      }
      this.exec(`INSERT OR REPLACE INTO "zz_meta" ("tab", "ddl") VALUES (?, ?)`, [name, d]);
    }
    // tablas borradas en SE11
    const known = new Set(all.map((t) => t.name.toUpperCase()));
    for (const name of Object.keys(meta)) {
      if (!known.has(name)) {
        this.exec(`DROP TABLE IF EXISTS "${name.toLowerCase()}"`);
        this.exec(`DELETE FROM "zz_meta" WHERE "tab" = ?`, [name]);
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  insertRows(name, rows) {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const sql = `INSERT OR REPLACE INTO "${name.toLowerCase()}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
    for (const r of rows) this.exec(sql, cols.map((c) => r[c]));
  }

  async resetStandardData() {
    const seed = standardRows();
    for (const [name, rows] of Object.entries(seed)) {
      this.exec(`DELETE FROM "${name.toLowerCase()}"`);
      this.insertRows(name, rows);
    }
    this.persist();
  }

  persist() {
    if (this.onDbChange && this.db) {
      const bytes = this.db.export();
      this.onDbChange(bytes);
    }
  }

  // ---------------- compilación ----------------
  buildRegistry(program, ctx, debug = false) {
    const resolve = ctx.resolveInclude || (() => null);
    const exp = expandIncludes(program.source, program.name, resolve);
    let src = exp.source;
    let dbgTable = null;
    if (debug) {
      const inst = instrument(src, exp.map, program.name);
      src = inst.source;
      dbgTable = inst.table;
    }
    const pp = preprocess(src, program.name, ctx.texts || {});
    pp.expansion = exp;
    pp.dbgTable = dbgTable;
    const progFile = program.name.toLowerCase() + ".prog.abap";
    const files = [
      ...this.libFiles.map((f) => new abaplint.MemoryFile(f.filename, f.contents)),
      ...ctx.tables.map((t) => new abaplint.MemoryFile(t.name.toLowerCase() + ".tabl.xml", tableToXml(t))),
      ...(ctx.extraFiles || []).map((f) => new abaplint.MemoryFile(f.filename, f.contents)),
      new abaplint.MemoryFile(progFile, pp.source),
    ];
    const reg = new abaplint.Registry(lintConfig()).addFiles(files);
    reg.parse();
    return { reg, pp, progFile };
  }

  check(program, ctx) {
    const { reg, progFile, pp } = this.buildRegistry(program, ctx);
    const errors = [];
    for (const i of reg.findIssues()) {
      if (i.getFilename() !== progFile) continue;
      if (i.getKey() === "unknown_types" && /contains unknown: (any|data)/i.test(i.getMessage())) continue;
      errors.push({
        row: i.getStart().getRow(),
        col: i.getStart().getCol(),
        endRow: i.getEnd().getRow(),
        endCol: i.getEnd().getCol(),
        key: i.getKey(),
        message: translateIssue(i.getMessage()),
      });
    }
    // eliminar duplicados
    const seen = new Set();
    const uniq = errors.filter((e) => {
      const k = e.row + ":" + e.message;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    // traducir líneas del código expandido a (objeto, línea) del include correspondiente
    const exp = pp.expansion;
    const main = program.name.toUpperCase();
    const mapped = uniq.map((e) => {
      const m = exp.map[e.row - 1] || exp.map[exp.map.length - 1] || { obj: main, line: e.row };
      const me = exp.map[(e.endRow || e.row) - 1];
      const sameEnd = me && me.obj === m.obj;
      return { ...e, obj: m.obj, row: m.line, endRow: sameEnd ? me.line : m.line, endCol: sameEnd ? e.endCol : e.col + 1 };
    });
    const all = [...exp.errors.map((e) => ({ key: "include", endRow: e.row, ...e })), ...mapped];
    all.sort((a, b) => (a.obj === b.obj ? a.row - b.row : a.obj === main ? -1 : b.obj === main ? 1 : a.obj.localeCompare(b.obj)));
    return { errors: all, reg, pp, progFile };
  }

  // ¿hay que instrumentar para depurar? (BREAK-POINT, puntos de parada o depuración pedida)
  needsDebug(program, ctx) {
    const d = ctx.debug;
    if (!d) return false;
    if (d.startStep) return true;
    const exp = expandIncludes(program.source, program.name, ctx.resolveInclude || (() => null));
    if (/^\s*BREAK-POINT\b/im.test(exp.source)) return true;
    const objs = new Set(exp.map.map((m) => m.obj));
    for (const bp of d.breakpoints || []) if (objs.has(String(bp).split(":")[0])) return true;
    return false;
  }

  async compile(program, ctx, debug = false) {
    let chk = this.check(program, ctx);
    if (chk.errors.length > 0) return { errors: chk.errors };
    if (debug) {
      const dbg = this.buildRegistry(program, ctx, true);
      chk = { ...chk, reg: dbg.reg, pp: dbg.pp };
    }
    const res = await new Transpiler({ unknownTypes: "runtimeError" }).run(chk.reg);
    // orden: tablas, interfaces, clases (superclase primero), programa
    const objs = res.objects;
    const prog = objs.find((o) => o.object.type === "PROG");
    const others = objs.filter((o) => o !== prog);
    const byName = new Map(others.map((o) => [o.object.name.toUpperCase(), o]));
    const sources = new Map(this.libFiles.map((f) => [f.filename.split(".")[0].toUpperCase(), f.contents]));
    const done = new Set();
    const ordered = [];
    const visit = (o) => {
      const n = o.object.name.toUpperCase();
      if (done.has(n)) return;
      done.add(n);
      const src = sources.get(n) || "";
      const deps = [];
      const m = src.match(/INHERITING\s+FROM\s+([\w/]+)/i);
      if (m) deps.push(m[1].toUpperCase());
      for (const d of deps) if (byName.has(d)) visit(byName.get(d));
      ordered.push(o);
    };
    const rank = { TABL: 0, DTEL: 0, DOMA: 0, TTYP: 1, TYPE: 1, INTF: 2, CLAS: 3 };
    others.sort((a, b) => (rank[a.object.type] ?? 4) - (rank[b.object.type] ?? 4));
    for (const o of others) visit(o);
    let code = "";
    for (const o of ordered) code += o.chunk.getCode().replace(/^export .*$/gm, "") + "\n";
    let progCode = prog.chunk.getCode();
    // el transpilador no declara las declaraciones en línea (DATA(...)) a nivel de programa
    try {
      const pobj = chk.reg.getObject("PROG", program.name.toUpperCase());
      const sp = new abaplint.SyntaxLogic(chk.reg, pobj).run().spaghetti;
      const findScope = (n) => {
        if (n.getIdentifier().stype === "_program") return n;
        for (const c of n.getChildren()) {
          const r = findScope(c);
          if (r) return r;
        }
        return undefined;
      };
      const pscope = findScope(sp.getTop());
      let decl = "";
      for (const [n, v] of Object.entries(pscope?.getData().vars || {})) {
        if (!v.getMeta().includes("inline")) continue;
        let name = n.toLowerCase();
        const isFs = name.startsWith("<");
        if (isFs) name = name.replace("<", "fs_").replace(">", "_");
        if (new RegExp("^let " + name.replace(/[$]/g, "\\$") + " =", "m").test(progCode)) continue;
        if (isFs) decl += `let ${name} = new abap.types.FieldSymbol(${TranspileTypes.toType(v.getType())});\n`;
        else decl += TranspileTypes.declare(v) + "\n";
      }
      progCode = decl + progCode;
    } catch (e) {
      console.warn("inline", e);
    }
    // símbolos de texto TEXT-xxx
    const texts = ctx.texts || {};
    progCode = progCode.replace(/\.set\("TEXT-([A-Za-z0-9]{3})"\)/g, (all, id) => `.set(${JSON.stringify(texts[id.toUpperCase()] ?? "")})`);
    // protección contra bucles infinitos
    progCode = progCode
      .split("\n")
      .map((l) => (/^\s*(for|while)\b.*\{\s*$/.test(l) || /^\s*do\s*\{\s*$/.test(l) ? l + " globalThis.__abapTick();" : l))
      .join("\n");
    const unsupported = [];
    for (const m of progCode.matchAll(/throw new Error\("([^"]*transpiler[^"]*)"\)/g)) unsupported.push(m[1]);
    return { code: code + "\n" + progCode, meta: chk.pp.meta, unsupported, dbgTable: chk.pp.dbgTable };
  }

  // ---------------- ejecución ----------------
  async run(program, ctx, ui) {
    const t0 = performance.now();
    const debugging = this.needsDebug(program, ctx);
    const comp = await this.compile(program, ctx, debugging);
    if (comp.errors) return { status: "syntax", errors: comp.errors };
    const tCompile = performance.now() - t0;

    const abap = new ABAP({ console: new MemoryConsole() });
    globalThis.abap = abap;
    // textos de las clases de mensajes (SE91)
    abap.MSAG = ctx.msgTexts || {};
    abap.context.databaseConnections["DEFAULT"] = this.db;
    const sy = abap.builtin.sy.get();
    const now = new Date();
    const p2 = (n) => String(n).padStart(2, "0");
    sy.datum.set(`${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}`);
    sy.uzeit.set(`${p2(now.getHours())}${p2(now.getMinutes())}${p2(now.getSeconds())}`);
    sy.uname.set(ctx.user || "ALUMNO");
    const setSy = (f, len, v) => {
      if (!sy[f]) sy[f] = new abap.types.Character(len);
      sy[f].set(v);
    };
    setSy("repid", 40, program.name.toUpperCase());
    setSy("cprog", 40, program.name.toUpperCase());
    setSy("langu", 1, ctx.lang === "EN" ? "E" : "S");
    setSy("mandt", 3, "100");
    setSy("sysid", 3, "NPL");
    setSy("tcode", 20, "SE38");
    setSy("host", 32, "practica-abap");

    // el mandante se rellena automáticamente, como en SAP
    const fillMandt = (opts) => {
      const fix = (st) => {
        const o = st?.get?.();
        if (o && typeof o === "object" && o.mandt && o.mandt.set) o.mandt.set("100");
      };
      if (opts?.values) fix(opts.values);
      if (opts?.table) for (const r of opts.table.array()) fix(r);
    };
    for (const m of ["insertDatabase", "modifyDatabase", "updateDatabase"]) {
      const orig = abap.statements[m].bind(abap.statements);
      abap.statements[m] = async (table, opts) => {
        fillMandt(opts);
        return orig(table, opts);
      };
    }

    const list = new ListOutput(abap);
    const origWrite = abap.statements.write.bind(abap.statements);
    abap.statements.write = (source, options) => {
      if (options?.target) return origWrite(source, options);
      if (options?.skipLine) return list.skip(1);
      list.write(formatValue(source, abap, options, ctx), options?.newLine === true);
    };
    abap.statements.skip = (options) => {
      list.skip(options?.lines ? Number(options.lines.get?.() ?? options.lines) : 1);
    };
    const origMessage = abap.statements.message.bind(abap.statements);
    let phase = "start";
    abap.statements.message = async (options) => {
      if (options.into) return origMessage(options);
      const tmp = new abap.types.String();
      await origMessage({ ...options, into: tmp });
      const text = tmp.get();
      let type = options.type;
      if (type && typeof type !== "string") type = type.get();
      type = (type || "I").toUpperCase();
      let like = options.displayLike;
      if (like && typeof like !== "string") like = like.get();
      like = like ? like.toUpperCase() : undefined;
      if (type === "S") {
        ui.status(text, like || "S");
      } else if (type === "I") {
        pauseClock();
        await ui.popup(text, like || "I");
        resumeClock();
      } else if (type === "W" && phase === "start" && false) {
        ui.status(text, "W");
      } else if (type === "X") {
        throw new Error("MESSAGE_TYPE_X: " + text);
      } else {
        throw new AbapMessageStop(type, text, like);
      }
    };

    // reloj para detectar bucles infinitos (como TIME_OUT en SAP)
    const LIMIT = 15000;
    let clockStart = performance.now();
    let paused = 0;
    let ticks = 0;
    const pauseClock = () => {
      paused = performance.now();
    };
    const resumeClock = () => {
      clockStart += performance.now() - paused;
    };
    globalThis.__abapTick = () => {
      if (++ticks % 2000 === 0 && performance.now() - clockStart > LIMIT) throw new AbapTimeout("TIME_OUT");
    };

    // ---- ALV ----
    const salvByColumns = new Map();
    globalThis.__salvFactory = (inst) => {
      salvByColumns.set(inst.mo_columns.get(), inst);
    };
    globalThis.__salvHasColumn = (columnsInst, name) => {
      const salv = salvByColumns.get(columnsInst);
      if (!salv) return true;
      const snap = describeTable(salv.mr_table.getPointer(), abap);
      return snap.columns.some((c) => c.name === name.toUpperCase());
    };
    globalThis.__salvDisplay = async (inst) => {
      const snap = buildAlvSnapshot(inst, abap, ctx);
      pauseClock();
      await ui.alv(snap);
      resumeClock();
    };

    // ---- pantalla de selección ----
    const meta = comp.meta;
    let hadScreen = false;
    let lastValues = null;
    globalThis.__abapSel = async ({ vars, forms }) => {
      phase = "init";
      if (forms.load) await forms.load();
      if (forms.init) await forms.init();
      const visible = meta.screen.some((s) => (s.kind === "param" && !s.hidden) || s.kind === "selopt");
      if (visible) {
        hadScreen = true;
        let msg = null;
        for (;;) {
          phase = "asso";
          if (forms.asso) await forms.asso();
          const current = readScreenValues(meta, vars, abap);
          pauseClock();
          const values = await ui.selectionScreen(meta, lastValues || current, msg);
          resumeClock();
          if (!values) throw new AbapCancel();
          lastValues = values;
          const err = applyScreenValues(meta, vars, values, abap);
          if (err) {
            msg = { type: "E", text: err };
            continue;
          }
          phase = "ass";
          try {
            for (const k of Object.keys(forms).filter((x) => x.startsWith("ass"))) await forms[k]();
            break;
          } catch (e) {
            if (e instanceof AbapMessageStop && (e.msgType === "E" || e.msgType === "W")) {
              msg = { type: e.msgType, text: e.message };
              continue;
            }
            throw e;
          }
        }
      }
      phase = "start";
      if (forms.top) await forms.top();
    };

    // ---- depurador ----
    if (debugging && comp.dbgTable) {
      const table = comp.dbgTable;
      const bps = ctx.debug.breakpoints || new Set();
      let mode = ctx.debug.startStep ? "step" : "run";
      let overScope = null;
      globalThis.__abapDbg = async (id, ev, forced) => {
        const info = table[id];
        if (!info) return;
        let stop = forced || mode === "step" || bps.has(info.obj + ":" + info.line);
        if (!stop && mode === "over" && (info.scope === overScope || info.scope === "_program")) stop = true;
        if (!stop) return;
        const vars = info.vars.map((v) => {
          let val;
          const tries = [v.js];
          if (/^[a-z_][a-z0-9_$]*$/.test(v.js)) tries.push("this." + v.js, "this.constructor." + v.js);
          let ok = false;
          for (const expr of tries) {
            try {
              val = ev(expr);
              if (val !== undefined) {
                ok = true;
                break;
              }
            } catch {
              /* probar la siguiente forma */
            }
          }
          if (!ok) return { name: v.name, kind: "na", note: "aún no declarada" };
          return { name: v.name, ...snapshot(val, abap) };
        });
        const syv = (f) => {
          try {
            return String(sy[f]?.get?.() ?? "").trim();
          } catch {
            return "";
          }
        };
        pauseClock();
        const action = await ui.debug({
          obj: info.obj,
          line: info.line,
          reason: forced ? "BREAK-POINT" : mode === "step" || mode === "over" ? "paso" : "punto de parada",
          vars,
          sy: { subrc: syv("subrc"), tabix: syv("tabix"), index: syv("index"), dbcnt: syv("dbcnt"), datum: syv("datum"), uname: syv("uname") },
        });
        resumeClock();
        if (action === "stop") throw new AbapCancel();
        if (action === "over") {
          mode = "over";
          overScope = info.scope;
        } else mode = action === "step" ? "step" : "run";
      };
    }

    const tRun = performance.now();
    let result;
    try {
      const f = new AsyncFunction("abap", comp.code);
      await f(abap);
      const eos = abap.Forms[`PROG-${program.name.toUpperCase()}-ZZ_EV_EOS`];
      if (eos) await eos();
      result = { status: "ok" };
    } catch (e) {
      if (e instanceof AbapCancel) result = { status: "cancel" };
      else if (e instanceof AbapMessageStop) result = { status: "message", type: e.msgType, text: e.message, displayLike: e.displayLike };
      else result = { status: "dump", dump: await describeDump(e, abap, comp.unsupported) };
    }
    try {
      await this.db.commit?.();
    } catch {
      /* ignorar */
    }
    this.persist();
    result.list = list.lines();
    result.hadScreen = hadScreen;
    result.timing = { compile: Math.round(tCompile), run: Math.round(performance.now() - tRun) };
    return result;
  }
}

// ---------------- utilidades de ejecución ----------------

function typeInfo(v, abap) {
  const T = abap.types;
  if (v instanceof T.Date) return { kind: "D", length: 8 };
  if (v instanceof T.Time) return { kind: "T", length: 6 };
  if (v instanceof T.Numc) return { kind: "N", length: v.getLength() };
  if (v instanceof T.Character) return { kind: "C", length: v.getLength() };
  if (v instanceof T.Packed) return { kind: "P", length: v.getLength(), decimals: v.getDecimals() };
  if (v instanceof T.Integer8) return { kind: "INT8", length: 20 };
  if (v instanceof T.Integer) return { kind: "I", length: 11 };
  if (v instanceof T.Float) return { kind: "F", length: 24 };
  if (v instanceof T.String) return { kind: "STRING", length: 0 };
  if (T.XString && v instanceof T.XString) return { kind: "XSTRING", length: 0 };
  if (v instanceof T.Hex) return { kind: "X", length: v.getLength() * 2 };
  if (T.DecFloat34 && v instanceof T.DecFloat34) return { kind: "F", length: 24 };
  return { kind: "?", length: 10 };
}

function describeTable(table, abap) {
  const rowType = table.getRowType();
  const T = abap.types;
  let columns;
  let isStruct = rowType instanceof T.Structure;
  const ddicName = isStruct ? rowType.getQualifiedName?.() : undefined;
  if (isStruct) {
    columns = Object.entries(rowType.get()).map(([k, v]) => ({ name: k.toUpperCase(), key: k, qn: v.getQualifiedName?.() || "", desc: v.extra?.description || "", ...typeInfo(v, abap) }));
  } else {
    columns = [{ name: "TABLE_LINE", key: null, ...typeInfo(rowType, abap) }];
  }
  return { columns, isStruct, ddicName };
}

function cellValue(v, info) {
  if (v === undefined || v === null) return "";
  const raw = v.get ? v.get() : v;
  if (info.kind === "C" || info.kind === "STRING") return String(raw).replace(/\s+$/, "");
  return raw;
}

function buildAlvSnapshot(inst, abap, ctx) {
  const table = inst.mr_table.getPointer();
  const desc = describeTable(table, abap);
  const ddicDef = desc.ddicName ? ctx.tables.find((t) => t.name.toUpperCase() === String(desc.ddicName).toUpperCase()) : null;
  const rows = table.array().map((r) => {
    if (!desc.isStruct) return [cellValue(r, desc.columns[0])];
    const o = r.get();
    return desc.columns.map((c) => cellValue(o[c.key], c));
  });
  const str = (x) => (x && x.get ? String(x.get()).trim() : "");
  const objGet = (o) => (o && o.get ? o.get() : undefined);
  const funcs = objGet(inst.mo_functions);
  const cols = objGet(inst.mo_columns);
  const disp = objGet(inst.mo_display);
  const sorts = objGet(inst.mo_sorts);
  const aggr = objGet(inst.mo_aggr);
  const colSettings = {};
  if (cols) {
    for (const ref of cols.mt_columns.array()) {
      const c = ref.get();
      colSettings[str(c.mv_name)] = {
        long: str(c.mv_long),
        medium: str(c.mv_medium),
        short: str(c.mv_short),
        hidden: str(c.mv_hidden) === "X",
        outlen: c.mv_outlen?.get?.() || 0,
        key: str(c.mv_key) === "X",
      };
    }
  }
  const columns = desc.columns.map((c) => {
    const s = colSettings[c.name] || {};
    let ddField = ddicDef?.fields.find((f) => f.name.toUpperCase() === c.name);
    if (!ddField && /^[\w/]+-[\w/]+$/.test(c.qn || "")) {
      const [tn, fn] = c.qn.toUpperCase().split("-");
      ddField = ctx.tables.find((t) => t.name.toUpperCase() === tn)?.fields.find((f) => f.name.toUpperCase() === fn);
    }
    let fallback = c.desc;
    if (!fallback && !ddicDef) {
      for (const t of ctx.tables) {
        const f = t.fields.find((x) => x.name.toUpperCase() === c.name);
        if (f?.description) {
          fallback = f.description;
          break;
        }
      }
    }
    const label = s.long || s.medium || s.short || ddField?.description || fallback || c.name;
    const { qn, desc, ...rest } = c;
    return { ...rest, label, hidden: !!s.hidden, outlen: s.outlen, keyField: s.key || (!!ddicDef && !!ddField?.key) };
  });
  return {
    columns,
    rows,
    allFunctions: funcs ? str(funcs.mv_all) === "X" : false,
    defaultFunctions: funcs ? str(funcs.mv_default) === "X" : false,
    optimize: cols ? str(cols.mv_optimize) === "X" : false,
    header: disp ? str(disp.mv_header) : "",
    striped: disp ? str(disp.mv_striped) === "X" : false,
    listDisplay: str(inst.mv_list_display) === "X",
    sorts: sorts ? sorts.mt_sorts.array().map((r) => ({ name: str(r.get().mv_name), down: r.get().mv_sequence.get() === 2, subtotal: str(r.get().mv_subtotal) === "X" })) : [],
    aggregations: aggr ? aggr.mt_aggr.array().map((r) => ({ name: str(r.get().mv_name), type: r.get().mv_type.get() })) : [],
    decimalNotation: ctx.decimalNotation,
    ddicName: desc.ddicName ? String(desc.ddicName).toUpperCase() : null,
  };
}

function readScreenValues(meta, vars, abap) {
  const values = {};
  for (const s of meta.screen) {
    if (s.kind === "param") {
      const v = vars[s.name];
      if (!v) continue;
      const info = typeInfo(v, abap);
      let raw = v.get();
      if (info.kind === "C" || info.kind === "STRING") raw = String(raw).replace(/\s+$/, "");
      if (info.kind === "D") raw = raw === "00000000" ? "" : raw;
      values[s.name] = raw;
      s.info = info;
    } else if (s.kind === "selopt") {
      const t = vars[s.name];
      if (!t) continue;
      const rows = t.array().map((r) => {
        const o = r.get();
        return { sign: o.sign.get(), option: o.option.get(), low: String(o.low.get()).trim(), high: String(o.high.get()).trim() };
      });
      const lowInfo = typeInfo(t.getRowType().get().low, abap);
      s.info = lowInfo;
      if (rows.length === 0 && s.default !== undefined) {
        rows.push({ sign: "I", option: s.defaultHigh ? "BT" : "EQ", low: s.default, high: s.defaultHigh || "" });
      }
      values[s.name] = rows;
    }
  }
  return values;
}

function convertInput(str, info, lowercase) {
  str = String(str ?? "");
  switch (info.kind) {
    case "I":
    case "INT8": {
      const t = str.trim().replace(/[.,](?=\d{3}\b)/g, "");
      if (t === "") return { value: 0 };
      if (!/^-?\d+$/.test(t)) return { error: "Introduzca un valor numérico" };
      return { value: Number(t) };
    }
    case "P":
    case "F": {
      const t = str.trim().replace(",", ".");
      if (t === "") return { value: 0 };
      if (!/^-?\d*(\.\d+)?$/.test(t)) return { error: "Introduzca un valor numérico" };
      return { value: info.kind === "P" ? t : Number(t) };
    }
    case "N": {
      const t = str.trim();
      if (!/^\d*$/.test(t)) return { error: "Introduzca solo dígitos" };
      return { value: t };
    }
    case "D": {
      const t = str.trim();
      if (t === "") return { value: "00000000" };
      let m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
      if (m) return { value: m[3] + m[2].padStart(2, "0") + m[1].padStart(2, "0") };
      m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return { value: m[1] + m[2] + m[3] };
      if (/^\d{8}$/.test(t)) return { value: t };
      return { error: "Formato de fecha no válido (DD.MM.AAAA)" };
    }
    case "T": {
      const t = str.trim().replace(/:/g, "");
      if (t === "") return { value: "000000" };
      if (!/^\d{4,6}$/.test(t)) return { error: "Formato de hora no válido (HH:MM:SS)" };
      return { value: t.padEnd(6, "0") };
    }
    default:
      return { value: lowercase ? str : str.toUpperCase() };
  }
}

function applyScreenValues(meta, vars, values, abap) {
  for (const s of meta.screen) {
    if (s.kind === "param") {
      const v = vars[s.name];
      if (!v) continue;
      const info = s.info || typeInfo(v, abap);
      if (s.checkbox) {
        v.set(values[s.name] ? "X" : " ");
        continue;
      }
      if (s.radio) {
        v.set(values[s.name] ? "X" : " ");
        continue;
      }
      const c = convertInput(values[s.name], info, s.lowercase);
      if (c.error) return c.error + ` (${s.name.toUpperCase()})`;
      v.set(c.value);
    } else if (s.kind === "selopt") {
      const t = vars[s.name];
      if (!t) continue;
      const info = s.info || typeInfo(t.getRowType().get().low, abap);
      t.clear();
      for (const r of values[s.name] || []) {
        if ((r.low ?? "") === "" && (r.high ?? "") === "") continue;
        const row = t.appendInitial().get();
        const lo = convertInput(r.low, info, s.lowercase);
        if (lo.error) return lo.error + ` (${s.name.toUpperCase()})`;
        let option = r.option;
        if (!option) option = r.high ? "BT" : /[*+]/.test(r.low) ? "CP" : "EQ";
        row.sign.set(r.sign || "I");
        row.option.set(option);
        if (option === "CP") row.low.set(r.low.toUpperCase());
        else row.low.set(lo.value);
        if (r.high) {
          const hi = convertInput(r.high, info, s.lowercase);
          if (hi.error) return hi.error + ` (${s.name.toUpperCase()})`;
          row.high.set(hi.value);
        }
      }
    }
  }
  return null;
}

async function describeDump(e, abap, unsupported) {
  if (e instanceof AbapTimeout) {
    return {
      error: "TIME_OUT",
      title: "Tiempo de ejecución excedido",
      text: "El programa se ejecutó más de 15 segundos. Probablemente hay un bucle infinito (DO sin EXIT, WHILE cuya condición nunca cambia...).",
    };
  }
  const name = e?.constructor?.INTERNAL_NAME;
  if (name && /^CX_/i.test(name)) {
    let text = "";
    try {
      const r = await e.if_message$get_text();
      text = r?.get ? r.get() : String(r);
    } catch {
      text = "";
    }
    const known = {
      CX_SY_ZERODIVIDE: "Se intentó dividir entre cero.",
      CX_SY_ITAB_LINE_NOT_FOUND: "No se encontró la línea en la tabla interna (expresión tabla[ ... ]).",
      CX_SY_CONVERSION_NO_NUMBER: "Un texto no se pudo convertir a número.",
      CX_SY_ARITHMETIC_OVERFLOW: "Desbordamiento aritmético: el resultado no cabe en la variable.",
      CX_SY_REF_IS_INITIAL: "Se usó una referencia vacía (objeto no creado con NEW / CREATE OBJECT).",
      CX_SY_MOVE_CAST_ERROR: "Error de casting (?=): el objeto no es del tipo esperado.",
      CX_SY_OPEN_SQL_DB: "Error de base de datos (por ejemplo, clave duplicada en INSERT).",
    };
    return {
      error: "UNCAUGHT_EXCEPTION",
      exception: name,
      title: "Excepción no capturada",
      text: known[name] || text || "Se produjo una excepción que el programa no capturó con TRY ... CATCH.",
      detail: text && known[name] ? text : "",
    };
  }
  const msg = String(e?.message || e);
  if (/transpiler/.test(msg)) {
    return {
      error: "NOT_SUPPORTED",
      title: "Instrucción no soportada por el simulador",
      text: "Este programa usa una instrucción que el simulador todavía no soporta: " + msg.replace(/, ?(not supported, )?transpiler( todo)?/, ""),
    };
  }
  if (/is not a function|Cannot read properties of undefined/.test(msg) && /get\(\)/.test(msg)) {
    return { error: "OBJECTS_OBJREF_NOT_ASSIGNED", title: "Referencia a objeto vacía", text: "Se llamó a un método de un objeto que no ha sido creado." };
  }
  console.error(e);
  return { error: "RUNTIME_ERROR", title: "Error en tiempo de ejecución", text: msg };
}
