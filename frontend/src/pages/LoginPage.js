import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BrainCircuit, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/v1/login', form);
      const { token, user } = res.data;
      
      // Store JWT token securely in localStorage
      localStorage.setItem('study_ai_token', token);
      localStorage.setItem('study_ai_user', JSON.stringify(user));
      
      // Navigate to intended page or dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="classic-card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrainCircuit size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text">Welcome Back</h2>
          <p className="text-sm text-text-secondary mt-2">Log in to sync your intelligent study history</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="email" 
                required 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="input-classic w-full pl-10" 
                placeholder="student@university.edu" 
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="password" 
                required 
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="input-classic w-full pl-10" 
                placeholder="••••••••" 
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex justify-center py-3">
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>
        
        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
