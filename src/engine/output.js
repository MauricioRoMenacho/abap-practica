// Salida de listas (WRITE) con el formato de un sistema SAP.

export class ListOutput {
  constructor() {
    this.out = [];
    this.cur = null;
  }
  write(text, newLine) {
    if (newLine || this.cur === null) {
      if (this.cur !== null) this.out.push(this.cur);
      this.cur = text;
    } else {
      this.cur += (this.cur.length > 0 ? " " : "") + text;
    }
  }
  skip(n = 1) {
    if (this.cur !== null) this.out.push(this.cur);
    this.cur = null;
    for (let i = 0; i < n; i++) this.out.push("");
  }
  lines() {
    const l = [...this.out];
    if (this.cur !== null) l.push(this.cur);
    return l.map((x) => x.replace(/\s+$/, ""));
  }
}

export function groupDigits(intPart, sep) {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export function formatNumber(num, decimals, notation) {
  // notation: "X" -> 1,234.56   " " -> 1.234,56
  const neg = Number(num) < 0;
  const abs = Math.abs(Number(num));
  let s = abs.toFixed(decimals);
  let [i, d] = s.split(".");
  const thousand = notation === " " ? "." : ",";
  const dec = notation === " " ? "," : ".";
  i = groupDigits(i, thousand);
  return (d !== undefined ? i + dec + d : i) + (neg ? "-" : "");
}

export function formatDate(raw) {
  const s = String(raw || "").padEnd(8, "0");
  return `${s.substring(6, 8)}.${s.substring(4, 6)}.${s.substring(0, 4)}`;
}

export function formatTime(raw) {
  const s = String(raw || "").padEnd(6, "0");
  return `${s.substring(0, 2)}:${s.substring(2, 4)}:${s.substring(4, 6)}`;
}

export function formatValue(source, abap, options, ctx) {
  const T = abap.types;
  const notation = ctx?.decimalNotation ?? "X";
  if (typeof source === "string" || typeof source === "number") return String(source);
  if (T.FieldSymbol && source instanceof T.FieldSymbol) {
    const p = source.getPointer();
    if (p) return formatValue(p, abap, options, ctx);
  }
  if (source instanceof T.Structure) {
    return Object.values(source.get())
      .map((v) => formatValue(v, abap, options, ctx))
      .join("");
  }
  if (source instanceof T.Date) return formatDate(source.get());
  if (source instanceof T.Time) return formatTime(source.get());
  if (source instanceof T.Numc) return String(source.get());
  if (source instanceof T.Character) return String(source.get());
  if (source instanceof T.Packed) {
    const d = source.getDecimals();
    const len = source.getLength();
    const width = 2 * len + (d > 0 ? 1 : 0) + Math.floor((2 * len - 1 - d - 1) / 3);
    return formatNumber(source.get(), d, notation).padStart(width);
  }
  if (T.Integer8 && source instanceof T.Integer8) {
    return formatNumber(source.get(), 0, notation).padStart(20);
  }
  if (source instanceof T.Integer) {
    return formatNumber(source.get(), 0, notation).padStart(11);
  }
  if (source instanceof T.Float) {
    const v = Number(source.get());
    return v
      .toExponential(16)
      .replace(/e([+-])(\d)$/, "E$10$2")
      .replace("e", "E")
      .padStart(24);
  }
  if (source.get) return String(source.get());
  return String(source);
}
