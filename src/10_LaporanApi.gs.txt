// SIDOKUMEN - 10_LaporanApi.gs (v1.0.3 — L1-L3, L7-L10)
// ============================================================
// Changelog:
//   v1.0.3 — Fix buildDeadlineMap_ dual-map (byDokumen + byJenis).
//            Bug kritis: T_JADWAL tidak punya kolom jenis_dokumen_id,
//            sehingga map selalu kosong → laporanKeterlambatan_ selalu 0.
//   v1.0.2 — Filter T_JADWAL berbasis tanggal_selesai (bukan kolom tahun yang tidak ada).
//   v1.0.1 — Return shape {total, list, page, total_pages} sesuai frontend.
//   v1.0.0 — Initial.
// ============================================================

function laporanDaftarDokumen_(params) {
  var list = getSheetData_('T_DOKUMEN');
  var q = String(params.search || '').toLowerCase().trim();
  if (params.tahun) list = list.filter(function (r) { return String(r.tahun) === String(params.tahun); });
  if (params.bulan) list = list.filter(function (r) { return String(r.bulan) === String(params.bulan); });
  if (params.jenis_dokumen_id) list = list.filter(function (r) { return CoreLib.normStr(r.jenis_dokumen_id) === CoreLib.normStr(params.jenis_dokumen_id); });
  if (params.status) list = list.filter(function (r) { return CoreLib.normStr(r.status) === CoreLib.normStr(params.status); });
  if (params.pegawai_id) list = list.filter(function (r) { return CoreLib.normStr(r.pegawai_id) === CoreLib.normStr(params.pegawai_id); });
  if (q) list = list.filter(function (r) { return CoreLib.matchSearch(r, q, ['judul', 'deskripsi', 'catatan', 'file_name']); });
  list.sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  var page = Number(params.page) || 1;
  var per = Number(params.per_page) || 20;
  var pag = CoreLib.paginate(list, page, per);
  return { success: true, data: { total: pag.meta.total, list: pag.data, page: pag.meta.page, total_pages: pag.meta.total_pages } };
}

function laporanRekapPeriode_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var map = {};
  list.forEach(function (r) {
    var k = r.tahun + '-' + String(r.bulan || '00').padStart(2, '0');
    map[k] = (map[k] || 0) + 1;
  });
  var rekap = Object.keys(map).map(function (k) { return { periode: k, jml: map[k] }; });
  rekap.sort(function (a, b) { return a.periode.localeCompare(b.periode); });
  return { success: true, data: { tahun: tahun, total: list.length, rekap: rekap } };
}

function laporanRekapStatus_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var map = { baru: 0, menunggu: 0, disetujui: 0, revisi: 0, ditolak: 0 };
  list.forEach(function (r) { var s = String(r.status || 'baru').toLowerCase(); if (map[s] !== undefined) map[s]++; });
  var rekap = Object.keys(map).map(function (k) { return { status: k, jml: map[k] }; });
  return { success: true, data: { tahun: tahun, total: list.length, rekap: rekap } };
}

// ============================================================
// Helper: kumpulkan deadline dari T_JADWAL untuk tahun tertentu.
// ============================================================
// Schema T_JADWAL: id, dokumen_id, judul, tanggal_mulai, tanggal_selesai,
//                  lokasi, pegawai_id, status, keterangan, ...
// TIDAK ADA kolom jenis_dokumen_id / tahun.
//
// Filter tahun: prefix match pada tanggal_selesai (fallback tanggal_mulai).
//
// Return dual-map:
//   { byDokumen: { dokId: tgl }, byJenis: { jenisId: tgl } }
// - byDokumen: dipakai kalau T_JADWAL.dokumen_id match langsung T_DOKUMEN.id
// - byJenis:   fallback kalau T_JADWAL.jenis_dokumen_id diisi (future-proof)
//
// Prioritas lookup di caller: byDokumen[dokId] || byJenis[jenisId]
// ============================================================
function buildDeadlineMap_(tahun) {
  var jadwal = getSheetData_('T_JADWAL').filter(function (j) {
    var t = String(j.tanggal_selesai || j.tanggal_mulai || '');
    return t.indexOf(String(tahun)) === 0;
  });
  var byDokumen = {};
  var byJenis = {};
  jadwal.forEach(function (j) {
    var tgl = j.tanggal_selesai || j.tanggal_mulai;
    if (!tgl) return;
    if (j.dokumen_id) byDokumen[String(j.dokumen_id).trim()] = tgl;
    if (j.jenis_dokumen_id) byJenis[String(j.jenis_dokumen_id).trim()] = tgl;
  });
  return { byDokumen: byDokumen, byJenis: byJenis };
}

function laporanKeterlambatan_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var dm = buildDeadlineMap_(tahun);
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var terlambat = [];

  list.forEach(function (r) {
    // Priority: per-dokumen deadline → per-jenis deadline → skip
    var dl = dm.byDokumen[String(r.id).trim()]
          || dm.byJenis[String(r.jenis_dokumen_id || '').trim()];
    if (!dl) return; // tidak ada deadline → skip (bukan fallback blanket)
    var tglUpload = CoreLib.dateKey10(r.created_at) || '';
    if (tglUpload && tglUpload > dl) {
      terlambat.push({
        id: r.id,
        pegawai_id: r.pegawai_id,
        jenis_dokumen_id: r.jenis_dokumen_id,
        tgl_upload: tglUpload,
        deadline: dl,
        selisih_hari: Math.round((new Date(tglUpload) - new Date(dl)) / (1000 * 60 * 60 * 24))
      });
    }
  });

  terlambat.sort(function (a, b) { return b.selisih_hari - a.selisih_hari; });
  return {
    success: true,
    data: {
      tahun: tahun,
      total: list.length,
      terlambat_total: terlambat.length,
      jadwal_total: Object.keys(dm.byDokumen).length + Object.keys(dm.byJenis).length,
      list: terlambat.slice(0, 100)
    }
  };
}

function laporanFileBermasalah_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var bermasalah = [];

  list.forEach(function (r) {
    var issues = [];
    if (!r.file_drive_id) issues.push('tanpa file_drive_id');
    if (r.file_mime && String(r.file_mime).toLowerCase().indexOf('pdf') === -1) issues.push('bukan PDF: ' + r.file_mime);
    if (r.file_size && Number(r.file_size) > 10 * 1024 * 1024) issues.push('>10MB: ' + r.file_size);
    if (issues.length) {
      bermasalah.push({
        id: r.id,
        pegawai_id: r.pegawai_id,
        jenis_dokumen_id: r.jenis_dokumen_id,
        file_name: r.file_name,
        file_size: r.file_size,
        file_mime: r.file_mime,
        issues: issues
      });
    }
  });

  return {
    success: true,
    data: {
      tahun: tahun,
      total: list.length,
      bermasalah_total: bermasalah.length,
      list: bermasalah.slice(0, 100)
    }
  };
}
