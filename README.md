# Práctica ABAP

Un sistema de práctica ABAP que corre **100 % en el navegador**, con la experiencia de un SAP GUI:
campo de comandos, transacciones, F3/F8, barra de estado… sin paquetes ni órdenes de transporte.

## Qué incluye

| Transacción | Qué puedes hacer |
|---|---|
| **SE38** | Crear, modificar, grabar (Ctrl+S), verificar (Ctrl+F2), activar (Ctrl+F3) y ejecutar (F8) programas. Pretty Printer, elementos de texto y traducción ES/EN. |
| **SE11** | Crear tablas transparentes (campos, claves, tipos predefinidos) y activarlas en la base de datos. |
| **SE16** | Ver, filtrar, crear, modificar y borrar registros de cualquier tabla. |
| **SE84** | Buscar programas y tablas por nombre o descripción. |

- **Motor ABAP real**: el código se transpila a JavaScript con [abaplint transpiler](https://github.com/abaplint/transpiler) y se ejecuta con su runtime. Soporta ABAP moderno (expresiones en línea, string templates, clases locales, excepciones) y clásico (FORM, eventos, pantallas de selección).
- **Base de datos SQLite** (sql.js) en el navegador, persistida en `localStorage`. Incluye tablas estándar con datos coherentes entre sí: vuelos (SCARR, SPFLI, SFLIGHT, SBOOK, SCUSTOM), finanzas (T001, T005, TCURC), ventas (KNA1, VBAK, VBAP), compras (LFA1, EKKO, EKPO), materiales (MARA, MAKT) y personal (PA0001, PA0002, PA0008).
- **Includes** (programas de tipo I) con navegación por doble clic y verificación dentro del programa principal.
- **Depurador**: puntos de parada en el margen del editor, `BREAK-POINT`, F5/F6/F8, variables, tablas internas, estructuras y objetos.
- **Pantalla de selección**: PARAMETERS (checkbox, radiobutton, OBLIGATORY, LOWER CASE), SELECT-OPTIONS con selección múltiple, bloques con marco, textos de selección.
- **Eventos**: INITIALIZATION, AT SELECTION-SCREEN, START-OF-SELECTION, END-OF-SELECTION, TOP-OF-PAGE.
- **ALV con `CL_SALV_TABLE`**: barra de pulsadores (`set_all`/`set_default`), columnas (optimizar, textos, ocultar), título, cebra, orden, subtotales y totales, detalle, filtro, layout y exportación a hoja de cálculo.
- **Mensajes** (`MESSAGE ... TYPE 'S'/'I'/'W'/'E'`, `DISPLAY LIKE`) y **dumps** tipo ST22 (excepciones no capturadas, bucles infinitos).
- **Guías de práctica** paso a paso que se validan solas, con explicación de la sintaxis en cada código:
  - Paso 1: fundamentos, campos SY, pantalla de selección, SE11/SE16, SELECT e INCLUDE
  - Paso 2: reportes ALV
  - Paso 3: tablas internas, depurador, tablas estándar y JOINs
  - Paso 4: programación orientada a objetos

- **Guía en pantalla completa**: botón para abrirla en otra ventana; se sincroniza sola con el sistema.
- **Retos y juegos (ZJUEGOS)**: 32 retos con puntos y niveles: completar el código, adivinar la salida, encontrar el error y programar desde cero (se corrige ejecutando el programa y comparando la salida).

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

Probar el motor sin navegador:

```bash
node scripts/test-engine.mjs scripts/ejemplos/zp1_hola.abap
```

## Despliegue en Vercel

1. En vercel.com → **Add New → Project** → importa este repositorio.
2. Vercel detecta Vite automáticamente (`vercel.json` ya lo configura): build `npm run build`, salida `dist`.
3. Cada `git push` a `main` vuelve a desplegar.

## Estructura

```
src/
  app.js            Marco SAP GUI (menú, comandos, barras, teclado)
  guides.js         Guías Paso 1 y Paso 2 con validación automática
  editor.js         Monaco con resaltado ABAP
  screens/          SE38, SE11, SE16, SE84, ejecución, ALV
  engine/
    engine.js       Verificación, transpilación y ejecución
    preprocess.js   Eventos y pantalla de selección → código ejecutable
    ddic.js         Tipos del diccionario y XML de tablas
    standard.js     Tablas de vuelos de ejemplo
    abaplib/        Clases ABAP del simulador (excepciones, CL_SALV_*)
```

## Limitaciones

No hay dynpros (CALL SCREEN), Smartforms/Adobe Forms, RFC/BAPI ni sistema de transporte.
Los datos viven en el navegador de cada usuario (usa *Sistema → Exportar mis datos* para respaldos).

Proyecto educativo, no afiliado a SAP SE. "SAP" y "ABAP" son marcas de SAP SE.
Motor: abaplint (MIT). Clases de excepción: open-abap (MIT), ver `src/engine/abaplib/THIRD_PARTY.md`.
