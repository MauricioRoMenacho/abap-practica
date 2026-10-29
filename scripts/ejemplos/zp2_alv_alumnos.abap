REPORT zp2_alv_alumnos.

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
  ENDTRY.