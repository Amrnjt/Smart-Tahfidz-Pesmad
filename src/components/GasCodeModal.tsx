import React, { useState } from 'react';
import { GAS_CODE_FILES, GAS_DEPLOYMENT_GUIDE_MD } from '../services/gasSourceCode';
import { Code, Copy, Check, FileText, Download, Rocket, ExternalLink, HelpCircle, Database } from 'lucide-react';

interface GasCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasCodeModal: React.FC<GasCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeFileKey, setActiveFileKey] = useState<string>('code_gs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'guide'>('code');

  if (!isOpen) return null;

  const currentFile = GAS_CODE_FILES.find(f => f.name.toLowerCase().replace('.', '_') === activeFileKey) || GAS_CODE_FILES[0];

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadFile = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Code className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Kode Google Apps Script & Panduan Deploy</h3>
              <p className="text-xs text-emerald-200">
                Arsitektur 4 File Terpisah (Clean Code) + Google Sheets Database Otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold cursor-pointer"
            >
              ✕ Tutup
            </button>
          </div>
        </div>

        {/* Top Tab Bar: Code vs Guide */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('code')}
              className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white text-emerald-800 border-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 border-transparent'
              }`}
            >
              <Code className="w-4 h-4 text-emerald-700" />
              <span>Daftar File Kode GAS (4 File)</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`py-2.5 px-4 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-white text-emerald-800 border-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 border-transparent'
              }`}
            >
              <Rocket className="w-4 h-4 text-amber-600" />
              <span>Langkah Deploy ke Web App (Anyone)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 font-semibold pb-2">
            <Database className="w-3.5 h-3.5" />
            <span>Auto Create 4 Sheet</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {activeTab === 'code' ? (
            <div className="space-y-4">
              {/* File Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GAS_CODE_FILES.map((file) => {
                  const key = file.name.toLowerCase().replace('.', '_');
                  const isActive = activeFileKey === key;
                  return (
                    <button
                      key={file.name}
                      onClick={() => setActiveFileKey(key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">{file.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {file.language}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 line-clamp-1 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                        {file.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Code Viewer Box */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                {/* Code Action Bar */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="font-mono text-xs font-bold text-slate-300 ml-2">
                      {currentFile.name}
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      • {currentFile.description}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadFile(currentFile.name, currentFile.content)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    <button
                      onClick={() => handleCopyCode(currentFile.content, currentFile.name)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      {copiedKey === currentFile.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Kode</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Body */}
                <pre className="p-4 sm:p-5 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[50vh] leading-relaxed select-all">
                  <code>{currentFile.content}</code>
                </pre>
              </div>
            </div>
          ) : (
            /* Guide Tab */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Panduan 5 Menit Deploy ke Google Apps Script (Web App)
                  </h4>
                  <p className="text-xs text-slate-600">
                    Aplikasi ini gratis di-host langsung di Google Cloud (Google Workspace / Google Drive Anda).
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">1</span>
                    Buka Google Sheets Baru
                  </h5>
                  <p className="text-slate-600">
                    Buka browser Anda dan kunjungi <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-800 font-bold underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a>. Beri nama spreadsheet Anda, misalnya <b>"Database Kelas Tahfidz Al-Qur'an"</b>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">2</span>
                    Buka Menu Apps Script
                  </h5>
                  <p className="text-slate-600">
                    Di Google Sheets, klik menu bar atas: <b>Extensions (Ekstensi)</b> &gt; <b>Apps Script</b>. Editor kode Google Apps Script akan terbuka di tab baru.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">3</span>
                    Buat 4 File dan Salin Kodenya
                  </h5>
                  <p className="text-slate-600">
                    Di panel sebelah kiri Apps Script, klik tombol <b>(+) Tambah File</b>:
                  </p>
                  <ul className="list-disc ml-5 space-y-1 text-slate-700 font-medium">
                    <li>Ganti isi <code>Code.gs</code> dengan kode dari tab <b>Code.gs</b> di atas.</li>
                    <li>Buat file HTML baru bernama <code>Index</code> lalu salin kode dari tab <b>Index.html</b>.</li>
                    <li>Buat file HTML baru bernama <code>CSS</code> lalu salin kode dari tab <b>CSS.html</b>.</li>
                    <li>Buat file HTML baru bernama <code>JavaScript</code> lalu salin kode dari tab <b>JavaScript.html</b>.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">4</span>
                    Inisialisasi Database Otomatis
                  </h5>
                  <p className="text-slate-600">
                    Pilih fungsi <code>initDatabase</code> di toolbar atas editor Apps Script, lalu klik <b>Run (Jalankan)</b>. Berikan izin otorisasi jika diminta. 4 Sheet database (<code>Users</code>, <code>Santri</code>, <code>Ziyadah</code>, <code>Murojaah</code>) akan otomatis dibuat dan diisi data awal!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-1.5">
                  <h5 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">5</span>
                    Deploy sebagai Web App
                  </h5>
                  <p className="text-emerald-900">
                    Klik tombol biru <b>Deploy</b> (di kanan atas) &gt; <b>New Deployment</b>.
                  </p>
                  <ul className="list-disc ml-5 space-y-1 text-emerald-900 font-medium">
                    <li>Pilih tipe: <b>Web App</b></li>
                    <li>Execute as: <b>Me (email akun Google Anda)</b></li>
                    <li>Who has access: <b>Anyone (Siapa Saja)</b></li>
                  </ul>
                  <p className="text-xs text-emerald-800 font-bold mt-2">
                    🎉 Selesai! Salin URL Web App yang muncul dan bagikan ke Ustadz & Wali Santri.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500">
            Dibuat untuk Google Apps Script & Google Sheets Database
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition"
          >
            Tutup Jendela
          </button>
        </div>

      </div>
    </div>
  );
};
