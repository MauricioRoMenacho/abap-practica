CLASS cl_salv_sort DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mv_name TYPE string.
    DATA mv_sequence TYPE i.
    DATA mv_subtotal TYPE abap_bool.
    METHODS set_subtotal IMPORTING value TYPE abap_bool DEFAULT abap_true.
ENDCLASS.
CLASS cl_salv_sort IMPLEMENTATION.
  METHOD set_subtotal.
    mv_subtotal = value.
  ENDMETHOD.
ENDCLASS.
