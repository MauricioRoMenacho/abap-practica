REPORT zp4_interfaces.

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
    rv_nombre = `Rectángulo`.
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
    rv_nombre = `Círculo`.
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

  WRITE: / 'Círculos creados:', lcl_circulo=>gv_creados.
