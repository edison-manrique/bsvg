import styles from './BsvgPanel.module.css';
import { formatHexDump } from '../../utils/hex';
import { downloadFile } from '../../utils/download';
export const BsvgPanel = (props) => {
    let fileInputRef;
    const handleFileUpload = async (e) => {
        const input = e.target;
        if (input.files && input.files[0]) {
            const buffer = await input.files[0].arrayBuffer();
            props.onUploadBsvg(new Uint8Array(buffer));
            input.value = '';
        }
    };
    const copyHexDump = () => {
        if (props.finalBytes) {
            navigator.clipboard.writeText(formatHexDump(props.finalBytes));
        }
    };
    const downloadBsvg = () => {
        if (props.finalBytes) {
            downloadFile(props.finalBytes, 'application/octet-stream', 'vector.bsvg');
        }
    };
    return (<div class={styles.panel}>
      <div class={styles.panelHead}>
        <div class={styles.titleGroup}>
          <span class={styles.title}>3. BSVG Binario</span>
          <span class={styles.badge}>BSV4 Zero-Heap</span>
        </div>
        <div class={styles.actions}>
          <input type="file" accept=".bsvg,application/octet-stream" ref={fileInputRef} class={styles.hiddenInput} onChange={handleFileUpload}/>
          <button class={styles.iconBtn} onClick={() => fileInputRef.click()} title="Cargar archivo binario .bsvg desde disco">
            📂 Abrir
          </button>
          <button class={styles.iconBtn} onClick={copyHexDump} title="Copiar volcado hexadecimal">
            📋 Hex
          </button>
          <button class={styles.iconBtn} onClick={downloadBsvg} title="Descargar archivo binario .bsvg">
            💾 Guardar
          </button>
          <button class={styles.iconBtn} onClick={() => props.onOpenFullscreen(props.decodedSvg, 'BSVG Binario Decodificado')} title="Ver a pantalla completa">
            ⤢ Zoom
          </button>
        </div>
      </div>

      <div class={`${styles.previewContainer} checkerboard-bg`} onClick={() => props.onOpenFullscreen(props.decodedSvg, 'BSVG Binario Decodificado')}>
        <div class={styles.previewInner} innerHTML={props.decodedSvg}/>
        <span class={styles.previewHint}>Clic para ampliar</span>
      </div>

      <div class={styles.hexViewer}>
        {props.finalBytes
            ? formatHexDump(props.finalBytes)
            : '(Sin datos binarios)'}
      </div>

      <div class={styles.errorText}>
        {props.error ? `⚠ ${props.error}` : ''}
      </div>
    </div>);
};
