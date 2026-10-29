// Marco tipo SAP GUI: barra de menú, campo de comandos, barra de título,
// barra de aplicación, área de trabajo y barra de estado.
import { h, dialog, info, confirm, download } from "./ui.js";
import { store } from "./store.js";

const KEY_LABELS = {
  F3: "F3",
  "Shift+F3": "Shift+F3",
  F8: "F8",
  F12: "F12",
  "Ctrl+S": "Ctrl+S",
  "Ctrl+F1": "Ctrl+F1",
  "Ctrl+F2": "Ctrl+F2",
  "Ctrl+F3": "Ctrl+F3",
  "Shift+F1": "Shift+F1",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F2: "F2",
};

function keyName(e) {
  let k = e.key;
  if (k.length === 1) k = k.toUpperCase();
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.shiftKey && k.length > 1) parts.push("Shift");
  parts.push(k);
  return parts.join("+");
}

export class App {
  constructor(root, { transactions, guide }) {
    this.root = root;
    this.transactions = transactions; // { SE38: (app, args) => screen }
    this.stack = [];
    this.guideFactory = guide;
    this.build();
    document.addEventListener("keydown", (e) => this.onKey(e), true);
  }

  build() {
    this.cmd = h("input", {
      class: "cmd-input",
      placeholder: "",
      title: "Campo de comandos: escribe una transacción (SE38, SE11, SE16, SE84) y pulsa Enter",
      spellcheck: "false",
      onkeydown: (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const v = this.cmd.value.trim();
          this.cmd.value = "";
          if (v) this.command(v);
          else this.current()?.onEnter?.();
        }
      },
    });
    this.titleEl = h("div", { class: "titlebar" });
    this.appToolbar = h("div", { class: "apptoolbar" });
    this.content = h("div", { class: "content" });
    this.statusMsg = h("div", { class: "status-msg" });
    this.statusInfo = h("div", { class: "status-info" });
    this.guideHost = h("aside", { class: "guide-host" });

    const menu = (label, items) =>
      h(
        "div",
        { class: "menu" },
        h("button", { class: "menu-btn" }, label),
        h(
          "div",
          { class: "menu-pop" },
          items.map((it) => (it === "-" ? h("div", { class: "menu-sep" }) : h("button", { class: "menu-item", onclick: () => it[1]() }, it[0]))),
        ),
      );

    const stdBtn = (icon, title, fn, extra = "") => h("button", { class: "std-btn " + extra, title, onclick: fn }, h("span", { class: "ico ico-" + icon }));

