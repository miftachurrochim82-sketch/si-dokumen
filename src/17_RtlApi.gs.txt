// SIDOKUMEN - 17_RtlApi.gs (v1.9 — R1-R5 + UIUX v1.10 polish)
// RTL: R1 Lengkapi Dokumen, R2 Perbaiki Format, R3 Verifikasi Tertunda, R4 Arsipkan Dokumen Lama, R5 Pembinaan Pegawai

var RTL_TRANSISI_LEGAL_ = {
  'baru': ['diproses', 'batal'],
  'diproses': ['selesai', 'batal'],
  'selesai': [],
  'batal': []
};

function getTindakLanjutList_(params) {
  var list = getSheetData_('T_TINDAK_LANJUT');
  var q = String(params.search || '').toLowerCase().trim();
  if (params.status_rtl) list = list.filter(function (r) { return CoreLib.normStr(r.status_rtl) === CoreLib.normStr(params.status_rtl); });
  if (params.sumber_evaluasi) list = list.filter(function (r) { return CoreLib.normStr(r.sumber_evaluasi) === CoreLib.normStr(params.sumber_evaluasi); });
  if (params.tahun) list = list.filter(function (r) { var t = CoreLib.dateKey10(r.due_date) || String(r.due_date || ''); return t.indexOf(String(params.tahun)) === 0 || String(r.due_date || '').indexOf(String(params.tahun)) !== -1; });
  if (q) list = list.filter(function (r) { return CoreLib.matchSearch(r, q, ['judul_rtl', 'deskripsi', 'assigned_to', 'catatan']); });
  list.sort(function (a, b) { return (b.created_at || '').localeCompare(a.created_at || ''); });
  var page = Number(params.page) || 1;
  var per = Number(params.per_page) || 10;
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

function saveTindakLanjut_(params, actor) {
  var rec = params.record || params;
  if (!rec.judul_rtl) return { success: false, code: 'BAD_REQUEST', error: 'Judul RTL wajib.' };
  if (!rec.sumber_evaluasi) rec.sumber_evaluasi = 'manual';
  if (!rec.status_rtl) rec.status_rtl = 'baru';
  if (rec.progress_pct === undefined || rec.progress_pct === '') rec.progress_pct = 0;
  try {
    var saved = saveRecord_('T_TINDAK_LANJUT', rec, actor);
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function deleteTindakLanjut_(params, actor) {
  var id = params.id;
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  try { softDeleteRecord_('T_TINDAK_LANJUT', id, actor); return { success: true, data: { id: id } }; }
  catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function ubahStatusTindakLanjut_(params, actor) {
  var id = params.id;
  var statusBaru = params.status_rtl || params.status_baru;
  var progress = params.progress_pct;
  var catatan = params.catatan || '';
  if (!id) return { success: false, code: 'BAD_REQUEST', error: 'ID wajib.' };
  if (!statusBaru) return { success: false, code: 'BAD_REQUEST', error: 'Status baru wajib.' };
  var old = findRecordById_('T_TINDAK_LANJUT', id);
  if (!old) return { success: false, code: 'NOT_FOUND', error: 'RTL tidak ditemukan.' };
  var oldStatus = String(old.status_rtl || 'baru').toLowerCase();
  var newStatus = String(statusBaru).toLowerCase();
  var legal = RTL_TRANSISI_LEGAL_[oldStatus] || [];
  if (legal.indexOf(newStatus) === -1 && oldStatus !== newStatus) {
    return { success: false, code: 'BAD_REQUEST', error: 'Transisi tidak legal: ' + oldStatus + ' → ' + newStatus + '. Legal: ' + (legal.join(', ') || '(tidak ada)') };
  }
  try {
    var rec = { id: id, status_rtl: newStatus, catatan: catatan || old.catatan };
    if (progress !== undefined && progress !== '') rec.progress_pct = Number(progress);
    else if (newStatus === 'selesai') rec.progress_pct = 100;
    var saved = saveRecord_('T_TINDAK_LANJUT', rec, actor);
    return { success: true, data: saved };
  } catch (e) { return { success: false, code: 'BAD_REQUEST', error: e.message }; }
}

function generateTindakLanjut_(params, actor) {
  var tahun = params.tahun || String(new Date().getFullYear());
  var sumber = params.sumber_evaluasi || 'semua';
  var existing = getSheetData_('T_TINDAK_LANJUT');
  var existingJudul = {};
  existing.forEach(function (r) { existingJudul[r.judul_rtl] = true; });
  var generated = 0;

  // R1 — Lengkapi Dokumen dari E3/L6 belum_lengkap
  if (sumber === 'semua' || sumber === 'E3') {
    try {
      var rekapPegawai = lapRekapPegawai_({ tahun: tahun });
      (rekapPegawai.data.belum_lengkap || []).forEach(function (b) {
        var judul = 'R1 Lengkapi dokumen ' + b.nama + ' tahun ' + tahun + ' (' + b.pct + '%)';
        if (!existingJudul[judul]) {
          try {
            saveRecord_('T_TINDAK_LANJUT', { sumber_evaluasi: 'E3', judul_rtl: judul, deskripsi: 'Pegawai ' + b.nama + ' baru ' + b.pct + '% lengkap (' + b.jml + '/' + b.total_jenis + '). Kurang: ' + (b.total_jenis - b.jml) + ' jenis.', assigned_to: b.pegawai_id, due_date: tahun + '-12-31', status_rtl: 'baru', progress_pct: b.pct, dokumen_terkait: '', catatan: 'Auto-generate R1 dari E3 kelengkapan' }, actor);
            generated++; existingJudul[judul] = true;
          } catch (e) {}
        }
      });
    } catch (e) {}
  }

  // R2 — Perbaiki Format dari E4
  if (sumber === 'semua' || sumber === 'E4') {
    try {
      var fmt = evaluasiFormat_({ tahun: tahun });
      (fmt.data.rincian || []).forEach(function (r) {
        var judul = 'R2 Perbaiki format ' + (r.file_name || r.id);
        if (!existingJudul[judul]) {
          try {
            saveRecord_('T_TINDAK_LANJUT', { sumber_evaluasi: 'E4', judul_rtl: judul, deskripsi: 'File bermasalah: ' + (r.issues || []).join(', '), assigned_to: '', due_date: tahun + '-12-31', status_rtl: 'baru', progress_pct: 0, dokumen_terkait: r.id, catatan: 'Auto-generate R2 dari E4 format' }, actor);
            generated++; existingJudul[judul] = true;
          } catch (e) {}
        }
      });
    } catch (e) {}
  }

  // R3 — Verifikasi Tertunda dari E1/A9
  if (sumber === 'semua' || sumber === 'E1' || sumber === 'A9') {
    try {
      var sla = analisaSlaPejabat_({ tahun: tahun });
      (sla.data.sla || []).forEach(function (s) {
        if (s.lewat > 0) {
          var judul = 'R3 Verifikasi tertunda — ' + s.nama + ' (' + s.lewat + ' lewat)';
          if (!existingJudul[judul]) {
            try {
              saveRecord_('T_TINDAK_LANJUT', { sumber_evaluasi: 'E1', judul_rtl: judul, deskripsi: 'Verifikator ' + s.nama + ' ada ' + s.lewat + ' verifikasi lewat SLA >3 hari, avg ' + s.avg_hari + ' hari', assigned_to: s.verifikator_id, due_date: tahun + '-12-15', status_rtl: 'baru', progress_pct: 0, catatan: 'Auto-generate R3 dari E1/A9 SLA' }, actor);
              generated++; existingJudul[judul] = true;
            } catch (e) {}
          }
        }
      });
    } catch (e) {}
  }

  // R4 — Arsipkan Dokumen Lama dari E6
  if (sumber === 'semua' || sumber === 'E6') {
    try {
      var kdl = evaluasiKadaluarsa_({ tahun: tahun });
      if (kdl.data.tanpa_ba > 0) {
        var judul = 'R4 Arsipkan dokumen kadaluarsa tahun ' + tahun + ' — ' + kdl.data.tanpa_ba + ' dokumen';
        if (!existingJudul[judul]) {
          try {
            saveRecord_('T_TINDAK_LANJUT', { sumber_evaluasi: 'E6', judul_rtl: judul, deskripsi: 'Ada ' + kdl.data.tanpa_ba + ' dokumen kadaluarsa (≤' + (Number(tahun) - 5) + ') tanpa BA musnah/serah', assigned_to: '', due_date: tahun + '-12-31', status_rtl: 'baru', progress_pct: 0, catatan: 'Auto-generate R4 dari E6 kadaluarsa' }, actor);
            generated++; existingJudul[judul] = true;
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  // R5 — Pembinaan Pegawai dari E5 kepatuhan jenis + A4 top malas
  if (sumber === 'semua' || sumber === 'E5') {
    try {
      var kep = evaluasiKepatuhanJenis_({ tahun: tahun });
      var low = (kep.data.rekap || []).filter(function (r) { return r.pct < 50; });
      if (low.length > 0) {
        var judul = 'R5 Pembinaan pegawai — ' + low.length + ' jenis dokumen kepatuhan <50% tahun ' + tahun;
        if (!existingJudul[judul]) {
          try {
            saveRecord_('T_TINDAK_LANJUT', { sumber_evaluasi: 'E5', judul_rtl: judul, deskripsi: 'Jenis dengan kepatuhan <50%: ' + low.map(function (r) { return r.nama + ' ' + r.pct + '%'; }).join(', '), assigned_to: '', due_date: tahun + '-12-31', status_rtl: 'baru', progress_pct: 0, catatan: 'Auto-generate R5 dari E5 kepatuhan' }, actor);
            generated++; existingJudul[judul] = true;
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  return { success: true, data: { tahun: tahun, sumber: sumber, generated: generated } };
}
