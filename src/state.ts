import { Sfx } from './audio';
import type { Pose, Physics, Stats } from './types';

export const discoveredWords = new Set<string>(JSON.parse(localStorage.getItem('soma_words') || '[]'));
export const discoveredCombos = new Set<string>(JSON.parse(localStorage.getItem('soma_combos') || '[]'));
export let nsfwInterval: ReturnType<typeof setInterval> | null = null;

// --- UTILS ---
export const normalizeText = (text: string): string => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export const saveDiscovery = (word: string, isCombo: boolean = false): void => {
    if (isCombo) {
        discoveredCombos.add(word);
        localStorage.setItem('soma_combos', JSON.stringify(Array.from(discoveredCombos)));
    } else {
        discoveredWords.add(word);
        localStorage.setItem('soma_words', JSON.stringify(Array.from(discoveredWords)));
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
    escenario: 'ninguno'
};

// --- TAMAGOTCHI LOGIC ---
const loadStats = (): Stats => {
    const saved = localStorage.getItem('soma_stats');
    return saved ? JSON.parse(saved) : { energy: 100, hunger: 100, happiness: 100 };
};

export const state: Pose & { stats: Stats } = { ...defaults, stats: loadStats() };
export const target: Pose = { ...defaults };
export const physics: Physics = { vx: 0, vy: 0, isDragging: false };
export const activeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

// Bucle de vida (Decay)
setInterval(() => {
    // Decaimiento
    state.stats.hunger = Math.max(0, state.stats.hunger - 0.05); // Baja lento
    state.stats.energy = Math.max(0, state.stats.energy - 0.03);
    state.stats.happiness = Math.max(0, state.stats.happiness - 0.04);
    
    localStorage.setItem('soma_stats', JSON.stringify(state.stats));

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

export const updateStat = (stat: keyof Stats, amount: number) => {
    state.stats[stat] = Math.min(100, Math.max(0, state.stats[stat] + amount));
};

export const executeCmd = (msg: string, mod: Partial<Pose>, logEl: HTMLElement, dur: number = 5000): void => {
    logEl.innerText = msg;
    logEl.style.opacity = '1';

    if (activeTimers['wording']) clearTimeout(activeTimers['wording']);
    activeTimers['wording'] = setTimeout(() => {
        logEl.innerText = "SOMA: Entorno estabilizado.";
        delete activeTimers['wording'];
    }, dur);

    for (const key in mod) {
        const k = key as keyof Pose;
        if (typeof mod[k] === 'number') {
            (target as unknown as Record<string, unknown>)[k] = mod[k];
        } else {
            (state as unknown as Record<string, unknown>)[k] = mod[k];
        }

        if (activeTimers[k]) clearTimeout(activeTimers[k]);
        if (dur > 0) {
            activeTimers[k] = setTimeout(() => {
                if (typeof defaults[k] === 'number') {
                    (target as unknown as Record<string, unknown>)[k] = defaults[k];
                } else {
                    (state as unknown as Record<string, unknown>)[k] = defaults[k];
                }
                delete activeTimers[k];
            }, dur);
        }
    }
};

export const triggerNSFW = (logEl: HTMLElement): void => {
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
