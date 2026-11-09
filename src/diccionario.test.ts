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
    init: vi.fn().mockResolvedValue(undefined),
  },
}));

import { checkCombos, getCmds } from './diccionario';
import { executeCmd, resetState, state, target } from './state';
import { normalizarTexto } from './lib/texto';

const crearLog = (): HTMLDivElement => document.createElement('div');

describe('diccionario', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="nsfw-layer"></div>';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    resetState();
    document.body.innerHTML = '';
  });

  it('tiene más de 400 comandos', () => {
    const cmds = getCmds(crearLog());
    expect(Object.keys(cmds).length).toBeGreaterThan(400);
  });

  it('todas las claves están normalizadas (sin acentos ni mayúsculas)', () => {
    const cmds = getCmds(crearLog());
    const malas = Object.keys(cmds).filter((clave) => normalizarTexto(clave) !== clave);
    expect(malas).toEqual([]);
  });

  it('cada comando se ejecuta sin lanzar errores', () => {
    const log = crearLog();
    const cmds = getCmds(log);
    const errores: string[] = [];

    for (const [clave, ejecutar] of Object.entries(cmds)) {
      try {
        ejecutar();
      } catch (error) {
        errores.push(`${clave}: ${String(error)}`);
      }
      // Los comandos pueden programar timers; no se ejecutan acá.
      vi.clearAllTimers();
    }

    expect(errores).toEqual([]);
  });
});

describe('checkCombos', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="nsfw-layer"></div>';
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    resetState();
    document.body.innerHTML = '';
  });

  it('detecta una sinergia sin importar el orden', () => {
    const log = crearLog();
    expect(checkCombos(['gato', 'caja'], log)).toBe('combo_schrodinger');
    expect(checkCombos(['caja', 'gato'], log)).toBe('combo_schrodinger');
  });

  it('devuelve null si no hay sinergia', () => {
    expect(checkCombos(['palabra', 'suelta'], crearLog())).toBeNull();
  });

  it('reconoce sinergias con palabras ya normalizadas', () => {
    expect(checkCombos(['cafe', 'programar'], crearLog())).toBe('combo_dev');
  });

  it('detecta las sinergias nuevas de dos palabras', () => {
    expect(checkCombos(['tierra', 'fuego'], crearLog())).toBe('combo_volcan');
    expect(checkCombos(['nieve', 'aurora'], crearLog())).toBe('combo_aurora_boreal');
    expect(checkCombos(['yo', 'espejo'], crearLog())).toBe('combo_doppelganger');
  });

  it('detecta las sinergias de tres palabras', () => {
    expect(checkCombos(['fuego', 'hielo', 'viento'], crearLog())).toBe(
      'combo_tormenta_perfecta',
    );
    expect(checkCombos(['codigo', 'memoria', 'sueno'], crearLog())).toBe(
      'combo_conciencia',
    );
  });
});

describe('executeCmd', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetState();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    resetState();
  });

  it('aplica los cambios y los revierte al terminar la duración', () => {
    const log = crearLog();
    executeCmd('prueba', { pose: 'happy', bloom: 3 }, log, 1000);

    // Los campos de texto viven en state; los numéricos en target.
    expect(state.pose).toBe('happy');
    expect(target.bloom).toBe(3);

    vi.advanceTimersByTime(1000);

    expect(state.pose).toBe('subject');
    expect(target.bloom).toBe(0);
    expect(log.innerText).toBe('SOMA: Entorno estabilizado.');
  });

  it('resetState cancela los timers pendientes', () => {
    executeCmd('prueba', { pose: 'happy' }, crearLog(), 5000);
    resetState();

    expect(state.pose).toBe('subject');

    vi.advanceTimersByTime(6000);
    expect(state.pose).toBe('subject');
  });

  it('revierte las variantes fx al terminar', () => {
    executeCmd('prueba', { fx: 'holograma' }, crearLog(), 1000);
    expect(state.fx).toBe('holograma');

    vi.advanceTimersByTime(1000);
    expect(state.fx).toBe('none');
  });
});
