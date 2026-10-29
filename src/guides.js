// Guías de práctica paso a paso con validación automática.
import { h, esc } from "./ui.js";
import { store } from "./store.js";

const code = (src) => ({ code: src.trim() });

const prog = (n) => store.program(n);
const run = (n) => store.data.runs[n];
const activeHas = (n, re) => !!prog(n)?.activeSource && re.test(prog(n).activeSource);
const alvs = (n) => run(n)?.alvs || [];
const countRows = (app, t) => {
  try {
    return app.engine.query(`SELECT COUNT(*) AS c FROM "${t.toLowerCase()}"`)[0].c;
  } catch {
    return 0;
  }
};

export const GUIDES = [
  {
    id: "p1",
    title: "Paso 1",
    subtitle: "Fundamentos: tu primer programa y tu primera tabla",
    steps: [
      {
        id: "p1s1",
        title: "El campo de comandos",
        body: [
          "En SAP todo empieza en el <b>campo de comandos</b> (arriba a la izquierda). Ahí escribes el código de una <b>transacción</b> y pulsas <kbd>Enter</kbd>.",
          "Las transacciones que usarás: <b>SE38</b> (programas), <b>SE11</b> (tablas), <b>SE16</b> (datos) y <b>SE84</b> (buscar objetos).",
          "Escribe <code>SE38</code> en el campo de comandos y pulsa Enter. Tip: desde cualquier pantalla puedes usar <code>/nSE38</code> para cambiar de transacción y <kbd>F3</kbd> para volver atrás.",
        ],
        check: () => !!store.data.visited.SE38,
        hint: "Abre la transacción SE38.",
      },
      {
        id: "p1s2",
        title: "Crea tu primer programa",
        body: [
          "En la pantalla inicial de SE38 escribe el nombre <code>ZP1_HOLA</code> y pulsa <b>Crear</b>.",
          "Todos los objetos propios empiezan por <b>Z</b> o <b>Y</b> (espacio de nombres del cliente). Si intentas otro nombre el sistema te avisará.",
          "En la ventana de atributos escribe un título, por ejemplo <i>Mi primer programa</i>, y pulsa <b>Grabar</b>. En un SAP real ahora pediría paquete y orden de transporte; aquí no hace falta.",
        ],
        check: () => !!prog("ZP1_HOLA"),
        hint: "Crea el programa ZP1_HOLA en SE38.",
      },
      {
        id: "p1s3",
        title: "Hola mundo: grabar, verificar y activar",
        body: [
          "Escribe este código debajo de la línea <code>REPORT</code> (puedes copiarlo):",
          code(`REPORT zp1_hola.

WRITE 'Hola mundo desde ABAP'.
WRITE / 'Esta es una segunda línea'.
ULINE.
WRITE: / 'Usuario:', sy-uname,
       / 'Fecha:', sy-datum.`),
          "Ahora el ciclo de trabajo de todo programador ABAP:",
          "<ul><li><kbd>Ctrl+S</kbd> <b>Grabar</b>: guarda una versión <i>inactiva</i>.</li><li><kbd>Ctrl+F2</kbd> <b>Verificar</b>: revisa la sintaxis.</li><li><kbd>Ctrl+F3</kbd> <b>Activar</b>: crea la versión activa, que es la que se ejecuta.</li></ul>",
          "Fíjate en la etiqueta <b>Activo / Inactivo</b> encima del editor.",
        ],
        check: () => activeHas("ZP1_HOLA", /WRITE/i),
        hint: "Activa ZP1_HOLA con al menos un WRITE.",
      },
      {
        id: "p1s4",
        title: "Ejecuta tu programa (F8)",
        body: [
          "Pulsa <kbd>F8</kbd> (o el botón <b>Ejecutar</b>). Verás la <b>lista</b> de salida con lo que escribiste con WRITE.",
          "<ul><li><code>WRITE /</code> empieza una línea nueva.</li><li><code>WRITE:</code> con dos puntos encadena varias salidas separadas por comas.</li><li><code>sy-uname</code> y <code>sy-datum</code> son campos del sistema (estructura <b>SY</b>).</li></ul>",
          "Pulsa <kbd>F3</kbd> para volver al editor.",
        ],
        check: () => run("ZP1_HOLA")?.status === "ok" && run("ZP1_HOLA").listLines > 0,
        hint: "Ejecuta ZP1_HOLA con F8.",
      },
      {
        id: "p1s5",
        title: "Variables, tipos y control de flujo",
        body: [
          "Crea un programa nuevo <code>ZP1_VARIABLES</code> (F3 para volver a la pantalla inicial de SE38) con este código. Actívalo y ejecútalo:",
          code(`REPORT zp1_variables.

DATA: lv_nombre   TYPE string VALUE 'Ana',
      lv_edad     TYPE i VALUE 25,
      lv_precio   TYPE p LENGTH 8 DECIMALS 2 VALUE '19.90',
      lv_cantidad TYPE i VALUE 3,
      lv_total    TYPE p LENGTH 10 DECIMALS 2.

lv_total = lv_precio * lv_cantidad.

WRITE: / 'Nombre:', lv_nombre,
       / 'Edad:', lv_edad,
       / 'Total a pagar:', lv_total.

" Declaración en línea y string templates (ABAP moderno)
DATA(lv_saludo) = |Hola { lv_nombre }, tienes { lv_edad } años|.
WRITE / lv_saludo.

IF lv_edad >= 18.
  WRITE / 'Es mayor de edad'.
ELSE.
  WRITE / 'Es menor de edad'.
ENDIF.

DO 3 TIMES.
  WRITE: / 'Vuelta número', sy-index.
ENDDO.`),
          "Tipos básicos: <code>i</code> (entero), <code>p</code> (decimal empaquetado), <code>c</code> (texto fijo), <code>string</code> (texto variable), <code>d</code> (fecha), <code>t</code> (hora).",
          "Experimenta: cambia la edad a 15, divide entre cero (<code>lv_total = 1 / 0.</code>) y mira el <b>dump</b> que aparece, como en la transacción ST22.",
        ],
        check: () => run("ZP1_VARIABLES")?.status === "ok" && activeHas("ZP1_VARIABLES", /DATA/i),
        hint: "Crea, activa y ejecuta ZP1_VARIABLES.",
      },
      {
        id: "p1s6",
        title: "Pantalla de selección (PARAMETERS)",
        body: [
          "Los reportes reciben datos del usuario con una <b>pantalla de selección</b>. Crea <code>ZP1_PARAMETROS</code>:",
          code(`REPORT zp1_parametros.

PARAMETERS: p_nombre TYPE c LENGTH 30 LOWER CASE OBLIGATORY,
            p_num1   TYPE i DEFAULT 10,
            p_num2   TYPE i DEFAULT 5,
            p_suma   RADIOBUTTON GROUP op DEFAULT 'X',
            p_resta  RADIOBUTTON GROUP op,
            p_mayus  AS CHECKBOX.

DATA lv_resultado TYPE i.

START-OF-SELECTION.
  IF p_suma = abap_true.
    lv_resultado = p_num1 + p_num2.
  ELSE.
    lv_resultado = p_num1 - p_num2.
  ENDIF.

  IF p_mayus = abap_true.
    TRANSLATE p_nombre TO UPPER CASE.
  ENDIF.

  WRITE: / 'Hola', p_nombre,
         / 'Resultado:', lv_resultado.`),
          "Al ejecutar verás la pantalla de selección. Prueba dejar vacío el nombre (es <b>OBLIGATORY</b>) y pulsa <kbd>F8</kbd>.",
          "<b>Extra (traducción):</b> en el editor pulsa <b>Elementos de texto</b> → <i>Textos de selección</i> y pon etiquetas en español e inglés. Luego cambia el idioma en <i>Sistema → Usuario e idioma</i> y vuelve a ejecutar.",
        ],
        check: () => run("ZP1_PARAMETROS")?.status === "ok" && run("ZP1_PARAMETROS").hadScreen,
        hint: "Ejecuta ZP1_PARAMETROS pasando por su pantalla de selección.",
      },
      {
        id: "p1s7",
        title: "Crea tu tabla en SE11",
        body: [
          "Vamos a crear una tabla de base de datos. Ve a <code>/nSE11</code>, escribe <code>ZALUMNOS</code> en <b>Tabla base datos</b> y pulsa <b>Crear</b>.",
          "Descripción breve: <i>Alumnos del curso</i>. En la pestaña <b>Campos</b> define:",
          `<table class="g-table"><tr><th>Campo</th><th>Clave</th><th>Tipo</th><th>Long.</th><th>Dec.</th></tr>
<tr><td>MANDT</td><td>✔</td><td>CLNT</td><td>3</td><td></td></tr>
<tr><td>ID</td><td>✔</td><td>NUMC</td><td>4</td><td></td></tr>
<tr><td>NOMBRE</td><td></td><td>CHAR</td><td>40</td><td></td></tr>
<tr><td>CURSO</td><td></td><td>CHAR</td><td>20</td><td></td></tr>
<tr><td>NOTA</td><td></td><td>DEC</td><td>4</td><td>1</td></tr>
<tr><td>FECHA_ING</td><td></td><td>DATS</td><td>8</td><td></td></tr></table>`,
          "<b>MANDT</b> (mandante) siempre va primero y es clave: separa los datos de cada cliente del sistema. Graba, verifica y <b>activa</b> (<kbd>Ctrl+F3</kbd>). Al activar se crea la tabla en la base de datos.",
        ],
        check: () => {
          const t = store.table("ZALUMNOS");
          return !!t?.active && t.active.fields.length >= 4;
        },
        hint: "Activa la tabla ZALUMNOS con al menos 4 campos.",
      },
      {
        id: "p1s8",
        title: "Llena datos con SE16",
        body: [
          "Ve a <code>/nSE16</code>, escribe <code>ZALUMNOS</code> y pulsa Enter. Verás una pantalla de selección con los campos de la tabla: pulsa <kbd>F8</kbd>.",
          "Pulsa <b>Crear entrada</b> y registra al menos <b>3 alumnos</b> con notas distintas (por ejemplo 0001 Ana 17.5, 0002 Luis 12, 0003 Rosa 19). Las fechas se escriben como <code>DD.MM.AAAA</code>.",
          "Prueba también buscar: en la pantalla de selección de SE16 pon <code>A*</code> en NOMBRE.",
        ],
        check: (app) => countRows(app, "ZALUMNOS") >= 3,
        hint: "Inserta al menos 3 registros en ZALUMNOS.",
      },
      {
        id: "p1s9",
        title: "Lee la tabla con SELECT",
        body: [
          "Crea <code>ZP1_ALUMNOS</code> para leer tu tabla con Open SQL y filtrar con <b>SELECT-OPTIONS</b>:",
          code(`REPORT zp1_alumnos.

TABLES zalumnos.
SELECT-OPTIONS s_id FOR zalumnos-id.
PARAMETERS p_min TYPE i DEFAULT 0.

DATA lt_alumnos TYPE STANDARD TABLE OF zalumnos WITH DEFAULT KEY.

START-OF-SELECTION.
  SELECT * FROM zalumnos
    INTO TABLE @lt_alumnos
    WHERE id   IN @s_id
      AND nota >= @p_min
    ORDER BY id.

  IF sy-subrc <> 0.
    MESSAGE 'No se encontraron alumnos' TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  WRITE: / 'Alumnos encontrados:', lines( lt_alumnos ).
  ULINE.
  LOOP AT lt_alumnos INTO DATA(ls_alumno).
    WRITE: / ls_alumno-id, ls_alumno-nombre, ls_alumno-nota.
  ENDLOOP.`),
          "<code>sy-subrc</code> vale 0 si el SELECT encontró datos. <code>IN @s_id</code> aplica el rango de la pantalla de selección (prueba el botón ➔ de selección múltiple).",
        ],
        check: () => run("ZP1_ALUMNOS")?.status === "ok" && activeHas("ZP1_ALUMNOS", /zalumnos/i),
        hint: "Ejecuta ZP1_ALUMNOS leyendo ZALUMNOS.",
      },
      {
        id: "p1s10",
        title: "Encuentra tus objetos (SE84)",
        body: [
          "Ve a <code>/nSE84</code>, deja <code>Z*</code> en el nombre y pulsa <kbd>F8</kbd>. Verás todos tus programas y tablas.",
          "Doble clic sobre un objeto para abrirlo. ¡Terminaste el Paso 1! 🎉 Sigue con el <b>Paso 2</b>: reportes ALV.",
        ],
        check: () => !!store.data.visited["SE84"] && !!store.data.visited["SE84-RES"],
        hint: "Haz una búsqueda en SE84.",
      },
    ],
  },
  {
    id: "p2",
    title: "Paso 2",
    subtitle: "Reportes ALV con CL_SALV_TABLE",
    steps: [
      {
        id: "p2s1",
        title: "¿Qué es un ALV?",
        body: [
          "El <b>ALV</b> (ABAP List Viewer) es la forma estándar de mostrar tablas en SAP: una grilla con barra de pulsadores para ordenar, filtrar, totalizar y exportar a Excel.",
          "La forma moderna de crearlo es la clase <code>CL_SALV_TABLE</code>. Solo necesitas una <b>tabla interna</b> con datos.",
          "Crea el programa <code>ZP2_ALV</code> y llena una tabla interna con los vuelos de la tabla estándar <b>SFLIGHT</b>:",
          code(`REPORT zp2_alv.

DATA: gt_vuelos TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY,
      go_alv    TYPE REF TO cl_salv_table.

START-OF-SELECTION.
  SELECT * FROM sflight INTO TABLE @gt_vuelos.
  WRITE: / 'Vuelos leídos:', lines( gt_vuelos ).`),
          "Actívalo y ejecútalo. (Puedes ver los datos de SFLIGHT también en SE16.)",
        ],
        check: () => run("ZP2_ALV")?.status === "ok",
        hint: "Crea y ejecuta ZP2_ALV.",
      },
      {
        id: "p2s2",
        title: "Tu primer ALV",
        body: [
          "Reemplaza el <code>WRITE</code> por la creación del ALV. <code>factory</code> crea el objeto y <code>display</code> lo muestra:",
          code(`REPORT zp2_alv.

DATA: gt_vuelos TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY,
      go_alv    TYPE REF TO cl_salv_table.

START-OF-SELECTION.
  SELECT * FROM sflight INTO TABLE @gt_vuelos.

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = go_alv
        CHANGING  t_table      = gt_vuelos ).
    CATCH cx_salv_msg INTO DATA(lx_msg).
      MESSAGE lx_msg->get_text( ) TYPE 'E'.
  ENDTRY.

  go_alv->display( ).`),
          "<code>factory</code> puede lanzar la excepción <code>CX_SALV_MSG</code>, por eso va dentro de <code>TRY ... CATCH</code>. Ejecuta: verás la grilla pero <b>sin botones</b>. Eso lo arreglamos en el siguiente ejercicio.",
        ],
        check: () => alvs("ZP2_ALV").length > 0,
        hint: "Ejecuta ZP2_ALV mostrando un ALV.",
      },
      {
        id: "p2s3",
        title: "La barra de pulsadores",
        body: [
          "Agrega esta línea <b>antes</b> de <code>go_alv->display( ).</code>:",
          code(`  go_alv->get_functions( )->set_all( abap_true ).`),
          "Ahora el ALV tiene su barra de pulsadores: detalle, ordenar ▲▼, filtro, total Σ, subtotales, layout y exportar a hoja de cálculo.",
          "Pruébalos: haz clic en la cabecera de la columna <b>PRICE</b> y pulsa Σ; luego ordena por fecha. Con <code>set_default( )</code> en vez de <code>set_all( )</code> tendrías solo las funciones básicas.",
        ],
        check: () => alvs("ZP2_ALV").some((a) => a.allFunctions || a.defaultFunctions),
        hint: "Activa las funciones del ALV y ejecútalo.",
      },
      {
        id: "p2s4",
        title: "Columnas: optimizar, renombrar y ocultar",
        body: [
          "Las columnas se manejan con <code>get_columns( )</code>. Agrega antes del <code>display</code>:",
          code(`  DATA(lo_columnas) = go_alv->get_columns( ).
  lo_columnas->set_optimize( abap_true ).

  TRY.
      DATA lo_columna TYPE REF TO cl_salv_column_table.
      lo_columna ?= lo_columnas->get_column( 'MANDT' ).
      lo_columna->set_visible( abap_false ).

      lo_columna ?= lo_columnas->get_column( 'PRICE' ).
      lo_columna->set_long_text( 'Precio del vuelo' ).
    CATCH cx_salv_not_found.
      MESSAGE 'Columna no encontrada' TYPE 'I'.
  ENDTRY.`),
          "<code>set_optimize</code> ajusta el ancho al contenido. <code>?=</code> es un <i>casting</i>: <code>get_column</code> devuelve un <code>CL_SALV_COLUMN</code> y lo convertimos a <code>CL_SALV_COLUMN_TABLE</code>. Prueba escribir mal un nombre de columna y verás el CATCH.",
        ],
        check: () => alvs("ZP2_ALV").some((a) => a.optimize && a.hidden.length > 0),
        hint: "Optimiza columnas y oculta MANDT.",
      },
      {
        id: "p2s5",
        title: "Título y diseño cebra",
        body: [
          "Con <code>get_display_settings( )</code> controlas el aspecto general:",
          code(`  DATA(lo_display) = go_alv->get_display_settings( ).
  lo_display->set_list_header( 'Vuelos disponibles' ).
  lo_display->set_striped_pattern( abap_true ).`),
          "El título aparece en la barra de título y las filas se muestran alternando colores (cebra).",
        ],
        check: () => alvs("ZP2_ALV").some((a) => a.header && a.striped),
        hint: "Pon título y diseño cebra.",
      },
      {
        id: "p2s6",
        title: "Ordenar y totalizar desde el código",
        body: [
          "También puedes dejar el ALV ordenado y con totales al abrirse:",
          code(`  TRY.
      go_alv->get_sorts( )->add_sort( columnname = 'CARRID' subtotal = abap_true ).
      go_alv->get_aggregations( )->add_aggregation( 'PAYMENTSUM' ).
    CATCH cx_salv_not_found cx_salv_existing cx_salv_data_error.
      MESSAGE 'Error al ordenar o totalizar' TYPE 'I'.
  ENDTRY.`),
          "Verás el total de <b>PAYMENTSUM</b> al final y un subtotal por cada aerolínea.",
          "<details><summary>Ver el programa completo</summary>" +
            `<pre class="g-code">${esc(`REPORT zp2_alv.

DATA: gt_vuelos TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY,
      go_alv    TYPE REF TO cl_salv_table.

START-OF-SELECTION.
  SELECT * FROM sflight INTO TABLE @gt_vuelos.

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = go_alv
        CHANGING  t_table      = gt_vuelos ).
    CATCH cx_salv_msg INTO DATA(lx_msg).
      MESSAGE lx_msg->get_text( ) TYPE 'E'.
  ENDTRY.

  go_alv->get_functions( )->set_all( abap_true ).

  DATA(lo_columnas) = go_alv->get_columns( ).
  lo_columnas->set_optimize( abap_true ).

  TRY.
      DATA lo_columna TYPE REF TO cl_salv_column_table.
      lo_columna ?= lo_columnas->get_column( 'MANDT' ).
      lo_columna->set_visible( abap_false ).

      lo_columna ?= lo_columnas->get_column( 'PRICE' ).
      lo_columna->set_long_text( 'Precio del vuelo' ).
    CATCH cx_salv_not_found.
      MESSAGE 'Columna no encontrada' TYPE 'I'.
  ENDTRY.

  DATA(lo_display) = go_alv->get_display_settings( ).
  lo_display->set_list_header( 'Vuelos disponibles' ).
  lo_display->set_striped_pattern( abap_true ).

  TRY.
      go_alv->get_sorts( )->add_sort( columnname = 'CARRID' subtotal = abap_true ).
      go_alv->get_aggregations( )->add_aggregation( 'PAYMENTSUM' ).
    CATCH cx_salv_not_found cx_salv_existing cx_salv_data_error.
      MESSAGE 'Error al ordenar o totalizar' TYPE 'I'.
  ENDTRY.

  go_alv->display( ).`)}</pre></details>`,
        ],
        check: () => alvs("ZP2_ALV").some((a) => a.sorts.length > 0 && a.aggregations.length > 0),
        hint: "Agrega un orden y un total.",
      },
      {
        id: "p2s7",
        title: "ALV de tu tabla con pantalla de selección",
        body: [
          "Ahora junta todo: un reporte <code>ZP2_ALV_ALUMNOS</code> con pantalla de selección que muestre tu tabla <b>ZALUMNOS</b> en un ALV.",
          code(`REPORT zp2_alv_alumnos.

TABLES zalumnos.
SELECT-OPTIONS: s_id    FOR zalumnos-id,
                s_curso FOR zalumnos-curso.

DATA gt_alumnos TYPE STANDARD TABLE OF zalumnos WITH DEFAULT KEY.

START-OF-SELECTION.
  SELECT * FROM zalumnos
    INTO TABLE @gt_alumnos
    WHERE id    IN @s_id
      AND curso IN @s_curso.

  IF gt_alumnos IS INITIAL.
    MESSAGE 'No hay alumnos para esa selección' TYPE 'S' DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = gt_alumnos ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_display_settings( )->set_list_header( 'Reporte de alumnos' ).
      lo_alv->get_display_settings( )->set_striped_pattern( abap_true ).
      lo_alv->get_aggregations( )->add_aggregation(
        columnname  = 'NOTA'
        aggregation = if_salv_c_aggregation=>average ).
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found cx_salv_existing cx_salv_data_error INTO DATA(lx_error).
      MESSAGE lx_error->get_text( ) TYPE 'E'.
  ENDTRY.`),
          "Las cabeceras de columna salen de las <b>descripciones</b> que pusiste en SE11. La fila Σ muestra el <b>promedio</b> de notas.",
        ],
        check: () => alvs("ZP2_ALV_ALUMNOS").some((a) => a.ddicName === "ZALUMNOS") && run("ZP2_ALV_ALUMNOS")?.hadScreen,
        hint: "Muestra ZALUMNOS en un ALV desde un reporte con pantalla de selección.",
      },
      {
        id: "p2s8",
        title: "Reto final: columna calculada",
        body: [
          "Crea <code>ZP2_RETO</code>: un ALV de vuelos de una aerolínea (parámetro <code>P_CARR</code>) con una columna nueva <b>OCUPACION</b> (% de plazas ocupadas = SEATSOCC * 100 / SEATSMAX), ordenado de mayor a menor ocupación.",
          "Pistas: define un tipo propio con <code>TYPES: BEGIN OF ty_vuelo ... END OF ty_vuelo.</code>, usa <code>INTO CORRESPONDING FIELDS OF TABLE</code> y recorre la tabla con <code>LOOP AT ... ASSIGNING FIELD-SYMBOL(&lt;ls_vuelo&gt;)</code>.",
          `<details><summary>Ver una solución</summary><pre class="g-code">${esc(`REPORT zp2_reto.

TYPES: BEGIN OF ty_vuelo,
         carrid    TYPE sflight-carrid,
         connid    TYPE sflight-connid,
         fldate    TYPE sflight-fldate,
         seatsmax  TYPE sflight-seatsmax,
         seatsocc  TYPE sflight-seatsocc,
         ocupacion TYPE p LENGTH 5 DECIMALS 1,
       END OF ty_vuelo.

DATA gt_vuelos TYPE STANDARD TABLE OF ty_vuelo WITH DEFAULT KEY.

PARAMETERS p_carr TYPE sflight-carrid DEFAULT 'LA'.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    INTO CORRESPONDING FIELDS OF TABLE @gt_vuelos
    WHERE carrid = @p_carr.

  LOOP AT gt_vuelos ASSIGNING FIELD-SYMBOL(<ls_vuelo>).
    IF <ls_vuelo>-seatsmax > 0.
      <ls_vuelo>-ocupacion = <ls_vuelo>-seatsocc * 100 / <ls_vuelo>-seatsmax.
    ENDIF.
  ENDLOOP.

  SORT gt_vuelos BY ocupacion DESCENDING.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = gt_vuelos ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_columns( )->get_column( 'OCUPACION' )->set_long_text( 'Ocupación %' ).
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found INTO DATA(lx_error).
      MESSAGE lx_error->get_text( ) TYPE 'E'.
  ENDTRY.`)}</pre></details>`,
          "¡Con esto dominas lo esencial de los reportes ALV! 🏆",
        ],
        check: () => alvs("ZP2_RETO").some((a) => a.columns.includes("OCUPACION")),
        hint: "Muestra un ALV con la columna OCUPACION en ZP2_RETO.",
      },
    ],
  },
];

