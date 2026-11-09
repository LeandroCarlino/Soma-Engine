import type { Stats } from '../types';
import { escribirJSON, leerJSON } from './storage';

export type TipoProtocolo =
  | 'felicidad'
  | 'descubrir'
  | 'sinergia'
  | 'comando'
  | 'escenario'
  | 'tiempo';

export interface Protocolo {
  id: string;
  tipo: TipoProtocolo;
  titulo: string;
  descripcion: string;
  meta: number;
  progreso: number;
  detalle?: string;
  umbral?: number;
  vistos?: string[];
  recompensa: number;
}

export interface EstadoProtocolos {
  activos: Protocolo[];
  completados: number;
  puntaje: number;
}

export interface EntradaProtocolos {
  stats: Stats;
  palabrasNuevas: number;
  combosNuevos: number;
  comandos: string[];
  combo: string | null;
  escenario?: string;
}

export interface ResultadoProtocolos {
  estado: EstadoProtocolos;
  eventos: string[];
}

export interface GestorProtocolos {
  estado: () => EstadoProtocolos;
  actualizar: (entrada: EntradaProtocolos) => string[];
  tick: (stats: Stats) => string[];
  guardar: () => void;
}

const CLAVE = 'soma_protocolos';
const TIPOS: TipoProtocolo[] = [
  'felicidad',
  'descubrir',
  'sinergia',
  'comando',
  'escenario',
  'tiempo',
];

const COMANDOS_OBJETIVO = [
  'fuego',
  'hielo',
  'tierra',
  'viento',
  'holograma',
  'aurora',
  'espejo',
  'yo',
];

const elegir = <T,>(lista: T[], rnd: () => number): T =>
  lista[Math.min(lista.length - 1, Math.floor(rnd() * lista.length))];

const nuevoId = (tipo: TipoProtocolo, rnd: () => number): string =>
  `${tipo}-${Math.floor(rnd() * 1_000_000).toString(36)}`;

export function crearProtocolo(
  tipo: TipoProtocolo,
  rnd: () => number = Math.random,
): Protocolo {
  const base = {
    id: nuevoId(tipo, rnd),
    tipo,
    progreso: 0,
    recompensa: 80,
  };

  switch (tipo) {
    case 'felicidad': {
      const meta = 10 + Math.floor(rnd() * 6);
      const umbral = 70 + Math.floor(rnd() * 2) * 5;
      return {
        ...base,
        titulo: 'FELICIDAD',
        descripcion: `Mantené la felicidad en ${umbral} o más durante ${meta} s.`,
        meta,
        umbral,
        recompensa: 100,
      };
    }
    case 'descubrir': {
      const meta = 3 + Math.floor(rnd() * 2);
      return {
        ...base,
        titulo: 'ARCHIVO',
        descripcion: `Descubrí ${meta} palabras nuevas.`,
        meta,
        recompensa: 80,
      };
    }
    case 'sinergia': {
      const meta = 1 + Math.floor(rnd() * 2);
      return {
        ...base,
        titulo: 'SINERGIA',
        descripcion: `Descubrí ${meta} sinergia${meta > 1 ? 's' : ''}.`,
        meta,
        recompensa: 120,
      };
    }
    case 'comando': {
      const detalle = elegir(COMANDOS_OBJETIVO, rnd);
      return {
        ...base,
        titulo: 'COMANDO',
        descripcion: `Usá el comando «${detalle}».`,
        meta: 1,
        detalle,
        recompensa: 70,
      };
    }
    case 'escenario': {
      const meta = 2 + Math.floor(rnd() * 2);
      return {
        ...base,
        titulo: 'EXPLORACIÓN',
        descripcion: `Visitá ${meta} escenarios distintos.`,
        meta,
        vistos: [],
        recompensa: 90,
      };
    }
    case 'tiempo': {
      const meta = 12 + Math.floor(rnd() * 9);
      return {
        ...base,
        titulo: 'RESISTENCIA',
        descripcion: `Acumulá ${meta} s con energía por debajo de 25.`,
        meta,
        recompensa: 90,
      };
    }
  }
}

function elegirTipoLibre(
  activos: Protocolo[],
  rnd: () => number,
  evitarExtra?: TipoProtocolo,
): TipoProtocolo {
  const usados = new Set(activos.map((protocolo) => protocolo.tipo));
  if (evitarExtra) usados.add(evitarExtra);
  const libres = TIPOS.filter((tipo) => !usados.has(tipo));
  return elegir(libres.length > 0 ? libres : TIPOS, rnd);
}

export function crearEstadoInicial(rnd: () => number = Math.random): EstadoProtocolos {
  const tipos = [...TIPOS];
  for (let i = tipos.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [tipos[i], tipos[j]] = [tipos[j], tipos[i]];
  }

  return {
    activos: tipos.slice(0, 3).map((tipo) => crearProtocolo(tipo, rnd)),
    completados: 0,
    puntaje: 0,
  };
}

