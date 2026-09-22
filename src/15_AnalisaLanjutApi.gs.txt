// SIDOKUMEN - 15_AnalisaLanjutApi.gs (v1.0.5 — A6-A10)
// ============================================================
// Changelog:
//   v1.0.5 — 
//     - analisaRetensi_: pre-count by year (single pass), tambah `musnah_netto`
//       & `total_dokumen` untuk clarity.
//     - analisaKorelasiJenisUnit_: pre-index pegawaiMap (normalisasi .trim()),
//       single-pass count O(n) dari O(j×u×n), tambah `total` per row jenis.
//     - analisaSlaPejabat_: pre-index T_DOKUMEN & PEGAWAI (dari O(n²) ke O(n)),
//       param `sla_hari` (default 3), hitung `no_dokumen` yang skip,
//       guard clock skew (diff < 0 → 0).
//     - analisaKritisBulanan_: filter jenis dengan periode 'Bulanan' saja,
//       expected = pegawai × jumlah_jenis_bulanan, tambah `pct` per baris,
//       buang unused var `jenisTotal`.
//     - analisaTteRatio_: tidak berubah (placeholder).
//   v1.7 — A6-A10 initial.
// ============================================================

// ============================================================
// A6 — Proyeksi Retensi
// ============================================================
// Return: { tahun, total_dokumen, proyeksi[{tahun, musnah, permanen, musnah_netto}] }
// - musnah       = dokumen dengan tahun ≤ (th - 5) — eligible musnah
// - permanen     = dokumen dengan tahun ≤ (th - 10) — subset musnah (permanen)
// - musnah_netto = musnah - permanen = benar-benar bisa dimusnahkan
// ============================================================
function analisaRetensi_(params) {
  var tahunNow = Number(params.tahun) || new Date().getFullYear();
  var list = getSheetData_('T_DOKUMEN');

  // Pre-count dokumen per tahun (single pass O(n))
  var byYear = {};
  list.forEach(function (r) {
    var y = Number(r.tahun);
    if (!isNaN(y) && y > 0) byYear[y] = (byYear[y] || 0) + 1;
  });
  var years = Object.keys(byYear).map(Number);

  var proyeksi = [];
  for (var i = 0; i < 5; i++) {
    var th = tahunNow + i;
    var musnah = 0, permanen = 0;
    for (var j = 0; j < years.length; j++) {
      var y = years[j];
      if (y <= th - 5) musnah += byYear[y];
      if (y <= th - 10) permanen += byYear[y];
    }
    proyeksi.push({
      tahun: th,
      musnah: musnah,
      permanen: permanen,
      musnah_netto: Math.max(0, musnah - permanen)
    });
  }

  return {
    success: true,
    data: {
      tahun: tahunNow,
      total_dokumen: list.length,
      proyeksi: proyeksi
    }
  };
}

// ============================================================
// A7 — Korelasi Jenis × Unit
// ============================================================
// Return: { tahun, jenis[{id,nama}], units[{id,nama}], matrix[{jenis_id, jenis_nama, total, [unitId]: count}] }
// - jenis: top 5 jenis aktif
// - units: top 8 unit kerja
// - matrix: row per jenis, kolom dinamis [unitId]
// ============================================================
function analisaKorelasiJenisUnit_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  // Pre-index pegawai → unit (normalisasi .trim())
  var pegawaiMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) {
    var pid = String(p.pegawai_id).trim();
    if (pid) pegawaiMap[pid] = String(p.unit_id || 'tanpa').trim();
  });

  // Jenis aktif top 5
  var jenisList = getSheetData_('M_JENIS_DOKUMEN')
    .filter(function (j) { return String(j.status_aktif) !== 'false'; })
    .slice(0, 5);
  var jenisIdSet = {};
  jenisList.forEach(function (j) { jenisIdSet[String(j.id).trim()] = true; });

  // Unit top 8
  var unitMap = {};
  getSheetData_('UNIT_KERJA').forEach(function (u) {
    var uid = String(u.unit_id).trim();
    if (uid) unitMap[uid] = u.nama_unit || u.nama || uid;
  });
  var units = Object.keys(unitMap).slice(0, 8);
  var unitSet = {};
  units.forEach(function (u) { unitSet[u] = true; });

  // Single-pass count O(n)
  var counts = {}; // key: jenisId|unitId
  list.forEach(function (r) {
    var jenisId = String(r.jenis_dokumen_id || '').trim();
    if (!jenisIdSet[jenisId]) return;
    var unitId = pegawaiMap[String(r.pegawai_id).trim()] || 'tanpa';
    if (!unitSet[unitId]) return;
    var k = jenisId + '|' + unitId;
    counts[k] = (counts[k] || 0) + 1;
  });

  var matrix = jenisList.map(function (jenis) {
    var jenisId = String(jenis.id).trim();
    var row = { jenis_id: jenis.id, jenis_nama: jenis.nama, total: 0 };
    units.forEach(function (unitId) {
      var c = counts[jenisId + '|' + unitId] || 0;
      row[unitId] = c;
      row.total += c;
    });
    return row;
  });

  return {
    success: true,
    data: {
      tahun: tahun,
      jenis: jenisList.map(function (j) { return { id: j.id, nama: j.nama }; }),
      units: units.map(function (u) { return { id: u, nama: unitMap[u] || u }; }),
      matrix: matrix
    }
  };
}

// ============================================================
// A8 — TTE Ratio (placeholder)
// ============================================================
// Return: { tahun, total, tte, pct, note }
// Field `tte` belum ada di T_DOKUMEN — placeholder 0% (future G15).
function analisaTteRatio_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  var total = list.length;
  var tte = 0;
  var pct = total ? Math.round((tte / total) * 100) : 0;

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      tte: tte,
      pct: pct,
      note: 'TTE belum ada field — placeholder 0% (future G15)'
    }
  };
}

