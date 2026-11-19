/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  bsvg — Ultra-compact SVG & AISVG compression suite
 *  Binary Vector Graphics (BSV4) & AI-friendly Minimal DSL (AISVG)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Core Codecs
export {
  encodeBSVG,
  decodeBSVG,
  TAG_OPCODES,
  ATTR_OPCODES,
  STATIC_DICT,
  PATH_CMDS,
} from './bsvg';

export {
  encodeAISVG,
  decodeAISVG,
} from './aisvg';

// Animation Macros & CSS Tools
export {
  ANIM_MACROS,
  MACRO_KEYS,
  normCss,
  extractMacrosFromCss,
  extractTimelinesFromCss,
  buildTimelineCss,
} from './macros';

// Utilities
export {
  streamTransform,
  escapeXml,
  shortColor,
  expandHex,
  fmtNum,
  parseSvgDom,
} from './utils';

// Presets
export {
  AI_CRISTAL,
  AI_GEM,
  AI_ROBOT,
  PRESETS,
  type PresetItem,
} from './presets';

// Types
export type {
  AnimMacroKey,
  AnimMacroDef,
  BsvgEncodeResult,
  StreamTransformResult,
  ExtractedMacros,
  ExtractedTimelines,
} from './types';

