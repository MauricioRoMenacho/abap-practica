CLASS cl_salv_columns_table DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mv_optimize TYPE abap_bool.
    DATA mt_columns TYPE STANDARD TABLE OF REF TO cl_salv_column_table WITH DEFAULT KEY.
    METHODS set_optimize IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS get_column
      IMPORTING columnname   TYPE csequence
      RETURNING VALUE(value) TYPE REF TO cl_salv_column
      RAISING   cx_salv_not_found.
ENDCLASS.
CLASS cl_salv_columns_table IMPLEMENTATION.
  METHOD set_optimize.
    mv_optimize = value.
  ENDMETHOD.
  METHOD get_column.
    DATA lo_col TYPE REF TO cl_salv_column_table.
    DATA lv_name TYPE string.
    lv_name = to_upper( columnname ).
    LOOP AT mt_columns INTO lo_col.
      IF lo_col->mv_name = lv_name.
        value = lo_col.
        RETURN.
      ENDIF.
    ENDLOOP.
    WRITE '@KERNEL if (globalThis.__salvHasColumn && !globalThis.__salvHasColumn(this, lv_name.get())) { throw await (new abap.Classes["CX_SALV_NOT_FOUND"]()).constructor_(); }'.
    CREATE OBJECT lo_col.
    lo_col->mv_name = lv_name.
    APPEND lo_col TO mt_columns.
    value = lo_col.
  ENDMETHOD.
ENDCLASS.
