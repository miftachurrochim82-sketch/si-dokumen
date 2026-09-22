// SIDOKUMEN - 13_LaporanRekapApi.gs (v1.5 — L4/L5/L6/L11/L12)
// L4 per Jenis, L5 per Unit, L6 per Pegawai, L11 Kepatuhan Upload, L12 Laporan Khas 7 sheet

function lapRekapKlasifikasi_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var pegawaiTotal = getSheetData_('PEGAWAI').length || 1;
  var map = {};
  list.forEach(function (r) { var k = r.jenis_dokumen_id || 'tanpa'; map[k] = (map[k] || 0) + 1; });
  var rekap = Object.keys(map).map(function (k) {
    var jml = map[k];
    var pct = Math.round((jml / pegawaiTotal) * 100);
    return { jenis_dokumen_id: k, jml: jml, total_pegawai: pegawaiTotal, pct: pct };
  });
  rekap.sort(function (a, b) { return b.jml - a.jml; });
  return { success: true, data: { tahun: tahun, total: list.length, total_pegawai: pegawaiTotal, rekap: rekap } };
}

function lapRekapUnit_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var pegawaiMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) { pegawaiMap[p.pegawai_id] = p.unit_id || 'tanpa'; });
  var map = {};
  list.forEach(function (r) { var unit = pegawaiMap[r.pegawai_id] || 'tanpa'; map[unit] = (map[unit] || 0) + 1; });
  var rekap = Object.keys(map).map(function (k) { return { unit_id: k, jml: map[k] }; });
  rekap.sort(function (a, b) { return b.jml - a.jml; });
  return { success: true, data: { tahun: tahun, total: list.length, rekap: rekap } };
}

function lapRekapPegawai_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var unitFilter = params.unit_id || params.unit || '';
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var pegawaiList = getSheetData_('PEGAWAI');
  if (unitFilter) pegawaiList = pegawaiList.filter(function (p) { return CoreLib.normStr(p.unit_id) === CoreLib.normStr(unitFilter); });
  var jenisList = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) { return String(j.status_aktif) !== 'false'; });
  var totalJenis = jenisList.length || 1;
  var map = {};
  list.forEach(function (r) { var k = r.pegawai_id; map[k] = (map[k] || 0) + 1; });
  var rekap = pegawaiList.map(function (p) {
    var jml = map[p.pegawai_id] || 0;
    var pct = Math.round((jml / totalJenis) * 100);
    return { pegawai_id: p.pegawai_id, nama: p.nama || p.nama_lengkap, nip: p.nip, unit_id: p.unit_id, jml: jml, total_jenis: totalJenis, pct: pct };
  });
  rekap.sort(function (a, b) { return b.pct - a.pct; });
  var belum = rekap.filter(function (r) { return r.pct < 100; });
  var lengkap = rekap.filter(function (r) { return r.pct >= 100; });
  return { success: true, data: { tahun: tahun, total_pegawai: pegawaiList.length, total_jenis: totalJenis, total_dokumen: list.length, rekap: rekap, belum_lengkap: belum, lengkap: lengkap } };
}

function lapKepatuhanUpload_(params) {
  // L11 — % pegawai upload tepat waktu per jenis (vs T_JADWAL deadline)
  var tahun = params.tahun || String(new Date().getFullYear());
  var jadwal = getSheetData_('T_JADWAL');
  var deadlineMap = {};
  jadwal.forEach(function (j) { if (j.jenis_dokumen_id || j.judul) { var key = j.jenis_dokumen_id || j.judul; deadlineMap[key] = j.tanggal_selesai || j.tanggal_mulai; } });
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var jenisList = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) { return String(j.status_aktif) !== 'false'; });
  var rekap = jenisList.map(function (jenis) {
    var docs = list.filter(function (r) { return CoreLib.normStr(r.jenis_dokumen_id) === CoreLib.normStr(jenis.id); });
    var total = docs.length;
    var tepatWaktu = 0;
    docs.forEach(function (r) {
      var dl = deadlineMap[jenis.id] || deadlineMap[jenis.kode] || (tahun + '-01-31');
      var tglUpload = CoreLib.dateKey10(r.created_at) || '';
      if (tglUpload && dl && tglUpload <= dl) tepatWaktu++;
    });
    var pct = total ? Math.round((tepatWaktu / total) * 100) : 0;
    return { jenis_dokumen_id: jenis.id, kode: jenis.kode, nama: jenis.nama, total: total, tepat_waktu: tepatWaktu, pct: pct };
  });
  rekap.sort(function (a, b) { return b.pct - a.pct; });
  var total = list.length;
  var totalTepat = rekap.reduce(function (s, r) { return s + r.tepat_waktu; }, 0);
  var pctTotal = total ? Math.round((totalTepat / total) * 100) : 0;
  return { success: true, data: { tahun: tahun, total: total, tepat_waktu: totalTepat, pct: pctTotal, rekap: rekap } };
}

