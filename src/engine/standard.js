// Tablas "estándar" de ejemplo (modelo de vuelos) con datos de prueba.
// Son de solo lectura en SE11, igual que en un sistema real.

const F = (name, type, length, decimals, description, key = false) => ({ name, type, length, decimals, description, key });

export const STANDARD_TABLES = {
  SCARR: {
    name: "SCARR",
    area: "Vuelos",
    description: "Aerolíneas",
    standard: true,
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("CARRID", "CHAR", 3, 0, "Compañía aérea", true),
      F("CARRNAME", "CHAR", 20, 0, "Nombre aerolínea"),
      F("CURRCODE", "CUKY", 5, 0, "Moneda"),
      F("URL", "CHAR", 255, 0, "Página web"),
    ],
  },
  SPFLI: {
    name: "SPFLI",
    area: "Vuelos",
    description: "Plan de vuelos (conexiones)",
    standard: true,
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("CARRID", "CHAR", 3, 0, "Compañía aérea", true),
      F("CONNID", "NUMC", 4, 0, "Nº conexión", true),
      F("COUNTRYFR", "CHAR", 3, 0, "País origen"),
      F("CITYFROM", "CHAR", 20, 0, "Ciudad origen"),
      F("AIRPFROM", "CHAR", 3, 0, "Aeropuerto origen"),
      F("COUNTRYTO", "CHAR", 3, 0, "País destino"),
      F("CITYTO", "CHAR", 20, 0, "Ciudad destino"),
      F("AIRPTO", "CHAR", 3, 0, "Aeropuerto destino"),
      F("FLTIME", "INT4", 10, 0, "Duración (min)"),
      F("DEPTIME", "TIMS", 6, 0, "Hora salida"),
      F("ARRTIME", "TIMS", 6, 0, "Hora llegada"),
      F("DISTANCE", "QUAN", 9, 4, "Distancia"),
      F("DISTID", "UNIT", 3, 0, "Unidad distancia"),
    ],
  },
  SFLIGHT: {
    name: "SFLIGHT",
    area: "Vuelos",
    description: "Vuelos",
    standard: true,
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("CARRID", "CHAR", 3, 0, "Compañía aérea", true),
      F("CONNID", "NUMC", 4, 0, "Nº conexión", true),
      F("FLDATE", "DATS", 8, 0, "Fecha de vuelo", true),
      F("PRICE", "CURR", 15, 2, "Precio"),
      F("CURRENCY", "CUKY", 5, 0, "Moneda"),
      F("PLANETYPE", "CHAR", 10, 0, "Tipo de avión"),
      F("SEATSMAX", "INT4", 10, 0, "Capacidad"),
      F("SEATSOCC", "INT4", 10, 0, "Plazas ocupadas"),
      F("PAYMENTSUM", "CURR", 17, 2, "Total reservas"),
    ],
  },
  SBOOK: {
    name: "SBOOK",
    description: "Reservas de vuelos",
    standard: true,
    area: "Vuelos",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("CARRID", "CHAR", 3, 0, "Compañía aérea", true),
      F("CONNID", "NUMC", 4, 0, "Nº conexión", true),
      F("FLDATE", "DATS", 8, 0, "Fecha de vuelo", true),
      F("BOOKID", "NUMC", 8, 0, "Nº reserva", true),
      F("CUSTOMID", "NUMC", 8, 0, "Nº cliente"),
      F("CUSTTYPE", "CHAR", 1, 0, "Tipo cliente (B/P)"),
      F("CLASS", "CHAR", 1, 0, "Clase (Y/C/F)"),
      F("LUGGWEIGHT", "QUAN", 8, 4, "Peso equipaje"),
      F("WUNIT", "UNIT", 3, 0, "Unidad de peso"),
      F("FORCURAM", "CURR", 15, 2, "Importe pagado"),
      F("FORCURKEY", "CUKY", 5, 0, "Moneda pago"),
      F("ORDER_DATE", "DATS", 8, 0, "Fecha de reserva"),
      F("CANCELLED", "CHAR", 1, 0, "Anulada"),
      F("PASSNAME", "CHAR", 25, 0, "Pasajero"),
    ],
  },
  SCUSTOM: {
    name: "SCUSTOM",
    description: "Clientes de vuelos",
    standard: true,
    area: "Vuelos",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("ID", "NUMC", 8, 0, "Nº cliente", true),
      F("NAME", "CHAR", 25, 0, "Nombre"),
      F("FORM", "CHAR", 15, 0, "Tratamiento"),
      F("STREET", "CHAR", 30, 0, "Calle"),
      F("CITY", "CHAR", 25, 0, "Ciudad"),
      F("COUNTRY", "CHAR", 3, 0, "País"),
      F("TELEPHONE", "CHAR", 30, 0, "Teléfono"),
      F("CUSTTYPE", "CHAR", 1, 0, "Tipo cliente (B/P)"),
      F("DISCOUNT", "NUMC", 3, 0, "Descuento %"),
    ],
  },
  T001: {
    name: "T001",
    description: "Sociedades",
    standard: true,
    area: "Finanzas (FI)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("BUKRS", "CHAR", 4, 0, "Sociedad", true),
      F("BUTXT", "CHAR", 25, 0, "Nombre de la sociedad"),
      F("ORT01", "CHAR", 25, 0, "Ciudad"),
      F("LAND1", "CHAR", 3, 0, "País"),
      F("WAERS", "CUKY", 5, 0, "Moneda"),
      F("SPRAS", "LANG", 1, 0, "Idioma"),
    ],
  },
  T005: {
    name: "T005",
    description: "Países",
    standard: true,
    area: "Finanzas (FI)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("LAND1", "CHAR", 3, 0, "País", true),
      F("LANDX", "CHAR", 15, 0, "Nombre del país"),
      F("WAERS", "CUKY", 5, 0, "Moneda"),
    ],
  },
  TCURC: {
    name: "TCURC",
    description: "Monedas",
    standard: true,
    area: "Finanzas (FI)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("WAERS", "CUKY", 5, 0, "Moneda", true),
      F("LTEXT", "CHAR", 40, 0, "Descripción"),
    ],
  },
  KNA1: {
    name: "KNA1",
    description: "Clientes (datos generales)",
    standard: true,
    area: "Ventas (SD)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("KUNNR", "CHAR", 10, 0, "Cliente", true),
      F("NAME1", "CHAR", 35, 0, "Nombre"),
      F("LAND1", "CHAR", 3, 0, "País"),
      F("ORT01", "CHAR", 35, 0, "Ciudad"),
      F("STRAS", "CHAR", 35, 0, "Calle y número"),
      F("TELF1", "CHAR", 16, 0, "Teléfono"),
      F("STCD1", "CHAR", 16, 0, "Nº identificación fiscal (RUC)"),
      F("ERDAT", "DATS", 8, 0, "Fecha de creación"),
    ],
  },
  VBAK: {
    name: "VBAK",
    description: "Pedidos de venta: cabecera",
    standard: true,
    area: "Ventas (SD)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("VBELN", "CHAR", 10, 0, "Pedido de venta", true),
      F("ERDAT", "DATS", 8, 0, "Fecha de creación"),
      F("AUART", "CHAR", 4, 0, "Clase de pedido"),
      F("VKORG", "CHAR", 4, 0, "Organización de ventas"),
      F("BUKRS_VF", "CHAR", 4, 0, "Sociedad"),
      F("KUNNR", "CHAR", 10, 0, "Cliente"),
      F("NETWR", "CURR", 15, 2, "Valor neto"),
      F("WAERK", "CUKY", 5, 0, "Moneda"),
    ],
  },
  VBAP: {
    name: "VBAP",
    description: "Pedidos de venta: posiciones",
    standard: true,
    area: "Ventas (SD)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("VBELN", "CHAR", 10, 0, "Pedido de venta", true),
      F("POSNR", "NUMC", 6, 0, "Posición", true),
      F("MATNR", "CHAR", 18, 0, "Material"),
      F("KWMENG", "QUAN", 15, 3, "Cantidad"),
      F("VRKME", "UNIT", 3, 0, "Unidad de venta"),
      F("NETPR", "CURR", 11, 2, "Precio neto"),
      F("NETWR", "CURR", 15, 2, "Valor neto"),
      F("WAERK", "CUKY", 5, 0, "Moneda"),
    ],
  },
  LFA1: {
    name: "LFA1",
    description: "Proveedores (datos generales)",
    standard: true,
    area: "Compras (MM)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("LIFNR", "CHAR", 10, 0, "Proveedor", true),
      F("NAME1", "CHAR", 35, 0, "Nombre"),
      F("LAND1", "CHAR", 3, 0, "País"),
      F("ORT01", "CHAR", 35, 0, "Ciudad"),
      F("STCD1", "CHAR", 16, 0, "Nº identificación fiscal (RUC)"),
      F("ERDAT", "DATS", 8, 0, "Fecha de creación"),
    ],
  },
  EKKO: {
    name: "EKKO",
    description: "Pedidos de compra: cabecera",
    standard: true,
    area: "Compras (MM)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("EBELN", "CHAR", 10, 0, "Pedido de compra", true),
      F("BUKRS", "CHAR", 4, 0, "Sociedad"),
      F("BSART", "CHAR", 4, 0, "Clase de pedido"),
      F("LIFNR", "CHAR", 10, 0, "Proveedor"),
      F("AEDAT", "DATS", 8, 0, "Fecha del pedido"),
      F("WAERS", "CUKY", 5, 0, "Moneda"),
    ],
  },
  EKPO: {
    name: "EKPO",
    description: "Pedidos de compra: posiciones",
    standard: true,
    area: "Compras (MM)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("EBELN", "CHAR", 10, 0, "Pedido de compra", true),
      F("EBELP", "NUMC", 5, 0, "Posición", true),
      F("MATNR", "CHAR", 18, 0, "Material"),
      F("TXZ01", "CHAR", 40, 0, "Texto breve"),
      F("MENGE", "QUAN", 13, 3, "Cantidad"),
      F("MEINS", "UNIT", 3, 0, "Unidad"),
      F("NETPR", "CURR", 11, 2, "Precio neto"),
      F("NETWR", "CURR", 13, 2, "Valor neto"),
      F("WERKS", "CHAR", 4, 0, "Centro"),
    ],
  },
  MARA: {
    name: "MARA",
    description: "Materiales (datos generales)",
    standard: true,
    area: "Materiales (MM)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("MATNR", "CHAR", 18, 0, "Material", true),
      F("MTART", "CHAR", 4, 0, "Tipo de material"),
      F("MATKL", "CHAR", 9, 0, "Grupo de artículos"),
      F("MEINS", "UNIT", 3, 0, "Unidad de medida base"),
      F("BRGEW", "QUAN", 13, 3, "Peso bruto"),
      F("GEWEI", "UNIT", 3, 0, "Unidad de peso"),
      F("ERSDA", "DATS", 8, 0, "Fecha de creación"),
    ],
  },
  MAKT: {
    name: "MAKT",
    description: "Textos breves de material",
    standard: true,
    area: "Materiales (MM)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("MATNR", "CHAR", 18, 0, "Material", true),
      F("SPRAS", "LANG", 1, 0, "Idioma", true),
      F("MAKTX", "CHAR", 40, 0, "Descripción del material"),
    ],
  },
  PA0001: {
    name: "PA0001",
    description: "HR: Asignación organizativa (infotipo 0001)",
    standard: true,
    area: "Personal (HR)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("PERNR", "NUMC", 8, 0, "Nº de personal", true),
      F("ENDDA", "DATS", 8, 0, "Fin de validez", true),
      F("BEGDA", "DATS", 8, 0, "Inicio de validez", true),
      F("BUKRS", "CHAR", 4, 0, "Sociedad"),
      F("WERKS", "CHAR", 4, 0, "División de personal"),
      F("PERSG", "CHAR", 1, 0, "Grupo de personal"),
      F("KOSTL", "CHAR", 10, 0, "Centro de coste"),
      F("ORGEH", "NUMC", 8, 0, "Unidad organizativa"),
      F("STLTX", "CHAR", 25, 0, "Puesto"),
      F("ENAME", "CHAR", 40, 0, "Nombre del empleado"),
    ],
  },
  PA0002: {
    name: "PA0002",
    description: "HR: Datos personales (infotipo 0002)",
    standard: true,
    area: "Personal (HR)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("PERNR", "NUMC", 8, 0, "Nº de personal", true),
      F("ENDDA", "DATS", 8, 0, "Fin de validez", true),
      F("BEGDA", "DATS", 8, 0, "Inicio de validez", true),
      F("NACHN", "CHAR", 40, 0, "Apellido"),
      F("VORNA", "CHAR", 40, 0, "Nombre"),
      F("GBDAT", "DATS", 8, 0, "Fecha de nacimiento"),
      F("GESCH", "CHAR", 1, 0, "Sexo (1=M, 2=F)"),
      F("NATIO", "CHAR", 3, 0, "Nacionalidad"),
    ],
  },
  PA0008: {
    name: "PA0008",
    description: "HR: Remuneración básica (infotipo 0008)",
    standard: true,
    area: "Personal (HR)",
    fields: [
      F("MANDT", "CLNT", 3, 0, "Mandante", true),
      F("PERNR", "NUMC", 8, 0, "Nº de personal", true),
      F("ENDDA", "DATS", 8, 0, "Fin de validez", true),
      F("BEGDA", "DATS", 8, 0, "Inicio de validez", true),
      F("BET01", "CURR", 13, 2, "Sueldo básico mensual"),
      F("WAERS", "CUKY", 5, 0, "Moneda"),
    ],
  },
};

