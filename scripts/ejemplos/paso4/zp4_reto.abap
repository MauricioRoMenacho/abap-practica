REPORT zp4_reto.

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
  lcl_reporte=>ejecutar( ).