    this.root.append(
      h(
        "div",
        { class: "shell" },
        h(
          "div",
          { class: "menubar" },
          h("div", { class: "brand", title: "Práctica ABAP" }, h("span", { class: "brand-logo" }, "ABAP"), h("span", { class: "brand-sub" }, "Práctica")),
          menu("Pasar a", [
            ["SE38 - Editor ABAP", () => this.command("/nSE38")],
            ["SE11 - Diccionario ABAP", () => this.command("/nSE11")],
            ["SE16 - Browser de datos", () => this.command("/nSE16")],
            ["SE84 - Sistema info repositorio", () => this.command("/nSE84")],
            "-",
            ["Menú SAP Easy Access", () => this.home()],
          ]),
          menu("Sistema", [
            ["Usuario e idioma...", () => this.userSettings()],
            "-",
            ["Exportar mis datos (respaldo)", () => this.exportData()],
            ["Importar datos...", () => this.importData()],
            ["Restaurar datos de las tablas estándar", () => this.resetFlights()],
            ["Borrar todo y empezar de cero", () => this.resetAll()],
          ]),
          menu("Ayuda", [
            ["Atajos de teclado", () => this.shortcuts()],
            ["Qué soporta el simulador", () => this.limits()],
            ["Acerca de", () => this.about()],
          ]),
          h("div", { class: "menubar-spacer" }),
          h("button", { class: "guide-toggle", onclick: () => this.toggleGuide() }, h("span", { class: "ico ico-guide" }), "Guía de práctica"),
        ),
        h(
          "div",
          { class: "stdtoolbar" },
          h("button", { class: "std-btn enter-btn", title: "Intro (Enter)", onclick: () => this.cmd.value.trim() ? this.cmd.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" })) : this.current()?.onEnter?.() }, h("span", { class: "ico ico-enter" })),
          h("div", { class: "cmd-wrap" }, this.cmd),
          h("div", { class: "std-sep" }),
          stdBtn("save", "Grabar (Ctrl+S)", () => this.trigger("Ctrl+S")),
          h("div", { class: "std-sep" }),
          stdBtn("back", "Atrás (F3)", () => this.back(), "back"),
          stdBtn("exit", "Finalizar (Shift+F3)", () => this.exitTransaction(), "exit"),
          stdBtn("cancel", "Cancelar (F12)", () => this.back(), "cancel"),
          h("div", { class: "std-sep" }),
          stdBtn("help", "Ayuda", () => this.shortcuts()),
        ),
        this.titleEl,
        this.appToolbar,
        h("div", { class: "main" }, this.content, this.guideHost),
        (this.statusbar = h("div", { class: "statusbar" }, h("div", { class: "progress-line" }), this.statusMsg, this.statusInfo)),
      ),
    );
    this.updateStatusInfo();
    this.guide = this.guideFactory(this, this.guideHost);
    const open = localStorage.getItem("abapp.guideOpen");
    if (open !== "0") this.guideHost.classList.add("open");
  }

  toggleGuide(force) {
    const open = force ?? !this.guideHost.classList.contains("open");
    this.guideHost.classList.toggle("open", open);
    localStorage.setItem("abapp.guideOpen", open ? "1" : "0");
  }

  updateStatusInfo() {
    const s = store.data.settings;
    this.statusInfo.replaceChildren(
      h("span", { class: "si" }, "NPL (1) 100"),
      h("span", { class: "si" }, s.user),
      h("span", { class: "si", title: "Idioma de inicio de sesión" }, s.lang === "E" ? "EN" : "ES"),
      h("span", { class: "si" }, this.current()?.tcode || ""),
    );
  }

  // ---------------- navegación ----------------
  current() {
    return this.stack[this.stack.length - 1];
  }

  async push(screen) {
    const cur = this.current();
    if (cur) cur.hidden?.();
    this.stack.push(screen);
    this.show(screen);
  }

  show(screen) {
    this.content.replaceChildren();
    this.content.className = "content " + (screen.cls || "");
    screen.render(this.content, this);
    this.refreshChrome();
    if (screen.tcode) store.data.visited[screen.tcode] = true;
    if (screen.id) store.data.visited[screen.id] = true;
    store.save();
    setTimeout(() => {
      if (screen.focus) screen.focus();
      else {
        const f = this.content.querySelector("[autofocus], input:not([readonly]):not([type=radio]):not([type=checkbox]), select");
        f?.focus();
      }
    }, 20);
  }

  refreshChrome() {
    const s = this.current();
    if (!s) return;
    const title = typeof s.title === "function" ? s.title() : s.title;
    this.titleEl.textContent = title || "";
    document.title = (title ? title + " · " : "") + "Práctica ABAP";
    const items = s.toolbar ? s.toolbar() : [];
    this.appToolbar.replaceChildren(
      ...items.map((it) =>
        it === "-"
          ? h("div", { class: "app-sep" })
          : h(
              "button",
              {
                class: "app-btn" + (it.primary ? " primary" : ""),
                title: (it.tip || it.label || "") + (it.key ? ` (${KEY_LABELS[it.key] || it.key})` : ""),
                disabled: it.disabled,
                onclick: () => it.action(),
              },
              it.icon ? h("span", { class: "ico ico-" + it.icon }) : null,
              it.label ? h("span", {}, it.label) : null,
            ),
      ),
    );
    this.updateStatusInfo();
  }

  async back() {
    const cur = this.current();
    if (!cur) return;
    if (cur.onBack) {
      const handled = await cur.onBack();
      if (handled) return;
    }
    if (cur.canLeave && !(await cur.canLeave())) return;
    if (this.stack.length <= 1) return;
    this.stack.pop();
    cur.destroy?.();
    const prev = this.current();
    this.show(prev);
    prev.resumed?.();
  }

  async exitTransaction() {
    // vuelve al menú inicial
    const cur = this.current();
    if (cur?.canLeave && !(await cur.canLeave())) return;
    this.home();
  }

  home() {
    for (const s of this.stack) s.destroy?.();
    this.stack = [];
    this.push(this.transactions.HOME(this));
  }

  async command(raw) {
    let v = raw.trim().toUpperCase();
    let fresh = false;
    if (v.startsWith("/N")) {
      fresh = true;
      v = v.substring(2).trim();
    } else if (v.startsWith("/O")) {
      v = v.substring(2).trim();
      window.open(location.pathname + "#" + v, "_blank");
      return;
    }
    if (v === "" && fresh) return this.home();
    if (v === "/I") return;
    const t = this.transactions[v];
    if (!t || v === "HOME") {
      this.status(`La transacción ${v} no existe`, "E");
      return;
    }
    const cur = this.current();
    if (cur?.canLeave && !(await cur.canLeave())) return;
    if (fresh || this.stack.length > 0) {
      // en SAP, una transacción nueva reemplaza la actual
      for (const s of this.stack.slice(1)) s.destroy?.();
      this.stack = this.stack.slice(0, 1);
    }
    this.status("");
    this.push(t(this));
  }

  // ---------------- teclado ----------------
  trigger(key) {
    const s = this.current();
    if (!s) return false;
    const items = s.toolbar ? s.toolbar() : [];
    const it = items.find((i) => i !== "-" && i.key === key && !i.disabled);
    if (it) {
      it.action();
      return true;
    }
    if (s.keys?.[key]) {
      s.keys[key]();
      return true;
    }
    return false;
  }

  onKey(e) {
    if (document.querySelector(".dlg-overlay")) return;
    const k = keyName(e);
    if (k === "F3" || k === "F12") {
      e.preventDefault();
      e.stopPropagation();
      this.back();
      return;
    }
    if (k === "Shift+F3") {
      e.preventDefault();
      this.exitTransaction();
      return;
    }
    if (k === "Enter" && e.target instanceof HTMLInputElement && this.content.contains(e.target) && e.target.type !== "checkbox" && e.target.type !== "radio") {
      const cur = this.current();
      if (cur?.onEnter) {
        e.preventDefault();
        cur.onEnter();
      }
      return;
    }
    if (k === "Ctrl+/" || k === "Ctrl+7") {
      e.preventDefault();
      this.cmd.focus();
      return;
    }
    if (/^(F\d+|Shift\+F\d+|Ctrl\+F\d+|Ctrl\+S)$/.test(k)) {
      if (k === "F4") return; // ayuda de búsqueda: la maneja cada campo
      if (this.trigger(k)) {
        e.preventDefault();
        e.stopPropagation();
      } else if (/^F\d+$|^Ctrl\+F\d+$|^Ctrl\+S$/.test(k) && k !== "F5" && k !== "F11") e.preventDefault();
    }
  }

  // ---------------- barra de estado ----------------
  // indicador de proceso en la barra de estado (como el reloj de SAP)
  async busy(text, fn, minMs = 450) {
    this.statusMsg.className = "status-msg st-busy";
    this.statusMsg.replaceChildren(h("span", { class: "spinner" }), h("span", {}, text));
    this.statusbar.classList.add("working");
    document.body.classList.add("busy");
    // dejar que el navegador pinte el indicador antes del trabajo pesado
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, minMs));
    try {
      return await fn();
    } finally {
      this.statusbar.classList.remove("working");
      document.body.classList.remove("busy");
      if (this.statusMsg.classList.contains("st-busy")) this.status("");
    }
  }

  status(text, type = "S") {
    clearTimeout(this.statusTimer);
    this.statusMsg.className = "status-msg" + (text ? " st-" + type : "");
    this.statusMsg.replaceChildren(text ? h("span", { class: "st-ico" }) : "", text ? h("span", {}, text) : "");
    this.statusMsg.classList.remove("flash");
    void this.statusMsg.offsetWidth;
    if (text) this.statusMsg.classList.add("flash");
  }

  // ---------------- menú Sistema / Ayuda ----------------
  async userSettings() {
    const s = store.data.settings;
    const user = h("input", { class: "sap-input", value: s.user, maxlength: 12 });
    const lang = h("select", { class: "sap-input" }, h("option", { value: "S", selected: s.lang !== "E" }, "ES - Español"), h("option", { value: "E", selected: s.lang === "E" }, "EN - Inglés"));
    const dec = h(
      "select",
      { class: "sap-input" },
      h("option", { value: "X", selected: s.decimalNotation !== " " }, "1,234,567.89"),
      h("option", { value: " ", selected: s.decimalNotation === " " }, "1.234.567,89"),
    );
    const ok = await dialog({
      title: "Ajustes de usuario",
      body: h(
        "div",
        { class: "form-grid" },
        h("label", {}, "Usuario"),
        user,
        h("label", {}, "Idioma de inicio de sesión"),
        lang,
        h("label", {}, "Formato de números"),
        dec,
        h("p", { class: "hint", style: { gridColumn: "1 / -1" } }, "El idioma decide qué traducción de los textos (TEXT-001, textos de selección) se muestra al ejecutar."),
      ),
      buttons: [
        { label: "Guardar", value: true, primary: true },
        { label: "Cancelar", value: false },
      ],
    });
    if (!ok) return;
    s.user = (user.value.trim() || "ALUMNO").toUpperCase().replace(/[^A-Z0-9_]/g, "").substring(0, 12) || "ALUMNO";
    s.lang = lang.value;
    s.decimalNotation = dec.value;
    store.save();
    this.updateStatusInfo();
    this.status("Ajustes grabados", "S");
  }

  exportData() {
    const d = new Date();
    download(`abap-practica-respaldo-${d.toISOString().substring(0, 10)}.json`, store.exportAll(), "application/json");
    this.status("Respaldo descargado en tu carpeta de descargas", "S");
  }

  importData() {
    const inp = h("input", { type: "file", accept: ".json,application/json" });
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      try {
        store.importAll(await f.text());
        await info("Datos importados. La página se recargará.");
        location.reload();
      } catch (e) {
        this.status("No se pudo importar: " + e.message, "E");
      }
    };
    inp.click();
  }

  async resetFlights() {
    if (!(await confirm("¿Restaurar los datos originales de todas las tablas estándar (vuelos, FI, SD, MM, HR)? Tus tablas Z no se tocan."))) return;
    await this.engine.resetStandardData();
    this.status("Datos de las tablas estándar restaurados", "S");
  }

  async resetAll() {
    if (!(await confirm("Se borrarán TODOS tus programas, tablas, datos y progreso de las guías. ¿Continuar?", "Borrar todo", "Borrar todo", "Cancelar"))) return;
    store.resetAll();
    location.reload();
  }

  shortcuts() {
    const rows = [
      ["Enter", "Ejecutar el comando / confirmar"],
      ["F3", "Atrás"],
      ["Shift+F3", "Finalizar (volver al menú)"],
      ["F12 / Esc", "Cancelar"],
      ["F8", "Ejecutar programa"],
      ["Ctrl+S", "Grabar"],
      ["Ctrl+F1", "Visualizar ↔ Modificar"],
      ["Ctrl+F2", "Verificar sintaxis"],
      ["Ctrl+F3", "Activar"],
      ["Shift+F1", "Pretty Printer (formatear código)"],
      ["F5 / F6 / F8", "Depurador: paso a paso / ejecutar sin entrar / continuar"],
      ["Clic en el margen", "Editor: poner o quitar un punto de parada"],
      ["/nSE38", "Abrir una transacción desde cualquier pantalla"],
    ];
    dialog({
      title: "Atajos de teclado",
      body: h("table", { class: "kv" }, rows.map(([k, v]) => h("tr", {}, h("td", {}, h("kbd", {}, k)), h("td", {}, v)))),
    });
  }

  limits() {
    dialog({
      title: "Qué soporta el simulador",
      width: "640px",
      body: h(
        "div",
        { class: "dlg-text" },
        h("p", {}, "El código ABAP se ejecuta en tu navegador gracias al transpilador open source de abaplint (ABAP → JavaScript). Soporta la gran mayoría del ABAP moderno y clásico:"),
        h("ul", {}, h("li", {}, "DATA, TYPES, tablas internas, LOOP, READ TABLE, SORT, expresiones en línea, string templates"), h("li", {}, "Clases locales, interfaces, excepciones TRY/CATCH, FORM/PERFORM"), h("li", {}, "Open SQL: SELECT (con JOIN, GROUP BY, SUM...), INSERT, UPDATE, MODIFY, DELETE sobre tus tablas Z y las estándar"), h("li", {}, "Pantalla de selección: PARAMETERS, SELECT-OPTIONS, bloques, checkbox, radiobuttons"), h("li", {}, "Eventos: INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION, END-OF-SELECTION"), h("li", {}, "ALV con CL_SALV_TABLE (funciones, columnas, orden, totales, cebra, título)"), h("li", {}, "Programas include y depurador (puntos de parada, BREAK-POINT, F5/F6/F8)")),
        h("p", {}, "No disponible por ahora: dynpros (CALL SCREEN), Smartforms/Adobe Forms, funciones RFC/BAPI reales, paquetes y órdenes de transporte."),
        h("p", { class: "hint" }, "Todo se guarda en tu navegador (localStorage). Usa Sistema → Exportar para hacer un respaldo."),
      ),
    });
  }

  about() {
    info("Práctica ABAP: un entorno de entrenamiento con las transacciones principales (SE38, SE11, SE16, SE84) que corre 100% en el navegador. No está afiliado a SAP SE. Motor: abaplint transpiler (MIT).", "Acerca de");
  }
}
