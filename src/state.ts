import { Sfx } from './audio';
import type { Pose, Physics, Stats } from './types';
import { escribirJSON, leerJSON } from './lib/storage';
import { normalizarTexto } from './lib/texto';

export const discoveredWords = new Set<string>(leerJSON<string[]>('soma_words', []));
export const discoveredCombos = new Set<string>(leerJSON<string[]>('soma_combos', []));
export let nsfwInterval: ReturnType<typeof setInterval> | null = null;

// --- UTILS ---
/** Compatibilidad: la implementación vive en lib/texto. */
export const normalizeText = normalizarTexto;

/** Si el usuario pidió menos movimiento, se apagan los efectos intensos. */
export const movimientoReducido =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const saveDiscovery = (word: string, isCombo: boolean = false): void => {
    if (isCombo) {
        discoveredCombos.add(word);
        escribirJSON('soma_combos', Array.from(discoveredCombos));
    } else {
        discoveredWords.add(word);
        escribirJSON('soma_words', Array.from(discoveredWords));
    }
};

export const defaults: Pose = {
    pose: 'subject',
    overlay: 'none',
    bgColor: '#050505',
    particles: 'none',
    envParticles: 'none',
    anim: 'none',
    bgLayer: 'none',
    scaleX: 1.3,
    scaleY: 1.3,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    alpha: 1,
    aberration: 0,
    bloom: 0,
    distortion: 0,
    physicsEnabled: false,
    clones: 0,
    shadowColor: 'transparent',
    interactive: false,
    filter: '',
    tint: 'none',
    escenario: 'ninguno',
    fx: 'none'
};

// --- TAMAGOTCHI LOGIC ---
const loadStats = (): Stats =>
    leerJSON<Stats>('soma_stats', { energy: 100, hunger: 100, happiness: 100 });

export const state: Pose & { stats: Stats } = { ...defaults, stats: loadStats() };
export const target: Pose = { ...defaults };
export const physics: Physics = { vx: 0, vy: 0, isDragging: false };
export const activeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

// Bucle de vida (Decay)
let ticksSinGuardar = 0;

const guardarStats = (): void => {
    escribirJSON('soma_stats', state.stats);
};

setInterval(() => {
    // Con la pestaña oculta no se simula: antes el personaje se desnutría
    // mientras el usuario estaba en otra pestaña.
    if (typeof document !== 'undefined' && document.hidden) return;

    // Decaimiento
    state.stats.hunger = Math.max(0, state.stats.hunger - 0.05); // Baja lento
    state.stats.energy = Math.max(0, state.stats.energy - 0.03);
    state.stats.happiness = Math.max(0, state.stats.happiness - 0.04);

    // Persistir cada 10 s en vez de cada segundo (I/O síncrono).
    ticksSinGuardar++;
    if (ticksSinGuardar >= 10) {
        ticksSinGuardar = 0;
        guardarStats();
    }

    // Estados automáticos si no hay comando activo (Prioridad inversa)
    if (Object.keys(activeTimers).length === 0) {
        if (state.stats.energy < 10) {
            target.pose = 'lying'; // Desmayada
            target.filter = 'grayscale(0.8)';
        } else if (state.stats.hunger < 20) {
            target.pose = 'squat'; // Dolor de panza
            target.anim = 'vibracion';
        } else if (state.stats.happiness < 20) {
            target.pose = 'cry'; // Deprimida
            target.envParticles = 'lluvia';
        } else if (state.stats.energy < 30) {
            target.pose = 'sit'; // Cansada
        } else {
            // Estado normal si todo está bien y no hay animaciones
            if (target.pose === 'lying' || target.pose === 'cry' || target.pose === 'squat') {
                target.pose = 'subject';
                target.filter = '';
                target.anim = 'none';
                target.envParticles = 'none';
            }
        }
    }
}, 1000);

// Al salir o al ocultar la pestaña se guarda el estado sin esperar el tick.
if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', guardarStats);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) guardarStats();
    });
}

export const updateStat = (stat: keyof Stats, amount: number) => {
    state.stats[stat] = Math.min(100, Math.max(0, state.stats[stat] + amount));
};

