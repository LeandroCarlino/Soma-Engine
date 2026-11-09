/**
 * Node 26 define un `localStorage` global experimental que queda vacío si no
 * se pasa `--localstorage-file`, y tapa el de jsdom. Para que los tests sean
 * deterministas instalamos un almacenamiento en memoria cuando falta.
 */
class AlmacenamientoEnMemoria implements Storage {
  private datos = new Map<string, string>();

  get length(): number {
    return this.datos.size;
  }

  clear(): void {
    this.datos.clear();
  }

  getItem(clave: string): string | null {
    return this.datos.has(clave) ? (this.datos.get(clave) as string) : null;
  }

  key(indice: number): string | null {
    return Array.from(this.datos.keys())[indice] ?? null;
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(String(clave), String(valor));
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new AlmacenamientoEnMemoria(),
    configurable: true,
    writable: true,
  });
}
