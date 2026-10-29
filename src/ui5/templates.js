// Plantillas de proyecto SAPUI5 (como los generadores de Business Application Studio).
import { metadataXml, mockData, jsonFlights, annotationsXml, SERVICE_URL } from "./odata.js";

export const NAMESPACE = "zui5";
export const appId = (name) => `${NAMESPACE}.${name}`;
const pathOf = (name) => `${NAMESPACE}/${name}`;

export const TEMPLATES = [
  { id: "basic", title: "Aplicación SAPUI5 básica", text: "Plantilla \"Basic\": Component, manifest, vista principal con routing, i18n. Es el punto de partida de casi todas las prácticas." },
  { id: "odata", title: "Aplicación con servicio OData V2 (vuelos)", text: "Igual que la básica, más un servicio OData V2 simulado ZFLIGHT_SRV (aerolíneas, conexiones, vuelos, clientes, reservas) con MockServer y un archivo de anotaciones locales." },
  { id: "fe", title: "SAP Fiori elements: List Report y Object Page (OData V2)", text: "Aplicación generada sin vistas ni controladores: la pantalla sale de las plantillas de Fiori elements y de las anotaciones (annotations/annotation.xml) del servicio ZFLIGHT_SRV." },
];

const json = (o) => JSON.stringify(o, null, 2) + "\n";

function indexHtml(name, title, onInit = "module:sap/ui/core/ComponentSupport") {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script
        id="sap-ui-bootstrap"
        src="resources/sap-ui-core.js"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-resource-roots='{
            "${appId(name)}": "./"
        }'
        data-sap-ui-on-init="${onInit}"
        data-sap-ui-compat-version="edge"
        data-sap-ui-async="true"
        data-sap-ui-frame-options="trusted"
    ></script>
</head>
<body class="sapUiBody sapUiSizeCompact" id="content">
    <div
        data-sap-ui-component
        data-name="${appId(name)}"
        data-id="container"
        data-settings='{"id" : "${appId(name)}"}'
        data-handle-validation="true"
    ></div>
</body>
</html>
`;
}

function manifest(name, title, withOData) {
  const id = appId(name);
  const m = {
    _version: "1.65.0",
    "sap.app": {
      id,
      type: "application",
      i18n: "i18n/i18n.properties",
      applicationVersion: { version: "0.0.1" },
      title: "{{appTitle}}",
      description: "{{appDescription}}",
      ...(withOData
        ? {
            dataSources: {
              mainService: {
                uri: SERVICE_URL,
                type: "OData",
                settings: { annotations: ["annotation"], odataVersion: "2.0", localUri: "localService/metadata.xml" },
              },
              annotation: {
                type: "ODataAnnotation",
                uri: "annotations/annotation.xml",
                settings: { localUri: "annotations/annotation.xml" },
              },
            },
          }
        : {}),
    },
    "sap.ui": {
      technology: "UI5",
      icons: { icon: "", favIcon: "", phone: "", "phone@2": "", tablet: "", "tablet@2": "" },
      deviceTypes: { desktop: true, tablet: true, phone: true },
    },
    "sap.ui5": {
      flexEnabled: false,
      dependencies: { minUI5Version: "1.136.0", libs: { "sap.m": {}, "sap.ui.core": {} } },
      contentDensities: { compact: true, cozy: true },
      models: {
        i18n: { type: "sap.ui.model.resource.ResourceModel", settings: { bundleName: `${id}.i18n.i18n`, supportedLocales: ["", "en"], fallbackLocale: "" } },
        ...(withOData ? { "": { dataSource: "mainService", preload: true, settings: { defaultBindingMode: "TwoWay" } } } : {}),
      },
      resources: { css: [{ uri: "css/style.css" }] },
      routing: {
        config: { routerClass: "sap.m.routing.Router", controlAggregation: "pages", controlId: "app", transition: "slide", type: "View", viewType: "XML", path: `${id}.view`, async: true, viewPath: `${id}.view` },
        routes: [{ name: "RouteMain", pattern: ":?query:", target: ["TargetMain"] }],
        targets: { TargetMain: { id: "Main", name: "Main" } },
      },
      rootView: { viewName: `${id}.view.App`, type: "XML", id: "App", async: true },
    },
  };
  return json(m);
}

const componentJs = (name) => `sap.ui.define([
    "sap/ui/core/UIComponent",
    "${pathOf(name)}/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("${appId(name)}.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // llamar al init del padre (UIComponent)
            UIComponent.prototype.init.apply(this, arguments);

            // modelo del dispositivo (teléfono, tableta, escritorio)
            this.setModel(models.createDeviceModel(), "device");

            // activar el enrutamiento (routing del manifest.json)
            this.getRouter().initialize();
        }
    });
});
`;

const modelsJs = () => `sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], (JSONModel, Device) => {
    "use strict";

    return {
        createDeviceModel() {
            const oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        }
    };
});
`;

const appView = (name) => `<mvc:View controllerName="${appId(name)}.controller.App"
    xmlns:mvc="sap.ui.core.mvc"
    displayBlock="true"
    xmlns="sap.m">
    <App id="app">
    </App>
