// ZAYUDA - Glosario, errores comunes, diferencias con SAP real, examen y constancia.
import { h, esc } from "../ui.js";
import { store } from "../store.js";

const GLOSARIO = [
  ["ABAP", "Advanced Business Application Programming: lenguaje de programación de SAP."],
  ["ALV", "ABAP List Viewer: lista en forma de tabla con ordenar, filtrar, sumar y exportar (cl_salv_table)."],
  ["ATC", "ABAP Test Cockpit: herramienta de revisión de calidad del código (Code Inspector)."],
  ["BAPI", "Business API: módulo de función estándar y estable para leer o modificar datos de negocio."],
  ["Clase de mensajes", "Conjunto de textos numerados (SE91) que se usan con MESSAGE e001(zclase)."],
  ["COMMIT WORK", "Confirma definitivamente los cambios de base de datos de la LUW."],
  ["Dominio", "Define los valores técnicos de un campo: tipo, longitud y valores permitidos (SE11)."],
  ["Dump", "Error en tiempo de ejecución que termina el programa (ST22)."],
  ["Elemento de datos", "Tipo con significado de negocio: une un dominio con textos de campo (SE11)."],
  ["ENQUEUE / DEQUEUE", "Bloquear / desbloquear un registro para que otro usuario no lo modifique a la vez (SM12)."],
  ["Estructura", "Tipo con varios campos (una fila). En ABAP: TYPES BEGIN OF ... o una tabla de SE11."],
  ["Evento", "Bloque del programa que el sistema ejecuta en un momento dado: INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION, AT LINE-SELECTION..."],
  ["FOR ALL ENTRIES", "Lectura de la base de datos para todas las líneas de una tabla interna en un solo acceso."],
  ["FORM / PERFORM", "Subrutina clásica (hoy se prefieren métodos)."],
  ["Grupo de funciones", "Contenedor de módulos de función que comparten datos globales."],
  ["HIDE", "Guarda un valor junto a una línea de una lista interactiva."],
  ["Include", "Parte de código reutilizable que se inserta en un programa con INCLUDE."],
  ["LUW", "Unidad lógica de trabajo: conjunto de cambios que se confirman o deshacen juntos."],
  ["Mandante", "Unidad independiente de datos dentro de un sistema (campo MANDT, sy-mandt)."],
  ["Módulo de función", "Bloque reutilizable con interfaz fija, llamado con CALL FUNCTION (SE37)."],
  ["Open SQL", "SQL de ABAP (SELECT, INSERT, UPDATE...) independiente de la base de datos."],
  ["Orden de transporte", "Paquete de cambios que viaja de DEV a QAS y PRD."],
  ["Paquete", "Agrupación de objetos de desarrollo; $TMP = objetos locales no transportables."],
  ["Pantalla de selección", "Pantalla de entrada generada por PARAMETERS y SELECT-OPTIONS."],
  ["Prueba unitaria", "Clase FOR TESTING que comprueba automáticamente el código (ABAP Unit)."],
  ["sy-subrc", "Código de retorno de la última instrucción: 0 = correcto, otro valor = no encontrado o error."],
  ["Tabla interna", "Tabla en memoria del programa (STANDARD, SORTED, HASHED)."],
  ["Tabla transparente", "Tabla de SE11 que existe igual en la base de datos."],
  ["Transacción", "Código que abre una aplicación (SE38, VA01...)."],
  ["Variante", "Valores guardados de una pantalla de selección."],
  ["Watchpoint", "Parada del depurador cuando cambia el valor de una variable."],
];

