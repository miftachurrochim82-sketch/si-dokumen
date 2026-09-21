// ============================================================
// SIDOKUMEN - 01_ConfigAndBridge.gs (v1.0 — 11 sheet + 72 handler + Drive + UIUX v1.10)
// ============================================================
// Bridge ke CoreLib v2.3.0 pin 15 + kontrak dispatcher v2 — pola starter-kit v2.10.1 (si-arsip v1.9)
// Rujukan docs: 04_DATABASE.md — 11 sheet (3 master + 8 tabel) + Drive folder SIDOKUMEN

// ==================== §1 KONSTANTA GLOBAL ====================
var APP_CODE  = 'SIDOKUMEN';
var APP_TITLE = 'SIDOKUMEN — Sistem Dokumen Kinerja v1.0';

var DEFAULT_MASTER_SPREADSHEET_ID = '1HvMXmvdtgAUZ9A0-SQHZp9QjnYv1A7Ku_oJIjbT8gT0';
var DEFAULT_PLATFORM_URL = 'https://script.google.com/macros/s/AKfycbwh_OUVqmxLcuF81FHmPZtT33Wrm8Ce9Da1SQ3hfkSr7gM5P8ofyAlHSgW40mq3eo-PoQ/exec';
var DEFAULT_SPREADSHEET_ID = '';

var SESSION_PREFIX      = 'APP_SESSION_' + APP_CODE + '_';
var SESSION_TTL_SECONDS = 6 * 60 * 60;
var DATA_CACHE_TTL      = 300;
var ROLE_LEVELS = CoreLib.MASTER_ROLE_LEVELS;

// ==================== §2 PROPERTIES & SPREADSHEET ====================
function appProps_() { return PropertiesService.getScriptProperties(); }

var SPREADSHEET_ID = CoreLib.getEnvProperty('SPREADSHEET_ID', appProps_())
  || DEFAULT_SPREADSHEET_ID
  || (function () { try { return SpreadsheetApp.getActiveSpreadsheet().getId(); } catch (e) { return ''; } })();

var MASTER_SPREADSHEET_ID = CoreLib.getEnvProperty('MASTER_SPREADSHEET_ID', appProps_())
  || DEFAULT_MASTER_SPREADSHEET_ID;

var PLATFORM_API_URL = CoreLib.getEnvProperty('PLATFORM_API_URL', appProps_())
  || DEFAULT_PLATFORM_URL;

// ==================== §3 SKEMA SHEET — SIDOKUMEN ====================
var LOCAL_SHEETS = {
  M_JENIS_DOKUMEN: 'M_JENIS_DOKUMEN',
  M_KATEGORI_DOKUMEN: 'M_KATEGORI_DOKUMEN',
  M_PERIODE: 'M_PERIODE',
  T_DOKUMEN: 'T_DOKUMEN',
  T_VERIFIKASI: 'T_VERIFIKASI',
  T_LAMPIRAN: 'T_LAMPIRAN',
  T_LOGBOOK: 'T_LOGBOOK',
  T_APPROVAL: 'T_APPROVAL',
  T_JADWAL: 'T_JADWAL',
  T_REKAP: 'T_REKAP',
  T_TINDAK_LANJUT: 'T_TINDAK_LANJUT',
  T_RTL: 'T_TINDAK_LANJUT'
};

var LOCAL_ID_PREFIX_ = {
  'M_JENIS_DOKUMEN': 'jns',
  'M_KATEGORI_DOKUMEN': 'kat',
  'M_PERIODE': 'prd',
  'T_DOKUMEN': 'dok',
  'T_VERIFIKASI': 'ver',
  'T_LAMPIRAN': 'lmp',
  'T_LOGBOOK': 'log',
  'T_APPROVAL': 'apr',
  'T_JADWAL': 'jdw',
  'T_REKAP': 'rkp',
  'T_TINDAK_LANJUT': 'rtl',
  'T_RTL': 'rtl'
};

var SIMPEG_SHEET_ALIAS_ = {
  'PEGAWAI': 'PEGAWAI', 'M_PEGAWAI': 'PEGAWAI', 'pegawai': 'PEGAWAI',
  'UNIT_KERJA': 'UNIT_KERJA', 'M_UNIT_KERJA': 'UNIT_KERJA', 'unit_kerja': 'UNIT_KERJA', 'units': 'UNIT_KERJA',
  'JABATAN': 'JABATAN', 'M_JABATAN': 'JABATAN', 'jabatan': 'JABATAN'
};

