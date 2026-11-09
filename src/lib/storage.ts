/** Acceso a localStorage a prueba de cuota, modo privado o datos corruptos. */

export function leerJSON<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return porDefecto;
    return JSON.parse(crudo) as T;
  } catch {
    return porDefecto;
  }
}

export function escribirJSON(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: seguimos en memoria */
  }
}
