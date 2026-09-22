// SIDOKUMEN - 13_LaporanRekapApi.gs (v1.0.3 — L4/L5/L6/L11/L12)
// ============================================================
// L4 per Jenis, L5 per Unit, L6 per Pegawai, L11 Kepatuhan Upload, L12 Laporan Khas 7 sheet
//
// Changelog:
//   v1.0.3 — Fix lapKepatuhanUpload_: pakai buildDeadlineMap_ (dual-map byDokumen+byJenis)
//            dari 10_LaporanApi.gs. Hapus fallback blanket Jan-31. Tambah field
//            total_with_deadline & no_deadline per row.
//            Fix laporanExportKhas_: ss.getUrl() + try-catch removeFile.
//   v1.0.2 — Support filter unit_id di lapRekapPegawai_.
//   v1.0.1 — Return shape sesuai frontend V_Laporan.
//   v1.0.0 — Initial.
//
// ⚠️ DEPENDENCY: file ini memanggil buildDeadlineMap_() yang didefinisikan di 10_LaporanApi.gs.
//    Pastikan 10_LaporanApi.gs ada di project GAS.
// ============================================================

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
  getSheetData_('PEGAWAI').forEach(function (p) { pegawaiMap[String(p.pegawai_id).trim()] = String(p.unit_id || 'tanpa').trim(); });

  var map = {};
  list.forEach(function (r) {
    var unit = pegawaiMap[String(r.pegawai_id).trim()] || 'tanpa';
    map[unit] = (map[unit] || 0) + 1;
  });
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

  // Hitung dokumen per pegawai (hanya jenis aktif)
  var jenisAktifId = {};
  jenisList.forEach(function (j) { jenisAktifId[String(j.id).trim()] = true; });

  var map = {};
  list.forEach(function (r) {
    var jenisId = String(r.jenis_dokumen_id || '').trim();
    if (!jenisAktifId[jenisId]) return; // skip dokumen jenis tidak aktif
    var k = String(r.pegawai_id).trim();
    map[k] = (map[k] || 0) + 1;
  });

  var rekap = pegawaiList.map(function (p) {
    var key = String(p.pegawai_id).trim();
    var jml = map[key] || 0;
    var pct = Math.min(100, Math.round((jml / totalJenis) * 100));
    return {
      pegawai_id: p.pegawai_id,
      nama: p.nama || p.nama_lengkap || p.pegawai_id,
      nip: p.nip || '',
      unit_id: p.unit_id || '',
      jml: jml,
      total_jenis: totalJenis,
      pct: pct
    };
  });
  rekap.sort(function (a, b) { return b.pct - a.pct || a.nama.localeCompare(b.nama); });

  var belum = rekap.filter(function (r) { return r.pct < 100; });
  var lengkap = rekap.filter(function (r) { return r.pct >= 100; });

  return {
    success: true,
    data: {
      tahun: tahun,
      total_pegawai: pegawaiList.length,
      total_jenis: totalJenis,
      total_dokumen: list.length,
      rekap: rekap,
      belum_lengkap: belum,
      lengkap: lengkap
    }
  };
}

// ============================================================
// L11 — Kepatuhan Upload per Jenis
// ============================================================
// FIX v1.0.3:
// - Pakai buildDeadlineMap_(tahun) dari 10_LaporanApi.gs → { byDokumen, byJenis }
// - Prioritas deadline: byDokumen[dokId] → byJenis[jenisId] → skip (bukan blanket)
// - Tambah field total_with_deadline & no_deadline supaya transparan
// - pct dihitung dari total_with_deadline (bukan total) agar tidak misleading
// ============================================================
function lapKepatuhanUpload_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var dm = buildDeadlineMap_(tahun);
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });
  var jenisList = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) { return String(j.status_aktif) !== 'false'; });

  var rekap = jenisList.map(function (jenis) {
    var jenisId = String(jenis.id).trim();
    var jenisKode = String(jenis.kode || '').trim();
    var docs = list.filter(function (r) { return String(r.jenis_dokumen_id).trim() === jenisId; });

    var total = docs.length;
    var totalWithDl = 0;
    var tepatWaktu = 0;
    var noDeadline = 0;

    docs.forEach(function (r) {
      // Prioritas: deadline per-dokumen → per-jenis (id → kode)
      var dl = dm.byDokumen[String(r.id).trim()]
            || dm.byJenis[jenisId]
            || dm.byJenis[jenisKode];
      if (!dl) { noDeadline++; return; }
      totalWithDl++;
      var tglUpload = CoreLib.dateKey10(r.created_at) || '';
      if (tglUpload && tglUpload <= dl) tepatWaktu++;
    });

    var pct = totalWithDl ? Math.round((tepatWaktu / totalWithDl) * 100) : 0;
    return {
      jenis_dokumen_id: jenis.id,
      kode: jenis.kode,
      nama: jenis.nama,
      total: total,
      total_with_deadline: totalWithDl,
      tepat_waktu: tepatWaktu,
      no_deadline: noDeadline,
      pct: pct
    };
  });

  // Sort: dengan deadline dulu, pct turun
  rekap.sort(function (a, b) {
    if (a.total_with_deadline === 0 && b.total_with_deadline > 0) return 1;
    if (b.total_with_deadline === 0 && a.total_with_deadline > 0) return -1;
    return b.pct - a.pct;
  });

  var total = list.length;
  var totalWithDlAll = rekap.reduce(function (s, r) { return s + r.total_with_deadline; }, 0);
  var totalTepat = rekap.reduce(function (s, r) { return s + r.tepat_waktu; }, 0);
  var totalNoDl = rekap.reduce(function (s, r) { return s + r.no_deadline; }, 0);
  var pctTotal = totalWithDlAll ? Math.round((totalTepat / totalWithDlAll) * 100) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      total_with_deadline: totalWithDlAll,
      tepat_waktu: totalTepat,
      no_deadline: totalNoDl,
      pct: pctTotal,
      rekap: rekap
    }
  };
}

