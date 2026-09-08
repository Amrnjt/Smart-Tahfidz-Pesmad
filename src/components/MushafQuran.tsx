import React, { useState, useEffect, useRef } from 'react';
import { SURAH_LIST } from '../data/quranSurahs';
import { Search, Volume2, VolumeX, Pause, Play, Square, AlertCircle, Moon, Sun, RotateCcw, SkipBack, SkipForward, ListMusic, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const [showLatin, setShowLatin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const surahRequestRef = useRef(0);

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
    setDuration(0);
    setAudioError(null);
  };

  useEffect(() => {
    fetchSurahDetail(selectedSurahNumber);
  }, [selectedSurahNumber]);

  useEffect(() => () => {
    surahRequestRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  const fetchSurahDetail = async (surahNumber: number) => {
    const requestId = ++surahRequestRef.current;
    setIsLoading(true);
    setLoadError(null);
    setAyahs([]);
    setFullAudioUrls({});
    stopAudio();

    try {
      const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
      if (response.ok) {
        const json = await response.json();
        if (requestId !== surahRequestRef.current) return;
        if (json.code === 200 && json.data && Array.isArray(json.data.ayat) && json.data.ayat.length > 0) {
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
      console.warn('Surah text could not be loaded:', err);
    }

    if (requestId !== surahRequestRef.current) return;

    // Keep the existing full-surah audio source, but never substitute another surah's text.
    const padded = String(surahNumber).padStart(3, '0');
    const fallbackAudioFull: Record<string, string> = {
      '05': `https://equran.nos.wjv-1.neo.id/audio-full/Misyari-Rasyid-Al-Afasi/${padded}.mp3`,
      '03': `https://equran.nos.wjv-1.neo.id/audio-full/Abdurrahman-as-Sudais/${padded}.mp3`,
      '01': `https://equran.nos.wjv-1.neo.id/audio-full/Abdullah-Al-Juhany/${padded}.mp3`,
      '02': `https://equran.nos.wjv-1.neo.id/audio-full/Abdul-Muhsin-Al-Qasim/${padded}.mp3`,
      '04': `https://equran.nos.wjv-1.neo.id/audio-full/Ibrahim-Al-Dossari/${padded}.mp3`,
    };
    setFullAudioUrls(fallbackAudioFull);

    setLoadError('Ayat surah ini belum dapat dimuat. Periksa koneksi, lalu coba lagi.');
    setIsLoading(false);
  };

  // Play full surah audio continuous stream
  const handleToggleFullSurahAudio = () => {
    if (playbackMode === 'full-surah' && audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().then(() => { setIsAudioPlaying(true); setAudioError(null); }).catch(e => {
          console.warn(e);
          setAudioError('Audio belum dapat diputar. Periksa koneksi, lalu coba putar kembali.');
        });
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
        setAudioError('Audio belum dapat diputar. Periksa koneksi, lalu coba putar kembali.');
        setIsAudioPlaying(false);
        setPlaybackMode('idle');
      });
  };

  // Play individual ayah or continuous sequential
  const handlePlayAyahAudio = (ayah: EquranAyah, continuous = false) => {
    if ((playbackMode === 'ayah' || playbackMode === 'auto-continuous') &&
        playingAyahNumber === ayah.nomorAyat && audioRef.current &&
        (!continuous || playbackMode === 'auto-continuous')) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().then(() => { setIsAudioPlaying(true); setAudioError(null); }).catch(e => {
          console.warn(e);
          setAudioError('Audio belum dapat diputar. Periksa koneksi, lalu coba putar kembali.');
        });
      }
      return;
    }

    stopAudio();

    const audioUrl = ayah.audio[selectedQari] || ayah.audio['05'] || Object.values(ayah.audio)[0];
    if (!audioUrl) {
      setAudioError('Audio ayat ini belum tersedia. Coba qari lain atau putar surah penuh.');
      return;
    }

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
        setAudioError('Audio belum dapat diputar. Periksa koneksi, lalu coba putar kembali.');
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


  const arabicFontSizeClass =
    fontSizeOffset === 'xlarge'
      ? 'text-4xl sm:text-5xl leading-[2.4]'
      : fontSizeOffset === 'large'
        ? 'text-3xl sm:text-4xl leading-[2.4]'
        : 'text-2xl sm:text-3xl leading-[2.4]';
  const currentQariObj = QARI_LIST.find((q) => q.id === selectedQari) || QARI_LIST[0];
  const surfaceClass = isNightMode
    ? 'border-slate-700 bg-slate-900 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900';
  const mutedClass = isNightMode ? 'text-slate-300' : 'text-slate-600';
  const controlClass = isNightMode
    ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <div
      className={`p3-mushaf-page space-y-4 ${playbackMode !== 'idle' ? 'pb-[calc(24rem+env(safe-area-inset-bottom,0px))]' : 'pb-6'} ${isNightMode ? 'night-mode-active rounded-xl bg-slate-950 text-slate-100' : ''}`}
    >
      <header className={`rounded-xl border p-4 sm:p-6 ${surfaceClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Mushaf Al-Qur'an</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>Baca dan dengarkan surah pilihan.</p>
          </div>
          <button
            type="button"
            onClick={toggleNightMode}
            aria-pressed={isNightMode}
            aria-label="Mode malam"
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}
          >
            {isNightMode ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            {isNightMode ? 'Mode terang' : 'Mode malam'}
          </button>
        </div>
        <div className="mt-4 grid items-start gap-3 lg:grid-cols-2">
          <details
            className={`min-w-0 rounded-lg border ${isNightMode ? 'border-slate-700' : 'border-slate-200'}`}
          >
            <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
              Pilih surah{' '}
              <span className={`font-normal ${mutedClass}`}>
                · {selectedSurah.number}. {selectedSurah.nameLatin}
              </span>
            </summary>
            <div className="space-y-3 px-3 pb-3">
              <label htmlFor="mushaf-search" className="block text-sm font-medium">
                Cari nama, nomor, atau arti surah
              </label>
              <div className="relative">
                <Search
                  className={`pointer-events-none absolute left-3 top-3.5 h-4 w-4 ${mutedClass}`}
                  aria-hidden="true"
                />
                <input
                  id="mushaf-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: Yasin atau 36"
                  className={`min-h-11 w-full min-w-0 rounded-lg border py-2 pl-9 pr-3 text-base ${controlClass}`}
                />
              </div>
              <p role="status" className={`text-xs ${mutedClass}`}>
                {filteredSurahs.length} dari 114 surah
              </p>
              {filteredSurahs.length === 0 ? (
                <p className={`py-3 text-sm ${mutedClass}`}>
                  Surah tidak ditemukan. Coba nama atau nomor lain.
                </p>
              ) : (
                <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto overscroll-contain p-1 sm:grid-cols-2">
                  {filteredSurahs.map((surah) => (
                    <button
                      type="button"
                      key={surah.number}
                      onClick={() => setSelectedSurahNumber(surah.number)}
                      aria-pressed={surah.number === selectedSurahNumber}
                      className={`flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left ${surah.number === selectedSurahNumber ? 'border-emerald-700 bg-emerald-700 text-white' : controlClass}`}
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold">
                          {surah.number}. {surah.nameLatin}
                        </span>
                        <span className="text-xs">{surah.numberOfAyahs} ayat</span>
                      </span>
                      <span lang="ar" dir="rtl" className="shrink-0 font-arabic text-xl">
                        {surah.nameArabic}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </details>
          <details
            className={`min-w-0 rounded-lg border ${isNightMode ? 'border-slate-700' : 'border-slate-200'}`}
          >
            <summary className="min-h-11 cursor-pointer rounded-lg px-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500">
              Pengaturan bacaan dan qari
            </summary>
            <div className="space-y-4 px-3 pb-3">
              <fieldset>
                <legend className="mb-2 text-sm font-medium">Ukuran teks Arab</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'normal', label: 'Standar' },
                      { value: 'large', label: 'Besar' },
                      { value: 'xlarge', label: 'Lebih besar' }
                    ] as const
                  ).map((size) => (
                    <button
                      type="button"
                      key={size.value}
                      onClick={() => setFontSizeOffset(size.value)}
                      aria-pressed={fontSizeOffset === size.value}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold ${fontSizeOffset === size.value ? 'border-emerald-700 bg-emerald-700 text-white' : controlClass}`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={showLatin}
                    onChange={(e) => setShowLatin(e.target.checked)}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  Teks Latin
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={showTranslation}
                    onChange={(e) => setShowTranslation(e.target.checked)}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  Terjemahan
                </label>
              </div>
              <div className="space-y-2">
                <label htmlFor="mushaf-qari" className="block text-sm font-medium">
                  Qari
                </label>
                <select
                  id="mushaf-qari"
                  value={selectedQari}
                  onChange={(e) => {
                    setSelectedQari(e.target.value);
                    stopAudio();
                  }}
                  className={`min-h-11 w-full min-w-0 rounded-lg border px-3 py-2 text-base ${controlClass}`}
                >
                  {QARI_LIST.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </details>
        </div>
      </header>

      <section
        aria-labelledby="mushaf-surah-title"
        className={`mx-auto max-w-4xl overflow-hidden rounded-xl border ${surfaceClass}`}
      >
        <header
          className={`space-y-4 border-b p-4 sm:p-6 ${isNightMode ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-xs ${mutedClass}`}>Surah {selectedSurah.number} dari 114</p>
              <h3 id="mushaf-surah-title" className="mt-1 text-xl font-semibold sm:text-2xl">
                {selectedSurah.nameLatin}
              </h3>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                {selectedSurah.translation} · {selectedSurah.numberOfAyahs} ayat ·{' '}
                {selectedSurah.revelationType}
              </p>
            </div>
            <p
              lang="ar"
              dir="rtl"
              className={`font-arabic text-3xl leading-loose sm:text-4xl ${isNightMode ? 'text-emerald-200' : 'text-emerald-900'}`}
            >
              {selectedSurah.nameArabic}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleFullSurahAudio}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
            >
              {playbackMode === 'full-surah' && isAudioPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {playbackMode === 'full-surah' && isAudioPlaying ? 'Jeda surah' : 'Putar surah penuh'}
            </button>
            {ayahs.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={() => handlePlayAyahAudio(ayahs[0], true)}
                aria-pressed={playbackMode === 'auto-continuous'}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}
              >
                <ListMusic className="h-4 w-4" aria-hidden="true" />
                Putar ayat bersambung
              </button>
            )}
          </div>
          <p className={`text-xs ${mutedClass}`}>Qari: {currentQariObj.name}</p>
        </header>

        {selectedSurah.number !== 9 && (
          <div className="px-4 py-8 text-center sm:px-8">
            <p lang="ar" dir="rtl" className="font-arabic text-2xl leading-loose sm:text-3xl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            {showTranslation && (
              <p className={`mt-3 text-sm ${mutedClass}`}>
                Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.
              </p>
            )}
          </div>
        )}

        <div aria-busy={isLoading}>
          {isLoading ? (
            <div role="status" className="space-y-6 px-4 py-8 sm:px-8">
              <p className={`text-sm ${mutedClass}`}>
                Memuat ayat Surah {selectedSurah.nameLatin}...
              </p>
              <div aria-hidden="true" className="space-y-5">
                <div
                  className={`ml-auto h-8 w-4/5 rounded ${isNightMode ? 'bg-slate-800' : 'bg-slate-100'}`}
                />
                <div
                  className={`ml-auto h-8 w-full rounded ${isNightMode ? 'bg-slate-800' : 'bg-slate-100'}`}
                />
              </div>
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className={`space-y-3 p-4 sm:p-8 ${isNightMode ? 'bg-rose-950 text-rose-100' : 'bg-rose-50 text-rose-900'}`}
            >
              <p className="flex items-center gap-2 text-base font-semibold">
                <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                Ayat belum tersedia
              </p>
              <p className="text-sm leading-relaxed">{loadError}</p>
              <button
                type="button"
                onClick={() => fetchSurahDetail(selectedSurahNumber)}
                className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold ${controlClass}`}
              >
                Coba lagi
              </button>
            </div>
          ) : (
            ayahs.map((ayah) => {
              const isPlayingThisAyah =
                (playbackMode === 'ayah' || playbackMode === 'auto-continuous') &&
                playingAyahNumber === ayah.nomorAyat &&
                isAudioPlaying;
              return (
                <article
                  id={`ayah-${ayah.nomorAyat}`}
                  key={ayah.nomorAyat}
                  aria-label={`Ayat ${ayah.nomorAyat}`}
                  className={`scroll-mt-28 space-y-5 border-t px-4 py-6 sm:px-8 sm:py-8 ${isPlayingThisAyah ? (isNightMode ? 'border-emerald-700 bg-emerald-950' : 'border-emerald-300 bg-emerald-50') : isNightMode ? 'border-slate-800' : 'border-slate-200'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${isPlayingThisAyah ? (isNightMode ? 'text-emerald-200' : 'text-emerald-800') : mutedClass}`}
                    >
                      Ayat {ayah.nomorAyat}
                      {isPlayingThisAyah && ' · Sedang diputar'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handlePlayAyahAudio(ayah, false)}
                      aria-label={`${isPlayingThisAyah ? 'Jeda' : 'Putar'} ayat ${ayah.nomorAyat}`}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}
                    >
                      {isPlayingThisAyah ? (
                        <Pause className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden="true" />
                      )}
                      {isPlayingThisAyah ? 'Jeda' : 'Putar ayat'}
                    </button>
                  </div>
                  <p
                    lang="ar"
                    dir="rtl"
                    className={`break-words text-right font-arabic ${arabicFontSizeClass} ${isNightMode ? 'text-slate-100' : 'text-slate-950'}`}
                  >
                    {ayah.teksArab}
                  </p>
                  {(showLatin || showTranslation) && (
                    <div className="space-y-3">
                      {showLatin && (
                        <p
                          className={`break-words text-sm leading-relaxed ${isNightMode ? 'text-emerald-200' : 'text-emerald-900'}`}
                        >
                          {ayah.teksLatin}
                        </p>
                      )}
                      {showTranslation && (
                        <p
                          className={`break-words text-sm leading-relaxed sm:text-base ${mutedClass}`}
                        >
                          {ayah.teksIndonesia}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
        <nav
          aria-label="Navigasi surah"
          className={`flex flex-wrap justify-between gap-2 border-t p-4 sm:p-6 ${isNightMode ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <button
            type="button"
            onClick={handlePrevSurah}
            disabled={selectedSurahNumber <= 1}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${controlClass}`}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Surah sebelumnya
          </button>
          <button
            type="button"
            onClick={handleNextSurah}
            disabled={selectedSurahNumber >= 114}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${controlClass}`}
          >
            Surah berikutnya
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      </section>

      {audioError && playbackMode === 'idle' && (
        <div
          role="alert"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-30 space-y-3 rounded-xl border border-rose-700 bg-slate-950 p-4 text-sm text-white shadow-xl sm:left-auto sm:right-6 sm:w-96 md:bottom-4"
        >
          <p>{audioError}</p>
          <button
            type="button"
            onClick={() => setAudioError(null)}
            className="min-h-11 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Tutup pesan
          </button>
        </div>
      )}

      {playbackMode !== 'idle' && (
        <section
          aria-label="Pemutar murottal"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-30 max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-950 p-3 text-white shadow-xl sm:left-auto sm:right-6 sm:w-96 md:bottom-4 md:max-h-[calc(100dvh-2rem)]"
        >
          {audioError && (
            <p role="alert" className="mb-3 text-sm text-rose-200">
              {audioError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {selectedSurah.nameLatin} ·{' '}
                {playbackMode === 'full-surah' ? 'Surah penuh' : `Ayat ${playingAyahNumber}`}
              </p>
              <p role="status" className="mt-1 text-xs text-emerald-200">
                {isAudioPlaying ? 'Sedang diputar' : 'Dijeda'}
                {playbackMode === 'auto-continuous' && ' · Bersambung'}
              </p>
              <p className="mt-1 truncate text-xs text-slate-300" title={currentQariObj.name}>
                {currentQariObj.name}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => {
                  if (playbackMode === 'full-surah') {
                    handleToggleFullSurahAudio();
                  } else if (playingAyahNumber && ayahs.length > 0) {
                    const curAyah =
                      ayahs.find((a) => a.nomorAyat === playingAyahNumber) || ayahs[0];
                    handlePlayAyahAudio(curAyah, playbackMode === 'auto-continuous');
                  }
                }}
                aria-label={isAudioPlaying ? 'Jeda audio' : 'Lanjutkan audio'}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isAudioPlaying ? (
                  <Pause className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Play className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={stopAudio}
                aria-label="Hentikan audio"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800"
              >
                <Square className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs tabular-nums text-slate-300">{formatTime(currentTime)}</span>
            <input
              aria-label="Posisi audio"
              aria-valuetext={`${formatTime(currentTime)} dari ${duration > 0 ? formatTime(duration) : 'durasi belum tersedia'}`}
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="h-11 min-w-0 flex-1 cursor-pointer accent-emerald-400"
            />
            <span className="text-xs tabular-nums text-slate-300">
              {duration > 0 ? formatTime(duration) : '--:--'}
            </span>
          </div>
          <details className="border-t border-slate-700">
            <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
              Kontrol audio lainnya
            </summary>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <button
                type="button"
                onClick={handlePrevSurah}
                disabled={selectedSurahNumber <= 1}
                aria-label="Surah sebelumnya"
                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40"
              >
                <SkipBack className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLooping((prev) => {
                    const next = !prev;
                    if (audioRef.current) audioRef.current.loop = next;
                    return next;
                  });
                }}
                aria-pressed={isLooping}
                className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm ${isLooping ? 'bg-emerald-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Ulangi
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMuted((prev) => {
                    const next = !prev;
                    if (audioRef.current) audioRef.current.muted = next;
                    return next;
                  });
                }}
                aria-label="Bisukan audio"
                aria-pressed={isMuted}
                className={`flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-800 ${isMuted ? 'text-rose-300' : 'text-slate-300'}`}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={handleNextSurah}
                disabled={selectedSurahNumber >= 114}
                aria-label="Surah berikutnya"
                className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </details>
        </section>
      )}
    </div>
  );
};
