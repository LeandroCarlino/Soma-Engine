# SOMA Engine — arquitectura y guía para extender

> Documento técnico. Para el estado del proyecto y los pendientes, ver
> [`ESTADO.md`](./ESTADO.md).

## Mapa de archivos

```
Soma Engine/
├── index.html                  # Estructura del HUD, terminal, modales
├── style.css                   # Temas, HUD, terminal, responsivo
├── package.json                # Scripts, Node 26, Vitest
├── vercel.json                 # Headers CSP/cache
├── scripts/
│   └── catalogo.py             # Genera src/lib/catalogo.ts desde el diccionario
├── public/
│   ├── favicon.svg
│   └── Hikaru/                 # 17 WebP del personaje
├── src/
│   ├── main.ts                 # Entrada, eventos, HUD, protocolos, peticiones,
│   │                           # cadenas, afinidad, captura, meta comandos
│   ├── state.ts                # Estado global, defaults, director de escena,
│   │                           # estabilidad, persistencia de stats
│   ├── render.ts               # Loop de render, poses, sprites, fx, partículas,
│   │                           # capas de hora, clones, post-proceso
│   ├── audio.ts                # Web Audio procedural (Sfx)
│   ├── diccionario.ts          # 514 comandos y sinergias (checkCombos)
│   ├── types.ts                # Tipos de Pose, animaciones, partículas, hora, fx
│   ├── renderer/
│   │   ├── scenarios.ts        # Fondos procedurales por escenario
│   │   ├── particles.ts        # Partículas ambientales (pool)
│   │   └── webgl.ts            # Shader de post-proceso
│   ├── lib/
│   │   ├── storage.ts          # localStorage seguro
│   │   ├── texto.ts            # normalización de comandos
│   │   ├── catalogo.ts         # GENERADO: metadata de los 514 comandos
│   │   ├── busqueda.ts         # búsqueda, sugerencias, categorías
│   │   ├── hud.ts              # stats/contexto/terminal
│   │   ├── dialogo.ts          # foco de modales
│   │   ├── protocolos.ts       # motor de objetivos
│   │   ├── protocolosHud.ts    # render del panel de protocolos
│   │   ├── peticiones.ts       # motor de peticiones
│   │   ├── peticionesHud.ts    # panel de petición
│   │   ├── cadenas.ts          # 8 cadenas de comandos
│   │   ├── estabilidad.ts      # carga/recuperación (puro)
│   │   ├── afinidades.ts       # Fuego/Agua/Mente, persistencia
│   │   └── captura.ts          # composición de la postal PNG
│   └── test/setup.ts           # localStorage + matchMedia para jsdom
└── docs/
    ├── ESTADO.md               # handoff
    └── ARQUITECTURA.md         # este archivo
```

## Flujo de una entrada

```
input Enter
  ├─ meta comandos: ?, comandos, help, buscar, capturar, panel
  ├─ checkCombos(words)                 # sinergias de pares
  ├─ cmds[val] (comando completo)       # incluye comandos de varias palabras
  ├─ cmds[palabra] para cada palabra    # comandos sueltos
  ├─ descubrimientos (saveDiscovery)
  ├─ protocolos.actualizar(...)         # progreso/puntaje
  ├─ cadenas.registrar(val)             # secuencia de 3 comandos
  └─ peticiones.registrar([val,...])    # pedido activo
```

Cada comando llama a `cmd(msg, mod)` → `executeCmd` en `state.ts`, que aplica
el **director de escena**.

## Director de escena (`src/state.ts`)

`executeCmd(msg, mod, logEl, dur)`:

1. Si `movimientoReducido`, apaga aberración/distorsión/bloom.
2. Resetea los campos de **acción** que `mod` no incluye.
3. Asigna los campos de `mod`:
   - numéricos → `target` (el render los interpola),
   - strings/booleanos → `state`,
   - `interactive` → `target` (el render lo sincroniza).
