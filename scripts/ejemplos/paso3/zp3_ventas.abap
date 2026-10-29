REPORT zp3_ventas.

PARAMETERS p_bukrs TYPE vbak-bukrs_vf DEFAULT '1000'.

START-OF-SELECTION.
  " Pedidos de venta con el nombre del cliente (JOIN de 2 tablas)
  SELECT a~vbeln, a~erdat, a~kunnr, k~name1, a~netwr, a~waerk
    FROM vbak AS a
    INNER JOIN kna1 AS k ON k~kunnr = a~kunnr
    WHERE a~bukrs_vf = @p_bukrs
    ORDER BY a~vbeln
    INTO TABLE @DATA(lt_pedidos).

  WRITE: / 'Pedidos de la sociedad', p_bukrs, ':', lines( lt_pedidos ).
  ULINE.
  LOOP AT lt_pedidos INTO DATA(ls_pedido).
    WRITE: / ls_pedido-vbeln, ls_pedido-erdat, ls_pedido-name1(25), ls_pedido-netwr, ls_pedido-waerk.
  ENDLOOP.
