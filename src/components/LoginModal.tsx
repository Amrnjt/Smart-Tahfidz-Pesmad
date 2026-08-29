import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { BookOpen, UserCheck, Lock, AlertCircle, ArrowRight, Shield, Users, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoleHint, setSelectedRoleHint] = useState<UserRole | 'ALL'>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const users = storageService.getUsers();
      const trimmedUser = username.trim().toLowerCase();
      const trimmedPass = password.trim();

      const matched = users.find(
        u => u.username.toLowerCase() === trimmedUser && u.password === trimmedPass
      );

      if (matched) {
        storageService.setSession(matched);
        onLoginSuccess(matched);
      } else {
        setErrorMsg('Username / ID Santri atau Password salah. Silakan periksa kembali kredensial Anda.');
      }
    }, 400);
  };

  return (
    <div className="max-w-xl mx-auto my-4 sm:my-8 px-3 sm:px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-6 sm:p-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3.5">
            <BookOpen className="w-8 h-8 text-emerald-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Tahfidz al-Qur'an</h2>
          <p className="text-sm font-semibold text-emerald-100 mt-0.5">
            Pesantren Madrasah Darul Fikri
          </p>
          <p className="text-[11px] sm:text-xs text-emerald-200/90 mt-1 max-w-sm mx-auto">
            Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro • Sistem Mutaba'ah & Database Terintegrasi
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Role Access Explanatory Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Struktur Hak Akses Akun:
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold">Siap Digunakan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Ustadz Card */}
              <div
                onClick={() => {
                  setSelectedRoleHint('Ustadz');
                  setUsername('admin');
                  setPassword('123');
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedRoleHint === 'Ustadz'
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-emerald-950">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Ustadz (Admin)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Login Admin default: <code className="font-mono font-bold text-emerald-800">admin</code> (PIN: 123)
                </p>
              </div>

              {/* Wali Card */}
              <div
                onClick={() => {
                  setSelectedRoleHint('Wali');
                  setUsername('wali_str001');
                  setPassword('123');
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedRoleHint === 'Wali'
                    ? 'bg-teal-50/90 border-teal-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-teal-950">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  <span>Wali Santri</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Akses di rumah: format <code className="font-mono font-bold text-teal-800">wali_[idsantri]</code> (PIN: 123)
                </p>
              </div>

              {/* Santri Card */}
              <div
                onClick={() => {
                  setSelectedRoleHint('Santri');
                  setUsername('STR001');
                  setPassword('123');
                }}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedRoleHint === 'Santri'
                    ? 'bg-cyan-50/90 border-cyan-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold text-xs text-cyan-950">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Santri (View-Only)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Akses mandiri: gunakan <code className="font-mono font-bold text-cyan-800">[ID_Santri]</code> (PIN: 123)
                </p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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
                  placeholder="Masukkan username atau ID santri (cth: ustadz1, wali_str001, STR001)"
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
                  placeholder="Masukkan password akun Anda"
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
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
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
