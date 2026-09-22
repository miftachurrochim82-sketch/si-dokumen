// SIDOKUMEN - 16_EvaluasiApi.gs (v1.0.6 — E1-E8)
// ============================================================
// Changelog:
//   v1.0.6 — 
//     - evaluasiSlaVerifikasi_: pre-index dokMap O(n), param sla_hari,
//       no_dokumen counter, guard clock skew.
//     - evaluasiSlaUpload_: PAKAI buildDeadlineMap_ dari 10_LaporanApi.gs
//       (dual-map byDokumen + byJenis). Buang fallback blanket Jan-31.
//       Tambah no_deadline & total_with_deadline.
//     - evaluasiKelengkapan_: normalisasi .trim(), tambah pct_missing.
//     - evaluasiFormat_: regex /i flag, konsisten generator, penjelasan note.
//     - evaluasiKadaluarsa_: pre-index RTL by dokumen_terkait O(n).
//     - evaluasiAlihMedia_: normalisasi .trim(), tambah rincian per jenis (digital list).
//   v1.8 — E1-E8 initial.
//
// ⚠️ DEPENDENCY: memanggil buildDeadlineMap_() dari 10_LaporanApi.gs.
// ============================================================

// ============================================================
// E1 — SLA Verifikasi
// ============================================================
// Return: { tahun, total, total_with_dokumen, no_dokumen, patuh, lewat,
//           pct_patuh, avg_hari, sla_hari }
// ============================================================
function evaluasiSlaVerifikasi_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var slaHari = Number(params.sla_hari) || 3;

  var verifikasi = getSheetData_('T_VERIFIKASI').filter(function (v) {
    var t = CoreLib.dateKey10(v.created_at) || '';
    return !tahun || t.indexOf(tahun) === 0;
  });

  // Pre-index dokumen by id
  var dokMap = {};
  getSheetData_('T_DOKUMEN').forEach(function (d) {
    var did = String(d.id).trim();
    if (did) dokMap[did] = d;
  });

  var total = verifikasi.length;
  var totalWithDokumen = 0;
  var noDokumen = 0;
  var patuh = 0, lewat = 0, totalHari = 0;

  verifikasi.forEach(function (v) {
    var dokId = String(v.dokumen_id || '').trim();
    var dok = dokMap[dokId];
    if (!dok) { noDokumen++; return; }
    totalWithDokumen++;

    var t1 = new Date(dok.created_at || '');
    var t2 = new Date(v.created_at || '');
    if (!isNaN(t1.getTime()) && !isNaN(t2.getTime())) {
      var diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
      if (diff < 0) diff = 0; // guard clock skew
      totalHari += diff;
      if (diff <= slaHari) patuh++; else lewat++;
    }
  });

  var pctPatuh = totalWithDokumen ? Math.round((patuh / totalWithDokumen) * 100) : 0;
  var avgHari = totalWithDokumen ? Number((totalHari / totalWithDokumen).toFixed(1)) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      total_with_dokumen: totalWithDokumen,
      no_dokumen: noDokumen,
      patuh: patuh,
      lewat: lewat,
      pct_patuh: pctPatuh,
      avg_hari: avgHari,
      sla_hari: slaHari
    }
  };
}

// ============================================================
// E2 — SLA Upload vs T_JADWAL
// ============================================================
// FIX v1.0.6: pakai buildDeadlineMap_ (dual-map).
// Return: { tahun, total, total_with_deadline, no_deadline, patuh, lewat,
//           pct_patuh, avg_telat_hari }
// ============================================================
function evaluasiSlaUpload_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var dm = buildDeadlineMap_(tahun);

  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  var total = list.length;
  var totalWithDl = 0;
  var noDl = 0;
  var patuh = 0, lewat = 0, totalTelat = 0;

  list.forEach(function (r) {
    // Priority: per-dokumen deadline → per-jenis deadline
    var dl = dm.byDokumen[String(r.id).trim()]
          || dm.byJenis[String(r.jenis_dokumen_id || '').trim()];
    if (!dl) { noDl++; return; }

    totalWithDl++;
    var tglUpload = CoreLib.dateKey10(r.created_at) || '';
    if (tglUpload) {
      if (tglUpload <= dl) patuh++;
      else {
        lewat++;
        var diff = Math.round((new Date(tglUpload) - new Date(dl)) / (1000 * 60 * 60 * 24));
        if (diff > 0) totalTelat += diff;
      }
    }
  });

  var pctPatuh = totalWithDl ? Math.round((patuh / totalWithDl) * 100) : 0;
  var avgTelat = lewat ? Number((totalTelat / lewat).toFixed(1)) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      total_with_deadline: totalWithDl,
      no_deadline: noDl,
      patuh: patuh,
      lewat: lewat,
      pct_patuh: pctPatuh,
      avg_telat_hari: avgTelat
    }
  };
}

