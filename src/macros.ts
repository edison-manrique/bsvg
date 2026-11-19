import type {
  AnimMacroDef,
  AnimMacroKey,
  ExtractedMacros,
  ExtractedTimelines,
} from './types';

export const ANIM_MACROS: Record<AnimMacroKey, AnimMacroDef> = {
  float: {
    cls: 'an_float',
    css: '.an_float{animation:kf_float 3.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes kf_float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-11px) rotate(1.5deg)}}',
  },
  blink: {
    cls: 'an_blink',
    css: '.an_blink{animation:kf_blink 4.5s infinite;transform-box:fill-box;transform-origin:center}@keyframes kf_blink{0%,90%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}',
  },
  swayL: {
    cls: 'an_swayL',
    css: '.an_swayL{animation:kf_swayL 3s ease-in-out infinite;transform-box:fill-box;transform-origin:right center}@keyframes kf_swayL{0%,100%{transform:rotate(0)}50%{transform:rotate(-6deg)}}',
  },
  swayR: {
    cls: 'an_swayR',
    css: '.an_swayR{animation:kf_swayR 3s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}@keyframes kf_swayR{0%,100%{transform:rotate(0)}50%{transform:rotate(6deg)}}',
  },
  wag: {
    cls: 'an_wag',
    css: '.an_wag{animation:kf_wag 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:10% 80%}@keyframes kf_wag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(7deg)}}',
  },
  pulse: {
    cls: 'an_pulse',
    css: '.an_pulse{animation:kf_pulse 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes kf_pulse{0%,100%{transform:scale(.9);opacity:.85}50%{transform:scale(1.08);opacity:1}}',
  },
  rise: {
    cls: 'an_rise',
    css: '.an_rise{animation:kf_rise 5.5s linear infinite;opacity:0}@keyframes kf_rise{0%{transform:translateY(0);opacity:0}15%{opacity:.75}85%{opacity:.6}100%{transform:translateY(-220px);opacity:0}}',
  },
  spin: {
    cls: 'an_spin',
    css: '.an_spin{animation:kf_spin 6s linear infinite;transform-box:fill-box;transform-origin:center}@keyframes kf_spin{to{transform:rotate(360deg)}}',
  },
  bob: {
    cls: 'an_bob',
    css: '.an_bob{animation:kf_bob 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes kf_bob{0%,100%{transform:translateY(0) rotate(-1.6deg)}50%{transform:translateY(-7px) rotate(1.8deg)}}',
  },
  wave: {
    cls: 'an_wave',
    css: '.an_wave{animation:kf_wave 3.4s ease-in-out infinite}@keyframes kf_wave{0%,100%{transform:translate(0,0)}25%{transform:translate(12px,-3px)}50%{transform:translate(0,-5px)}75%{transform:translate(-12px,-2px)}}',
  },
  driftR: {
    cls: 'an_driftR',
    css: '.an_driftR{animation:kf_driftR 10s linear infinite}@keyframes kf_driftR{0%{transform:translateX(-48px);opacity:0}12%,88%{opacity:1}100%{transform:translateX(48px);opacity:0}}',
  },
  driftL: {
    cls: 'an_driftL',
    css: '.an_driftL{animation:kf_driftL 10s linear infinite}@keyframes kf_driftL{0%{transform:translateX(48px);opacity:0}12%,88%{opacity:1}100%{transform:translateX(-48px);opacity:0}}',
  },
  shake: {
    cls: 'an_shake',
    css: '.an_shake{animation:kf_shake .45s linear infinite}@keyframes kf_shake{0%,100%{transform:translate(0,0)}25%{transform:translate(-3px,2px)}50%{transform:translate(3px,-2px)}75%{transform:translate(-2px,-2px)}}',
  },
  flap: {
    cls: 'an_flap',
    css: '.an_flap{animation:kf_flap .7s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes kf_flap{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.35)}}',
  },
  pop: {
    cls: 'an_pop',
    css: '.an_pop{animation:kf_pop .55s cubic-bezier(.2,1.4,.4,1) both;transform-box:fill-box;transform-origin:center}@keyframes kf_pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}',
  },
  fadeIn: {
    cls: 'an_fadeIn',
    css: '.an_fadeIn{animation:kf_fadeIn .8s ease-out both}@keyframes kf_fadeIn{0%{opacity:0}100%{opacity:1}}',
  },
};

