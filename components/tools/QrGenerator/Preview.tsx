"use client";

import { RefObject } from "react";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ready: boolean;
  errors: string[];
  warnings: string[];
  previewBg?: string;
};

export default function Preview({ canvasRef, ready, errors, warnings, previewBg }: Props) {
  return (
    <div className="qr-preview-panel">
      <p className="qr-section-title">Live preview</p>
      <p aria-live="polite" className="dt-status">
        {errors.length ? errors[0] : warnings.length ? warnings[0] : ready ? "QR ready." : "Fill required fields."}
      </p>
      <div className="qr-preview-box" style={ready && previewBg ? { backgroundColor: previewBg } : undefined}>
        {!ready && (
          <p className="qr-preview-empty">
            {errors.length
              ? errors.join(" ")
              : "Enter the details on the left. The QR appears here when the payload is valid."}
          </p>
        )}
        <canvas
          ref={canvasRef}
          aria-label="QR code preview"
          role="img"
          style={{ display: ready ? "block" : "none" }}
        />
      </div>
    </div>
  );
}