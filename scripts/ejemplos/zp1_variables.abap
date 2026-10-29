REPORT zp1_variables.

DATA: lv_nombre   TYPE string VALUE 'Ana',
      lv_edad     TYPE i VALUE 25,
      lv_precio   TYPE p LENGTH 8 DECIMALS 2 VALUE '19.90',
      lv_cantidad TYPE i VALUE 3,
      lv_total    TYPE p LENGTH 10 DECIMALS 2.

lv_total = lv_precio * lv_cantidad.

WRITE: / 'Nombre:', lv_nombre,
       / 'Edad:', lv_edad,
       / 'Total a pagar:', lv_total.

" Declaración en línea y string templates (ABAP moderno)
DATA(lv_saludo) = |Hola { lv_nombre }, tienes { lv_edad } años|.
WRITE / lv_saludo.

IF lv_edad >= 18.
  WRITE / 'Es mayor de edad'.
ELSE.
  WRITE / 'Es menor de edad'.
ENDIF.

DO 3 TIMES.
  WRITE: / 'Vuelta número', sy-index.
ENDDO.