4. Setea el timer de la acción (`dur`, default 5 s) y el timer del texto.
5. Calcula la carga de estabilidad con la afinidad y, si llega a 0, dispara
   la sobrecarga.

Campos:
- **Acción** (`CAMPOS_ACCION`): se resetean en cada comando y al vencer `dur`.
- **Ambiente**: `bgColor`, `envParticles`, `bgLayer`, `escenario`, `hora` → no
  se resetean con la acción; persisten.
- **Persistentes**: `interactive`, `physicsEnabled`.
- `resetState` vuelve todo a `defaults` y estabilidad a 100.

> Si agregás un campo visual nuevo, decidí si es de acción o de ambiente y
> agregalo a `CAMPOS_ACCION` si corresponde.

## Render (`src/render.ts`)

Orden por frame:
1. `drawEscenario` (fondo procedural).
2. `aplicarHora` (gradiente de día/atardecer/noche/amanecer).
3. Partículas ambientales (`spawnParticles/updateParticles/drawParticles`) o
   casos especiales (`estrellas`, `aurora`).
4. `getCurrentFrame(pose)`:
   - si hay spritesheet, devuelve `FrameRect` con `sx/sy/sw/sh`;
   - no se cortan canvas por frame (memoria).
5. `drawSubject`: tinte, overlay enmascarado al alfa del cuerpo, variantes
   `fx` (espejo, holograma, silueta, térmica, estela), partículas del sujeto
   (fuego, humo, chispas, magia, burbujas, rayos), clones.
6. UI de canvas antigua: ya no hay stats dibujadas.
7. Copia a WebGL con `texSubImage2D` y aplica post-proceso
   (aberration/distortion/bloom/vignette/scanlines).

### Sprites y poses

- `pose` es una clave de `PoseType` y de `images`.
- `spriteConfig[pose]` define frames si es un spritesheet; `subject` usa 24.
- `detectAndSliceSpriteSheet` calcula frames sin crear canvas: guarda
  `FrameRect`.
- Para sumar una pose nueva:
  1. Agregar el WebP a `public/Hikaru/<pose>.webp` (ideal 540×960 o similar,
     fondo transparente, misma persona/encuadre).
  2. Sumar `<pose>` a `poses` en `render.ts` y a `PoseType` en `types.ts`.
  3. Si es spritesheet, agregar el frame count a `spriteConfig`; si no, 0.
  4. Crear un comando que use `pose: '<pose>'`.
  5. `npm test` (los tests de carga/diccionario lo cubren).
- El personaje tiene la cara difuminada; mantener ese tratamiento o
  reforzarlo en post-proceso si se generan imágenes nuevas.

### Fx

`types.ts` → `EfectoHikaru`; `render.ts` → rama en `drawSubject`.
Valores actuales: `espejo`, `holograma`, `silueta`, `termica`, `estela`.

### Animaciones

`types.ts` → `AnimType`; `render.ts` → `switch (state.anim)` que modifica
`mOx/mOy/mRot/mSx/mSy`. Actuales: flotar, latido, caos, terremoto, glitch,
drift, reloj, tornado, gelatina, vibración, magnético, repeler, rebote,
respirar, sacudir, balanceo, caminar, saltar, girar, orbitar, espiral,
derretir.

### Hora / clima / escenario

- `hora` (`HoraType`) se aplica en `aplicarHora`; no toca al personaje.
- `envParticles` es el clima/ambiente; `renderer/particles.ts` lo dibuja.
- `escenario` elige el fondo en `renderer/scenarios.ts`.
- Son campos de ambiente: persisten entre comandos y `normal` los resetea.

## Afinidades (`src/lib/afinidades.ts`)

- `AFINIDADES` define escena inicial, multiplicadores (`carga`, `puntos`),
  recuperación y comando exclusivo.
- `afinidadActual()` / `guardarAfinidad()` usan `soma_afinidad`.
- `main.ts` aplica la escena inicial al cargar/eligir.
- `state.ts` usa `multiplicadorCarga()` y `recuperacionAfinidad()`.
- `main.ts` usa `multiplicadorPuntos()` para cadenas y peticiones.
- Los comandos `ignicion`, `tsunami`, `sinapsis` chequean `afinidadActual()`.

