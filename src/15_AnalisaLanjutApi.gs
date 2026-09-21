// SIDOKUMEN - 15_AnalisaLanjutApi.gs (v1.7 — A6-A10)
function analisaRetensi_(params) {
  // A6 — proyeksi retensi 5 tahun (dokumen lama)
  var tahunNow = Number(params.tahun) || new Date().getFullYear();
  var list = getSheetData_('T_DOKUMEN');
  var map = {};
  for (var i = 0; i < 5; i++) {
    var th = tahunNow + i;
    var musnah = list.filter(function (r) { return Number(r.tahun) <= th - 5; }).length;
    var permanen = list.filter(function (r) { return Number(r.tahun) <= th - 10; }).length;
    map[th] = { tahun: th, musnah: musnah, permanen: permanen };
  }
  var proyeksi = Object.keys(map).map(function (k) { return map[k]; });
  return { success: true, data: { tahun: tahunNow, proyeksi: proyeksi } };
}

function analisaKorelasiJenisUnit_(params) {
  // A7 — matrix jenis × unit
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var pegawaiMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) { pegawaiMap[p.pegawai_id] = p.unit_id || 'tanpa'; });
  var jenisList = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) { return String(j.status_aktif) !== 'false'; }).slice(0, 5);
  var unitMap = {};
  getSheetData_('UNIT_KERJA').forEach(function (u) { unitMap[u.unit_id] = u.nama_unit; });
  var units = Object.keys(unitMap).slice(0, 8);
  var matrix = [];
  jenisList.forEach(function (jenis) {
    var row = { jenis_id: jenis.id, jenis_nama: jenis.nama };
    units.forEach(function (unitId) {
      var count = list.filter(function (r) { return CoreLib.normStr(r.jenis_dokumen_id) === CoreLib.normStr(jenis.id) && (pegawaiMap[r.pegawai_id] || 'tanpa') === unitId; }).length;
      row[unitId] = count;
    });
    matrix.push(row);
  });
  return { success: true, data: { tahun: tahun, jenis: jenisList.map(function (j) { return { id: j.id, nama: j.nama }; }), units: units.map(function (u) { return { id: u, nama: unitMap[u] || u }; }), matrix: matrix } };
}

function analisaTteRatio_(params) {
  // A8 — TTE ratio placeholder 0% (future)
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var total = list.length;
  var tte = 0; // belum ada field tte
  var pct = total ? Math.round((tte / total) * 100) : 0;
  return { success: true, data: { tahun: tahun, total: total, tte: tte, pct: pct, note: 'TTE belum ada field — placeholder 0% (future G15)' } };
}

function analisaSlaPejabat_(params) {
  // A9 — SLA per verifikator
  var tahun = params.tahun || String(new Date().getFullYear());
  var verifikasi = getSheetData_('T_VERIFIKASI').filter(function (v) { var t = CoreLib.dateKey10(v.created_at) || ''; return !tahun || t.indexOf(tahun) === 0; });
  var map = {};
  verifikasi.forEach(function (v) {
    var k = v.verifikator_id || 'tanpa';
    if (!map[k]) map[k] = { total: 0, lewat: 0, total_hari: 0 };
    map[k].total++;
    // hitung selisih hari dari dokumen created ke verifikasi created (simplified)
    var dok = findRecordById_('T_DOKUMEN', v.dokumen_id);
    if (dok) {
      var t1 = new Date(dok.created_at || dok.tanggal || '');
      var t2 = new Date(v.created_at || '');
      if (!isNaN(t1.getTime()) && !isNaN(t2.getTime())) {
        var diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
        map[k].total_hari += diff;
        if (diff > 3) map[k].lewat++;
      }
    }
  });
  var sla = Object.keys(map).map(function (k) {
    var m = map[k];
    var avg = m.total ? (m.total_hari / m.total).toFixed(1) : 0;
    var pctLewat = m.total ? Math.round((m.lewat / m.total) * 100) : 0;
    var pegawai = findRecordById_('PEGAWAI', k) || { nama: k };
    return { verifikator_id: k, nama: pegawai.nama || k, total: m.total, lewat: m.lewat, pct_lewat: pctLewat, avg_hari: Number(avg) };
  });
  sla.sort(function (a, b) { return b.lewat - a.lewat; });
  return { success: true, data: { tahun: tahun, total: verifikasi.length, sla: sla.slice(0, 8) } };
}

function analisaKritisBulanan_(params) {
  // A10 — dokumen belum upload per bulan 12 bulan
  var tahun = params.tahun || String(new Date().getFullYear());
  var pegawaiTotal = getSheetData_('PEGAWAI').length || 1;
  var jenisTotal = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) { return String(j.status_aktif) !== 'false'; }).length || 1;
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var bulanMap = {};
  for (var b = 1; b <= 12; b++) bulanMap[b] = 0;
  list.forEach(function (r) { var bl = Number(r.bulan) || 0; if (bl >= 1 && bl <= 12) bulanMap[bl]++; });
  var rekap = [];
  for (var b = 1; b <= 12; b++) {
    var jml = bulanMap[b] || 0;
    var expected = pegawaiTotal * 1; // simplifikasi: 1 dokumen per pegawai per bulan untuk penilaian bulanan
    var belum = Math.max(0, expected - jml);
    rekap.push({ bulan: b, nama_bulan: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][b - 1], jml: jml, belum: belum });
  }
  return { success: true, data: { tahun: tahun, total: list.length, rekap: rekap } };
}
