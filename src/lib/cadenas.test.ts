import { beforeEach, describe, expect, it } from 'vitest';
import { CADENAS, iniciarCadenas } from './cadenas';

describe('cadenas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('detecta una cadena en orden y dentro de la ventana', () => {
    const cadenas = iniciarCadenas();
    expect(cadenas.registrar('cafe', 0)).toBeNull();
    expect(cadenas.registrar('programar', 1000)).toBeNull();

    const resultado = cadenas.registrar('codigo', 2000);
    expect(resultado?.cadena.id).toBe('cadena_developer');
    expect(resultado?.nueva).toBe(true);
    expect(cadenas.descubiertas().has('cadena_developer')).toBe(true);
  });

  it('no dispara si se pasa de la ventana', () => {
    const cadenas = iniciarCadenas();
    cadenas.registrar('cafe', 0);
    cadenas.registrar('programar', 9000);

    expect(cadenas.registrar('codigo', 10000)).toBeNull();
  });

  it('no dispara en desorden', () => {
    const cadenas = iniciarCadenas();
    cadenas.registrar('programar', 0);
    cadenas.registrar('cafe', 1000);

    expect(cadenas.registrar('codigo', 2000)).toBeNull();
  });

  it('guarda las cadenas descubiertas', () => {
    const cadenas = iniciarCadenas();
    cadenas.registrar('aurora', 0);
    cadenas.registrar('nieve', 1000);
    cadenas.registrar('constelacion', 2000);

    const otras = iniciarCadenas();
    expect(otras.descubiertas().has('cadena_polar')).toBe(true);
  });

  it('solo cuenta como nueva la primera vez', () => {
    const cadenas = iniciarCadenas();
    cadenas.registrar('robot', 0);
    cadenas.registrar('android', 1000);
    const primera = cadenas.registrar('humano', 2000);

    cadenas.registrar('robot', 3000);
    cadenas.registrar('android', 4000);
    const segunda = cadenas.registrar('humano', 5000);

    expect(primera?.nueva).toBe(true);
    expect(segunda?.nueva).toBe(false);
  });

  it('expone el total de cadenas', () => {
    expect(iniciarCadenas().total()).toBe(CADENAS.length);
  });
});
