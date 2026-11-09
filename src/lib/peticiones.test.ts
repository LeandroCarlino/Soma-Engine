import { describe, expect, it } from 'vitest';
import { crearPeticion, iniciarPeticiones } from './peticiones';

const rndCero = () => 0;

describe('peticiones', () => {
  it('crea peticiones con texto, comandos y duración', () => {
    const peticion = crearPeticion(rndCero);
    expect(peticion.texto.length).toBeGreaterThan(0);
    expect(peticion.comandos.length).toBeGreaterThan(0);
    expect(peticion.duracion).toBeGreaterThanOrEqual(12);
    expect(peticion.restante).toBe(peticion.duracion);
  });

  it('aparece después de la espera inicial', () => {
    const peticiones = iniciarPeticiones(rndCero);
    let eventos = peticiones.tick();
    expect(eventos).toHaveLength(0);

    for (let i = 0; i < 30 && eventos.length === 0; i++) {
      eventos = peticiones.tick();
    }

    expect(eventos[0]?.tipo).toBe('nueva');
    expect(peticiones.actual()).not.toBeNull();
  });

  it('se cumple al usar uno de sus comandos', () => {
    const peticiones = iniciarPeticiones(rndCero);
    for (let i = 0; i < 30; i++) {
      const eventos = peticiones.tick();
      if (eventos.length > 0) break;
    }

    const peticion = peticiones.actual();
    expect(peticion).not.toBeNull();

    const eventos = peticiones.registrar([peticion!.comandos[0]]);
    expect(eventos[0]?.tipo).toBe('exito');
    expect(peticiones.actual()).toBeNull();
  });

  it('no se cumple con un comando ajeno', () => {
    const peticiones = iniciarPeticiones(rndCero);
    for (let i = 0; i < 30; i++) {
      const eventos = peticiones.tick();
      if (eventos.length > 0) break;
    }

    expect(peticiones.registrar(['zzzz'])).toHaveLength(0);
    expect(peticiones.actual()).not.toBeNull();
  });

  it('falla al agotarse el tiempo', () => {
    const peticiones = iniciarPeticiones(rndCero);
    for (let i = 0; i < 30; i++) {
      const eventos = peticiones.tick();
      if (eventos.length > 0) break;
    }

    const duracion = peticiones.actual()!.duracion;
    let fallo = null;
    for (let i = 0; i < duracion; i++) {
      const eventos = peticiones.tick();
      if (eventos.length > 0) fallo = eventos[0];
    }

    expect(fallo?.tipo).toBe('fallo');
    expect(peticiones.actual()).toBeNull();
  });
});
