/** Normalización y separación de comandos. */

/** Minúsculas, sin acentos y sin espacios en los bordes. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Parte un comando en palabras normalizadas, descartando vacíos. */
export function palabrasDe(texto: string): string[] {
  return normalizarTexto(texto).split(/\s+/).filter(Boolean);
}
