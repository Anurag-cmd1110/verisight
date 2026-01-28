import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
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
      // Use your Render Backend URL here
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
      setTimeout(() => navigate('/dashboard'), 2000); // Go back to dashboard

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md border border-gray-800 bg-gray-900/50 p-8 rounded-lg shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <h2 className="text-2xl font-bold text-blue-500 mb-6 text-center tracking-widest">
          UPDATE PROTOCOL
        </h2>

        {/* Status Messages */}
        {error && <div className="bg-red-900/50 text-red-400 p-3 mb-4 rounded border border-red-800 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-900/50 text-green-400 p-3 mb-4 rounded border border-green-800 text-sm text-center">{message}</div>}

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-500 text-xs mb-1">CURRENT ACCESS KEY</label>
            <input 
              type="password" 
              className="w-full bg-black border border-gray-700 p-3 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Enter old password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-500 text-xs mb-1">NEW ACCESS KEY</label>
            <input 
              type="password" 
              className="w-full bg-black border border-gray-700 p-3 rounded text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Enter new password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={handleUpdate}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          EXECUTE UPDATE
        </button>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full mt-3 text-gray-500 hover:text-gray-300 text-sm py-2"
        >
          Cancel Operation
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;