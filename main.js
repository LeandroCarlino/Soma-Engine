import { Sfx } from './audio.js';
import { startRenderLoop } from './render.js';
import { getCmds } from './diccionario.js';
import { state, discoveredWords } from './state.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('cmd');
const log = document.getElementById('log');

let mouseX = canvas.width/2;
let mouseY = canvas.height/2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;

const getMouseData = () => ({ x: mouseX, y: mouseY });

canvas.addEventListener('mousedown', (e) => {
    if(!state.physicsEnabled) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Hitbox aproximada
    const cx = canvas.width/2 + state.offsetX;
    const cy = canvas.height/2 + state.offsetY;
    if (Math.abs(mx - cx) < 200 && Math.abs(my - cy) < 250) {
        state.isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (state.isDragging) {
        state.offsetX = mouseX - canvas.width/2;
        state.offsetY = mouseY - canvas.height/2;
        state.vx = mouseX - lastMouseX;
        state.vy = mouseY - lastMouseY;
    }
});

canvas.addEventListener('mouseup', () => {
    state.isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    state.isDragging = false;
});

document.getElementById('btn-accept-warning').addEventListener('click', () => {
    Sfx.init();
    document.getElementById('warning-modal').classList.add('hidden');
    input.disabled = false; input.focus();
    log.innerText = "Sistema iniciado. Ingrese comando.";
    startRenderLoop(canvas, ctx, getMouseData);
});

const cmds = getCmds(log, canvas);
const totalWords = Object.keys(cmds).length;

document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('discovery-count').innerText = discoveredWords.size;
    document.getElementById('total-count').innerText = totalWords;
    document.getElementById('menu-modal').classList.remove('hidden');
});

document.getElementById('btn-close-menu').addEventListener('click', () => {
    document.getElementById('menu-modal').classList.add('hidden');
    input.focus();
});

document.getElementById('btn-show-words').addEventListener('click', () => {
    document.getElementById('btn-show-words').classList.add('hidden');
    const discoveredArr = Array.from(discoveredWords).sort();
    document.getElementById('word-list-container').classList.remove('hidden');
    document.getElementById('word-list-container').innerText = discoveredArr.length > 0 ? discoveredArr.join(', ') : 'Ninguna palabra descubierta aún.';
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = input.value.toLowerCase().trim();
        const words = val.split(/\s+/);
        let valid = false;
        
        canvas.style.transition = 'filter 0.5s, transform 0.5s'; 
        
        words.forEach(w => {
            if (cmds[w]) {
                cmds[w]();
                discoveredWords.add(w);
                valid = true;
            }
        });

        if (!valid && val !== '') log.innerText = "Sintaxis no reconocida.";
        input.value = '';
    }
});