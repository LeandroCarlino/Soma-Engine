import type { Peticion } from './peticiones';

const $ = (id: string): HTMLElement | null => document.getElementById(id);

export function renderPeticion(peticion: Peticion | null): void {
  const caja = $('peticion');
  if (!caja) return;

  if (!peticion) {
    caja.classList.add('hidden');
    return;
  }

  caja.classList.remove('hidden');

  const texto = $('peticion-texto');
  if (texto) texto.textContent = peticion.texto;

  const tiempo = $('peticion-tiempo');
  if (tiempo) tiempo.textContent = `${Math.max(0, Math.ceil(peticion.restante))}s`;

  const barra = $('peticion-progreso');
  if (barra) {
    const porcentaje = Math.max(0, Math.min(100, (peticion.restante / peticion.duracion) * 100));
    barra.style.width = `${porcentaje}%`;
  }
}
