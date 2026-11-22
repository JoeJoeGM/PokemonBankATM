(function () {
  "use strict";

  // Contrato actual de menu.html. Cambiar esta clave en conjunto con el equipo
  // si el módulo de memoria de Fase 2 adopta otro nombre de almacenamiento.
  const CLAVE_HISTORIAL = "pokemonBankHistorial";
  const TIPOS = ["Depósito", "Retiro", "Servicios"];
  const ETIQUETAS = ["Depósitos", "Retiros", "Pagos de servicios"];
  const IDS_CANTIDADES = ["cantidadDepositos", "cantidadRetiros", "cantidadServicios"];
  const canvas = document.getElementById("graficaTransacciones");
  const estado = document.getElementById("estadoGrafica");
  const errorGrafica = document.getElementById("errorGrafica");
  let grafica = null;

  // Lee el historial sin modificarlo. Los datos dañados se informan al usuario
  // y nunca se reemplazan ni se borran desde esta pantalla de consulta.
  function leerHistorial() {
    try {
      const guardado = localStorage.getItem(CLAVE_HISTORIAL);
      const movimientos = guardado === null ? [] : JSON.parse(guardado);
      if (!Array.isArray(movimientos)) throw new Error("Historial inválido");
      return { movimientos: movimientos, error: false };
    } catch (error) {
      return { movimientos: [], error: true };
    }
  }

  // Cada movimiento reconocido aporta UNA unidad, independientemente del monto.
  // Consultas de saldo, entradas nulas y tipos desconocidos no son transacciones.
  function contarTransacciones(movimientos) {
    const cantidades = [0, 0, 0];
    movimientos.forEach(function (movimiento) {
      if (!movimiento || typeof movimiento !== "object") return;
      const indice = TIPOS.indexOf(movimiento.tipo);
      if (indice !== -1) cantidades[indice] += 1;
    });
    return cantidades;
  }

  // Crea una sola instancia de Chart.js y actualiza sus datos en las siguientes
  // lecturas. La escala usa enteros porque representa cantidades de operaciones.
  function dibujarGrafica(cantidades) {
    if (typeof window.Chart !== "function") {
      canvas.hidden = true;
      errorGrafica.hidden = false;
      errorGrafica.textContent = "No se pudo cargar la gráfica. Puedes consultar las cantidades en la tabla. Revisa tu conexión y recarga la página.";
      return;
    }

    if (grafica) {
      grafica.data.datasets[0].data = cantidades;
      grafica.update();
      return;
    }

    grafica = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: ETIQUETAS,
        datasets: [{
          label: "Transacciones",
          data: cantidades,
          backgroundColor: ["#24408E", "#E8732A", "#FFCB05"],
          borderRadius: 6,
          maxBarThickness: 48
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: 1,
            ticks: { precision: 0 },
            title: { display: true, text: "Número de transacciones" }
          },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // Mantiene sincronizados el gráfico, la tabla accesible y el estado vacío.
  // Ante errores de almacenamiento muestra guiones para no afirmar que hay cero.
  function actualizarGraficas() {
    const resultado = leerHistorial();
    const cantidades = contarTransacciones(resultado.movimientos);
    const total = cantidades.reduce(function (suma, cantidad) { return suma + cantidad; }, 0);

    IDS_CANTIDADES.forEach(function (id, indice) {
      document.getElementById(id).textContent = resultado.error ? "—" : cantidades[indice];
    });
    document.getElementById("cantidadTotal").textContent = resultado.error ? "—" : total;
    estado.hidden = !resultado.error && total > 0;
    estado.className = resultado.error ? "alert alert-warning" : "alert alert-info";
    estado.textContent = resultado.error
      ? "No se pudieron leer las transacciones guardadas. Tus datos no se han modificado."
      : "Aún no hay transacciones registradas. Realiza un depósito, retiro o pago desde el menú.";
    canvas.setAttribute("aria-label", resultado.error
      ? "Gráfica no disponible: no se pudieron leer las transacciones."
      : ETIQUETAS.map(function (etiqueta, indice) { return etiqueta + ": " + cantidades[indice]; }).join(". "));
    canvas.parentElement.hidden = resultado.error;
    if (resultado.error) {
      errorGrafica.hidden = true;
      return;
    }
    dibujarGrafica(cantidades);
  }

  // Las operaciones se realizan en menu.html: al regresar (incluso con el botón
  // Atrás del navegador) se consulta nuevamente el historial persistido.
  window.addEventListener("pageshow", actualizarGraficas);
  window.addEventListener("focus", actualizarGraficas);

  // storage avisa de operaciones realizadas en OTRA pestaña del mismo sitio.
  // key === null corresponde a un borrado completo del almacenamiento.
  window.addEventListener("storage", function (evento) {
    if (evento.key === CLAVE_HISTORIAL || evento.key === null) actualizarGraficas();
  });

  // Punto de integración opcional si una futura vista registra operaciones sin
  // navegar: emitir este evento después de guardar el historial en esa pestaña.
  window.addEventListener("pokemonbank:transacciones-actualizadas", actualizarGraficas);
  actualizarGraficas();
})();
