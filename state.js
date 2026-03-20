import { Sfx } from './audio.js';

export const state = {
    overlay: 'none', filter: 'none', anim: 'none',
    scale: 1.3, rotation: 0, bgColor: '#050505',
    particles: 'none', alpha: 1, clones: 0,
    offsetX: 0, offsetY: 0, shadowColor: 'transparent',
    envParticles: 'none', interactive: false, ripples: [], transform: 'none',
    scaleY: 1, scaleX: 1
};

export const activeTimers = {};
export let nsfwInterval = null;

const defaults = { 
    overlay: 'none', filter: 'none', anim: 'none', scale: 1.3, 
    rotation: 0, bgColor: '#050505', particles: 'none', alpha: 1, 
    clones: 0, offsetX: 0, offsetY: 0, shadowColor: 'transparent', 
    envParticles: 'none', transform: 'none', scaleX: 1, scaleY: 1
};

export const executeCmd = (msg, mod, logEl, dur = 5000) => {
    logEl.innerText = msg;
    for (const key in mod) {
        if (activeTimers[key]) clearTimeout(activeTimers[key]);
        state[key] = mod[key];
        if (dur > 0) {
            activeTimers[key] = setTimeout(() => {
                state[key] = defaults[key] !== undefined ? defaults[key] : state[key];
                delete activeTimers[key];
            }, dur);
        }
    }
};

export const resetState = () => {
    Object.values(activeTimers).forEach(clearTimeout); 
    for(let key in activeTimers) delete activeTimers[key];
    if (nsfwInterval) { clearInterval(nsfwInterval); nsfwInterval = null; }
    
    const nsfwLayer = document.getElementById('nsfw-layer');
    if (nsfwLayer) { nsfwLayer.classList.remove('active'); nsfwLayer.innerHTML = ''; }
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.style.transform = 'none';
    
    Object.assign(state, defaults);
    state.ripples = [];
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
    }, 5000);
};