const CARRIERS = [
  ["AA", "American Airlines", "USD", "http://www.aa.com"],
  ["AV", "Avianca", "USD", "http://www.avianca.com"],
  ["AZ", "Alitalia", "EUR", "http://www.alitalia.it"],
  ["DL", "Delta Airlines", "USD", "http://www.delta.com"],
  ["IB", "Iberia", "EUR", "http://www.iberia.com"],
  ["JL", "Japan Airlines", "JPY", "http://www.jal.co.jp"],
  ["LA", "LATAM Airlines", "USD", "http://www.latam.com"],
  ["LH", "Lufthansa", "EUR", "http://www.lufthansa.com"],
  ["UA", "United Airlines", "USD", "http://www.ual.com"],
];

// carrid, connid, countryfr, cityfrom, airpfrom, countryto, cityto, airpto, fltime, dep, arr, distance
const CONNECTIONS = [
  ["AA", "0017", "US", "NEW YORK", "JFK", "US", "SAN FRANCISCO", "SFO", 361, "110000", "140100", 2572],
  ["AA", "0064", "US", "SAN FRANCISCO", "SFO", "US", "NEW YORK", "JFK", 321, "090000", "172100", 2572],
  ["AV", "0101", "CO", "BOGOTA", "BOG", "PE", "LIMA", "LIM", 210, "063000", "100000", 1170],
  ["AV", "0102", "PE", "LIMA", "LIM", "CO", "BOGOTA", "BOG", 205, "120000", "152500", 1170],
  ["AZ", "0555", "IT", "ROME", "FCO", "DE", "FRANKFURT", "FRA", 125, "190000", "210500", 845],
  ["DL", "0106", "US", "NEW YORK", "JFK", "DE", "FRANKFURT", "FRA", 475, "193500", "093000", 3851],
  ["IB", "6651", "ES", "MADRID", "MAD", "PE", "LIMA", "LIM", 755, "235500", "053000", 5925],
  ["IB", "6650", "PE", "LIMA", "LIM", "ES", "MADRID", "MAD", 720, "175000", "130000", 5925],
  ["JL", "0407", "JP", "TOKYO", "NRT", "DE", "FRANKFURT", "FRA", 725, "133000", "173500", 5800],
  ["LA", "2010", "PE", "LIMA", "LIM", "PE", "CUSCO", "CUZ", 80, "060000", "072000", 580],
  ["LA", "2011", "PE", "CUSCO", "CUZ", "PE", "LIMA", "LIM", 85, "090000", "102500", 580],
  ["LA", "0530", "PE", "LIMA", "LIM", "CL", "SANTIAGO", "SCL", 225, "081500", "140000", 2460],
  ["LH", "0400", "DE", "FRANKFURT", "FRA", "US", "NEW YORK", "JFK", 444, "101000", "113400", 3851],
  ["LH", "0402", "DE", "FRANKFURT", "FRA", "US", "NEW YORK", "JFK", 455, "133000", "153500", 3851],
  ["UA", "0941", "DE", "FRANKFURT", "FRA", "US", "SAN FRANCISCO", "SFO", 660, "143000", "170000", 5685],
];

