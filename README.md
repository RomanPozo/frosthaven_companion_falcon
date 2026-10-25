# ❄️ Frosthaven: Outpost & Campaign Companion

Aplicación web ligera para acompañar las partidas de **Frosthaven** desde el móvil, la tablet o el ordenador. Lleva el calendario de la campaña, guía al grupo por la Fase de Puesto Avanzado, dibuja el árbol de escenarios, **lee en voz alta** las secciones y las introducciones de los escenarios, y guarda las fotos de vuestros momentos épicos.

Se puede **instalar como una app** en el móvil, la tablet o el ordenador, y funciona **sin conexión**, sin cuentas ni servidores. Todos los datos se quedan en el navegador del dispositivo.

> Los recursos, la moral, la prosperidad y las cartas de edificios se siguen llevando en la mesa. La app se centra en lo que es fácil de olvidar.

---

## ✨ Funcionalidades

### 🏰 Fase de Puesto Avanzado
Asistente paso a paso por las 5 subfases oficiales:

1. **Paso del Tiempo**
   - Calendario de 80 semanas (4 años de 10 semanas de Verano y 10 de Invierno).
   - Agenda de secciones del Libro de Secciones en cualquier semana futura.
   - Botón **Avanzar 1 Semana** con avisos automáticos:
     - **¡Lectura del Libro de Secciones!** si la nueva semana tiene secciones agendadas.
     - **¡Cambio de Estación!** al pasar de Verano a Invierno o al revés.
2. **Evento de Puesto Avanzado**: qué mazo robar según la estación, diario opcional de eventos y resumen de la resolución de ataques.
3. **Operaciones de Edificios**: orden de resolución y efectos de ruina.
4. **Tiempo Libre**: subir de nivel, retirar y crear personajes, artesano, alquimista y venta de objetos, con una calculadora de nivel y oro inicial según la Prosperidad.
5. **Construcción**: construir, mejorar, construcción extra y reconstruir.

### 🗺️ Árbol de Escenarios
- Grafo interactivo con arrastrar y zoom (ratón, rueda o pellizco táctil).
- Tres estados: **Disponible** (azul), **Completado** (dorado) y **Bloqueado** (rojo).
- Cada escenario guarda número, nombre, coordenadas del mapa y notas.
- **Desbloquear nueva misión**: crea el escenario hijo ya conectado con una flecha y colocado en un hueco libre.
- Los nodos se pueden arrastrar, y hay un botón para reorganizar el árbol automáticamente.
- Vienen precargados **#0 Howling in the Snow** y **#1 A Town in Flames**.
- La app apunta sola **en qué semana se desbloquea y se completa** cada escenario (se puede corregir en el modal).
- **Fotos en el árbol:** cada escenario muestra la miniatura de su foto de portada, y su modal tiene una tira con todas sus fotos y un botón para añadir más.

