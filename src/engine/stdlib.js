// "Biblioteca estándar" de módulos de función del simulador: conversiones,
// popups, BAPIs del modelo de vuelos, archivos y bloqueos.
import { fugrFiles } from "./fugr.js";
import { tableToXml } from "./ddic.js";

const S = (name, description, fields) => ({ name, description, tabclass: "INTTAB", fields: fields.map(([n, type, length, decimals = 0, description = n]) => ({ name: n, type, length, decimals, description })) });

export const STD_STRUCTURES = [
  S("BAPIRET2", "Parámetro de retorno", [
    ["TYPE", "CHAR", 1, 0, "Tipo de mensaje (S, E, W, I, A)"],
    ["ID", "CHAR", 20, 0, "Clase de mensajes"],
    ["NUMBER", "NUMC", 3, 0, "Número de mensaje"],
    ["MESSAGE", "CHAR", 220, 0, "Texto del mensaje"],
    ["MESSAGE_V1", "CHAR", 50],
    ["MESSAGE_V2", "CHAR", 50],
    ["MESSAGE_V3", "CHAR", 50],
    ["MESSAGE_V4", "CHAR", 50],
  ]),
  S("BAPISFLDAT", "Datos de vuelo (BAPI)", [
    ["AIRLINEID", "CHAR", 3, 0, "Compañía aérea"],
    ["AIRLINE", "CHAR", 20, 0, "Nombre aerolínea"],
    ["CONNECTID", "NUMC", 4, 0, "Nº conexión"],
    ["FLIGHTDATE", "DATS", 8, 0, "Fecha de vuelo"],
    ["AIRPORTFR", "CHAR", 3, 0, "Aeropuerto origen"],
    ["CITYFROM", "CHAR", 20, 0, "Ciudad origen"],
    ["AIRPORTTO", "CHAR", 3, 0, "Aeropuerto destino"],
    ["CITYTO", "CHAR", 20, 0, "Ciudad destino"],
    ["DEPTIME", "TIMS", 6, 0, "Hora salida"],
    ["ARRTIME", "TIMS", 6, 0, "Hora llegada"],
    ["PRICE", "CURR", 15, 2, "Precio"],
    ["CURR", "CUKY", 5, 0, "Moneda"],
  ]),
  S("BAPISFLAVA", "Disponibilidad de plazas (BAPI)", [
    ["ECONOMAX", "INT4", 10, 0, "Capacidad"],
    ["ECONOFREE", "INT4", 10, 0, "Plazas libres"],
  ]),
  S("FILE_TABLE", "Archivo seleccionado", [["FILENAME", "CHAR", 255, 0, "Nombre del archivo"]]),
];

const RET = `  APPEND VALUE #( type = lv_type id = 'BC_IBF' number = lv_number message = lv_message ) TO return.`;

