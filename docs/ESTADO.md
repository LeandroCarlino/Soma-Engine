# SOMA Engine — estado y handoff

> **Si volvés a este proyecto después de un tiempo, leé este archivo primero.**
> Resume qué hay hecho, cómo correrlo, cómo está organizado, qué falta y cómo
> extenderlo sin depender del historial de la conversación.

## Datos rápidos

- **Repositorio:** https://github.com/LeandroCarlino/Soma-Engine
- **Demo:** https://soma-engine.vercel.app
- **Ruta local (máquina del autor):** `D:\Programacion\Juegos\Soma Engine`
- **Stack:** TypeScript + Vite + Canvas 2D + WebGL + Web Audio API.
- **Ramas:** `main` y `refactor-v2` están alineadas y son las que se publican.
  `refactor` quedó vieja. Vercel publica desde `main`.
- **Tests:** 94 en 15 archivos (`npm test`).
- **Bundle:** ~142 kB iniciales (43,9 kB gzip). El catálogo de ~92 kB se
  descarga bajo demanda al pedir ayuda, buscar o ante un typo.
- **Assets:** 17 poses WebP en `public/Hikaru` (~1,18 MB). `subject` es un
  spritesheet de 24 frames; el resto son imágenes fijas.
- **Pendiente inmediato:** integrar las **poses nuevas** de Hikaru cuando el
  autor las genere. Todavía no están en el repo.

## Cómo correr

```bash
npm install
npm run dev       # Vite, normalmente http://localhost:5173
npm test          # 94 tests
npm run typecheck
npm run build
npm run preview
```

Requisitos: Node 26.x (fijado en `package.json` → `engines`), npm.

## Qué está hecho (por pases)

1. **Base**: juego de comandos, Canvas/WebGL, audio procedural, 10 escenarios,
   partículas, sprites, física, stats.
2. **Calidad**: sprites 17,3 MB → 1,18 MB en WebP, sin canvas por frame,
   `texSubImage2D`, Pointer Events, foco en diálogos, `localStorage` seguro,
   comandos con acento corregidos, tests, headers CSP/cache, Node 26,
   `node_modules`/`dist` fuera de git.
3. **Rediseño visual**: HUD en DOM, terminal con historial, temas fósforo/
   ámbar/hielo, pantalla de arranque, marco CRT, móvil.
4. **Exploración**: catálogo de comandos, ayuda/búsqueda, sugerencias difusas,
   mute persistente, captura PNG, carga diferida del catálogo.
5. **Contenido y efectos**: 45 comandos nuevos, 14 sinergias, 6 animaciones,
   variantes de Hikaru (holograma, silueta, térmica, espejo, estela, zoom,
   primer plano, multiplicidad), fuego/humo/rayos/chispas/magia/burbujas
   mejorados, aurora, overlay enmascarado y scanlines suaves.
6. **Fase 2 — director de escena**: las acciones se reemplazan entre sí; el
   ambiente persiste; comandos de varias palabras arreglados.
7. **Fase 2 — protocolos**: 3 objetivos activos entre 6 tipos, puntaje,
   completados y persistencia; panel en HUD y en el menú.
8. **Fase 2 — peticiones, cadenas y estabilidad**:
   - peticiones de SOMA con temporizador;
   - 8 cadenas de comandos de 3 pasos;
   - estabilidad con sobrecarga y recuperación.
9. **Fase 3 — capas y afinidades**:
   - capas independientes de **lugar + clima + hora**;
   - 3 afinidades (Fuego, Agua, Mente) con escena inicial, multiplicadores y
     comando exclusivo;
   - comandos nuevos `despejado`, `ignicion`, `tsunami`, `sinapsis`.
   - 514 comandos en total.

## Sistemas actuales

### Director de escena (`src/state.ts`)

Cada comando define una **capa de acción** y un **ambiente**:

- **Acción** (se reemplaza en cada comando): `pose`, `overlay`, `particles`,
  `anim`, `scaleX/Y`, `rotation`, `offsetX/Y`, `alpha`, `aberration`, `bloom`,
  `distortion`, `clones`, `shadowColor`, `filter`, `tint`, `fx`.
- **Ambiente** (persiste): `bgColor`, `envParticles`, `bgLayer`, `escenario`,
  `hora`.
- **Persistente** (no lo toca el timer): `interactive`, `physicsEnabled`.

