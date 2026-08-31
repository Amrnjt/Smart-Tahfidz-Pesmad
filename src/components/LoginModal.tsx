import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { UserCheck, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, BookOpenCheck, MoonStar, Sparkles } from 'lucide-react';
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

  return (
    <div className="max-w-5xl mx-auto my-4 sm:my-10 px-1 sm:px-4">
      <div className="grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl shadow-emerald-950/10 border border-slate-200/80 overflow-hidden">
        {/* ===== Left: Branding / Visual Panel ===== */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 text-white bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 overflow-hidden">
          {/* Decorative soft glows */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true"></div>
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-teal-300/10 blur-3xl" aria-hidden="true"></div>

          {/* Top: Logo + institute */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 border-2 border-emerald-400/70 shadow-lg">
              <PesmadLogo size="lg" className="w-full h-full" />
            </div>
            <div className="leading-tight">
              <p className="font-extrabold tracking-tight text-lg">Tahfidz al-Qur&apos;an</p>
              <p className="text-xs font-semibold text-emerald-200/90">Pesantren Madrasah Darul Fikri</p>
            </div>
          </div>

          {/* Middle: Welcome message */}
          <div className="relative z-10 space-y-5 py-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-200 border border-emerald-700/50 text-[11px] font-bold">
              <MoonStar className="w-3.5 h-3.5" />
              Portal Sistem Mutaba&apos;ah
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-balance">
              Selamat Datang di Portal Hafalan Santri
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed max-w-sm text-pretty">
              Pantau perkembangan setoran Ziyadah &amp; Muroja&apos;ah, kelola nilai hafalan,
              dan rekap laporan santri dalam satu sistem yang rapi dan terverifikasi.
            </p>

            <ul className="space-y-3 pt-2">
              <li className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <BookOpenCheck className="w-4 h-4" />
                </span>
                Pencatatan setoran hafalan real-time
              </li>
              <li className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </span>
                Penilaian &amp; evaluasi kualitas hafalan
              </li>
              <li className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                Data aman &amp; tersinkron antar perangkat
              </li>
            </ul>
          </div>

          {/* Bottom: address */}
          <p className="relative z-10 text-[11px] text-emerald-200/80 border-t border-emerald-700/40 pt-4">
            MTsN 3 Bojonegoro &bull; Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
          </p>
        </div>

        {/* ===== Right: Login Form ===== */}
        <div className="flex flex-col justify-center p-6 sm:p-10">
          {/* Compact mobile header (logo shows here when branding panel is hidden) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-emerald-800 rounded-2xl flex items-center justify-center p-2.5 shadow-lg mb-3">
              <PesmadLogo size="lg" className="w-full h-full" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Tahfidz al-Qur&apos;an</h2>
            <p className="text-xs font-semibold text-emerald-700">Pesantren Madrasah Darul Fikri</p>
          </div>

          <div className="mb-6 hidden lg:block">
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Masuk ke Akun Anda</h3>
            <p className="text-sm text-slate-500 mt-1">Silakan masuk menggunakan kredensial yang telah didaftarkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-username-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
              <label htmlFor="login-password-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-snug">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              id="btn-submit-login"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Aplikasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>Koneksi aman. Jangan bagikan PIN/kata sandi Anda kepada siapa pun.</span>
            </div>
          </form>

          <p className="text-center text-[11px] text-slate-400 font-medium mt-6 pt-4 border-t border-slate-100">
            &copy; Tahfidz al-Qur&apos;an Pesantren Madrasah Darul Fikri
          </p>
        </div>
      </div>
    </div>
  );
};
