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

[sitio web en producción]

## Instalación

```bash
npm install
npm run dev
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

## Tech Stack

- TypeScript
- Vite
- WebGL / Canvas 2D
- Web Audio API
- CSS con clamp() para responsividad

## Estructura del proyecto

```
├── src/
│   ├── main.ts      # Entry point
│   ├── render.ts    # Motor de renderizado
│   ├── diccionario.ts  # Comandos y sinergias
│   ├── state.ts     # Estado global
│   ├── audio.ts     # Sonidos procedurales
│   └── types.ts     # Tipos TypeScript
├── public/Hikaru/  # Sprites del personaje
├── style.css        # Estilos
└── index.html       # Entry HTML
```

## License

MIT
