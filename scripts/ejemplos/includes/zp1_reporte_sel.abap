*&---------------------------------------------------------------------*
*& Include ZP1_REPORTE_SEL - Pantalla de selección
*&---------------------------------------------------------------------*
SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME.
  SELECT-OPTIONS s_carr FOR scarr-carrid.
SELECTION-SCREEN END OF BLOCK b1.
