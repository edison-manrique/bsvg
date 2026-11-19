import { Component, For } from 'solid-js';
import { PRESETS, PresetItem } from 'bsvg';
import styles from './Header.module.css';

interface HeaderProps {
  selectedPreset: string;
  onSelectPreset: (preset: PresetItem) => void;
  gameMode: boolean;
  onToggleGameMode: (val: boolean) => void;
  onReset: () => void;
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header class={styles.header}>
      <div class={styles.brand}>
        <h1 class={styles.title}>BSVG Codec Studio</h1>
        <span class={styles.subtitle}>
          BSV4 Binary Vector Graphics + AISVG DSL (SolidJS Suite)
        </span>
        <span class={styles.badge}>v1.0.0</span>
      </div>

      <div class={styles.toolbar}>
        <select
          class={styles.select}
          value={props.selectedPreset}
          onChange={(e) => {
            const found = PRESETS.find((p) => p.id === e.currentTarget.value);
            if (found) props.onSelectPreset(found);
          }}
          title="Seleccionar ejemplo precargado"
        >
          <For each={PRESETS}>
            {(preset) => (
              <option value={preset.id}>
                {preset.name} [{preset.category}]
              </option>
            )}
          </For>
        </select>

        <label
          class={styles.toggleLabel}
          title="Modo Game: redondea decimales a 1 cifra y omite xmlns redundante"
        >
          <input
            type="checkbox"
            class={styles.toggleCheckbox}
            checked={props.gameMode}
            onChange={(e) => props.onToggleGameMode(e.currentTarget.checked)}
          />
          ⚡ Game Mode
        </label>

        <button
          class={styles.actionBtn}
          onClick={props.onReset}
          title="Restablecer al preset actual"
        >
          ↺ Reset
        </button>
      </div>
    </header>
  );
};

