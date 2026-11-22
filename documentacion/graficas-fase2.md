# Gráficos estadísticos de Fase 2

El módulo 4 reemplaza las gráficas estáticas de `graficas.html` por una gráfica de barras horizontal con Chart.js. Cuenta transacciones por tipo, sin sumar sus montos, y presenta los mismos valores en una tabla accesible.

## Archivos

- `graficas.html`: canvas, tabla de cantidades, mensajes y carga de Chart.js 4.4.8 desde CDN.
- `js/graficas.js`: lectura, conteo y actualización de la gráfica. Cada función tiene comentarios.
- `css/graficas.css`: ajustes exclusivos de esta pantalla para móvil y escritorio.
- `tests/graficas.test.cjs`: pruebas de lógica con las herramientas integradas de Node.js, sin instalar paquetes.

## Contrato de integración

La rama principal actualmente escribe en `localStorage["pokemonBankHistorial"]`, un arreglo JSON con este formato:

```json
[
  { "fecha": "22/11/2026", "tipo": "Depósito", "detalle": "Depósito en cuenta", "monto": 25 },
  { "fecha": "22/11/2026", "tipo": "Retiro", "detalle": "Retiro de efectivo", "monto": 10 },
  { "fecha": "22/11/2026", "tipo": "Servicios", "detalle": "Internet", "monto": 5 }
]
```

`tipo` debe coincidir con `Depósito`, `Retiro` o `Servicios`. Los cuatro servicios se agrupan en una categoría. Los montos no intervienen en el conteo y consultar el saldo no genera una transacción. Entradas nulas y tipos desconocidos se ignoran.

La guía propone `transaccionesATM` como ejemplo; esa clave aún no existe en la rama principal revisada. Si el integrante 1 cambia el contrato, actualizar `CLAVE_HISTORIAL` y, si corresponde, `TIPOS` en `js/graficas.js` junto con los módulos de transacciones e historial. No leer ambos historiales ni unirlos: eso podría duplicar movimientos.

Esta pantalla solamente lee los datos. No inicializa usuarios, altera el saldo ni borra historial.

## Actualización automática

- Al cargar la pantalla y al volver con Atrás/Adelante (`pageshow`).
- Al recuperar el foco de la ventana.
- Cuando otra pestaña del mismo origen guarda el historial o limpia el almacenamiento (`storage`).
- Si en el futuro se registran operaciones en la misma página, después de guardarlas emitir:

```javascript
window.dispatchEvent(new Event("pokemonbank:transacciones-actualizadas"));
```

El evento `storage` no se dispara en la pestaña que realiza la escritura. En el flujo actual, las operaciones ocurren en `menu.html` y la gráfica relee los datos al navegar a ella. Se reutiliza una única instancia de Chart.js mediante `update()`.

## Validación

Ejecutar desde la raíz del repositorio con Node.js:

```sh
node --test tests/graficas.test.cjs
```

Prueba manual con un servidor estático y almacenamiento de prueba independiente:

1. Abrir `graficas.html` sin historial: aparecen ceros y un mensaje de estado vacío.
2. Desde el menú, realizar dos depósitos con montos distintos, un retiro y un pago. La gráfica debe indicar 2, 1 y 1; total 4.
3. Recargar y navegar Atrás/Adelante: las cantidades deben conservarse.
4. Mantener la gráfica abierta y operar desde otra pestaña del mismo sitio: las cantidades deben actualizarse.
5. Probar a 360 px y en escritorio: la gráfica, tabla y enlaces deben ser accesibles sin desbordamiento horizontal.
6. Si el JSON está dañado o no es un arreglo, se informa el error, se oculta la gráfica y se muestran guiones en lugar de cantidades. Los datos originales se conservan.
7. Si no carga Chart.js, aparece una advertencia y la tabla sigue mostrando los conteos.

Chart.js, Bootstrap y las fuentes se cargan desde Internet, igual que las dependencias de las otras pantallas.
