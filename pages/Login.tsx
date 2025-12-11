import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock auth
    if (password === 'admin' || password === '1234') {
      onLogin();
    } else {
      setError('Nambari ya Siri siyo sahihi');
    }
  };

  return (
    <div className="min-h-screen bg-ernest-blue flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-ernest-gold p-8 text-center">
           <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center text-ernest-blue font-bold text-3xl shadow-lg">
              E
            </div>
            <h1 className="text-2xl font-bold text-ernest-blue tracking-wider">ERNEST ENTERPRISES</h1>
            <p className="text-ernest-blue/80 text-sm mt-1 uppercase tracking-widest font-semibold">Mfumo wa Biashara</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hidden username field to trigger browser password save prompt */}
            <input type="text" name="username" defaultValue="Admin" className="hidden" autoComplete="username" />
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Nambari ya Siri (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  name="password"
                  autoComplete="current-password"
                  placeholder="Weka nambari ya siri..." 
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-ernest-gold focus:border-transparent outline-none transition-shadow"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button 
              type="submit" 
              className="w-full bg-ernest-blue text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
            >
              Ingia (Login)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};