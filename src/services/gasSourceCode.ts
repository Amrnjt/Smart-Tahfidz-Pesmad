export const GAS_CODE_GS = `/**
 * ==============================================================================
 * TAHFIDZ AL-QUR'AN PESANTREN MADRASAH DARUL FIKRI
 * Alamat: Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
 * Backend Script & Google Sheets Database Engine (Google Apps Script Web App)
 * ==============================================================================
 */

// 1. Inisialisasi Database Sheet & Headers
const SHEETS = {
  USERS: 'Users',
  SANTRI: 'Santri',
  ZIYADAH: 'Ziyadah',
  MUROJAAH: 'Murojaah'
};

const SHEET_HEADERS = {
  Users: ['ID', 'Username', 'Password', 'Role', 'Nama', 'ID_Santri'],
  Santri: ['ID_Santri', 'Nama_Santri', 'Kelas', 'Target_Hafalan'],
  Ziyadah: ['ID', 'Timestamp', 'ID_Santri', 'Surah', 'Ayat_Awal', 'Ayat_Akhir', 'Nilai', 'Catatan', 'Input_By'],
  Murojaah: ['ID', 'Timestamp', 'ID_Santri', 'Surah_Atau_Juz', 'Nilai', 'Catatan', 'Input_By']
};

/**
 * Web App Entry Point (doGet)
 */
function doGet(e) {
  // Inisialisasi otomatis struktur database bila belum ada
  initDatabase();
  
  const template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle("Tahfidz al-Qur'an Pesantren Madrasah Darul Fikri")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyertakan file HTML modular (CSS & JS) ke dalam Index.html
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Otomatis Membuat & Mengatur Format Sheet Database jika belum tersedia
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(SHEET_HEADERS).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(SHEET_HEADERS[sheetName]);
      
      // Styling Header Sheet
      const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS[sheetName].length);
      headerRange.setBackground('#047857') // Emerald 700
                 .setFontColor('#ffffff')
                 .setFontWeight('bold')
                 .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
      
      // Isi data awal (seed data) jika baru dibuat
      if (sheetName === 'Users') {
        sheet.appendRow(['USR-001', 'ustadz1', '123', 'Ustadz', 'Ustadz Abdullah Robbani, Lc.', '']);
        sheet.appendRow(['USR-002', 'ustadz2', '123', 'Ustadz', 'Ustadzah Fatimah Azzahra, S.Pd.I', '']);
        sheet.appendRow(['USR-003', 'STR001', '123', 'Wali', 'Bpk. Hendra (Wali M. Fatih)', 'STR001']);
        sheet.appendRow(['USR-004', 'STR002', '123', 'Wali', 'Ibu Siti (Wali Maryam)', 'STR002']);
      } else if (sheetName === 'Santri') {
        sheet.appendRow(['STR001', 'Muhammad Fatih', 'Tahfidz A (Ikhwan)', 'Juz 30 (37 Surah)']);
        sheet.appendRow(['STR002', 'Maryam Al-Khansa', 'Tahfidz B (Akhwat)', 'Juz 30 & 29 (60 Surah)']);
        sheet.appendRow(['STR003', 'Ahmad Zaidan', 'Tahfidz A (Ikhwan)', 'Juz 30 (37 Surah)']);
      }
    }
  });
}

/**
 * Fungsi Otentikasi / Login Tunggal (Ustadz & Wali)
 */
function loginUser(credentials) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.USERS);
    if (!sheet) throw new Error("Database Users belum siap.");
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const usernameIdx = headers.indexOf('Username');
    const passwordIdx = headers.indexOf('Password');
    const roleIdx = headers.indexOf('Role');
    const namaIdx = headers.indexOf('Nama');
    const idSantriIdx = headers.indexOf('ID_Santri');
    const idIdx = headers.indexOf('ID');

    const username = String(credentials.username).trim();
    const password = String(credentials.password).trim();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[usernameIdx]).trim() === username && String(row[passwordIdx]).trim() === password) {
        return {
          success: true,
          user: {
            id: row[idIdx],
            username: row[usernameIdx],
            role: row[roleIdx],
            nama: row[namaIdx],
            idSantri: row[idSantriIdx] || ''
          }
        };
      }
    }

    return {
      success: false,
      message: "Username / ID Santri atau Password salah. Silakan periksa kembali."
    };
  } catch (error) {
    return { success: false, message: "Terjadi kesalahan: " + error.message };
  }
}

/**
 * Mengambil Seluruh Data Santri
 */
function getSantriList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.SANTRI);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const list = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      list.push({
        idSantri: String(row[0]),
        namaSantri: String(row[1]),
        kelas: String(row[2]),
        targetHafalan: String(row[3])
      });
    }
    return list;
  } catch (e) {
    Logger.log("Error getSantriList: " + e.message);
    return [];
  }
}

/**
 * Mengambil Ringkasan Data Dashboard
 */
function getDashboardData(role, idSantri) {
  try {
    const santriList = getSantriList();
    const ziyadahList = getZiyadahData(role, idSantri);
    const murojaahList = getMurojaahData(role, idSantri);

    // Hitung setoran hari ini (berdasarkan tanggal)
    const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    const todayZiyadah = ziyadahList.filter(item => String(item.timestamp).includes(todayStr));
    const todayMurojaah = murojaahList.filter(item => String(item.timestamp).includes(todayStr));

    return {
      success: true,
      totalSantri: santriList.length,
      setoranHariIni: todayZiyadah.length + todayMurojaah.length,
      ziyadahCount: ziyadahList.length,
      murojaahCount: murojaahList.length,
      santriList: santriList,
      recentZiyadah: ziyadahList.slice(0, 10),
      recentMurojaah: murojaahList.slice(0, 10)
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Mengambil Data Ziyadah (Filter otomatis untuk Wali)
 */
function getZiyadahData(role, idSantri) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.ZIYADAH);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const santriMap = getSantriMap();
    const result = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const rowSantriId = String(row[2]);
      
      // Jika role Wali, hanya ambil data milik anaknya
      if (role === 'Wali' && idSantri && rowSantriId !== String(idSantri)) {
        continue;
      }
      
      result.push({
        id: String(row[0]),
        timestamp: String(row[1]),
        idSantri: rowSantriId,
        namaSantri: santriMap[rowSantriId] || rowSantriId,
        surah: String(row[3]),
        ayatAwal: row[4],
        ayatAkhir: row[5],
        nilai: String(row[6]),
        catatan: String(row[7]),
        inputBy: String(row[8])
      });
    }
    return result;
  } catch (e) {
    Logger.log("Error getZiyadahData: " + e.message);
    return [];
  }
}

/**
 * Mengambil Data Murojaah (Filter otomatis untuk Wali)
 */
function getMurojaahData(role, idSantri) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.MUROJAAH);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const santriMap = getSantriMap();
    const result = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const rowSantriId = String(row[2]);
      
      if (role === 'Wali' && idSantri && rowSantriId !== String(idSantri)) {
        continue;
      }
      
      result.push({
        id: String(row[0]),
        timestamp: String(row[1]),
        idSantri: rowSantriId,
        namaSantri: santriMap[rowSantriId] || rowSantriId,
        surahAtauJuz: String(row[3]),
        nilai: String(row[4]),
        catatan: String(row[5]),
        inputBy: String(row[6])
      });
    }
    return result;
  } catch (e) {
    Logger.log("Error getMurojaahData: " + e.message);
    return [];
  }
}

function getSantriMap() {
  const list = getSantriList();
  const map = {};
  list.forEach(s => {
    map[s.idSantri] = s.namaSantri;
  });
  return map;
}

/**
 * Simpan Setoran Ziyadah Baru (Hafalan Baru)
 */
function saveZiyadah(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.ZIYADAH);
    if (!sheet) throw new Error("Sheet Ziyadah tidak ditemukan");
    
    const id = "ZYD-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    
    sheet.appendRow([
      id,
      timestamp,
      payload.idSantri,
      payload.surah,
      Number(payload.ayatAwal),
      Number(payload.ayatAkhir),
      payload.nilai,
      payload.catatan || "-",
      payload.inputBy || "Ustadz"
    ]);
    
    return { success: true, message: "Setoran Ziyadah berhasil disimpan!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan Ziyadah: " + e.message };
  }
}

/**
 * Simpan Setoran Muroja'ah Baru (Pengulangan Hafalan)
 */
function saveMurojaah(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.MUROJAAH);
    if (!sheet) throw new Error("Sheet Murojaah tidak ditemukan");
    
    const id = "MRJ-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    
    sheet.appendRow([
      id,
      timestamp,
      payload.idSantri,
      payload.surahAtauJuz,
      payload.nilai,
      payload.catatan || "-",
      payload.inputBy || "Ustadz"
    ]);
    
    return { success: true, message: "Setoran Muroja'ah berhasil disimpan!" };
  } catch (e) {
    return { success: false, message: "Gagal menyimpan Muroja'ah: " + e.message };
  }
}

/**
 * Update Record (Ziyadah atau Murojaah)
 */
function updateRecord(type, id, payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = type === 'Ziyadah' ? SHEETS.ZIYADAH : SHEETS.MUROJAAH;
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet " + sheetName + " tidak ditemukan");
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        const rowNum = i + 1;
        if (type === 'Ziyadah') {
          sheet.getRange(rowNum, 3, 1, 6).setValues([[
            payload.idSantri,
            payload.surah,
            Number(payload.ayatAwal),
            Number(payload.ayatAkhir),
            payload.nilai,
            payload.catatan || "-"
          ]]);
        } else {
          sheet.getRange(rowNum, 3, 1, 4).setValues([[
            payload.idSantri,
            payload.surahAtauJuz,
            payload.nilai,
            payload.catatan || "-"
          ]]);
        }
        return { success: true, message: "Data " + type + " berhasil diperbarui!" };
      }
    }
    return { success: false, message: "ID Record tidak ditemukan." };
  } catch (e) {
    return { success: false, message: "Gagal update: " + e.message };
  }
}

/**
 * Hapus Record (Ziyadah atau Murojaah)
 */
function deleteRecord(type, id) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = type === 'Ziyadah' ? SHEETS.ZIYADAH : SHEETS.MUROJAAH;
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet " + sheetName + " tidak ditemukan");
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Data berhasil dihapus!" };
      }
    }
    return { success: false, message: "Record tidak ditemukan." };
  } catch (e) {
    return { success: false, message: "Gagal menghapus: " + e.message };
  }
}

/**
 * Tambah Santri Baru ke Sheet
 */
function addSantri(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.SANTRI);
    if (!sheet) throw new Error("Sheet Santri tidak ditemukan");
    
    const idSantri = payload.idSantri || ("STR" + Utilities.formatString("%03d", sheet.getLastRow()));
    sheet.appendRow([
      idSantri,
      payload.namaSantri,
      payload.kelas,
      payload.targetHafalan
    ]);

    // Sekaligus buat user akun wali otomatis jika diminta
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    if (userSheet) {
      userSheet.appendRow([
        "USR-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss"),
        idSantri, // username wali = idSantri
        "123",    // default PIN/password wali
        "Wali",
        "Wali " + payload.namaSantri,
        idSantri
      ]);
    }

    return { success: true, message: "Santri & Akun Wali berhasil didaftarkan!" };
  } catch (e) {
    return { success: false, message: "Gagal tambah santri: " + e.message };
  }
}

/**
 * Hapus Data Santri, Akun Wali, dan Riwayat Terkait
 */
function deleteSantri(idSantri) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Hapus dari sheet Santri
    const santriSheet = ss.getSheetByName(SHEETS.SANTRI);
    if (santriSheet) {
      const data = santriSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(idSantri)) {
          santriSheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    // 2. Hapus akun Wali dari sheet Users
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    if (userSheet) {
      const data = userSheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][5]) === String(idSantri) || String(data[i][1]) === String(idSantri)) {
          userSheet.deleteRow(i + 1);
        }
      }
    }

    // 3. Hapus data Ziyadah terkait
    const ziyadahSheet = ss.getSheetByName(SHEETS.ZIYADAH);
    if (ziyadahSheet) {
      const data = ziyadahSheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][2]) === String(idSantri)) {
          ziyadahSheet.deleteRow(i + 1);
        }
      }
    }

    // 4. Hapus data Murojaah terkait
    const murojaahSheet = ss.getSheetByName(SHEETS.MUROJAAH);
    if (murojaahSheet) {
      const data = murojaahSheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][2]) === String(idSantri)) {
          murojaahSheet.deleteRow(i + 1);
        }
      }
    }

    return { success: true, message: "Santri & data terkait berhasil dihapus!" };
  } catch (e) {
    return { success: false, message: "Gagal menghapus santri: " + e.message };
  }
}
`;

