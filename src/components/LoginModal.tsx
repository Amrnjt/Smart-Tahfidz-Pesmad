import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { BookOpen, UserCheck, Lock, AlertCircle, Info, ArrowRight, Shield } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onOpenGasModal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenGasModal }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const users = storageService.getUsers();
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();

      const matched = users.find(
        u => u.username.toLowerCase() === trimmedUser.toLowerCase() && u.password === trimmedPass
      );

      if (matched) {
        storageService.setSession(matched);
        onLoginSuccess(matched);
      } else {
        setErrorMsg('Username/ID Santri atau Password salah. Silakan coba kembali.');
      }
    }, 450);
  };

  const setDemoAccount = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-7 text-center text-white relative">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <BookOpen className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Tahfidz al-Qur'an</h2>
          <p className="text-sm font-semibold text-emerald-100 mt-0.5">
            Pesantren Madrasah Darul Fikri
          </p>
          <p className="text-[11px] text-emerald-200/90 mt-1 max-w-xs mx-auto">
            Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Petunjuk Login Box */}
          <div className="bg-emerald-50/80 rounded-2xl p-4 text-xs text-emerald-900 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Akun Demo Uji Coba:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDemoAccount('ustadz1', '123')}
                className="text-left p-2.5 rounded-xl bg-white border border-emerald-300/80 hover:bg-emerald-100 transition shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">👨‍🏫 Ustadz 1</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded font-mono">123</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">user: ustadz1</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('STR001', '123')}
                className="text-left p-2.5 rounded-xl bg-white border border-teal-300/80 hover:bg-teal-100 transition shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-900">👨‍👩‍👧 Wali Santri</span>
                  <span className="text-[10px] text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded font-mono">123</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: STR001 (Fatih)</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / ID Santri
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: ustadz1 atau STR001"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password / PIN"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Masuk ke Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onOpenGasModal}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-4"
            >
              Lihat Kode Google Apps Script & Deployment Guide →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
