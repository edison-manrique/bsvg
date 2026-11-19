/**
 * Presets de ejemplo para pruebas de rendimiento y codecs SVG / AISVG / BSVG.
 */

export const AI_CRISTAL = `V 400 460
PAL $a:#29b6f6 $b:#0277bd $c:#00264d $d:#fff5b8 $e:#ffd700 $f:#b8860b $g:#fff
G gSky d $a $b
G gGold v $d $e
G gGoldD v $e $f
RG gBg 50%,50%,60% #0b223d #040d18
DEF star PG 0,-9 2.2,-2.8 9,-2.8 3.5,1.8 5.5,8.5 0,4.5 -5.5,8.5 -3.5,1.8 -9,-2.8 -2.2,-2.8 | f:@gGold s:$f sw:.8
DEF spk P M0,-9L2,-2L9,0L2,2L0,9L-2,2L-9,0L-2,-2Z | f:$g
R 0 0 400 460 | f:@gBg
C 200 245 165 | f:$a op:.09 an:pulse@3s
P M105,152L295,152L295,255C295,330,245,375,200,400C155,375,105,330,105,255Z | f:@gGold s:$f sw:3
P M114,161L286,161L286,253C286,322,240,364,200,388C160,364,114,322,114,253Z | f:$g
P M121,168L279,168L279,252C279,315,237,355,200,378C163,355,121,315,121,252Z | f:@gSky
P M121,168L225,168L121,295Z | f:$g op:.16
U star 160,192 200,185 240,192
T 203 293 "SC" | f:$c op:.35 fs:90 fw:bold ta:middle
T 200 290 "SC" | f:$g fs:90 fw:bold ta:middle
P M75,392Q200,418,325,392L315,428Q200,452,85,428Z | f:$c s:$e sw:2.5
T 200 422 "SPORTING CRISTAL" | f:$g fs:20 fw:bold ta:middle
C 200 95 64 | f:$e op:.16 an:pulse@2.5s
{ | an:bob@2.8s
  P M145,115L162,65L182,102L218,102L238,65L255,115Z | f:@gGoldD s:$f sw:1.5
  P M132,120L120,62L162,92L200,45L238,92L280,62L268,120Q200,132,132,120Z | f:@gGold s:$f sw:2.5 lc:round
  P M132,118Q200,130,268,118L265,132Q200,143,135,132Z | f:@gGoldD s:$f sw:2
  { | f:@gGold s:$f sw:1.5
    C 120 58 6
    C 162 62 5
    C 200 40 8
    C 238 62 5
    C 280 58 6
  }
  E 200 100 8 11 | f:@gSky s:$d sw:1.8
  { | s:$d sw:1.2
    C 155 112 5 | f:$a
    C 245 112 5 | f:$a
    C 200 127 5 | f:$g
  }
  { | an:blink@1.6s
    U spk 200,38
  }
  { | an:blink@1.8s+0.5s
    U spk 120,56 | f:$d
  }
  { | an:blink@1.8s+1s
    U spk 280,56 | f:$d
  }
  { | an:pulse@1.5s
    U spk 200,98
  }
}`;

export const AI_GEM = `V 128 128
G g d #38bdf8 #6366f1
R 0 0 128 128 22 | f:#0f172a
PG 64,14 108,48 64,114 20,48 | f:@g s:#e0f2fe sw:2
PG 64,14 84,48 64,114 44,48 | f:#fff op:.22
L 20 48 108 48 | s:#e0f2fe sw:1.5 op:.6`;

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

export interface PresetItem {
  readonly id: string;
  readonly name: string;
  readonly category: 'animated' | 'static';
  readonly aisvg: string;
}

export const PRESETS: readonly PresetItem[] = [
  {
    id: 'cristal',
    name: 'Escudo Sporting Cristal (Animado)',
    category: 'animated',
    aisvg: AI_CRISTAL,
  },
  {
    id: 'gem',
    name: 'Gema Mínima (Estático)',
    category: 'static',
    aisvg: AI_GEM,
  },
  {
    id: 'robot',
    name: 'Cyber Bot Neo (Animado)',
    category: 'animated',
    aisvg: AI_ROBOT,
  },
];

