import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audio', () => ({
  Sfx: {
    play: vi.fn(),
    playChord: vi.fn(),
    noise: vi.fn(),
    wind: vi.fn(),
    fire: vi.fn(),
    rain: vi.fn(),
    heartbeat: vi.fn(),
    thunder: vi.fn(),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

import { getCmds } from './diccionario';
import { CATALOGO, CATEGORIAS, META_COMANDOS, type Categoria } from './lib/catalogo';
import { resumenCategorias } from './lib/busqueda';

const crearLog = (): HTMLDivElement => document.createElement('div');

describe('catálogo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="nsfw-layer"></div>';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('tiene una entrada por cada comando del diccionario', () => {
    const cmds = getCmds(crearLog());
    const claves = Object.keys(cmds).sort();
    const catalogo = Object.keys(CATALOGO).sort();

    expect(catalogo).toEqual(claves);
  });

  it('todas las entradas tienen descripción y categoría válida', () => {
    for (const entrada of Object.values(CATALOGO)) {
      expect(entrada.descripcion.trim().length).toBeGreaterThan(0);
      expect(CATEGORIAS[entrada.categoria]).toBeDefined();
      expect(entrada.id).toBe(entrada.id.toLowerCase());
    }
  });

  it('no hay colisiones entre comandos y meta comandos', () => {
    for (const meta of META_COMANDOS) {
      expect(CATALOGO[meta.id]).toBeUndefined();
    }
  });

  it('las categorías suman los 465 comandos', () => {
    const total = resumenCategorias().reduce((suma, categoria) => suma + categoria.cantidad, 0);
    expect(total).toBe(Object.keys(CATALOGO).length);
  });

  it('cada categoría del catálogo aparece en el resumen', () => {
    const usadas = new Set(Object.values(CATALOGO).map((entrada) => entrada.categoria));
    const resumidas = new Set(resumenCategorias().map((categoria) => categoria.id));

    expect([...usadas].sort()).toEqual([...resumidas].sort());
    expect([...usadas].every((categoria) => CATEGORIAS[categoria as Categoria])).toBe(true);
  });
});