</mvc:View>
`;

const appController = (name) => `sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (BaseController) => {
    "use strict";

    return BaseController.extend("${appId(name)}.controller.App", {
        onInit() {
        }
    });
});
`;

const mainView = (name) => `<mvc:View controllerName="${appId(name)}.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m">
    <Page id="page" title="{i18n>title}">
        <content>
        </content>
    </Page>
</mvc:View>
`;

const mainController = (name) => `sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("${appId(name)}.controller.Main", {
        onInit() {
        }
    });
});
`;

const i18n = (title, lang) =>
  lang === "en"
    ? `# This is the resource bundle for ${title}\n\n#Texts for manifest.json\n\n#XTIT: Application name\nappTitle=${title}\n\n#YDES: Application description\nappDescription=SAPUI5 practice application\n\n#XTIT: Main view title\ntitle=${title}\n`
    : `# Textos de la aplicación ${title} (idioma por defecto: español)\n\n#Textos del manifest.json\n\n#XTIT: Nombre de la aplicación\nappTitle=${title}\n\n#YDES: Descripción de la aplicación\nappDescription=Aplicación SAPUI5 de práctica\n\n#XTIT: Título de la vista principal\ntitle=${title}\n`;

const mockserverJs = (name) => `sap.ui.define([
    "sap/ui/core/util/MockServer"
], (MockServer) => {
    "use strict";

    // Servidor OData simulado: responde a las peticiones del ODataModel
    // con los archivos de localService/ (metadata.xml y mockdata/*.json).
    return {
        init() {
            const oMockServer = new MockServer({
                rootUri: "${SERVICE_URL}"
            });
            MockServer.config({ autoRespond: true, autoRespondAfter: 300 });
            const sPath = sap.ui.require.toUrl("${pathOf(name)}/localService");
            oMockServer.simulate(sPath + "/metadata.xml", {
                sMockdataBaseUrl: sPath + "/mockdata",
                bGenerateMissingMockData: false
            });
            oMockServer.start();
        }
    };
});
`;

const initMockServerJs = (name) => `sap.ui.define([
    "${pathOf(name)}/localService/mockserver"
], (mockserver) => {
    "use strict";

    // primero se arranca el servidor simulado y después la aplicación
    mockserver.init();
    sap.ui.require(["sap/ui/core/ComponentSupport"]);
});
`;

function feManifest(name, title) {
  const id = appId(name);
  return json({
    _version: "1.65.0",
    "sap.app": {
      id,
      type: "application",
      i18n: "i18n/i18n.properties",
      applicationVersion: { version: "0.0.1" },
      title: "{{appTitle}}",
      description: "{{appDescription}}",
      dataSources: {
        mainService: { uri: SERVICE_URL, type: "OData", settings: { annotations: ["annotation"], odataVersion: "2.0", localUri: "localService/metadata.xml" } },
        annotation: { type: "ODataAnnotation", uri: "annotations/annotation.xml", settings: { localUri: "annotations/annotation.xml" } },
      },
    },
    "sap.ui": { technology: "UI5", deviceTypes: { desktop: true, tablet: true, phone: true } },
    "sap.ui5": {
      flexEnabled: true,
      dependencies: { minUI5Version: "1.136.0", libs: { "sap.m": {}, "sap.ui.core": {}, "sap.f": {}, "sap.ui.comp": {}, "sap.suite.ui.generic.template": {}, "sap.uxap": {} } },
      contentDensities: { compact: true, cozy: true },
      models: {
        i18n: { type: "sap.ui.model.resource.ResourceModel", settings: { bundleName: `${id}.i18n.i18n` } },
        "@i18n": { type: "sap.ui.model.resource.ResourceModel", uri: "i18n/i18n.properties" },
        "": { dataSource: "mainService", preload: true, settings: { defaultBindingMode: "TwoWay", defaultCountMode: "Inline", refreshAfterChange: false } },
      },
    },
    "sap.ui.generic.app": {
      _version: "1.3.0",
      settings: { forceGlobalRefresh: false, objectPageHeaderType: "Dynamic", showDraftToggle: false },
      pages: {
        "ListReport|Connections": {
          entitySet: "Connections",
          component: { name: "sap.suite.ui.generic.template.ListReport", list: true, settings: { condensedTableLayout: true, smartVariantManagement: true, tableSettings: { type: "ResponsiveTable" } } },
          pages: {
            "ObjectPage|Connections": { entitySet: "Connections", defaultLayoutTypeIfExternalNavigation: "MidColumnFullScreen", component: { name: "sap.suite.ui.generic.template.ObjectPage" } },
          },
        },
      },
    },
    "sap.fiori": { registrationIds: [], archeType: "transactional" },
  });
}

