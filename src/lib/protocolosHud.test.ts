import { afterEach, describe, expect, it } from 'vitest';
import { renderProtocolos } from './protocolosHud';
import type { EstadoProtocolos } from './protocolos';

const estado: EstadoProtocolos = {
  activos: [
    {
      id: 'a',
      tipo: 'felicidad',
      titulo: 'FELICIDAD',
      descripcion: 'Llegá a 80 de felicidad.',
      meta: 80,
      progreso: 40,
      recompensa: 100,
    },
    {
      id: 'b',
      tipo: 'tiempo',
      titulo: 'RESISTENCIA',
      descripcion: 'Acumulá 15 s con energía baja.',
      meta: 15,
      progreso: 5,
      recompensa: 90,
    },
    {
      id: 'c',
      tipo: 'escenario',
      titulo: 'EXPLORACIÓN',
      descripcion: 'Visitá 2 escenarios.',
      meta: 2,
      progreso: 1,
      vistos: ['bosque'],
      recompensa: 90,
    },
  ],
  completados: 2,
  puntaje: 340,
};

describe('protocolosHud', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renderiza las filas, el puntaje y los completados', () => {
    document.body.innerHTML = `
      <div id="protocolos-lista"></div>
      <div id="protocolos-lista-menu"></div>
      <span id="protocolos-puntaje"></span>
      <span id="protocolos-puntaje-menu"></span>
      <span id="protocolos-completados-menu"></span>
    `;

    renderProtocolos(estado);

    expect(document.querySelectorAll('#protocolos-lista .protocolo')).toHaveLength(3);
    expect(document.querySelectorAll('#protocolos-lista-menu .protocolo')).toHaveLength(3);
    expect(document.getElementById('protocolos-puntaje')?.textContent).toBe('340 PTS');
    expect(document.getElementById('protocolos-puntaje-menu')?.textContent).toBe('340');
    expect(document.getElementById('protocolos-completados-menu')?.textContent).toBe('2');

    const primera = document.querySelector('#protocolos-lista .protocolo');
    expect(primera?.querySelector('.protocolo-titulo')?.textContent).toBe('FELICIDAD');
    expect(primera?.querySelector('.protocolo-progreso')?.textContent).toBe('40/80s');
    expect(primera?.querySelector('.protocolo-barra span')?.getAttribute('style')).toContain('width: 50%');
  });
});
