import { Component, createSignal, onMount, Show } from 'solid-js';
import {
  decodeAISVG,
  encodeAISVG,
  decodeBSVG,
  encodeBSVG,
  PRESETS,
  PresetItem,
} from 'bsvg';
import styles from './App.module.css';
import { Header } from './components/Header/Header';
import { StatsBar } from './components/StatsBar/StatsBar';
import { SvgPanel } from './components/Panels/SvgPanel';
import { AisvgPanel } from './components/Panels/AisvgPanel';
import { BsvgPanel } from './components/Panels/BsvgPanel';
import { FullscreenViewer } from './components/FullscreenViewer/FullscreenViewer';

export const App: Component = () => {
  const [selectedPreset, setSelectedPreset] = createSignal<string>('cristal');
  const [gameMode, setGameMode] = createSignal<boolean>(true);

  // Content states
  const [svgContent, setSvgContent] = createSignal<string>('');
  const [aisvgContent, setAisvgContent] = createSignal<string>('');
  const [decodedAisvg, setDecodedAisvg] = createSignal<string>('');
  const [bsvgRawBytes, setBsvgRawBytes] = createSignal<Uint8Array | null>(null);
  const [bsvgFinalBytes, setBsvgFinalBytes] = createSignal<Uint8Array | null>(null);
  const [decodedBsvg, setDecodedBsvg] = createSignal<string>('');

  // Error states
  const [svgError, setSvgError] = createSignal<string | null>(null);
  const [aisvgError, setAisvgError] = createSignal<string | null>(null);
  const [bsvgError, setBsvgError] = createSignal<string | null>(null);

  // Fullscreen Viewer state
  const [fullscreenData, setFullscreenData] = createSignal<{
    isOpen: boolean;
    svg: string;
    title: string;
  }>({
    isOpen: false,
    svg: '',
    title: '',
  });

  // Pipeline from SVG to AISVG and BSVG
  const syncFromSvg = async (svg: string) => {
    setSvgContent(svg);
    setSvgError(null);

    // 1. Encode to AISVG
    try {
      const ai = encodeAISVG(svg, gameMode());
      setAisvgContent(ai);
      setDecodedAisvg(decodeAISVG(ai));
      setAisvgError(null);
    } catch (err: unknown) {
      setAisvgError(err instanceof Error ? err.message : String(err));
    }

    // 2. Encode to BSVG (Binary)
    try {
      const res = await encodeBSVG(svg, gameMode());
      setBsvgRawBytes(res.rawBytes);
      setBsvgFinalBytes(res.finalBytes);
      const dec = await decodeBSVG(res.finalBytes);
      setDecodedBsvg(dec);
      setBsvgError(null);
    } catch (err: unknown) {
      console.error('Error encoding/decoding BSVG:', err);
      setBsvgError(err instanceof Error ? err.message : String(err));
    }
  };

  // Pipeline from AISVG to SVG and BSVG
  const syncFromAisvg = async (ai: string) => {
    setAisvgContent(ai);
    try {
      const svg = decodeAISVG(ai);
      setDecodedAisvg(svg);
      setSvgContent(svg);
      setAisvgError(null);
      setSvgError(null);

      // Encode to BSVG
      const res = await encodeBSVG(svg, gameMode());
      setBsvgRawBytes(res.rawBytes);
      setBsvgFinalBytes(res.finalBytes);
      const dec = await decodeBSVG(res.finalBytes);
      setDecodedBsvg(dec);
      setBsvgError(null);
    } catch (err: unknown) {
      console.error('Error in syncFromAisvg:', err);
      setAisvgError(err instanceof Error ? err.message : String(err));
    }
  };

  // Pipeline from uploaded BSVG binary
  const syncFromBsvgUpload = async (bytes: Uint8Array) => {
    try {
      setBsvgFinalBytes(bytes);
      const svg = await decodeBSVG(bytes);
      setDecodedBsvg(svg);
      setBsvgError(null);
      await syncFromSvg(svg);
    } catch (err: unknown) {
      setBsvgError(err instanceof Error ? err.message : String(err));
    }
  };

  // Load preset
  const loadPreset = (preset: PresetItem) => {
    setSelectedPreset(preset.id);
    try {
      const svg = decodeAISVG(preset.aisvg);
      syncFromSvg(svg);
    } catch (err: unknown) {
      setSvgError(err instanceof Error ? err.message : String(err));
    }
  };

  onMount(() => {
    const defaultPreset = PRESETS.find((p) => p.id === 'cristal') ?? PRESETS[0]!;
    loadPreset(defaultPreset);
  });

  return (
    <div class={styles.appContainer}>
      <Header
        selectedPreset={selectedPreset()}
        onSelectPreset={loadPreset}
        gameMode={gameMode()}
        onToggleGameMode={(val) => {
          setGameMode(val);
          if (svgContent()) syncFromSvg(svgContent());
        }}
        onReset={() => {
          const p = PRESETS.find((item) => item.id === selectedPreset());
          if (p) loadPreset(p);
        }}
      />

      <StatsBar
        svgBytes={new TextEncoder().encode(svgContent()).length}
        aisvgChars={aisvgContent().length}
        bsvgRawBytes={bsvgRawBytes()?.length ?? 0}
        bsvgCompBytes={bsvgFinalBytes()?.length ?? 0}
      />

      <main class={styles.panelsGrid}>
        <SvgPanel
          svgContent={svgContent()}
          onSvgChange={syncFromSvg}
          error={svgError()}
          onOpenFullscreen={(svg, title) =>
            setFullscreenData({ isOpen: true, svg, title })
          }
        />

        <AisvgPanel
          aisvgContent={aisvgContent()}
          decodedSvg={decodedAisvg()}
          onAisvgChange={syncFromAisvg}
          error={aisvgError()}
          onOpenFullscreen={(svg, title) =>
            setFullscreenData({ isOpen: true, svg, title })
          }
        />

        <BsvgPanel
          finalBytes={bsvgFinalBytes()}
          decodedSvg={decodedBsvg()}
          onUploadBsvg={syncFromBsvgUpload}
          error={bsvgError()}
          onOpenFullscreen={(svg, title) =>
            setFullscreenData({ isOpen: true, svg, title })
          }
        />
      </main>

      <Show when={fullscreenData().isOpen}>
        <FullscreenViewer
          svgContent={fullscreenData().svg}
          title={fullscreenData().title}
          onClose={() =>
            setFullscreenData({ isOpen: false, svg: '', title: '' })
          }
        />
      </Show>
    </div>
  );
};

