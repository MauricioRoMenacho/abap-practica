CLASS cl_abap_unit_assert DEFINITION PUBLIC.
  PUBLIC SECTION.
    CLASS-METHODS assert_equals
      IMPORTING act              TYPE any
                exp              TYPE any
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
                tol              TYPE f OPTIONAL
                ignore_hash_sequence TYPE abap_bool DEFAULT abap_false
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_differs
      IMPORTING act              TYPE any
                exp              TYPE any
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_true
      IMPORTING act              TYPE abap_bool
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_false
      IMPORTING act              TYPE abap_bool
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_initial
      IMPORTING act              TYPE any
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_not_initial
      IMPORTING act              TYPE any
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_bound
      IMPORTING act              TYPE any
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_not_bound
      IMPORTING act              TYPE any
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_subrc
      IMPORTING exp              TYPE i DEFAULT 0
                act              TYPE i DEFAULT sy-subrc
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_char_cp
      IMPORTING act              TYPE clike
                exp              TYPE clike
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_number_between
      IMPORTING lower            TYPE numeric
                upper            TYPE numeric
                number           TYPE numeric
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS assert_table_contains
      IMPORTING line             TYPE any
                table            TYPE ANY TABLE
                msg              TYPE csequence OPTIONAL
                level            TYPE i DEFAULT 1
                quit             TYPE i DEFAULT 1
      RETURNING VALUE(assertion_failed) TYPE abap_bool.
    CLASS-METHODS fail
      IMPORTING msg    TYPE csequence OPTIONAL
                level  TYPE i DEFAULT 1
                quit   TYPE i DEFAULT 1
                detail TYPE csequence OPTIONAL.
    CLASS-METHODS abort
      IMPORTING msg    TYPE csequence OPTIONAL
                detail TYPE csequence OPTIONAL
                quit   TYPE i DEFAULT 1.
  PRIVATE SECTION.
    CLASS-METHODS raise
      IMPORTING msg      TYPE csequence
                deftext  TYPE string
                expected TYPE string OPTIONAL
                actual   TYPE string OPTIONAL.
    CLASS-METHODS to_string
      IMPORTING val        TYPE any
      RETURNING VALUE(str) TYPE string.
ENDCLASS.

CLASS cl_abap_unit_assert IMPLEMENTATION.
  METHOD raise.
    DATA lv_msg TYPE string.
    lv_msg = msg.
    IF lv_msg IS INITIAL.
      lv_msg = deftext.
    ENDIF.
    RAISE EXCEPTION TYPE cx_aunit_assert
      EXPORTING
        msg      = lv_msg
        expected = expected
        actual   = actual.
  ENDMETHOD.

  METHOD to_string.
    DATA lv_type TYPE c LENGTH 1.
    DESCRIBE FIELD val TYPE lv_type.
    CASE lv_type.
      WHEN 'u' OR 'v'.
        str = '[estructura]'.
        WRITE '@KERNEL { const v = val.get(); str.set("(" + Object.keys(v).map((k) => k.toUpperCase() + "=" + String(v[k].get ? v[k].get() : "?").trim()).join(", ") + ")"); }'.
      WHEN 'h'.
        WRITE '@KERNEL str.set("[tabla con " + val.getArrayLength() + " línea(s)]");'.
      WHEN 'r' OR 'l'.
        IF val IS BOUND.
          str = '[referencia]'.
        ELSE.
          str = '[referencia vacía]'.
        ENDIF.
      WHEN OTHERS.
        str = |{ val }|.
    ENDCASE.
  ENDMETHOD.

  METHOD assert_equals.
    DATA lv_diff TYPE f.
    IF tol IS NOT INITIAL.
      lv_diff = act - exp.
      IF abs( lv_diff ) <= tol.
        RETURN.
      ENDIF.
    ELSEIF act = exp.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'Los valores no son iguales' expected = to_string( exp ) actual = to_string( act ) ).
  ENDMETHOD.

  METHOD assert_differs.
    IF act <> exp.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'Los valores deberían ser distintos' expected = |distinto de { to_string( exp ) }| actual = to_string( act ) ).
  ENDMETHOD.

  METHOD assert_true.
    IF act = abap_true.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'Se esperaba verdadero (abap_true)' expected = 'X' actual = |'{ act }'| ).
  ENDMETHOD.

  METHOD assert_false.
    IF act = abap_false.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'Se esperaba falso (abap_false)' expected = |' '| actual = |'{ act }'| ).
  ENDMETHOD.

  METHOD assert_initial.
    IF act IS INITIAL.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'Se esperaba un valor inicial' expected = '(inicial)' actual = to_string( act ) ).
  ENDMETHOD.

  METHOD assert_not_initial.
    IF act IS NOT INITIAL.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'Se esperaba un valor no inicial' expected = '(no inicial)' actual = '(inicial)' ).
  ENDMETHOD.

  METHOD assert_bound.
    IF act IS BOUND.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'La referencia debería apuntar a un objeto' expected = '(BOUND)' actual = '(no BOUND)' ).
  ENDMETHOD.

  METHOD assert_not_bound.
    IF act IS NOT BOUND.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'La referencia debería estar vacía' expected = '(no BOUND)' actual = '(BOUND)' ).
  ENDMETHOD.

  METHOD assert_subrc.
    IF act = exp.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'sy-subrc inesperado' expected = |{ exp }| actual = |{ act }| ).
  ENDMETHOD.

  METHOD assert_char_cp.
    IF act CP exp.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'El texto no cumple el patrón' expected = |{ exp }| actual = |{ act }| ).
  ENDMETHOD.

  METHOD assert_number_between.
    IF number >= lower AND number <= upper.
      RETURN.
    ENDIF.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'El número está fuera del rango' expected = |entre { lower } y { upper }| actual = |{ number }| ).
  ENDMETHOD.

  METHOD assert_table_contains.
    LOOP AT table TRANSPORTING NO FIELDS WHERE table_line = line.
      RETURN.
    ENDLOOP.
    assertion_failed = abap_true.
    raise( msg = msg deftext = 'La tabla no contiene la línea' expected = to_string( line ) actual = to_string( table ) ).
  ENDMETHOD.

  METHOD fail.
    raise( msg = msg deftext = 'Fallo forzado (FAIL)' actual = |{ detail }| ).
  ENDMETHOD.

  METHOD abort.
    raise( msg = msg deftext = 'Prueba abortada (ABORT)' actual = |{ detail }| ).
  ENDMETHOD.
ENDCLASS.
