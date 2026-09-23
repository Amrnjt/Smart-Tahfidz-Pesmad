# Mushaf M1 data attribution

The local `qcf_surah_starts.json` file is sourced from the public
`mohammed-2-5/islamic-library-data` dataset and is used only for surah-to-page
navigation and page header placement.

QCF V2 page glyphs are fetched at runtime from Quran.com's page API using the
official `code_v2`, `line_number`, and `page_number` fields. Matching page
fonts are loaded on demand from QuranCDN's QCF V2 font path.

Font files are not bundled into this repository.

Sources:
- https://api.quran.com/api/v4/verses/by_page/{page}
- https://static.qurancdn.com/fonts/quran/hafs/v2/woff2/p{page}.woff2
- https://api-docs.quran.com/docs/tutorials/fonts/font-rendering/
- https://github.com/mohammed-2-5/islamic-library-data
