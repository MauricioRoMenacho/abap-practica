// Servicio OData V2 simulado ZFLIGHT_SRV (modelo de vuelos) para las prácticas de SAPUI5.
// Se genera el $metadata y los datos de prueba (mockdata) a partir de las tablas del simulador.
import { STANDARD_TABLES } from "../engine/standard.js";

export const SERVICE_URL = "/sap/opu/odata/sap/ZFLIGHT_SRV/";

const camel = (n) => n.charAt(0) + n.slice(1).toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase());

// entidad -> tabla
const ENTITIES = [
  { set: "Carriers", type: "Carrier", table: "SCARR", label: "Aerolínea" },
  { set: "Connections", type: "Connection", table: "SPFLI", label: "Conexión" },
  { set: "Flights", type: "Flight", table: "SFLIGHT", label: "Vuelo" },
  { set: "Customers", type: "Customer", table: "SCUSTOM", label: "Cliente" },
  { set: "Bookings", type: "Booking", table: "SBOOK", label: "Reserva", limit: 400 },
];

const NAVS = [
  { name: "ToConnections", from: "Carrier", to: "Connection", many: true, keys: ["CARRID"] },
  { name: "ToCarrier", from: "Connection", to: "Carrier", many: false, keys: ["CARRID"] },
  { name: "ToFlights", from: "Connection", to: "Flight", many: true, keys: ["CARRID", "CONNID"] },
  { name: "ToConnection", from: "Flight", to: "Connection", many: false, keys: ["CARRID", "CONNID"] },
  { name: "ToBookings", from: "Flight", to: "Booking", many: true, keys: ["CARRID", "CONNID", "FLDATE"] },
  { name: "ToFlight", from: "Booking", to: "Flight", many: false, keys: ["CARRID", "CONNID", "FLDATE"] },
];

function edm(f) {
  switch (f.type) {
    case "DATS":
      return `Type="Edm.DateTime" Precision="0" sap:display-format="Date"`;
    case "TIMS":
      return `Type="Edm.Time" Precision="0"`;
    case "INT4":
    case "INT2":
    case "INT1":
      return `Type="Edm.Int32"`;
    case "CURR":
    case "DEC":
    case "QUAN":
      return `Type="Edm.Decimal" Precision="${f.length}" Scale="${f.decimals || 0}"`;
    default:
      return `Type="Edm.String" MaxLength="${f.length || 255}"`;
  }
}

