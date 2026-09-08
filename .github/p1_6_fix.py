from pathlib import Path
import re

root = Path('src')

# Correct duplicated/missing onNotify props introduced by the first patch pass.
app_path = root / 'App.tsx'
t = app_path.read_text()
for comp in ['ZiyadahForm', 'MurojaahForm', 'BinnadzorForm', 'PembelajaranForm']:
    pattern = rf'(<{comp}\b.*?onSuccess=\{{\(\) => \{{.*?\n\s*\}}\}})(?:\n\s*onNotify=\{{notify\}})*'
    t, n = re.subn(pattern, lambda m: m.group(1) + '\n                onNotify={notify}', t, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f'Could not normalize onNotify for {comp}: {n}')
app_path.write_text(t)

# Use double-quoted TS strings for the apostrophe in Muroja'ah feedback.
p = root / 'components/MurojaahForm.tsx'
t = p.read_text()
t = t.replace("onNotify('success', 'Muroja'ah berhasil disimpan ke Cloud.');", "onNotify('success', \"Muroja'ah berhasil disimpan ke Cloud.\");")
t = t.replace("onNotify('error', 'Muroja'ah belum tersimpan ke Cloud. Periksa koneksi lalu coba simpan lagi.');", "onNotify('error', \"Muroja'ah belum tersimpan ke Cloud. Periksa koneksi lalu coba simpan lagi.\");")
p.write_text(t)

print('P1.6 correction pass applied')
