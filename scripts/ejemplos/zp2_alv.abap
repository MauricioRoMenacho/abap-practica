REPORT zp2_alv.

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

  go_alv->display( ).
