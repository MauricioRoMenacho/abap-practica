*&---------------------------------------------------------------------*
*& Include ZP1_REPORTE_TOP - Declaraciones globales
*&---------------------------------------------------------------------*
TABLES scarr.

TYPES: BEGIN OF ty_aerolinea,
         carrid   TYPE scarr-carrid,
         carrname TYPE scarr-carrname,
         currcode TYPE scarr-currcode,
       END OF ty_aerolinea.

DATA gt_aerolineas TYPE STANDARD TABLE OF ty_aerolinea WITH DEFAULT KEY.
