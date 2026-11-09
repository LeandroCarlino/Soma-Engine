import { beforeEach, describe, expect, it } from 'vitest';
import type { Stats } from '../types';
import {
  aplicarEntrada,
  aplicarTick,
  cargarEstado,
  crearEstadoInicial,
  crearProtocolo,
  guardarEstado,
  type EntradaProtocolos,
  type EstadoProtocolos,
  type Protocolo,
  type TipoProtocolo,
} from './protocolos';

const stats = (overrides: Partial<Stats> = {}): Stats => ({
  energy: 100,
  hunger: 100,
  happiness: 100,
  ...overrides,
});

const entrada = (overrides: Partial<EntradaProtocolos> = {}): EntradaProtocolos => ({
  stats: stats(),
  palabrasNuevas: 0,
  combosNuevos: 0,
  comandos: [],
  combo: null,
  escenario: 'ninguno',
  ...overrides,
});

const protocolo = (
  tipo: TipoProtocolo,
  overrides: Partial<Protocolo> = {},
): Protocolo => ({
  id: `test-${tipo}`,
  tipo,
  titulo: tipo.toUpperCase(),
  descripcion: 'prueba',
  meta: 1,
  progreso: 0,
  recompensa: 100,
  ...overrides,
});

const estado = (activos: Protocolo[]): EstadoProtocolos => ({
  activos,
  completados: 0,
  puntaje: 0,
});

describe('protocolos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('crea tres protocolos de tipos únicos', () => {
    const inicial = crearEstadoInicial(() => 0.42);
    expect(inicial.activos).toHaveLength(3);
    expect(new Set(inicial.activos.map((p) => p.tipo)).size).toBe(3);
    expect(inicial.puntaje).toBe(0);
    expect(inicial.completados).toBe(0);
  });

  it('cada tipo tiene título, descripción y meta válida', () => {
    for (const tipo of ['felicidad', 'descubrir', 'sinergia', 'comando', 'escenario', 'tiempo'] as TipoProtocolo[]) {
      const p = crearProtocolo(tipo, () => 0.3);
      expect(p.titulo.length).toBeGreaterThan(0);
      expect(p.descripcion.length).toBeGreaterThan(0);
      expect(p.meta).toBeGreaterThan(0);
      expect(p.recompensa).toBeGreaterThan(0);
    }
  });

  it('completa felicidad manteniéndola alta', () => {
    let resultado = aplicarTick(
      estado([protocolo('felicidad', { meta: 2, umbral: 70 })]),
      stats({ happiness: 80 }),
    );
    expect(resultado.estado.activos[0].progreso).toBe(1);

    resultado = aplicarTick(resultado.estado, stats({ happiness: 50 }));
    expect(resultado.estado.activos[0].progreso).toBe(0);

    resultado = aplicarTick(resultado.estado, stats({ happiness: 80 }));
    resultado = aplicarTick(resultado.estado, stats({ happiness: 80 }));

    expect(resultado.eventos).toHaveLength(1);
    expect(resultado.estado.puntaje).toBe(100);
    expect(resultado.estado.completados).toBe(1);
  });

  it('acumula palabras nuevas y completa archivo', () => {
    let resultado = aplicarEntrada(
      estado([protocolo('descubrir', { meta: 2 })]),
      entrada({ palabrasNuevas: 1 }),
    );
    expect(resultado.estado.activos[0].progreso).toBe(1);
    expect(resultado.eventos).toHaveLength(0);

    resultado = aplicarEntrada(resultado.estado, entrada({ palabrasNuevas: 1 }));
    expect(resultado.eventos).toHaveLength(1);
    expect(resultado.estado.completados).toBe(1);
  });

  it('completa sinergia al descubrir una', () => {
    const resultado = aplicarEntrada(
      estado([protocolo('sinergia')]),
      entrada({ combosNuevos: 1 }),
    );
    expect(resultado.eventos).toHaveLength(1);
    expect(resultado.estado.puntaje).toBe(100);
  });

  it('completa comando cuando se usa el objetivo', () => {
    const resultado = aplicarEntrada(
      estado([protocolo('comando', { detalle: 'fuego' })]),
      entrada({ comandos: ['fuego'] }),
    );
    expect(resultado.eventos).toHaveLength(1);
  });

  it('suma escenarios únicos y no repite', () => {
    let resultado = aplicarEntrada(
      estado([protocolo('escenario', { meta: 2 })]),
      entrada({ escenario: 'bosque' }),
    );
    expect(resultado.estado.activos[0].progreso).toBe(1);

    resultado = aplicarEntrada(resultado.estado, entrada({ escenario: 'bosque' }));
    expect(resultado.estado.activos[0].progreso).toBe(1);

    resultado = aplicarEntrada(resultado.estado, entrada({ escenario: 'playa' }));
    expect(resultado.eventos).toHaveLength(1);
  });

  it('acumula tiempo solo con energía baja y se reinicia al subir', () => {
    let resultado = aplicarTick(
      estado([protocolo('tiempo', { meta: 2 })]),
      stats({ energy: 20 }),
    );
    expect(resultado.estado.activos[0].progreso).toBe(1);

    resultado = aplicarTick(resultado.estado, stats({ energy: 80 }));
    expect(resultado.estado.activos[0].progreso).toBe(0);

    resultado = aplicarTick(resultado.estado, stats({ energy: 20 }));
    resultado = aplicarTick(resultado.estado, stats({ energy: 20 }));
    expect(resultado.eventos).toHaveLength(1);
  });

  it('persiste y recupera el estado', () => {
    const inicial = crearEstadoInicial(() => 0.2);
    inicial.puntaje = 250;
    inicial.completados = 2;
    guardarEstado(inicial);

    const recuperado = cargarEstado(() => 0.2);
    expect(recuperado.puntaje).toBe(250);
    expect(recuperado.completados).toBe(2);
    expect(recuperado.activos.map((p) => p.id)).toEqual(inicial.activos.map((p) => p.id));
  });

  it('regenera el estado si el guardado está corrupto', () => {
    localStorage.setItem('soma_protocolos', '{no es json');
    const recuperado = cargarEstado(() => 0.1);
    expect(recuperado.activos).toHaveLength(3);
    expect(recuperado.puntaje).toBe(0);
  });
});
