// SIDOKUMEN - 14_AnalisaApi.gs (v1.6 — A3/A4/A5)
function analisaDistribusiUnit_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var pegawaiMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) { pegawaiMap[p.pegawai_id] = p.unit_id || 'tanpa'; });
  var map = {};
  list.forEach(function (r) { var k = pegawaiMap[r.pegawai_id] || 'tanpa'; map[k] = (map[k] || 0) + 1; });
  var distribusi = Object.keys(map).map(function (k) { return { unit_id: k, jumlah: map[k] }; });
  distribusi.sort(function (a, b) { return b.jumlah - a.jumlah; });
  return { success: true, data: { tahun: tahun, total: list.length, distribusi: distribusi.slice(0, 8), total_beban: list.length } };
}
function analisaTopPengirim_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return !tahun || String(r.tahun) === String(tahun); });
  var map = {};
  list.forEach(function (r) { var k = r.pegawai_id || 'tanpa'; map[k] = (map[k] || 0) + 1; });
  var top = Object.keys(map).map(function (k) {
    var pegawai = findRecordById_('PEGAWAI', k) || { nama: k };
    return { pegawai_id: k, nama: pegawai.nama || pegawai.nama_lengkap || k, jumlah: map[k], pct: list.length ? Math.round((map[k] / list.length) * 100) : 0 };
  });
  top.sort(function (a, b) { return b.jumlah - a.jumlah; });
  return { success: true, data: { tahun: tahun, total: list.length, top: top.slice(0, 10) } };
}
function analisaBebanPejabat_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return !tahun || String(r.tahun) === String(tahun); });
  var map = {};
  list.forEach(function (r) { var k = r.pegawai_id || 'tanpa'; if (!map[k]) map[k] = { diteruskan: 0, diproses: 0, selesai: 0, lewat: 0 }; map[k].diteruskan++; if (String(r.status).toLowerCase() === 'disetujui') map[k].selesai++; else if (String(r.status).toLowerCase() === 'menunggu') map[k].diproses++; });
  var beban = Object.keys(map).map(function (k) { var m = map[k]; var pegawai = findRecordById_('PEGAWAI', k) || { nama: k }; return { pegawai_id: k, nama: pegawai.nama || k, diteruskan: m.diteruskan, diproses: m.diproses, selesai: m.selesai, lewat: m.lewat, jumlah: m.diteruskan }; });
  beban.sort(function (a, b) { return b.jumlah - a.jumlah; });
  return { success: true, data: { tahun: tahun, total: list.length, beban: beban.slice(0, 10) } };
}