### 🔊 Narrador
- Escribe el número de una **sección** (`183.3`) o de un **escenario** (`23`) y la app lee su texto en voz alta.
- Los textos se añaden **haciendo una foto a la página del libro**. El reconocimiento de texto (OCR, con [Tesseract.js](https://tesseract.projectnaptha.com/)) se hace dentro del navegador. Después revisas y corriges el texto antes de guardarlo.
- Se guarda solo el texto, no la foto. La biblioteca crece poco a poco: la primera vez que aparece una sección, se fotografía y queda guardada.
- Usa las voces del sistema (Web Speech API). Puedes elegir la voz en español y la velocidad, ir frase a frase y tocar una frase para leer desde ahí.
- Mientras lee aparece una barra flotante (pausa, frase anterior y siguiente, detener) que se ve desde cualquier pestaña.
- Accesos directos:
  - Botón **Leer en voz alta** en la alerta de *¡Lectura del Libro de Secciones!*
  - Botón **Leer introducción** en el modal de cada escenario del árbol.
  - Atajos a las secciones agendadas y a los escenarios disponibles.

> **Sobre los textos:** la app no incluye ningún texto de Frosthaven, porque tienen copyright. Cada grupo transcribe los de su propio ejemplar para uso privado, y se quedan en su dispositivo.

### 🏆 Salón de los Héroes
Dos vistas: **Galería** y **Crónica**.

**Galería**
- Fotos de la mesa, miniaturas pintadas y victorias ajustadas.
- Cada foto se puede enlazar a un escenario del árbol y marcarse como su **portada**.
- Las fotos se reducen a un máximo de 1280 px y se comprimen a JPEG antes de guardarse en **IndexedDB**.
- Visor a pantalla completa con navegación, edición y borrado.
- 100 % local: ninguna imagen sale del dispositivo.

**Crónica de Frosthaven**
- Pergamino con la historia de la campaña, agrupado por **Año → Estación → Semana**: secciones leídas, diario de eventos, escenarios desbloqueados y completados (con sus notas) y fotos.
- Filtro por año.
- Botón **Descargar PDF**: la app genera un PDF A4 con aspecto de pergamino, sin pasar por la impresora, y permite compartirlo o descargarlo. Ninguna semana se parte entre dos páginas.
- Botón de **imprimir** por si queréis sacarla en papel.

### ❄️ Ambientación
- Fondo con paisaje propio: montañas nevadas, bosque de pinos y la empalizada del pueblo con ventanas iluminadas.
- **Invierno:** noche con aurora boreal, nieve cayendo y escarcha en las esquinas.
- **Verano:** atardecer con sol bajo y brasas flotando.
- Animación de helada o deshielo al cambiar de estación.
- Efectos suaves: se pausan si la app no está a la vista y se desactivan si el sistema tiene activado "reducir movimiento".

### 💾 Copias de seguridad
- **Exportar** prepara un archivo con la campaña y los textos del Narrador y, si quieres, también las fotos. Después puedes:
  - **Compartirlo** con el menú del móvil (WhatsApp, Drive, AirDrop…).
  - **Descargarlo**. Es lo que se hace directamente en navegadores sin esta función, como Firefox de escritorio.
- En Android el archivo se comparte como `.txt`, porque Chrome no permite compartir `.json`. El contenido es el mismo y *Cargar* acepta los dos formatos.
- **Cargar** restaura un backup. Sirve también para pasar la campaña de un dispositivo a otro.

---

## 🚀 Uso

### Online
Abre la dirección de GitHub Pages del proyecto:

```
https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/
```

Se puede usar así, en el navegador, o instalarla como una app (ver abajo). Las dos opciones funcionan sin conexión una vez abierta.

### 📲 Instalar la app
Instalarla es opcional y gratis. Se obtiene un icono propio, la app se abre a pantalla completa y funciona sin internet.

- **Android (Chrome):** botón dorado **Instalar** de la cabecera, o menú ⋮ → *Instalar aplicación*.
- **iPhone / iPad (Safari):** botón **Instalar** de la cabecera, que explica los pasos: Compartir → *Añadir a pantalla de inicio*.
- **Ordenador (Chrome / Edge):** botón **Instalar** o el icono de instalar de la barra de direcciones.

> ⚠️ **iPhone:** la app instalada guarda sus datos **aparte de Safari**. Si ya tenías una campaña en Safari, pulsa *Exportar* en Safari y luego *Cargar* dentro de la app, una sola vez. En Android los datos se comparten y no hace falta.
>
> En iPhone, además, Safari puede borrar los datos de las webs que no se abren en 7 días. La app instalada no tiene ese límite, así que **en iPhone se recomienda instalarla**.

**Actualizaciones:** con conexión, la app descarga sola la última versión publicada en cada arranque. Sin conexión usa la copia guardada.

### En local
La app usa módulos ES, así que **no funciona abriendo `index.html` con doble clic**. Necesita un servidor local. Cualquiera de estos vale:

```bash
python -m http.server 5173
```

```bash
npx serve .
```

Después abre `http://localhost:5173`, o la dirección que indique `serve`.

---

## 📦 Publicar en GitHub Pages

1. Crea un repositorio **público** en GitHub.
2. Sube a la **raíz** del repositorio `index.html`, `manifest.webmanifest`, `sw.js`, `README.md` y las carpetas `css/`, `js/`, `icons/` y `vendor/`.
3. Ve a **Settings → Pages**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`, y pulsa **Save**.
4. En 1 o 2 minutos la app estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

No hay paso de compilación: los archivos se sirven tal cual. También funciona en Vercel, Netlify o cualquier hosting estático con HTTPS (la instalación y el modo sin conexión necesitan HTTPS; GitHub Pages ya lo tiene).

Si algún día añades o quitas archivos de la app, añádelos también a las listas de `sw.js` y sube el número de `VERSION`. Para cambios en archivos que ya existen no hace falta tocar nada.

---

## 🔒 Dónde se guardan los datos

| Qué | Dónde | Clave |
|---|---|---|
| Campaña (calendario, diario, árbol) | LocalStorage | `fh_campaign_state` |
| Fotos del Salón de los Héroes | IndexedDB | `fh_gallery_db`, almacén `photos` |
| Textos del Narrador | IndexedDB | `fh_gallery_db`, almacén `texts` |
| Voz y velocidad elegidas | LocalStorage | `fh_voice_prefs` |

- Los datos son **de cada navegador y de cada dirección web**. El móvil y la tablet no se sincronizan solos; usad *Exportar* y *Cargar*.
- Si borras los datos del navegador para este sitio, se pierde la campaña. **Haced backups de vez en cuando.**
- El modo incógnito o privado puede no conservar los datos al cerrar.
- **No subáis vuestros backups al repositorio público:** contienen los textos transcritos del libro.
- Todo funciona sin conexión. El OCR (~10 MB) se descarga de vuestra propia web la primera vez que se usa y desde entonces también funciona sin conexión.

---

## 🗂️ Estructura del proyecto

```text
/
├── index.html          # Estructura principal
├── manifest.webmanifest # Nombre, colores e iconos de la app instalable
├── sw.js               # Service worker: modo sin conexión y actualizaciones
├── icons/              # Icono de la app (SVG y PNG en varios tamaños)
├── vendor/             # Librerías y fuentes copiadas (ver vendor/LICENSES.md)
├── css/
│   └── styles.css      # Estilos personalizados, animaciones y scrollbars
└── js/
    ├── app.js          # Punto de entrada: cabecera, pestañas y backups JSON
    ├── state.js        # Estado centralizado y persistencia en LocalStorage
    ├── db.js           # IndexedDB y compresión de imágenes con canvas
    ├── ui.js           # Utilidades compartidas: modales, avisos, iconos
    ├── pwa.js          # Registro del service worker y botón Instalar
    ├── outpostUI.js    # Fase de Puesto Avanzado: calendario y guías de reglas
    ├── flowchartUI.js  # Árbol de escenarios: pan, zoom, arrastre y modales
    ├── narratorUI.js   # Narrador: búsqueda, biblioteca, editor y OCR
    ├── speech.js       # Motor de lectura en voz alta y barra flotante
    ├── galleryUI.js    # Salón de los Héroes: subida, cuadrícula y visor
    ├── chronicleUI.js  # Crónica de la campaña (pergamino imprimible)
    └── ambience.js     # Fondo temático, clima y transición de estación
```

## 🛠️ Tecnología

- HTML5, CSS3 y JavaScript (ES2020+) con **módulos ES nativos**, sin compilación.
- [Tailwind CSS](https://tailwindcss.com) (Play CDN) para el maquetado.
- [Lucide](https://lucide.dev) para los iconos.
- Fuentes *Cinzel* (títulos) e *Inter* (texto).
- Tailwind, Lucide, las fuentes, html2canvas, jsPDF y Tesseract (con el idioma español) van **copiados en `vendor/`**: la app no depende de ningún servicio externo.
- Service worker y Web App Manifest para la instalación y el modo sin conexión.
- LocalStorage e IndexedDB para guardar los datos.
- [Tesseract.js](https://github.com/naptha/tesseract.js) (cargado solo al usar el OCR) y la Web Speech API para el Narrador.
- [html2canvas](https://html2canvas.hertzen.com/) y [jsPDF](https://github.com/parallax/jsPDF) para el PDF de la Crónica (se cargan solo al pulsar *Descargar PDF*).

Navegadores compatibles: versiones actuales de Chrome, Edge, Firefox y Safari, también en iOS y Android.

---

## ⚖️ Aviso

Proyecto de fans sin ánimo de lucro, no oficial. **Frosthaven** es una marca de Cephalofair Games, que no respalda este proyecto. Las guías de reglas son resúmenes de consulta rápida; ante cualquier duda, manda el reglamento oficial.