function cerrarCompletados(
  activos: Protocolo[],
  estado: EstadoProtocolos,
  eventos: string[],
  rnd: () => number,
): EstadoProtocolos {
  let { completados, puntaje } = estado;

  for (let i = 0; i < activos.length; i++) {
    const protocolo = activos[i];
    if (protocolo.progreso < protocolo.meta) continue;

    eventos.push(`PROTOCOLO COMPLETADO: ${protocolo.titulo} (+${protocolo.recompensa} PTS)`);
    puntaje += protocolo.recompensa;
    completados += 1;

    const otros = activos.filter((_, indice) => indice !== i);
    const tipo = elegirTipoLibre(otros, rnd, protocolo.tipo);
    activos[i] = crearProtocolo(tipo, rnd);
  }

  return { activos, completados, puntaje };
}

export function aplicarEntrada(
  estado: EstadoProtocolos,
  entrada: EntradaProtocolos,
  rnd: () => number = Math.random,
): ResultadoProtocolos {
  const eventos: string[] = [];
  const activos = estado.activos.map((protocolo) => ({
    ...protocolo,
    vistos: protocolo.vistos ? [...protocolo.vistos] : undefined,
  }));

  for (const protocolo of activos) {
    switch (protocolo.tipo) {
      case 'felicidad':
        break;
      case 'descubrir':
        protocolo.progreso += Math.max(0, entrada.palabrasNuevas);
        break;
      case 'sinergia':
        protocolo.progreso += Math.max(0, entrada.combosNuevos);
        break;
      case 'comando':
        if (
          entrada.comandos.includes(protocolo.detalle ?? '') ||
          entrada.combo === protocolo.detalle
        ) {
          protocolo.progreso = 1;
        }
        break;
      case 'escenario':
        if (entrada.escenario && entrada.escenario !== 'ninguno') {
          protocolo.vistos ??= [];
          if (!protocolo.vistos.includes(entrada.escenario)) {
            protocolo.vistos.push(entrada.escenario);
          }
          protocolo.progreso = protocolo.vistos.length;
        }
        break;
      case 'tiempo':
        break;
    }
  }

  return {
    estado: cerrarCompletados(activos, estado, eventos, rnd),
    eventos,
  };
}

export function aplicarTick(
  estado: EstadoProtocolos,
  stats: Stats,
  rnd: () => number = Math.random,
): ResultadoProtocolos {
  const eventos: string[] = [];
  const activos = estado.activos.map((protocolo) => ({
    ...protocolo,
    vistos: protocolo.vistos ? [...protocolo.vistos] : undefined,
  }));

  for (const protocolo of activos) {
    if (protocolo.tipo === 'tiempo') {
      protocolo.progreso = stats.energy < 25
        ? Math.min(protocolo.meta, protocolo.progreso + 1)
        : 0;
    } else if (protocolo.tipo === 'felicidad') {
      protocolo.progreso = stats.happiness >= (protocolo.umbral ?? 70)
        ? Math.min(protocolo.meta, protocolo.progreso + 1)
        : 0;
    }
  }

  return {
    estado: cerrarCompletados(activos, estado, eventos, rnd),
    eventos,
  };
}

function esEstadoValido(valor: unknown): valor is EstadoProtocolos {
  if (!valor || typeof valor !== 'object') return false;
  const estado = valor as EstadoProtocolos;
  if (!Array.isArray(estado.activos) || estado.activos.length !== 3) return false;
  if (typeof estado.puntaje !== 'number' || typeof estado.completados !== 'number') return false;

  return estado.activos.every(
    (protocolo) =>
      protocolo &&
      typeof protocolo.id === 'string' &&
      TIPOS.includes(protocolo.tipo) &&
      typeof protocolo.titulo === 'string' &&
      typeof protocolo.descripcion === 'string' &&
      Number.isFinite(protocolo.meta) &&
      protocolo.meta > 0 &&
      Number.isFinite(protocolo.progreso),
  );
}

export function guardarEstado(estado: EstadoProtocolos): void {
  escribirJSON(CLAVE, estado);
}

export function cargarEstado(rnd: () => number = Math.random): EstadoProtocolos {
  const guardado = leerJSON<unknown>(CLAVE, null);
  if (esEstadoValido(guardado)) return guardado;

  const inicial = crearEstadoInicial(rnd);
  guardarEstado(inicial);
  return inicial;
}

export function iniciarProtocolos(rnd: () => number = Math.random): GestorProtocolos {
  let estado = cargarEstado(rnd);
  let ticks = 0;

  const guardar = (): void => guardarEstado(estado);

  return {
    estado: () => estado,
    actualizar: (entrada) => {
      const resultado = aplicarEntrada(estado, entrada, rnd);
      estado = resultado.estado;
      guardar();
      return resultado.eventos;
    },
    tick: (stats) => {
      const resultado = aplicarTick(estado, stats, rnd);
      estado = resultado.estado;
      ticks += 1;
      if (resultado.eventos.length > 0 || ticks % 5 === 0) guardar();
      return resultado.eventos;
    },
    guardar,
  };
}
