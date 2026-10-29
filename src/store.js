// Repositorio local (localStorage): programas, tablas, ajustes y progreso.
const KEY = "abapp.repo.v1";
const DBKEY = "abapp.db.v1";

const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sin almacenamiento */
  }
  return null;
}

// sincronización entre ventanas (por ejemplo, la guía abierta en otra ventana)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      store.data = JSON.parse(e.newValue);
      for (const l of listeners) l();
    } catch {
      /* ignorar */
    }
  });
}

export const store = {
  data: load() || {
    programs: {},
    tables: {},
    settings: { user: "ALUMNO", lang: "S", decimalNotation: "X" },
    visited: {},
    runs: {},
    manual: {},
  },
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("No se pudo guardar", e);
    }
    for (const l of listeners) l();
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  // ---- programas ----
  program(name) {
    return this.data.programs[name.toUpperCase()];
  },
  programs() {
    return Object.values(this.data.programs).sort((a, b) => a.name.localeCompare(b.name));
  },
  isInclude(name) {
    return this.program(name)?.type === "I";
  },
  // programas principales que incluyen a un include (directa o indirectamente)
  mainProgramsOf(inc) {
    const n = inc.toUpperCase();
    const re = (x) => new RegExp("^\\s*INCLUDE\\s+" + x + "\\b", "im");
    const parents = (x) => this.programs().filter((p) => p.name !== x && re(x).test(p.source || ""));
    const out = [];
    const seen = new Set([n]);
    const queue = [n];
    while (queue.length) {
      const cur = queue.shift();
      for (const p of parents(cur)) {
        if (seen.has(p.name)) continue;
        seen.add(p.name);
        if (p.type === "I") queue.push(p.name);
        else out.push(p.name);
      }
    }
    return out;
  },
  createProgram(name, title, type = "1") {
    const n = name.toUpperCase();
    const line = "*&---------------------------------------------------------------------*";
    const source =
      type === "I"
        ? `${line}\n*& Include ${n}\n${line}\n*& ${title}\n${line}\n\n`
        : `${line}\n*& Report ${n}\n${line}\n*& ${title}\n${line}\nREPORT ${n.toLowerCase()}.\n\n`;
    this.data.programs[n] = {
      name: n,
      title,
      type,
      source,
      activeSource: null,
      texts: { S: {}, E: {} },
      seltexts: { S: {}, E: {} },
      created: new Date().toISOString(),
      changed: new Date().toISOString(),
    };
    this.save();
    return this.data.programs[n];
  },
  deleteProgram(name) {
    delete this.data.programs[name.toUpperCase()];
    delete this.data.runs[name.toUpperCase()];
    this.save();
  },
  // ---- tablas ----
  table(name) {
    return this.data.tables[name.toUpperCase()];
  },
  tables() {
    return Object.values(this.data.tables).sort((a, b) => a.name.localeCompare(b.name));
  },
  activeTables() {
    return this.tables()
      .filter((t) => t.active)
      .map((t) => t.active);
  },
  // ---- base de datos ----
  loadDb() {
    try {
      const b64 = localStorage.getItem(DBKEY);
      if (!b64) return null;
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    } catch {
      return null;
    }
  },
  saveDb(bytes) {
    try {
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      localStorage.setItem(DBKEY, btoa(bin));
    } catch (e) {
      console.warn("No se pudo guardar la base de datos", e);
    }
  },
  resetAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(DBKEY);
  },
  exportAll() {
    return JSON.stringify({ format: "abap-practica", version: 1, repo: this.data, db: localStorage.getItem(DBKEY) }, null, 1);
  },
  importAll(json) {
    const o = JSON.parse(json);
    if (o.format !== "abap-practica") throw new Error("Archivo no válido");
    localStorage.setItem(KEY, JSON.stringify(o.repo));
    if (o.db) localStorage.setItem(DBKEY, o.db);
  },
};
