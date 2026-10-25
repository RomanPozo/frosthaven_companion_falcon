# Librerías de terceros incluidas

Copias locales para que la app funcione sin conexión. Todas son de código abierto y de uso gratuito.

| Archivo | Proyecto | Licencia |
|---|---|---|
| `tailwind-3.4.16.js` | [Tailwind CSS](https://tailwindcss.com) (Play CDN) | MIT |
| `lucide-0.468.0.min.js` | [Lucide](https://lucide.dev) | ISC |
| `html2canvas-1.4.1.min.js` | [html2canvas](https://html2canvas.hertzen.com/) | MIT |
| `jspdf-2.5.1.umd.min.js` | [jsPDF](https://github.com/parallax/jsPDF) | MIT |
| `tesseract/tesseract.min.js`, `tesseract/worker.min.js` | [Tesseract.js](https://github.com/naptha/tesseract.js) 5.1.1 | Apache 2.0 |
| `tesseract/core/*.wasm.js` | [tesseract.js-core](https://github.com/naptha/tesseract.js-core) 5.1.1 (motor Tesseract OCR) | Apache 2.0 |
| `tesseract/lang/spa.traineddata.gz` | [Datos de idioma español](https://github.com/naptha/tessdata) (`4.0.0_best_int`) | Apache 2.0 |
| `fonts/cinzel-*.woff2` | [Cinzel](https://fonts.google.com/specimen/Cinzel) | SIL Open Font License 1.1 |
| `fonts/inter-*.woff2` | [Inter](https://fonts.google.com/specimen/Inter) | SIL Open Font License 1.1 |

El OCR (`tesseract/`, ~10 MB) no se descarga al abrir la app: el service worker lo guarda la primera vez que se usa, y a partir de ahí funciona sin conexión.
