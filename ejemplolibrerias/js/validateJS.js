// Reglas
const reglas = {
  username: { 
    length: { 
      minimum: 3, 
      maximum: 15, 
      message: "El usuario debe tener entre 3 y 15 caracteres" 
    } 
  },
  email: { 
    presence: { 
      message: "Por favor, ingresa tu email" 
    }, 
    email: { 
      message: "Email con formato incorrecto" 
    } 
  }
};

const form = document.getElementById("miForm");

form.addEventListener("submit", function(e) {
  e.preventDefault(); // Evita recargar la página

  const datos = {
    username: form.username.value,
    email: form.email.value
  };


  const errores = validate(datos, reglas);

  if (errores) {
    //Muestra los errores en la pantalla
    alert("Por favor corrige los siguientes errores:\n" + Object.values(errores).join("\n"));
  } else {
    alert("Formulario valido. Enviando datos...");
    
  }
});




// Reglas para validar un PIN exactamente de 4 digitos
const reglasPin = {
  pin: {
    presence: { 
      allowEmpty: false, 
      message: "^El PIN es obligatorio" 
    },
    format: {
      pattern: "^[0-9]{4}$",
      message: "^El PIN debe contener exactamente 4 numeros"
    }
  }
};

const formPin = document.getElementById("formPin");

formPin.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Limpiar el campo con error
  document.getElementById("error-pin").textContent = "";

  const valores = validate.collectFormValues(formPin);
  const errores = validate(valores, reglasPin);

  if (errores && errores.pin) {
    document.getElementById("error-pin").textContent = errores.pin[0];
  } else {
    Swal.fire("PIN Valido", "El formato del PIN es correcto.", "success");
    formPin.reset();
  }
});