## Protocolos (`src/lib/protocolos.ts`)

- Tipos: felicidad (tiempo con felicidad alta), descubrir, sinergia, comando,
  escenario, tiempo (energía baja).
- `crearEstadoInicial` elige 3 tipos únicos.
- `aplicarEntrada` procesa comandos/descubrimientos; `aplicarTick` procesa
  tiempo/felicidad.
- `cerrarCompletados` suma puntos, emite eventos y reemplaza objetivos.
- Persistencia `soma_protocolos`; validación del estado guardado.
- `iniciarProtocolos` devuelve un gestor con `estado`, `actualizar`, `tick`,
  `bonificar`, `guardar`.

## Peticiones (`src/lib/peticiones.ts`)

- Plantillas por tipo con texto y comandos objetivo.
- `iniciarPeticiones`: espera 18–29 s, pide, da 12–15 s.
- `tick` genera `nueva`/`fallo`; `registrar` genera `exito`.
- `main.ts` aplica stats, puntos y sonido; `peticionesHud` pinta el panel.

## Cadenas (`src/lib/cadenas.ts`)

- `CADENAS` con `pasos` (comandos exactos), `ventana` (8 s), `efecto`,
  `recompensa`.
- `iniciarCadenas().registrar(val, ahora)` guarda historial, descarta lo viejo
  y compara la cola.
- Persiste `soma_cadenas`; el HUD muestra descubiertas/total.

## Estabilidad (`src/lib/estabilidad.ts`)

- `cargaDe(mod)`: suma por bloom/aberration/distortion/clones/partículas/fx/
  animaciones intensas; resta por calma.
- `aplicarCarga(valor, mod, multiplicador)`; `recuperarEstabilidad`.
- `state.ts` maneja el valor, la sobrecarga y la recuperación.
- La barra del HUD usa `actualizarEstabilidad` en `hud.ts`.

## Catálogo y búsqueda

- `scripts/catalogo.py`:
  - detecta secciones `// --- ... ---`,
  - detecta claves `"clave": () => {`,
  - extrae el primer `cmd("...")` como descripción,
  - extrae tags (`pose:`, `anim:`, `particles:`, `envParticles:`,
    `escenario:`, `bgLayer:`, `filter:`, `tint:`, `fx:`, `hora:`),
  - usa el mapa `SINONIMOS` curado,
  - escribe `src/lib/catalogo.ts`.
- Después de agregar comandos: `python scripts/catalogo.py`.
- El test `catalogo.test.ts` exige una entrada por comando.
- `busqueda.ts` usa `normalizarTexto`, artículos, plurales y Levenshtein.
- El catálogo se importa con `import()` en `main.ts` (chunk lazy).

## HUD y terminal (`src/lib/hud.ts`)

- `actualizarStats` / `actualizarEstabilidad` actualizan barras y tendencias.
- `actualizarContexto` recibe pose, anim, partículas, clima, escenario, hora,
  afinidad, archivo y cadenas.
- `iniciarTerminal(logEl, historial)`:
  - agrega líneas con timestamp y color,
  - `agregarComando` / `agregarBusqueda` crean botones,
  - `anunciar` actualiza el live region sin duplicar historial.
- Los tests de HUD usan jsdom y no dependen del canvas.

## Tests

- `npm test` (Vitest + jsdom).
- 15 archivos; 94 tests. Cubren:
  - integridad del catálogo y ejecución de **todos** los comandos;
  - sinergias, protocolos, peticiones, cadenas, estabilidad, afinidades;
  - HUD/terminal, foco de diálogos, captura, texto y storage.
- Patrón de test de lógica pura: funciones exportadas, sin DOM.
- Patrón de test de HUD: montar HTML mínimo y verificar `textContent`/clases.

## Scripts y despliegue

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

