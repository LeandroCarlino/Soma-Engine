import { describe, expect, it } from 'vitest';
import { aplicarCarga, cargaDe, recuperarEstabilidad } from './estabilidad';

describe('estabilidad', () => {
  it('no cobra carga por un comando vacío', () => {
    expect(cargaDe({})).toBe(0);
  });

  it('suma carga por efectos intensos', () => {
    expect(cargaDe({ bloom: 2, particles: 'fuego' })).toBe(11);
    expect(cargaDe({ clones: 2, fx: 'holograma' })).toBe(12);
    expect(cargaDe({ anim: 'caos', distortion: 2 })).toBe(8);
  });

  it('resta carga con estados calmados', () => {
    expect(cargaDe({ pose: 'meditating' })).toBe(-8);
    expect(cargaDe({ anim: 'respirar' })).toBe(-8);
  });

  it('aplica la carga sin salir de 0..100', () => {
    expect(aplicarCarga(100, { bloom: 4 })).toBe(90);
    expect(aplicarCarga(3, { bloom: 4 })).toBe(0);
    expect(aplicarCarga(0, {})).toBe(0);
  });

  it('recupera un punto por tick y no pasa de 100', () => {
    expect(recuperarEstabilidad(50)).toBe(51);
    expect(recuperarEstabilidad(100)).toBe(100);
  });
});
