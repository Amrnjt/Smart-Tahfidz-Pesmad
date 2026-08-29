import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { UserCheck, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await storageService.authenticate(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Username atau Password salah. Silakan periksa kembali.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan saat memproses login. Silakan coba lagi.');
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 sm:my-12 px-3 sm:px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-center text-white relative">
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center p-2 border-2 border-emerald-400/80 shadow-xl mb-3.5 transform transition-transform hover:scale-105">
            <PesmadLogo size="lg" className="w-full h-full" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Tahfidz al-Qur'an</h2>
          <p className="text-sm font-semibold text-emerald-100 mt-0.5">
            Pesantren Madrasah Darul Fikri
          </p>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-700/60 text-[11px] font-bold">
            MTsN 3 Bojonegoro
          </span>
          <p className="text-[11px] sm:text-xs text-emerald-200/90 mt-1 max-w-xs mx-auto">
            Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro • Portal Sistem Mutaba'ah
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Security Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Silakan masuk menggunakan kredensial akun yang telah didaftarkan.</span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / ID Santri / NIS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username / ID Santri"
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
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password / PIN"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <p className="font-semibold">{errorMsg}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-submit-login"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium">
              © Tahfidz al-Qur'an Pesantren Madrasah Darul Fikri
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