const ERRORES = [
  ["Falta el punto final", "Cada instrucción ABAP termina con punto. El error suele aparecer en la línea SIGUIENTE a la que le falta el punto.", "WRITE 'Hola'\nWRITE 'Mundo'.", "WRITE 'Hola'.\nWRITE 'Mundo'."],
  ["Variable no declarada", "Toda variable se declara con DATA (o en línea con DATA(...)) antes de usarse.", "lv_total = 10.", "DATA lv_total TYPE i.\nlv_total = 10."],
  ["Comillas en textos", "Los textos van entre comillas simples ' '. Las dobles \" inician un comentario.", "WRITE \"Hola\".", "WRITE 'Hola'."],
  ["No comprobar sy-subrc", "Después de READ TABLE o SELECT SINGLE hay que mirar sy-subrc: si no se encontró, la estructura conserva valores anteriores.", "READ TABLE lt INTO ls INDEX 5.\nWRITE ls-name.", "READ TABLE lt INTO ls INDEX 5.\nIF sy-subrc = 0.\n  WRITE ls-name.\nENDIF."],
  ["SELECT dentro de LOOP", "Un acceso a la base de datos por cada línea es muy lento. Leer todo antes o usar JOIN / FOR ALL ENTRIES.", "LOOP AT lt_con INTO ls_con.\n  SELECT SINGLE ... WHERE carrid = @ls_con-carrid.\nENDLOOP.", "SELECT ... FOR ALL ENTRIES IN @lt_con\n  WHERE carrid = @lt_con-carrid INTO TABLE @DATA(lt_res)."],
  ["FOR ALL ENTRIES con tabla vacía", "Si la tabla está vacía se lee TODA la tabla de la base de datos.", "SELECT ... FOR ALL ENTRIES IN @lt ...", "IF lt IS NOT INITIAL.\n  SELECT ... FOR ALL ENTRIES IN @lt ...\nENDIF."],
  ["@ en Open SQL moderno", "En la sintaxis moderna (con comas entre campos), las variables ABAP llevan @.", "SELECT carrid, connid FROM spfli WHERE carrid = p_carr INTO TABLE lt.", "SELECT carrid, connid FROM spfli WHERE carrid = @p_carr INTO TABLE @lt."],
  ["Programa inactivo", "F8 ejecuta siempre la versión ACTIVA. Si cambiaste el código y no activaste (Ctrl+F3), se ejecuta la versión anterior.", "", ""],
  ["División entre cero", "Provoca el dump CX_SY_ZERODIVIDE. Comprueba el divisor o captura la excepción.", "lv = lv_a / lv_b.", "IF lv_b <> 0.\n  lv = lv_a / lv_b.\nENDIF."],
  ["Bucle infinito", "Un DO o WHILE sin condición de salida termina en TIME_OUT.", "DO.\n  lv = lv + 1.\nENDDO.", "DO.\n  lv = lv + 1.\n  IF lv > 10.\n    EXIT.\n  ENDIF.\nENDDO."],
  ["Tipos en parámetros", "El tipo del valor que se pasa debe ser compatible con el parámetro del método o función.", "", ""],
  ["MESSAGE tipo E en START-OF-SELECTION", "Un mensaje E después de la pantalla de selección termina el programa. Para validar entradas usa AT SELECTION-SCREEN.", "", ""],
];

const DIFERENCIAS = [
  ["Sin paquetes ni órdenes de transporte", "Al crear objetos no se piden paquete ni orden: solo hay un sistema."],
  ["Motor de ejecución", "El código ABAP se traduce a JavaScript y corre en el navegador. Algunas instrucciones poco comunes no están disponibles y lo verás como error de sintaxis o dump."],
  ["Base de datos", "SQLite en tu navegador, guardada en este equipo. Tus datos no se comparten con nadie."],
  ["Tablas estándar reducidas", "Las tablas estándar (SFLIGHT, KNA1, VBAK, MARA...) tienen solo los campos principales y datos de ejemplo."],
  ["Dynpros y SET PF-STATUS", "No hay Screen Painter (SE51) ni Menu Painter (SE41): las pantallas son la pantalla de selección, listas y ALV."],
  ["Formularios", "No hay Smartforms ni Adobe Forms. Las listas y ALV se pueden imprimir o guardar como PDF desde el navegador."],
  ["Autorizaciones", "No existen roles ni AUTHORITY-CHECK reales; en un sistema real son obligatorias."],
  ["Bloqueos", "Se simulan con ENQUEUE_E_TABLE; en SAP real se crean objetos de bloqueo en SE11 (EZ...)."],
  ["BAPIs", "Solo existen las BAPIs del modelo de vuelos (BAPI_FLIGHT_GETLIST, BAPI_FLIGHT_GETDETAIL) y las de COMMIT/ROLLBACK."],
  ["Jobs de fondo", "No hay SM36/SM37: los programas se ejecutan siempre en diálogo."],
  ["Archivos", "GUI_UPLOAD pide elegir el archivo y GUI_DOWNLOAD descarga al navegador; no existe OPEN DATASET (servidor)."],
  ["Traducciones", "Se traducen textos de mensajes, símbolos de texto y textos de selección (ES/EN); no hay SE63."],
];

