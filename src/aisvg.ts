import {
  ANIM_MACROS,
  buildTimelineCss,
  extractMacrosFromCss,
  extractTimelinesFromCss,
} from './macros';
import type { AnimMacroKey } from './types';
import { escapeXml, fmtNum, parseSvgDom, shortColor } from './utils';

const SHORT_ATTRS: Record<string, string> = {
  fill: 'f',
  stroke: 's',
  'stroke-width': 'sw',
  'stroke-linecap': 'lc',
  'stroke-linejoin': 'lj',
  opacity: 'op',
  'fill-opacity': 'fo',
  'stroke-opacity': 'so',
  transform: 'tf',
  class: 'cl',
  'clip-path': 'cp',
  'font-size': 'fs',
  'font-family': 'ff',
  'text-anchor': 'ta',
  'font-weight': 'fw',
};

const REV_SHORT_ATTRS: Record<string, string> = Object.fromEntries(
  Object.entries(SHORT_ATTRS).map(([k, v]) => [v, k])
);

const INHERITABLE_SHORT = new Set([
  'f', 's', 'sw', 'lc', 'lj', 'op', 'fs', 'ff', 'ta', 'fw',
]);

type AttrPair = [string, string];

interface EncodedItem {
  geom: string;
  pairs: AttrPair[];
  isUse?: boolean;
  refId?: string;
  xy?: string;
}

function splitPipeOutsideQuotes(line: string): [string, string] {
  let inQ: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if ((ch === '"' || ch === "'") && (!inQ || inQ === ch)) {
      inQ = inQ ? null : ch;
    } else if (ch === '|' && !inQ) {
      return [line.slice(0, i), line.slice(i + 1)];
    }
  }
  return [line, ''];
}

function cleanPathD(raw: string | null): string {
  return (raw ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/([MmLlHhVvCcSsQqTtAaZz])\s+/g, '$1')
    .replace(/\s+([MmLlHhVvCcSsQqTtAaZz])/g, '$1')
    .trim();
}

