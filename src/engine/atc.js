// ATC / Code Inspector simulado: comprobaciones de calidad con reglas de abaplint.
// prio: 1 = error, 2 = advertencia, 3 = información (como en ATC).

export const ATC_RULES = {
  unsecure_fae: { prio: 1, custom: true, title: "FOR ALL ENTRIES sin comprobar la tabla", help: "Si la tabla de FOR ALL ENTRIES está vacía se lee TODA la tabla de la base de datos. Ponga antes IF itab IS NOT INITIAL." },
  db_operation_in_loop: { prio: 1, title: "Acceso a base de datos dentro de un bucle", help: "SELECT/INSERT/UPDATE dentro de LOOP, DO o WHILE provoca muchos viajes a la base de datos. Use JOIN, FOR ALL ENTRIES o lea antes en una tabla interna." },
  sy_modification: { prio: 1, title: "Modificación de un campo de sistema", help: "Los campos sy- los llena el sistema; no se deben modificar en el código." },
  identical_conditions: { prio: 1, title: "Condiciones idénticas", help: "Hay ramas IF/ELSEIF o WHEN con la misma condición: una de ellas nunca se ejecuta." },
  unreachable_code: { prio: 1, title: "Código inalcanzable", help: "Este código nunca se ejecuta (está después de RETURN, EXIT, RAISE...)." },
  check_subrc: { prio: 2, title: "No se comprueba sy-subrc", help: "Después de SELECT SINGLE, READ TABLE, ASSIGN, etc. compruebe sy-subrc (o use line_exists / IS ASSIGNED).", conf: { selectTable: false } },
  select_performance: { prio: 2, title: "SELECT * o SELECT...ENDSELECT", help: "Lea solo los campos que necesita y evite SELECT...ENDSELECT; use INTO TABLE." },
  unused_variables: { prio: 2, title: "Variable no utilizada", help: "La variable se declara pero no se usa: bórrela para que el código sea más claro." },
  unused_types: { prio: 3, title: "Tipo no utilizado", help: "El tipo se declara pero no se usa." },
  obsolete_statement: { prio: 2, title: "Instrucción obsoleta", help: "Existe una forma moderna recomendada (por ejemplo, = en lugar de MOVE, CLEAR en lugar de REFRESH, tablas sin HEADER LINE)." },
  exit_or_check: { prio: 2, title: "EXIT o CHECK fuera de un bucle", help: "Para salir de un método o subrutina use RETURN." },
  use_line_exists: { prio: 3, title: "Usar line_exists( )", help: "Para saber si existe una línea use IF line_exists( itab[ ... ] ) en lugar de READ TABLE ... TRANSPORTING NO FIELDS." },
  prefer_is_not: { prio: 3, title: "Usar IS NOT en lugar de NOT ... IS", help: "Es más legible: IF a IS NOT INITIAL." },
  prefer_xsdbool: { prio: 3, title: "Usar xsdbool( )", help: "xsdbool( condición ) devuelve abap_true / abap_false y evita un IF." },
  use_new: { prio: 3, title: "Usar NEW", help: "En código moderno se usa NEW #( ) en lugar de CREATE OBJECT." },
  method_length: { prio: 2, title: "Método o subrutina demasiado largo", help: "Más de 100 instrucciones. Divídalo en métodos más pequeños con nombres claros.", conf: { statements: 100, errorWhenEmpty: false } },
  nesting: { prio: 2, title: "Anidamiento demasiado profundo", help: "Demasiados IF/LOOP anidados. Extraiga parte de la lógica a otro método o use RETURN temprano.", conf: { depth: 5 } },
  cyclomatic_complexity: { prio: 2, title: "Complejidad ciclomática alta", help: "El método tiene demasiados caminos posibles; divídalo.", conf: { max: 20 } },
  local_variable_names: { prio: 3, title: "Convención de nombres", help: "Variables locales: lv_ (valor), ls_ (estructura), lt_ (tabla), lo_ (objeto), lr_ (referencia). Constantes lc_. Field-symbols <lv_ ...>.", conf: { expectedData: "^L[VSTORXI]_.+$", expectedConstant: "^LC_.+$", expectedFS: "^<L[VSTORXI]_.+>$" } },
  commented_code: { prio: 3, title: "Código comentado", help: "No deje código comentado: el historial de versiones ya lo guarda." },
  line_length: { prio: 3, title: "Línea demasiado larga", help: "Más de 120 caracteres; divida la instrucción en varias líneas.", conf: { length: 120 } },
  empty_statement: { prio: 3, title: "Instrucción vacía", help: "Hay un punto sobrante (. .)." },
  max_one_statement: { prio: 3, title: "Varias instrucciones en una línea", help: "Escriba una instrucción por línea." },
  use_message_class: { prio: 3, title: "Mensaje con texto fijo", help: "Defina los mensajes en SE91 para poder traducirlos: MESSAGE e001(zclase)." },
  sequential_blank: { prio: 3, title: "Demasiadas líneas en blanco", help: "Más de 4 líneas en blanco seguidas.", conf: { lines: 4 } },
  empty_structure: { prio: 3, title: "Bloque vacío", help: "IF, LOOP, WHILE... sin contenido.", conf: { loop: true, if: true, while: true, case: true, select: true, do: true, at: true, try: false, when: false } },
};

