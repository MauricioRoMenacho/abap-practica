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
  {
    id: "p3",
    title: "Paso 3",
    subtitle: "Tablas internas, tablas estándar y JOINs",
    steps: [
      {
        id: "p3s1",
        title: "Estructuras y tablas internas",
        body: [
          "Una <b>tabla interna</b> es una tabla que vive en la memoria mientras corre el programa: la llenas, la recorres, la ordenas... y desaparece al terminar. Sus líneas tienen la forma de una <b>estructura</b> que defines con TYPES.",
          "Crea el programa <code>ZP3_TABLAS</code>:",
          code(`REPORT zp3_tablas.

TYPES: BEGIN OF ty_producto,
         codigo TYPE c LENGTH 10,
         nombre TYPE c LENGTH 20,
         precio TYPE p LENGTH 8 DECIMALS 2,
         stock  TYPE i,
       END OF ty_producto,
       tt_productos TYPE STANDARD TABLE OF ty_producto WITH EMPTY KEY.

DATA: ls_producto  TYPE ty_producto,
      lt_productos TYPE tt_productos.

" 1) Llenar con APPEND usando un área de trabajo
ls_producto-codigo = 'P001'.
ls_producto-nombre = 'Laptop'.
ls_producto-precio = '3890.00'.
ls_producto-stock  = 12.
APPEND ls_producto TO lt_productos.

" 2) Llenar con VALUE (ABAP moderno)
APPEND VALUE #( codigo = 'P002' nombre = 'Monitor' precio = '790.00' stock = 30 ) TO lt_productos.
lt_productos = VALUE #( BASE lt_productos
  ( codigo = 'P003' nombre = 'Teclado' precio = '120.00' stock = 0 )
  ( codigo = 'P004' nombre = 'Mouse'   precio = '65.00'  stock = 80 ) ).

WRITE: / 'Productos en la tabla:', lines( lt_productos ).
ULINE.
LOOP AT lt_productos INTO ls_producto.
  WRITE: / sy-tabix, ls_producto-codigo, ls_producto-nombre, ls_producto-precio, ls_producto-stock.
ENDLOOP.`),
          syntax([
            ["TYPES: BEGIN OF ty ... END OF ty,", "Define una estructura: un grupo de campos con nombre. Aquí cada producto tiene código, nombre, precio y stock."],
            ["tt_productos TYPE STANDARD TABLE OF ty_producto", "Define un <b>tipo de tabla</b> cuyas líneas son la estructura. Por convención: <code>ty_</code> para estructuras, <code>tt_</code> para tipos de tabla."],
            ["WITH EMPTY KEY", "La tabla no tiene clave. Con WITH DEFAULT KEY la clave serían los campos de texto."],
            ["ls_ / lt_", "Convención de nombres: <code>ls_</code> estructura local (una línea), <code>lt_</code> tabla interna local, <code>lv_</code> variable simple, <code>gt_</code> tabla global."],
            ["APPEND ls TO lt.", "Añade una copia de la estructura al final de la tabla."],
            ["VALUE #( campo = valor ... )", "Construye una estructura o tabla en una sola expresión. <code>#</code> significa \"el tipo que corresponda\" según dónde se usa."],
            ["VALUE #( BASE lt ( ... ) ( ... ) )", "BASE conserva las líneas que ya tenía la tabla y añade las nuevas; cada línea va entre paréntesis."],
            ["sy-tabix", "Dentro de LOOP, número de la línea que se está procesando."],
          ]),
        ],
        check: () => run("ZP3_TABLAS")?.status === "ok",
        hint: "Ejecuta ZP3_TABLAS.",
      },
      {
        id: "p3s2",
        title: "Leer, modificar y borrar líneas",
        body: [
          "Las operaciones del día a día con tablas internas. Crea <code>ZP3_OPERACIONES</code>:",
          code(`REPORT zp3_operaciones.

TYPES: BEGIN OF ty_producto,
         codigo TYPE c LENGTH 10,
         nombre TYPE c LENGTH 20,
         precio TYPE p LENGTH 8 DECIMALS 2,
         stock  TYPE i,
       END OF ty_producto.

DATA lt_productos TYPE STANDARD TABLE OF ty_producto WITH EMPTY KEY.

lt_productos = VALUE #(
  ( codigo = 'P001' nombre = 'Laptop'    precio = '3890.00' stock = 12 )
  ( codigo = 'P002' nombre = 'Monitor'   precio = '790.00'  stock = 30 )
  ( codigo = 'P003' nombre = 'Teclado'   precio = '120.00'  stock = 0 )
  ( codigo = 'P004' nombre = 'Mouse'     precio = '65.00'   stock = 80 )
  ( codigo = 'P005' nombre = 'Parlantes' precio = '150.00'  stock = 0 ) ).

" READ TABLE: buscar una línea por un campo
READ TABLE lt_productos INTO DATA(ls_producto) WITH KEY codigo = 'P002'.
IF sy-subrc = 0.
  WRITE: / 'Encontrado:', ls_producto-nombre, 'en la línea', sy-tabix.
ENDIF.

" Expresión de tabla (ABAP moderno)
IF line_exists( lt_productos[ codigo = 'P004' ] ).
  WRITE: / 'Precio del mouse:', lt_productos[ codigo = 'P004' ]-precio.
ENDIF.

" Modificar con un field-symbol: subir 10% los precios
LOOP AT lt_productos ASSIGNING FIELD-SYMBOL(<ls_prod>).
  <ls_prod>-precio = <ls_prod>-precio * '1.10'.
ENDLOOP.

" MODIFY con TRANSPORTING: cambiar solo el stock del teclado
ls_producto-stock = 25.
MODIFY lt_productos FROM ls_producto TRANSPORTING stock WHERE codigo = 'P003'.

" Borrar los productos sin stock y ordenar por precio
DELETE lt_productos WHERE stock = 0.
SORT lt_productos BY precio DESCENDING.

ULINE.
LOOP AT lt_productos INTO ls_producto.
  WRITE: / ls_producto-codigo, ls_producto-nombre, ls_producto-precio, ls_producto-stock.
ENDLOOP.`),
          syntax([
            ["READ TABLE lt INTO ls WITH KEY campo = valor.", "Busca la primera línea que cumpla la condición. Si la encuentra, <code>sy-subrc = 0</code> y <code>sy-tabix</code> tiene su número de línea; si no, sy-subrc = 4."],
            ["lt[ campo = valor ]", "Expresión de tabla: devuelve la línea directamente. ¡Cuidado! Si no existe lanza la excepción CX_SY_ITAB_LINE_NOT_FOUND (dump si no la capturas)."],
            ["line_exists( lt[ ... ] )", "Devuelve verdadero si la línea existe. Úsalo antes de una expresión de tabla para evitar el dump."],
            ["LOOP AT lt ASSIGNING FIELD-SYMBOL(<fs>).", "El field-symbol apunta a la línea real: lo que cambies en <code>&lt;fs&gt;</code> se cambia en la tabla. Es más rápido que INTO + MODIFY."],
            ["MODIFY lt FROM ls TRANSPORTING campo WHERE ...", "Cambia en todas las líneas que cumplan el WHERE solo los campos indicados en TRANSPORTING."],
            ["DELETE lt WHERE condición.", "Borra todas las líneas que cumplan la condición."],
            ["SORT lt BY campo DESCENDING.", "Ordena la tabla por uno o varios campos (ASCENDING es el valor por defecto)."],
            ["'1.10'", "Los números con decimales se escriben como texto entre comillas: ABAP los convierte al hacer el cálculo."],
          ]),
        ],
        check: () => run("ZP3_OPERACIONES")?.status === "ok",
        hint: "Ejecuta ZP3_OPERACIONES.",
      },
      {
        id: "p3s2d",
        title: "El depurador: mira tu programa por dentro",
        body: [
          "El <b>depurador</b> detiene el programa en una línea y te deja avanzar instrucción por instrucción viendo el valor de cada variable. Es la herramienta más usada para encontrar errores.",
          "<b>1)</b> Abre <code>ZP3_OPERACIONES</code> en SE38 (modo modificar).",
          "<b>2)</b> Haz clic en el margen izquierdo, junto al número de la línea del <code>LOOP AT lt_productos ASSIGNING ...</code>: aparece un punto rojo. Eso es un <b>punto de parada</b>.",
          "<b>3)</b> Pulsa <kbd>F8</kbd>. El programa se detiene en esa línea y se abre el <b>Depurador ABAP</b>: a la izquierda el código con la línea actual marcada en amarillo; a la derecha los campos del sistema y las variables.",
          "<b>4)</b> Haz clic en <code>LT_PRODUCTOS</code> en la lista de variables para ver su contenido. Pulsa <kbd>F5</kbd> varias veces y observa cómo cambia el precio de cada línea y el valor de <code>sy-tabix</code>.",
          "<b>5)</b> Pulsa <kbd>F8</kbd> para continuar hasta el final. Para quitar el punto de parada, vuelve a hacer clic sobre él.",
          syntax([
            ["F5 Paso a paso", "Ejecuta la siguiente instrucción. Si es un PERFORM o una llamada a un método, entra en él."],
            ["F6 Ejecutar", "Ejecuta la siguiente instrucción sin entrar en FORMs ni métodos (los ejecuta completos)."],
            ["F8 Continuar", "Sigue ejecutando hasta el próximo punto de parada o hasta el final del programa."],
            ["Finalizar", "Termina el programa en ese momento."],
            ["BREAK-POINT.", "Instrucción que detiene el programa en el depurador al llegar a esa línea, sin necesidad de poner el punto rojo. ¡No la dejes en programas productivos!"],
            ["Botón Depurar", "En el editor, ejecuta el programa deteniéndose en la primera instrucción."],
          ]),
        ],
        check: () => !!store.data.debugUsed,
        hint: "Detén un programa en el depurador.",
      },
      {
        id: "p3s3",
        title: "Conoce las tablas estándar (SE16)",
        body: [
          "El sistema trae tablas estándar con datos, como en un SAP real. Ábrelas en <code>/nSE16</code> y su estructura en <code>/nSE11</code>:",
          "<table class=\"g-table\"><tr><th>Tabla</th><th>Contenido</th><th>Clave</th></tr><tr><td>T001</td><td>Sociedades</td><td>BUKRS</td></tr><tr><td>KNA1</td><td>Clientes</td><td>KUNNR</td></tr><tr><td>VBAK</td><td>Pedidos de venta (cabecera)</td><td>VBELN</td></tr><tr><td>VBAP</td><td>Pedidos de venta (posiciones)</td><td>VBELN + POSNR</td></tr><tr><td>LFA1</td><td>Proveedores</td><td>LIFNR</td></tr><tr><td>EKKO / EKPO</td><td>Pedidos de compra (cabecera / posiciones)</td><td>EBELN (+ EBELP)</td></tr><tr><td>MARA / MAKT</td><td>Materiales / descripciones por idioma</td><td>MATNR (+ SPRAS)</td></tr><tr><td>PA0001</td><td>Empleados: sociedad, puesto</td><td>PERNR + fechas</td></tr><tr><td>PA0002</td><td>Empleados: datos personales</td><td>PERNR + fechas</td></tr><tr><td>PA0008</td><td>Empleados: sueldo</td><td>PERNR + fechas</td></tr><tr><td>SBOOK / SCUSTOM</td><td>Reservas y clientes de vuelos</td><td></td></tr></table>",
          "<b>Cómo se relacionan:</b> un pedido de venta (VBAK) tiene un cliente (VBAK-KUNNR = KNA1-KUNNR) y varias posiciones (VBAP con el mismo VBELN); cada posición tiene un material (VBAP-MATNR = MARA-MATNR) cuya descripción está en MAKT. Un empleado tiene varios registros con fechas de validez (BEGDA-ENDDA); el vigente es el que tiene ENDDA = 31.12.9999.",
          "Abre <b>VBAK</b> en SE16 y luego <b>VBAP</b> filtrando por el mismo número de pedido (por ejemplo 0000005001) para ver la cabecera y sus posiciones.",
          syntax([
            ["Cabecera / posición", "Patrón típico de SAP: una tabla con los datos generales del documento y otra con sus líneas, unidas por el número de documento."],
            ["MANDT", "Todas las tablas empiezan por el mandante; el sistema lo maneja solo en tus SELECT."],
            ["BEGDA / ENDDA", "Inicio y fin de validez (tablas de RRHH). 31.12.9999 significa \"vigente\"."],
          ]),
        ],
        check: () => !!store.data.visited["SE16-DATA"],
        hint: "Abre una tabla estándar en SE16.",
      },
      {
        id: "p3s4",
        title: "JOIN: datos de varias tablas",
        body: [
          "Con un <b>JOIN</b> lees en un solo SELECT datos de tablas relacionadas. Crea <code>ZP3_VENTAS</code>:",
          code(`REPORT zp3_ventas.

PARAMETERS p_bukrs TYPE vbak-bukrs_vf DEFAULT '1000'.

START-OF-SELECTION.
  " Pedidos de venta con el nombre del cliente (JOIN de 2 tablas)
  SELECT a~vbeln, a~erdat, a~kunnr, k~name1, a~netwr, a~waerk
    FROM vbak AS a
    INNER JOIN kna1 AS k ON k~kunnr = a~kunnr
    WHERE a~bukrs_vf = @p_bukrs
    ORDER BY a~vbeln
    INTO TABLE @DATA(lt_pedidos).

  WRITE: / 'Pedidos de la sociedad', p_bukrs, ':', lines( lt_pedidos ).
  ULINE.
  LOOP AT lt_pedidos INTO DATA(ls_pedido).
    WRITE: / ls_pedido-vbeln, ls_pedido-erdat, ls_pedido-name1(25), ls_pedido-netwr, ls_pedido-waerk.
  ENDLOOP.`),
          syntax([
            ["FROM vbak AS a", "Da un alias corto a la tabla para referirte a sus campos como <code>a~campo</code>."],
            ["INNER JOIN kna1 AS k ON k~kunnr = a~kunnr", "Une cada pedido con su cliente usando el campo común. INNER JOIN solo devuelve los pedidos que tienen cliente; LEFT OUTER JOIN devolvería todos."],
            ["a~vbeln", "La tilde <code>~</code> separa el alias de la tabla y el campo dentro del SQL."],
            ["INTO TABLE @DATA(lt_pedidos)", "Crea la tabla interna en línea con exactamente los campos de la lista. En el SQL moderno INTO puede ir al final."],
            ["ls_pedido-name1(25)", "Offset/longitud: escribe solo los primeros 25 caracteres del campo."],
            ["PARAMETERS p_bukrs TYPE vbak-bukrs_vf", "El parámetro toma el tipo del campo de la tabla."],
          ]),
        ],
        check: () => run("ZP3_VENTAS")?.status === "ok" && activeHas("ZP3_VENTAS", /JOIN/i),
        hint: "Ejecuta ZP3_VENTAS con un JOIN.",
      },
      {
        id: "p3s5",
        title: "Totales con COLLECT y tablas HASHED",
        body: [
          "Vamos a sumar las ventas de cada cliente. Crea <code>ZP3_TOTALES</code>:",
          code(`REPORT zp3_totales.

TYPES: BEGIN OF ty_total,
         kunnr TYPE kna1-kunnr,
         name1 TYPE kna1-name1,
         netwr TYPE vbak-netwr,
         waerk TYPE vbak-waerk,
       END OF ty_total.

DATA: lt_totales  TYPE STANDARD TABLE OF ty_total WITH DEFAULT KEY,
      lt_clientes TYPE HASHED TABLE OF kna1 WITH UNIQUE KEY kunnr,
      ls_total    TYPE ty_total.

START-OF-SELECTION.
  SELECT * FROM vbak INTO TABLE @DATA(lt_pedidos).
  SELECT * FROM kna1 INTO TABLE @lt_clientes.

  LOOP AT lt_pedidos INTO DATA(ls_pedido).
    CLEAR ls_total.
    ls_total-kunnr = ls_pedido-kunnr.
    ls_total-netwr = ls_pedido-netwr.
    ls_total-waerk = ls_pedido-waerk.
    " Leer el cliente en la tabla HASHED (búsqueda directa por clave)
    READ TABLE lt_clientes INTO DATA(ls_cliente) WITH TABLE KEY kunnr = ls_pedido-kunnr.
    IF sy-subrc = 0.
      ls_total-name1 = ls_cliente-name1.
    ENDIF.
    " COLLECT suma los campos numéricos de las líneas con la misma clave
    COLLECT ls_total INTO lt_totales.
  ENDLOOP.

  SORT lt_totales BY netwr DESCENDING.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = lt_totales ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_display_settings( )->set_list_header( 'Ventas totales por cliente' ).
      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx_msg).
      MESSAGE lx_msg->get_text( ) TYPE 'E'.
  ENDTRY.`),
          syntax([
            ["TYPE HASHED TABLE OF kna1 WITH UNIQUE KEY kunnr", "Tabla con clave única y acceso por cálculo (hash): buscar un cliente es instantáneo aunque haya millones. No se puede acceder por número de línea."],
            ["READ TABLE ... WITH TABLE KEY kunnr = ...", "Lectura por la clave de la tabla: la forma correcta de leer una tabla HASHED o SORTED."],
            ["COLLECT ls INTO lt.", "Si ya existe una línea con la misma clave (los campos que no son numéricos), suma los campos numéricos; si no, añade la línea. Ideal para totales."],
            ["CLEAR ls_total.", "Deja la estructura en blanco (valores iniciales) antes de llenarla otra vez."],
            ["WITH DEFAULT KEY", "La clave de la tabla son todos los campos de texto: así COLLECT agrupa por cliente y suma NETWR."],
          ]),
        ],
        check: () => alvs("ZP3_TOTALES").length > 0,
        hint: "Muestra el ALV de ZP3_TOTALES.",
      },
      {
        id: "p3s6",
        title: "ABAP moderno: REDUCE, FOR, FILTER, COND",
        body: [
          "Expresiones del ABAP actual (7.40 en adelante) que reemplazan muchos LOOPs. Crea <code>ZP3_MODERNO</code>:",
          code(`REPORT zp3_moderno.

SELECT * FROM sflight INTO TABLE @DATA(lt_vuelos).

" REDUCE: sumar en una sola expresión
DATA(lv_total) = REDUCE i( INIT s = 0 FOR v IN lt_vuelos NEXT s = s + v-seatsocc ).
WRITE: / 'Pasajeros totales:', lv_total.

" FOR + VALUE: construir una tabla nueva a partir de otra
TYPES tt_aerolineas TYPE STANDARD TABLE OF sflight-carrid WITH EMPTY KEY.
DATA(lt_llenos) = VALUE tt_aerolineas( FOR v IN lt_vuelos WHERE ( seatsocc > 400 ) ( v-carrid ) ).
WRITE: / 'Vuelos con más de 400 pasajeros:', lines( lt_llenos ).

" Tabla SORTED + FILTER: quedarse solo con una aerolínea
DATA lt_ordenados TYPE SORTED TABLE OF sflight WITH NON-UNIQUE KEY carrid.
lt_ordenados = lt_vuelos.
DATA(lt_latam) = FILTER #( lt_ordenados WHERE carrid = CONV #( 'LA' ) ).
WRITE: / 'Vuelos de LATAM:', lines( lt_latam ).

" COND: elegir un valor según una condición
LOOP AT lt_latam INTO DATA(ls_vuelo).
  DATA(lv_estado) = COND string( WHEN ls_vuelo-seatsocc >= ls_vuelo-seatsmax * 9 / 10 THEN 'Casi lleno'
                                 ELSE 'Con espacio' ).
  WRITE: / ls_vuelo-connid, ls_vuelo-fldate, lv_estado.
ENDLOOP.`),
          syntax([
            ["REDUCE i( INIT s = 0 FOR v IN lt NEXT s = s + ... )", "Recorre la tabla y acumula un resultado: INIT da el valor inicial, NEXT dice cómo se actualiza en cada vuelta."],
            ["VALUE tt( FOR v IN lt WHERE ( ... ) ( v-campo ) )", "Construye una tabla nueva recorriendo otra, con filtro opcional."],
            ["TYPE SORTED TABLE ... WITH NON-UNIQUE KEY", "Tabla que siempre está ordenada por su clave; las búsquedas por clave son rápidas (búsqueda binaria)."],
            ["FILTER #( lt WHERE campo = ... )", "Devuelve las líneas que cumplen la condición. La tabla de origen debe ser SORTED o HASHED (o tener clave secundaria) por ese campo."],
            ["CONV #( 'LA' )", "Convierte un valor al tipo que se necesita en ese lugar."],
            ["COND tipo( WHEN ... THEN ... ELSE ... )", "Devuelve un valor según condiciones, como un IF en una expresión."],
          ]),
        ],
        check: () => run("ZP3_MODERNO")?.status === "ok",
        hint: "Ejecuta ZP3_MODERNO.",
      },
      {
        id: "p3s7",
        title: "Reto: planilla por sociedad",
        body: [
          "Crea <code>ZP3_RETO</code>: un reporte con pantalla de selección (SELECT-OPTIONS por sociedad) que muestre en un ALV los empleados con su nombre (PA0001-ENAME), puesto, nombre de la sociedad (T001-BUTXT) y <b>sueldo vigente</b> (PA0008-BET01 con ENDDA = '99991231'), con subtotal por sociedad y total general.",
          "Pistas: JOIN de PA0001, PA0008 y T001 por PERNR y BUKRS; <code>add_sort( columnname = 'BUKRS' subtotal = abap_true )</code> y <code>add_aggregation( 'BET01' )</code>.",
          `<details><summary>Ver una solución</summary><pre class="g-code">${esc(`REPORT zp3_reto.

TABLES t001.
SELECT-OPTIONS s_bukrs FOR t001-bukrs.

START-OF-SELECTION.
  " Empleados con su sociedad y su sueldo vigente (JOIN de 3 tablas)
  SELECT p1~pernr, p1~ename, p1~stltx, p1~bukrs, t~butxt, p8~bet01, p8~waers
    FROM pa0001 AS p1
    INNER JOIN pa0008 AS p8 ON p8~pernr = p1~pernr
    INNER JOIN t001   AS t  ON t~bukrs  = p1~bukrs
    WHERE p8~endda  = '99991231'
      AND p1~bukrs IN @s_bukrs
    ORDER BY p1~bukrs, p1~pernr
    INTO TABLE @DATA(lt_empleados).

  IF lt_empleados IS INITIAL.
    MESSAGE 'No hay empleados para esa selección' TYPE 'S' DISPLAY LIKE 'W'.
    RETURN.
  ENDIF.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = lt_empleados ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_display_settings( )->set_list_header( 'Planilla por sociedad' ).
      lo_alv->get_sorts( )->add_sort( columnname = 'BUKRS' subtotal = abap_true ).
      lo_alv->get_aggregations( )->add_aggregation( 'BET01' ).
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found cx_salv_existing cx_salv_data_error INTO DATA(lx_error).
      MESSAGE lx_error->get_text( ) TYPE 'E'.
  ENDTRY.`)}</pre></details>`,
          "¡Con esto ya manejas tablas internas y lectura de datos como en un proyecto real!",
        ],
        check: () => alvs("ZP3_RETO").some((a) => a.columns.includes("BET01")),
        hint: "Muestra un ALV con la columna BET01 en ZP3_RETO.",
      },
    ],
  },
  {
    id: "p4",
    title: "Paso 4",
    subtitle: "Programación orientada a objetos",
    steps: [
      {
        id: "p4s1",
        title: "Tu primera clase",
        body: [
          "Una <b>clase</b> es un molde que agrupa datos (<b>atributos</b>) y comportamiento (<b>métodos</b>). Cada <b>objeto</b> creado a partir de la clase tiene sus propios valores. En ABAP una clase local se escribe en dos partes: DEFINITION (qué tiene) e IMPLEMENTATION (cómo funciona).",
          "Crea <code>ZP4_CLASES</code>:",
          code(`REPORT zp4_clases.

TYPES ty_monto TYPE p LENGTH 10 DECIMALS 2.

CLASS lcl_cuenta DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_titular TYPE string
                                  iv_saldo   TYPE ty_monto OPTIONAL.
    METHODS depositar IMPORTING iv_monto TYPE ty_monto.
    METHODS get_saldo RETURNING VALUE(rv_saldo) TYPE ty_monto.
    METHODS mostrar.
  PRIVATE SECTION.
    DATA mv_titular TYPE string.
    DATA mv_saldo   TYPE ty_monto.
ENDCLASS.

CLASS lcl_cuenta IMPLEMENTATION.
  METHOD constructor.
    mv_titular = iv_titular.
    mv_saldo   = iv_saldo.
  ENDMETHOD.

  METHOD depositar.
    mv_saldo = mv_saldo + iv_monto.
  ENDMETHOD.

  METHOD get_saldo.
    rv_saldo = mv_saldo.
  ENDMETHOD.

  METHOD mostrar.
    WRITE: / 'Titular:', mv_titular, 'Saldo:', mv_saldo.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA: lo_cuenta1 TYPE REF TO lcl_cuenta,
        lv_monto   TYPE ty_monto.

  lv_monto = '500.00'.
  CREATE OBJECT lo_cuenta1 EXPORTING iv_titular = \`Ana Torres\` iv_saldo = lv_monto.

  " Forma moderna: NEW
  DATA(lo_cuenta2) = NEW lcl_cuenta( iv_titular = \`Luis Rojas\` ).

  lv_monto = '250.50'.
  lo_cuenta1->depositar( lv_monto ).
  lv_monto = '1000.00'.
  lo_cuenta2->depositar( iv_monto = lv_monto ).

  lo_cuenta1->mostrar( ).
  lo_cuenta2->mostrar( ).

  DATA lv_total TYPE ty_monto.
  lv_total = lo_cuenta1->get_saldo( ) + lo_cuenta2->get_saldo( ).
  WRITE: / 'Saldo total del banco:', lv_total.`),
          syntax([
            ["CLASS lcl_cuenta DEFINITION.", "Declara la clase: sus secciones, atributos y métodos. <code>lcl_</code> es la convención para clases locales."],
            ["PUBLIC SECTION. / PRIVATE SECTION.", "PUBLIC: accesible desde fuera de la clase. PRIVATE: solo desde dentro de la clase (encapsulamiento: el saldo solo cambia a través de los métodos)."],
            ["METHODS nombre IMPORTING ... RETURNING VALUE(...)", "Declara un método con sus parámetros. IMPORTING recibe datos; RETURNING devuelve un único valor (siempre por valor)."],
            ["constructor", "Método especial que se ejecuta automáticamente al crear el objeto; sirve para inicializarlo."],
            ["OPTIONAL", "El parámetro puede omitirse al llamar al método."],
            ["CLASS lcl_cuenta IMPLEMENTATION. METHOD ... ENDMETHOD.", "Escribe el código de cada método declarado."],
            ["TYPE REF TO lcl_cuenta", "Variable de referencia que apunta a un objeto de la clase."],
            ["CREATE OBJECT lo EXPORTING ...", "Crea el objeto (forma clásica) y pasa los parámetros del constructor."],
            ["NEW lcl_cuenta( ... )", "Crea el objeto (forma moderna) en una expresión."],
            ["lo_cuenta1->depositar( lv_monto )", "<code>-&gt;</code> llama a un método del objeto. Con un solo parámetro no hace falta escribir su nombre."],
            ["TYPES ty_monto TYPE p LENGTH 10 DECIMALS 2.", "Un tipo propio para los importes: así todos los parámetros y atributos usan exactamente el mismo tipo."],
          ]),
        ],
        check: () => run("ZP4_CLASES")?.status === "ok" && activeHas("ZP4_CLASES", /CLASS\s+\w+\s+DEFINITION/i),
        hint: "Ejecuta ZP4_CLASES con una clase local.",
      },
      {
        id: "p4s2",
        title: "Excepciones propias",
        body: [
          "Cuando un método no puede hacer su trabajo, lo correcto es <b>lanzar una excepción</b> en vez de escribir un mensaje. Quien llama decide qué hacer con TRY ... CATCH. Crea <code>ZP4_EXCEPCIONES</code> y ejecútalo con un monto mayor que 500 y luego con uno menor:",
          code(`REPORT zp4_excepciones.

TYPES ty_monto TYPE p LENGTH 10 DECIMALS 2.

" Clase de excepción propia
CLASS lcx_saldo_insuficiente DEFINITION INHERITING FROM cx_static_check.
  PUBLIC SECTION.
    DATA mv_faltante TYPE ty_monto READ-ONLY.
    METHODS constructor IMPORTING iv_faltante TYPE ty_monto.
ENDCLASS.

CLASS lcx_saldo_insuficiente IMPLEMENTATION.
  METHOD constructor.
    super->constructor( ).
    mv_faltante = iv_faltante.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_cuenta DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_saldo TYPE ty_monto.
    METHODS retirar IMPORTING iv_monto TYPE ty_monto
                    RAISING   lcx_saldo_insuficiente.
    DATA mv_saldo TYPE ty_monto READ-ONLY.
ENDCLASS.

CLASS lcl_cuenta IMPLEMENTATION.
  METHOD constructor.
    mv_saldo = iv_saldo.
  ENDMETHOD.

  METHOD retirar.
    IF iv_monto > mv_saldo.
      DATA(lv_faltante) = CONV ty_monto( iv_monto - mv_saldo ).
      RAISE EXCEPTION TYPE lcx_saldo_insuficiente
        EXPORTING iv_faltante = lv_faltante.
    ENDIF.
    mv_saldo = mv_saldo - iv_monto.
  ENDMETHOD.
ENDCLASS.

PARAMETERS p_monto TYPE ty_monto DEFAULT '300.00'.

START-OF-SELECTION.
  DATA(lo_cuenta) = NEW lcl_cuenta( CONV #( '500.00' ) ).

  TRY.
      lo_cuenta->retirar( p_monto ).
      WRITE: / 'Retiro correcto. Nuevo saldo:', lo_cuenta->mv_saldo.
    CATCH lcx_saldo_insuficiente INTO DATA(lx_error).
      WRITE: / 'No se pudo retirar. Faltan:', lx_error->mv_faltante.
  ENDTRY.`),
          syntax([
            ["CLASS lcx_... DEFINITION INHERITING FROM cx_static_check.", "Una clase de excepción hereda de CX_STATIC_CHECK (el compilador obliga a declararla o capturarla), CX_DYNAMIC_CHECK o CX_NO_CHECK. Convención: <code>lcx_</code> / <code>zcx_</code>."],
            ["super->constructor( ).", "En el constructor de una subclase hay que llamar primero al constructor de la clase padre."],
            ["READ-ONLY", "El atributo es público para leerlo, pero solo la propia clase puede cambiarlo."],
            ["RAISING lcx_saldo_insuficiente", "Declara en el método qué excepciones puede lanzar."],
            ["RAISE EXCEPTION TYPE lcx_... EXPORTING ...", "Lanza la excepción: el método se interrumpe y el control salta al CATCH de quien lo llamó."],
            ["CATCH lcx_... INTO DATA(lx_error).", "Captura la excepción y deja el objeto en lx_error para leer sus atributos."],
            ["CONV #( '500.00' )", "Convierte el literal al tipo que espera el parámetro."],
          ]),
        ],
        check: () => run("ZP4_EXCEPCIONES")?.status === "ok" && activeHas("ZP4_EXCEPCIONES", /RAISE\s+EXCEPTION/i),
        hint: "Ejecuta ZP4_EXCEPCIONES.",
      },
      {
        id: "p4s3",
        title: "Herencia y polimorfismo",
        body: [
          "La <b>herencia</b> permite crear una clase a partir de otra, reutilizando su código y cambiando solo lo necesario. Aquí un jefe es un empleado que cobra un 20% más. Los datos salen de las tablas de personal PA0001 y PA0008. Crea <code>ZP4_HERENCIA</code>:",
          code(`REPORT zp4_herencia.

CLASS lcl_empleado DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_nombre TYPE string
                                  iv_sueldo TYPE p.
    METHODS calcular_pago RETURNING VALUE(rv_pago) TYPE p.
    METHODS mostrar.
  PROTECTED SECTION.
    DATA mv_nombre TYPE string.
    DATA mv_sueldo TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_empleado IMPLEMENTATION.
  METHOD constructor.
    mv_nombre = iv_nombre.
    mv_sueldo = iv_sueldo.
  ENDMETHOD.

  METHOD calcular_pago.
    rv_pago = mv_sueldo.
  ENDMETHOD.

  METHOD mostrar.
    DATA lv_pago TYPE p LENGTH 10 DECIMALS 2.
    lv_pago = calcular_pago( ).
    WRITE: / mv_nombre, 'paga:', lv_pago.
  ENDMETHOD.
ENDCLASS.

" El jefe ES UN empleado, pero cobra un bono del 20%
CLASS lcl_jefe DEFINITION INHERITING FROM lcl_empleado.
  PUBLIC SECTION.
    METHODS calcular_pago REDEFINITION.
ENDCLASS.

CLASS lcl_jefe IMPLEMENTATION.
  METHOD calcular_pago.
    rv_pago = super->calcular_pago( ) * '1.20'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  " Datos reales: empleados vigentes de la sociedad 1000
  SELECT p1~ename, p1~stltx, p8~bet01
    FROM pa0001 AS p1
    INNER JOIN pa0008 AS p8 ON p8~pernr = p1~pernr
    WHERE p1~bukrs = '1000'
      AND p8~endda = '99991231'
    INTO TABLE @DATA(lt_datos).

  DATA lt_empleados TYPE STANDARD TABLE OF REF TO lcl_empleado WITH EMPTY KEY.
  DATA lo_empleado  TYPE REF TO lcl_empleado.

  LOOP AT lt_datos INTO DATA(ls_dato).
    DATA(lv_nombre) = CONV string( ls_dato-ename ).
    IF ls_dato-stltx CS 'Gerente' OR ls_dato-stltx CS 'Jefe'.
      lo_empleado = NEW lcl_jefe( iv_nombre = lv_nombre iv_sueldo = ls_dato-bet01 ).
    ELSE.
      lo_empleado = NEW lcl_empleado( iv_nombre = lv_nombre iv_sueldo = ls_dato-bet01 ).
    ENDIF.
    APPEND lo_empleado TO lt_empleados.
  ENDLOOP.

  " Polimorfismo: la misma llamada se comporta distinto según la clase real
  LOOP AT lt_empleados INTO lo_empleado.
    lo_empleado->mostrar( ).
  ENDLOOP.`),
          syntax([
            ["INHERITING FROM lcl_empleado", "lcl_jefe hereda todos los atributos y métodos de lcl_empleado."],
            ["PROTECTED SECTION.", "Visible en la clase y en sus subclases, pero no desde fuera."],
            ["METHODS calcular_pago REDEFINITION.", "La subclase reemplaza la implementación del método heredado."],
            ["super->calcular_pago( )", "Llama a la versión del método de la clase padre."],
            ["TABLE OF REF TO lcl_empleado", "Tabla interna de referencias a objetos. Puede guardar empleados y jefes, porque un jefe ES UN empleado."],
            ["Polimorfismo", "En el último LOOP todos se tratan como lcl_empleado, pero cada objeto ejecuta su propia versión de calcular_pago."],
            ["CS 'Jefe'", "Contains String: verdadero si el texto contiene esa cadena (sin distinguir mayúsculas)."],
            ["CONV string( ... )", "Convierte el valor al tipo string."],
          ]),
        ],
        check: () => run("ZP4_HERENCIA")?.status === "ok" && activeHas("ZP4_HERENCIA", /INHERITING\s+FROM/i),
        hint: "Ejecuta ZP4_HERENCIA.",
      },
      {
        id: "p4s4",
        title: "Interfaces y miembros estáticos",
        body: [
          "Una <b>interfaz</b> es un contrato: lista métodos sin implementarlos. Clases muy distintas pueden implementarla y tratarse igual. Crea <code>ZP4_INTERFACES</code>:",
          code(`REPORT zp4_interfaces.

TYPES ty_area TYPE p LENGTH 10 DECIMALS 2.

INTERFACE lif_figura.
  METHODS area RETURNING VALUE(rv_area) TYPE ty_area.
  METHODS nombre RETURNING VALUE(rv_nombre) TYPE string.
ENDINTERFACE.

CLASS lcl_rectangulo DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_figura.
    METHODS constructor IMPORTING iv_base TYPE i iv_altura TYPE i.
  PRIVATE SECTION.
    DATA: mv_base TYPE i, mv_altura TYPE i.
ENDCLASS.

CLASS lcl_rectangulo IMPLEMENTATION.
  METHOD constructor.
    mv_base = iv_base.
    mv_altura = iv_altura.
  ENDMETHOD.
  METHOD lif_figura~area.
    rv_area = mv_base * mv_altura.
  ENDMETHOD.
  METHOD lif_figura~nombre.
    rv_nombre = \`Rectángulo\`.
  ENDMETHOD.
ENDCLASS.

CLASS lcl_circulo DEFINITION.
  PUBLIC SECTION.
    INTERFACES lif_figura.
    METHODS constructor IMPORTING iv_radio TYPE i.
    CLASS-DATA gv_creados TYPE i READ-ONLY.
  PRIVATE SECTION.
    DATA mv_radio TYPE i.
ENDCLASS.

CLASS lcl_circulo IMPLEMENTATION.
  METHOD constructor.
    mv_radio = iv_radio.
    gv_creados = gv_creados + 1.
  ENDMETHOD.
  METHOD lif_figura~area.
    rv_area = '3.1416' * mv_radio * mv_radio.
  ENDMETHOD.
  METHOD lif_figura~nombre.
    rv_nombre = \`Círculo\`.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lt_figuras TYPE STANDARD TABLE OF REF TO lif_figura WITH EMPTY KEY.

  APPEND NEW lcl_rectangulo( iv_base = 4 iv_altura = 3 ) TO lt_figuras.
  APPEND NEW lcl_circulo( iv_radio = 2 ) TO lt_figuras.
  APPEND NEW lcl_circulo( iv_radio = 1 ) TO lt_figuras.

  LOOP AT lt_figuras INTO DATA(lo_figura).
    DATA(lv_area) = lo_figura->area( ).
    WRITE: / lo_figura->nombre( ), 'área:', lv_area.
  ENDLOOP.

  WRITE: / 'Círculos creados:', lcl_circulo=>gv_creados.`),
          syntax([
            ["INTERFACE lif_figura. ... ENDINTERFACE.", "Declara la interfaz y sus métodos. Convención: <code>lif_</code> / <code>zif_</code>."],
            ["INTERFACES lif_figura.", "La clase se compromete a implementar todos los métodos de la interfaz."],
            ["METHOD lif_figura~area.", "Los métodos de una interfaz se implementan con el nombre <code>interfaz~método</code>."],
            ["TABLE OF REF TO lif_figura", "Tabla de referencias a la interfaz: guarda rectángulos y círculos juntos."],
            ["CLASS-DATA gv_creados", "Atributo <b>estático</b>: uno solo para toda la clase, compartido por todos los objetos."],
            ["lcl_circulo=>gv_creados", "<code>=&gt;</code> accede a atributos y métodos estáticos usando el nombre de la clase, sin objeto."],
          ]),
        ],
        check: () => run("ZP4_INTERFACES")?.status === "ok" && activeHas("ZP4_INTERFACES", /INTERFACE\s+\w+\s*\./i),
        hint: "Ejecuta ZP4_INTERFACES.",
      },
      {
        id: "p4s5",
        title: "Reto: reporte orientado a objetos",
        body: [
          "En los proyectos reales los reportes se escriben con una clase: un método obtiene los datos y otro los muestra. Crea <code>ZP4_RETO</code>: una clase <code>lcl_reporte</code> con un método estático <code>ejecutar</code> que crea el objeto, llama a <code>obtener_datos</code> (pedidos de venta VBAK con el nombre del cliente de KNA1, filtrados por sociedad con SELECT-OPTIONS) y a <code>mostrar</code> (ALV con total del valor neto).",
          `<details><summary>Ver una solución</summary><pre class="g-code">${esc(`REPORT zp4_reto.

TABLES vbak.
SELECT-OPTIONS s_bukrs FOR vbak-bukrs_vf.

CLASS lcl_reporte DEFINITION.
  PUBLIC SECTION.
    TYPES: BEGIN OF ty_venta,
             vbeln TYPE vbak-vbeln,
             erdat TYPE vbak-erdat,
             name1 TYPE kna1-name1,
             netwr TYPE vbak-netwr,
             waerk TYPE vbak-waerk,
           END OF ty_venta,
           tt_ventas TYPE STANDARD TABLE OF ty_venta WITH EMPTY KEY.
    CLASS-METHODS ejecutar.
    METHODS obtener_datos.
    METHODS mostrar.
  PRIVATE SECTION.
    DATA mt_ventas TYPE tt_ventas.
ENDCLASS.

CLASS lcl_reporte IMPLEMENTATION.
  METHOD ejecutar.
    DATA(lo_reporte) = NEW lcl_reporte( ).
    lo_reporte->obtener_datos( ).
    lo_reporte->mostrar( ).
  ENDMETHOD.

  METHOD obtener_datos.
    SELECT a~vbeln, a~erdat, k~name1, a~netwr, a~waerk
      FROM vbak AS a
      INNER JOIN kna1 AS k ON k~kunnr = a~kunnr
      WHERE a~bukrs_vf IN @s_bukrs
      ORDER BY a~vbeln
      INTO TABLE @mt_ventas.
  ENDMETHOD.

  METHOD mostrar.
    IF mt_ventas IS INITIAL.
      MESSAGE 'No hay ventas para esa selección' TYPE 'S' DISPLAY LIKE 'W'.
      RETURN.
    ENDIF.
    TRY.
        cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                                CHANGING  t_table      = mt_ventas ).
        lo_alv->get_functions( )->set_all( abap_true ).
        lo_alv->get_columns( )->set_optimize( abap_true ).
        lo_alv->get_display_settings( )->set_list_header( 'Ventas (reporte orientado a objetos)' ).
        lo_alv->get_aggregations( )->add_aggregation( 'NETWR' ).
        lo_alv->display( ).
      CATCH cx_salv_msg cx_salv_not_found cx_salv_existing cx_salv_data_error INTO DATA(lx_error).
        MESSAGE lx_error->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  lcl_reporte=>ejecutar( ).`)}</pre></details>`,
          "Observa que START-OF-SELECTION tiene una sola línea: toda la lógica está en la clase. Usa el depurador (F5) para seguir el flujo entre los métodos.",
          "¡Felicitaciones! Ya dominas los fundamentos de ABAP: programas, diccionario, ALV, tablas internas, depuración y objetos.",
        ],
        check: () => alvs("ZP4_RETO").length > 0 && activeHas("ZP4_RETO", /CLASS-METHODS/i),
        hint: "Muestra el ALV de ZP4_RETO desde una clase.",
      },
    ],
  },
];

