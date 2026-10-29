INTERFACE if_abap_unit_constant PUBLIC.
  CONSTANTS:
    BEGIN OF severity,
      low               TYPE i VALUE 0,
      medium            TYPE i VALUE 1,
      high              TYPE i VALUE 2,
    END OF severity.
  CONSTANTS:
    BEGIN OF quit,
      test   TYPE i VALUE 1,
      no     TYPE i VALUE 5,
    END OF quit.
ENDINTERFACE.