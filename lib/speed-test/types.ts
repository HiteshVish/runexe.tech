export type TestPhase = "idle" | "ping" | "download" | "upload" | "complete";

export type BufferbloatGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export type SpeedSample = {
  t: number;
  mbps: number;
  phase: "download" | "upload";
};

export type ConnectionInfo = {
  ip: string;
  isp: string | null;
  asn: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  location: string | null;
  serverNode: string;
};

export type SpeedTestResult = {
  id: string;
  timestamp: number;
  downloadMbps: number;
  uploadMbps: number;
  downloadPeakMbps: number;
  uploadPeakMbps: number;
  pingMs: number;
  pingMedianMs: number;
  jitterMs: number;
  loadedDownloadLatencyMs: number | null;
  loadedUploadLatencyMs: number | null;
  bufferbloatGrade: BufferbloatGrade;
  stabilityPct: number;
  totalTransferredMb: number;
};

export type EngineProgress = {
  phase: TestPhase;
  liveMbps: number;
  samples: SpeedSample[];
  partial: Partial<SpeedTestResult>;
};

export type EngineCallbacks = {
  onProgress: (p: EngineProgress) => void;
  onComplete: (result: SpeedTestResult) => void;
  onError: (message: string) => void;
};

export type ReadinessLevel = "Excellent" | "Good" | "Fair" | "Poor";

export type ReadinessItem = {
  id: string;
  label: string;
  level: ReadinessLevel;
  detail: string;
};
