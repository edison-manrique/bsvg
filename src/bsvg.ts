import { ANIM_MACROS, MACRO_KEYS, extractMacrosFromCss } from './macros';
import type { BsvgEncodeResult } from './types';
import { escapeXml, expandHex, parseSvgDom, streamTransform } from './utils';

export const TAG_OPCODES: readonly (string | null)[] = [
  null, 'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line',
  'polygon', 'polyline', 'defs', 'linearGradient', 'radialGradient',
  'stop', 'clipPath', 'text', 'style', 'use', 'mask', 'pattern',
];

export const ATTR_OPCODES: readonly (string | null)[] = [
  null, 'id', 'viewBox', 'width', 'height', 'x', 'y', 'cx', 'cy',
  'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'd', 'points', 'fill',
  'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'opacity', 'fill-opacity', 'stroke-opacity', 'transform', 'class',
  'offset', 'stop-color', 'stop-opacity', 'clip-path', 'gradientUnits',
  'gradientTransform', 'xmlns', 'font-size', 'font-family',
  'text-anchor', 'style', 'font-weight', 'href',
];

export const STATIC_DICT: readonly string[] = [
  'none', 'round', '0', '1', '0%', '50%', '100%', '#ffffff', '#000000',
  'http://www.w3.org/2000/svg', 'middle', 'bold', 'sans-serif',
  ...MACRO_KEYS.map((k) => `an_${k}`),
];

const V3_DICT: readonly string[] = [
  'none', 'round', '0', '1', '0%', '50%', '100%', '#ffffff', '#000000',
  'http://www.w3.org/2000/svg', 'an_float', 'an_blink', 'an_swayL',
  'an_swayR', 'an_wag', 'an_pulse', 'an_rise', 'an_spin',
];

export const PATH_CMDS = 'MmLlHhVvCcSsQqTtAaZz';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class ByteWriter {
  private readonly buf: number[] = [];

  u8(v: number): void {
    this.buf.push(v & 0xff);
  }

  varint(n: number): void {
    let v = n >>> 0;
    while (v >= 0x80) {
      this.buf.push((v & 0x7f) | 0x80);
      v >>>= 7;
    }
    this.buf.push(v);
  }

  svarint(n: number): void {
    this.varint((n << 1) ^ (n >> 31));
  }

  f32(n: number): void {
    const ab = new ArrayBuffer(4);
    new DataView(ab).setFloat32(0, n, false);
    this.bytes(new Uint8Array(ab));
  }

  str(s: string): void {
    const b = textEncoder.encode(s);
    this.varint(b.length);
    this.bytes(b);
  }

  bytes(arr: Uint8Array | readonly number[]): void {
    for (const b of arr) this.buf.push(b);
  }

  toUint8(): Uint8Array {
    return new Uint8Array(this.buf);
  }
}

class ByteReader {
  pos = 0;

  constructor(readonly u8: Uint8Array) {}

  u8v(): number {
    const val = this.u8[this.pos++];
    if (val === undefined) throw new Error('Fin inesperado del buffer BSV');
    return val;
  }

  varint(): number {
    let r = 0;
    let s = 0;
    while (true) {
      const b = this.u8v();
      r |= (b & 0x7f) << s;
      if (!(b & 0x80)) return r >>> 0;
      s += 7;
    }
  }

  svarint(): number {
    const z = this.varint();
    return (z >>> 1) ^ -(z & 1);
  }

  f32(): number {
    const dv = new DataView(this.u8.buffer, this.u8.byteOffset + this.pos, 4);
    this.pos += 4;
    return dv.getFloat32(0, false);
  }

  str(): string {
    const l = this.varint();
    const out = textDecoder.decode(this.u8.subarray(this.pos, this.pos + l));
    this.pos += l;
    return out;
  }
}

function writePathNum(w: ByteWriter, rawNum: number): void {
  const num = Number.isFinite(rawNum) ? rawNum : 0;
  if (Number.isInteger(num) && num >= 0 && num <= 99) {
    w.u8(num);
  } else if (Number.isInteger(num) && num >= 100 && num <= 4095) {
    w.u8(0x64 + (num >> 8));
    w.u8(num & 0xff);
  } else if (Number.isInteger(num) && Math.abs(num) <= 1_000_000) {
    w.u8(0x74);
    w.svarint(num);
  } else {
    const x10 = Math.round(num * 10);
    if (Math.abs(num) <= 100_000 && Math.abs(num - x10 / 10) < 1e-5) {
      w.u8(0x75);
      w.svarint(x10);
    } else {
      w.u8(0x76);
      w.f32(num);
    }
  }
}

