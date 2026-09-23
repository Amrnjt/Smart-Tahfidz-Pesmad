import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2, Moon, RotateCcw, Sun } from 'lucide-react';
import { SURAH_LIST } from '../data/quranSurahs';

const TOTAL_MUSHAF_PAGES = 604;
const QURAN_PAGE_API = 'https://api.quran.com/api/v4/verses/by_page';
const SURAH_STARTS_URL = '/quran/qcf_surah_starts.json';
const QCF_V2_FONT_BASE = 'https://static.qurancdn.com/fonts/quran/hafs/v2/woff2';
const LAST_PAGE_KEY = 'mushaf_qcf_v2_last_page';
const BOOKMARKS_KEY = 'mushaf_qcf_v2_bookmarks';
const READER_THEME_KEY = 'mushaf_qcf_v2_theme';
const CONTROL_HIDE_DELAY = 3200;

type ReaderTheme = 'light' | 'sepia' | 'night';

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

function getSpreadRightPage(value: number): number {
  const safePage = clampPage(value);
  return safePage % 2 === 0 ? safePage - 1 : safePage;
}

function getInitialPage(): number {
  if (typeof window === 'undefined') return 1;
  return clampPage(Number(window.localStorage.getItem(LAST_PAGE_KEY) || 1));
}

function getInitialTheme(isNightMode: boolean): ReaderTheme {
  if (typeof window === 'undefined') return isNightMode ? 'night' : 'light';
  const saved = window.localStorage.getItem(READER_THEME_KEY);
  if (saved === 'light' || saved === 'sepia' || saved === 'night') return saved;
  return isNightMode ? 'night' : 'light';
}

