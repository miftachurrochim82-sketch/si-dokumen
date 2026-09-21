// SIDOKUMEN - 16_EvaluasiApi.gs (v1.8 — E1-E8)
function evaluasiSlaVerifikasi_(params) {
  // E1 — SLA verifikasi % patuh + avg telat (konsistensi A9)
  var tahun = params.tahun || String(new Date().getFullYear());
  var verifikasi = getSheetData_('T_VERIFIKASI').filter(function (v) { var t = CoreLib.dateKey10(v.created_at) || ''; return !tahun || t.indexOf(tahun) === 0; });
  var total = verifikasi.length;
  var patuh = 0, totalHari = 0, lewat = 0;
  verifikasi.forEach(function (v) {
    var dok = findRecordById_('T_DOKUMEN', v.dokumen_id);
    if (dok) {
      var t1 = new Date(dok.created_at || '');
      var t2 = new Date(v.created_at || '');
      if (!isNaN(t1.getTime()) && !isNaN(t2.getTime())) {
        var diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
        totalHari += diff;
        if (diff <= 3) patuh++; else lewat++;
      }
    }
  });
  var pctPatuh = total ? Math.round((patuh / total) * 100) : 0;
  var avgTelat = total ? (totalHari / total).toFixed(1) : 0;
  return { success: true, data: { tahun: tahun, total: total, patuh: patuh, lewat: lewat, pct_patuh: pctPatuh, avg_hari: Number(avgTelat) } };
}

function evaluasiSlaUpload_(params) {
  // E2 — SLA upload tepat waktu vs T_JADWAL
  var tahun = params.tahun || String(new Date().getFullYear());
  var jadwal = getSheetData_('T_JADWAL');
  var deadlineMap = {};
  jadwal.forEach(function (j) { if (j.jenis_dokumen_id) deadlineMap[j.jenis_dokumen_id] = j.tanggal_selesai || j.tanggal_mulai; });
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var total = list.length;
  var patuh = 0, lewat = 0, totalTelat = 0;
  list.forEach(function (r) {
    var dl = deadlineMap[r.jenis_dokumen_id] || (tahun + '-01-31');
    var tglUpload = CoreLib.dateKey10(r.created_at) || '';
    if (tglUpload && dl) {
      if (tglUpload <= dl) patuh++; else { lewat++; var diff = Math.round((new Date(tglUpload) - new Date(dl)) / (1000 * 60 * 60 * 24)); totalTelat += diff; }
    }
  });
  var pctPatuh = total ? Math.round((patuh / total) * 100) : 0;
  var avgTelat = lewat ? (totalTelat / lewat).toFixed(1) : 0;
  return { success: true, data: { tahun: tahun, total: total, patuh: patuh, lewat: lewat, pct_patuh: pctPatuh, avg_telat_hari: Number(avgTelat) } };
}

function evaluasiKelengkapan_(params) {
  // E3 — kelengkapan metadata
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var total = list.length;
  var missing = { tanpa_file: 0, tanpa_pegawai: 0, tanpa_jenis: 0, tanpa_tahun: 0, tanpa_judul: 0 };
  var rincian = [];
  list.forEach(function (r) {
    var issues = [];
    if (!r.file_drive_id) { missing.tanpa_file++; issues.push('tanpa file_drive_id'); }
    if (!r.pegawai_id) { missing.tanpa_pegawai++; issues.push('tanpa pegawai_id'); }
    if (!r.jenis_dokumen_id) { missing.tanpa_jenis++; issues.push('tanpa jenis_dokumen_id'); }
    if (!r.tahun) { missing.tanpa_tahun++; issues.push('tanpa tahun'); }
    if (!r.judul) { missing.tanpa_judul++; issues.push('tanpa judul'); }
    if (issues.length) rincian.push({ id: r.id, pegawai_id: r.pegawai_id, jenis_dokumen_id: r.jenis_dokumen_id, issues: issues });
  });
  var lengkap = total - rincian.length;
  var pctLengkap = total ? Math.round((lengkap / total) * 100) : 0;
  return { success: true, data: { tahun: tahun, total: total, lengkap: lengkap, pct_lengkap: pctLengkap, missing: missing, rincian: rincian.slice(0, 100) } };
}

