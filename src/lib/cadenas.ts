import type { Pose } from '../types';
import { escribirJSON, leerJSON } from './storage';

export interface Cadena {
  id: string;
  nombre: string;
  pasos: string[];
  ventana: number;
  mensaje: string;
  efecto: Partial<Pose>;
  recompensa: number;
}

export const CADENAS: Cadena[] = [
  {
    id: 'cadena_developer',
    nombre: 'Ascensión del Developer',
    pasos: ['cafe', 'programar', 'codigo'],
    ventana: 8000,
    mensaje: 'CADENA: Ascensión del Developer. El código cobra vida.',
    efecto: { pose: 'overload', envParticles: 'datos', bloom: 4, filter: 'hue-rotate(120deg)' },
    recompensa: 60,
  },
  {
    id: 'cadena_noir',
    nombre: 'Noir Total',
    pasos: ['lluvia', 'triste', 'memoria'],
    ventana: 8000,
    mensaje: 'CADENA: Noir Total. La ciudad recuerda.',
    efecto: { pose: 'sit', filter: 'grayscale(1)', envParticles: 'lluvia', anim: 'drift' },
    recompensa: 60,
  },
  {
    id: 'cadena_vinculo',
    nombre: 'Vínculo Perfecto',
    pasos: ['amor', 'abrazo', 'ternura'],
    ventana: 8000,
    mensaje: 'CADENA: Vínculo Perfecto. Calor que sostiene.',
    efecto: { pose: 'happy', anim: 'latido', bloom: 3, overlay: 'rgba(255,180,200,0.15)' },
    recompensa: 60,
  },
  {
    id: 'cadena_elemental',
    nombre: 'Tormenta Elemental',
    pasos: ['fuego', 'hielo', 'viento'],
    ventana: 8000,
    mensaje: 'CADENA: Tormenta Elemental. Los tres planos chocan.',
    efecto: {
      pose: 'overload',
      particles: 'rayos',
      envParticles: 'lluvia',
      distortion: 8,
      aberration: 8,
      anim: 'caos',
    },
    recompensa: 80,
  },
  {
    id: 'cadena_digital',
    nombre: 'Doppelgänger Digital',
    pasos: ['espejo', 'yo', 'holograma'],
    ventana: 8000,
    mensaje: 'CADENA: Doppelgänger Digital. Tu reflejo se proyecta.',
    efecto: { pose: 'pose', fx: 'holograma', clones: 2, aberration: 2 },
    recompensa: 70,
  },
  {
    id: 'cadena_polar',
    nombre: 'Cielo Polar',
    pasos: ['aurora', 'nieve', 'constelacion'],
    ventana: 8000,
    mensaje: 'CADENA: Cielo Polar. El horizonte se abre.',
    efecto: { pose: 'meditating', escenario: 'nieve', envParticles: 'aurora', bloom: 4 },
    recompensa: 70,
  },
  {
    id: 'cadena_singularidad',
    nombre: 'Singularidad',
    pasos: ['robot', 'android', 'humano'],
    ventana: 8000,
    mensaje: 'CADENA: Singularidad. La máquina y el cuerpo se funden.',
    efecto: { pose: 'overload', envParticles: 'datos', bloom: 4, distortion: 4 },
    recompensa: 80,
  },
  {
    id: 'cadena_estelar',
    nombre: 'Migración Estelar',
    pasos: ['ballena', 'espacio', 'estrellas'],
    ventana: 8000,
    mensaje: 'CADENA: Migración Estelar. Algo enorme nada entre estrellas.',
    efecto: {
      pose: 'meditating',
      escenario: 'espacio',
      envParticles: 'estrellas',
      scaleX: 1.6,
      scaleY: 1.6,
    },
    recompensa: 70,
  },
];

const CLAVE = 'soma_cadenas';
const VENTANA_MAX = Math.max(...CADENAS.map((cadena) => cadena.ventana));

export interface ResultadoCadena {
  cadena: Cadena;
  nueva: boolean;
}

export interface GestorCadenas {
  registrar: (comando: string, ahora?: number) => ResultadoCadena | null;
  descubiertas: () => Set<string>;
  total: () => number;
  reiniciarHistorial: () => void;
}

export function iniciarCadenas(): GestorCadenas {
  let historial: Array<{ comando: string; tiempo: number }> = [];
  const descubiertas = new Set<string>(leerJSON<string[]>(CLAVE, []));

  return {
    registrar: (comando, ahora = performance.now()) => {
      const limpio = comando.trim().toLowerCase();
      if (!limpio) return null;

      historial.push({ comando: limpio, tiempo: ahora });
      historial = historial.filter((paso) => ahora - paso.tiempo <= VENTANA_MAX);

      for (const cadena of CADENAS) {
        if (historial.length < cadena.pasos.length) continue;

        const cola = historial.slice(-cadena.pasos.length);
        const coincide = cola.every(
          (paso, indice) =>
            paso.comando === cadena.pasos[indice] && ahora - paso.tiempo <= cadena.ventana,
        );

        if (coincide) {
          const nueva = !descubiertas.has(cadena.id);
          descubiertas.add(cadena.id);
          if (nueva) escribirJSON(CLAVE, [...descubiertas]);
          historial = [];
          return { cadena, nueva };
        }
      }

      return null;
    },

    descubiertas: () => descubiertas,
    total: () => CADENAS.length,
    reiniciarHistorial: () => {
      historial = [];
    },
  };
}
