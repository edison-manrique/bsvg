import { Component } from 'solid-js';
import styles from './SvgPanel.module.css';
import { downloadFile } from '../../utils/download';

interface SvgPanelProps {
  svgContent: string;
  onSvgChange: (val: string) => void;
  error?: string | null;
  onOpenFullscreen: (svg: string, title: string) => void;
}

export const SvgPanel: Component<SvgPanelProps> = (props) => {
  let fileInputRef!: HTMLInputElement;

  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const text = await input.files[0].text();
      props.onSvgChange(text);
      input.value = '';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(props.svgContent);
  };

  const downloadSvg = () => {
    downloadFile(props.svgContent, 'image/svg+xml', 'vector.svg');
  };

  return (
    <div class={styles.panel}>
      <div class={styles.panelHead}>
        <div class={styles.titleGroup}>
          <span class={styles.title}>1. SVG Nativo</span>
          <span class={styles.badge}>W3C XML</span>
        </div>
        <div class={styles.actions}>
          <input
            type="file"
            accept=".svg,image/svg+xml"
            ref={fileInputRef}
            class={styles.hiddenInput}
            onChange={handleFileUpload}
          />
          <button
            class={styles.iconBtn}
            onClick={() => fileInputRef.click()}
            title="Cargar archivo SVG desde disco"
          >
            📂 Abrir
          </button>
          <button
            class={styles.iconBtn}
            onClick={copyToClipboard}
            title="Copiar código SVG"
          >
            📋 Copiar
          </button>
          <button
            class={styles.iconBtn}
            onClick={downloadSvg}
            title="Descargar archivo .svg"
          >
            💾 Guardar
          </button>
          <button
            class={styles.iconBtn}
            onClick={() => props.onOpenFullscreen(props.svgContent, 'SVG Nativo')}
            title="Ver a pantalla completa"
          >
            ⤢ Zoom
          </button>
        </div>
      </div>

      <div
        class={`${styles.previewContainer} checkerboard-bg`}
        onClick={() => props.onOpenFullscreen(props.svgContent, 'SVG Nativo')}
      >
        <div class={styles.previewInner} innerHTML={props.svgContent} />
        <span class={styles.previewHint}>Clic para ampliar</span>
      </div>

      <textarea
        class={styles.editor}
        value={props.svgContent}
        onInput={(e) => props.onSvgChange(e.currentTarget.value)}
        placeholder="Introduce o pega código SVG aquí..."
        spellcheck={false}
      />

      <div class={styles.errorText}>
        {props.error ? `⚠ ${props.error}` : ''}
      </div>
    </div>
  );
};