export const EXAM = [
  ["¿Con qué letra deben empezar los objetos propios del cliente?", ["A o B", "Z o Y", "S o X", "Cualquiera"], 1],
  ["¿Qué contiene sy-subrc después de un READ TABLE que no encuentra la línea?", ["0", "Un valor distinto de 0 (normalmente 4)", "La línea vacía", "El índice"], 1],
  ["¿Qué transacción se usa para crear una tabla transparente?", ["SE38", "SE16", "SE11", "SE37"], 2],
  ["¿Cuál es la capa donde se ejecutan los programas ABAP?", ["Presentación", "Aplicación", "Base de datos", "Red"], 1],
  ["¿Qué campo identifica el mandante en las tablas?", ["BUKRS", "MANDT", "CLIENT_ID", "SYSID"], 1],
  ["¿Qué pasa si se usa FOR ALL ENTRIES con la tabla interna vacía?", ["No lee nada", "Da un dump", "Lee todos los registros de la tabla", "Lee solo el primero"], 2],
  ["¿Dónde se debe validar un campo de la pantalla de selección para volver a mostrarla con el error?", ["START-OF-SELECTION", "INITIALIZATION", "AT SELECTION-SCREEN", "END-OF-SELECTION"], 2],
  ["¿Qué hace ROLLBACK WORK?", ["Confirma los cambios", "Deshace los cambios desde el último COMMIT", "Borra la tabla", "Reinicia el programa"], 1],
  ["Una BAPI informa los errores...", ["Con un dump", "Con excepciones clásicas", "En la tabla de retorno RETURN (BAPIRET2)", "Con un MESSAGE tipo E"], 2],
  ["¿Qué tipo de tabla interna permite leer por clave única más rápido?", ["STANDARD", "SORTED no única", "HASHED", "RANGE"], 2],
  ["En una clase, ¿cómo se llama a un método estático?", ["objeto->metodo( )", "clase=>metodo( )", "CALL METHOD clase-metodo", "PERFORM metodo"], 1],
  ["¿Qué orden siguen normalmente los cambios?", ["PRD - QAS - DEV", "DEV - PRD - QAS", "DEV - QAS - PRD", "QAS - DEV - PRD"], 2],
  ["¿Qué herramienta muestra cada acceso a la base de datos de un programa?", ["ST22", "ST05", "SM12", "SE84"], 1],
  ["En ABAP Unit, ¿qué método se ejecuta antes de cada método de prueba?", ["constructor", "setup", "class_setup", "teardown"], 1],
  ["¿Qué une un dominio con textos de campo?", ["La tabla", "El elemento de datos", "La vista", "El índice"], 1],
];
export const EXAM_PASS = 11;

export function certificateStatus() {
  const done = store.data.guideDone || {};
  const ids = Object.keys(done);
  const total = ids.length;
  const ok = ids.filter((k) => done[k] || store.data.manual?.[k]).length;
  const project = ids.filter((k) => k.startsWith("p8")).every((k) => done[k] || store.data.manual?.[k]) && ids.some((k) => k.startsWith("p8"));
  const exam = store.data.exam || {};
  return { total, ok, project, examPassed: !!exam.passed, examBest: exam.best || 0 };
}

