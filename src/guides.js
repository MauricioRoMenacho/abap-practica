// Guías de práctica paso a paso con validación automática.
import { NAMING_WHY, namingTerms } from "./naming.js";
import { h, esc } from "./ui.js";
import { store } from "./store.js";

const code = (src) => ({ code: src.trim() });
const syntax = (rows) => ({ syntax: rows });
const terms = (rows, title = "Conceptos clave") => ({ syntax: rows, title });

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
    id: "p0",
    title: "Paso 0",
    subtitle: "Conceptos: qué es SAP y cómo está organizado",
    steps: [
      {
        id: "p0s1",
        title: "SAP, módulos y ABAP",
        body: [
          "<b>SAP</b> es un <b>ERP</b>: un sistema que integra todos los procesos de una empresa en una sola base de datos. Cuando ventas registra un pedido, almacén ve la salida de mercadería y contabilidad ve la factura, sin pasar datos de un sistema a otro.",
          "Está dividido en <b>módulos</b> funcionales. Los más comunes:",
          terms([
            ["FI / CO", "Finanzas (contabilidad, cuentas por cobrar y pagar) y Controlling (costos)."],
            ["SD", "Ventas y distribución: clientes, pedidos (tablas VBAK/VBAP), entregas, facturas. Clientes en KNA1."],
            ["MM", "Gestión de materiales: compras (EKKO/EKPO), proveedores (LFA1), inventario. Materiales en MARA/MAKT."],
            ["PP / QM / PM", "Producción, calidad y mantenimiento."],
            ["HCM", "Recursos humanos: infotipos de personal (PA0001, PA0002, PA0008...)."],
          ]),
          "<b>ABAP</b> es el lenguaje de programación de SAP. Con ABAP se crean reportes, interfaces, formularios, ampliaciones y programas a medida (lo que los consultores llaman <b>desarrollos RICEFW</b>: Reports, Interfaces, Conversions, Enhancements, Forms, Workflows). Las versiones del sistema han sido R/3, ECC y hoy <b>S/4HANA</b>; el ABAP que aprendes aquí funciona en todas.",
          "Un <b>consultor funcional</b> configura el módulo y define qué se necesita; el <b>consultor técnico ABAP</b> (tú) lo programa a partir de una <b>especificación funcional</b>.",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "p0s2",
        title: "Arquitectura de 3 capas",
        body: [
          "Un sistema SAP tiene tres capas separadas:",
          terms([
            ["1. Presentación", "Lo que ve el usuario: SAP GUI (la ventana clásica que imita este simulador), el navegador (Fiori / SAPUI5) o Eclipse (ADT) para los desarrolladores. No contiene lógica."],
            ["2. Aplicación", "El servidor de aplicaciones ABAP: aquí se ejecutan los programas. Lo forman <b>procesos de trabajo</b>: de diálogo (usuarios conectados), de fondo (jobs, SM36/SM37), de actualización, de bloqueo (enqueue, SM12) y de impresión (spool)."],
            ["3. Base de datos", "Guarda tablas, datos y también el código de los programas (el repositorio). En S/4HANA es SAP HANA. ABAP accede con Open SQL (SELECT, INSERT...) independiente de la base de datos."],
          ]),
          "Consecuencia práctica: cada viaje de la capa de aplicación a la base de datos cuesta tiempo. Por eso se insiste tanto en evitar SELECT dentro de LOOP (lo verás en ST05, Paso 5).",
          "En este simulador las tres capas corren en tu navegador: la pantalla (presentación), el motor que traduce ABAP a JavaScript (aplicación) y una base de datos SQLite (base de datos).",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "p0s3",
        title: "Mandante (cliente)",
        body: [
          "Un mismo sistema SAP puede contener varios <b>mandantes</b> (en inglés <i>client</i>): divisiones lógicas con sus propios datos, como si fueran empresas separadas. Al iniciar sesión se elige uno; aquí siempre es el <b>100</b> (lo ves abajo a la derecha: NPL (1) 100).",
          terms([
            ["Campo MANDT", "La primera clave de casi todas las tablas de negocio es MANDT (tipo CLNT). Por eso al crear tablas en SE11 empiezas con MANDT."],
            ["Dependiente de mandante", "Datos de negocio y casi toda la configuración: cada mandante tiene los suyos (clientes, pedidos...)."],
            ["Independiente de mandante", "El repositorio: programas, clases, definiciones de tablas. Un programa creado en SE38 existe en todos los mandantes del sistema."],
            ["Open SQL y MANDT", "No se escribe WHERE mandt = ...: Open SQL filtra automáticamente por el mandante de la sesión (sy-mandt)."],
          ]),
          "Ejemplo típico: mandante 100 para desarrollo, 200 para pruebas unitarias con datos y 000 (mandante de SAP).",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "p0s4",
        title: "Paisaje de sistemas DEV - QAS - PRD y transportes",
        body: [
          "En una empresa nunca se programa en el sistema real. Hay al menos tres sistemas:",
          terms([
            ["DEV (desarrollo)", "Donde programas y configuras. Aquí sí puedes crear y modificar objetos."],
            ["QAS (calidad / pruebas)", "Copia cercana a producción donde los usuarios prueban los cambios."],
            ["PRD (producción)", "El sistema real de la empresa. No se modifica directamente."],
          ]),
          "Los cambios viajan de DEV a QAS y luego a PRD mediante <b>órdenes de transporte</b> (transacciones SE09/SE10 para gestionarlas y STMS para importarlas). Por eso en SAP real, al crear un objeto, el sistema pide un <b>paquete</b> (agrupación de objetos, como ZVENTAS) y una <b>orden de transporte</b>. Si eliges \"Objeto local\" (paquete $TMP), el objeto no se puede transportar: solo sirve para pruebas.",
          "En este simulador no hay paquetes ni órdenes porque solo existe un sistema (NPL, como el sistema de prueba que SAP ofrece para aprender). Ten en cuenta este paso cuando trabajes en un proyecto real.",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "p0s5",
        title: "Objetos, nombres Z/Y y transacciones",
        body: [
          "Todo lo que se crea (programas, tablas, clases, funciones) es un <b>objeto del repositorio</b>. Los objetos de SAP empiezan por cualquier letra; los tuyos deben empezar por <b>Z</b> o <b>Y</b> (espacio de nombres del cliente) para que las actualizaciones de SAP no los sobrescriban.",
          "Transacciones de desarrollo que usarás (escríbelas en el campo de comandos; <code>/n</code> delante cambia de transacción, <code>/o</code> abre otra sesión):",
          terms([
            ["SE38 / SE80", "Editor ABAP de programas / Object Navigator (todos los objetos)."],
            ["SE11", "Diccionario ABAP: tablas, elementos de datos, dominios."],
            ["SE16 / SE16N", "Ver y mantener el contenido de las tablas."],
            ["SE37 / SE24", "Módulos de función / Clases globales."],
            ["SE91", "Clases de mensajes."],
            ["SE84", "Sistema de información del repositorio (buscar objetos)."],
            ["ST05 / SM12 / ST22", "Traza SQL / Bloqueos / Dumps (errores en tiempo de ejecución)."],
          ]),
          "Consulta en cualquier momento <b>Ayuda - Glosario, errores comunes y diferencias</b> (transacción <code>ZAYUDA</code>).",
        ],
        check: () => !!store.data.visited?.ZAYUDA,
        hint: "Abre la transacción ZAYUDA.",
      },
    ],
  },
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
          "¿Por qué <code>lv_</code>? Es una convención: <b>l</b> = local, <b>v</b> = variable simple (un valor). Verás también <code>ls_</code> (estructura), <code>lt_</code> (tabla), <code>gv_</code> (global), <code>iv_</code>/<code>ev_</code> (parámetros que entran/salen)... El siguiente ejercicio explica cada uno y por qué se usan.",
          "Experimenta: cambia la edad a 15, divide entre cero (<code>lv_total = 1 / 0.</code>) y mira el <b>dump</b> que aparece, como en la transacción ST22.",
        ],
        check: () => run("ZP1_VARIABLES")?.status === "ok" && activeHas("ZP1_VARIABLES", /DATA/i),
        hint: "Crea, activa y ejecuta ZP1_VARIABLES.",
      },
      {
        id: "p1s5n",
        title: "Convenciones de nombres: por qué lv_, ls_, lt_, iv_, ev_...",
        body: [
          ...NAMING_WHY,
          "Cómo se forma un nombre: <b>alcance + tipo + _ + nombre descriptivo</b>. Por ejemplo <code>lt_vuelos</code> = <b>l</b>ocal + <b>t</b>abla + vuelos; <code>iv_carrid</code> = parámetro de entrada (<b>i</b>mporting) + <b>v</b>alor + carrid.",
          { syntax: namingTerms(), title: "Tabla de prefijos" },
          "Prueba: en <code>ZP1_VARIABLES</code> cambia <code>lv_total</code> por <code>total</code> en todas las líneas y ejecuta: funciona igual. El prefijo no lo exige el compilador, lo exige el equipo. En el Paso 6 verás que el <b>ATC</b> avisa cuando una variable local no sigue la convención.",
          "Cada empresa puede tener su propia variante (algunas usan <code>wa_</code> para estructuras o <code>it_</code> para tablas en código antiguo). Lo importante es ser consistente: consulta siempre la guía de nombres del proyecto. Tienes esta tabla en <b>ZAYUDA - Nombres</b>.",
        ],
        check: () => false,
        hint: "Lee la explicación y pulsa Marcar como hecho.",
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
            ["iv_ / rv_ / mv_ / lo_ / lcl_", "Convención de nombres: <b>iv_</b> parámetro que entra (importing), <b>rv_</b> valor devuelto (returning), <b>mv_</b> atributo del objeto (member: cada objeto tiene el suyo), <b>lo_</b> referencia local a un objeto, <b>lcl_</b> clase local. Al leer <code>mv_saldo = mv_saldo + iv_monto</code> sabes que se modifica el atributo con el dato recibido."],
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
  {
    id: "p5",
    title: "Paso 5",
    subtitle: "Herramientas del día a día y buenas prácticas",
    steps: [
      {
        id: "p5s1",
        title: "Tu primer módulo de función (SE37)",
        body: [
          "Un <b>módulo de función</b> es código reutilizable con una interfaz fija que cualquier programa puede llamar con <code>CALL FUNCTION</code>. Vive dentro de un <b>grupo de funciones</b> (un contenedor que comparte datos globales). Es la forma clásica de reutilizar lógica en SAP y la base de las BAPIs.",
          "1. Abre <b>SE37</b>, escribe <code>Z_CALCULAR_DESCUENTO</code> y pulsa <b>Crear</b>.<br>2. Con el botón <b>Crear grupo</b> crea el grupo <code>ZFG_PRACTICA</code> (texto: Funciones de práctica). Texto breve del módulo: Calcula precio con descuento.<br>3. Pestaña <b>Importación</b>: <code>IV_PRECIO</code> tipo <code>SFLIGHT-PRICE</code> y <code>IV_PORCENTAJE</code> tipo <code>I</code>.<br>4. Pestaña <b>Exportación</b>: <code>EV_PRECIO_FINAL</code> tipo <code>SFLIGHT-PRICE</code>.<br>5. Pestaña <b>Excepciones</b>: <code>PORCENTAJE_INVALIDO</code>.<br>6. Pestaña <b>Código fuente</b>: escribe el cuerpo entre el comentario de la interfaz y ENDFUNCTION:",
          code(`  IF iv_porcentaje < 0 OR iv_porcentaje > 100.
    RAISE porcentaje_invalido.
  ENDIF.
  ev_precio_final = iv_precio - iv_precio * iv_porcentaje / 100.`),
          "7. <b>Activar</b> (Ctrl+F3) y pruébalo con <b>Probar</b> (F8): precio 500, porcentaje 20. Debe devolver 400,00. Prueba también con 150 para ver la excepción.",
          "8. Ahora llámalo desde un programa <code>ZP5_FUNCION</code> (SE38):",
          code(`REPORT zp5_funcion.

PARAMETERS: p_precio TYPE sflight-price DEFAULT '500.00',
            p_porc   TYPE i DEFAULT 20.

DATA lv_final TYPE sflight-price.

CALL FUNCTION 'Z_CALCULAR_DESCUENTO'
  EXPORTING
    iv_precio           = p_precio
    iv_porcentaje       = p_porc
  IMPORTING
    ev_precio_final     = lv_final
  EXCEPTIONS
    porcentaje_invalido = 1
    OTHERS              = 2.

IF sy-subrc <> 0.
  MESSAGE 'El porcentaje debe estar entre 0 y 100' TYPE 'E'.
ENDIF.

WRITE: / 'Precio original:', p_precio,
       / 'Precio final:   ', lv_final.`),
          syntax([
            ["CALL FUNCTION 'NOMBRE'", "Llama al módulo de función. El nombre va entre comillas simples y en mayúsculas. Truco: haz doble clic sobre el nombre en el editor para abrirlo en SE37."],
            ["EXPORTING", "Lo que el programa <b>envía</b> a la función (son los parámetros de <b>importación</b> de la función: se ve desde el lado contrario)."],
            ["IMPORTING", "Lo que el programa <b>recibe</b> (los parámetros de <b>exportación</b> de la función)."],
            ["EXCEPTIONS nombre = 1 OTHERS = 2", "Si la función ejecuta RAISE nombre, el programa no se cae: sy-subrc toma el número indicado. OTHERS captura cualquier otra excepción."],
            ["RAISE porcentaje_invalido.", "Dentro de la función: termina la función y avisa al llamador con esa excepción."],
            ["IV_ / EV_ / CV_ / IT_ / ET_", "Convención para parámetros: <b>I</b>mporting, <b>E</b>xporting, <b>C</b>hanging + <b>V</b>alor o <b>T</b>abla. En la llamada se ve enseguida qué datos envías y cuáles recibes. Las BAPIs de SAP no siguen esta convención (usan nombres como AIRLINE o RETURN): es código estándar antiguo."],
            ["IF sy-subrc <> 0.", "Siempre revisa sy-subrc después de CALL FUNCTION con EXCEPTIONS."],
            ["Interfase local (*\"...)", "El comentario que SE37 genera al principio del código describe los parámetros. No lo edites a mano: se regenera desde las pestañas."],
          ]),
        ],
        check: () => !!store.data.fmodules?.Z_CALCULAR_DESCUENTO?.activeBody && run("ZP5_FUNCION")?.status === "ok" && activeHas("ZP5_FUNCION", /CALL\s+FUNCTION\s+'Z_CALCULAR_DESCUENTO'/i),
        hint: "Activa Z_CALCULAR_DESCUENTO en SE37 y ejecuta ZP5_FUNCION.",
      },
      {
        id: "p5s2",
        title: "BAPIs: funciones estándar de SAP",
        body: [
          "Una <b>BAPI</b> (Business API) es un módulo de función estándar que SAP publica para leer o modificar datos de negocio de forma segura (validaciones incluidas). En proyectos reales se usan para crear pedidos, clientes, materiales... En el simulador tienes las BAPIs del modelo de vuelos: <code>BAPI_FLIGHT_GETLIST</code> y <code>BAPI_FLIGHT_GETDETAIL</code>. Mira su interfaz en SE37 antes de empezar.",
          "Regla de oro: <b>las BAPIs no lanzan excepciones</b>; devuelven los errores en la tabla <code>RETURN</code> (estructura <code>BAPIRET2</code>). Siempre hay que revisarla. Y si la BAPI modifica datos, después hay que llamar a <code>BAPI_TRANSACTION_COMMIT</code> (o ROLLBACK si hubo errores).",
          "Crea <code>ZP5_BAPI</code>:",
          code(`REPORT zp5_bapi.

PARAMETERS p_carr TYPE sflight-carrid DEFAULT 'LA'.

DATA: lt_vuelos TYPE STANDARD TABLE OF bapisfldat WITH DEFAULT KEY,
      lt_return TYPE STANDARD TABLE OF bapiret2 WITH DEFAULT KEY,
      ls_datos  TYPE bapisfldat,
      ls_plazas TYPE bapisflava.

CALL FUNCTION 'BAPI_FLIGHT_GETLIST'
  EXPORTING
    airline     = p_carr
    max_rows    = 5
  TABLES
    flight_list = lt_vuelos
    return      = lt_return.

" Revisar RETURN: si hay un mensaje de error (E o A), se muestra y se termina
LOOP AT lt_return INTO DATA(ls_ret) WHERE type = 'E' OR type = 'A'.
  MESSAGE ls_ret-message TYPE 'I'.
  RETURN.
ENDLOOP.

WRITE: / 'Vuelos de', p_carr COLOR COL_HEADING.
ULINE.
LOOP AT lt_vuelos INTO DATA(ls_vuelo).
  CALL FUNCTION 'BAPI_FLIGHT_GETDETAIL'
    EXPORTING
      airlineid    = ls_vuelo-airlineid
      connectionid = ls_vuelo-connectid
      flightdate   = ls_vuelo-flightdate
    IMPORTING
      flight_data  = ls_datos
      availibility = ls_plazas
    TABLES
      return       = lt_return.
  WRITE: / ls_vuelo-connectid, ls_vuelo-flightdate, ls_vuelo-cityfrom(12), ls_vuelo-cityto(12),
           'Libres:', ls_plazas-econofree.
ENDLOOP.`),
          syntax([
            ["TABLES flight_list = lt_vuelos", "Parámetros de tipo tabla. Se pasan por referencia: la BAPI llena directamente tu tabla interna."],
            ["TYPE STANDARD TABLE OF bapiret2", "BAPIRET2 es la estructura estándar de mensajes de retorno: TYPE (S, E, W, I, A), ID (clase), NUMBER, MESSAGE (texto) y MESSAGE_V1..V4."],
            ["LOOP AT lt_return ... WHERE type = 'E' OR type = 'A'.", "Busca mensajes de error. Una BAPI que falla no detiene tu programa: si no revisas RETURN, el error pasa desapercibido."],
            ["RETURN.", "Termina el bloque de proceso actual (aquí, el programa)."],
            ["IMPORTING flight_data = ls_datos", "Parámetros de exportación de la BAPI: estructuras con los datos leídos."],
            ["ls_vuelo-cityfrom(12)", "Desplazamiento/longitud: escribe solo los 12 primeros caracteres del campo."],
          ]),
          "Prueba con la aerolínea <code>XX</code> (no existe): verás cómo la BAPI devuelve el error en RETURN.",
        ],
        check: () => run("ZP5_BAPI")?.status === "ok" && activeHas("ZP5_BAPI", /BAPI_FLIGHT_GETLIST/i) && activeHas("ZP5_BAPI", /lt_return|return/i),
        hint: "Ejecuta ZP5_BAPI llamando a BAPI_FLIGHT_GETLIST.",
      },
      {
        id: "p5s3",
        title: "Rendimiento: SELECT en LOOP vs FOR ALL ENTRIES (ST05)",
        body: [
          "El error de rendimiento más común en ABAP es hacer un <b>SELECT dentro de un LOOP</b>: si la tabla tiene 10.000 líneas, son 10.000 viajes a la base de datos. La solución es leer todo de una vez con un <b>JOIN</b> o con <b>FOR ALL ENTRIES</b>. La herramienta para descubrirlo es la <b>traza SQL (ST05)</b>.",
          "Crea <code>ZP5_RENDIMIENTO</code>:",
          code(`REPORT zp5_rendimiento.

SELECT carrid, connid, cityfrom, cityto FROM spfli
  INTO TABLE @DATA(lt_conexiones).

" ---- Versión 1 (MAL): un SELECT por cada conexión ----
DATA lv_total1 TYPE i.
LOOP AT lt_conexiones INTO DATA(ls_con).
  SELECT COUNT(*) FROM sflight
    WHERE carrid = @ls_con-carrid
      AND connid = @ls_con-connid
    INTO @DATA(lv_cant).
  lv_total1 = lv_total1 + lv_cant.
ENDLOOP.
WRITE: / 'Versión 1 (SELECT en LOOP):', lv_total1, 'vuelos'.

" ---- Versión 2 (BIEN): un solo SELECT con FOR ALL ENTRIES ----
DATA lt_vuelos TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY.
IF lt_conexiones IS NOT INITIAL.
  SELECT * FROM sflight
    FOR ALL ENTRIES IN @lt_conexiones
    WHERE carrid = @lt_conexiones-carrid
      AND connid = @lt_conexiones-connid
    INTO TABLE @lt_vuelos.
ENDIF.
WRITE: / 'Versión 2 (FOR ALL ENTRIES):', lines( lt_vuelos ), 'vuelos'.`),
          "Ahora mídelo: 1) Abre <b>ST05</b> y pulsa <b>Activar traza</b>. 2) Ejecuta ZP5_RENDIMIENTO. 3) Vuelve a ST05, <b>Desactivar traza</b> y <b>Visualizar traza</b>. Verás un SELECT a SFLIGHT por cada conexión (versión 1) y uno solo con todas las condiciones (versión 2). El resumen <b>Sentencias idénticas</b> y el aviso de rendimiento te señalan el problema.",
          syntax([
            ["FOR ALL ENTRIES IN @itab", "Lee de la base de datos los registros que cumplen la condición para <b>cada línea</b> de la tabla interna, pero en un solo acceso. Elimina duplicados automáticamente."],
            ["WHERE carrid = @itab-carrid", "En la condición se usan los campos de la tabla interna como valores."],
            ["IF itab IS NOT INITIAL.", "<b>Obligatorio</b>: si la tabla interna está vacía, FOR ALL ENTRIES ignora el WHERE y lee <b>toda</b> la tabla de la base de datos."],
            ["SELECT COUNT(*)", "Cuenta registros sin traerlos (más rápido que leerlos y contar)."],
            ["ST05", "Traza SQL: registra cada sentencia que llega a la base de datos, con su duración y número de registros."],
          ]),
          "Otras buenas prácticas de rendimiento: lee solo los campos que necesitas (evita <code>SELECT *</code> en tablas anchas), filtra en el WHERE y no en el LOOP, y usa tablas SORTED o HASHED cuando hagas muchos READ TABLE.",
        ],
        check: () => run("ZP5_RENDIMIENTO")?.status === "ok" && activeHas("ZP5_RENDIMIENTO", /FOR\s+ALL\s+ENTRIES/i) && (store.data.st05?.records || []).some((r) => r.program === "ZP5_RENDIMIENTO"),
        hint: "Activa la traza en ST05, ejecuta ZP5_RENDIMIENTO y visualiza la traza.",
      },
      {
        id: "p5s4",
        title: "COMMIT WORK y ROLLBACK WORK (LUW)",
        body: [
          "Los cambios en la base de datos (INSERT, UPDATE, MODIFY, DELETE) no son definitivos hasta que se confirman. El conjunto de cambios que se confirman o deshacen juntos se llama <b>LUW</b> (unidad lógica de trabajo). <code>COMMIT WORK</code> los confirma; <code>ROLLBACK WORK</code> los deshace todos desde el último COMMIT. Al terminar un programa sin errores, SAP confirma automáticamente.",
          "Crea <code>ZP5_LUW</code>:",
          code(`REPORT zp5_luw.

PARAMETERS p_deshac AS CHECKBOX DEFAULT 'X'.

DATA ls_cliente TYPE scustom.

SELECT COUNT(*) FROM scustom INTO @DATA(lv_antes).

ls_cliente-id        = '90000001'.
ls_cliente-name      = 'Cliente de prueba'.
ls_cliente-city      = 'LIMA'.
ls_cliente-country   = 'PE'.
ls_cliente-custtype  = 'P'.
INSERT scustom FROM ls_cliente.
IF sy-subrc <> 0.
  MESSAGE 'El cliente 90000001 ya existe (desmarca la casilla solo una vez)' TYPE 'I'.
  RETURN.
ENDIF.

SELECT COUNT(*) FROM scustom INTO @DATA(lv_durante).

IF p_deshac = abap_true.
  ROLLBACK WORK.
  WRITE / 'ROLLBACK WORK: el INSERT se deshizo' COLOR COL_NEGATIVE.
ELSE.
  COMMIT WORK.
  WRITE / 'COMMIT WORK: el INSERT quedó grabado' COLOR COL_POSITIVE.
ENDIF.

SELECT COUNT(*) FROM scustom INTO @DATA(lv_despues).
WRITE: / 'Clientes antes:  ', lv_antes,
       / 'Después del INSERT:', lv_durante,
       / 'Al final:        ', lv_despues.`),
          syntax([
            ["INSERT scustom FROM ls_cliente.", "Inserta una fila. sy-subrc = 4 si ya existe una fila con la misma clave."],
            ["ROLLBACK WORK.", "Deshace todos los cambios de base de datos pendientes desde el último COMMIT."],
            ["COMMIT WORK.", "Confirma los cambios pendientes: ya no se pueden deshacer."],
            ["AS CHECKBOX", "Parámetro de tipo casilla: vale 'X' (abap_true) si está marcada y ' ' si no."],
            ["abap_true", "Constante con el valor 'X'. Su contraria es abap_false (espacio)."],
          ]),
          "Ejecuta primero con la casilla marcada: el número final vuelve al inicial. Luego desmárcala: el cliente queda grabado (compruébalo en SE16 con SCUSTOM). Si ejecutas de nuevo sin marcar, el INSERT falla porque la clave ya existe. Para borrarlo puedes usar <b>Sistema - Restaurar datos estándar</b>.",
        ],
        check: () => run("ZP5_LUW")?.status === "ok" && activeHas("ZP5_LUW", /ROLLBACK\s+WORK/i),
        hint: "Ejecuta ZP5_LUW con ROLLBACK WORK.",
      },
      {
        id: "p5s5",
        title: "Bloqueos: ENQUEUE, DEQUEUE y SM12",
        body: [
          "Si dos usuarios modifican el mismo registro al mismo tiempo, uno sobrescribe los cambios del otro. Para evitarlo, antes de modificar se <b>bloquea</b> el registro (ENQUEUE) y al terminar se <b>desbloquea</b> (DEQUEUE). En SAP real cada tabla tiene su <b>objeto de bloqueo</b> (SE11) que genera las funciones ENQUEUE_EZ... y DEQUEUE_EZ...; aquí usaremos la función genérica <code>ENQUEUE_E_TABLE</code>.",
          "1. Abre <b>SM12</b> y pulsa <b>Simular bloqueo de otro usuario</b>: tabla <code>SCUSTOM</code>, argumento <code>00000001</code>, usuario <code>COMPANERO</code>.<br>2. Crea y ejecuta <code>ZP5_BLOQUEO</code>:",
          code(`REPORT zp5_bloqueo.

PARAMETERS p_id TYPE scustom-id DEFAULT '00000001'.

CALL FUNCTION 'ENQUEUE_E_TABLE'
  EXPORTING
    tabname        = 'SCUSTOM'
    varkey         = p_id
  EXCEPTIONS
    foreign_lock   = 1
    system_failure = 2
    OTHERS         = 3.

IF sy-subrc = 1.
  MESSAGE |El cliente { p_id } está bloqueado por el usuario { sy-msgv1 }| TYPE 'I'.
  RETURN.
ELSEIF sy-subrc <> 0.
  MESSAGE 'Error al bloquear' TYPE 'E'.
ENDIF.

UPDATE scustom SET discount = '010' WHERE id = @p_id.
WRITE: / 'Cliente', p_id, 'actualizado con 10% de descuento'.

CALL FUNCTION 'DEQUEUE_E_TABLE'
  EXPORTING
    tabname = 'SCUSTOM'
    varkey  = p_id.
WRITE / 'Bloqueo liberado'.`),
          "3. Verás el mensaje de bloqueo. Ejecuta de nuevo con el cliente <code>00000002</code>: esta vez no hay bloqueo y se actualiza. 4. Vuelve a SM12, selecciona el bloqueo simulado y bórralo; ahora el cliente 00000001 también funciona.",
          syntax([
            ["ENQUEUE_E_TABLE", "Pide un bloqueo exclusivo sobre una tabla y clave (varkey). Si otro usuario ya lo tiene, lanza FOREIGN_LOCK."],
            ["sy-msgv1", "Tras FOREIGN_LOCK contiene el usuario que tiene el bloqueo: úsalo para informar al usuario."],
            ["UPDATE scustom SET discount = '010' WHERE id = @p_id.", "Modifica campos de las filas que cumplen el WHERE. Sin WHERE modificaría <b>toda</b> la tabla."],
            ["DEQUEUE_E_TABLE", "Libera el bloqueo. Al terminar el programa también se liberan sus bloqueos."],
            ["SM12", "Lista los bloqueos activos (usuario, tabla, argumento). Borrar una entrada solo se hace cuando un bloqueo quedó colgado."],
          ]),
        ],
        check: () => run("ZP5_BLOQUEO")?.status === "ok" && activeHas("ZP5_BLOQUEO", /ENQUEUE_E_TABLE/i) && !!store.data.visited?.SM12,
        hint: "Simula un bloqueo en SM12 y ejecuta ZP5_BLOQUEO.",
      },
      {
        id: "p5s6",
        title: "Archivos: descargar y cargar (GUI_DOWNLOAD / GUI_UPLOAD)",
        body: [
          "Muchos programas reales exportan datos a un archivo para Excel o cargan datos masivos desde un archivo de texto. Las funciones clásicas son <code>GUI_DOWNLOAD</code> (de SAP al PC) y <code>GUI_UPLOAD</code> (del PC a SAP). En el navegador la descarga va a tu carpeta de descargas y la carga te pide elegir el archivo.",
          "Crea <code>ZP5_ARCHIVOS</code>:",
          code(`REPORT zp5_archivos.

PARAMETERS: p_down RADIOBUTTON GROUP g1 DEFAULT 'X',
            p_up   RADIOBUTTON GROUP g1,
            p_file TYPE string LOWER CASE DEFAULT 'C:\\temp\\aerolineas.txt'.

TYPES: BEGIN OF ty_linea,
         carrid   TYPE scarr-carrid,
         carrname TYPE scarr-carrname,
         currcode TYPE scarr-currcode,
       END OF ty_linea.
DATA lt_datos TYPE STANDARD TABLE OF ty_linea WITH DEFAULT KEY.

IF p_down = abap_true.
  SELECT carrid, carrname, currcode FROM scarr INTO TABLE @lt_datos.
  CALL FUNCTION 'GUI_DOWNLOAD'
    EXPORTING
      filename              = p_file
      write_field_separator = 'X'
    TABLES
      data_tab              = lt_datos
    EXCEPTIONS
      OTHERS                = 1.
  WRITE: / lines( lt_datos ), 'líneas descargadas a', p_file.
ELSE.
  CALL FUNCTION 'GUI_UPLOAD'
    EXPORTING
      filename            = p_file
      has_field_separator = 'X'
    TABLES
      data_tab            = lt_datos
    EXCEPTIONS
      file_open_error     = 1
      OTHERS              = 2.
  IF sy-subrc <> 0.
    MESSAGE 'No se pudo leer el archivo' TYPE 'I'.
    RETURN.
  ENDIF.
  LOOP AT lt_datos INTO DATA(ls_linea).
    WRITE: / ls_linea-carrid, ls_linea-carrname, ls_linea-currcode.
  ENDLOOP.
ENDIF.`),
          "Ejecuta primero con <b>Descargar</b>: obtendrás <code>aerolineas.txt</code> (columnas separadas por tabulador, se abre bien en Excel). Edítalo si quieres y ejecuta con <b>Cargar</b> eligiendo ese archivo.",
          syntax([
            ["RADIOBUTTON GROUP g1", "Botones de opción: solo uno del grupo puede estar marcado."],
            ["LOWER CASE", "Respeta mayúsculas y minúsculas en el parámetro (por defecto se convierte a mayúsculas)."],
            ["write_field_separator = 'X'", "Separa las columnas con tabulador (formato que Excel entiende)."],
            ["has_field_separator = 'X'", "Al cargar, cada línea se divide por el separador y se reparte en los campos de la estructura, en orden."],
            ["data_tab = lt_datos", "La tabla interna que se escribe o que se llena con el contenido del archivo."],
          ]),
          "En sistemas modernos se usa la clase <code>cl_gui_frontend_services</code> (métodos gui_download y gui_upload), que hace lo mismo. Ten en cuenta que en un <b>job de fondo</b> (SM36) no hay PC: ahí se usa <code>OPEN DATASET</code> para leer y escribir archivos del servidor.",
        ],
        check: () => run("ZP5_ARCHIVOS")?.status === "ok" && activeHas("ZP5_ARCHIVOS", /GUI_DOWNLOAD/i),
        hint: "Ejecuta ZP5_ARCHIVOS descargando el archivo.",
      },
      {
        id: "p5s7",
        title: "Mensajes reutilizables (SE91) y variantes",
        body: [
          "Escribir los textos de los mensajes dentro del código impide traducirlos y reutilizarlos. En SAP se definen en una <b>clase de mensajes</b> (SE91) con número, y en el código se hace referencia al número.",
          "1. Abre <b>SE91</b>, crea la clase <code>ZVUELOS</code> (Mensajes de vuelos) y añade:<br><code>001</code> La aerolínea &amp;1 no existe<br><code>002</code> Se encontraron &amp;1 vuelos de &amp;2<br>(Opcional: escribe la traducción en la columna EN.) Graba.",
          "2. Crea <code>ZP5_MENSAJES</code>:",
          code(`REPORT zp5_mensajes MESSAGE-ID zvuelos.

PARAMETERS p_carr TYPE scarr-carrid DEFAULT 'LA'.

AT SELECTION-SCREEN.
  SELECT SINGLE carrid FROM scarr WHERE carrid = @p_carr INTO @DATA(lv_carr).
  IF sy-subrc <> 0.
    MESSAGE e001 WITH p_carr.
  ENDIF.

START-OF-SELECTION.
  SELECT COUNT(*) FROM sflight WHERE carrid = @p_carr INTO @DATA(lv_n).
  MESSAGE s002 WITH lv_n p_carr.
  WRITE: / 'Vuelos de', p_carr, ':', lv_n.`),
          syntax([
            ["REPORT ... MESSAGE-ID zvuelos.", "Clase de mensajes por defecto del programa: permite escribir solo el tipo y el número."],
            ["MESSAGE e001 WITH p_carr.", "e = tipo error, 001 = número. WITH reemplaza &amp;1, &amp;2... del texto por los valores indicados."],
            ["MESSAGE e001(zvuelos)", "Forma con la clase explícita, cuando no hay MESSAGE-ID o es otra clase."],
            ["AT SELECTION-SCREEN.", "Validación de la pantalla de selección: un mensaje E aquí vuelve a la pantalla para corregir el valor."],
          ]),
          "3. Ejecuta con <code>XX</code> (error en la pantalla) y con <code>LA</code>. 4. <b>Variantes</b>: en la pantalla de selección escribe <code>IB</code> y pulsa <b>Guardar como variante</b> (nombre <code>IBERIA</code>). La próxima vez usa <b>Obtener variante</b> para cargar los valores. Las variantes se usan mucho para programar ejecuciones en fondo con valores fijos.",
          "Cambia el idioma de inicio de sesión a EN (Sistema - Configuración de usuario) y vuelve a ejecutar: si escribiste la traducción, el mensaje sale en inglés sin tocar el código.",
        ],
        check: () => run("ZP5_MENSAJES")?.status === "ok" && activeHas("ZP5_MENSAJES", /MESSAGE-ID\s+zvuelos/i) && !!store.data.msgClasses?.ZVUELOS,
        hint: "Crea la clase ZVUELOS en SE91 y ejecuta ZP5_MENSAJES.",
      },
    ],
  },
  {
    id: "p6",
    title: "Paso 6",
    subtitle: "Calidad: pruebas unitarias (ABAP Unit) y ATC",
    steps: [
      {
        id: "p6s1",
        title: "Tu primera prueba unitaria (ABAP Unit)",
        body: [
          "Una <b>prueba unitaria</b> es código que comprueba automáticamente que otro código funciona. Si mañana alguien cambia la lógica y rompe algo, las pruebas lo detectan al instante. En ABAP se escriben como <b>clases locales de prueba</b> (FOR TESTING) dentro del mismo programa, y se ejecutan con <b>Prueba unitaria</b> (Ctrl+Shift+F10) en lugar de F8.",
          "Crea <code>ZP6_UNIT</code>:",
          code(`REPORT zp6_unit.

CLASS lcl_precios DEFINITION.
  PUBLIC SECTION.
    TYPES ty_monto TYPE p LENGTH 10 DECIMALS 2.
    METHODS con_igv
      IMPORTING iv_neto         TYPE ty_monto
      RETURNING VALUE(rv_total) TYPE ty_monto.
    METHODS descuento
      IMPORTING iv_monto        TYPE ty_monto
                iv_cliente_vip  TYPE abap_bool
      RETURNING VALUE(rv_desc)  TYPE ty_monto.
ENDCLASS.

CLASS lcl_precios IMPLEMENTATION.
  METHOD con_igv.
    rv_total = iv_neto * '1.18'.
  ENDMETHOD.

  METHOD descuento.
    IF iv_cliente_vip = abap_true AND iv_monto >= 1000.
      rv_desc = iv_monto * '0.10'.
    ENDIF.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(go_precios) = NEW lcl_precios( ).
  WRITE: / 'Total con IGV de 100:', go_precios->con_igv( 100 ).

" ---------------- Pruebas unitarias ----------------
CLASS ltc_precios DEFINITION FOR TESTING RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    DATA mo_cut TYPE REF TO lcl_precios.
    METHODS setup.
    METHODS igv_de_100 FOR TESTING.
    METHODS vip_con_descuento FOR TESTING.
    METHODS no_vip_sin_descuento FOR TESTING.
ENDCLASS.

CLASS ltc_precios IMPLEMENTATION.
  METHOD setup.
    mo_cut = NEW #( ).
  ENDMETHOD.

  METHOD igv_de_100.
    cl_abap_unit_assert=>assert_equals(
      act = mo_cut->con_igv( 100 )
      exp = '118.00'
      msg = '100 más 18% de IGV debe ser 118' ).
  ENDMETHOD.

  METHOD vip_con_descuento.
    cl_abap_unit_assert=>assert_equals(
      act = mo_cut->descuento( iv_monto = 2000 iv_cliente_vip = abap_true )
      exp = '200.00' ).
  ENDMETHOD.

  METHOD no_vip_sin_descuento.
    cl_abap_unit_assert=>assert_initial(
      act = mo_cut->descuento( iv_monto = 2000 iv_cliente_vip = abap_false )
      msg = 'Un cliente normal no tiene descuento' ).
  ENDMETHOD.
ENDCLASS.`),
          "Pulsa <b>Prueba unitaria</b> (Ctrl+Shift+F10): las 3 pruebas deben salir en verde. Ahora <b>rompe el código a propósito</b>: cambia <code>'1.18'</code> por <code>'1.19'</code> y vuelve a ejecutar las pruebas. Verás en rojo qué prueba falló, el valor esperado y el obtenido. Corrígelo de nuevo hasta que todo esté en verde.",
          syntax([
            ["CLASS ltc_... DEFINITION FOR TESTING", "Clase de prueba: solo se ejecuta con ABAP Unit, nunca con F8. Convención de nombre: <code>ltc_</code> (local test class)."],
            ["RISK LEVEL HARMLESS", "La prueba no modifica datos persistentes (otras opciones: DANGEROUS, CRITICAL)."],
            ["DURATION SHORT", "Duración esperada (SHORT, MEDIUM, LONG)."],
            ["METHODS nombre FOR TESTING.", "Cada método de prueba comprueba un caso concreto. El nombre debe decir qué se prueba."],
            ["METHODS setup.", "Se ejecuta automáticamente <b>antes de cada</b> método de prueba: prepara el objeto a probar (también existen teardown, class_setup y class_teardown)."],
            ["mo_cut", "\"Code Under Test\": el objeto que se prueba."],
            ["cl_abap_unit_assert=>assert_equals( act = ... exp = ... )", "Compara el valor obtenido (act) con el esperado (exp). Si no son iguales, la prueba falla con el mensaje msg."],
            ["assert_initial / assert_not_initial", "Comprueba que un valor esté vacío (0, espacio, tabla sin líneas) o que no lo esté."],
            ["assert_true / assert_false / assert_subrc / fail", "Otras aserciones: condición verdadera o falsa, valor de sy-subrc, o fallo forzado."],
          ]),
          "Buenas prácticas: una prueba por comportamiento, nombres que expliquen el caso (<code>vip_con_descuento</code>), y separar la lógica en clases para poder probarla sin pantallas ni base de datos.",
        ],
        check: () => (store.data.quality?.unit?.ZP6_UNIT?.total || 0) >= 3 && store.data.quality.unit.ZP6_UNIT.failed === 0,
        hint: "Ejecuta las pruebas de ZP6_UNIT (Ctrl+Shift+F10) y déjalas todas en verde.",
      },
      {
        id: "p6s2",
        title: "Escribe tus propias pruebas",
        body: [
          "Añade a <code>ZP6_UNIT</code> dos métodos de prueba nuevos en <code>ltc_precios</code>:",
          "1. <code>vip_monto_bajo</code>: un cliente VIP con un monto de 500 <b>no</b> tiene descuento (el descuento solo aplica desde 1000).<br>2. <code>vip_limite_exacto</code>: un cliente VIP con exactamente 1000 tiene 100,00 de descuento.",
          "Declara cada método con <code>FOR TESTING</code> en la DEFINITION y escribe su código en la IMPLEMENTATION. Ejecuta las pruebas: deben ser 5 en verde. Probar los <b>límites</b> (999, 1000, 1001) es donde más errores se encuentran.",
          "Reto extra: cambia <code>&gt;= 1000</code> por <code>&gt; 1000</code> en el método descuento y comprueba que tu prueba <code>vip_limite_exacto</code> detecta el error.",
        ],
        check: () => (store.data.quality?.unit?.ZP6_UNIT?.total || 0) >= 5 && store.data.quality.unit.ZP6_UNIT.failed === 0,
        hint: "Añade 2 métodos FOR TESTING más y ejecuta las pruebas: 5 en verde.",
      },
      {
        id: "p6s3",
        title: "Revisión de calidad con el ATC",
        body: [
          "El <b>ATC</b> (ABAP Test Cockpit) analiza el código sin ejecutarlo y avisa de problemas de rendimiento, robustez y estilo. En los proyectos reales, antes de pasar un programa a producción se exige que no tenga mensajes de prioridad 1 ni 2.",
          "Crea <code>ZP6_ATC</code> con este código (tiene errores a propósito) y pulsa el botón <b>ATC</b> del editor:",
          code(`REPORT zp6_atc.

DATA: gt_conexiones TYPE STANDARD TABLE OF spfli,
      gv_total      TYPE i,
      gv_sobrante   TYPE string.

SELECT * FROM spfli INTO TABLE gt_conexiones.

LOOP AT gt_conexiones INTO DATA(gs_con).
  SELECT SINGLE carrname FROM scarr INTO @DATA(gv_nombre)
    WHERE carrid = @gs_con-carrid.
  WRITE: / gs_con-carrid, gv_nombre, gs_con-cityfrom, gs_con-cityto.
ENDLOOP.

SELECT * FROM sflight
  FOR ALL ENTRIES IN @gt_conexiones
  WHERE carrid = @gt_conexiones-carrid
  INTO TABLE @DATA(gt_vuelos).

MOVE lines( gt_vuelos ) TO gv_total.
WRITE: / 'Vuelos:', gv_total.`),
          "Verás varios mensajes. Corrígelos uno a uno (haz clic en la línea para ir al código) y vuelve a pulsar ATC hasta que no quede ninguno de prioridad 1 ni 2. Pistas:",
          syntax([
            ["Acceso a base de datos dentro de un bucle", "Lee las aerolíneas antes del LOOP (SELECT carrid, carrname FROM scarr INTO TABLE ...) y dentro usa READ TABLE, o haz un JOIN entre spfli y scarr."],
            ["FOR ALL ENTRIES sin comprobar la tabla", "Envuelve el SELECT en IF gt_conexiones IS NOT INITIAL. ... ENDIF."],
            ["SELECT *", "Indica solo los campos que usas: SELECT carrid, connid, cityfrom, cityto FROM spfli ..."],
            ["No se comprueba sy-subrc", "Después de READ TABLE o SELECT SINGLE, revisa IF sy-subrc = 0."],
            ["Variable no utilizada", "Borra gv_sobrante (y gt_vuelos si solo la cuentas: puedes usar SELECT COUNT(*))."],
            ["Instrucción obsoleta", "MOVE a TO b. se escribe hoy b = a."],
          ]),
          "Además, los mensajes de prioridad 3 (convenciones de nombres, código comentado, textos de mensaje fijos) no bloquean, pero un buen desarrollador también los corrige.",
        ],
        check: () => {
          const q = store.data.quality?.atc?.ZP6_ATC;
          return !!q && q.p1 === 0 && q.p2 === 0 && run("ZP6_ATC")?.status === "ok";
        },
        hint: "Corrige ZP6_ATC hasta que el ATC no muestre prioridad 1 ni 2, y ejecútalo.",
      },
    ],
  },
  {
    id: "p7",
    title: "Paso 7",
    subtitle: "Avanzado: clases globales, listas interactivas y depuración",
    steps: [
      {
        id: "p7s1",
        title: "Clase global en SE24",
        body: [
          "En el Paso 4 creaste clases <b>locales</b> (lcl_), que solo existen dentro de su programa. Una clase <b>global</b> se crea en <b>SE24</b> y la puede usar cualquier programa, módulo de función u otra clase: es la forma de compartir lógica en proyectos reales.",
          "1. Abre <b>SE24</b>, escribe <code>ZCL_VUELOS</code> y pulsa <b>Crear</b> (descripción: Lectura de vuelos).<br>2. En <b>Código fuente</b> reemplaza todo por:",
          code(`CLASS zcl_vuelos DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES tt_vuelos TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY.

    METHODS constructor
      IMPORTING iv_carrid TYPE sflight-carrid.
    METHODS leer
      RETURNING VALUE(rt_vuelos) TYPE tt_vuelos.
    METHODS ocupacion_media
      RETURNING VALUE(rv_porc) TYPE i.
    CLASS-METHODS existe
      IMPORTING iv_carrid       TYPE sflight-carrid
      RETURNING VALUE(rv_existe) TYPE abap_bool.

  PRIVATE SECTION.
    DATA mv_carrid TYPE sflight-carrid.
ENDCLASS.


CLASS zcl_vuelos IMPLEMENTATION.

  METHOD constructor.
    mv_carrid = iv_carrid.
  ENDMETHOD.

  METHOD leer.
    SELECT * FROM sflight WHERE carrid = @mv_carrid INTO TABLE @rt_vuelos.
  ENDMETHOD.

  METHOD ocupacion_media.
    DATA lv_suma TYPE i.
    DATA(lt_vuelos) = leer( ).
    IF lt_vuelos IS INITIAL.
      RETURN.
    ENDIF.
    LOOP AT lt_vuelos INTO DATA(ls_vuelo).
      lv_suma = lv_suma + ls_vuelo-seatsocc * 100 / ls_vuelo-seatsmax.
    ENDLOOP.
    rv_porc = lv_suma / lines( lt_vuelos ).
  ENDMETHOD.

  METHOD existe.
    SELECT SINGLE carrid FROM scarr WHERE carrid = @iv_carrid INTO @DATA(lv_carrid).
    rv_existe = xsdbool( sy-subrc = 0 ).
  ENDMETHOD.

ENDCLASS.`),
          "3. <b>Activar</b> (Ctrl+F3). Mira la pestaña <b>Componentes</b>: verás qué es público/privado y estático/instancia.<br>4. Úsala desde un programa <code>ZP7_GLOBAL</code>:",
          code(`REPORT zp7_global.

PARAMETERS p_carr TYPE sflight-carrid DEFAULT 'LH'.

START-OF-SELECTION.
  IF zcl_vuelos=>existe( p_carr ) = abap_false.
    MESSAGE |La aerolínea { p_carr } no existe| TYPE 'I'.
    RETURN.
  ENDIF.

  DATA(lo_vuelos) = NEW zcl_vuelos( p_carr ).
  WRITE: / 'Vuelos de', p_carr, ':', lines( lo_vuelos->leer( ) ),
         / 'Ocupación media:', lo_vuelos->ocupacion_media( ), '%'.`),
          syntax([
            ["CLASS zcl_... DEFINITION PUBLIC", "PUBLIC hace que la clase sea global: visible para todo el sistema. Convención: ZCL_ para clases, ZCX_ para excepciones."],
            ["FINAL", "Nadie puede heredar de esta clase."],
            ["CREATE PUBLIC", "Cualquiera puede crear objetos con NEW. (CREATE PRIVATE: solo la propia clase, típico del patrón singleton.)"],
            ["TYPES tt_vuelos ... (en PUBLIC SECTION)", "Un tipo público de la clase: los programas lo usan como zcl_vuelos=>tt_vuelos."],
            ["CLASS-METHODS existe", "Método estático: se llama con <code>=&gt;</code> sin crear objeto."],
            ["zcl_vuelos=>existe( p_carr )", "Llamada a un método estático."],
            ["NEW zcl_vuelos( p_carr )", "Crea un objeto: se ejecuta el constructor con ese parámetro."],
            ["lo_vuelos->leer( )", "Llamada a un método de instancia (sobre un objeto)."],
          ]),
        ],
        check: () => !!store.data.classes?.ZCL_VUELOS?.activeSource && run("ZP7_GLOBAL")?.status === "ok" && activeHas("ZP7_GLOBAL", /zcl_vuelos/i),
        hint: "Activa ZCL_VUELOS en SE24 y ejecuta ZP7_GLOBAL.",
      },
      {
        id: "p7s2",
        title: "Listas interactivas: AT LINE-SELECTION y HIDE",
        body: [
          "Antes del ALV, los reportes clásicos eran <b>listas interactivas</b>: el usuario hace doble clic en una línea y aparece una <b>lista secundaria</b> con el detalle. Todavía las encontrarás en muchos programas antiguos.",
          "Crea <code>ZP7_INTERACTIVA</code>:",
          code(`REPORT zp7_interactiva.

DATA gs_carr TYPE scarr.

START-OF-SELECTION.
  WRITE / 'Aerolíneas (doble clic en una línea para ver sus conexiones)'.
  ULINE.
  SELECT * FROM scarr INTO @gs_carr ORDER BY carrid.
    WRITE: / gs_carr-carrid HOTSPOT, gs_carr-carrname.
    HIDE gs_carr-carrid.
  ENDSELECT.
  CLEAR gs_carr.

AT LINE-SELECTION.
  CASE sy-lsind.
    WHEN 1.
      WRITE: / 'Conexiones de', gs_carr-carrid.
      ULINE.
      SELECT connid, cityfrom, cityto FROM spfli
        WHERE carrid = @gs_carr-carrid
        INTO TABLE @DATA(lt_con).
      LOOP AT lt_con INTO DATA(ls_con).
        WRITE: / ls_con-connid, ls_con-cityfrom, ls_con-cityto.
      ENDLOOP.
      IF lt_con IS INITIAL.
        WRITE / 'Sin conexiones'.
      ENDIF.
    WHEN OTHERS.
      WRITE / 'Línea seleccionada:'.
      WRITE / sy-lisel.
  ENDCASE.`),
          "Ejecuta y haz <b>doble clic</b> en una aerolínea (o selecciónala y pulsa F2). Aparece la lista secundaria nivel 1. Haz doble clic en una conexión: lista nivel 2. Con F3 vuelves a la lista anterior.",
          syntax([
            ["AT LINE-SELECTION.", "Evento que se ejecuta cuando el usuario hace doble clic (o F2) en una línea de la lista. Todo lo que se escriba ahí va a una nueva lista secundaria."],
            ["HIDE gs_carr-carrid.", "Guarda el valor del campo <b>junto con la línea actual</b>. Al seleccionar esa línea, el campo recupera automáticamente ese valor."],
            ["sy-lsind", "Nivel de la lista que se está creando: 0 = lista básica, 1 = primera lista secundaria, ... (máximo 20)."],
            ["sy-lisel", "Contenido de la línea seleccionada (texto)."],
            ["HOTSPOT", "Marca el campo como \"enlace\": en SAP basta un clic. Aquí las líneas con HIDE se resaltan en azul."],
            ["SELECT ... ENDSELECT", "Bucle sobre la base de datos (una fila en cada vuelta). Útil aquí para escribir y hacer HIDE fila a fila; para cálculos es mejor INTO TABLE."],
            ["CLEAR gs_carr.", "Se limpia al final para que, si el usuario hace doble clic en una línea sin HIDE (el título), el campo no tenga el valor de la última aerolínea."],
          ]),
        ],
        check: () => run("ZP7_INTERACTIVA")?.status === "ok" && activeHas("ZP7_INTERACTIVA", /AT\s+LINE-SELECTION/i) && activeHas("ZP7_INTERACTIVA", /^\s*HIDE\b/im),
        hint: "Ejecuta ZP7_INTERACTIVA con AT LINE-SELECTION y HIDE.",
      },
      {
        id: "p7s3",
        title: "Depuración avanzada: cambiar valores y watchpoints",
        body: [
          "Dos técnicas del depurador que ahorran horas: <b>cambiar el valor</b> de una variable para probar otro camino sin tocar el código, y los <b>watchpoints</b>, que detienen el programa justo cuando una variable cambia.",
          "Crea <code>ZP7_DEBUG</code>:",
          code(`REPORT zp7_debug.

DATA: lv_contador TYPE i,
      lv_total    TYPE i,
      lv_estado   TYPE string VALUE 'NORMAL'.

DO 10 TIMES.
  lv_contador = lv_contador + 1.
  lv_total = lv_total + lv_contador.
  IF lv_total > 30.
    lv_estado = 'LIMITE SUPERADO'.
  ENDIF.
ENDDO.

WRITE: / 'Contador:', lv_contador,
       / 'Total:   ', lv_total,
       / 'Estado:  ', lv_estado.`),
          "1. En el editor pulsa <b>Depurar</b>: el programa se detiene en la primera instrucción.<br>2. Pulsa <b>Watchpoint</b> y elige <code>LV_ESTADO</code>. Pulsa <b>Continuar</b> (F8): el depurador se detiene justo después de la línea que cambió el estado y te dice el valor anterior y el nuevo. Mira cuánto vale LV_TOTAL en ese momento.<br>3. Ahora haz <b>doble clic en el valor</b> de <code>LV_CONTADOR</code>, escribe <code>100</code> y pulsa Enter. Continúa (F8) y observa cómo cambia el resultado final.",
          syntax([
            ["Watchpoint", "Condición de parada sobre una variable: el programa se detiene cuando su valor cambia. Ideal para encontrar \"quién modifica este campo\"."],
            ["Cambiar valor (doble clic)", "Modifica la variable en memoria mientras el programa está detenido. En SAP real requiere autorización de depuración con cambio (en producción casi nunca se tiene)."],
            ["Punto de parada (clic en el margen)", "Se detiene siempre al llegar a esa línea."],
            ["F5 / F6 / F8", "Paso a paso (entra en FORMs y métodos) / Ejecutar (sin entrar) / Continuar hasta la siguiente parada."],
          ]),
        ],
        check: () => run("ZP7_DEBUG")?.status === "ok" && !!store.data.debugUsed && activeHas("ZP7_DEBUG", /lv_estado/i),
        hint: "Depura ZP7_DEBUG usando un watchpoint.",
      },
    ],
  },
  {
    id: "p8",
    title: "Proyecto final",
    subtitle: "Sistema de reservas de vuelos (proyecto completo)",
    steps: [
      {
        id: "p8s0",
        title: "La especificación funcional",
        body: [
          "Ahora trabajarás como en un proyecto real: no hay código para copiar, solo la <b>especificación</b> de lo que el cliente necesita. Usa todo lo aprendido y consulta los pasos anteriores cuando lo necesites.",
          "<b>Requerimiento:</b> la agencia de viajes quiere registrar reservas de sus clientes en los vuelos existentes (SFLIGHT), cancelarlas y ver un reporte.",
          terms([
            ["Datos", "Tabla ZRESERVAS con: número de reserva, vuelo (aerolínea, conexión, fecha), cliente (SCUSTOM), cantidad de asientos y estado (R = reservada, C = cancelada)."],
            ["Reglas", "El vuelo debe existir; el cliente debe existir; no se pueden reservar más asientos que los libres (SEATSMAX - SEATSOCC); una reserva cancelada no se puede volver a cancelar."],
            ["Mensajes", "Todos los mensajes en una clase de mensajes, nada de textos fijos en el código."],
            ["Calidad", "Lógica en una clase global con pruebas unitarias y sin errores de ATC de prioridad 1 y 2."],
          ]),
          "Cada paso de este proyecto se valida automáticamente. Al terminarlo todo (y aprobar el examen teórico en ZAYUDA) podrás generar tu <b>constancia de práctica</b>.",
        ],
        check: () => false,
        hint: "Lee la especificación y pulsa Marcar como hecho.",
      },
      {
        id: "p8s1",
        title: "1. Diccionario: dominio y tabla ZRESERVAS",
        body: [
          "En SE11 crea:",
          "a) Dominio <code>ZD_ESTADO_RES</code>: CHAR 1 con valores fijos <code>R</code> (Reservada) y <code>C</code> (Cancelada), y el elemento de datos <code>ZDE_ESTADO_RES</code> que lo use.<br>b) Tabla <code>ZRESERVAS</code> con los campos: MANDT (clave), ID NUMC 6 (clave), CARRID, CONNID, FLDATE (puedes referenciar tipos como en SFLIGHT: CHAR 3, NUMC 4, DATS), CUSTOMID NUMC 8, SEATS INT4 y ESTADO con el elemento <code>ZDE_ESTADO_RES</code>.",
          "Opcional (recomendado): pon SCARR como tabla de verificación de CARRID y SCUSTOM para CUSTOMID.",
        ],
        check: () => {
          const t = store.data.tables?.ZRESERVAS;
          if (!t || !t.active) return false;
          const f = (t.active.fields || t.fields || []).map((x) => x.name);
          return ["MANDT", "ID", "CARRID", "CONNID", "FLDATE", "CUSTOMID", "SEATS", "ESTADO"].every((x) => f.includes(x)) && !!store.data.domains?.ZD_ESTADO_RES;
        },
        hint: "Activa el dominio ZD_ESTADO_RES y la tabla ZRESERVAS con todos los campos.",
      },
      {
        id: "p8s2",
        title: "2. Clase de mensajes ZRESERVAS",
        body: [
          "En SE91 crea la clase <code>ZRESERVAS</code> con al menos estos mensajes (usa &amp;1, &amp;2 para los valores):",
          terms([
            ["001", "El vuelo &1 &2 del &3 no existe"],
            ["002", "El cliente &1 no existe"],
            ["003", "Solo quedan &1 asientos libres"],
            ["004", "Reserva &1 creada correctamente"],
            ["005", "La reserva &1 ya está cancelada"],
            ["006", "Reserva &1 cancelada"],
            ["007", "El registro está bloqueado por &1"],
          ]),
        ],
        check: () => Object.keys(store.data.msgClasses?.ZRESERVAS?.messages || {}).length >= 6,
        hint: "Crea ZRESERVAS en SE91 con al menos 6 mensajes.",
      },
      {
        id: "p8s3",
        title: "3. Clase global ZCL_RESERVAS",
        body: [
          "En SE24 crea <code>ZCL_RESERVAS</code> con, como mínimo:",
          terms([
            ["crear", "IMPORTING vuelo (carrid, connid, fldate), cliente y asientos; RETURNING el número de reserva. Valida las reglas y, si algo falla, lanza una excepción (por ejemplo una clase ZCX_RESERVAS creada también en SE24) o devuelve los mensajes. Calcula el siguiente ID con SELECT MAX( id ) y actualiza SEATSOCC en SFLIGHT."],
            ["cancelar", "IMPORTING el ID; cambia ESTADO a 'C' y devuelve los asientos al vuelo."],
            ["asientos_libres", "IMPORTING el vuelo; RETURNING seatsmax - seatsocc. Será fácil de probar."],
          ]),
          "Pista de diseño: separa las validaciones en métodos pequeños (vuelo_existe, cliente_existe); así podrás probarlos uno por uno.",
        ],
        check: () => {
          const c = store.data.classes?.ZCL_RESERVAS?.activeSource || "";
          return /METHODS\s+crear\b/i.test(c) && /METHODS\s+cancelar\b/i.test(c);
        },
        hint: "Activa ZCL_RESERVAS con los métodos crear y cancelar.",
      },
      {
        id: "p8s4",
        title: "4. Programa de alta y cancelación",
        body: [
          "Crea <code>ZRESERVAS_ALTA</code> con una pantalla de selección: botones de opción Crear / Cancelar, campos del vuelo, cliente, asientos e ID de reserva. Requisitos:",
          "- Usa <code>MESSAGE-ID zreservas</code> y solo mensajes de la clase.<br>- Valida en <code>AT SELECTION-SCREEN</code> que los campos obligatorios estén llenos.<br>- Bloquea el vuelo con <code>ENQUEUE_E_TABLE</code> antes de modificar y desbloquéalo al terminar (prueba simulando un bloqueo en SM12).<br>- Llama a ZCL_RESERVAS y confirma con <code>COMMIT WORK</code>, o <code>ROLLBACK WORK</code> si hubo error.<br>- Guarda una variante con tus valores de prueba.",
        ],
        check: (app) => run("ZRESERVAS_ALTA")?.status === "ok" && activeHas("ZRESERVAS_ALTA", /zcl_reservas/i) && activeHas("ZRESERVAS_ALTA", /ENQUEUE_E_TABLE/i) && activeHas("ZRESERVAS_ALTA", /MESSAGE-ID\s+zreservas/i) && countRows(app, "ZRESERVAS") > 0,
        hint: "Ejecuta ZRESERVAS_ALTA y crea al menos una reserva.",
      },
      {
        id: "p8s5",
        title: "5. Reporte ALV de reservas",
        body: [
          "Crea <code>ZRESERVAS_LISTA</code>: SELECT-OPTIONS por aerolínea y fecha, un JOIN entre ZRESERVAS, SCUSTOM (nombre del cliente) y SCARR (nombre de la aerolínea), y muéstralo en un ALV con <code>cl_salv_table</code>: funciones estándar activas, columnas optimizadas, títulos de columna claros y orden por fecha. Muestra las canceladas también, pero que se distingan (por ejemplo, ordenadas o con una columna de texto del estado).",
          "Opcional: si no hay reservas para la selección, muestra un mensaje de tipo S y no el ALV vacío.",
        ],
        check: () => alvs("ZRESERVAS_LISTA").length > 0 && activeHas("ZRESERVAS_LISTA", /JOIN/i) && activeHas("ZRESERVAS_LISTA", /SELECT-OPTIONS/i),
        hint: "Muestra el ALV de ZRESERVAS_LISTA con JOIN y SELECT-OPTIONS.",
      },
      {
        id: "p8s6",
        title: "6. Pruebas unitarias",
        body: [
          "Crea <code>ZRESERVAS_TEST</code>: un programa con una clase de prueba <code>ltc_reservas</code> (FOR TESTING) que pruebe ZCL_RESERVAS. Mínimo 3 pruebas en verde, por ejemplo: asientos_libres de un vuelo conocido, que crear con un cliente inexistente falle, y que no se pueda reservar más que los asientos libres.",
          "Para que una prueba que espera un error sea correcta, captura la excepción con TRY ... CATCH y usa <code>cl_abap_unit_assert=&gt;fail( )</code> si no se produjo.",
        ],
        check: () => (store.data.quality?.unit?.ZRESERVAS_TEST?.total || 0) >= 3 && store.data.quality.unit.ZRESERVAS_TEST.failed === 0,
        hint: "Ejecuta ABAP Unit en ZRESERVAS_TEST con 3 pruebas o más en verde.",
      },
      {
        id: "p8s7",
        title: "7. Control de calidad (ATC)",
        body: [
          "Ejecuta el <b>ATC</b> sobre ZRESERVAS_ALTA y ZRESERVAS_LISTA y corrige todo hasta que no queden mensajes de prioridad 1 ni 2. Revisa también los de prioridad 3 (nombres, código comentado).",
          "Cuando termines, abre <b>ZAYUDA - Examen</b>, apruébalo y genera tu constancia.",
        ],
        check: () => ["ZRESERVAS_ALTA", "ZRESERVAS_LISTA"].every((n) => {
          const q = store.data.quality?.atc?.[n];
          return !!q && q.p1 === 0 && q.p2 === 0;
        }),
        hint: "Deja ZRESERVAS_ALTA y ZRESERVAS_LISTA sin mensajes ATC de prioridad 1 y 2.",
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
  p5: ["h501", "h502"],
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
  let current = localStorage.getItem("abapp.guideTab") || "p0";
  if (!GUIDES.some((x) => x.id === current)) current = "p0";
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
          (() => {
            const switchTo = (id) => {
              const g0 = host.querySelector(".guide");
              if (g0) localStorage.setItem("abapp.guideScroll." + current, String(g0.scrollTop));
              current = id;
              openStep = localStorage.getItem(stepKey()) || null;
              savedScroll = Number(localStorage.getItem("abapp.guideScroll." + current)) || 0;
              localStorage.setItem("abapp.guideTab", current);
              host.replaceChildren();
              render();
            };
            const idx = GUIDES.findIndex((x) => x.id === current);
            return h(
              "div",
              { class: "guide-tabs guide-nav" },
              h("button", { class: "gnav-btn", title: "Paso anterior", disabled: idx <= 0, onclick: () => switchTo(GUIDES[idx - 1].id) }, "<"),
              h(
                "select",
                { class: "guide-select", title: "Elegir paso de la guía", onchange: (e) => switchTo(e.target.value) },
                GUIDES.map((x) => {
                  const xn = x.steps.filter((s) => d[s.id]).length;
                  return h("option", { value: x.id, selected: x.id === current }, `${x.title} - ${x.subtitle.split(":")[0]} (${xn}/${x.steps.length})${xn === x.steps.length ? " - completo" : ""}`);
                }),
              ),
              h("button", { class: "gnav-btn", title: "Paso siguiente", disabled: idx >= GUIDES.length - 1, onclick: () => switchTo(GUIDES[idx + 1].id) }, ">"),
            );
          })(),
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
                              h("summary", {}, b.title || "Explicación de la sintaxis"),
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
