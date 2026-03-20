import { Sfx } from './audio.js';
import { startRenderLoop } from './render.js';
import { getCmds, checkCombos } from './diccionario.js';
import { state, physics, target, discoveredWords, discoveredCombos, saveDiscovery } from './state.js';

const srcCanvas = document.getElementById('srcCanvas');
const srcCtx = srcCanvas.getContext('2d');
const gameCanvas = document.getElementById('gameCanvas');
const input = document.getElementById('cmd');
const log = document.getElementById('log');
const gamepadStatus = document.getElementById('gamepad-status');

let mouseX = srcCanvas.width/2; let mouseY = srcCanvas.height/2;
let lastMouseX = mouseX; let lastMouseY = mouseY;

const getMouseData = () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads[0]) {
        gamepadStatus.innerText = "Gamepad: Conectado";
        const gp = gamepads[0];
        if(Math.abs(gp.axes[0]) > 0.1) mouseX += gp.axes[0] * 10;
        if(Math.abs(gp.axes[1]) > 0.1) mouseY += gp.axes[1] * 10;
        if(gp.buttons[0].pressed && target.interactive) return { x: mouseX, y: mouseY, clicked: true };
    } else {
        gamepadStatus.innerText = "Gamepad: Desconectado";
    }
    return { x: mouseX, y: mouseY, clicked: false };
};

gameCanvas.addEventListener('mousedown', (e) => {
    if(!state.physicsEnabled) return;
    const rect = gameCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (srcCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (srcCanvas.height / rect.height);
    const cx = srcCanvas.width/2 + state.offsetX; const cy = srcCanvas.height/2 + state.offsetY;
    if (Math.abs(mx - cx) < 200 && Math.abs(my - cy) < 250) physics.isDragging = true;
});

gameCanvas.addEventListener('mousemove', (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    lastMouseX = mouseX; lastMouseY = mouseY;
    mouseX = (e.clientX - rect.left) * (srcCanvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (srcCanvas.height / rect.height);
    if (physics.isDragging) {
        target.offsetX = mouseX - srcCanvas.width/2;
        target.offsetY = mouseY - srcCanvas.height/2;
        physics.vx = mouseX - lastMouseX; physics.vy = mouseY - lastMouseY;
    }
});

gameCanvas.addEventListener('mouseup', () => physics.isDragging = false);
gameCanvas.addEventListener('mouseleave', () => physics.isDragging = false);
gameCanvas.addEventListener('click', () => { if(target.interactive) getMouseData().clicked = true; });

document.getElementById('btn-accept-warning').addEventListener('click', () => {
    Sfx.init();
    document.getElementById('warning-modal').classList.add('hidden');
    input.disabled = false; input.focus();
    log.innerText = "SOMA: Entorno operativo. Escribe tu comando.";
    startRenderLoop(srcCanvas, srcCtx, gameCanvas, getMouseData);
});

const cmds = getCmds(log);
const totalWords = Object.keys(cmds).length;

document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('discovery-count').innerText = discoveredWords.size;
    document.getElementById('total-count').innerText = totalWords;
    document.getElementById('combo-count').innerText = discoveredCombos.size;
    document.getElementById('menu-modal').classList.remove('hidden');
});

document.getElementById('btn-close-menu').addEventListener('click', () => {
    document.getElementById('menu-modal').classList.add('hidden'); input.focus();
});

document.getElementById('btn-show-words').addEventListener('click', () => {
    document.getElementById('btn-show-words').classList.add('hidden');
    const arr = Array.from(discoveredWords).sort();
    document.getElementById('word-list-container').classList.remove('hidden');
    document.getElementById('word-list-container').innerText = arr.length > 0 ? arr.join(', ') : 'Ninguna palabra guardada aún. Empieza a probar opciones.';
});

document.getElementById('btn-reveal-all').addEventListener('click', () => {
    if (confirm("Alerta: Desbloquear el diccionario revelará todas las interacciones. ¿Proceder de todos modos?")) {
        document.getElementById('btn-reveal-all').classList.add('hidden');
        document.getElementById('btn-show-words').classList.add('hidden');
        document.getElementById('word-list-container').innerText = Object.keys(cmds).sort().join(', ');
        document.getElementById('word-list-container').classList.remove('hidden');
    }
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = input.value.toLowerCase().trim();
        const words = val.split(/\s+/);
        let valid = false;
        
        const comboRes = checkCombos(words, log);
        if (comboRes) {
            saveDiscovery(comboRes, true);
            valid = true;
            words.forEach(w => {
                if(cmds[w]) saveDiscovery(w, false);
            });
        } else {
            words.forEach(w => {
                if (cmds[w]) { 
                    cmds[w](); 
                    saveDiscovery(w, false); 
                    valid = true; 
                }
            });
        }
        if (!valid && val !== '') log.innerText = "Estado no encontrado o comando no válido.";
        input.value = '';
    }
});