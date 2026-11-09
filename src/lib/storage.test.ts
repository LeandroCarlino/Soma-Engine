import { describe, expect, it, beforeEach } from 'vitest';
import { leerJSON, escribirJSON } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devuelve el valor por defecto si no hay nada', () => {
    expect(leerJSON('nada', 42)).toBe(42);
    expect(leerJSON('nada', ['a'])).toEqual(['a']);
  });

  it('guarda y recupera valores', () => {
    escribirJSON('soma', { palabras: ['fuego'], total: 3 });
    expect(leerJSON('soma', null)).toEqual({ palabras: ['fuego'], total: 3 });
  });

  it('no rompe con datos corruptos', () => {
    localStorage.setItem('roto', '{esto no es json');
    expect(leerJSON('roto', 'seguro')).toBe('seguro');
  });

  it('no rompe si el almacenamiento falla', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('cuota llena');
    };

    expect(() => escribirJSON('x', 1)).not.toThrow();

    Storage.prototype.setItem = original;
  });
});
