# Aplikasi Manajemen Kelas Tahfidz Al-Qur'an (Google Apps Script Web App)

Aplikasi Web App Tahfidz Al-Qur'an terpadu dengan database **Google Sheets** otomatis, mencakup portal Ustadz, portal Wali Santri, dan Mushaf Al-Qur'an Digital 30 Juz interaktif.

## Daftar File yang Diperlukan di Google Apps Script:
1. `Code.gs` : Script Backend & API Google Sheets
2. `Index.html` : Struktur UI SPA (Single Page Application)
3. `CSS.html` : Desain Modern & Styling Font Arab
4. `JavaScript.html` : Logika Frontend, Otentikasi, Fetch API Quran & Apps Script Run

## Struktur Sheet Database Otomatis
- **Users**: ID, Username, Password, Role, Nama, ID_Santri
- **Santri**: ID_Santri, Nama_Santri, Kelas, Target_Hafalan
- **Ziyadah**: ID, Timestamp, ID_Santri, Surah, Ayat_Awal, Ayat_Akhir, Nilai, Catatan, Input_By
- **Murojaah**: ID, Timestamp, ID_Santri, Surah_Atau_Juz, Nilai, Catatan, Input_By

## Akun Demo Bawaan:
- **Ustadz:**
  - Username: `ustadz1` | Password: `123`
  - Username: `ustadz2` | Password: `123`
- **Wali Santri:**
  - Username/ID Santri: `STR001` | Password: `123` (Wali Muhammad Fatih)
  - Username/ID Santri: `STR002` | Password: `123` (Wali Maryam Al-Khansa)
  - Username/ID Santri: `STR003` | Password: `123` (Wali Ahmad Zaidan)

## Cara Deploy ke Web App (Anyone / Siapa Saja):
1. Buka [Google Sheets](https://sheets.new).
2. Buka menu **Extensions (Ekstensi)** > **Apps Script**.
3. Buat file `Code.gs`, `Index.html`, `CSS.html`, dan `JavaScript.html` lalu salin kodenya.
4. Jalankan fungsi `initDatabase` satu kali untuk generate otomatis 4 Sheet database.
5. Klik **Deploy** > **New Deployment** > Pilih **Web App**.
6. Atur **Execute as: Me** dan **Who has access: Anyone**.
7. Salin Web App URL dan bagikan ke Ustadz & Wali Santri!
