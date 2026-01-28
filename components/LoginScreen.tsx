import React, { useState } from 'react';

interface LoginProps {
  onLogin: (agentId: string) => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!agentId || !password) {
      setError("Credentials required.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const endpoint = isLoginMode 
      ? 'https://verisight-api.onrender.com/api/login'
      : 'https://verisight-api.onrender.com/api/register';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!isLoginMode) {
        setIsLoginMode(true);
        setError(null);
        alert("Registration Successful! Please Login.");
      } else {
        localStorage.setItem('token', data.token);
        // Pass ID back to App
        onLogin(data.agentId); 
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05050A] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#0A0B14] border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4 text-indigo-400">
            <i className={`fa-solid ${isLoginMode ? 'fa-user-lock' : 'fa-user-plus'} text-xl`}></i>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">VERI<span className="text-indigo-500">SIGHT</span></h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-1">{isLoginMode ? 'Secure Agent Access' : 'New Agent Clearance'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {/* Agent ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agent ID</label>
            <div className="relative">
              <input type="text" value={agentId} onChange={(e) => setAgentId(e.target.value.toUpperCase())} className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700" placeholder="ENTER ID" />
              <i className="fa-solid fa-id-card absolute left-3.5 top-3.5 text-slate-600"></i>
            </div>
          </div>

          {/* Password with Eye Button */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Passkey</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-10 pr-10 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700" placeholder="••••••••" />
              <i className="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-600"></i>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-indigo-400 transition-colors focus:outline-none"><i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
            </div>
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center"><p className="text-[10px] text-red-400 font-bold uppercase tracking-wide"><i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}</p></div>}

          <button type="submit" disabled={isLoading} className={`w-full py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}>{isLoading ? <><i className="fa-solid fa-circle-notch animate-spin"></i> Processing...</> : (isLoginMode ? 'Authenticate' : 'Grant Clearance')}</button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-white/5">
          <p className="text-xs text-slate-500 mb-2">{isLoginMode ? "Don't have clearance?" : "Already have an ID?"}</p>
          <button onClick={() => { setIsLoginMode(!isLoginMode); setError(null); setAgentId(''); setPassword(''); setShowPassword(false); }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors">{isLoginMode ? 'Register New Agent' : 'Return to Login'}</button>
        </div>
      </div>
      <div className="absolute bottom-6 text-center w-full"><p className="text-[9px] text-slate-600 font-mono">SECURE CONNECTION // SHA-256 ENCRYPTED</p></div>
    </div>
  );
};

export default LoginScreen;