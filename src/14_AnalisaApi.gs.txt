// SIDOKUMEN - 14_AnalisaApi.gs (v1.0.4 — A3/A4/A5)
// ============================================================
// Changelog:
//   v1.0.4 — Fix analisaBebanPejabat_: field `lewat` sekarang dihitung
//            (status menunggu/baru + created_at > 3 hari). Tambah `pct` per baris.
//            Fix analisaTopPengirim_: pre-index pegawaiMap (dari O(n²) ke O(n)).
//            Fix analisaDistribusiUnit_: tambah `unit_nama` via UNIT_KERJA lookup.
//            Normalisasi .trim() pada semua ID.
//   v1.6   — A3/A4/A5 initial.
// ============================================================

// ============================================================
// A3 — Distribusi Unit
// ============================================================
// Return: { tahun, total, distribusi[{unit_id, unit_nama, jumlah}], total_beban }
// distribusi top 8 unit (sorted jumlah DESC)
function analisaDistribusiUnit_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  // Pre-index pegawai → unit_id
  var pegawaiMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) {
    pegawaiMap[String(p.pegawai_id).trim()] = String(p.unit_id || 'tanpa').trim();
  });

  // Pre-index unit_id → nama_unit (untuk label)
  var unitNamaMap = {};
  getSheetData_('UNIT_KERJA').forEach(function (u) {
    var uid = String(u.unit_id).trim();
    if (uid) unitNamaMap[uid] = u.nama_unit || u.nama || uid;
  });

  var map = {};
  list.forEach(function (r) {
    var k = pegawaiMap[String(r.pegawai_id).trim()] || 'tanpa';
    map[k] = (map[k] || 0) + 1;
  });

  var distribusi = Object.keys(map).map(function (k) {
    return {
      unit_id: k,
      unit_nama: unitNamaMap[k] || k,
      jumlah: map[k]
    };
  });
  distribusi.sort(function (a, b) { return b.jumlah - a.jumlah; });

  return {
    success: true,
    data: {
      tahun: tahun,
      total: list.length,
      distribusi: distribusi.slice(0, 8),
      total_beban: list.length
    }
  };
}

// ============================================================
// A4 — Top Pengirim (Pegawai)
// ============================================================
// Return: { tahun, total, top[{pegawai_id, nama, jumlah, pct}] }
// top 10 pegawai (sorted jumlah DESC)
function analisaTopPengirim_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  // Pre-index pegawai_id → nama (hindari findRecordById_ O(n) per item)
  var pegawaiNamaMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) {
    var key = String(p.pegawai_id).trim();
    pegawaiNamaMap[key] = p.nama || p.nama_lengkap || key;
  });

  var map = {};
  list.forEach(function (r) {
    var k = String(r.pegawai_id || 'tanpa').trim();
    map[k] = (map[k] || 0) + 1;
  });

  var total = list.length;
  var top = Object.keys(map).map(function (k) {
    return {
      pegawai_id: k,
      nama: pegawaiNamaMap[k] || k,
      jumlah: map[k],
      pct: total ? Math.round((map[k] / total) * 100) : 0
    };
  });
  top.sort(function (a, b) { return b.jumlah - a.jumlah; });

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      top: top.slice(0, 10)
    }
  };
}

// ============================================================
// A5 — Beban Pejabat (per pegawai/uploader)
// ============================================================
// Return: { tahun, total, beban[{pegawai_id, nama, diteruskan, diproses,
//           selesai, lewat, jumlah, pct}] }
//
// FIX v1.0.4:
//   - `lewat` sekarang dihitung: status menunggu/baru + created_at > 3 hari (SLA)
//   - Tambah `pct` = jumlah / total × 100
//   - Pre-index pegawaiMap untuk nama (hindari O(n²))
//   - Normalisasi .trim() pada semua ID
//
// Semantik field:
//   - diteruskan = total dokumen yang di-upload pegawai ini
//   - selesai    = status 'disetujui'
//   - diproses   = status 'menunggu' atau 'baru'
//   - lewat      = diproses yang created_at > 3 hari (SLA)
//   - jumlah     = sama dengan diteruskan (backward-compat frontend)
// ============================================================
function analisaBebanPejabat_(params) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var list = getSheetData_('T_DOKUMEN').filter(function (r) { return String(r.tahun) === String(tahun); });

  // Pre-index pegawai_id → nama
  var pegawaiNamaMap = {};
  getSheetData_('PEGAWAI').forEach(function (p) {
    var key = String(p.pegawai_id).trim();
    pegawaiNamaMap[key] = p.nama || p.nama_lengkap || key;
  });

  var SLA_HARI = 3;
  var now = new Date();
  var map = {};

  list.forEach(function (r) {
    var k = String(r.pegawai_id || 'tanpa').trim();
    if (!map[k]) map[k] = { diteruskan: 0, diproses: 0, selesai: 0, lewat: 0 };
    map[k].diteruskan++;

    var status = String(r.status || '').toLowerCase();
    if (status === 'disetujui') {
      map[k].selesai++;
    } else if (status === 'menunggu' || status === 'baru' || status === 'revisi') {
      map[k].diproses++;

      // SLA: created_at > SLA_HARI dari sekarang
      var created = r.created_at || '';
      if (created) {
        var t = new Date(created);
        if (!isNaN(t.getTime())) {
          var diffDays = Math.floor((now - t) / (1000 * 60 * 60 * 24));
          if (diffDays > SLA_HARI) map[k].lewat++;
        }
      }
    }
  });

  var total = list.length;
  var beban = Object.keys(map).map(function (k) {
    var m = map[k];
    return {
      pegawai_id: k,
      nama: pegawaiNamaMap[k] || k,
      diteruskan: m.diteruskan,
      diproses: m.diproses,
      selesai: m.selesai,
      lewat: m.lewat,
      jumlah: m.diteruskan,
      pct: total ? Math.round((m.diteruskan / total) * 100) : 0
    };
  });
  beban.sort(function (a, b) { return b.jumlah - a.jumlah; });

  return {
    success: true,
    data: {
      tahun: tahun,
      total: total,
      sla_hari: SLA_HARI,
      beban: beban.slice(0, 10)
    }
  };
}