export function encodeAISVG(svgStr: string, gameMode = true): string {
  const root = parseSvgDom(svgStr);
  const lines: string[] = [];

  const detectedMacros = new Set<AnimMacroKey>();
  const detectedTls = new Set<string>();
  const customCssBlocks: string[] = [];
  let storyHeader: string | null = null;

  root.querySelectorAll('style').forEach((st) => {
    const ext = extractMacrosFromCss(st.textContent ?? '');
    ext.detected.forEach((m) => detectedMacros.add(m));
    const extTl = extractTimelinesFromCss(ext.remainingCss);
    extTl.tlClasses.forEach((c) => detectedTls.add(c));
    if (extTl.storyHeader && !storyHeader) storyHeader = extTl.storyHeader;
    if (extTl.remainingCss) customCssBlocks.push(extTl.remainingCss);
  });

  const colorCounts = new Map<string, number>();
  const normCol = (c: string): string => (gameMode ? shortColor(c) : c.trim());

  root.querySelectorAll('*').forEach((el) => {
    (['fill', 'stroke', 'stop-color'] as const).forEach((k) => {
      const raw = el.getAttribute(k);
      if (raw === null) return;
      const nc = normCol(raw);
      if (/^#[0-9a-fA-F]{4,}$/.test(nc)) {
        colorCounts.set(nc, (colorCounts.get(nc) ?? 0) + 1);
      }
    });
  });

  const palMap = new Map<string, string>();
  const palDefs: string[] = [];
  const keys = 'abcdefghijklmnopqrstuvwxyz';
  let kIdx = 0;

  for (const [col, cnt] of [...colorCounts.entries()].sort((a, b) => b[1] - a[1])) {
    if ((col.length - 2) * cnt - (col.length + 4) > 0 && kIdx < keys.length) {
      const alias = '$' + keys[kIdx++];
      palMap.set(col, alias);
      palDefs.push(`${alias}:${col}`);
    }
  }

  const pathFreq = new Map<string, number>();
  root.querySelectorAll('path').forEach((p) => {
    if (p.parentElement?.tagName === 'defs' || p.hasAttribute('id')) return;
    const d = cleanPathD(p.getAttribute('d'));
    if (d.length >= 36) pathFreq.set(d, (pathFreq.get(d) ?? 0) + 1);
  });

  const autoPathDefs = new Map<string, string>();
  let autoDefIdx = 1;
  for (const [d, cnt] of pathFreq.entries()) {
    if (cnt >= 2) autoPathDefs.set(d, `p${autoDefIdx++}`);
  }

  const vb =
    root.getAttribute('viewBox') ??
    `0 0 ${parseFloat(root.getAttribute('width') ?? '') || 100} ${
      parseFloat(root.getAttribute('height') ?? '') || 100
    }`;
  const vbP = vb.trim().split(/[\s,]+/);
  lines.push(
    vbP[0] === '0' && vbP[1] === '0'
      ? `V ${vbP[2] ?? 100} ${vbP[3] ?? 100}`
      : `V ${vbP.join(' ')}`
  );
  if (storyHeader) lines.push(storyHeader);
  if (palDefs.length) lines.push(`PAL ${palDefs.join(' ')}`);
  customCssBlocks.forEach((css) => lines.push(`CSS ${css}`));

  const mapCol = (c: string): string => palMap.get(normCol(c)) ?? normCol(c);

  const fmtAttrVal = (name: string, rawVal: string): string => {
    let val = rawVal.trim();
    const urlM = val.match(/^url\(#([^)]+)\)$/);
    if (urlM) return '@' + urlM[1];
    if (name === 'fill' || name === 'stroke') return mapCol(val);
    if (name === 'transform') {
      val = val
        .replace(/\brotate\(([^)]+)\)/g, (_, a: string) => `rot(${a.trim().replace(/\s+/g, ',')})`)
        .replace(/\btranslate\(([^)]+)\)/g, (_, a: string) => `tr(${a.trim().replace(/\s+/g, ',')})`)
        .replace(/\bscale\(([^)]+)\)/g, (_, a: string) => `sc(${a.trim().replace(/\s+/g, ',')})`);
    }
    if (gameMode && /^-?\d+\.\d+$/.test(val)) val = fmtNum(val, true);
    return /\s/.test(val) ? `"${val}"` : val;
  };

  function getAttrPairs(
    el: Element,
    skip: readonly string[] = [],
    omitStrokeNone = true
  ): AttrPair[] {
    const pairs: AttrPair[] = [];
    const isLinePath = el.tagName === 'path' || el.tagName === 'polyline';
    const hasStroke = el.hasAttribute('stroke');
    const fillVal = el.getAttribute('fill');
    const stStr = el.getAttribute('style') ?? '';

    let animMod = '';
    const dur = stStr.match(/animation-duration:\s*([^;]+)/i);
    const del = stStr.match(/animation-delay:\s*([^;]+)/i);
    const it = stStr.match(/animation-iteration-count:\s*1\b/i);
    if (dur?.[1]) animMod += `@${dur[1].trim()}`;
    if (del?.[1]) animMod += `+${del[1].trim()}`;
    if (it) animMod += '!';

    const leftoverStyle = stStr
      .replace(/animation-(duration|delay|iteration-count|fill-mode):[^;]+;?/gi, '')
      .replace(/^;+|;+$/g, '')
      .trim();

    if (isLinePath && hasStroke && fillVal === null) pairs.push(['f', '#000']);

    for (const a of Array.from(el.attributes)) {
      if (skip.includes(a.name)) continue;
      if (a.name === 'xmlns' && el.tagName === 'svg') continue;
      if (omitStrokeNone && isLinePath && hasStroke && a.name === 'fill' && a.value.trim() === 'none') {
        continue;
      }
      if (a.name === 'style') {
        if (leftoverStyle) pairs.push(['style', fmtAttrVal('style', leftoverStyle)]);
        continue;
      }
      if (a.name === 'class') {
        const macros: string[] = [];
        const tls: string[] = [];
        const rest: string[] = [];

        for (const c of a.value.trim().split(/\s+/)) {
          const mName = c.startsWith('an_') ? (c.slice(3) as AnimMacroKey) : null;
          if (mName && detectedMacros.has(mName)) {
            macros.push(mName + animMod);
          } else if (detectedTls.has(c)) {
            const match = c.match(/^tl_([0-9d]+)_([0-9d]+)$/);
            if (match?.[1] && match[2]) {
              tls.push(`${match[1].replace('d', '.')}-${match[2].replace('d', '.')}`);
            }
          } else {
            rest.push(c);
          }
        }

        if (tls[0]) pairs.push(['tl', tls[0]]);
        if (macros.length) pairs.push(['an', macros.join(',')]);
        if (rest.length) pairs.push(['cl', rest.length > 1 ? `"${rest.join(' ')}"` : rest[0]!]);
        continue;
      }

      pairs.push([SHORT_ATTRS[a.name] ?? a.name, fmtAttrVal(a.name, a.value)]);
    }
    return pairs;
  }

  const pairsToStr = (pairs: readonly AttrPair[]): string =>
    pairs.length ? ' | ' + pairs.map(([k, v]) => `${k}:${v}`).join(' ') : '';

  const mapStops = (node: Element): string =>
    Array.from(node.querySelectorAll('stop'))
      .map((st, idx, arr) => {
        const c = mapCol(st.getAttribute('stop-color') ?? '#000');
        const o = st.getAttribute('offset');
        const op = st.getAttribute('stop-opacity');
        const omitOff = (idx === 0 && o === '0%') || (idx === arr.length - 1 && o === '100%');
        return c + (o && !omitOff ? '@' + o : '') + (op ? '*' + fmtNum(op, gameMode) : '');
      })
      .join(' ');

  function nodeToItem(node: Element): EncodedItem | null {
    const tag = node.tagName;
    const g = (k: string, d = '0'): string => fmtNum(node.getAttribute(k) ?? d, gameMode);

    if (tag === 'rect') {
      return {
        geom: `R ${g('x')} ${g('y')} ${g('width')} ${g('height')}${
          node.hasAttribute('rx') ? ' ' + g('rx') : ''
        }`,
        pairs: getAttrPairs(node, ['x', 'y', 'width', 'height', 'rx']),
      };
    }
    if (tag === 'circle') {
      return {
        geom: `C ${g('cx')} ${g('cy')} ${g('r')}`,
        pairs: getAttrPairs(node, ['cx', 'cy', 'r']),
      };
    }
    if (tag === 'ellipse') {
      return {
        geom: `E ${g('cx')} ${g('cy')} ${g('rx')} ${g('ry')}`,
        pairs: getAttrPairs(node, ['cx', 'cy', 'rx', 'ry']),
      };
    }
    if (tag === 'line') {
      return {
        geom: `L ${g('x1')} ${g('y1')} ${g('x2')} ${g('y2')}`,
        pairs: getAttrPairs(node, ['x1', 'y1', 'x2', 'y2']),
      };
    }
    if (tag === 'polygon') {
      const pts = (node.getAttribute('points') ?? '').trim().replace(/\s+/g, ' ');
      return { geom: `PG ${pts}`, pairs: getAttrPairs(node, ['points']) };
    }
    if (tag === 'polyline') {
      const pts = (node.getAttribute('points') ?? '').trim().replace(/\s+/g, ' ');
      return { geom: `PL ${pts}`, pairs: getAttrPairs(node, ['points']) };
    }
    if (tag === 'text') {
      const txt = (node.textContent ?? '').trim().replace(/"/g, "'");
      return { geom: `T ${g('x')} ${g('y')} "${txt}"`, pairs: getAttrPairs(node, ['x', 'y']) };
    }
    if (tag === 'path') {
      const d = cleanPathD(node.getAttribute('d'));
      const autoId = autoPathDefs.get(d);
      if (autoId && !node.hasAttribute('id')) {
        return {
          geom: `U ${autoId}`,
          pairs: getAttrPairs(node, ['d'], false),
          isUse: true,
          refId: autoId,
        };
      }
      return { geom: `P ${d}`, pairs: getAttrPairs(node, ['d']) };
    }
    if (tag === 'use') {
      const href = (node.getAttribute('href') ?? node.getAttribute('xlink:href') ?? '').replace(/^#/, '');
      const hasXY = node.hasAttribute('x') || node.hasAttribute('y');
      const xy = hasXY ? `${g('x')},${g('y')}` : '';
      return {
        geom: `U ${href}${xy ? ' ' + xy : ''}`,
        pairs: getAttrPairs(node, ['href', 'xlink:href', 'x', 'y']),
        isUse: true,
        refId: href,
        xy,
      };
    }
    return null;
  }

  for (const [d, id] of autoPathDefs.entries()) {
    lines.push(`DEF ${id} P ${d}`);
  }

  function walkGradient(node: Element, indent: string): void {
    const id = node.getAttribute('id') ?? 'g';
    const isUser = node.getAttribute('gradientUnits') === 'userSpaceOnUse';
    if (node.tagName === 'linearGradient') {
      const c = ['x1', 'y1', 'x2', 'y2'].map((k) => node.getAttribute(k) ?? '0').join(',');
      const dir =
        !isUser && c === '0%,0%,0%,100%'
          ? 'v'
          : !isUser && c === '0%,0%,100%,0%'
          ? 'h'
          : !isUser && c === '0%,0%,100%,100%'
          ? 'd'
          : c;
      lines.push(`${indent}G ${id} ${dir} ${mapStops(node)}`);
    } else {
      const c = ['cx', 'cy', 'r'].map((k) => node.getAttribute(k) ?? '50%').join(',');
      lines.push(`${indent}RG ${id} ${c} ${mapStops(node)}`);
    }
  }

  function walkDefs(defsNode: Element): void {
    for (const ch of Array.from(defsNode.children)) {
      if (ch.tagName === 'linearGradient' || ch.tagName === 'radialGradient') {
        walkGradient(ch, '');
      } else if (ch.hasAttribute('id')) {
        const id = ch.getAttribute('id') ?? '';
        if (ch.tagName === 'g') {
          lines.push(`DEF ${id} {${pairsToStr(getAttrPairs(ch, ['id']))}`);
          emitChildren(ch.children, '  ');
          lines.push('}');
        } else {
          const cloned = ch.cloneNode(true) as Element;
          cloned.removeAttribute('id');
          const it = nodeToItem(cloned);
          if (it) lines.push(`DEF ${id} ${it.geom}${pairsToStr(it.pairs)}`);
        }
      }
    }
  }

  function emitChildren(children: HTMLCollection, indent: string): void {
    const arr = Array.from(children).filter((c) => c.nodeType === 1 && c.tagName !== 'style');
    let i = 0;

    while (i < arr.length) {
      const node = arr[i]!;
      if (node.tagName === 'defs') {
        walkDefs(node);
        i++;
        continue;
      }
      if (node.tagName === 'linearGradient' || node.tagName === 'radialGradient') {
        walkGradient(node, indent);
        i++;
        continue;
      }
      if (node.tagName === 'g') {
        const gPairs = getAttrPairs(node);
        lines.push(`${indent}{${pairsToStr(gPairs)}`);
        emitChildren(node.children, indent + '  ');
        lines.push(`${indent}}`);
        i++;
        continue;
      }

      const item = nodeToItem(node);
      if (!item) {
        const rawHtml =
          node.outerHTML ??
          (typeof XMLSerializer !== 'undefined' ? new XMLSerializer().serializeToString(node) : '');
        lines.push(`${indent}RAW ${rawHtml.replace(/\n\s*/g, ' ')}`);
        i++;
        continue;
      }

      if (item.isUse && item.xy && !item.pairs.length && item.refId) {
        const coords = [item.xy];
        let j = i + 1;
        while (j < arr.length) {
          const cand = arr[j]!;
          const next = cand.tagName === 'use' ? nodeToItem(cand) : null;
          if (next?.isUse && next.refId === item.refId && next.xy && !next.pairs.length) {
            coords.push(next.xy);
            j++;
          } else {
            break;
          }
        }
        lines.push(`${indent}U ${item.refId} ${coords.join(' ')}`);
        i = j;
        continue;
      }

      const batch: EncodedItem[] = [item];
      let j = i + 1;
      while (j < arr.length && arr[j]!.tagName !== 'g' && arr[j]!.tagName !== 'defs') {
        const next = nodeToItem(arr[j]!);
        if (!next || next.isUse) break;
        batch.push(next);
        j++;
      }

      if (batch.length >= 2) {
        const firstMap = new Map(batch[0]!.pairs.filter(([k]) => INHERITABLE_SHORT.has(k)));
        const common: AttrPair[] = [];
        for (const [k, v] of firstMap.entries()) {
          if (batch.every((it) => it.pairs.some(([pk, pv]) => pk === k && pv === v))) {
            common.push([k, v]);
          }
        }
        const commonStr = common.map(([k, v]) => `${k}:${v}`).join(' ');
        if (common.length >= 2 || (common.length === 1 && commonStr.length * (batch.length - 1) > 8)) {
          const commonKeys = new Set(common.map(([k]) => k));
          lines.push(`${indent}{${pairsToStr(common)}`);
          for (const it of batch) {
            lines.push(`${indent}  ${it.geom}${pairsToStr(it.pairs.filter(([k]) => !commonKeys.has(k)))}`);
          }
          lines.push(`${indent}}`);
          i = j;
          continue;
        }
      }

      lines.push(`${indent}${item.geom}${pairsToStr(item.pairs)}`);
      i++;
    }
  }

  emitChildren(root.children, '');
  return lines.join('\n');
}

export function decodeAISVG(aiText: string): string {
  const rawLines = aiText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'));

  let vb = '0 0 100 100';
  let storyDur: number | null = null;
  let storyOnce = false;
  let maxTl = 0;
  let indentLevel = 1;

  const pal = new Map<string, string>();
  const defs: string[] = [];
  const cssParts: string[] = [];
  const usedMacros = new Set<AnimMacroKey>();
  const usedTimelines = new Map<string, { t0: number; t1: number }>();
  const body: string[] = [];
  const defTypes = new Map<string, 'unfilledPath' | 'other'>();

  const resolveColor = (c: string): string => pal.get(c) ?? c;

  function parseAnimToken(spec: string): { cls: string; style: string } | null {
    const m = spec.trim().match(/^([a-zA-Z0-9_]+)(?:@([\d.]+m?s))?(?:\+([\d.]+m?s))?(!)?$/);
    if (!m?.[1]) return null;
    const name = m[1] as AnimMacroKey;
    const macro = ANIM_MACROS[name];
    if (!macro) return null;

    const [, , dur, delay, once] = m;
    usedMacros.add(name);
    const st: string[] = [];
    if (dur) st.push(`animation-duration:${dur}`);
    if (delay) st.push(`animation-delay:${delay}`);
    if (once) st.push('animation-iteration-count:1;animation-fill-mode:forwards');
    return { cls: macro.cls, style: st.join(';') };
  }

  function parseAttrs(
    attrStr: string,
    isLinePath = false
  ): { attrStr: string; wrappers: string[] } {
    if (!attrStr) return { attrStr: '', wrappers: [] };
    const tokens = attrStr.match(/[\w-]+:(?:"[^"]*"|'[^']*'|[^\s]+(?:\([^)]*\))?)/g) ?? [];

    const extraClasses: string[] = [];
    const attrMap = new Map<string, string>();
    const wrappers: string[] = [];
    const animLayers: Array<{ cls: string; style: string }> = [];
    let tlLayer: string | null = null;
    let hasFill = false;
    let hasStroke = false;

    for (const tok of tokens) {
      const idx = tok.indexOf(':');
      const rawKey = tok.slice(0, idx);
      let val = tok.slice(idx + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (rawKey === 'an') {
        val.split(',').forEach((p) => {
          const a = parseAnimToken(p);
          if (a) animLayers.push(a);
        });
        continue;
      }

      if (rawKey === 'tl') {
        const tm = val.match(/^([\d.]+)-([\d.]+)$/);
        if (tm?.[1] && tm[2]) {
          const t0 = parseFloat(tm[1]);
          const t1 = parseFloat(tm[2]);
          maxTl = Math.max(maxTl, t1);
          const cls = `tl_${String(t0).replace('.', 'd')}_${String(t1).replace('.', 'd')}`;
          usedTimelines.set(cls, { t0, t1 });
          tlLayer = cls;
        }
        continue;
      }

      if (val.startsWith('$') && pal.has(val)) val = pal.get(val)!;
      if (val.startsWith('@')) val = `url(#${val.slice(1)})`;

      const key = REV_SHORT_ATTRS[rawKey] ?? rawKey;
      if (key === 'fill') hasFill = true;
      if (key === 'stroke') hasStroke = true;

      if (key === 'transform') {
        val = val
          .replace(/\brot\(([^)]+)\)/g, (_, a: string) => `rotate(${a.replace(/,/g, ' ')})`)
          .replace(/\btr\(([^)]+)\)/g, (_, a: string) => `translate(${a.replace(/,/g, ' ')})`)
          .replace(/\bsc\(([^)]+)\)/g, (_, a: string) => `scale(${a.replace(/,/g, ' ')})`);
      }

      if (key === 'class') {
        extraClasses.unshift(val);
        continue;
      }
      attrMap.set(key, val);
    }

    if (tlLayer) {
      if (animLayers.length || extraClasses.length) wrappers.push(`class="${tlLayer}"`);
      else extraClasses.push(tlLayer);
    }

    if (animLayers.length > 1) {
      for (let i = 0; i < animLayers.length - 1; i++) {
        const a = animLayers[i]!;
        wrappers.push(`class="${a.cls}"${a.style ? ` style="${a.style}"` : ''}`);
      }
    }

    if (animLayers.length) {
      const last = animLayers[animLayers.length - 1]!;
      extraClasses.push(last.cls);
      if (last.style) {
        const prev = attrMap.get('style');
        attrMap.set('style', (prev ? prev + ';' : '') + last.style);
      }
    }

    const out: string[] = [];
    if (extraClasses.length) out.push(`class="${escapeXml(extraClasses.join(' '))}"`);
    if (isLinePath && hasStroke && !hasFill) out.push('fill="none"');
    for (const [k, v] of attrMap.entries()) out.push(`${k}="${escapeXml(v)}"`);

    return { attrStr: out.join(' '), wrappers };
  }

  function buildShapeXml(
    cmd: string,
    argsStr: string,
    attrRaw: string,
    extraAttr = ''
  ): { xml: string; wrappers: string[] } {
    const args = argsStr.split(/\s+/);
    const parsed = parseAttrs(attrRaw, cmd === 'P' || cmd === 'PL');
    const aStr = [extraAttr, parsed.attrStr].filter(Boolean).join(' ');
    const sp = aStr ? ' ' + aStr : '';

    let xml = '';
    if (cmd === 'R') {
      xml = `<rect x="${args[0]}" y="${args[1]}" width="${args[2]}" height="${args[3]}"${
        args[4] ? ` rx="${args[4]}"` : ''
      }${sp} />`;
    } else if (cmd === 'C') {
      xml = `<circle cx="${args[0]}" cy="${args[1]}" r="${args[2]}"${sp} />`;
    } else if (cmd === 'E') {
      xml = `<ellipse cx="${args[0]}" cy="${args[1]}" rx="${args[2]}" ry="${args[3]}"${sp} />`;
    } else if (cmd === 'L') {
      xml = `<line x1="${args[0]}" y1="${args[1]}" x2="${args[2]}" y2="${args[3]}"${sp} />`;
    } else if (cmd === 'PG') {
      xml = `<polygon points="${argsStr}"${sp} />`;
    } else if (cmd === 'PL') {
      xml = `<polyline points="${argsStr}"${sp} />`;
    } else if (cmd === 'P') {
      xml = `<path d="${escapeXml(argsStr)}"${sp} />`;
    } else if (cmd === 'T') {
      const m = argsStr.match(/^(\S+)\s+(\S+)\s+"([\s\S]*)"$/);
      if (m) xml = `<text x="${m[1]}" y="${m[2]}"${sp}>${escapeXml(m[3] ?? '')}</text>`;
    }

    return { xml, wrappers: parsed.wrappers };
  }

  const stack: Array<{ isDef: boolean; closes: number }> = [];
  let inDefBlock = false;
  let defBuffer: string[] = [];

  for (const line of rawLines) {
    const outArr = inDefBlock ? defBuffer : body;
    const pad = (): string => '  '.repeat(inDefBlock ? indentLevel + 1 : indentLevel);

    if (line.startsWith('V ')) {
      const nums = line
        .slice(2)
        .trim()
        .split(/\s+/)
        .filter((n) => /^-?\d+(\.\d+)?$/.test(n));
      if (nums.length >= 2) {
        vb = nums.length === 2 ? `0 0 ${nums[0]} ${nums[1]}` : nums.slice(0, 4).join(' ');
      }
      continue;
    }

    if (line.startsWith('STORY ')) {
      const m = line.slice(6).trim().match(/^([\d.]+)s?(!)?$/);
      if (m?.[1]) {
        storyDur = parseFloat(m[1]);
        storyOnce = Boolean(m[2]);
      }
      continue;
    }

    if (line.startsWith('PAL ')) {
      line
        .slice(4)
        .trim()
        .split(/\s+/)
        .forEach((p) => {
          const [k, v] = p.split(':');
          if (k && v) pal.set(k, v);
        });
      continue;
    }

    if (line.startsWith('G ') || line.startsWith('RG ')) {
      const isRad = line.startsWith('RG ');
      const parts = line.split(/\s+/);
      const id = parts[1] ?? 'g';
      let dir = parts[2] ?? '';
      if (dir === 'v') dir = '0%,0%,0%,100%';
      else if (dir === 'h') dir = '0%,0%,100%,0%';
      else if (dir === 'd') dir = '0%,0%,100%,100%';

      const c = dir.split(',');
      const useUser = c.some((v) => v && !v.includes('%') && parseFloat(v) > 1);
      const gu = useUser ? ' gradientUnits="userSpaceOnUse"' : '';

      const stops = parts
        .slice(3)
        .map((s, idx, arr) => {
          const [colOp = '', op] = s.split('*');
          const [colRaw = '', off] = colOp.split('@');
          const fallbackOff = Math.round((idx / Math.max(1, arr.length - 1)) * 100) + '%';
          return `      <stop offset="${off || fallbackOff}" stop-color="${resolveColor(colRaw)}"${
            op ? ` stop-opacity="${op}"` : ''
          } />`;
        })
        .join('\n');

      defs.push(
        isRad
          ? `    <radialGradient id="${id}" cx="${c[0] || '50%'}" cy="${c[1] || '50%'}" r="${
              c[2] || '50%'
            }"${gu}>\n${stops}\n    </radialGradient>`
          : `    <linearGradient id="${id}" x1="${c[0] || '0%'}" y1="${c[1] || '0%'}" x2="${
              c[2] || '0%'
            }" y2="${c[3] || '100%'}"${gu}>\n${stops}\n    </linearGradient>`
      );
      continue;
    }

    if (line.startsWith('DEF ')) {
      const rest = line.slice(4).trim();
      const sp = rest.indexOf(' ');
      const id = sp === -1 ? rest : rest.slice(0, sp);
      const after = sp === -1 ? '' : rest.slice(sp + 1).trim();

      if (!after || after.startsWith('{')) {
        const [, attrPart] = splitPipeOutsideQuotes(after);
        const parsed = parseAttrs(attrPart);
        inDefBlock = true;
        defBuffer = [];
        defBuffer.push(`    <g id="${escapeXml(id)}"${parsed.attrStr ? ' ' + parsed.attrStr : ''}>`);
        parsed.wrappers.forEach((w) => {
          defBuffer.push(`      <g ${w}>`);
          indentLevel++;
        });
        indentLevel++;
        stack.push({ isDef: true, closes: 1 + parsed.wrappers.length });
        defTypes.set(id, 'other');
      } else {
        const [gRaw, aRaw] = splitPipeOutsideQuotes(after);
        const gTrim = gRaw.trim();
        const s2 = gTrim.indexOf(' ');
        const cmd = s2 === -1 ? gTrim : gTrim.slice(0, s2);
        const argsStr = s2 === -1 ? '' : gTrim.slice(s2 + 1).trim();
        const { xml } = buildShapeXml(cmd, argsStr, aRaw, `id="${escapeXml(id)}"`);
        if (xml) defs.push(`    ${xml}`);
        defTypes.set(id, (cmd === 'P' || cmd === 'PL') && !/\bf:/.test(aRaw) ? 'unfilledPath' : 'other');
      }
      continue;
    }

    if (line.startsWith('{')) {
      const [, attrPart] = splitPipeOutsideQuotes(line);
      const parsed = parseAttrs(attrPart);
      parsed.wrappers.forEach((w) => {
        outArr.push(`${pad()}<g ${w}>`);
        indentLevel++;
      });
      outArr.push(`${pad()}<g${parsed.attrStr ? ' ' + parsed.attrStr : ''}>`);
      indentLevel++;
      stack.push({ isDef: false, closes: 1 + parsed.wrappers.length });
      continue;
    }

    if (line === '}') {
      const top = stack.pop() ?? { isDef: false, closes: 1 };
      for (let c = 0; c < top.closes; c++) {
        indentLevel = Math.max(1, indentLevel - 1);
        outArr.push(`${pad()}</g>`);
      }
      if (top.isDef && inDefBlock) {
        defs.push(defBuffer.join('\n'));
        inDefBlock = false;
        defBuffer = [];
      }
      continue;
    }

    if (line.startsWith('CSS ')) {
      cssParts.push(line.slice(4));
      continue;
    }
    if (line.startsWith('RAW ')) {
      outArr.push(`${pad()}${line.slice(4)}`);
      continue;
    }

    const [geomRaw, attrRaw] = splitPipeOutsideQuotes(line);
    const geom = geomRaw.trim();
    const spIdx = geom.indexOf(' ');
    const cmd = spIdx === -1 ? geom : geom.slice(0, spIdx);
    const argsStr = spIdx === -1 ? '' : geom.slice(spIdx + 1).trim();

    if (cmd === 'U') {
      const uTokens = argsStr.split(/\s+/);
      const id = uTokens[0] ?? '';
      const coords = uTokens.slice(1);
      const parsed = parseAttrs(attrRaw, defTypes.get(id) === 'unfilledPath');

      const emitUse = (xy: string | null): void => {
        const xyAttr = xy
          ? (() => {
              const [x, y] = xy.split(',');
              return `x="${x}" y="${y}"`;
            })()
          : '';
        const aStr = [`href="#${escapeXml(id)}"`, xyAttr, parsed.attrStr]
          .filter(Boolean)
          .join(' ');
        parsed.wrappers.forEach((w) => {
          outArr.push(`${pad()}<g ${w}>`);
          indentLevel++;
        });
        outArr.push(`${pad()}<use ${aStr} />`);
        for (let i = parsed.wrappers.length - 1; i >= 0; i--) {
          indentLevel = Math.max(1, indentLevel - 1);
          outArr.push(`${pad()}</g>`);
        }
      };

      if (coords.length) coords.forEach(emitUse);
      else emitUse(null);
      continue;
    }

    const { xml, wrappers } = buildShapeXml(cmd, argsStr, attrRaw);
    if (xml) {
      wrappers.forEach((w) => {
        outArr.push(`${pad()}<g ${w}>`);
        indentLevel++;
      });
      outArr.push(`${pad()}${xml}`);
      for (let i = wrappers.length - 1; i >= 0; i--) {
        indentLevel = Math.max(1, indentLevel - 1);
        outArr.push(`${pad()}</g>`);
      }
    }
  }

  for (const m of usedMacros) cssParts.push(ANIM_MACROS[m].css);
  const finalDur = storyDur || maxTl || 10;
  for (const [, { t0, t1 }] of usedTimelines.entries()) {
    cssParts.push(buildTimelineCss(t0, t1, finalDur, storyOnce).css);
  }

  const styleBlock = cssParts.length ? `  <style>${cssParts.join('')}</style>\n` : '';
  const defsBlock = defs.length ? `  <defs>\n${defs.join('\n')}\n  </defs>\n` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">\n${defsBlock}${styleBlock}${body.join('\n')}\n</svg>`;
}