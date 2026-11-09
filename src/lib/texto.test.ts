import { describe, expect, it } from 'vitest';
import { normalizarTexto, palabrasDe } from './texto';

describe('normalizarTexto', () => {
  it('pasa a minúsculas y quita acentos', () => {
    expect(normalizarTexto('  ELÉCTRICO ')).toBe('electrico');
    expect(normalizarTexto('Canción')).toBe('cancion');
    expect(normalizarTexto('ÑANDÚ')).toBe('nandu');
  });
});

describe('palabrasDe', () => {
  it('separa por espacios y normaliza', () => {
    expect(palabrasDe('Fuego   Tornado')).toEqual(['fuego', 'tornado']);
  });

  it('devuelve un arreglo vacío si no hay texto', () => {
    expect(palabrasDe('   ')).toEqual([]);
  });

  it('sirve para comparar comandos con acentos', () => {
    expect(palabrasDe('Café Programar')).toEqual(['cafe', 'programar']);
  });
});
