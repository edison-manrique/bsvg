/**
 * Presets de ejemplo para pruebas de rendimiento y codecs SVG / AISVG / BSVG.
 */

export const AI_ROBOT = `V 240 240
PAL $bg:#0b0f19 $body:#1e293b $neon:#38bdf8 $core:#10b981 $accent:#f43f5e $metal:#94a3b8 $white:#ffffff
RG bgGrad 50%,50%,50% #16243b #080c14
G glowGrad v $neon $core
R 0 0 240 240 28 | f:@bgGrad
{ | an:float@3.2s
  { | an:wag@2.4s
    L 120 42 120 22 | s:$metal sw:3 lc:round
    C 120 18 6 | f:$accent an:pulse@1.4s
  }
  R 68 46 104 74 16 | f:$body s:$neon sw:2.5
  R 80 60 80 44 8 | f:#0a0f1d s:#334155 sw:1.5
  { | an:blink@3.8s
    C 98 82 10 | f:@glowGrad
    C 142 82 10 | f:@glowGrad
    C 100 80 3 | f:$white
    C 144 80 3 | f:$white
  }
  R 60 128 120 72 18 | f:$body s:$neon sw:2.5
  C 120 162 18 | f:@glowGrad s:$core sw:1.5 an:pulse@2s
  C 120 162 8 | f:$white op:.8
  { | an:swayL@2.6s
    R 38 132 18 48 9 | f:$body s:$metal sw:2
    C 47 184 7 | f:$accent
  }
  { | an:swayR@2.6s
    R 184 132 18 48 9 | f:$body s:$metal sw:2
    C 193 184 7 | f:$accent
  }
}`;

export const AI_CYBER_SHIELD = `V 400 440
PAL $a:#38bdf8 $b:#6366f1 $c:#a855f7 $d:#f43f5e $e:#10b981 $white:#ffffff $dark:#030712
G gCyber d $a $b
G gAccent v $c $d
RG gGlow 50%,50%,55% #1e1b4b #030712
DEF ring C 0 0 12 | f:none s:$a sw:1.5 an:pulse@2s
R 0 0 400 440 24 | f:@gGlow
C 200 220 140 | f:$b op:.12 an:pulse@3.2s
{ | an:float@3.5s
  P M120,130L280,130L280,240C280,315,235,360,200,380C165,360,120,315,120,240Z | f:@gCyber s:$white sw:2.5
  P M132,142L268,142L268,236C268,302,228,342,200,360C172,342,132,302,132,236Z | f:$dark op:.85 s:$a sw:1.5
  { | an:pulse@2.4s
    C 200 230 45 | f:@gAccent op:.8
    C 200 230 22 | f:$white op:.9
  }
  P M160,180L200,150L240,180L200,210Z | f:$white op:.25
  T 200 315 "CYBER CORE" | f:$a fs:16 fw:bold ta:middle
  { | an:spin@8s
    U ring 200,230
  }
}`;

export const AI_GEM = `V 128 128
G g d #38bdf8 #6366f1
R 0 0 128 128 22 | f:#0f172a
PG 64,14 108,48 64,114 20,48 | f:@g s:#e0f2fe sw:2
PG 64,14 84,48 64,114 44,48 | f:#fff op:.22
L 20 48 108 48 | s:#e0f2fe sw:1.5 op:.6`;

export const AI_PROMPT_SPEC = `Genera gráficos estáticos, sprites animados o historias completas en formato AISVG v4 (sin XML, reutilizable y compacto):
- Cabecera: V ancho alto | Historia opcional: STORY 18s (o 18s! sin bucle) | Paleta: PAL $a:#ff8fab $b:#ff4d6d
- Gradientes: G id v|h|d col1 col2(@55%)(*op) | RG id cx%,cy%,r% col1 col2 (usa @id en f:)
- Reutilización (reduce tokens): DEF id forma | attrs (o DEF id { ... }) -> U id x1,y1 x2,y2 (o U id | attrs)
- Formas: R x y w h [rx] | C cx cy r | E cx cy rx ry | L x1 y1 x2 y2 | PG pts | P path_sin_espacios | T x y "txt"
- Grupos (heredan f:, s:, sw:, op:): { | attrs ... }
- Atributos tras "|": f:fill, s:stroke, sw:width, op:opacity, lc:round, fs:size, fw:bold, ta:middle, tf:rot(deg,cx,cy)|tr(x,y)|sc(x)
- En P con s: sin f:, el relleno es transparente automáticamente.
- Animaciones an: (16 macros): float, blink, swayL, swayR, wag, pulse, rise, spin, bob, wave, driftR, driftL, shake, flap, pop, fadeIn
  Modificadores opcionales: @dur +delay !una_vez (ej: an:pop+2s! o an:bob@3s)
- Actos/Escenas: tl:inicio-fin (ej: { | tl:0-6 ... } { | tl:6-12 ... }) dentro de STORY.
Responde SOLO con el código AISVG v4 dentro de un bloque de código \`\`\`txt ... \`\`\`.`;

export interface PresetItem {
  readonly id: string;
  readonly name: string;
  readonly category: 'animated' | 'static';
  readonly aisvg: string;
}

export const PRESETS: readonly PresetItem[] = [
  {
    id: 'robot',
    name: 'Cyber Bot Neo (Animado)',
    category: 'animated',
    aisvg: AI_ROBOT,
  },
  {
    id: 'shield',
    name: 'Cyber Shield Neo (Animado)',
    category: 'animated',
    aisvg: AI_CYBER_SHIELD,
  },
  {
    id: 'gem',
    name: 'Gema Mínima (Estático)',
    category: 'static',
    aisvg: AI_GEM,
  },
];
