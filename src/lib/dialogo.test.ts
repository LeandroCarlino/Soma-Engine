import { afterEach, describe, expect, it, vi } from 'vitest';
import { atraparFoco, elementosFocalizables, enfocarPrimero } from './dialogo';

const crearDialogo = (): HTMLElement => {
  document.body.innerHTML = `
    <div id="dialogo">
      <button id="primero" type="button">Primero</button>
      <button id="segundo" type="button">Segundo</button>
      <button id="tercero" type="button">Tercero</button>
    </div>
  `;
  return document.getElementById('dialogo') as HTMLElement;
};

describe('dialogo', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lista solo elementos focalizables', () => {
    document.body.innerHTML = `
      <div id="d">
        <button>ok</button>
        <button disabled>no</button>
        <input />
        <span>texto</span>
      </div>
    `;
    const ids = elementosFocalizables(document.getElementById('d') as HTMLElement).map(
      (el) => el.tagName,
    );
    expect(ids).toEqual(['BUTTON', 'INPUT']);
  });

  it('enfoca el primer elemento', () => {
    const dialogo = crearDialogo();
    enfocarPrimero(dialogo);
    expect(document.activeElement?.id).toBe('primero');
  });

  it('Tab en el último vuelve al primero', () => {
    const dialogo = crearDialogo();
    const soltar = atraparFoco(dialogo);

    document.getElementById('tercero')?.focus();
    dialogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement?.id).toBe('primero');
    soltar();
  });

  it('Shift+Tab en el primero va al último', () => {
    const dialogo = crearDialogo();
    const soltar = atraparFoco(dialogo);

    document.getElementById('primero')?.focus();
    dialogo.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );

    expect(document.activeElement?.id).toBe('tercero');
    soltar();
  });

  it('Escape llama al cierre', () => {
    const dialogo = crearDialogo();
    const cerrar = vi.fn();
    const soltar = atraparFoco(dialogo, cerrar);

    dialogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cerrar).toHaveBeenCalledOnce();
    soltar();
  });

  it('deja de atrapar el foco al soltar', () => {
    const dialogo = crearDialogo();
    const cerrar = vi.fn();
    const soltar = atraparFoco(dialogo, cerrar);
    soltar();

    dialogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cerrar).not.toHaveBeenCalled();
  });
});
