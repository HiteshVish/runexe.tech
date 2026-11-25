"use client";

import { ECC_LEVELS, OUTPUT_SIZES } from "@/lib/qr/constants";
import type { EccLevel, QrCustomize } from "@/lib/qr/types";

type Props = {
  custom: QrCustomize;
  hasLogo: boolean;
  onChange: (patch: Partial<QrCustomize>) => void;
  onLogo: (file: File | null) => void;
  contrastWarnings: string[];
};

export default function Customizer({ custom, hasLogo, onChange, onLogo, contrastWarnings }: Props) {
  return (
    <div className="dt-stack">
      <p className="qr-section-title">Appearance</p>
      <div className="ic-row2">
        <label className="dt-field">
          Foreground
          <input
            type="color"
            className="dt-input"
            style={{ width: "100%", height: 40, padding: 4 }}
            value={custom.fgColor}
            onChange={(e) => onChange({ fgColor: e.target.value })}
          />
        </label>
        <label className="dt-field">
          Background
          <input
            type="color"
            className="dt-input"
            style={{ width: "100%", height: 40, padding: 4 }}
            value={custom.bgColor}
            onChange={(e) => onChange({ bgColor: e.target.value })}
          />
        </label>
      </div>
      <p className="qr-hint">
        Use a light background with darker modules. If contrast is too low, we slightly adjust colors so scanners still read the code.
      </p>
      <div className="ic-chips" role="group" aria-label="Quick color presets">
        <button type="button" className="ic-chip" onClick={() => onChange({ fgColor: "#000000", bgColor: "#ffffff" })}>
          Classic B&amp;W
        </button>
        <button type="button" className="ic-chip" onClick={() => onChange({ fgColor: "#4a0e0e", bgColor: "#fff5f5" })}>
          Brand red
        </button>
      </div>
      {contrastWarnings.map((w) => (
        <p key={w} className="qr-note-warn">
          {w}
        </p>
      ))}
      <label className="dt-field">
        Output size (px)
        <select
          className="dt-input"
          value={custom.size}
          onChange={(e) => onChange({ size: parseInt(e.target.value, 10) })}
        >
          {OUTPUT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} px
            </option>
          ))}
        </select>
      </label>
      <label className="dt-field">
        Quiet zone (modules)
        <input
          className="dt-input"
          type="number"
          min={0}
          max={10}
          value={custom.margin}
          onChange={(e) => onChange({ margin: parseInt(e.target.value, 10) || 0 })}
        />
      </label>
      <label className="dt-field">
        Error correction
        <select
          className="dt-input"
          value={hasLogo ? "H" : custom.ecc}
          disabled={hasLogo}
          onChange={(e) => onChange({ ecc: e.target.value as EccLevel })}
        >
          {ECC_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {hasLogo && <span className="qr-hint">Raised to H when a logo is added — better for overlay scanning.</span>}
      </label>
      <label className="dt-field">
        Center logo (optional)
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="dt-input"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onLogo(f);
          }}
        />
        <span className="qr-hint">Shown at up to 20% of the QR. Logos reduce scan reliability — test before printing.</span>
      </label>
    </div>
  );
}