export const STD_FUGR = {
  name: "SIMSTD",
  description: "Funciones estándar del simulador",
  top: "",
  modules: [
    {
      name: "CONVERSION_EXIT_ALPHA_INPUT",
      description: "Completa con ceros a la izquierda",
      params: { import: [{ name: "INPUT", type: "CLIKE", byValue: true }], export: [{ name: "OUTPUT", type: "CLIKE", byValue: true }] },
      body: `  DATA lv_len TYPE i.
  DATA lv_tmp TYPE string.
  IF input CN |0123456789 |.
    output = input.
    RETURN.
  ENDIF.
  lv_tmp = input.
  CONDENSE lv_tmp.
  DESCRIBE FIELD output LENGTH lv_len IN CHARACTER MODE.
  IF lv_tmp IS INITIAL.
    CLEAR output.
    RETURN.
  ENDIF.
  IF strlen( lv_tmp ) < lv_len.
    lv_tmp = repeat( val = '0' occ = lv_len - strlen( lv_tmp ) ) && lv_tmp.
  ENDIF.
  output = lv_tmp.`,
    },
    {
      name: "CONVERSION_EXIT_ALPHA_OUTPUT",
      description: "Quita los ceros a la izquierda",
      params: { import: [{ name: "INPUT", type: "CLIKE", byValue: true }], export: [{ name: "OUTPUT", type: "CLIKE", byValue: true }] },
      body: `  DATA lv_tmp TYPE string.
  lv_tmp = input.
  IF lv_tmp CO '0123456789 '.
    SHIFT lv_tmp LEFT DELETING LEADING '0'.
  ENDIF.
  output = lv_tmp.`,
    },
    {
      name: "POPUP_TO_CONFIRM",
      description: "Ventana de confirmación con dos botones",
      params: {
        import: [
          { name: "TITLEBAR", type: "CLIKE", optional: true, byValue: true },
          { name: "TEXT_QUESTION", type: "CLIKE", byValue: true },
          { name: "TEXT_BUTTON_1", type: "CLIKE", optional: true, byValue: true },
          { name: "TEXT_BUTTON_2", type: "CLIKE", optional: true, byValue: true },
          { name: "DISPLAY_CANCEL_BUTTON", type: "CLIKE", optional: true, byValue: true },
        ],
        export: [{ name: "ANSWER", type: "CLIKE", byValue: true }],
      },
      body: `  WRITE '@KERNEL answer.set(await globalThis.__abapPopupConfirm({titlebar: titlebar?.get?.() || "", text: text_question?.get?.() || "", b1: text_button_1?.get?.() || "", b2: text_button_2?.get?.() || "", cancel: display_cancel_button ? display_cancel_button.get() : "X"}));'.`,
    },
    {
      name: "BAPI_FLIGHT_GETLIST",
      description: "BAPI: lista de vuelos",
      params: {
        import: [
          { name: "AIRLINE", type: "SFLIGHT-CARRID", optional: true, byValue: true },
          { name: "CITYFROM", type: "SPFLI-CITYFROM", optional: true, byValue: true },
          { name: "CITYTO", type: "SPFLI-CITYTO", optional: true, byValue: true },
          { name: "MAX_ROWS", type: "I", optional: true, byValue: true },
        ],
        tables: [
          { name: "FLIGHT_LIST", type: "BAPISFLDAT", optional: true },
          { name: "RETURN", type: "BAPIRET2", optional: true },
        ],
      },
      body: `  DATA lv_type TYPE c LENGTH 1.
  DATA lv_number TYPE n LENGTH 3.
  DATA lv_message TYPE c LENGTH 220.
  CLEAR flight_list[].
  SELECT f~carrid, c~carrname, f~connid, f~fldate, p~airpfrom, p~cityfrom,
         p~airpto, p~cityto, p~deptime, p~arrtime, f~price, f~currency
    FROM sflight AS f
    INNER JOIN spfli AS p ON p~carrid = f~carrid AND p~connid = f~connid
    INNER JOIN scarr AS c ON c~carrid = f~carrid
    ORDER BY f~carrid, f~connid, f~fldate
    INTO TABLE @DATA(lt_vuelos).
  LOOP AT lt_vuelos INTO DATA(ls_vuelo).
    IF airline IS NOT INITIAL AND ls_vuelo-carrid <> airline.
      CONTINUE.
    ENDIF.
    IF cityfrom IS NOT INITIAL AND ls_vuelo-cityfrom <> cityfrom.
      CONTINUE.
    ENDIF.
    IF cityto IS NOT INITIAL AND ls_vuelo-cityto <> cityto.
      CONTINUE.
    ENDIF.
    APPEND VALUE #( airlineid = ls_vuelo-carrid airline = ls_vuelo-carrname connectid = ls_vuelo-connid
                    flightdate = ls_vuelo-fldate airportfr = ls_vuelo-airpfrom cityfrom = ls_vuelo-cityfrom
                    airportto = ls_vuelo-airpto cityto = ls_vuelo-cityto deptime = ls_vuelo-deptime
                    arrtime = ls_vuelo-arrtime price = ls_vuelo-price curr = ls_vuelo-currency ) TO flight_list.
    IF max_rows > 0 AND lines( flight_list ) >= max_rows.
      EXIT.
    ENDIF.
  ENDLOOP.
  IF flight_list[] IS INITIAL.
    lv_type = 'E'. lv_number = '006'. lv_message = 'No se encontraron vuelos para esa selección'.
  ELSE.
    lv_type = 'S'. lv_number = '000'. lv_message = |Se encontraron { lines( flight_list ) } vuelo(s)|.
  ENDIF.
${RET}`,
    },
    {
      name: "BAPI_FLIGHT_GETDETAIL",
      description: "BAPI: detalle y disponibilidad de un vuelo",
      params: {
        import: [
          { name: "AIRLINEID", type: "SFLIGHT-CARRID", byValue: true },
          { name: "CONNECTIONID", type: "SFLIGHT-CONNID", byValue: true },
          { name: "FLIGHTDATE", type: "SFLIGHT-FLDATE", byValue: true },
        ],
        export: [
          { name: "FLIGHT_DATA", type: "BAPISFLDAT", byValue: true },
          { name: "AVAILIBILITY", type: "BAPISFLAVA", byValue: true },
        ],
        tables: [{ name: "RETURN", type: "BAPIRET2", optional: true }],
      },
      body: `  DATA lv_type TYPE c LENGTH 1.
  DATA lv_number TYPE n LENGTH 3.
  DATA lv_message TYPE c LENGTH 220.
  SELECT SINGLE * FROM sflight INTO @DATA(ls_vuelo)
    WHERE carrid = @airlineid AND connid = @connectionid AND fldate = @flightdate.
  IF sy-subrc <> 0.
    lv_type = 'E'. lv_number = '004'. lv_message = |El vuelo { airlineid } { connectionid } no existe en esa fecha|.
  ELSE.
    SELECT SINGLE * FROM spfli INTO @DATA(ls_conexion) WHERE carrid = @airlineid AND connid = @connectionid.
    SELECT SINGLE carrname FROM scarr INTO @DATA(lv_nombre) WHERE carrid = @airlineid.
    flight_data = VALUE #( airlineid = ls_vuelo-carrid airline = lv_nombre connectid = ls_vuelo-connid
                           flightdate = ls_vuelo-fldate airportfr = ls_conexion-airpfrom cityfrom = ls_conexion-cityfrom
                           airportto = ls_conexion-airpto cityto = ls_conexion-cityto deptime = ls_conexion-deptime
                           arrtime = ls_conexion-arrtime price = ls_vuelo-price curr = ls_vuelo-currency ).
    availibility-economax = ls_vuelo-seatsmax.
    availibility-econofree = ls_vuelo-seatsmax - ls_vuelo-seatsocc.
    lv_type = 'S'. lv_number = '000'. lv_message = 'Datos del vuelo leídos'.
  ENDIF.
${RET}`,
    },
    {
      name: "BAPI_TRANSACTION_COMMIT",
      description: "Confirmar (COMMIT WORK) después de una BAPI",
      params: { import: [{ name: "WAIT", type: "CLIKE", optional: true, byValue: true }], export: [{ name: "RETURN", type: "BAPIRET2", byValue: true }] },
      body: `  COMMIT WORK.
  return-type = 'S'.
  return-message = 'Cambios confirmados (COMMIT WORK)'.`,
    },
    {
      name: "BAPI_TRANSACTION_ROLLBACK",
      description: "Deshacer (ROLLBACK WORK) después de una BAPI",
      params: { export: [{ name: "RETURN", type: "BAPIRET2", byValue: true }] },
      body: `  ROLLBACK WORK.
  return-type = 'S'.
  return-message = 'Cambios deshechos (ROLLBACK WORK)'.`,
    },
    {
      name: "ENQUEUE_E_TABLE",
      description: "Bloquear una entrada de tabla (genérico)",
      params: {
        import: [
          { name: "TABNAME", type: "CLIKE", byValue: true },
          { name: "VARKEY", type: "CLIKE", optional: true, byValue: true },
        ],
        exceptions: [{ name: "FOREIGN_LOCK" }, { name: "SYSTEM_FAILURE" }],
      },
      body: `  DATA lv_owner TYPE c LENGTH 12.
  WRITE '@KERNEL lv_owner.set(globalThis.__abapEnqueue(tabname.get(), varkey ? varkey.get() : ""));'.
  IF lv_owner IS NOT INITIAL.
    sy-msgv1 = lv_owner.
    RAISE foreign_lock.
  ENDIF.`,
    },
    {
      name: "DEQUEUE_E_TABLE",
      description: "Desbloquear una entrada de tabla (genérico)",
      params: {
        import: [
          { name: "TABNAME", type: "CLIKE", byValue: true },
          { name: "VARKEY", type: "CLIKE", optional: true, byValue: true },
        ],
      },
      body: `  WRITE '@KERNEL globalThis.__abapDequeue(tabname.get(), varkey ? varkey.get() : "");'.`,
    },
    {
      name: "GUI_UPLOAD",
      description: "Leer un archivo de texto del PC",
      params: {
        import: [
          { name: "FILENAME", type: "CLIKE", byValue: true },
          { name: "FILETYPE", type: "CLIKE", optional: true, byValue: true, default: "'ASC'" },
          { name: "HAS_FIELD_SEPARATOR", type: "CLIKE", optional: true, byValue: true },
        ],
        tables: [{ name: "DATA_TAB" }],
        exceptions: [{ name: "FILE_OPEN_ERROR" }, { name: "FILE_READ_ERROR" }, { name: "OTHERS" }],
      },
      body: `  DATA lt_lineas TYPE STANDARD TABLE OF string WITH EMPTY KEY.
  DATA lv_ok TYPE c LENGTH 1.
  DATA lv_sep TYPE c LENGTH 1.
  WRITE '@KERNEL { const r = await globalThis.__abapFileRead(filename.get()); if (r) { lv_ok.set("X"); for (const l of r) { lt_lineas.append(new abap.types.String().set(l)); } } }'.
  IF lv_ok IS INITIAL.
    RAISE file_open_error.
  ENDIF.
  CLEAR data_tab[].
  LOOP AT lt_lineas INTO DATA(lv_linea).
    APPEND INITIAL LINE TO data_tab ASSIGNING FIELD-SYMBOL(<ls_fila>).
    IF has_field_separator IS INITIAL.
      <ls_fila> = lv_linea.
      CONTINUE.
    ENDIF.
    lv_sep = cl_abap_char_utilities=>horizontal_tab.
    IF lv_linea NS lv_sep.
      IF lv_linea CS ';'.
        lv_sep = ';'.
      ELSE.
        lv_sep = ','.
      ENDIF.
    ENDIF.
    SPLIT lv_linea AT lv_sep INTO TABLE DATA(lt_campos).
    LOOP AT lt_campos INTO DATA(lv_campo).
      ASSIGN COMPONENT sy-tabix OF STRUCTURE <ls_fila> TO FIELD-SYMBOL(<lv_comp>).
      IF sy-subrc <> 0.
        EXIT.
      ENDIF.
      <lv_comp> = lv_campo.
    ENDLOOP.
  ENDLOOP.`,
    },
    {
      name: "GUI_DOWNLOAD",
      description: "Guardar una tabla como archivo de texto en el PC",
      params: {
        import: [
          { name: "FILENAME", type: "CLIKE", byValue: true },
          { name: "FILETYPE", type: "CLIKE", optional: true, byValue: true, default: "'ASC'" },
          { name: "WRITE_FIELD_SEPARATOR", type: "CLIKE", optional: true, byValue: true },
        ],
        tables: [{ name: "DATA_TAB" }],
        exceptions: [{ name: "FILE_WRITE_ERROR" }, { name: "OTHERS" }],
      },
      body: `  DATA lt_lineas TYPE STANDARD TABLE OF string WITH EMPTY KEY.
  DATA lv_linea TYPE string.
  LOOP AT data_tab ASSIGNING FIELD-SYMBOL(<ls_fila>).
    CLEAR lv_linea.
    IF write_field_separator IS INITIAL.
      lv_linea = <ls_fila>.
    ELSE.
      DO.
        ASSIGN COMPONENT sy-index OF STRUCTURE <ls_fila> TO FIELD-SYMBOL(<lv_comp>).
        IF sy-subrc <> 0.
          EXIT.
        ENDIF.
        DATA(lv_valor) = CONV string( <lv_comp> ).
        CONDENSE lv_valor.
        IF sy-index = 1.
          lv_linea = lv_valor.
        ELSE.
          lv_linea = lv_linea && cl_abap_char_utilities=>horizontal_tab && lv_valor.
        ENDIF.
      ENDDO.
    ENDIF.
    APPEND lv_linea TO lt_lineas.
  ENDLOOP.
  WRITE '@KERNEL globalThis.__abapFileWrite(filename.get(), lt_lineas.array().map((x) => x.get()));'.`,
    },
  ],
};

export function stdLibFiles() {
  return [...fugrFiles(STD_FUGR), ...STD_STRUCTURES.map((s) => ({ filename: s.name.toLowerCase() + ".tabl.xml", contents: tableToXml(s) }))];
}
