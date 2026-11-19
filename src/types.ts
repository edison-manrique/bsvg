export type AnimMacroKey =
  | 'float'
  | 'blink'
  | 'swayL'
  | 'swayR'
  | 'wag'
  | 'pulse'
  | 'rise'
  | 'spin'
  | 'bob'
  | 'wave'
  | 'driftR'
  | 'driftL'
  | 'shake'
  | 'flap'
  | 'pop'
  | 'fadeIn';

export interface AnimMacroDef {
  readonly cls: string;
  readonly css: string;
}

export interface BsvgEncodeResult {
  readonly rawBytes: Uint8Array;
  readonly finalBytes: Uint8Array;
}

export interface StreamTransformResult {
  readonly data: Uint8Array;
  readonly compressed: boolean;
}

export interface ExtractedMacros {
  readonly remainingCss: string;
  readonly mask: number;
  readonly detected: Set<AnimMacroKey>;
}

export interface ExtractedTimelines {
  readonly remainingCss: string;
  readonly storyHeader: string | null;
  readonly tlClasses: Set<string>;
}