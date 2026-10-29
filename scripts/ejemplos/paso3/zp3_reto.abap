REPORT zp3_reto.

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
  ENDTRY.
