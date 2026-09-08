import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { UserCheck, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, BookOpenCheck, MoonStar, CircleCheck } from 'lucide-react';
import { PesmadLogo } from './PesmadLogo';
import type { NotifyFn } from './Snackbar';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onNotify: NotifyFn;
}

/** Tracks whether the viewport is desktop-sized (lg breakpoint: 1024px). */
function useIsDesktop(): boolean {
  const query = '(min-width: 1024px)';
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

interface FormState {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  errorMsg: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNotify }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isDesktop = useIsDesktop();

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
    onNotify('info', 'Lupa password? Hubungi Ustadz/Admin Tahfidz untuk pengaturan ulang PIN atau kata sandi.');
  };

  const formState: FormState = {
    username, setUsername,
    password, setPassword,
    showPassword, setShowPassword,
    rememberMe, setRememberMe,
    errorMsg, isLoading,
    onSubmit: handleSubmit,
    onForgotPassword: handleForgotPassword,
  };

  return isDesktop ? <DesktopLogin {...formState} /> : <MobileLogin {...formState} />;
};

/* =====================================================================
   DESKTOP — split-screen branding + form card
   ===================================================================== */
const DesktopLogin: React.FC<FormState> = ({
  username, setUsername, password, setPassword,
  showPassword, setShowPassword, rememberMe, setRememberMe,
  errorMsg, isLoading, onSubmit, onForgotPassword,
}) => (
  <div className="max-w-5xl mx-auto my-4 sm:my-10 px-1 sm:px-4">
    <div className="grid lg:grid-cols-2 bg-white rounded-2xl shadow-lg shadow-slate-950/10 border border-slate-200/80 overflow-hidden">
      {/* ===== Left: Branding / Visual Panel ===== */}
      <div className="relative flex flex-col justify-between p-10 text-white bg-emerald-950 overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 border-2 border-emerald-400/70 shadow-lg">
            <PesmadLogo size="lg" className="w-full h-full" />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold tracking-tight text-lg">Tahfidz al-Qur&apos;an</p>
            <p className="text-xs font-semibold text-emerald-200/90">Pesantren Madrasah Darul Fikri</p>
          </div>
        </div>

        <div className="relative z-10 space-y-5 py-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-900 text-emerald-100 border border-emerald-800 text-xs font-semibold">
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
                <CircleCheck className="w-4 h-4" />
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

        <p className="relative z-10 text-xs text-emerald-200/80 border-t border-emerald-700/40 pt-4">
          MTsN 3 Bojonegoro &bull; Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
        </p>
      </div>

      {/* ===== Right: Login Form ===== */}
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="mb-6">
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Masuk ke Akun Anda</h3>
          <p className="text-sm text-slate-500 mt-1">Silakan masuk menggunakan kredensial yang telah didaftarkan.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" aria-busy={isLoading}>
          <div>
            <label htmlFor="login-username-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Username / ID Santri / NIS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <input
                id="login-username-input"
                type="text"
                autoComplete="username"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? 'login-error-message' : undefined}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan Username / ID Santri"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
              Password / PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? 'login-error-message' : undefined}
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
                className="absolute inset-y-0 right-0 min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

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
              onClick={onForgotPassword}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Lupa Password?
            </button>
          </div>

          {errorMsg && (
            <div id="login-error-message" role="alert" aria-live="assertive" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="font-semibold leading-snug">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            id="btn-submit-login"
            disabled={isLoading}
            className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

          <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>Koneksi aman. Jangan bagikan PIN/kata sandi Anda kepada siapa pun.</span>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 font-medium mt-6 pt-4 border-t border-slate-100">
          &copy; Tahfidz al-Qur&apos;an Pesantren Madrasah Darul Fikri
        </p>
      </div>
    </div>
  </div>
);

/* =====================================================================
   MOBILE — immersive, app-style login (major upgrade)
   ===================================================================== */
const MobileLogin: React.FC<FormState> = ({
  username, setUsername, password, setPassword,
  showPassword, setShowPassword, rememberMe, setRememberMe,
  errorMsg, isLoading, onSubmit, onForgotPassword,
}) => (
  <div className="-mx-3 -my-5 min-h-[calc(100vh-3.5rem)] flex flex-col bg-emerald-950 relative overflow-hidden">
    {/* ===== Hero ===== */}
    <div className="relative z-10 flex flex-col items-center text-center px-6 pt-12 pb-9 text-white">
      <div className="relative mb-5">
        <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 border border-emerald-300 shadow-lg shadow-emerald-950/20">
          <PesmadLogo size="lg" className="w-full h-full" />
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-900 text-emerald-100 border border-emerald-800 text-xs font-semibold mb-4">
        <MoonStar className="w-3.5 h-3.5" />
        Portal Sistem Mutaba&apos;ah
      </span>

      <h1 className="text-2xl font-extrabold tracking-tight leading-tight text-balance">
        Assalamu&apos;alaikum
      </h1>
      <p className="text-sm text-emerald-100/90 mt-1.5 max-w-xs text-pretty leading-relaxed">
        Selamat datang di Portal Hafalan Santri Tahfidz al-Qur&apos;an Pesantren Madrasah Darul Fikri.
      </p>
    </div>

    {/* ===== Form sheet ===== */}
    <div className="relative z-10 flex-1 bg-white rounded-t-[2rem] shadow-[0_-12px_40px_-12px_rgba(6,78,59,0.5)] px-6 pt-7 pb-9">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Masuk ke Akun</h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">Gunakan kredensial yang telah didaftarkan.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" aria-busy={isLoading}>
        <div>
          <label htmlFor="login-username-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
            Username / ID Santri / NIS
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <input
              id="login-username-input"
              type="text"
                autoComplete="username"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? 'login-error-message' : undefined}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan Username / ID Santri"
              className="w-full min-h-[52px] pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password-input" className="block text-sm font-semibold text-slate-800 mb-1.5">
            Password / PIN
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-700">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="login-password-input"
              type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={!!errorMsg}
                aria-describedby={errorMsg ? 'login-error-message' : undefined}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan Password / PIN"
              className="w-full min-h-[52px] pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

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
            onClick={onForgotPassword}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            Lupa Password?
          </button>
        </div>

        {errorMsg && (
            <div id="login-error-message" role="alert" aria-live="assertive" className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold leading-snug">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          id="btn-submit-login"
          disabled={isLoading}
          className="w-full min-h-[52px] bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

        <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>Koneksi aman. Jangan bagikan PIN/kata sandi Anda kepada siapa pun.</span>
        </div>
      </form>

      <p className="text-center text-xs text-slate-400 font-medium mt-6">
        &copy; Tahfidz al-Qur&apos;an Pesantren Madrasah Darul Fikri
      </p>
    </div>
  </div>
);
