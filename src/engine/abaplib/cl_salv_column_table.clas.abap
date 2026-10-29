CLASS cl_salv_column_table DEFINITION PUBLIC INHERITING FROM cl_salv_column CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mv_key TYPE abap_bool.
    METHODS set_key IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS set_optimized IMPORTING value TYPE abap_bool DEFAULT abap_true.
ENDCLASS.
CLASS cl_salv_column_table IMPLEMENTATION.
  METHOD set_key.
    mv_key = value.
  ENDMETHOD.
  METHOD set_optimized.
    RETURN.
  ENDMETHOD.
ENDCLASS.