const feComponentJs = (name) => `sap.ui.define([
    "sap/suite/ui/generic/template/lib/AppComponent"
], (AppComponent) => {
    "use strict";

    // En SAP Fiori elements no hay vistas propias: el componente hereda de AppComponent
    // y la pantalla se construye con las plantillas (manifest: sap.ui.generic.app) y las anotaciones.
    return AppComponent.extend("${appId(name)}.Component", {
        metadata: {
            manifest: "json"
        }
    });
});
`;

export function createProject(template, name, title, engine) {
  if (template === "fe") {
    const files = {
      "package.json": json({ name, version: "0.0.1", private: true, description: title, scripts: { start: "fiori run --open \"test/flpSandbox.html\"", build: "ui5 build --config=ui5.yaml --clean-dest --dest dist", deploy: "fiori deploy" }, devDependencies: { "@ui5/cli": "^4", "@sap/ux-ui5-tooling": "1" } }),
      "webapp/index.html": indexHtml(name, title, `module:${pathOf(name)}/initMockServer`).replace('data-sap-ui-frame-options="trusted"', `data-sap-ui-frame-options="trusted"
        data-sap-ui-flexibility-services='[{"connector":"LocalStorageConnector"}]'`),
      "webapp/manifest.json": feManifest(name, title),
      "webapp/Component.js": feComponentJs(name),
      "webapp/annotations/annotation.xml": annotationsXml(),
      "webapp/i18n/i18n.properties": `appTitle=${title}\nappDescription=Aplicación SAP Fiori elements de práctica\n`,
      "webapp/initMockServer.js": initMockServerJs(name),
      "webapp/localService/mockserver.js": mockserverJs(name),
      "webapp/localService/metadata.xml": metadataXml(),
    };
    for (const [f, rows] of Object.entries(mockData(engine))) files["webapp/localService/mockdata/" + f] = JSON.stringify(rows, null, 1) + "\n";
    return files;
  }
  const odata = template === "odata";
  const files = {
    "package.json": json({ name, version: "0.0.1", private: true, description: title, scripts: { start: "fiori run --open \"test/flpSandbox.html\"", build: "ui5 build --config=ui5.yaml --clean-dest --dest dist", deploy: "fiori deploy" }, devDependencies: { "@ui5/cli": "^4", "@sap/ux-ui5-tooling": "1" } }),
    "ui5.yaml": `specVersion: "4.0"\nmetadata:\n  name: ${appId(name)}\ntype: application\nserver:\n  customMiddleware:\n    - name: fiori-tools-proxy\n      afterMiddleware: compression\n      configuration:\n        ui5:\n          path:\n            - /resources\n            - /test-resources\n          url: https://ui5.sap.com\n`,
    "webapp/index.html": indexHtml(name, title, odata ? `module:${pathOf(name)}/initMockServer` : undefined),
    "webapp/manifest.json": manifest(name, title, odata),
    "webapp/Component.js": componentJs(name),
    "webapp/model/models.js": modelsJs(),
    "webapp/view/App.view.xml": appView(name),
    "webapp/view/Main.view.xml": mainView(name),
    "webapp/controller/App.controller.js": appController(name),
    "webapp/controller/Main.controller.js": mainController(name),
    "webapp/i18n/i18n.properties": i18n(title, "es"),
    "webapp/i18n/i18n_en.properties": i18n(title, "en"),
    "webapp/model/vuelos.json": JSON.stringify(jsonFlights(engine), null, 1) + "\n",
    "webapp/css/style.css": "/* Estilos propios de la aplicación. Úsalos con moderación: los controles ya siguen el diseño SAP Fiori. */\n",
  };
  if (odata) {
    files["webapp/initMockServer.js"] = initMockServerJs(name);
    files["webapp/localService/mockserver.js"] = mockserverJs(name);
    files["webapp/localService/metadata.xml"] = metadataXml();
    files["webapp/annotations/annotation.xml"] = annotationsXml();
    for (const [f, rows] of Object.entries(mockData(engine))) files["webapp/localService/mockdata/" + f] = JSON.stringify(rows, null, 1) + "\n";
  }
  return files;
}

export function languageOf(path) {
  const ext = path.split(".").pop().toLowerCase();
  return { xml: "xml", html: "html", js: "javascript", json: "json", css: "css", properties: "ini", yaml: "yaml" }[ext] || "plaintext";
}
