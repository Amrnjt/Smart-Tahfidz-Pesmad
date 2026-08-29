/**
 * ==============================================================================
 * APLIKASI MANAJEMEN KELAS TAHFIDZ AL-QUR'AN BERBASIS GOOGLE APPS SCRIPT WEB APP
 * Backend Script & Google Sheets Database Engine
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
    .setTitle("Aplikasi Manajemen Kelas Tahfidz Al-Qur'an")
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
 * Simpan Setoran Ziyadah Baru
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
 * Simpan Setoran Muroja'ah Baru
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
 * Update Record
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
 * Hapus Record
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
        idSantri,
        "123",
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

