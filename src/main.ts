import { Sfx } from './audio';
import { startRenderLoop } from './render';
import { getCmds, checkCombos } from './diccionario';
import { state, physics, target, discoveredWords, discoveredCombos, saveDiscovery } from './state';
import type { MouseData } from './types';

const srcCanvas = document.getElementById('srcCanvas') as HTMLCanvasElement;
const srcCtx = srcCanvas.getContext('2d') as CanvasRenderingContext2D;
const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const input = document.getElementById('cmd') as HTMLInputElement;
const log = document.getElementById('log') as HTMLElement;
const gamepadStatus = document.getElementById('gamepad-status') as HTMLElement;

let mouseX = srcCanvas.width / 2;
let mouseY = srcCanvas.height / 2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;

const getMouseData = (): MouseData => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepads[0]) {
        gamepadStatus.innerText = "Gamepad: Conectado";
        const gp = gamepads[0] as Gamepad;
        if (Math.abs(gp.axes[0]) > 0.1) mouseX += gp.axes[0] * 10;
        if (Math.abs(gp.axes[1]) > 0.1) mouseY += gp.axes[1] * 10;
        if (gp.buttons[0].pressed && target.interactive) return { x: mouseX, y: mouseY, clicked: true };
    } else {
        gamepadStatus.innerText = "Gamepad: Desconectado";
    }
    return { x: mouseX, y: mouseY, clicked: false };
};

gameCanvas.addEventListener('mousedown', (e) => {
    if (!state.physicsEnabled) return;
    const rect = gameCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (srcCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (srcCanvas.height / rect.height);
    const cx = srcCanvas.width / 2 + state.offsetX;
    const cy = srcCanvas.height / 2 + state.offsetY;
    if (Math.abs(mx - cx) < 200 && Math.abs(my - cy) < 250) physics.isDragging = true;
});

gameCanvas.addEventListener('mousemove', (e) => {
    const rect = gameCanvas.getBoundingClientRect();
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    mouseX = (e.clientX - rect.left) * (srcCanvas.width / rect.width);
    mouseY = (e.clientY - rect.top) * (srcCanvas.height / rect.height);
    if (physics.isDragging) {
        target.offsetX = mouseX - srcCanvas.width / 2;
        target.offsetY = mouseY - srcCanvas.height / 2;
        physics.vx = mouseX - lastMouseX;
        physics.vy = mouseY - lastMouseY;
    }
});

gameCanvas.addEventListener('mouseup', () => physics.isDragging = false);
gameCanvas.addEventListener('mouseleave', () => physics.isDragging = false);
gameCanvas.addEventListener('click', () => { if (target.interactive) getMouseData().clicked = true; });

document.getElementById('btn-accept-warning')?.addEventListener('click', () => {
    Sfx.init();
    const warningModal = document.getElementById('warning-modal');
    if (warningModal) warningModal.classList.add('hidden');
    input.disabled = false;
    input.focus();
    log.innerText = "SOMA: Entorno operativo. Escribe tu comando.";
    startRenderLoop(srcCanvas, srcCtx, gameCanvas, getMouseData);
});

const cmds = getCmds(log);
const totalWords = Object.keys(cmds).length;

document.getElementById('menu-btn')?.addEventListener('click', () => {
    const discoveryCount = document.getElementById('discovery-count');
    const totalCount = document.getElementById('total-count');
    const comboCount = document.getElementById('combo-count');
    if (discoveryCount) discoveryCount.innerText = String(discoveredWords.size);
    if (totalCount) totalCount.innerText = String(totalWords);
    if (comboCount) comboCount.innerText = String(discoveredCombos.size);
    const menuModal = document.getElementById('menu-modal');
    if (menuModal) menuModal.classList.remove('hidden');
});

document.getElementById('btn-close-menu')?.addEventListener('click', () => {
    const menuModal = document.getElementById('menu-modal');
    if (menuModal) menuModal.classList.add('hidden');
    input.focus();
});

document.getElementById('btn-show-words')?.addEventListener('click', () => {
    const btnShowWords = document.getElementById('btn-show-words');
    const wordListContainer = document.getElementById('word-list-container');
    if (btnShowWords) btnShowWords.classList.add('hidden');
    const arr = Array.from(discoveredWords).sort();
    if (wordListContainer) {
        wordListContainer.classList.remove('hidden');
        wordListContainer.innerText = arr.length > 0 ? arr.join(', ') : 'Ninguna palabra guardada aún. Empieza a probar opciones.';
    }
});

document.getElementById('btn-reveal-all')?.addEventListener('click', () => {
    if (confirm("Alerta: Desbloquear el diccionario revelará todas las interacciones. ¿Proceder de todos modos?")) {
        const btnRevealAll = document.getElementById('btn-reveal-all');
        const btnShowWords = document.getElementById('btn-show-words');
        const wordListContainer = document.getElementById('word-list-container');
        if (btnRevealAll) btnRevealAll.classList.add('hidden');
        if (btnShowWords) btnShowWords.classList.add('hidden');
        if (wordListContainer) {
            wordListContainer.innerText = Object.keys(cmds).sort().join(', ');
            wordListContainer.classList.remove('hidden');
        }
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
                if (cmds[w]) saveDiscovery(w, false);
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