function readPathNum(r: ByteReader): number {
  const b = r.u8v();
  if (b <= 0x63) return b;
  if (b <= 0x73) return ((b - 0x64) << 8) | r.u8v();
  if (b === 0x74) return r.svarint();
  if (b === 0x75) return Number((r.svarint() / 10).toFixed(1));
  return Number(r.f32().toFixed(4));
}

function encodePathBinary(dStr: string, gameMode: boolean): Uint8Array {
  const w = new ByteWriter();
  const tokens =
    dStr.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? [];
  w.varint(tokens.length);

  for (const tok of tokens) {
    const cmdIdx = PATH_CMDS.indexOf(tok);
    if (cmdIdx !== -1 && tok.length === 1) {
      w.u8(0x80 | cmdIdx);
    } else {
      const parsed = parseFloat(tok);
      writePathNum(w, gameMode ? Math.round(parsed * 10) / 10 : parsed);
    }
  }
  return w.toUint8();
}

function decodePathBinary(r: ByteReader): string {
  const n = r.varint();
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const next = r.u8[r.pos];
    if (next !== undefined && next & 0x80) {
      out.push(PATH_CMDS[r.u8v() & 0x7f] ?? '');
    } else {
      out.push(String(readPathNum(r)));
    }
  }
  return out.join(' ');
}

export async function encodeBSVG(
  svgStr: string,
  gameMode = true
): Promise<BsvgEncodeResult> {
  const root = parseSvgDom(svgStr);
  let macroMask = 0;
  const strMap = new Map<string, number>();
  const strList: string[] = [];

  const intern = (s: string): number => {
    const si = STATIC_DICT.indexOf(s);
    if (si !== -1) return si;
    const existing = strMap.get(s);
    if (existing !== undefined) return existing;
    const idx = STATIC_DICT.length + strList.length;
    strMap.set(s, idx);
    strList.push(s);
    return idx;
  };

  const styleRem = (n: Node): string => {
    const ext = extractMacrosFromCss(n.textContent ?? '');
    macroMask |= ext.mask;
    return ext.remainingCss;
  };

  function walk(node: Node, writeMode: false): void;
  function walk(node: Node, writeMode: true, pw: ByteWriter): void;
  function walk(node: Node, writeMode: boolean, pw?: ByteWriter): void {
    if (node.nodeType === 3) {
      const txt = (node.nodeValue ?? '').trim();
      if (!txt) return;
      if (!writeMode) intern(txt);
      else if (pw) {
        pw.u8(0x7e);
        pw.varint(intern(txt));
      }
      return;
    }

    if (node.nodeType !== 1) return;
    const el = node as Element;

    if (el.tagName === 'style') {
      const rem = styleRem(el);
      if (!rem) return;
      if (!writeMode) intern(rem);
      else if (pw) {
        pw.u8(TAG_OPCODES.indexOf('style'));
        pw.varint(0);
        pw.u8(0x7e);
        pw.varint(intern(rem));
        pw.u8(0x00);
      }
      return;
    }

    const attrs = Array.from(el.attributes).filter(
      (a) => !(gameMode && a.name === 'xmlns' && el.tagName === 'svg')
    );

    if (!writeMode) {
      if (!TAG_OPCODES.includes(el.tagName)) intern(el.tagName);
      for (const a of attrs) {
        if (!ATTR_OPCODES.includes(a.name)) intern(a.name);
        const v = a.value.trim();
        if (
          a.name === 'd' ||
          /^#[0-9a-fA-F]{3}$/.test(v) ||
          /^#[0-9a-fA-F]{6}$/.test(v) ||
          (/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v))
        ) {
          continue;
        }
        intern(v);
      }
      for (const ch of Array.from(el.childNodes)) walk(ch, false);
      return;
    }

    if (!pw) return;

    const tIdx = TAG_OPCODES.indexOf(el.tagName);
    if (tIdx !== -1) {
      pw.u8(tIdx);
    } else {
      pw.u8(0x7f);
      pw.varint(intern(el.tagName));
    }

    pw.varint(attrs.length);
    for (const a of attrs) {
      const aIdx = ATTR_OPCODES.indexOf(a.name);
      if (aIdx !== -1) {
        pw.u8(aIdx);
      } else {
        pw.u8(0x7f);
        pw.varint(intern(a.name));
      }

      const v = a.value.trim();
      if (a.name === 'd') {
        pw.u8(0x05);
        const pb = encodePathBinary(v, gameMode);
        pw.varint(pb.length);
        pw.bytes(pb);
      } else if (/^#[0-9a-fA-F]{3}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v)) {
        const h = expandHex(v);
        pw.u8(0x03);
        pw.u8(parseInt(h.slice(1, 3), 16));
        pw.u8(parseInt(h.slice(3, 5), 16));
        pw.u8(parseInt(h.slice(5, 7), 16));
      } else if (/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v)) {
        pw.u8(0x02);
        const num = parseFloat(v);
        writePathNum(pw, gameMode ? Math.round(num * 100) / 100 : num);
      } else {
        pw.u8(0x04);
        pw.varint(intern(v));
      }
    }

    for (const ch of Array.from(el.childNodes)) walk(ch, true, pw);
    pw.u8(0x00);
  }

  walk(root, false);

  const pw = new ByteWriter();
  pw.varint(strList.length);
  for (const s of strList) pw.str(s);
  walk(root, true, pw);

  const rawPayload = pw.toUint8();
  const { data: finalPayload, compressed } = await streamTransform(rawPayload, 'comp');

  const wrap = (body: Uint8Array, isComp: boolean): Uint8Array => {
    const out = new Uint8Array(8 + body.length);
    out.set([
      0x42, 0x53, 0x56, 0x34,
      4,
      isComp ? 1 : 0,
      (macroMask >> 8) & 0xff,
      macroMask & 0xff,
    ]);
    out.set(body, 8);
    return out;
  };

  return {
    rawBytes: wrap(rawPayload, false),
    finalBytes: wrap(finalPayload, compressed),
  };
}

