# Soma Engine

Simulador interactivo de estados mentales y emocionales con aceleración WebGL.

## Características

- **+200 comandos de texto** en español
- **10 escenarios procedurales** (ciudad, bosque, playa, espacio, dojo, etc.)
- **Efectos de post-procesado** (bloom, aberración cromática, distorsión, scanlines)
- **Sistema de sinergias** - combina palabras para efectos especiales
- **Partículas ambientales** (lluvia, nieve, hojas, estrellas, datos)
- **Emotes animados** que responden al estado emocional
- **Física básica** con gravedad y rebotes
- **Audio procedural** generado con Web Audio API

## Demo

**https://soma-engine.vercel.app**

## Instalación

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de la lógica pura
npm run typecheck
```

## Comandos populares

| Comando | Efecto |
|---------|--------|
| `feliz` | Alegría con rebote |
| `amor` | Estado romántico con latido |
| `demonio` | Aura roja con partículas de fuego |
| `espacio` | Cambio a escenario espacial |
| `ciudad` | Cambio a escenario urbano |

**Sinergias:** Combina palabras como `fuego` + `tornado`, `agua` + `electrico`, o `amor` + `feliz`.

## Build para producción

```bash
npm run build
```

El output se genera en `dist/` y está listo para deploy en Vercel.

## Qué cambió en este pase

- **El click no hacía nada en modo interactivo**: `main.ts` marcaba el click
  sobre `target.interactive`, pero el render lo consumía desde
  `state.interactive`, que nunca se sincronizaba. Ahora el bucle de render
  copia ese campo.
- **`localStorage` a prueba de fallos** (`src/lib/storage.ts`): modo privado,
  cuota llena o datos corruptos ya no rompen la carga; se sigue en memoria.
- **Movimiento reducido**: si el sistema pide `prefers-reduced-motion`, se
  apagan aberración, distorsión y bloom, y el bloqueo NSFW no parpadea.
- **Accesibilidad**: aviso y menú con `role="dialog"`, `aria-modal`,
  `aria-expanded`, `aria-controls`, `aria-live` en el log, canvas con
  etiqueta y `noscript`.
- **SEO y metadatos**: título, descripción, Open Graph, `theme-color` y
  favicon propio (antes era un `data:` vacío).
- **Limpieza**: se quitaron los `console.log` informativos que quedaban en
  `audio.ts` y `render.ts`, y se dejaron de trackear `node_modules/` y
  `dist/` en git.
- **Sprites 17,3 MB → 1,18 MB**: los 17 PNG pasaron a WebP calidad 92 y se
  ajustaron a la resolución de dibujo. El spritesheet de `subject` medía
  25920×1920 (12,7 MB, 24 frames de 1080×1920) para mostrarse a 450 px de
  alto; ahora es 12960×960. También se borró la copia vieja de `Hikaru/`
  en la raíz, que no se usaba y pesaba 5 MB.
- **Tests**: Vitest con entorno jsdom para normalización de texto y el
  almacenamiento seguro.

### Segundo pase

- **9 comandos con acento eran inalcanzables** (`vórtice`, `relámpago`,
  `parís`, `espía`, `samurái`, `cuántico`, `montaña`, `pequeño`, `sueño`):
  la entrada se normaliza sin acentos, así que la clave nunca coincidía.
  Ahora las 465 claves están normalizadas y hay un test que lo verifica.
- **~50 MB de RAM menos**: el spritesheet ya no se corta en 24 canvas por
  pose. Se guarda la imagen original y cada frame se dibuja con su
  rectángulo de origen.
- **Textura WebGL**: se reserva una vez y se actualiza con `texSubImage2D`
  en lugar de reasignar 3,84 MB por frame con `texImage2D`.
- **Estadísticas**: se guardan cada 10 s (antes cada segundo) y el
  tamagotchi se pausa con la pestaña oculta, con guardado en `pagehide`.
- **Táctil**: el arrastre, el parallax y la física usan Pointer Events, así
  que funcionan con mouse, touch y lápiz. `touch-action: none` evita que
  la página scrollee al arrastrar.
- **Diálogos**: foco inicial, Tab/Shift+Tab atrapado, cierre con Escape y
  retorno del foco. El input recupera un `:focus-visible` visible.
- **Tests: 29** (antes 8). Incluyen integridad del diccionario (las 465
  claves y la ejecución de cada comando), sinergias, timers de `executeCmd`,
  foco de diálogos, HUD/terminal, texto y storage.
- **Infra**: headers CSP, `nosniff`, `Referrer-Policy` y
  `Permissions-Policy`; cache para `/Hikaru/*` y `/assets/*`; Node 26 fijado
  en `engines`.

### Tercer pase: rediseño visual

- **HUD en DOM**: las stats se dibujaban dentro del canvas, así que no eran
  accesibles ni se podían estilar. Ahora son un HUD real con barras
  segmentadas, valores, tendencia (▲/▼), estado vital (`ESTABLE`,
  `INESTABLE`, `CRÍTICO`), pose, escenario, efectos activos y contador de
  descubrimientos.
- **Terminal con historial**: antes el log era una sola línea. Ahora hay un
  historial scrolleable con timestamps, eco de los comandos escritos y color
  por tipo de línea (sinergia, error, sistema).
- **Tres paletas**: fósforo, ámbar y hielo, seleccionables desde el panel y
  persistidas en `localStorage`. Toda la interfaz usa variables CSS.
- **Identidad CRT biotech**: barra superior, marco de escenario con esquinas,
  scanlines, viñeta, panel de control con métricas, pantalla de arranque y
  toasts de sugerencia.
- **Móvil**: en vertical el lienzo llena el alto y recorta los lados para que
  el personaje no quede diminuto; el HUD de contexto se oculta y el panel se
  apila en una columna.
- **Audio no bloqueante**: si el navegador bloquea `AudioContext` o
  `resume()` nunca resuelve, antes la app quedaba en “Cargando recursos”
  para siempre. Ahora el motor arranca igual y el audio se activa cuando
  puede.

## Estructura del proyecto

```
├── src/
│   ├── main.ts           # Entrada: comandos, menú y eventos
│   ├── render.ts         # Motor de renderizado (Canvas 2D + WebGL)
│   ├── diccionario.ts    # Comandos y sinergias
│   ├── state.ts          # Estado global y persistencia
│   ├── audio.ts          # Sonidos procedurales
│   ├── types.ts          # Tipos TypeScript
│   ├── lib/              # Helpers puros (storage, texto, diálogos, HUD) + tests
│   └── test/setup.ts     # Setup de Vitest (localStorage y matchMedia)
├── public/
│   ├── favicon.svg
│   └── Hikaru/           # Sprites del personaje (WebP)
├── style.css             # Estilos
└── index.html            # Entry HTML
```

## Tech Stack

- TypeScript
- Vite
- WebGL / Canvas 2D
- Web Audio API
- CSS con clamp() para responsividad

## License

MIT
