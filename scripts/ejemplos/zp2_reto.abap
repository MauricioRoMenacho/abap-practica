REPORT zp2_reto.

TYPES: BEGIN OF ty_vuelo,
         carrid    TYPE sflight-carrid,
         connid    TYPE sflight-connid,
         fldate    TYPE sflight-fldate,
         seatsmax  TYPE sflight-seatsmax,
         seatsocc  TYPE sflight-seatsocc,
         ocupacion TYPE p LENGTH 5 DECIMALS 1,
       END OF ty_vuelo.

DATA gt_vuelos TYPE STANDARD TABLE OF ty_vuelo WITH DEFAULT KEY.

PARAMETERS p_carr TYPE sflight-carrid DEFAULT 'LA'.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, seatsmax, seatsocc
    FROM sflight
    INTO CORRESPONDING FIELDS OF TABLE @gt_vuelos
    WHERE carrid = @p_carr.

  LOOP AT gt_vuelos ASSIGNING FIELD-SYMBOL(<ls_vuelo>).
    IF <ls_vuelo>-seatsmax > 0.
      <ls_vuelo>-ocupacion = <ls_vuelo>-seatsocc * 100 / <ls_vuelo>-seatsmax.
    ENDIF.
  ENDLOOP.

  SORT gt_vuelos BY ocupacion DESCENDING.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = gt_vuelos ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_columns( )->get_column( 'OCUPACION' )->set_long_text( 'Ocupación %' ).
      lo_alv->display( ).
    CATCH cx_salv_msg cx_salv_not_found INTO DATA(lx_error).
      MESSAGE lx_error->get_text( ) TYPE 'E'.
  ENDTRY.
