import React from 'react';

interface HeaderProps {
  agentId?: string | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ agentId, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#05050A]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#05050A]/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 group-hover:border-indigo-500/50 transition-all shadow-[0_0_15px_rgba(79,70,229,0.2)]">
            <i className="fa-solid fa-eye text-indigo-400 group-hover:text-white transition-colors"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-white">
              VERI<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">SIGHT</span>
            </h1>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] leading-none -mt-1 group-hover:text-indigo-400 transition-colors">
              Forensic AI v6.0
            </span>
          </div>
        </div>

        {/* RIGHT SIDE NAV */}
        <div className="flex items-center gap-6">
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Docs</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">API</a>
          </nav>

          {/* DYNAMIC AUTH SECTION */}
          {agentId ? (
            <div className="flex items-center gap-4">
              {/* AGENT BADGE */}
              <div className="px-4 py-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
                 <span className="font-mono">AGENT: {agentId}</span>
              </div>
              
              {/* LOGOUT BUTTON */}
              <button 
                onClick={onLogout}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                title="Secure Logout"
              >
                <i className="fa-solid fa-power-off text-xs"></i>
              </button>
            </div>
          ) : (
            // Fallback (Though usually hidden by Login Screen)
            <button className="px-5 py-2 text-xs font-bold text-white uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2">
              <i className="fa-solid fa-user-shield"></i>
              <span className="hidden sm:inline">Agent Login</span>
            </button>
          )}

        </div>
      </div>
      
      {/* Glow Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
    </header>
  );
};

export default Header;