// ============================================================
// A9 — SLA Pejabat (per verifikator)
// ============================================================
// Return: { tahun, total, sla_hari, sla[{verifikator_id, nama, total, lewat,
//           pct_lewat, avg_hari, no_dokumen}] }
// - `total`      = jumlah verifikasi (yang ada dokumennya)
// - `lewat`      = verifikasi dengan diff > sla_hari
// - `no_dokumen` = verifikasi yang dokumennya sudah terhapus/hilang
// - param sla_hari default 3
// ============================================================
function analisaSlaPejabat_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var slaHari = Number(params.sla_hari) || 3;

  var verifikasi = getSheetData_('T_VERIFIKASI').filter(function (v) {
    var t = CoreLib.dateKey10(v.created_at) || '';
    return !tahun || t.indexOf(tahun) === 0;
  });

  // Pre-index T_DOKUMEN by id (normalisasi)
  var dokMap = {};
  getSheetData_('T_DOKUMEN').forEach(function (d) {
    var did = String(d.id).trim();
    if (did) dokMap[did] = d;
  });

  // Pre-index PEGAWAI by id
  var pegawaiNamaMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) {
    var pid = String(p.pegawai_id).trim();
    if (pid) pegawaiNamaMap[pid] = p.nama || p.nama_lengkap || pid;
  });

  var map = {};
  verifikasi.forEach(function (v) {
    var k = String(v.verifikator_id || 'tanpa').trim();
    if (!map[k]) map[k] = { total: 0, lewat: 0, total_hari: 0, no_dokumen: 0 };

    var dokId = String(v.dokumen_id || '').trim();
    var dok = dokMap[dokId];
    if (!dok) { map[k].no_dokumen++; return; }

    map[k].total++;

    var t1 = new Date(dok.created_at || dok.tanggal || '');
    var t2 = new Date(v.created_at || '');
    if (!isNaN(t1.getTime()) && !isNaN(t2.getTime())) {
      var diff = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
      if (diff < 0) diff = 0; // guard clock skew
      map[k].total_hari += diff;
      if (diff > slaHari) map[k].lewat++;
    }
  });

  var sla = Object.keys(map).map(function (k) {
    var m = map[k];
    var avg = m.total ? Number((m.total_hari / m.total).toFixed(1)) : 0;
    var pctLewat = m.total ? Math.round((m.lewat / m.total) * 100) : 0;
    return {
      verifikator_id: k,
      nama: pegawaiNamaMap[k] || k,
      total: m.total,
      lewat: m.lewat,
      pct_lewat: pctLewat,
      avg_hari: avg,
      no_dokumen: m.no_dokumen
    };
  });
  sla.sort(function (a, b) { return b.lewat - a.lewat || b.total - a.total; });

  return {
    success: true,
    data: {
      tahun: tahun,
      total: verifikasi.length,
      sla_hari: slaHari,
      sla: sla.slice(0, 8)
    }
  };
}

// ============================================================
// A10 — Kritis Bulanan
// ============================================================
// Return: { tahun, total, total_bulanan, total_pegawai, total_jenis_bulanan,
//           expected_per_bulan, rekap[{bulan, nama_bulan, jml, expected, belum, pct}] }
// FIX v1.0.5:
//   - Filter jenis dengan periode 'Bulanan' saja untuk expected
//   - expected = pegawai × jumlah_jenis_bulanan (bukan hardcode × 1)
//   - Tambah `pct` per baris
//   - Buang var `jenisTotal` (unused)
// ============================================================
function analisaKritisBulanan_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  // Jenis dengan periode Bulanan + aktif
  var jenisBulanan = getSheetData_('M_JENIS_DOKUMEN').filter(function (j) {
    if (String(j.status_aktif) === 'false') return false;
    return String(j.periode || '').toLowerCase() === 'bulanan';
  });
  var jenisBulananSet = {};
  jenisBulanan.forEach(function (j) { jenisBulananSet[String(j.id).trim()] = true; });
  var jumlahJenisBulanan = jenisBulanan.length;

  var pegawaiTotal = getSheetData_('PEGAWAI').length || 1;

  // Hitung per bulan (hanya dokumen jenis bulanan bila ada)
  var bulanMap = {};
  for (var b = 1; b <= 12; b++) bulanMap[b] = 0;
  var countBulanan = 0;

  list.forEach(function (r) {
    var bl = Number(r.bulan) || 0;
    if (bl < 1 || bl > 12) return;
    var jenisId = String(r.jenis_dokumen_id || '').trim();
    // Kalau ada jenis bulanan terdaftar, filter
    if (jumlahJenisBulanan > 0 && !jenisBulananSet[jenisId]) return;
    bulanMap[bl]++;
    countBulanan++;
  });

  var expected = pegawaiTotal * (jumlahJenisBulanan || 1);
  var namaBulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  var rekap = [];
  for (var i = 1; i <= 12; i++) {
    var jml = bulanMap[i] || 0;
    var belum = Math.max(0, expected - jml);
    var pct = expected ? Math.round((jml / expected) * 100) : 0;
    rekap.push({
      bulan: i,
      nama_bulan: namaBulan[i - 1],
      jml: jml,
      expected: expected,
      belum: belum,
      pct: pct
    });
  }

  return {
    success: true,
    data: {
      tahun: tahun,
      total: list.length,
      total_bulanan: countBulanan,
      total_pegawai: pegawaiTotal,
      total_jenis_bulanan: jumlahJenisBulanan,
      expected_per_bulan: expected,
      rekap: rekap
    }
  };
}
