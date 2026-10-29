REPORT zp3_tablas.

TYPES: BEGIN OF ty_producto,
         codigo TYPE c LENGTH 10,
         nombre TYPE c LENGTH 20,
         precio TYPE p LENGTH 8 DECIMALS 2,
         stock  TYPE i,
       END OF ty_producto,
       tt_productos TYPE STANDARD TABLE OF ty_producto WITH EMPTY KEY.

DATA: ls_producto  TYPE ty_producto,
      lt_productos TYPE tt_productos.

" 1) Llenar con APPEND usando un área de trabajo
ls_producto-codigo = 'P001'.
ls_producto-nombre = 'Laptop'.
ls_producto-precio = '3890.00'.
ls_producto-stock  = 12.
APPEND ls_producto TO lt_productos.

" 2) Llenar con VALUE (ABAP moderno)
APPEND VALUE #( codigo = 'P002' nombre = 'Monitor' precio = '790.00' stock = 30 ) TO lt_productos.
lt_productos = VALUE #( BASE lt_productos
  ( codigo = 'P003' nombre = 'Teclado' precio = '120.00' stock = 0 )
  ( codigo = 'P004' nombre = 'Mouse'   precio = '65.00'  stock = 80 ) ).

WRITE: / 'Productos en la tabla:', lines( lt_productos ).
ULINE.
LOOP AT lt_productos INTO ls_producto.
  WRITE: / sy-tabix, ls_producto-codigo, ls_producto-nombre, ls_producto-precio, ls_producto-stock.
ENDLOOP.
