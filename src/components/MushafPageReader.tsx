import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Moon, RotateCcw, Sun } from 'lucide-react';
import { SURAH_LIST } from '../data/quranSurahs';

const TOTAL_MUSHAF_PAGES = 604;
const QURAN_PAGE_API = 'https://api.quran.com/api/v4/verses/by_page';
const SURAH_STARTS_URL = '/quran/qcf_surah_starts.json';
const QCF_V2_FONT_BASE = 'https://static.qurancdn.com/fonts/quran/hafs/v2/woff2';
const LAST_PAGE_KEY = 'mushaf_qcf_v2_last_page';

type QcfWord = {
  code_v2: string;
  text_uthmani?: string;
  page_number: number;
  line_number: number;
  char_type_name?: string;
};

type QcfVerse = {
  verse_key: string;
  verse_number: number;
  juz_number?: number;
  words: QcfWord[];
};

type QcfPageResponse = {
  verses: QcfVerse[];
};

type SurahStartMarker = {
  l: number;
  s: number;
  b: number;
};

type SurahStartMap = Record<string, SurahStartMarker[]>;

interface MushafPageReaderProps {
  isNightMode: boolean;
  onToggleNightMode: () => void;
}

let surahStartPromise: Promise<SurahStartMap> | null = null;
const fontPromises = new Map<number, Promise<string>>();
const pageDataPromises = new Map<number, Promise<QcfPageResponse>>();

function clampPage(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(TOTAL_MUSHAF_PAGES, Math.max(1, Math.round(value)));
}

