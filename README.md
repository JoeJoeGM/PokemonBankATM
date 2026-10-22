# Pokemon Bank ATM

Simulador de cajero automatico de Pokemon
Implementa operaciones bancarias basicas con persistencia local y visualizacion de datos.

---
## Demo en vivo: **https://joejoegm.github.io/PokemonBankATM/

---

## Funcionalidades

| Modulo | Descripcion |
|--------|-------------|
| **Autenticacion** | Login con PIN de 4 digitos via teclado numerico en pantalla (input virtual) |
| **Operaciones** | Depósitos, retiros (validación de fondos), consulta de saldo, pago de servicios (4 categorias) |
| **Historial** | Registro cronológico con filtros por tipo (Depósito/Retiro/Servicios) |
| **Analisis** | Gráfica de dona (distribución %) + barras horizontales (montos por categoria) |
| **Demo librerias** | Ejemplos integrados: SweetAlert2, Chart.js, jsPDF + autoTable, Validate.js |

---

## Stack técnico

- **Frontend**: HTML5, CSS3, JavaScript vanilla (ES6+)
- **UI**: Bootstrap 4.6 + CSS Custom Properties (tema Pokémon)
- **Persistencia**: `localStorage` (saldo + array de transacciones JSON)
- **Librerías CDN**: SweetAlert2, Chart.js, jsPDF, Validate.js, jQuery 3.5.1
- **Fuentes**: Nunito (Google Fonts)

---


## Acceso de prueba

- **PIN**: cualquier 4 dígitos (ej. `1234`, `0000`)
- **Cuenta demo**: Adrian Castillo · `0001-2345-6789` · $1,000.00 USD inicial
- **Reset**: limpiar `localStorage` en DevTools → Application

---

## Estructura clave

```
├── index.html                 # Landing
├── atm.html                   # Login PIN
├── menu.html                  # Dashboard + lógica ATM (JS inline)
├── historial.html             # Tabla + filtros JS
├── graficas.html              # SVG donut + barras CSS
├── demosLibrerias-Index.html  # Demos librerías
├── styles.css                 # Tema principal (Bootstrap override)
└── ejemplolibrerias/js/       # 4 módulos demo (SweetAlert, jsPDF, Chart, Validate)
```

## Equipo

- Carlos Eduardo Saavedra Vega
- Alexis Ernesto Hernandez Monge
- Cristel Michelle Figueroa Romero
- Fidel Alexander Blanco Ayala
- Joel Ernesto Granados Mejia

---

## Documentación

- [Entregable (Word)](documentacion/entregable.docx)

---
