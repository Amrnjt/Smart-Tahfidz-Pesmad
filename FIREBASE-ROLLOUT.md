# Aktivasi pantauan liburan dan superadmin

Perubahan frontend, fungsi login, dan Firestore Rules harus dirilis bersama. Jangan merilis frontend ini sebelum `loginAccount` tersedia: login sekarang memakai identitas Firebase, sehingga peran tidak dapat dipalsukan melalui cache browser.

## Status

- Kode dan pengujian tersedia di branch ini.
- Belum diterapkan ke Firebase produksi. Pembacaan REST ditolak (`PERMISSION_DENIED`) dan Application Default Credentials tidak tersedia di mesin pengerjaan.
- Skrip penetapan mencari tepat satu username `Anas` tanpa membedakan kapital. Skrip berhenti bila akun tidak ditemukan, duplikat, atau ada superadmin berbeda. Kata sandi akun tidak disimpan dalam skrip dan tidak diubah.

## Langkah rilis oleh administrator Firebase

1. Gunakan proyek `tonal-garage-pn96h` dan database `ai-studio-pesmadsmarttahfi-4e6782fc-20ad-4a80-8224-2ddf36e8d09e`. Tinjau aturan yang sedang aktif sebelum menggantinya; aturan produksi tidak dapat dibaca selama pengerjaan ini.
2. Pasang dependensi: `npm ci` dan `npm ci --prefix functions`. Siapkan Firebase Authentication serta hak deployment Cloud Functions. Akun layanan fungsi membutuhkan izin membuat custom token (`iam.serviceAccounts.signBlob`). Ikuti [panduan custom authentication Firebase](https://firebase.google.com/docs/auth/web/custom-auth).
3. Dengan kredensial administrator Google yang sah (ADC), jalankan `node scripts/provision-superadmin.mjs`. Ini menetapkan role `Superadmin` dan nama Ust. Anas Amrullah, serta menyimpan ID dokumen permanen di `security/superadmin` secara atomik. Tidak menghapus akun apa pun.
4. Deploy fungsi lebih dahulu: `npx firebase deploy --only functions --project tonal-garage-pn96h`.
5. Dalam jadwal rilis yang sama, deploy rules: `npx firebase deploy --only firestore --project tonal-garage-pn96h`, lalu rilis hasil `npm run build` melalui jalur hosting aplikasi yang biasa dipakai. Frontend lama memakai login lokal dan tidak kompatibel dengan aturan akun yang baru.
6. Login kembali sebagai Anas; verifikasi role Superadmin. Coba switch ON/OFF dengan akun Wali di perangkat kedua. Switch awal OFF jika dokumen konfigurasi belum ada.

## Cakupan dan batasan

- Admin dan Superadmin mengendalikan switch. Ustadz mempertahankan akses pengelolaan akun yang sudah ada, termasuk menghapus Admin biasa. Superadmin tidak dapat dihapus atau diubah identitas/role melalui aplikasi maupun SDK klien. Administrator Firebase dengan Admin SDK tetap memiliki wewenang infrastruktur.
- Akun di sini adalah dokumen `users`; ketika dihapus, login dan izin programnya dicabut. Identitas teknis Firebase Auth yang pernah diterbitkan dapat tetap tercatat, tetapi tidak dapat mengakses akun/program tanpa dokumen `users`.
- Fungsi login menjembatani penyimpanan username/password lama. Format password lama dan akses pengelola terhadapnya belum dimigrasikan ke hash. Koleksi pengajaran lama mempertahankan aturan sebelumnya; ini bukan audit seluruh aplikasi.
- Catatan harian memakai ID santri + tanggal agar penyimpanan ulang menimpa catatan hari yang sama. OFF menolak create/update pada server; catatan tetap disimpan.
- Penghapusan santri beserta akun terkait menggunakan batch atomik dan berhenti bila melebihi 500 dokumen.

## Verifikasi lokal

`npm run lint`, `npm run build`, dan `npm run test:rules` (Java 21+). Pengujian meliputi penghapusan Admin, proteksi Superadmin, pembatasan Wali, switch OFF, validasi tiga status shalat, preferensi notifikasi, serta login server dan pembatasan percobaan. Grafik diperiksa pada lebar 320, 375, 430, 768, dan 1280 px menggunakan data sintetis.
