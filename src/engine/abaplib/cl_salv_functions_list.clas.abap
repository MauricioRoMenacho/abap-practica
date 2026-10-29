CLASS cl_salv_functions_list DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mv_all TYPE abap_bool.
    DATA mv_default TYPE abap_bool.
    METHODS set_all IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS set_default IMPORTING value TYPE abap_bool DEFAULT abap_true.
ENDCLASS.
CLASS cl_salv_functions_list IMPLEMENTATION.
  METHOD set_all.
    mv_all = value.
  ENDMETHOD.
  METHOD set_default.
    mv_default = value.
  ENDMETHOD.
ENDCLASS.
