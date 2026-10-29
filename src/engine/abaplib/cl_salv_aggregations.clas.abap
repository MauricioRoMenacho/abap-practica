CLASS cl_salv_aggregations DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mt_aggr TYPE STANDARD TABLE OF REF TO cl_salv_aggregation WITH DEFAULT KEY.
    METHODS add_aggregation
      IMPORTING columnname   TYPE csequence
                aggregation  TYPE i DEFAULT if_salv_c_aggregation=>total
      RETURNING VALUE(value) TYPE REF TO cl_salv_aggregation
      RAISING   cx_salv_not_found cx_salv_existing cx_salv_data_error.
ENDCLASS.
CLASS cl_salv_aggregations IMPLEMENTATION.
  METHOD add_aggregation.
    CREATE OBJECT value.
    value->mv_name = to_upper( columnname ).
    value->mv_type = aggregation.
    APPEND value TO mt_aggr.
  ENDMETHOD.
ENDCLASS.
