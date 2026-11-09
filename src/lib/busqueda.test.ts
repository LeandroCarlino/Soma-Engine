import { describe, expect, it } from 'vitest';
import {
  buscarComandos,
  distancia,
  normalizarConsulta,
  sugerirComandos,
  variantes,
} from './busqueda';

describe('normalizarConsulta', () => {
  it('quita acentos, mayúsculas y artículos', () => {
    expect(normalizarConsulta('  El FUEGO! ')).toBe('fuego');
    expect(normalizarConsulta('la canción')).toBe('cancion');
  });

  it('quita signos y deja vacío si no hay texto útil', () => {
    expect(normalizarConsulta('¿?')).toBe('');
  });
});

describe('variantes', () => {
  it('genera singular y plural aproximados', () => {
    expect(variantes('fuegos')).toContain('fuego');
    expect(variantes('fuego')).toContain('fuegos');
    expect(variantes('feliz')).toContain('felices');
  });
});

describe('distancia', () => {
  it('calcula la distancia de edición', () => {
    expect(distancia('fuego', 'fuego')).toBe(0);
    expect(distancia('fuegos', 'fuego')).toBe(1);
    expect(distancia('felzi', 'feliz')).toBe(2);
    expect(distancia('', 'abc')).toBe(3);
  });
});

describe('buscarComandos', () => {
  it('encuentra por nombre exacto', () => {
    const ids = buscarComandos('fuego').map((entrada) => entrada.id);
    expect(ids).toContain('fuego');
  });

  it('encuentra por sinónimo', () => {
    const ids = buscarComandos('comida').map((entrada) => entrada.id);
    expect(ids).toContain('comer');
  });

  it('encuentra por categoría', () => {
    const resultados = buscarComandos('cuidado', 20);
    expect(resultados.length).toBe(7);
    expect(resultados.every((entrada) => entrada.categoria === 'cuidado')).toBe(true);
  });

  it('no mezcla los comandos del sistema con las descripciones', () => {
    const ids = buscarComandos('fuego', 20).map((entrada) => entrada.id);
    expect(ids).not.toContain('buscar');
  });

  it('devuelve los comandos del sistema al buscar "sistema"', () => {
    const ids = buscarComandos('sistema').map((entrada) => entrada.id);
    expect(ids).toContain('capturar');
  });

  it('respeta el límite', () => {
    expect(buscarComandos('a', 3).length).toBeLessThanOrEqual(3);
    expect(buscarComandos('fuego', 1).length).toBeLessThanOrEqual(1);
  });

  it('devuelve vacío para una consulta vacía', () => {
    expect(buscarComandos('')).toEqual([]);
  });
});

describe('sugerirComandos', () => {
  it('sugiere por error de tipeo', () => {
    expect(sugerirComandos('felzi')[0]).toBe('feliz');
    expect(sugerirComandos('felzi')).not.toContain('reir');
  });

  it('sugiere por plural', () => {
    expect(sugerirComandos('fuegos')).toContain('fuego');
  });

  it('sugiere por sinónimo', () => {
    expect(sugerirComandos('comida')).toContain('comer');
  });

  it('sugiere palabras de un comando compuesto', () => {
    expect(sugerirComandos('fuego tornad')).toContain('tornado');
  });

  it('no sugiere nada para un texto irreconocible', () => {
    expect(sugerirComandos('zzzzzzzz')).toEqual([]);
  });

  it('respeta el límite', () => {
    expect(sugerirComandos('fueg', 2).length).toBeLessThanOrEqual(2);
  });
});