function laporanKhasData_(params) {
  // L12 — data untuk laporan khas 7 sheet (mirip si-arsip L12)
  var tahun = params.tahun || String(new Date().getFullYear());
  var klas = lapRekapKlasifikasi_({ tahun: tahun }).data;
  var unit = lapRekapUnit_({ tahun: tahun }).data;
  var pegawai = lapRekapPegawai_({ tahun: tahun }).data;
  var kepatuhan = lapKepatuhanUpload_({ tahun: tahun }).data;
  var top5Jenis = (klas.rekap || []).slice(0, 5);
  return {
    success: true,
    data: {
      tahun: tahun,
      klasifikasi: klas,
      unit: unit,
      pegawai: pegawai,
      kepatuhan: kepatuhan,
      top5_jenis: top5Jenis,
      generated_at: new Date().toISOString()
    }
  };
}

function laporanExportKhas_(params, actor) {
  // L12 export — buat file Excel 7 sheet di Drive folder SIDOKUMEN Export
  var tahun = params.tahun || String(new Date().getFullYear());
  var data = laporanKhasData_({ tahun: tahun }).data;
  // Buat file Excel via SheetJS di server? Sederhana: buat spreadsheet baru di Drive
  try {
    var folderName = 'SIDOKUMEN Export';
    var folder = getOrCreateFolder_(folderName);
    var ssName = 'SIDOKUMEN_KHAS_' + tahun + '_' + String(Date.now()).slice(-6);
    var ss = SpreadsheetApp.create(ssName);
    var file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    // Sheet 1 Cover
    var shCover = ss.getActiveSheet();
    shCover.setName('Cover');
    shCover.getRange(1, 1).setValue('LAPORAN KHAS SIDOKUMEN — SATPOL PP & DAMKAR KAB. TRENGGALEK');
    shCover.getRange(2, 1).setValue('Tahun: ' + tahun);
    shCover.getRange(3, 1).setValue('Generated: ' + data.generated_at + ' oleh ' + ((actor && actor.email) || ''));
    shCover.getRange(5, 1).setValue('Top 5 Jenis Dokumen');
    (data.top5_jenis || []).forEach(function (r, i) { shCover.getRange(6 + i, 1).setValue(r.jenis_dokumen_id + ' — ' + r.jml + ' (' + r.pct + '%)'); });

    // Sheet 2 Ringkasan
    var shRing = ss.insertSheet('Ringkasan');
    shRing.getRange(1, 1, 1, 4).setValues([['Tahun', 'Total Dokumen', 'Total Pegawai', '% Lengkap']]);
    shRing.getRange(2, 1, 1, 4).setValues([[tahun, data.pegawai.total_dokumen || 0, data.pegawai.total_pegawai || 0, data.kepatuhan.pct + '%']]);

    // Sheet 3 Rekap Jenis
    var shJenis = ss.insertSheet('Rekap Jenis');
    shJenis.getRange(1, 1, 1, 3).setValues([['Jenis', 'Jumlah', '%']]);
    (data.klasifikasi.rekap || []).forEach(function (r, i) { shJenis.getRange(2 + i, 1, 1, 3).setValues([[r.jenis_dokumen_id, r.jml, r.pct + '%']]); });

    // Sheet 4 Rekap Unit
    var shUnit = ss.insertSheet('Rekap Unit');
    shUnit.getRange(1, 1, 1, 2).setValues([['Unit', 'Jumlah']]);
    (data.unit.rekap || []).forEach(function (r, i) { shUnit.getRange(2 + i, 1, 1, 2).setValues([[r.unit_id, r.jml]]); });

    // Sheet 5 Rekap Pegawai
    var shPeg = ss.insertSheet('Rekap Pegawai');
    shPeg.getRange(1, 1, 1, 4).setValues([['Pegawai', 'NIP', 'Jml', '%']]);
    (data.pegawai.rekap || []).forEach(function (r, i) { shPeg.getRange(2 + i, 1, 1, 4).setValues([[r.nama, r.nip, r.jml, r.pct + '%']]); });

    // Sheet 6 Kepatuhan
    var shPat = ss.insertSheet('Kepatuhan');
    shPat.getRange(1, 1, 1, 4).setValues([['Jenis', 'Total', 'Tepat Waktu', '%']]);
    (data.kepatuhan.rekap || []).forEach(function (r, i) { shPat.getRange(2 + i, 1, 1, 4).setValues([[r.nama, r.total, r.tepat_waktu, r.pct + '%']]); });

    // Sheet 7 TTD
    var shTtd = ss.insertSheet('TTD');
    shTtd.getRange(1, 1).setValue('Mengetahui,');
    shTtd.getRange(2, 1).setValue('Kasat Pol PP dan Damkar');
    shTtd.getRange(5, 1).setValue('Trenggalek, ' + CoreLib.dateKey10(new Date().toISOString()));

    return { success: true, data: { tahun: tahun, file_id: ss.getId(), file_url: 'https://docs.google.com/spreadsheets/d/' + ss.getId(), sheets: 7 } };
  } catch (e) {
    return { success: false, code: 'BAD_REQUEST', error: 'Gagal export khas: ' + e.message };
  }
}
