REPORT zp4_excepciones.

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
  ENDTRY.
