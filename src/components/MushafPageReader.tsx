import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Moon, RotateCcw, Sun } from 'lucide-react';
import { SURAH_LIST } from '../data/quranSurahs';

const TOTAL_MUSHAF_PAGES = 604;
const PAGE_DATA_URL = '/quran/qcf_v2_pages.json';
const SURAH_STARTS_URL = '/quran/qcf_surah_starts.json';
const QCF_V2_FONT_BASE = 'https://verses.quran.foundation/fonts/quran/hafs/v2/woff2';
const LAST_PAGE_KEY = 'mushaf_qcf_v2_last_page';

type QcfPageMap = Record<string, string[]>;

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

let pageMapPromise: Promise<QcfPageMap> | null = null;
let surahStartPromise: Promise<SurahStartMap> | null = null;
const fontPromises = new Map<number, Promise<string>>();

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

function loadPageMap(): Promise<QcfPageMap> {
  pageMapPromise ??= loadJson<QcfPageMap>(PAGE_DATA_URL);
  return pageMapPromise;
}

function loadSurahStarts(): Promise<SurahStartMap> {
  surahStartPromise ??= loadJson<SurahStartMap>(SURAH_STARTS_URL);
  return surahStartPromise;
}

function fontFamilyForPage(page: number): string {
  return `QCF_P${String(page).padStart(3, '0')}_V2`;
}

export function loadQcfV2PageFont(page: number): Promise<string> {
  const safePage = clampPage(page);
  const existing = fontPromises.get(safePage);
  if (existing) return existing;

  const family = fontFamilyForPage(safePage);

  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return Promise.resolve(family);
  }

  // Do not use document.fonts.check() before registering the page font.
  // For an unknown family browsers can report that text is renderable via fallback,
  // which would skip the QCF FontFace registration and expose raw glyph codes.
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

export const MushafPageReader: React.FC<MushafPageReaderProps> = ({
  isNightMode,
  onToggleNightMode,
}) => {
  const [page, setPage] = useState(getInitialPage);
  const [pageMap, setPageMap] = useState<QcfPageMap | null>(null);
  const [surahStarts, setSurahStarts] = useState<SurahStartMap | null>(null);
  const [fontFamily, setFontFamily] = useState('');
  const [fontReady, setFontReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fontError, setFontError] = useState<string | null>(null);
  const [fontRetryKey, setFontRetryKey] = useState(0);
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

    Promise.all([loadPageMap(), loadSurahStarts()])
      .then(([pages, starts]) => {
        if (!active) return;
        setPageMap(pages);
        setSurahStarts(starts);
        setLoadError(null);
      })
      .catch((error) => {
        if (!active) return;
        console.warn('Mushaf M1 assets could not be loaded:', error);
        setLoadError('Data halaman Mushaf belum dapat dimuat. Coba muat ulang halaman.');
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
    setFontReady(false);
    setFontError(null);

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
    void Promise.allSettled(adjacentPages.map((candidate) => loadQcfV2PageFont(candidate)));

    return () => {
      active = false;
    };
  }, [page, fontRetryKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
      .map((marker) => SURAH_LIST.find((surah) => surah.number === marker.s))
      .filter((surah): surah is (typeof SURAH_LIST)[number] => Boolean(surah));
  }, [page, surahStarts]);

  const pageLabel = startsOnCurrentPage.length
    ? startsOnCurrentPage.map((surah) => surah.nameLatin).join(' · ')
    : currentSurah.nameLatin;

  const pageLines = pageMap?.[String(page)] || [];
  const isOpeningPage = page <= 2;

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

      {loadError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {loadError}
        </div>
      ) : (
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
            aria-busy={!fontReady}
            className={`absolute inset-x-[6%] bottom-[6%] top-[7.5%] flex flex-col overflow-hidden text-center ${isOpeningPage ? 'justify-center gap-[2.2%]' : 'justify-between'}`}
          >
            {!pageMap ? (
              <div role="status" className={`m-auto text-sm ${mutedClass}`}>Menyiapkan halaman mushaf...</div>
            ) : fontError ? (
              <div role="alert" dir="ltr" className="m-auto max-w-xs space-y-3 text-center">
                <p className="text-sm text-rose-600">{fontError}</p>
                <button
                  type="button"
                  onClick={() => setFontRetryKey((value) => value + 1)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${controlClass}`}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Coba lagi
                </button>
              </div>
            ) : !fontReady ? (
              <div role="status" className={`m-auto text-sm ${mutedClass}`}>Memuat font halaman {page}...</div>
            ) : (
              pageLines.map((line, index) => (
                <div
                  key={`${page}-${index}`}
                  className="whitespace-nowrap leading-none"
                  style={{
                    fontFamily: `"${fontFamily}"`,
                    fontSize: isOpeningPage
                      ? 'clamp(1.65rem, 6vw, 2.8rem)'
                      : 'clamp(1.18rem, 4.3vw, 2.1rem)',
                  }}
                >
                  {line}
                </div>
              ))
            )}
          </div>

          <div className={`absolute inset-x-0 bottom-2.5 text-center text-xs font-semibold tabular-nums sm:bottom-4 ${mutedClass}`}>
            {page}
          </div>
        </div>
      )}

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
        M1 · Tata letak QCF V2 604 halaman. Font halaman disajikan dari Quran Foundation.
      </p>
    </section>
  );
};
