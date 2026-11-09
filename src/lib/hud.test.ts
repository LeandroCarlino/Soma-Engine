import { afterEach, describe, expect, it } from 'vitest';
import {
  actualizarContexto,
  actualizarEstabilidad,
  actualizarStats,
  clasificarLinea,
  describirEfectos,
  formatearTiempo,
  iniciarTerminal,
  temaValido,
} from './hud';

describe('hud', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('formatea el tiempo de sesión', () => {
    expect(formatearTiempo(0)).toBe('00:00');
    expect(formatearTiempo(9)).toBe('00:09');
    expect(formatearTiempo(65)).toBe('01:05');
    expect(formatearTiempo(3600)).toBe('60:00');
    expect(formatearTiempo(-5)).toBe('00:00');
  });

  it('clasifica las líneas del terminal', () => {
    expect(clasificarLinea('SINERGIA: Tormenta Ígnea.')).toBe('synergy');
    expect(clasificarLinea('SOMA: Entorno estabilizado.')).toBe('soma');
    expect(clasificarLinea('Estado no encontrado o comando no válido.')).toBe('error');
    expect(clasificarLinea('Acceso denegado.')).toBe('error');
    expect(clasificarLinea('Fuego y agua.')).toBe('normal');
  });

  it('describe los efectos activos', () => {
    expect(describirEfectos('none', 'none')).toBe('—');
    expect(describirEfectos('flotar', 'fuego')).toBe('FLOTAR · FUEGO');
    expect(describirEfectos('glitch', 'none')).toBe('GLITCH');
  });

  it('valida el tema guardado', () => {
    expect(temaValido('ambar')).toBe('ambar');
    expect(temaValido('hielo')).toBe('hielo');
    expect(temaValido('inexistente')).toBe('fosforo');
    expect(temaValido(undefined)).toBe('fosforo');
  });

  it('actualiza las barras y el estado vital', () => {
    document.body.innerHTML = `
      <span id="vitals-state"></span>
      <div class="stat">
        <div id="bar-hunger"></div>
        <span id="val-hunger"></span>
        <span id="trend-hunger"></span>
      </div>
      <div class="stat">
        <div id="bar-energy"></div>
        <span id="val-energy"></span>
        <span id="trend-energy"></span>
      </div>
      <div class="stat">
        <div id="bar-happiness"></div>
        <span id="val-happiness"></span>
        <span id="trend-happiness"></span>
      </div>
    `;

    const anterior = { hunger: 50, energy: 50, happiness: 50 };
    actualizarStats({ hunger: 80, energy: 20, happiness: 49.9 }, anterior);

    expect((document.getElementById('bar-hunger') as HTMLElement).style.width).toBe('80%');
    expect(document.getElementById('val-hunger')?.textContent).toBe('80');
    expect(document.getElementById('trend-hunger')?.textContent).toBe('▲');
    expect(document.getElementById('trend-energy')?.textContent).toBe('▼');
    expect(document.getElementById('vitals-state')?.textContent).toBe('INESTABLE');
    expect(document.getElementById('vitals-state')?.dataset.estado).toBe('inestable');
  });

  it('marca inestable o sobrecarga cuando la estabilidad es baja', () => {
    document.body.innerHTML = `
      <span id="vitals-state"></span>
      <div class="stat">
        <div id="bar-stability"></div>
        <span id="val-stability"></span>
        <span id="trend-stability"></span>
      </div>
    `;

    actualizarEstabilidad(20, 100);
    expect(document.getElementById('vitals-state')?.textContent).toBe('INESTABLE');

    actualizarEstabilidad(0, 20);
    expect(document.getElementById('vitals-state')?.textContent).toBe('SOBRECARGA');
    expect(document.getElementById('vitals-state')?.dataset.estado).toBe('critico');
  });

  it('actualiza el contexto del HUD', () => {
    document.body.innerHTML = `
      <b id="ctx-pose"></b>
      <b id="ctx-escenario"></b>
      <b id="ctx-clima"></b>
      <b id="ctx-hora"></b>
      <b id="ctx-efectos"></b>
      <b id="ctx-afinidad"></b>
      <span id="hud-discovery"></span>
      <span id="hud-total"></span>
      <span id="hud-combos"></span>
      <span id="hud-cadenas"></span>
      <span id="hud-cadenas-total"></span>
    `;

    actualizarContexto({
      pose: 'happy',
      anim: 'flotar',
      particles: 'fuego',
      envParticles: 'lluvia',
      escenario: 'bosque',
      hora: 'noche',
      afinidad: 'Mente',
      palabras: 12,
      total: 465,
      combos: 2,
      cadenas: 3,
      totalCadenas: 8,
    });

    expect(document.getElementById('ctx-pose')?.textContent).toBe('HAPPY');
    expect(document.getElementById('ctx-escenario')?.textContent).toBe('BOSQUE');
    expect(document.getElementById('ctx-clima')?.textContent).toBe('LLUVIA');
    expect(document.getElementById('ctx-hora')?.textContent).toBe('NOCHE');
    expect(document.getElementById('ctx-efectos')?.textContent).toBe('FLOTAR · FUEGO');
    expect(document.getElementById('ctx-afinidad')?.textContent).toBe('Mente');
    expect(document.getElementById('hud-discovery')?.textContent).toBe('12');
    expect(document.getElementById('hud-combos')?.textContent).toBe('2');
    expect(document.getElementById('hud-cadenas')?.textContent).toBe('3');
    expect(document.getElementById('hud-cadenas-total')?.textContent).toBe('8');
  });

  it('agrega comandos y búsquedas clickeables sin duplicar anuncios', async () => {
    document.body.innerHTML = `
      <div id="terminal-lines"></div>
      <div id="log">Motor en espera...</div>
      <div id="historial"></div>
    `;

    const log = document.getElementById('log') as HTMLElement;
    const historial = document.getElementById('historial') as HTMLElement;
    const terminal = iniciarTerminal(log, historial);
    const inicial = historial.children.length;

    terminal.agregarComando('feliz', 'Alegría con rebote.');
    terminal.agregarBusqueda('Cuidado (7)', 'cuidado', 'Comer y dormir.');

    const botonComando = historial.querySelector('[data-comando="feliz"]');
    const botonBusqueda = historial.querySelector('[data-buscar="cuidado"]');
    expect(botonComando).not.toBeNull();
    expect(botonBusqueda).not.toBeNull();
    expect(historial.children.length).toBe(inicial + 2);

    terminal.anunciar('SOMA: ayuda mostrada.');
    await new Promise((resolver) => setTimeout(resolver, 0));

    // El anuncio va al live region pero no se duplica en el historial.
    expect(historial.children.length).toBe(inicial + 2);
    expect(log.textContent).toBe('SOMA: ayuda mostrada.');

    terminal.detener();
  });

  it('agrega líneas al historial y las limita', async () => {
    document.body.innerHTML = `
      <div id="terminal-lines"></div>
      <div id="log">Motor en espera...</div>
      <div id="historial"></div>
    `;

    const log = document.getElementById('log') as HTMLElement;
    const historial = document.getElementById('historial') as HTMLElement;
    const terminal = iniciarTerminal(log, historial);

    expect(historial.children.length).toBe(1);

    terminal.agregar('> feliz', 'cmd');
    expect(historial.children.length).toBe(2);
    expect(historial.lastElementChild?.className).toContain('term-line--cmd');

    // jsdom no implementa el setter de innerText; en el navegador sí y
    // dispara las mismas mutaciones. Acá usamos textContent.
    log.textContent = 'SINERGIA: prueba';
    // El MutationObserver entrega el callback como microtask.
    await new Promise((resolver) => setTimeout(resolver, 0));

    expect(historial.children.length).toBe(3);
    expect(historial.lastElementChild?.className).toContain('term-line--synergy');
    terminal.detener();
  });
});
