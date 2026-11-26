/**
 * Módulo de Autenticación y Memoria Inicial (Integrante 1)
 * Proyecto: Pokémon Bank ATM
 * Responsabilidades:
 * 1. Inicializar datos oficiales de Ash Ketchum en LocalStorage.
 * 2. Validar el inicio de sesión mediante teclado numérico y SweetAlert2.
 * 3. Controlar la sesión activa y el cierre de sesión seguro ("Salir").
 */

// Claves oficiales compartidas con todo el equipo en LocalStorage
const CLAVE_USUARIO = "usuarioATM";
const CLAVE_TRANSACCIONES = "transaccionesATM";
const CLAVE_SESION = "sesionActivaATM";

/**
 * Inicializa los datos oficiales del usuario y el historial vacío en LocalStorage
 * únicamente si aún no existen en el navegador, evitando sobrescribir saldos reales.
 */
function inicializarDatosATM() {
  if (!localStorage.getItem(CLAVE_USUARIO)) {
    const datosIniciales = {
      nombre: "Ash Ketchum",
      pin: "1234",
      cuenta: "0987654321",
      saldo: 500.00
    };
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datosIniciales));
  }

  if (!localStorage.getItem(CLAVE_TRANSACCIONES)) {
    localStorage.setItem(CLAVE_TRANSACCIONES, JSON.stringify([]));
  }
}

/**
 * Configura la lógica del teclado numérico y la validación de PIN en la pantalla de login (atm.html).
 */
function configurarLogin() {
  const formLogin = document.querySelector("form");
  // Si no estamos en la pantalla de login, salimos de esta función
  if (!formLogin || !document.querySelector(".pin-wrap")) return;

  const pins = Array.from(document.querySelectorAll(".pin"));
  const btnVer = document.getElementById("btnVer");
  const btnIngresar = document.getElementById("btnIngresar");

  // Habilita o deshabilita el botón Ingresar según si los 4 dígitos están llenos
  function verificarCamposCompletos() {
    const completo = pins.every((input) => input.value.trim() !== "");
    btnIngresar.disabled = !completo;
    return completo;
  }

  // Asignar evento a los botones numéricos (0-9)
  document.querySelectorAll(".key[data-num]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const casillaVacia = pins.find((input) => input.value === "");
      if (casillaVacia) {
        casillaVacia.value = btn.dataset.num;
      }
      verificarCamposCompletos();
    });
  });

  // Botón Borrar: elimina el último dígito ingresado
  const btnBorrar = document.getElementById("btnBorrar");
  if (btnBorrar) {
    btnBorrar.addEventListener("click", () => {
      const casillasLlenas = pins.filter((input) => input.value !== "");
      if (casillasLlenas.length > 0) {
        casillasLlenas[casillasLlenas.length - 1].value = "";
      }
      verificarCamposCompletos();
    });
  }

  // Botón Limpiar: vacía todas las casillas del PIN
  const btnLimpiar = document.getElementById("btnLimpiar");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      pins.forEach((input) => (input.value = ""));
      verificarCamposCompletos();
    });
  }

  // Botón Mostrar / Ocultar dígitos
  if (btnVer) {
    btnVer.addEventListener("click", () => {
      const estaOculto = pins[0].type === "password";
      pins.forEach((input) => (input.type = estaOculto ? "text" : "password"));
      btnVer.textContent = estaOculto ? "Ocultar dígitos" : "Mostrar dígitos";
    });
  }

  // Validación del formulario al intentar ingresar
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validar que los 4 campos estén completos
    if (!verificarCamposCompletos()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, ingresa los 4 dígitos de tu PIN.",
        confirmButtonColor: "#24408E"
      });
      return;
    }

    // Obtener el PIN ingresado y compararlo con el guardado en LocalStorage
    const pinIngresado = pins.map((input) => input.value).join("");
    const usuarioGuardado = JSON.parse(localStorage.getItem(CLAVE_USUARIO));

    if (usuarioGuardado && pinIngresado === usuarioGuardado.pin) {
      // Marcar sesión como activa en sessionStorage
      sessionStorage.setItem(CLAVE_SESION, "true");

      Swal.fire({
        icon: "success",
        title: `¡Bienvenido, ${usuarioGuardado.nombre}!`,
        text: "Acceso concedido a Pokémon Bank.",
        timer: 1400,
        showConfirmButton: false
      }).then(() => {
        window.location.href = "menu.html";
      });
    } else {
      // Limpiar casillas y mostrar alerta de error
      pins.forEach((input) => (input.value = ""));
      verificarCamposCompletos();

      Swal.fire({
        icon: "error",
        title: "PIN incorrecto",
        text: "El PIN ingresado no es válido. Inténtalo nuevamente.",
        confirmButtonColor: "#E8732A"
      });
    }
  });
}

/**
 * Protege las pantallas internas (menu, historial, graficas) si no hay sesión activa
 * y configura todos los botones "Salir" para cerrar sesión de forma segura.
 */
function configurarSeguridadYSalida() {
  const rutaActual = window.location.pathname.toLowerCase();
  const esPantallaInterna =
    rutaActual.includes("menu.html") ||
    rutaActual.includes("historial.html") ||
    rutaActual.includes("graficas.html");

  // Si intenta entrar directo por URL sin iniciar sesión, redirigir al login
  if (esPantallaInterna && sessionStorage.getItem(CLAVE_SESION) !== "true") {
    window.location.href = "atm.html";
    return;
  }

  // Seleccionar tanto los enlaces con clase .salir del navbar como el botón Salir inferior de menu.html
  const botonesSalir = document.querySelectorAll('a.salir, a[href="index.html"].btn');

  botonesSalir.forEach((boton) => {
    boton.addEventListener("click", (e) => {
      e.preventDefault();

      Swal.fire({
        icon: "question",
        title: "¿Cerrar sesión?",
        text: "Saldrás de tu cuenta de Pokémon Bank de forma segura.",
        showCancelButton: true,
        confirmButtonText: "Sí, salir",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#24408E",
        cancelButtonColor: "#6c757d"
      }).then((resultado) => {
        if (resultado.isConfirmed) {
          // Eliminar bandera de sesión activa (mantiene saldo e historial en LocalStorage)
          sessionStorage.removeItem(CLAVE_SESION);
          window.location.href = "index.html";
        }
      });
    });
  });
}

// Ejecutar inicialización y configuraciones al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  inicializarDatosATM();
  configurarLogin();
  configurarSeguridadYSalida();
});