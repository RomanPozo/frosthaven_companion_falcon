/**
 * chronicleUI.js — Crónica de Frosthaven (vista del Salón de los Héroes).
 *
 * Línea temporal tipo pergamino agrupada por Año → Estación → Semana con:
 * lecturas del Libro de Secciones, diario de eventos, escenarios
 * desbloqueados/completados y fotos. Se descarga como PDF generado en el propio
 * navegador (html2canvas + jsPDF, copias locales en vendor/ cargadas solo al usarlo) o se imprime.
 * Solo lee datos (estado + IndexedDB); no modifica nada.
 */

import * as S from './state.js';
import * as DB from './db.js';
import { escapeHtml, icon, refreshIcons, toast, loadScript, offerFile, canShareFile, downloadFile } from './ui.js';

const HTML2CANVAS_URL = 'vendor/html2canvas-1.4.1.min.js';
const JSPDF_URL = 'vendor/jspdf-2.5.1.umd.min.js';
const PDF_BG = '#efe2c2';
const PDF_RENDER_WIDTH = 760;

let yearFilter = 'all';
let renderToken = 0;
const thumbURLs = [];

function revokeThumbs() {
  while (thumbURLs.length) URL.revokeObjectURL(thumbURLs.pop());
}

function scenarioLabel(node) {
  return `${node.number ? `#${node.number} ` : ''}${node.name}`.trim() || 'Escenario';
}

/* ==========================================================================
   Datos
   ========================================================================== */

/** Agrupa todo lo ocurrido por semana. */
function collect(state, photos) {
  const current = state.calendar.currentWeek;
  const weeks = new Map();
  const add = (week, item) => {
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week).push(item);
  };
  const undated = [];

  for (const [w, list] of Object.entries(state.calendar.scheduledSections)) {
    const week = Number(w);
    if (week > current) continue; // las futuras aún no se han leído
    for (const entry of list) add(week, { type: 'section', order: 0, entry });
  }
  for (const log of state.eventLogs) add(log.week, { type: 'log', order: 1, log });
  for (const node of state.scenarios.nodes) {
    if (node.status !== 'locked') {
      if (node.unlockedWeek) add(node.unlockedWeek, { type: 'unlock', order: 2, node });
      else undated.push({ type: 'unlock', node });
    }
    if (node.status === 'completed') {
      if (node.completedWeek) add(node.completedWeek, { type: 'complete', order: 3, node });
      else undated.push({ type: 'complete', node });
    }
  }
  for (const photo of photos) add(photo.week, { type: 'photo', order: 4, photo });

  for (const items of weeks.values()) items.sort((a, b) => a.order - b.order);
  return { weeks, undated };
}

/* ==========================================================================
   Pintado
   ========================================================================== */

function itemHtml(item) {
  switch (item.type) {
    case 'section':
      return `
        <li class="chron-item">
          <span class="chron-item__icon chron-item__icon--blood">${icon('book-open')}</span>
          <div>Lectura de la sección <strong>${escapeHtml(item.entry.section)}</strong>${
            item.entry.note ? ` — <em>${escapeHtml(item.entry.note)}</em>` : ''
          }</div>
        </li>`;
    case 'log':
      return `
        <li class="chron-item">
          <span class="chron-item__icon">${icon('scroll-text')}</span>
          <div>
            ${item.log.cardNumber ? `<strong>Evento ${escapeHtml(item.log.cardNumber)}.</strong> ` : ''}
            <span class="chron-pre">${escapeHtml(item.log.notes)}</span>
          </div>
        </li>`;
    case 'unlock':
      return `
        <li class="chron-item">
          <span class="chron-item__icon chron-item__icon--ice">${icon('lock-open')}</span>
          <div>Se abre el camino a <strong>${escapeHtml(scenarioLabel(item.node))}</strong>${
            item.node.coords ? ` <span class="chron-muted">(${escapeHtml(item.node.coords)})</span>` : ''
          }.</div>
        </li>`;
    case 'complete':
      return `
        <li class="chron-item chron-item--victory">
          <span class="chron-item__icon chron-item__icon--gold">${icon('trophy')}</span>
          <div>
            <strong>${escapeHtml(scenarioLabel(item.node))}</strong> completado.
            ${item.node.notes.trim() ? `<span class="chron-pre chron-notes">${escapeHtml(item.node.notes)}</span>` : ''}
          </div>
        </li>`;
    default:
      return '';
  }
}

function photosHtml(items) {
  const photos = items.filter((i) => i.type === 'photo').map((i) => i.photo);
  if (!photos.length) return '';
  return `
    <div class="chron-photos">
      ${photos
        .map((p) => {
          const url = URL.createObjectURL(p.thumb ?? p.blob);
          thumbURLs.push(url);
          return `
            <button type="button" class="chron-photo" data-chron-photo="${escapeHtml(p.id)}" aria-label="Ver foto: ${escapeHtml(p.title)}">
              <img src="${url}" alt="" decoding="async" />
              <span>${escapeHtml(p.title)}</span>
            </button>`;
        })
        .join('')}
    </div>`;
}

