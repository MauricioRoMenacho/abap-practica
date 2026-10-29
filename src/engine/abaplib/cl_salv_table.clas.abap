CLASS cl_salv_table DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mr_table TYPE REF TO data.
    DATA mv_list_display TYPE abap_bool.
    DATA mo_functions TYPE REF TO cl_salv_functions_list.
    DATA mo_columns TYPE REF TO cl_salv_columns_table.
    DATA mo_display TYPE REF TO cl_salv_display_settings.
    DATA mo_sorts TYPE REF TO cl_salv_sorts.
    DATA mo_aggr TYPE REF TO cl_salv_aggregations.
    CLASS-METHODS factory
      IMPORTING list_display   TYPE abap_bool DEFAULT abap_false
                container_name TYPE string OPTIONAL
      EXPORTING r_salv_table   TYPE REF TO cl_salv_table
      CHANGING  t_table        TYPE ANY TABLE
      RAISING   cx_salv_msg.
    METHODS display.
    METHODS refresh.
    METHODS get_functions RETURNING VALUE(value) TYPE REF TO cl_salv_functions_list.
    METHODS get_columns RETURNING VALUE(value) TYPE REF TO cl_salv_columns_table.
    METHODS get_display_settings RETURNING VALUE(value) TYPE REF TO cl_salv_display_settings.
    METHODS get_sorts RETURNING VALUE(value) TYPE REF TO cl_salv_sorts.
    METHODS get_aggregations RETURNING VALUE(value) TYPE REF TO cl_salv_aggregations.
ENDCLASS.
CLASS cl_salv_table IMPLEMENTATION.
  METHOD factory.
    CREATE OBJECT r_salv_table.
    GET REFERENCE OF t_table INTO r_salv_table->mr_table.
    r_salv_table->mv_list_display = list_display.
    CREATE OBJECT r_salv_table->mo_functions.
    CREATE OBJECT r_salv_table->mo_columns.
    CREATE OBJECT r_salv_table->mo_display.
    CREATE OBJECT r_salv_table->mo_sorts.
    CREATE OBJECT r_salv_table->mo_aggr.
    WRITE '@KERNEL if (globalThis.__salvFactory) { globalThis.__salvFactory(r_salv_table.get()); }'.
  ENDMETHOD.
  METHOD display.
    WRITE '@KERNEL if (globalThis.__salvDisplay) { await globalThis.__salvDisplay(this); }'.
  ENDMETHOD.
  METHOD refresh.
    RETURN.
  ENDMETHOD.
  METHOD get_functions.
    value = mo_functions.
  ENDMETHOD.
  METHOD get_columns.
    value = mo_columns.
  ENDMETHOD.
  METHOD get_display_settings.
    value = mo_display.
  ENDMETHOD.
  METHOD get_sorts.
    value = mo_sorts.
  ENDMETHOD.
  METHOD get_aggregations.
    value = mo_aggr.
  ENDMETHOD.
ENDCLASS.