export function helpScreen(app, initialTab = "glos") {
  let tab = initialTab;
  let el0;
  let answers = {};
  let submitted = false;
  const render = () => {
    const tabs = h("div", { class: "tabs" }, [["glos", "Glosario"], ["err", "Errores comunes"], ["dif", "Diferencias con SAP real"], ["exam", "Examen teórico"], ["cert", "Constancia"]].map(([k, l]) => h("button", { class: "tab" + (tab === k ? " active" : ""), onclick: () => { tab = k; render(); } }, l)));
    let content;
    if (tab === "glos") {
      let q = "";
      const list = h("div");
      const fill = () => list.replaceChildren(h("table", { class: "grid-table" }, h("tbody", {}, GLOSARIO.filter(([t, d]) => !q || (t + d).toLowerCase().includes(q)).map(([t, d]) => h("tr", {}, h("td", { style: { width: "220px" } }, h("b", {}, t)), h("td", {}, d))))));
      fill();
      content = h("div", {}, h("input", { class: "sap-input", placeholder: "Buscar término...", style: { width: "300px", marginBottom: "8px" }, oninput: (e) => { q = e.target.value.toLowerCase(); fill(); } }), list);
    } else if (tab === "err") {
      content = h(
        "div",
        {},
        ERRORES.map(([t, d, bad, good]) =>
          h(
            "div",
            { class: "help-err" },
            h("h3", {}, t),
            h("p", {}, d),
            bad ? h("div", { class: "help-cmp" }, h("div", {}, h("div", { class: "help-bad" }, "Mal"), h("pre", { class: "g-code" }, bad)), h("div", {}, h("div", { class: "help-good" }, "Bien"), h("pre", { class: "g-code" }, good))) : null,
          ),
        ),
      );
    } else if (tab === "dif") {
      content = h("div", {}, h("p", {}, "Este simulador reproduce el trabajo diario de un desarrollador ABAP, pero no es un sistema SAP. Diferencias importantes:"), h("table", { class: "grid-table" }, h("tbody", {}, DIFERENCIAS.map(([t, d]) => h("tr", {}, h("td", { style: { width: "260px" } }, h("b", {}, t)), h("td", {}, d))))));
    } else if (tab === "exam") {
      const score = EXAM.filter((q, i) => answers[i] === q[2]).length;
      content = h(
        "div",
        { class: "exam" },
        h("p", {}, `${EXAM.length} preguntas sobre conceptos de SAP y ABAP. Se aprueba con ${EXAM_PASS} respuestas correctas. Tu mejor resultado: ${store.data.exam?.best ?? "-"}/${EXAM.length}.`),
        EXAM.map(([q, opts, ok], i) =>
          h(
            "div",
            { class: "exam-q" + (submitted ? (answers[i] === ok ? " right" : " wrong") : "") },
            h("b", {}, `${i + 1}. ${q}`),
            opts.map((o, j) =>
              h(
                "label",
                { class: "radio" + (submitted && j === ok ? " correct" : "") },
                h("input", { type: "radio", name: "q" + i, checked: answers[i] === j, disabled: submitted, onchange: () => (answers[i] = j) }),
                h("span", { class: "radio-l" }, o),
              ),
            ),
          ),
        ),
        submitted
          ? h(
              "div",
              { class: "exam-result " + (score >= EXAM_PASS ? "ok" : "bad") },
              `Resultado: ${score}/${EXAM.length} - ${score >= EXAM_PASS ? "Aprobado" : "No aprobado, repasa y vuelve a intentarlo"}`,
              h("button", { class: "btn", onclick: () => { answers = {}; submitted = false; render(); } }, "Volver a intentar"),
            )
          : h(
              "button",
              {
                class: "btn btn-primary",
                onclick: () => {
                  if (Object.keys(answers).length < EXAM.length) return app.status("Responde todas las preguntas", "W");
                  submitted = true;
                  const sc = EXAM.filter((q, i) => answers[i] === q[2]).length;
                  const ex = (store.data.exam ||= {});
                  ex.best = Math.max(ex.best || 0, sc);
                  if (sc >= EXAM_PASS) ex.passed = true;
                  ex.at = new Date().toISOString();
                  store.save();
                  app.status(`Examen: ${sc}/${EXAM.length}`, sc >= EXAM_PASS ? "S" : "W");
                  render();
                },
              },
              "Corregir examen",
            ),
      );
    } else {
      const st = certificateStatus();
      const ready = st.project && st.examPassed;
      const nameI = h("input", { class: "sap-input", value: store.data.certName || "", placeholder: "Tu nombre completo", style: { width: "320px" } });
      content = h(
        "div",
        {},
        h("p", {}, "La constancia de práctica resume lo que has completado en este simulador. Requisitos:"),
        h(
          "ul",
          { class: "cert-req" },
          h("li", { class: st.project ? "ok" : "" }, `Proyecto final completo ${st.project ? "(listo)" : "(pendiente)"}`),
          h("li", { class: st.examPassed ? "ok" : "" }, `Examen teórico aprobado ${st.examPassed ? `(mejor: ${st.examBest}/${EXAM.length})` : "(pendiente)"}`),
          h("li", {}, `Ejercicios de las guías completados: ${st.ok} de ${st.total}`),
        ),
        field2("Nombre en la constancia", nameI),
        h("button", { class: "btn btn-primary", disabled: !ready, onclick: () => { store.data.certName = nameI.value.trim(); store.save(); if (!store.data.certName) return app.status("Escribe tu nombre", "E"); printCertificate(store.data.certName, st); } }, "Generar constancia (imprimir / PDF)"),
        ready ? null : h("p", { class: "hint" }, "Completa los requisitos para habilitar el botón."),
        h("p", { class: "muted small" }, "Es una constancia de práctica personal: no es una certificación oficial de SAP."),
      );
    }
    el0.replaceChildren(h("div", { class: "panel wide help-page" }, tabs, h("div", { class: "tab-body" }, content)));
  };
  return {
    id: "ZAYUDA",
    tcode: "ZAYUDA",
    title: "Ayuda: glosario, errores comunes, examen y constancia",
    toolbar: () => [],
    render(el) {
      el0 = el;
      render();
    },
  };
}