const PLANES = [
  ["A320-200", 180],
  ["A330-300", 300],
  ["A380-800", 475],
  ["B737-800", 160],
  ["B787-9", 290],
];

// generador pseudoaleatorio determinista para que todos vean los mismos datos
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function ymd(d) {
  return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
}

export function standardRows() {
  const r = rng(42);
  const rates = { USD: 1, EUR: 0.92, JPY: 150 };
  const scarr = CARRIERS.map(([carrid, carrname, currcode, url]) => ({ mandt: "100", carrid, carrname, currcode, url }));
  const spfli = CONNECTIONS.map((c) => ({
    mandt: "100",
    carrid: c[0],
    connid: c[1],
    countryfr: c[2],
    cityfrom: c[3],
    airpfrom: c[4],
    countryto: c[5],
    cityto: c[6],
    airpto: c[7],
    fltime: c[8],
    deptime: c[9],
    arrtime: c[10],
    distance: c[11],
    distid: "KM",
  }));
  const sflight = [];
  const base = new Date(2026, 0, 10);
  for (const c of CONNECTIONS) {
    const curr = CARRIERS.find((x) => x[0] === c[0])[2];
    const n = 4 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const d = new Date(base.getTime() + (i * 35 + Math.floor(r() * 20)) * 86400000);
      const [plane, max] = PLANES[Math.floor(r() * PLANES.length)];
      const occ = Math.floor(max * (0.4 + r() * 0.6));
      const priceUsd = Math.round(c[11] * (0.08 + r() * 0.07)) + 49;
      const price = curr === "JPY" ? Math.round(priceUsd * rates.JPY) : Math.round(priceUsd * rates[curr] * 100) / 100;
      sflight.push({
        mandt: "100",
        carrid: c[0],
        connid: c[1],
        fldate: ymd(d),
        price,
        currency: curr,
        planetype: plane,
        seatsmax: max,
        seatsocc: occ,
        paymentsum: Math.round(price * occ * 100) / 100,
      });
    }
  }
  return { SCARR: scarr, SPFLI: spfli, SFLIGHT: sflight, ...moreRows(sflight) };
}

