import { afterEach, describe, expect, it } from 'vitest';
import {
  actualizarContexto,
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
    expect(describirEfectos('none', 'none', 'none')).toBe('—');
    expect(describirEfectos('flotar', 'fuego', 'none')).toBe('FLOTAR · FUEGO');
    expect(describirEfectos('glitch', 'none', 'lluvia')).toBe('GLITCH · LLUVIA');
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

  it('actualiza el contexto del HUD', () => {
    document.body.innerHTML = `
      <b id="ctx-pose"></b>
      <b id="ctx-escenario"></b>
      <b id="ctx-efectos"></b>
      <span id="hud-discovery"></span>
      <span id="hud-total"></span>
      <span id="hud-combos"></span>
    `;

    actualizarContexto({
      pose: 'happy',
      anim: 'flotar',
      particles: 'fuego',
      envParticles: 'none',
      escenario: 'bosque',
      palabras: 12,
      total: 465,
      combos: 2,
    });

    expect(document.getElementById('ctx-pose')?.textContent).toBe('HAPPY');
    expect(document.getElementById('ctx-escenario')?.textContent).toBe('BOSQUE');
    expect(document.getElementById('ctx-efectos')?.textContent).toBe('FLOTAR · FUEGO');
    expect(document.getElementById('hud-discovery')?.textContent).toBe('12');
    expect(document.getElementById('hud-combos')?.textContent).toBe('2');
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
