/**
 * ambience.js — Fondo temático según la estación.
 *
 * - Cielo, aurora (invierno) o sol bajo (verano) con CSS.
 * - Paisaje en SVG dibujado a mano: montañas nevadas, bosque de pinos y una
 *   empalizada con casas y ventanas iluminadas.
 * - Partículas suaves en un <canvas>: nieve en invierno, brasas en verano.
 * - Transición animada al cambiar de estación.
 *
 * Pensado para gastar poco: pocas partículas, ~30 fps, se pausa si la página
 * no está visible y respeta "reducir movimiento" del sistema.
 */

import * as S from './state.js';

const FRAME_MS = 1000 / 30;

let layer = null;
let canvas = null;
let ctx = null;
let particles = [];
let season = null;
let rafId = 0;
let lastFrame = 0;
let width = 0;
let height = 0;
let dpr = 1;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ==========================================================================
   Paisaje SVG
   ========================================================================== */

/** Generador pseudoaleatorio determinista: el bosque siempre sale igual. */
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pine(x, base, h) {
  const w = h * 0.42;
  const tiers = 3;
  let d = `M${x - 1.5} ${base} L${x - 1.5} ${base - h * 0.18} L${x + 1.5} ${base - h * 0.18} L${x + 1.5} ${base} Z `;
  for (let i = 0; i < tiers; i++) {
    const top = base - h + (i * h) / (tiers + 0.6);
    const bottom = top + h * 0.48;
    const tw = w * (0.55 + i * 0.25);
    d += `M${x} ${top} L${x - tw / 2} ${bottom} L${x + tw / 2} ${bottom} Z `;
  }
  return d;
}

function forest(seed, count, fromX, toX, baseFn, minH, maxH) {
  const rnd = seeded(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = fromX + rnd() * (toX - fromX);
    d += pine(x, baseFn(x) + 2, minH + rnd() * (maxH - minH));
  }
  return d;
}

const hillY = (x) => 300 - 22 * Math.sin(x / 140) - 12 * Math.sin(x / 57);
const frontY = (x) => 352 - 10 * Math.sin(x / 190 + 1);

function palisade() {
  let d = '';
  for (let x = 860; x <= 1210; x += 11) {
    const h = 34 + ((x * 7) % 9);
    d += `M${x} 338 L${x} ${338 - h} L${x + 5} ${330 - h} L${x + 10} ${338 - h} L${x + 10} 338 Z `;
  }
  return d;
}

function town() {
  // Casas, una sala comunal y una torre de vigía tras la empalizada.
  const houses = [
    [880, 292, 46, 30],
    [935, 284, 58, 40],
    [1005, 296, 40, 26],
    [1050, 270, 70, 52],
    [1130, 290, 50, 34],
    [1185, 298, 36, 24],
  ];
  let body = '';
  let windows = '';
  for (const [x, y, w, h] of houses) {
    body += `M${x} ${y + h} L${x} ${y} L${x + w / 2} ${y - h * 0.55} L${x + w} ${y} L${x + w} ${y + h} Z `;
    windows += `<rect class="amb-window" x="${x + w * 0.3}" y="${y + h * 0.3}" width="5" height="6" rx="1"></rect>`;
    if (w > 50) windows += `<rect class="amb-window" x="${x + w * 0.62}" y="${y + h * 0.35}" width="5" height="6" rx="1"></rect>`;
  }
  // Torre de vigía con tejado puntiagudo.
  body += 'M1010 300 L1010 236 L1004 236 L1022 212 L1040 236 L1034 236 L1034 300 Z ';
  windows += '<rect class="amb-window amb-window--tower" x="1018" y="244" width="6" height="8" rx="1"></rect>';
  return { body, windows };
}

function landscapeSVG() {
  const t = town();
  const caps = [
    [330, 120],
    [800, 110],
    [1280, 130],
    [560, 150],
    [1040, 140],
  ]
    .map(([x, y]) => `M${x} ${y} L${x - 30} ${y + 38} L${x - 14} ${y + 32} L${x} ${y + 44} L${x + 14} ${y + 30} L${x + 32} ${y + 40} Z`)
    .join(' ');

  return `
    <svg class="amb-land" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="amb-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0f172a" stop-opacity="0"></stop>
          <stop offset="1" stop-color="#0f172a" stop-opacity="0.85"></stop>
        </linearGradient>
      </defs>
      <path class="amb-mount-far" d="M0 260 L120 180 L210 230 L330 120 L450 210 L560 150 L680 230 L800 110 L930 200 L1040 140 L1160 220 L1280 130 L1440 210 L1440 400 L0 400 Z"></path>
      <path class="amb-caps" d="${caps}"></path>
      <path class="amb-hills" d="M0 ${hillY(0)} ${Array.from({ length: 49 }, (_, i) => `L${i * 30} ${hillY(i * 30).toFixed(1)}`).join(' ')} L1440 400 L0 400 Z"></path>
      <path class="amb-trees-back" d="${forest(7, 70, 0, 1440, hillY, 16, 30)}"></path>
      <path class="amb-town" d="${t.body}"></path>
      <path class="amb-palisade" d="${palisade()}"></path>
      <g class="amb-windows">${t.windows}</g>
      <path class="amb-ground" d="M0 ${frontY(0)} ${Array.from({ length: 49 }, (_, i) => `L${i * 30} ${frontY(i * 30).toFixed(1)}`).join(' ')} L1440 400 L0 400 Z"></path>
      <path class="amb-trees-front" d="${forest(42, 16, 0, 820, frontY, 34, 58)} ${forest(99, 6, 1260, 1440, frontY, 34, 56)}"></path>
      <rect x="0" y="0" width="1440" height="400" fill="url(#amb-fade)"></rect>
    </svg>`;
}

