
(function () {
  "use strict";

  const CLAVE_USUARIO = "usuarioATM";
  const CLAVE_TRANSACCIONES = "transaccionesATM";

  // Datos oficiales de respaldo y se usan solo si usuarioATM aún no existe.
  const USUARIO_RESPALDO = {
    nombre: "Ash Ketchum",
    pin: "1234",
    cuenta: "0987654321",
    saldo: 500.0
  };


  function leerUsuario() {
    const usuario = Object.assign({}, USUARIO_RESPALDO);

    try {
      const guardado = localStorage.getItem(CLAVE_USUARIO);
      if (!guardado) return usuario;

      const datos = JSON.parse(guardado);
      if (!datos || typeof datos !== "object") return usuario;

      // Copia solo los campos definidos para no sobrescribir con null
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


  function guardarUsuario(usuario) {
    try {
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
      return true;
    } catch (error) {
      return false;
    }
  }


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


  function guardarTransacciones(transacciones) {
    try {
      localStorage.setItem(CLAVE_TRANSACCIONES, JSON.stringify(transacciones));
      return true;
    } catch (error) {
      return false;
    }
  }


  function restaurarClave(clave, valorPrevio) {
    try {
      if (valorPrevio === null) {
        localStorage.removeItem(clave);
      } else {
        localStorage.setItem(clave, valorPrevio);
      }
    } catch (error) {
      // Si el almacenamiento no está disponible
    }
  }


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

    // Avisa a las demás vistas que los datos cambiaron.
    window.dispatchEvent(new Event("pokemonbank:transacciones-actualizadas"));
    return true;
  }

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


  // Comprueba que SweetAlert2 esté disponible en la página.
  function sweetAlertDisponible() {
    return typeof Swal !== "undefined";
  }


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


  function consultarSaldo() {
    const usuario = leerUsuario();
    mostrarMensaje(
      "info",
      "Saldo disponible",
      "Tu saldo actual es " + formatearDinero(usuario.saldo) + "."
    );
  }


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


  function actualizarVista() {
    const usuario = leerUsuario();

    const nombre = document.getElementById("nombreUsuario");
    if (nombre) nombre.textContent = usuario.nombre;

    const cuenta = document.getElementById("numeroCuenta");
    if (cuenta) cuenta.textContent = usuario.cuenta;

    const saldo = document.getElementById("saldo");
    if (saldo) saldo.textContent = formatearDinero(usuario.saldo);
  }


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
       
        return pagarServicio(this.dataset.servicio);
      });
    });

    // Al volver con atras o  adelante o al recuperar el foco, relee el saldo.
    window.addEventListener("pageshow", actualizarVista);
    window.addEventListener("focus", actualizarVista);

    // storage avisa de cambios hechos en otra pestaña del mismo sitio.
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

  
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
