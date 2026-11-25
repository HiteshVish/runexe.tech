"use client";

import { MORE_QR_TYPES, MAIN_QR_TYPES, QR_TYPE_LABELS } from "@/lib/qr/constants";
import type { QrType } from "@/lib/qr/types";

type Props = {
  type: QrType;
  showMore: boolean;
  onChange: (t: QrType) => void;
  onToggleMore: (v: boolean) => void;
};

export default function TypeTabs({ type, showMore, onChange, onToggleMore }: Props) {
  const tabs = showMore ? MORE_QR_TYPES : MAIN_QR_TYPES;
  return (
  <div>
      <div className="qr-tabs" role="group" aria-label="QR code type">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => onChange(t)}
          >
            {QR_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="dt-btn"
        style={{ fontSize: "0.8rem", marginBottom: 4 }}
        onClick={() => {
          const next = !showMore;
          onToggleMore(next);
          if (next && !MORE_QR_TYPES.includes(type)) onChange(MORE_QR_TYPES[0]);
          if (!next && !MAIN_QR_TYPES.includes(type)) onChange(MAIN_QR_TYPES[0]);
        }}
      >
        {showMore ? "← Back to main types" : "More: Email, phone, SMS →"}
      </button>
    </div>
  );
}