import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import styles from './FullscreenViewer.module.css';

interface FullscreenViewerProps {
  svgContent: string;
  title: string;
  onClose: () => void;
}

export const FullscreenViewer: Component<FullscreenViewerProps> = (props) => {
  const [zoom, setZoom] = createSignal(1);
  const [bgMode, setBgMode] = createSignal<'checker' | 'dark' | 'light'>('checker');
  const [showBorder, setShowBorder] = createSignal(true);
  const [isPaused, setIsPaused] = createSignal(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') props.onClose();
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  const getBgClass = () => {
    switch (bgMode()) {
      case 'dark':
        return styles.bgDark;
      case 'light':
        return styles.bgLight;
      default:
        return styles.bgChecker;
    }
  };

  return (
    <div class={styles.modalOverlay}>
      <div class={styles.topBar}>
        <div class={styles.titleArea}>
          <span class={styles.viewerTitle}>Visor de Detalle: {props.title}</span>
        </div>

        <div class={styles.controlsGroup}>
          <button
            class={styles.ctrlBtn}
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.25))}
            title="Reducir Zoom"
          >
            🔍 -
          </button>
          <button
            class={styles.ctrlBtn}
            onClick={() => setZoom(1)}
            title="Restablecer Zoom"
          >
            {Math.round(zoom() * 100)}%
          </button>
          <button
            class={styles.ctrlBtn}
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            title="Aumentar Zoom"
          >
            🔍 +
          </button>

          <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>

          <button
            class={`${styles.ctrlBtn} ${bgMode() === 'checker' ? styles.active : ''}`}
            onClick={() => setBgMode('checker')}
            title="Fondo Cuadrícula"
          >
            🏁 Cuadrícula
          </button>
          <button
            class={`${styles.ctrlBtn} ${bgMode() === 'dark' ? styles.active : ''}`}
            onClick={() => setBgMode('dark')}
            title="Fondo Oscuro"
          >
            🌑 Oscuro
          </button>
          <button
            class={`${styles.ctrlBtn} ${bgMode() === 'light' ? styles.active : ''}`}
            onClick={() => setBgMode('light')}
            title="Fondo Claro"
          >
            ☀️ Claro
          </button>

          <span style={{ color: 'var(--border)', margin: '0 4px' }}>|</span>

          <button
            class={`${styles.ctrlBtn} ${showBorder() ? styles.active : ''}`}
            onClick={() => setShowBorder(!showBorder())}
            title="Conmutar marco delimitador"
          >
            📐 Bounding Box
          </button>

          <button
            class={`${styles.ctrlBtn} ${isPaused() ? styles.active : ''}`}
            onClick={() => setIsPaused(!isPaused())}
            title="Pausar o reanudar animaciones CSS"
          >
            {isPaused() ? '▶ Reanudar' : '⏸ Pausar'}
          </button>

          <button
            class={styles.closeBtn}
            onClick={props.onClose}
            title="Cerrar visor (Esc)"
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      <div class={`${styles.stageArea} ${getBgClass()}`}>
        <div
          class={`${styles.canvasBox} ${showBorder() ? styles.showBorders : ''}`}
          style={{
            transform: `scale(${zoom()})`,
            'animation-play-state': isPaused() ? 'paused' : 'running',
          }}
          innerHTML={props.svgContent}
        />
      </div>

      <div class={styles.footBar}>
        <span>Usa los controles de la barra superior o presiona <b>Esc</b> para salir</span>
        <span>Renderizado en tiempo real por el motor SolidJS</span>
      </div>
    </div>
  );
};

