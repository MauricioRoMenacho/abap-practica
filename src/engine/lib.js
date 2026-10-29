// Fuentes ABAP de la "biblioteca estándar" del simulador (excepciones, SALV...)
const raw = import.meta.glob("./abaplib/*", { query: "?raw", import: "default", eager: true });
export const libFiles = Object.entries(raw).map(([path, contents]) => ({ filename: path.split("/").pop(), contents }));
