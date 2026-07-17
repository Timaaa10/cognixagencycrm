
import React, { useState } from 'react';
// Fix: Use direct @firebase/auth import to resolve missing exported member error
import { signInWithEmailAndPassword } from '@firebase/auth';
import { auth } from '../firebase';
import Logo from '../components/Logo';
import { createUserProfile } from "../services/userService";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      await createUserProfile(
        result.user.uid,
        result.user.email || ""
      );

    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 transition-all duration-300">
        <div className="text-center mb-10">
          <div className="inline-block mb-6 p-2 bg-white rounded-3xl">
            <Logo className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cognix Agency</h1>
          <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-widest">Internal Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium rounded-r animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
            <input
              required
              type="email"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
              placeholder="admin@cognix.agency"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
            <input
              required
              type="password"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Enter Terminal</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <p className="text-[9px] text-slate-300 font-black tracking-[0.3em] uppercase">
            Powered by Cognix Core
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