// ---------------------------------------------------------------------------
// Datos de FI / SD / MM / HR y reservas de vuelos (coherentes entre sí)
const COMPANIES = [
  ["1000", "Andes Comercial SAC", "LIMA", "PE", "PEN", "S"],
  ["2000", "Pacifico Industrial SA", "AREQUIPA", "PE", "PEN", "S"],
  ["3000", "Iberia Distribucion SL", "MADRID", "ES", "EUR", "S"],
  ["4000", "Norte Trading Inc", "MIAMI", "US", "USD", "E"],
];
const COUNTRIES = [
  ["AR", "Argentina", "ARS"],
  ["CL", "Chile", "CLP"],
  ["CO", "Colombia", "COP"],
  ["DE", "Alemania", "EUR"],
  ["ES", "España", "EUR"],
  ["IT", "Italia", "EUR"],
  ["JP", "Japón", "JPY"],
  ["MX", "México", "MXN"],
  ["PE", "Perú", "PEN"],
  ["US", "Estados Unidos", "USD"],
];
const CURRENCIES = [
  ["ARS", "Peso argentino"],
  ["CLP", "Peso chileno"],
  ["COP", "Peso colombiano"],
  ["EUR", "Euro"],
  ["JPY", "Yen japonés"],
  ["MXN", "Peso mexicano"],
  ["PEN", "Sol peruano"],
  ["USD", "Dólar estadounidense"],
];
// kunnr, nombre, país, ciudad, calle, sociedad
const CUSTOMERS = [
  ["0000100001", "Minera Los Andes SAC", "PE", "LIMA", "Av. Javier Prado Este 4200", "1000"],
  ["0000100002", "Supermercados Inca SA", "PE", "LIMA", "Av. Arequipa 1520", "1000"],
  ["0000100003", "Farmacias del Sur SAC", "PE", "AREQUIPA", "Calle Mercaderes 310", "2000"],
  ["0000100004", "Constructora Huascaran SA", "PE", "HUARAZ", "Jr. San Martin 845", "1000"],
  ["0000100005", "Textiles Cusco EIRL", "PE", "CUSCO", "Av. El Sol 602", "2000"],
  ["0000100006", "Agroexport Ica SAC", "PE", "ICA", "Panamericana Sur Km 303", "1000"],
  ["0000100007", "Lima Gourmet SAC", "PE", "LIMA", "Av. Larco 1150", "1000"],
  ["0000100008", "Distribuidora Norte SAC", "PE", "TRUJILLO", "Av. España 2140", "1000"],
  ["0000100009", "Panaderia Arequipa EIRL", "PE", "AREQUIPA", "Av. Ejercito 718", "2000"],
  ["0000100010", "Universidad del Pacifico", "PE", "LIMA", "Av. Salaverry 2020", "1000"],
  ["0000100011", "Retail Santiago SpA", "CL", "SANTIAGO", "Av. Providencia 1760", "1000"],
  ["0000100012", "Comercial Bogota SAS", "CO", "BOGOTA", "Carrera 7 No. 71-21", "1000"],
  ["0000100013", "Hoteles Castilla SL", "ES", "MADRID", "Gran Via 45", "3000"],
  ["0000100014", "Oficinas Barcelona SA", "ES", "BARCELONA", "Passeig de Gracia 92", "3000"],
  ["0000100015", "Electro Miami LLC", "US", "MIAMI", "1450 Brickell Ave", "4000"],
  ["0000100016", "Texas Office Supply Co", "US", "HOUSTON", "820 Main St", "4000"],
];
// matnr, tipo, grupo, unidad, peso kg, precio venta PEN, texto ES, texto EN, proveedor
const MATERIALS = [
  ["HW-1001", "HAWA", "COMPUTO", "ST", 1.6, 3890, "Laptop 14 pulgadas", "Laptop 14 inch", "0000200001"],
  ["HW-1002", "HAWA", "COMPUTO", "ST", 4.2, 790, "Monitor 24 pulgadas", "Monitor 24 inch", "0000200001"],
  ["HW-1003", "HAWA", "COMPUTO", "ST", 0.6, 120, "Teclado inalambrico", "Wireless keyboard", "0000200001"],
  ["HW-1004", "HAWA", "COMPUTO", "ST", 0.1, 65, "Mouse optico", "Optical mouse", "0000200001"],
  ["HW-1005", "HAWA", "COMPUTO", "ST", 9.5, 1450, "Impresora laser", "Laser printer", "0000200007"],
  ["OF-2001", "HAWA", "OFICINA", "CS", 12.5, 145, "Papel bond A4 (caja 10 millares)", "A4 paper (box)", "0000200002"],
  ["OF-2002", "HAWA", "OFICINA", "ST", 0.9, 320, "Toner negro", "Black toner", "0000200007"],
  ["MU-3001", "HAWA", "MUEBLES", "ST", 18, 890, "Silla ergonomica", "Ergonomic chair", "0000200003"],
  ["MU-3002", "HAWA", "MUEBLES", "ST", 35, 1290, "Escritorio de oficina", "Office desk", "0000200003"],
  ["AL-4001", "HAWA", "ALIMENT", "KG", 1, 58, "Cafe en grano 1 kg", "Coffee beans 1 kg", "0000200004"],
  ["AL-4002", "HAWA", "ALIMENT", "CS", 9, 24, "Agua mineral (paquete x15)", "Mineral water (pack x15)", "0000200004"],
  ["SE-5001", "HAWA", "SEGURID", "ST", 0.4, 45, "Casco de seguridad", "Safety helmet", "0000200005"],
  ["SE-5002", "HAWA", "SEGURID", "ST", 0.2, 18, "Guantes industriales (par)", "Industrial gloves (pair)", "0000200005"],
  ["CO-6001", "ROH", "CONSTRUC", "BAG", 42.5, 32, "Cemento portland 42.5 kg", "Portland cement 42.5 kg", "0000200006"],
  ["CO-6002", "ROH", "CONSTRUC", "ST", 6, 38, "Tuberia PVC 4 pulgadas", "PVC pipe 4 inch", "0000200006"],
];
const VENDORS = [
  ["0000200001", "Tech Import SAC", "PE", "LIMA"],
  ["0000200002", "Papelera Nacional SA", "PE", "LIMA"],
  ["0000200003", "Muebles Modernos SAC", "PE", "AREQUIPA"],
  ["0000200004", "Cafe Selva Central SAC", "PE", "CHANCHAMAYO"],
  ["0000200005", "Seguridad Industrial Peru SAC", "PE", "LIMA"],
  ["0000200006", "Cementos del Pacifico SA", "PE", "AREQUIPA"],
  ["0000200007", "Global Supplies Inc", "US", "NEW YORK"],
  ["0000200008", "Distribuciones Iberia SL", "ES", "VALENCIA"],
];
// nombre, apellido, sexo, nacionalidad, sociedad, división, puesto, sueldo
const EMPLOYEES = [
  ["Carlos", "Quispe Mamani", "1", "PE", "1000", "LIM1", "Gerente general", 18500],
  ["Lucia", "Fernandez Rojas", "2", "PE", "1000", "LIM1", "Jefa de finanzas", 12800],
  ["Jorge", "Huaman Torres", "1", "PE", "1000", "LIM1", "Analista ABAP", 7800],
  ["Andrea", "Salazar Vega", "2", "PE", "1000", "LIM1", "Consultora SD", 8200],
  ["Miguel", "Rojas Paredes", "1", "PE", "1000", "LIM1", "Desarrollador Fiori", 7400],
  ["Rosa", "Condori Apaza", "2", "PE", "1000", "LIM1", "Contadora", 6200],
  ["Diego", "Castillo Ramos", "1", "PE", "1000", "LIM1", "Vendedor", 3800],
  ["Valeria", "Mendoza Ruiz", "2", "PE", "1000", "LIM1", "Asistente administrativa", 2900],
  ["Luis", "Chavez Flores", "1", "PE", "2000", "AQP1", "Jefe de planta", 11200],
  ["Carmen", "Vargas Ccama", "2", "PE", "2000", "AQP1", "Jefa de compras", 8900],
  ["Pedro", "Ticona Lazo", "1", "PE", "2000", "AQP1", "Almacenero", 2600],
  ["Sofia", "Gutierrez Pinto", "2", "PE", "2000", "AQP1", "Analista MM", 6900],
  ["Javier", "Martin Lopez", "1", "ES", "3000", "MAD1", "Director comercial", 5200],
  ["Elena", "Garcia Moreno", "2", "ES", "3000", "MAD1", "Consultora FI", 3900],
  ["Pablo", "Sanchez Diaz", "1", "ES", "3000", "MAD1", "Programador ABAP", 3400],
  ["Marta", "Navarro Gil", "2", "ES", "3000", "MAD1", "Jefa de RRHH", 4100],
  ["John", "Smith", "1", "US", "4000", "MIA1", "Country manager", 9500],
  ["Emily", "Johnson", "2", "US", "4000", "MIA1", "Sales representative", 5200],
  ["Daniel", "Perez", "1", "MX", "4000", "MIA1", "Logistics analyst", 4800],
  ["Ana", "Torres Quispe", "2", "PE", "1000", "LIM1", "Practicante ABAP", 1500],
];
const FLIGHT_CUSTOMERS = [
  "Maria Lopez", "Jose Ramirez", "Ana Torres", "Luis Garcia", "Carmen Diaz", "Pedro Castillo", "Lucia Flores", "Jorge Rivera",
  "Sofia Morales", "Diego Herrera", "Valeria Ruiz", "Miguel Sanchez", "Paula Vargas", "Andres Castro", "Camila Rojas", "Fernando Ortiz",
  "Gabriela Silva", "Ricardo Mendoza", "Daniela Navarro", "Hugo Romero", "Elena Gil", "Mario Rossi", "Anna Schmidt", "John Miller",
  "Emma Brown", "Hans Weber", "Yuki Tanaka", "Laura Bianchi", "Carlos Pena", "Patricia Leon",
];

