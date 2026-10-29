REPORT zp1_parametros.

PARAMETERS: p_nombre TYPE c LENGTH 30 LOWER CASE OBLIGATORY,
            p_num1   TYPE i DEFAULT 10,
            p_num2   TYPE i DEFAULT 5,
            p_suma   RADIOBUTTON GROUP op DEFAULT 'X',
            p_resta  RADIOBUTTON GROUP op,
            p_mayus  AS CHECKBOX.

DATA lv_resultado TYPE i.

START-OF-SELECTION.
  IF p_suma = abap_true.
    lv_resultado = p_num1 + p_num2.
  ELSE.
    lv_resultado = p_num1 - p_num2.
  ENDIF.

  IF p_mayus = abap_true.
    TRANSLATE p_nombre TO UPPER CASE.
  ENDIF.

  WRITE: / 'Hola', p_nombre,
         / 'Resultado:', lv_resultado.
