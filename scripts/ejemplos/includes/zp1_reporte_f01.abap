*&---------------------------------------------------------------------*
*& Include ZP1_REPORTE_F01 - Subrutinas
*&---------------------------------------------------------------------*
FORM obtener_datos.
  SELECT carrid, carrname, currcode
    FROM scarr
    INTO TABLE @gt_aerolineas
    WHERE carrid IN @s_carr
    ORDER BY carrid.
ENDFORM.

FORM mostrar_datos.
  WRITE: / 'Aerolíneas encontradas:', lines( gt_aerolineas ).
  ULINE.
  LOOP AT gt_aerolineas INTO DATA(ls_aerolinea).
    WRITE: / ls_aerolinea-carrid, ls_aerolinea-carrname, ls_aerolinea-currcode.
  ENDLOOP.
ENDFORM.
