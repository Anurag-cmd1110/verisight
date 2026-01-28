import { ForensicReport, FrameData } from "../types";

export const analyzeVideoFrames = async (frames: FrameData[], audioBase64: string | null): Promise<ForensicReport> => {
  try {
    const response = await fetch('https://verisight-api.onrender.com/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, audioBase64 }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server Analysis Failed');
    }

    const parsed = await response.json();

    // --- SAFETY CHECK (Fixes the "filter of undefined" crash) ---
    if (!parsed || !parsed.analysis) {
      console.error("Malformed Response:", parsed);
      throw new Error("AI returned an empty report. Please retry.");
    }

    // Client-Side Logic Override
    const failCount = parsed.analysis.filter((a: any) => a.status === 'FAIL').length;
    const warnCount = parsed.analysis.filter((a: any) => a.status === 'WARN').length;
      
    if (failCount > 0) {
       parsed.score = Math.min(parsed.score, 40); 
       parsed.isAuthentic = false;
       parsed.confidenceLevel = "HIGH";
    } else if (warnCount >= 2) {
       parsed.score = Math.min(parsed.score, 60);
       parsed.isAuthentic = false;
    }

    return {
      ...parsed,
      metadata: {
        duration: frames[frames.length - 1].timestamp,
        resolution: "1080p (Est)",
        framesProcessed: frames.length,
        audioProcessed: !!audioBase64
      }
    };

  } catch (error: any) {
    console.error("Connection Error:", error);
    throw new Error(error.message || "Could not connect to Forensic Backend.");
  }
};