// --- Director de escena ---
// Cada comando reemplaza la capa de acción anterior. El ambiente (escenario,
// clima, fondo) y los modos persistentes sobreviven hasta que otro comando
// los cambie o se reinicie la simulación. Esto evita que el fuego de un
// comando siga pegado cuando después pedís un holograma.
const CAMPOS_ACCION: Array<keyof Pose> = [
    'pose', 'overlay', 'particles', 'anim', 'scaleX', 'scaleY', 'rotation',
    'offsetX', 'offsetY', 'alpha', 'aberration', 'bloom', 'distortion',
    'clones', 'shadowColor', 'filter', 'tint', 'fx',
];

const asignarCampo = (campo: keyof Pose, valor: unknown): void => {
    if (campo === 'interactive') {
        (target as unknown as Record<string, unknown>)[campo] = valor;
    } else if (typeof valor === 'number') {
        (target as unknown as Record<string, unknown>)[campo] = valor;
    } else {
        (state as unknown as Record<string, unknown>)[campo] = valor;
    }
};

const resetCampoAccion = (campo: keyof Pose): void => {
    asignarCampo(campo, defaults[campo]);
};

export const executeCmd = (msg: string, mod: Partial<Pose>, logEl: HTMLElement, dur: number = 5000): void => {
    if (movimientoReducido) {
        mod = { ...mod, aberration: 0, distortion: 0, bloom: 0 };
    }

    logEl.innerText = msg;
    logEl.style.opacity = '1';

    // 1. La nueva acción pisa los campos de acción que no especifica.
    for (const campo of CAMPOS_ACCION) {
        if (!(campo in mod)) resetCampoAccion(campo);
    }

    // 2. Aplicar los campos del comando.
    for (const [clave, valor] of Object.entries(mod)) {
        asignarCampo(clave as keyof Pose, valor);
    }

    if (activeTimers['wording']) clearTimeout(activeTimers['wording']);
    activeTimers['wording'] = setTimeout(() => {
        logEl.innerText = "SOMA: Entorno estabilizado.";
        delete activeTimers['wording'];
    }, dur);

    if (activeTimers['accion']) clearTimeout(activeTimers['accion']);
    if (dur > 0) {
        activeTimers['accion'] = setTimeout(() => {
            for (const campo of CAMPOS_ACCION) resetCampoAccion(campo);
            delete activeTimers['accion'];
        }, dur);
    }
};

export const triggerNSFW = (logEl: HTMLElement): void => {
    if (movimientoReducido) {
        logEl.innerText = 'Acceso denegado. Bloqueo de seguridad activo.';
        return;
    }

    const nsfwLayer = document.getElementById('nsfw-layer');
    if (!nsfwLayer) return;
    nsfwLayer.classList.add('active');
    if (!nsfwInterval) {
        nsfwInterval = setInterval(() => {
            const stamp = document.createElement('div');
            stamp.className = 'nsfw-stamp';
            stamp.innerText = Math.random() > 0.5 ? 'CONTENIDO CENSURADO' : 'CENSURADO';
            stamp.style.left = Math.random() * 85 + '%';
            stamp.style.top = Math.random() * 85 + '%';
            stamp.style.fontSize = (Math.random() * 2.5 + 1) + 'rem';
            stamp.style.transform = `rotate(${(Math.random() - 0.5) * 90}deg)`;
            nsfwLayer.appendChild(stamp);
            if (nsfwLayer.children.length > 25 && nsfwLayer.firstChild) nsfwLayer.removeChild(nsfwLayer.firstChild);
        }, 200);
    }
    logEl.innerText = "Acceso denegado. Bloqueo de seguridad activo.";
    Sfx.play(150, 'square', 0.5, 0.3);
    setTimeout(() => {
        nsfwLayer.classList.remove('active');
        if (nsfwInterval) clearInterval(nsfwInterval);
        nsfwInterval = null;
        nsfwLayer.innerHTML = '';
        logEl.innerText = "SOMA: Filtros de seguridad restaurados.";
    }, 5000);
};

export const resetState = (logEl?: HTMLElement): void => {
    Object.values(activeTimers).forEach(clearTimeout);
    for (const key in activeTimers) delete activeTimers[key];
    Object.assign(target, defaults);
    Object.assign(state, defaults);
    physics.vx = 0;
    physics.vy = 0;
    if (logEl) logEl.innerText = "SOMA: Entorno reiniciado a estado original.";
};
