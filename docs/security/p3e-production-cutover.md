# P3E Production Cutover Runbook

Status dokumen ini adalah **readiness/runbook**, bukan izin deploy otomatis.

## Gate wajib sebelum cutover

1. Deploy application/API code terlebih dahulu dengan Firestore rules lama belum diperketat.
2. Pastikan environment production tersedia:
   - FIREBASE_PROJECT_ID
   - FIRESTORE_DATABASE_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
   - P0_MIGRATION_SECRET (minimal 24 karakter)
   - P0_ALLOW_LEGACY_LOGIN_MIGRATION=false
3. Jalankan `npm run verify:cutover-env` di environment yang memiliki variable tersebut.
4. Jalankan endpoint migrasi credential terkontrol satu kali:
   `POST /api/auth/migrate-credentials` dengan header `x-migration-secret`.
5. Migrasi hanya dianggap berhasil bila `readyForAuthGate=true`, `skipped=0`, dan `conflicts=0`.
6. Jalankan `GET /api/auth/readiness` dengan header migration secret.
7. Jangan deploy Firestore rules secure kecuali `readyForCutover=true`.
8. Smoke-test login untuk Superadmin, Ustadz, Pimpinan, Wali, dan Santri.
9. Verifikasi Pimpinan dapat membaca monitoring global tetapi semua mutation ditolak.
10. Baru setelah seluruh gate hijau, deploy `firestore.rules`.

## Rollback

- Jangan mengembalikan plaintext password ke koleksi users.
- Bila auth cutover bermasalah sebelum rules secure aktif, rollback application deployment ke build sebelumnya sambil menjaga backup credential migration.
- Bila masalah muncul setelah rules secure aktif, perbaiki/auth rollback application + rules sebagai satu unit; jangan membuka kembali `auth_credentials` ke client.
- `P0_ALLOW_LEGACY_LOGIN_MIGRATION` hanya boleh diaktifkan dalam jendela migrasi terkontrol dan harus kembali false sebelum cutover dianggap selesai.

## Kriteria selesai

- readiness endpoint: `readyForCutover=true`
- plaintext password tersisa: 0
- missing credentials: 0
- missing Firebase Auth users: 0
- claim mismatches: 0
- duplicate username conflicts: 0
- unknown roles: 0
- auth/runtime tests, Firestore rules emulator tests, TypeScript, dan production build hijau
