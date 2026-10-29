INTERFACE if_aunit_constants PUBLIC.
  CONSTANTS no        TYPE i VALUE 0.
  CONSTANTS critical  TYPE i VALUE 1.
  CONSTANTS fatal     TYPE i VALUE 1.
  CONSTANTS tolerable TYPE i VALUE 1.
  CONSTANTS method    TYPE i VALUE 1.
  CONSTANTS class     TYPE i VALUE 2.

  CONSTANTS: BEGIN OF severity,
               low    TYPE i VALUE 0,
               medium TYPE i VALUE 1,
               high   TYPE i VALUE 2,
             END OF severity.

  CONSTANTS: BEGIN OF quit,
               no   TYPE i VALUE 0,
               test TYPE i VALUE 1,
             END OF quit.
ENDINTERFACE.