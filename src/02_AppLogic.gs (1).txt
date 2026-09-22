// ============================================================
// SIDOKUMEN - 02_AppLogic.gs (v1.0.3 — dispatcher + generic helpers + init DB)
// ============================================================
// Implementasi domain dipisah per file (hindari duplikat lintas file):
//   10_LaporanApi.gs        — L1, L2, L7, L8, L9, L10
//   13_LaporanRekapApi.gs   — L4, L5, L6, L11, L12
//   14_AnalisaApi.gs        — A3, A4, A5
//   15_AnalisaLanjutApi.gs  — A6..A10
//   16_EvaluasiApi.gs       — E1..E8 (+ alias legacy)
//   17_RtlApi.gs            — R1..R5 + state machine
//
// File ini HANYA berisi:
//   - Entry points (doGet/doPost/include)
//   - Dispatcher & buildLocalHandlers_
//   - Generic helpers (list/detail/save/delete)
//   - Domain dokumen & verifikasi (T_DOKUMEN, T_VERIFIKASI, T_APPROVAL)
//   - SIMPEG read + config + dashboard
//   - initDatabase / ensureLocalSheets_
//
// Changelog:
//   v1.0.3 — Header version sync; verifikasiDokumen_ fallback actor ID;
//            handleAction err.stack guard; ping version bump; getDashboard_ + RTL stats.
//   v1.0.2 — Cleanup duplikat fungsi (lap*, analisa*, evaluasi*, *TindakLanjut*)
//            yang sudah dipindah ke 10/13/14/15/16/17. getDashboard_ + RTL stats.
//   v1.0.1 — Pre-check base64 size sebelum decode; role-guard pegawai_id.
//   v1.0.0 — Initial.
// ============================================================

// ==================== §1 ENTRY POINTS ====================
function doGet(e) {
  e = e || { parameter: {} };
  var ticket = (e.parameter && e.parameter.ticket) || '';
  var template = HtmlService.createTemplateFromFile('Index');
  template.ticket = ticket;
  template.isSsoEntry = ticket ? 'true' : 'false';
  return template.evaluate().setTitle(APP_TITLE).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).addMetaTag('viewport','width=device-width, initial-scale=1');
}
function doPost(e) {
  var body = {};
  try { if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents); } catch (err) {
    return CoreLib.jsonResponse({ success: false, code: 'BAD_REQUEST', error: 'Format JSON payload tidak valid.' });
  }
  return CoreLib.jsonResponse(handleAction(body));
}
function include(filename) {
  try { return HtmlService.createTemplateFromFile(filename).evaluate().getContent(); }
  catch (err) {
    try { return HtmlService.createTemplateFromFile(filename.toLowerCase()).evaluate().getContent(); }
    catch (e2) { Logger.log('[WARN] Error including ' + filename + ': ' + e2.message); return '<!-- Error loading ' + filename + ': ' + e2.message + ' -->'; }
  }
}

// ==================== §2 DISPATCHER ====================
function handleAction(payload) {
  try {
    var cfg = getAppConfig_();
    cfg.localHandlers = buildLocalHandlers_();
    return CoreLib.dispatchAction(payload, cfg);
  } catch (err) {
    var msg = err && err.message ? err.message : String(err);
    var stack = err && err.stack ? err.stack : '(no stack)';
    Logger.log('[CRITICAL handleAction] ' + msg + '\n' + stack);
    return { success: false, code: 'BAD_REQUEST', error: msg };
  }
}

