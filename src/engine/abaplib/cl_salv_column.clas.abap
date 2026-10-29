CLASS cl_salv_column DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mv_name TYPE string.
    DATA mv_long TYPE string.
    DATA mv_medium TYPE string.
    DATA mv_short TYPE string.
    DATA mv_hidden TYPE abap_bool.
    DATA mv_outlen TYPE i.
    METHODS set_long_text IMPORTING value TYPE csequence.
    METHODS set_medium_text IMPORTING value TYPE csequence.
    METHODS set_short_text IMPORTING value TYPE csequence.
    METHODS set_visible IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS set_technical IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS set_output_length IMPORTING value TYPE i.
    METHODS get_columnname RETURNING VALUE(value) TYPE string.
ENDCLASS.
CLASS cl_salv_column IMPLEMENTATION.
  METHOD set_long_text.
    mv_long = value.
  ENDMETHOD.
  METHOD set_medium_text.
    mv_medium = value.
  ENDMETHOD.
  METHOD set_short_text.
    mv_short = value.
  ENDMETHOD.
  METHOD set_visible.
    IF value = abap_true.
      mv_hidden = abap_false.
    ELSE.
      mv_hidden = abap_true.
    ENDIF.
  ENDMETHOD.
  METHOD set_technical.
    mv_hidden = value.
  ENDMETHOD.
  METHOD set_output_length.
    mv_outlen = value.
  ENDMETHOD.
  METHOD get_columnname.
    value = mv_name.
  ENDMETHOD.
ENDCLASS.
