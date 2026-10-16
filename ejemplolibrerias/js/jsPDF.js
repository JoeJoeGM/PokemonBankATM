function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Este es un documento de ejemplo",10,10);

  doc.save("mi-documento.pdf");
}

function generarPDFTabla() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Encabezados y filas
  const headers = ["Nombre", "Edad", "Carrera"];
  const rows = [
    ["Joel", "34", "Ingenieria"],
    ["Alexander", "34", "Tecnico"],
    ["Michi", "23", "Ingenieria"]
  ];

  // Tabla (usando autoTable plugin que viene integrado en v2)
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 15
  });

  doc.save("tabla.pdf");
}
