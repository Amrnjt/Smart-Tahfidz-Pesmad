import React from 'react';
import { ClipboardCheck, UserRound } from 'lucide-react';
import type { Santri, User } from '../types';
import { storageService } from '../services/storageService';
import { PantauanLiburanWaliSection } from './PantauanLiburanWaliSection';
import type { NotifyFn } from './Snackbar';

interface WaliPantauanPageProps {
  currentUser: User;
  santriList: Santri[];
  onNotify: NotifyFn;
}

export const WaliPantauanPage: React.FC<WaliPantauanPageProps> = ({
  currentUser,
  santriList,
  onNotify
}) => {
  const targetSantri = santriList.find(santri => santri.idSantri === currentUser.idSantri);

  if (!targetSantri) {
    return (
      <section className="ui-panel mx-auto max-w-3xl p-5 sm:p-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-950">Pantauan belum dapat dibuka</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Akun wali belum terhubung ke profil santri. Hubungi admin untuk memeriksa relasi ID santri.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const programLiburanActive = storageService.getAppConfig().programLiburanActive;

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-5">
      <header className="px-1">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Laporan harian wali</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Pantauan amaliyah</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Catat wirid dan status shalat {targetSantri.namaSantri} pada tanggal yang dipilih.
            </p>
          </div>
        </div>
      </header>

      <PantauanLiburanWaliSection
        currentUser={currentUser}
        targetSantri={targetSantri}
        isActive={programLiburanActive}
        onNotify={onNotify}
      />
    </div>
  );
};
