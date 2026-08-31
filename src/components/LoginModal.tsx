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
  const [rememberMe, setRememberMe] = useState(true);
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

  const handleForgotPassword = () => {
    setErrorMsg('');
    alert(
      'Lupa Password?\n\nSilakan hubungi Ustadz/Admin Tahfidz untuk melakukan pengaturan ulang PIN atau kata sandi akun Anda.'
    );
  };

  const handleContactAdmin = () => {
    alert(
      'Pendaftaran Akun\n\nAkun santri & ustadz dibuatkan oleh Admin Tahfidz. Silakan hubungi Admin untuk mendapatkan akses masuk.'
    );
  };

  return (
    <div className="min-h-[calc(100vh-9rem)] flex items-center justify-center px-2 py-6 bg-gradient-to-b from-slate-50 to-emerald-50/60 rounded-3xl">
      <div className="w-full max-w-[400px] mx-auto">
        {/* ===== Card ===== */}
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-950/[0.07] border border-slate-200/70 p-7 sm:p-8">
          {/* Branding Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-[68px] h-[68px] bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl flex items-center justify-center p-3 shadow-lg shadow-emerald-900/20 mb-4 transition-transform duration-300 hover:scale-105">
              <PesmadLogo size="lg" className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight text-balance">
              Selamat Datang
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed text-pretty">
              Masuk untuk mengelola setoran hafalan al-Qur&apos;an santri.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="login-username-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / ID Santri / NIS
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <UserCheck className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau ID santri"
                  className="w-full min-h-[48px] pl-11 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / PIN
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password atau PIN"
                  className="w-full min-h-[48px] pl-11 pr-12 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-600">Ingat Saya</span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-snug">{errorMsg}</p>
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              id="btn-submit-login"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-emerald-800 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure note */}
          <div className="flex items-center gap-2.5 mt-5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Koneksi aman. Jangan bagikan PIN/kata sandi Anda kepada siapa pun.</span>
          </div>

          {/* Footer prompt */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={handleContactAdmin}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Hubungi Admin
            </button>
          </p>
        </div>

        {/* Institute footer */}
        <p className="text-center text-[11px] text-slate-400 font-medium mt-5 px-4 leading-relaxed">
          Tahfidz al-Qur&apos;an &bull; Pesantren Madrasah Darul Fikri
        </p>
      </div>
    </div>
  );
};