function canonicalSimpegSheet_(sheetName) {
  var s = String(sheetName || '').trim();
  if (SIMPEG_SHEET_ALIAS_[s]) return SIMPEG_SHEET_ALIAS_[s];
  var u = s.toUpperCase();
  if (SIMPEG_SHEET_ALIAS_[u]) return SIMPEG_SHEET_ALIAS_[u];
  return null;
}
function isSimpegSheet_(sheetName) { return canonicalSimpegSheet_(sheetName) !== null; }
// FIX v1.5: M_JENIS_DOKUMEN, M_KATEGORI_DOKUMEN, M_PERIODE adalah LOKAL, bukan referensi SIMPEG.
// isRefSheet_ hanya true untuk sheet SIMPEG (PEGAWAI, UNIT_KERJA, JABATAN) — bukan semua M_.
// Jika semua M_ dianggap ref, maka CoreLib akan baca dari masterSsId dan blokir save → JENIS.1 FAIL + SCHEMA missing.
function isRefSheet_(name) {
  var n = String(name || '').trim();
  if (!n) return false;
  // Local sheets jangan dianggap ref — walau namanya M_
  if (LOCAL_SHEETS[n]) return false;
  var upper = n.toUpperCase();
  if (LOCAL_SHEETS[upper]) return false;
  // Hanya SIMPEG yang ref
  if (isSimpegSheet_(n)) return true;
  return false;
}

