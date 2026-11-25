"use client";

import { useState } from "react";
import { formatFileSize, percentSaved } from "@/lib/image/formats";
import type { FileItemState } from "./types";

type Props = { item: FileItemState | null };

export default function Preview({ item }: Props) {
  const [useSlider, setUseSlider] = useState(false);
  const [split, setSplit] = useState(50);

  if (!item) {
    return (
      <p className="ic-hint" style={{ marginTop: 0 }}>
        Select a file to preview before and after.
      </p>
    );
  }

  const afterUrl = item.previewUrl;
  const beforeUrl = item.originalUrl;

  return (
    <div className="ic-preview">
      {item.result && (
        <p className="ic-stat" aria-live="polite">
          {formatFileSize(item.file.size)} → {formatFileSize(item.result.blob.size)}
          {item.result.usedOriginal ? (
            <span> (original kept)</span>
          ) : (
            <span> · {percentSaved(item.file.size, item.result.blob.size)}</span>
          )}
          <br />
          <span className="ic-hint">
            {item.result.width}×{item.result.height} px
          </span>
        </p>
      )}
      {item.result?.note && <p className="dt-status err">{item.result.note}</p>}
      {item.error && <p className="dt-status err">{item.error}</p>}

      {beforeUrl && afterUrl && (
        <>
          <label className="dt-check">
            <input type="checkbox" checked={useSlider} onChange={(e) => setUseSlider(e.target.checked)} />
            Show comparison slider
          </label>
          {useSlider ? (
            <div className="ic-compare">
              <img src={beforeUrl} alt="Original" />
              <img
                className="ic-compare-after"
                src={afterUrl}
                alt="Compressed"
                style={{ clipPath: `inset(0 0 0 ${split}%)` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={split}
                aria-label="Compare before and after"
                onChange={(e) => setSplit(parseInt(e.target.value, 10))}
              />
            </div>
          ) : (
            <div className="ic-preview-grid">
              <figure className="ic-preview-box">
                <figcaption>Original</figcaption>
                <img src={beforeUrl} alt="" />
              </figure>
              <figure className="ic-preview-box">
                <figcaption>Compressed</figcaption>
                <img src={afterUrl} alt="" />
              </figure>
            </div>
          )}
        </>
      )}
    </div>
  );
}