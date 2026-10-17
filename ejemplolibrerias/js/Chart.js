const ctx = document.getElementById("graficaBarras").getContext("2d");
new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Ene", "Feb", "Mar", "Abr", "May"],
    datasets: [{
      label: "Ventas",
      data: [65, 59, 80, 81, 55],
      backgroundColor: "rgba(54, 162, 235, 0.5)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: { beginAtZero: true }
    }
  }
});

const cty = document.getElementById("graficaLineas").getContext("2d");
new Chart(cty, {
  type: "line",
  data: {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    datasets: [
      {
        label: "Temperatura (°C)",
        data: [22, 24, 19, 25, 23],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: false,
        tension: 0.2
      },
      {
        label: "Humedad (%)",
        data: [65, 70, 60, 75, 68],
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: false,
        tension: 0.2
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Evolución semanal"
      }
    }
  }
});
