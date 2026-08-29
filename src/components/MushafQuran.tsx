import React, { useState, useEffect, useRef } from 'react';
import { SURAH_LIST } from '../data/quranSurahs';
import { SurahMeta } from '../types';
import { BookOpen, Search, Volume2, VolumeX, Pause, Play, Sparkles, AlertCircle } from 'lucide-react';

interface EquranAyah {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

export const MushafQuran: React.FC = () => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [ayahs, setAyahs] = useState<EquranAyah[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedSurah = SURAH_LIST.find(s => s.number === selectedSurahNumber) || SURAH_LIST[0];

  const filteredSurahs = SURAH_LIST.filter(s =>
    s.nameLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString().includes(searchQuery) ||
    s.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchSurahDetail(selectedSurahNumber);
  }, [selectedSurahNumber]);

  const fetchSurahDetail = async (surahNumber: number) => {
    setIsLoading(true);
    // stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAyahNumber(null);
    }

    try {
      const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
      if (response.ok) {
        const json = await response.json();
        if (json.code === 200 && json.data && json.data.ayat) {
          setAyahs(json.data.ayat);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Fallback local quran data activated:', err);
    }

    // Fallback data if offline / rate limited
    const fallbackAyahs: EquranAyah[] = [
      {
        nomorAyat: 1,
        teksArab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        teksLatin: 'Bismillāhir-raḥmānir-raḥīm',
        teksIndonesia: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
        audio: { '05': 'https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/001.mp3' }
      },
      {
        nomorAyat: 2,
        teksArab: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        teksLatin: 'Al-ḥamdu lillāhi rabbil-‘ālamīn',
        teksIndonesia: 'Segala puji bagi Allah, Tuhan seluruh alam.',
        audio: { '05': 'https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/001.mp3' }
      }
    ];
    setAyahs(fallbackAyahs);
    setIsLoading(false);
  };

  const handlePlayAudio = (ayah: EquranAyah) => {
    const audioUrl = ayah.audio['05'] || Object.values(ayah.audio)[0];
    if (!audioUrl) return;

    if (playingAyahNumber === ayah.nomorAyat && audioRef.current) {
      audioRef.current.pause();
      setPlayingAyahNumber(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAyahNumber(ayah.nomorAyat);

    audio.play().catch(e => {
      console.warn('Audio playback error:', e);
      setPlayingAyahNumber(null);
    });

    audio.onended = () => {
      setPlayingAyahNumber(null);
    };
  };

  return (
    <div className="space-y-6">
      {/* Quran Header & Surah Selector Grid */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <BookOpen className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-slate-800 text-lg sm:text-xl">
                Mushaf Al-Qur'an Digital 30 Juz
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Simak hafalan dan muraja'ah santri lengkap dengan teks Arab, transliterasi Latin, terjemahan Kemenag & audio murattal Syaikh Misyari Rasyid.
            </p>
          </div>

          {/* Search Surah Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Surah (contoh: Yasin, Al-Mulk)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Quick Surah Selection Grid */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Pilih Surah ({filteredSurahs.length} dari 114 Surah):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-1.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            {filteredSurahs.map((surah) => {
              const isSelected = surah.number === selectedSurahNumber;
              return (
                <button
                  key={surah.number}
                  onClick={() => setSelectedSurahNumber(surah.number)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {surah.number}
                    </span>
                    <span className={`font-arabic text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-slate-800'}`}>
                      {surah.nameArabic}
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-bold truncate leading-tight">{surah.nameLatin}</div>
                    <span className={`text-[10px] truncate block ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {surah.numberOfAyahs} Ayat
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Surah Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs text-emerald-200">
                {selectedSurah.number}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide">
                Surah {selectedSurah.nameLatin}
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-500/50 text-emerald-100 font-semibold">
                {selectedSurah.revelationType}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1.5">
              Arti: <span className="font-semibold text-white">{selectedSurah.translation}</span> • Total {selectedSurah.numberOfAyahs} Ayat
            </p>
          </div>

          <div className="text-right">
            <span className="font-arabic text-3xl sm:text-4xl font-bold text-amber-300">
              {selectedSurah.nameArabic}
            </span>
          </div>
        </div>
      </div>

      {/* Bismillah Header (except At-Taubah #9) */}
      {selectedSurah.number !== 9 && (
        <div className="py-6 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <p className="font-arabic text-2xl sm:text-3xl text-emerald-950">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="text-xs text-slate-500 mt-1 italic">
            Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.
          </p>
        </div>
      )}

      {/* Ayahs Container */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold">Memuat ayat-ayat Surah {selectedSurah.nameLatin}...</p>
          </div>
        ) : (
          ayahs.map((ayah) => {
            const isPlaying = playingAyahNumber === ayah.nomorAyat;

            return (
              <div
                key={ayah.nomorAyat}
                className={`bg-white rounded-3xl p-5 sm:p-7 border transition-all duration-200 shadow-xs space-y-4 ${
                  isPlaying ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-200/90'
                }`}
              >
                {/* Ayah Top Control */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                      {ayah.nomorAyat}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Ayat ke-{ayah.nomorAyat}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePlayAudio(ayah)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isPlaying
                        ? 'bg-emerald-800 text-white shadow-sm'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-300" />
                        <span>Jeda Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Murattal</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Arabic Text (Right-aligned, large serif font) */}
                <div className="text-right py-3">
                  <p className="font-arabic text-2xl sm:text-3xl lg:text-4xl text-slate-900 leading-loose">
                    {ayah.teksArab}
                  </p>
                </div>

                {/* Transliteration & Translation */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <p className="text-xs sm:text-sm font-semibold text-emerald-900/90 italic">
                    {ayah.teksLatin}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {ayah.teksIndonesia}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
