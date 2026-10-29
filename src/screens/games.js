// ZJUEGOS - Retos y juegos para practicar ABAP.
import { h, esc } from "../ui.js";
import { store } from "../store.js";
import { GAMES, GAME_TYPES, parseFill, fillSolution, sameAnswer, compareOutput, levelFor, MAX_POINTS } from "../games/data.js";
import { STANDARD_TABLES } from "../engine/standard.js";
import { repoContext } from "./se38.js";
import { allTablesForEngine } from "../ddic-repo.js";

const typeOf = (g) => GAME_TYPES.find((t) => t.id === g.type);
const progress = () => (store.data.games ||= {});
const points = () => Object.values(progress()).reduce((a, x) => a + (x.points || 0), 0);

function award(g, firstTry, usedSolution) {
  const pr = progress();
  const cur = pr[g.id] || {};
  if (cur.done) return 0;
  const full = typeOf(g).points;
  const pts = usedSolution ? 0 : firstTry ? full : Math.round(full / 2);
  pr[g.id] = { ...cur, done: true, points: pts, at: new Date().toISOString() };
  store.save();
  return pts;
}

function attempt(g) {
  const pr = progress();
  pr[g.id] = { ...(pr[g.id] || {}), attempts: (pr[g.id]?.attempts || 0) + 1 };
  store.save();
  return pr[g.id].attempts;
}

async function runCode(app, source) {
  const ctx = {
    tables: allTablesForEngine(),
    texts: {},
    seltexts: {},
    user: store.data.settings.user,
    lang: store.data.settings.lang === "E" ? "EN" : "ES",
    decimalNotation: store.data.settings.decimalNotation,
    ...repoContext(),
  };
  const popups = [];
  const alvs = [];
  const ui = {
    status: (t, ty) => popups.push({ type: ty, text: t }),
    popup: async (t) => popups.push({ type: "I", text: t }),
    alv: async (snap) => {
      alvs.push({ rows: snap.rows.length, allFunctions: snap.allFunctions, defaultFunctions: snap.defaultFunctions, header: snap.header, columns: snap.columns.map((c) => c.name) });
      popups.push({ type: "ALV", text: `ALV con ${snap.rows.length} línea(s)` });
    },
    selectionScreen: async (meta, values) => values,
  };
  const res = await app.engine.run({ name: "ZJUEGO", source }, ctx, ui);
  return { ...res, popups, alvs };
}

function codeBlock(code) {
  const pre = h("pre", { class: "g-code game-code" }, code);
  import("../editor.js").then(({ monaco }) =>
    monaco.editor.colorize(code, "abap", {}).then((html) => {
      pre.innerHTML = html;
      pre.classList.add("light");
    }),
  );
  return pre;
}

function badge(g) {
  const pr = progress()[g.id];
  if (pr?.done) return h("span", { class: "badge badge-ok" }, `${pr.points} pts`);
  return h("span", { class: "badge" }, `${typeOf(g).points} pts`);
}

// ---------------------------------------------------------------- pantalla principal
export function gamesScreen(app) {
  return {
    id: "ZJUEGOS",
    tcode: "ZJUEGOS",
    title: "Retos y juegos ABAP",
    toolbar: () => [{ icon: "trophy", label: "Reiniciar puntos", action: async () => {
      const { confirm } = await import("../ui.js");
      if (await confirm("¿Borrar tus puntos y el progreso de los juegos?", "Reiniciar", "Borrar", "Cancelar")) {
        store.data.games = {};
        store.save();
        app.show(app.current());
      }
    } }],
    render(el) {
      const pts = points();
      const lvl = levelFor(pts);
      const doneCount = GAMES.filter((g) => progress()[g.id]?.done).length;
      el.append(
        h(
          "div",
          { class: "games" },
          h(
            "div",
            { class: "games-head" },
            h("span", { class: "ico ico-big ico-trophy" }),
            h(
              "div",
              { class: "gh-main" },
              h("div", { class: "gh-level" }, lvl.name),
              h("div", { class: "gh-pts" }, `${pts} de ${MAX_POINTS} puntos · ${doneCount} de ${GAMES.length} retos completados`),
              h("div", { class: "progress" }, h("div", { class: "progress-bar", style: { width: (pts / MAX_POINTS) * 100 + "%" } })),
              lvl.next ? h("div", { class: "muted small" }, `Siguiente nivel: ${lvl.next[1]} (${lvl.next[0]} puntos)`) : h("div", { class: "muted small" }, "Nivel máximo alcanzado"),
            ),
          ),
          h("p", { class: "hint" }, "Los puntos completos se ganan resolviendo al primer intento; con más intentos ganas la mitad, y si ves la solución no suma puntos."),
          [...GAME_TYPES, { id: "guide", title: "Hazlo tú (de las guías)", desc: "Los ejercicios sin código para copiar que cierran cada paso de la guía.", icon: "guide", points: 30 }].map((t) => {
            const list = t.id === "guide" ? GAMES.filter((g) => g.guide) : GAMES.filter((g) => g.type === t.id && !g.guide);
            const d = list.filter((g) => progress()[g.id]?.done).length;
            return h(
              "section",
              { class: "game-type" },
              h("div", { class: "gt-head" }, h("span", { class: "ico ico-" + t.icon }), h("h2", {}, t.title), h("span", { class: "muted small" }, `${d}/${list.length} · ${t.points} pts cada uno`)),
              h("p", { class: "muted" }, t.desc),
              h(
                "div",
                { class: "game-cards" },
                list.map((g) =>
                  h(
                    "button",
                    { class: "game-card" + (progress()[g.id]?.done ? " done" : ""), onclick: () => app.push(gameScreen(app, g)) },
                    h("span", { class: "gc-level" }, g.level),
                    h("span", { class: "gc-title" }, g.title),
                    badge(g),
                  ),
                ),
              ),
            );
          }),
        ),
      );
    },
  };
}

