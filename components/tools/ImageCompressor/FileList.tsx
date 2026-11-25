"use client";

import { formatFileSize } from "@/lib/image/formats";
import type { FileItemState } from "./types";

type Props = {
  items: FileItemState[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function FileList({ items, activeId, onSelect }: Props) {
  if (!items.length) return null;
  return (
    <div className="ic-files" role="list" aria-label="Uploaded files">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="ic-file"
          role="listitem"
          aria-current={activeId === item.id}
          onClick={() => onSelect(item.id)}
        >
          <span className="ic-file-name">{item.file.name}</span>
          <span className="ic-file-meta">
            {item.status === "processing" && "Processing…"}
            {item.status === "error" && "Error"}
            {item.status === "done" && item.result && formatFileSize(item.result.blob.size)}
            {item.status === "idle" && formatFileSize(item.file.size)}
          </span>
        </button>
      ))}
    </div>
  );
}