export const PRIO_LABEL = { 1: "Error (prioridad 1)", 2: "Advertencia (prioridad 2)", 3: "Información (prioridad 3)" };

// configuración: valores por defecto de cada regla de abaplint + los ajustes de arriba
export function atcRulesConfig(base, abaplint) {
  const defaults = Object.fromEntries(abaplint.ArtifactsRules.getRules().map((r) => [r.getMetadata().key, r.getConfig()]));
  const rules = {};
  for (const [k, r] of Object.entries(ATC_RULES)) if (!r.custom) rules[k] = { ...(defaults[k] || {}), ...(r.conf || {}) };
  rules.obsolete_statement = { ...rules.obsolete_statement, formDefinition: false, formImplementation: false, parameter: false, ranges: false };
  return { ...base, rules };
}

// FOR ALL ENTRIES: ¿está protegido por IF itab IS NOT INITIAL / CHECK / IF itab IS INITIAL. RETURN?
export function findUnsecureFae(source) {
  const lines = source.split("\n");
  const out = [];
  const code = (l) => l.replace(/^\s*\*.*$/, "").replace(/".*$/, "");
  lines.forEach((l, idx) => {
    const m = code(l).match(/FOR\s+ALL\s+ENTRIES\s+IN\s+@?([\w~\-]+)/i);
    if (!m) return;
    const tab = m[1].replace(/[[\]]/g, "");
    const t = tab.replace(/[-~]/g, (c) => "\\" + c);
    const okCond = new RegExp(`\\b${t}\\s+IS\\s+NOT\\s+INITIAL|\\bNOT\\s+${t}\\s+IS\\s+INITIAL|lines\\(\\s*${t}\\s*\\)\\s*(>|<>|GT|NE)\\s*0`, "i");
    let depth = 0;
    let safe = false;
    for (let i = idx - 1; i >= 0 && !safe; i--) {
      const c = code(lines[i]);
      if (/^\s*ENDIF\b/i.test(c)) depth++;
      else if (/^\s*IF\b/i.test(c)) {
        // condición del IF (puede seguir en las líneas siguientes hasta el punto)
        let cond = c;
        for (let j = i + 1; j < idx && !/\.\s*$/.test(cond); j++) cond += " " + code(lines[j]);
        if (depth > 0) {
          depth--;
          // IF itab IS INITIAL. RETURN. ENDIF.  (salida temprana antes del SELECT)
          if (new RegExp(`\\b${t}\\s+IS\\s+INITIAL`, "i").test(cond) && !/NOT/i.test(cond)) {
            const block = lines.slice(i + 1, idx).map(code).join(" ");
            if (/^\s*(RETURN|EXIT)\s*\./i.test(block.trim())) safe = true;
          }
        } else if (okCond.test(cond)) safe = true;
      } else if (depth === 0 && new RegExp(`^\\s*CHECK\\s+.*${t}\\s+IS\\s+NOT\\s+INITIAL`, "i").test(c)) safe = true;
      else if (/^\s*(FORM|METHOD|FUNCTION|START-OF-SELECTION)\b/i.test(c) && depth === 0) break;
    }
    if (!safe) out.push({ row: idx + 1, col: l.search(/FOR\s+ALL/i) + 1, message: `FOR ALL ENTRIES IN ${tab} sin comprobar que ${tab} no esté vacía` });
  });
  return out;
}
