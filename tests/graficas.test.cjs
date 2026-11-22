"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const codigo = fs.readFileSync(path.join(__dirname, "../js/graficas.js"), "utf8");
const CLAVE = "pokemonBankHistorial";

// Ejecuta el módulo real con los límites externos del navegador simulados.
// No copia la lógica de conteo ni la lógica de actualización de la aplicación.
function cargar(t, { historial = null, sinChart = false, accesoBloqueado = false } = {}) {
  const elementos = new Map();
  const eventos = new Map();
  const graficas = [];
  const lecturas = [];
  const escrituras = [];
  const almacenamiento = new Map();
  if (historial !== null) almacenamiento.set(CLAVE, historial);

  function elemento(id) {
    if (!elementos.has(id)) {
      let contenido = "";
      elementos.set(id, {
        hidden: false,
        parentElement: { hidden: false },
        className: "",
        atributos: {},
        set textContent(valor) { contenido = String(valor); },
        get textContent() { return contenido; },
        setAttribute(nombre, valor) { this.atributos[nombre] = String(valor); }
      });
    }
    return elementos.get(id);
  }

  class Chart {
    constructor(canvas, configuracion) {
      this.canvas = canvas;
      this.data = configuracion.data;
      this.options = configuracion.options;
      this.actualizaciones = 0;
      graficas.push(this);
    }
    update() { this.actualizaciones += 1; }
  }

  const window = {
    addEventListener(nombre, funcion) {
      const callbacks = eventos.get(nombre) || [];
      callbacks.push(funcion);
      eventos.set(nombre, callbacks);
    }
  };
  if (!sinChart) window.Chart = Chart;

  vm.runInNewContext(codigo, {
    window,
    document: { getElementById: elemento },
    localStorage: {
      getItem(clave) {
        lecturas.push(clave);
        if (accesoBloqueado) throw new Error("Storage deshabilitado");
        return almacenamiento.get(clave) ?? null;
      },
      setItem(...args) { escrituras.push(["setItem", ...args]); },
      removeItem(...args) { escrituras.push(["removeItem", ...args]); },
      clear() { escrituras.push(["clear"]); }
    }
  });

  // Ningún escenario debe escribir, borrar o inicializar datos del usuario.
  t.after(() => assert.deepEqual(escrituras, []));
  return {
    elemento, graficas, almacenamiento, lecturas,
    emitir(nombre, datos = {}) {
      for (const callback of eventos.get(nombre) || []) callback(datos);
    },
    cantidades() { return Array.from(graficas[0].data.datasets[0].data); },
    tabla() {
      return ["cantidadDepositos", "cantidadRetiros", "cantidadServicios", "cantidadTotal"]
        .map(id => elemento(id).textContent);
    }
  };
}

test("Sin historial: presenta ceros y explica cómo crear la primera transacción", t => {
  const app = cargar(t);
  assert.deepEqual(app.cantidades(), [0, 0, 0]);
  assert.deepEqual(app.tabla(), ["0", "0", "0", "0"]);
  assert.equal(app.elemento("estadoGrafica").hidden, false);
  assert.match(app.elemento("estadoGrafica").textContent, /Aún no hay transacciones/);
  assert.deepEqual(app.lecturas, [CLAVE]);
  assert.equal(app.almacenamiento.size, 0);
});

test("Cuenta operaciones por tipo y no suma sus montos", t => {
  const historial = JSON.stringify([
    { tipo: "Depósito", monto: 10 },
    { tipo: "Depósito", monto: 20 },
    { tipo: "Depósito", monto: 50 },
    { tipo: "Retiro", monto: 500 },
    { tipo: "Servicios", detalle: "Agua potable", monto: 15 },
    { tipo: "Servicios", detalle: "Internet", monto: 35 }
  ]);
  const app = cargar(t, { historial });
  assert.deepEqual(app.cantidades(), [3, 1, 2]);
  assert.deepEqual(app.tabla(), ["3", "1", "2", "6"]);
  assert.equal(app.elemento("estadoGrafica").hidden, true);
  assert.match(app.elemento("graficaTransacciones").atributos["aria-label"], /Depósitos: 3/);
  assert.equal(app.almacenamiento.get(CLAVE), historial);
});

test("Ignora entradas nulas, primitivas, sin tipo y tipos desconocidos", t => {
  const app = cargar(t, { historial: JSON.stringify([
    null, 1, "Depósito", false, {}, [], { tipo: null },
    { tipo: "Consulta" }, { tipo: "tipo-inventado" }, { tipo: "Retiro", monto: 1 }
  ]) });
  assert.deepEqual(app.cantidades(), [0, 1, 0]);
  assert.deepEqual(app.tabla(), ["0", "1", "0", "1"]);
});

