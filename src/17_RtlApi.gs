// SIDOKUMEN - 17_RtlApi.gs (v1.0.7 — R1-R5 + state machine)
// ============================================================
// RTL: R1 Lengkapi Dokumen, R2 Perbaiki Format, R3 Verifikasi Tertunda,
//      R4 Arsipkan Dokumen Lama, R5 Pembinaan Pegawai
//
// Changelog:
//   v1.0.7 — 
//     - saveTindakLanjut_: BLOKIR update status_rtl langsung (harus via
//       ubah_status_tindak_lanjut untuk patuhi state machine).
//       BLOKIR update judul_rtl (merusak idempotensi generate).
//       Validate progress_pct range 0..100.
//     - ubahStatusTindakLanjut_: idempoten kalau status sama,
//       validate progress_pct range, auto-reset 0 saat batal,
//       auto-set 100 saat selesai.
//     - generateTindakLanjut_: kumpulkan errors[] (bukan silent),
//       return detail per sumber {r1, r2, r3, r4, r5, total},
//       dedup judul case-insensitive (lowercase normalized).
//     - getTindakLanjutList_: filter assigned_to, cap per_page max 100,
//       robust filter tahun (support due_date kosong).
//     - RTL_TRANSISI_LEGAL_: batal sekarang bisa → baru (reaktivasi).
//   v1.9  — R1-R5 initial + state machine.
// ============================================================

// State machine — transisi legal antar status RTL
//   baru      → diproses | batal
//   diproses  → selesai | batal
//   selesai   → (final — tidak bisa berubah)
//   batal     → baru (reaktivasi)
var RTL_TRANSISI_LEGAL_ = {
  'baru':     ['diproses', 'batal'],
  'diproses': ['selesai', 'batal'],
  'selesai':  [],
  'batal':    ['baru']
};

// ============================================================
// LIST + DETAIL
// ============================================================
function getTindakLanjutList_(params) {
  var list = getSheetData_('T_TINDAK_LANJUT');
  var q = String(params.search || '').toLowerCase().trim();

  if (params.status_rtl) list = list.filter(function (r) { return CoreLib.normStr(r.status_rtl) === CoreLib.normStr(params.status_rtl); });
  if (params.sumber_evaluasi) list = list.filter(function (r) { return CoreLib.normStr(r.sumber_evaluasi) === CoreLib.normStr(params.sumber_evaluasi); });
  if (params.assigned_to) list = list.filter(function (r) { return CoreLib.normStr(r.assigned_to) === CoreLib.normStr(params.assigned_to); });

  if (params.tahun) {
    var th = String(params.tahun);
    list = list.filter(function (r) {
      var d = String(r.due_date || '').trim();
      if (!d) return false;
      return d.indexOf(th) === 0 || d.indexOf(th) !== -1;
    });
  }

  if (q) list = list.filter(function (r) { return CoreLib.matchSearch(r, q, ['judul_rtl', 'deskripsi', 'assigned_to', 'catatan']); });

  list.sort(function (a, b) {
    // Prioritas: due_date ASC, lalu created_at DESC
    var da = String(a.due_date || '').trim();
    var db = String(b.due_date || '').trim();
    if (da && db && da !== db) return da.localeCompare(db);
    if (da && !db) return -1;
    if (!da && db) return 1;
    return (b.created_at || '').localeCompare(a.created_at || '');
  });

  var page = Number(params.page) || 1;
  var per = Math.min(Number(params.per_page) || 10, 100); // cap 100
  var pag = CoreLib.paginate(list, page, per);

  return { success: true, data: pag.data, total: pag.meta.total, total_pages: pag.meta.total_pages, page: pag.meta.page };
}

function getTindakLanjutDetail_(params) {
  var id = params.id;
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  var rec = findRecordById_('T_TINDAK_LANJUT', id);
  if (!rec) return { success: false, code: 'NOT_FOUND', error: 'RTL tidak ditemukan.' };
  return { success: true, data: rec };
}

