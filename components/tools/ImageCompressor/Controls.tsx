"use client";

import {
  RESIZE_PRESETS,
  TARGET_SIZE_PRESET_BYTES,
  type FitMode,
  type OutputFormat,
} from "@/lib/image/constants";
import type { CompressorSettings, CompressionMode } from "./types";

type Props = {
  settings: CompressorSettings;
  disabled?: boolean;
  hasFiles: boolean;
  onChange: (patch: Partial<CompressorSettings>) => void;
};

export default function Controls({ settings, disabled, hasFiles, onChange }: Props) {
  const qualityDisabled = settings.outputFormat === "png";
  return (
    <div className="dt-stack">
      <p className="ic-section-title">Compression</p>
      <div className="dt-seg" role="group" aria-label="Compression mode">
        <button
          type="button"
          aria-pressed={settings.compressionMode === "quality"}
          onClick={() => onChange({ compressionMode: "quality" as CompressionMode })}
        >
          Quality
        </button>
        <button
          type="button"
          aria-pressed={settings.compressionMode === "target"}
          onClick={() => onChange({ compressionMode: "target" as CompressionMode })}
        >
          Target size
        </button>
      </div>

      {settings.compressionMode === "quality" && (
        <label className="dt-field">
          Quality ({settings.quality})
          <input
            className="ic-slider"
            type="range"
            min={1}
            max={100}
            value={settings.quality}
            disabled={disabled || qualityDisabled}
            onChange={(e) => onChange({ quality: parseInt(e.target.value, 10) })}
          />
          {qualityDisabled && (
            <p className="ic-hint">PNG is lossless — quality does not apply. Use JPG or WebP to shrink file size.</p>
          )}
        </label>
      )}

      {settings.compressionMode === "target" && (
        <div>
          <TargetSizeFields settings={settings} disabled={disabled} onChange={onChange} />
          <div className="ic-chips" role="group" aria-label="Target size presets">
            {TARGET_SIZE_PRESET_BYTES.map((bytes) => {
              const label = bytes >= 1024 * 1024 ? "1 MB" : `${bytes / 1024} KB`;
              return (
                <button
                  key={bytes}
                  type="button"
                  className="ic-chip"
                  aria-pressed={settings.targetBytes === bytes}
                  onClick={() =>
                    onChange({
                      targetBytes: bytes,
                      targetInput: String(bytes >= 1024 * 1024 ? 1 : bytes / 1024),
                      targetUnit: bytes >= 1024 * 1024 ? "MB" : "KB",
                    })
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
          {settings.outputFormat === "png" && (
            <p className="ic-hint">Target size with PNG may not shrink much. Try JPG/WebP or reduce dimensions.</p>
          )}
        </div>
      )}

      <p className="ic-section-title">Resize</p>
      <label className="dt-check">
        <input
          type="checkbox"
          checked={settings.lockAspect}
          onChange={(e) => onChange({ lockAspect: e.target.checked })}
        />
        Lock aspect ratio
      </label>
      <div className="ic-row2">
        <label className="dt-field">
          Width (px)
          <input
            className="dt-input"
            inputMode="numeric"
            value={settings.resizeWidth}
            onChange={(e) => onChange({ resizeWidth: e.target.value })}
          />
        </label>
        <label className="dt-field">
          Height (px)
          <input
            className="dt-input"
            inputMode="numeric"
            value={settings.resizeHeight}
            onChange={(e) => onChange({ resizeHeight: e.target.value })}
          />
        </label>
      </div>
      <label className="dt-field">
        Scale (%)
        <input
          className="dt-input"
          style={{ width: "100%" }}
          inputMode="numeric"
          placeholder="e.g. 50"
          value={settings.scalePercent}
          onChange={(e) => onChange({ scalePercent: e.target.value })}
        />
      </label>
      <div className="ic-chips">
        {RESIZE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="ic-chip"
            onClick={() =>
              onChange({
                resizeWidth: String(p.width),
                resizeHeight: String(p.height),
                lockAspect: false,
              })
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="dt-seg" role="group" aria-label="Fit mode">
        <button
          type="button"
          aria-pressed={settings.fit === "contain"}
          onClick={() => onChange({ fit: "contain" as FitMode })}
        >
          Contain
        </button>
        <button
          type="button"
          aria-pressed={settings.fit === "cover"}
          onClick={() => onChange({ fit: "cover" as FitMode })}
        >
          Cover
        </button>
      </div>
      <label className="dt-field">
        JPG background (flat areas)
        <input
          type="color"
          className="dt-input"
          style={{ width: "100%", height: 40, padding: 4 }}
          value={settings.backgroundColor}
          onChange={(e) => onChange({ backgroundColor: e.target.value })}
        />
      </label>

      <p className="ic-section-title">Output format</p>
      <div className="dt-seg" role="group" aria-label="Output format">
        {(["jpeg", "png", "webp"] as OutputFormat[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={settings.outputFormat === f}
            onClick={() => onChange({ outputFormat: f })}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="ic-hint">Re-encoding strips EXIF metadata (location, camera tags) by default.</p>
      {hasFiles && (
        <p className="ic-hint" style={{ marginBottom: 0 }}>
          The preview and download update automatically as you change settings{disabled ? "…" : "."}
        </p>
      )}
    </div>
  );
}

function TargetSizeFields({
  settings,
  disabled,
  onChange,
}: {
  settings: CompressorSettings;
  disabled?: boolean;
  onChange: (p: Partial<CompressorSettings>) => void;
}) {
  return (
    <div className="ic-row2">
      <label className="dt-field">
        Target
        <input
          className="dt-input"
          style={{ width: "100%" }}
          inputMode="decimal"
          value={settings.targetInput}
          disabled={disabled}
          onChange={(e) => onChange({ targetInput: e.target.value })}
        />
      </label>
      <label className="dt-field">
        Unit
        <select
          className="dt-input"
          style={{ width: "100%" }}
          value={settings.targetUnit}
          onChange={(e) => onChange({ targetUnit: e.target.value as "KB" | "MB" })}
        >
          <option value="KB">KB</option>
          <option value="MB">MB</option>
        </select>
      </label>
    </div>
  );
}