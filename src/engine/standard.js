// Tablas "estándar" de ejemplo (modelo de vuelos) con datos de prueba.
// Son de solo lectura en SE11, igual que en un sistema real.

const F = (name, type, length, decimals, description, key = false) => ({ name, type, length, decimals, description, key });

export const STANDARD_TABLES = {
  SCARR: {
    name: "SCARR",
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
  return { SCARR: scarr, SPFLI: spfli, SFLIGHT: sflight };
}
