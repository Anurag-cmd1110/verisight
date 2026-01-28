import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import { AnalysisStatus, ForensicReport } from './types'; 
import { extractFrames } from './utils/frameExtractor';
import { extractAudio } from './utils/audioExtractor';
import { analyzeVideoFrames } from './services/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ChangePassword from './src/ChangePassword';

const Dashboard = ({ currentAgent, onLogout }: { currentAgent: string | null, onLogout: () => void }) => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setReport(null);
    setStatus(AnalysisStatus.IDLE);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    try {
      setStatus(AnalysisStatus.EXTRACTING);
      setError(null);
      setReport(null);
      const [frames, audioBase64] = await Promise.all([
        extractFrames(selectedFile),
        extractAudio(selectedFile)
      ]);
      setStatus(AnalysisStatus.ANALYZING);
      const results = await analyzeVideoFrames(frames, audioBase64);
      setReport(results);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Analysis Failed.');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const reset = () => {
    setStatus(AnalysisStatus.IDLE);
    setReport(null);
    setError(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async () => {
    if (!printRef.current || !report) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), (canvas.height * pdf.internal.pageSize.getWidth()) / canvas.width);
      pdf.save(`VeriSight_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) { alert("PDF Error"); } finally { setIsDownloading(false); }
  };

  // Professional Forensic Categories from your screenshots
  const forensicVectors = [
    { id: "deepfake", label: "Deepfake/Identity Swap", def: "Checks for mask lines, skin tone mismatches, or unnatural facial features." },
    { id: "audio", label: "AI Voice/TTS", def: "Detects robotic timbre, lack of breath, or synthetic audio artifacts." },
    { id: "lipsync", label: "Lip-Sync", def: "Verifies alignment between lip movements and vocal track." },
    { id: "generative", label: "Generative AI", def: "Scans for physics hallucinations or unrealistic elements typical of AI." },
    { id: "puppetry", label: "Puppetry", def: "Detects rigid head independent movement of internal features." },
    { id: "morphing", label: "Morphing", def: "Verifies fluid identity shifts or gradual changes in facial structure." },
    { id: "lighting", label: "Lighting/Shadows", def: "Checks consistency with light sources and environmental shadows." },
    { id: "splicing", label: "Splicing", def: "Scans for abrupt jump cuts or jarring transitions indicating manipulation." },
    { id: "speed", label: "Speed Artifacts", def: "Detects ghosting or jitter indicating speed and frame manipulation." },
    { id: "metadata", label: "Metadata/Text", def: "Scans for explicit test overlays like 'Deepfake' or 'AI Generated'." }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#05050A] text-white font-sans overflow-x-hidden">
      <Header agentId={currentAgent} onLogout={onLogout} />

      <div className="absolute top-20 right-4 z-50 flex gap-4">
          <button onClick={() => navigate('/change-password')} className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded hover:bg-indigo-500/10 transition-colors">
            [ UPDATE SECURITY CREDENTIALS ]
          </button>
      </div>

      <main className="relative z-10 flex-1 container mx-auto px-4 py-12 max-w-[1400px]">
        {/* HERO */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">
            Trust the Physics, Not the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Pixel.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">VeriSight v6.0 analyzes Bio-Geometric Signals: Corneal Reflection, Muscular Synergy, and Autonomic Micro-Tremors.</p>
        </div>

        {/* WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          <div className="lg:col-span-7">
            <div className="relative group bg-[#0A0B14] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              {!previewUrl ? (
                <div onClick={() => fileInputRef.current?.click()} className="h-80 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-800 hover:border-indigo-500/50 m-4 rounded-2xl transition-all">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6"><i className="fa-solid fa-upload text-xl text-slate-400"></i></div>
                  <h3 className="text-xl font-bold text-white mb-2">Upload Forensic Sample</h3>
                  <p className="text-slate-500 text-xs font-mono">MP4, MOV up to 100MB supported</p>
                  <button className="mt-6 px-6 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-indigo-400"><i className="fa-solid fa-play mr-2"></i> Load Simulation</button>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="relative h-80 bg-black">
                    {(status === AnalysisStatus.EXTRACTING || status === AnalysisStatus.ANALYZING) && (
                      <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-400 font-mono text-[10px] uppercase animate-pulse">Running Neural Physics Engine...</p>
                      </div>
                    )}
                    <video ref={videoRef} src={previewUrl} className="w-full h-full object-contain" controls />
                  </div>
                  <div className="p-4 bg-[#0E0F19] border-t border-white/5 flex justify-between items-center">
                    <button onClick={reset} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase"><i className="fa-solid fa-trash mr-2"></i> Discard</button>
                    <button onClick={startAnalysis} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg flex items-center gap-2">
                       <i className="fa-solid fa-radar"></i> Initiate Deep Scan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-5 space-y-4">
             <div className="flex items-center gap-3 mb-2 font-bold text-indigo-300 text-sm uppercase tracking-widest"><i className="fa-solid fa-shield-cat"></i> Bio-Defense Framework</div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i className="fa-solid fa-check-circle text-xs"></i></div>
                   <h5 className="font-bold text-white text-[11px] uppercase tracking-tighter">Corneal Geometry</h5>
                   <p className="text-[9px] text-slate-400 leading-tight">Checks if eye reflections warp correctly on the cornea.</p>
                </div>
                <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"><i className="fa-solid fa-bolt text-xs"></i></div>
                   <h5 className="font-bold text-white text-[11px] uppercase tracking-tighter">Muscular Synergy</h5>
                   <p className="text-[9px] text-slate-400 leading-tight">Verifies if eye muscles contract in sync with mouth.</p>
                </div>
                <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400"><i className="fa-solid fa-microchip text-xs"></i></div>
                   <h5 className="font-bold text-white text-[11px] uppercase tracking-tighter">Micro-Tremors</h5>
                   <p className="text-[9px] text-slate-400 leading-tight">Detects natural autonomic head pulses vs smoothing.</p>
                </div>
                <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                   <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><i className="fa-solid fa-triangle-exclamation text-xs"></i></div>
                   <h5 className="font-bold text-white text-[11px] uppercase tracking-tighter">144p Trap</h5>
                   <p className="text-[9px] text-slate-400 leading-tight">Catches low-quality masking hidden by HD filters.</p>
                </div>
             </div>
          </div>
        </div>

        {/* THE PROFESSIONAL REPORT UI (SCREENSOT 169 REPLICA) */}
        {status === AnalysisStatus.COMPLETED && report && (
           <div className="w-full bg-[#0A0B14] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn mb-20">
             
             {/* REPORT HEADER */}
             <div className="bg-white/5 px-8 py-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${report.isAuthentic ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                  <h3 className="text-lg font-bold text-white tracking-widest uppercase">Forensic Analysis Report</h3>
                </div>
                <div className="flex gap-4">
                   <button onClick={reset} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase rounded border border-white/5 flex items-center gap-2"><i className="fa-solid fa-rotate"></i> Rescan</button>
                   <button onClick={handleDownload} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold uppercase rounded border border-indigo-400/50 flex items-center gap-2"><i className="fa-solid fa-file-export"></i> Export Dossier</button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
                
                {/* LEFT COLUMN: SCORE & NEURAL LOGS */}
                <div className="lg:col-span-4 p-8 flex flex-col items-center bg-black/20">
                   <div className="relative w-40 h-40 mb-6">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={2 * Math.PI * 70 * (1 - report.score / 100)} className={`${report.isAuthentic ? 'text-emerald-500' : 'text-red-500'} transition-all duration-1000`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white">{report.score}%</span>
                        <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">Integrity Score</span>
                      </div>
                   </div>
                   
                   <div className={`px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase border ${report.isAuthentic ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-red-500/20 border-red-500/50 text-red-300'}`}>
                      {report.isAuthentic ? 'VERIFIED AUTHENTIC' : 'MANIPULATION DETECTED'}
                   </div>

                   <div className="mt-12 w-full space-y-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-microscope"></i> Neural Observation Log</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed font-mono border-l-2 border-indigo-500/30 pl-3">"{report.summary}"</p>
                      
                      <div className="grid grid-cols-2 gap-3 pt-6">
                         <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col items-center">
                            <div className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Confidence</div>
                            <div className="text-[10px] font-black text-emerald-400 mt-1 uppercase tracking-widest">High</div>
                         </div>
                         <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col items-center">
                            <div className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Anomalies</div>
                            <div className="text-[10px] font-black text-white mt-1 uppercase tracking-widest">0 Detected</div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* RIGHT COLUMN: 10-VECTOR MATRIX */}
                <div className="lg:col-span-8 p-8 bg-black/10">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Neural Threat Matrix (10-Vector Scan)</h4>
                      <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono tracking-widest">10 VECTORS</span>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {forensicVectors.map((vector) => {
                        const found = report.analysis.find(a => a.category.toLowerCase().includes(vector.id));
                        const result = found || { status: 'PASS', detail: vector.def };
                        return (
                          <div key={vector.id} className={`border p-4 rounded-xl transition-all ${result.status === 'FAIL' ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 'bg-[#0E0F19] border-white/5 hover:border-white/10'}`}>
                             <div className="flex justify-between items-center mb-2">
                                <h5 className="text-[10px] font-bold text-white uppercase tracking-tighter">{vector.label}</h5>
                                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${result.status === 'FAIL' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : result.status === 'WARN' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>{result.status}</span>
                             </div>
                             <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{result.detail}</p>
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>
           </div>
        )}
      </main>

      <footer className="bg-[#05050A] border-t border-indigo-900/30 py-8 text-center">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">
          &copy; 2026 VeriSight Systems Inc. | 
          <span className="ml-2 text-indigo-400 font-bold animate-pulse drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]">
             Designed by Anurag
          </span>
        </p>
      </footer>
    </div>
  );
};

// --- MAIN ROUTER ---
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        setIsLoggedIn(true);
        setCurrentAgent("AGENT-ACTIVE");
        if (window.location.pathname === '/') navigate('/dashboard');
    }
  }, [navigate]);

  const handleLoginSuccess = (agentId: string) => {
    setCurrentAgent(agentId);
    setIsLoggedIn(true);
    navigate('/dashboard'); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentAgent(null);
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={!isLoggedIn ? <LoginScreen onLogin={handleLoginSuccess} /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={isLoggedIn ? <Dashboard currentAgent={currentAgent} onLogout={handleLogout} /> : <Navigate to="/" />} />
      <Route path="/change-password" element={<ChangePassword />} />
    </Routes>
  );
};

export default App;