/* ==========================================================================
   Partículas
   ========================================================================== */

function particleCount() {
  const area = (width * height) / (1280 * 800);
  const base = season === 'winter' ? 55 : 16;
  return Math.max(8, Math.round(base * Math.min(1.2, Math.max(0.45, area))));
}

function spawn(initial = false) {
  if (season === 'winter') {
    const depth = Math.random();
    return {
      x: Math.random() * width,
      y: initial ? Math.random() * height : -10,
      r: 0.8 + depth * 2.1,
      vy: 12 + depth * 30,
      sway: 6 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      a: 0.25 + depth * 0.5,
    };
  }
  return {
    x: Math.random() * width,
    y: initial ? height * (0.4 + Math.random() * 0.6) : height + 10,
    r: 0.8 + Math.random() * 1.6,
    vy: -(10 + Math.random() * 22),
    sway: 8 + Math.random() * 18,
    phase: Math.random() * Math.PI * 2,
    a: 0.35 + Math.random() * 0.45,
    life: 0,
    maxLife: 6 + Math.random() * 8,
  };
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const target = particleCount();
  while (particles.length < target) particles.push(spawn(true));
  particles.length = target;
}

function frame(now) {
  rafId = requestAnimationFrame(frame);
  const elapsed = now - lastFrame;
  if (elapsed < FRAME_MS) return;
  const dt = Math.min(elapsed, 100) / 1000;
  lastFrame = now;
  const t = now / 1000;
  // Ráfagas de viento suaves en invierno.
  const wind = season === 'winter' ? 10 * Math.sin(t * 0.23) + 6 * Math.sin(t * 0.07) : 4 * Math.sin(t * 0.3);

  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.phase += dt;
    p.x += (Math.sin(p.phase) * p.sway + wind) * dt;
    p.y += p.vy * dt;

    if (season === 'winter') {
      if (p.y > height + 10 || p.x < -20 || p.x > width + 20) particles[i] = Object.assign(spawn(), { x: Math.random() * width });
      ctx.globalAlpha = p.a;
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      p.life += dt;
      if (p.y < -10 || p.life > p.maxLife) {
        particles[i] = spawn();
        continue;
      }
      const fade = Math.min(1, p.life / 1.2) * Math.max(0, 1 - p.life / p.maxLife);
      const flicker = 0.75 + 0.25 * Math.sin(p.phase * 7);
      ctx.globalAlpha = p.a * fade * flicker;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, '#fde68a');
      g.addColorStop(0.35, 'rgba(245,158,11,0.8)');
      g.addColorStop(1, 'rgba(245,158,11,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function start() {
  if (rafId || reducedMotion() || document.hidden) return;
  lastFrame = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  cancelAnimationFrame(rafId);
  rafId = 0;
}

/* ==========================================================================
   Estación y transición
   ========================================================================== */

function playTransition(to) {
  if (reducedMotion()) return;
  const fx = document.createElement('div');
  fx.className = `amb-transition amb-transition--${to}`;
  fx.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fx);
  fx.addEventListener('animationend', () => fx.remove(), { once: true });
  setTimeout(() => fx.remove(), 4000);
}

function applySeason(next, { animate = false } = {}) {
  if (next === season) return;
  const prev = season;
  season = next;
  document.documentElement.dataset.season = next;
  if (animate && prev) playTransition(next);
  if (ctx) {
    particles = [];
    resize();
  }
}

/* ==========================================================================
   Arranque
   ========================================================================== */

export function initAmbience() {
  if (layer) return;
  layer = document.createElement('div');
  layer.className = 'ambience';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <div class="amb-sky amb-sky--summer"></div>
    <div class="amb-sky amb-sky--winter"></div>
    <div class="amb-stars"></div>
    <div class="amb-aurora"><span></span><span></span><span></span></div>
    <div class="amb-sun"></div>
    ${landscapeSVG()}
    <canvas class="amb-particles"></canvas>
    <div class="amb-frost"></div>`;
  document.body.prepend(layer);

  canvas = layer.querySelector('canvas');
  ctx = canvas.getContext('2d');
  applySeason(S.getState().calendar.season);
  resize();
  start();

  window.addEventListener('resize', () => {
    resize();
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => {
    if (reducedMotion()) {
      stop();
      ctx.clearRect(0, 0, width, height);
    } else start();
  });

  S.subscribe((state, { type }) => {
    // Solo se anima al avanzar/retroceder; al importar o sincronizar, cambio directo.
    applySeason(state.calendar.season, { animate: type === 'calendar:advance' || type === 'calendar:rewind' || type === 'calendar:set' });
  });
}
