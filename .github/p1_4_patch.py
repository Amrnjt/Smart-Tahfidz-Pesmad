from pathlib import Path
import re

ROOT = Path('src/components')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label):
    new_text, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'Expected one regex match for {label}, got {count}')
    return new_text

# --- Ziyadah ---
p = ROOT / 'ZiyadahForm.tsx'
t = p.read_text()
t = replace_once(t,
"import { CirclePlus as PlusCircle, BookOpen, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock } from 'lucide-react';",
"import { CirclePlus as PlusCircle, BookOpen, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, AlertCircle } from 'lucide-react';",
'ziyadah import')
t = replace_once(t,
"  const [showSuccessToast, setShowSuccessToast] = useState(false);",
"  const [showSuccessToast, setShowSuccessToast] = useState(false);\n  const [formError, setFormError] = useState<string | null>(null);",
'ziyadah error state')
t = replace_once(t,
"    setIsSubmitting(true);\n    try {",
"    setFormError(null);\n    setShowSuccessToast(false);\n    setIsSubmitting(true);\n    try {",
'ziyadah submit start')
t = replace_once(t,
"      setTimeout(() => {\n        setShowSuccessToast(false);\n        onSuccess();\n      }, 900);\n    } catch (err) {\n      console.error('Error saving ziyadah:', err);\n      setIsSubmitting(false);\n      alert('Terjadi kendala saat menyimpan data Ziyadah ke Cloud. Silakan coba kembali.');\n    }",
"      setTimeout(() => {\n        setShowSuccessToast(false);\n        onSuccess();\n      }, 900);\n    } catch (err) {\n      console.error('Error saving ziyadah:', err);\n      setFormError('Ziyadah belum tersimpan ke Cloud. Periksa koneksi lalu coba lagi.');\n      setIsSubmitting(false);\n    }",
'ziyadah catch')
t = replace_once(t,
"  return (\n    <div className=\"max-w-3xl mx-auto\">\n      <div className=\"bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6\">",
"  const handleReset = () => {\n    setSurahName(SURAH_LIST[77].nameLatin);\n    setAyatAwal(1);\n    setAyatAkhir(10);\n    setNilai('Sangat Baik');\n    setCatatan('');\n    setTanggalSetor(getTodayInputFormat());\n    setWaktuSetor(getCurrentTimeInputFormat());\n    setShowSuccessToast(false);\n    setFormError(null);\n  };\n\n  return (\n    <div className=\"max-w-3xl mx-auto\">\n      <div className=\"bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5\">",
'ziyadah shell')
t = replace_once(t,
"        <div className=\"flex items-center gap-3.5 pb-5 border-b border-slate-100\">\n          <div className=\"w-12 h-12 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center flex-shrink-0\">",
"        <div className=\"flex items-center gap-3 pb-4 border-b border-slate-100\">\n          <div className=\"w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0\">",
'ziyadah header shell')
t = replace_once(t,
"              Form Input Ziyadah (Hafalan Baru)",
"              Setoran Ziyadah",
'ziyadah title')
t = replace_once(t,
"              Simpan rekam setoran penambahan hafalan baru langsung ke database sistem Tahfidz",
"              Hafalan baru (bil-ghoib) dengan catatan materi dan kualitas setoran.",
'ziyadah subtitle')
t = replace_once(t,
"          <div className=\"p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center gap-2.5 animate-bounce\">\n            <CheckCircle className=\"w-5 h-5 text-emerald-600 flex-shrink-0\" />\n            <span>Setoran Ziyadah berhasil disimpan ke database!</span>\n          </div>",
"          <div className=\"p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2\" role=\"status\">\n            <CheckCircle className=\"w-4 h-4 text-emerald-600 flex-shrink-0\" />\n            <span>Ziyadah berhasil disimpan ke Cloud.</span>\n          </div>",
'ziyadah success')
t = replace_once(t,
"        {mySantriList.length === 0 ? (",
"        {formError && (\n          <div className=\"p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2\" role=\"alert\">\n            <AlertCircle className=\"w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5\" />\n            <span>{formError}</span>\n          </div>\n        )}\n\n        {mySantriList.length === 0 ? (",
'ziyadah error block')
t = sub_once(t,
r'''            <button\n              type="reset"\n              onClick=\{\(\) => \{.*?              \}\}\n              className="px-5 py-2\.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1\.5"\n            >''',
'''            <button\n              type="button"\n              onClick={handleReset}\n              disabled={isSubmitting}\n              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"\n            >''',
'ziyadah reset button')
t = replace_once(t,
"              className=\"px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer\"\n            >\n              {isSubmitting ? (\n                <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin\"></div>\n              ) : (\n                <>\n                  <Save className=\"w-4 h-4\" />\n                  <span>Simpan Setoran Ziyadah</span>\n                </>\n              )}",
"              className=\"px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-950 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed\"\n            >\n              {isSubmitting ? (\n                <>\n                  <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin\"></div>\n                  <span>Menyimpan...</span>\n                </>\n              ) : (\n                <>\n                  <Save className=\"w-4 h-4\" />\n                  <span>Simpan</span>\n                </>\n              )}",
'ziyadah primary action')
t = t.replace('📅 {formatTanggalLengkap(tanggalSetor)}', '{formatTanggalLengkap(tanggalSetor)}')
p.write_text(t)

