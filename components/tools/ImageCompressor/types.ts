import type { ProcessResult } from "@/lib/image/compress";
import type { FitMode, OutputFormat } from "@/lib/image/constants";

export type CompressionMode = "quality" | "target";

export type CompressorSettings = {
  compressionMode: CompressionMode;
  quality: number;
  targetBytes: number;
  targetUnit: "KB" | "MB";
  targetInput: string;
  resizeWidth: string;
  resizeHeight: string;
  lockAspect: boolean;
  scalePercent: string;
  fit: FitMode;
  backgroundColor: string;
  outputFormat: OutputFormat;
};

export type FileItemState = {
  id: string;
  file: File;
  status: "idle" | "processing" | "done" | "error";
  error?: string;
  result?: ProcessResult;
  previewUrl?: string;
  originalUrl?: string;
};