export async function decodeBSVG(u8: Uint8Array): Promise<string> {
  if (!u8 || u8.length < 7 || u8[0] !== 0x42 || u8[1] !== 0x53 || u8[2] !== 0x56) {
    throw new Error('Archivo inválido (requiere BSV3/BSV4)');
  }

  const ver = u8[3] === 0x34 ? 4 : u8[3] === 0x33 ? 3 : 0;
  if (!ver) throw new Error('Versión BSV no soportada');

  const isV4 = ver === 4;
  const macroMask = isV4 ? ((u8[6] ?? 0) << 8) | (u8[7] ?? 0) : (u8[6] ?? 0);
  let body = u8.subarray(isV4 ? 8 : 7);

  if ((u8[5] ?? 0) & 1) {
    body = (await streamTransform(body, 'decomp')).data;
  }

  const dict = isV4 ? STATIC_DICT : V3_DICT;
  const r = new ByteReader(body);
  const strs = Array.from({ length: r.varint() }, () => r.str());
  const getStr = (i: number): string =>
    (i < dict.length ? dict[i] : strs[i - dict.length]) ?? '';

  const injectedStyle = macroMask
    ? `  <style>${MACRO_KEYS.filter((_, i) => macroMask & (1 << i))
        .map((k) => ANIM_MACROS[k].css)
        .join('')}</style>\n`
    : '';

  function readNode(indent = 0): string | null {
    const op = r.u8v();
    if (op === 0x00) return null;
    if (op === 0x7e) return '  '.repeat(indent) + escapeXml(getStr(r.varint()));

    const tag = op === 0x7f ? getStr(r.varint()) : (TAG_OPCODES[op] ?? 'g');
    const ac = r.varint();
    const attrs: string[] = [];
    let hasXmlns = false;

    for (let i = 0; i < ac; i++) {
      const ao = r.u8v();
      const name = ao === 0x7f ? getStr(r.varint()) : (ATTR_OPCODES[ao] ?? '');
      if (name === 'xmlns') hasXmlns = true;

      const vt = r.u8v();
      let val = '';
      if (vt === 0x05) {
        const l = r.varint();
        val = decodePathBinary(new ByteReader(r.u8.subarray(r.pos, r.pos + l)));
        r.pos += l;
      } else if (vt === 0x03) {
        val =
          '#' +
          [r.u8v(), r.u8v(), r.u8v()]
            .map((n) => n.toString(16).padStart(2, '0'))
            .join('');
      } else if (vt === 0x02) {
        val = String(readPathNum(r));
      } else {
        val = getStr(r.varint());
      }

      attrs.push(`${name}="${escapeXml(val)}"`);
    }

    if (tag === 'svg' && !hasXmlns) {
      attrs.unshift('xmlns="http://www.w3.org/2000/svg"');
    }

    const ch: string[] = [];
    while (true) {
      const n = readNode(indent + 1);
      if (n === null) break;
      ch.push(n);
    }

    const pad = '  '.repeat(indent);
    const aStr = attrs.length ? ' ' + attrs.join(' ') : '';
    const ex = tag === 'svg' && injectedStyle ? '\n' + injectedStyle.trimEnd() : '';

    if (!ch.length && !ex) return `${pad}<${tag}${aStr} />`;
    if (ch.length === 1 && !ch[0]!.trimStart().startsWith('<') && !ex) {
      return `${pad}<${tag}${aStr}>${ch[0]!.trim()}</${tag}>`;
    }
    return `${pad}<${tag}${aStr}>${ex}\n${ch.join('\n')}\n${pad}</${tag}>`;
  }

  return readNode(0) ?? '';
}