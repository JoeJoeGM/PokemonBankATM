//Funcion encargada de realizar la validacion del PIN

/* Se realiza la validacion garantizando de esta forma que los datos recibidos,
sea un numero entero de 4 digitos antes de realizar el redireccionamiento a la pagina acciones */

function validarPIN() {

    const pin = document.getElementById("pin").value; //Se obtiene el valor del pin
    
    //Por medio de una expresion regular validamos que el pin de inicio a fin sean digitos y que deben ser 4 digitos 
    const validaPIN = /^\d{4}$/.test(pin);

    if (!validaPIN){ //Si validaPIN devuelve un valor diferente a true
        alert("El PIN debe contener 4 digitos"); //Muestra la alerta
        return;
    }
    //Si pasa la validacion se redirige a la pagina de acciones
    window.location.href="acciones.html" 
}