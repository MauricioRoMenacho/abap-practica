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
  [60, "Practicante"],
  [160, "Programador junior"],
  [300, "Programador semi senior"],
  [460, "Programador senior"],
  [620, "Arquitecto ABAP"],
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

// ---------------------------------------------------------------- "Hazlo tú" de las guías
GAMES.push(
  {
    id: "h101",
    type: "code",
    guide: "p1",
    level: "Básico",
    title: "Hazlo tú: tarjeta de presentación",
    text: "Sin copiar código: crea un programa que declare una variable con el nombre <b>Rosa</b> y otra con la edad <b>30</b>. Debe escribir <code>Rosa tiene 30 años</code> y, en la línea siguiente, <code>Mayor de edad</code> solo si la edad es 18 o más.",
    starter: `REPORT zjuego.

`,
    expected: () => ["Rosa tiene 30 años", "Mayor de edad"],
    mustContain: [["\\bDATA\\b", "Declara las variables con DATA."], ["\\bIF\\b", "Usa un IF para decidir si es mayor de edad."]],
    hint: "Dos DATA (TYPE string y TYPE i), un WRITE con un string template |{ ... } tiene { ... } años| y un IF lv_edad >= 18.",
    solution: `REPORT zjuego.

DATA lv_nombre TYPE string VALUE 'Rosa'.
DATA lv_edad TYPE i VALUE 30.

WRITE / |{ lv_nombre } tiene { lv_edad } años|.
IF lv_edad >= 18.
  WRITE / 'Mayor de edad'.
ENDIF.`,
  },
  {
    id: "h102",
    type: "code",
    guide: "p1",
    level: "Básico",
    title: "Hazlo tú: alumnos aprobados",
    text: "Usa tu tabla <b>ZALUMNOS</b> (ejercicios 7 y 8 del Paso 1). Escribe un programa que cuente cuántos alumnos tienen nota 11 o más y escriba <code>Aprobados: N</code>.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => {
      const r = sql(engine, `SELECT COUNT(*) AS c FROM "zalumnos" WHERE "nota" >= 11`)[0];
      return r ? [`Aprobados: ${r.c}`] : ["(primero crea y activa la tabla ZALUMNOS en SE11)"];
    },
    mustContain: [["\\bSELECT\\b[\\s\\S]*\\bzalumnos\\b", "Lee la tabla ZALUMNOS con SELECT."]],
    hint: "SELECT * FROM zalumnos INTO TABLE @DATA(lt) WHERE nota >= 11. y luego lines( lt ). También vale SELECT COUNT(*).",
    solution: `REPORT zjuego.

SELECT * FROM zalumnos INTO TABLE @DATA(lt_alumnos)
  WHERE nota >= 11.

WRITE |Aprobados: { lines( lt_alumnos ) }|.`,
  },
  {
    id: "h201",
    type: "code",
    guide: "p2",
    level: "Intermedio",
    title: "Hazlo tú: ALV de conexiones",
    text: "Sin copiar código: muestra en un ALV las conexiones (tabla <b>SPFLI</b>) de la aerolínea <b>LA</b>, con la barra de pulsadores completa y el título <code>Conexiones LATAM</code>.",
    starter: `REPORT zjuego.

`,
    expectedText: (engine) => {
      const r = sql(engine, `SELECT COUNT(*) AS c FROM "spfli" WHERE "carrid" = 'LA'`)[0];
      return `Un ALV con ${r?.c ?? "?"} línea(s), todas las funciones y el título "Conexiones LATAM"`;
    },
    check: (res, engine) => {
      const n = sql(engine, `SELECT COUNT(*) AS c FROM "spfli" WHERE "carrid" = 'LA'`)[0]?.c;
      const a = res.alvs?.[0];
      if (!a) return { ok: false, msg: "Tu programa no mostró ningún ALV (falta display( ))." };
      if (a.rows !== n) return { ok: false, msg: `El ALV tiene ${a.rows} línea(s); deberían ser ${n} (solo CARRID = 'LA').` };
      if (!a.allFunctions) return { ok: false, msg: "Falta activar todas las funciones: get_functions( )->set_all( abap_true )." };
      if (!/latam/i.test(a.header || "")) return { ok: false, msg: "Falta el título: get_display_settings( )->set_list_header( 'Conexiones LATAM' )." };
      return { ok: true };
    },
    hint: "SELECT de SPFLI con WHERE carrid = 'LA', luego cl_salv_table=>factory, set_all, set_list_header y display.",
    solution: `REPORT zjuego.

SELECT * FROM spfli INTO TABLE @DATA(lt_conexiones)
  WHERE carrid = 'LA'.

TRY.
    cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                            CHANGING  t_table      = lt_conexiones ).
    lo_alv->get_functions( )->set_all( abap_true ).
    lo_alv->get_display_settings( )->set_list_header( 'Conexiones LATAM' ).
    lo_alv->display( ).
  CATCH cx_salv_msg.
ENDTRY.`,
  },
  {
    id: "h301",
    type: "code",
    guide: "p3",
    level: "Intermedio",
    title: "Hazlo tú: reservas por clase",
    text: "Sin copiar código: con la tabla <b>SBOOK</b>, escribe cuántas reservas hay por clase de vuelo (campo CLASS), ordenadas por clase: una línea por clase, por ejemplo <code>C 45</code>.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => sql(engine, `SELECT "class" AS k, COUNT(*) AS c FROM "sbook" GROUP BY "class" ORDER BY "class"`).map((r) => `${String(r.k).trim()} ${r.c}`),
    hint: "Usa una estructura con CLASS y un contador, COLLECT dentro de un LOOP y SORT al final.",
    solution: `REPORT zjuego.

TYPES: BEGIN OF ty_clase,
         class    TYPE sbook-class,
         cantidad TYPE i,
       END OF ty_clase.
DATA lt_clases TYPE STANDARD TABLE OF ty_clase WITH DEFAULT KEY.

SELECT * FROM sbook INTO TABLE @DATA(lt_reservas).
LOOP AT lt_reservas INTO DATA(ls_reserva).
  COLLECT VALUE ty_clase( class = ls_reserva-class cantidad = 1 ) INTO lt_clases.
ENDLOOP.
SORT lt_clases BY class.
LOOP AT lt_clases INTO DATA(ls_clase).
  WRITE: / ls_clase-class, ls_clase-cantidad.
ENDLOOP.`,
  },
  {
    id: "h302",
    type: "code",
    guide: "p3",
    level: "Avanzado",
    title: "Hazlo tú: el cliente que más compra",
    text: "Con <b>VBAK</b> y <b>KNA1</b>: suma el valor neto (NETWR) de los pedidos de cada cliente de la sociedad 1000 (BUKRS_VF) y escribe solo el <b>nombre</b> del cliente con el mayor total.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => {
      const r = sql(engine, `SELECT k."name1" AS n, SUM(a."netwr") AS t FROM "vbak" a JOIN "kna1" k ON k."kunnr" = a."kunnr" WHERE a."bukrs_vf" = '1000' GROUP BY k."name1" ORDER BY t DESC LIMIT 1`)[0];
      return r ? [String(r.n).trim()] : [];
    },
    hint: "Lee VBAK de la sociedad 1000, acumula por KUNNR con COLLECT, ordena por total DESCENDING, toma la línea 1 y busca su nombre en KNA1 (SELECT SINGLE o READ TABLE).",
    solution: `REPORT zjuego.

TYPES: BEGIN OF ty_total,
         kunnr TYPE vbak-kunnr,
         netwr TYPE vbak-netwr,
       END OF ty_total.
DATA lt_totales TYPE STANDARD TABLE OF ty_total WITH DEFAULT KEY.

SELECT * FROM vbak INTO TABLE @DATA(lt_pedidos) WHERE bukrs_vf = '1000'.
LOOP AT lt_pedidos INTO DATA(ls_pedido).
  COLLECT VALUE ty_total( kunnr = ls_pedido-kunnr netwr = ls_pedido-netwr ) INTO lt_totales.
ENDLOOP.
SORT lt_totales BY netwr DESCENDING.

READ TABLE lt_totales INTO DATA(ls_mayor) INDEX 1.
SELECT SINGLE name1 FROM kna1 INTO @DATA(lv_nombre) WHERE kunnr = @ls_mayor-kunnr.
WRITE lv_nombre.`,
  },
  {
    id: "h401",
    type: "code",
    guide: "p4",
    level: "Intermedio",
    title: "Hazlo tú: clase calculadora",
    text: "Crea una clase local <code>lcl_calculadora</code> con dos métodos, <code>sumar</code> y <code>multiplicar</code>, que reciban dos enteros y devuelvan el resultado (RETURNING). Úsala con 10 y 5 y escribe <code>Suma: 15</code> y <code>Producto: 50</code>.",
    starter: `REPORT zjuego.

`,
    expected: () => ["Suma: 15", "Producto: 50"],
    mustContain: [["CLASS\\s+lcl_calculadora\\s+DEFINITION", "Define la clase lcl_calculadora."], ["RETURNING", "Los métodos deben devolver el resultado con RETURNING."]],
    hint: "METHODS sumar IMPORTING iv_a TYPE i iv_b TYPE i RETURNING VALUE(rv) TYPE i. Después: DATA(lo) = NEW lcl_calculadora( ).",
    solution: `REPORT zjuego.

CLASS lcl_calculadora DEFINITION.
  PUBLIC SECTION.
    METHODS sumar IMPORTING iv_a TYPE i iv_b TYPE i RETURNING VALUE(rv) TYPE i.
    METHODS multiplicar IMPORTING iv_a TYPE i iv_b TYPE i RETURNING VALUE(rv) TYPE i.
ENDCLASS.

CLASS lcl_calculadora IMPLEMENTATION.
  METHOD sumar.
    rv = iv_a + iv_b.
  ENDMETHOD.
  METHOD multiplicar.
    rv = iv_a * iv_b.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_calc) = NEW lcl_calculadora( ).
  WRITE / |Suma: { lo_calc->sumar( iv_a = 10 iv_b = 5 ) }|.
  WRITE / |Producto: { lo_calc->multiplicar( iv_a = 10 iv_b = 5 ) }|.`,
  },
  {
    id: "h501",
    type: "code",
    guide: "p5",
    level: "Intermedio",
    title: "Hazlo tú: llamar a una BAPI",
    text: "Llama a la BAPI <code>BAPI_FLIGHT_GETLIST</code> para leer los vuelos de la aerolínea <code>IB</code>. Escribe <code>Vuelos: N</code> (cantidad de líneas de FLIGHT_LIST) y en otra línea el tipo y el texto del primer mensaje de RETURN, por ejemplo <code>S Se encontraron 6 vuelo(s)</code>.",
    starter: `REPORT zjuego.

DATA lt_vuelos TYPE STANDARD TABLE OF bapisfldat WITH DEFAULT KEY.
DATA lt_return TYPE STANDARD TABLE OF bapiret2 WITH DEFAULT KEY.

`,
    expected: (engine) => {
      const n = sql(engine, `SELECT COUNT(*) AS c FROM "sflight" WHERE "carrid" = 'IB '`)[0].c;
      return [`Vuelos: ${n}`, `S Se encontraron ${n} vuelo(s)`];
    },
    mustContain: [["CALL\\s+FUNCTION\\s+'BAPI_FLIGHT_GETLIST'", "Usa CALL FUNCTION 'BAPI_FLIGHT_GETLIST'."], ["TABLES", "Las tablas de la BAPI se pasan con TABLES."]],
    hint: "CALL FUNCTION 'BAPI_FLIGHT_GETLIST' EXPORTING airline = 'IB' TABLES flight_list = lt_vuelos return = lt_return. Luego READ TABLE lt_return INTO DATA(ls_ret) INDEX 1.",
    solution: `REPORT zjuego.

DATA lt_vuelos TYPE STANDARD TABLE OF bapisfldat WITH DEFAULT KEY.
DATA lt_return TYPE STANDARD TABLE OF bapiret2 WITH DEFAULT KEY.

CALL FUNCTION 'BAPI_FLIGHT_GETLIST'
  EXPORTING
    airline     = 'IB'
  TABLES
    flight_list = lt_vuelos
    return      = lt_return.

WRITE / |Vuelos: { lines( lt_vuelos ) }|.
READ TABLE lt_return INTO DATA(ls_ret) INDEX 1.
WRITE / |{ ls_ret-type } { ls_ret-message }|.`,
  },
  {
    id: "h502",
    type: "code",
    guide: "p5",
    level: "Intermedio",
    title: "Hazlo tú: FOR ALL ENTRIES",
    text: "Lee de <code>SPFLI</code> las conexiones que salen de <code>LIMA</code> (campo CITYFROM). Después, <b>con un solo SELECT</b> usando <code>FOR ALL ENTRIES</code>, lee de <code>SFLIGHT</code> todos los vuelos de esas conexiones. Escribe <code>Conexiones: X</code> y <code>Vuelos: Y</code>. Recuerda comprobar que la primera tabla no esté vacía antes del FOR ALL ENTRIES.",
    starter: `REPORT zjuego.

`,
    expected: (engine) => {
      const c = sql(engine, `SELECT COUNT(*) AS c FROM "spfli" WHERE "cityfrom" = 'LIMA'`)[0].c;
      const v = sql(engine, `SELECT COUNT(*) AS c FROM "sflight" f JOIN "spfli" p ON p."carrid" = f."carrid" AND p."connid" = f."connid" WHERE p."cityfrom" = 'LIMA'`)[0].c;
      return [`Conexiones: ${c}`, `Vuelos: ${v}`];
    },
    mustContain: [["FOR\\s+ALL\\s+ENTRIES\\s+IN", "Usa FOR ALL ENTRIES IN para la segunda lectura."], ["IS\\s+NOT\\s+INITIAL", "Comprueba que la tabla de conexiones no esté vacía (IF ... IS NOT INITIAL)."]],
    hint: "SELECT carrid, connid FROM spfli WHERE cityfrom = 'LIMA' INTO TABLE @DATA(lt_con). IF lt_con IS NOT INITIAL. SELECT ... FROM sflight FOR ALL ENTRIES IN @lt_con WHERE carrid = @lt_con-carrid AND connid = @lt_con-connid INTO TABLE @DATA(lt_vuelos). ENDIF.",
    solution: `REPORT zjuego.

SELECT carrid, connid FROM spfli
  WHERE cityfrom = 'LIMA'
  INTO TABLE @DATA(lt_con).

DATA lt_vuelos TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY.
IF lt_con IS NOT INITIAL.
  SELECT * FROM sflight
    FOR ALL ENTRIES IN @lt_con
    WHERE carrid = @lt_con-carrid
      AND connid = @lt_con-connid
    INTO TABLE @lt_vuelos.
ENDIF.

WRITE / |Conexiones: { lines( lt_con ) }|.
WRITE / |Vuelos: { lines( lt_vuelos ) }|.`,
  },
);

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

export const gameById = (id) => GAMES.find((g) => g.id === id);

export const MAX_POINTS = GAMES.reduce((a, g) => a + GAME_TYPES.find((t) => t.id === g.type).points, 0);