// ---- "Hazlo tú": ejercicios sin código para copiar al final de cada paso ----
const practice = (id) => ({ practice: id });
const gameDone = (id) => !!store.data.games?.[id]?.done;
const HAZLO_TU = {
  p1: ["h101", "h102"],
  p2: ["h201"],
  p3: ["h301", "h302"],
  p4: ["h401"],
};
for (const [gid, ids] of Object.entries(HAZLO_TU)) {
  const g = GUIDES.find((x) => x.id === gid);
  if (!g) continue;
  g.steps.push({
    id: gid + "_hazlo",
    title: "Hazlo tú: demuestra lo aprendido",
    body: [
      "Hasta ahora has copiado el código de la guía. Ahora te toca a ti: resuelve estos ejercicios <b>sin código para copiar</b>. Se corrigen solos al ejecutar tu programa y comparar su resultado con el esperado.",
      ...ids.map(practice),
      "Si te atascas, cada ejercicio tiene <b>Pista</b>. Ver la solución completa no suma puntos en Retos y juegos (ZJUEGOS).",
    ],
    check: () => ids.every(gameDone),
    hint: "Resuelve los ejercicios de esta sección.",
  });
}

export async function openGame(app, id) {
  const [{ gameScreen }, { gameById }] = await Promise.all([import("./screens/games.js"), import("./games/data.js")]);
  const g = gameById(id);
  if (g) app.push(gameScreen(app, g));
}

