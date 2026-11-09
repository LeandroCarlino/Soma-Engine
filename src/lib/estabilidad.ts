import type { Pose } from '../types';

export const ESTABILIDAD_INICIAL = 100;
export const ESTABILIDAD_TRAS_SOBRECARGA = 35;

const numero = (valor: unknown): number => (typeof valor === 'number' ? valor : 0);

/**
 * Carga que un comando le mete al sistema. Los efectos intensos suman; las
 * acciones calmadas restan. Devuelve un entero para que el HUD no muestre
 * decimales raros.
 */
export function cargaDe(mod: Partial<Pose>): number {
  let carga = 0;

  carga += numero(mod.bloom) * 2.5;
  carga += numero(mod.aberration) * 1.5;
  carga += numero(mod.distortion) * 1.5;
  carga += numero(mod.clones) * 4;

  if (mod.particles && mod.particles !== 'none') carga += 6;
  if (mod.fx && mod.fx !== 'none') carga += 4;
  if (mod.anim === 'caos' || mod.anim === 'terremoto' || mod.anim === 'glitch') carga += 5;
  if (mod.pose === 'overload') carga += 5;

  if (mod.pose === 'meditating' || mod.anim === 'respirar') carga -= 8;

  return Math.round(carga);
}

export function aplicarCarga(valor: number, mod: Partial<Pose>): number {
  return Math.max(0, Math.min(100, valor - cargaDe(mod)));
}

export function recuperarEstabilidad(valor: number): number {
  return Math.min(100, valor + 1);
}
