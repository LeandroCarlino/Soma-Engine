import { Sfx } from './audio.js';

export const discoveredWords = new Set(JSON.parse(localStorage.getItem('soma_words') || '[]'));
export const discoveredCombos = new Set(JSON.parse(localStorage.getItem('soma_combos') || '[]'));
export let nsfwInterval = null;

export const saveDiscovery = (word, isCombo = false) => {
    if (isCombo) {
        discoveredCombos.add(word);
        localStorage.setItem('soma_combos', JSON.stringify(Array.from(discoveredCombos)));
    } else {
        discoveredWords.add(word);
        localStorage.setItem('soma_words', JSON.stringify(Array.from(discoveredWords)));
    }
};

export const defaults = {
    pose: 'subject', overlay: 'none', bgColor: '#050505', particles: 'none',
    envParticles: 'none', anim: 'none', bgLayer: 'none', scaleX: 1.3, scaleY: 1.3,
    rotation: 0, offsetX: 0, offsetY: 0, alpha: 1, aberration: 0, bloom: 0,
    distortion: 0, physicsEnabled: false, clones: 0, shadowColor: 'transparent',
    interactive: false
};

export const state = { ...defaults };
export const target = { ...defaults };
export const physics = { vx: 0, vy: 0, isDragging: false };
export const activeTimers = {};

export const executeCmd = (msg, mod, logEl, dur = 5000) => {
    logEl.innerText = msg;
    logEl.style.opacity = 1;
    
    if (activeTimers['wording']) clearTimeout(activeTimers['wording']);
    activeTimers['wording'] = setTimeout(() => { logEl.innerText = "SOMA: Entorno estabilizado."; }, dur);

    for (const key in mod) {
        if (typeof mod[key] === 'number') target[key] = mod[key]; 
        else state[key] = mod[key];  

        if (activeTimers[key]) clearTimeout(activeTimers[key]);
        if (dur > 0) {
            activeTimers[key] = setTimeout(() => {
                if (typeof defaults[key] === 'number') target[key] = defaults[key]; 
                else state[key] = defaults[key];
            }, dur);
        }
    }
};

export const triggerNSFW = (logEl) => {
    const nsfwLayer = document.getElementById('nsfw-layer');
    nsfwLayer.classList.add('active');
    if(!nsfwInterval) nsfwInterval = setInterval(() => {
        const stamp = document.createElement('div');
        stamp.className = 'nsfw-stamp';
        stamp.innerText = Math.random() > 0.5 ? 'CONTENIDO CENSURADO' : 'CENSURADO';
        stamp.style.left = Math.random() * 85 + '%'; stamp.style.top = Math.random() * 85 + '%';
        stamp.style.fontSize = (Math.random() * 2.5 + 1) + 'rem';
        stamp.style.transform = `rotate(${(Math.random()-0.5)*90}deg)`;
        nsfwLayer.appendChild(stamp);
        if(nsfwLayer.children.length > 25) nsfwLayer.removeChild(nsfwLayer.firstChild);
    }, 200);
    logEl.innerText = "Acceso denegado. Bloqueo de seguridad activo.";
    Sfx.play(150, 'square', 0.5, 0.3);
    setTimeout(() => {
        nsfwLayer.classList.remove('active');
        clearInterval(nsfwInterval); nsfwInterval = null; nsfwLayer.innerHTML = '';
        logEl.innerText = "SOMA: Filtros de seguridad restaurados.";
    }, 5000);
};

export const resetState = (logEl) => {
    Object.values(activeTimers).forEach(clearTimeout); 
    for(let key in activeTimers) delete activeTimers[key];
    Object.assign(target, defaults);
    Object.assign(state, defaults);
    physics.vx = 0; physics.vy = 0;
    if(logEl) logEl.innerText = "SOMA: Entorno reiniciado a estado original.";
};