// ============================================================
// L12 — Laporan Khas 7 sheet
// ============================================================
function laporanKhasData_(params) {
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
  var tahun = params.tahun || String(new Date().getFullYear());
  var data = laporanKhasData_({ tahun: tahun }).data;

  try {
    var folderName = 'SIDOKUMEN Export';
    var folder = getOrCreateFolder_(folderName);
    var ssName = 'SIDOKUMEN_KHAS_' + tahun + '_' + String(Date.now()).slice(-6);
    var ss = SpreadsheetApp.create(ssName);

    // Pindah dari root ke folder — removeFile dalam try-catch (kalau gagal, file tetap ada di 2 lokasi, tidak fatal)
    try {
      var file = DriveApp.getFileById(ss.getId());
      folder.addFile(file);
      try { DriveApp.getRootFolder().removeFile(file); } catch (e) { Logger.log('[ExportKhas] removeFile warn: ' + e.message); }
    } catch (e) {
      Logger.log('[ExportKhas] folder move warn: ' + e.message);
    }

    // Sheet 1 Cover
    var shCover = ss.getActiveSheet();
    shCover.setName('Cover');
    shCover.getRange(1, 1).setValue('LAPORAN KHAS SIDOKUMEN — SATPOL PP & DAMKAR KAB. TRENGGALEK');
    shCover.getRange(2, 1).setValue('Tahun: ' + tahun);
    shCover.getRange(3, 1).setValue('Generated: ' + data.generated_at + ' oleh ' + ((actor && (actor.email || actor.id)) || ''));
    shCover.getRange(5, 1).setValue('Top 5 Jenis Dokumen');
    (data.top5_jenis || []).forEach(function (r, i) {
      shCover.getRange(6 + i, 1).setValue(r.jenis_dokumen_id + ' — ' + r.jml + ' (' + r.pct + '%)');
    });

    // Sheet 2 Ringkasan
    var shRing = ss.insertSheet('Ringkasan');
    shRing.getRange(1, 1, 1, 4).setValues([['Tahun', 'Total Dokumen', 'Total Pegawai', '% Lengkap']]);
    shRing.getRange(2, 1, 1, 4).setValues([[
      tahun,
      (data.pegawai && data.pegawai.total_dokumen) || 0,
      (data.pegawai && data.pegawai.total_pegawai) || 0,
      ((data.kepatuhan && data.kepatuhan.pct) || 0) + '%'
    ]]);

    // Sheet 3 Rekap Jenis
    var shJenis = ss.insertSheet('Rekap Jenis');
    shJenis.getRange(1, 1, 1, 3).setValues([['Jenis', 'Jumlah', '%']]);
    (data.klasifikasi && data.klasifikasi.rekap || []).forEach(function (r, i) {
      shJenis.getRange(2 + i, 1, 1, 3).setValues([[r.jenis_dokumen_id, r.jml, r.pct + '%']]);
    });

    // Sheet 4 Rekap Unit
    var shUnit = ss.insertSheet('Rekap Unit');
    shUnit.getRange(1, 1, 1, 2).setValues([['Unit', 'Jumlah']]);
    (data.unit && data.unit.rekap || []).forEach(function (r, i) {
      shUnit.getRange(2 + i, 1, 1, 2).setValues([[r.unit_id, r.jml]]);
    });

    // Sheet 5 Rekap Pegawai
    var shPeg = ss.insertSheet('Rekap Pegawai');
    shPeg.getRange(1, 1, 1, 4).setValues([['Pegawai', 'NIP', 'Jml', '%']]);
    (data.pegawai && data.pegawai.rekap || []).forEach(function (r, i) {
      shPeg.getRange(2 + i, 1, 1, 4).setValues([[r.nama, r.nip, r.jml, r.pct + '%']]);
    });

    // Sheet 6 Kepatuhan
    var shPat = ss.insertSheet('Kepatuhan');
    shPat.getRange(1, 1, 1, 4).setValues([['Jenis', 'Total', 'Tepat Waktu', '%']]);
    (data.kepatuhan && data.kepatuhan.rekap || []).forEach(function (r, i) {
      shPat.getRange(2 + i, 1, 1, 4).setValues([[r.nama, r.total_with_deadline, r.tepat_waktu, r.pct + '%']]);
    });

    // Sheet 7 TTD
    var shTtd = ss.insertSheet('TTD');
    shTtd.getRange(1, 1).setValue('Mengetahui,');
    shTtd.getRange(2, 1).setValue('Kasat Pol PP dan Damkar');
    shTtd.getRange(5, 1).setValue('Trenggalek, ' + CoreLib.dateKey10(new Date().toISOString()));

    return {
      success: true,
      data: {
        tahun: tahun,
        file_id: ss.getId(),
        file_url: ss.getUrl(),
        sheets: 7,
        generated_at: data.generated_at
      }
    };
  } catch (e) {
    return { success: false, code: 'BAD_REQUEST', error: 'Gagal export khas: ' + e.message };
  }
}
