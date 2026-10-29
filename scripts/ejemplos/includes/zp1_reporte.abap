*&---------------------------------------------------------------------*
*& Report ZP1_REPORTE
*&---------------------------------------------------------------------*
REPORT zp1_reporte.

INCLUDE zp1_reporte_top.   " Declaraciones globales
INCLUDE zp1_reporte_sel.   " Pantalla de selección

START-OF-SELECTION.
  PERFORM obtener_datos.
  PERFORM mostrar_datos.

INCLUDE zp1_reporte_f01.   " Subrutinas (FORM)
