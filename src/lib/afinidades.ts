import type { EnvParticleType, EscenarioType, HoraType } from '../types';
import { escribirJSON, leerJSON } from './storage';

export type TipoAfinidad = 'fuego' | 'agua' | 'mente';

export interface Afinidad {
  id: TipoAfinidad;
  nombre: string;
  descripcion: string;
  escenario: EscenarioType;
  hora: HoraType;
  clima: EnvParticleType;
  bgColor: string;
  multiplicadorCarga: number;
  multiplicadorPuntos: number;
  recuperacion: number;
  comando: string;
}

export const AFINIDADES: Record<TipoAfinidad, Afinidad> = {
  fuego: {
    id: 'fuego',
    nombre: 'Fuego',
    descripcion: 'Más riesgo y recompensa: los efectos intensos cuestan más estabilidad, pero los puntos suben.',
    escenario: 'volcan',
    hora: 'atardecer',
    clima: 'ceniza',
    bgColor: '#1a0500',
    multiplicadorCarga: 1.2,
    multiplicadorPuntos: 1.15,
    recuperacion: 1,
    comando: 'ignicion',
  },
  agua: {
    id: 'agua',
    nombre: 'Agua',
    descripcion: 'Más control: los efectos cuestan menos estabilidad y la recuperación es el doble.',
    escenario: 'playa',
    hora: 'amanecer',
    clima: 'petalos',
    bgColor: '#04120f',
    multiplicadorCarga: 0.85,
    multiplicadorPuntos: 1,
    recuperacion: 2,
    comando: 'tsunami',
  },
  mente: {
    id: 'mente',
    nombre: 'Mente',
    descripcion: 'Más puntos: cadenas, peticiones y protocolos rinden más, pero la estabilidad no perdona.',
    escenario: 'laboratorio',
    hora: 'noche',
    clima: 'datos',
    bgColor: '#050510',
    multiplicadorCarga: 1,
    multiplicadorPuntos: 1.25,
    recuperacion: 1,
    comando: 'sinapsis',
  },
};

const CLAVE = 'soma_afinidad';

export function afinidadActual(): TipoAfinidad | null {
  const valor = leerJSON<string>(CLAVE, '');
  return valor === 'fuego' || valor === 'agua' || valor === 'mente' ? valor : null;
}

export function guardarAfinidad(afinidad: TipoAfinidad | null): void {
  escribirJSON(CLAVE, afinidad ?? '');
}

export function datosAfinidad(afinidad: TipoAfinidad | null): Afinidad | null {
  return afinidad ? AFINIDADES[afinidad] : null;
}

export function multiplicadorCarga(): number {
  const afinidad = afinidadActual();
  return afinidad ? AFINIDADES[afinidad].multiplicadorCarga : 1;
}

export function multiplicadorPuntos(): number {
  const afinidad = afinidadActual();
  return afinidad ? AFINIDADES[afinidad].multiplicadorPuntos : 1;
}

export function recuperacionAfinidad(): number {
  const afinidad = afinidadActual();
  return afinidad ? AFINIDADES[afinidad].recuperacion : 1;
}

export function comandoDeAfinidad(comando: string): boolean {
  const afinidad = afinidadActual();
  return !!afinidad && AFINIDADES[afinidad].comando === comando;
}
