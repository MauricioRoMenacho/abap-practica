// Guías de SAPUI5 / SAP Fiori (temario de la certificación C_FIORD: UX100, UX400, UX402, UX410).
import { store } from "./store.js";

const file = (code, path) => ({ code: code.trim(), file: path });
const terms = (rows, title = "Explicación") => ({ syntax: rows, title });
const P = "zvuelos";
const uP = (n) => store.data.ui5Projects?.[n];
const uF = (n, f) => uP(n)?.files?.[f] || "";
const uR = (n) => store.data.ui5Runs?.[n];
const ctl = (n, t) => Math.max(uR(n)?.controls?.[t] || 0, uR(n)?.controlsMax?.[t] || 0);
const okRun = (n) => !!uR(n) && uR(n).errors === 0 && !uR(n).error;
const has = (n, f, re) => re.test(uF(n, f));
const V = "webapp/view/Main.view.xml";
const C = "webapp/controller/Main.controller.js";

export const UI5_GUIDES = [
  {
    id: "u0",
    title: "UI5 Paso 0",
    subtitle: "SAP Fiori: diseño, arquitectura y herramientas",
    steps: [
      {
        id: "u0s1",
        title: "SAP Fiori, SAPUI5 y OpenUI5",
        body: [
          "<b>SAP Fiori</b> es el sistema de diseño (la experiencia de usuario) de las aplicaciones modernas de SAP: cómo se ven, cómo se navega y cómo se organizan. <b>SAPUI5</b> es el framework JavaScript con el que se programan esas aplicaciones. <b>OpenUI5</b> es la versión open source de SAPUI5 (mismo núcleo, sin algunas librerías como Fiori elements, gráficos o el launchpad).",
          terms([
            ["Aplicación freestyle", "Se programa a mano con vistas XML y controladores (lo que harás en estas guías). Máxima flexibilidad, más código."],
            ["SAP Fiori elements", "La aplicación se genera a partir de plantillas (List Report, Object Page...) y anotaciones del servicio OData. Casi sin código; es lo que SAP recomienda para aplicaciones estándar."],
            ["Tema (theme)", "Aspecto visual: hoy <code>sap_horizon</code> (antes sap_fiori_3 y sap_belize). Se cambia sin tocar la aplicación."],
            ["Demo Kit", "La documentación oficial y el catálogo de controles: ui5.sap.com. Allí está la API de cada control (propiedades, eventos, agregaciones)."],
          ], "Conceptos clave"),
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "u0s2",
        title: "Principios de diseño y tipos de aplicaciones",
        body: [
          "Las aplicaciones Fiori siguen cinco principios de diseño. En el examen se preguntan con frecuencia:",
          terms([
            ["Basada en roles (role-based)", "Cada aplicación está pensada para un rol y una tarea concreta (aprobar pedidos, ver vuelos), no para hacer de todo como una transacción clásica."],
            ["Adaptativa (adaptive / responsive)", "Funciona en escritorio, tableta y teléfono."],
            ["Simple", "Lo esencial para la tarea: 1 usuario, 1 caso de uso, 1 a 3 pantallas."],
            ["Coherente (coherent)", "Todas las aplicaciones se ven y se usan igual (mismos controles y patrones)."],
            ["Agradable (delightful)", "Una experiencia cuidada que facilita el trabajo."],
          ], "Principios"),
          terms([
            ["Transaccional", "Para ejecutar tareas: crear, modificar, aprobar (por ejemplo, crear una reserva)."],
            ["Analítica", "Para ver indicadores (KPI) y analizar datos en tiempo real."],
            ["Hoja de datos (fact sheet)", "Muestra la información de un objeto de negocio y sus relaciones (modelo clásico)."],
            ["Floorplans (plantillas de página)", "List Report (lista con filtros), Object Page (detalle de un objeto), Worklist (lista de trabajo), Overview Page (tarjetas), Analytical List Page."],
          ], "Tipos de aplicación y plantillas"),
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "u0s3",
        title: "Arquitectura: launchpad, front-end server y OData",
        body: [
          "Así llega una aplicación Fiori al usuario:",
          terms([
            ["SAP Fiori Launchpad (FLP)", "El punto de entrada: una página con mosaicos (tiles) que abren las aplicaciones según los roles del usuario."],
            ["Navegador (cliente)", "Ejecuta SAPUI5: vistas, controladores y modelos. Toda la interfaz corre en JavaScript en el navegador."],
            ["Front-end server / SAP Gateway", "Publica los servicios OData (transacción /IWFND/MAINT_SERVICE) y aloja las aplicaciones UI5 (repositorio BSP). Puede estar en el mismo sistema que el back-end (embedded) o separado (hub)."],
            ["Back-end (S/4HANA)", "La lógica y los datos de negocio. Los servicios se crean con SEGW (clásico) o con CDS + RAP (moderno)."],
            ["OData", "Protocolo REST que usan las aplicaciones para leer y modificar datos: URLs como /sap/opu/odata/sap/ZFLIGHT_SRV/Carriers. V2 es la más extendida; V4 es la de RAP y Fiori elements moderno."],
            ["SAP BTP", "La plataforma en la nube: Business Application Studio (BAS), HTML5 Application Repository, Launchpad service / Work Zone."],
          ], "Componentes"),
          "En este simulador: tu navegador ejecuta SAPUI5 real descargado del CDN de SAP, y un <b>MockServer</b> hace de SAP Gateway respondiendo con los datos de vuelos (SCARR, SPFLI, SFLIGHT...).",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "u0s4",
        title: "Herramientas: Business Application Studio",
        body: [
          "El entorno oficial de desarrollo es <b>SAP Business Application Studio</b> (BAS, en SAP BTP), basado en VS Code, con las <b>SAP Fiori tools</b>: generador de aplicaciones a partir de plantillas, Guided Development, Page Map (Fiori elements) y la vista previa con datos de prueba. También se puede usar VS Code local con las mismas extensiones.",
          "Abre la transacción <code>ZUI5</code>: es la imitación de BAS en este simulador. Tiene el explorador de archivos a la izquierda, el editor en el centro y la vista previa con la consola a la derecha (lo que en BAS sería <code>npm start</code> y la consola del navegador).",
        ],
        check: () => !!store.data.visited?.ZUI5,
        hint: "Abre la transacción ZUI5.",
      },
    ],
  },
  {
    id: "u1",
    title: "UI5 Paso 1",
    subtitle: "Tu primera aplicación: estructura y MVC",
    steps: [
      {
        id: "u1s1",
        title: "Generar la aplicación",
        body: [
          "En <b>ZUI5</b> pulsa <b>Nuevo proyecto</b>, elige la plantilla <b>Aplicación SAPUI5 básica</b>, nombre del módulo <code>zvuelos</code> y título <code>Vuelos</code>. Pulsa <b>Ejecutar</b> (F8): a la derecha verás una página vacía con el título.",
          "Es exactamente lo que genera el asistente de BAS (Template Wizard - Basic). El id de la aplicación es <code>zui5.zvuelos</code>: <b>namespace + nombre</b>, como un paquete en ABAP.",
        ],
        check: () => !!uP(P) && okRun(P),
        hint: "Crea el proyecto zvuelos y ejecútalo sin errores.",
      },
      {
        id: "u1s2",
        title: "Qué es cada archivo",
        body: [
          "Abre cada archivo del explorador mientras lees:",
          terms([
            ["webapp/", "Carpeta con todo lo que se publica en el servidor. Lo de fuera (package.json, ui5.yaml) es configuración de las herramientas."],
            ["index.html", "Página de arranque para probar sola la aplicación. El <b>bootstrap</b> (script sap-ui-bootstrap) carga SAPUI5: <code>data-sap-ui-theme</code> (tema), <code>data-sap-ui-resource-roots</code> (dónde está el código del namespace zui5.zvuelos), <code>data-sap-ui-async</code> (carga asíncrona) y <code>on-init</code> (qué hacer al terminar: ComponentSupport arranca el componente del div)."],
            ["manifest.json", "El <b>descriptor de la aplicación</b> (App Descriptor): id, título, fuentes de datos, librerías, modelos, vista raíz y routing. En Fiori todo lo que se puede configurar va aquí, no en el código."],
            ["Component.js", "El <b>componente</b>: la aplicación encapsulada. Lee el manifest, crea los modelos e inicia el router. El launchpad arranca las aplicaciones a través de su componente (no del index.html)."],
            ["view/App.view.xml", "Vista raíz: contiene el control <code>App</code>, donde el router va colocando las páginas."],
            ["view/Main.view.xml", "La primera página. Las vistas se escriben en XML (recomendado por SAP)."],
            ["controller/*.controller.js", "La lógica de cada vista: qué pasa al pulsar un botón, al iniciar la vista, etc."],
            ["i18n/i18n.properties", "Textos traducibles (clave=texto). i18n_en.properties tiene los textos en inglés."],
            ["model/models.js", "Crea modelos auxiliares, por ejemplo el modelo del dispositivo."],
            ["sap.ui.define([...], (...) => {...})", "Define un módulo: la lista son las dependencias (rutas de otros módulos) y la función recibe esos módulos en el mismo orden. Así se cargan las clases sin variables globales."],
          ], "Estructura del proyecto"),
          "<b>MVC</b>: la <b>vista</b> (View, XML) dice qué se ve; el <b>controlador</b> (Controller, JS) dice qué se hace; el <b>modelo</b> (Model) contiene los datos. Las vistas no tienen lógica y los controladores no construyen pantallas: así cada parte se puede cambiar sin romper la otra.",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "u1s3",
        title: "Un botón y un evento",
        body: [
          "Reemplaza el contenido de la vista principal:",
          file(`<mvc:View controllerName="zui5.zvuelos.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m">
    <Page id="page" title="{i18n>title}">
        <content>
            <Button
                id="btnSaludar"
                text="Saludar"
                icon="sap-icon://hello-world"
                type="Emphasized"
                press=".onSaludar"
                class="sapUiSmallMargin"/>
        </content>
    </Page>
</mvc:View>`, V),
          "Y el controlador:",
          file(`sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("zui5.zvuelos.controller.Main", {
        onInit() {
        },

        onSaludar() {
            MessageToast.show("¡Hola desde SAPUI5!");
        }
    });
});`, C),
          "Graba (Ctrl+S), ejecuta (F8) y pulsa el botón.",
          terms([
            ['xmlns="sap.m"', "Namespace XML por defecto: las etiquetas sin prefijo (Page, Button) son controles de la librería <b>sap.m</b> (la librería principal, responsive). <code>xmlns:mvc</code> permite usar <code>mvc:View</code>."],
            ["controllerName", "El controlador de la vista: namespace + controller + nombre."],
            ['id="btnSaludar"', "Id del control. En el controlador se obtiene con <code>this.byId(\"btnSaludar\")</code>. Pon siempre ids: los usan las pruebas y la adaptación."],
            ["Propiedades (text, icon, type)", "Configuran el control. <code>sap-icon://</code> usa la fuente de iconos de SAP (Icon Explorer en el Demo Kit)."],
            ['press=".onSaludar"', "Evento: el punto indica un método del controlador de la vista."],
            ['class="sapUiSmallMargin"', "Clases CSS estándar de SAPUI5 para márgenes (Tiny, Small, Medium, Large)."],
            ["Controller.extend(...)", "Crea la clase del controlador heredando de sap.ui.core.mvc.Controller."],
            ["onInit()", "Método del ciclo de vida: se ejecuta una vez al crear la vista (también existen onBeforeRendering, onAfterRendering y onExit)."],
            ["MessageToast.show(texto)", "Mensaje breve que desaparece solo. Para mensajes importantes se usa sap/m/MessageBox."],
            ['"use strict";', "Modo estricto de JavaScript: detecta errores comunes. Las guías de SAP lo exigen."],
          ]),
          "Prueba a romperlo: quita una comilla en la vista o escribe <code>onSaludarr</code> en el XML y mira los errores en la consola.",
        ],
        check: () => has(P, C, /MessageToast\.show/) && has(P, V, /press="\.onSaludar"/) && ctl(P, "sap.m.Button") >= 1 && okRun(P),
        hint: "Añade el botón con press=\".onSaludar\" y MessageToast en el controlador, y ejecuta.",
      },
    ],
  },
  {
    id: "u2",
    title: "UI5 Paso 2",
    subtitle: "Modelos y data binding",
    steps: [
      {
        id: "u2s1",
        title: "JSONModel y property binding",
        body: [
          "El <b>data binding</b> conecta automáticamente los controles con los datos del modelo: si el dato cambia, la pantalla cambia sola (y al revés con two-way binding). Es la idea central de SAPUI5.",
          "Controlador:",
          file(`sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], (Controller, MessageToast, JSONModel) => {
    "use strict";

    return Controller.extend("zui5.zvuelos.controller.Main", {
        onInit() {
            // modelo local con los datos de la pantalla
            const oModel = new JSONModel({
                nombre: "",
                ciudad: "LIMA"
            });
            // modelo por defecto (sin nombre) de esta vista
            this.getView().setModel(oModel);
        },

        onSaludar() {
            const sNombre = this.getView().getModel().getProperty("/nombre");
            MessageToast.show("Hola " + sNombre + ", tu ciudad es " + this.getView().getModel().getProperty("/ciudad"));
        }
    });
});`, C),
          "Vista (dentro de <code>&lt;content&gt;</code>, junto al botón):",
          file(`            <VBox class="sapUiSmallMargin">
                <Label text="Nombre" labelFor="inpNombre"/>
                <Input id="inpNombre" value="{/nombre}" valueLiveUpdate="true" placeholder="Escribe tu nombre" width="20rem"/>
                <Label text="Ciudad" labelFor="inpCiudad"/>
                <Input id="inpCiudad" value="{/ciudad}" width="20rem"/>
                <Text id="txtSaludo" text="Hola, {/nombre} ({/ciudad})" class="sapUiSmallMarginTop"/>
            </VBox>`, V),
          "Ejecuta y escribe en los campos: el texto de abajo cambia mientras escribes, sin una sola línea de código para actualizarlo.",
          terms([
            ["new JSONModel({...})", "Modelo con datos JSON en el navegador (cliente). Otros modelos: ODataModel (servidor), ResourceModel (textos i18n), XMLModel."],
            ["setModel(oModel)", "Asigna el modelo a la vista. Sin nombre es el modelo por defecto; con nombre: setModel(oModel, \"vuelos\")."],
            ['value="{/nombre}"', "Property binding: la propiedad value del Input queda unida a /nombre. La barra / indica una ruta absoluta desde la raíz del modelo."],
            ["Two-way binding", "En JSONModel por defecto el binding es en dos sentidos: lo que escribe el usuario se guarda en el modelo."],
            ['valueLiveUpdate="true"', "Actualiza el modelo con cada tecla, no solo al salir del campo."],
            ['text="Hola, {/nombre} ({/ciudad})"', "Binding compuesto: texto fijo mezclado con varios datos."],
            ['getProperty("/nombre")', "Lee un valor del modelo en el controlador (setProperty lo cambia)."],
            ["VBox / HBox", "Contenedores flexibles: apilan los controles en vertical u horizontal."],
          ]),
        ],
        check: () => has(P, C, /new JSONModel/) && ctl(P, "sap.m.Input") >= 1 && (uR(P)?.bound || 0) >= 1 && okRun(P),
        hint: "Crea el JSONModel, enlaza un Input con {/nombre} y ejecuta.",
      },
      {
        id: "u2s2",
        title: "Modelo en el manifest y aggregation binding",
        body: [
          "La plantilla incluye <code>webapp/model/vuelos.json</code> con datos reales del simulador (aerolíneas y vuelos de SCARR / SFLIGHT). En lugar de crear el modelo en el código, lo declaramos en el <b>manifest.json</b>: así lo crea el componente y está disponible en todas las vistas.",
          "En <code>manifest.json</code>, dentro de <code>\"sap.ui5\" &gt; \"models\"</code>, añade después del modelo i18n (cuidado con las comas):",
          file(`"vuelos": {
    "type": "sap.ui.model.json.JSONModel",
    "uri": "model/vuelos.json"
}`, "webapp/manifest.json"),
          "En la vista, después del VBox:",
          file(`            <List id="listaAerolineas" headerText="Aerolíneas" items="{vuelos>/carriers}">
                <StandardListItem
                    title="{vuelos>carrname}"
                    description="{vuelos>carrid}"
                    info="{vuelos>currency}"
                    icon="sap-icon://flight"/>
            </List>`, V),
          terms([
            ['"vuelos": { "type": ..., "uri": ... }', "Modelo con nombre declarado en el descriptor. El componente lo carga automáticamente al arrancar."],
            ['items="{vuelos>/carriers}"', "Aggregation binding: la agregación items de la List se llena con una fila por cada elemento del array /carriers del modelo \"vuelos\" (el prefijo <code>vuelos&gt;</code> indica el modelo)."],
            ["StandardListItem (plantilla)", "Se escribe una sola vez: es la plantilla que se clona para cada elemento."],
            ['title="{vuelos>carrname}"', "Ruta relativa (sin /): se resuelve dentro del elemento actual (binding context). Cada fila apunta a /carriers/0, /carriers/1..."],
            ["Agregación", "Propiedad que contiene otros controles (items, content, columns, cells). En el Demo Kit se ven en la sección Aggregations de cada control."],
          ]),
        ],
        check: () => has(P, "webapp/manifest.json", /"vuelos"\s*:/) && ctl(P, "sap.m.StandardListItem") >= 5 && okRun(P),
        hint: "Declara el modelo vuelos en el manifest y muestra la lista de aerolíneas.",
      },
      {
        id: "u2s3",
        title: "Tabla, tipos de datos, formatter y expression binding",
        body: [
          "Crea el archivo <code>webapp/model/formatter.js</code> (botón Nuevo archivo):",
          file(`sap.ui.define([], () => {
    "use strict";

    return {
        // porcentaje de ocupación: 120 de 160 -> "75 %"
        ocupacion(iOcupadas, iMaximo) {
            if (!iMaximo) {
                return "";
            }
            return Math.round(iOcupadas * 100 / iMaximo) + " %";
        },

        // color según la ocupación (estados semánticos de Fiori)
        estado(iOcupadas, iMaximo) {
            const fPorc = iOcupadas / iMaximo;
            if (fPorc > 0.9) {
                return "Error";
            }
            return fPorc > 0.7 ? "Warning" : "Success";
        }
    };
});`, "webapp/model/formatter.js"),
          "En el controlador añade la dependencia y la propiedad <code>formatter</code>:",
          file(`sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
], (Controller, MessageToast, JSONModel, formatter) => {
    "use strict";

    return Controller.extend("zui5.zvuelos.controller.Main", {
        formatter: formatter,

        onInit() {
            // ... (igual que antes)`, C),
          "En la vista añade <code>xmlns:core=\"sap.ui.core\"</code> en la etiqueta mvc:View y, después de la lista, la tabla:",
          file(`            <Table id="tablaVuelos"
                headerText="{= 'Vuelos (' + \${vuelos>/flights}.length + ')' }"
                items="{vuelos>/flights}"
                core:require="{
                    DateType: 'sap/ui/model/type/Date',
                    CurrencyType: 'sap/ui/model/type/Currency'
                }">
                <columns>
                    <Column><Text text="Vuelo"/></Column>
                    <Column><Text text="Ruta"/></Column>
                    <Column><Text text="Fecha"/></Column>
                    <Column hAlign="End"><Text text="Precio"/></Column>
                    <Column hAlign="End"><Text text="Ocupación"/></Column>
                </columns>
                <items>
                    <ColumnListItem>
                        <cells>
                            <ObjectIdentifier title="{vuelos>carrid} {vuelos>connid}"/>
                            <Text text="{vuelos>cityfrom} - {vuelos>cityto}"/>
                            <Text text="{
                                path: 'vuelos>fldate',
                                type: 'DateType',
                                formatOptions: { source: { pattern: 'yyyy-MM-dd' }, style: 'medium' }
                            }"/>
                            <ObjectNumber
                                number="{
                                    parts: ['vuelos>price', 'vuelos>currency'],
                                    type: 'CurrencyType',
                                    formatOptions: { showMeasure: false }
                                }"
                                unit="{vuelos>currency}"/>
                            <ObjectStatus
                                text="{ parts: ['vuelos>seatsocc', 'vuelos>seatsmax'], formatter: '.formatter.ocupacion' }"
                                state="{ parts: ['vuelos>seatsocc', 'vuelos>seatsmax'], formatter: '.formatter.estado' }"/>
                        </cells>
                    </ColumnListItem>
                </items>
            </Table>`, V),
          terms([
            ["sap.m.Table / Column / ColumnListItem", "Tabla responsive: columns define las cabeceras y ColumnListItem es la plantilla de cada fila (cells, en el mismo orden que las columnas)."],
            ["core:require", "Carga los módulos que la vista usa por nombre (tipos, formatters) y les da un alias local."],
            ["type: 'DateType'", "Tipo de datos: formatea (y valida al escribir) según el idioma. source indica cómo viene la fecha en el modelo."],
            ["parts: [...]", "Binding con varias rutas: el tipo moneda necesita importe y moneda; el formatter recibe los valores en el mismo orden."],
            ["formatter: '.formatter.ocupacion'", "Función que transforma los valores antes de mostrarlos. El punto busca en el controlador (por eso formatter: formatter)."],
            ["{= ... }", "Expression binding: una expresión JavaScript corta dentro de la vista. <code>${ruta}</code> lee un valor del modelo. Útil para cálculos simples; para lógica más compleja, usa un formatter."],
            ["ObjectIdentifier / ObjectNumber / ObjectStatus", "Controles para mostrar objetos de negocio: identificador en negrita, número con unidad y estado con color."],
            ["state: Success / Warning / Error / Information / None", "Estados semánticos de Fiori: verde, naranja, rojo, azul. Usa siempre estos en lugar de colores propios."],
          ]),
        ],
        check: () => !!uF(P, "webapp/model/formatter.js") && has(P, V, /\{=/) && has(P, V, /formatter\./) && ctl(P, "sap.m.ColumnListItem") >= 5 && okRun(P),
        hint: "Crea formatter.js, añade la tabla con formatter y expression binding, y ejecuta.",
      },
      {
        id: "u2s4",
        title: "Element binding: detalle de la fila seleccionada",
        body: [
          "Vamos a mostrar el detalle de la aerolínea pulsada. En la lista, cambia el StandardListItem para que se pueda pulsar:",
          file(`                <StandardListItem
                    title="{vuelos>carrname}"
                    description="{vuelos>carrid}"
                    info="{vuelos>currency}"
                    icon="sap-icon://flight"
                    type="Active"
                    press=".onAerolineaPress"/>`, V),
          "Después de la lista, un panel de detalle:",
          file(`            <Panel id="panelDetalle" headerText="Detalle: {vuelos>carrname}" class="sapUiResponsiveMargin" width="auto">
                <Text text="Código: {vuelos>carrid} - Moneda: {vuelos>currency}"/>
                <Link text="{vuelos>url}" href="{vuelos>url}" target="_blank"/>
            </Panel>`, V),
          "En el controlador:",
          file(`        onAerolineaPress(oEvent) {
            // contexto de la fila pulsada, por ejemplo /carriers/3
            const oContext = oEvent.getSource().getBindingContext("vuelos");
            this.byId("panelDetalle").bindElement({
                path: oContext.getPath(),
                model: "vuelos"
            });
        },`, C),
          terms([
            ["getBindingContext(\"vuelos\")", "Cada fila de una lista enlazada tiene un contexto: el elemento del modelo que representa."],
            ["oContext.getPath()", "La ruta del elemento, por ejemplo /carriers/3."],
            ["bindElement({ path, model })", "Element binding: fija el contexto del panel; dentro de él, las rutas relativas (carrname, url) se resuelven en ese elemento. Es el mecanismo de las páginas de detalle."],
          ]),
        ],
        check: () => has(P, C, /bindElement/) && has(P, V, /panelDetalle/) && okRun(P),
        hint: "Enlaza el panel de detalle con bindElement al pulsar una aerolínea.",
      },
    ],
  },
  {
    id: "u3",
    title: "UI5 Paso 3",
    subtitle: "Textos traducibles (i18n) y diseño responsive",
    steps: [
      {
        id: "u3s1",
        title: "Textos en i18n y traducción",
        body: [
          "Ningún texto visible debe estar escrito en la vista o el controlador: todos van en <code>i18n.properties</code>, igual que los elementos de texto y las clases de mensajes en ABAP. Añade al final de <code>i18n.properties</code>:",
          file(`#XBUT: Botón saludar
btnSaludar=Saludar

#XMSG: Saludo con el nombre ({0} = nombre)
saludo=Hola {0}, bienvenido

#XTIT: Título de la lista de aerolíneas
carriersTitle=Aerolíneas

#XFLD: Etiqueta del nombre
nombre=Nombre`, "webapp/i18n/i18n.properties"),
          "Y en <code>i18n_en.properties</code> las mismas claves en inglés:",
          file(`btnSaludar=Say hello
saludo=Hello {0}, welcome
carriersTitle=Airlines
nombre=Name`, "webapp/i18n/i18n_en.properties"),
          "En la vista usa <code>text=\"{i18n>btnSaludar}\"</code> en el botón, <code>headerText=\"{i18n>carriersTitle}\"</code> en la lista y <code>text=\"{i18n>nombre}\"</code> en la etiqueta. En el controlador:",
          file(`        onSaludar() {
            const oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            const sNombre = this.getView().getModel().getProperty("/nombre");
            MessageToast.show(oBundle.getText("saludo", [sNombre]));
        },`, C),
          "Ejecuta y cambia el idioma de la vista previa a <b>EN</b> (selector arriba): los textos cambian sin tocar el código.",
          terms([
            ["{i18n>clave}", "Binding al modelo de recursos i18n (declarado en el manifest)."],
            ["#XBUT, #XTIT, #XMSG, #XFLD", "Comentarios de tipo de texto para los traductores (botón, título, mensaje, campo). Son la convención de SAP."],
            ["{0}, {1}", "Marcadores que se reemplazan con los valores del array de getText (como &1 en los mensajes ABAP)."],
            ["getOwnerComponent()", "El componente al que pertenece la vista: desde él se obtienen los modelos del manifest."],
            ["i18n_en.properties", "Archivo por idioma. Si falta una clave, se usa el archivo por defecto (fallbackLocale)."],
            ["sap-language=EN", "Parámetro de URL para elegir el idioma (en el launchpad lo da el usuario)."],
          ]),
        ],
        check: () => (uF(P, V).match(/\{i18n>/g) || []).length >= 3 && has(P, C, /getResourceBundle/) && has(P, "webapp/i18n/i18n_en.properties", /saludo=/) && okRun(P),
        hint: "Usa al menos 3 textos {i18n>...} en la vista y getResourceBundle en el controlador.",
      },
      {
        id: "u3s2",
        title: "Diseño responsive: SimpleForm y popin",
        body: [
          "Una aplicación Fiori debe funcionar en el teléfono. En la tabla de vuelos, las columnas menos importantes se pasan debajo de la fila en pantallas pequeñas (<b>popin</b>):",
          file(`                <columns>
                    <Column><Text text="Vuelo"/></Column>
                    <Column><Text text="Ruta"/></Column>
                    <Column minScreenWidth="Tablet" demandPopin="true"><Text text="Fecha"/></Column>
                    <Column hAlign="End" minScreenWidth="Tablet" demandPopin="true"><Text text="Precio"/></Column>
                    <Column hAlign="End"><Text text="Ocupación"/></Column>
                </columns>`, V),
          "Cambia el contenido del panel de detalle por un formulario responsive (añade <code>xmlns:form=\"sap.ui.layout.form\"</code> en mvc:View):",
          file(`            <Panel id="panelDetalle" headerText="Detalle: {vuelos>carrname}" class="sapUiResponsiveMargin" width="auto">
                <form:SimpleForm id="formDetalle" editable="false" layout="ResponsiveGridLayout"
                    labelSpanL="3" labelSpanM="3" columnsL="1" columnsM="1">
                    <Label text="Código"/>
                    <Text text="{vuelos>carrid}"/>
                    <Label text="Nombre"/>
                    <Text text="{vuelos>carrname}"/>
                    <Label text="Moneda"/>
                    <Text text="{vuelos>currency}"/>
                    <Label text="Web"/>
                    <Link text="{vuelos>url}" href="{vuelos>url}" target="_blank"/>
                </form:SimpleForm>
            </Panel>`, V),
          "Ejecuta y cambia el tamaño de la vista previa a <b>Teléfono</b> y <b>Tableta</b>. Añade también <code>visible=\"{device&gt;/system/desktop}\"</code> a algún control para ocultarlo en el móvil.",
          terms([
            ['minScreenWidth="Tablet" demandPopin="true"', "Por debajo del ancho de tableta, la columna no se muestra como columna sino debajo de la fila."],
            ["sap.ui.layout.form.SimpleForm", "Formulario de etiquetas y campos que se reorganiza según el ancho (ResponsiveGridLayout). Cada Label va seguida de su campo."],
            ["labelSpanL / columnsL", "Cuántas columnas de la rejilla (de 12) ocupa la etiqueta y en cuántas columnas se reparte el formulario en pantallas grandes (L)."],
            ["{device>/system/desktop}", "El modelo device (creado en Component.js) dice si es teléfono, tableta o escritorio."],
            ["sapUiResponsiveMargin", "Margen que se adapta al tamaño de la pantalla."],
          ]),
        ],
        check: () => has(P, V, /demandPopin="true"/) && has(P, V, /SimpleForm/) && okRun(P),
        hint: "Añade demandPopin a la tabla y un SimpleForm en el detalle.",
      },
    ],
  },
  {
    id: "u4",
    title: "UI5 Paso 4",
    subtitle: "Buscar, filtrar, ordenar, agrupar; fragments y diálogos",
    steps: [
      {
        id: "u4s1",
        title: "Buscar con Filter",
        body: [
          "Añade una barra de herramientas con un campo de búsqueda a la tabla (justo después de la etiqueta de apertura <code>&lt;Table ...&gt;</code>):",
          file(`                <headerToolbar>
                    <OverflowToolbar>
                        <Title text="Vuelos"/>
                        <ToolbarSpacer/>
                        <SearchField id="buscarVuelo" width="16rem" placeholder="Ciudad de origen o destino"
                            search=".onBuscar" liveChange=".onBuscar"/>
                    </OverflowToolbar>
                </headerToolbar>`, V),
          "Si la tabla tiene <code>headerText</code>, quítalo (el título va ahora en la barra). En el controlador, añade las dependencias <code>\"sap/ui/model/Filter\"</code> y <code>\"sap/ui/model/FilterOperator\"</code> (y los parámetros Filter, FilterOperator) y el método:",
          file(`        onBuscar(oEvent) {
            const sTexto = oEvent.getParameter("newValue") ?? oEvent.getParameter("query");
            const aFiltros = [];
            if (sTexto) {
                aFiltros.push(new Filter({
                    filters: [
                        new Filter("cityfrom", FilterOperator.Contains, sTexto),
                        new Filter("cityto", FilterOperator.Contains, sTexto)
                    ],
                    and: false
                }));
            }
            // se filtra el binding de la agregación items, no el array de datos
            this.byId("tablaVuelos").getBinding("items").filter(aFiltros);
        },`, C),
          terms([
            ["getBinding(\"items\")", "El ListBinding: el objeto que une la agregación con el modelo. Sobre él se filtra y se ordena."],
            ["new Filter(ruta, operador, valor)", "Condición sobre una propiedad. Operadores: EQ, NE, GT, LT, BT, Contains, StartsWith, EndsWith..."],
            ["new Filter({ filters: [...], and: false })", "Agrupa filtros con O (or). Con and: true todos deben cumplirse."],
            ["search / liveChange", "search salta al pulsar Enter o la lupa; liveChange con cada tecla."],
            ["Filtro en el cliente o en el servidor", "Con JSONModel se filtra en el navegador; con ODataModel el mismo código genera $filter y filtra el servidor."],
          ]),
        ],
        check: () => has(P, C, /FilterOperator\.Contains/) && has(P, V, /SearchField/) && okRun(P),
        hint: "Añade el SearchField y filtra la tabla con Filter.",
      },
      {
        id: "u4s2",
        title: "Ordenar y agrupar con Sorter",
        body: [
          "Agrupa los vuelos por aerolínea directamente en el binding de la tabla:",
          file(`                items="{
                    path: 'vuelos>/flights',
                    sorter: { path: 'carrid', group: true }
                }"`, V),
          "Y un botón para ordenar por precio (en el OverflowToolbar, después del SearchField):",
          file(`                        <Button icon="sap-icon://sort" tooltip="Ordenar por precio" press=".onOrdenarPrecio"/>`, V),
          "En el controlador añade la dependencia <code>\"sap/ui/model/Sorter\"</code> y:",
          file(`        onOrdenarPrecio() {
            this._bDescendente = !this._bDescendente;
            this.byId("tablaVuelos").getBinding("items").sort([
                new Sorter("carrid", false, true),             // se mantiene la agrupación
                new Sorter("price", this._bDescendente)        // luego por precio
            ]);
        },`, C),
          terms([
            ["sorter: { path, group: true }", "Ordena por la propiedad y crea una cabecera de grupo cada vez que cambia el valor."],
            ["new Sorter(ruta, descendente, agrupar)", "Segundo parámetro: orden descendente; tercero: agrupar."],
            ["this._bDescendente", "Atributo privado del controlador (el guion bajo indica que es interno)."],
          ]),
        ],
        check: () => has(P, C, /new Sorter\(/) && has(P, V, /group:\s*true/) && okRun(P),
        hint: "Agrupa con sorter group: true y ordena con Sorter.",
      },
      {
        id: "u4s3",
        title: "Fragment y diálogo",
        body: [
          "Un <b>fragment</b> es un trozo de vista reutilizable sin controlador propio (usa el de la vista que lo carga). Crea <code>webapp/view/fragment/Leyenda.fragment.xml</code>:",
          file(`<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core">
    <Dialog id="dlgLeyenda" title="Leyenda de ocupación" icon="sap-icon://legend">
        <content>
            <VBox class="sapUiSmallMargin">
                <ObjectStatus text="Menos del 70 %: plazas disponibles" state="Success"/>
                <ObjectStatus text="Entre 70 % y 90 %: pocas plazas" state="Warning"/>
                <ObjectStatus text="Más del 90 %: casi lleno" state="Error"/>
            </VBox>
        </content>
        <endButton>
            <Button text="Cerrar" press=".onCerrarLeyenda"/>
        </endButton>
    </Dialog>
</core:FragmentDefinition>`, "webapp/view/fragment/Leyenda.fragment.xml"),
          "Un botón en la barra de la tabla:",
          file(`                        <Button icon="sap-icon://legend" tooltip="Leyenda" press=".onAbrirLeyenda"/>`, V),
          "En el controlador:",
          file(`        async onAbrirLeyenda() {
            // se carga una sola vez y se reutiliza
            this._oLeyenda ??= await this.loadFragment({
                name: "zui5.zvuelos.view.fragment.Leyenda"
            });
            this._oLeyenda.open();
        },

        onCerrarLeyenda() {
            this.byId("dlgLeyenda").close();
        },`, C),
          terms([
            ["core:FragmentDefinition", "Raíz de un fragment XML. Puede contener un control o varios."],
            ["this.loadFragment({ name })", "Carga el fragment, lo añade como dependiente de la vista (comparte modelos e i18n) y prefija los ids con el de la vista, por eso funciona this.byId(\"dlgLeyenda\")."],
            ["??=", "Asigna solo si todavía no tiene valor: el diálogo se crea la primera vez y se reutiliza."],
            ["Dialog / endButton", "Ventana modal; endButton y beginButton son los botones del pie."],
            ["async / await", "loadFragment devuelve una promesa: await espera a que esté cargado."],
          ]),
        ],
        check: () => !!uF(P, "webapp/view/fragment/Leyenda.fragment.xml") && has(P, C, /loadFragment/) && ctl(P, "sap.m.Dialog") >= 1,
        hint: "Crea el fragment, ábrelo con loadFragment y pulsa el botón de leyenda en la vista previa.",
      },
    ],
  },
  {
    id: "u5",
    title: "UI5 Paso 5",
    subtitle: "Routing y navegación",
    steps: [
      {
        id: "u5s1",
        title: "Página de detalle con routing",
        body: [
          "El <b>router</b> asocia URLs (el hash, después de #) con vistas. Así se puede navegar, usar el botón atrás del navegador y guardar enlaces a un detalle. En <code>manifest.json</code>, dentro de <code>routing</code>, deja así <code>routes</code> y <code>targets</code>:",
          file(`"routes": [
    {
        "name": "RouteMain",
        "pattern": ":?query:",
        "target": ["TargetMain"]
    },
    {
        "name": "RouteDetail",
        "pattern": "vuelo/{indice}",
        "target": ["TargetDetail"]
    }
],
"targets": {
    "TargetMain": { "id": "Main", "name": "Main" },
    "TargetDetail": { "id": "Detail", "name": "Detail" }
}`, "webapp/manifest.json"),
          "Crea la vista <code>webapp/view/Detail.view.xml</code>:",
          file(`<mvc:View controllerName="zui5.zvuelos.controller.Detail"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m">
    <Page id="pageDetail" title="Vuelo {vuelos>carrid} {vuelos>connid}" showNavButton="true" navButtonPress=".onNavBack">
        <content>
            <ObjectHeader title="{vuelos>cityfrom} - {vuelos>cityto}" number="{vuelos>price}" numberUnit="{vuelos>currency}">
                <attributes>
                    <ObjectAttribute title="Fecha" text="{vuelos>fldate}"/>
                    <ObjectAttribute title="Plazas" text="{vuelos>seatsocc} de {vuelos>seatsmax}"/>
                </attributes>
            </ObjectHeader>
        </content>
    </Page>
</mvc:View>`, "webapp/view/Detail.view.xml"),
          "Y su controlador <code>webapp/controller/Detail.controller.js</code>:",
          file(`sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], (Controller, History) => {
    "use strict";

    return Controller.extend("zui5.zvuelos.controller.Detail", {
        onInit() {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched(oEvent) {
            const sIndice = oEvent.getParameter("arguments").indice;
            this.getView().bindElement({
                path: "/flights/" + sIndice,
                model: "vuelos"
            });
        },

        onNavBack() {
            const sAnterior = History.getInstance().getPreviousHash();
            if (sAnterior !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        }
    });
});`, "webapp/controller/Detail.controller.js"),
          "Por último, en la vista principal haz navegable la fila de la tabla: <code>&lt;ColumnListItem type=\"Navigation\" press=\".onVueloPress\"&gt;</code> y en su controlador:",
          file(`        onVueloPress(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("vuelos");
            // /flights/7 -> 7
            const sIndice = oContext.getPath().split("/").pop();
            this.getOwnerComponent().getRouter().navTo("RouteDetail", {
                indice: sIndice
            });
        },`, C),
          "Ejecuta, pulsa un vuelo y vuelve con la flecha de la página.",
          terms([
            ['"pattern": "vuelo/{indice}"', "Patrón del hash. {indice} es un parámetro obligatorio; :parametro: sería opcional. La URL queda como index.html#/vuelo/7."],
            ["targets", "Qué vista se muestra y dónde (controlAggregation pages del control App, definido en config)."],
            ["navTo(ruta, parámetros, reemplazar)", "Navega cambiando el hash. El tercer parámetro true reemplaza la entrada del historial."],
            ["attachPatternMatched", "Se ejecuta cada vez que la URL coincide con la ruta (también si el usuario abre el enlace directamente o refresca)."],
            ["bindElement en la vista", "Toda la vista de detalle queda enlazada al vuelo: las rutas relativas se resuelven en él."],
            ["History.getPreviousHash()", "Si hay una página anterior en la aplicación se vuelve atrás; si se entró directamente al detalle, se navega a la principal."],
            ["Por qué un índice", "Con JSONModel usamos la posición en el array. Con OData se usa la <b>clave</b> del objeto (por ejemplo Flights(Carrid='LH',...)): lo verás en el Paso 6."],
          ]),
        ],
        check: () => has(P, "webapp/manifest.json", /RouteDetail/) && !!uF(P, "webapp/view/Detail.view.xml") && has(P, C, /navTo\(/) && (uR(P)?.hashes || []).some((x) => /vuelo\//.test(x)),
        hint: "Configura la ruta de detalle, crea la vista Detail y navega a un vuelo en la vista previa.",
      },
    ],
  },
  {
    id: "u6",
    title: "UI5 Paso 6",
    subtitle: "OData V2: leer, filtrar, navegar y modificar datos",
    steps: [
      {
        id: "u6s1",
        title: "Aplicación con servicio OData y MockServer",
        body: [
          "En ZUI5 crea un proyecto nuevo con la plantilla <b>Aplicación con servicio OData V2 (vuelos)</b>, nombre <code>zflight</code> y título <code>Vuelos OData</code>. Explora los archivos nuevos:",
          terms([
            ["localService/metadata.xml", "El <b>$metadata</b> del servicio ZFLIGHT_SRV: describe las entidades (EntityType con su Key y Property), los conjuntos (EntitySet: Carriers, Connections, Flights, Customers, Bookings) y las relaciones (NavigationProperty: ToConnections, ToFlights...). En un sistema real lo genera SEGW o RAP."],
            ["localService/mockdata/*.json", "Datos de prueba por EntitySet (salen de SCARR, SPFLI, SFLIGHT...)."],
            ["localService/mockserver.js", "Arranca el <b>MockServer</b>: intercepta las peticiones HTTP a /sap/opu/odata/sap/ZFLIGHT_SRV/ y responde como lo haría SAP Gateway."],
            ['manifest.json - dataSources', "La fuente de datos mainService: uri del servicio, tipo OData, versión 2.0."],
            ['manifest.json - models ""', "El modelo por defecto es un <b>ODataModel</b> creado desde mainService. No hay que escribir código para crearlo."],
          ], "Qué trae la plantilla"),
          "Reemplaza la vista principal:",
          file(`<mvc:View controllerName="zui5.zflight.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:core="sap.ui.core"
    xmlns="sap.m">
    <Page id="page" title="{i18n>title}">
        <content>
            <Table id="tablaVuelos"
                items="{
                    path: '/Flights',
                    sorter: { path: 'Fldate' }
                }"
                growing="true"
                growingThreshold="15"
                core:require="{ DateTime: 'sap/ui/model/odata/type/DateTime' }">
                <headerToolbar>
                    <OverflowToolbar>
                        <Title text="Vuelos"/>
                    </OverflowToolbar>
                </headerToolbar>
                <columns>
                    <Column><Text text="{/#Flight/Carrid/@sap:label}"/></Column>
                    <Column><Text text="{/#Flight/Connid/@sap:label}"/></Column>
                    <Column><Text text="{/#Flight/Fldate/@sap:label}"/></Column>
                    <Column hAlign="End"><Text text="{/#Flight/Price/@sap:label}"/></Column>
                    <Column hAlign="End"><Text text="Plazas"/></Column>
                </columns>
                <items>
                    <ColumnListItem>
                        <cells>
                            <ObjectIdentifier title="{Carrid}"/>
                            <Text text="{Connid}"/>
                            <Text text="{ path: 'Fldate', type: 'DateTime', formatOptions: { style: 'medium', UTC: true }, constraints: { displayFormat: 'Date' } }"/>
                            <ObjectNumber number="{Price}" unit="{Currency}"/>
                            <Text text="{Seatsocc} / {Seatsmax}"/>
                        </cells>
                    </ColumnListItem>
                </items>
            </Table>
        </content>
    </Page>
</mvc:View>`, "webapp/view/Main.view.xml"),
          "Ejecuta. Baja hasta el final de la tabla: con <code>growing</code> se cargan 15 filas y el botón <b>Más</b> pide las siguientes al servidor. En la consola verás que no hay errores; en un sistema real verías las peticiones en la pestaña Red del navegador (por ejemplo <code>Flights?$skip=0&amp;$top=15&amp;$orderby=Fldate</code>).",
          terms([
            ["items=\"{/Flights}\"", "Ruta del EntitySet. El ODataModel traduce el binding a una petición GET al servicio."],
            ["growing / growingThreshold", "Paginación: pide los datos de 15 en 15 ($top y $skip). Fundamental con muchos datos."],
            ["sorter en el binding", "Con OData se ordena en el servidor: genera $orderby=Fldate."],
            ["sap/ui/model/odata/type/DateTime", "Tipo para Edm.DateTime. UTC: true evita que la fecha cambie de día por la zona horaria."],
            ["{/#Flight/Carrid/@sap:label}", "Binding al metadata: la etiqueta de la columna viene del servicio (la definió el desarrollador ABAP), así se traduce en el back-end."],
          ]),
        ],
        check: () => !!uP("zflight") && has("zflight", "webapp/view/Main.view.xml", /\/Flights/) && ctl("zflight", "sap.m.ColumnListItem") >= 10 && okRun("zflight"),
        hint: "Crea zflight con la plantilla OData y muestra la tabla de /Flights.",
      },
      {
        id: "u6s2",
        title: "Filtros en el servidor, $expand y navegación",
        body: [
          "Añade al OverflowToolbar un selector de aerolínea:",
          file(`                        <ToolbarSpacer/>
                        <Select id="selAerolinea" forceSelection="false" change=".onAerolineaChange"
                            items="{ path: '/Carriers', sorter: { path: 'Carrname' } }">
                            <core:Item key="{Carrid}" text="{Carrname}"/>
                        </Select>`, "webapp/view/Main.view.xml"),
          "Después de la tabla, una lista de conexiones de Lufthansa leídas a través de la navegación, con sus vuelos expandidos:",
          file(`            <List id="listaConexiones" headerText="Conexiones de Lufthansa"
                items="{
                    path: '/Carriers(\\'LH\\')/ToConnections',
                    parameters: { expand: 'ToFlights' }
                }">
                <StandardListItem title="{Connid}: {Cityfrom} - {Cityto}"
                    description="Salida {path: 'Deptime', type: 'sap.ui.model.odata.type.Time'}"
                    counter="{= \${ToFlights}.length }"/>
            </List>`, "webapp/view/Main.view.xml"),
          "En el controlador:",
          file(`sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("zui5.zflight.controller.Main", {
        onInit() {
        },

        onAerolineaChange(oEvent) {
            const sCarrid = oEvent.getParameter("selectedItem").getKey();
            // con ODataModel el filtro se envía al servidor: $filter=Carrid eq 'LH'
            this.byId("tablaVuelos").getBinding("items").filter(
                sCarrid ? [new Filter("Carrid", FilterOperator.EQ, sCarrid)] : []
            );
        }
    });
});`, "webapp/controller/Main.controller.js"),
          terms([
            ["/Carriers('LH')", "Acceso a una entidad por su clave (key predicate). Con varias claves: /Flights(Carrid='LH',Connid='0400',Fldate=datetime'2026-01-20T00:00:00')."],
            ["/Carriers('LH')/ToConnections", "Navegación: las conexiones relacionadas con esa aerolínea (en ABAP equivaldría a un SELECT con WHERE carrid = 'LH')."],
            ["parameters: { expand: 'ToFlights' }", "$expand: trae los vuelos de cada conexión en la misma petición, evitando una petición por fila (como evitar un SELECT en un LOOP)."],
            ["parameters: { select: 'Carrid,Connid' }", "$select: pide solo esos campos (menos datos por la red)."],
            ["FilterOperator.EQ", "El filtro se convierte en $filter=Carrid eq 'LH' y lo ejecuta el back-end."],
            ["core:Item key / text", "Opciones de un Select o ComboBox creadas por aggregation binding."],
          ]),
        ],
        check: () => has("zflight", "webapp/view/Main.view.xml", /expand/) && has("zflight", "webapp/controller/Main.controller.js", /FilterOperator\.EQ/) && ctl("zflight", "sap.m.StandardListItem") >= 1 && okRun("zflight"),
        hint: "Añade el filtro por aerolínea y la lista con expand: 'ToFlights'.",
      },
      {
        id: "u6s3",
        title: "Crear, modificar y borrar (CRUD)",
        body: [
          "Vamos a dar de alta clientes (EntitySet Customers). Añade a la vista, después de la lista:",
          file(`            <Panel headerText="Nuevo cliente" class="sapUiResponsiveMargin" width="auto">
                <HBox alignItems="End" wrap="Wrap">
                    <VBox class="sapUiSmallMarginEnd">
                        <Label text="Nombre" labelFor="inpCliNombre" required="true"/>
                        <Input id="inpCliNombre" width="14rem"/>
                    </VBox>
                    <VBox class="sapUiSmallMarginEnd">
                        <Label text="Ciudad" labelFor="inpCliCiudad"/>
                        <Input id="inpCliCiudad" width="12rem"/>
                    </VBox>
                    <Button text="Crear cliente" type="Emphasized" press=".onCrearCliente"/>
                </HBox>
            </Panel>
            <List id="listaClientes" headerText="Clientes"
                items="{ path: '/Customers', sorter: { path: 'Id', descending: true } }"
                growing="true" growingThreshold="5" mode="Delete" delete=".onBorrarCliente">
                <StandardListItem title="{Name}" description="{Id} - {City}"/>
            </List>`, "webapp/view/Main.view.xml"),
          "En el controlador añade la dependencia <code>\"sap/m/MessageBox\"</code> (y <code>\"sap/m/MessageToast\"</code>) y estos métodos:",
          file(`        onCrearCliente() {
            const sNombre = this.byId("inpCliNombre").getValue();
            if (!sNombre) {
                MessageBox.error("Indique el nombre del cliente");
                return;
            }
            const oModel = this.getView().getModel();
            const sId = String(Date.now()).slice(-8);
            oModel.create("/Customers", {
                Id: sId,
                Name: sNombre,
                City: this.byId("inpCliCiudad").getValue(),
                Country: "PE",
                Custtype: "P"
            }, {
                success: () => {
                    MessageToast.show("Cliente " + sId + " creado");
                    this.byId("inpCliNombre").setValue("");
                },
                error: () => MessageBox.error("No se pudo crear el cliente")
            });
        },

        onBorrarCliente(oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const sPath = oItem.getBindingContext().getPath();   // /Customers('00000001')
            MessageBox.confirm("¿Borrar el cliente " + oItem.getTitle() + "?", {
                onClose: (sAccion) => {
                    if (sAccion === MessageBox.Action.OK) {
                        this.getView().getModel().remove(sPath, {
                            success: () => MessageToast.show("Cliente borrado")
                        });
                    }
                }
            });
        },`, "webapp/controller/Main.controller.js"),
          terms([
            ["oModel.create(ruta, datos, { success, error })", "POST al EntitySet: crea una entidad. En el back-end se ejecuta el método CREATE_ENTITY (SEGW) o la acción de RAP."],
            ["oModel.update(ruta, datos)", "PUT/MERGE sobre una entidad concreta: /Customers('00000001')."],
            ["oModel.remove(ruta)", "DELETE de la entidad."],
            ["oModel.read(ruta, { filters, urlParameters, success })", "Lectura directa sin binding (cuando necesitas los datos en el controlador)."],
            ["Two-way binding y submitChanges", "Si los campos están enlazados (value=\"{Name}\") los cambios quedan pendientes en el modelo y se envían todos juntos con submitChanges() (en un $batch)."],
            ["$batch", "El ODataModel V2 agrupa varias operaciones en una sola petición HTTP. El token CSRF (X-CSRF-Token) lo pide y envía el modelo automáticamente."],
            ["MessageBox.error / confirm", "Diálogos estándar para errores y confirmaciones (MessageToast solo para avisos breves)."],
            ['mode="Delete"', "La lista muestra un botón de borrar en cada fila y lanza el evento delete."],
          ]),
        ],
        check: () => has("zflight", "webapp/controller/Main.controller.js", /\.create\(\s*"\/Customers"/) && has("zflight", "webapp/controller/Main.controller.js", /\.remove\(/) && okRun("zflight"),
        hint: "Implementa crear y borrar clientes con create y remove.",
      },
    ],
  },
  {
    id: "u7",
    title: "UI5 Paso 7",
    subtitle: "Controles propios, extensibilidad, pruebas y despliegue",
    steps: [
      {
        id: "u7s1",
        title: "Un control propio (custom control)",
        body: [
          "Cuando ningún control estándar sirve, se crea uno propio heredando de <code>sap.ui.core.Control</code>. Crea <code>webapp/control/BarraOcupacion.js</code> en zflight:",
          file(`sap.ui.define([
    "sap/ui/core/Control"
], (Control) => {
    "use strict";

    return Control.extend("zui5.zflight.control.BarraOcupacion", {
        metadata: {
            properties: {
                valor: { type: "float", defaultValue: 0 },
                maximo: { type: "float", defaultValue: 100 }
            },
            events: {
                press: {}
            }
        },

        renderer: {
            apiVersion: 2,
            render(oRm, oControl) {
                const fMax = oControl.getMaximo() || 1;
                const iPorc = Math.min(100, Math.round(oControl.getValor() * 100 / fMax));
                const sColor = iPorc > 90 ? "#bb0000" : iPorc > 70 ? "#e9730c" : "#2b7d2b";
                oRm.openStart("div", oControl);
                oRm.class("zBarra");
                oRm.attr("title", iPorc + " % ocupado");
                oRm.openEnd();
                oRm.openStart("div");
                oRm.class("zBarraRelleno");
                oRm.style("width", iPorc + "%");
                oRm.style("background", sColor);
                oRm.openEnd();
                oRm.close("div");
                oRm.close("div");
            }
        },

        onclick() {
            this.firePress();
        }
    });
});`, "webapp/control/BarraOcupacion.js"),
          "En <code>css/style.css</code>:",
          file(`.zBarra { width: 8rem; height: 0.6rem; background: #e5e5e5; border-radius: 0.3rem; overflow: hidden; display: inline-block; }
.zBarraRelleno { height: 100%; }`, "webapp/css/style.css"),
          "En la vista declara el namespace <code>xmlns:z=\"zui5.zflight.control\"</code> en mvc:View y usa el control en la celda de Plazas de la tabla:",
          file(`                            <VBox>
                                <Text text="{Seatsocc} / {Seatsmax}"/>
                                <z:BarraOcupacion valor="{Seatsocc}" maximo="{Seatsmax}"/>
                            </VBox>`, "webapp/view/Main.view.xml"),
          terms([
            ["metadata.properties", "Propiedades del control con tipo y valor por defecto: UI5 genera automáticamente getValor(), setValor() y permite el binding."],
            ["metadata.events", "Eventos que el control puede lanzar (firePress)."],
            ["renderer apiVersion 2", "Genera el HTML con el RenderManager (openStart, class, style, openEnd, close). apiVersion 2 permite actualizaciones del DOM más eficientes."],
            ["oRm.openStart(\"div\", oControl)", "El elemento raíz debe recibir el control para que tenga su id y UI5 lo pueda encontrar."],
            ["xmlns:z=\"zui5.zflight.control\"", "El namespace XML apunta a la carpeta del control; la etiqueta es el nombre de la clase."],
          ]),
        ],
        check: () => !!uF("zflight", "webapp/control/BarraOcupacion.js") && ctl("zflight", "zui5.zflight.control.BarraOcupacion") >= 1 && okRun("zflight"),
        hint: "Crea el control BarraOcupacion y úsalo en la tabla.",
      },
      {
        id: "u7s2",
        title: "Extensibilidad de aplicaciones",
        body: [
          "Las aplicaciones estándar de SAP no se modifican: se <b>extienden</b>, para que una actualización no borre los cambios (igual que no se modifican programas estándar en ABAP). Opciones:",
          terms([
            ["Adaptación por el usuario clave (key user)", "Desde el launchpad (Adaptar interfaz de usuario): ocultar, mover o renombrar campos sin código. Requiere flexEnabled: true en el manifest."],
            ["Proyecto de adaptación (adaptation project)", "En BAS se crea un proyecto que guarda solo las diferencias (cambios en vistas, fragments añadidos, extensiones de controlador) sobre la aplicación original."],
            ["Puntos de extensión (ExtensionPoint)", "Lugares previstos en la vista original (core:ExtensionPoint) donde la extensión puede insertar un fragment."],
            ["Extensión de controlador (ControllerExtension)", "Añade o sustituye métodos del controlador original (override.onInit, métodos nuevos)."],
            ["Fiori elements: flexible programming model", "En aplicaciones generadas se añaden secciones, columnas y acciones propias mediante el manifest y building blocks."],
            ["Variantes y personalización", "El usuario final guarda sus propias vistas (filtros, columnas): son variantes, no cambios de la aplicación."],
          ], "Técnicas de extensión"),
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "u7s3",
        title: "Pruebas unitarias con QUnit",
        body: [
          "En zflight crea <code>webapp/model/formatter.js</code>:",
          file(`sap.ui.define([], () => {
    "use strict";

    return {
        ocupacion(iOcupadas, iMaximo) {
            if (!iMaximo) {
                return "";
            }
            return Math.round(iOcupadas * 100 / iMaximo) + " %";
        }
    };
});`, "webapp/model/formatter.js"),
          "La prueba <code>webapp/test/unit/formatter.test.js</code>:",
          file(`sap.ui.define([
    "zui5/zflight/model/formatter"
], (formatter) => {
    "use strict";

    QUnit.module("formatter.ocupacion");

    QUnit.test("calcula el porcentaje redondeado", (assert) => {
        assert.strictEqual(formatter.ocupacion(120, 160), "75 %", "120 de 160 es 75 %");
        assert.strictEqual(formatter.ocupacion(1, 3), "33 %", "redondea hacia abajo");
    });

    QUnit.test("sin capacidad devuelve texto vacío", (assert) => {
        assert.strictEqual(formatter.ocupacion(10, 0), "", "evita dividir entre cero");
    });
});`, "webapp/test/unit/formatter.test.js"),
          "Y la página que ejecuta las pruebas <code>webapp/test/unit/unitTests.qunit.html</code>:",
          file(`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Pruebas unitarias - zflight</title>
    <link rel="stylesheet" href="../../resources/sap/ui/thirdparty/qunit-2.css">
    <script src="../../resources/sap/ui/thirdparty/qunit-2.js"></script>
    <script
        id="sap-ui-bootstrap"
        src="../../resources/sap-ui-core.js"
        data-sap-ui-resource-roots='{ "zui5.zflight": "../../" }'
        data-sap-ui-async="true"></script>
    <script>
        QUnit.config.autostart = false;
        sap.ui.require(["zui5/zflight/test/unit/formatter.test"], () => QUnit.start());
    </script>
</head>
<body>
    <div id="qunit"></div>
    <div id="qunit-fixture"></div>
</body>
</html>`, "webapp/test/unit/unitTests.qunit.html"),
          "Abre <code>unitTests.qunit.html</code> en el editor y pulsa <b>Ejecutar este HTML</b>. Verás el informe de QUnit en verde. Cambia el formatter para que falle y observa el resultado en rojo.",
          terms([
            ["QUnit", "Framework de pruebas unitarias de JavaScript que usa SAPUI5: prueba funciones aisladas (formatters, cálculos) igual que ABAP Unit."],
            ["QUnit.module / QUnit.test", "Agrupan y definen las pruebas."],
            ["assert.strictEqual(obtenido, esperado, mensaje)", "La aserción: como cl_abap_unit_assert=>assert_equals."],
            ["OPA5", "Pruebas de integración: simulan al usuario (pulsar, escribir) y comprueban la pantalla. Se escriben en test/integration con Given / When / Then."],
            ["wdi5 / UIVeri5", "Pruebas de extremo a extremo (end-to-end) en un navegador real."],
          ]),
        ],
        check: () => (store.data.ui5Tests?.zflight?.passed || 0) >= 3 && store.data.ui5Tests.zflight.failed === 0,
        hint: "Ejecuta unitTests.qunit.html con las 3 aserciones en verde.",
      },
      {
        id: "u7s4",
        title: "Build y despliegue",
        body: [
          "Antes de desplegar se ejecuta el <b>build</b>: <code>npm run build</code> (ui5 build). En ZUI5 pulsa <b>Build (ui5 build)</b>: se genera la carpeta <code>dist/</code> con <code>Component-preload.js</code>, un único archivo con todas las vistas, controladores y textos, para que el navegador no haga una petición por archivo.",
          terms([
            ["Despliegue a un sistema ABAP", "<code>npx fiori deploy</code> (configurado en ui5-deploy.yaml: url, mandante, nombre de la aplicación BSP, paquete y orden de transporte). La aplicación queda como aplicación BSP en el repositorio ABAP y viaja a QAS y PRD con la orden de transporte. Alternativa clásica: el report /UI5/UI5_REPOSITORY_LOAD."],
            ["Después del despliegue", "Recalcular el índice de aplicaciones (/UI5/APP_INDEX_CALCULATE) y comprobar el nodo SICF /sap/bc/ui5_ui5/sap/&lt;app&gt;."],
            ["Despliegue a SAP BTP (Cloud Foundry)", "Con un archivo mta.yaml se construye un archivo .mtar que se despliega en el HTML5 Application Repository; el acceso al back-end se hace con destinations y el approuter administrado."],
            ["Versionado", "applicationVersion del manifest y control de versiones con git (BAS lo integra)."],
            ["Caché", "El launchpad usa el índice de aplicaciones y el cache buster para que los usuarios reciban la versión nueva."],
          ], "Despliegue"),
        ],
        check: () => !!uF("zflight", "dist/Component-preload.js") || !!uF(P, "dist/Component-preload.js"),
        hint: "Pulsa Build (ui5 build) en zflight o zvuelos.",
      },
    ],
  },
  {
    id: "u8",
    title: "UI5 Paso 8",
    subtitle: "Smart controls y SAP Fiori elements (anotaciones)",
    steps: [
      {
        id: "u8s1",
        title: "Anotaciones: describir la pantalla con metadatos",
        body: [
          "Hasta ahora escribiste cada columna y cada campo en la vista XML. Con las <b>anotaciones</b> el servicio OData describe <b>cómo</b> mostrar sus datos (qué columnas, qué filtros, qué título) y los <b>smart controls</b> y <b>SAP Fiori elements</b> construyen la pantalla solos. Este tema pesa entre el 11 % y el 20 % del examen C_FIORD.",
          "Crea en ZUI5 un proyecto con la plantilla <b>Aplicación con servicio OData V2 (vuelos)</b>, nombre <code>zsmart</code>, título <code>Vuelos smart</code>, y abre <code>webapp/annotations/annotation.xml</code>:",
          terms([
            ["Vocabulario UI (com.sap.vocabularies.UI.v1)", "Conjunto de términos estándar para describir la interfaz. Otros vocabularios: Common (textos, listas de valores), Communication, Analytics..."],
            ["Annotations Target=\"ZFLIGHT_SRV.Flight\"", "A qué entidad (o propiedad) se aplican las anotaciones."],
            ["UI.LineItem", "Columnas de una tabla: una lista de UI.DataField con la propiedad (Path) y una etiqueta opcional (Label)."],
            ["UI.SelectionFields", "Campos que aparecen como filtros en la barra de filtros."],
            ["UI.HeaderInfo", "Nombre del tipo (singular y plural), título y descripción de la cabecera de un objeto."],
            ["UI.FieldGroup#Calificador", "Grupo de campos (un formulario). El calificador (#Ruta) permite tener varios."],
            ["UI.Facets / UI.ReferenceFacet", "Secciones de una página de objeto: apuntan a un FieldGroup o a un LineItem de una entidad relacionada (ToFlights/@UI.LineItem)."],
            ["manifest.json - dataSources.annotation", "El archivo de anotaciones locales se declara como ODataAnnotation y se enlaza al servicio con settings.annotations."],
            ["Origen de las anotaciones", "En sistemas reales vienen del back-end: CDS con @UI.lineItem, @UI.selectionField (RAP / SADL) o SEGW; el archivo local las completa o las sobrescribe. Orden de prioridad: el archivo local gana al servicio."],
          ], "Qué contiene el archivo"),
        ],
        check: () => !!uP("zsmart") && !!uF("zsmart", "webapp/annotations/annotation.xml"),
        hint: "Crea el proyecto zsmart con la plantilla OData.",
      },
      {
        id: "u8s2",
        title: "SmartFilterBar y SmartTable",
        body: [
          "Los <b>smart controls</b> (librería <code>sap.ui.comp</code>) leen metadata y anotaciones y se construyen solos. En <code>zsmart</code> reemplaza la vista principal:",
          file(`<mvc:View controllerName="zui5.zsmart.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:smartFilterBar="sap.ui.comp.smartfilterbar"
    xmlns:smartTable="sap.ui.comp.smarttable"
    xmlns="sap.m">
    <Page id="page" title="{i18n>title}">
        <content>
            <smartFilterBar:SmartFilterBar
                id="filtros"
                entitySet="Flights"
                persistencyKey="filtrosVuelos"/>
            <smartTable:SmartTable
                id="tablaVuelos"
                entitySet="Flights"
                smartFilterId="filtros"
                tableType="ResponsiveTable"
                useExportToExcel="true"
                useVariantManagement="false"
                useTablePersonalisation="true"
                header="Vuelos"
                showRowCount="true"
                enableAutoBinding="true"
                class="sapUiResponsiveContentPadding"/>
        </content>
    </Page>
</mvc:View>`, "webapp/view/Main.view.xml"),
          "Añade también la librería en <code>manifest.json</code>, en <code>sap.ui5 - dependencies - libs</code>: <code>\"sap.ui.comp\": {}</code>. Ejecuta: aparecen los filtros de UI.SelectionFields y las columnas de UI.LineItem sin haber escrito ninguna columna. Prueba el botón de configuración de la tabla (columnas, orden) y la exportación a Excel.",
          terms([
            ["SmartFilterBar entitySet=\"Flights\"", "Crea la barra de filtros a partir de las propiedades filtrables (sap:filterable) y de UI.SelectionFields. Incluye ayuda de búsqueda si hay ValueList."],
            ["SmartTable smartFilterId", "Enlaza la tabla con la barra: al pulsar Ir, la tabla aplica los filtros en el servidor ($filter)."],
            ["tableType", "ResponsiveTable (sap.m.Table), GridTable (sap.ui.table.Table), AnalyticalTable o TreeTable."],
            ["enableAutoBinding", "La tabla carga datos al arrancar, sin esperar a Ir."],
            ["useTablePersonalisation", "El usuario puede elegir columnas, orden, agrupación y filtros (diálogo P13n)."],
            ["Otros smart controls", "SmartField (un campo que se adapta al tipo y a los permisos), SmartForm, SmartChart, SmartVariantManagement (guardar vistas), SmartLink (navegación por semantic object)."],
          ]),
        ],
        check: () => ctl("zsmart", "sap.ui.comp.smarttable.SmartTable") >= 1 && ctl("zsmart", "sap.ui.comp.smartfilterbar.SmartFilterBar") >= 1 && okRun("zsmart"),
        hint: "Muestra SmartFilterBar y SmartTable en zsmart.",
      },
      {
        id: "u8s3",
        title: "Cambiar la pantalla sin tocar la vista",
        body: [
          "En <code>zsmart</code> edita <code>annotation.xml</code> en la parte de <code>ZFLIGHT_SRV.Flight</code>:",
          "1. En <code>UI.LineItem</code> añade una columna para el tipo de avión:<br><code>&lt;Record Type=\"UI.DataField\"&gt;&lt;PropertyValue Property=\"Value\" Path=\"Planetype\"/&gt;&lt;/Record&gt;</code><br>2. En <code>UI.SelectionFields</code> añade <code>&lt;PropertyPath&gt;Planetype&lt;/PropertyPath&gt;</code>.",
          "Ejecuta de nuevo: la columna y el filtro nuevos aparecen sin haber cambiado la vista XML. Así se mantienen las aplicaciones de Fiori elements: la interfaz se cambia en las anotaciones (o en CDS en el back-end).",
          terms([
            ["UI.DataField", "Campo simple. Variantes: DataFieldForAction (botón que llama a una acción OData), DataFieldWithUrl (enlace), DataFieldForAnnotation (por ejemplo un indicador o un gráfico)."],
            ["UI.Importance", "Indica qué columnas se ocultan primero en pantallas pequeñas (High, Medium, Low)."],
            ["Annotation Modeler / Service Modeler", "En Business Application Studio se editan las anotaciones con ayuda (code completion y vista gráfica)."],
          ]),
        ],
        check: () => /Path="Planetype"/.test(uF("zsmart", "webapp/annotations/annotation.xml")) && /<PropertyPath>\s*Planetype\s*<\/PropertyPath>/.test(uF("zsmart", "webapp/annotations/annotation.xml")) && okRun("zsmart"),
        hint: "Añade Planetype a UI.LineItem y UI.SelectionFields de Flight y ejecuta.",
      },
      {
        id: "u8s4",
        title: "SAP Fiori elements: List Report y Object Page",
        body: [
          "<b>SAP Fiori elements</b> va un paso más allá: no hay vistas ni controladores. Crea en ZUI5 un proyecto con la plantilla <b>SAP Fiori elements: List Report y Object Page</b>, nombre <code>zfelist</code>, título <code>Conexiones</code>. Observa lo que <b>no</b> tiene: ni carpeta view ni controller. Ejecuta, pulsa <b>Ir</b> y haz clic en una conexión: se abre la página de objeto con las secciones Ruta y Vuelos de las anotaciones.",
          terms([
            ["Component.js extends AppComponent", "El componente hereda de sap.suite.ui.generic.template.lib.AppComponent: Fiori elements genera las páginas."],
            ["manifest.json - sap.ui.generic.app.pages", "Define la plantilla de cada página: ListReport sobre Connections y, debajo, ObjectPage. Para añadir otra página (por ejemplo el detalle de un vuelo) se añade un nivel con navigationProperty: ToFlights."],
            ["Floorplans (plantillas)", "<b>List Report</b> (lista con filtros), <b>Object Page</b> (detalle de un objeto), <b>Worklist</b> (lista de tareas sin barra de filtros grande), <b>Overview Page</b> (tarjetas con resúmenes), <b>Analytical List Page</b> (análisis con gráficos y tabla)."],
            ["OData V2 y OData V4", "Fiori elements V2 (sap.suite.ui.generic.template, el que usas aquí) y V4 (sap.fe.templates, para servicios RAP / CAP). La idea es la misma; cambian librería y manifest."],
            ["Extensiones", "Si la plantilla no alcanza: extensiones de controlador, columnas o secciones propias (fragments) declaradas en el manifest. En V4 existe además el Flexible Programming Model (FPM) para mezclar bloques de Fiori elements con código propio."],
            ["Herramientas en BAS", "Generador de aplicaciones Fiori, <b>Page Map</b> (configurar páginas visualmente), <b>Guided Development</b> (asistentes paso a paso) y el editor de anotaciones."],
            ["Draft", "Borrador: los cambios se guardan en el servidor mientras se edita (Editar, Guardar, Descartar). Lo gestionan RAP o la infraestructura del back-end."],
          ]),
          "Reto: en <code>annotation.xml</code> del proyecto zfelist añade la columna <code>Countryfr</code> al LineItem de Connection y comprueba el cambio.",
        ],
        check: () => !!uP("zfelist") && ctl("zfelist", "sap.ui.comp.smarttable.SmartTable") >= 1 && (uR("zfelist")?.hashes || []).some((x) => /Connections\(/.test(x || "")),
        hint: "Ejecuta zfelist y abre una conexión (página de objeto).",
      },
    ],
  },
  {
    id: "u9",
    title: "UI5 Paso 9",
    subtitle: "Launchpad, navegación entre aplicaciones, gráficos y diseño",
    steps: [
      {
        id: "u9s1",
        title: "SAP Fiori launchpad: catálogos, espacios y tiles",
        body: [
          "El <b>SAP Fiori launchpad</b> (FLP) es la entrada única del usuario: muestra las aplicaciones como <b>tiles</b> (mosaicos) según su rol. Cómo se configura (tema del examen):",
          terms([
            ["Catálogo técnico / de negocio", "Un catálogo agrupa tiles y <b>target mappings</b> (las aplicaciones disponibles). El catálogo de negocio es el que se asigna a los roles."],
            ["Espacios y páginas (spaces & pages)", "Lo que el usuario ve en su pantalla de inicio: un espacio tiene páginas y cada página secciones con tiles. Sustituye a los antiguos <b>grupos</b>."],
            ["Rol (PFCG)", "Se asignan catálogos y espacios a un rol y el rol a los usuarios. Sin rol, la aplicación no aparece aunque esté desplegada."],
            ["Tile estático / dinámico", "Estático: título, subtítulo e icono. Dinámico: muestra un número que se lee de un servicio OData (por ejemplo, pedidos pendientes)."],
            ["Target mapping", "Relaciona un <b>intent</b> (objeto semántico + acción, por ejemplo Vuelo-display) con la aplicación concreta (id del componente SAPUI5, URL y parámetros)."],
            ["Transacciones", "/UI2/FLPD_CUST y /UI2/FLPD_CONF (diseñador del launchpad: catálogos), /UI2/FLPCM_CUST o la app Manage Launchpad Spaces (espacios y páginas), /UI2/FLP (abrir el launchpad), /UI2/FLIA (análisis de intents), /UI2/SEMOBJ (objetos semánticos). En SAP BTP: SAP Build Work Zone."],
            ["Tipos de aplicación Fiori", "Transaccionales (crear y modificar, SAPUI5), analíticas (KPIs, Overview Page, ALP), fact sheets (antiguas, detalle de objeto). También se pueden lanzar transacciones SAP GUI y Web Dynpro desde el launchpad."],
          ]),
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
      {
        id: "u9s2",
        title: "Navegación por intents (crossNavigation)",
        body: [
          "Para que una aplicación se pueda abrir desde el launchpad o desde otra aplicación, se declara un <b>inbound</b> en su manifest. En el proyecto <code>zvuelos</code> (Paso 1) añade dentro de <code>\"sap.app\"</code>:",
          file(`"crossNavigation": {
    "inbounds": {
        "vuelos-display": {
            "semanticObject": "Vuelo",
            "action": "display",
            "title": "{{appTitle}}",
            "signature": {
                "parameters": {},
                "additionalParameters": "allowed"
            }
        }
    }
}`, "webapp/manifest.json (dentro de sap.app)"),
          "Desde otra aplicación se navega con el servicio de navegación del launchpad, sin conocer la URL ni el id de la aplicación destino:",
          file(`sap.ui.require(["sap/ushell/Container"], async (Container) => {
    const oNavigation = await Container.getServiceAsync("Navigation");
    oNavigation.navigate({
        target: { semanticObject: "Vuelo", action: "display" },
        params: { Carrid: "LH" }
    });
});`, "controlador de la aplicación origen"),
          terms([
            ["Intent", "Objeto semántico + acción + parámetros. En la URL del launchpad: <code>#Vuelo-display?Carrid=LH</code>."],
            ["semanticObject", "Concepto de negocio (Vuelo, SalesOrder, Customer). Se crea en /UI2/SEMOBJ o se usa uno estándar."],
            ["inbound / outbound", "Inbound: cómo se puede abrir esta aplicación. Outbound: a qué intents navega."],
            ["Navigation (antes CrossApplicationNavigation)", "Servicio del launchpad (sap.ushell). Solo existe dentro del launchpad: por eso en la vista previa standalone no se puede usar; en BAS se prueba con test/flpSandbox.html."],
            ["SmartLink / navegación por semantic object", "Los smart controls muestran enlaces a todas las aplicaciones con ese objeto semántico (popover de navegación)."],
          ]),
        ],
        check: () => {
          try {
            const m = JSON.parse(uF("zvuelos", "webapp/manifest.json") || "{}");
            const ib = Object.values(m["sap.app"]?.crossNavigation?.inbounds || {});
            return ib.some((x) => x.semanticObject && x.action);
          } catch {
            return false;
          }
        },
        hint: "Añade crossNavigation.inbounds con semanticObject y action al manifest de zvuelos.",
      },
      {
        id: "u9s3",
        title: "Gráficos con VizFrame",
        body: [
          "Los gráficos forman parte de SAPUI5 Foundations en el temario. En <code>zvuelos</code> crea una vista nueva o añade al final de la página principal este gráfico de ocupación (usa el modelo JSON <code>vuelos</code> de los primeros pasos):",
          file(`<viz:VizFrame id="graficoOcupacion"
    xmlns:viz="sap.viz.ui5.controls"
    xmlns:viz.data="sap.viz.ui5.data"
    xmlns:viz.feeds="sap.viz.ui5.controls.common.feeds"
    vizType="column"
    width="100%"
    height="360px"
    uiConfig="{applicationSet: 'fiori'}"
    vizProperties="{ title: { text: 'Plazas ocupadas por vuelo' }, plotArea: { dataLabel: { visible: true } } }">
    <viz:dataset>
        <viz.data:FlattenedDataset data="{vuelos>/flights}">
            <viz.data:dimensions>
                <viz.data:DimensionDefinition name="Vuelo" value="{vuelos>carrid} {vuelos>connid}"/>
            </viz.data:dimensions>
            <viz.data:measures>
                <viz.data:MeasureDefinition name="Ocupadas" value="{vuelos>seatsocc}"/>
                <viz.data:MeasureDefinition name="Capacidad" value="{vuelos>seatsmax}"/>
            </viz.data:measures>
        </viz.data:FlattenedDataset>
    </viz:dataset>
    <viz:feeds>
        <viz.feeds:FeedItem uid="valueAxis" type="Measure" values="Ocupadas,Capacidad"/>
        <viz.feeds:FeedItem uid="categoryAxis" type="Dimension" values="Vuelo"/>
    </viz:feeds>
</viz:VizFrame>`, "webapp/view/Main.view.xml (dentro de content)"),
          "Si tu proyecto no tiene el modelo <code>vuelos</code> del Paso 2, cámbialo por el nombre de tu modelo JSON. Ejecuta y prueba cambiar <code>vizType</code> a <code>bar</code>, <code>line</code> o <code>donut</code>.",
          terms([
            ["sap.viz (VizFrame)", "Librería de gráficos de SAPUI5 (no está en OpenUI5). Alternativas: sap.suite.ui.microchart (micrográficos dentro de tablas y tiles) y SmartChart (con anotaciones UI.Chart)."],
            ["FlattenedDataset", "Convierte el modelo en filas con <b>dimensiones</b> (categorías: el texto del eje) y <b>medidas</b> (los números)."],
            ["feeds", "Qué medida o dimensión va en cada eje (valueAxis, categoryAxis, color...)."],
            ["uiConfig applicationSet: 'fiori'", "Aplica el estilo visual de Fiori al gráfico."],
          ]),
        ],
        check: () => ctl("zvuelos", "sap.viz.ui5.controls.VizFrame") >= 1 && okRun("zvuelos"),
        hint: "Muestra un VizFrame en zvuelos.",
      },
      {
        id: "u9s4",
        title: "Diseño Fiori, Design Thinking y datos avanzados",
        body: [
          "Últimos temas del temario que se preguntan sobre todo de forma teórica:",
          terms([
            ["5 principios de diseño Fiori", "<b>Basado en roles</b> (cada usuario ve lo que necesita), <b>adaptable</b> (a dispositivos y contextos), <b>simple</b> (una tarea, lo esencial: 1-1-3: un usuario, un caso de uso, tres pantallas), <b>coherente</b> (mismo lenguaje visual) y <b>agradable</b> (delightful)."],
            ["Design Thinking", "Método centrado en el usuario en dos espacios: <b>espacio del problema</b> (descubrir: entrevistar y observar a usuarios, definir el problema, personas) y <b>espacio de la solución</b> (idear, prototipar y probar con usuarios, iterar). Herramientas: personas, journey maps, prototipos de baja y alta fidelidad (SAP Build, Figma con el kit de Fiori)."],
            ["Elementos de la UX", "Floorplans (List Report, Object Page, Worklist...), controles estándar, patrones de mensajes, navegación, tematización (temas sap_horizon, sap_fiori_3, alto contraste) y accesibilidad."],
            ["Registrar un servicio OData", "En el sistema front-end (Gateway): transacción /IWFND/MAINT_SERVICE (añadir servicio y alias del sistema back-end). Pruebas con /IWFND/GW_CLIENT; errores en /IWFND/ERROR_LOG."],
            ["Deep insert", "Crear un objeto con sus hijos en una sola petición: oModel.create(\"/Connections\", { Carrid: \"LH\", Connid: \"9999\", ToFlights: [{ ... }, { ... }] }). El back-end debe implementarlo (CREATE_DEEP_ENTITY)."],
            ["$batch y grupos de cambios", "El ODataModel V2 agrupa peticiones en un $batch; con setDeferredGroups y submitChanges se envían varios cambios juntos (como una LUW)."],
            ["FacetFilter", "Control sap.m.FacetFilter: filtros por facetas (listas de valores con selección múltiple), útil con muchos criterios."],
            ["Arquitectura", "Front-end server (SAP Gateway + librería SAPUI5 + launchpad) separado o embebido en el back-end (S/4HANA), Web Dispatcher como punto de entrada y, en la nube, SAP BTP con Cloud Connector hacia el sistema on-premise."],
          ], "Temas teóricos"),
          "Con esto completas las áreas del temario C_FIORD. Para el examen real, SAP recomienda la learning journey oficial en learning.sap.com y práctica en un sistema real.",
        ],
        check: () => false,
        hint: "Lee el contenido y pulsa Marcar como hecho.",
      },
    ],
  },
];
