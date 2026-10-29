REPORT zp3_operaciones.

TYPES: BEGIN OF ty_producto,
         codigo TYPE c LENGTH 10,
         nombre TYPE c LENGTH 20,
         precio TYPE p LENGTH 8 DECIMALS 2,
         stock  TYPE i,
       END OF ty_producto.

DATA lt_productos TYPE STANDARD TABLE OF ty_producto WITH EMPTY KEY.

lt_productos = VALUE #(
  ( codigo = 'P001' nombre = 'Laptop'    precio = '3890.00' stock = 12 )
  ( codigo = 'P002' nombre = 'Monitor'   precio = '790.00'  stock = 30 )
  ( codigo = 'P003' nombre = 'Teclado'   precio = '120.00'  stock = 0 )
  ( codigo = 'P004' nombre = 'Mouse'     precio = '65.00'   stock = 80 )
  ( codigo = 'P005' nombre = 'Parlantes' precio = '150.00'  stock = 0 ) ).

" READ TABLE: buscar una línea por un campo
READ TABLE lt_productos INTO DATA(ls_producto) WITH KEY codigo = 'P002'.
IF sy-subrc = 0.
  WRITE: / 'Encontrado:', ls_producto-nombre, 'en la línea', sy-tabix.
ENDIF.

" Expresión de tabla (ABAP moderno)
IF line_exists( lt_productos[ codigo = 'P004' ] ).
  WRITE: / 'Precio del mouse:', lt_productos[ codigo = 'P004' ]-precio.
ENDIF.

" Modificar con un field-symbol: subir 10% los precios
LOOP AT lt_productos ASSIGNING FIELD-SYMBOL(<ls_prod>).
  <ls_prod>-precio = <ls_prod>-precio * '1.10'.
ENDLOOP.

" MODIFY con TRANSPORTING: cambiar solo el stock del teclado
ls_producto-stock = 25.
MODIFY lt_productos FROM ls_producto TRANSPORTING stock WHERE codigo = 'P003'.

" Borrar los productos sin stock y ordenar por precio
DELETE lt_productos WHERE stock = 0.
SORT lt_productos BY precio DESCENDING.

ULINE.
LOOP AT lt_productos INTO ls_producto.
  WRITE: / ls_producto-codigo, ls_producto-nombre, ls_producto-precio, ls_producto-stock.
ENDLOOP.
