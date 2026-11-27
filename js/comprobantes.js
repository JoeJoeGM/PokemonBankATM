// Generador de comprobantes PDF
function generarComprobantePDF(transaccion, usuario) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const nombre = usuario.nombre || "Usuario";

    const monto = Number(transaccion.monto);
    const saldo = Number(transaccion.saldoDespues);

    doc.setFontSize(20);
    doc.text("POKEMON BANK", 20, 25);

    doc.setFontSize(16);
    doc.text("Comprobante de transaccion", 20, 45);

    doc.setFontSize(12);

    doc.text(`Cliente: ${nombre}`, 20, 65);
    doc.text(`Cuenta: ${usuario.cuenta}`, 20, 80);
    doc.text(`Fecha: ${transaccion.fecha}`, 20, 95);
    doc.text(`Operacion: ${transaccion.tipo}`, 20, 110);
    doc.text(`Detalle: ${transaccion.detalle}`, 20, 125);

    doc.text(
        `Monto: $${monto.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`,
        20,
        140
    );

    doc.text(
        `Saldo despues de la operacion: $${saldo.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`,
        20,
        155
    );

    const fecha = transaccion.fecha.replaceAll("/", "-");

    const fechaHora = new Date(transaccion.fechaISO || Date.now());

    const hora = [
        fechaHora.getHours(),
        fechaHora.getMinutes(),
        fechaHora.getSeconds()
    ].map(valor => String(valor).padStart(2, "0")).join("-");

    doc.save(`Comprobante_${transaccion.tipo}_${fecha}_${hora}.pdf`);
}