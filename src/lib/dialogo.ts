/**
 * Foco para diálogos modales sin dependencias.
 * Atrapa Tab/Shift+Tab dentro del contenedor y permite cerrar con Escape.
 */

const SELECTOR_FOCALIZABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function elementosFocalizables(contenedor: HTMLElement): HTMLElement[] {
  return Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_FOCALIZABLE))
    .filter((elemento) => !elemento.hasAttribute('hidden') && elemento.getAttribute('aria-hidden') !== 'true');
}

export function enfocarPrimero(contenedor: HTMLElement): void {
  const [primero] = elementosFocalizables(contenedor);
  (primero ?? contenedor).focus();
}

/**
 * Devuelve la función para dejar de atrapar el foco.
 * `alCerrar` se ejecuta con Escape.
 */
export function atraparFoco(contenedor: HTMLElement, alCerrar?: () => void): () => void {
  const alTeclear = (evento: KeyboardEvent): void => {
    if (evento.key === 'Escape') {
      evento.preventDefault();
      alCerrar?.();
      return;
    }

    if (evento.key !== 'Tab') return;

    const items = elementosFocalizables(contenedor);
    if (items.length === 0) return;

    const primero = items[0];
    const ultimo = items[items.length - 1];
    const activo = document.activeElement as HTMLElement | null;
    const fuera = !activo || !contenedor.contains(activo);

    if (evento.shiftKey && (activo === primero || fuera)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && (activo === ultimo || fuera)) {
      evento.preventDefault();
      primero.focus();
    }
  };

  contenedor.addEventListener('keydown', alTeclear);
  return () => contenedor.removeEventListener('keydown', alTeclear);
}