function weekHtml(week, items, current) {
  return `
    <article class="chron-week ${week === current ? 'is-current' : ''}">
      <div class="chron-week__marker" aria-hidden="true">${week}</div>
      <div class="chron-week__body">
        <h5 class="chron-week__title">Semana ${week}${week === current ? ' <span class="chron-now">semana actual</span>' : ''}</h5>
        <ul class="chron-list">${items.map(itemHtml).join('')}</ul>
        ${photosHtml(items)}
      </div>
    </article>`;
}

/**
 * Pinta la crónica dentro de `container`.
 * @param {HTMLElement} container
 * @param {{ onOpenPhoto?: (id: string) => void }} [opts]
 */
export async function renderChronicle(container, { onOpenPhoto } = {}) {
  const token = ++renderToken;
  const state = S.getState();
  let photos = [];
  try {
    photos = await DB.getAllPhotos();
  } catch {
    photos = []; // sin IndexedDB la crónica sale igual, sin fotos
  }
  if (token !== renderToken) return; // llegó otro render más reciente
  revokeThumbs();

  const current = state.calendar.currentWeek;
  const { weeks, undated } = collect(state, photos);
  const sortedWeeks = [...weeks.keys()].sort((a, b) => a - b);
  const years = [...new Set([...sortedWeeks.map(S.getYear), S.getYear(current)])].sort();
  if (yearFilter !== 'all' && !years.includes(Number(yearFilter))) yearFilter = 'all';

  const completed = state.scenarios.nodes.filter((n) => n.status === 'completed').length;
  const stats = [
    `${current} ${current === 1 ? 'semana' : 'semanas'}`,
    `${completed} ${completed === 1 ? 'escenario completado' : 'escenarios completados'}`,
    `${state.eventLogs.length} ${state.eventLogs.length === 1 ? 'entrada del diario' : 'entradas del diario'}`,
    `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}`,
  ];

  let body = '';
  for (const year of years) {
    if (yearFilter !== 'all' && Number(yearFilter) !== year) continue;
    let yearHtml = '';
    for (const season of ['summer', 'winter']) {
      const inSeason = sortedWeeks.filter((w) => S.getYear(w) === year && S.getSeason(w) === season);
      if (!inSeason.length) continue;
      const info = S.SEASONS[season];
      yearHtml += `
        <div class="chron-season chron-season--${season}">
          <p class="chron-season__label">${icon(info.icon)}${info.name} del Año ${year}</p>
          ${inSeason.map((w) => weekHtml(w, weeks.get(w), current)).join('')}
        </div>`;
    }
    if (yearHtml) {
      body += `
        <section class="chron-year">
          <h4 class="chron-year__title"><span>Año ${year}</span></h4>
          ${yearHtml}
        </section>`;
    }
  }

  if (undated.length && yearFilter === 'all') {
    body += `
      <section class="chron-year chron-undated">
        <h4 class="chron-year__title"><span>Sin fecha</span></h4>
        <p class="chron-muted text-sm no-print">Escenarios sin semana registrada. Edítalos en el Árbol de Escenarios para colocarlos en la crónica.</p>
        <ul class="chron-list mt-2">${undated.map(itemHtml).join('')}</ul>
      </section>`;
  }

  if (!body) {
    body = `<p class="chron-empty">Las páginas de esta crónica aún están en blanco. Escribid el diario de eventos, completad escenarios y subid fotos: aquí se irá contando vuestra historia.</p>`;
  }

  container.innerHTML = `
    <div class="flex flex-wrap items-center gap-2 mb-3 no-print">
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por año">
        ${['all', ...years]
          .map(
            (y) =>
              `<button type="button" class="pill ${String(yearFilter) === String(y) ? 'pill-gold' : 'pill-muted'}" data-chron-year="${y}">${
                y === 'all' ? 'Toda la campaña' : `Año ${y}`
              }</button>`,
          )
          .join('')}
      </div>
      <button type="button" class="btn btn-gold btn-icon-sm ml-auto" data-chron-pdf>${icon('file-down')}Descargar PDF</button>
      <button type="button" class="btn btn-ghost btn-icon-only" data-chron-print title="Imprimir" aria-label="Imprimir">${icon('printer')}</button>
    </div>

    <div class="chronicle">
      <header class="chronicle__header">
        <p class="chronicle__kicker">Crónica de</p>
        <h3 class="chronicle__title">${escapeHtml(state.campaignName)}</h3>
        <p class="chronicle__stats">${stats.map(escapeHtml).join(' · ')}</p>
        <div class="chronicle__ornament" aria-hidden="true"><span></span>${icon('snowflake')}<span></span></div>
      </header>
      ${body}
    </div>`;

  container.onclick = (e) => {
    const yearBtn = e.target.closest('[data-chron-year]');
    if (yearBtn) {
      yearFilter = yearBtn.dataset.chronYear;
      renderChronicle(container, { onOpenPhoto });
      return;
    }
    if (e.target.closest('[data-chron-pdf]')) {
      exportChronicleToPDF(container.querySelector('.chronicle'), S.getState().campaignName);
      return;
    }
    if (e.target.closest('[data-chron-print]')) {
      printChronicle();
      return;
    }
    const photo = e.target.closest('[data-chron-photo]');
    if (photo) onOpenPhoto?.(photo.dataset.chronPhoto);
  };
  refreshIcons();
}

