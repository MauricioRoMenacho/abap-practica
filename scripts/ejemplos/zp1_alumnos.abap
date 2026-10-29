REPORT zp1_alumnos.

TABLES zalumnos.
SELECT-OPTIONS s_id FOR zalumnos-id.
PARAMETERS p_min TYPE i DEFAULT 0.

DATA lt_alumnos TYPE STANDARD TABLE OF zalumnos WITH DEFAULT KEY.

START-OF-SELECTION.
  SELECT * FROM zalumnos
    INTO TABLE @lt_alumnos
    WHERE id   IN @s_id
      AND nota >= @p_min
    ORDER BY id.

  IF sy-subrc <> 0.
    MESSAGE 'No se encontraron alumnos' TYPE 'S' DISPLAY LIKE 'E'.
    RETURN.
  ENDIF.

  WRITE: / 'Alumnos encontrados:', lines( lt_alumnos ).
  ULINE.
  LOOP AT lt_alumnos INTO DATA(ls_alumno).
    WRITE: / ls_alumno-id, ls_alumno-nombre, ls_alumno-nota.
  ENDLOOP.
