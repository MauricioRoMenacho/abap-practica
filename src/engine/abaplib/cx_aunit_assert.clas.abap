CLASS cx_aunit_assert DEFINITION PUBLIC INHERITING FROM cx_dynamic_check.
  PUBLIC SECTION.
    DATA msg TYPE string.
    DATA expected TYPE string.
    DATA actual TYPE string.
    METHODS constructor
      IMPORTING msg      TYPE string OPTIONAL
                expected TYPE string OPTIONAL
                actual   TYPE string OPTIONAL
                previous LIKE previous OPTIONAL.
    METHODS if_message~get_text REDEFINITION.
ENDCLASS.

CLASS cx_aunit_assert IMPLEMENTATION.
  METHOD constructor.
    super->constructor( previous = previous ).
    me->msg = msg.
    me->expected = expected.
    me->actual = actual.
  ENDMETHOD.

  METHOD if_message~get_text.
    result = msg.
  ENDMETHOD.
ENDCLASS.