// ==================== §3b HEADER MAP — SIDOKUMEN ====================
var ALL_SHEET_HEADERS = {
  M_JENIS_DOKUMEN: [
    'id', 'kode', 'nama', 'kategori', 'periode', 'urutan', 'status_aktif', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_KATEGORI_DOKUMEN: [
    'id', 'kode', 'nama', 'deskripsi', 'urutan', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  M_PERIODE: [
    'id', 'tahun', 'bulan', 'label', 'status_aktif',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_DOKUMEN: [
    'id', 'pegawai_id', 'jenis_dokumen_id', 'tahun', 'bulan', 'periode_label', 'judul', 'deskripsi',
    'file_drive_id', 'file_name', 'file_size', 'file_mime', 'status', 'uploaded_by', 'catatan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_VERIFIKASI: [
    'id', 'dokumen_id', 'verifikator_id', 'status_lama', 'status_baru', 'catatan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_LAMPIRAN: [
    'id', 'dokumen_id', 'file_drive_id', 'file_name', 'file_size', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_LOGBOOK: [
    'id', 'dokumen_id', 'pegawai_id', 'aksi', 'catatan_sebelum', 'catatan_sesudah',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_APPROVAL: [
    'id', 'dokumen_id', 'urutan', 'role_approver', 'approver_id', 'status', 'catatan', 'tanggal_approve',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_JADWAL: [
    'id', 'dokumen_id', 'judul', 'tanggal_mulai', 'tanggal_selesai', 'lokasi', 'pegawai_id', 'status', 'keterangan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_REKAP: [
    'id', 'periode', 'pegawai_id', 'unit_id', 'jenis_dokumen_id', 'total_item', 'total_nilai', 'ringkasan_json', 'status_rekap', 'generated_at',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_TINDAK_LANJUT: [
    'id', 'sumber_evaluasi', 'judul_rtl', 'deskripsi', 'assigned_to', 'due_date', 'status_rtl', 'progress_pct', 'dokumen_terkait', 'catatan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  T_RTL: [
    'id', 'sumber_evaluasi', 'judul_rtl', 'deskripsi', 'assigned_to', 'due_date', 'status_rtl', 'progress_pct', 'dokumen_terkait', 'catatan',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  ZZ_TEST_CRUD: ['id', 'laporan_id', 'nama', 'no_hp', 'catatan_baru'],
  PEGAWAI: [
    'pegawai_id', 'nip', 'nik', 'nama', 'gelar_depan', 'gelar_belakang', 'jenis_kelamin', 'tanggal_lahir', 'pangkat_golongan', 'status_kepegawaian',
    'pendidikan_terakhir', 'email', 'no_hp', 'alamat', 'foto_url', 'unit_id', 'jabatan_id', 'atasan_id', 'role', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  UNIT_KERJA: [
    'unit_id', 'kode_unit', 'nama_unit', 'kategori_unit', 'parent_unit_id', 'lokasi', 'telepon_unit', 'kepala_nip', 'kepala_hp', 'kepala_unit_id', 'jenis_unit', 'status_aktif', 'keterangan', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ],
  JABATAN: [
    'jabatan_id', 'kode_jabatan', 'nama_jabatan', 'jenis_jabatan', 'rumpun_jabatan', 'jenjang_jabatan', 'kelas_jabatan', 'unit_id', 'status_jabatan', 'plt_pegawai_id', 'tanggal_mulai_jabatan', 'tanggal_selesai_jabatan', 'target_jp_tahunan', 'status_aktif', 'keterangan', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'
  ]
};

// ==================== §4 NORMALISASI SIMPEG ====================
function normalizeEntityId_(id) {
  var s = CoreLib.normId(id);
  if (!s) return '';
  var m = s.match(/^([A-Z]+)-0*(\d+)$/);
  if (m) { var prefix = m[1]; var num = Number(m[2]); return prefix + '-' + ('0000' + num).slice(-4); }
  return s;
}
var ID_FIELDS_TO_NORMALIZE_ = ['pegawai_id', 'unit_id', 'jabatan_id', 'atasan_id', 'plt_pegawai_id', 'kepala_unit_id', 'jenis_dokumen_id', 'dokumen_id', 'assigned_to', 'dokumen_terkait', 'pengumpul_id'];
function normalizeEntityIdFields_(obj) {
  if (!obj) return obj;
  ID_FIELDS_TO_NORMALIZE_.forEach(function (f) { if (obj[f] !== undefined && obj[f] !== null && obj[f] !== '') obj[f] = normalizeEntityId_(obj[f]); });
  return obj;
}
function normalizePegawai_(obj) {
  if (!obj) return obj;
  if (obj.pegawai_id && !obj.id) obj.id = obj.pegawai_id;
  if (!obj.pegawai_id && obj.id) obj.pegawai_id = obj.id;
  if (obj.nama && !obj.nama_lengkap) obj.nama_lengkap = obj.nama;
  if (obj.nama_lengkap && !obj.nama) obj.nama = obj.nama_lengkap;
  return obj;
}
function normalizeSimpegRecords_(sheetName, records) {
  if (!records || !records.length) return records;
  var canon = canonicalSimpegSheet_(sheetName);
  if (!canon) return records;
  return records.map(function (obj) { var clone = Object.assign({}, obj); normalizeEntityIdFields_(clone); if (canon === 'PEGAWAI') normalizePegawai_(clone); return clone; });
}

// ==================== §5 WRAPPER DOMAIN ====================
function getSheetData_(sheetName, options) {
  options = options || {};
  var ssId = SPREADSHEET_ID;
  if (!ssId) { Logger.log('[WARN] getSheetData_ tanpa SPREADSHEET_ID.'); return []; }
  if (String(sheetName).toUpperCase() === 'T_RTL') sheetName = 'T_TINDAK_LANJUT';
  var canonicalSimpeg = canonicalSimpegSheet_(sheetName);
  var lookupName = canonicalSimpeg || sheetName;
  var coreOptions = canonicalSimpeg ? { masterSsId: MASTER_SPREADSHEET_ID, isRefFunc: isRefSheet_ } : { isRefFunc: isRefSheet_ };
  var records;
  try { records = CoreLib.getSheetDataCached(ssId, lookupName, ALL_SHEET_HEADERS, DATA_CACHE_TTL, coreOptions) || []; } catch (e) { Logger.log('[getSheetData_] ' + sheetName + ': ' + e.message); return []; }
  if (canonicalSimpeg) records = normalizeSimpegRecords_(sheetName, records);
  if (!options.includeDeleted) records = records.filter(function (r) { return !r.deleted_at; });
  return records;
}
function saveRecord_(sheetName, record, actor) {
  if (String(sheetName).toUpperCase() === 'T_RTL') sheetName = 'T_TINDAK_LANJUT';
  if (isSimpegSheet_(sheetName)) throw new Error('Akses Ditolak: Sheet "' + sheetName + '" read-only (SIMPEG).');
  if (!record || typeof record !== 'object') throw new Error('Record tidak valid.');
  if (!SPREADSHEET_ID) throw new Error('Spreadsheet lokal tidak dapat dibuka.');
  var result = CoreLib.apiSave(SPREADSHEET_ID, sheetName, record, actor, ALL_SHEET_HEADERS, isRefSheet_, localPreSaveHook_, 'id');
  if (!result.success) throw new Error(result.error || ('Gagal menyimpan ke ' + sheetName + '.'));
  return result.data;
}
function softDeleteRecord_(sheetName, id, actor) {
  if (String(sheetName).toUpperCase() === 'T_RTL') sheetName = 'T_TINDAK_LANJUT';
  if (isSimpegSheet_(sheetName)) throw new Error('Akses Ditolak: Sheet "' + sheetName + '" read-only (SIMPEG).');
  if (!SPREADSHEET_ID) return false;
  return !!CoreLib.apiDelete(SPREADSHEET_ID, sheetName, id, actor, ALL_SHEET_HEADERS, isRefSheet_, 'id').success;
}
function findRecordById_(sheetName, id) {
  if (String(sheetName).toUpperCase() === 'T_RTL') sheetName = 'T_TINDAK_LANJUT';
  var target = normalizeEntityId_(id);
  if (!target) return null;
  var rows = getSheetData_(sheetName);
  for (var i = 0; i < rows.length; i++) { if (normalizeEntityId_(rows[i].id) === target) return rows[i]; }
  return null;
}

// ==================== §6 PRE-SAVE HOOK P1+P2 ====================
function localPreSaveHook_(canonical, record, actor) {
  var C = String(canonical || '').toUpperCase();
  if (C === 'T_RTL') C = 'T_TINDAK_LANJUT';
  if (!record.id || String(record.id).trim() === '') {
    var pfx = LOCAL_ID_PREFIX_[C] || C.replace(/^M_/, '').replace(/^T_/, '').substring(0, 3).toLowerCase();
    record.id = pfx + '-' + String(Date.now()).slice(-6);
  }
  if (C === 'T_APPROVAL' || C === 'T_DOKUMEN') {
    var actorRole = String((actor && actor.role) || 'viewer').toLowerCase();
    var isVerifikator = ['verifikator', 'admin', 'super'].indexOf(actorRole) !== -1;
    if (!isVerifikator && C === 'T_APPROVAL') {
      var old = findRecordById_(canonical, record.id);
      record.status = old ? (old.status || 'menunggu') : 'menunggu';
    }
  }
  if (C === 'T_DOKUMEN') {
    if (!record.status) record.status = 'baru';
    if (!record.tahun) record.tahun = String(new Date().getFullYear());
    if (!record.periode_label) {
      record.periode_label = record.tahun + (record.bulan ? '-' + String(record.bulan).padStart(2,'0') : '');
    }
  }
  if (C === 'T_TINDAK_LANJUT') {
    if (!record.status_rtl) record.status_rtl = record.status_rtl || record.status || 'baru';
    if (record.progress_pct === undefined || record.progress_pct === '') record.progress_pct = 0;
  }
  return { record: record };
}

// ==================== §7 KONTRAK DISPATCHER v2 — 87 handler SIDOKUMEN FULL PIRAMIDA 35 output ====================
function getAppConfig_() {
  return {
    appCode: APP_CODE,
    spreadsheetId: SPREADSHEET_ID,
    masterSsId: MASTER_SPREADSHEET_ID,
    platformApiUrl: PLATFORM_API_URL,
    sessionPrefix: SESSION_PREFIX,
    ttlSeconds: SESSION_TTL_SECONDS,
    roleLevels: ROLE_LEVELS,
    headersMap: ALL_SHEET_HEADERS,
    pkFields: {},
    isRefSheetFunc: isRefSheet_,
    preSaveHook: localPreSaveHook_,
    actionLevels: {
      // Config 6
      'get_config': 'viewer', 'get_config_list': 'viewer', 'save_config_item': 'admin', 'save_config': 'admin', 'delete_config_item': 'admin', 'delete_config': 'admin',
      // Self 2
      'get_my_profile': 'viewer', 'save_my_profile': 'viewer',
      // Dashboard 2
      'get_dashboard': 'viewer', 'dashboard': 'viewer',
      // SIMPEG 4
      'get_pegawai_list': 'viewer', 'get_unit_list': 'viewer', 'get_jabatan_list': 'viewer', 'get_master_satelit': 'viewer',
      // Master 9
      'get_jenis_list': 'viewer', 'save_jenis': 'verifikator', 'delete_jenis': 'verifikator',
      'get_kategori_list': 'viewer', 'save_kategori': 'verifikator', 'delete_kategori': 'verifikator',
      'get_periode_list': 'viewer', 'save_periode': 'verifikator', 'delete_periode': 'verifikator',
      // T_DOKUMEN 4 + verifikasi
      'get_dokumen_list': 'viewer', 'get_dokumen_detail': 'viewer', 'save_dokumen': 'user', 'delete_dokumen': 'user',
      'verifikasi_dokumen': 'verifikator', 'lap_rekap_pegawai': 'viewer',
      // T_VERIFIKASI 4
      'get_verifikasi_list': 'viewer', 'get_verifikasi_detail': 'viewer', 'save_verifikasi': 'verifikator', 'delete_verifikasi': 'admin',
      // T_LAMPIRAN 3
      'get_lampiran_list': 'viewer', 'save_lampiran': 'user', 'delete_lampiran': 'user',
      // T_APPROVAL 4
      'get_approval_list': 'viewer', 'save_approval': 'user', 'delete_approval': 'user', 'verifikasi_approval': 'verifikator',
      // T_JADWAL 4
      'get_jadwal_list': 'viewer', 'get_jadwal_detail': 'viewer', 'save_jadwal': 'user', 'delete_jadwal': 'user',
      // T_REKAP 4
      'get_rekap_list': 'viewer', 'generate_rekap': 'verifikator', 'lap_rekap_klasifikasi': 'viewer', 'lap_rekap_unit': 'viewer',
      // Laporan L1-L3, L7-L10 (10_LaporanApi) — 6
      'laporan_daftar_dokumen': 'viewer', 'laporan_rekap_periode': 'viewer', 'laporan_rekap_status': 'viewer',
      'laporan_keterlambatan': 'viewer', 'laporan_file_bermasalah': 'viewer', 'lap_kepatuhan_upload': 'viewer',
      // Laporan Khas L12 — 2
      'laporan_khas_data': 'viewer', 'laporan_export_khas': 'user',
      // Analisa A3-A5 (14) — 3
      'analisa_distribusi_unit': 'viewer', 'analisa_top_pengirim': 'viewer', 'analisa_beban_pejabat': 'viewer',
      // Analisa A6-A10 (15) — 5
      'analisa_retensi': 'viewer', 'analisa_korelasi_jenis_unit': 'viewer', 'analisa_tte_ratio': 'viewer',
      'analisa_sla_pejabat': 'viewer', 'analisa_kritis_bulanan': 'viewer',
      // Evaluasi E1-E8 (16) — 8
      'evaluasi_sla_verifikasi': 'viewer', 'evaluasi_sla_upload': 'viewer', 'evaluasi_kelengkapan': 'viewer', 'evaluasi_format': 'viewer',
      'evaluasi_kepatuhan_jenis': 'viewer', 'evaluasi_kadaluarsa': 'viewer', 'evaluasi_fisik': 'viewer', 'evaluasi_alih_media': 'viewer',
      // Evaluasi legacy alias (compat si-arsip) — 3
      'evaluasi_sla_disposisi': 'viewer', 'evaluasi_jra': 'viewer', 'evaluasi_sla': 'viewer',
      // RTL R1-R5 (17) — 12 (6 generic + 6 alias)
      'get_tindak_lanjut_list': 'viewer', 'rtl_get_list': 'viewer', 'get_tindak_lanjut_detail': 'viewer', 'rtl_get_detail': 'viewer',
      'save_tindak_lanjut': 'user', 'rtl_save': 'user', 'delete_tindak_lanjut': 'admin', 'rtl_delete': 'admin',
      'ubah_status_tindak_lanjut': 'user', 'rtl_ubah_status': 'user', 'generate_tindak_lanjut': 'user', 'rtl_generate': 'user',
      // Generic + publik + sistem — 6
      'save': 'admin', 'delete': 'admin', 'ping': 'viewer', 'exchange_platform_ticket': 'viewer', 'logout': 'viewer', 'init_database': 'super'
    },
    entityPermissions: {}, localHandlers: {}
  };
}

// ==================== §8 SHIM ====================
function getSpreadsheetId_() { return SPREADSHEET_ID; }
