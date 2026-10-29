// Guías de práctica paso a paso con validación automática.
import { h, esc } from "./ui.js";
import { store } from "./store.js";

const code = (src) => ({ code: src.trim() });
const syntax = (rows) => ({ syntax: rows });

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
          syntax([
            ['REPORT zp1_hola.', 'Primera instrucción de todo programa ejecutable: declara su nombre.'],
            ['.  (punto)', '<b>Toda instrucción ABAP termina con un punto.</b> Si falta, la verificación marca error de sintaxis. Es el error más común al empezar.'],
            ["WRITE 'texto'.", 'Escribe un valor en la lista de salida. Los textos fijos (literales) van entre comillas simples.'],
            ['/', 'Dentro de WRITE indica <b>salto de línea</b>: lo que sigue se escribe en una línea nueva.'],
            ['ULINE.', 'Dibuja una línea horizontal en la lista (útil para separar secciones).'],
            ['WRITE: a, b.', 'Los <b>dos puntos</b> encadenan varias instrucciones iguales: los elementos se separan con coma y solo el último lleva punto. Equivale a escribir varios WRITE seguidos.'],
            ['sy-uname / sy-datum', 'Campos del sistema (estructura SY): usuario conectado y fecha de hoy. Otros útiles: sy-uzeit (hora), sy-subrc (código de retorno), sy-index (vuelta de un bucle).'],
            ['*   y   "', 'Comentarios: un <code>*</code> en la primera columna comenta toda la línea; unas comillas dobles <code>"</code> comentan desde ahí hasta el final de la línea.'],
            ['MAYÚSCULAS', 'ABAP no distingue mayúsculas de minúsculas en el código. Por convención las palabras clave van en mayúsculas (el Pretty Printer, Shift+F1, lo hace solo).'],
          ]),
          "Ahora el ciclo de trabajo de todo programador ABAP:",
          "<ul><li><kbd>Ctrl+S</kbd> <b>Grabar</b>: guarda una versión <i>inactiva</i>.</li><li><kbd>Ctrl+F2</kbd> <b>Verificar</b>: revisa la sintaxis.</li><li><kbd>Ctrl+F3</kbd> <b>Activar</b>: crea la versión activa, que es la que se ejecuta.</li></ul>",
          "Fíjate en la etiqueta <b>Activo / Inactivo</b> encima del editor.",
          "<b>¿Qué hace realmente cada botón?</b><ul><li><b>Verificar</b> pasa tu código por un analizador de sintaxis ABAP real: detecta puntos que faltan, instrucciones mal escritas, variables o tablas que no existen, y te dice la línea. Haz la prueba: borra el punto de un WRITE y pulsa Ctrl+F2.</li><li><b>Activar</b> primero verifica; si hay errores no activa. Si todo está bien, guarda una copia como <i>versión activa</i>. <b>F8 siempre ejecuta la versión activa</b>, no lo que ves en pantalla.</li></ul>",
          "<b>Compruébalo:</b> después de activar, cambia el texto de un WRITE, graba con Ctrl+S (sin activar) y pulsa F8. El sistema te avisa que hay cambios sin activar; si eliges <i>Ejecutar versión activa</i> verás el texto <b>anterior</b>.",
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
          "<b>Los campos del sistema (SY).</b> <code>SY</code> es una estructura que el sistema llena solo en todo momento; sus campos se leen con guion: <code>sy-campo</code>. Agrega estas líneas al final de ZP1_HOLA, activa y ejecuta para ver sus valores:",
          code(`ULINE.
WRITE: / 'Usuario  (sy-uname):', sy-uname,
       / 'Fecha    (sy-datum):', sy-datum,
       / 'Hora     (sy-uzeit):', sy-uzeit,
       / 'Idioma   (sy-langu):', sy-langu,
       / 'Programa (sy-repid):', sy-repid,
       / 'Mandante (sy-mandt):', sy-mandt,
       / 'Sistema  (sy-sysid):', sy-sysid.`),
          syntax([
            ["sy-uname", "Usuario conectado (aquí es el que configuras en Sistema → Usuario e idioma). Se usa, por ejemplo, para guardar quién creó un registro."],
            ["sy-datum", "Fecha de hoy, tipo <code>d</code>. Internamente se guarda como AAAAMMDD (ej. 20261029); WRITE la muestra como DD.MM.AAAA."],
            ["sy-uzeit", "Hora actual, tipo <code>t</code>. Internamente HHMMSS; WRITE la muestra como HH:MM:SS."],
            ["sy-langu", "Idioma de inicio de sesión: S = español, E = inglés. Decide qué traducción de los textos se muestra."],
            ["sy-repid", "Nombre del programa que se está ejecutando."],
            ["sy-mandt", "Mandante (cliente) en el que trabajas, aquí 100. Es el valor que se guarda en el campo MANDT de las tablas."],
            ["sy-sysid", "Identificador del sistema SAP (aquí NPL)."],
            ["sy-subrc", "Código de retorno de la última instrucción: 0 = todo bien; otro valor (normalmente 4) = no encontró datos o falló. Lo revisarás después de SELECT, READ TABLE, etc."],
            ["sy-index", "Número de vuelta actual dentro de un bucle DO o WHILE (empieza en 1)."],
            ["sy-tabix", "Número de línea actual al recorrer una tabla interna con LOOP o al leerla con READ TABLE."],
            ["sy-dbcnt", "Cantidad de filas que procesó la última instrucción de base de datos (SELECT, INSERT, UPDATE, DELETE)."],
            ["Regla", "Los campos SY solo se leen: no les asignes valores en tu programa."],
          ]),
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
          syntax([
            ['DATA nombre TYPE tipo.', 'Declara una variable. <code>TYPE</code> indica su tipo de datos.'],
            ['VALUE', 'Valor inicial de la variable al declararla.'],
            ['TYPE p LENGTH 8 DECIMALS 2', 'Número empaquetado (decimal exacto, ideal para importes). LENGTH es el tamaño en bytes y DECIMALS la cantidad de decimales.'],
            ['DATA: a ..., b ... .', 'Declaración encadenada con dos puntos: varias variables en una sola instrucción, separadas por comas.'],
            ['=   +  -  *  /', 'Asignación y operadores aritméticos. Deja un espacio a cada lado de los operadores: <code>a = b + c.</code> (sin espacios da error). También existen DIV (división entera) y MOD (resto).'],
            ['DATA(var) = ...', 'Declaración en línea: crea la variable en el momento de asignarla y deduce el tipo del valor.'],
            ['|Hola { var }|', 'String template: texto entre barras verticales; lo que va entre llaves se reemplaza por el valor de la expresión.'],
            ['IF ... ELSE ... ENDIF.', 'Condición. Comparadores: = &lt;&gt; &lt; &gt; &lt;= &gt;= (o EQ NE LT GT LE GE). También existe ELSEIF. Cada bloque se cierra con su END.'],
            ['DO n TIMES. ... ENDDO.', 'Bucle que se repite n veces. <code>sy-index</code> indica el número de vuelta actual.'],
          ]),
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
          syntax([
            ['PARAMETERS p_x TYPE ...', 'Crea un campo de entrada en la pantalla de selección. El nombre tiene como máximo 8 caracteres.'],
            ['OBLIGATORY', 'El campo es obligatorio: no se puede ejecutar si está vacío.'],
            ['DEFAULT valor', 'Valor que aparece ya escrito al abrir la pantalla.'],
            ['LOWER CASE', 'Respeta minúsculas. Sin esta opción, lo escrito se convierte a mayúsculas.'],
            ['RADIOBUTTON GROUP g', "Opciones excluyentes del mismo grupo: solo una puede estar marcada (vale 'X')."],
            ['AS CHECKBOX', "Casilla de verificación: 'X' si está marcada, espacio si no."],
            ['START-OF-SELECTION.', 'Evento: el código que sigue se ejecuta cuando el usuario pulsa F8 en la pantalla de selección.'],
            ['abap_true / abap_false', "Constantes booleanas de ABAP: 'X' y ' ' (espacio)."],
            ['TRANSLATE v TO UPPER CASE.', 'Convierte el contenido de una variable a mayúsculas.'],
          ]),
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
<tr><td>MANDT</td><td>X</td><td>CLNT</td><td>3</td><td></td></tr>
<tr><td>ID</td><td>X</td><td>NUMC</td><td>4</td><td></td></tr>
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
          syntax([
            ['TABLES zalumnos.', 'Declara un área de trabajo con la estructura de la tabla. Se necesita para usar <code>FOR zalumnos-id</code> en la pantalla de selección.'],
            ['SELECT-OPTIONS s_id FOR campo.', 'Rango desde/hasta con selección múltiple. Internamente es una tabla con las columnas SIGN, OPTION, LOW y HIGH.'],
            ['TYPE STANDARD TABLE OF ...', 'Tabla interna (en memoria) cuyas líneas tienen la estructura indicada.'],
            ['SELECT * FROM t INTO TABLE @itab', 'Lee la base de datos. <code>*</code> trae todos los campos. En el SQL moderno las variables ABAP llevan <code>@</code> delante y los campos de la lista se separan con comas.'],
            ['WHERE ... IN @s_id', 'Filtra por el rango ingresado en la pantalla de selección. Varias condiciones se unen con AND / OR.'],
            ['ORDER BY id', 'Ordena el resultado por ese campo.'],
            ['sy-subrc', 'Código de retorno de la última instrucción: 0 = éxito, 4 = no se encontraron datos.'],
            ["MESSAGE 'texto' TYPE 'S'.", 'Muestra un mensaje. Tipos: S (barra de estado), I (ventana), W (advertencia), E (error), A (cancelación). DISPLAY LIKE cambia solo el aspecto.'],
            ['RETURN.', 'Termina el bloque actual (aquí, el programa).'],
            ['lines( itab )', 'Función que devuelve la cantidad de líneas de una tabla interna. Dentro de los paréntesis siempre va un espacio.'],
            ['LOOP AT itab INTO DATA(ls). ENDLOOP.', 'Recorre la tabla línea por línea; en cada vuelta la línea actual queda en <code>ls</code>.'],
            ['ls-campo', 'El guion accede a un componente (campo) de una estructura.'],
          ]),
          "<code>sy-subrc</code> vale 0 si el SELECT encontró datos. <code>IN @s_id</code> aplica el rango de la pantalla de selección (prueba el botón de flecha a la derecha: selección múltiple).",
        ],
        check: () => run("ZP1_ALUMNOS")?.status === "ok" && activeHas("ZP1_ALUMNOS", /zalumnos/i),
        hint: "Ejecuta ZP1_ALUMNOS leyendo ZALUMNOS.",
      },
      {
        id: "p1s10i",
        title: "Organiza tu código con INCLUDE",
        body: [
          "En los programas reales el código se reparte en <b>includes</b>: programas de tipo <b>I</b> que no se ejecutan solos, sino que se insertan en el programa principal con la instrucción <code>INCLUDE</code>. La convención es: <code>_TOP</code> para declaraciones, <code>_SEL</code> para la pantalla de selección y <code>_F01</code> para las subrutinas.",
          "1) En SE38 crea el programa ejecutable <code>ZP1_REPORTE</code> con este código:",
          code(`REPORT zp1_reporte.

INCLUDE zp1_reporte_top.   " Declaraciones globales
INCLUDE zp1_reporte_sel.   " Pantalla de selección

START-OF-SELECTION.
  PERFORM obtener_datos.
  PERFORM mostrar_datos.

INCLUDE zp1_reporte_f01.   " Subrutinas (FORM)`),
          "2) Graba (Ctrl+S) y haz <b>doble clic</b> sobre <code>zp1_reporte_top</code>: el sistema pregunta si quieres crear el include. Acepta y escribe:",
          code(`TABLES scarr.

TYPES: BEGIN OF ty_aerolinea,
         carrid   TYPE scarr-carrid,
         carrname TYPE scarr-carrname,
         currcode TYPE scarr-currcode,
       END OF ty_aerolinea.

DATA gt_aerolineas TYPE STANDARD TABLE OF ty_aerolinea WITH DEFAULT KEY.`),
          "3) Vuelve con F3 y crea igual <code>zp1_reporte_sel</code>:",
          code(`SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME.
  SELECT-OPTIONS s_carr FOR scarr-carrid.
SELECTION-SCREEN END OF BLOCK b1.`),
          "4) Y por último <code>zp1_reporte_f01</code>:",
          code(`FORM obtener_datos.
  SELECT carrid, carrname, currcode
    FROM scarr
    INTO TABLE @gt_aerolineas
    WHERE carrid IN @s_carr
    ORDER BY carrid.
ENDFORM.

FORM mostrar_datos.
  WRITE: / 'Aerolíneas encontradas:', lines( gt_aerolineas ).
  ULINE.
  LOOP AT gt_aerolineas INTO DATA(ls_aerolinea).
    WRITE: / ls_aerolinea-carrid, ls_aerolinea-carrname, ls_aerolinea-currcode.
  ENDLOOP.
ENDFORM.`),
          "5) Vuelve al programa principal, <b>activa</b> (Ctrl+F3: se activan también los includes) y ejecuta con F8. Si verificas un include, el sistema lo revisa dentro de su programa principal, y los errores indican en qué include y línea están.",
          syntax([
            ["INCLUDE nombre.", "Inserta en ese punto todo el código del include, como si estuviera escrito ahí. Si el include no existe, la verificación da error."],
            ["Programa tipo I", "Un include no lleva REPORT y no se puede ejecutar solo (F8 ejecuta su programa principal)."],
            ["PERFORM nombre.", "Llama a una subrutina."],
            ["FORM nombre. ... ENDFORM.", "Define una subrutina: un bloque de código reutilizable con nombre."],
            ["TYPES: BEGIN OF ty ... END OF ty.", "Define un tipo de estructura propio, con los campos que necesites."],
            ["TYPE scarr-carrid", "Toma el tipo de un campo de una tabla del diccionario (SE11)."],
            ["SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME.", "Agrupa campos de la pantalla de selección dentro de un marco. Se cierra con END OF BLOCK."],
            ["SELECT campo1, campo2", "Lee solo los campos indicados (separados por comas) en vez de todos."],
          ]),
        ],
        check: () => {
          const incs = ["ZP1_REPORTE_TOP", "ZP1_REPORTE_SEL", "ZP1_REPORTE_F01"].filter((n) => prog(n)?.type === "I");
          return incs.length >= 2 && run("ZP1_REPORTE")?.status === "ok" && activeHas("ZP1_REPORTE", /^\s*INCLUDE\s+/im);
        },
        hint: "Ejecuta ZP1_REPORTE usando al menos dos includes.",
      },
      {
        id: "p1s10",
        title: "Encuentra tus objetos (SE84)",
        body: [
          "Ve a <code>/nSE84</code>, deja <code>Z*</code> en el nombre y pulsa <kbd>F8</kbd>. Verás todos tus programas, includes y tablas.",
          "Doble clic sobre un objeto para abrirlo. ¡Terminaste el Paso 1! Sigue con el <b>Paso 2</b>: reportes ALV.",
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
          syntax([
            ['TYPE REF TO cl_salv_table', 'Variable de referencia: apunta a un objeto de la clase CL_SALV_TABLE. Al declararla está vacía; el objeto se crea después.'],
            ['SELECT * FROM sflight INTO TABLE @gt_vuelos.', 'Copia todas las filas de SFLIGHT a la tabla interna.'],
          ]),
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
          syntax([
            ['cl_salv_table=>factory( )', '<code>=&gt;</code> llama a un método <b>estático</b> de una clase (no necesita objeto). factory crea el ALV.'],
            ['IMPORTING / CHANGING', 'Parámetros del método: IMPORTING recibe valores que devuelve el método (aquí el objeto ALV); CHANGING pasa una variable que el método puede leer y modificar (la tabla).'],
            ['TRY. ... CATCH cx. ... ENDTRY.', 'Manejo de excepciones: si algo dentro de TRY falla con esa excepción, se ejecuta el bloque CATCH en vez de terminar con un dump.'],
            ['INTO DATA(lx_msg)', 'Guarda el objeto de la excepción para poder leer su mensaje.'],
            ['go_alv->display( )', '<code>-&gt;</code> llama a un método de <b>instancia</b> (de un objeto ya creado).'],
            ['( )', 'Los paréntesis de un método llevan siempre un espacio por dentro: <code>display( )</code>, <code>get_text( )</code>.'],
          ]),
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
          syntax([
            ['get_functions( )->set_all( abap_true )', 'Encadenamiento de métodos: get_functions devuelve el objeto de funciones y sobre él se llama a set_all, todo en una línea.'],
            ['set_all / set_default', 'set_all activa todas las funciones de la barra; set_default solo las básicas.'],
          ]),
          "Ahora el ALV tiene su barra de pulsadores: detalle, ordenar ascendente/descendente, filtro, total Σ, subtotales, layout y exportar a hoja de cálculo.",
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
          syntax([
            ['DATA(lo_columnas) = go_alv->get_columns( ).', 'Guarda el objeto que administra las columnas en una variable creada en línea.'],
            ['lo_columna ?= ...', '<b>Casting</b>: convierte la referencia general CL_SALV_COLUMN a la clase más específica CL_SALV_COLUMN_TABLE para poder usar todos sus métodos.'],
            ["get_column( 'MANDT' )", 'Busca una columna por su nombre técnico, en mayúsculas. Si no existe, lanza CX_SALV_NOT_FOUND.'],
            ['set_visible( abap_false )', 'Oculta la columna. set_long_text cambia el texto de la cabecera.'],
          ]),
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
          syntax([
            ['get_display_settings( )', 'Devuelve el objeto con las opciones de visualización del ALV.'],
            ["set_list_header( 'texto' )", 'Título del ALV.'],
            ['set_striped_pattern( abap_true )', 'Activa el diseño cebra (filas de colores alternos).'],
          ]),
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
          syntax([
            ["add_sort( columnname = 'CARRID' subtotal = abap_true )", 'Parámetros con nombre: <code>nombre = valor</code>, separados por espacios. subtotal muestra un subtotal por cada valor de la columna.'],
            ["add_aggregation( 'PAYMENTSUM' )", 'Agrega un total (suma) al final de la columna. Con un solo parámetro no hace falta escribir su nombre.'],
            ['CATCH cx_a cx_b cx_c.', 'Un CATCH puede capturar varias excepciones a la vez, separadas por espacios.'],
          ]),
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
          syntax([
            ['IF gt_alumnos IS INITIAL.', 'IS INITIAL comprueba si una variable está vacía (una tabla sin líneas, un número en 0, un texto en blanco).'],
            ['IMPORTING r_salv_table = DATA(lo_alv)', 'Declaración en línea directamente en el parámetro del método.'],
            ['if_salv_c_aggregation=>average', 'Constante de una interfaz: indica que el total sea un promedio (también hay total, minimum, maximum).'],
          ]),
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
          syntax([
            ['INTO CORRESPONDING FIELDS OF TABLE', 'Copia cada campo leído al componente de la tabla interna que tenga el mismo nombre.'],
            ['ASSIGNING FIELD-SYMBOL(<fs>)', 'Un field-symbol apunta directamente a la línea de la tabla: si lo modificas, cambias la tabla (sin necesidad de MODIFY).'],
            ['SORT itab BY campo DESCENDING.', 'Ordena la tabla interna por ese campo, de mayor a menor.'],
          ]),
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
          "¡Con esto dominas lo esencial de los reportes ALV!",
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
          toast(`Ejercicio completado: ${step.title}`);
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
          h("button", { class: "guide-close", title: "Ocultar guía", onclick: () => app.toggleGuide(false) }, h("span", { class: "ico ico-close" })),
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
                h("span", { class: "step-num" }, d[s.id] ? h("span", { class: "ico ico-ok" }) : i + 1),
                h("span", { class: "step-title" }, s.title),
              ),
              isOpen
                ? h(
                    "div",
                    { class: "step-body" },
                    s.body.map((b) =>
                      typeof b === "string"
                        ? h("div", { class: "g-p", html: b })
                        : b.syntax
                          ? h(
                              "details",
                              { class: "g-syntax", open: true },
                              h("summary", {}, "Explicación de la sintaxis"),
                              h(
                                "dl",
                                {},
                                b.syntax.map(([t, d]) => [h("dt", {}, h("code", {}, t)), h("dd", { html: d })]),
                              ),
                            )
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
                        ? h("span", { class: "ok" }, "Completado")
                        : h("span", { class: "pending" }, s.hint + " Se marcará solo al lograrlo."),
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