# --- Murojaah ---
p = ROOT / 'MurojaahForm.tsx'
t = p.read_text()
t = replace_once(t,
"import { RotateCw, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen } from 'lucide-react';",
"import { RotateCw, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';",
'murojaah import')
t = replace_once(t,
"  const [showSuccessToast, setShowSuccessToast] = useState(false);",
"  const [showSuccessToast, setShowSuccessToast] = useState(false);\n  const [formError, setFormError] = useState<string | null>(null);",
'murojaah error state')
t = replace_once(t,
"    setIsSubmitting(true);\n    try {",
"    setFormError(null);\n    setShowSuccessToast(false);\n    setIsSubmitting(true);\n    try {",
'murojaah submit start')
t = replace_once(t,
"    } catch (err) {\n      console.error('Error saving murojaah:', err);\n      setIsSubmitting(false);\n      alert('Terjadi kendala saat menyimpan data Murojaah ke Cloud. Silakan coba kembali.');\n    }",
"    } catch (err) {\n      console.error('Error saving murojaah:', err);\n      setFormError(\"Muroja'ah belum tersimpan ke Cloud. Periksa koneksi lalu coba lagi.\");\n      setIsSubmitting(false);\n    }",
'murojaah catch')
t = replace_once(t,
"  return (\n    <div className=\"max-w-3xl mx-auto\">\n      <div className=\"bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6\">",
"  const handleReset = () => {\n    setSurahName(SURAH_LIST[77].nameLatin);\n    setAyatAwal(1);\n    setAyatAkhir(20);\n    setNilai('Sangat Baik');\n    setCatatan('');\n    setTanggalSetor(getTodayInputFormat());\n    setWaktuSetor(getCurrentTimeInputFormat());\n    setShowSuccessToast(false);\n    setFormError(null);\n  };\n\n  return (\n    <div className=\"max-w-3xl mx-auto\">\n      <div className=\"bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5\">",
'murojaah shell')
t = replace_once(t,
"        <div className=\"flex items-center gap-3.5 pb-5 border-b border-slate-100\">\n          <div className=\"w-12 h-12 rounded-2xl bg-teal-100/90 text-teal-800 flex items-center justify-center flex-shrink-0\">",
"        <div className=\"flex items-center gap-3 pb-4 border-b border-slate-100\">\n          <div className=\"w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0\">",
'murojaah header shell')
t = replace_once(t,
"              Form Input Muroja'ah (Pengulangan Hafalan)",
"              Setoran Muroja'ah",
'murojaah title')
t = replace_once(t,
"              Evaluasi kelancaran dan kekokohan hafalan santri yang telah dipelajari",
"              Pengulangan hafalan dengan pencatatan materi dan kualitas kelancaran.",
'murojaah subtitle')
t = replace_once(t,
"          <div className=\"p-4 bg-teal-50 border border-teal-300 rounded-2xl text-teal-800 text-sm font-semibold flex items-center gap-2.5 animate-bounce\">\n            <CheckCircle className=\"w-5 h-5 text-teal-600 flex-shrink-0\" />\n            <span>Setoran Muroja'ah berhasil disimpan ke database!</span>\n          </div>",
"          <div className=\"p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-semibold flex items-center gap-2\" role=\"status\">\n            <CheckCircle className=\"w-4 h-4 text-teal-600 flex-shrink-0\" />\n            <span>Muroja'ah berhasil disimpan ke Cloud.</span>\n          </div>",
'murojaah success')
t = replace_once(t,
"        {mySantriList.length === 0 ? (",
"        {formError && (\n          <div className=\"p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2\" role=\"alert\">\n            <AlertCircle className=\"w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5\" />\n            <span>{formError}</span>\n          </div>\n        )}\n\n        {mySantriList.length === 0 ? (",
'murojaah error block')
t = sub_once(t,
r'''            <button\n              type="reset"\n              onClick=\{\(\) => \{.*?              \}\}\n              className="px-5 py-2\.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1\.5"\n            >''',
'''            <button\n              type="button"\n              onClick={handleReset}\n              disabled={isSubmitting}\n              className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"\n            >''',
'murojaah reset button')
t = replace_once(t,
"              className=\"px-6 py-3 rounded-xl bg-teal-800 hover:bg-teal-700 active:bg-teal-950 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer\"\n            >\n              {isSubmitting ? (\n                <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin\"></div>\n              ) : (\n                <>\n                  <Save className=\"w-4 h-4\" />\n                  <span>Simpan Setoran Muroja'ah</span>\n                </>\n              )}",
"              className=\"px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 active:bg-teal-950 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed\"\n            >\n              {isSubmitting ? (\n                <>\n                  <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin\"></div>\n                  <span>Menyimpan...</span>\n                </>\n              ) : (\n                <>\n                  <Save className=\"w-4 h-4\" />\n                  <span>Simpan</span>\n                </>\n              )}",
'murojaah primary action')
t = t.replace('📅 {formatTanggalLengkap(tanggalSetor)}', '{formatTanggalLengkap(tanggalSetor)}')
p.write_text(t)