function buildLocalHandlers_() {
  var h = {};
  h['ping'] = function () { return { success: true, data: { pong: true, app: APP_CODE, time: new Date().toISOString(), version: 'v1.0.3' } }; };
  h['get_my_profile'] = function (d, u) { return { success: true, data: u }; };
  h['save_my_profile'] = function (d, u) { return CoreLib.saveMyProfile(SPREADSHEET_ID, d, u, ALL_SHEET_HEADERS, MASTER_SPREADSHEET_ID); };
  h['get_dashboard'] = function (d, u) { return getDashboard_(u); };
  h['dashboard'] = function (d, u) { return getDashboard_(u); };
  h['get_pegawai_list'] = function () { return getPegawaiList_(); };
  h['get_unit_list'] = function () { return getUnitList_(); };
  h['get_jabatan_list'] = function () { return getJabatanList_(); };
  h['get_master_satelit'] = function () { return getMasterSatelit_(); };
  h['get_config'] = function () { return getConfigList_(); };
  h['get_config_list'] = function () { return getConfigList_(); };
  h['save_config_item'] = function (d, u) { return saveConfigItem_(d, u); };
  h['save_config'] = function (d, u) { return saveConfigItem_(d, u); };
  h['delete_config_item'] = function (d, u) { return deleteConfigItem_(d, u); };
  h['delete_config'] = function (d, u) { return deleteConfigItem_(d, u); };
  h['save'] = function (d, u) { var ent = String((d && d.entity) || '').toUpperCase(); if (ent === 'KONFIGURASI') return saveConfigItem_(d || {}, u); return { success: false, code: 'BAD_REQUEST', error: 'Aksi save untuk entitas "' + ent + '" tidak dikenali.' }; };
  h['delete'] = function (d, u) { var ent = String((d && d.entity) || '').toUpperCase(); if (ent === 'KONFIGURASI') return deleteConfigItem_(d || {}, u); return { success: false, code: 'BAD_REQUEST', error: 'Aksi delete untuk entitas "' + ent + '" tidak dikenali.' }; };

  // Master SIDOKUMEN
  h['get_jenis_list'] = function (d) { return getGenericList_('M_JENIS_DOKUMEN', d || {}); };
  h['save_jenis'] = function (d, u) { return saveGeneric_('M_JENIS_DOKUMEN', d || {}, u); };
  h['delete_jenis'] = function (d, u) { return deleteGeneric_('M_JENIS_DOKUMEN', d || {}, u); };
  h['get_kategori_list'] = function (d) { return getGenericList_('M_KATEGORI_DOKUMEN', d || {}); };
  h['save_kategori'] = function (d, u) { return saveGeneric_('M_KATEGORI_DOKUMEN', d || {}, u); };
  h['delete_kategori'] = function (d, u) { return deleteGeneric_('M_KATEGORI_DOKUMEN', d || {}, u); };
  h['get_periode_list'] = function (d) { return getGenericList_('M_PERIODE', d || {}); };
  h['save_periode'] = function (d, u) { return saveGeneric_('M_PERIODE', d || {}, u); };
  h['delete_periode'] = function (d, u) { return deleteGeneric_('M_PERIODE', d || {}, u); };

  // T_DOKUMEN & verifikasi
  h['get_dokumen_list'] = function (d) { return getDokumenList_(d || {}); };
  h['get_dokumen_detail'] = function (d) { return getGenericDetail_('T_DOKUMEN', d || {}); };
  h['save_dokumen'] = function (d, u) { return saveDokumen_(d || {}, u); };
  h['delete_dokumen'] = function (d, u) { return deleteGeneric_('T_DOKUMEN', d || {}, u); };
  h['verifikasi_dokumen'] = function (d, u) { return verifikasiDokumen_(d || {}, u); };

  // T_VERIFIKASI
  h['get_verifikasi_list'] = function (d) { return getGenericList_('T_VERIFIKASI', d || {}); };
  h['get_verifikasi_detail'] = function (d) { return getGenericDetail_('T_VERIFIKASI', d || {}); };
  h['save_verifikasi'] = function (d, u) { return saveGeneric_('T_VERIFIKASI', d || {}, u); };
  h['delete_verifikasi'] = function (d, u) { return deleteGeneric_('T_VERIFIKASI', d || {}, u); };

  // T_LAMPIRAN
  h['get_lampiran_list'] = function (d) { return getGenericList_('T_LAMPIRAN', d || {}); };
  h['save_lampiran'] = function (d, u) { return saveGeneric_('T_LAMPIRAN', d || {}, u); };
  h['delete_lampiran'] = function (d, u) { return deleteGeneric_('T_LAMPIRAN', d || {}, u); };

  // T_APPROVAL
  h['get_approval_list'] = function (d) { return getGenericList_('T_APPROVAL', d || {}); };
  h['save_approval'] = function (d, u) { return saveGeneric_('T_APPROVAL', d || {}, u); };
  h['delete_approval'] = function (d, u) { return deleteGeneric_('T_APPROVAL', d || {}, u); };
  h['verifikasi_approval'] = function (d, u) { return verifikasiApproval_(d || {}, u); };

  // T_JADWAL
  h['get_jadwal_list'] = function (d) { return getGenericList_('T_JADWAL', d || {}); };
  h['get_jadwal_detail'] = function (d) { return getGenericDetail_('T_JADWAL', d || {}); };
  h['save_jadwal'] = function (d, u) { return saveGeneric_('T_JADWAL', d || {}, u); };
  h['delete_jadwal'] = function (d, u) { return deleteGeneric_('T_JADWAL', d || {}, u); };

  // T_REKAP
  h['get_rekap_list'] = function (d) { return getGenericList_('T_REKAP', d || {}); };
  h['generate_rekap'] = function (d, u) { return generateRekap_(d || {}, u); };

  // lap* — didelegasikan ke 13_LaporanRekapApi.gs
  h['lap_rekap_klasifikasi'] = function (d) { return lapRekapKlasifikasi_(d || {}); };
  h['lap_rekap_unit'] = function (d) { return lapRekapUnit_(d || {}); };
  h['lap_rekap_pegawai'] = function (d) { return lapRekapPegawai_(d || {}); };
  h['lap_kepatuhan_upload'] = function (d) { return lapKepatuhanUpload_(d || {}); };

  // Laporan — didelegasikan ke 10_LaporanApi.gs & 13_LaporanRekapApi.gs
  h['laporan_daftar_dokumen'] = function (d) { return laporanDaftarDokumen_(d || {}); };
  h['laporan_rekap_periode'] = function (d) { return laporanRekapPeriode_(d || {}); };
  h['laporan_rekap_status'] = function (d) { return laporanRekapStatus_(d || {}); };
  h['laporan_keterlambatan'] = function (d) { return laporanKeterlambatan_(d || {}); };
  h['laporan_file_bermasalah'] = function (d) { return laporanFileBermasalah_(d || {}); };
  h['laporan_khas_data'] = function (d) { return laporanKhasData_(d || {}); };
  h['laporan_export_khas'] = function (d, u) { return laporanExportKhas_(d || {}, u); };

  // Analisa — didelegasikan ke 14 & 15
  h['analisa_distribusi_unit'] = function (d) { return analisaDistribusiUnit_(d || {}); };
  h['analisa_top_pengirim'] = function (d) { return analisaTopPengirim_(d || {}); };
  h['analisa_beban_pejabat'] = function (d) { return analisaBebanPejabat_(d || {}); };
  h['analisa_retensi'] = function (d) { return analisaRetensi_(d || {}); };
  h['analisa_korelasi_jenis_unit'] = function (d) { return analisaKorelasiJenisUnit_(d || {}); };
  h['analisa_tte_ratio'] = function (d) { return analisaTteRatio_(d || {}); };
  h['analisa_sla_pejabat'] = function (d) { return analisaSlaPejabat_(d || {}); };
  h['analisa_kritis_bulanan'] = function (d) { return analisaKritisBulanan_(d || {}); };

  // Evaluasi — didelegasikan ke 16_EvaluasiApi.gs
  h['evaluasi_sla_verifikasi'] = function (d) { return evaluasiSlaVerifikasi_(d || {}); };
  h['evaluasi_sla_upload'] = function (d) { return evaluasiSlaUpload_(d || {}); };
  h['evaluasi_kelengkapan'] = function (d) { return evaluasiKelengkapan_(d || {}); };
  h['evaluasi_format'] = function (d) { return evaluasiFormat_(d || {}); };
  h['evaluasi_kepatuhan_jenis'] = function (d) { return evaluasiKepatuhanJenis_(d || {}); };
  h['evaluasi_kadaluarsa'] = function (d) { return evaluasiKadaluarsa_(d || {}); };
  h['evaluasi_fisik'] = function (d) { return evaluasiFisik_(d || {}); };
  h['evaluasi_alih_media'] = function (d) { return evaluasiAlihMedia_(d || {}); };
  // Legacy alias
  h['evaluasi_sla_disposisi'] = function (d) { return evaluasiSlaVerifikasi_(d || {}); };
  h['evaluasi_jra'] = function (d) { return evaluasiKelengkapan_(d || {}); };
  h['evaluasi_sla'] = function (d) { return evaluasiSlaVerifikasi_(d || {}); };

  // RTL — didelegasikan ke 17_RtlApi.gs
  h['get_tindak_lanjut_list'] = function (d) { return getTindakLanjutList_(d || {}); };
  h['rtl_get_list'] = function (d) { return getTindakLanjutList_(d || {}); };
  h['get_tindak_lanjut_detail'] = function (d) { return getTindakLanjutDetail_(d || {}); };
  h['rtl_get_detail'] = function (d) { return getTindakLanjutDetail_(d || {}); };
  h['save_tindak_lanjut'] = function (d, u) { return saveTindakLanjut_(d || {}, u); };
  h['rtl_save'] = function (d, u) { return saveTindakLanjut_(d || {}, u); };
  h['delete_tindak_lanjut'] = function (d, u) { return deleteTindakLanjut_(d || {}, u); };
  h['rtl_delete'] = function (d, u) { return deleteTindakLanjut_(d || {}, u); };
  h['ubah_status_tindak_lanjut'] = function (d, u) { return ubahStatusTindakLanjut_(d || {}, u); };
  h['rtl_ubah_status'] = function (d, u) { return ubahStatusTindakLanjut_(d || {}, u); };
  h['generate_tindak_lanjut'] = function (d, u) { return generateTindakLanjut_(d || {}, u); };
  h['rtl_generate'] = function (d, u) { return generateTindakLanjut_(d || {}, u); };

  h['init_database'] = function (d, u) { return initDatabase(u); };
  return h;
}

