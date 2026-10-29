REPORT zp3_totales.

TYPES: BEGIN OF ty_total,
         kunnr TYPE kna1-kunnr,
         name1 TYPE kna1-name1,
         netwr TYPE vbak-netwr,
         waerk TYPE vbak-waerk,
       END OF ty_total.

DATA: lt_totales  TYPE STANDARD TABLE OF ty_total WITH DEFAULT KEY,
      lt_clientes TYPE HASHED TABLE OF kna1 WITH UNIQUE KEY kunnr,
      ls_total    TYPE ty_total.

START-OF-SELECTION.
  SELECT * FROM vbak INTO TABLE @DATA(lt_pedidos).
  SELECT * FROM kna1 INTO TABLE @lt_clientes.

  LOOP AT lt_pedidos INTO DATA(ls_pedido).
    CLEAR ls_total.
    ls_total-kunnr = ls_pedido-kunnr.
    ls_total-netwr = ls_pedido-netwr.
    ls_total-waerk = ls_pedido-waerk.
    " Leer el cliente en la tabla HASHED (búsqueda directa por clave)
    READ TABLE lt_clientes INTO DATA(ls_cliente) WITH TABLE KEY kunnr = ls_pedido-kunnr.
    IF sy-subrc = 0.
      ls_total-name1 = ls_cliente-name1.
    ENDIF.
    " COLLECT suma los campos numéricos de las líneas con la misma clave
    COLLECT ls_total INTO lt_totales.
  ENDLOOP.

  SORT lt_totales BY netwr DESCENDING.

  TRY.
      cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                              CHANGING  t_table      = lt_totales ).
      lo_alv->get_functions( )->set_all( abap_true ).
      lo_alv->get_columns( )->set_optimize( abap_true ).
      lo_alv->get_display_settings( )->set_list_header( 'Ventas totales por cliente' ).
      lo_alv->display( ).
    CATCH cx_salv_msg INTO DATA(lx_msg).
      MESSAGE lx_msg->get_text( ) TYPE 'E'.
  ENDTRY.