function addDays(ymdStr, n) {
  const d = new Date(+ymdStr.substring(0, 4), +ymdStr.substring(4, 6) - 1, +ymdStr.substring(6, 8));
  return ymd(new Date(d.getTime() + n * 86400000));
}

function moreRows(sflight) {
  const r = rng(2026);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const ruc = () => "20" + String(Math.floor(r() * 1e9)).padStart(9, "0");
  const M = "100";
  const rate = { PEN: 1, USD: 1 / 3.75, EUR: 1 / 4.05 };
  const money = (v) => Math.round(v * 100) / 100;
  const coCurr = Object.fromEntries(COMPANIES.map((c) => [c[0], c[4]]));

  const T001 = COMPANIES.map(([bukrs, butxt, ort01, land1, waers, spras]) => ({ mandt: M, bukrs, butxt, ort01, land1, waers, spras }));
  const T005 = COUNTRIES.map(([land1, landx, waers]) => ({ mandt: M, land1, landx, waers }));
  const TCURC = CURRENCIES.map(([waers, ltext]) => ({ mandt: M, waers, ltext }));
  const KNA1 = CUSTOMERS.map(([kunnr, name1, land1, ort01, stras], i) => ({
    mandt: M,
    kunnr,
    name1,
    land1,
    ort01,
    stras,
    telf1: (land1 === "PE" ? "01-" : "+") + String(4000000 + Math.floor(r() * 5999999)),
    stcd1: land1 === "PE" ? ruc() : land1 + String(Math.floor(r() * 1e8)),
    erdat: addDays("20230105", i * 37),
  }));
  const LFA1 = VENDORS.map(([lifnr, name1, land1, ort01], i) => ({ mandt: M, lifnr, name1, land1, ort01, stcd1: land1 === "PE" ? ruc() : land1 + String(Math.floor(r() * 1e8)), erdat: addDays("20220310", i * 53) }));
  const MARA = MATERIALS.map(([matnr, mtart, matkl, meins, peso], i) => ({ mandt: M, matnr, mtart, matkl, meins, brgew: peso, gewei: "KG", ersda: addDays("20220201", i * 21) }));
  const MAKT = MATERIALS.flatMap(([matnr, , , , , , es, en]) => [
    { mandt: M, matnr, spras: "S", maktx: es },
    { mandt: M, matnr, spras: "E", maktx: en },
  ]);

  // pedidos de venta
  const VBAK = [];
  const VBAP = [];
  for (let i = 0; i < 36; i++) {
    const c = CUSTOMERS[i % CUSTOMERS.length];
    const bukrs = c[5];
    const waerk = coCurr[bukrs];
    const vbeln = String(5001 + i).padStart(10, "0");
    const erdat = addDays("20260105", i * 8 + Math.floor(r() * 6));
    let total = 0;
    const n = 1 + Math.floor(r() * 4);
    const used = new Set();
    for (let k = 0; k < n; k++) {
      let m = pick(MATERIALS);
      while (used.has(m[0])) m = pick(MATERIALS);
      used.add(m[0]);
      const qty = m[3] === "BAG" ? 50 * (1 + Math.floor(r() * 8)) : 1 + Math.floor(r() * 12);
      const netpr = money(m[5] * rate[waerk] * (0.95 + r() * 0.1));
      const netwr = money(netpr * qty);
      total += netwr;
      VBAP.push({ mandt: M, vbeln, posnr: String((k + 1) * 10).padStart(6, "0"), matnr: m[0], kwmeng: qty, vrkme: m[3], netpr, netwr, waerk });
    }
    VBAK.push({ mandt: M, vbeln, erdat, auart: "TA", vkorg: bukrs, bukrs_vf: bukrs, kunnr: c[0], netwr: money(total), waerk });
  }

  // pedidos de compra
  const EKKO = [];
  const EKPO = [];
  for (let i = 0; i < 18; i++) {
    const v = VENDORS[i % VENDORS.length];
    const bukrs = v[2] === "ES" ? "3000" : i % 3 === 2 ? "2000" : "1000";
    const waers = v[2] === "US" ? "USD" : coCurr[bukrs];
    const ebeln = String(4500000001 + i);
    EKKO.push({ mandt: M, ebeln, bukrs, bsart: "NB", lifnr: v[0], aedat: addDays("20260110", i * 15 + Math.floor(r() * 5)), waers });
    const mats = MATERIALS.filter((m) => m[8] === v[0]);
    const list = mats.length ? mats : [pick(MATERIALS)];
    const n = Math.min(list.length, 1 + Math.floor(r() * 3));
    for (let k = 0; k < n; k++) {
      const m = list[k];
      const menge = m[3] === "BAG" ? 200 * (1 + Math.floor(r() * 5)) : 5 + Math.floor(r() * 40);
      const netpr = money(m[5] * 0.68 * (rate[waers] || 1));
      EKPO.push({ mandt: M, ebeln, ebelp: String((k + 1) * 10).padStart(5, "0"), matnr: m[0], txz01: m[6], menge, meins: m[3], netpr, netwr: money(netpr * menge), werks: bukrs });
    }
  }

  // personal
  const PA0001 = [];
  const PA0002 = [];
  const PA0008 = [];
  EMPLOYEES.forEach(([vorna, nachn, gesch, natio, bukrs, werks, stltx, sueldo], i) => {
    const pernr = String(1001 + i).padStart(8, "0");
    const begda = addDays("20180301", i * 97);
    const endda = "99991231";
    PA0001.push({ mandt: M, pernr, endda, begda, bukrs, werks, persg: "1", kostl: `CC-${bukrs}-${String((i % 4) + 1).padStart(2, "0")}`, orgeh: String(50000100 + (i % 5) * 10).padStart(8, "0"), stltx, ename: `${vorna} ${nachn}` });
    PA0002.push({ mandt: M, pernr, endda, begda, nachn, vorna, gbdat: addDays("19750110", Math.floor(r() * 9000)), gesch, natio });
    const waers = coCurr[bukrs];
    if (i % 4 === 0) {
      // historial: sueldo anterior con validez hasta fin de 2025
      PA0008.push({ mandt: M, pernr, endda: "20251231", begda, bet01: money(sueldo * 0.9), waers });
      PA0008.push({ mandt: M, pernr, endda, begda: "20260101", bet01: sueldo, waers });
    } else {
      PA0008.push({ mandt: M, pernr, endda, begda, bet01: sueldo, waers });
    }
  });

  // clientes y reservas de vuelos
  const countries = ["PE", "PE", "PE", "CO", "CL", "ES", "US", "DE", "IT", "JP"];
  const SCUSTOM = FLIGHT_CUSTOMERS.map((name, i) => ({
    mandt: M,
    id: String(i + 1).padStart(8, "0"),
    name,
    form: /a$/.test(name.split(" ")[0]) ? "Sra." : "Sr.",
    street: "Calle " + (100 + Math.floor(r() * 900)),
    city: ["LIMA", "LIMA", "CUSCO", "BOGOTA", "SANTIAGO", "MADRID", "NEW YORK", "BERLIN", "ROME", "TOKYO"][i % 10],
    country: countries[i % 10],
    telephone: "+" + String(10000000 + Math.floor(r() * 89999999)),
    custtype: i % 5 === 0 ? "B" : "P",
    discount: i % 5 === 0 ? "010" : "000",
  }));
  const SBOOK = [];
  let bookid = 1;
  for (const f of sflight) {
    const n = 3 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) {
      const cust = SCUSTOM[Math.floor(r() * SCUSTOM.length)];
      const cls = r() < 0.8 ? "Y" : r() < 0.7 ? "C" : "F";
      const factor = cls === "Y" ? 1 : cls === "C" ? 2.5 : 4;
      SBOOK.push({
        mandt: M,
        carrid: f.carrid,
        connid: f.connid,
        fldate: f.fldate,
        bookid: String(bookid++).padStart(8, "0"),
        customid: cust.id,
        custtype: cust.custtype,
        class: cls,
        luggweight: Math.round((8 + r() * 20) * 10) / 10,
        wunit: "KG",
        forcuram: money(f.price * factor),
        forcurkey: f.currency,
        order_date: addDays(f.fldate, -(5 + Math.floor(r() * 60))),
        cancelled: r() < 0.06 ? "X" : "",
        passname: cust.name,
      });
    }
  }
  return { T001, T005, TCURC, KNA1, LFA1, MARA, MAKT, VBAK, VBAP, EKKO, EKPO, PA0001, PA0002, PA0008, SCUSTOM, SBOOK };
}