export const GAS_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Tahfidz al-Qur'an Pesantren Madrasah Darul Fikri</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts & Font Awesome Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <?!= include('CSS'); ?>
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans pb-20 md:pb-6 selection:bg-emerald-100 selection:text-emerald-900">

  <!-- TOP APP BAR -->
  <header class="sticky top-0 z-40 bg-emerald-800 text-white shadow-md border-b border-emerald-900">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center border border-emerald-500/30 shadow-inner flex-shrink-0">
          <i class="fa-solid fa-book-quran text-emerald-200 text-lg"></i>
        </div>
        <div>
          <h1 class="text-sm md:text-base font-bold leading-tight flex items-center gap-2 flex-wrap">
            Tahfidz al-Qur'an <span class="text-emerald-200 font-normal">Pesantren Madrasah Darul Fikri</span>
            <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 border border-emerald-400/40 text-emerald-100">Web App</span>
          </h1>
          <p class="text-[11px] text-emerald-200 flex items-center gap-1" id="headerSubtitle">
            <i class="fa-solid fa-location-dot text-amber-300"></i> Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
          </p>
        </div>
      </div>
      
      <!-- User Profile & Action -->
      <div id="userHeaderArea" class="hidden flex items-center space-x-2">
        <div class="text-right hidden sm:block">
          <p id="userNameDisplay" class="text-xs font-semibold text-white leading-tight"></p>
          <span id="userRoleBadge" class="inline-block text-[10px] px-2 py-0.2 rounded-full font-medium bg-emerald-700 text-emerald-200 border border-emerald-600"></span>
        </div>
        <button onclick="logout()" title="Keluar Akun" class="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-900 text-emerald-100 transition-colors border border-emerald-600/50">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN APPLICATION CONTAINER -->
  <main class="max-w-6xl mx-auto px-4 py-5">
    
    <!-- 1. VIEW LOGIN (Jika belum autentikasi) -->
    <div id="loginView" class="max-w-md mx-auto my-6">
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        <div class="bg-gradient-to-br from-emerald-800 to-teal-900 p-6 text-center text-white relative">
          <div class="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center border border-white/20 shadow-inner mb-3">
            <i class="fa-solid fa-quran text-3xl text-emerald-300"></i>
          </div>
          <h2 class="text-lg font-bold">Tahfidz al-Qur'an</h2>
          <p class="text-sm font-semibold text-emerald-100">Pesantren Madrasah Darul Fikri</p>
          <p class="text-[11px] text-emerald-200 mt-0.5">Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro</p>
        </div>

        <div class="p-6 space-y-4">
          <!-- Role selector hint -->
          <div class="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-800 border border-emerald-200 flex items-start gap-2.5">
            <i class="fa-solid fa-circle-info text-emerald-600 mt-0.5 text-sm"></i>
            <div>
              <p class="font-semibold">Petunjuk Login:</p>
              <ul class="list-disc ml-4 mt-0.5 space-y-0.5 text-slate-600">
                <li><span class="font-medium text-emerald-800">Ustadz:</span> Gunakan Username & Password (contoh: <code class="bg-emerald-100 px-1 rounded">ustadz1</code> / <code class="bg-emerald-100 px-1 rounded">123</code>)</li>
                <li><span class="font-medium text-emerald-800">Wali Santri:</span> Gunakan ID Santri (contoh: <code class="bg-emerald-100 px-1 rounded">STR001</code> / <code class="bg-emerald-100 px-1 rounded">123</code>)</li>
              </ul>
            </div>
          </div>

          <form id="loginForm" onsubmit="handleLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Username / ID Santri</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <i class="fa-solid fa-user"></i>
                </span>
                <input type="text" id="loginUsername" required placeholder="Contoh: ustadz1 atau STR001" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password / PIN</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <i class="fa-solid fa-lock"></i>
                </span>
                <input type="password" id="loginPassword" required placeholder="Masukkan Password / PIN" class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition">
              </div>
            </div>

            <div id="loginErrorMsg" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation text-rose-500"></i>
              <span id="loginErrorText"></span>
            </div>

            <button type="submit" id="btnLoginSubmit" class="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow transition flex items-center justify-center gap-2">
              <span>Masuk Sekarang</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- 2. VIEW UTAMA (DITAMPILKAN SETELAH LOGIN) -->
    <div id="appContainer" class="hidden space-y-5">
      
      <!-- DESKTOP TOP NAV TABS -->
      <nav class="hidden md:flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200/80 gap-1" id="desktopNavTabs">
        <!-- Injected via JavaScript based on Role -->
      </nav>

      <!-- TAB: DASHBOARD -->
      <div id="tabDashboard" class="tab-content space-y-5">
        <!-- Role Content Injected: Ustadz Dashboard / Wali Dashboard -->
        <div id="roleDashboardContent"></div>
      </div>

      <!-- TAB: INPUT ZIYADAH (USTADZ ONLY) -->
      <div id="tabZiyadah" class="tab-content hidden space-y-4">
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <i class="fa-solid fa-plus text-lg"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-base">Input Setoran Ziyadah (Hafalan Baru)</h3>
                <p class="text-xs text-slate-500">Catat penambahan hafalan baru santri secara real-time</p>
              </div>
            </div>
          </div>

          <form id="formZiyadah" onsubmit="handleSaveZiyadah(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Pilih Santri <span class="text-rose-500">*</span></label>
                <select id="ziyadahSantri" required class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
                  <option value="">-- Pilih Nama Santri --</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Pilih Surah (1 - 114) <span class="text-rose-500">*</span></label>
                <select id="ziyadahSurah" required onchange="handleSurahChange(this.value, 'ziyadah')" class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
                  <option value="">-- Pilih Surah --</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Ayat Awal <span class="text-rose-500">*</span></label>
                <input type="number" id="ziyadahAyatAwal" min="1" required placeholder="1" class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Ayat Akhir <span class="text-rose-500">*</span></label>
                <input type="number" id="ziyadahAyatAkhir" min="1" required placeholder="10" class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
              </div>
              <div class="col-span-2 md:col-span-1">
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Kualitas Nilai <span class="text-rose-500">*</span></label>
                <select id="ziyadahNilai" required class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
                  <option value="Sangat Lancar">🟢 Sangat Lancar (Mumtaz)</option>
                  <option value="Lancar">🟡 Lancar (Jayyid Jiddan)</option>
                  <option value="Perlu Ulang">🔴 Perlu Ulang (Rosib)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Catatan Tajwid / Evaluasi Ustadz</label>
              <textarea id="ziyadahCatatan" rows="3" placeholder="Contoh: Makhraj huruf 'Ain dan Ghain sudah tepat, jaga tempo bacaan tartil..." class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="reset" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition">Reset</button>
              <button type="submit" id="btnSubmitZiyadah" class="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs shadow-md transition flex items-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Simpan Setoran Ziyadah</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB: INPUT MUROJA'AH (USTADZ ONLY) -->
      <div id="tabMurojaah" class="tab-content hidden space-y-4">
        <div class="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <i class="fa-solid fa-arrows-rotate text-lg"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-800 text-base">Input Muroja'ah (Pengulangan Hafalan)</h3>
                <p class="text-xs text-slate-500">Evaluasi kelancaran surah atau juz yang telah dihafal sebelumnya</p>
              </div>
            </div>
          </div>

          <form id="formMurojaah" onsubmit="handleSaveMurojaah(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Pilih Santri <span class="text-rose-500">*</span></label>
                <select id="murojaahSantri" required class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
                  <option value="">-- Pilih Nama Santri --</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Surah atau Juz yang Di-muroja'ah <span class="text-rose-500">*</span></label>
                <input type="text" id="murojaahSurahAtauJuz" required placeholder="Contoh: Juz 30 Penuh / Surah Al-Mulk - Al-Qalam" class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Nilai Kelancaran <span class="text-rose-500">*</span></label>
                <select id="murojaahNilai" required class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
                  <option value="Sangat Lancar">🟢 Sangat Lancar (Mumtaz)</option>
                  <option value="Lancar">🟡 Lancar (Jayyid Jiddan)</option>
                  <option value="Perlu Ulang">🔴 Perlu Ulang (Rosib)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase mb-1.5">Catatan Evaluasi / Rekomendasi</label>
                <input type="text" id="murojaahCatatan" placeholder="Contoh: Perlu murajaah mandiri di rumah pada ayat 10-15..." class="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none">
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="reset" class="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition">Reset</button>
              <button type="submit" id="btnSubmitMurojaah" class="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-semibold text-xs shadow-md transition flex items-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Simpan Muroja'ah</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB: RIWAYAT SETORAN & MANAGEMENT (SEARCH / FILTER / EDIT / DELETE) -->
      <div id="tabRiwayat" class="tab-content hidden space-y-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-base">Riwayat Setoran Hafalan</h3>
              <p class="text-xs text-slate-500">Database seluruh aktivitas Ziyadah & Muroja'ah santri</p>
            </div>
            
            <div class="flex items-center gap-2">
              <div class="relative w-full sm:w-64">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
                <input type="text" id="searchHistory" oninput="filterHistoryTable()" placeholder="Cari santri, surah, catatan..." class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
              <select id="filterType" onchange="filterHistoryTable()" class="py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none">
                <option value="ALL">Semua Jenis</option>
                <option value="Ziyadah">Ziyadah</option>
                <option value="Murojaah">Muroja'ah</option>
              </select>
            </div>
          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto mt-4">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100/80 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3 px-3">Tanggal</th>
                  <th class="py-3 px-3">Santri</th>
                  <th class="py-3 px-3">Jenis</th>
                  <th class="py-3 px-3">Materi Hafalan</th>
                  <th class="py-3 px-3">Nilai</th>
                  <th class="py-3 px-3">Catatan Ustadz</th>
                  <th class="py-3 px-3 text-center" id="thAction">Aksi</th>
                </tr>
              </thead>
              <tbody id="historyTableBody" class="divide-y divide-slate-100">
                <!-- Injected via JavaScript -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: MUSHAF AL-QUR'AN DIGITAL INTERAKTIF -->
      <div id="tabMushaf" class="tab-content hidden space-y-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
                <i class="fa-solid fa-quran text-emerald-600"></i>
                Mushaf Al-Qur'an Digital
              </h3>
              <p class="text-xs text-slate-500">Simak bacaan santri lengkap dengan Teks Arab, Latin, Terjemahan & Audio Murattal</p>
            </div>

            <!-- Surah Selector and Search -->
            <div class="flex items-center gap-2">
              <div class="relative w-full sm:w-60">
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
                <input type="text" id="searchSurahInput" oninput="filterSurahList()" placeholder="Cari Surah (contoh: Yasin)..." class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              </div>
            </div>
          </div>

          <!-- Surah Cards Carousel / Grid -->
          <div id="surahGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
            <!-- Injected Surah list -->
          </div>

          <!-- Active Surah Reader Area -->
          <div id="activeSurahReader" class="mt-5 space-y-4">
            <div class="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-4 md:p-6 shadow-md relative overflow-hidden">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div>
                  <div class="flex items-center gap-2">
                    <span id="surahBadgeNumber" class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs text-emerald-200">1</span>
                    <h2 id="surahNameLatin" class="text-xl md:text-2xl font-extrabold tracking-wide">Al-Fatihah</h2>
                    <span id="surahTypeBadge" class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-500/40 text-emerald-100 font-medium">Makkiyyah</span>
                  </div>
                  <p id="surahTranslation" class="text-xs text-emerald-200 mt-1">Pembukaan • 7 Ayat</p>
                </div>

                <div class="text-right">
                  <p id="surahNameArabic" class="text-2xl md:text-3xl font-arabic font-bold text-amber-200">الفاتحة</p>
                </div>
              </div>
            </div>

            <!-- Bismillah Header (if not at-Taubah) -->
            <div id="bismillahBanner" class="py-4 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
              <p class="font-arabic text-2xl md:text-3xl text-emerald-950">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            </div>

            <!-- Ayah List Container -->
            <div id="ayahListContainer" class="space-y-3">
              <!-- Ayahs rendered here -->
            </div>
          </div>
        </div>
      </div>

      <!-- TAB: DATA SANTRI (USTADZ ONLY) -->
      <div id="tabSantri" class="tab-content hidden space-y-4">
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 class="font-bold text-slate-800 text-base">Manajemen Data Santri</h3>
              <p class="text-xs text-slate-500">Kelola daftar santri kelas tahfidz dan target hafalan</p>
            </div>
            <button onclick="openAddSantriModal()" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm">
              <i class="fa-solid fa-user-plus"></i>
              <span>Tambah Santri Baru</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4" id="santriCardGrid">
            <!-- Santri cards injected -->
          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- MOBILE BOTTOM NAVIGATION BAR -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg" id="mobileBottomNav">
    <div class="flex justify-around items-center text-[10px] font-medium text-slate-500" id="mobileNavItems">
      <!-- Items dynamically populated based on Role -->
    </div>
  </nav>

  <!-- GLOBAL SPINNER OVERLAY -->
  <div id="globalSpinner" class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center hidden">
    <div class="bg-white p-5 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-slate-100 max-w-xs text-center">
      <div class="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p id="spinnerText" class="text-xs font-semibold text-slate-700">Sedang memproses data...</p>
    </div>
  </div>

  <!-- TOAST NOTIFICATION -->
  <div id="toastNotification" class="fixed top-4 right-4 z-50 transform -translate-y-20 transition-all duration-300 opacity-0 pointer-events-none max-w-sm">
    <div id="toastCard" class="bg-white p-3.5 rounded-xl shadow-xl border flex items-center gap-3 text-xs">
      <i id="toastIcon" class="fa-solid fa-circle-check text-base"></i>
      <span id="toastMessage" class="font-medium"></span>
    </div>
  </div>

  <!-- MODAL TAMBAH SANTRI -->
  <div id="modalAddSantri" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
          <i class="fa-solid fa-user-plus text-emerald-600"></i>
          Tambah Santri Baru
        </h4>
        <button onclick="closeAddSantriModal()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <form id="formAddSantri" onsubmit="handleSaveNewSantri(event)" class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">ID Santri</label>
          <input type="text" id="newSantriId" placeholder="Contoh: STR006 (Biarkan kosong untuk auto-ID)" class="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Santri <span class="text-rose-500">*</span></label>
          <input type="text" id="newSantriNama" required placeholder="Nama santri..." class="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Kelas <span class="text-rose-500">*</span></label>
          <input type="text" id="newSantriKelas" required placeholder="Contoh: Tahfidz A (Ikhwan)" class="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Target Hafalan <span class="text-rose-500">*</span></label>
          <input type="text" id="newSantriTarget" required placeholder="Contoh: Juz 30 (37 Surah)" class="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none">
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button type="button" onclick="closeAddSantriModal()" class="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600">Batal</button>
          <button type="submit" class="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800">Simpan Santri</button>
        </div>
      </form>
    </div>
  </div>

  <?!= include('JavaScript'); ?>
