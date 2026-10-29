// Editor ABAP basado en Monaco con resaltado de sintaxis estilo SE38.
import * as monaco from "monaco-editor/esm/vs/editor/edcore.main";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };

const KEYWORDS = `abap_true abap_false abstract add alias aliases all and append appending as ascending assign assigning at authority-check back before begin binary block bt by call case cast catch changing check class class-data class-methods clear close cnt collect commit concatenate condense constants continue corresponding count create currency data default define definition delete deleting demand descending describe display distinct div do duplicates else elseif end endat endcase endclass endtry enddo endform endfunction endif endinterface endloop endmethod endmodule endon endselect endwhile end-of-selection end-of-page eq exception exceptions exit exiting export exporting extract fetch field field-symbols fields final find first for form format frame free from function ge get group gt handle having hide if implementation import importing in include index initial initialization inner insert instance interface interfaces into is join key le leave left length like line lines load-of-program local loop lower lt mesh message method methods mod modify module move multiply ne new new-line new-page next no not obligatory occurs of on open optional or order others output parameters perform private protected public raise raising range ranges read receiving redefinition ref refresh reject replace report reporting respecting return returning right rollback rows search select select-options selection-screen set shift single skip sort split standard start-of-selection starting static statics structure submit subtract sum supply suppress table tables test text then title to top-of-page transporting try type types uline unassign unique up update upper using value values when where while with work write zero xor sorted hashed empty character byte mode inheriting abstract final create checkbox radiobutton group lower case options cp eq ne co cn ca na cs ns bt nb incl excl decimals redefinition super me interface interfaces endinterface raise exception inheriting protected private public section method methods class-methods class-data constructor reduce filter cond switch conv corresponding base for next init let in join inner outer left as group by having up to rows single collect assigning field-symbol hashed sorted unique non-unique break-point read-only optional default`.split(/\s+/);

monaco.languages.register({ id: "abap" });
monaco.languages.setLanguageConfiguration("abap", {
  comments: { lineComment: '"' },
  brackets: [
    ["(", ")"],
    ["[", "]"],
  ],
  autoClosingPairs: [
    { open: "(", close: ")" },
    { open: "[", close: "]" },
    { open: "'", close: "'", notIn: ["string", "comment"] },
    { open: "`", close: "`", notIn: ["string", "comment"] },
    { open: "|", close: "|", notIn: ["string", "comment"] },
  ],
});
monaco.languages.setMonarchTokensProvider("abap", {
  ignoreCase: true,
  keywords: KEYWORDS,
  tokenizer: {
    root: [
      [/^\*.*$/, "comment"],
      [/".*$/, "comment"],
      [/'([^']|'')*'/, "string"],
      [/`([^`]|``)*`/, "string"],
      [/\|/, { token: "string.template", next: "@template" }],
      [/\b\d+\b/, "number"],
      [/[a-zA-Z_][\w\-]*(?=\s*[.(]?)/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
      [/[a-zA-Z_][\w]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
    ],
    template: [
      [/\{/, { token: "delimiter", next: "@templateExpr" }],
      [/\|/, { token: "string.template", next: "@pop" }],
      [/[^|{]+/, "string.template"],
    ],
    templateExpr: [
      [/\}/, { token: "delimiter", next: "@pop" }],
      [/[a-zA-Z_][\w\-]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }],
      [/./, "identifier"],
    ],
  },
});

monaco.editor.defineTheme("se38", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "0b3d91", fontStyle: "bold" },
    { token: "comment", foreground: "7a7a7a", fontStyle: "italic" },
    { token: "string", foreground: "2a7a2a" },
    { token: "string.template", foreground: "2a7a2a" },
    { token: "number", foreground: "0f6e9c" },
  ],
  colors: {
    "editor.lineHighlightBackground": "#eef5fc",
    "editorLineNumber.foreground": "#8a9ab0",
    "editorGutter.background": "#f4f7fb",
  },
});

// autocompletado básico de palabras clave y snippets frecuentes
monaco.languages.registerCompletionItemProvider("abap", {
  provideCompletionItems(model, position) {
    const word = model.getWordUntilPosition(position);
    const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
    const kw = KEYWORDS.filter((k) => /^[a-z]/.test(k)).map((k) => ({ label: k.toUpperCase(), kind: monaco.languages.CompletionItemKind.Keyword, insertText: k.toUpperCase(), range }));
    const snip = (label, text, doc) => ({ label, kind: monaco.languages.CompletionItemKind.Snippet, insertText: text, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: doc, range });
    return {
      suggestions: [
        ...kw,
        snip("loop", "LOOP AT ${1:lt_tabla} INTO DATA(${2:ls_linea}).\n  $0\nENDLOOP.", "LOOP AT ... ENDLOOP"),
        snip("if", "IF ${1:condicion}.\n  $0\nENDIF.", "IF ... ENDIF"),
        snip("try", "TRY.\n    $0\n  CATCH ${1:cx_root} INTO DATA(${2:lx_error}).\n    MESSAGE ${2:lx_error}->get_text( ) TYPE 'I'.\nENDTRY.", "TRY ... CATCH"),
        snip("select", "SELECT * FROM ${1:tabla} INTO TABLE @DATA(${2:lt_datos})\n  WHERE ${3:campo} = @${4:valor}.", "SELECT ... INTO TABLE"),
        snip("salv", "DATA lo_alv TYPE REF TO cl_salv_table.\nTRY.\n    cl_salv_table=>factory(\n      IMPORTING r_salv_table = lo_alv\n      CHANGING  t_table      = ${1:lt_datos} ).\n    lo_alv->get_functions( )->set_all( abap_true ).\n    lo_alv->display( ).\n  CATCH cx_salv_msg INTO DATA(lx_salv).\n    MESSAGE lx_salv->get_text( ) TYPE 'E'.\nENDTRY.", "ALV con CL_SALV_TABLE"),
        snip("class", "CLASS ${1:lcl_clase} DEFINITION.\n  PUBLIC SECTION.\n    METHODS ${2:metodo}.\nENDCLASS.\n\nCLASS ${1:lcl_clase} IMPLEMENTATION.\n  METHOD ${2:metodo}.\n    $0\n  ENDMETHOD.\nENDCLASS.", "Clase local"),
        snip("form", "FORM ${1:nombre}.\n  $0\nENDFORM.", "Subrutina FORM"),
      ],
    };
  },
});

export function createEditor(el, value, readOnly) {
  const editor = monaco.editor.create(el, {
    value,
    language: "abap",
    theme: "se38",
    readOnly,
    fontFamily: "'Cascadia Mono', 'Consolas', 'Courier New', monospace",
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderWhitespace: "none",
    tabSize: 2,
    wordBasedSuggestions: "off",
    rulers: [72],
    glyphMargin: true,
  });
  window.__editor = editor;
  return editor;
}

export function setMarkers(editor, errors) {
  monaco.editor.setModelMarkers(
    editor.getModel(),
    "abap",
    errors.map((e) => ({
      startLineNumber: e.row,
      startColumn: e.col,
      endLineNumber: e.endRow || e.row,
      endColumn: e.endCol && (e.endRow !== e.row || e.endCol > e.col) ? e.endCol : e.col + 1,
      message: e.message,
      severity: monaco.MarkerSeverity.Error,
    })),
  );
}

export { monaco };
