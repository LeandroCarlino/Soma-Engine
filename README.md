# Soma Engine

Simulador interactivo de estados mentales y emocionales con aceleración WebGL.

## Características

- **510 comandos de texto** en español
- **27 sinergias** (incluye combinaciones de tres palabras)
- **10 escenarios procedurales** (ciudad, bosque, playa, espacio, dojo, etc.)
- **Efectos de post-procesado** (bloom, aberración cromática, distorsión, scanlines)
- **23 animaciones** (caminar, saltar, girar, orbitar, espiral, derretir, etc.)
- **Variantes de Hikaru**: holograma, silueta, térmica, espejo y estela
- **Partículas ambientales** (lluvia, nieve, hojas, estrellas, datos, aurora)
- **Fuego, humo y rayos** con sprites aditivos y brillo
- **Protocolos** con objetivos, puntaje y progreso persistente
- **Peticiones de SOMA** con temporizador y recompensa
- **Cadenas** de comandos con efectos propios
- **Estabilidad y sobrecarga**: los efectos intensos tienen costo
- **Director de escena** que evita que los efectos se pisen
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
  Ahora todas las claves están normalizadas y hay un test que lo verifica.
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
- **Tests: 29** (antes 8) en ese pase. Incluían integridad del diccionario,
  ejecución de comandos, sinergias, timers de `executeCmd`, foco, HUD/terminal,
  texto y storage.
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

### Cuarto pase: exploración (Fase 1)

- **Catálogo de los 510 comandos**, generado desde `diccionario.ts` con
  `scripts/catalogo.py`: categoría, descripción, sinónimos y tags. No
  reescribe los efectos; un test exige una entrada por cada comando.
- **Ayuda y búsqueda**: `?`, `comandos` o `help` listan las 13 categorías con
  su cantidad; `buscar <texto>` filtra por nombre, sinónimo, descripción o
  categoría. Categorías y resultados son clickeables: cargan el comando en el
  input. La terminal se expande mientras leés y se compacta al ejecutar.
- **Sugerencias difusas**: si un comando no existe, se compara con los
  nombres y sinónimos usando distancia de edición, singular/plural y
  artículos. Muestra hasta 3: `felzi` → “¿Quisiste decir `feliz`?”.
- **Silencio persistente**: botón en la barra superior y tecla `M`. Controla
  el gain maestro y se guarda en `localStorage`.
- **Captura PNG**: comando `capturar` y botón en el panel. Compone el canvas
  2D con marco, scanlines, escenario, pose, stats y fecha, y descarga el PNG.
- **Carga diferida**: el catálogo pesa ~82 kB y solo se descarga al pedir
  ayuda, buscar o ante un typo. El bundle inicial queda en ~111 kB
  (34,7 kB gzip).
- **Tests: 55** (catálogo completo, búsqueda, sugerencias, captura, HUD,
  terminal, diccionario, foco, storage).

### Quinto pase: contenido y efectos

- **510 comandos**: 45 nuevos (ternura, ansiedad, calma, duelo, cuervo,
  ballena, kraken, unicornio, chocolate, vino, aurora, eclipse, codigo,
  android, memoria, orden, realidad, ficcion, alma, espiritu, abrazo,
  susurro, dimension, origen, destino, suerte, llanto, yo, humano, estela,
  zoom, termica, primer plano, multiplicidad, marea, glaciar, meteorito,
  constelacion, laberinto, umbral, caminar, girar, orbitar, espiral y
  derretir).
- **27 sinergias**: 14 nuevas, incluidas `fuego + hielo + viento` y
  `codigo + memoria + sueno`.
- **6 animaciones nuevas**: caminar, saltar, girar, orbitar, espiral y
  derretir. `saltar` usa una pose en el aire.
- **Variantes de Hikaru**: holograma, silueta, térmica, espejo, estela,
  zoom, primer plano y multiplicidad.
- **Fuego realista**: sprites radiales aditivos, base ancha de llamas,
  brillo y brasas; humo con sprite suave; rayos con ramificaciones y glow;
  chispas, magia y burbujas animadas.
- **Aurora**: nueva partícula ambiental de bandas ondulantes.
- **Overlay corregido**: el tinte de los comandos ahora se aplica solo a la
  silueta del cuerpo, no a un rectángulo.
- **Scanlines** más suaves para no tapar los efectos.
- **Tests: 58**.

### Sexto pase: director de escena y protocolos (Fase 2)

- **Director de escena**: cada comando reemplaza la capa de acción anterior
  en vez de dejar efectos colgados. El ambiente (escenario, clima, fondo) y
  los modos persistentes (interactivo, física) sobreviven hasta que otro
  comando los cambie o se reinicie. `holograma` después de `tierra fuego` ya
  no arrastra el fuego.
- **Comandos de varias palabras**: `primer plano`, `san valentin` y
  `anio nuevo` ahora se ejecutan completos; antes el parser los partía y
  nunca coincidían.
- **Protocolos**: 3 objetivos activos generados entre 6 tipos (felicidad
  sostenida, descubrir palabras, descubrir sinergias, usar un comando,
  visitar escenarios, resistir con energía baja). Progreso en el HUD,
  puntaje, completados y persistencia en `localStorage`.
- **Panel de protocolos**: bloque en el HUD abajo a la izquierda y sección
  completa en el panel de control, con barras de progreso y descripciones.
- **Tests: 69** (10 de protocolos, render del HUD, director de escena y
  comandos de varias palabras).
- **Bundle**: ~132 kB iniciales (40,7 kB gzip); el catálogo de 91 kB sigue
  cargándose solo al pedir ayuda, buscar o ante un typo.

### Séptimo pase: peticiones, cadenas y estabilidad

- **Peticiones de SOMA**: cada 18–29 s pide algo (comer, música, afecto,
  cambiar de escenario, calma o jugar) y da 12–15 s para responder. El panel
  muestra el texto y la cuenta regresiva. Cumplir da +12 de ánimo y +25
  puntos; fallar resta 10.
- **Cadenas**: 8 secuencias de 3 comandos dentro de una ventana de 8 s
  (developer, noir, vínculo, elemental, digital, polar, singularidad y
  estelar). Cada una tiene su efecto, sonido, recompensa y contador
  persistente en el HUD.
- **Estabilidad**: cada efecto intenso (bloom, distorsión, clones, partículas,
  `fx`) consume estabilidad; los comandos calmados la recuperan. Al llegar a
  0 se dispara una **sobrecarga** con glitch y el sistema vuelve a 35. La
  barra vive en el bloque de vitales y el estado pasa a `INESTABLE` o
  `SOBRECARGA`.
- **Tests: 88** (peticiones, cadenas, estabilidad, protocolos, HUD, director
  y diccionario).
- **Bundle**: ~139 kB iniciales (42,8 kB gzip); el catálogo de 91 kB sigue
  cargándose bajo demanda.

## Estructura del proyecto

```
├── scripts/
│   └── catalogo.py       # Genera src/lib/catalogo.ts desde el diccionario
├── src/
│   ├── main.ts           # Entrada: comandos, menú y eventos
│   ├── render.ts         # Motor de renderizado (Canvas 2D + WebGL)
│   ├── diccionario.ts    # Comandos y sinergias
│   ├── state.ts          # Estado global y persistencia
│   ├── audio.ts          # Sonidos procedurales
│   ├── types.ts          # Tipos TypeScript
│   ├── lib/              # catálogo, búsqueda, captura, HUD, protocolos, peticiones, cadenas, estabilidad
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