export function guidePanel(app, host) {
  let current = localStorage.getItem("abapp.guideTab") || "p1";
  // el ejercicio abierto y la posición de scroll se recuerdan al recargar
  const stepKey = () => "abapp.guideStep." + current;
  let openStep = localStorage.getItem(stepKey()) || null;
  const setOpenStep = (v) => {
    openStep = v;
    if (v) localStorage.setItem(stepKey(), v);
    else localStorage.removeItem(stepKey());
  };
  let savedScroll = Number(localStorage.getItem("abapp.guideScroll." + current)) || 0;
  const standalone = !!app.standalone;
  const done = () => {
    // en la ventana aparte no hay motor: se usa el resultado que guarda la ventana principal
    if (!app.engine) {
      const saved = store.data.guideDone || {};
      const out = {};
      for (const g of GUIDES) for (const s of g.steps) out[s.id] = !!store.data.manual[s.id] || !!saved[s.id];
      return out;
    }
    const out = {};
    for (const g of GUIDES)
      for (const s of g.steps) {
        try {
          out[s.id] = !!store.data.manual[s.id] || !!s.check(app);
        } catch {
          out[s.id] = false;
        }
      }
    const prev = JSON.stringify(store.data.guideDone || {});
    if (prev !== JSON.stringify(out)) {
      store.data.guideDone = out;
      setTimeout(() => store.save(), 0);
    }
    return out;
  };
  let lastDone = null;

  const practiceCard = (id) => {
    const card = h("div", { class: "practice-card" });
    import("./games/data.js").then(({ gameById }) => {
      const g = gameById(id);
      if (!g) return;
      const done = gameDone(id);
      card.classList.toggle("done", done);
      card.replaceChildren(
        h("div", { class: "pc-head" }, h("span", { class: "ico ico-" + (done ? "ok" : "editor") }), h("b", {}, g.title.replace(/^Hazlo tú: /, "")), done ? h("span", { class: "badge badge-ok" }, "Resuelto") : null),
        h("div", { class: "pc-text", html: g.text }),
        h(
          "button",
          {
            class: "btn " + (done ? "" : "btn-primary"),
            onclick: () => {
              if (app.engine) return openGame(app, id);
              if (window.opener && window.opener.__openGame) {
                window.opener.__openGame(id);
                window.opener.focus();
              } else alert("Abre este ejercicio desde la ventana del sistema.");
            },
          },
          done ? "Volver a abrir" : "Resolver ejercicio",
        ),
      );
    });
    return card;
  };

  const render = () => {
    const d = done();
    if (lastDone && (app.engine || app.standalone)) {
      for (const [k, v] of Object.entries(d)) {
        if (v && !lastDone[k]) {
          const step = GUIDES.flatMap((g) => g.steps).find((s) => s.id === k);
          toast(`Ejercicio completado: ${step.title}`);
          if (openStep === k) setOpenStep(null);
        }
      }
    }
    lastDone = app.engine || app.standalone ? d : null;
    const g = GUIDES.find((x) => x.id === current);
    const total = g.steps.length;
    const n = g.steps.filter((s) => d[s.id]).length;
    const firstOpen = g.steps.find((s) => !d[s.id])?.id;
    const active = openStep || firstOpen;
    const prevGuide = host.querySelector(".guide");
    const scrollTop = prevGuide ? prevGuide.scrollTop : savedScroll;
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
                    const g0 = host.querySelector(".guide");
                    if (g0) localStorage.setItem("abapp.guideScroll." + current, String(g0.scrollTop));
                    current = x.id;
                    openStep = localStorage.getItem(stepKey()) || null;
                    savedScroll = Number(localStorage.getItem("abapp.guideScroll." + current)) || 0;
                    localStorage.setItem("abapp.guideTab", current);
                    host.replaceChildren();
                    render();
                  },
                },
                x.title,
                h("span", { class: "gtab-count" }, `${xn}/${x.steps.length}`),
              );
            }),
          ),
          h(
            "div",
            { class: "guide-actions" },
            standalone
              ? null
              : h(
                  "button",
                  {
                    class: "guide-close",
                    title: "Abrir la guía en pantalla completa (otra ventana)",
                    onclick: () => {
                      const url = location.pathname + "?guia=1";
                      const w = window.open(url, "abap-guia", "width=1100,height=860");
                      if (!w) location.href = url;
                    },
                  },
                  h("span", { class: "ico ico-expand" }),
                ),
            standalone ? null : h("button", { class: "guide-close", title: "Ocultar guía", onclick: () => app.toggleGuide(false) }, h("span", { class: "ico ico-close" })),
          ),
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
                    setOpenStep(isOpen ? "__none" : s.id);
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
                        : b.practice
                          ? practiceCard(b.practice)
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
        n === total ? h("div", { class: "guide-done" }, { p1: "¡Paso 1 completado! Continúa con el Paso 2 →", p2: "¡Paso 2 completado! Continúa con el Paso 3 →", p3: "¡Paso 3 completado! Continúa con el Paso 4 →", p4: "¡Paso 4 completado! Ya programas con objetos en ABAP." }[current]) : null,
      ),
    );
    const guideEl = host.querySelector(".guide");
    guideEl.scrollTop = scrollTop;
    let t;
    guideEl.addEventListener("scroll", () => {
      clearTimeout(t);
      t = setTimeout(() => localStorage.setItem("abapp.guideScroll." + current, String(guideEl.scrollTop)), 150);
    });
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