function getInitialBookmarks(): number[] {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKMARKS_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(Number).filter((value) =>
      Number.isFinite(value) && value >= 1 && value <= TOTAL_MUSHAF_PAGES
    ))].sort((a, b) => a - b);
  } catch {
    return [];
  }
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
  const [isSpreadLayout, setIsSpreadLayout] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches
  );
  const [companionPageData, setCompanionPageData] = useState<QcfPageResponse | null>(null);
  const [companionFontFamily, setCompanionFontFamily] = useState('');
  const [companionReady, setCompanionReady] = useState(false);
  const [companionError, setCompanionError] = useState<string | null>(null);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>(() => getInitialTheme(isNightMode));
  const [bookmarks, setBookmarks] = useState<number[]>(getInitialBookmarks);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const readerShellRef = useRef<HTMLElement | null>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const nativeFullscreenRef = useRef(false);

  const setSafePage = useCallback((nextPage: number) => {
    setPage(clampPage(nextPage));
  }, []);

  const goNextPage = useCallback(() => {
    setPage((current) => {
      if (!isSpreadLayout) return clampPage(current + 1);
      const spreadRightPage = getSpreadRightPage(current);
      return spreadRightPage >= TOTAL_MUSHAF_PAGES - 1
        ? current
        : clampPage(spreadRightPage + 2);
    });
  }, [isSpreadLayout]);

  const goPreviousPage = useCallback(() => {
    setPage((current) => {
      if (!isSpreadLayout) return clampPage(current - 1);
      const spreadRightPage = getSpreadRightPage(current);
      return spreadRightPage <= 1
        ? current
        : clampPage(spreadRightPage - 2);
    });
  }, [isSpreadLayout]);

  const spreadRightPage = getSpreadRightPage(page);
  const spreadLeftPage = Math.min(TOTAL_MUSHAF_PAGES, spreadRightPage + 1);
  const companionPage = isSpreadLayout
    ? (page === spreadRightPage ? spreadLeftPage : spreadRightPage)
    : null;
  const canGoPrevious = isSpreadLayout ? spreadRightPage > 1 : page > 1;
  const canGoNext = isSpreadLayout ? spreadRightPage < TOTAL_MUSHAF_PAGES - 1 : page < TOTAL_MUSHAF_PAGES;

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimerRef.current !== null) {
      window.clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = null;
    }
    if (isFocusMode) {
      controlsTimerRef.current = window.setTimeout(() => {
        setControlsVisible(false);
        controlsTimerRef.current = null;
      }, CONTROL_HIDE_DELAY);
    }
  }, [isFocusMode]);

  const toggleReaderControls = useCallback(() => {
    if (!isFocusMode) return;
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }

    setControlsVisible((visible) => {
      const next = !visible;
      if (controlsTimerRef.current !== null) {
        window.clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
      if (next) {
        controlsTimerRef.current = window.setTimeout(() => {
          setControlsVisible(false);
          controlsTimerRef.current = null;
        }, CONTROL_HIDE_DELAY);
      }
      return next;
    });
  }, [isFocusMode]);

  const selectTheme = useCallback((theme: ReaderTheme) => {
    setReaderTheme(theme);
    window.localStorage.setItem(READER_THEME_KEY, theme);
    setControlsVisible(true);
  }, []);

  const toggleBookmark = useCallback(() => {
    setBookmarks((current) => {
      const next = current.includes(page)
        ? current.filter((savedPage) => savedPage !== page)
        : [...current, page].sort((a, b) => a - b);
      window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      return next;
    });
  }, [page]);

  const enterImmersiveMode = useCallback(async () => {
    setIsFocusMode(true);
    setControlsVisible(true);

    const shell = readerShellRef.current;
    if (!shell?.requestFullscreen) return;

    try {
      await shell.requestFullscreen();
    } catch {
      // CSS focus mode remains active when the browser does not allow native fullscreen.
    }
  }, []);

  const exitImmersiveMode = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Continue with CSS focus-mode cleanup.
      }
    }
    nativeFullscreenRef.current = false;
    setIsNativeFullscreen(false);
    setIsFocusMode(false);
    setControlsVisible(true);
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
    const media = window.matchMedia('(min-width: 900px)');
    const syncLayout = () => setIsSpreadLayout(media.matches);

    syncLayout();
    media.addEventListener?.('change', syncLayout);
    return () => media.removeEventListener?.('change', syncLayout);
  }, []);

  useEffect(() => {
    const shouldUseNightMode = readerTheme === 'night';
    if (shouldUseNightMode !== isNightMode) {
      onToggleNightMode();
    }
  }, [readerTheme, isNightMode, onToggleNightMode]);

  useEffect(() => {
    if (!isFocusMode) {
      if (controlsTimerRef.current !== null) {
        window.clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = null;
      }
      setControlsVisible(true);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    showControls();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFocusMode, showControls]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = document.fullscreenElement === readerShellRef.current;
      if (active) {
        nativeFullscreenRef.current = true;
        setIsNativeFullscreen(true);
        setIsFocusMode(true);
        showControls();
      } else if (nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        setIsNativeFullscreen(false);
        setIsFocusMode(false);
        setControlsVisible(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [showControls]);

  useEffect(() => () => {
    if (controlsTimerRef.current !== null) {
      window.clearTimeout(controlsTimerRef.current);
    }
  }, []);

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
    if (!isSpreadLayout || companionPage === null || companionPage === page) {
      setCompanionPageData(null);
      setCompanionFontFamily('');
      setCompanionReady(false);
      setCompanionError(null);
      return;
    }

    let active = true;
    setCompanionReady(false);
    setCompanionError(null);

    Promise.all([
      loadOfficialQcfPage(companionPage),
      loadQcfV2PageFont(companionPage),
    ])
      .then(([data, family]) => {
        if (!active) return;
        setCompanionPageData(data);
        setCompanionFontFamily(family);
        setCompanionReady(true);
      })
      .catch((error) => {
        if (!active) return;
        console.warn(`Companion QCF page ${companionPage} could not be loaded:`, error);
        setCompanionPageData(null);
        setCompanionFontFamily('');
        setCompanionReady(false);
        setCompanionError('Halaman pasangan belum dapat dimuat.');
      });

    return () => {
      active = false;
    };
  }, [companionPage, isSpreadLayout, page, retryKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'SELECT') return;

      if (event.key === 'Escape' && isFocusMode && !document.fullscreenElement) {
        event.preventDefault();
        void exitImmersiveMode();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goNextPage();
        showControls();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goPreviousPage();
        showControls();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitImmersiveMode, goNextPage, goPreviousPage, isFocusMode, showControls]);

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

  const currentJuz = pageData?.verses[0]?.juz_number;
  const readerReady = pageReady && fontReady && !loadError && !fontError;

  const getPageMarkers = (targetPage: number) => {
    const markers = surahStarts?.[String(targetPage)] || [];
    return markers
      .map((marker) => ({
        ...marker,
        surah: SURAH_LIST.find((surah) => surah.number === marker.s),
      }))
      .filter((marker): marker is SurahStartMarker & { surah: (typeof SURAH_LIST)[number] } =>
        Boolean(marker.surah)
      );
  };

  const getPageLabel = (targetPage: number) => {
    const markers = getPageMarkers(targetPage);
    if (markers.length > 0) {
      return markers.map((marker) => marker.surah.nameLatin).join(' · ');
    }
    return findCurrentSurah(targetPage, surahPageIndex).nameLatin;
  };

  const getHeaderRows = (targetPage: number) => {
    const headers = new Map<number, { kind: 'surah' | 'bismillah'; surahNumber: number }>();

    getPageMarkers(targetPage).forEach((marker) => {
      const headerLine = marker.l + 1;
      headers.set(headerLine, { kind: 'surah', surahNumber: marker.s });
      if (marker.b === 1 && headerLine < 15) {
        headers.set(headerLine + 1, { kind: 'bismillah', surahNumber: marker.s });
      }
    });

    return headers;
  };

  const isBookmarked = bookmarks.includes(page);
  const isDarkReader = readerTheme === 'night';
  const surfaceClass =
    readerTheme === 'night'
      ? 'border-slate-700 bg-slate-950 text-slate-100'
      : readerTheme === 'sepia'
        ? 'border-[#cbb88f] bg-[#f4ecd8] text-[#2b2116]'
        : 'border-amber-200/80 bg-[#fffdf6] text-slate-950';
  const chromeClass =
    readerTheme === 'night'
      ? 'border-slate-800 bg-slate-950 text-slate-100'
      : readerTheme === 'sepia'
        ? 'border-[#d7c39a] bg-[#efe2c5] text-[#2b2116]'
        : 'border-slate-200 bg-white text-slate-900';
  const focusBackgroundClass =
    readerTheme === 'night'
      ? 'bg-slate-950'
      : readerTheme === 'sepia'
        ? 'bg-[#d8c7a4]'
        : 'bg-slate-100';
  const controlClass = isDarkReader
    ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
    : readerTheme === 'sepia'
      ? 'border-[#c9b486] bg-[#f8f0dd] text-[#2b2116] hover:bg-[#eadbbd]'
      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
  const mutedClass = isDarkReader ? 'text-slate-400' : readerTheme === 'sepia' ? 'text-[#756247]' : 'text-slate-500';
  const visiblePageLabel = isSpreadLayout
    ? `${spreadRightPage}–${spreadLeftPage}`
    : String(page);

  const renderPageLeaf = (
    targetPage: number,
    side: 'single' | 'left' | 'right'
  ) => {
    const isCurrentPage = targetPage === page;
    const data = isCurrentPage ? pageData : companionPageData;
    const family = isCurrentPage ? fontFamily : companionFontFamily;
    const ready = isCurrentPage
      ? readerReady
      : companionReady && !companionError;
    const error = isCurrentPage
      ? (loadError || fontError)
      : companionError;
    const lineMapForPage = groupWordsByLine(data);
    const headerRowsForPage = getHeaderRows(targetPage);
    const targetLabel = getPageLabel(targetPage);
    const roundedClass =
      side === 'single'
        ? 'rounded-[1.35rem]'
        : side === 'left'
          ? 'rounded-l-[1.35rem] rounded-r-[0.35rem]'
          : 'rounded-l-[0.35rem] rounded-r-[1.35rem]';
    const aspectClass =
      side === 'single'
        ? 'aspect-[6/13] sm:aspect-[2/3]'
        : 'aspect-[2/3]';

    return (
      <article
        key={targetPage}
        aria-label={`Halaman mushaf ${targetPage}`}
        aria-current={isCurrentPage ? 'page' : undefined}
        className={`relative ${aspectClass} min-w-0 overflow-hidden border ${roundedClass} ${surfaceClass}`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-2.5 rounded-[0.9rem] border sm:inset-4 ${isDarkReader ? 'border-amber-200/15' : readerTheme === 'sepia' ? 'border-[#9b7d4d]/30' : 'border-amber-700/20'}`}
        />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 px-4 pt-3 text-[9px] font-semibold uppercase tracking-[0.14em] sm:px-6 sm:pt-4 sm:text-[10px]">
          <span className={`truncate ${mutedClass}`}>{targetLabel}</span>
          <span className={mutedClass}>QCF V2</span>
        </div>

        <div
          dir="rtl"
          lang="ar"
          aria-busy={!ready}
          className={`absolute inset-x-[4.5%] grid grid-rows-[repeat(15,minmax(0,1fr))] overflow-hidden text-center ${side === 'single' ? 'bottom-[4%] top-[4.5%] sm:bottom-[5.5%] sm:top-[6.5%]' : 'bottom-[5.5%] top-[6.5%]'}`}
        >
          {error ? (
            <div role="alert" dir="ltr" className="row-span-15 m-auto max-w-xs space-y-3 px-3 text-center">
              <p className="text-xs text-rose-600 sm:text-sm">{error}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setRetryKey((value) => value + 1);
                }}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${controlClass}`}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Coba lagi
              </button>
            </div>
          ) : !ready ? (
            <div role="status" dir="ltr" className={`row-span-15 m-auto px-3 text-xs sm:text-sm ${mutedClass}`}>
              Menyiapkan halaman {targetPage}...
            </div>
          ) : (
            Array.from({ length: 15 }, (_, index) => {
              const lineNumber = index + 1;
              const header = headerRowsForPage.get(lineNumber);
              const words = lineMapForPage.get(lineNumber) || [];

              if (header?.kind === 'surah') {
                const surah = SURAH_LIST.find((item) => item.number === header.surahNumber);
                return (
                  <div
                    key={`header-${targetPage}-${lineNumber}`}
                    className={`flex items-center justify-center px-2 text-center font-arabic font-semibold ${isDarkReader ? 'text-amber-100' : 'text-emerald-950'}`}
                    style={{
                      fontSize: isSpreadLayout
                        ? 'clamp(0.72rem, 1.55vw, 1.1rem)'
                        : 'clamp(0.9rem, 3.5vw, 1.35rem)',
                    }}
                  >
                    سورة {surah?.nameArabic || ''}
                  </div>
                );
              }

              if (header?.kind === 'bismillah') {
                return (
                  <div
                    key={`bismillah-${targetPage}-${lineNumber}`}
                    className={`flex items-center justify-center px-2 text-center font-arabic ${isDarkReader ? 'text-amber-50' : 'text-slate-950'}`}
                    style={{
                      fontSize: isSpreadLayout
                        ? 'clamp(0.76rem, 1.65vw, 1.18rem)'
                        : 'clamp(0.95rem, 3.7vw, 1.45rem)',
                    }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                );
              }

              return (
                <div
                  key={`line-${targetPage}-${lineNumber}`}
                  className="flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap"
                  aria-label={words.length ? `Baris mushaf ${lineNumber}` : undefined}
                >
                  {words.map((word, wordIndex) => (
                    <span
                      key={`${targetPage}-${lineNumber}-${wordIndex}-${word.code_v2}`}
                      className="inline-block shrink-0 leading-none"
                      title={word.text_uthmani || undefined}
                      style={{
                        fontFamily: `"${family}"`,
                        fontSize: isSpreadLayout
                          ? 'clamp(0.82rem, 1.78vw, 1.5rem)'
                          : 'clamp(1.05rem, 4.1vw, 2rem)',
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

        <div className={`absolute inset-x-0 bottom-2.5 text-center text-[10px] font-semibold tabular-nums sm:bottom-4 sm:text-xs ${mutedClass}`}>
          {targetPage}
        </div>
      </article>
    );
  };

  return (
    <section
      ref={readerShellRef}
      data-reader-theme={readerTheme}
      data-focus-mode={isFocusMode ? 'true' : 'false'}
      className={isFocusMode ? `fixed inset-0 z-[80] flex items-center justify-center overflow-hidden p-2 sm:p-4 ${focusBackgroundClass}` : 'space-y-3'}
      aria-label="Mushaf halaman QCF V2"
      onMouseMove={isFocusMode ? showControls : undefined}
    >
      {!isFocusMode && (
      <div className={`rounded-xl border p-3 sm:p-4 ${chromeClass}`}>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleBookmark}
              aria-pressed={isBookmarked}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm ${controlClass}`}
            >
              <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
              {isBookmarked ? 'Tersimpan' : 'Bookmark'}
            </button>
            <button
              type="button"
              onClick={() => void enterImmersiveMode()}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold sm:text-sm ${controlClass}`}
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
              Fokus baca
            </button>
          </div>
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-semibold ${mutedClass}`}>Tema baca</span>
          {([
            ['light', 'Terang'],
            ['sepia', 'Sepia'],
            ['night', 'Malam'],
          ] as const).map(([theme, label]) => (
            <button
              key={theme}
              type="button"
              onClick={() => selectTheme(theme)}
              aria-pressed={readerTheme === theme}
              className={`min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${readerTheme === theme ? 'border-emerald-700 bg-emerald-700 text-white' : controlClass}`}
            >
              {theme === 'light' && <Sun className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}
              {theme === 'night' && <Moon className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}
              {label}
            </button>
          ))}

          {bookmarks.length > 0 && (
            <label className="ml-auto min-w-[10rem]">
              <span className="sr-only">Buka bookmark halaman</span>
              <select
                value=""
                onChange={(event) => {
                  const targetPage = Number(event.target.value);
                  if (targetPage) setSafePage(targetPage);
                }}
                className={`min-h-9 w-full rounded-lg border px-2 py-1.5 text-xs ${controlClass}`}
              >
                <option value="">Bookmark ({bookmarks.length})</option>
                {bookmarks.map((savedPage) => (
                  <option key={savedPage} value={savedPage}>
                    Halaman {savedPage}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      )}

      <div
        data-mushaf-layout={isSpreadLayout ? 'spread' : 'single'}
        className={`relative mx-auto ${isSpreadLayout ? 'grid aspect-[4/3] grid-cols-2' : 'aspect-[6/13] sm:aspect-[2/3]'} ${isFocusMode ? 'max-w-none' : isSpreadLayout ? 'w-full max-w-[1180px]' : 'w-full max-w-[640px]'}`}
        style={isFocusMode ? {
          width: isSpreadLayout
            ? 'min(calc(100vw - 1rem), 133.334dvh)'
            : 'min(calc(100vw - 0.5rem), 46.154dvh)'
        } : undefined}
        onClick={toggleReaderControls}
        onTouchStart={(event) => {
          didSwipeRef.current = false;
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const startX = touchStartX.current;
          touchStartX.current = null;
          if (startX === null) return;

          const endX = event.changedTouches[0]?.clientX ?? startX;
          const deltaX = endX - startX;
          if (deltaX <= -48) {
            didSwipeRef.current = true;
            goNextPage();
            showControls();
          } else if (deltaX >= 48) {
            didSwipeRef.current = true;
            goPreviousPage();
            showControls();
          }
        }}
      >
        {isSpreadLayout ? (
          <>
            {renderPageLeaf(spreadLeftPage, 'left')}
            {renderPageLeaf(spreadRightPage, 'right')}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-y-[1.5%] left-1/2 z-20 w-px -translate-x-1/2 ${isDarkReader ? 'bg-white/10 shadow-[0_0_18px_rgba(0,0,0,0.75)]' : 'bg-black/10 shadow-[0_0_18px_rgba(71,52,31,0.28)]'}`}
            />
          </>
        ) : (
          renderPageLeaf(page, 'single')
        )}

        {isFocusMode && (
          <>
            <div
              className={`absolute inset-x-2 top-2 z-30 transition-opacity duration-200 sm:inset-x-3 sm:top-3 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`mx-auto flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/75 px-2 py-2 text-white shadow-xl backdrop-blur-md ${isSpreadLayout ? 'max-w-[1080px]' : 'max-w-[560px]'}`}>
                <div className="min-w-0 px-2">
                  <p className="truncate text-xs font-semibold sm:text-sm">{pageLabel}</p>
                  <p className="text-[10px] text-slate-300">
                    {isSpreadLayout ? `Halaman ${spreadRightPage}–${spreadLeftPage}` : `Halaman ${page}`}
                    {currentJuz ? ` · Juz ${currentJuz}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      toggleBookmark();
                      showControls();
                    }}
                    aria-label={isBookmarked ? 'Hapus bookmark halaman' : 'Bookmark halaman'}
                    aria-pressed={isBookmarked}
                    className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
                  >
                    <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void exitImmersiveMode()}
                    aria-label={isNativeFullscreen ? 'Keluar layar penuh' : 'Keluar mode fokus'}
                    className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
                  >
                    <Minimize2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`absolute inset-x-2 bottom-5 z-30 transition-opacity duration-200 sm:inset-x-3 sm:bottom-7 ${controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`mx-auto flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-950/75 p-2 text-white shadow-xl backdrop-blur-md ${isSpreadLayout ? 'max-w-[1080px]' : 'max-w-[560px]'}`}>
                <div className="flex items-center justify-center gap-1">
                  {([
                    ['light', 'Terang'],
                    ['sepia', 'Sepia'],
                    ['night', 'Malam'],
                  ] as const).map(([theme, label]) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => {
                        selectTheme(theme);
                        showControls();
                      }}
                      aria-pressed={readerTheme === theme}
                      className={`min-h-9 rounded-lg px-3 py-1.5 text-xs font-semibold ${readerTheme === theme ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-white/10'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      goPreviousPage();
                      showControls();
                    }}
                    disabled={!canGoPrevious}
                    aria-label={isSpreadLayout ? 'Spread sebelumnya' : 'Halaman sebelumnya'}
                    className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <p className="text-xs font-semibold tabular-nums">
                    {isSpreadLayout ? `${spreadRightPage}–${spreadLeftPage}` : page} / {TOTAL_MUSHAF_PAGES}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      goNextPage();
                      showControls();
                    }}
                    disabled={!canGoNext}
                    aria-label={isSpreadLayout ? 'Spread berikutnya' : 'Halaman berikutnya'}
                    className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {!isFocusMode && (
      <nav
        aria-label="Navigasi halaman mushaf"
        className={`mx-auto flex w-full flex-row-reverse items-center justify-between gap-2 ${isSpreadLayout ? 'max-w-[1180px]' : 'max-w-[640px]'}`}
      >
        <button
          type="button"
          onClick={goPreviousPage}
          disabled={!canGoPrevious}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${controlClass}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <p className={`text-center text-xs ${mutedClass}`}>
          {isSpreadLayout ? 'Geser ke kiri untuk spread berikutnya' : 'Geser ke kiri untuk halaman berikutnya'}
        </p>

        <button
          type="button"
          onClick={goNextPage}
          disabled={!canGoNext}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${controlClass}`}
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
      )}

      {!isFocusMode && (
      <p className={`mx-auto max-w-[640px] text-center text-[10px] leading-relaxed ${mutedClass}`}>
        M3 · HP memakai rasio layar modern 9:19.5 agar halaman lebih penuh; tablet/desktop tetap dua halaman terbuka RTL.
      </p>
      )}
    </section>
  );
};
