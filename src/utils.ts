import type { StreamTransformResult } from './types';

export async function streamTransform(
  uint8: Uint8Array,
  mode: 'comp' | 'decomp'
): Promise<StreamTransformResult> {
  if (mode === 'comp' && typeof CompressionStream === 'undefined') {
    return { data: uint8, compressed: false };
  }
  if (mode === 'decomp' && typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream no disponible en este entorno');
  }

  try {
    const st =
      mode === 'comp'
        ? new CompressionStream('deflate-raw')
        : new DecompressionStream('deflate-raw');

    const w = st.writable.getWriter();
    w.write(new Uint8Array(uint8));
    w.close();

    const buf = await new Response(st.readable).arrayBuffer();
    return { data: new Uint8Array(buf), compressed: true };
  } catch (err) {
    if (mode === 'comp') {
      // Fallback: Si el entorno no soporta deflate-raw o falla la compresión, continuar sin comprimir
      return { data: uint8, compressed: false };
    }
    throw err;
  }
}

export function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function shortColor(c: string): string {
  const m = c
    .trim()
    .toLowerCase()
    .match(/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/);
  return m ? `#${m[1]}${m[2]}${m[3]}` : c.trim().toLowerCase();
}

export function expandHex(c: string): string {
  const m = c.trim().match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : c.trim();
}

export function fmtNum(n: string | number, gameMode: boolean): string {
  const v = typeof n === 'number' ? n : parseFloat(n);
  if (!Number.isFinite(v)) return String(n);
  const rounded = gameMode ? Math.round(v * 10) / 10 : v;
  return String(rounded).replace(/^0\./, '.').replace(/^-0\./, '-.');
}

export function parseSvgDom(svgStr: string): Element {
  const Parser =
    typeof DOMParser !== 'undefined'
      ? DOMParser
      : (globalThis as unknown as { DOMParser?: typeof DOMParser }).DOMParser;

  if (!Parser) {
    throw new Error('DOMParser no está disponible en este entorno');
  }

  const doc = new Parser().parseFromString(svgStr.trim(), 'image/svg+xml');
  const err =
    typeof doc.querySelector === 'function'
      ? doc.querySelector('parsererror')
      : null;
  if (err) {
    throw new Error('SVG inválido: ' + (err.textContent ?? '').slice(0, 90));
  }
  return doc.documentElement as unknown as Element;
}