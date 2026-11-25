"use client";

type Props = {
  disabled: boolean;
  showShopSign: boolean;
  onPng: () => void;
  onSvg: () => void;
  onClipboard: () => void;
  onShopSign?: () => void;
  clipboardOk: boolean | null;
};

export default function DownloadBar({
  disabled,
  showShopSign,
  onPng,
  onSvg,
  onClipboard,
  onShopSign,
  clipboardOk,
}: Props) {
  return (
    <div className="qr-dl" role="group" aria-label="Download">
      <button type="button" className="dt-btn primary" disabled={disabled} onClick={onPng}>
        Download PNG
      </button>
      <button type="button" className="dt-btn" disabled={disabled} onClick={onSvg}>
        Download SVG
      </button>
      <button type="button" className="dt-btn" disabled={disabled} onClick={onClipboard}>
        Copy image
      </button>
      {showShopSign && onShopSign && (
        <button type="button" className="dt-btn" disabled={disabled} onClick={onShopSign}>
          Printable shop sign (PNG)
        </button>
      )}
      {clipboardOk === false && <span className="qr-hint">Clipboard not supported in this browser.</span>}
    </div>
  );
}