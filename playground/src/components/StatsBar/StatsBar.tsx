import { Component } from 'solid-js';
import styles from './StatsBar.module.css';

interface StatsBarProps {
  svgBytes: number;
  aisvgChars: number;
  bsvgRawBytes: number;
  bsvgCompBytes: number;
}

export const StatsBar: Component<StatsBarProps> = (props) => {
  const aisvgSavings = () => {
    if (!props.svgBytes || !props.aisvgChars) return 0;
    const diff = ((props.svgBytes - props.aisvgChars) / props.svgBytes) * 100;
    return Math.round(diff);
  };

  const bsvgSavings = () => {
    if (!props.svgBytes || !props.bsvgCompBytes) return 0;
    const diff = ((props.svgBytes - props.bsvgCompBytes) / props.svgBytes) * 100;
    return Math.round(diff);
  };

  return (
    <div class={styles.statsGrid}>
      <div class={styles.card}>
        <div class={styles.info}>
          <span class={styles.label}>1. SVG Original</span>
          <span class={styles.val}>{props.svgBytes.toLocaleString()} B</span>
          <span class={styles.sub} style={{ color: 'var(--cyan)' }}>
            W3C XML Dom
          </span>
        </div>
        <span class={styles.icon}>🎨</span>
      </div>

      <div class={styles.card}>
        <div class={styles.info}>
          <span class={styles.label}>2. AISVG (Tokens DSL)</span>
          <span class={styles.val}>{props.aisvgChars.toLocaleString()} car.</span>
          <span
            class={styles.sub}
            style={{
              color: aisvgSavings() >= 0 ? 'var(--green)' : 'var(--red)',
            }}
          >
            {aisvgSavings() >= 0 ? `-${aisvgSavings()}% tokens` : `+${Math.abs(aisvgSavings())}%`}
          </span>
        </div>
        <span class={styles.icon}>🤖</span>
      </div>

      <div class={styles.card}>
        <div class={styles.info}>
          <span class={styles.label}>3. BSVG Binario (BSV4)</span>
          <span class={styles.val}>
            {props.bsvgCompBytes.toLocaleString()} B
          </span>
          <span class={styles.sub} style={{ color: 'var(--text-muted)' }}>
            Raw: {props.bsvgRawBytes.toLocaleString()} B
          </span>
        </div>
        <span class={styles.icon}>⚡</span>
      </div>

      <div class={styles.card}>
        <div class={styles.info}>
          <span class={styles.label}>Compresión Global</span>
          <span
            class={styles.val}
            style={{
              color: bsvgSavings() >= 50 ? 'var(--green)' : 'var(--amber)',
            }}
          >
            -{bsvgSavings()}%
          </span>
          <span class={styles.sub}>
            Ratio: {(props.svgBytes / (props.bsvgCompBytes || 1)).toFixed(1)}x
          </span>
        </div>
        <span class={styles.icon}>📦</span>
      </div>
    </div>
  );
};

