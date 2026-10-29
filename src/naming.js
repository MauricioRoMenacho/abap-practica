// Convenciones de nombres en ABAP: qué significa cada prefijo y por qué se usan.
export const NAMING_WHY = [
  "ABAP no obliga a usar prefijos: <code>DATA total TYPE i.</code> funciona igual que <code>DATA lv_total TYPE i.</code>. Los prefijos son una <b>convención</b> que casi todas las empresas exigen en sus guías de desarrollo (y que el ATC puede revisar). Se usan por tres motivos:",
  "<b>1. Saber de un vistazo qué es cada cosa.</b> En un programa de 2.000 líneas, al leer <code>ls_cliente-name</code> sabes que es una <b>estructura</b> (una fila) y no una tabla; con <code>lt_clientes</code> sabes que es una <b>tabla</b> y que hay que recorrerla con LOOP. Sin prefijo tendrías que buscar dónde se declaró.",
  "<b>2. Saber dónde vive la variable (su alcance).</b> <code>gv_</code> es global (visible en todo el programa y cualquiera la puede cambiar), <code>lv_</code> es local (solo existe dentro de su método o FORM). Si ves <code>gv_total</code> dentro de un método sabes que está tocando algo compartido, que es una fuente típica de errores.",
  "<b>3. Saber el sentido de un parámetro.</b> En métodos y funciones, <code>iv_</code> es un dato que <b>entra</b> (importing), <code>ev_</code> uno que <b>sale</b> (exporting), <code>cv_</code> uno que entra y se modifica (changing) y <code>rv_</code> el valor que se devuelve (returning). Al leer la llamada sabes qué se lee y qué se modifica.",
  "Además evitan choques con palabras reservadas y con nombres de campos de tablas (una variable <code>matnr</code> se confunde con el campo MARA-MATNR; <code>lv_matnr</code> no).",
];

// [prefijo, significado, ejemplo, por qué]
export const NAMING = [
  ["Alcance (la primera letra)", "", "", ""],
  ["l", "Local: dentro de un método, FORM o función", "lv_total", "Solo existe mientras se ejecuta ese bloque."],
  ["g", "Global: declarada a nivel de programa", "gv_total, gt_vuelos", "Visible en todo el programa; úsala lo menos posible."],
  ["m", "Atributo de instancia de una clase (member)", "mv_saldo, mo_log", "Pertenece al objeto: cada objeto tiene su propio valor."],
  ["g / s (en clases)", "Atributo estático de una clase (CLASS-DATA)", "gv_contador o sv_contador", "Es compartido por todos los objetos de la clase."],
  ["i / e / c / r", "Parámetro importing / exporting / changing / returning", "iv_carrid, ev_precio, cv_total, rv_libres", "Indica si el dato entra, sale, entra y se modifica, o se devuelve."],
  ["Tipo de dato (la segunda letra)", "", "", ""],
  ["v", "Variable simple (value): número, texto, fecha", "lv_nombre", "Contiene un único valor."],
  ["s", "Estructura (structure): una fila con campos", "ls_cliente", "Se accede a sus campos con guion: ls_cliente-name."],
  ["t", "Tabla interna (table)", "lt_vuelos", "Tiene varias filas: se recorre con LOOP y se lee con READ TABLE."],
  ["o", "Referencia a un objeto (object)", "lo_cuenta = NEW lcl_cuenta( )", "Se usa con -> para llamar a sus métodos."],
  ["r", "Referencia a datos (reference)", "lr_dato TYPE REF TO data", "Apunta a una variable; se desreferencia con ->*."],
  ["x", "Referencia a una excepción", "lx_error TYPE REF TO cx_root", "Se usa en CATCH ... INTO lx_error."],
  ["c (constante)", "Constante", "lc_iva TYPE p VALUE '0.18', gc_max", "Valor fijo que no cambia; evita números mágicos en el código."],
  ["Otros elementos", "", "", ""],
  ["<fs_...> / <ls_...>", "Field-symbol", "<ls_vuelo>", "Puntero a una línea o campo; los símbolos < > son obligatorios."],
  ["ty_ / tt_", "Tipo propio (TYPES) / tipo tabla", "ty_alumno, tt_alumnos", "Distingue tipos de variables: un tipo no guarda datos."],
  ["p_", "Parámetro de pantalla de selección (PARAMETERS)", "p_carrid", "Se reconoce como entrada del usuario."],
  ["s_", "Rango de selección (SELECT-OPTIONS)", "s_fldate", "Se usa con IN en el WHERE: fldate IN @s_fldate."],
  ["lcl_ / lif_ / ltc_", "Clase local / interfaz local / clase de prueba local", "lcl_reporte, ltc_reporte", "Solo existen dentro del programa."],
  ["zcl_ / zif_ / zcx_", "Clase / interfaz / excepción global (SE24)", "zcl_vuelos, zcx_reservas", "Objetos del repositorio del cliente (Z o Y)."],
  ["Z o Y (al inicio)", "Objeto del cliente", "ZP1_HOLA, ZALUMNOS", "Las actualizaciones de SAP nunca sobrescriben objetos Z/Y."],
];

export function namingTerms() {
  return NAMING.filter((r) => r[1]).map(([p, m, ej, why]) => [p, `${m}. Ej.: <code>${ej}</code>. ${why}`]);
}