// ============================================================
// SAVE (create/update meta saja — status_rtl TIDAK BOLEH diubah di sini)
// ============================================================
// FIX v1.0.7:
//   - Saat update (ada rec.id): BLOKIR perubahan status_rtl & judul_rtl
//   - Validate progress_pct 0..100
//   - Status default baru hanya saat create
// ============================================================
function saveTindakLanjut_(params, actor) {
  var rec = params.record || params;
  if (!rec.judul_rtl) return { success: false, code: 'BAD_REQUEST', error: 'Judul RTL wajib.' };

  var isUpdate = !!rec.id;
  if (isUpdate) {
    var old = findRecordById_('T_TINDAK_LANJUT', rec.id);
    if (!old) return { success: false, code: 'NOT_FOUND', error: 'RTL tidak ditemukan.' };

    // Blokir perubahan status_rtl via save — harus pakai ubah_status_tindak_lanjut
    if (rec.status_rtl && String(rec.status_rtl).toLowerCase() !== String(old.status_rtl || 'baru').toLowerCase()) {
      return { success: false, code: 'BAD_REQUEST', error: 'Ubah status_rtl via save_tindak_lanjut tidak diizinkan. Gunakan ubah_status_tindak_lanjut.' };
    }
    // Blokir perubahan judul_rtl (merusak idempotensi generate)
    if (String(rec.judul_rtl).trim() !== String(old.judul_rtl || '').trim()) {
      return { success: false, code: 'BAD_REQUEST', error: 'Judul RTL tidak boleh diubah setelah dibuat (idempotensi R1-R5).' };
    }

    // Paksa status_rtl tetap nilai lama
    rec.status_rtl = old.status_rtl || 'baru';
  } else {
    if (!rec.sumber_evaluasi) rec.sumber_evaluasi = 'manual';
    if (!rec.status_rtl) rec.status_rtl = 'baru';
    if (!rec.progress_pct) rec.progress_pct = 0;
  }

  // Validate progress_pct range
  if (rec.progress_pct !== undefined && rec.progress_pct !== '') {
    var p = Number(rec.progress_pct);
    if (isNaN(p) || p < 0 || p > 100) {
      return { success: false, code: 'BAD_REQUEST', error: 'progress_pct harus 0..100.' };
    }
    rec.progress_pct = p;
  }

  try {
    var saved = saveRecord_('T_TINDAK_LANJUT', rec, actor);
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

// ============================================================
// DELETE (soft)
// ============================================================
function deleteTindakLanjut_(params, actor) {
  var id = params.id;
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  try { softDeleteRecord_('T_TINDAK_LANJUT', id, actor); return { success: true, data: { id: id } }; }
  catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

// ============================================================
// UBAH STATUS — SATU-SATUNYA jalur sah untuk transisi state_rtl
// ============================================================
// FIX v1.0.7:
//   - Idempoten: status sama → return success tanpa perubahan
//   - Validate progress_pct range
//   - Auto-set progress_pct 100 saat selesai (jika tidak dikirim)
//   - Auto-reset progress_pct 0 saat batal (jika tidak dikirim)
// ============================================================
function ubahStatusTindakLanjut_(params, actor) {
  var id = params.id;
  var statusBaru = params.status_rtl || params.status_baru;
  var progress = params.progress_pct;
  var catatan = params.catatan || '';

  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  if (!statusBaru) return { success: false, code: 'BAD_REQUEST', error: 'Status baru wajib.' };

  var old = findRecordById_('T_TINDAK_LANJUT', id);
  if (!old) return { success: false, code: 'NOT_FOUND', error: 'RTL tidak ditemukan.' };

  var oldStatus = String(old.status_rtl || 'baru').toLowerCase().trim();
  var newStatus = String(statusBaru).toLowerCase().trim();

  // Idempoten: status sama → return success (update catatan saja bila ada)
  if (oldStatus === newStatus) {
    var recSame = { id: id, status_rtl: oldStatus };
    if (catatan) recSame.catatan = catatan;
    if (progress !== undefined && progress !== '') {
      var pSame = Number(progress);
      if (isNaN(pSame) || pSame < 0 || pSame > 100) return { success: false, code: 'BAD_REQUEST', error: 'progress_pct harus 0..100.' };
      recSame.progress_pct = pSame;
    }
    try {
      var savedSame = saveRecord_('T_TINDAK_LANJUT', recSame, actor);
      return { success: true, data: savedSame, info: 'Status sudah ' + newStatus + ' — no-op.' };
    } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
  }

  // Cek transisi legal
  var legal = RTL_TRANSISI_LEGAL_[oldStatus] || [];
  if (legal.indexOf(newStatus) === -1) {
    return {
      success: false,
      code: 'BAD_REQUEST',
      error: 'Transisi tidak legal: ' + oldStatus + ' → ' + newStatus + '. Legal: ' + (legal.join(', ') || '(tidak ada)')
    };
  }

  // Susun record
  var rec = { id: id, status_rtl: newStatus };
  rec.catatan = catatan || old.catatan || '';

  if (progress !== undefined && progress !== '') {
    var p = Number(progress);
    if (isNaN(p) || p < 0 || p > 100) return { success: false, code: 'BAD_REQUEST', error: 'progress_pct harus 0..100.' };
    rec.progress_pct = p;
  } else if (newStatus === 'selesai') {
    rec.progress_pct = 100;
  } else if (newStatus === 'batal') {
    rec.progress_pct = 0;
  }

  try {
    var saved = saveRecord_('T_TINDAK_LANJUT', rec, actor);
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

// ============================================================
// GENERATE R1-R5 (idempoten dedup judul, case-insensitive)
// ============================================================
// FIX v1.0.7:
//   - Kumpulkan errors[] dari setiap sumber (tidak silent)
//   - Return detail per sumber: { r1, r2, r3, r4, r5, total, errors[] }
//   - Dedup judul case-insensitive (lowercase normalized)
// ============================================================
function generateTindakLanjut_(params, actor) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var sumber = params.sumber_evaluasi || 'semua';

  var existing = getSheetData_('T_TINDAK_LANJUT');
  var existingJudul = {};
  existing.forEach(function (r) {
    var key = String(r.judul_rtl || '').trim().toLowerCase();
    if (key) existingJudul[key] = true;
  });

  var detail = { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 };
  var errors = [];

  function tryGenerate_(kode, judul, recordFactory) {
    var key = String(judul).trim().toLowerCase();
    if (existingJudul[key]) return false;
    try {
      saveRecord_('T_TINDAK_LANJUT', recordFactory(), actor);
      existingJudul[key] = true;
      detail[kode]++;
      return true;
    } catch (e) {
      errors.push(kode + ': ' + e.message);
      return false;
    }
  }

  // R1 — Lengkapi Dokumen (dari E3 belum_lengkap)
  if (sumber === 'semua' || sumber === 'E3') {
    try {
      var rekapPegawai = lapRekapPegawai_({ tahun: tahun });
      (rekapPegawai.data.belum_lengkap || []).forEach(function (b) {
        var judul = 'R1 Lengkapi dokumen ' + b.nama + ' tahun ' + tahun + ' (' + b.pct + '%)';
        tryGenerate_('r1', judul, function () {
          return {
            sumber_evaluasi: 'E3',
            judul_rtl: judul,
            deskripsi: 'Pegawai ' + b.nama + ' baru ' + b.pct + '% lengkap (' + b.jml + '/' + b.total_jenis + '). Kurang: ' + (b.total_jenis - b.jml) + ' jenis.',
            assigned_to: b.pegawai_id,
            due_date: tahun + '-12-31',
            status_rtl: 'baru',
            progress_pct: Math.max(0, Math.min(100, Number(b.pct) || 0)),
            catatan: 'Auto-generate R1 dari E3 kelengkapan'
          };
        });
      });
    } catch (e) { errors.push('E3 source: ' + e.message); }
  }

  // R2 — Perbaiki Format (dari E4)
  if (sumber === 'semua' || sumber === 'E4') {
    try {
      var fmt = evaluasiFormat_({ tahun: tahun });
      (fmt.data.rincian || []).forEach(function (r) {
        var judul = 'R2 Perbaiki format ' + (r.file_name || r.id);
        tryGenerate_('r2', judul, function () {
          return {
            sumber_evaluasi: 'E4',
            judul_rtl: judul,
            deskripsi: 'File bermasalah: ' + (r.issues || []).join(', '),
            assigned_to: '',
            due_date: tahun + '-12-31',
            status_rtl: 'baru',
            progress_pct: 0,
            dokumen_terkait: r.id,
            catatan: 'Auto-generate R2 dari E4 format'
          };
        });
      });
    } catch (e) { errors.push('E4 source: ' + e.message); }
  }

  // R3 — Verifikasi Tertunda (dari E1/A9)
  if (sumber === 'semua' || sumber === 'E1' || sumber === 'A9') {
    try {
      var sla = analisaSlaPejabat_({ tahun: tahun });
      (sla.data.sla || []).forEach(function (s) {
        if (Number(s.lewat) > 0) {
          var judul = 'R3 Verifikasi tertunda — ' + s.nama + ' (' + s.lewat + ' lewat)';
          tryGenerate_('r3', judul, function () {
            return {
              sumber_evaluasi: 'E1',
              judul_rtl: judul,
              deskripsi: 'Verifikator ' + s.nama + ' ada ' + s.lewat + ' verifikasi lewat SLA >' + (sla.data.sla_hari || 3) + ' hari, avg ' + s.avg_hari + ' hari',
              assigned_to: s.verifikator_id,
              due_date: tahun + '-12-15',
              status_rtl: 'baru',
              progress_pct: 0,
              catatan: 'Auto-generate R3 dari E1/A9 SLA'
            };
          });
        }
      });
    } catch (e) { errors.push('E1/A9 source: ' + e.message); }
  }

  // R4 — Arsipkan Dokumen Lama (dari E6)
  if (sumber === 'semua' || sumber === 'E6') {
    try {
      var kdl = evaluasiKadaluarsa_({ tahun: tahun });
      if (Number(kdl.data.tanpa_ba) > 0) {
        var judul = 'R4 Arsipkan dokumen kadaluarsa tahun ' + tahun + ' — ' + kdl.data.tanpa_ba + ' dokumen';
        tryGenerate_('r4', judul, function () {
          return {
            sumber_evaluasi: 'E6',
            judul_rtl: judul,
            deskripsi: 'Ada ' + kdl.data.tanpa_ba + ' dokumen kadaluarsa (≤' + (Number(tahun) - 5) + ') tanpa BA musnah/serah',
            assigned_to: '',
            due_date: tahun + '-12-31',
            status_rtl: 'baru',
            progress_pct: 0,
            catatan: 'Auto-generate R4 dari E6 kadaluarsa'
          };
        });
      }
    } catch (e) { errors.push('E6 source: ' + e.message); }
  }

  // R5 — Pembinaan Pegawai (dari E5 kepatuhan jenis <50%)
  if (sumber === 'semua' || sumber === 'E5') {
    try {
      var kep = evaluasiKepatuhanJenis_({ tahun: tahun });
      var low = (kep.data.rekap || []).filter(function (r) { return Number(r.pct) < 50; });
      if (low.length > 0) {
        var judul = 'R5 Pembinaan pegawai — ' + low.length + ' jenis dokumen kepatuhan <50% tahun ' + tahun;
        tryGenerate_('r5', judul, function () {
          return {
            sumber_evaluasi: 'E5',
            judul_rtl: judul,
            deskripsi: 'Jenis dengan kepatuhan <50%: ' + low.map(function (r) { return r.nama + ' ' + r.pct + '%'; }).join(', '),
            assigned_to: '',
            due_date: tahun + '-12-31',
            status_rtl: 'baru',
            progress_pct: 0,
            catatan: 'Auto-generate R5 dari E5 kepatuhan'
          };
        });
      }
    } catch (e) { errors.push('E5 source: ' + e.message); }
  }

  var totalGenerated = detail.r1 + detail.r2 + detail.r3 + detail.r4 + detail.r5;

  return {
    success: errors.length === 0,
    data: {
      tahun: tahun,
      sumber: sumber,
      generated: totalGenerated,
      detail: detail,
      errors: errors
    },
    // Backward-compat: frontend lama akses `res.data.generated`
    // Tapi juga bisa akses `res.data.detail.r1` dst.
    ...(errors.length ? { code: 'PARTIAL', error: errors.join('; ') } : {})
  };
}