function getInitialPage(): number {
  if (typeof window === 'undefined') return 1;
  return clampPage(Number(window.localStorage.getItem(LAST_PAGE_KEY) || 1));
}

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Gagal memuat aset Mushaf (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

function loadSurahStarts(): Promise<SurahStartMap> {
  surahStartPromise ??= loadJson<SurahStartMap>(SURAH_STARTS_URL);
  return surahStartPromise;
}

function loadOfficialQcfPage(page: number): Promise<QcfPageResponse> {
  const safePage = clampPage(page);
  const existing = pageDataPromises.get(safePage);
  if (existing) return existing;

  const params = new URLSearchParams({
    words: 'true',
    word_fields: 'code_v2,text_uthmani,line_number,page_number',
    per_page: 'all',
    mushaf: '1',
  });

  const promise = fetch(`${QURAN_PAGE_API}/${safePage}?${params.toString()}`, {
    cache: 'force-cache',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Quran.com page API returned ${response.status}`);
      }

      const data = await response.json() as QcfPageResponse;
      if (!Array.isArray(data.verses) || data.verses.length === 0) {
        throw new Error(`QCF V2 page ${safePage} has no verses`);
      }

      return data;
    })
    .catch((error) => {
      pageDataPromises.delete(safePage);
      throw error;
    });

  pageDataPromises.set(safePage, promise);
  return promise;
}

function fontFamilyForPage(page: number): string {
  return `QCF2-p${page}`;
}

export function loadQcfV2PageFont(page: number): Promise<string> {
  const safePage = clampPage(page);
  const existing = fontPromises.get(safePage);
  if (existing) return existing;

  const family = fontFamilyForPage(safePage);

  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return Promise.resolve(family);
  }

  const promise = new FontFace(
    family,
    `url("${QCF_V2_FONT_BASE}/p${safePage}.woff2") format("woff2")`
  )
    .load()
    .then((font) => {
      document.fonts.add(font);
      return family;
    })
    .catch((error) => {
      fontPromises.delete(safePage);
      throw error;
    });

  fontPromises.set(safePage, promise);
  return promise;
}

function buildSurahPageIndex(starts: SurahStartMap): Map<number, number> {
  const index = new Map<number, number>();

  Object.entries(starts).forEach(([pageKey, markers]) => {
    const page = Number(pageKey);
    markers.forEach((marker) => {
      if (!index.has(marker.s)) index.set(marker.s, page);
    });
  });

  return index;
}

function findCurrentSurah(page: number, index: Map<number, number>) {
  let current = SURAH_LIST[0];

  for (const surah of SURAH_LIST) {
    const startPage = index.get(surah.number);
    if (startPage && startPage <= page) current = surah;
    if (startPage && startPage > page) break;
  }

  return current;
}

function groupWordsByLine(pageData: QcfPageResponse | null): Map<number, QcfWord[]> {
  const lines = new Map<number, QcfWord[]>();

  pageData?.verses.forEach((verse) => {
    verse.words?.forEach((word) => {
      if (!word.code_v2 || !Number.isFinite(word.line_number)) return;
      const line = word.line_number;
      const existing = lines.get(line) || [];
      existing.push(word);
      lines.set(line, existing);
    });
  });

  return lines;
}

export const MushafPageReader: React.FC<MushafPageReaderProps> = ({
  isNightMode,
  onToggleNightMode,
}) => {
  const [page, setPage] = useState(getInitialPage);
  const [pageData, setPageData] = useState<QcfPageResponse | null>(null);
  const [surahStarts, setSurahStarts] = useState<SurahStartMap | null>(null);
  const [fontFamily, setFontFamily] = useState('');
  const [fontReady, setFontReady] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const setSafePage = useCallback((nextPage: number) => {
    setPage(clampPage(nextPage));
  }, []);

  const goNextPage = useCallback(() => {
    setPage((current) => clampPage(current + 1));
  }, []);

  const goPreviousPage = useCallback(() => {
    setPage((current) => clampPage(current - 1));
  }, []);

  useEffect(() => {
    let active = true;

    loadSurahStarts()
      .then((starts) => {
        if (!active) return;
        setSurahStarts(starts);
      })
      .catch((error) => {
        if (!active) return;
        console.warn('Mushaf surah-start map could not be loaded:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LAST_PAGE_KEY, String(page));
  }, [page]);

  useEffect(() => {
    let active = true;
    setPageReady(false);
    setFontReady(false);
    setLoadError(null);
    setFontError(null);

    loadOfficialQcfPage(page)
      .then((data) => {
        if (!active) return;
        setPageData(data);
        setPageReady(true);
      })
      .catch((error) => {
        if (!active) return;
        console.warn(`Official QCF page ${page} could not be loaded:`, error);
        setPageData(null);
        setLoadError('Data halaman Mushaf belum dapat dimuat. Periksa koneksi lalu coba lagi.');
      });

    loadQcfV2PageFont(page)
      .then((family) => {
        if (!active) return;
        setFontFamily(family);
        setFontReady(true);
      })
      .catch((error) => {
        if (!active) return;
        console.warn(`QCF V2 font page ${page} could not be loaded:`, error);
        setFontError('Font halaman belum dapat dimuat. Periksa koneksi lalu coba lagi.');
      });

    const adjacentPages = [page - 1, page + 1].filter(
      (candidate) => candidate >= 1 && candidate <= TOTAL_MUSHAF_PAGES
    );

    void Promise.allSettled(
      adjacentPages.flatMap((candidate) => [
        loadOfficialQcfPage(candidate),
        loadQcfV2PageFont(candidate),
      ])
    );

    return () => {
      active = false;
    };
  }, [page, retryKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT') return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goNextPage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goPreviousPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNextPage, goPreviousPage]);

  const surahPageIndex = useMemo(
    () => (surahStarts ? buildSurahPageIndex(surahStarts) : new Map<number, number>()),
    [surahStarts]
  );

  const currentSurah = useMemo(
    () => findCurrentSurah(page, surahPageIndex),
    [page, surahPageIndex]
  );

  const startsOnCurrentPage = useMemo(() => {
    const markers = surahStarts?.[String(page)] || [];
    return markers
      .map((marker) => ({
        ...marker,
        surah: SURAH_LIST.find((surah) => surah.number === marker.s),
      }))
      .filter((marker): marker is SurahStartMarker & { surah: (typeof SURAH_LIST)[number] } =>
        Boolean(marker.surah)
      );
  }, [page, surahStarts]);

  const pageLabel = startsOnCurrentPage.length
    ? startsOnCurrentPage.map((marker) => marker.surah.nameLatin).join(' · ')
    : currentSurah.nameLatin;

  const lineMap = useMemo(() => groupWordsByLine(pageData), [pageData]);
  const currentJuz = pageData?.verses[0]?.juz_number;
  const readerReady = pageReady && fontReady && !loadError && !fontError;

  const headerRows = useMemo(() => {
    const headers = new Map<number, { kind: 'surah' | 'bismillah'; surahNumber: number }>();

    startsOnCurrentPage.forEach((marker) => {
      const headerLine = marker.l + 1;
      headers.set(headerLine, { kind: 'surah', surahNumber: marker.s });
      if (marker.b === 1 && headerLine < 15) {
        headers.set(headerLine + 1, { kind: 'bismillah', surahNumber: marker.s });
      }
    });

    return headers;
  }, [startsOnCurrentPage]);

  const surfaceClass = isNightMode
    ? 'border-slate-700 bg-slate-950 text-slate-100'
    : 'border-amber-200/80 bg-[#fffdf6] text-slate-950';
  const controlClass = isNightMode
    ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
  const mutedClass = isNightMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <section className="space-y-3" aria-label="Mushaf halaman QCF V2">
      <div className={`rounded-xl border p-3 sm:p-4 ${isNightMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <p className="text-sm font-bold">Mushaf Madinah · QCF V2</p>
            </div>
            <p className={`mt-1 truncate text-xs sm:text-sm ${mutedClass}`}>
              {pageLabel} · Halaman {page} dari {TOTAL_MUSHAF_PAGES}
              {currentJuz ? ` · Juz ${currentJuz}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleNightMode}
            aria-pressed={isNightMode}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm ${controlClass}`}
          >
            {isNightMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            {isNightMode ? 'Terang' : 'Malam'}
          </button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <label className="min-w-0">
            <span className="sr-only">Lompat ke surah</span>
            <select
              value={currentSurah.number}
              onChange={(event) => {
                const targetPage = surahPageIndex.get(Number(event.target.value));
                if (targetPage) setSafePage(targetPage);
              }}
              className={`min-h-11 w-full min-w-0 rounded-lg border px-3 py-2 text-sm ${controlClass}`}
            >
              {SURAH_LIST.map((surah) => (
                <option key={surah.number} value={surah.number}>
                  {surah.number}. {surah.nameLatin}
                </option>
              ))}
            </select>
          </label>

          <label className="relative min-w-0">
            <span className="sr-only">Lompat ke nomor halaman</span>
            <input
              type="number"
              min={1}
              max={TOTAL_MUSHAF_PAGES}
              inputMode="numeric"
              value={page}
              onChange={(event) => setSafePage(Number(event.target.value))}
              className={`min-h-11 w-full rounded-lg border px-3 py-2 pr-12 text-sm tabular-nums ${controlClass}`}
            />
            <span className={`pointer-events-none absolute right-3 top-3 text-xs ${mutedClass}`}>/604</span>
          </label>
        </div>
      </div>

      <div
        className={`relative mx-auto aspect-[2/3] w-full max-w-[640px] overflow-hidden rounded-[1.35rem] border shadow-[0_20px_55px_rgba(15,23,42,0.10)] ${surfaceClass}`}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          touchStartX.current = null;
          if (startX === null) return;

          const endX = event.changedTouches[0]?.clientX ?? startX;
          const deltaX = endX - startX;
          if (deltaX <= -48) goNextPage();
          else if (deltaX >= 48) goPreviousPage();
        }}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-2.5 rounded-[1rem] border sm:inset-4 ${isNightMode ? 'border-amber-200/15' : 'border-amber-700/20'}`}
        />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] sm:px-7 sm:pt-5 sm:text-xs">
          <span className={mutedClass}>{pageLabel}</span>
          <span className={mutedClass}>QCF V2</span>
        </div>

        <div
          dir="rtl"
          lang="ar"
          aria-busy={!readerReady}
          className="absolute inset-x-[5%] bottom-[5.5%] top-[6.5%] grid grid-rows-[repeat(15,minmax(0,1fr))] overflow-hidden text-center"
        >
          {loadError || fontError ? (
            <div role="alert" dir="ltr" className="row-span-15 m-auto max-w-xs space-y-3 text-center">
              <p className="text-sm text-rose-600">{loadError || fontError}</p>
              <button
                type="button"
                onClick={() => setRetryKey((value) => value + 1)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Coba lagi
              </button>
            </div>
          ) : !readerReady ? (
            <div role="status" dir="ltr" className={`row-span-15 m-auto text-sm ${mutedClass}`}>
              Menyiapkan halaman mushaf {page}...
            </div>
          ) : (
            Array.from({ length: 15 }, (_, index) => {
              const lineNumber = index + 1;
              const header = headerRows.get(lineNumber);
              const words = lineMap.get(lineNumber) || [];

              if (header?.kind === 'surah') {
                const surah = SURAH_LIST.find((item) => item.number === header.surahNumber);
                return (
                  <div
                    key={`header-${page}-${lineNumber}`}
                    className={`flex items-center justify-center px-3 text-center font-arabic text-[clamp(0.9rem,3.5vw,1.35rem)] font-semibold ${isNightMode ? 'text-amber-100' : 'text-emerald-950'}`}
                  >
                    سورة {surah?.nameArabic || ''}
                  </div>
                );
              }

              if (header?.kind === 'bismillah') {
                return (
                  <div
                    key={`bismillah-${page}-${lineNumber}`}
                    className={`flex items-center justify-center px-3 text-center font-arabic text-[clamp(0.95rem,3.7vw,1.45rem)] ${isNightMode ? 'text-amber-50' : 'text-slate-950'}`}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                );
              }

              return (
                <div
                  key={`line-${page}-${lineNumber}`}
                  className="flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap"
                  aria-label={words.length ? `Baris mushaf ${lineNumber}` : undefined}
                >
                  {words.map((word, wordIndex) => (
                    <span
                      key={`${lineNumber}-${wordIndex}-${word.code_v2}`}
                      className="inline-block shrink-0 leading-none"
                      title={word.text_uthmani || undefined}
                      style={{
                        fontFamily: `"${fontFamily}"`,
                        fontSize: 'clamp(1.05rem, 4.1vw, 2rem)',
                        WebkitFontSmoothing: 'antialiased',
                        textRendering: 'optimizeLegibility',
                      }}
                      dangerouslySetInnerHTML={{ __html: word.code_v2 }}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        <div className={`absolute inset-x-0 bottom-2.5 text-center text-xs font-semibold tabular-nums sm:bottom-4 ${mutedClass}`}>
          {page}
        </div>
      </div>

      <nav
        aria-label="Navigasi halaman mushaf"
        className="mx-auto flex w-full max-w-[640px] flex-row-reverse items-center justify-between gap-2"
      >
        <button
          type="button"
          onClick={goPreviousPage}
          disabled={page <= 1}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${controlClass}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <p className={`text-center text-xs ${mutedClass}`}>
          Geser ke kiri untuk halaman berikutnya
        </p>

        <button
          type="button"
          onClick={goNextPage}
          disabled={page >= TOTAL_MUSHAF_PAGES}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${controlClass}`}
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>

      <p className={`mx-auto max-w-[640px] text-center text-[10px] leading-relaxed ${mutedClass}`}>
        M1 · QCF V2 resmi per halaman, 15 baris, font halaman dimuat sesuai kode glyph Quran.com.
      </p>
    </section>
  );
};
