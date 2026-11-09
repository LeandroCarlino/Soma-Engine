export type TipoPeticion = 'comer' | 'musica' | 'caricia' | 'escenario' | 'calma' | 'jugar';

export interface Peticion {
  id: string;
  tipo: TipoPeticion;
  texto: string;
  comandos: string[];
  duracion: number;
  restante: number;
}

export interface EventoPeticion {
  tipo: 'nueva' | 'exito' | 'fallo';
  peticion: Peticion;
}

export interface GestorPeticiones {
  actual: () => Peticion | null;
  tick: () => EventoPeticion[];
  registrar: (comandos: string[]) => EventoPeticion[];
  reiniciar: () => void;
}

const PLANTILLAS: Record<TipoPeticion, { texto: string; comandos: string[] }> = {
  comer: {
    texto: 'Tengo hambre. Usá "comer" o "alimentar".',
    comandos: ['comer', 'alimentar'],
  },
  musica: {
    texto: 'Poné algo de música. Probá "musica", "cantar" o "bailar".',
    comandos: ['musica', 'cantar', 'bailar'],
  },
  caricia: {
    texto: 'Necesito afecto. Probá "caricia", "abrazo" o "ternura".',
    comandos: ['caricia', 'abrazo', 'ternura'],
  },
  escenario: {
    texto: 'Quiero cambiar de aire. Visitá "bosque", "playa" o "ciudad".',
    comandos: ['bosque', 'playa', 'ciudad', 'espacio', 'nieve'],
  },
  calma: {
    texto: 'Estoy acelerado. Probá "calma" o "orden".',
    comandos: ['calma', 'orden', 'meditar'],
  },
  jugar: {
    texto: 'Quiero jugar. Probá "jugar" o "bailar".',
    comandos: ['jugar', 'bailar'],
  },
};

const TIPOS = Object.keys(PLANTILLAS) as TipoPeticion[];

const elegir = <T,>(lista: T[], rnd: () => number): T =>
  lista[Math.min(lista.length - 1, Math.floor(rnd() * lista.length))];

export function crearPeticion(rnd: () => number = Math.random): Peticion {
  const tipo = elegir(TIPOS, rnd);
  const plantilla = PLANTILLAS[tipo];
  const duracion = 12 + Math.floor(rnd() * 4);

  return {
    id: `${tipo}-${Math.floor(rnd() * 1_000_000).toString(36)}`,
    tipo,
    texto: plantilla.texto,
    comandos: [...plantilla.comandos],
    duracion,
    restante: duracion,
  };
}

const esperaSiguiente = (rnd: () => number): number => 18 + Math.floor(rnd() * 12);

export function iniciarPeticiones(rnd: () => number = Math.random): GestorPeticiones {
  let activa: Peticion | null = null;
  let siguienteEn = esperaSiguiente(rnd);

  return {
    actual: () => activa,

    tick: () => {
      const eventos: EventoPeticion[] = [];

      if (!activa) {
        siguienteEn -= 1;
        if (siguienteEn <= 0) {
          activa = crearPeticion(rnd);
          eventos.push({ tipo: 'nueva', peticion: activa });
        }
        return eventos;
      }

      activa.restante -= 1;
      if (activa.restante <= 0) {
        eventos.push({ tipo: 'fallo', peticion: activa });
        activa = null;
        siguienteEn = esperaSiguiente(rnd);
      }

      return eventos;
    },

    registrar: (comandos) => {
      if (!activa) return [];

      const normalizados = comandos.map((comando) => comando.trim().toLowerCase());
      const cumple = normalizados.some((comando) => activa!.comandos.includes(comando));
      if (!cumple) return [];

      const peticion = activa;
      activa = null;
      siguienteEn = esperaSiguiente(rnd);
      return [{ tipo: 'exito', peticion }];
    },

    reiniciar: () => {
      activa = null;
      siguienteEn = esperaSiguiente(rnd);
    },
  };
}
