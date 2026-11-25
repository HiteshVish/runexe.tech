"use client";

import { useId, useRef, useState } from "react";
import { MAX_FILE_BYTES } from "@/lib/image/constants";

type Props = {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
};

export default function Dropzone({ disabled, onFiles }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);

  function acceptList(files: FileList | File[]) {
    const list = Array.from(files);
    const ok: File[] = [];
    for (const f of list) {
      if (f.size > MAX_FILE_BYTES) {
        alert(`${f.name} is larger than 25 MB. Choose a smaller file.`);
        continue;
      }
      ok.push(f);
    }
    if (ok.length) onFiles(ok);
  }

  return (
    <div
      className={`ic-drop${active ? " ic-drop--active" : ""}`}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        if (disabled) return;
        acceptList(e.dataTransfer.files);
      }}
    >
      <strong>Drop images here</strong>
      <p>or click to browse · paste from clipboard · JPG, PNG, WebP · max 25 MB each</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        hidden
        multiple
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) acceptList(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}