// ============================================================
// E3 — Kelengkapan Metadata
// ============================================================
// Return: { tahun, total, lengkap, pct_lengkap, missing{tanpa_file,...}, rincian[] }
// ============================================================
function evaluasiKelengkapan_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  var total = list.length;
  var missing = { tanpa_file: 0, tanpa_pegawai: 0, tanpa_jenis: 0, tanpa_tahun: 0, tanpa_judul: 0 };
  var rincian = [];

  list.forEach(function (r) {
    var issues = [];
    if (!String(r.file_drive_id || '').trim()) { missing.tanpa_file++; issues.push('tanpa file_drive_id'); }
    if (!String(r.pegawai_id || '').trim()) { missing.tanpa_pegawai++; issues.push('tanpa pegawai_id'); }
    if (!String(r.jenis_dokumen_id || '').trim()) { missing.tanpa_jenis++; issues.push('tanpa jenis_dokumen_id'); }
    if (!String(r.tahun || '').trim()) { missing.tanpa_tahun++; issues.push('tanpa tahun'); }
    if (!String(r.judul || '').trim()) { missing.tanpa_judul++; issues.push('tanpa judul'); }
    if (issues.length) {
      rincian.push({
        id: r.id,
        pegawai_id: r.pegawai_id,
        jenis_dokumen_id: r.jenis_dokumen_id,
        issues: issues
      });
    }
  });

  var lengkap = total - rincian.length;
  var pctLengkap = total ? Math.round((lengkap / total) * 100) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      lengkap: lengkap,
      pct_lengkap: pctLengkap,
      pct_missing: total ? Math.round((rincian.length / total) * 100) : 0,
      missing: missing,
      rincian: rincian.slice(0, 100)
    }
  };
}

// ============================================================
// E4 — Format File
// ============================================================
// Regex: <tahun 4 digit>_<KODE/JENIS>_<PEGAWAI>[_<bulan 1-2 digit>].pdf
// Case-insensitive (/i) agar ramah nama file yang di-uppercase atau lower.
// Return: { tahun, total, patuh, tidak_patuh, pct_patuh, regex, rincian[] }
// ============================================================
function evaluasiFormat_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  var total = list.length;
  var invalid = [];
  var regexNama = /^\d{4}_[A-Z0-9_]+_[A-Z0-9\-]+(_\d{1,2})?\.pdf$/i;

  list.forEach(function (r) {
    var issues = [];
    var fn = String(r.file_name || '').trim();
    var mime = String(r.file_mime || '').toLowerCase();

    if (mime && mime.indexOf('pdf') === -1) issues.push('mime bukan PDF: ' + r.file_mime);
    if (r.file_size && Number(r.file_size) > 10 * 1024 * 1024) issues.push('size >10MB');
    if (fn && !regexNama.test(fn)) issues.push('nama tidak standar: ' + fn);

    if (issues.length) {
      invalid.push({
        id: r.id,
        file_name: r.file_name,
        file_size: r.file_size,
        file_mime: r.file_mime,
        issues: issues
      });
    }
  });

  var patuh = total - invalid.length;
  var pctPatuh = total ? Math.round((patuh / total) * 100) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      patuh: patuh,
      tidak_patuh: invalid.length,
      pct_patuh: pctPatuh,
      regex: regexNama.source,
      rincian: invalid.slice(0, 100)
    }
  };
}

// ============================================================
// E5 — Kepatuhan Jenis (reuse L11)
// ============================================================
function evaluasiKepatuhanJenis_(params) {
  return lapKepatuhanUpload_(params);
}