function field2(label, inp) {
  return h("div", { class: "field" }, h("label", {}, label), inp);
}

async function printCertificate(name, st) {
  const games = Object.values(store.data.games || {}).filter((g) => g.done).length;
  const date = new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
  const { GUIDES } = await import("../guides.js");
  const done = store.data.guideDone || {};
  const rows = GUIDES.map((g) => `<tr><td>${esc(g.title)}</td><td>${esc(g.subtitle)}</td><td>${g.steps.filter((s) => done[s.id] || store.data.manual?.[s.id]).length}/${g.steps.length}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Constancia de práctica ABAP</title>
<style>body{font-family:Georgia,serif;margin:40px;color:#222}.c{border:6px double #0a4fa0;padding:40px 50px;text-align:center}h1{font-size:30px;margin:0 0 6px;color:#0a4fa0}h2{font-size:26px;margin:24px 0}p{font-size:16px;line-height:1.5}table{margin:20px auto;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px}td{border:1px solid #ccc;padding:4px 10px;text-align:left}.f{margin-top:30px;font-size:13px;color:#555}@media print{body{margin:0}}</style></head>
<body><div class="c"><h1>Constancia de práctica</h1><p>Programación ABAP - Simulador de práctica</p><p>Se deja constancia de que</p><h2>${esc(name)}</h2>
<p>completó las guías prácticas de desarrollo ABAP (diccionario, programas, ALV, módulos de función, BAPIs, orientación a objetos, pruebas unitarias, ATC y depuración), el proyecto final "Sistema de reservas de vuelos" y aprobó el examen teórico con ${st.examBest}/${EXAM.length}.</p>
<table>${rows}</table><p>Retos resueltos en ZJUEGOS: ${games}</p><p>${esc(date)}</p>
<div class="f">Constancia de práctica personal generada por el simulador. No es una certificación oficial de SAP SE.</div></div>
<script>setTimeout(function(){window.print()},300)</script></body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}
