/**
 * pwa.js — App instalable: registro del service worker, botón "Instalar" y
 * guía para iPhone/iPad (Safari no muestra aviso automático), más avisos de
 * conexión perdida/recuperada.
 */

import { icon, refreshIcons, toast, openModal } from './ui.js';

let deferredPrompt = null;
let button = null;

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ==========================================================================
   Service worker
   ========================================================================== */

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!secure) return;
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      // Con conexión, refresca en segundo plano la copia de todos los archivos
      // (también los de pestañas que aún no se han abierto).
      if (navigator.onLine) (reg.active ?? reg.waiting ?? reg.installing)?.postMessage?.('refresh-shell');
    })
    .catch((err) => console.warn('[pwa] No se pudo registrar el service worker:', err));
}

/* ==========================================================================
   Botón "Instalar"
   ========================================================================== */

function updateButton() {
  if (!button) return;
  button.hidden = isStandalone() || !(deferredPrompt || isIOS());
}

function showIOSGuide() {
  openModal({
    title: 'Instalar en iPhone / iPad',
    content: `
      <ol class="mt-4 grid gap-3 text-slate-200">
        <li class="rule-item"><span class="rule-item__icon">${icon('share')}</span>
          <div>Toca el botón <strong>Compartir</strong> del navegador (el cuadrado con la flecha hacia arriba).</div></li>
        <li class="rule-item"><span class="rule-item__icon">${icon('square-plus')}</span>
          <div>Elige <strong>Añadir a pantalla de inicio</strong>. Si no aparece, desliza la lista hacia abajo.</div></li>
        <li class="rule-item"><span class="rule-item__icon rule-item__icon--gold">${icon('snowflake')}</span>
          <div>Pulsa <strong>Añadir</strong>. Frosthaven aparecerá con su icono, a pantalla completa y sin conexión.</div></li>
      </ol>
      <div class="mt-4 rule-card rule-card--gold !p-3 text-sm text-slate-300">
        <strong class="text-amber-200">Importante:</strong> en iPhone la app instalada guarda sus datos aparte de Safari.
        Si ya tienes una campaña aquí, pulsa <strong>Exportar</strong> antes de instalar y luego <strong>Cargar</strong> dentro de la app.
      </div>
      <button type="button" class="btn btn-primary btn-block mt-5" data-modal-close autofocus>Entendido</button>`,
  });
}

async function onInstallClick() {
  if (deferredPrompt) {
    const prompt = deferredPrompt;
    deferredPrompt = null;
    prompt.prompt();
    try {
      await prompt.userChoice;
    } finally {
      updateButton();
    }
  } else if (isIOS()) {
    showIOSGuide();
  }
}

/* ==========================================================================
   Arranque
   ========================================================================== */

/** @param {HTMLButtonElement} installButton botón de la cabecera (oculto por defecto) */
export function initPWA(installButton) {
  button = installButton;
  registerServiceWorker();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // usamos nuestro propio botón
    deferredPrompt = e;
    updateButton();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    updateButton();
    toast('¡Frosthaven instalada! Ya la tienes en tu pantalla de inicio.', { type: 'success', duration: 5000 });
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', updateButton);
  button?.addEventListener('click', onInstallClick);

  window.addEventListener('offline', () => toast('Sin conexión: la app sigue funcionando con lo guardado.', { duration: 4500 }));
  window.addEventListener('online', () => toast('Conexión recuperada.', { type: 'success' }));

  updateButton();
  refreshIcons();
}
