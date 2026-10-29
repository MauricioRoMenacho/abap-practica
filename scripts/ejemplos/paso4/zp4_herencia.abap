REPORT zp4_herencia.

CLASS lcl_empleado DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING iv_nombre TYPE string
                                  iv_sueldo TYPE p.
    METHODS calcular_pago RETURNING VALUE(rv_pago) TYPE p.
    METHODS mostrar.
  PROTECTED SECTION.
    DATA mv_nombre TYPE string.
    DATA mv_sueldo TYPE p LENGTH 10 DECIMALS 2.
ENDCLASS.

CLASS lcl_empleado IMPLEMENTATION.
  METHOD constructor.
    mv_nombre = iv_nombre.
    mv_sueldo = iv_sueldo.
  ENDMETHOD.

  METHOD calcular_pago.
    rv_pago = mv_sueldo.
  ENDMETHOD.

  METHOD mostrar.
    DATA lv_pago TYPE p LENGTH 10 DECIMALS 2.
    lv_pago = calcular_pago( ).
    WRITE: / mv_nombre, 'paga:', lv_pago.
  ENDMETHOD.
ENDCLASS.

" El jefe ES UN empleado, pero cobra un bono del 20%
CLASS lcl_jefe DEFINITION INHERITING FROM lcl_empleado.
  PUBLIC SECTION.
    METHODS calcular_pago REDEFINITION.
ENDCLASS.

CLASS lcl_jefe IMPLEMENTATION.
  METHOD calcular_pago.
    rv_pago = super->calcular_pago( ) * '1.20'.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  " Datos reales: empleados vigentes de la sociedad 1000
  SELECT p1~ename, p1~stltx, p8~bet01
    FROM pa0001 AS p1
    INNER JOIN pa0008 AS p8 ON p8~pernr = p1~pernr
    WHERE p1~bukrs = '1000'
      AND p8~endda = '99991231'
    INTO TABLE @DATA(lt_datos).

  DATA lt_empleados TYPE STANDARD TABLE OF REF TO lcl_empleado WITH EMPTY KEY.
  DATA lo_empleado  TYPE REF TO lcl_empleado.

  LOOP AT lt_datos INTO DATA(ls_dato).
    DATA(lv_nombre) = CONV string( ls_dato-ename ).
    IF ls_dato-stltx CS 'Gerente' OR ls_dato-stltx CS 'Jefe'.
      lo_empleado = NEW lcl_jefe( iv_nombre = lv_nombre iv_sueldo = ls_dato-bet01 ).
    ELSE.
      lo_empleado = NEW lcl_empleado( iv_nombre = lv_nombre iv_sueldo = ls_dato-bet01 ).
    ENDIF.
    APPEND lo_empleado TO lt_empleados.
  ENDLOOP.

  " Polimorfismo: la misma llamada se comporta distinto según la clase real
  LOOP AT lt_empleados INTO lo_empleado.
    lo_empleado->mostrar( ).
  ENDLOOP.