Al ejecutar un comando se resetean los campos de acción que el comando no
menciona, se aplican los nuevos y se programa un timer (`dur`, por defecto
5 s) para volver la acción a los valores por defecto. El ambiente y los modos
persistentes sobreviven hasta `normal`/`resetState` o hasta que otro comando
los cambie.

### Protocolos (`src/lib/protocolos.ts` + `protocolosHud.ts`)

- 3 objetivos activos generados entre **6 tipos**: felicidad sostenida,
  archivo (palabras nuevas), sinergia, comando, exploración y resistencia
  (energía baja).
- Estado: `{ activos, completados, puntaje }`.
- Persistencia: `soma_protocolos`.
- Al completar: suma recompensa, reemplaza el objetivo y emite un evento.
- `bonificar(puntos)` permite sumar puntos desde cadenas/peticiones.
- HUD abajo a la izquierda + sección en el panel.

### Peticiones (`src/lib/peticiones.ts` + `peticionesHud.ts`)

- Después del “INICIAR MOTOR”, SOMA empieza a pedir cosas cada **18–29 s**.
- Tipos: comer, música, afecto, escenario, calma, jugar.
- Tiempo para responder: **12–15 s**.
- Cumplir: +12 ánimo y +25 puntos (× multiplicador de afinidad).
- Fallar: −10 ánimo.
- Panel `#peticion` abajo al centro con cuenta regresiva y barra.
- No persiste entre recargas.

### Cadenas (`src/lib/cadenas.ts`)

- 8 secuencias de 3 comandos dentro de una ventana de **8 s**:
  developer, noir, vínculo, elemental, digital, polar, singularidad y estelar.
- Se registran los comandos completos (`val`), no los combos escritos juntos.
  Es decir: hay que escribir `cafe`, luego `programar`, luego `codigo`.
- Cada cadena aplica un efecto propio, un mensaje, sonido y recompensa
  (60/70/80 × multiplicador de afinidad).
- Persistencia de descubiertas: `soma_cadenas`.
- El contador vive en el HUD (`CADENAS n/8`).

### Estabilidad (`src/lib/estabilidad.ts` + `state.ts`)

- La carga se calcula desde los efectos del comando (`cargaDe`): bloom,
  aberración, distorsión, clones, partículas, fx, animaciones intensas.
- Los comandos calmados (`meditating`, `respirar`) restan carga.
- La afinidad multiplica el costo (`fuego` 1.2, `agua` 0.85, `mente` 1.0).
- Recuperación: +1/s por defecto; Agua +2/s; no recupera durante sobrecarga.
- A **0** se dispara una **sobrecarga**: glitch, mensaje y vuelta a **35**.
- HUD: barra `ESTABILIDAD` en vitales; estados `INESTABLE` / `SOBRECARGA`.

### Capas (`types.ts`, `render.ts`, `renderer/scenarios.ts`)

- `escenario` (10 lugares), `envParticles` (clima/ambiente: lluvia, nieve,
  hojas, datos, estrellas, ceniza, pétalos, aurora) y `hora` (`dia`,
  `atardecer`, `noche`, `amanecer`).
- Son independientes: `bosque` + `lluvia` + `noche` es válido.
- `aplicarHora` dibuja un gradiente de color sobre el escenario (no sobre el
  personaje) antes de las partículas y del sujeto.
- Comandos: `dia`, `atardecer`, `noche`, `amanecer`, `medianoche` y
  `despejado` (limpia el clima). `bosque` y `nieve` ahora también setean su
  escenario.

### Afinidades (`src/lib/afinidades.ts`)

| Afinidad | Escena inicial | Carga | Puntos | Recuperación | Comando |
|---|---|---|---|---|---|
| Fuego | volcán / atardecer / ceniza | ×1,2 | ×1,15 | +1/s | `ignicion` |
| Agua | playa / amanecer / pétalos | ×0,85 | ×1,0 | +2/s | `tsunami` |
| Mente | laboratorio / noche / datos | ×1,0 | ×1,25 | +1/s | `sinapsis` |

- Se elige desde el panel (sección **AFINIDAD**).
- Persiste en `soma_afinidad`.
- Al cargar la página se aplica la escena inicial de la afinidad guardada.
- `normal` reinicia la escena y la estabilidad, pero **no** borra la afinidad;
  al recargar vuelve la escena inicial.
- Los comandos exclusivos están bloqueados si la afinidad no coincide y
  muestran un aviso.

### Catálogo, ayuda y búsqueda

