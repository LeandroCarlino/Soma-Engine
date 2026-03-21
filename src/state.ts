import { Sfx } from './audio';
import type { Pose, Physics } from './types';

export const discoveredWords = new Set<string>(JSON.parse(localStorage.getItem('soma_words') || '[]'));
export const discoveredCombos = new Set<string>(JSON.parse(localStorage.getItem('soma_combos') || '[]'));
export let nsfwInterval: ReturnType<typeof setInterval> | null = null;

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

export const state: Pose = { ...defaults };
export const target: Pose = { ...defaults };
export const physics: Physics = { vx: 0, vy: 0, isDragging: false };
export const activeTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const executeCmd = (msg: string, mod: Partial<Pose>, logEl: HTMLElement, dur: number = 5000): void => {
    logEl.innerText = msg;
    logEl.style.opacity = '1';

    if (activeTimers['wording']) clearTimeout(activeTimers['wording']);
    activeTimers['wording'] = setTimeout(() => {
        logEl.innerText = "SOMA: Entorno estabilizado.";
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
