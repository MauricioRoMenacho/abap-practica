CLASS cl_salv_sorts DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mt_sorts TYPE STANDARD TABLE OF REF TO cl_salv_sort WITH DEFAULT KEY.
    METHODS add_sort
      IMPORTING columnname   TYPE csequence
                position     TYPE i OPTIONAL
                sequence     TYPE i DEFAULT if_salv_c_sort=>sort_up
                subtotal     TYPE abap_bool DEFAULT abap_false
      RETURNING VALUE(value) TYPE REF TO cl_salv_sort
      RAISING   cx_salv_not_found cx_salv_existing cx_salv_data_error.
ENDCLASS.
CLASS cl_salv_sorts IMPLEMENTATION.
  METHOD add_sort.
    CREATE OBJECT value.
    value->mv_name = to_upper( columnname ).
    value->mv_sequence = sequence.
    value->mv_subtotal = subtotal.
    APPEND value TO mt_sorts.
  ENDMETHOD.
ENDCLASS.