- `vercel.json`:
  - CSP `default-src 'self'`, `script-src 'self'`, `style-src 'self'
    'unsafe-inline'`, `img-src 'self' data: blob:`;
  - `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`;
  - cache de `/Hikaru/*` 1 día y `/assets/*` 1 año.
- Vercel publica desde `main`. Si un push solo genera Preview, hacer un commit
  vacío en `main` o promover desde el dashboard. Ver `docs/ESTADO.md`.
- No agregar fuentes/analytics externos sin actualizar la CSP.

## Recetas

### Agregar un comando

1. En `diccionario.ts`, dentro del objeto:
   ```ts
   "mi palabra": () => {
     cmd("Mensaje para la terminal.", { pose: 'happy', anim: 'latido', bloom: 2 });
     Sfx.play(440, 'sine', 0.3, 0.1);
   },
   ```
   - Clave en minúsculas, sin acentos, sin artículos.
   - Si tiene espacios, el parser ahora prueba el comando completo primero.
2. Opcional: agregar sinónimos en `scripts/catalogo.py` (`SINONIMOS`).
3. `python scripts/catalogo.py`.
4. `npm test` (integridad + ejecución).

### Agregar una sinergia

En `checkCombos`:
```ts
if (has('palabra1', 'palabra2')) {
  cmd("SINERGIA: ...", { pose: 'overload', particles: 'fuego', bloom: 4 });
  Sfx.fire(2, 0.5);
  return 'combo_mi_id';
}
```
Agregar test en `diccionario.test.ts`.

### Agregar una cadena

En `cadenas.ts` (`CADENAS`):
```ts
{
  id: 'cadena_x',
  nombre: '...',
  pasos: ['paso1', 'paso2', 'paso3'],
  ventana: 8000,
  mensaje: 'CADENA: ...',
  efecto: { pose: 'overload', bloom: 4 },
  recompensa: 70,
}
```
Los pasos deben ser comandos existentes y escribirse uno por uno.
Agregar test en `cadenas.test.ts`.

### Agregar un protocolo

1. Sumar el tipo a `TipoProtocolo`.
2. `crearProtocolo` debe devolver título/descripción/meta/recompensa.
3. Actualizar `aplicarEntrada` o `aplicarTick` según el progreso.
4. Test en `protocolos.test.ts`.

### Agregar una animación

1. `types.ts` → `AnimType`.
2. `render.ts` → `switch (state.anim)` modificando `mOx/mOy/mRot/mSx/mSy`.
3. Un comando que la active.
4. Test manual en navegador (no hay test de canvas).

### Agregar un fx

1. `types.ts` → `EfectoHikaru`.
2. `render.ts` → rama en `drawSubject`.
3. Un comando con `{ fx: 'nuevo' }`.

### Agregar una afinidad

1. `afinidades.ts` → `TipoAfinidad` + entrada en `AFINIDADES`.
2. Botón en `index.html` (`.afinidad-btn`) y datos en `main.ts`.
3. Si tiene comando exclusivo, agregarlo al diccionario con chequeo
   `afinidadActual()`.
4. Test en `afinidades.test.ts`.

### Agregar una pose

1. Generar/proveer `<pose>.webp` con transparencia y cara difuminada.
2. `public/Hikaru/<pose>.webp`.
3. `poses` en `render.ts`, `PoseType` en `types.ts`; `spriteConfig` si es
   spritesheet.
4. Comando con `{ pose: '<pose>' }`.
5. `npm test`.

## Convenciones

- Comandos y claves en español, minúsculas, sin acentos.
- Textos de terminal en español, cortos y temáticos.
- Efectos nuevos: preferir reutilizar `Pose` y las capas existentes.
- Evitar `innerHTML` con datos dinámicos; usar `textContent`/DOM.
- Mantener el CSP: nada de scripts/estilos/fuentes externas.
- Cuidar el bundle inicial; lo pesado va en `import()` o en `public`.
- El canvas no debe recibir stats nuevas: el HUD es DOM.
- Los tests deben ser deterministas; usar `rnd` inyectable en módulos nuevos.