// ---------------------------------------------------------------- un reto
function nextGame(g) {
  const i = GAMES.indexOf(g);
  return GAMES.slice(i + 1).find((x) => !progress()[x.id]?.done) || GAMES.slice(0, i).find((x) => !progress()[x.id]?.done) || null;
}

export function gameScreen(app, g) {
  const t = typeOf(g);
  let resultEl;
  let editor = null;
  let usedSolution = false;
  let checkFn = () => {};
  let showSolution = () => {};
  let hintEl = null;
  // la pista se muestra en un recuadro visible dentro del reto (y en la barra de estado)
  const showHint = (text) => {
    app.status("Pista mostrada en el recuadro amarillo", "I");
    if (!hintEl) return;
    hintEl.replaceChildren(h("span", { class: "ico ico-bulb" }), h("div", {}, h("b", {}, "Pista"), h("div", { html: text })));
    hintEl.classList.remove("show");
    void hintEl.offsetWidth;
    hintEl.classList.add("show");
    hintEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  let hintFn = () => showHint(g.hint || "Lee con atención el enunciado y la explicación de cada instrucción.");

  const success = (pts, extra) => {
    const nx = nextGame(g);
    resultEl.replaceChildren(
      h(
        "div",
        { class: "game-result ok" },
        h("div", { class: "gr-title" }, pts > 0 ? `Correcto: +${pts} puntos` : progress()[g.id]?.done ? "Correcto" : "Correcto"),
        g.explain ? h("p", {}, g.explain) : null,
        extra || null,
        h("div", { class: "row" }, nx ? h("button", { class: "btn btn-primary", onclick: () => { const cur = app.stack.pop(); cur?.destroy?.(); app.push(gameScreen(app, nx)); } }, "Siguiente reto: " + nx.title) : h("span", { class: "ok" }, "¡Completaste todos los retos!"), h("button", { class: "btn", onclick: () => app.back() }, "Volver a la lista")),
      ),
    );
    app.status(pts > 0 ? `Reto superado: +${pts} puntos` : "Reto superado", "S");
  };
  const failure = (title, body) => {
    resultEl.replaceChildren(h("div", { class: "game-result bad" }, h("div", { class: "gr-title" }, title), body));
  };

  const outputTable = (cmp) =>
    h(
      "div",
      { class: "out-compare" },
      h("div", {}, h("div", { class: "oc-title" }, "Salida esperada"), h("pre", { class: "list-out small-list" }, cmp.expected.join("\n") || "(vacía)")),
      h(
        "div",
        {},
        h("div", { class: "oc-title" }, "Salida de tu programa"),
        h(
          "pre",
          { class: "list-out small-list" },
          cmp.got.length
            ? cmp.got.map((l, i) => h("div", { class: l === cmp.expected[i] ? "ln-ok" : "ln-bad" }, l || " "))
            : "(vacía)",
        ),
      ),
    );

  const renderBody = (el) => {
    el.append(h("div", { class: "game-head" }, h("span", { class: "ico ico-" + t.icon }), h("span", { class: "muted" }, t.title + " · " + g.level), badge(g)));
    el.append(h("h2", { class: "game-title" }, g.title));
    if (g.text) el.append(h("p", { class: "game-text", html: g.text }));
    hintEl = h("div", { class: "hint-box-game" });
    el.append(hintEl);

    if (g.type === "fill") {
      const parts = parseFill(g.code);
      const inputs = [];
      const codeEl = h(
        "pre",
        { class: "fill-code" },
        parts.map((p) => {
          if (!p.blank) return p.text;
          const inp = h("input", { class: "fill-input", style: { width: p.size + 1.5 + "ch" }, spellcheck: "false", autocomplete: "off", oninput: (e) => e.target.classList.remove("ok", "bad", "hinted") });
          inp.answers = p.answers;
          inputs.push(inp);
          return inp;
        }),
      );
      el.append(codeEl);
      setTimeout(() => inputs[0]?.focus(), 30);
      codeEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          checkFn();
        }
      });
      checkFn = async () => {
        let ok = 0;
        for (const inp of inputs) {
          const good = sameAnswer(inp.value, inp.answers);
          inp.classList.toggle("ok", good);
          inp.classList.toggle("bad", !good);
          if (good) ok++;
        }
        const tries = attempt(g);
        if (ok === inputs.length) {
          const pts = award(g, tries === 1, usedSolution);
          const out = h("div", { class: "fill-run" }, h("div", { class: "muted small" }, "Ejecutando tu programa..."));
          success(pts, out);
          const r = await runCode(app, fillSolution(g.code));
          out.replaceChildren(h("div", { class: "oc-title" }, "Así queda la salida del programa:"), h("pre", { class: "list-out small-list" }, (r.list || []).join("\n") || r.popups.map((x) => x.text).join("\n") || "(sin salida)"));
        } else {
          failure(`${ok} de ${inputs.length} correctos`, h("p", {}, "Los huecos en rojo no son correctos. Revisa la sintaxis e inténtalo de nuevo."));
        }
      };
      showSolution = () => {
        usedSolution = true;
        inputs.forEach((inp) => {
          inp.value = inp.answers[0];
          inp.classList.remove("bad");
        });
        app.status("Solución mostrada: este reto ya no suma puntos", "W");
      };
      hintFn = () => {
        const first = inputs.find((inp) => !sameAnswer(inp.value, inp.answers));
        if (!first) return showHint("Todos los huecos parecen correctos: pulsa <b>Comprobar</b> (F8).");
        first.focus();
        first.classList.add("hinted");
        const ans = first.answers[0];
        const n = inputs.indexOf(first) + 1;
        showHint(`Hueco ${n} de ${inputs.length} (marcado en amarillo): la respuesta empieza por <code>${esc(ans.substring(0, 1).toUpperCase())}</code> y tiene ${ans.length} carácter(es).` + (g.text ? `<br><span class="muted">Recuerda el objetivo: ${g.text}</span>` : ""));
      };
    } else if (g.type === "predict") {
      el.append(codeBlock(g.code));
      el.append(h("p", { class: "game-text" }, "¿Qué escribe este programa en la lista?"));
      const opts = h(
        "div",
        { class: "predict-opts" },
        g.options.map((o, i) =>
          h(
            "button",
            {
              class: "predict-opt",
              onclick: (e) => {
                const tries = attempt(g);
                if (i === g.answer) {
                  e.currentTarget.classList.add("ok");
                  const pts = award(g, tries === 1, usedSolution);
                  success(pts);
                } else {
                  e.currentTarget.classList.add("bad");
                  failure("No es correcto", h("p", {}, "Vuelve a leer el código línea por línea. Puedes copiarlo en SE38 y usar el depurador para comprobarlo."));
                }
              },
            },
            h("span", { class: "po-letter" }, "ABCD"[i]),
            h("span", { class: "mono" }, o),
          ),
        ),
      );
      el.append(opts);
      checkFn = () => app.status("Elige una de las opciones", "I");
      showSolution = () => {
        usedSolution = true;
        opts.children[g.answer].classList.add("ok");
        resultEl.replaceChildren(h("div", { class: "game-result" }, h("p", {}, g.explain)));
      };
      hintFn = () => showHint("Sigue el valor de cada variable instrucción por instrucción, como haría el depurador. Si quieres comprobarlo, copia el código en SE38 y ejecútalo con el botón <b>Depurar</b>.");
    } else {
      // corregir o programar: editor + ejecución
      const draft = progress()[g.id]?.draft;
      const initial = draft ?? (g.type === "fix" ? g.code : g.starter);
      const expected = g.expected ? (typeof g.expected === "function" ? g.expected(app.engine) : g.expected) : null;
      if (expected) el.append(h("div", { class: "oc-title" }, "Salida esperada"), h("pre", { class: "list-out small-list expected" }, expected.join("\n")));
      else if (g.expectedText) el.append(h("div", { class: "oc-title" }, "Resultado esperado"), h("div", { class: "list-out small-list expected" }, typeof g.expectedText === "function" ? g.expectedText(app.engine) : g.expectedText));
      const host = h("div", { class: "game-editor" });
      el.append(host);
      import("../editor.js").then(({ createEditor }) => {
        editor = createEditor(host, initial, false);
        editor.updateOptions({ glyphMargin: false, fontSize: 13.5 });
        editor.onDidChangeModelContent(() => {
          const pr = progress();
          pr[g.id] = { ...(pr[g.id] || {}), draft: editor.getValue() };
          clearTimeout(host._t);
          host._t = setTimeout(() => store.save(), 500);
        });
        editor.focus();
      });
      checkFn = async () => {
        if (!editor) return;
        const src = editor.getValue();
        if (!/^\s*(REPORT|PROGRAM)\b/im.test(src)) return failure("Falta la instrucción REPORT", h("p", {}, "Todo programa ejecutable empieza con REPORT nombre."));
        resultEl.replaceChildren(h("div", { class: "game-result" }, h("span", { class: "spinner" }), " Ejecutando..."));
        const r = await app.busy("Comprobando tu programa...", () => runCode(app, src), 200);
        const tries = attempt(g);
        if (r.status === "syntax") {
          const { setMarkers } = await import("../editor.js");
          setMarkers(editor, r.errors);
          return failure(
            "Error de sintaxis",
            h("table", { class: "err-table" }, r.errors.map((e) => h("tr", { onclick: () => { editor.revealLineInCenter(e.row); editor.setPosition({ lineNumber: e.row, column: e.col }); editor.focus(); } }, h("td", { class: "num" }, "Línea " + e.row), h("td", {}, e.message)))),
          );
        }
        const { setMarkers } = await import("../editor.js");
        setMarkers(editor, []);
        if (r.status === "dump") return failure("Error en tiempo de ejecución: " + r.dump.error, h("p", {}, r.dump.title + ". " + r.dump.text));
        for (const [re, msg] of g.mustContain || []) {
          if (!new RegExp(re, "i").test(src)) return failure("Aún no cumple el enunciado", h("p", {}, msg));
        }
        if (g.check) {
          const c = g.check(r, app.engine);
          if (c.ok) return success(award(g, tries === 1, usedSolution));
          return failure("Aún no está bien", h("p", {}, c.msg));
        }
        const cmp = compareOutput(r.list || [], expected);
        if (cmp.ok) {
          const pts = award(g, tries === 1, usedSolution);
          success(pts, outputTable(cmp));
        } else {
          failure("La salida no coincide", h("div", {}, h("p", { class: "muted small" }, "Se comparan las líneas sin tener en cuenta espacios de más ni separadores de miles. Las líneas en rojo son distintas."), outputTable(cmp)));
        }
      };
      showSolution = async () => {
        const { confirm } = await import("../ui.js");
        if (!progress()[g.id]?.done && !(await confirm("Si ves la solución, este reto ya no sumará puntos. ¿Mostrarla?", "Ver solución", "Mostrar", "Cancelar"))) return;
        usedSolution = true;
        editor?.setValue(g.solution);
      };
    }
    resultEl = h("div", { class: "game-result-host" });
    el.append(resultEl);
  };

  return {
    id: "ZJUEGO-" + g.id,
    tcode: "ZJUEGOS",
    cls: "game-screen",
    title: () => `Reto: ${g.title}`,
    toolbar: () => [
      g.type === "predict" ? null : { icon: "exec", label: "Comprobar", key: "F8", action: () => checkFn(), primary: true },
      { icon: "bulb", label: "Pista", action: () => hintFn() },
      { icon: "display", label: "Ver solución", action: () => showSolution() },
    ].filter(Boolean),
    render(el) {
      const wrap = h("div", { class: "game" });
      el.append(wrap);
      renderBody(wrap);
    },
    destroy() {
      editor?.dispose();
    },
  };
}