</body>
</html>
`;

export const GAS_CSS_HTML = `<style>
  /* Custom Font & Arabic Typography Styles */
  .font-arabic {
    font-family: 'Amiri', 'Scheherazade New', serif;
    direction: rtl;
    line-height: 2.2;
  }
  
  /* Smooth transitions */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Custom Scrollbar for better UI */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 9999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Active nav tab indicator */
  .nav-tab-active {
    background-color: #047857 !important;
    color: #ffffff !important;
    font-weight: 600;
  }

  .bottom-nav-active {
    color: #047857 !important;
    font-weight: 700;
  }

  /* Ayah Card Hover Effect */
  .ayah-card {
    transition: all 0.2s ease-in-out;
  }
  .ayah-card:hover {
    border-color: #10b981;
    background-color: #f0fdf4;
  }

  /* Progress Bar Glow */
  .progress-glow {
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
  }
</style>
`;

export const GAS_JAVASCRIPT_HTML = `<script>
/**
 * ==============================================================================
 * LOGIKA FRONTEND JAVASCRIPT UNTUK GOOGLE APPS SCRIPT WEB APP
 * Terhubung dengan google.script.run, Quran Public API, & State Management
 * ==============================================================================
 */

// 1. Data Metadata Surah (1 - 114)
const SURAH_METADATA = [
  { number: 1, name: "Al-Fatihah", arabic: "الفاتحة", translation: "Pembukaan", ayahs: 7, type: "Makkiyyah" },
  { number: 2, name: "Al-Baqarah", arabic: "البقرة", translation: "Sapi Betina", ayahs: 286, type: "Madaniyyah" },
  { number: 3, name: "Ali 'Imran", arabic: "آل عمران", translation: "Keluarga Imran", ayahs: 200, type: "Madaniyyah" },
  { number: 4, name: "An-Nisa'", arabic: "النساء", translation: "Wanita", ayahs: 176, type: "Madaniyyah" },
  { number: 5, name: "Al-Ma'idah", arabic: "المائدة", translation: "Hidangan", ayahs: 120, type: "Madaniyyah" },
  { number: 6, name: "Al-An'am", arabic: "الأنعام", translation: "Binatang Ternak", ayahs: 165, type: "Makkiyyah" },
  { number: 7, name: "Al-A'raf", arabic: "الأعراف", translation: "Tempat Tertinggi", ayahs: 206, type: "Makkiyyah" },
  { number: 8, name: "Al-Anfal", arabic: "الأنفal", translation: "Rampasan Perang", ayahs: 75, type: "Madaniyyah" },
  { number: 9, name: "At-Taubah", arabic: "التوبة", translation: "Pengampunan", ayahs: 129, type: "Madaniyyah" },
  { number: 10, name: "Yunus", arabic: "يونس", translation: "Nabi Yunus", ayahs: 109, type: "Makkiyyah" },
  { number: 36, name: "Yasin", arabic: "يس", translation: "Ya-Sin", ayahs: 83, type: "Makkiyyah" },
  { number: 55, name: "Ar-Rahman", arabic: "الرحمن", translation: "Maha Pengasih", ayahs: 78, type: "Madaniyyah" },
  { number: 56, name: "Al-Waqi'ah", arabic: "الواقعة", translation: "Hari Kiamat", ayahs: 96, type: "Makkiyyah" },
  { number: 67, name: "Al-Mulk", arabic: "الملك", translation: "Kerajaan", ayahs: 30, type: "Makkiyyah" },
  { number: 78, name: "An-Naba'", arabic: "النبأ", translation: "Berita Besar", ayahs: 40, type: "Makkiyyah" },
  { number: 79, name: "An-Nazi'at", arabic: "النازعات", translation: "Malaikat yang Mencabut", ayahs: 46, type: "Makkiyyah" },
  { number: 80, name: "'Abasa", arabic: "عبس", translation: "Ia Bermuka Masam", ayahs: 42, type: "Makkiyyah" },
  { number: 81, name: "At-Takwir", arabic: "التكوير", translation: "Menggulung", ayahs: 29, type: "Makkiyyah" },
  { number: 82, name: "Al-Infitar", arabic: "الانفطار", translation: "Terbelah", ayahs: 19, type: "Makkiyyah" },
  { number: 83, name: "Al-Mutaffifin", arabic: "المطففين", translation: "Orang-Orang Curang", ayahs: 36, type: "Makkiyyah" },
  { number: 84, name: "Al-Insyiqaq", arabic: "الانشقاق", translation: "Terbelah", ayahs: 25, type: "Makkiyyah" },
  { number: 85, name: "Al-Buruj", arabic: "البروج", translation: "Gugusan Bintang", ayahs: 22, type: "Makkiyyah" },
  { number: 86, name: "At-Tariq", arabic: "الطارق", translation: "Yang Datang di Malam Hari", ayahs: 17, type: "Makkiyyah" },
  { number: 87, name: "Al-A'la", arabic: "الأعلى", translation: "Maha Tinggi", ayahs: 19, type: "Makkiyyah" },
  { number: 88, name: "Al-Ghasyiyah", arabic: "الغاشية", translation: "Hari Pembalasan", ayahs: 26, type: "Makkiyyah" },
  { number: 89, name: "Al-Fajr", arabic: "الفجر", translation: "Fajar", ayahs: 30, type: "Makkiyyah" },
  { number: 90, name: "Al-Balad", arabic: "البلد", translation: "Negeri", ayahs: 20, type: "Makkiyyah" },
  { number: 91, name: "Asy-Syams", arabic: "الشمس", translation: "Matahari", ayahs: 15, type: "Makkiyyah" },
  { number: 92, name: "Al-Lail", arabic: "الليل", translation: "Malam", ayahs: 21, type: "Makkiyyah" },
  { number: 93, name: "Ad-Duha", arabic: "الضحى", translation: "Waktu Dhuha", ayahs: 11, type: "Makkiyyah" },
  { number: 94, name: "Asy-Syarh", arabic: "الشرح", translation: "Kelapangan", ayahs: 8, type: "Makkiyyah" },
  { number: 95, name: "At-Tin", arabic: "التين", translation: "Buah Tin", ayahs: 8, type: "Makkiyyah" },
  { number: 96, name: "Al-'Alaq", arabic: "العلق", translation: "Segumpal Darah", ayahs: 19, type: "Makkiyyah" },
  { number: 97, name: "Al-Qadr", arabic: "القدر", translation: "Kemuliaan", ayahs: 5, type: "Makkiyyah" },
  { number: 98, name: "Al-Bayyinah", arabic: "البينة", translation: "Bukti Nyata", ayahs: 8, type: "Madaniyyah" },
  { number: 99, name: "Az-Zalzalah", arabic: "الزلزلة", translation: "Keguncangan", ayahs: 8, type: "Madaniyyah" },
  { number: 100, name: "Al-'Adiyat", arabic: "العاديات", translation: "Kuda yang Berlari Kencang", ayahs: 11, type: "Makkiyyah" },
  { number: 101, name: "Al-Qari'ah", arabic: "القارعة", translation: "Hari Kiamat", ayahs: 11, type: "Makkiyyah" },
  { number: 102, name: "At-Takasur", arabic: "التكاثر", translation: "Bermegah-megahan", ayahs: 8, type: "Makkiyyah" },
  { number: 103, name: "Al-'Asr", arabic: "العصر", translation: "Masa", ayahs: 3, type: "Makkiyyah" },
  { number: 104, name: "Al-Humazah", arabic: "الهمزة", translation: "Pengumpat", ayahs: 9, type: "Makkiyyah" },
  { number: 105, name: "Al-Fil", arabic: "الفيل", translation: "Gajah", ayahs: 5, type: "Makkiyyah" },
  { number: 106, name: "Quraisy", arabic: "قريش", translation: "Suku Quraisy", ayahs: 4, type: "Makkiyyah" },
  { number: 107, name: "Al-Ma'un", arabic: "الماعون", translation: "Barang-Barang Berguna", ayahs: 7, type: "Makkiyyah" },
  { number: 108, name: "Al-Kausar", arabic: "الكوثر", translation: "Nikmat yang Banyak", ayahs: 3, type: "Makkiyyah" },
  { number: 109, name: "Al-Kafirun", arabic: "الكافرون", translation: "Orang-Orang Kafir", ayahs: 6, type: "Makkiyyah" },
  { number: 110, name: "An-Nasr", arabic: "النصر", translation: "Pertolongan", ayahs: 3, type: "Madaniyyah" },
  { number: 111, name: "Al-Lahab", arabic: "المسد", translation: "Gejolak Api", ayahs: 5, type: "Makkiyyah" },
  { number: 112, name: "Al-Ikhlas", arabic: "الإخلاص", translation: "Kemurnian Keesaan Allah", ayahs: 4, type: "Makkiyyah" },
  { number: 113, name: "Al-Falaq", arabic: "الفلق", translation: "Waktu Subuh", ayahs: 5, type: "Makkiyyah" },
  { number: 114, name: "An-Nas", arabic: "الناس", translation: "Manusia", ayahs: 6, type: "Makkiyyah" }
];

