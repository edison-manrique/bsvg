import { Component } from 'solid-js';
import styles from './AisvgPanel.module.css';
import { downloadFile } from '../../utils/download';

interface AisvgPanelProps {
  aisvgContent: string;
  decodedSvg: string;
  onAisvgChange: (val: string) => void;
  error?: string | null;
  onOpenFullscreen: (svg: string, title: string) => void;
}

export const AisvgPanel: Component<AisvgPanelProps> = (props) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(props.aisvgContent);
  };

  const downloadAisvg = () => {
    downloadFile(props.aisvgContent, 'text/plain', 'vector.aisvg');
  };

  return (
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <div class={styles.titleGroup}>
          <span class={styles.title}>2. AISVG (AI DSL)</span>
          <span class={styles.badge}>Tokens Minimal</span>
        </div>
        <div class={styles.actions}>
          <button
            class={styles.iconBtn}
            onClick={copyToClipboard}
            title="Copiar texto AISVG"
          >
            📋 Copiar
          </button>
          <button
            class={styles.iconBtn}
            onClick={downloadAisvg}
            title="Descargar archivo .aisvg"
          >
            💾 Guardar
          </button>
          <button
            class={styles.iconBtn}
            onClick={() =>
              props.onOpenFullscreen(props.decodedSvg, 'AISVG Decodificado')
            }
            title="Ver a pantalla completa"
          >
            ⤢ Zoom
          </button>
        </div>
      </div>

      <div
        class={`${styles.previewContainer} checkerboard-bg`}
        onClick={() =>
          props.onOpenFullscreen(props.decodedSvg, 'AISVG Decodificado')
        }
      >
        <div class={styles.previewInner} innerHTML={props.decodedSvg} />
        <span class={styles.previewHint}>Clic para ampliar</span>
      </div>

      <textarea
        class={styles.editor}
        value={props.aisvgContent}
        onInput={(e) => props.onAisvgChange(e.currentTarget.value)}
        placeholder="Introduce o pega código AISVG aquí..."
        spellcheck={false}
      />

      <div class={styles.errorText}>
        {props.error ? `⚠ ${props.error}` : ''}
      </div>
    </div>
  );
};

