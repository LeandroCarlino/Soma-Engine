import { Sfx } from './audio';
import { startRenderLoop, loadImages } from './render';
import { getCmds, checkCombos } from './diccionario';
import { state, physics, target, discoveredWords, discoveredCombos, saveDiscovery, estabilidad, recuperarEstabilidadSistema, executeCmd, updateStat } from './state';
import { palabrasDe } from './lib/texto';
import { atraparFoco, enfocarPrimero } from './lib/dialogo';
import { leerJSON, escribirJSON } from './lib/storage';
import {
    actualizarContexto,
    actualizarEstabilidad,
    actualizarStats,
    aplicarTema,
    formatearTiempo,
    iniciarTerminal,
    temaValido,
    type Tema,
} from './lib/hud';
import { crearCaptura, nombreCaptura } from './lib/captura';
import { iniciarProtocolos } from './lib/protocolos';
import { renderProtocolos } from './lib/protocolosHud';
import { iniciarCadenas } from './lib/cadenas';
import { iniciarPeticiones, type EventoPeticion } from './lib/peticiones';
import { renderPeticion } from './lib/peticionesHud';
import {
    AFINIDADES,
    afinidadActual,
    datosAfinidad,
    guardarAfinidad,
    multiplicadorPuntos,
    type TipoAfinidad,
} from './lib/afinidades';
import type { MouseData } from './types';

const srcCanvas = document.getElementById('srcCanvas') as HTMLCanvasElement;
const srcCtx = srcCanvas.getContext('2d') as CanvasRenderingContext2D;
const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const input = document.getElementById('cmd') as HTMLInputElement;
const log = document.getElementById('log') as HTMLElement;
const tipElement = document.getElementById('tip-container') as HTMLElement;

const historial = document.getElementById('terminal-history');
const terminalEl = document.getElementById('terminal');
const terminal = historial ? iniciarTerminal(log, historial) : null;
let inicioSesion = performance.now();

// El catálogo pesa ~80 kB y solo hace falta para ayuda, búsqueda o cuando
// hay que sugerir un comando. Se carga una vez, la primera vez que se usa.
type ModuloBusqueda = typeof import('./lib/busqueda');
let busquedaPromesa: Promise<ModuloBusqueda> | null = null;
const cargarBusqueda = (): Promise<ModuloBusqueda> => {
    busquedaPromesa ??= import('./lib/busqueda');
    return busquedaPromesa;
};

// Los resultados de ayuda/búsqueda se pueden clickear: un comando se carga
// en el input y una categoría dispara otra búsqueda.
historial?.addEventListener('click', (evento) => {
    const objetivo = evento.target as HTMLElement;
    const comando = objetivo.closest<HTMLElement>('[data-comando]');
    if (comando) {
        input.value = comando.dataset.comando ?? '';
        input.focus();
        return;
    }

    const busqueda = objetivo.closest<HTMLElement>('[data-buscar]');
    if (busqueda) {
        void mostrarResultados(busqueda.dataset.buscar ?? '');
    }
});

// --- Audio: silencio persistente ---
const botonSonido = document.getElementById('btn-sonido');
let mudo = leerJSON<boolean>('soma_mudo', false);

const pintarSonido = (): void => {
    if (!botonSonido) return;
    botonSonido.setAttribute('aria-pressed', String(mudo));
    botonSonido.setAttribute('aria-label', mudo ? 'Activar audio' : 'Silenciar audio');
    botonSonido.classList.toggle('is-muted', mudo);

    const icono = botonSonido.querySelector('.sonido-icon');
    if (icono) icono.textContent = mudo ? '✕' : '♪';

    const texto = botonSonido.querySelector('.sonido-texto');
    if (texto) texto.textContent = mudo ? 'MUDO' : 'SONIDO';
};

Sfx.setMuted(mudo);
pintarSonido();

const alternarSonido = (): void => {
    mudo = !mudo;
    Sfx.setMuted(mudo);
    escribirJSON('soma_mudo', mudo);
    pintarSonido();
    terminal?.anunciar(mudo ? 'SOMA: audio silenciado.' : 'SOMA: audio activado.');
};

botonSonido?.addEventListener('click', alternarSonido);

