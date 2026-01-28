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

// --- DASHBOARD COMPONENT ---
// This contains all your main scanning logic
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
  const navigate = useNavigate(); // For the security button

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
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, (canvas.height * pdfWidth) / canvas.width);
      
      // WATERMARK
      pdf.setFontSize(40);
      pdf.setFont("helvetica", "bold");
      const text = report.isAuthentic ? "VERIFIED AUTHENTIC" : "MANIPULATION DETECTED";
      const color = report.isAuthentic ? [16, 185, 129] : [239, 68, 68];
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.2 })); 
      pdf.text(text, 40, 150, { angle: 45, align: 'center' });
      pdf.text(`AGENT: ${currentAgent}`, 50, 160, { angle: 45, align: 'center' });
      
      pdf.save(`VeriSight_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) { alert("PDF Error"); } finally { setIsDownloading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05050A] text-white font-sans overflow-x-hidden">
      <Header agentId={currentAgent} onLogout={onLogout} />

      {/* Security Button */}
      <div className="absolute top-20 right-4 z-50">
          <button 
            onClick={() => navigate('/change-password')} 
            className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded hover:bg-indigo-500/10 transition-colors"
          >
            [ UPDATE SECURITY CREDENTIALS ]
          </button>
      </div>

      <main className="relative z-10 flex-1 container mx-auto px-4 py-12 max-w-[1400px]">
        {/* HERO */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white">
            Trust the Physics, Not the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Pixel.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            VeriSight v6.0 (State-Actor Grade) analyzes Bio-Geometric Signals, Acoustic Reverberation, and Reflection Logic.
          </p>
        </div>

        {/* WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* UPLOADER */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="relative group bg-[#0A0B14] border border-white/5 rounded-3xl overflow-hidden shadow-2xl hover:border-indigo-500/20 transition-all">
              {!previewUrl ? (
                <div onClick={() => fileInputRef.current?.click()} className="h-80 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all m-4 rounded-2xl">
                  <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4"><i className="fa-solid fa-cloud-arrow-up text-xl text-slate-400"></i></div>
                  <h3 className="text-lg font-bold text-white mb-1">Upload Forensic Sample</h3>
                  <p className="text-slate-500 text-xs font-mono">MP4, MOV (Max 50MB)</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileSelect} />
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="relative h-80 bg-black w-full">
                    {(status === AnalysisStatus.EXTRACTING || status === AnalysisStatus.ANALYZING) && (
                      <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="relative w-16 h-16 mb-4">
                          <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-indigo-400 font-mono text-[10px] animate-pulse tracking-[0.2em] uppercase">
                          {status === AnalysisStatus.EXTRACTING ? 'Extracting Bio-Signals...' : 'Running Neural Physics Engine...'}
                        </p>
                      </div>
                    )}
                    <video ref={videoRef} src={previewUrl} className="w-full h-full object-contain" controls />
                  </div>
                  <div className="p-4 bg-[#0E0F19] border-t border-white/5 flex justify-between items-center">
                    <button onClick={reset} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider"><i className="fa-solid fa-trash mr-2"></i> Discard</button>
                    {status === AnalysisStatus.IDLE || status === AnalysisStatus.ERROR ? (
                      <button onClick={startAnalysis} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all flex items-center gap-2">
                        <i className="fa-solid fa-radar"></i> Initiate Deep Scan
                      </button>
                    ) : (
                       <div className="px-5 py-2.5 bg-slate-800/50 rounded-lg text-xs font-mono text-indigo-400 border border-indigo-500/20 flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> SYSTEM ACTIVE
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
             {status === AnalysisStatus.ERROR && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-red-200 flex items-center gap-3"><i className="fa-solid fa-circle-exclamation text-xl"></i> {error}</div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-5 space-y-4">
             <div className="flex items-center gap-3 mb-2"><i className="fa-solid fa-shield-cat text-indigo-400"></i><h4 className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Active Counter-Measures</h4></div>
             <div className="grid grid-cols-1 gap-4">
               <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i className="fa-solid fa-microchip"></i></div>
                  <div><h5 className="font-bold text-white text-sm">Micro-Tremors</h5><p className="text-xs text-slate-400">Detects natural autonomic head pulses vs. synthetic smoothing.</p></div>
               </div>
               <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><i className="fa-solid fa-triangle-exclamation"></i></div>
                  <div><h5 className="font-bold text-white text-sm">144p Trap</h5><p className="text-xs text-slate-400">Catches "Potato Quality" video masked with "Studio Quality" audio.</p></div>
               </div>
               <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><i className="fa-solid fa-eye"></i></div>
                  <div><h5 className="font-bold text-white text-sm">Reflection Logic</h5><p className="text-xs text-slate-400">Verifies light physics in eyes/mirrors.</p></div>
               </div>
               <div className="bg-[#0E0F19] border border-slate-800 p-4 rounded-xl flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400"><i className="fa-solid fa-wave-square"></i></div>
                  <div><h5 className="font-bold text-white text-sm">Acoustic Fingerprint</h5><p className="text-xs text-slate-400">Detects AI voice synthesis & robotic breath.</p></div>
               </div>
             </div>
          </div>
        </div>

        {/* RESULTS REPORT */}
        {status === AnalysisStatus.COMPLETED && report && (
           <div className="w-full bg-[#0A0B14] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn mb-20 relative">
             <div className="absolute top-4 right-20 z-0 pointer-events-none opacity-20 hidden md:block">
                <div className={`border-[6px] ${report.isAuthentic ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'} font-black text-5xl uppercase tracking-widest p-4 -rotate-12 rounded-lg`}>
                  {report.isAuthentic ? 'VERISIGHT APPROVED' : 'FORENSIC FAIL'}
                </div>
             </div>
             {/* Simple Results Display */}
             <div className="p-8 text-center"><h2 className="text-2xl font-bold">Analysis Complete: {report.score}% Integrity</h2></div>
           </div>
        )}
      </main>

      {/* Hidden Print Template */}
      {status === AnalysisStatus.COMPLETED && report && (
        <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
          <div ref={printRef} className="w-[210mm] bg-white text-black p-10 font-sans">
             <div className="text-center font-bold text-2xl mb-4">CONFIDENTIAL REPORT</div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#05050A] border-t border-indigo-900/30 relative z-10 text-center py-6 mt-12">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">&copy; 2026 VeriSight Systems</p>
      </footer>
    </div>
  );
};

// --- MAIN ROUTER ---
// This decides which page to show
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check login on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        setIsLoggedIn(true);
        setCurrentAgent("AGENT-ACTIVE");
        if (window.location.pathname === '/') {
           navigate('/dashboard');
        }
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