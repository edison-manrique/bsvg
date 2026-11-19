# ⚡ BSVG — Binary SVG & AISVG Codec Suite

Motor ultracompacto y optimizado para serialización, compresión y manipulación de gráficos vectoriales (SVG):
- **BSV4 (Binary SVG)**: Formato binario ultraligero con codificación de opcodes por diccionario, números varint/svarint, empaquetado de comandos de trazado y compresión `deflate-raw` con `CompressionStream`.
- **AISVG (AI-Friendly Minimal DSL)**: Lenguaje declarativo diseñado para LLMs y generación de sprites con sintaxis ultra-reducida de tokens, macros de animación CSS (`an:float`, `an:pulse`, etc.), gradientes y paletas indexadas.

---

## 📦 Estructura del Proyecto

```
GITHUB/bsvg/
├── src/                      # Código fuente de la librería TypeScript
│   ├── index.ts              # Punto de entrada y exportaciones
│   ├── bsvg.ts               # Codec BSV4 (Binary SVG)
│   ├── aisvg.ts              # Codec AISVG (AI-friendly DSL)
│   ├── macros.ts             # Macros de animación CSS y timelines
│   ├── presets.ts            # Muestras precargadas (Cristal, Gem, Robot)
│   ├── types.ts              # Interfaces y tipos de TypeScript
│   └── utils.ts              # Utilidades de compresión y parseo DOM
├── dist/                     # Salida de compilación optimizada (ESM + .d.ts)
│   ├── index.js              # Bundle neutral minificado (~29 KB)
│   └── types/                # Definiciones de tipo TypeScript
├── test/                     # Pruebas unitarias y de ida y vuelta (roundtrip)
│   └── codecs.test.ts
└── playground/               # Suite interactiva en SolidJS modular
    ├── src/
    │   ├── components/
    │   │   ├── Header/       # Selector de presets y modo Game
    │   │   ├── StatsBar/     # Métricas de compresión en tiempo real
    │   │   ├── Panels/       # Paneles (SVG, AISVG, BSVG Hex Viewer)
    │   │   └── Fullscreen/   # Visor modal con zoom y control de fondos
    │   ├── App.tsx           # Pipeline reactivo bidireccional
    │   └── global.css
    └── vite.config.ts
```

---

## 🚀 Uso de la Librería

```typescript
import {
  encodeBSVG,
  decodeBSVG,
  encodeAISVG,
  decodeAISVG,
  PRESETS
} from 'bsvg';

// 1. Codificar SVG nativo a BSVG binario
const { finalBytes, rawBytes } = await encodeBSVG(svgString, true);

// 2. Decodificar BSVG binario a SVG W3C
const svgFromBinary = await decodeBSVG(finalBytes);

// 3. Convertir SVG a DSL AISVG (ahorro masivo de tokens para LLMs)
const aisvgText = encodeAISVG(svgString, true);

// 4. Decodificar AISVG a SVG estándar
const svgFromAisvg = decodeAISVG(aisvgText);
```

---

## 🛠️ Comandos de Desarrollo

```bash
# Compilar librería y generar tipos
bun run build

# Ejecutar pruebas unitarias
bun test

# Iniciar servidor de desarrollo del Playground en SolidJS
bun run playground:dev

# Compilar Playground para producción
bun run playground:build
```