export const MACRO_KEYS = Object.keys(ANIM_MACROS) as AnimMacroKey[];

export function normCss(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^|[^0-9])0+\./g, '$1.');
}

export function extractMacrosFromCss(cssRaw: string): ExtractedMacros {
  let css = normCss(cssRaw);
  let mask = 0;
  const detected = new Set<AnimMacroKey>();

  MACRO_KEYS.forEach((key, idx) => {
    const target = normCss(ANIM_MACROS[key].css);
    if (css.includes(target)) {
      css = css.replace(target, '');
      mask |= 1 << idx;
      detected.add(key);
    }
  });

  return { remainingCss: css.trim(), mask, detected };
}

export function extractTimelinesFromCss(css: string): ExtractedTimelines {
  let out = css;
  let storyHeader: string | null = null;
  const tlClasses = new Set<string>();

  out = out.replace(
    /\.tl_([0-9d]+)_([0-9d]+)\{animation:kf_tl_\1_\2 ([\d.]+)s linear (infinite|1 forwards)\}/g,
    (_, s0: string, s1: string, dur: string, iter: string) => {
      tlClasses.add(`tl_${s0}_${s1}`);
      if (!storyHeader) {
        storyHeader = `STORY ${dur}s${iter === 'infinite' ? '' : '!'}`;
      }
      return '';
    }
  );

  let idx: number;
  while ((idx = out.indexOf('@keyframes kf_tl_')) !== -1) {
    const open = out.indexOf('{', idx);
    if (open === -1) break;
    let depth = 0;
    let end = open;
    for (; end < out.length; end++) {
      if (out[end] === '{') depth++;
      else if (out[end] === '}' && --depth === 0) {
        end++;
        break;
      }
    }
    out = out.slice(0, idx) + out.slice(end);
  }

  return { remainingCss: out.trim(), storyHeader, tlClasses };
}

export function buildTimelineCss(
  t0: number,
  t1: number,
  total: number,
  once: boolean
): { cls: string; css: string } {
  const id = `${String(t0).replace('.', 'd')}_${String(t1).replace('.', 'd')}`;
  const cls = `tl_${id}`;
  const kf = `kf_${cls}`;
  const dur = Math.max(0.5, total);
  const f = Math.min(0.35, Math.max(0.05, (t1 - t0) * 0.18));
  const p = (sec: number): number =>
    Math.min(100, Math.max(0, Number(((sec / dur) * 100).toFixed(2))));

  const p0 = p(t0);
  const pIn = p(t0 + f);
  const pOut = p(t1 - f);
  const p1 = p(t1);

  let frames = '';
  if (t0 <= 0.01) {
    frames =
      p1 >= 99.9
        ? '0%,100%{opacity:1}'
        : `0%,${pOut}%{opacity:1}${p1}%,100%{opacity:0;pointer-events:none}`;
  } else if (t1 >= dur - 0.01) {
    frames = `0%,${p0}%{opacity:0;pointer-events:none}${pIn}%,100%{opacity:1;pointer-events:auto}`;
  } else {
    frames = `0%,${p0}%{opacity:0;pointer-events:none}${pIn}%,${pOut}%{opacity:1;pointer-events:auto}${p1}%,100%{opacity:0;pointer-events:none}`;
  }

  return {
    cls,
    css: `.${cls}{animation:${kf} ${dur}s linear ${once ? '1 forwards' : 'infinite'}}@keyframes ${kf}{${frames}}`,
  };
}