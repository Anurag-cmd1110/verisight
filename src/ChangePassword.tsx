import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOld, setShowOld] = useState(false); // Toggle for old pass
  const [showNew, setShowNew] = useState(false); // Toggle for new pass
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async () => {
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
        setError("Session expired. Please login again.");
        return;
    }

    try {
      const response = await fetch('https://verisight-api.onrender.com/api/change-password', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Update failed');
      }

      setMessage('Credentials Updated. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md border border-gray-800 bg-gray-900/50 p-8 rounded-lg shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Ambience */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] pointer-events-none"></div>

        <h2 className="text-2xl font-bold text-blue-500 mb-6 text-center tracking-widest">
          UPDATE PROTOCOL
        </h2>

        {error && <div className="bg-red-900/50 text-red-400 p-3 mb-4 rounded border border-red-800 text-[10px] text-center uppercase tracking-tighter">{error}</div>}
        {message && <div className="bg-green-900/50 text-green-400 p-3 mb-4 rounded border border-green-800 text-[10px] text-center uppercase tracking-tighter">{message}</div>}

        <div className="space-y-6">
          {/* OLD PASSWORD */}
          <div className="relative">
            <label className="block text-gray-500 text-[10px] mb-1 uppercase tracking-widest">CURRENT ACCESS KEY</label>
            <input 
              type={showOld ? "text" : "password"} 
              className="w-full bg-black border border-gray-700 p-3 pr-10 rounded text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="••••••••"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-8 text-gray-500 hover:text-blue-400 transition-colors"
            >
              <i className={`fa-solid ${showOld ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
            </button>
          </div>

          {/* NEW PASSWORD */}
          <div className="relative">
            <label className="block text-gray-500 text-[10px] mb-1 uppercase tracking-widest">NEW ACCESS KEY</label>
            <input 
              type={showNew ? "text" : "password"} 
              className="w-full bg-black border border-gray-700 p-3 pr-10 rounded text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button 
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-8 text-gray-500 hover:text-blue-400 transition-colors"
            >
              <i className={`fa-solid ${showNew ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
            </button>
          </div>
        </div>

        <button 
          onClick={handleUpdate}
          className="w-full mt-10 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
        >
          EXECUTE UPDATE
        </button>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full mt-4 text-gray-600 hover:text-gray-400 text-[10px] uppercase tracking-widest py-2"
        >
          [ ABORT OPERATION ]
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;