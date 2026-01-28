import React, { useState, useRef } from 'react';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import { AnalysisStatus, ForensicReport } from './types'; 
import { extractFrames } from './utils/frameExtractor';
import { extractAudio } from './utils/audioExtractor';
import { analyzeVideoFrames } from './services/geminiService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);

  // --- APP STATE ---
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null); 

  // --- AUTH HANDLERS ---
  const handleLoginSuccess = (agentId: string) => {
    setCurrentAgent(agentId);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentAgent(null);
    setIsLoggedIn(false);
    // Optional: Reset analysis state on logout
    reset();
  };

  // --- APP HANDLERS ---
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
      pdf.text(`AGENT: ${currentAgent}`, 50, 160, { angle: 45, align: 'center' }); // Added Agent ID to PDF Watermark
      
      pdf.save(`VeriSight_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) { alert("PDF Error"); } finally { setIsDownloading(false); }
  };

  // --- RENDER LOGIC ---
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05050A] text-white font-sans overflow-x-hidden">
      
      {/* HEADER WITH LOGOUT */}
      <Header agentId={currentAgent} onLogout={handleLogout} />
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
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
                  <p className="text-slate-500 text-xs font-mono">MP4, MOV (Max 100MB)</p>
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
             
             {/* UI WATERMARK */}
             <div className="absolute top-4 right-20 z-0 pointer-events-none opacity-20 hidden md:block">
                <div className={`border-[6px] ${report.isAuthentic ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'} font-black text-5xl uppercase tracking-widest p-4 -rotate-12 rounded-lg`}>
                  {report.isAuthentic ? 'VERISIGHT APPROVED' : 'FORENSIC FAIL'}
                </div>
             </div>

             <div className="bg-white/5 px-8 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${report.isAuthentic ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                  <h3 className="text-lg font-bold text-white tracking-widest uppercase">Forensic Analysis Report</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={reset} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider border border-white/10 rounded-lg transition-all">
                    <i className="fa-solid fa-rotate-right"></i> Rescan
                  </button>
                  <button onClick={handleDownload} disabled={isDownloading} className={`flex items-center gap-2 px-3 py-1.5 ${isDownloading ? 'bg-indigo-500/5 text-indigo-500' : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'} text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20 rounded-lg transition-all`}>
                    {isDownloading ? <><i className="fa-solid fa-circle-notch animate-spin"></i> Encrypting...</> : <><i className="fa-solid fa-file-pdf"></i> Export Dossier</>}
                  </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/5 relative z-10">
                
                {/* Score Column */}
                <div className="lg:col-span-4 p-8 flex flex-col bg-black/20">
                   <div className="flex flex-col items-center justify-center mb-8">
                       <div className="relative w-40 h-40 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={2 * Math.PI * 70 * (1 - report.score / 100)} className={`${report.score > 80 ? 'text-emerald-500' : report.score > 50 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{report.score}%</span>
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">Integrity Score</span>
                          </div>
                       </div>
                       
                       <div className={`px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase border shadow-lg ${report.isAuthentic ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20' : 'bg-red-500/20 border-red-500/50 text-red-300 shadow-red-500/20'}`}>
                          <i className={`fa-solid mr-2 ${report.isAuthentic ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                          {report.isAuthentic ? 'AUTHENTIC MEDIA' : 'MANIPULATION DETECTED'}
                       </div>
                   </div>

                   <div className="mt-4">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><i className="fa-solid fa-microscope"></i> Neural Observation Log</h4>
                      <p className="text-slate-300 text-xs leading-relaxed font-mono border-l-2 border-indigo-500/30 pl-3">"{report.summary}"</p>
                   </div>
                   
                   <div className="mt-8 grid grid-cols-2 gap-2">
                      <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                         <div className="text-[9px] text-slate-500 uppercase">Confidence</div>
                         <div className={`text-xs font-bold ${report.confidenceLevel === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}`}>{report.confidenceLevel || 'HIGH'}</div>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                         <div className="text-[9px] text-slate-500 uppercase">Anomalies</div>
                         <div className="text-xs font-bold text-white">{report.analysis.filter(a => a.status !== 'PASS').length} Detected</div>
                      </div>
                   </div>
                </div>

                {/* Threat Matrix Column */}
                <div className="lg:col-span-8 p-8 bg-black/10">
                   <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Neural Threat Matrix (10-Vector Scan)</h4>
                      <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-slate-400">{report.analysis.length} VECTORS</span>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {report.analysis && report.analysis.map((item: any, idx: number) => (
                        <div key={idx} className={`border p-3 rounded-xl transition-all ${item.status === 'FAIL' ? 'bg-red-950/10 border-red-500/30' : item.status === 'WARN' ? 'bg-amber-950/10 border-amber-500/30' : 'bg-[#0E0F19] border-white/5 hover:border-white/20'}`}>
                           <div className="flex justify-between items-center mb-2">
                              <h5 className="text-[10px] font-bold text-white uppercase truncate pr-2" title={item.category}>{item.category}</h5>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${item.status === 'FAIL' ? 'bg-red-500 text-white' : item.status === 'WARN' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'}`}>{item.status}</span>
                           </div>
                           <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight min-h-[2.5em]">{item.detail}</p>
                        </div>
                      ))}
                   </div>
                </div>

             </div>
           </div>
        )}
      </main>

      {/* Hidden Print Template */}
      {status === AnalysisStatus.COMPLETED && report && (
        <div style={{ position: 'absolute', top: 0, left: '-9999px' }}>
          <div ref={printRef} className="w-[210mm] bg-white text-black p-10 font-sans">
             <div className="border-2 border-black mb-1">
               <div className="grid grid-cols-12 divide-x-2 divide-black">
                  <div className="col-span-8 p-3">
                     <h2 className="text-2xl font-black uppercase tracking-tight">Forensic Intelligence Dossier</h2>
                     <p className="text-[10px] font-mono text-gray-600">CONFIDENTIAL // VERISIGHT DEFENSE SYSTEMS</p>
                  </div>
                  <div className="col-span-4 p-3 flex flex-col justify-between bg-gray-50">
                     <div className="flex justify-between text-[10px] font-bold"><span>CLASS: TOP SECRET</span><span>VS-GOV-2026</span></div>
                     <div className="text-right"><span className="font-black tracking-tighter text-xl">VERI<span className="text-indigo-700">SIGHT</span></span></div>
                  </div>
               </div>
             </div>
             <div className="bg-gray-300 border-2 border-black border-b-0 px-2 py-1 font-bold text-xs uppercase">Section (A): Target Analysis</div>
             <div className="border-2 border-black mb-4 p-4">
                 <div className="text-center mb-4">
                     <div className="text-4xl font-black">{report.score}/100</div>
                     <div className={`text-xl font-bold uppercase ${report.isAuthentic ? 'text-green-700' : 'text-red-700'}`}>{report.isAuthentic ? 'AUTHENTIC' : 'MANIPULATED'}</div>
                     <div className="text-[10px] uppercase mt-1">Verified by: VeriSight AI</div>
                 </div>
             </div>
             <div className="bg-gray-300 border-2 border-black border-b-0 px-2 py-1 font-bold text-xs uppercase">Section (B): 10-Vector Scan</div>
             <div className="border-2 border-black">
                {report.analysis && report.analysis.map((item: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 divide-x border-b border-black divide-black last:border-b-0">
                     <div className="col-span-3 p-1 text-[10px] font-bold">{item.category}</div>
                     <div className="col-span-1 p-1 flex items-center justify-center">
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded border ${item.status === 'FAIL' ? 'bg-red-100 text-red-700' : item.status === 'WARN' ? 'bg-yellow-100' : 'bg-green-100'}`}>{item.status}</span>
                     </div>
                     <div className="col-span-8 p-1 text-[10px]">{item.detail}</div>
                  </div>
                ))}
             </div>
             <div className="text-center mt-8 font-mono text-[8px] text-gray-400">Designed by Anurag</div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-[#05050A] border-t border-indigo-900/30 relative z-10 text-center py-6 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            &copy; 2026 VeriSight Systems Inc. | CLASS: TOP SECRET
          </p>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 rounded-full border border-indigo-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
              Designed by Anurag
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;