- `scripts/catalogo.py` parsea `src/diccionario.ts` y genera
  `src/lib/catalogo.ts` con categoría, descripción (primer `cmd("...")`),
  sinónimos (mapa curado) y tags.
- **Hay que regenerarlo después de agregar comandos:**
  `python scripts/catalogo.py`.
- `src/lib/busqueda.ts`: normalización, búsqueda por nombre/sinónimo/
  descripción/categoría y sugerencias por distancia de edición.
- Comandos de sistema: `?`, `comandos`, `help`, `buscar <texto>`, `capturar`,
  `panel`. `ayuda` sigue siendo el comando original del diccionario.
- El catálogo se carga con `import()` dinámico: chunk `busqueda-*.js`.

### HUD, terminal, temas

- HUD en DOM: vitales (hambre, energía, ánimo, estabilidad), contexto
  (escenario, clima, hora, pose, efectos, afinidad, archivo, cadenas) y
  protocolos.
- Terminal con historial, timestamps, eco de comandos, colores por tipo y
  resultados de ayuda clickeables.
- Temas fósforo/ámbar/hielo persistidos en `soma_tema`.
- Mute con botón/tecla `M`, persistido en `soma_mudo`.
- Captura PNG con `capturar`/botón del panel; usa el canvas 2D y agrega marco,
  scanlines, escenario, pose, stats y fecha.

## Persistencia

| Clave | Contenido |
|---|---|
| `soma_words` | palabras descubiertas |
| `soma_combos` | sinergias descubiertas |
| `soma_stats` | hambre, energía, ánimo |
| `soma_tema` | `fosforo` / `ambar` / `hielo` |
| `soma_mudo` | booleano |
| `soma_protocolos` | objetivos activos, completados, puntaje |
| `soma_cadenas` | ids de cadenas descubiertas |
| `soma_afinidad` | `fuego` / `agua` / `mente` |

Todo pasa por `src/lib/storage.ts`, que tolera modo privado, cuota llena y
JSON corrupto.

## Cómo probar rápido

1. `npm run dev`, abrir la URL, **INICIAR MOTOR**.
2. `?` o `comandos` → ayuda. `buscar fuego` → resultados clickeables.
3. `tierra fuego` → sinergia del volcán.
4. `cafe`, `programar`, `codigo` (uno por uno) → cadena Developer.
5. `fuego tornado` varias veces → ver bajar la estabilidad y la sobrecarga.
6. Esperar 20–30 s → aparece una petición de SOMA; cumplirla.
7. Abrir **PANEL** → probar temas, afinidades, protocolos y captura.
8. `noche` + `bosque` + `lluvia` → capas combinadas.

## Lo que falta

- **Poses nuevas de Hikaru**: el autor las va a generar. El pipeline de
  integración está descrito en `docs/ARQUITECTURA.md`.
- **Fase 3 restante**: codex, rituales guardables, reto diario, PWA e i18n.
- **Balance**: ajustar metas/recompensas de protocolos, frecuencia de
  peticiones y costo de estabilidad con datos de uso real.
- **Escenarios**: `playa` y algunos fondos procedurales son muy simples;
  se pueden mejorar sin tocar el resto.

## Limitaciones conocidas

- Vercel a veces crea solo un deploy **Preview** al pushear a `main`; el
  dominio de producción queda en el commit anterior. Solución usada: commit
  vacío en `main` para forzar producción, o promover el deploy desde el
  dashboard. Verificar con `gh api repos/LeandroCarlino/Soma-Engine/deployments`.
- El dominio puede responder un challenge anti-bot a `curl`; el navegador real
  lo pasa.
- En pruebas headless, si la pestaña queda oculta el canvas se congela aunque
  el DOM siga actualizándose. No es un bug del juego; usar frames forzados o
  una pestaña visible.
- Los efectos de acción se reemplazan; si querés que dos efectos convivan,
  usá el sistema de capas de ambiente o ampliá el director con prioridades.
- Las stats decaen con el tiempo y se guardan; una sesión vieja puede mostrar
  `CRÍTICO`. Comer/dormir/jugar las recupera.

## Si tocás algo

1. Leer `docs/ARQUITECTURA.md` para el mapa de archivos y recetas.
2. Si agregás comandos: `python scripts/catalogo.py` y `npm test`.
3. Correr `npm run typecheck && npm test && npm run build`.
4. Probar en el navegador los flujos de la sección anterior.
5. Commit + push a `main` y `refactor-v2`; verificar que Vercel haya creado
   un deploy de **Production**.