// State Global Frontend
let appState = {
  currentUser: null,
  santriList: [],
  ziyadahList: [],
  murojaahList: [],
  currentTab: 'dashboard',
  currentSurahNumber: 1,
  dashboardData: null
};

// Inisialisasi saat window dimuat
document.addEventListener('DOMContentLoaded', () => {
  populateSurahDropdowns();
  renderSurahGrid();
  loadSurahDetail(1);
  
  // Cek apakah ada sesi tersimpan di sessionStorage
  const savedUser = sessionStorage.getItem('tahfidz_user');
  if (savedUser) {
    try {
      appState.currentUser = JSON.parse(savedUser);
      onLoginSuccess(appState.currentUser);
    } catch(e) {
      sessionStorage.removeItem('tahfidz_user');
    }
  }
});

/**
 * Handle Otentikasi Login
 */
function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('btnLoginSubmit');
  const errorBox = document.getElementById('loginErrorMsg');
  const errorText = document.getElementById('loginErrorText');

  errorBox.classList.add('hidden');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> <span>Memverifikasi...</span>';

  showSpinner("Sedang memeriksa akun...");

  // Panggil Backend Apps Script
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((res) => {
        hideSpinner();
        btn.disabled = false;
        btn.innerHTML = '<span>Masuk Sekarang</span> <i class="fa-solid fa-arrow-right"></i>';
        if (res.success) {
          appState.currentUser = res.user;
          sessionStorage.setItem('tahfidz_user', JSON.stringify(res.user));
          onLoginSuccess(res.user);
          showToast("Selamat datang, " + res.user.nama, "success");
        } else {
          errorText.innerText = res.message;
          errorBox.classList.remove('hidden');
        }
      })
      .withFailureHandler((err) => {
        hideSpinner();
        btn.disabled = false;
        btn.innerHTML = '<span>Masuk Sekarang</span> <i class="fa-solid fa-arrow-right"></i>';
        errorText.innerText = "Koneksi gagal: " + err.message;
        errorBox.classList.remove('hidden');
      })
      .loginUser({ username, password });
  } else {
    // Fallback mode demo jika dibuka di luar GAS
    setTimeout(() => {
      hideSpinner();
      btn.disabled = false;
      btn.innerHTML = '<span>Masuk Sekarang</span> <i class="fa-solid fa-arrow-right"></i>';
      if (username.toLowerCase().includes('ustadz')) {
        const u = { id: 'USR-001', username, role: 'Ustadz', nama: 'Ustadz Abdullah Robbani, Lc.', idSantri: '' };
        appState.currentUser = u;
        onLoginSuccess(u);
      } else {
        const u = { id: 'USR-003', username, role: 'Wali', nama: 'Bpk. Hendra (Wali M. Fatih)', idSantri: username || 'STR001' };
        appState.currentUser = u;
        onLoginSuccess(u);
      }
    }, 600);
  }
}