for (const historial of ["{malformado", "{}", "null", '"texto"', "42"]) {
  test(`Historial inválido (${historial}): avisa y conserva el contenido original`, t => {
    const app = cargar(t, { historial });
    assert.equal(app.elemento("estadoGrafica").hidden, false);
    assert.match(app.elemento("estadoGrafica").className, /alert-warning/);
    assert.match(app.elemento("estadoGrafica").textContent, /No se pudieron leer/);
    assert.deepEqual(app.tabla(), ["—", "—", "—", "—"]);
    assert.equal(app.elemento("graficaTransacciones").parentElement.hidden, true);
    assert.equal(app.graficas.length, 0);
    assert.equal(app.almacenamiento.get(CLAVE), historial);
  });
}

test("Si el navegador bloquea localStorage, informa el error sin romper la página", t => {
  const app = cargar(t, { accesoBloqueado: true });
  assert.deepEqual(app.tabla(), ["—", "—", "—", "—"]);
  assert.match(app.elemento("estadoGrafica").textContent, /No se pudieron leer/);
});

test("storage actualiza otra pestaña, ignora otras claves y procesa un borrado completo", t => {
  const app = cargar(t);
  const instancia = app.graficas[0];
  app.almacenamiento.set(CLAVE, JSON.stringify([{ tipo: "Depósito", monto: 100 }]));
  app.emitir("storage", { key: "pokemonBankSaldo" });
  assert.deepEqual(app.cantidades(), [0, 0, 0]);
  assert.equal(app.lecturas.length, 1);
  app.emitir("storage", { key: CLAVE });
  assert.deepEqual(app.cantidades(), [1, 0, 0]);
  assert.deepEqual(app.tabla(), ["1", "0", "0", "1"]);
  assert.equal(app.graficas.length, 1);
  assert.equal(app.graficas[0], instancia);
  assert.equal(instancia.actualizaciones, 1);
  app.almacenamiento.clear();
  app.emitir("storage", { key: null });
  assert.deepEqual(app.cantidades(), [0, 0, 0]);
  assert.equal(app.elemento("estadoGrafica").hidden, false);
  assert.equal(instancia.actualizaciones, 2);
});

for (const evento of ["pageshow", "focus", "pokemonbank:transacciones-actualizadas"]) {
  test(`${evento} vuelve a leer los datos sin crear otra instancia del gráfico`, t => {
    const app = cargar(t);
    app.almacenamiento.set(CLAVE, JSON.stringify([
      { tipo: "Servicios", monto: 20 }, { tipo: "Servicios", monto: 30 }
    ]));
    app.emitir(evento);
    assert.deepEqual(app.cantidades(), [0, 0, 2]);
    assert.deepEqual(app.tabla(), ["0", "0", "2", "2"]);
    assert.equal(app.graficas.length, 1);
    assert.equal(app.graficas[0].actualizaciones, 1);
  });
}

test("Un error de almacenamiento posterior no conserva cifras anteriores como válidas", t => {
  const app = cargar(t, { historial: JSON.stringify([{ tipo: "Depósito", monto: 100 }]) });
  app.almacenamiento.set(CLAVE, "no es JSON");
  app.emitir("storage", { key: CLAVE });
  assert.deepEqual(app.tabla(), ["—", "—", "—", "—"]);
  assert.equal(app.elemento("graficaTransacciones").parentElement.hidden, true);
  assert.match(app.elemento("graficaTransacciones").atributos["aria-label"], /no disponible/);
  app.almacenamiento.set(CLAVE, JSON.stringify([{ tipo: "Retiro", monto: 5 }]));
  app.emitir("storage", { key: CLAVE });
  assert.deepEqual(app.tabla(), ["0", "1", "0", "1"]);
  assert.equal(app.elemento("estadoGrafica").hidden, true);
  assert.equal(app.elemento("graficaTransacciones").parentElement.hidden, false);
  assert.deepEqual(app.cantidades(), [0, 1, 0]);
});

test("Si Chart.js no carga, la tabla sigue mostrando los conteos y se avisa al usuario", t => {
  const app = cargar(t, {
    sinChart: true,
    historial: JSON.stringify([{ tipo: "Retiro", monto: 99 }, { tipo: "Servicios", monto: 5 }])
  });
  assert.deepEqual(app.tabla(), ["0", "1", "1", "2"]);
  assert.equal(app.graficas.length, 0);
  assert.equal(app.elemento("graficaTransacciones").hidden, true);
  assert.equal(app.elemento("errorGrafica").hidden, false);
  assert.match(app.elemento("errorGrafica").textContent, /consultar las cantidades en la tabla/);
});