# --- Binnadzor ---
p = ROOT / 'BinnadzorForm.tsx'
t = p.read_text()
t = replace_once(t,
"import { BookOpenCheck, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, Layers, Bookmark, Sparkles, Check } from 'lucide-react';",
"import { BookOpenCheck, CircleCheck as CheckCircle, Save, RotateCcw, Calendar, Clock, BookOpen, Layers, Bookmark, Sparkles, Check, AlertCircle } from 'lucide-react';",
'binnadzor import')
t = replace_once(t,
"  const [showSuccessToast, setShowSuccessToast] = useState(false);",
"  const [showSuccessToast, setShowSuccessToast] = useState(false);\n  const [formError, setFormError] = useState<string | null>(null);",
'binnadzor error state')
t = replace_once(t,
"    setIsSubmitting(true);\n    try {",
"    setFormError(null);\n    setShowSuccessToast(false);\n    setIsSubmitting(true);\n    try {",
'binnadzor submit start')
t = replace_once(t,
"      setTimeout(() => {\n        onSuccess();\n      }, 900);\n    } catch (err) {\n      console.error(err);\n      setIsSubmitting(false);\n    }",
"      setTimeout(() => {\n        setShowSuccessToast(false);\n        onSuccess();\n      }, 900);\n    } catch (err) {\n      console.error(err);\n      setFormError('Binnadzor belum tersimpan ke Cloud. Periksa koneksi lalu coba lagi.');\n      setIsSubmitting(false);\n    }",
'binnadzor catch')
t = replace_once(t,
"    setTanggalSetor(getTodayInputFormat());\n    setWaktuSetor(getCurrentTimeInputFormat());",
"    setTanggalSetor(getTodayInputFormat());\n    setWaktuSetor(getCurrentTimeInputFormat());\n    setModeInput('surah');",
'binnadzor reset mode')
t = replace_once(t,
"    setNilai('Sangat Baik');\n    setCatatan('');",
"    setNilai('Sangat Baik');\n    setHukumTajwid('Baik');\n    setMakhrojHuruf('Baik');\n    setKefasihan('Baik');\n    setKelancaran('Sangat Baik');\n    setCatatan('');\n    setShowSuccessToast(false);\n    setFormError(null);",
'binnadzor reset quality')
t = sub_once(t,
r'''  return \(\n    <div className="max-w-2xl mx-auto space-y-5">.*?        \{/\* Form Isi \*/\}\n        <form onSubmit=\{handleSubmit\} className="p-5 sm:p-6 space-y-5">''',
'''  return (\n    <div className="max-w-3xl mx-auto">\n      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">\n        {/* Form Header */}\n        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">\n          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center flex-shrink-0">\n            <BookOpenCheck className="w-6 h-6" />\n          </div>\n          <div className="min-w-0">\n            <div className="flex items-center gap-2 flex-wrap">\n              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Setoran Binnadzor</h3>\n              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Melihat Mushaf</span>\n            </div>\n            <p className="text-xs sm:text-sm text-slate-500">Bacaan tartil dengan penilaian tajwid, makhraj, fashohah, dan kelancaran.</p>\n          </div>\n        </div>\n\n        {showSuccessToast && (\n          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-xs font-semibold flex items-center gap-2" role="status">\n            <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />\n            <span>Binnadzor berhasil disimpan ke Cloud.</span>\n          </div>\n        )}\n\n        {formError && (\n          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2" role="alert">\n            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />\n            <span>{formError}</span>\n          </div>\n        )}\n\n        <form onSubmit={handleSubmit} className="space-y-5">''',
'binnadzor shell header')
t = sub_once(t,
r'''          \{/\* 1\. Pilih Santri \*/\}.*?          \{/\* 3\. Pilihan Mode Materi Binnadzor \*/\}''',
'''          {/* Santri, Tanggal & Waktu */}\n          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n            <div>\n              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">\n                Pilih Santri <span className="text-rose-500">*</span>\n              </label>\n              <select\n                value={idSantri}\n                onChange={(e) => setIdSantri(e.target.value)}\n                required\n                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"\n              >\n                <option value="">-- Pilih Nama Santri --</option>\n                {mySantriList.map((s) => (\n                  <option key={s.idSantri} value={s.idSantri}>\n                    {s.namaSantri} ({s.kelas})\n                  </option>\n                ))}\n              </select>\n              {myKelas && (\n                <p className="text-[11px] text-indigo-700 font-semibold mt-1">\n                  Kelas: {myKelas.namaKelas} • {mySantriList.length} santri\n                </p>\n              )}\n            </div>\n\n            <div>\n              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">\n                <Calendar className="w-3.5 h-3.5 text-indigo-700" />\n                <span>Tanggal Setoran <span className="text-rose-500">*</span></span>\n              </label>\n              <input\n                type="date"\n                value={tanggalSetor}\n                onChange={(e) => setTanggalSetor(e.target.value)}\n                required\n                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"\n              />\n              <span className="text-[11px] text-indigo-700 font-semibold mt-1 block truncate">\n                {formatTanggalLengkap(tanggalSetor)}\n              </span>\n            </div>\n\n            <div>\n              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">\n                <Clock className="w-3.5 h-3.5 text-indigo-700" />\n                <span>Waktu / Jam <span className="text-rose-500">*</span></span>\n              </label>\n              <input\n                type="time"\n                value={waktuSetor}\n                onChange={(e) => setWaktuSetor(e.target.value)}\n                required\n                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"\n              />\n              <span className="text-[11px] text-slate-500 mt-1 block">WIB (Waktu Indonesia Barat)</span>\n            </div>\n          </div>\n\n          {/* 3. Pilihan Mode Materi Binnadzor */}''',
'binnadzor identity block')
t = t.replace('bg-gradient-to-br from-indigo-50/70 via-slate-50 to-teal-50/50', 'bg-indigo-50/50', 1)
t = replace_once(t,
"              className=\"px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer\"",
"              className=\"px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50\"",
'binnadzor reset style')
t = replace_once(t,
"              className=\"px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50\"\n            >\n              <Save className=\"w-4 h-4\" />\n              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Setoran Binnadzor'}</span>",
"              className=\"px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-950 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed\"\n            >\n              {isSubmitting ? <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin\" /> : <Save className=\"w-4 h-4\" />}\n              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>",
'binnadzor primary action')
p.write_text(t)

