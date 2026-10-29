// replaceChildren ignorando null/undefined/false (facilita renderizado condicional)
const origReplace = Element.prototype.replaceChildren;
Element.prototype.replaceChildren = function (...kids) {
  return origReplace.apply(
    this,
    kids.flat(Infinity).filter((x) => x !== null && x !== undefined && x !== false),
  );
};

// Utilidades de interfaz: creación de elementos y diálogos.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "html") el.innerHTML = v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === undefined || c === null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

// Diálogo modal genérico. buttons: [{label, value, primary}]
export function dialog({ title, body, buttons = [{ label: "Continuar", value: true, primary: true }], icon, width, onOpen }) {
  return new Promise((resolve) => {
    const prevFocus = document.activeElement;
    const close = (v) => {
      overlay.remove();
      document.removeEventListener("keydown", onKey, true);
      prevFocus?.focus?.();
      resolve(v);
    };
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        close(undefined);
      } else if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
        const primary = buttons.find((b) => b.primary);
        if (primary) {
          e.preventDefault();
          e.stopPropagation();
          close(typeof primary.value === "function" ? primary.value() : primary.value);
        }
      }
    };
    const content = typeof body === "string" ? h("div", { class: "dlg-text" }, body) : body;
    const overlay = h(
      "div",
      { class: "dlg-overlay" },
      h(
        "div",
        { class: "dlg", style: width ? { width } : undefined, role: "dialog" },
        h("div", { class: "dlg-title" }, title || "Información", h("button", { class: "dlg-x", title: "Cancelar (F12)", onclick: () => close(undefined) }, h("span", { class: "ico ico-close" }))),
        h("div", { class: "dlg-body" }, icon ? h("div", { class: "dlg-icon dlg-icon-" + icon }) : null, content),
        h(
          "div",
          { class: "dlg-buttons" },
          buttons.map((b) =>
            h(
              "button",
              {
                class: "btn" + (b.primary ? " btn-primary" : ""),
                onclick: () => {
                  const v = typeof b.value === "function" ? b.value() : b.value;
                  if (v === false && b.keepOpen) return;
                  close(v);
                },
              },
              b.label,
            ),
          ),
        ),
      ),
    );
    document.body.append(overlay);
    document.addEventListener("keydown", onKey, true);
    setTimeout(() => {
      const first = overlay.querySelector("input,select,textarea") || overlay.querySelector(".btn-primary");
      first?.focus();
      first?.select?.();
      onOpen?.(overlay);
    }, 10);
  });
}

export function info(text, title = "Información") {
  return dialog({ title, body: text, icon: "info" });
}

export function confirm(text, title = "Confirmación", yes = "Sí", no = "No") {
  return dialog({
    title,
    body: text,
    icon: "question",
    buttons: [
      { label: yes, value: true, primary: true },
      { label: no, value: false },
    ],
  });
}

// Campo de entrada con etiqueta estilo SAP
export function field(label, input, opts = {}) {
  return h("div", { class: "sap-field" + (opts.class ? " " + opts.class : "") }, h("label", { class: "sap-label" + (opts.required ? " required" : "") }, label), input);
}

export function input(attrs = {}) {
  return h("input", { class: "sap-input", type: "text", spellcheck: "false", autocomplete: "off", ...attrs });
}

export function download(filename, content, type = "text/plain") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = h("a", { href: URL.createObjectURL(blob), download: filename });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
