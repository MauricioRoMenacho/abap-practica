// Página de inicio de la plataforma (fuera del sistema SAP) y pantalla de inicio de sesión SAP.
import { h } from "./ui.js";
import { store } from "./store.js";

const SESSION = "abapp.inSystem";
export const inSystem = () => sessionStorage.getItem(SESSION) === "1";

async function progress() {
  const { GUIDES } = await import("./guides.js");
  const done = store.data.guideDone || {};
  const isDone = (s) => !!done[s.id] || !!store.data.manual?.[s.id];
  const track = (pred) => {
    const gs = GUIDES.filter(pred);
    const steps = gs.flatMap((g) => g.steps.map((s) => ({ g, s })));
    return { gs, total: steps.length, ok: steps.filter((x) => isDone(x.s)).length, next: steps.find((x) => !isDone(x.s)), isDone };
  };
  return { abap: track((g) => !g.id.startsWith("u")), ui5: track((g) => g.id.startsWith("u")) };
}

export async function showLanding(app) {
  document.querySelector(".landing")?.remove();
  sessionStorage.removeItem(SESSION);
  const root = h("div", { class: "landing" });
  document.body.append(root);
  document.body.classList.add("on-landing");

  const enter = async ({ tcode, guide } = {}) => {
    const ok = await logon(root);
    if (!ok) return;
    sessionStorage.setItem(SESSION, "1");
    root.remove();
    document.body.classList.remove("on-landing");
    app.updateStatusInfo();
    app.home();
    if (tcode) app.command(tcode);
    if (guide) {
      app.toggleGuide(true);
      app.guide?.goto?.(guide.g, guide.s);
    }
  };

  const p = await progress();
  const games = store.data.games || {};
  const { levelFor, MAX_POINTS } = await import("./games/data.js");
  const points = Object.values(games).reduce((a, g) => a + (g.points || 0), 0);
  const lvl = levelFor(points);
  const exam = store.data.exam || {};

  const track = (key, title, sub, t, tcode) => {
    const pct = t.total ? Math.round((t.ok / t.total) * 100) : 0;
    return h(
      "div",
      { class: "lp-track" },
      h("div", { class: "lp-track-head" }, h("div", {}, h("h3", {}, title), h("p", {}, sub)), h("div", { class: "lp-pct" }, pct + "%")),
      h("div", { class: "lp-bar" }, h("div", { style: { width: pct + "%" } })),
      h("p", { class: "lp-muted" }, `${t.ok} de ${t.total} ejercicios completados`),
      h(
        "div",
        { class: "lp-steps" },
        t.gs.map((g) => {
          const n = g.steps.filter(t.isDone).length;
          return h("button", { class: "lp-step" + (n === g.steps.length ? " full" : n ? " half" : ""), title: `${g.title}: ${g.subtitle} (${n}/${g.steps.length})`, onclick: () => enter({ tcode, guide: { g: g.id } }) }, g.title.replace(/^UI5 /, "").replace("Proyecto final", "Proyecto"));
        }),
      ),
      t.next
        ? h("div", { class: "lp-next" }, h("div", {}, h("span", { class: "lp-muted" }, "Siguiente ejercicio"), h("b", {}, `${t.next.g.title}: ${t.next.s.title}`)), h("button", { class: "lp-btn primary", onclick: () => enter({ tcode, guide: { g: t.next.g.id, s: t.next.s.id } }) }, t.ok ? "Continuar" : "Empezar"))
        : h("div", { class: "lp-next done" }, "Ruta completada"),
    );
  };

  root.append(
    h(
      "header",
      { class: "lp-top" },
      h("div", { class: "lp-brand" }, h("span", { class: "lp-logo" }, "ABAP"), h("span", {}, "Práctica SAP")),
      h("nav", {}, h("a", { href: "#rutas" }, "Rutas"), h("a", { href: "#que" }, "Qué incluye"), h("button", { class: "lp-btn", onclick: () => enter() }, "Entrar al sistema")),
    ),
    h(
      "section",
      { class: "lp-hero" },
      h(
        "div",
        { class: "lp-hero-text" },
        h("h1", {}, "Aprende ABAP y SAPUI5 practicando como en un sistema SAP real"),
        h("p", {}, "Un sistema de práctica en tu navegador: SAP GUI con SE38, SE11, SE16, depurador y ALV, y un entorno tipo Business Application Studio para SAPUI5. Guías paso a paso que se corrigen solas, retos y un proyecto final."),
        h("div", { class: "lp-cta" }, h("button", { class: "lp-btn primary big", onclick: () => enter() }, "Iniciar sesión en SAP"), h("button", { class: "lp-btn big", onclick: () => enter({ tcode: "ZUI5" }) }, "Abrir SAPUI5 (BAS)")),
        h("p", { class: "lp-muted small" }, "Gratis, sin instalar nada y sin cuenta. Tu trabajo se guarda en este navegador."),
      ),
      h(
        "div",
        { class: "lp-hero-art", "aria-hidden": "true" },
        h(
          "div",
          { class: "lp-window" },
          h("div", { class: "lp-win-bar" }, h("i"), h("i"), h("i"), h("span", {}, "ABAP Editor: ZP1_HOLA")),
          h("pre", {}, h("span", { class: "k" }, "REPORT"), " zp1_hola.\n\n", h("span", { class: "k" }, "DATA"), " lv_nombre ", h("span", { class: "k" }, "TYPE"), " string ", h("span", { class: "k" }, "VALUE"), h("span", { class: "s" }, " 'Ana'"), ".\n\n", h("span", { class: "k" }, "WRITE"), ": / ", h("span", { class: "s" }, "'Hola'"), ", lv_nombre,\n       / sy-datum.\n", h("span", { class: "c" }, '" F8: ejecutar   Ctrl+F3: activar')),
        ),
      ),
    ),
    h(
      "section",
      { class: "lp-section", id: "rutas" },
      h("h2", {}, "Tus rutas de aprendizaje"),
      h("div", { class: "lp-tracks" }, track("abap", "Ruta ABAP", "Paso 0 a 7 y proyecto final: del primer programa a ABAP Unit y ATC", p.abap, null), track("ui5", "Ruta SAPUI5 / SAP Fiori", "UI5 Paso 0 a 9, según el temario de la certificación C_FIORD", p.ui5, "ZUI5")),
      h(
        "div",
        { class: "lp-stats" },
        [
          [store.programs().length, "programas creados"],
          [Object.keys(store.data.ui5Projects || {}).length, "proyectos SAPUI5"],
          [`${points} / ${MAX_POINTS}`, `puntos en retos (${lvl.name})`],
          [exam.passed ? "Aprobado" : exam.best ? `${exam.best}/15` : "Pendiente", "examen teórico"],
        ].map(([n, l]) => h("div", { class: "lp-stat" }, h("b", {}, String(n)), h("span", {}, l))),
      ),
    ),
    h(
      "section",
      { class: "lp-section", id: "que" },
      h("h2", {}, "Qué incluye"),
      h(
        "div",
        { class: "lp-features" },
        [
          ["SAP GUI de práctica", "Editor ABAP (SE38) con verificar, activar, Pretty Printer y depurador; diccionario (SE11), datos (SE16), clases (SE24), funciones (SE37), mensajes (SE91)."],
          ["Datos reales de ejemplo", "Modelo de vuelos (SFLIGHT, SBOOK...), ventas, compras, materiales, finanzas y personal para practicar SELECT, JOIN y ALV."],
          ["Guías que se corrigen solas", "Cada ejercicio se marca cuando tu programa funciona. Con explicación de la sintaxis línea por línea."],
          ["Calidad como en proyectos", "ABAP Unit, ATC, traza SQL (ST05), bloqueos (SM12) y un proyecto final con especificación funcional."],
          ["SAPUI5 y Fiori", "Proyectos desde plantillas, vista previa con SAPUI5 real, OData simulado, smart controls y Fiori elements."],
          ["Retos, examen y constancia", "Completa código, adivina la salida y corrige errores; examen teórico y constancia de práctica."],
        ].map(([t, d]) => h("div", { class: "lp-feature" }, h("h3", {}, t), h("p", {}, d))),
      ),
    ),
    h("footer", { class: "lp-foot" }, "Práctica SAP - simulador educativo. No es software de SAP SE ni una certificación oficial. ", h("a", { href: "#", onclick: (e) => { e.preventDefault(); enter({ tcode: "ZAYUDA" }); } }, "Diferencias con SAP real")),
  );
  root.scrollTop = 0;
}

