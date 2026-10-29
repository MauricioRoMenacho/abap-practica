// Preprocesador: adapta un programa ABAP "clásico" (eventos, pantalla de selección)
// para que el transpilador lo pueda ejecutar en el navegador.
// - Los eventos INITIALIZATION, AT SELECTION-SCREEN, END-OF-SELECTION, TOP-OF-PAGE
//   se convierten en FORMs que el motor llama en el orden correcto.
// - La pantalla de selección (PARAMETERS / SELECT-OPTIONS / SELECTION-SCREEN) se
//   extrae para dibujarla en HTML; en su lugar se inserta una llamada al motor.
// Se intenta conservar los números de línea para que los errores coincidan.

import * as abaplint from "@abaplint/core";

const S = abaplint.Statements;

const EVENT_FORMS = [
  [S.Initialization, "zz_ev_init", "init"],
  [S.AtSelectionScreen, null, null], // se decide abajo (OUTPUT / normal)
  [S.EndOfSelection, "zz_ev_eos", "eos"],
  [S.TopOfPage, "zz_ev_top", "top"],
  [S.AtLineSelection, "zz_ev_als", "als"],
  [S.LoadOfProgram, "zz_ev_load", "load"],
];

const PARAM_STRIP = [
  ["OBLIGATORY"],
  ["LOWER", "CASE"],
  ["NO-DISPLAY"],
  ["VALUE", "CHECK"],
  ["AS", "LISTBOX"],
  ["MEMORY", "ID", "*"],
  ["MATCHCODE", "OBJECT", "*"],
  ["VISIBLE", "LENGTH", "*"],
  ["MODIF", "ID", "*"],
  ["USER-COMMAND", "*"],
  ["NO", "INTERVALS"],
  ["NO-EXTENSION"],
  ["NO", "INTERVALS"],
];

const UNIT_KEEP = /^(Report|Program|Data|DataBegin|DataEnd|Constant|ConstantBegin|ConstantEnd|Type|TypeBegin|TypeEnd|TypeEnum|TypeEnumBegin|TypeEnumEnd|FieldSymbol|Tables|Parameter|SelectOption|SelectionScreen|TypePools|ClassDefinitionLoad|ClassDeferred|InterfaceDeferred|InterfaceLoad|Ranges|Statics|StaticBegin|StaticEnd|Define|EndOfDefinition|Include|IncludeType|Controls|Empty|Unknown|MacroContent|MacroCall)$/;
const isEventStatement = (g) =>
  g instanceof S.Initialization || g instanceof S.AtSelectionScreen || g instanceof S.StartOfSelection || g instanceof S.EndOfSelection || g instanceof S.TopOfPage || g instanceof S.AtLineSelection || g instanceof S.LoadOfProgram || g instanceof S.EndOfPage || g instanceof S.AtUserCommand;

function tokStrs(st) {
  // une los tokens "-" (abaplint separa SELECT-OPTIONS en 3 tokens)
  const out = [];
  for (const t of st.getTokens()) {
    const s = t.getStr();
    const prev = out[out.length - 1];
    if (prev && (s === "-" || prev.str.endsWith("-")) && prev.row === t.getRow() && prev.endCol === t.getCol()) {
      prev.str += s;
      prev.endCol = t.getCol() + s.length;
      prev.tokens.push(t);
    } else {
      out.push({ str: s, row: t.getRow(), col: t.getCol(), endCol: t.getCol() + s.length, tokens: [t] });
    }
  }
  return out;
}

