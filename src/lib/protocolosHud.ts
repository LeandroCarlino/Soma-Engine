import type { EstadoProtocolos, Protocolo } from './protocolos';

const $ = (id: string): HTMLElement | null => document.getElementById(id);

function textoProgreso(protocolo: Protocolo): string {
  const progreso = Math.floor(Math.min(protocolo.progreso, protocolo.meta));
  return protocolo.tipo === 'tiempo' || protocolo.tipo === 'felicidad'
    ? `${progreso}/${protocolo.meta}s`
    : `${progreso}/${protocolo.meta}`;
}

function crearFila(protocolo: Protocolo): HTMLElement {
  const fila = document.createElement('div');
  fila.className = 'protocolo';

  const cabecera = document.createElement('div');
  cabecera.className = 'protocolo-head';

  const titulo = document.createElement('span');
  titulo.className = 'protocolo-titulo';
  titulo.textContent = protocolo.titulo;

  const progreso = document.createElement('span');
  progreso.className = 'protocolo-progreso';
  progreso.textContent = textoProgreso(protocolo);

  cabecera.append(titulo, progreso);

  const barra = document.createElement('div');
  barra.className = 'protocolo-barra';
  const relleno = document.createElement('span');
  relleno.style.width = `${Math.min(100, (protocolo.progreso / protocolo.meta) * 100)}%`;
  barra.appendChild(relleno);

  const descripcion = document.createElement('p');
  descripcion.className = 'protocolo-desc';
  descripcion.textContent = protocolo.descripcion;

  fila.append(cabecera, barra, descripcion);
  return fila;
}

export function renderProtocolos(estado: EstadoProtocolos): void {
  for (const lista of [$('protocolos-lista'), $('protocolos-lista-menu')]) {
    if (!lista) continue;
    lista.replaceChildren(...estado.activos.map(crearFila));
  }

  const puntaje = $('protocolos-puntaje');
  if (puntaje) puntaje.textContent = `${estado.puntaje} PTS`;

  const puntajeMenu = $('protocolos-puntaje-menu');
  if (puntajeMenu) puntajeMenu.textContent = String(estado.puntaje);

  const completados = $('protocolos-completados-menu');
  if (completados) completados.textContent = String(estado.completados);
}
