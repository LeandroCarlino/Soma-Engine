import { Sfx } from './audio';
import { startRenderLoop, loadImages } from './render';
import { getCmds, checkCombos } from './diccionario';
import { state, physics, target, discoveredWords, discoveredCombos, saveDiscovery, normalizeText } from './state';
import type { MouseData } from './types';

const srcCanvas = document.getElementById('srcCanvas') as HTMLCanvasElement;
const srcCtx = srcCanvas.getContext('2d') as CanvasRenderingContext2D;
const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const input = document.getElementById('cmd') as HTMLInputElement;
const log = document.getElementById('log') as HTMLElement;
const tipElement = document.getElementById('tip-container') as HTMLElement;

const tutorialTips = [
    { cmd: 'feliz', tip: 'Prueba escribir "feliz" para ver una reacción alegre' },
    { cmd: 'fuego', tip: '"fuego" crea llamas alrededor del personaje' },
    { cmd: 'glitch', tip: '"glitch" rompe la simulación con errores visuales' },
    { cmd: 'fuego tornado', tip: 'Combina palabras: "fuego tornado" crea una tormenta de fuego' },
    { cmd: 'flotar', tip: '"flotar" cancela la gravedad temporalmente' },
    { cmd: 'caos', tip: '"caos" descontrola todo el sistema' },
    { cmd: 'grito', tip: '"grito" expande el personaje con una onda de choque' },
    { cmd: 'electrico', tip: '"eléctrico" carga al personaje con rayos' },
    { cmd: 'fantasma', tip: '"fantasma" vuelve al personaje transparente' },
    { cmd: 'reset', tip: 'Usa "reset" o "normal" para volver al estado inicial' },
    { cmd: 'menu', tip: 'Presiona el botón ☰ para ver tu progreso y palabras descubiertas' },
    { cmd: 'gravedad', tip: '"gravedad" activa el motor físico. ¡Arrastra al personaje!' },
    { cmd: 'amor', tip: '"amor" activa un latido de corazón' },
    { cmd: 'cyberpunk', tip: '"cyberpunk" transforma todo en estética futurista de neón' },
    { cmd: 'comer', tip: '¡SOMA tiene hambre! Usa "comer" o "alimentar" para subir su barra de HAMBRE' },
    { cmd: 'dormir', tip: 'Si la barra de ENERGIA está baja, usa "dormir" o "descansar"' },
    { cmd: 'jugar', tip: 'Sube su ANIMO usando "jugar" o dándole una "caricia"' },
    { cmd: 'galaxia', tip: '¿Has probado viajar a una "galaxia" lejana?' },
    { cmd: 'ia', tip: '"ia" muestra los procesos de pensamiento del núcleo' },
    { cmd: 'hadas', tip: 'Invocas pequeñas "hadas" para alegrar el ambiente' },
    { cmd: 'cafe', tip: 'El "cafe" da un impulso rápido de ENERGIA pero cuidado con los nervios' },
    { cmd: 'retro', tip: 'Vuelve a los años 90 con el comando "retro"' },
    { cmd: 'lluvia triste', tip: 'Sinergia: Prueba combinar "lluvia" y "triste"' },
    { cmd: 'sol luna', tip: 'Sinergia: ¿Qué pasa si el "sol" y la "luna" se encuentran?' },
    { cmd: 'cafe programar', tip: 'Sinergia: Activa el "Developer Mode" con "cafe" y "programar"' },
];

let tipIndex = 0;
let tipTimeout: ReturnType<typeof setTimeout> | null = null;
let commandCount = 0;

let mouseX = srcCanvas.width / 2;
let mouseY = srcCanvas.height / 2;
let lastMouseX = mouseX;
let lastMouseY = mouseY;

const commandHistory: string[] = [];
let historyIndex = -1;

const showTip = (tip: string): void => {
    if (tipElement) {
        tipElement.innerText = `💡 ${tip}`;
        tipElement.classList.add('visible');
        if (tipTimeout) clearTimeout(tipTimeout);
        tipTimeout = setTimeout(() => {
            tipElement.classList.remove('visible');
        }, 12000);
    }
};

const showNextTip = (): void => {
    if (tutorialTips.length > 0 && tipElement) {
        const tip = tutorialTips[tipIndex % tutorialTips.length];
        showTip(tip.tip);
        tipIndex++;
    }
};

const getMouseData = (): MouseData => {
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

document.getElementById('btn-accept-warning')?.addEventListener('click', async () => {
    const warningModal = document.getElementById('warning-modal');
    if (warningModal) warningModal.classList.add('hidden');
    
    log.innerText = "SOMA: Cargando recursos gráficos...";
    
    try {
        await loadImages();
        await Sfx.init();
        Sfx.play(440, 'sine', 0.3, 0.1, 880);
    } catch (e) {
        console.warn('SOMA: Error en inicialización:', e);
    }
    
    input.disabled = false;
    input.focus();
    log.innerText = "SOMA: Entorno operativo. Escribe tu comando.";
    startRenderLoop(srcCanvas, srcCtx, gameCanvas, getMouseData);
    
    showNextTip();
    setInterval(showNextTip, 90000);
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
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length > 0) {
            if (historyIndex === -1) historyIndex = commandHistory.length - 1;
            else historyIndex = Math.max(0, historyIndex - 1);
            input.value = commandHistory[historyIndex];
        }
        return;
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex !== -1) {
            historyIndex++;
            if (historyIndex >= commandHistory.length) {
                historyIndex = -1;
                input.value = '';
            } else {
                input.value = commandHistory[historyIndex];
            }
        }
        return;
    }
    
    if (e.key === 'Enter') {
        const rawVal = input.value.trim();
        const val = normalizeText(rawVal); // Normaliza acentos y minusculas
        
        if (rawVal !== '') {
            commandHistory.unshift(rawVal);
            if (commandHistory.length > 50) commandHistory.pop();
            historyIndex = -1;
        }
        
        const words = val.split(/\s+/);
        let valid = false;

        const comboRes = checkCombos(words, log);
        if (comboRes) {
            saveDiscovery(comboRes, true);
            valid = true;
            commandCount++;
            if (commandCount % 5 === 0) showNextTip();
            words.forEach(w => {
                if (cmds[w]) saveDiscovery(w, false);
            });
        } else {
            words.forEach(w => {
                if (cmds[w]) {
                    cmds[w]();
                    saveDiscovery(w, false);
                    valid = true;
                    commandCount++;
                    if (commandCount % 5 === 0) showNextTip();
                }
            });
        }
        if (!valid && val !== '') log.innerText = "Estado no encontrado o comando no válido.";
        input.value = '';
    }
});