function evaluasiFormat_(params) {
  // E4 — format file regex standar
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var total = list.length;
  var invalid = [];
  var regexNama = /^\d{4}_[A-Z0-9_]+_[A-Z0-9\-]+(_\d{1,2})?\.pdf$/;
  list.forEach(function (r) {
    var issues = [];
    if (r.file_mime && String(r.file_mime).toLowerCase().indexOf('pdf') === -1) issues.push('mime bukan PDF: ' + r.file_mime);
    if (r.file_size && Number(r.file_size) > 10 * 1024 * 1024) issues.push('size >10MB');
    if (r.file_name && !regexNama.test(r.file_name)) issues.push('nama tidak standar: ' + r.file_name);
    if (issues.length) invalid.push({ id: r.id, file_name: r.file_name, file_size: r.file_size, file_mime: r.file_mime, issues: issues });
  });
  var patuh = total - invalid.length;
  var pctPatuh = total ? Math.round((patuh / total) * 100) : 0;
  return { success: true, data: { tahun: tahun, total: total, patuh: patuh, tidak_patuh: invalid.length, pct_patuh: pctPatuh, rincian: invalid.slice(0, 100) } };
}

function evaluasiKepatuhanJenis_(params) {
  // E5 — kepatuhan per jenis (reuse L11)
  return lapKepatuhanUpload_(params);
}

function evaluasiKadaluarsa_(params) {
  // E6 — dokumen kadaluarsa tanpa BA (retensi habis belum musnah)
  var tahun = params.tahun || String(new Date().getFullYear());
  var tahunNow = Number(tahun);
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return Number(r.tahun) <= tahunNow - 5; });
  var tanpaBA = list.filter(function (r) {
    // cek di T_TINDAK_LANJUT apakah sudah ada BA musnah untuk dokumen ini
    var rtl = getSheetData_('T_TINDAK_LANJUT').filter(function (rtl) { return String(rtl.dokumen_terkait).indexOf(r.id) !== -1 && String(rtl.sumber_evaluasi).toUpperCase() === 'E6'; });
    return rtl.length === 0;
  });
  return { success: true, data: { tahun: tahun, total_kadaluarsa: list.length, tanpa_ba: tanpaBA.length, list: tanpaBA.slice(0, 100).map(function (r) { return { id: r.id, pegawai_id: r.pegawai_id, jenis_dokumen_id: r.jenis_dokumen_id, tahun: r.tahun }; }) } };
}

function evaluasiFisik_(params) {
  // E7 — fisik placeholder lokasi_fisik proxy (karena field kondisi_fisik belum ada)
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var tanpaLokasi = list.filter(function (r) { return !r.lokasi_fisik; });
  return { success: true, data: { tahun: tahun, total: list.length, tanpa_lokasi: tanpaLokasi.length, pct_tanpa: list.length ? Math.round((tanpaLokasi.length / list.length) * 100) : 0, note: 'Field lokasi_fisik belum ada — proxy, semua dianggap tanpa lokasi (future G07)' } };
}

function evaluasiAlihMedia_(params) {
  // E8 — alih media T_LAMPIRAN file_drive vs total dokumen per jenis
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var lampiran = getSheetData_('T_LAMPIRAN').filter(function (l) { var t = CoreLib.dateKey10(l.created_at) || ''; return !tahun || t.indexOf(tahun) === 0; });
  var total = list.length;
  var sudahDigital = list.filter(function (r) { return r.file_drive_id; }).length;
  var pctDigital = total ? Math.round((sudahDigital / total) * 100) : 0;
  var perJenis = {};
  list.forEach(function (r) { var k = r.jenis_dokumen_id || 'tanpa'; if (!perJenis[k]) perJenis[k] = { total: 0, digital: 0 }; perJenis[k].total++; if (r.file_drive_id) perJenis[k].digital++; });
  var rekap = Object.keys(perJenis).map(function (k) { var m = perJenis[k]; return { jenis_dokumen_id: k, total: m.total, digital: m.digital, pct: m.total ? Math.round((m.digital / m.total) * 100) : 0 }; });
  rekap.sort(function (a, b) { return a.pct - b.pct; });
  return { success: true, data: { tahun: tahun, total: total, digital: sudahDigital, pct_digital: pctDigital, total_lampiran: lampiran.length, rekap: rekap } };
}
