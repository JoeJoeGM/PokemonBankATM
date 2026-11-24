/**
 * Módulo de Transacciones y Validaciones (Integrante 2)
 * Proyecto: Pokémon Bank ATM
 *
 * Responsabilidades:
 * 1. Ejecutar las operaciones de depósito, retiro, consulta de saldo y pago
 *    de servicios desde menu.html.
 * 2. Validar los montos con ValidateJS (vacíos, letras, negativos, decimales
 *    y montos superiores al saldo disponible).
 * 3. Persistir el saldo en usuarioATM y cada movimiento en transaccionesATM.
 * 4. Sustituir prompt()/alert() por diálogos de SweetAlert2.
 *
 * Contrato de datos compartido con el equipo:
 *   localStorage.usuarioATM       -> { nombre, pin, cuenta, saldo }
 *   localStorage.transaccionesATM -> [{ fecha, fechaISO, tipo, detalle, monto, saldoDespues }]
 *   tipo: "Depósito" | "Retiro" | "Servicios"
 */
(function () {
  "use strict";

  const CLAVE_USUARIO = "usuarioATM";
  const CLAVE_TRANSACCIONES = "transaccionesATM";

  // Datos oficiales de respaldo: se usan solo si usuarioATM aún no existe.
  const USUARIO_RESPALDO = {
    nombre: "Ash Ketchum",
    pin: "1234",
    cuenta: "0987654321",
    saldo: 500.0
  };

  /* ------------------------------------------------------------------ *
   * Almacenamiento
   * ------------------------------------------------------------------ */

  /**
   * Lee usuarioATM y normaliza el saldo. Si la clave no existe o el JSON
   * está dañado, devuelve una copia de los datos oficiales de Ash.
   */
  function leerUsuario() {
    const usuario = Object.assign({}, USUARIO_RESPALDO);

    try {
      const guardado = localStorage.getItem(CLAVE_USUARIO);
      if (!guardado) return usuario;

      const datos = JSON.parse(guardado);
      if (!datos || typeof datos !== "object") return usuario;

      // Copia solo los campos definidos para no sobrescribir con null/undefined.
      Object.keys(datos).forEach(function (clave) {
        if (datos[clave] !== undefined && datos[clave] !== null) {
          usuario[clave] = datos[clave];
        }
      });
    } catch (error) {
      return Object.assign({}, USUARIO_RESPALDO);
    }

    const saldo = Number(usuario.saldo);
    usuario.saldo = Number.isFinite(saldo) ? saldo : USUARIO_RESPALDO.saldo;
    return usuario;
  }

  /**
   * Guarda el objeto del usuario en localStorage.
   * Devuelve true si la escritura fue exitosa.
   */
  function guardarUsuario(usuario) {
    try {
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Devuelve el arreglo de transacciones. Si no existe o está dañado,
   * devuelve un arreglo vacío para no romper la pantalla.
   */
  function leerTransacciones() {
    try {
      const guardado = localStorage.getItem(CLAVE_TRANSACCIONES);
      if (!guardado) return [];

      const lista = JSON.parse(guardado);
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Guarda el arreglo completo de transacciones.
   * Devuelve true si la escritura fue exitosa.
   */
  function guardarTransacciones(transacciones) {
    try {
      localStorage.setItem(CLAVE_TRANSACCIONES, JSON.stringify(transacciones));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Restaura una clave de localStorage a su valor anterior. Se usa para
   * deshacer una escritura parcial si falla el guardado de una operación.
   */
  function restaurarClave(clave, valorPrevio) {
    try {
      if (valorPrevio === null) {
        localStorage.removeItem(clave);
      } else {
        localStorage.setItem(clave, valorPrevio);
      }
    } catch (error) {
      // Si el almacenamiento no está disponible, no hay más que hacer.
    }
  }

  /* ------------------------------------------------------------------ *
   * Utilidades de dinero
   * ------------------------------------------------------------------ */

  // Convierte un monto a centavos para operar sin errores de decimales.
  function aCentavos(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
  }

  // Convierte centavos de vuelta a dólares con dos decimales.
  function desdeCentavos(centavos) {
    return centavos / 100;
  }

  // Presenta un monto con formato de moneda estadounidense: $500.00.
  function formatearDinero(valor) {
    const numero = Number(valor);
    return (Number.isFinite(numero) ? numero : 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
  }

  /* ------------------------------------------------------------------ *
   * Registro de movimientos
   * ------------------------------------------------------------------ */

  /**
   * Guarda el nuevo saldo del usuario y agrega el movimiento al historial.
   * Ambas escrituras se intentan juntas; si una falla, se restauran los
   * valores anteriores para que el saldo y el historial no queden
   * desincronizados.
   */
  function registrar(usuario, tipo, detalle, monto) {
    let usuarioPrevio = null;
    let transaccionesPrevias = null;

    try {
      usuarioPrevio = localStorage.getItem(CLAVE_USUARIO);
      transaccionesPrevias = localStorage.getItem(CLAVE_TRANSACCIONES);
    } catch (error) {
      return false;
    }

    const transacciones = leerTransacciones();
    const ahora = new Date();

    transacciones.unshift({
      fecha: ahora.toLocaleDateString("es-SV"),
      fechaISO: ahora.toISOString(),
      tipo: tipo,
      detalle: detalle,
      monto: desdeCentavos(aCentavos(monto)),
      saldoDespues: desdeCentavos(aCentavos(usuario.saldo))
    });

    if (!guardarUsuario(usuario) || !guardarTransacciones(transacciones)) {
      restaurarClave(CLAVE_USUARIO, usuarioPrevio);
      restaurarClave(CLAVE_TRANSACCIONES, transaccionesPrevias);
      return false;
    }

    // Avisa a las demás vistas (por ejemplo, la gráfica) que los datos cambiaron.
    window.dispatchEvent(new Event("pokemonbank:transacciones-actualizadas"));
    return true;
  }

  /* ------------------------------------------------------------------ *
   * Validación con ValidateJS
   * ------------------------------------------------------------------ */

  /**
   * Construye las reglas de ValidateJS para el campo "monto".
   * Cuando se recibe un saldo máximo, también rechaza montos superiores.
   */
  function reglasMonto(saldoMaximo) {
    const numericality = {
      greaterThan: 0,
      message: "^El monto debe ser mayor que cero."
    };

    if (saldoMaximo !== null && saldoMaximo !== undefined) {
      numericality.lessThanOrEqualTo = Number(saldoMaximo);
      numericality.message = "^El monto no puede superar tu saldo disponible.";
    }

    return {
      monto: {
        presence: { allowEmpty: false, message: "^Ingresa un monto." },
        format: {
          pattern: "^(\\d+)(\\.\\d{1,2})?$",
          message: "^Usa solo números positivos con hasta 2 decimales."
        },
        numericality: numericality
      }
    };
  }

  /**
   * Valida el monto con ValidateJS y devuelve el primer mensaje de error,
   * o null si el valor es correcto.
   */
  function validarMonto(valor, saldoMaximo) {
    if (typeof validate !== "function") {
      return "No se pudo cargar el validador. Revisa tu conexión.";
    }

    const texto = String(valor === null || valor === undefined ? "" : valor).trim();
    const errores = validate({ monto: texto }, reglasMonto(saldoMaximo));

    if (errores && errores.monto && errores.monto.length) {
      return errores.monto[0];
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * Diálogos con SweetAlert2
   * ------------------------------------------------------------------ */

  // Comprueba que SweetAlert2 esté disponible en la página.
  function sweetAlertDisponible() {
    return typeof Swal !== "undefined";
  }

  /**
   * Muestra un mensaje con SweetAlert2. Si la librería no cargó, usa el
   * contenedor #mensaje de menu.html como respaldo, sin alert() nativo.
   */
  function mostrarMensaje(tipo, titulo, texto) {
    if (sweetAlertDisponible()) {
      Swal.fire({
        icon: tipo,
        title: titulo,
        text: texto,
        confirmButtonColor: tipo === "error" ? "#E8732A" : "#24408E"
      });
      return;
    }

    const contenedor = document.getElementById("mensaje");
    if (contenedor) {
      const clase = tipo === "error" ? "danger" : tipo === "success" ? "success" : "info";
      contenedor.className = "alert alert-" + clase;
      contenedor.textContent = titulo + " " + texto;
      contenedor.classList.remove("d-none");
    }
  }

  /**
   * Pide un monto con SweetAlert2 y lo valida con ValidateJS antes de
   * permitir continuar. Devuelve el monto como número o null si se cancela.
   */
  async function pedirMonto(titulo, texto, saldoMaximo) {
    if (!sweetAlertDisponible()) {
      mostrarMensaje("error", "Librería no disponible", "No se pudo cargar SweetAlert2.");
      return null;
    }

    const resultado = await Swal.fire({
      title: titulo,
      text: texto,
      input: "text",
      inputPlaceholder: "0.00",
      inputAttributes: {
        inputmode: "decimal",
        "aria-label": "Monto en dólares"
      },
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#24408E",
      cancelButtonColor: "#6c757d",
      inputValidator: function (valor) {
        return validarMonto(valor, saldoMaximo);
      }
    });

    if (!resultado.isConfirmed) return null;

    return desdeCentavos(aCentavos(String(resultado.value).trim()));
  }

  /**
   * Pide confirmación antes de aplicar una operación.
   * Devuelve true si el usuario confirma.
   */
  async function confirmar(titulo, texto) {
    if (!sweetAlertDisponible()) {
      mostrarMensaje("error", "Librería no disponible", "No se pudo cargar SweetAlert2.");
      return false;
    }

    const resultado = await Swal.fire({
      icon: "question",
      title: titulo,
      text: texto,
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#24408E",
      cancelButtonColor: "#6c757d"
    });

    return resultado.isConfirmed;
  }

  /* ------------------------------------------------------------------ *
   * Operaciones del cajero
   * ------------------------------------------------------------------ */

  /**
   * Depósito: suma el monto al saldo y registra el movimiento.
   */
  async function depositar() {
    const monto = await pedirMonto(
      "Depositar dinero",
      "Ingresa el monto que deseas depositar.",
      null
    );
    if (monto === null) return;

    const confirmado = await confirmar(
      "Confirmar depósito",
      "Se depositarán " + formatearDinero(monto) + " en tu cuenta."
    );
    if (!confirmado) return;

    const usuario = leerUsuario();
    const nuevoSaldo = desdeCentavos(aCentavos(usuario.saldo) + aCentavos(monto));
    usuario.saldo = nuevoSaldo;

    if (!registrar(usuario, "Depósito", "Depósito en cuenta", monto)) {
      mostrarMensaje("error", "No se pudo completar", "Intenta nuevamente.");
      return;
    }

    actualizarVista();
    mostrarMensaje(
      "success",
      "Depósito exitoso",
      "Tu nuevo saldo es " + formatearDinero(nuevoSaldo) + "."
    );
  }

  /**
   * Retiro: valida que haya saldo suficiente, resta el monto y registra
   * el movimiento.
   */
  async function retirar() {
    const saldoActual = leerUsuario().saldo;
    const monto = await pedirMonto(
      "Retirar dinero",
      "Ingresa el monto que deseas retirar.",
      saldoActual
    );
    if (monto === null) return;

    const confirmado = await confirmar(
      "Confirmar retiro",
      "Se retirarán " + formatearDinero(monto) + " de tu cuenta."
    );
    if (!confirmado) return;

    const usuario = leerUsuario();
    if (aCentavos(monto) > aCentavos(usuario.saldo)) {
      mostrarMensaje(
        "error",
        "Fondos insuficientes",
        "Tu saldo disponible es " + formatearDinero(usuario.saldo) + "."
      );
      return;
    }

    const nuevoSaldo = desdeCentavos(aCentavos(usuario.saldo) - aCentavos(monto));
    usuario.saldo = nuevoSaldo;

    if (!registrar(usuario, "Retiro", "Retiro de efectivo", monto)) {
      mostrarMensaje("error", "No se pudo completar", "Intenta nuevamente.");
      return;
    }

    actualizarVista();
    mostrarMensaje(
      "success",
      "Retiro exitoso",
      "Tu nuevo saldo es " + formatearDinero(nuevoSaldo) + "."
    );
  }

  /**
   * Consulta de saldo: solo informa el saldo actual y no genera movimientos.
   */
  function consultarSaldo() {
    const usuario = leerUsuario();
    mostrarMensaje(
      "info",
      "Saldo disponible",
      "Tu saldo actual es " + formatearDinero(usuario.saldo) + "."
    );
  }

  /**
   * Pago de servicios: valida el saldo, resta el monto y registra el
   * movimiento con el nombre del servicio como detalle.
   */
  async function pagarServicio(servicio) {
    const nombreServicio = String(servicio || "Servicio").trim();
    const saldoActual = leerUsuario().saldo;

    const monto = await pedirMonto(
      "Pagar " + nombreServicio,
      "Ingresa el monto a pagar por " + nombreServicio + ".",
      saldoActual
    );
    if (monto === null) return;

    const confirmado = await confirmar(
      "Confirmar pago",
      "Se pagarán " + formatearDinero(monto) + " de " + nombreServicio + "."
    );
    if (!confirmado) return;

    const usuario = leerUsuario();
    if (aCentavos(monto) > aCentavos(usuario.saldo)) {
      mostrarMensaje(
        "error",
        "Fondos insuficientes",
        "Tu saldo disponible es " + formatearDinero(usuario.saldo) + "."
      );
      return;
    }

    const nuevoSaldo = desdeCentavos(aCentavos(usuario.saldo) - aCentavos(monto));
    usuario.saldo = nuevoSaldo;

    if (!registrar(usuario, "Servicios", nombreServicio, monto)) {
      mostrarMensaje("error", "No se pudo completar", "Intenta nuevamente.");
      return;
    }

    actualizarVista();
    mostrarMensaje(
      "success",
      "Pago exitoso",
      "Pagaste " + formatearDinero(monto) + " de " + nombreServicio +
        ". Tu nuevo saldo es " + formatearDinero(nuevoSaldo) + "."
    );
  }

  /* ------------------------------------------------------------------ *
   * Interfaz
   * ------------------------------------------------------------------ */

  /**
   * Refresca los datos visibles del menú. Los elementos de nombre y cuenta
   * se actualizan solo si existen, para que el módulo funcione aunque el
   * HTML todavía no tenga esos identificadores.
   */
  function actualizarVista() {
    const usuario = leerUsuario();

    const nombre = document.getElementById("nombreUsuario");
    if (nombre) nombre.textContent = usuario.nombre;

    const cuenta = document.getElementById("numeroCuenta");
    if (cuenta) cuenta.textContent = usuario.cuenta;

    const saldo = document.getElementById("saldo");
    if (saldo) saldo.textContent = formatearDinero(usuario.saldo);
  }

  /**
   * Enlaza los botones y chips de menu.html con las operaciones y mantiene
   * la vista sincronizada si los datos cambian en otra pestaña.
   */
  function iniciar() {
    actualizarVista();

    const btnDepositar = document.getElementById("btnDepositar");
    if (btnDepositar) btnDepositar.addEventListener("click", depositar);

    const btnRetirar = document.getElementById("btnRetirar");
    if (btnRetirar) btnRetirar.addEventListener("click", retirar);

    const btnConsultar = document.getElementById("btnConsultar");
    if (btnConsultar) btnConsultar.addEventListener("click", consultarSaldo);

    document.querySelectorAll(".servicio").forEach(function (boton) {
      boton.addEventListener("click", function () {
        // Devuelve la promesa para poder esperar la operación en pruebas.
        return pagarServicio(this.dataset.servicio);
      });
    });

    // Al volver con Atrás/Adelante o al recuperar el foco, relee el saldo.
    window.addEventListener("pageshow", actualizarVista);
    window.addEventListener("focus", actualizarVista);

    // storage avisa de cambios hechos en OTRA pestaña del mismo sitio.
    window.addEventListener("storage", function (evento) {
      if (
        evento.key === CLAVE_USUARIO ||
        evento.key === CLAVE_TRANSACCIONES ||
        evento.key === null
      ) {
        actualizarVista();
      }
    });
  }

  // Ejecuta iniciar cuando el DOM esté listo, incluso si el script se carga
  // después de que ocurriera DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