// ============================================================
// E6 — Kadaluarsa tanpa BA
// ============================================================
// Return: { tahun, total_kadaluarsa, dengan_ba, tanpa_ba, list[] }
// - total_kadaluarsa = dokumen tahun ≤ (tahunNow - 5)
// - tanpa_ba          = belum ada RTL E6 (BA musnah)
// ============================================================
function evaluasiKadaluarsa_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var tahunNow = Number(tahun);
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return Number(r.tahun) <= tahunNow - 5; });

  // Pre-index RTL by dokumen_terkait (split koma karena bisa multiple)
  var rtlByDok = {};
  getSheetData_('T_TINDAK_LANJUT').forEach(function (rtl) {
    var sumber = String(rtl.sumber_evaluasi || '').toUpperCase();
    if (sumber !== 'E6') return;
    var terkait = String(rtl.dokumen_terkait || '');
    if (!terkait) return;
    terkait.split(',').forEach(function (d) {
      var key = String(d).trim();
      if (key) rtlByDok[key] = (rtlByDok[key] || 0) + 1;
    });
  });

  var tanpaBA = list.filter(function (r) {
    return !rtlByDok[String(r.id).trim()];
  });

  return {
    success: true,
    data: {
      tahun: tahun,
      total_kadaluarsa: list.length,
      dengan_ba: list.length - tanpaBA.length,
      tanpa_ba: tanpaBA.length,
      list: tanpaBA.slice(0, 100).map(function (r) {
        return {
          id: r.id,
          pegawai_id: r.pegawai_id,
          jenis_dokumen_id: r.jenis_dokumen_id,
          tahun: r.tahun
        };
      })
    }
  };
}

// ============================================================
// E7 — Fisik (real, pakai field lokasi_fisik)
// ============================================================
// Return: { tahun, total, ada_lokasi, tanpa_lokasi, pct_ada, pct_tanpa, note }
// ============================================================
function evaluasiFisik_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  var tanpaLokasi = list.filter(function (r) { return !String(r.lokasi_fisik || '').trim(); });
  var adaLokasi = list.length - tanpaLokasi.length;
  var pctTanpa = list.length ? Math.round((tanpaLokasi.length / list.length) * 100) : 0;
  var pctAda = list.length ? Math.round((adaLokasi / list.length) * 100) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: list.length,
      ada_lokasi: adaLokasi,
      tanpa_lokasi: tanpaLokasi.length,
      pct_ada: pctAda,
      pct_tanpa: pctTanpa,
      note: 'Isi kolom lokasi_fisik di T_DOKUMEN untuk tracking fisik arsip'
    }
  };
}

// ============================================================
// E8 — Alih Media
// ============================================================
// Return: { tahun, total, digital, pct_digital, total_lampiran,
//           rekap[{jenis_dokumen_id, total, digital, pct}] }
// ============================================================
function evaluasiAlihMedia_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var lampiran = getSheetData_('T_LAMPIRAN').filter(function (l) {
    var t = CoreLib.dateKey10(l.created_at) || '';
    return !tahun || t.indexOf(tahun) === 0;
  });

  var total = list.length;
  var sudahDigital = list.filter(function (r) { return String(r.file_drive_id || '').trim(); }).length;
  var pctDigital = total ? Math.round((sudahDigital / total) * 100) : 0;

  var perJenis = {};
  list.forEach(function (r) {
    var k = String(r.jenis_dokumen_id || 'tanpa').trim() || 'tanpa';
    if (!perJenis[k]) perJenis[k] = { total: 0, digital: 0 };
    perJenis[k].total++;
    if (String(r.file_drive_id || '').trim()) perJenis[k].digital++;
  });

  var rekap = Object.keys(perJenis).map(function (k) {
    var m = perJenis[k];
    return {
      jenis_dokumen_id: k,
      total: m.total,
      digital: m.digital,
      pct: m.total ? Math.round((m.digital / m.total) * 100) : 0
    };
  });
  rekap.sort(function (a, b) { return a.pct - b.pct || b.total - a.total; });

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      digital: sudahDigital,
      pct_digital: pctDigital,
      total_lampiran: lampiran.length,
      rekap: rekap
    }
  };
}
