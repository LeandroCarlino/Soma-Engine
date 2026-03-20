import { Sfx } from './audio.js';

export const state = {
    overlay: 'none', filter: 'none', anim: 'none',
    scale: 1.3, rotation: 0, bgColor: '#050505',
    particles: 'none', alpha: 1, clones: 0,
    offsetX: 0, offsetY: 0, shadowColor: 'transparent',
    envParticles: 'none', interactive: false, ripples: [],
    targetScaleX: 1, targetScaleY: 1, targetRotation: 0,
    aberration: 0, physicsEnabled: false, vx: 0, vy: 0,
    isDragging: false, parallaxIntensity: 0, pose: 'subject'
};

export const activeTimers = {};
export let nsfwInterval = null;
export const discoveredWords = new Set();

const defaults = { 
    overlay: 'none', filter: 'none', anim: 'none', scale: 1.3, 
    rotation: 0, bgColor: '#050505', particles: 'none', alpha: 1, 
    clones: 0, offsetX: 0, offsetY: 0, shadowColor: 'transparent', 
    envParticles: 'none', targetScaleX: 1, targetScaleY: 1, 
    targetRotation: 0, aberration: 0, physicsEnabled: false, 
    vx: 0, vy: 0, isDragging: false, parallaxIntensity: 0, pose: 'subject'
};

export const executeCmd = (msg, mod, logEl, dur = 5000) => {
    logEl.innerText = msg;
    logEl.style.opacity = 1;
    
    if (activeTimers['wording']) clearTimeout(activeTimers['wording']);
    activeTimers['wording'] = setTimeout(() => {
        logEl.innerText = "SOMA: Aguardando...";
    }, dur);

    for (const key in mod) {
        if (activeTimers[key]) clearTimeout(activeTimers[key]);
        state[key] = mod[key];
        if (dur > 0 && key !== 'vx' && key !== 'vy') {
            activeTimers[key] = setTimeout(() => {
                state[key] = defaults[key] !== undefined ? defaults[key] : state[key];
                delete activeTimers[key];
            }, dur);
        }
    }
};

export const resetState = (logEl) => {
    Object.values(activeTimers).forEach(clearTimeout); 
    for(let key in activeTimers) delete activeTimers[key];
    if (nsfwInterval) { clearInterval(nsfwInterval); nsfwInterval = null; }
    
    const nsfwLayer = document.getElementById('nsfw-layer');
    if (nsfwLayer) { nsfwLayer.classList.remove('active'); nsfwLayer.innerHTML = ''; }
    
    Object.assign(state, defaults);
    state.ripples = [];
    if(logEl) logEl.innerText = "SOMA: Purga completa.";
};

export const triggerNSFW = (logEl) => {
    const nsfwLayer = document.getElementById('nsfw-layer');
    nsfwLayer.classList.add('active');
    
    const spawnNSFW = () => {
        const stamp = document.createElement('div');
        stamp.className = 'nsfw-stamp';
        stamp.innerText = Math.random() > 0.5 ? 'NSFW CONTENT' : 'CENSORED';
        stamp.style.left = Math.random() * 85 + '%';
        stamp.style.top = Math.random() * 85 + '%';
        stamp.style.fontSize = (Math.random() * 2.5 + 1) + 'rem';
        stamp.style.transform = `rotate(${(Math.random()-0.5)*90}deg)`;
        nsfwLayer.appendChild(stamp);
        if(nsfwLayer.children.length > 25) nsfwLayer.removeChild(nsfwLayer.firstChild);
    };

    if(!nsfwInterval) nsfwInterval = setInterval(spawnNSFW, 200);
    logEl.innerText = "Acceso denegado.";
    Sfx.play(150, 'square', 0.5, 0.3);
    setTimeout(() => {
        nsfwLayer.classList.remove('active');
        clearInterval(nsfwInterval); nsfwInterval = null; nsfwLayer.innerHTML = '';
        logEl.innerText = "SOMA: Aguardando...";
    }, 5000);
};