function unquote(s) {
  if (s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  if (s.startsWith("`") && s.endsWith("`")) return s.slice(1, -1).replace(/``/g, "`");
  return s;
}

export function preprocess(source, progName, texts = {}, opts = {}) {
  const lines = source.split("\n");
  const blank = (row, col, len) => {
    const l = lines[row - 1];
    if (l === undefined) return;
    lines[row - 1] = l.substring(0, col - 1) + " ".repeat(Math.max(0, Math.min(len, l.length - col + 1))) + l.substring(col - 1 + len);
  };
  const blankStatement = (st) => {
    for (const t of st.getTokens()) blank(t.getRow(), t.getCol(), t.getStr().length);
    const colon = st.getColon?.();
    if (colon) blank(colon.getRow(), colon.getCol(), 1);
  };
  // inserciones: {row, col, text}
  const inserts = [];
  const replaceTokenRange = (st, text) => {
    blankStatement(st);
    const s = st.getStart();
    inserts.push({ row: s.getRow(), col: s.getCol(), text });
  };

  const meta = { screen: [], params: [], selopts: [], events: {}, hasScreen: false };

  const reg = new abaplint.Registry().addFile(new abaplint.MemoryFile(progName.toLowerCase() + ".prog.abap", source));
  reg.parse();
  const obj = reg.getFirstObject();
  const file = obj?.getABAPFiles()[0];
  if (!file) return { source, meta };
  const statements = file.getStatements();

  let markerAt = null; // statement donde va la llamada al motor
  let lastSelDecl = null;
  let reportSt = null;
  let openForm = null; // evento convertido a FORM pendiente de cerrar
  let unitDepth = 0;

  const closeOpenForm = (st) => {
    if (!openForm) return;
    if (st) {
      const s = st.getStart();
      inserts.push({ row: s.getRow(), col: s.getCol(), text: "ENDFORM. ", before: true });
    } else {
      lines.push("ENDFORM.");
    }
    openForm = null;
  };

  for (const st of statements) {
    const g = st.get();
    const toks = tokStrs(st);
    const upper = toks.map((t) => t.str.toUpperCase());

    // ABAP Unit: no se ejecuta el programa, solo se conservan las declaraciones globales
    if (opts.unit) {
      const cn = g.constructor.name;
      if (/^(Form|ClassDefinition|ClassImplementation|Interface|Module|FunctionModule|MethodImplementation)$/.test(cn)) unitDepth++;
      else if (/^(EndForm|EndClass|EndInterface|EndModule|EndFunction|EndMethod)$/.test(cn)) unitDepth--;
      else if (unitDepth === 0 && !openForm && !UNIT_KEEP.test(cn) && !isEventStatement(g)) {
        blankStatement(st);
        continue;
      }
    }

    if (g instanceof S.Report || g instanceof S.Program) {
      reportSt = st;
      continue;
    }

    // ---- fin de un bloque de evento convertido ----
    const isEvent =
      g instanceof S.Initialization ||
      g instanceof S.AtSelectionScreen ||
      g instanceof S.StartOfSelection ||
      g instanceof S.EndOfSelection ||
      g instanceof S.TopOfPage ||
      g instanceof S.AtLineSelection ||
      g instanceof S.LoadOfProgram ||
      g instanceof S.EndOfPage ||
      g instanceof S.AtUserCommand;
    if (openForm && (isEvent || g instanceof S.Form || g instanceof S.ClassDefinition || g instanceof S.ClassImplementation || g instanceof S.Module)) {
      closeOpenForm(st);
    }

    if (g instanceof S.StartOfSelection) {
      if (!markerAt) markerAt = st;
      blankStatement(st);
      continue;
    }

    if (isEvent) {
      let formName = null;
      let key = null;
      if (g instanceof S.AtSelectionScreen) {
        if (upper.includes("OUTPUT")) {
          formName = "zz_ev_asso";
          key = "asso";
        } else {
          // AT SELECTION-SCREEN / ON campo / ON BLOCK: todos se validan al ejecutar
          const n = Object.keys(meta.events).filter((k) => k.startsWith("ass")).length;
          formName = "zz_ev_ass" + (n || "");
          key = "ass" + (n || "");
        }
      } else if (g instanceof S.EndOfPage || g instanceof S.AtUserCommand) {
        const n = Object.keys(meta.events).length;
        formName = "zz_ev_x" + n;
        key = "x" + n;
      } else {
        const ev = EVENT_FORMS.find(([c]) => g instanceof c);
        formName = ev[1];
        key = ev[2];
        if (meta.events[key]) {
          formName += "_" + Object.keys(meta.events).length;
          key += "_" + Object.keys(meta.events).length;
        }
      }
      meta.events[key] = formName;
      replaceTokenRange(st, `FORM ${formName}.`);
      openForm = formName;
      continue;
    }

    if (g instanceof S.SelectionScreen) {
      meta.hasScreen = true;
      const u = upper.join(" ");
      if (/BEGIN OF BLOCK/.test(u)) {
        let title = "";
        const ti = upper.indexOf("TITLE");
        if (ti >= 0 && toks[ti + 1]) title = textRef(toks[ti + 1].str, texts);
        meta.screen.push({ kind: "begin", frame: upper.includes("FRAME"), title });
      } else if (/END OF BLOCK/.test(u)) {
        meta.screen.push({ kind: "end" });
      } else if (/COMMENT/.test(u)) {
        const t = toks.slice(2).find((x) => /^TEXT-\w+$/i.test(x.str) || x.str.startsWith("'"));
        meta.screen.push({ kind: "comment", text: t ? textRef(t.str, texts) : "" });
      } else if (/SKIP/.test(u)) {
        meta.screen.push({ kind: "skip" });
      } else if (/ULINE/.test(u)) {
        meta.screen.push({ kind: "uline" });
      }
      blankStatement(st);
      lastSelDecl = st;
      continue;
    }

    if (g instanceof S.Parameter) {
      meta.hasScreen = true;
      const nameIdx = upper[0] === "PARAMETERS" || upper[0] === "PARAMETER" ? 1 : 0;
      const name = toks[nameIdx].str.replace(/\(\d+\)$/, "");
      const p = { kind: "param", name: name.toLowerCase(), type: "c", length: 1, decimals: 0 };
      const ti = upper.indexOf("TYPE");
      const li = upper.indexOf("LIKE");
      if (ti >= 0) p.type = toks[ti + 1].str.toLowerCase();
      if (li >= 0) p.like = toks[li + 1].str.toLowerCase();
      const len = upper.indexOf("LENGTH");
      if (len >= 0) p.length = Number(toks[len + 1].str) || 1;
      const m = toks[nameIdx].str.match(/\((\d+)\)$/);
      if (m) p.length = Number(m[1]);
      const dec = upper.indexOf("DECIMALS");
      if (dec >= 0) p.decimals = Number(toks[dec + 1].str) || 0;
      const di = upper.indexOf("DEFAULT");
      if (di >= 0) p.default = unquote(toks[di + 1].str);
      p.obligatory = upper.includes("OBLIGATORY");
      p.lowercase = upper.includes("LOWER");
      p.checkbox = upper.includes("CHECKBOX");
      const rg = upper.indexOf("RADIOBUTTON");
      if (rg >= 0) {
        p.radio = upper[rg + 2] ? toks[rg + 2].str.toLowerCase() : "g";
      }
      p.hidden = upper.includes("NO-DISPLAY");
      // el transpilador no soporta todas las variantes de PARAMETERS:
      // se reemplaza por un DATA equivalente y la pantalla la dibuja el motor
      let typing;
      if (p.checkbox || p.radio) typing = "TYPE c LENGTH 1";
      else if (li >= 0) typing = "LIKE " + toks[li + 1].str;
      else if (ti >= 0) {
        typing = "TYPE " + toks[ti + 1].str;
        if (len >= 0 || m) typing += " LENGTH " + p.length;
        else if (/^[cnx]$/i.test(toks[ti + 1].str) && p.length > 1) typing += " LENGTH " + p.length;
        if (dec >= 0) typing += " DECIMALS " + p.decimals;
      } else typing = "TYPE c LENGTH " + p.length;
      let decl = `DATA ${name} ${typing}`;
      let after = "";
      if (di >= 0) {
        const d = toks[di + 1].str;
        if (/^'.*'$|^`.*`$|^-?\d+$/.test(d)) decl += ` VALUE ${p.lowercase || p.checkbox || p.radio || !d.startsWith("'") ? d : d.toUpperCase()}`;
        else after = ` ${name} = ${d}.`;
      }
      decl += "." + after;
      const nt = toks[nameIdx];
      blankStatement(st);
      inserts.push({ row: nt.row, col: nt.col, text: decl });
      meta.params.push(p);
      meta.screen.push(p);
      lastSelDecl = st;
      continue;
    }

    if (g instanceof S.SelectOption) {
      meta.hasScreen = true;
      const name = toks[1].str.toLowerCase();
      const fi = upper.indexOf("FOR");
      const s = { kind: "selopt", name, for: fi >= 0 ? toks[fi + 1].str.toLowerCase() : "" };
      s.obligatory = upper.includes("OBLIGATORY");
      s.noIntervals = upper.includes("INTERVALS");
      s.noExtension = upper.includes("NO-EXTENSION");
      s.lowercase = upper.includes("LOWER");
      const di = upper.indexOf("DEFAULT");
      if (di >= 0) {
        s.default = unquote(toks[di + 1].str);
        const to = upper.indexOf("TO", di);
        if (to >= 0) s.defaultHigh = unquote(toks[to + 1].str);
        // DEFAULT lo maneja el motor
        for (let i = di; i < toks.length - 1; i++) {
          if (i > di + 1 && upper[i] !== "TO" && upper[i - 1] !== "TO") break;
          for (const t of toks[i].tokens) blank(t.getRow(), t.getCol(), t.getStr().length);
        }
      }
      stripTokens(toks, upper, blank);
      meta.selopts.push(s);
      meta.screen.push(s);
      lastSelDecl = st;
      continue;
    }
  }
  closeOpenForm(null);

  // marcador: llamada al motor para mostrar la pantalla de selección
  const vars = [...meta.params.map((p) => p.name), ...meta.selopts.map((s) => s.name)];
  const forms = Object.entries(meta.events)
    .map(([k, f]) => `${k}: ${f}`)
    .join(", ");
  const marker = `WRITE '@KERNEL await globalThis.__abapSel({vars: {${vars.join(", ")}}, forms: {${forms}}});'.`;
  if (markerAt) {
    const s = markerAt.getStart();
    inserts.push({ row: s.getRow(), col: s.getCol(), text: marker });
  } else {
    const target = lastSelDecl || reportSt;
    if (target) {
      const e = target.getEnd();
      inserts.push({ row: e.getRow(), col: e.getCol() + 1, text: " " + marker });
    } else {
      lines.unshift(marker);
    }
  }

  // aplicar inserciones agrupadas por posición (de derecha a izquierda)
  const byPos = new Map();
  for (const ins of inserts) {
    const k = ins.row + ":" + ins.col;
    const cur = byPos.get(k) || { row: ins.row, col: ins.col, pre: "", text: "" };
    if (ins.before) cur.pre += ins.text;
    else cur.text += ins.text;
    byPos.set(k, cur);
  }
  const list = [...byPos.values()].sort((a, b) => (a.row !== b.row ? b.row - a.row : b.col - a.col));
  for (const ins of list) {
    const l = lines[ins.row - 1] ?? "";
    const c = Math.min(ins.col - 1, l.length);
    const t = ins.pre + ins.text;
    let end = c;
    while (end < l.length && l[end] === " " && end - c < t.length) end++;
    lines[ins.row - 1] = l.substring(0, c) + t + l.substring(end);
  }

  let out = lines.join("\n");
  // 'texto'(001) -> usa el símbolo de texto si existe
  out = out.replace(/'((?:[^'\n]|'')*)'\(([A-Za-z0-9]{3})\)/g, (all, lit, id) => {
    const t = texts[id.toUpperCase()];
    if (t !== undefined && t !== "") return "'" + t.replace(/'/g, "''") + "'";
    return "'" + lit + "'";
  });
  return { source: out, meta };
}

function stripTokens(toks, upper, blank) {
  for (let i = 0; i < upper.length; i++) {
    for (const pat of PARAM_STRIP) {
      let ok = true;
      for (let j = 0; j < pat.length; j++) {
        if (pat[j] === "*") {
          if (i + j >= upper.length - 1) ok = false;
          continue;
        }
        if (upper[i + j] !== pat[j]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        for (let j = 0; j < pat.length; j++) {
          for (const t of toks[i + j].tokens) blank(t.getRow(), t.getCol(), t.getStr().length);
        }
      }
    }
  }
}

function textRef(str, texts) {
  const m = str.match(/^TEXT-(\w{3})$/i);
  if (m) return texts[m[1].toUpperCase()] ?? str.toUpperCase();
  return unquote(str);
}
