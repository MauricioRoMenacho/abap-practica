REPORT zp3_moderno.

SELECT * FROM sflight INTO TABLE @DATA(lt_vuelos).

" REDUCE: sumar en una sola expresión
DATA(lv_total) = REDUCE i( INIT s = 0 FOR v IN lt_vuelos NEXT s = s + v-seatsocc ).
WRITE: / 'Pasajeros totales:', lv_total.

" FOR + VALUE: construir una tabla nueva a partir de otra
TYPES tt_aerolineas TYPE STANDARD TABLE OF sflight-carrid WITH EMPTY KEY.
DATA(lt_llenos) = VALUE tt_aerolineas( FOR v IN lt_vuelos WHERE ( seatsocc > 400 ) ( v-carrid ) ).
WRITE: / 'Vuelos con más de 400 pasajeros:', lines( lt_llenos ).

" Tabla SORTED + FILTER: quedarse solo con una aerolínea
DATA lt_ordenados TYPE SORTED TABLE OF sflight WITH NON-UNIQUE KEY carrid.
lt_ordenados = lt_vuelos.
DATA(lt_latam) = FILTER #( lt_ordenados WHERE carrid = CONV #( 'LA' ) ).
WRITE: / 'Vuelos de LATAM:', lines( lt_latam ).

" COND: elegir un valor según una condición
LOOP AT lt_latam INTO DATA(ls_vuelo).
  DATA(lv_estado) = COND string( WHEN ls_vuelo-seatsocc >= ls_vuelo-seatsmax * 9 / 10 THEN 'Casi lleno'
                                 ELSE 'Con espacio' ).
  WRITE: / ls_vuelo-connid, ls_vuelo-fldate, lv_estado.
ENDLOOP.
