/**
 * HUD y terminal en DOM.
 *
 * Las stats vivían dibujadas dentro del canvas: no eran accesibles, no
 * escalaban con el layout y no se podían estilar. Ahora son DOM y el canvas
 * queda solo para el arte.
 */

export type Tema = 'fosforo' | 'ambar' | 'hielo';

export const TEMAS: Tema[] = ['fosforo', 'ambar', 'hielo'];

export interface StatsVista {
  energy: number;
  hunger: number;
  happiness: number;
}

export interface ContextoVista {
  pose: string;
  anim: string;
  particles: string;
  envParticles: string;
  escenario?: string;
  palabras: number;
  total: number;
  combos: number;
}

const $ = (id: string): HTMLElement | null => document.getElementById(id);

export function formatearTiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

export function clasificarLinea(texto: string): string {
  const limpio = texto.trim();
  if (/^SINERGIA/i.test(limpio)) return 'synergy';
  if (/denegado|no válido|no encontrado|error/i.test(limpio)) return 'error';
  if (/^SOMA:/i.test(limpio)) return 'soma';
  if (/aviso|peligro|crítico/i.test(limpio)) return 'warn';
  return 'normal';
}

export function describirEfectos(anim: string, particles: string, envParticles: string): string {
  const activos = [anim, particles, envParticles].filter((valor) => valor && valor !== 'none');
  return activos.length > 0 ? activos.map((valor) => valor.toUpperCase()).join(' · ') : '—';
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema;
}

export function temaValido(valor: unknown): Tema {
  return TEMAS.includes(valor as Tema) ? (valor as Tema) : 'fosforo';
}

function actualizarStat(
  id: keyof StatsVista,
  valor: number,
  anterior: number,
): void {
  const barra = $(`bar-${id}`);
  const numero = $(`val-${id}`);
  const tendencia = $(`trend-${id}`);
  const seguro = Math.max(0, Math.min(100, valor));

  if (barra) barra.style.width = `${seguro}%`;
  if (numero) numero.textContent = String(Math.round(seguro));

  if (tendencia) {
    const delta = valor - anterior;
    const sube = delta > 0.02;
    const baja = delta < -0.02;
    tendencia.textContent = sube ? '▲' : baja ? '▼' : '·';
    tendencia.className = `stat-trend${sube ? ' up' : baja ? ' down' : ''}`;
  }

  barra?.closest('.stat')?.classList.toggle('is-low', seguro < 30);
}

export function actualizarStats(stats: StatsVista, anterior: StatsVista): void {
  actualizarStat('hunger', stats.hunger, anterior.hunger);
  actualizarStat('energy', stats.energy, anterior.energy);
  actualizarStat('happiness', stats.happiness, anterior.happiness);

  const estado = $('vitals-state');
  if (estado) {
    const minimo = Math.min(stats.energy, stats.hunger, stats.happiness);
    const nivel = minimo < 15 ? 'CRÍTICO' : minimo < 35 ? 'INESTABLE' : 'ESTABLE';
    estado.textContent = nivel;
    estado.dataset.estado = minimo < 15 ? 'critico' : minimo < 35 ? 'inestable' : 'estable';
  }
}

export function actualizarContexto(contexto: ContextoVista): void {
  const escribir = (id: string, texto: string): void => {
    const el = $(id);
    if (el) el.textContent = texto;
  };

  escribir('ctx-pose', contexto.pose.toUpperCase());
  escribir('ctx-escenario', (contexto.escenario || 'ninguno').toUpperCase());
  escribir('ctx-efectos', describirEfectos(contexto.anim, contexto.particles, contexto.envParticles));
  escribir('hud-discovery', String(contexto.palabras));
  escribir('hud-total', String(contexto.total));
  escribir('hud-combos', String(contexto.combos));
}

export interface Terminal {
  agregar: (texto: string, clase?: string) => void;
  agregarComando: (id: string, descripcion: string) => void;
  agregarBusqueda: (etiqueta: string, valor: string, descripcion: string) => void;
  anunciar: (texto: string) => void;
  detener: () => void;
}

const MAX_LINEAS = 150;

export function iniciarTerminal(log: HTMLElement, historial: HTMLElement): Terminal {
  let cantidad = 0;
  let ignorarSiguiente = false;

  const hora = (): HTMLSpanElement => {
    const el = document.createElement('span');
    el.className = 'term-time';
    el.textContent = formatearTiempo(performance.now() / 1000);
    return el;
  };

  const insertar = (fila: HTMLElement): void => {
    historial.appendChild(fila);

    cantidad++;
    while (historial.children.length > MAX_LINEAS) {
      historial.removeChild(historial.firstChild as Node);
    }
    historial.scrollTop = historial.scrollHeight;

    const contador = $('terminal-lines');
    if (contador) contador.textContent = String(cantidad);
  };

  const agregar = (texto: string, clase?: string): void => {
    const limpio = texto.trim();
    if (!limpio) return;

    const fila = document.createElement('div');
    fila.className = `term-line term-line--${clase ?? clasificarLinea(limpio)}`;

    const cuerpo = document.createElement('span');
    cuerpo.textContent = limpio;

    fila.append(hora(), cuerpo);
    insertar(fila);
  };

  const agregarAccion = (
    etiqueta: string,
    descripcion: string,
    atributo: 'data-comando' | 'data-buscar',
    valor: string,
  ): void => {
    const fila = document.createElement('div');
    fila.className = 'term-line term-line--comando';

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'term-link';
    boton.setAttribute(atributo, valor);
    boton.textContent = etiqueta;

    const texto = document.createElement('span');
    texto.className = 'term-desc';
    texto.textContent = ` — ${descripcion}`;

    fila.append(hora(), boton, texto);
    insertar(fila);
  };

  const agregarComando = (id: string, descripcion: string): void => {
    agregarAccion(id, descripcion, 'data-comando', id);
  };

  const agregarBusqueda = (etiqueta: string, valor: string, descripcion: string): void => {
    agregarAccion(etiqueta, descripcion, 'data-buscar', valor);
  };

  const anunciar = (texto: string): void => {
    if (!texto.trim()) return;
    // Se usa el live region, pero el texto ya se muestra en la terminal:
    // el observer no debe duplicarlo como línea.
    ignorarSiguiente = true;
    log.textContent = texto;
  };

  if (log.textContent?.trim()) agregar(log.textContent);

  let ultimo = log.textContent ?? '';
  const observador = new MutationObserver(() => {
    const texto = log.textContent ?? '';
    if (ignorarSiguiente) {
      ignorarSiguiente = false;
      ultimo = texto;
      return;
    }
    if (!texto.trim() || texto === ultimo) return;
    ultimo = texto;
    agregar(texto);
  });

  observador.observe(log, { childList: true, characterData: true, subtree: true });

  return { agregar, agregarComando, agregarBusqueda, anunciar, detener: () => observador.disconnect() };
}
