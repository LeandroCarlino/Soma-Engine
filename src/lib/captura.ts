import type { StatsVista } from './hud';

export interface DatosCaptura {
  escenario: string;
  pose: string;
  stats: StatsVista;
}

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

export function formatearFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(
    fecha.getDate(),
  )} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function nombreCaptura(fecha = new Date()): string {
  return `soma-${fecha.getFullYear()}${dosDigitos(fecha.getMonth() + 1)}${dosDigitos(
    fecha.getDate(),
  )}-${dosDigitos(fecha.getHours())}${dosDigitos(fecha.getMinutes())}${dosDigitos(
    fecha.getSeconds(),
  )}.png`;
}

/**
 * Compone una postal a partir del canvas 2D (antes del post-procesado WebGL):
 * marco, scanlines y una barra con escenario, pose, stats y fecha.
 */
export function crearCaptura(
  origen: HTMLCanvasElement,
  datos: DatosCaptura,
  fecha = new Date(),
): HTMLCanvasElement {
  const salida = document.createElement('canvas');
  salida.width = origen.width;
  salida.height = origen.height;

  const ctx = salida.getContext('2d');
  if (!ctx) return salida;

  const estilos = getComputedStyle(document.documentElement);
  const acento = estilos.getPropertyValue('--accent').trim() || '#6bffb0';
  const texto = estilos.getPropertyValue('--text').trim() || '#b9d8c9';
  const tenue = estilos.getPropertyValue('--muted').trim() || '#5f7f70';

  ctx.drawImage(origen, 0, 0);

  // Scanlines apenas visibles, para que la postal comparta la identidad.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#000';
  for (let y = 0; y < salida.height; y += 3) {
    ctx.fillRect(0, y, salida.width, 1);
  }
  ctx.restore();

  const altoBarra = 108;
  const degradado = ctx.createLinearGradient(
    0,
    salida.height - altoBarra,
    0,
    salida.height,
  );
  degradado.addColorStop(0, 'rgba(2, 5, 4, 0)');
  degradado.addColorStop(1, 'rgba(2, 5, 4, 0.95)');
  ctx.fillStyle = degradado;
  ctx.fillRect(0, salida.height - altoBarra, salida.width, altoBarra);

  const margen = 20;
  const largo = 30;
  ctx.strokeStyle = acento;
  ctx.lineWidth = 2;
  for (const [x, y, sx, sy] of [
    [margen, margen, 1, 1],
    [salida.width - margen, margen, -1, 1],
    [margen, salida.height - margen, 1, -1],
    [salida.width - margen, salida.height - margen, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + sx * largo, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * largo);
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = acento;
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillText('SOMA ENGINE', 38, salida.height - 64);

  ctx.fillStyle = texto;
  ctx.font = '15px "Courier New", monospace';
  ctx.fillText(
    `ESCENARIO ${datos.escenario.toUpperCase()} · POSE ${datos.pose.toUpperCase()}`,
    38,
    salida.height - 36,
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = acento;
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText(
    `HAMBRE ${Math.round(datos.stats.hunger)} · ENERGÍA ${Math.round(
      datos.stats.energy,
    )} · ÁNIMO ${Math.round(datos.stats.happiness)}`,
    salida.width - 38,
    salida.height - 36,
  );

  ctx.fillStyle = tenue;
  ctx.font = '13px "Courier New", monospace';
  ctx.fillText(formatearFecha(fecha), salida.width - 38, salida.height - 64);

  ctx.strokeStyle = acento;
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, salida.width - 28, salida.height - 28);

  return salida;
}
