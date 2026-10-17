function ejecutarSwetAlert1(){
 Swal.fire({
    title: "Hola",
    text: "Esta es una alerta utilizando SwetAlert",
    icon: "info",
    confirmButtonText: "Aceptar"
  });
}
function ejecutarSwetAlert2(){
 Swal.fire({
    title: "Ingresa PIN",
    input: "number",
    inputPlaceholder: "Ingresa tu codigo PIN",
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "Debes ingresar tu numero PIN";
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        icon: "success",
        title: "Bienvenido",
        timer: 1000,
        showConfirmButton: false
      });
    }
  });
}