// Pantalla de inicio de sesión al estilo SAP GUI (sin clave: es un sistema de práctica)
function logon(root) {
  return new Promise((resolve) => {
    const s = store.data.settings;
    const user = h("input", { class: "sap-input upper", value: s.user || "ALUMNO", maxlength: 12, oninput: (e) => (e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "")) });
    const lang = h("input", { class: "sap-input upper", value: s.lang === "E" ? "EN" : "ES", maxlength: 2, style: { width: "48px" }, oninput: (e) => (e.target.value = e.target.value.toUpperCase()) });
    const close = (v) => {
      ov.remove();
      resolve(v);
    };
    const go = () => {
      const u = user.value.trim();
      const l = lang.value.trim();
      if (!u) return (msg.textContent = "Indique un usuario");
      if (l !== "ES" && l !== "EN") return (msg.textContent = "Idioma no disponible: use ES o EN");
      s.user = u;
      s.lang = l === "EN" ? "E" : "S";
      store.save();
      close(true);
    };
    const msg = h("div", { class: "logon-msg" });
    const onKey = (e) => {
      if (e.key === "Enter") go();
      if (e.key === "Escape") close(false);
    };
    const ov = h(
      "div",
      { class: "logon-ov", onkeydown: onKey },
      h(
        "div",
        { class: "logon" },
        h("div", { class: "logon-title" }, h("span", {}, "Inicio de sesión - NPL"), h("button", { class: "logon-x", title: "Cancelar", onclick: () => close(false) }, "×")),
        h(
          "div",
          { class: "logon-bar" },
          h("button", { class: "std-btn", title: "Entrar (Enter)", onclick: go }, h("span", { class: "ico ico-enter" })),
          h("span", { class: "logon-sys" }, "NPL - Sistema de práctica"),
        ),
        h(
          "div",
          { class: "logon-body" },
          h(
            "div",
            { class: "logon-form" },
            h("label", {}, "Mandante"),
            h("input", { class: "sap-input", value: "100", readonly: true, style: { width: "48px" } }),
            h("label", {}, "Usuario"),
            user,
            h("label", {}, "Clave de acceso"),
            h("input", { class: "sap-input", value: "", disabled: true, placeholder: "no se necesita", style: { width: "150px" } }),
            h("label", {}, "Idioma"),
            lang,
          ),
          h("div", { class: "logon-info" }, h("b", {}, "Bienvenido al sistema de práctica"), h("p", {}, "En un sistema real aquí se escribe la clave. En este simulador no hace falta: tu trabajo se guarda en este navegador."), h("p", {}, "Idioma ES o EN: cambia el idioma de los textos traducibles de tus programas.")),
        ),
        msg,
        h("div", { class: "logon-actions" }, h("button", { class: "btn btn-primary", onclick: go }, "Entrar"), h("button", { class: "btn", onclick: () => close(false) }, "Cancelar")),
      ),
    );
    root.append(ov);
    setTimeout(() => {
      user.focus();
      user.select();
    }, 30);
  });
}