/** Imprime solo la crónica (el navegador ofrece "Guardar como PDF"). */
export function printChronicle() {
  document.body.classList.add('print-chronicle');
  const done = () => {
    document.body.classList.remove('print-chronicle');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  // Deja pintar las imágenes antes de abrir el diálogo.
  setTimeout(() => window.print(), 50);
}

/* ==========================================================================
   PDF (generado en el navegador)
   ========================================================================== */

let exporting = false;
let inlineCssCache = null;

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * CSS de las hojas enlazadas (estilos y fuentes) como texto, con las fuentes
 * incrustadas en data URLs. html2canvas maqueta en un iframe interno que el
 * service worker no controla: sin conexión, cualquier <link> o fuente que ese
 * iframe pida a la red se queda colgado. Con esto no necesita pedir nada.
 */
async function buildInlineCss() {
  if (inlineCssCache) return inlineCssCache;
  const fontData = new Map();
  let css = '';
  for (const sheet of document.styleSheets) {
    if (!sheet.href) continue; // los <style> ya se copian tal cual
    let rules;
    try {
      rules = [...sheet.cssRules].map((r) => r.cssText).join('\n');
    } catch {
      continue; // hoja de otro dominio: no se puede leer
    }
    const urls = [...rules.matchAll(/url\("?([^")]+\.woff2)"?\)/g)].map((m) => m[1]);
    for (const url of urls) {
      if (fontData.has(url)) continue;
      const abs = new URL(url, sheet.href).href;
      const blob = await (await fetch(abs)).blob(); // pasa por el service worker: funciona sin conexión
      fontData.set(url, await blobToDataURL(blob));
    }
    css += rules.replace(/url\("?([^")]+\.woff2)"?\)/g, (m, url) => `url("${fontData.get(url)}")`) + '\n';
  }
  inlineCssCache = css;
  return css;
}

/** Recorta una franja vertical de un canvas. */
function sliceCanvas(canvas, sy, sh) {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = sh;
  c.getContext('2d').drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
  return c;
}

function pdfFilename(name) {
  const slug =
    String(name)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'campana';
  return `cronica-${slug}.pdf`;
}

/**
 * Genera un PDF A4 de la crónica y ofrece compartirlo o descargarlo.
 * Se hace una captura por página, agrupando bloques (cabecera, años,
 * estaciones y semanas) que caben juntos: una semana no se parte entre
 * páginas y el móvil no se queda sin memoria con campañas largas.
 */
