// SIDOKUMEN - 10_LaporanApi.gs (v1.5 — Laporan L1-L3, L7-L10)
// L1 Daftar Dokumen, L2 per Jenis, L3 per Pegawai, L7 per Periode, L8 per Status, L9 Keterlambatan, L10 File Bermasalah

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

function laporanKeterlambatan_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  // Ambil jadwal deadline dari T_JADWAL bila ada, else default H+7
  var jadwal = getSheetData_('T_JADWAL').filter(function (j) { return String(j.tahun || j.periode || '').indexOf(tahun) !== -1 || !j.tahun; });
  var deadlineMap = {};
  jadwal.forEach(function (j) { if (j.jenis_dokumen_id) deadlineMap[j.jenis_dokumen_id] = j.tanggal_selesai || j.tanggal_mulai; });
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var terlambat = [];
  list.forEach(function (r) {
    var dl = deadlineMap[r.jenis_dokumen_id] || (r.tahun + '-01-07'); // default 7 Jan tahun itu untuk PK
    var tglUpload = CoreLib.dateKey10(r.created_at) || '';
    if (tglUpload && dl && tglUpload > dl) {
      terlambat.push({ id: r.id, pegawai_id: r.pegawai_id, jenis_dokumen_id: r.jenis_dokumen_id, tgl_upload: tglUpload, deadline: dl, selisih_hari: Math.round((new Date(tglUpload) - new Date(dl)) / (1000 * 60 * 60 * 24)) });
    }
  });
  terlambat.sort(function (a, b) { return b.selisih_hari - a.selisih_hari; });
  return { success: true, data: { tahun: tahun, total: list.length, terlambat_total: terlambat.length, list: terlambat.slice(0, 100) } };
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
    var namaStandar = String(r.tahun) + '_' + String(r.jenis_dokumen_id || '') + '_' + String(r.pegawai_id || '') + (r.bulan ? '_' + r.bulan : '') + '.pdf';
    if (r.file_name && r.file_name !== namaStandar) {
      // hanya warning, tidak hard fail
      // issues.push('nama tidak standar: ' + r.file_name + ' vs ' + namaStandar);
    }
    if (issues.length) bermasalah.push({ id: r.id, pegawai_id: r.pegawai_id, jenis_dokumen_id: r.jenis_dokumen_id, file_name: r.file_name, file_size: r.file_size, file_mime: r.file_mime, issues: issues });
  });
  return { success: true, data: { tahun: tahun, total: list.length, bermasalah_total: bermasalah.length, list: bermasalah.slice(0, 100) } };
}