export function guidePanel(app, host) {
  let current = localStorage.getItem("abapp.guideTab") || "p1";
  let openStep = null;
  const done = () => {
    const out = {};
    for (const g of GUIDES)
      for (const s of g.steps) {
        try {
          out[s.id] = !!store.data.manual[s.id] || !!(app.engine && s.check(app));
        } catch {
          out[s.id] = false;
        }
      }
    return out;
  };
  let lastDone = null;

  const render = () => {
    const d = done();
    if (lastDone && app.engine) {
      for (const [k, v] of Object.entries(d)) {
        if (v && !lastDone[k]) {
          const step = GUIDES.flatMap((g) => g.steps).find((s) => s.id === k);
          toast(`✔ Ejercicio completado: ${step.title}`);
          openStep = null;
        }
      }
    }
    lastDone = app.engine ? d : null;
    const g = GUIDES.find((x) => x.id === current);
    const total = g.steps.length;
    const n = g.steps.filter((s) => d[s.id]).length;
    const firstOpen = g.steps.find((s) => !d[s.id])?.id;
    const active = openStep || firstOpen;
    host.replaceChildren(
      h(
        "div",
        { class: "guide" },
        h(
          "div",
          { class: "guide-top" },
          h(
            "div",
            { class: "guide-tabs" },
            GUIDES.map((x) => {
              const xn = x.steps.filter((s) => d[s.id]).length;
              return h(
                "button",
                {
                  class: "gtab" + (x.id === current ? " active" : ""),
                  onclick: () => {
                    current = x.id;
                    openStep = null;
                    localStorage.setItem("abapp.guideTab", current);
                    render();
                  },
                },
                x.title,
                h("span", { class: "gtab-count" }, `${xn}/${x.steps.length}`),
              );
            }),
          ),
          h("button", { class: "guide-close", title: "Ocultar guía", onclick: () => app.toggleGuide(false) }, "✕"),
        ),
        h("div", { class: "guide-sub" }, g.subtitle),
        h("div", { class: "progress" }, h("div", { class: "progress-bar", style: { width: (n / total) * 100 + "%" } })),
        h(
          "div",
          { class: "steps" },
          g.steps.map((s, i) => {
            const isOpen = s.id === active;
            return h(
              "div",
              { class: "step" + (d[s.id] ? " done" : "") + (isOpen ? " open" : "") },
              h(
                "button",
                {
                  class: "step-head",
                  onclick: () => {
                    openStep = isOpen ? "__none" : s.id;
                    render();
                  },
                },
                h("span", { class: "step-num" }, d[s.id] ? "✔" : i + 1),
                h("span", { class: "step-title" }, s.title),
              ),
              isOpen
                ? h(
                    "div",
                    { class: "step-body" },
                    s.body.map((b) =>
                      typeof b === "string"
                        ? h("div", { class: "g-p", html: b })
                        : h(
                            "div",
                            { class: "g-codewrap" },
                            h("pre", { class: "g-code" }, b.code),
                            h(
                              "button",
                              {
                                class: "copy-btn",
                                onclick: async (e) => {
                                  try {
                                    await navigator.clipboard.writeText(b.code);
                                    e.target.textContent = "¡Copiado!";
                                  } catch {
                                    e.target.textContent = "Selecciona y copia";
                                  }
                                  setTimeout(() => (e.target.textContent = "Copiar"), 1500);
                                },
                              },
                              "Copiar",
                            ),
                          ),
                    ),
                    h(
                      "div",
                      { class: "step-foot" },
                      d[s.id]
                        ? h("span", { class: "ok" }, "✔ Completado")
                        : h("span", { class: "pending" }, "⏳ " + s.hint + " Se marcará solo al lograrlo."),
                      !d[s.id]
                        ? h(
                            "button",
                            {
                              class: "link",
                              onclick: () => {
                                store.data.manual[s.id] = true;
                                store.save();
                              },
                            },
                            "Marcar como hecho",
                          )
                        : store.data.manual[s.id]
                          ? h(
                              "button",
                              {
                                class: "link",
                                onclick: () => {
                                  delete store.data.manual[s.id];
                                  store.save();
                                },
                              },
                              "Desmarcar",
                            )
                          : null,
                    ),
                  )
                : null,
            );
          }),
        ),
        n === total ? h("div", { class: "guide-done" }, current === "p1" ? "¡Paso 1 completado! Continúa con el Paso 2 →" : "¡Paso 2 completado! Ya sabes crear reportes ALV.") : null,
      ),
    );
  };

  function toast(text) {
    const t = h("div", { class: "toast" }, text);
    document.body.append(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 400);
    }, 3200);
  }

  store.onChange(() => render());
  render();
  return { render };
}
