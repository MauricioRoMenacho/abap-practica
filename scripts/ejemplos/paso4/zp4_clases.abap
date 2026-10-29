REPORT zp4_clases.

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
  CREATE OBJECT lo_cuenta1 EXPORTING iv_titular = `Ana Torres` iv_saldo = lv_monto.

  " Forma moderna: NEW
  DATA(lo_cuenta2) = NEW lcl_cuenta( iv_titular = `Luis Rojas` ).

  lv_monto = '250.50'.
  lo_cuenta1->depositar( lv_monto ).
  lv_monto = '1000.00'.
  lo_cuenta2->depositar( iv_monto = lv_monto ).

  lo_cuenta1->mostrar( ).
  lo_cuenta2->mostrar( ).

  DATA lv_total TYPE ty_monto.
  lv_total = lo_cuenta1->get_saldo( ) + lo_cuenta2->get_saldo( ).
  WRITE: / 'Saldo total del banco:', lv_total.