function onLoginSuccess(user) {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('userHeaderArea').classList.remove('hidden');
  document.getElementById('userNameDisplay').innerText = user.nama;
  document.getElementById('userRoleBadge').innerText = user.role;

  buildNavigation(user.role);
  fetchDashboardAndData();
}

function logout() {
  sessionStorage.removeItem('tahfidz_user');
  appState.currentUser = null;
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
  document.getElementById('userHeaderArea').classList.add('hidden');
  showToast("Anda telah keluar.", "info");
}

/**
 * Membangun Menu Navigasi Berdasarkan Hak Akses Role
 */
function buildNavigation(role) {
  const desktopNav = document.getElementById('desktopNavTabs');
  const mobileNav = document.getElementById('mobileNavItems');
  
  let tabs = [];
  if (role === 'Ustadz') {
    tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: 'fa-gauge-high' },
      { id: 'ziyadah', label: 'Input Ziyadah', icon: 'fa-plus-circle' },
      { id: 'murojaah', label: "Input Muroja'ah", icon: 'fa-arrows-rotate' },
      { id: 'riwayat', label: 'Riwayat Setoran', icon: 'fa-table-list' },
      { id: 'mushaf', label: 'Mushaf Al-Qur\'an', icon: 'fa-book-quran' },
      { id: 'santri', label: 'Data Santri', icon: 'fa-users' }
    ];
  } else {
    // Role Wali
    tabs = [
      { id: 'dashboard', label: 'Dashboard Anak', icon: 'fa-gauge-high' },
      { id: 'riwayat', label: 'Riwayat Setoran', icon: 'fa-clock-rotate-left' },
      { id: 'mushaf', label: 'Mushaf Al-Qur\'an', icon: 'fa-book-quran' }
    ];
  }

  // Render Desktop Tabs
  desktopNav.innerHTML = tabs.map((t, idx) => \`
    <button onclick="switchTab('\${t.id}')" id="desktopTabBtn_\${t.id}" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-2 transition \${idx === 0 ? 'nav-tab-active' : ''}">
      <i class="fa-solid \${t.icon}"></i>
      <span>\${t.label}</span>
    </button>
  \`).join('');

  // Render Mobile Bottom Nav
  mobileNav.innerHTML = tabs.map((t, idx) => \`
    <button onclick="switchTab('\${t.id}')" id="mobileTabBtn_\${t.id}" class="flex flex-col items-center justify-center py-1 px-2.5 transition \${idx === 0 ? 'bottom-nav-active' : ''}">
      <i class="fa-solid \${t.icon} text-base mb-0.5"></i>
      <span>\${t.label}</span>
    </button>
  \`).join('');

  switchTab('dashboard');
}

function switchTab(tabId) {
  appState.currentTab = tabId;
  
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  
  // Show active tab
  const target = document.getElementById('tab' + capitalize(tabId));
  if (target) target.classList.remove('hidden');

  // Update nav buttons active styles
  document.querySelectorAll('#desktopNavTabs button').forEach(b => b.classList.remove('nav-tab-active'));
  const activeDesktopBtn = document.getElementById('desktopTabBtn_' + tabId);
  if (activeDesktopBtn) activeDesktopBtn.classList.add('nav-tab-active');

  document.querySelectorAll('#mobileNavItems button').forEach(b => b.classList.remove('bottom-nav-active'));
  const activeMobileBtn = document.getElementById('mobileTabBtn_' + tabId);
  if (activeMobileBtn) activeMobileBtn.classList.add('bottom-nav-active');
}

/**
 * Fetch Data dari Apps Script
 */
function fetchDashboardAndData() {
  showSpinner("Memuat data santri & riwayat...");
  const role = appState.currentUser.role;
  const idSantri = appState.currentUser.idSantri;

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((data) => {
        hideSpinner();
        if (data.success) {
          appState.dashboardData = data;
          appState.santriList = data.santriList || [];
          populateSantriSelects(appState.santriList);
          renderDashboard(data);
          fetchAllHistory();
        }
      })
      .withFailureHandler((err) => {
        hideSpinner();
        showToast("Gagal memuat data: " + err.message, "error");
      })
      .getDashboardData(role, idSantri);
  } else {
    // Mock data for preview mode
    setTimeout(() => {
      hideSpinner();
      const mockData = {
        success: true,
        totalSantri: 5,
        setoranHariIni: 4,
        ziyadahCount: 18,
        murojaahCount: 12,
        santriList: [
          { idSantri: 'STR001', namaSantri: 'Muhammad Fatih', kelas: 'Tahfidz A (Ikhwan)', targetHafalan: 'Juz 30 (37 Surah)' },
          { idSantri: 'STR002', namaSantri: 'Maryam Al-Khansa', kelas: 'Tahfidz B (Akhwat)', targetHafalan: 'Juz 30 & 29 (60 Surah)' },
          { idSantri: 'STR003', namaSantri: 'Ahmad Zaidan', kelas: 'Tahfidz A (Ikhwan)', targetHafalan: 'Juz 30 (37 Surah)' }
        ]
      };
      appState.dashboardData = mockData;
      appState.santriList = mockData.santriList;
      populateSantriSelects(mockData.santriList);
      renderDashboard(mockData);
      fetchAllHistory();
    }, 400);
  }
}

function renderDashboard(data) {
  const container = document.getElementById('roleDashboardContent');
  const role = appState.currentUser.role;

  if (role === 'Ustadz') {
    container.innerHTML = \`
      <!-- Statistik Cards Ustadz -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
            <i class="fa-solid fa-users"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Total Santri</p>
            <h4 class="text-xl font-bold text-slate-800">\${data.totalSantri || 0}</h4>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg">
            <i class="fa-solid fa-calendar-check"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Setoran Hari Ini</p>
            <h4 class="text-xl font-bold text-slate-800">\${data.setoranHariIni || 0}</h4>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
            <i class="fa-solid fa-book-open"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Total Ziyadah</p>
            <h4 class="text-xl font-bold text-slate-800">\${data.ziyadahCount || 0}</h4>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg">
            <i class="fa-solid fa-arrows-rotate"></i>
          </div>
          <div>
            <p class="text-xs text-slate-500 font-medium">Total Muroja'ah</p>
            <h4 class="text-xl font-bold text-slate-800">\${data.murojaahCount || 0}</h4>
          </div>
        </div>
      </div>

      <!-- Quick Action Shortcut -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gradient-to-br from-emerald-800 to-teal-800 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <h4 class="font-bold text-base">Input Ziyadah Santri</h4>
            <p class="text-xs text-emerald-200 mt-0.5">Catat setoran hafalan surah & ayat baru</p>
            <button onclick="switchTab('ziyadah')" class="mt-3 px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow hover:bg-emerald-50 transition">
              + Form Ziyadah
            </button>
          </div>
          <i class="fa-solid fa-book-quran text-5xl text-emerald-500/40"></i>
        </div>

        <div class="bg-gradient-to-br from-teal-800 to-cyan-900 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <h4 class="font-bold text-base">Input Muroja'ah Santri</h4>
            <p class="text-xs text-teal-200 mt-0.5">Evaluasi kelancaran surah atau juz yang telah dihafal</p>
            <button onclick="switchTab('murojaah')" class="mt-3 px-4 py-2 bg-white text-teal-900 rounded-xl text-xs font-bold shadow hover:bg-teal-50 transition">
              + Form Muroja'ah
            </button>
          </div>
          <i class="fa-solid fa-arrows-rotate text-5xl text-teal-500/40"></i>
        </div>
      </div>
    \`;
    renderSantriManagementGrid(data.santriList || []);
  } else {
    // Wali Santri Portal View
    const targetSantri = (data.santriList || []).find(s => s.idSantri === appState.currentUser.idSantri) || {
      namaSantri: 'Santri Binaan',
      kelas: 'Tahfidz',
      targetHafalan: 'Juz 30 (37 Surah)'
    };

    container.innerHTML = \`
      <!-- Wali Portal Header & Progress -->
      <div class="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 border border-white/20 text-emerald-200">
              Profil Santri
            </span>
            <h3 class="text-xl md:text-2xl font-extrabold mt-2">\${targetSantri.namaSantri}</h3>
            <p class="text-xs text-emerald-200 mt-0.5">Kelas: \${targetSantri.kelas} • ID: \${appState.currentUser.idSantri}</p>
          </div>
          <div class="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center">
            <p class="text-[10px] text-emerald-200 uppercase font-semibold">Target Kelulusan</p>
            <p class="text-sm font-bold text-amber-300 mt-0.5">\${targetSantri.targetHafalan}</p>
          </div>
        </div>

        <!-- Progress Indicator -->
        <div class="mt-5 pt-4 border-t border-emerald-700/60">
          <div class="flex justify-between text-xs font-semibold mb-1.5">
            <span>Progres Hafalan Al-Qur'an</span>
            <span class="text-emerald-300">75% Menuju Target</span>
          </div>
          <div class="w-full h-3 bg-emerald-950/60 rounded-full overflow-hidden p-0.5 border border-emerald-600/40">
            <div class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full progress-glow" style="width: 75%"></div>
          </div>
        </div>
      </div>

      <!-- Quick Metrics for Wali -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p class="text-xs text-slate-500 font-medium">Total Setoran Ziyadah</p>
          <h4 class="text-2xl font-bold text-emerald-700 mt-1">\${data.ziyadahCount || 0} Kali</h4>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p class="text-xs text-slate-500 font-medium">Total Muroja'ah</p>
          <h4 class="text-2xl font-bold text-teal-700 mt-1">\${data.murojaahCount || 0} Kali</h4>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center col-span-2 md:col-span-1">
          <p class="text-xs text-slate-500 font-medium">Status Kualitas</p>
          <h4 class="text-base font-bold text-emerald-600 mt-1">🟢 Sangat Baik</h4>
        </div>
      </div>
    \`;
  }
}

/**
 * Handle Simpan Ziyadah
 */
function handleSaveZiyadah(event) {
  event.preventDefault();
  const payload = {
    idSantri: document.getElementById('ziyadahSantri').value,
    surah: document.getElementById('ziyadahSurah').value,
    ayatAwal: document.getElementById('ziyadahAyatAwal').value,
    ayatAkhir: document.getElementById('ziyadahAyatAkhir').value,
    nilai: document.getElementById('ziyadahNilai').value,
    catatan: document.getElementById('ziyadahCatatan').value,
    inputBy: appState.currentUser.nama
  };

  showSpinner("Menyimpan setoran Ziyadah ke Google Sheets...");
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((res) => {
        hideSpinner();
        if (res.success) {
          showToast(res.message, "success");
          document.getElementById('formZiyadah').reset();
          fetchDashboardAndData();
          switchTab('riwayat');
        } else {
          showToast("Gagal: " + res.message, "error");
        }
      })
      .withFailureHandler((err) => {
        hideSpinner();
        showToast("Error: " + err.message, "error");
      })
      .saveZiyadah(payload);
  } else {
    setTimeout(() => {
      hideSpinner();
      showToast("Setoran Ziyadah berhasil disimpan (Demo Mode)!", "success");
      document.getElementById('formZiyadah').reset();
      switchTab('riwayat');
    }, 500);
  }
}

/**
 * Handle Simpan Murojaah
 */
function handleSaveMurojaah(event) {
  event.preventDefault();
  const payload = {
    idSantri: document.getElementById('murojaahSantri').value,
    surahAtauJuz: document.getElementById('murojaahSurahAtauJuz').value,
    nilai: document.getElementById('murojaahNilai').value,
    catatan: document.getElementById('murojaahCatatan').value,
    inputBy: appState.currentUser.nama
  };

  showSpinner("Menyimpan setoran Muroja'ah ke Google Sheets...");
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((res) => {
        hideSpinner();
        if (res.success) {
          showToast(res.message, "success");
          document.getElementById('formMurojaah').reset();
          fetchDashboardAndData();
          switchTab('riwayat');
        } else {
          showToast("Gagal: " + res.message, "error");
        }
      })
      .withFailureHandler((err) => {
        hideSpinner();
        showToast("Error: " + err.message, "error");
      })
      .saveMurojaah(payload);
  } else {
    setTimeout(() => {
      hideSpinner();
      showToast("Setoran Muroja'ah berhasil disimpan (Demo Mode)!", "success");
      document.getElementById('formMurojaah').reset();
      switchTab('riwayat');
    }, 500);
  }
}

/**
 * Fetch All History Table Records
 */
function fetchAllHistory() {
  const role = appState.currentUser.role;
  const idSantri = appState.currentUser.idSantri;

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((ziyadah) => {
        appState.ziyadahList = ziyadah || [];
        google.script.run
          .withSuccessHandler((murojaah) => {
            appState.murojaahList = murojaah || [];
            renderHistoryTable();
          })
          .getMurojaahData(role, idSantri);
      })
      .getZiyadahData(role, idSantri);
  } else {
    // Sample preview records
    appState.ziyadahList = [
      { id: 'ZYD-01', timestamp: '2026-08-28 08:30', idSantri: 'STR001', namaSantri: 'Muhammad Fatih', surah: "An-Naba'", ayatAwal: 1, ayatAkhir: 20, nilai: 'Sangat Lancar', catatan: 'Makhraj ra & ain sangat bersih.', inputBy: 'Ustadz Abdullah' },
      { id: 'ZYD-02', timestamp: '2026-08-27 16:00', idSantri: 'STR002', namaSantri: 'Maryam Al-Khansa', surah: "Al-Mulk", ayatAwal: 1, ayatAkhir: 15, nilai: 'Sangat Lancar', catatan: 'Tajwid istimewa.', inputBy: 'Ustadzah Fatimah' }
    ];
    appState.murojaahList = [
      { id: 'MRJ-01', timestamp: '2026-08-28 09:00', idSantri: 'STR001', namaSantri: 'Muhammad Fatih', surahAtauJuz: 'Juz 30 (Ad-Duha - An-Nas)', nilai: 'Sangat Lancar', catatan: 'Lancar tanpa kesalahan.', inputBy: 'Ustadz Abdullah' }
    ];
    renderHistoryTable();
  }
}

function renderHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  const role = appState.currentUser ? appState.currentUser.role : 'Ustadz';
  
  // Sembunyikan kolom aksi jika Wali Santri
  const thAction = document.getElementById('thAction');
  if (thAction) {
    if (role === 'Wali') thAction.classList.add('hidden');
    else thAction.classList.remove('hidden');
  }

  // Gabungkan Ziyadah dan Murojaah
  let combined = [];
  appState.ziyadahList.forEach(z => combined.push({ ...z, type: 'Ziyadah' }));
  appState.murojaahList.forEach(m => combined.push({ ...m, type: 'Murojaah' }));

  // Urutkan timestamp terbaru
  combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (combined.length === 0) {
    tbody.innerHTML = \`
      <tr>
        <td colspan="7" class="py-8 text-center text-slate-400">
          <i class="fa-solid fa-inbox text-3xl mb-2 block"></i>
          Belum ada rekaman setoran hafalan.
        </td>
      </tr>
    \`;
    return;
  }

  tbody.innerHTML = combined.map(item => {
    let nilaiBadge = '';
    if (item.nilai === 'Sangat Lancar') {
      nilaiBadge = '<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-300">Sangat Lancar</span>';
    } else if (item.nilai === 'Lancar') {
      nilaiBadge = '<span class="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[10px] border border-amber-300">Lancar</span>';
    } else {
      nilaiBadge = '<span class="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold text-[10px] border border-rose-300">Perlu Ulang</span>';
    }

    const typeBadge = item.type === 'Ziyadah'
      ? '<span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Ziyadah</span>'
      : '<span class="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold border border-teal-200">Muroja\'ah</span>';

    const materi = item.type === 'Ziyadah'
      ? \`\${item.surah} (Ayat \${item.ayatAwal} - \${item.ayatAkhir})\`
      : item.surahAtauJuz;

    return \`
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-3 text-slate-500 whitespace-nowrap">\${item.timestamp}</td>
        <td class="py-3 px-3 font-semibold text-slate-800">\${item.namaSantri || item.idSantri}</td>
        <td class="py-3 px-3">\${typeBadge}</td>
        <td class="py-3 px-3 font-medium text-slate-700">\${materi}</td>
        <td class="py-3 px-3">\${nilaiBadge}</td>
        <td class="py-3 px-3 text-slate-600 max-w-xs truncate" title="\${item.catatan}">\${item.catatan || '-'}</td>
        \${role === 'Ustadz' ? \`
          <td class="py-3 px-3 text-center whitespace-nowrap">
            <button onclick="handleDeleteRecord('\${item.type}', '\${item.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Hapus Data">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        \` : ''}
      </tr>
    \`;
  }).join('');
}

function filterHistoryTable() {
  const query = document.getElementById('searchHistory').value.toLowerCase();
  const typeFilter = document.getElementById('filterType').value;
  const rows = document.querySelectorAll('#historyTableBody tr');

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    const matchesQuery = text.includes(query);
    let matchesType = true;
    if (typeFilter !== 'ALL') {
      matchesType = text.includes(typeFilter.toLowerCase());
    }
    row.style.display = (matchesQuery && matchesType) ? '' : 'none';
  });
}

function handleDeleteRecord(type, id) {
  if (!confirm("Apakah Anda yakin ingin menghapus data setoran ini dari Google Sheets?")) return;
  
  showSpinner("Menghapus data...");
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((res) => {
        hideSpinner();
        if (res.success) {
          showToast(res.message, "success");
          fetchAllHistory();
        } else {
          showToast("Gagal: " + res.message, "error");
        }
      })
      .deleteRecord(type, id);
  } else {
    setTimeout(() => {
      hideSpinner();
      showToast("Data berhasil dihapus (Demo Mode)!", "success");
      appState.ziyadahList = appState.ziyadahList.filter(x => x.id !== id);
      appState.murojaahList = appState.murojaahList.filter(x => x.id !== id);
      renderHistoryTable();
    }, 400);
  }
}

/**
 * Mushaf Al-Qur'an Logic & API Integration
 */
function populateSurahDropdowns() {
  const ziyadahSurah = document.getElementById('ziyadahSurah');
  if (!ziyadahSurah) return;
  
  ziyadahSurah.innerHTML = '<option value="">-- Pilih Surah --</option>' + SURAH_METADATA.map(s => \`
    <option value="\${s.name}">\${s.number}. \${s.name} (\${s.arabic}) - \${s.ayahs} Ayat</option>
  \`).join('');
}

function handleSurahChange(surahName, type) {
  const s = SURAH_METADATA.find(x => x.name === surahName);
  if (!s) return;
  if (type === 'ziyadah') {
    const ayatAwal = document.getElementById('ziyadahAyatAwal');
    const ayatAkhir = document.getElementById('ziyadahAyatAkhir');
    ayatAwal.max = s.ayahs;
    ayatAkhir.max = s.ayahs;
    ayatAwal.value = 1;
    ayatAkhir.value = Math.min(10, s.ayahs);
  }
}

function renderSurahGrid() {
  const container = document.getElementById('surahGridContainer');
  if (!container) return;

  container.innerHTML = SURAH_METADATA.map(s => \`
    <button onclick="loadSurahDetail(\${s.number})" class="p-2.5 text-left bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 transition group flex flex-col justify-between">
      <div class="flex items-center justify-between w-full">
        <span class="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">\${s.number}</span>
        <span class="font-arabic text-sm text-slate-700 font-bold group-hover:text-emerald-800">\${s.arabic}</span>
      </div>
      <div class="mt-1">
        <p class="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">\${s.name}</p>
        <p class="text-[10px] text-slate-400 truncate">\${s.ayahs} Ayat</p>
      </div>
    </button>
  \`).join('');
}

function filterSurahList() {
  const q = document.getElementById('searchSurahInput').value.toLowerCase();
  const buttons = document.querySelectorAll('#surahGridContainer button');
  buttons.forEach(btn => {
    btn.style.display = btn.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
  });
}

/**
 * Muat Isi Ayat Surah (Real API Fetching dengan Fallback)
 */
async function loadSurahDetail(surahNumber) {
  appState.currentSurahNumber = surahNumber;
  const meta = SURAH_METADATA.find(x => x.number === surahNumber) || { number: surahNumber, name: "Surah " + surahNumber, arabic: "", translation: "", ayahs: 7, type: "Makkiyyah" };
  
  document.getElementById('surahBadgeNumber').innerText = meta.number;
  document.getElementById('surahNameLatin').innerText = meta.name;
  document.getElementById('surahNameArabic').innerText = meta.arabic;
  document.getElementById('surahTypeBadge').innerText = meta.type;
  document.getElementById('surahTranslation').innerText = meta.translation + " • " + meta.ayahs + " Ayat";

  const listContainer = document.getElementById('ayahListContainer');
  listContainer.innerHTML = \`
    <div class="p-8 text-center text-slate-500">
      <div class="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-xs">Memuat ayat Al-Qur'an...</p>
    </div>
  \`;

  try {
    // Fetch dari public Quran API equran.id v2
    const res = await fetch(\`https://equran.id/api/v2/surat/\${surahNumber}\`);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data && data.data.ayat) {
        renderAyahs(data.data.ayat);
        return;
      }
    }
  } catch (e) {
    console.warn("Quran API online fallback active:", e);
  }

  // Fallback lokal jika offline
  renderAyahsFallback(meta);
}

function renderAyahs(ayatList) {
  const listContainer = document.getElementById('ayahListContainer');
  listContainer.innerHTML = ayatList.map(a => \`
    <div class="ayah-card bg-white p-4 md:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
          \${a.nomorAyat}
        </span>
        <button onclick="playAyahAudio('\${a.audio ? a.audio['05'] || Object.values(a.audio)[0] : ''}')" class="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
          <i class="fa-solid fa-volume-high"></i>
          <span>Audio</span>
        </button>
      </div>

      <!-- Arabic Text -->
      <div class="text-right py-2">
        <p class="font-arabic text-2xl md:text-3xl text-slate-900 leading-loose">\${a.teksArab}</p>
      </div>

      <!-- Latin & Translation -->
      <div class="pt-2 border-t border-slate-100 space-y-1">
        <p class="text-xs font-medium text-emerald-800 italic">\${a.teksLatin}</p>
        <p class="text-xs text-slate-600">\${a.teksIndonesia}</p>
      </div>
    </div>
  \`).join('');
}

function renderAyahsFallback(meta) {
  const listContainer = document.getElementById('ayahListContainer');
  listContainer.innerHTML = \`
    <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-800 mb-3 flex items-center gap-2">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>Mode Offline / Preview Aktif. Menampilkan sampel ayat \${meta.name}.</span>
    </div>
    <div class="ayah-card bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
      <div class="flex items-center justify-between border-b pb-2">
        <span class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
        <span class="text-xs text-emerald-700 font-semibold">Ayat 1</span>
      </div>
      <div class="text-right py-2">
        <p class="font-arabic text-2xl text-slate-900">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
      </div>
      <div class="pt-2 border-t space-y-1">
        <p class="text-xs font-medium text-emerald-800 italic">Bismillaahir-rahmaanir-rahiim</p>
        <p class="text-xs text-slate-600">Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.</p>
      </div>
    </div>
  \`;
}

let currentAudio = null;
function playAyahAudio(url) {
  if (!url) {
    showToast("Audio murattal tidak tersedia", "info");
    return;
  }
  if (currentAudio) {
    currentAudio.pause();
  }
  currentAudio = new Audio(url);
  currentAudio.play();
  showToast("Memutar audio murattal...", "info");
}

/**
 * Santri Management Helpers
 */
function populateSantriSelects(list) {
  const zSelect = document.getElementById('ziyadahSantri');
  const mSelect = document.getElementById('murojaahSantri');
  
  const options = '<option value="">-- Pilih Nama Santri --</option>' + list.map(s => \`
    <option value="\${s.idSantri}">\${s.namaSantri} (\${s.kelas})</option>
  \`).join('');

  if (zSelect) zSelect.innerHTML = options;
  if (mSelect) mSelect.innerHTML = options;
}

function renderSantriManagementGrid(list) {
  const grid = document.getElementById('santriCardGrid');
  if (!grid) return;

  grid.innerHTML = list.map(s => \`
    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-400 transition space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">\${s.idSantri}</span>
        <span class="text-xs text-slate-400">\${s.kelas}</span>
      </div>
      <h4 class="font-bold text-slate-800 text-sm">\${s.namaSantri}</h4>
      <div class="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
        <i class="fa-solid fa-bullseye text-emerald-600"></i>
        <span>Target: <b>\${s.targetHafalan}</b></span>
      </div>
    </div>
  \`).join('');
}

function openAddSantriModal() {
  document.getElementById('modalAddSantri').classList.remove('hidden');
}

function closeAddSantriModal() {
  document.getElementById('modalAddSantri').classList.add('hidden');
}

function handleSaveNewSantri(event) {
  event.preventDefault();
  const payload = {
    idSantri: document.getElementById('newSantriId').value,
    namaSantri: document.getElementById('newSantriNama').value,
    kelas: document.getElementById('newSantriKelas').value,
    targetHafalan: document.getElementById('newSantriTarget').value
  };

  showSpinner("Mendaftarkan santri ke Google Sheets...");
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler((res) => {
        hideSpinner();
        if (res.success) {
          showToast(res.message, "success");
          closeAddSantriModal();
          document.getElementById('formAddSantri').reset();
          fetchDashboardAndData();
        } else {
          showToast("Gagal: " + res.message, "error");
        }
      })
      .addSantri(payload);
  } else {
    setTimeout(() => {
      hideSpinner();
      showToast("Santri berhasil ditambahkan (Demo Mode)!", "success");
      closeAddSantriModal();
      document.getElementById('formAddSantri').reset();
    }, 400);
  }
}

/**
 * Toast & Spinner UI Utilities
 */
function showSpinner(text) {
  const sp = document.getElementById('globalSpinner');
  const txt = document.getElementById('spinnerText');
  if (txt && text) txt.innerText = text;
  if (sp) sp.classList.remove('hidden');
}

function hideSpinner() {
  const sp = document.getElementById('globalSpinner');
  if (sp) sp.classList.add('hidden');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toastNotification');
  const card = document.getElementById('toastCard');
  const msg = document.getElementById('toastMessage');
  const icon = document.getElementById('toastIcon');

  msg.innerText = message;
  
  if (type === 'success') {
    card.className = "bg-emerald-800 text-white p-3.5 rounded-xl shadow-xl border border-emerald-600 flex items-center gap-3 text-xs";
    icon.className = "fa-solid fa-circle-check text-emerald-200 text-base";
  } else if (type === 'error') {
    card.className = "bg-rose-800 text-white p-3.5 rounded-xl shadow-xl border border-rose-600 flex items-center gap-3 text-xs";
    icon.className = "fa-solid fa-circle-exclamation text-rose-200 text-base";
  } else {
    card.className = "bg-slate-800 text-white p-3.5 rounded-xl shadow-xl border border-slate-600 flex items-center gap-3 text-xs";
    icon.className = "fa-solid fa-circle-info text-sky-300 text-base";
  }

  toast.classList.remove('opacity-0', '-translate-y-20', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-20', 'pointer-events-none');
  }, 3500);
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>
`;

export const GAS_DEPLOYMENT_GUIDE_MD = `# Panduan Lengkap Deploy Web App Tahfidz Al-Qur'an di Google Apps Script

Aplikasi ini dibangun khusus dengan arsitektur **Google Apps Script (GAS)** yang terintegrasi langsung dengan **Google Sheets** sebagai database gratis dan real-time.

---

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri judul spreadsheet: **Database Tahfidz Al-Qur'an**.
3. Buka menu **Ekstensi (Extensions)** > **Apps Script**.

---

### Langkah 2: Buat 4 File Kode di Editor Apps Script
Di editor Google Apps Script, buat 4 file terpisah sesuai nama berikut:

#### 1. File \`Code.gs\` (Script File)
* Hapus kode default di \`Code.gs\`.
* Salin seluruh isi dari tab kode **\`Code.gs\`** ke dalam file ini.

#### 2. File \`Index.html\` (HTML File)
* Klik ikon **+** di samping Files > pilih **HTML**.
* Beri nama: \`Index\` (akan menjadi \`Index.html\`).
* Tempelkan kode dari tab **\`Index.html\`**.

#### 3. File \`CSS.html\` (HTML File)
* Klik ikon **+** > pilih **HTML**.
* Beri nama: \`CSS\` (akan menjadi \`CSS.html\`).
* Tempelkan kode dari tab **\`CSS.html\`**.

#### 4. File \`JavaScript.html\` (HTML File)
* Klik ikon **+** > pilih **HTML**.
* Beri nama: \`JavaScript\` (akan menjadi \`JavaScript.html\`).
* Tempelkan kode dari tab **\`JavaScript.html\`**.

---

### Langkah 3: Inisialisasi Database Sheet Otomatis
1. Di editor Apps Script, pada menu dropdown fungsi di atas, pilih fungsi **\`initDatabase\`**.
2. Klik tombol **Run (Jalankan)**.
3. Klik **Review Permissions (Tinjau Izin)** > Pilih Akun Google Anda > Klik **Advanced** > Klik **Go to Untitled project (unsafe)** > Klik **Allow (Izinkan)**.
4. Buka kembali Google Sheets Anda, dan Anda akan melihat 4 Sheet telah otomatis dibuat:
   * **Users** (ID, Username, Password, Role, Nama, ID_Santri)
   * **Santri** (ID_Santri, Nama_Santri, Kelas, Target_Hafalan)
   * **Ziyadah** (ID, Timestamp, ID_Santri, Surah, Ayat_Awal, Ayat_Akhir, Nilai, Catatan, Input_By)
   * **Murojaah** (ID, Timestamp, ID_Santri, Surah_Atau_Juz, Nilai, Catatan, Input_By)

---

### Langkah 4: Deploy sebagai Web App (Siapa Saja / Anyone)
1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy (Terapkan)** > **New Deployment (Penerapan Baru)**.
2. Klik ikon gerigi (Select type) > Pilih **Web App**.
3. Isi konfigurasi berikut:
   * **Description**: \`Tahfidz Web App v1.0\`
   * **Execute as (Jalankan sebagai)**: **Me (emailanda@gmail.com)**
   * **Who has access (Siapa yang memiliki akses)**: **Anyone (Siapa saja)** *(PENTING agar Wali Santri dan Ustadz dapat membuka link tanpa perlu login Google akun pribadi)*.
4. Klik **Deploy**.
5. Salin **Web App URL** yang muncul (berakhiran \`/exec\`).
6. Buka link tersebut di browser HP atau Laptop Anda. Aplikasi sudah 100% aktif dan siap digunakan!
`;

export const GAS_CODE_FILES = [
  {
    name: 'Code.gs',
    language: 'javascript',
    description: 'Backend Google Apps Script & Google Sheets Database Handler',
    content: GAS_CODE_GS
  },
  {
    name: 'Index.html',
    language: 'html',
    description: 'Struktur UI Utama Single Page Application (SPA)',
    content: GAS_INDEX_HTML
  },
  {
    name: 'CSS.html',
    language: 'html',
    description: 'Custom Typography Arab, Responsive Utilities & Themes',
    content: GAS_CSS_HTML
  },
  {
    name: 'JavaScript.html',
    language: 'javascript',
    description: 'Logika Frontend, Quran Public API & Apps Script Bridge',
    content: GAS_JAVASCRIPT_HTML
  }
];
