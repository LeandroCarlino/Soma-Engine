import { describe, expect, it, vi } from 'vitest';
import { crearCaptura, formatearFecha, nombreCaptura } from './captura';

const fecha = new Date(2026, 10, 9, 5, 4, 3);

describe('captura', () => {
  it('formatea la fecha para la postal', () => {
    expect(formatearFecha(fecha)).toBe('2026-11-09 05:04');
  });

  it('genera un nombre de archivo estable', () => {
    expect(nombreCaptura(fecha)).toBe('soma-20261109-050403.png');
  });

  it('crea un canvas del mismo tamaño sin lanzar errores', () => {
    // jsdom no implementa canvas 2D: devolvemos null para probar el fallback.
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => null);

    const origen = document.createElement('canvas');
    origen.width = 320;
    origen.height = 200;

    const salida = crearCaptura(origen, {
      escenario: 'bosque',
      pose: 'feliz',
      stats: { hunger: 80, energy: 60, happiness: 40 },
    }, fecha);

    expect(salida.width).toBe(320);
    expect(salida.height).toBe(200);
    spy.mockRestore();
  });
});