export async function exportChronicleToPDF(source, campaignName) {
  if (exporting || !source) return;
  exporting = true;
  const progress = toast('Preparando el PDF…', { duration: 0 });
  const host = document.createElement('div');
  let inlineStyle = null;

  try {
    const [html2canvas, jspdf] = await Promise.all([loadScript(HTML2CANVAS_URL, 'html2canvas'), loadScript(JSPDF_URL, 'jspdf')]);

    // Copia fuera de pantalla con ancho fijo: el PDF sale igual desde el móvil o el ordenador.
    // Detrás del fondo (z-index negativo): no se ve, pero se puede capturar.
    host.style.cssText = `position:absolute;left:0;top:0;z-index:-2;width:${PDF_RENDER_WIDTH}px;pointer-events:none;`;
    const clone = source.cloneNode(true);
    clone.classList.add('chronicle--pdf');
    clone.querySelectorAll('.no-print').forEach((el) => el.remove()); // ayudas de pantalla
    host.appendChild(clone);
    document.body.appendChild(host);
    await document.fonts?.ready;
    inlineStyle = document.createElement('style');
    inlineStyle.dataset.pdfInline = '';
    inlineStyle.textContent = await buildInlineCss();
    document.head.appendChild(inlineStyle);
    await Promise.all([...clone.querySelectorAll('img')].map((img) => img.decode?.().catch(() => {})));

    const blocks = [
      ...clone.querySelectorAll('.chronicle__header, .chron-year__title, .chron-season__label, .chron-week, .chron-undated > .chron-list, .chron-empty'),
    ];
    const cs = getComputedStyle(clone);
    const cloneRect = clone.getBoundingClientRect();
    const contentLeft = cloneRect.left + window.scrollX + parseFloat(cs.paddingLeft);
    const contentPx = clone.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);

    const pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const bottom = pageH - margin - 6; // deja sitio para el pie
    const contentW = pageW - margin * 2;
    const mmPerPx = contentW / contentPx;
    const pagePx = (bottom - margin) / mmPerPx;
    const SCALE = 2;

    // Posición de cada bloque en la copia (px de documento).
    const items = blocks.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        title: el.classList.contains('chron-year__title') || el.classList.contains('chron-season__label'),
        hasPhotos: !!el.querySelector('img'),
      };
    });

    // Agrupa bloques consecutivos en páginas sin partir ninguna semana; un título
    // nunca se queda solo al final de una página.
    const pages = [];
    let current = null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const next = items[i + 1];
      const end = it.title && next ? next.bottom : it.bottom;
      if (current && end - current.top > pagePx) {
        pages.push(current);
        current = null;
      }
      if (!current) current = { top: it.top, bottom: it.bottom, hasPhotos: it.hasPhotos };
      else {
        current.bottom = it.bottom;
        current.hasPhotos ||= it.hasPhotos;
      }
    }
    if (current) pages.push(current);

    const paintPage = () => {
      pdf.setFillColor(239, 226, 194);
      pdf.rect(0, 0, pageW, pageH, 'F');
    };
    // PNG para texto (sin artefactos en el fondo liso); JPEG si hay fotos (pesa mucho menos).
    const encode = (c, photos) => (photos ? [c.toDataURL('image/jpeg', 0.92), 'JPEG'] : [c.toDataURL('image/png'), 'PNG']);

    let first = true;
    for (let i = 0; i < pages.length; i++) {
      const pg = pages[i];
      progress.update(`Generando PDF… página ${i + 1} de ${pages.length}`);
      const canvas = await html2canvas(clone, {
        x: contentLeft,
        y: pg.top,
        width: contentPx,
        height: Math.ceil(pg.bottom - pg.top),
        scale: SCALE,
        backgroundColor: PDF_BG,
        logging: false,
        useCORS: true,
        // html2canvas copia toda la página en cada captura: saltarse lo que no es
        // la crónica (paisaje, pestañas…) la hace mucho más rápida.
        // y los <link>: sus estilos y fuentes ya van incrustados en inlineStyle.
        ignoreElements: (el) =>
          el.tagName === 'LINK' || (el.parentElement === document.body && el !== host && !/^(SCRIPT|STYLE)$/.test(el.tagName)),
      });

      // Normalmente cabe en una página; un bloque gigante (muchas notas o fotos) se trocea.
      const sliceMax = Math.floor(pagePx * SCALE);
      for (let offset = 0; offset < canvas.height; offset += sliceMax) {
        if (!first) pdf.addPage();
        first = false;
        paintPage();
        const h = Math.min(sliceMax, canvas.height - offset);
        const part = offset === 0 && h === canvas.height ? canvas : sliceCanvas(canvas, offset, h);
        const [data, format] = encode(part, pg.hasPhotos);
        pdf.addImage(data, format, margin, margin, contentW, (h / SCALE) * mmPerPx);
        if (part !== canvas) part.width = part.height = 0;
      }
      canvas.width = canvas.height = 0; // libera memoria cuanto antes
    }

    // Pie de página.
    const total = pdf.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(107, 84, 52);
    for (let p = 1; p <= total; p++) {
      pdf.setPage(p);
      pdf.text(`Crónica de ${campaignName}  ·  ${p} / ${total}`, pageW / 2, pageH - margin / 2, { align: 'center' });
    }

    const blob = pdf.output('blob');
    const filename = pdfFilename(campaignName);
    const file = new File([blob], filename, { type: 'application/pdf' });
    progress.close();
    offerFile({
      title: 'PDF listo',
      noun: 'PDF',
      shareFile: canShareFile(file) ? file : null,
      shareTitle: `Crónica de ${campaignName}`,
      download: () => downloadFile(filename, blob),
      html: `<p class="mt-3 text-slate-300">${total} ${total === 1 ? 'página' : 'páginas'} · <strong class="text-slate-100">${
        blob.size > 1048576 ? `${(blob.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(blob.size / 1024))} KB`
      }</strong></p>`,
    });
  } catch (err) {
    console.error('[chronicle] PDF:', err);
    progress.close();
    toast(`No se pudo generar el PDF: ${err.message}`, { type: 'error', duration: 6000 });
  } finally {
    host.remove();
    inlineStyle?.remove();
    exporting = false;
  }
}
