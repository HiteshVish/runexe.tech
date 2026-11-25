"use client";

import { crackHint, strengthLabel, type Strength } from "@/lib/password/generate";

export default function StrengthMeter({ bits, strength }: { bits: number; strength: Strength }) {
  const fillClass = `pwd-meter-fill pwd-meter-fill--${strength}`;
  return (
    <div className="pwd-meter" role="status" aria-live="polite">
      <div className="pwd-meter-track" aria-hidden="true">
        <div className={fillClass} />
      </div>
      <div className="pwd-meter-label">
        <span>
          {strengthLabel(strength)} · ~{bits.toFixed(0)} bits
        </span>
      </div>
      <p className="qr-hint" style={{ marginTop: 8 }}>
        {crackHint(bits)} Real-world safety also depends on how you store the password.
      </p>
    </div>
  );
}