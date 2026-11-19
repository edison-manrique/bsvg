import { describe, expect, it } from 'bun:test';
import { DOMParser } from 'linkedom';

// Provide DOMParser for headless Bun test runtime
(globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser = DOMParser;

import {
  decodeAISVG,
  encodeAISVG,
  decodeBSVG,
  encodeBSVG,
  AI_CRISTAL,
  AI_GEM,
  AI_ROBOT,
  PRESETS,
} from '../src';

describe('bsvg & aisvg codecs', () => {
  it('has presets defined', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(3);
    expect(AI_CRISTAL.length).toBeGreaterThan(50);
    expect(AI_GEM.length).toBeGreaterThan(20);
    expect(AI_ROBOT.length).toBeGreaterThan(50);
  });

  it('decodes AI_GEM to SVG and re-encodes to AISVG', () => {
    const svg = decodeAISVG(AI_GEM);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    const reAi = encodeAISVG(svg, true);
    expect(reAi).toContain('V 128 128');
  });

  it('encodes and decodes BSVG binary roundtrip with AI_GEM', async () => {
    const svg = decodeAISVG(AI_GEM);
    const { finalBytes } = await encodeBSVG(svg, true);
    expect(finalBytes.length).toBeGreaterThan(10);
    // Header magic BSV4
    expect(finalBytes[0]).toBe(0x42); // B
    expect(finalBytes[1]).toBe(0x53); // S
    expect(finalBytes[2]).toBe(0x56); // V
    expect(finalBytes[3]).toBe(0x34); // 4

    const decodedSvg = await decodeBSVG(finalBytes);
    expect(decodedSvg).toContain('<svg');
    expect(decodedSvg).toContain('</svg>');
  });

  it('decodes AI_CRISTAL with styles & animations and encodes to BSVG', async () => {
    const svg = decodeAISVG(AI_CRISTAL);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<style>');
    const { finalBytes } = await encodeBSVG(svg, true);
    const decodedSvg = await decodeBSVG(finalBytes);
    expect(decodedSvg).toContain('<svg');
    expect(decodedSvg).toContain('</svg>');
  });
});
