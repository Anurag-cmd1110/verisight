export enum AnalysisStatus {
  IDLE = 'idle',
  EXTRACTING = 'extracting', // Extracting Frames + Audio
  ANALYZING = 'analyzing',   // Sending to Neural Engine
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface FrameData {
  base64: string;
  timestamp: number;
}

export interface Anomaly {
  category: string;     // e.g. "Deepfake/Face-Swap"
  confidence: number;   // 0-100%
  detail: string;       // Technical observation
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface ForensicReport {
  isAuthentic: boolean;
  score: number;        // 0-100
  summary: string;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW'; // New Field
  analysis: Anomaly[];
  metadata: {
    duration: number;
    resolution: string;
    framesProcessed: number;
    audioProcessed?: boolean; // New Field
  };
}