// ==================== §3 HELPERS GENERIC ====================
function getGenericList_(sheet, params) {
  params = params || {};
  var list = getSheetData_(sheet);
  if (params.kategori) list = list.filter(function (r) { return CoreLib.normStr(r.kategori) === CoreLib.normStr(params.kategori); });
  if (params.only_active) list = list.filter(function (r) { return CoreLib.normStr(r.status_aktif) !== 'false'; });
  if (params.search) {
    var q = String(params.search).toLowerCase();
    list = list.filter(function (r) { return CoreLib.matchSearch(r, q, Object.keys(r)); });
  }
  if (params.filters) {
    Object.keys(params.filters).forEach(function (k) {
      var v = params.filters[k];
      if (v !== '' && v !== null && v !== undefined) list = list.filter(function (r) { return CoreLib.normStr(r[k]) === CoreLib.normStr(v); });
    });
  }
  list.sort(function (a, b) { return (a.created_at || '').localeCompare(b.created_at || ''); });
  return { success: true, data: list, total: list.length };
}

function getGenericDetail_(sheet, params) {
  var id = params.id || params.dokumen_id;
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  var rec = findRecordById_(sheet, id);
  if (!rec) return { success: false, code: 'NOT_FOUND', error: 'Data tidak ditemukan.' };
  return { success: true, data: rec };
}

