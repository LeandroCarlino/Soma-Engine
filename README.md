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

## Estructura del proyecto

```
├── src/
│   ├── main.ts           # Entrada: comandos, menú y eventos
│   ├── render.ts         # Motor de renderizado (Canvas 2D + WebGL)
│   ├── diccionario.ts    # Comandos y sinergias
│   ├── state.ts          # Estado global y persistencia
│   ├── audio.ts          # Sonidos procedurales
│   ├── types.ts          # Tipos TypeScript
│   ├── lib/              # Helpers puros + tests
│   └── test/setup.ts     # Setup de Vitest
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
