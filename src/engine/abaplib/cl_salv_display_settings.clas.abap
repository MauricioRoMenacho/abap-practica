CLASS cl_salv_display_settings DEFINITION PUBLIC CREATE PUBLIC.
  PUBLIC SECTION.
    DATA mv_header TYPE string.
    DATA mv_striped TYPE abap_bool.
    METHODS set_list_header IMPORTING value TYPE csequence.
    METHODS set_striped_pattern IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS set_horizontal_lines IMPORTING value TYPE abap_bool DEFAULT abap_true.
    METHODS set_vertical_lines IMPORTING value TYPE abap_bool DEFAULT abap_true.
ENDCLASS.
CLASS cl_salv_display_settings IMPLEMENTATION.
  METHOD set_list_header.
    mv_header = value.
  ENDMETHOD.
  METHOD set_striped_pattern.
    mv_striped = value.
  ENDMETHOD.
  METHOD set_horizontal_lines.
    RETURN.
  ENDMETHOD.
  METHOD set_vertical_lines.
    RETURN.
  ENDMETHOD.
ENDCLASS.
