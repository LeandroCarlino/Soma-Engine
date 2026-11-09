import { beforeEach, describe, expect, it } from 'vitest';
import {
  AFINIDADES,
  afinidadActual,
  comandoDeAfinidad,
  datosAfinidad,
  guardarAfinidad,
  multiplicadorCarga,
  multiplicadorPuntos,
  recuperacionAfinidad,
} from './afinidades';

describe('afinidades', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('empieza sin afinidad', () => {
    expect(afinidadActual()).toBeNull();
    expect(datosAfinidad(null)).toBeNull();
    expect(multiplicadorCarga()).toBe(1);
    expect(multiplicadorPuntos()).toBe(1);
    expect(recuperacionAfinidad()).toBe(1);
  });

  it('persiste y recupera la afinidad', () => {
    guardarAfinidad('fuego');
    expect(afinidadActual()).toBe('fuego');
    expect(datosAfinidad('fuego')?.nombre).toBe('Fuego');
  });

  it('aplica los multiplicadores de cada rama', () => {
    guardarAfinidad('fuego');
    expect(multiplicadorCarga()).toBe(1.2);
    expect(multiplicadorPuntos()).toBe(1.15);

    guardarAfinidad('agua');
    expect(multiplicadorCarga()).toBe(0.85);
    expect(recuperacionAfinidad()).toBe(2);

    guardarAfinidad('mente');
    expect(multiplicadorPuntos()).toBe(1.25);
  });

  it('solo permite el comando de la afinidad elegida', () => {
    guardarAfinidad('fuego');
    expect(comandoDeAfinidad('ignicion')).toBe(true);
    expect(comandoDeAfinidad('tsunami')).toBe(false);

    guardarAfinidad('mente');
    expect(comandoDeAfinidad('sinapsis')).toBe(true);
    expect(comandoDeAfinidad('ignicion')).toBe(false);
  });

  it('cada afinidad tiene escena y comando propios', () => {
    for (const afinidad of Object.values(AFINIDADES)) {
      expect(afinidad.escenario).toBeTruthy();
      expect(afinidad.hora).toBeTruthy();
      expect(afinidad.clima).toBeTruthy();
      expect(afinidad.comando).toBeTruthy();
    }
  });
});
