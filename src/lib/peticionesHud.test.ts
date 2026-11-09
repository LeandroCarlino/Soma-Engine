import { afterEach, describe, expect, it } from 'vitest';
import { renderPeticion } from './peticionesHud';
import type { Peticion } from './peticiones';

const peticion: Peticion = {
  id: 'p1',
  tipo: 'comer',
  texto: 'Tengo hambre. Usá "comer".',
  comandos: ['comer'],
  duracion: 12,
  restante: 6,
};

describe('peticionesHud', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('muestra y actualiza la petición', () => {
    document.body.innerHTML = `
      <div id="peticion" class="hidden">
        <span id="peticion-tiempo"></span>
        <p id="peticion-texto"></p>
        <div><span id="peticion-progreso"></span></div>
      </div>
    `;

    renderPeticion(peticion);

    const caja = document.getElementById('peticion');
    expect(caja?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('peticion-texto')?.textContent).toContain('hambre');
    expect(document.getElementById('peticion-tiempo')?.textContent).toBe('6s');
    expect(document.getElementById('peticion-progreso')?.getAttribute('style')).toContain('width: 50%');

    renderPeticion(null);
    expect(caja?.classList.contains('hidden')).toBe(true);
  });
});
