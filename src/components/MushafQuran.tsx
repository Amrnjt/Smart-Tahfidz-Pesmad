import React, { useState, useEffect, useRef } from 'react';
import { SURAH_LIST } from '../data/quranSurahs';
import { SurahMeta } from '../types';
import {
  BookOpen,
  Search,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  Sparkles,
  AlertCircle,
  Moon,
  Sun,
  Type,
  RotateCcw,
  SkipBack,
  SkipForward,
  Music,
  ListMusic,
  CheckCircle2,
  Radio,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface EquranAyah {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: Record<string, string>;
}

export const QARI_LIST = [
  { id: '05', name: 'Misyari Rasyid Al-Afasi', folder: 'Misyari-Rasyid-Al-Afasi' },
  { id: '03', name: 'Abdurrahman As-Sudais', folder: 'Abdurrahman-as-Sudais' },
  { id: '01', name: 'Abdullah Al-Juhany', folder: 'Abdullah-Al-Juhany' },
  { id: '02', name: 'Abdul Muhsin Al-Qasim', folder: 'Abdul-Muhsin-Al-Qasim' },
  { id: '04', name: 'Ibrahim Al-Dossari', folder: 'Ibrahim-Al-Dossari' },
];

export const MushafQuran: React.FC = () => {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [ayahs, setAyahs] = useState<EquranAyah[]>([]);
  const [fullAudioUrls, setFullAudioUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQari, setSelectedQari] = useState<string>('05');

  // Audio Playback States
  const [playbackMode, setPlaybackMode] = useState<'idle' | 'full-surah' | 'ayah' | 'auto-continuous'>('idle');
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);

  // Night Mode & Visual Customization
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('mushaf_night_mode');
    return saved === 'true';
  });
  const [fontSizeOffset, setFontSizeOffset] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleNightMode = () => {
    setIsNightMode(prev => {
      const next = !prev;
      localStorage.setItem('mushaf_night_mode', String(next));
      return next;
    });
  };

  const selectedSurah = SURAH_LIST.find(s => s.number === selectedSurahNumber) || SURAH_LIST[0];

  const filteredSurahs = SURAH_LIST.filter(s =>
    s.nameLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.number.toString().includes(searchQuery) ||
    s.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stop active audio helper
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsAudioPlaying(false);
    setPlaybackMode('idle');
    setPlayingAyahNumber(null);
    setCurrentTime(0);
  };

  useEffect(() => {
    fetchSurahDetail(selectedSurahNumber);
  }, [selectedSurahNumber]);

  const fetchSurahDetail = async (surahNumber: number) => {
    setIsLoading(true);
    stopAudio();

    try {
      const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
      if (response.ok) {
        const json = await response.json();
        if (json.code === 200 && json.data) {
          if (json.data.ayat) {
            setAyahs(json.data.ayat);
          }
          if (json.data.audioFull) {
            setFullAudioUrls(json.data.audioFull);
          }
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Fallback local quran data activated:', err);
    }

    // Fallback data if offline / rate limited
    const padded = String(surahNumber).padStart(3, '0');
    const fallbackAudioFull: Record<string, string> = {
      '05': `https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/${padded}.mp3`,
      '03': `https://equran.nos.wjv-1.neo.id/audio-full/Abdurrahman-as-Sudais/${padded}.mp3`,
      '01': `https://equran.nos.wjv-1.neo.id/audio-full/Abdullah-Al-Juhany/${padded}.mp3`,
      '02': `https://equran.nos.wjv-1.neo.id/audio-full/Abdul-Muhsin-Al-Qasim/${padded}.mp3`,
      '04': `https://equran.nos.wjv-1.neo.id/audio-full/Ibrahim-Al-Dossari/${padded}.mp3`,
    };
    setFullAudioUrls(fallbackAudioFull);

    const fallbackAyahs: EquranAyah[] = [
      {
        nomorAyat: 1,
        teksArab: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        teksLatin: 'Bismillāhir-raḥmānir-raḥīm',
        teksIndonesia: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
        audio: { '05': `https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/${padded}.mp3` }
      },
      {
        nomorAyat: 2,
        teksArab: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        teksLatin: 'Al-ḥamdu lillāhi rabbil-‘ālamīn',
        teksIndonesia: 'Segala puji bagi Allah, Tuhan seluruh alam.',
        audio: { '05': `https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/${padded}.mp3` }
      }
    ];
    setAyahs(fallbackAyahs);
    setIsLoading(false);
  };

  // Play full surah audio continuous stream
  const handleToggleFullSurahAudio = () => {
    if (playbackMode === 'full-surah' && audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(e => console.warn(e));
      }
      return;
    }

    // Stop current audio if playing something else
    stopAudio();

    // Determine audio URL
    const padded = String(selectedSurahNumber).padStart(3, '0');
    const selectedQariData = QARI_LIST.find(q => q.id === selectedQari) || QARI_LIST[0];
    const audioUrl = fullAudioUrls[selectedQari] ||
      `https://equran.nos.wjv-1.neo.id/audio-full/${selectedQariData.folder}/${padded}.mp3`;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = volume;
    audio.muted = isMuted;
    audio.loop = isLooping;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      if (!isLooping) {
        setIsAudioPlaying(false);
        setPlaybackMode('idle');
        setCurrentTime(0);
      }
    };

    audio.play()
      .then(() => {
        setIsAudioPlaying(true);
        setPlaybackMode('full-surah');
        setPlayingAyahNumber(null);
      })
      .catch(e => {
        console.warn('Full surah audio error:', e);
        setIsAudioPlaying(false);
        setPlaybackMode('idle');
      });
  };

  // Play individual ayah or continuous sequential
  const handlePlayAyahAudio = (ayah: EquranAyah, continuous = false) => {
    if (playbackMode === 'ayah' && playingAyahNumber === ayah.nomorAyat && audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(e => console.warn(e));
      }
      return;
    }

    stopAudio();

    const audioUrl = ayah.audio[selectedQari] || ayah.audio['05'] || Object.values(ayah.audio)[0];
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = volume;
    audio.muted = isMuted;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      if (continuous) {
        // Find next ayah
        const currentIndex = ayahs.findIndex(a => a.nomorAyat === ayah.nomorAyat);
        if (currentIndex >= 0 && currentIndex < ayahs.length - 1) {
          const nextAyah = ayahs[currentIndex + 1];
          handlePlayAyahAudio(nextAyah, true);
          // Scroll to next ayah smoothly
          const el = document.getElementById(`ayah-${nextAyah.nomorAyat}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      setIsAudioPlaying(false);
      setPlaybackMode('idle');
      setPlayingAyahNumber(null);
    };

    audio.play()
      .then(() => {
        setIsAudioPlaying(true);
        setPlaybackMode(continuous ? 'auto-continuous' : 'ayah');
        setPlayingAyahNumber(ayah.nomorAyat);
        const el = document.getElementById(`ayah-${ayah.nomorAyat}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(e => {
        console.warn('Ayah audio error:', e);
        setIsAudioPlaying(false);
        setPlaybackMode('idle');
        setPlayingAyahNumber(null);
      });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleNextSurah = () => {
    if (selectedSurahNumber < 114) {
      setSelectedSurahNumber(prev => prev + 1);
    }
  };

  const handlePrevSurah = () => {
    if (selectedSurahNumber > 1) {
      setSelectedSurahNumber(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Font size classes based on state
  const arabicFontSizeClass =
    fontSizeOffset === 'xlarge'
      ? 'text-3xl sm:text-4xl lg:text-5xl leading-loose'
      : fontSizeOffset === 'large'
      ? 'text-2xl sm:text-3xl lg:text-4xl leading-loose'
      : 'text-xl sm:text-2xl lg:text-3xl leading-loose';

  const currentQariObj = QARI_LIST.find(q => q.id === selectedQari) || QARI_LIST[0];

  return (
    <div className={`space-y-6 pb-24 transition-colors duration-300 ${isNightMode ? 'night-mode-active text-slate-100' : ''}`}>
      {/* Quran Header & Surah Selector Grid */}
      <div
        className={`rounded-3xl p-5 sm:p-7 border shadow-xs space-y-5 transition-colors duration-300 ${
          isNightMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200/90'
        }`}
      >
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${isNightMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl ${isNightMode ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                <BookOpen className="w-5 h-5" />
              </span>
              <h3 className={`font-extrabold text-lg sm:text-xl ${isNightMode ? 'text-slate-100' : 'text-slate-800'}`}>
                Mushaf Al-Qur'an Digital 30 Juz
              </h3>
            </div>
            <p className={`text-xs sm:text-sm mt-1 ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Simak hafalan dan muraja'ah santri lengkap dengan teks Arab, transliterasi Latin, terjemahan & murottal 1 surat penuh.
            </p>
          </div>

          {/* Controls: Night Mode Toggle, Font Size & Search Box */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Night Mode Toggle Button */}
            <button
              onClick={toggleNightMode}
              type="button"
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isNightMode
                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/40 hover:bg-amber-400/25 shadow-xs'
                  : 'bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-900 shadow-xs'
              }`}
              title={isNightMode ? 'Beralih ke Mode Terang' : 'Aktifkan Mode Malam untuk kenyamanan mata'}
            >
              {isNightMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-300" />
                  <span>Night Mode</span>
                </>
              )}
            </button>

            {/* Font Size Adjuster */}
            <div className={`flex items-center rounded-xl border p-1 text-xs font-bold ${isNightMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setFontSizeOffset('normal')}
                className={`px-2 py-1 rounded-lg transition ${
                  fontSizeOffset === 'normal'
                    ? (isNightMode ? 'bg-emerald-800 text-white' : 'bg-white text-emerald-800 shadow-xs')
                    : (isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600')
                }`}
                title="Ukuran Standar"
              >
                A
              </button>
              <button
                onClick={() => setFontSizeOffset('large')}
                className={`px-2 py-1 rounded-lg transition ${
                  fontSizeOffset === 'large'
                    ? (isNightMode ? 'bg-emerald-800 text-white' : 'bg-white text-emerald-800 shadow-xs')
                    : (isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600')
                }`}
                title="Ukuran Sedang"
              >
                A+
              </button>
              <button
                onClick={() => setFontSizeOffset('xlarge')}
                className={`px-2 py-1 rounded-lg transition ${
                  fontSizeOffset === 'xlarge'
                    ? (isNightMode ? 'bg-emerald-800 text-white' : 'bg-white text-emerald-800 shadow-xs')
                    : (isNightMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600')
                }`}
                title="Ukuran Besar"
              >
                A++
              </button>
            </div>

            {/* Search Surah Box */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Surah (cth: Yasin)..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                  isNightMode
                    ? 'bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:bg-slate-750'
                    : 'bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Quick Surah Selection Grid */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className={`text-xs font-bold uppercase tracking-wider ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Pilih Surah ({filteredSurahs.length} dari 114 Surah):
            </p>
            {isNightMode && (
              <span className="text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                <Moon className="w-3 h-3" /> Mode Belajar Malam Aktif
              </span>
            )}
          </div>
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-52 overflow-y-auto p-2 rounded-2xl border ${
            isNightMode
              ? 'bg-slate-950/70 border-slate-800'
              : 'bg-slate-50/80 border-slate-200'
          }`}>
            {filteredSurahs.map((surah) => {
              const isSelected = surah.number === selectedSurahNumber;
              return (
                <button
                  key={surah.number}
                  onClick={() => setSelectedSurahNumber(surah.number)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? (isNightMode ? 'bg-emerald-900 text-white border-emerald-600 shadow-md' : 'bg-emerald-800 text-white border-emerald-900 shadow-sm')
                      : (isNightMode
                          ? 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/50')
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-bold ${isSelected ? (isNightMode ? 'text-emerald-300' : 'text-emerald-200') : (isNightMode ? 'text-slate-500' : 'text-slate-400')}`}>
                      {surah.number}
                    </span>
                    <span className={`font-arabic text-sm font-bold ${isSelected ? 'text-amber-300' : (isNightMode ? 'text-amber-200' : 'text-slate-800')}`}>
                      {surah.nameArabic}
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-bold truncate leading-tight">{surah.nameLatin}</div>
                    <span className={`text-[10px] truncate block ${isSelected ? 'text-emerald-200' : (isNightMode ? 'text-slate-400' : 'text-slate-400')}`}>
                      {surah.numberOfAyahs} Ayat
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Surah Header Banner with Integrated Full Surah Audio Player */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden text-white transition-colors duration-300 ${
        isNightMode
          ? 'bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 border border-emerald-900/60'
          : 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${isNightMode ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/50' : 'bg-white/20 text-emerald-200'}`}>
                {selectedSurah.number}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide">
                Surah {selectedSurah.nameLatin}
              </h2>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                isNightMode
                  ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
                  : 'bg-emerald-700/80 border-emerald-500/50 text-emerald-100'
              }`}>
                {selectedSurah.revelationType}
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-1.5 ${isNightMode ? 'text-emerald-300/90' : 'text-emerald-200'}`}>
              Arti: <span className="font-semibold text-white">{selectedSurah.translation}</span> • Total {selectedSurah.numberOfAyahs} Ayat
            </p>
          </div>

          {/* Center/Right: Arabic Title & Murottal Full Surah Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 justify-between lg:justify-end">
            <div className="text-left sm:text-right">
              <span className="font-arabic text-3xl sm:text-4xl font-bold text-amber-300 block">
                {selectedSurah.nameArabic}
              </span>
              <span className="text-[11px] text-emerald-200/80 block mt-0.5">
                Qari: {currentQariObj.name}
              </span>
            </div>

            {/* Main Full Surah Audio Play Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFullSurahAudio}
                type="button"
                className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg transition-all cursor-pointer transform active:scale-95 ${
                  playbackMode === 'full-surah' && isAudioPlaying
                    ? 'bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-amber-950/40 ring-4 ring-amber-400/30 animate-pulse'
                    : 'bg-white text-emerald-950 hover:bg-emerald-50 shadow-emerald-950/40'
                }`}
              >
                {playbackMode === 'full-surah' && isAudioPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-amber-950" />
                    <span>Jeda 1 Surat</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-emerald-950" />
                    <span>Putar 1 Surat Penuh</span>
                  </>
                )}
              </button>

              {/* Auto Continue Ayah-by-Ayah Mode Button */}
              {ayahs.length > 0 && (
                <button
                  onClick={() => handlePlayAyahAudio(ayahs[0], true)}
                  type="button"
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    playbackMode === 'auto-continuous'
                      ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200 hover:bg-emerald-900/80'
                  }`}
                  title="Putar ayat demi ayat bersambung otomatis (Auto-Scroll)"
                >
                  <ListMusic className="w-5 h-5" />
                  <span className="hidden sm:inline">Ayat Bersambung</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Qari Selection Bar inside Header */}
        <div className="mt-5 pt-4 border-t border-emerald-700/40 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-300" />
            <span className="font-semibold text-emerald-100">Pilihan Qari / Murattal:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QARI_LIST.map(q => (
              <button
                key={q.id}
                onClick={() => {
                  setSelectedQari(q.id);
                  if (isAudioPlaying) {
                    stopAudio();
                  }
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedQari === q.id
                    ? 'bg-amber-300 text-amber-950 font-bold shadow-xs'
                    : 'bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900 hover:text-white border border-emerald-700/40'
                }`}
              >
                {q.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Surah Navigation Quick Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          onClick={handlePrevSurah}
          disabled={selectedSurahNumber <= 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedSurahNumber <= 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : (isNightMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Surah Sebelumnya</span>
        </button>

        <span className={`text-xs font-bold ${isNightMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Surah {selectedSurah.number} dari 114
        </span>

        <button
          onClick={handleNextSurah}
          disabled={selectedSurahNumber >= 114}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedSurahNumber >= 114
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : (isNightMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
          }`}
        >
          <span>Surah Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bismillah Header (except At-Taubah #9) */}
      {selectedSurah.number !== 9 && (
        <div className={`py-6 text-center rounded-2xl border shadow-2xs transition-colors duration-300 ${
          isNightMode
            ? 'bg-slate-900/90 border-slate-800 text-amber-100'
            : 'bg-white border-slate-200 text-emerald-950'
        }`}>
          <p className={`font-arabic text-2xl sm:text-3xl ${isNightMode ? 'text-amber-200' : 'text-emerald-950'}`}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className={`text-xs mt-1 italic ${isNightMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.
          </p>
        </div>
      )}

      {/* Ayahs Container */}
      <div className="space-y-4">
        {isLoading ? (
          <div className={`rounded-3xl p-12 text-center border ${
            isNightMode
              ? 'bg-slate-900 border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold">Memuat ayat-ayat Surah {selectedSurah.nameLatin}...</p>
          </div>
        ) : (
          ayahs.map((ayah) => {
            const isPlayingThisAyah = (playbackMode === 'ayah' || playbackMode === 'auto-continuous') && playingAyahNumber === ayah.nomorAyat && isAudioPlaying;

            return (
              <div
                id={`ayah-${ayah.nomorAyat}`}
                key={ayah.nomorAyat}
                className={`rounded-3xl p-5 sm:p-7 border transition-all duration-300 shadow-xs space-y-4 ${
                  isPlayingThisAyah
                    ? (isNightMode
                        ? 'bg-slate-850 border-amber-500/80 ring-2 ring-amber-500/30 shadow-lg'
                        : 'bg-amber-50/40 border-emerald-500 ring-2 ring-emerald-200 shadow-sm')
                    : (isNightMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200/90')
                }`}
              >
                {/* Ayah Top Control */}
                <div className={`flex items-center justify-between pb-3 border-b ${isNightMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      isPlayingThisAyah
                        ? 'bg-amber-400 text-amber-950 font-extrabold'
                        : (isNightMode
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-emerald-100 text-emerald-800')
                    }`}>
                      {ayah.nomorAyat}
                    </span>
                    <span className={`text-xs font-semibold ${isPlayingThisAyah ? 'text-amber-500 font-bold' : (isNightMode ? 'text-slate-400' : 'text-slate-500')}`}>
                      Ayat ke-{ayah.nomorAyat} {isPlayingThisAyah && '• Sedang Dilantunkan'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayAyahAudio(ayah, false)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isPlayingThisAyah
                          ? (isNightMode ? 'bg-amber-400 text-amber-950 font-bold shadow-md' : 'bg-emerald-800 text-white shadow-sm')
                          : (isNightMode
                              ? 'bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200')
                      }`}
                    >
                      {isPlayingThisAyah ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Jeda</span>
                        </>
                      ) : (
                        <>
                          <Play className={`w-3.5 h-3.5 ${isNightMode ? 'text-emerald-400' : 'text-emerald-700'}`} />
                          <span>Murottal Ayat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Arabic Text (Right-aligned, large serif font) */}
                <div className="text-right py-3">
                  <p className={`font-arabic ${arabicFontSizeClass} ${
                    isNightMode
                      ? 'text-amber-100 tracking-wide font-medium'
                      : 'text-slate-900 font-normal'
                  }`}>
                    {ayah.teksArab}
                  </p>
                </div>

                {/* Transliteration & Translation */}
                <div className={`pt-3 border-t space-y-1.5 ${isNightMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className={`text-xs sm:text-sm font-semibold italic ${
                    isNightMode
                      ? 'text-emerald-400/90'
                      : 'text-emerald-900/90'
                  }`}>
                    {ayah.teksLatin}
                  </p>
                  <p className={`text-xs sm:text-sm leading-relaxed ${
                    isNightMode
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}>
                    {ayah.teksIndonesia}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating / Sticky Full-Featured Audio Player Bar */}
      {playbackMode !== 'idle' && (
        <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-emerald-500/40 ring-1 ring-emerald-500/30 space-y-3">
            {/* Header Track Info */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/90 text-white flex items-center justify-center flex-shrink-0">
                  <Music className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                    {playbackMode === 'full-surah'
                      ? `Murottal 1 Surat Penuh • Surah ${selectedSurah.nameLatin}`
                      : `Surah ${selectedSurah.nameLatin} • Ayat ke-${playingAyahNumber}`}
                  </h4>
                  <p className="text-[11px] text-emerald-400 font-medium truncate">
                    Qari: {currentQariObj.name}
                  </p>
                </div>
              </div>

              {/* Stop / Close Player */}
              <button
                onClick={stopAudio}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                title="Hentikan Audio"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Time Seeker Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Loop Toggle */}
              <button
                onClick={() => {
                  setIsLooping(prev => {
                    const next = !prev;
                    if (audioRef.current) audioRef.current.loop = next;
                    return next;
                  });
                }}
                className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  isLooping ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isLooping ? 'Ulangi Surat Aktif' : 'Ulangi Surat Nonaktif'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Ulangi</span>
              </button>

              {/* Prev Surah */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevSurah}
                  disabled={selectedSurahNumber <= 1}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Surah Sebelumnya"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Main Play / Pause in floating bar */}
                <button
                  onClick={() => {
                    if (playbackMode === 'full-surah') {
                      handleToggleFullSurahAudio();
                    } else if (playingAyahNumber && ayahs.length > 0) {
                      const curAyah = ayahs.find(a => a.nomorAyat === playingAyahNumber) || ayahs[0];
                      handlePlayAyahAudio(curAyah, playbackMode === 'auto-continuous');
                    }
                  }}
                  className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full shadow-lg transition cursor-pointer transform active:scale-90"
                  title={isAudioPlaying ? 'Jeda Audio' : 'Lanjutkan Audio'}
                >
                  {isAudioPlaying ? (
                    <Pause className="w-5 h-5 fill-slate-950" />
                  ) : (
                    <Play className="w-5 h-5 fill-slate-950" />
                  )}
                </button>

                {/* Next Surah */}
                <button
                  onClick={handleNextSurah}
                  disabled={selectedSurahNumber >= 114}
                  className="p-2 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Surah Berikutnya"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Mute / Unmute */}
              <button
                onClick={() => {
                  setIsMuted(prev => {
                    const next = !prev;
                    if (audioRef.current) audioRef.current.muted = next;
                    return next;
                  });
                }}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isMuted ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isMuted ? 'Buka Suara' : 'Bisukan'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


