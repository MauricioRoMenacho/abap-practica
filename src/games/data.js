// Retos y juegos: completar código, adivinar la salida, corregir errores y programar.
// En los ejercicios de completar, los huecos se marcan con [[respuesta|alternativa]].

export const GAME_TYPES = [
  { id: "fill", title: "Completa el código", desc: "Escribe las palabras que faltan para que el programa funcione.", icon: "puzzle", points: 10 },
  { id: "predict", title: "¿Qué imprime?", desc: "Lee el código y adivina qué sale en la lista.", icon: "question", points: 10 },
  { id: "fix", title: "Encuentra el error", desc: "El programa tiene un error: corrígelo hasta obtener la salida esperada.", icon: "bug", points: 20 },
  { id: "code", title: "Programa desde cero", desc: "Escribe el programa completo; se comprueba ejecutándolo.", icon: "editor", points: 30 },
];

export const LEVELS = [
  [0, "Aprendiz"],
  [50, "Practicante"],
  [120, "Programador junior"],
  [220, "Programador semi senior"],
  [350, "Programador senior"],
  [470, "Arquitecto ABAP"],
];

const sql = (engine, q) => {
  try {
    return engine.query(q);
  } catch {
    return [];
  }
};

export const GAMES = [
  // ------------------------------------------------------------------ completar
  {
    id: "f01",
    type: "fill",
    level: "Básico",
    title: "Hola mundo",
    text: "Completa el programa para que escriba dos líneas.",
    code: `REPORT zjuego.

[[WRITE]] 'Hola mundo'[[.]]
WRITE [[/]] 'Segunda línea'.`,
    explain: "WRITE escribe en la lista, la barra / hace un salto de línea y toda instrucción termina con un punto.",
  },
  {
    id: "f02",
    type: "fill",
    level: "Básico",
    title: "Declarar variables",
    text: "Declara una variable entera con valor inicial 20 y una de texto.",
    code: `REPORT zjuego.

DATA lv_edad [[TYPE]] i [[VALUE]] 20.
DATA lv_nombre TYPE [[string|c]] VALUE 'Ana'.

WRITE: / lv_nombre, lv_edad.`,
    explain: "DATA declara, TYPE indica el tipo y VALUE el valor inicial. string es texto de longitud variable.",
  },
  {
    id: "f03",
    type: "fill",
    level: "Básico",
    title: "Condiciones",
    text: "Completa el IF: con nota 11 o más el alumno aprueba.",
    code: `REPORT zjuego.

DATA lv_nota TYPE i VALUE 14.

IF lv_nota [[>=|GE]] 11.
  WRITE 'Aprobado'.
[[ELSE]].
  WRITE 'Desaprobado'.
[[ENDIF]].`,
    explain: ">= (o GE) significa mayor o igual. Todo IF se cierra con ENDIF, y ELSE marca el caso contrario.",
  },
  {
    id: "f04",
    type: "fill",
    level: "Básico",
    title: "Bucle DO",
    text: "Escribe los números del 1 al 5.",
    code: `REPORT zjuego.

[[DO]] 5 [[TIMES]].
  WRITE / [[sy-index]].
[[ENDDO]].`,
    explain: "DO n TIMES repite el bloque n veces y sy-index tiene el número de vuelta actual.",
  },
  {
    id: "f05",
    type: "fill",
    level: "Intermedio",
    title: "Leer la base de datos",
    text: "Lee las aerolíneas que trabajan en dólares.",
    code: `REPORT zjuego.

SELECT * [[FROM]] scarr
  [[WHERE]] currcode = 'USD'
  [[INTO]] TABLE @DATA(lt_scarr).

WRITE: / 'Aerolíneas en USD:', lines( lt_scarr ).`,
    explain: "SELECT * FROM tabla WHERE condición INTO TABLE @itab. La @ marca las variables ABAP dentro del SQL.",
  },
  {
    id: "f06",
    type: "fill",
    level: "Intermedio",
    title: "Recorrer una tabla interna",
    text: "Recorre la tabla y escribe el nombre de cada aerolínea.",
    code: `REPORT zjuego.

SELECT * FROM scarr INTO TABLE @DATA(lt_scarr).

LOOP [[AT]] lt_scarr [[INTO]] DATA(ls_scarr).
  WRITE / ls_scarr[[-]]carrname.
[[ENDLOOP]].`,
    explain: "LOOP AT itab INTO estructura ... ENDLOOP. El guion accede a un campo de la estructura.",
  },
  {
    id: "f07",
    type: "fill",
    level: "Intermedio",
    title: "Buscar una línea",
    text: "Busca la aerolínea LA y escribe su nombre solo si existe.",
    code: `REPORT zjuego.

SELECT * FROM scarr INTO TABLE @DATA(lt_scarr).

[[READ]] TABLE lt_scarr INTO DATA(ls_scarr) [[WITH KEY]] carrid = 'LA'.
IF [[sy-subrc]] = 0.
  WRITE ls_scarr-carrname.
ENDIF.`,
    explain: "READ TABLE ... WITH KEY busca una línea; sy-subrc = 0 significa que la encontró.",
  },
  {
    id: "f08",
    type: "fill",
    level: "Intermedio",
    title: "Capturar un error",
    text: "Evita el dump al dividir entre cero.",
    code: `REPORT zjuego.

DATA lv_resultado TYPE i.

[[TRY]].
    lv_resultado = 10 / 0.
  [[CATCH]] cx_sy_zerodivide [[INTO]] DATA(lx_error).
    WRITE 'No se puede dividir entre cero'.
[[ENDTRY]].`,
    explain: "TRY ... CATCH excepción INTO DATA(lx) ... ENDTRY captura el error en vez de terminar con un dump.",
  },
  {
    id: "f09",
    type: "fill",
    level: "Intermedio",
    title: "Modificar con field-symbols",
    text: "Duplica la capacidad de todos los vuelos directamente en la tabla.",
    code: `REPORT zjuego.

SELECT * FROM sflight INTO TABLE @DATA(lt_vuelos) UP TO 3 ROWS.

LOOP AT lt_vuelos [[ASSIGNING]] FIELD-SYMBOL([[<ls_vuelo>]]).
  <ls_vuelo>-seatsmax = <ls_vuelo>-seatsmax * 2.
ENDLOOP.

WRITE: / 'Capacidad del primer vuelo:', lt_vuelos[ 1 ]-seatsmax.`,
    explain: "ASSIGNING FIELD-SYMBOL(<fs>) apunta a la línea real de la tabla: los cambios se guardan en la tabla.",
  },
  {
    id: "f10",
    type: "fill",
    level: "Avanzado",
    title: "Tu primer ALV",
    text: "Completa la llamada al ALV.",
    code: `REPORT zjuego.

SELECT * FROM scarr INTO TABLE @DATA(lt_scarr).

TRY.
    cl_salv_table=>[[factory]](
      [[IMPORTING]] r_salv_table = DATA(lo_alv)
      [[CHANGING]]  t_table      = lt_scarr ).
    lo_alv->[[display]]( ).
  CATCH cx_salv_msg.
ENDTRY.`,
    explain: "factory crea el ALV: IMPORTING devuelve el objeto y CHANGING recibe la tabla. display lo muestra.",
  },
  {
    id: "f11",
    type: "fill",
    level: "Avanzado",
    title: "Una clase local",
    text: "Completa la definición y la implementación de la clase.",
    code: `REPORT zjuego.

CLASS lcl_saludo DEFINITION.
  [[PUBLIC]] SECTION.
    [[METHODS]] saludar.
ENDCLASS.

CLASS lcl_saludo [[IMPLEMENTATION]].
  METHOD saludar.
    WRITE 'Hola desde un objeto'.
  [[ENDMETHOD]].
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_saludo) = [[NEW]] lcl_saludo( ).
  lo_saludo[[->]]saludar( ).`,
    explain: "DEFINITION declara, IMPLEMENTATION programa. NEW crea el objeto y -> llama a su método.",
  },
  {
    id: "f12",
    type: "fill",
    level: "Avanzado",
    title: "Unir tablas",
    text: "Une los pedidos de venta con el nombre del cliente.",
    code: `REPORT zjuego.

SELECT a~vbeln, k~name1
  FROM vbak AS a
  [[INNER JOIN]] kna1 AS k [[ON]] k~kunnr = a~kunnr
  INTO TABLE @DATA(lt_pedidos)
  UP TO 3 ROWS.

LOOP AT lt_pedidos INTO DATA(ls_pedido).
  WRITE: / ls_pedido-vbeln, ls_pedido-name1.
ENDLOOP.`,
    explain: "INNER JOIN tabla ON condición une las filas de dos tablas que comparten un campo.",
  },

  // ------------------------------------------------------------------ adivina
  {
    id: "q01",
    type: "predict",
    level: "Básico",
    title: "Suma en un bucle",
    code: `DATA lv_suma TYPE i.
DO 4 TIMES.
  lv_suma = lv_suma + sy-index.
ENDDO.
WRITE lv_suma.`,
    options: ["4", "10", "16", "0"],
    answer: 1,
    explain: "sy-index vale 1, 2, 3 y 4 en cada vuelta: 1 + 2 + 3 + 4 = 10.",
  },
  {
    id: "q02",
    type: "predict",
    level: "Básico",
    title: "División entera",
    code: `DATA lv_resultado TYPE i.
lv_resultado = 7 / 2.
WRITE lv_resultado.`,
    options: ["3", "3.5", "4", "Error de sintaxis"],
    answer: 2,
    explain: "El resultado se guarda en un entero y ABAP redondea: 3,5 se convierte en 4. Para truncar usa DIV (7 DIV 2 = 3).",
  },
  {
    id: "q03",
    type: "predict",
    level: "Básico",
    title: "Desplazamiento y longitud",
    code: `DATA lv_texto TYPE c LENGTH 10 VALUE 'ABAPERO'.
WRITE lv_texto+2(3).`,
    options: ["ABA", "APE", "BAP", "PER"],
    answer: 1,
    explain: "+2(3) toma 3 caracteres empezando en la posición 2 (la primera es la 0): A-B-[A-P-E]-R-O.",
  },
  {
    id: "q04",
    type: "predict",
    level: "Intermedio",
    title: "Línea que no existe",
    code: `DATA lt_numeros TYPE STANDARD TABLE OF i WITH EMPTY KEY.
lt_numeros = VALUE #( ( 10 ) ( 20 ) ( 30 ) ).
READ TABLE lt_numeros INTO DATA(lv_numero) INDEX 5.
WRITE sy-subrc.`,
    options: ["0", "4", "5", "Un dump"],
    answer: 1,
    explain: "READ TABLE no encuentra la línea 5 y deja sy-subrc = 4. (Con la expresión lt_numeros[ 5 ] sí habría un dump).",
  },
  {
    id: "q05",
    type: "predict",
    level: "Intermedio",
    title: "COLLECT",
    code: `TYPES: BEGIN OF ty_venta,
         cliente TYPE c LENGTH 5,
         monto   TYPE i,
       END OF ty_venta.
DATA lt_ventas TYPE STANDARD TABLE OF ty_venta WITH DEFAULT KEY.
COLLECT VALUE ty_venta( cliente = 'ANA' monto = 100 ) INTO lt_ventas.
COLLECT VALUE ty_venta( cliente = 'LUIS' monto = 50 ) INTO lt_ventas.
COLLECT VALUE ty_venta( cliente = 'ANA' monto = 30 ) INTO lt_ventas.
WRITE: lines( lt_ventas ), lt_ventas[ 1 ]-monto.`,
    options: ["3 100", "2 130", "2 100", "3 180"],
    answer: 1,
    explain: "COLLECT suma los campos numéricos cuando la clave (los campos de texto) ya existe: queda ANA 130 y LUIS 50, 2 líneas.",
  },
  {
    id: "q06",
    type: "predict",
    level: "Intermedio",
    title: "Ordenar",
    code: `DATA lt_letras TYPE STANDARD TABLE OF string WITH EMPTY KEY.
lt_letras = VALUE #( ( \`pera\` ) ( \`manzana\` ) ( \`uva\` ) ).
SORT lt_letras DESCENDING.
WRITE lt_letras[ 1 ].`,
    options: ["manzana", "pera", "uva", "pera manzana uva"],
    answer: 2,
    explain: "DESCENDING ordena de la Z a la A: uva, pera, manzana. La primera línea es uva.",
  },
  {
    id: "q07",
    type: "predict",
    level: "Intermedio",
    title: "IS INITIAL",
    code: `DATA lv_contador TYPE i.
DATA lv_texto TYPE string.
IF lv_contador IS INITIAL AND lv_texto IS INITIAL.
  WRITE 'Ambos vacíos'.
ELSE.
  WRITE 'Alguno tiene valor'.
ENDIF.`,
    options: ["Ambos vacíos", "Alguno tiene valor", "Error: no tienen VALUE", "No escribe nada"],
    answer: 0,
    explain: "Toda variable sin VALUE empieza con su valor inicial: 0 para números y vacío para textos. IS INITIAL es verdadero en ambos.",
  },
  {
    id: "q08",
    type: "predict",
    level: "Avanzado",
    title: "Herencia",
    code: `CLASS lcl_animal DEFINITION.
  PUBLIC SECTION.
    METHODS sonido RETURNING VALUE(rv) TYPE string.
ENDCLASS.
CLASS lcl_animal IMPLEMENTATION.
  METHOD sonido.
    rv = 'Silencio'.
  ENDMETHOD.
ENDCLASS.
CLASS lcl_perro DEFINITION INHERITING FROM lcl_animal.
  PUBLIC SECTION.
    METHODS sonido REDEFINITION.
ENDCLASS.
CLASS lcl_perro IMPLEMENTATION.
  METHOD sonido.
    rv = 'Guau'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA lo_animal TYPE REF TO lcl_animal.
  lo_animal = NEW lcl_perro( ).
  WRITE lo_animal->sonido( ).`,
    options: ["Silencio", "Guau", "Silencio Guau", "Error de tipos"],
    answer: 1,
    explain: "Polimorfismo: la variable es de tipo lcl_animal pero el objeto real es un lcl_perro, así que se ejecuta su método redefinido.",
  },

  // ------------------------------------------------------------------ corregir
  {
    id: "x01",
    type: "fix",
    level: "Básico",
    title: "Falta algo pequeño",
    text: "Este programa debería escribir dos líneas, pero ni siquiera compila.",
    code: `REPORT zjuego.

WRITE 'Hola'
WRITE / 'Mundo'.`,
    expected: ["Hola", "Mundo"],
    hint: "Revisa el final de cada instrucción.",
    solution: `REPORT zjuego.

WRITE 'Hola'.
WRITE / 'Mundo'.`,
  },
  {
    id: "x02",
    type: "fix",
    level: "Básico",
    title: "Variable fantasma",
    text: "El programa debe escribir 'Total: 30'.",
    code: `REPORT zjuego.

DATA lv_a TYPE i VALUE 10.
DATA lv_b TYPE i VALUE 20.

lv_total = lv_a + lv_b.
WRITE: 'Total:', lv_total.`,
    expected: ["Total: 30"],
    hint: "¿Todas las variables están declaradas?",
    solution: `REPORT zjuego.

DATA lv_a TYPE i VALUE 10.
DATA lv_b TYPE i VALUE 20.
DATA lv_total TYPE i.

lv_total = lv_a + lv_b.
WRITE: 'Total:', lv_total.`,
  },
  {
    id: "x03",
    type: "fix",
    level: "Básico",
    title: "Una vuelta de menos",
    text: "Debe sumar los números del 1 al 5 y escribir 'Suma: 15'. Compila, pero el resultado está mal.",
    code: `REPORT zjuego.

DATA lv_suma TYPE i.

DO 4 TIMES.
  lv_suma = lv_suma + sy-index.
ENDDO.

WRITE: 'Suma:', lv_suma.`,
    expected: ["Suma: 15"],
    hint: "Cuenta cuántas vueltas da el bucle.",
    solution: `REPORT zjuego.

DATA lv_suma TYPE i.

DO 5 TIMES.
  lv_suma = lv_suma + sy-index.
ENDDO.

WRITE: 'Suma:', lv_suma.`,
  },
  {
    id: "x04",
    type: "fix",
    level: "Intermedio",
    title: "La condición al revés",
    text: "Debe escribir 'LATAM Airlines encontrada'. Hay un error de lógica.",
    code: `REPORT zjuego.

SELECT * FROM scarr INTO TABLE @DATA(lt_scarr).

READ TABLE lt_scarr INTO DATA(ls_scarr) WITH KEY carrid = 'LA'.
IF sy-subrc <> 0.
  WRITE: ls_scarr-carrname, 'encontrada'.
ELSE.
  WRITE 'No existe'.
ENDIF.`,
    expected: ["LATAM Airlines encontrada"],
    hint: "¿Qué valor tiene sy-subrc cuando READ TABLE sí encuentra la línea?",
    solution: `REPORT zjuego.

SELECT * FROM scarr INTO TABLE @DATA(lt_scarr).

READ TABLE lt_scarr INTO DATA(ls_scarr) WITH KEY carrid = 'LA'.
IF sy-subrc = 0.
  WRITE: ls_scarr-carrname, 'encontrada'.
ELSE.
  WRITE 'No existe'.
ENDIF.`,
  },
  {
    id: "x05",
    type: "fix",
    level: "Intermedio",
    title: "Los cambios no se guardan",
    text: "Debe subir el precio de cada producto en 10 y escribir 110 y 210. Pero los precios no cambian.",
    code: `REPORT zjuego.

TYPES: BEGIN OF ty_prod,
         nombre TYPE c LENGTH 10,
         precio TYPE i,
       END OF ty_prod.
DATA lt_prod TYPE STANDARD TABLE OF ty_prod WITH EMPTY KEY.

lt_prod = VALUE #( ( nombre = 'Mouse' precio = 100 ) ( nombre = 'Teclado' precio = 200 ) ).

LOOP AT lt_prod INTO DATA(ls_prod).
  ls_prod-precio = ls_prod-precio + 10.
ENDLOOP.

LOOP AT lt_prod INTO ls_prod.
  WRITE / ls_prod-precio.
ENDLOOP.`,
    expected: ["110", "210"],
    hint: "Con INTO trabajas sobre una copia de la línea. Usa un field-symbol o MODIFY.",
    solution: `REPORT zjuego.

TYPES: BEGIN OF ty_prod,
         nombre TYPE c LENGTH 10,
         precio TYPE i,
       END OF ty_prod.
DATA lt_prod TYPE STANDARD TABLE OF ty_prod WITH EMPTY KEY.

lt_prod = VALUE #( ( nombre = 'Mouse' precio = 100 ) ( nombre = 'Teclado' precio = 200 ) ).

LOOP AT lt_prod ASSIGNING FIELD-SYMBOL(<ls_prod>).
  <ls_prod>-precio = <ls_prod>-precio + 10.
ENDLOOP.

LOOP AT lt_prod INTO DATA(ls_prod).
  WRITE / ls_prod-precio.
ENDLOOP.`,
  },
  {
    id: "x06",
    type: "fix",
    level: "Intermedio",
    title: "El dump del cero",
    text: "El programa termina con un dump. Debe escribir 'Error: división entre cero' en vez de terminar.",
    code: `REPORT zjuego.

DATA: lv_a TYPE i VALUE 10,
      lv_b TYPE i VALUE 0,
      lv_c TYPE i.

lv_c = lv_a / lv_b.
WRITE lv_c.`,
    expected: ["Error: división entre cero"],
    hint: "Captura la excepción CX_SY_ZERODIVIDE con TRY ... CATCH.",
    solution: `REPORT zjuego.

DATA: lv_a TYPE i VALUE 10,
      lv_b TYPE i VALUE 0,
      lv_c TYPE i.

TRY.
    lv_c = lv_a / lv_b.
    WRITE lv_c.
  CATCH cx_sy_zerodivide.
    WRITE 'Error: división entre cero'.
ENDTRY.`,
  },

  // ------------------------------------------------------------------ programar
  {
    id: "c01",
    type: "code",
    level: "Básico",
    title: "Tabla de multiplicar",
    text: "Escribe la tabla del 7, del 1 al 10, una línea por resultado con el formato <code>7 x 1 = 7</code>.",
    starter: `REPORT zjuego.

`,
    expected: () => Array.from({ length: 10 }, (_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`),
    hint: "Usa DO 10 TIMES, sy-index y un string template: |7 x { sy-index } = { lv_resultado }|.",
    solution: `REPORT zjuego.

DATA lv_resultado TYPE i.

DO 10 TIMES.
  lv_resultado = 7 * sy-index.
  WRITE / |7 x { sy-index } = { lv_resultado }|.
ENDDO.`,
  },
  {
    id: "c02",
    type: "code",
    level: "Básico",
    title: "Factorial",
    text: "Calcula el factorial de 6 (6 x 5 x 4 x 3 x 2 x 1) y escribe <code>El factorial de 6 es 720</code>.",
    starter: `REPORT zjuego.

`,
    expected: () => ["El factorial de 6 es 720"],
    hint: "Empieza con un resultado igual a 1 y multiplícalo dentro de un DO 6 TIMES.",
    solution: `REPORT zjuego.

DATA lv_factorial TYPE i VALUE 1.

DO 6 TIMES.
  lv_factorial = lv_factorial * sy-index.
ENDDO.

WRITE |El factorial de 6 es { lv_factorial }|.`,
  },
  {
    id: "c03",
    type: "code",
    level: "Básico",
    title: "Solo los pares",
    text: "Escribe los números pares del 2 al 20, uno por línea.",
    starter: `REPORT zjuego.

`,
    expected: () => Array.from({ length: 10 }, (_, i) => String((i + 1) * 2)),
    hint: "Recorre del 1 al 20 y usa MOD: si sy-index MOD 2 = 0 es par.",
    solution: `REPORT zjuego.

DO 20 TIMES.
  IF sy-index MOD 2 = 0.
    WRITE / sy-index.
  ENDIF.
ENDDO.`,
  },
  {
    id: "c04",
    type: "code",
    level: "Intermedio",
    title: "Aerolíneas por moneda",
    text: "Con la tabla SCARR, escribe cuántas aerolíneas hay por moneda (CURRCODE), ordenado por moneda: una línea por moneda con la moneda y la cantidad, por ejemplo <code>EUR 3</code>.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => sql(engine, `SELECT "currcode" AS w, COUNT(*) AS c FROM "scarr" GROUP BY "currcode" ORDER BY "currcode"`).map((r) => `${String(r.w).trim()} ${r.c}`),
    hint: "Lee SCARR a una tabla interna, ordénala por CURRCODE y cuenta con LOOP ... AT NEW / AT END OF, o usa COLLECT con una estructura moneda + contador.",
    solution: `REPORT zjuego.

TYPES: BEGIN OF ty_cuenta,
         currcode TYPE scarr-currcode,
         cantidad TYPE i,
       END OF ty_cuenta.
DATA lt_cuentas TYPE STANDARD TABLE OF ty_cuenta WITH DEFAULT KEY.

SELECT * FROM scarr INTO TABLE @DATA(lt_scarr).

LOOP AT lt_scarr INTO DATA(ls_scarr).
  COLLECT VALUE ty_cuenta( currcode = ls_scarr-currcode cantidad = 1 ) INTO lt_cuentas.
ENDLOOP.

SORT lt_cuentas BY currcode.
LOOP AT lt_cuentas INTO DATA(ls_cuenta).
  WRITE: / ls_cuenta-currcode, ls_cuenta-cantidad.
ENDLOOP.`,
  },
  {
    id: "c05",
    type: "code",
    level: "Intermedio",
    title: "Ventas de una sociedad",
    text: "Suma el valor neto (NETWR) de todos los pedidos de venta (VBAK) de la sociedad 3000 (campo BUKRS_VF) y escribe <code>Total sociedad 3000: </code> seguido del importe con 2 decimales.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => {
      const r = sql(engine, `SELECT SUM("netwr") AS t FROM "vbak" WHERE "bukrs_vf" = '3000'`)[0];
      return [`Total sociedad 3000: ${Number(r?.t || 0).toFixed(2)}`];
    },
    hint: "Lee los pedidos con WHERE bukrs_vf = '3000' y suma NETWR en un LOOP (o con REDUCE). Declara el total como TYPE vbak-netwr.",
    solution: `REPORT zjuego.

DATA lv_total TYPE vbak-netwr.

SELECT * FROM vbak INTO TABLE @DATA(lt_pedidos)
  WHERE bukrs_vf = '3000'.

LOOP AT lt_pedidos INTO DATA(ls_pedido).
  lv_total = lv_total + ls_pedido-netwr.
ENDLOOP.

WRITE: 'Total sociedad 3000:', lv_total.`,
  },
  {
    id: "c06",
    type: "code",
    level: "Avanzado",
    title: "El sueldo más alto",
    text: "Con PA0001 (nombre en ENAME) y PA0008 (sueldo vigente en BET01, con ENDDA = '99991231'), escribe el nombre del empleado con el sueldo más alto y su sueldo, en una línea: <code>nombre sueldo</code>.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => {
      const r = sql(
        engine,
        `SELECT p1."ename" AS n, p8."bet01" AS b FROM "pa0008" p8 JOIN "pa0001" p1 ON p1."pernr" = p8."pernr" WHERE p8."endda" = '99991231' ORDER BY p8."bet01" DESC LIMIT 1`,
      )[0];
      return r ? [`${String(r.n).trim()} ${Number(r.b).toFixed(2)}`] : [];
    },
    hint: "Haz un JOIN de PA0001 y PA0008 por PERNR, ordena por BET01 DESCENDING y toma la primera línea (UP TO 1 ROWS o READ TABLE ... INDEX 1).",
    solution: `REPORT zjuego.

SELECT p1~ename, p8~bet01
  FROM pa0008 AS p8
  INNER JOIN pa0001 AS p1 ON p1~pernr = p8~pernr
  WHERE p8~endda = '99991231'
  ORDER BY p8~bet01 DESCENDING
  INTO TABLE @DATA(lt_sueldos)
  UP TO 1 ROWS.

READ TABLE lt_sueldos INTO DATA(ls_sueldo) INDEX 1.
IF sy-subrc = 0.
  WRITE: ls_sueldo-ename, ls_sueldo-bet01.
ENDIF.`,
  },
];

// ---------------------------------------------------------------- utilidades
export function parseFill(code) {
  const parts = [];
  const re = /\[\[([^\]]+)\]\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    if (m.index > last) parts.push({ text: code.substring(last, m.index) });
    const answers = m[1].split("|");
    parts.push({ blank: true, answers, size: Math.max(...answers.map((a) => a.length)) });
    last = m.index + m[0].length;
  }
  if (last < code.length) parts.push({ text: code.substring(last) });
  return parts;
}

export function fillSolution(code) {
  return code.replace(/\[\[([^\]|]+)[^\]]*\]\]/g, "$1");
}

const norm = (s) => String(s).trim().toUpperCase().replace(/\s+/g, " ");
export function sameAnswer(given, answers) {
  return answers.some((a) => norm(a) === norm(given));
}

// normaliza la salida para comparar: espacios, separadores de miles, decimales
export function normLine(l) {
  let s = String(l).replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i++) s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  return s;
}

export function compareOutput(got, expected) {
  const g = got.map(normLine).filter((x) => x !== "");
  const e = expected.map(normLine).filter((x) => x !== "");
  const ok = g.length === e.length && g.every((x, i) => x === e[i]);
  return { ok, got: g, expected: e };
}

export function levelFor(points) {
  let name = LEVELS[0][1];
  let next = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i][0]) {
      name = LEVELS[i][1];
      next = LEVELS[i + 1] || null;
    }
  }
  return { name, next };
}

export const MAX_POINTS = GAMES.reduce((a, g) => a + GAME_TYPES.find((t) => t.id === g.type).points, 0);
