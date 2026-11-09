import {
  CATALOGO,
  CATEGORIAS,
  META_COMANDOS,
  type Categoria,
  type EntradaCatalogo,
} from './catalogo';
import { normalizarTexto } from './texto';

const ARTICULOS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al']);

const TODAS: EntradaCatalogo[] = [...Object.values(CATALOGO), ...META_COMANDOS];

export function normalizarConsulta(texto: string): string {
  return normalizarTexto(texto)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((palabra, indice) => indice === 0 ? !ARTICULOS.has(palabra) : true)
    .join(' ');
}

/** Singular/plural aproximados para que "fuegos" encuentre "fuego". */
export function variantes(palabra: string): string[] {
  const variantes = new Set([palabra]);
  if (palabra.endsWith('es')) variantes.add(palabra.slice(0, -2));
  if (palabra.endsWith('s')) variantes.add(palabra.slice(0, -1));
  else variantes.add(`${palabra}s`);
  if (palabra.endsWith('z')) variantes.add(`${palabra.slice(0, -1)}ces`);
  return [...variantes].filter((valor) => valor.length > 0);
}

export function distancia(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(
        actual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + costo,
      );
    }
    anterior = actual;
  }

  return anterior[b.length];
}

export interface ResumenCategoria {
  id: Categoria;
  nombre: string;
  descripcion: string;
  cantidad: number;
}

export function resumenCategorias(): ResumenCategoria[] {
  const conteo = new Map<Categoria, number>();
  for (const entrada of Object.values(CATALOGO)) {
    conteo.set(entrada.categoria, (conteo.get(entrada.categoria) ?? 0) + 1);
  }

  return (Object.keys(CATEGORIAS) as Categoria[])
    .map((id) => ({
      id,
      nombre: CATEGORIAS[id].nombre,
      descripcion: CATEGORIAS[id].descripcion,
      cantidad: conteo.get(id) ?? 0,
    }))
    .filter((categoria) => categoria.cantidad > 0);
}

export function buscarComandos(consulta: string, limite = 15): EntradaCatalogo[] {
  const q = normalizarConsulta(consulta);
  if (!q) return [];

  // Si la consulta es una categoría exacta, mostrar solo esa categoría.
  for (const [id, datos] of Object.entries(CATEGORIAS)) {
    const nombre = normalizarTexto(datos.nombre);
    if (q === normalizarTexto(id) || q === nombre) {
      if (id === 'sistema') return META_COMANDOS.slice(0, limite);
      return Object.values(CATALOGO)
        .filter((entrada) => entrada.categoria === id)
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, limite);
    }
  }

  const palabras = q.split(' ');
  const puntuados: Array<{ entrada: EntradaCatalogo; puntaje: number }> = [];

  for (const entrada of TODAS) {
    // Los comandos del sistema solo se buscan por nombre/sinónimo: si no,
    // "buscar fuego" encontraba la descripción de "buscar".
    const campos = entrada.categoria === 'sistema'
      ? [entrada.id, ...entrada.sinonimos]
      : [
          entrada.id,
          ...entrada.sinonimos,
          entrada.descripcion,
          CATEGORIAS[entrada.categoria]?.nombre ?? '',
          ...entrada.tags,
        ];

    let puntaje = 0;
    for (const campo of campos.map((valor) => normalizarTexto(valor))) {
      if (campo === q) puntaje += 100;
      else if (q.length >= 2 && campo.startsWith(q)) puntaje += 55;
      else if (q.length >= 2 && campo.includes(q)) puntaje += 25;
      else if (palabras.length > 1 && palabras.every((palabra) => campo.includes(palabra))) {
        puntaje += 12;
      }
    }

    if (puntaje > 0) puntuados.push({ entrada, puntaje });
  }

  puntuados.sort(
    (a, b) => b.puntaje - a.puntaje || a.entrada.id.localeCompare(b.entrada.id),
  );

  return puntuados.slice(0, limite).map(({ entrada }) => entrada);
}

export function sugerirComandos(texto: string, limite = 3): string[] {
  const q = normalizarConsulta(texto);
  if (!q) return [];

  const palabras = q.split(' ');
  const objetivos = [q, ...palabras];
  const candidatos = new Map<string, number>();

  for (const entrada of TODAS) {
    // No usar como sinónimo una palabra que ya es otro comando: evita
    // sugerir "reir" cuando alguien escribe "felzi".
    const nombres = [entrada.id, ...entrada.sinonimos]
      .map((nombre) => normalizarTexto(nombre))
      .filter((nombre, indice) => indice === 0 || !CATALOGO[nombre]);

    for (const nombre of nombres) {
      const umbral = nombre.length <= 4 ? 1 : nombre.length <= 8 ? 2 : 3;

      for (const objetivo of objetivos) {
        for (const variante of variantes(objetivo)) {
          const d = distancia(variante, nombre);
          if (d > umbral) continue;

          const puntaje = d - (entrada.id === q ? 10 : 0) - (variante === nombre ? 2 : 0);
          const previo = candidatos.get(entrada.id);
          if (previo === undefined || puntaje < previo) {
            candidatos.set(entrada.id, puntaje);
          }
        }
      }
    }
  }

  return [...candidatos.entries()]
    .filter(([id]) => id !== q)
    .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
    .slice(0, limite)
    .map(([id]) => id);
}

export function entradaPorId(id: string): EntradaCatalogo | undefined {
  return CATALOGO[id] ?? META_COMANDOS.find((entrada) => entrada.id === id);
}

export { META_COMANDOS };