window.addEventListener('keydown', (evento) => {
    if (evento.key.toLowerCase() !== 'm' || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    const activo = document.activeElement;
    if (activo instanceof HTMLInputElement || activo instanceof HTMLTextAreaElement) return;
    if (document.querySelector('.overlay:not(.hidden)')) return;
    evento.preventDefault();
    alternarSonido();
});

// --- Tema de interfaz ---
const temaInicial = temaValido(leerJSON<string>('soma_tema', 'fosforo'));
aplicarTema(temaInicial);

const marcarTema = (tema: Tema): void => {
    document.querySelectorAll<HTMLButtonElement>('.theme-swatch').forEach((boton) => {
        boton.setAttribute('aria-pressed', String(boton.dataset.tema === tema));
    });
};

marcarTema(temaInicial);

document.querySelectorAll<HTMLButtonElement>('.theme-swatch').forEach((boton) => {
    boton.addEventListener('click', () => {
        const tema = temaValido(boton.dataset.tema);
        aplicarTema(tema);
        escribirJSON('soma_tema', tema);
        marcarTema(tema);
    });
});

// --- Afinidad elemental ---
const afinidadInicial = afinidadActual();

const marcarAfinidad = (id: TipoAfinidad | null): void => {
    document.querySelectorAll<HTMLButtonElement>('.afinidad-btn').forEach((boton) => {
        boton.setAttribute('aria-pressed', String(boton.dataset.afinidad === id));
    });
};

if (afinidadInicial) {
    const datos = AFINIDADES[afinidadInicial];
    state.escenario = datos.escenario;
    state.hora = datos.hora;
    state.envParticles = datos.clima;
    state.bgColor = datos.bgColor;
}

marcarAfinidad(afinidadInicial);

document.querySelectorAll<HTMLButtonElement>('.afinidad-btn').forEach((boton) => {
    boton.addEventListener('click', () => {
        const id = boton.dataset.afinidad as TipoAfinidad;
        const datos = AFINIDADES[id];

        guardarAfinidad(id);
        state.escenario = datos.escenario;
        state.hora = datos.hora;
        state.envParticles = datos.clima;
        state.bgColor = datos.bgColor;

        marcarAfinidad(id);
        refrescarHUD();
        terminal?.agregar(`AFINIDAD: ${datos.nombre}. ${datos.descripcion}`, 'synergy');
        terminal?.anunciar(`Afinidad ${datos.nombre} activada.`);
        Sfx.playChord([392, 523, 659], 'sine', 2, 0.08);
    });
});

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

// El click dura un frame: el bucle de render lo consume y lo apaga.
let clickPendiente = false;

const getMouseData = (): MouseData => {
    const datos = { x: mouseX, y: mouseY, clicked: clickPendiente };
    clickPendiente = false;
    return datos;
};

// Pointer Events cubre mouse, touch y lápiz con el mismo código. Con mouse
// tapaba solo el parallax; en celular el arrastre y la física no funcionaban.
gameCanvas.addEventListener('pointerdown', (e) => {
    if (!state.physicsEnabled) return;
    const rect = gameCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (srcCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (srcCanvas.height / rect.height);
    const cx = srcCanvas.width / 2 + state.offsetX;
    const cy = srcCanvas.height / 2 + state.offsetY;
    if (Math.abs(mx - cx) < 200 && Math.abs(my - cy) < 250) {
        physics.isDragging = true;
        try {
            gameCanvas.setPointerCapture(e.pointerId);
        } catch {
            /* algunos navegadores viejos no soportan captura */
        }
    }
});

gameCanvas.addEventListener('pointermove', (e) => {
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

const soltarPuntero = (e: PointerEvent): void => {
    physics.isDragging = false;
    if (gameCanvas.hasPointerCapture?.(e.pointerId)) {
        gameCanvas.releasePointerCapture(e.pointerId);
    }
};

gameCanvas.addEventListener('pointerup', soltarPuntero);
gameCanvas.addEventListener('pointercancel', soltarPuntero);
gameCanvas.addEventListener('pointerleave', () => {
    if (!physics.isDragging) physics.isDragging = false;
});
gameCanvas.addEventListener('click', () => {
    if (target.interactive) clickPendiente = true;
});

// --- Diálogo de aviso ---
const warningModal = document.getElementById('warning-modal');
const botonAceptar = document.getElementById('btn-accept-warning');
let soltarTrampaAviso: (() => void) | null = null;

if (warningModal) {
    soltarTrampaAviso = atraparFoco(warningModal);
    enfocarPrimero(warningModal);
}

botonAceptar?.addEventListener('click', async () => {
    soltarTrampaAviso?.();
    soltarTrampaAviso = null;
    if (warningModal) warningModal.classList.add('hidden');
    
    log.innerText = "SOMA: Cargando recursos gráficos...";

    // El contexto se crea dentro del gesto del usuario, pero no se espera:
    // si el navegador bloquea el audio (o resume() nunca resuelve) la
    // simulación tiene que arrancar igual.
    void Sfx.init()
        .then(() => Sfx.play(440, 'sine', 0.3, 0.1, 880))
        .catch((e) => console.warn('SOMA: Audio no disponible:', e));

    try {
        await loadImages();
    } catch (e) {
        console.warn('SOMA: Error cargando recursos:', e);
    }
    
    input.disabled = false;
    input.focus();
    inicioSesion = performance.now();
    const estadoTerminal = document.getElementById('terminal-state');
    if (estadoTerminal) estadoTerminal.textContent = 'OPERATIVO';
    log.innerText = "SOMA: Entorno operativo. Escribe tu comando.";
    startRenderLoop(srcCanvas, srcCtx, gameCanvas, getMouseData);
    
    showNextTip();
    setInterval(showNextTip, 90000);
    iniciarSistemaPeticiones();
});

const cmds = getCmds(log);
const totalWords = Object.keys(cmds).length;

// --- Reloj de sesión ---
const relojes = [
    document.getElementById('session-clock'),
    document.getElementById('session-clock-2'),
];

setInterval(() => {
    const texto = formatearTiempo((performance.now() - inicioSesion) / 1000);
    relojes.forEach((reloj) => {
        if (reloj) reloj.textContent = texto;
    });
}, 1000);

// --- HUD: stats y contexto ---
const statsPrevias = { ...state.stats };
let estabilidadPrevia = estabilidad.valor;
const cadenas = iniciarCadenas();

const refrescarHUD = (): void => {
    actualizarStats(state.stats, statsPrevias);
    statsPrevias.hunger = state.stats.hunger;
    statsPrevias.energy = state.stats.energy;
    statsPrevias.happiness = state.stats.happiness;

    actualizarEstabilidad(estabilidad.valor, estabilidadPrevia);
    estabilidadPrevia = estabilidad.valor;

    actualizarContexto({
        pose: state.pose,
        anim: state.anim,
        particles: state.particles,
        envParticles: state.envParticles,
        escenario: state.escenario,
        hora: state.hora,
        afinidad: datosAfinidad(afinidadActual())?.nombre ?? '—',
        palabras: discoveredWords.size,
        total: totalWords,
        combos: discoveredCombos.size,
        cadenas: cadenas.descubiertas().size,
        totalCadenas: cadenas.total(),
    });
};

refrescarHUD();
setInterval(refrescarHUD, 250);
setInterval(recuperarEstabilidadSistema, 1000);

// --- Protocolos ---
const protocolos = iniciarProtocolos();

const refrescarProtocolos = (eventos: string[] = []): void => {
    renderProtocolos(protocolos.estado());

    if (eventos.length > 0 && terminal) {
        for (const evento of eventos) terminal.agregar(evento, 'synergy');
        terminal.anunciar(eventos.join(' '));
    }
};

refrescarProtocolos();
setInterval(() => refrescarProtocolos(protocolos.tick(state.stats)), 1000);

// --- Peticiones de SOMA ---
let peticiones: ReturnType<typeof iniciarPeticiones> | null = null;

function manejarPeticion(evento: EventoPeticion): void {
    if (evento.tipo === 'nueva') {
        renderPeticion(evento.peticion);
        terminal?.agregar(`SOMA: ${evento.peticion.texto}`, 'warn');
        terminal?.anunciar(`SOMA pide: ${evento.peticion.texto}`);
        return;
    }

    if (evento.tipo === 'exito') {
        const puntos = Math.round(25 * multiplicadorPuntos());
        updateStat('happiness', 12);
        protocolos.bonificar(puntos);
        refrescarProtocolos();
        terminal?.agregar(`PETICIÓN CUMPLIDA: ${evento.peticion.texto} (+${puntos} PTS)`, 'synergy');
        terminal?.anunciar('SOMA: petición cumplida.');
        Sfx.playChord([523, 659, 784], 'sine', 2, 0.08);
    } else {
        updateStat('happiness', -10);
        terminal?.agregar('PETICIÓN FALLIDA: SOMA se quedó esperando.', 'error');
        terminal?.anunciar('SOMA: petición fallida.');
        Sfx.play(140, 'sawtooth', 0.6, 0.06);
    }

    renderPeticion(peticiones?.actual() ?? null);
}

function iniciarSistemaPeticiones(): void {
    if (peticiones) return;
    peticiones = iniciarPeticiones();

    setInterval(() => {
        if (!peticiones) return;
        const eventos = peticiones.tick();
        for (const evento of eventos) manejarPeticion(evento);
        renderPeticion(peticiones.actual());
    }, 1000);
}

async function mostrarResultados(consulta: string): Promise<void> {
    if (!terminal) return;

    terminalEl?.classList.add('expandido');
    const { buscarComandos } = await cargarBusqueda();
    const resultados = buscarComandos(consulta, 20);
    if (resultados.length === 0) {
        terminal.agregar(`Sin resultados para "${consulta}". Probá con otra palabra.`, 'error');
        terminal.anunciar(`SOMA: sin resultados para ${consulta}.`);
        return;
    }

    terminal.agregar(`Resultados para "${consulta}" (${resultados.length}):`, 'soma');
    for (const entrada of resultados) {
        terminal.agregarComando(entrada.id, entrada.descripcion);
    }
    terminal.anunciar(`SOMA: ${resultados.length} resultados para ${consulta}.`);
}

async function mostrarAyuda(consulta: string): Promise<void> {
    if (!terminal) return;

    terminalEl?.classList.add('expandido');

    if (consulta) {
        await mostrarResultados(consulta);
        return;
    }

    const { resumenCategorias, META_COMANDOS } = await cargarBusqueda();

    terminal.agregar('SOMA: comandos por categoría. Click en una o usá "buscar <texto>".', 'soma');
    for (const categoria of resumenCategorias()) {
        terminal.agregarBusqueda(
            `${categoria.nombre} (${categoria.cantidad})`,
            categoria.id,
            categoria.descripcion,
        );
    }

    terminal.agregar('Sistema:', 'soma');
    for (const meta of META_COMANDOS) {
        terminal.agregarComando(meta.id, meta.descripcion);
    }

    terminal.anunciar('SOMA: ayuda mostrada en la terminal.');

    const primeraCategoria = historial?.querySelector<HTMLElement>('[data-buscar]');
    if (historial && primeraCategoria) {
        historial.scrollTop = Math.max(0, primeraCategoria.offsetTop - historial.offsetTop - 6);
    }
}

function capturarEscena(): void {
    const captura = crearCaptura(srcCanvas, {
        escenario: state.escenario ?? 'ninguno',
        pose: state.pose,
        stats: state.stats,
    });

    const enlace = document.createElement('a');
    enlace.href = captura.toDataURL('image/png');
    enlace.download = nombreCaptura();
    enlace.click();

    terminal?.agregar(`SOMA: captura guardada como ${enlace.download}.`, 'soma');
    terminal?.anunciar('SOMA: captura guardada.');
}

document.getElementById('btn-captura')?.addEventListener('click', capturarEscena);

const menuBtn = document.getElementById('menu-btn');
const menuModal = document.getElementById('menu-modal');

let soltarTrampaMenu: (() => void) | null = null;

const abrirMenu = (abierto: boolean): void => {
    menuModal?.classList.toggle('hidden', !abierto);
    menuBtn?.setAttribute('aria-expanded', String(abierto));

    if (abierto && menuModal) {
        soltarTrampaMenu?.();
        soltarTrampaMenu = atraparFoco(menuModal, cerrarMenu);
        enfocarPrimero(menuModal);
    } else {
        soltarTrampaMenu?.();
        soltarTrampaMenu = null;
    }
};

function cerrarMenu(): void {
    abrirMenu(false);
    input.focus();
}

menuBtn?.addEventListener('click', () => {
    const discoveryCount = document.getElementById('discovery-count');
    const totalCount = document.getElementById('total-count');
    const comboCount = document.getElementById('combo-count');
    if (discoveryCount) discoveryCount.innerText = String(discoveredWords.size);
    if (totalCount) totalCount.innerText = String(totalWords);
    if (comboCount) comboCount.innerText = String(discoveredCombos.size);
    refrescarProtocolos();
    abrirMenu(true);
});

document.getElementById('btn-close-menu')?.addEventListener('click', cerrarMenu);
document.getElementById('btn-close-menu-2')?.addEventListener('click', cerrarMenu);

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
    if (e.key === 'Escape') {
        if (terminalEl?.classList.contains('expandido')) {
            terminalEl.classList.remove('expandido');
            e.preventDefault();
            return;
        }
    }
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
        const words = palabrasDe(rawVal);
        const val = words.join(' ');
        const antesPalabras = discoveredWords.size;
        const antesCombos = discoveredCombos.size;
        
        if (rawVal !== '') {
            terminal?.agregar(`> ${rawVal}`, 'cmd');
            commandHistory.unshift(rawVal);
            if (commandHistory.length > 50) commandHistory.pop();
            historyIndex = -1;
        }

        const meta = words[0];
        const consulta = words.slice(1).join(' ');

        if (meta === 'comandos' || meta === 'help' || meta === '?') {
            void mostrarAyuda(consulta);
            input.value = '';
            return;
        }
        if (meta === 'buscar') {
            if (consulta) void mostrarResultados(consulta);
            else terminal?.agregar('Uso: buscar <texto>. Ejemplo: buscar fuego.', 'soma');
            input.value = '';
            return;
        }
        if (meta === 'capturar') {
            capturarEscena();
            input.value = '';
            return;
        }
        if (meta === 'panel') {
            abrirMenu(true);
            input.value = '';
            return;
        }

        // Un comando real vuelve a compactar la terminal.
        terminalEl?.classList.remove('expandido');

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
        } else if (cmds[val]) {
            // Comandos de varias palabras («primer plano», «san valentin»).
            cmds[val]();
            saveDiscovery(val, false);
            valid = true;
            commandCount++;
            if (commandCount % 5 === 0) showNextTip();
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
        if (!valid && val !== '') {
            const textoFallido = rawVal;
            void cargarBusqueda()
                .then(({ sugerirComandos }) => {
                    const sugerencias = sugerirComandos(textoFallido);
                    if (sugerencias.length > 0) {
                        const lista = sugerencias.map((id) => `"${id}"`).join(', ');
                        log.innerText = `SOMA: no reconozco "${textoFallido}". ¿Quisiste decir ${lista}?`;
                    } else {
                        log.innerText = `SOMA: no reconozco "${textoFallido}". Escribí "comandos" o "buscar <texto>".`;
                    }
                })
                .catch(() => {
                    log.innerText = `SOMA: no reconozco "${textoFallido}". Escribí "comandos" para ver la lista.`;
                });
        }

        const eventosProtocolo = protocolos.actualizar({
            stats: state.stats,
            palabrasNuevas: Math.max(0, discoveredWords.size - antesPalabras),
            combosNuevos: Math.max(0, discoveredCombos.size - antesCombos),
            comandos: val ? [val, ...words] : words,
            combo: comboRes,
            escenario: state.escenario,
        });
        refrescarProtocolos(eventosProtocolo);

        const resultadoCadena = cadenas.registrar(val);
        if (resultadoCadena) {
            const { cadena, nueva } = resultadoCadena;
            const puntos = Math.round(cadena.recompensa * multiplicadorPuntos());
            executeCmd(
                `${cadena.mensaje} (+${puntos} PTS)`,
                cadena.efecto,
                log,
                6000,
            );
            protocolos.bonificar(puntos);
            refrescarProtocolos();
            refrescarHUD();

            if (nueva) {
                terminal?.anunciar(`Cadena descubierta: ${cadena.nombre}`);
                Sfx.playChord([392, 523, 659, 784], 'sine', 3, 0.1);
            }
        }

        if (peticiones) {
            const eventosPeticion = peticiones.registrar([val, ...words]);
            for (const evento of eventosPeticion) manejarPeticion(evento);
            renderPeticion(peticiones.actual());
        }

        input.value = '';
    }
});