function saveGeneric_(sheet, params, actor) {
  var rec = params.record || params;
  if (!rec) return { success: false, code: 'BAD_REQUEST', error: 'Record wajib.' };
  try { var saved = saveRecord_(sheet, rec, actor); return { success: true, data: saved }; }
  catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function deleteGeneric_(sheet, params, actor) {
  var id = params.id;
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  try { softDeleteRecord_(sheet, id, actor); return { success: true, data: { id: id } }; }
  catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

// ==================== §4 DOMAIN DOKUMEN ====================
function getDokumenList_(params) {
  var list = getSheetData_('T_DOKUMEN');
  var q = String(params.search || '').toLowerCase().trim();
  if (params.tahun) list = list.filter(function (r) { return String(r.tahun) === String(params.tahun); });
  if (params.bulan) list = list.filter(function (r) { return String(r.bulan) === String(params.bulan); });
  if (params.jenis_dokumen_id) list = list.filter(function (r) { return CoreLib.normStr(r.jenis_dokumen_id) === CoreLib.normStr(params.jenis_dokumen_id); });
  if (params.status) list = list.filter(function (r) { return CoreLib.normStr(r.status) === CoreLib.normStr(params.status); });
  if (params.pegawai_id) list = list.filter(function (r) { return CoreLib.normStr(r.pegawai_id) === CoreLib.normStr(params.pegawai_id); });
  // Filter unit (via PEGAWAI map) — untuk admin yang ingin lihat per unit
  if (params.unit_id) {
    var pegawaiMap = {};
    getSheetData_('PEGAWAI').forEach(function (p) { pegawaiMap[String(p.pegawai_id).trim()] = String(p.unit_id).trim(); });
    list = list.filter(function (r) { return pegawaiMap[String(r.pegawai_id).trim()] === String(params.unit_id).trim(); });
  }
  if (q) list = list.filter(function (r) { return CoreLib.matchSearch(r, q, ['judul', 'deskripsi', 'catatan', 'file_name']); });
  list.sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  var page = Number(params.page) || 1;
  var per = Number(params.per_page) || 20;
  var pag = CoreLib.paginate(list, page, per);
  return { success: true, data: pag.data, total: pag.meta.total, total_pages: pag.meta.total_pages, page: pag.meta.page };
}

function saveDokumen_(params, actor) {
  var rec = params.record || params;
  if (!rec) return { success: false, code: 'BAD_REQUEST', error: 'Record wajib.' };
  if (!rec.pegawai_id) return { success: false, code: 'BAD_REQUEST', error: 'Pegawai wajib.' };
  if (!rec.jenis_dokumen_id) return { success: false, code: 'BAD_REQUEST', error: 'Jenis dokumen wajib.' };
  if (!rec.tahun) return { success: false, code: 'BAD_REQUEST', error: 'Tahun wajib.' };

  if (!rec.judul) {
    var jenis = findRecordById_('M_JENIS_DOKUMEN', rec.jenis_dokumen_id);
    var namaJenis = jenis ? jenis.nama : rec.jenis_dokumen_id;
    rec.judul = namaJenis + ' ' + rec.tahun + (rec.bulan ? '-' + rec.bulan : '') + ' - ' + (rec.pegawai_id || '');
  }

  // Duplikat guard (hanya saat create baru, bukan update)
  if (!rec.id) {
    var existing = getSheetData_('T_DOKUMEN').filter(function (r) {
      return CoreLib.normStr(r.pegawai_id) === CoreLib.normStr(rec.pegawai_id) &&
             CoreLib.normStr(r.jenis_dokumen_id) === CoreLib.normStr(rec.jenis_dokumen_id) &&
             String(r.tahun) === String(rec.tahun) &&
             String(r.bulan || '') === String(rec.bulan || '') &&
             !r.deleted_at;
    });
    if (existing.length > 0) {
      return { success: false, code: 'BAD_REQUEST', error: 'Duplikat: dokumen ' + rec.jenis_dokumen_id + ' untuk pegawai ' + rec.pegawai_id + ' tahun ' + rec.tahun + (rec.bulan ? ' bulan ' + rec.bulan : '') + ' sudah ada (' + existing[0].id + ').' };
    }
  }

  // Upload Drive bila ada file_base64
  if (params.file_base64) {
    try {
      // Pre-check ukuran sebelum base64Decode (hindari alokasi besar)
      var approxBytes = Math.floor(String(params.file_base64).length * 3 / 4);
      if (approxBytes > 10 * 1024 * 1024) return { success: false, code: 'BAD_REQUEST', error: 'File >10MB.' };
      var folder = getOrCreateFolder_('SIDOKUMEN');
      var yearFolder = getOrCreateFolder_(String(rec.tahun), folder);
      var blob = Utilities.newBlob(Utilities.base64Decode(params.file_base64), params.file_mime || 'application/pdf', params.file_name || (rec.judul + '.pdf'));
      var file = yearFolder.createFile(blob);
      rec.file_drive_id = file.getId();
      rec.file_name = file.getName();
      rec.file_size = file.getSize();
      rec.file_mime = file.getMimeType();
      rec.uploaded_by = (actor && actor.email) || '';
    } catch (e) { return { success: false, code: 'BAD_REQUEST', error: 'Gagal upload Drive: ' + e.message }; }
  } else {
    if (!rec.id && !rec.file_drive_id) return { success: false, code: 'BAD_REQUEST', error: 'File wajib saat buat baru.' };
  }

  try {
    var saved = saveRecord_('T_DOKUMEN', rec, actor);
    try { saveRecord_('T_LOGBOOK', { dokumen_id: saved.id, pegawai_id: saved.pegawai_id, aksi: rec.id ? 'update' : 'create', catatan_sebelum: '', catatan_sesudah: saved.judul }, actor); } catch (e2) {}
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function getOrCreateFolder_(name, parent) {
  var it = parent ? parent.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent ? parent.createFolder(name) : DriveApp.createFolder(name);
}

function verifikasiDokumen_(params, actor) {
  var id = params.id;
  var statusBaru = params.status_baru || params.status;
  var catatan = params.catatan || '';
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  if (!statusBaru) return { success: false, code: 'BAD_REQUEST', error: 'Status baru wajib.' };
  var allowed = ['baru', 'menunggu', 'disetujui', 'revisi', 'ditolak'];
  if (allowed.indexOf(String(statusBaru).toLowerCase()) === -1) return { success: false, code: 'BAD_REQUEST', error: 'Status tidak valid.' };
  var old = findRecordById_('T_DOKUMEN', id);
  if (!old) return { success: false, code: 'NOT_FOUND', error: 'Dokumen tidak ditemukan.' };

  // Fallback aktor ID: pegawai_id > id > email (untuk audit trail)
  var actorId = (actor && (actor.pegawai_id || actor.id || actor.email)) || '';

  try {
    var saved = saveRecord_('T_DOKUMEN', { id: id, status: statusBaru, catatan: catatan || old.catatan }, actor);
    saveRecord_('T_VERIFIKASI', { dokumen_id: id, verifikator_id: actorId, status_lama: old.status, status_baru: statusBaru, catatan: catatan }, actor);
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function verifikasiApproval_(params, actor) {
  var id = params.id;
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  var rec = findRecordById_('T_APPROVAL', id);
  if (!rec) return { success: false, code: 'NOT_FOUND', error: 'Approval tidak ditemukan.' };
  try {
    var saved = saveRecord_('T_APPROVAL', { id: id, status: params.status || 'disetujui', catatan: params.catatan || '', tanggal_approve: CoreLib.todayIsoLocal(), approver_id: (actor && (actor.pegawai_id || actor.id || actor.email)) || '' }, actor);
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function generateRekap_(params, actor) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var map = {};
  list.forEach(function (r) {
    var key = r.pegawai_id + '|' + r.jenis_dokumen_id;
    map[key] = (map[key] || 0) + 1;
  });
  var rekap = Object.keys(map).map(function (k) { var parts = k.split('|'); return { pegawai_id: parts[0], jenis_dokumen_id: parts[1], jml: map[k] }; });
  return { success: true, data: { tahun: tahun, total: list.length, rekap: rekap } };
}

// ==================== §5 SIMPEG & CONFIG ====================
function getPegawaiList_() { try { return { success: true, data: getSheetData_('PEGAWAI') }; } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; } }
function getUnitList_() { try { return { success: true, data: getSheetData_('UNIT_KERJA') }; } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; } }
function getJabatanList_() { try { return { success: true, data: getSheetData_('JABATAN') }; } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; } }
function getMasterSatelit_() {
  return { success: true, data: { pegawai: getSheetData_('PEGAWAI'), unit: getSheetData_('UNIT_KERJA'), jabatan: getSheetData_('JABATAN'), jenis: getSheetData_('M_JENIS_DOKUMEN'), kategori: getSheetData_('M_KATEGORI_DOKUMEN'), periode: getSheetData_('M_PERIODE') } };
}

function getConfigList_() {
  try { var list = getSheetData_('KONFIGURASI', { includeDeleted: true }); return { success: true, data: list }; }
  catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}
function saveConfigItem_(payload, actor) {
  var key = payload.key || (payload.data && payload.data.key) || (payload.record && payload.record.key);
  var value = payload.value || (payload.data && payload.data.value) || (payload.record && payload.record.value);
  if (!key) return { success: false, code: 'BAD_REQUEST', error: 'Key wajib.' };
  if (!CoreLib.isAllowedConfigKey(key)) return { success: false, code: 'FORBIDDEN', error: 'Key tidak diizinkan.' };
  try {
    var saved = saveRecord_('KONFIGURASI', { id: key, key: key, value: value }, actor);
    audit_(actor, 'SAVE_CONFIG', 'CONFIG', key, true, 'Nilai disimpan.');
    return { success: true, data: saved };
  } catch (e) {
    audit_(actor, 'SAVE_CONFIG_DENIED', 'CONFIG', key, false, e.message);
    return { success: false, code: 'FORBIDDEN', error: e.message };
  }
}
function deleteConfigItem_(payload, actor) {
  var key = payload.key || payload.id;
  if (!key) return { success: false, code: 'BAD_REQUEST', error: 'Key wajib.' };
  if (!CoreLib.isAllowedConfigKey(key)) return { success: false, code: 'FORBIDDEN', error: 'Key tidak diizinkan.' };
  try {
    softDeleteRecord_('KONFIGURASI', key, actor);
    audit_(actor, 'DELETE_CONFIG', 'CONFIG', key, true, 'Dihapus.');
    return { success: true, data: { key: key } };
  } catch (e) {
    audit_(actor, 'DELETE_CONFIG_DENIED', 'CONFIG', key, false, e.message);
    return { success: false, code: 'FORBIDDEN', error: e.message };
  }
}

// ==================== §6 DASHBOARD ====================
function getDashboard_(actor) {
  var dokumen = getSheetData_('T_DOKUMEN');
  var pegawai = getSheetData_('PEGAWAI');
  var rtl = getSheetData_('T_TINDAK_LANJUT');
  var tahun = String(new Date().getFullYear());

  var totalDokumen = dokumen.length;
  var totalBaru = dokumen.filter(function (r) { var s = String(r.status).toLowerCase(); return s === 'baru' || s === 'menunggu'; }).length;
  var totalDisetujui = dokumen.filter(function (r) { return String(r.status).toLowerCase() === 'disetujui'; }).length;
  var jenisAktif = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) { return String(j.status_aktif) !== 'false'; }).length || 1;
  var totalPegawai = pegawai.length || 1;

  var pctLengkap = 0;
  try {
    var rekap = lapRekapPegawai_({ tahun: tahun });
    var lengkap = (rekap.data.rekap || []).filter(function (r) { return r.pct >= 100; }).length;
    pctLengkap = totalPegawai ? Math.round((lengkap / totalPegawai) * 100) : 0;
  } catch (e) {}

  // RTL stats
  var totalRtl = rtl.length;
  var rtlBaru = rtl.filter(function (r) { return String(r.status_rtl || '').toLowerCase() === 'baru'; }).length;
  var rtlSelesai = rtl.filter(function (r) { return String(r.status_rtl || '').toLowerCase() === 'selesai'; }).length;

  var actorNama = (actor && (actor.display_name || actor.nama || actor.nama_lengkap)) || '';

  return { success: true, data: {
    totalDokumen: totalDokumen,
    totalBaru: totalBaru,
    totalDisetujui: totalDisetujui,
    pctLengkap: pctLengkap,
    totalPegawai: totalPegawai,
    totalJenis: jenisAktif,
    tahun: tahun,
    role: (actor && actor.role) || 'viewer',
    nama: actorNama,
    totalRtl: totalRtl,
    rtlBaru: rtlBaru,
    rtlSelesai: rtlSelesai
  } };
}

// ==================== §7 INIT DATABASE ====================
function ensureLocalSheets_() {
  var ss = CoreLib.getDb(SPREADSHEET_ID);
  if (!ss) return;

  var localNames = Object.keys(LOCAL_SHEETS)
    .map(function (k) { return LOCAL_SHEETS[k]; })
    .filter(function (v, i, a) { return a.indexOf(v) === i; }); // dedup (T_RTL alias)

  localNames.forEach(function (name) {
    if (name === 'T_RTL') name = 'T_TINDAK_LANJUT';
    var sh = ss.getSheetByName(name);
    var headers = ALL_SHEET_HEADERS[name] || ALL_SHEET_HEADERS[name.toUpperCase()];

    if (!sh) {
      sh = ss.insertSheet(name);
      if (headers && headers.length) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      Logger.log('[init] Created sheet ' + name);
    } else {
      // Pastikan header baris 1 ada bila kosong (sheet existing tanpa header)
      try {
        if (headers && headers.length) {
          var lastCol = sh.getLastColumn();
          if (lastCol === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
      } catch (e) {}
    }
  });
}

function initDatabase(actor) {
  try {
    var result = CoreLib.initDatabase(SPREADSHEET_ID, ALL_SHEET_HEADERS, isRefSheet_);
    ensureLocalSheets_();

    // Seed data dengan error collection
    var errors = [];
    function seedSheet_(sheetName, seeds) {
      var existing = [];
      try { existing = getSheetData_(sheetName); } catch (e) { existing = []; }
      if (existing.length > 0) return;
      seeds.forEach(function (s) {
        try { saveRecord_(sheetName, s, actor); }
        catch (e) { errors.push(sheetName + ': ' + e.message); }
      });
    }

    seedSheet_('M_JENIS_DOKUMEN', [
      { kode: 'PK', nama: 'Perjanjian Kinerja', kategori: 'KINERJA_UTAMA', periode: 'Tahunan', urutan: 1, status_aktif: 'true', keterangan: 'PK tahunan' },
      { kode: 'SKP_TAHUNAN', nama: 'Sasaran SKP Tahunan', kategori: 'KINERJA_UTAMA', periode: 'Tahunan', urutan: 2, status_aktif: 'true', keterangan: 'SKP tahunan' },
      { kode: 'SKP_PERIODIK', nama: 'Sasaran SKP Periodik/Perubahan', kategori: 'PERUBAHAN', periode: 'Periodik', urutan: 3, status_aktif: 'true', keterangan: 'SKP periodik/perubahan' },
      { kode: 'PK_PERUBAHAN', nama: 'Perjanjian Kinerja Perubahan', kategori: 'PERUBAHAN', periode: 'Periodik', urutan: 4, status_aktif: 'true', keterangan: 'PK perubahan' },
      { kode: 'PENILAIAN_BULANAN', nama: 'Penilaian SKP Bulanan', kategori: 'PENILAIAN', periode: 'Bulanan', urutan: 5, status_aktif: 'true', keterangan: 'Penilaian bulanan' },
      { kode: 'PENILAIAN_TAHUNAN', nama: 'Penilaian SKP Tahunan', kategori: 'PENILAIAN', periode: 'Tahunan', urutan: 6, status_aktif: 'true', keterangan: 'Penilaian tahunan' },
      { kode: 'LAPKIN', nama: 'Laporan Kinerja', kategori: 'LAPORAN', periode: 'Tahunan', urutan: 7, status_aktif: 'true', keterangan: 'Lapkin' },
      { kode: 'LHKPN', nama: 'LHKPN', kategori: 'LAINNYA', periode: 'Tahunan', urutan: 8, status_aktif: 'true', keterangan: 'LHKPN' },
      { kode: 'IKI', nama: 'Indikator Kinerja Individu', kategori: 'KINERJA_UTAMA', periode: 'Tahunan', urutan: 9, status_aktif: 'true', keterangan: 'IKI' },
      { kode: 'SKP_LAIN', nama: 'Dokumen Lainnya', kategori: 'LAINNYA', periode: 'Fleksibel', urutan: 10, status_aktif: 'true', keterangan: 'Lainnya' }
    ]);

    seedSheet_('M_KATEGORI_DOKUMEN', [
      { kode: 'KINERJA_UTAMA', nama: 'Kinerja Utama', urutan: 1, status_aktif: 'true' },
      { kode: 'PERUBAHAN', nama: 'Perubahan', urutan: 2, status_aktif: 'true' },
      { kode: 'PENILAIAN', nama: 'Penilaian', urutan: 3, status_aktif: 'true' },
      { kode: 'LAPORAN', nama: 'Laporan', urutan: 4, status_aktif: 'true' },
      { kode: 'LAINNYA', nama: 'Lainnya', urutan: 5, status_aktif: 'true' }
    ]);

    seedSheet_('M_PERIODE', [
      { tahun: '2024', label: '2024', status_aktif: 'true' },
      { tahun: '2025', label: '2025', status_aktif: 'true' },
      { tahun: '2026', label: '2026', status_aktif: 'true' }
    ]);

    try {
      audit_(actor, 'INIT_DB', 'SYSTEM', 'ALL', errors.length === 0,
        'Init DB SIDOKUMEN v1.0.3 — 12 sheet + seed 10+5+3' + (errors.length ? ' (errors: ' + errors.length + ')' : ''));
    } catch (e) {}

    return { success: errors.length === 0, data: result, seed_errors: errors };
  } catch (e) {
    return { success: false, code: 'BAD_REQUEST', error: e.message + ' ' + (e.stack || '') };
  }
}
function setupApp(actor) { return initDatabase(actor); }
