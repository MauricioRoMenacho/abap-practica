// Pretty Printer (Shift+F1): sangría y palabras clave en mayúsculas.
import * as abaplint from "@abaplint/core";

export function prettyPrint(source) {
  const reg = new abaplint.Registry().addFile(new abaplint.MemoryFile("zpretty.prog.abap", source));
  reg.parse();
  const file = reg.getFirstObject()?.getABAPFiles()[0];
  if (!file) return null;
  const hasParserError = file.getStatements().some((s) => s.get() instanceof abaplint.Unknown);
  if (hasParserError) return null;
  const conf = abaplint.Config.getDefault();
  return new abaplint.PrettyPrinter(file, conf).run();
}