# --- Pembelajaran ---
p = ROOT / 'PembelajaranForm.tsx'
t = p.read_text()
t = replace_once(t,
"  const [showSuccessToast, setShowSuccessToast] = useState(false);",
"  const [showSuccessToast, setShowSuccessToast] = useState(false);\n  const [formError, setFormError] = useState<string | null>(null);",
'pembelajaran error state')
t = replace_once(t,
"    setIsSubmitting(true);\n    try {",
"    setFormError(null);\n    setShowSuccessToast(false);\n    setIsSubmitting(true);\n    try {",
'pembelajaran submit start')
t = replace_once(t,
"      setTimeout(() => {\n        onSuccess();\n      }, 900);\n    } catch (err) {\n      console.error(err);\n      setIsSubmitting(false);\n    }",
"      setTimeout(() => {\n        setShowSuccessToast(false);\n        onSuccess();\n      }, 900);\n    } catch (err) {\n      console.error(err);\n      setFormError('Pembelajaran belum tersimpan ke Cloud. Periksa koneksi lalu coba lagi.');\n      setIsSubmitting(false);\n    }",
'pembelajaran catch')
t = replace_once(t,
"    setNilai('Baik');\n    setStatusKenaikan('Lanjut Halaman');",
"    setNilai('Baik');\n    setHukumTajwid('Baik');\n    setMakhrojHuruf('Baik');\n    setKefasihan('Baik');\n    setKelancaran('Baik');\n    setStatusKenaikan('Lanjut Halaman');",
'pembelajaran reset quality')
t = replace_once(t,
"    setRekomendasiTindakLanjut('');\n  };",
"    setRekomendasiTindakLanjut('');\n    setShowSuccessToast(false);\n    setFormError(null);\n  };",
'pembelajaran reset feedback')
t = sub_once(t,
r'''  return \(\n    <div className="max-w-3xl mx-auto pb-10">.*?        <form onSubmit=\{handleSubmit\} className="p-6 space-y-6">''',
'''  return (\n    <div className="max-w-3xl mx-auto">\n      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">\n        {/* Form Header */}\n        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">\n          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">\n            <GraduationCap className="w-6 h-6" />\n          </div>\n          <div>\n            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Setoran Pembelajaran</h3>\n            <p className="text-xs sm:text-sm text-slate-500">Jilid Ummi Dewasa dan Kelas Istimewa dengan evaluasi progres materi.</p>\n          </div>\n        </div>\n\n        {showSuccessToast && (\n          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2" role="status">\n            <CheckCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />\n            <span>Pembelajaran berhasil disimpan ke Cloud.</span>\n          </div>\n        )}\n\n        {formError && (\n          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2" role="alert">\n            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />\n            <span>{formError}</span>\n          </div>\n        )}\n\n        <form onSubmit={handleSubmit} className="space-y-5">''',
'pembelajaran shell header')
t = sub_once(t,
r'''          \{/\* 2\. Pilih Santri & Tanggal \*/\}.*?          \{/\* 3\. Panel Materi Berdasarkan Tipe Kelas \*/\}''',
'''          {/* 2. Pilih Santri, Tanggal & Waktu */}\n          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">\n            <div>\n              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">\n                Pilih Santri <span className="text-rose-500">*</span>\n              </label>\n              <select\n                value={idSantri}\n                onChange={(e) => handleSantriChange(e.target.value)}\n                required\n                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"\n              >\n                <option value="">-- Pilih Nama Santri --</option>\n                {filteredSantriList.map((santri) => (\n                  <option key={santri.idSantri} value={santri.idSantri}>\n                    {santri.namaSantri} ({santri.kelas || 'Belum ada kelas'})\n                  </option>\n                ))}\n              </select>\n              {currentSantri?.kelas && (\n                <p className="text-[11px] text-amber-800 font-semibold mt-1">\n                  Kelas: {currentSantri.kelas}\n                </p>\n              )}\n            </div>\n\n            <div>\n              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">\n                <Calendar className="w-3.5 h-3.5 text-amber-700" />\n                <span>Tanggal Setoran <span className="text-rose-500">*</span></span>\n              </label>\n              <input\n                type="date"\n                value={tanggalSetor}\n                onChange={(e) => setTanggalSetor(e.target.value)}\n                required\n                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"\n              />\n              <span className="text-[11px] text-amber-800 font-semibold mt-1 block truncate">\n                {formatTanggalLengkap(tanggalSetor)}\n              </span>\n            </div>\n\n            <div>\n              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center gap-1">\n                <Clock className="w-3.5 h-3.5 text-amber-700" />\n                <span>Waktu / Jam <span className="text-rose-500">*</span></span>\n              </label>\n              <input\n                type="time"\n                value={waktuSetor}\n                onChange={(e) => setWaktuSetor(e.target.value)}\n                required\n                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"\n              />\n              <span className="text-[11px] text-slate-500 mt-1 block">WIB (Waktu Indonesia Barat)</span>\n            </div>\n          </div>\n\n          {/* 3. Panel Materi Berdasarkan Tipe Kelas */}''',
'pembelajaran identity block')
t = t.replace('bg-gradient-to-br from-slate-50 to-emerald-50/40', 'bg-amber-50/40', 1)
t = replace_once(t,
"              className=\"px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer\"",
"              disabled={isSubmitting}\n              className=\"px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50\"",
'pembelajaran reset style')
t = replace_once(t,
"              className=\"px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50\"\n            >\n              <Save className=\"w-4 h-4\" />\n              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembelajaran'}</span>",
"              className=\"px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 active:bg-amber-950 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed\"\n            >\n              {isSubmitting ? <div className=\"w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin\" /> : <Save className=\"w-4 h-4\" />}\n              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>",
'pembelajaran primary action')
p.write_text(t)

print('P1.4 setoran form UX patch applied')