const fieldsOf = (t) => STANDARD_TABLES[t].fields.filter((f) => f.name !== "MANDT");
const keysOf = (t) => fieldsOf(t).filter((f) => f.key);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function metadataXml() {
  const types = ENTITIES.map((e) => {
    const fs = fieldsOf(e.table);
    const navs = NAVS.filter((n) => n.from === e.type);
    return `   <EntityType Name="${e.type}" sap:content-version="1">
    <Key>${keysOf(e.table).map((f) => `<PropertyRef Name="${camel(f.name)}"/>`).join("")}</Key>
${fs.map((f) => `    <Property Name="${camel(f.name)}" ${edm(f)} Nullable="${f.key ? "false" : "true"}" sap:label="${esc(f.description || f.name)}"${f.type === "CURR" ? ` sap:unit="${camel(fs.find((x) => x.type === "CUKY")?.name || "CURRENCY")}"` : ""}/>`).join("\n")}
${navs.map((n) => `    <NavigationProperty Name="${n.name}" Relationship="ZFLIGHT_SRV.${n.name}_${n.from}" FromRole="From${n.from}" ToRole="To${n.to}"/>`).join("\n")}
   </EntityType>`;
  }).join("\n");
  const assocs = NAVS.map((n) => {
    const principal = n.many ? n.from : n.to;
    const dependent = n.many ? n.to : n.from;
    return `   <Association Name="${n.name}_${n.from}" sap:content-version="1">
    <End Type="ZFLIGHT_SRV.${n.from}" Multiplicity="${n.many ? "1" : "*"}" Role="From${n.from}"/>
    <End Type="ZFLIGHT_SRV.${n.to}" Multiplicity="${n.many ? "*" : "1"}" Role="To${n.to}"/>
    <ReferentialConstraint>
     <Principal Role="${principal === n.from ? "From" + n.from : "To" + n.to}">${n.keys.map((k) => `<PropertyRef Name="${camel(k)}"/>`).join("")}</Principal>
     <Dependent Role="${dependent === n.from ? "From" + n.from : "To" + n.to}">${n.keys.map((k) => `<PropertyRef Name="${camel(k)}"/>`).join("")}</Dependent>
    </ReferentialConstraint>
   </Association>`;
  }).join("\n");
  const sets = ENTITIES.map((e) => `    <EntitySet Name="${e.set}" EntityType="ZFLIGHT_SRV.${e.type}" sap:creatable="true" sap:updatable="true" sap:deletable="true" sap:content-version="1"/>`).join("\n");
  const assocSets = NAVS.map((n) => {
    const fromE = ENTITIES.find((e) => e.type === n.from);
    const toE = ENTITIES.find((e) => e.type === n.to);
    return `    <AssociationSet Name="${n.name}_${n.from}Set" Association="ZFLIGHT_SRV.${n.name}_${n.from}" sap:content-version="1"><End EntitySet="${fromE.set}" Role="From${n.from}"/><End EntitySet="${toE.set}" Role="To${n.to}"/></AssociationSet>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns:sap="http://www.sap.com/Protocols/SAPData">
 <edmx:DataServices m:DataServiceVersion="2.0">
  <Schema Namespace="ZFLIGHT_SRV" xml:lang="es" sap:schema-version="1" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">
${types}
${assocs}
   <EntityContainer Name="ZFLIGHT_SRV_Entities" m:IsDefaultEntityContainer="true" sap:supported-formats="atom json xlsx">
${sets}
${assocSets}
   </EntityContainer>
  </Schema>
 </edmx:DataServices>
</edmx:Edmx>`;
}

function toOData(f, v) {
  if (v === null || v === undefined) return null;
  switch (f.type) {
    case "DATS": {
      const s = String(v);
      if (!/^\d{8}$/.test(s) || s === "00000000") return null;
      return `/Date(${Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8))})/`;
    }
    case "TIMS": {
      const s = String(v).padStart(6, "0");
      return `PT${s.slice(0, 2)}H${s.slice(2, 4)}M${s.slice(4, 6)}S`;
    }
    case "INT4":
    case "INT2":
    case "INT1":
      return Number(v);
    case "CURR":
    case "DEC":
    case "QUAN":
      return Number(v).toFixed(f.decimals || 0);
    default:
      return String(v).trimEnd();
  }
}

// { "Carriers.json": [...], ... } leyendo la base de datos del simulador
export function mockData(engine) {
  const out = {};
  for (const e of ENTITIES) {
    let rows = [];
    try {
      rows = engine.query(`SELECT * FROM "${e.table.toLowerCase()}"${e.limit ? ` LIMIT ${e.limit}` : ""}`);
    } catch {
      rows = [];
    }
    const fs = fieldsOf(e.table);
    out[e.set + ".json"] = rows.map((r) => Object.fromEntries(fs.map((f) => [camel(f.name), toOData(f, r[f.name.toLowerCase()])])));
  }
  return out;
}

// datos simples (JSON) para los primeros ejercicios con JSONModel
export function jsonFlights(engine) {
  const q = (sql) => {
    try {
      return engine.query(sql);
    } catch {
      return [];
    }
  };
  const carriers = q(`SELECT carrid, carrname, currcode, url FROM "scarr" ORDER BY carrid`).map((r) => ({ carrid: r.carrid.trim(), carrname: r.carrname.trim(), currency: r.currcode.trim(), url: (r.url || "").trim() }));
  const flights = q(`SELECT f.carrid, f.connid, f.fldate, f.price, f.currency, f.seatsmax, f.seatsocc, p.cityfrom, p.cityto FROM "sflight" f JOIN "spfli" p ON p.carrid = f.carrid AND p.connid = f.connid ORDER BY f.carrid, f.connid, f.fldate LIMIT 60`).map((r) => ({
    carrid: r.carrid.trim(),
    connid: r.connid,
    fldate: `${r.fldate.slice(0, 4)}-${r.fldate.slice(4, 6)}-${r.fldate.slice(6, 8)}`,
    price: Number(r.price),
    currency: r.currency.trim(),
    seatsmax: Number(r.seatsmax),
    seatsocc: Number(r.seatsocc),
    cityfrom: r.cityfrom.trim(),
    cityto: r.cityto.trim(),
  }));
  return { carriers, flights };
}
