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
];
