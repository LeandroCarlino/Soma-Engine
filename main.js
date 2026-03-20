import { Sfx } from './audio.js';
import { baseImg, startRenderLoop } from './render.js';
import { getCmds } from './diccionario.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('cmd');
const log = document.getElementById('log');

let mouseX = canvas.width/2;
let mouseY = canvas.height/2;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
});

const getMouseData = () => ({ x: mouseX, y: mouseY });

document.getElementById('btn-accept-warning').addEventListener('click', () => {
    Sfx.init();
    document.getElementById('warning-modal').classList.add('hidden');
    input.disabled = false; input.focus();
    log.innerText = "Sistema iniciado. Ingrese comando.";
    startRenderLoop(canvas, ctx, getMouseData);
});

document.getElementById('menu-btn').addEventListener('click', () => document.getElementById('menu-modal').classList.remove('hidden'));
document.getElementById('btn-close-menu').addEventListener('click', () => {
    document.getElementById('menu-modal').classList.add('hidden');
    input.focus();
});

const cmds = getCmds(log, canvas);

document.getElementById('btn-show-words').addEventListener('click', () => {
    document.getElementById('btn-show-words').classList.add('hidden');
    const sortedWords = Object.keys(cmds).sort().join(', ');
    document.getElementById('word-list-container').classList.remove('hidden');
    document.getElementById('word-list-container').innerText = sortedWords;
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const v = input.value.toLowerCase().trim();
        canvas.style.transition = 'filter 0.5s, transform 0.5s'; 
        if (cmds[v]) cmds[v](); else log.innerText = "Sintaxis no reconocida.";
        input.value = '';
    }
});