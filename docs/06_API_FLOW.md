# 06_API_FLOW — SIDOKUMEN v1.6.3 full sync

> 87 handler = 6 config +2 self +1 dashboard +3 SIMPEG +1 master_satelit +3 jenis +5 dokumen +8 laporan L1-L3,L7-L10 +6 laporan rekap L4-L6,L11,L12 +8 analisa A3-A10 +11 evaluasi E1-E8 +12 RTL R1-R5 +2 native — frontend GAS truth v1.0.2/v1.0.3 + V_ 9 files v1.0.2 + backend 14-17 v1.6-v1.9 — CoreLib v2.3.0 pin15

## Flow SSO (standar ekosistem si-platform)
1. User buka katalog si-platform → klik SIDOKUMEN → ?ticket=st_xxx
2. Index.html baca __SSO_TICKET__ → AppCore.exchangePlatformTicket → token sesi localStorage sidokumen_token
3. callServer pakai token → CoreLib.checkAuth → role viewer/user/verifikator/admin — fail-closed ping tanpa token DITOLAK
4. J_App initApp → loadAll(true) silent → dashboard, master satelit, dokumen 1, jenis, rtl 1, rekap klasifikasi
5. onNavigate → load per page: dashboard loadAll, dokumen loadDokumen 1, laporan loadRekapKlasifikasi/Pegawai, analisa loadAnalisa, evaluasi loadEvaluasi, rtl loadRtl 1, master loadJenis

## ActionLevels 87 — full mapping v1.6.3 — 01_ConfigAndBridge v1.0.2

```js
actionLevels: {
  // Config 6
  'get_config': 'viewer', 'get_config_list': 'viewer',
  'save_config_item': 'admin', 'save_config': 'admin',
  'delete_config_item': 'admin', 'delete_config': 'admin',
  // Self 2
  'get_my_profile': 'viewer', 'save_my_profile': 'viewer',
  // Dashboard 1
  'get_dashboard': 'viewer', 'dashboard': 'viewer', // alias
  // SIMPEG 3
  'get_pegawai_list': 'viewer', 'get_unit_list': 'viewer', 'get_jabatan_list': 'viewer',
  // Master satelit 1
  'get_master_satelit': 'viewer',
  // Jenis Dokumen 3
  'get_jenis_list': 'viewer', 'save_jenis': 'verifikator', 'delete_jenis': 'verifikator',
  // Dokumen 5
  'get_dokumen_list': 'viewer', 'get_dokumen_detail': 'viewer',
  'save_dokumen': 'user', 'delete_dokumen': 'user', 'verifikasi_dokumen': 'verifikator',
  // Laporan L1-L3,L7-L10 8
  'laporan_daftar_dokumen': 'viewer', // alias get_dokumen_list
  'laporan_rekap_periode': 'viewer', 'laporan_rekap_status': 'viewer',
  'laporan_keterlambatan': 'viewer', 'laporan_file_bermasalah': 'viewer',
  'laporan_rekap_klasifikasi': 'viewer', // legacy alias
  'laporan_rekap_unit': 'viewer', // legacy alias
  'laporan_rekap_pegawai': 'viewer', // legacy alias
  // Laporan Rekap L4-L6,L11,L12 6
  'lap_rekap_klasifikasi': 'viewer', 'lap_rekap_unit': 'viewer', 'lap_rekap_pegawai': 'viewer',
  'lap_kepatuhan_upload': 'viewer',
  'laporan_khas_data': 'viewer', 'laporan_export_khas': 'user',
  // Analisa A3-A10 8
  'analisa_distribusi_unit': 'viewer', 'analisa_top_pengirim': 'viewer', 'analisa_beban_pejabat': 'viewer',
  'analisa_retensi': 'viewer', 'analisa_korelasi_jenis_unit': 'viewer', 'analisa_tte_ratio': 'viewer',
  'analisa_sla_pejabat': 'viewer', 'analisa_kritis_bulanan': 'viewer',
  // Evaluasi E1-E8 8 + alias 3
  'evaluasi_sla_verifikasi': 'viewer', 'evaluasi_sla_upload': 'viewer',
  'evaluasi_kelengkapan': 'viewer', 'evaluasi_format': 'viewer',
  'evaluasi_kepatuhan_jenis': 'viewer', 'evaluasi_kadaluarsa': 'viewer',
  'evaluasi_fisik': 'viewer', 'evaluasi_alih_media': 'viewer',
  'evaluasi_sla_disposisi': 'viewer', 'evaluasi_jra': 'viewer', 'evaluasi_sla': 'viewer', // alias
  // RTL R1-R5 6
  'get_tindak_lanjut_list': 'viewer', 'get_tindak_lanjut_detail': 'viewer',
  'save_tindak_lanjut': 'user', 'delete_tindak_lanjut': 'user',
  'ubah_status_tindak_lanjut': 'user', 'generate_tindak_lanjut': 'verifikator',
  // Native 2
  'exchange_platform_ticket': 'viewer', 'logout': 'viewer'
}
```

## buildLocalHandlers_ wiring — 02_AppLogic v1.0.2 — 91 local + 2 native = 93 total, 87 unique actionLevels

```js
h['get_master_satelit'] = () => getMasterSatelit_()
h['get_jenis_list'] = (d) => getGenericList_('M_JENIS_DOKUMEN', d)
h['get_dokumen_list'] = (d) => getDokumenList_(d) // pagination page, search, tahun, jenis_dokumen_id, status, pegawai_id, per_page
h['save_dokumen'] = (d,u) => saveDokumen_(d,u) // record + file_base64, file_name, file_mime → Drive
h['delete_dokumen'] = (d,u) => softDeleteRecord_('T_DOKUMEN', d.id, u)
h['verifikasi_dokumen'] = (d,u) => verifikasiDokumen_(d,u) // id, status_baru, catatan → T_DOKUMEN status + T_VERIFIKASI log
h['lap_rekap_klasifikasi'] = (d) => lapRekapKlasifikasi_(d) // tahun → rekap[] {jenis_dokumen_id, jml, pct}, total, total_pegawai
h['lap_rekap_unit'] = (d) => lapRekapUnit_(d) // tahun → rekap[] {unit_id, jml, pct}, total
h['lap_rekap_pegawai'] = (d) => lapRekapPegawai_(d) // tahun → rekap[] {pegawai_id, nama, nip, unit_id, jml, total_jenis, pct, belum_lengkap[], lengkap[]}, total_pegawai, lengkap[], belum_lengkap[], total_dokumen, total_jenis
h['laporan_rekap_periode'] = (d) => laporanRekapPeriode_(d) // tahun → rekap[] {periode YYYY-MM, jml}
h['laporan_rekap_status'] = (d) => laporanRekapStatus_(d) // tahun → rekap[] {status, jml}, total
h['laporan_keterlambatan'] = (d) => laporanKeterlambatan_(d) // tahun → total, terlambat_total, list[] {id, pegawai_id, jenis_dokumen_id, tgl_upload, deadline, selisih_hari} — buildDeadlineMap_ fix tanggal_selesai
h['laporan_file_bermasalah'] = (d) => laporanFileBermasalah_(d) // tahun → total, bermasalah_total, list[] {id, file_name, issues[]}
h['lap_kepatuhan_upload'] = (d) => lapKepatuhanUpload_(d) // tahun → total, tepat_waktu, pct, rekap[] {jenis_dokumen_id, nama, total, tepat_waktu, pct}
h['laporan_khas_data'] = (d) => laporanKhasData_(d) // tahun → klasifikasi, unit, pegawai, kepatuhan, periode, status, total
h['laporan_export_khas'] = (d,u) => laporanExportKhas_(d,u) // tahun → create Spreadsheet SIDOKUMEN_KHAS_{tahun} 7 sheets Cover, Ringkasan, Rekap Jenis, Unit, Pegawai, Kepatuhan, TTD + folder SIDOKUMEN Export + return file_url, sheets=7
h['analisa_distribusi_unit'] = (d) => analisaDistribusiUnit_(d) // tahun → total, distribusi[] {unit_id, jumlah} top8 sorted, total_beban
h['analisa_top_pengirim'] = (d) => analisaTopPengirim_(d) // tahun → total, top[] {pegawai_id, nama, jumlah, pct} top10
h['analisa_beban_pejabat'] = (d) => analisaBebanPejabat_(d) // tahun → total, beban[] {pegawai_id, nama, diteruskan, diproses, selesai, lewat, jumlah} top10
h['analisa_retensi'] = (d) => analisaRetensi_(d) // tahun → tahun, proyeksi[] {tahun, musnah, permanen} 5 tahun
h['analisa_korelasi_jenis_unit'] = (d) => analisaKorelasiJenisUnit_(d) // tahun → tahun, jenis[] {id,nama} top5, units[] {id,nama} top8, matrix[] {jenis_id, jenis_nama, [unitId]: count}
h['analisa_tte_ratio'] = (d) => analisaTteRatio_(d) // tahun → total, tte=0, pct=0, note placeholder future G15
h['analisa_sla_pejabat'] = (d) => analisaSlaPejabat_(d) // tahun → total, sla[] {verifikator_id, nama, total, lewat, pct_lewat, avg_hari} top8 sorted lewat
h['analisa_kritis_bulanan'] = (d) => analisaKritisBulanan_(d) // tahun → total, rekap[] {bulan, nama_bulan Jan-Des, jml, belum}
h['evaluasi_sla_verifikasi'] = (d) => evaluasiSlaVerifikasi_(d) // tahun → total, patuh, lewat, pct_patuh, avg_hari
h['evaluasi_sla_upload'] = (d) => evaluasiSlaUpload_(d) // tahun → total, patuh, lewat, pct_patuh, avg_telat_hari
h['evaluasi_kelengkapan'] = (d) => evaluasiKelengkapan_(d) // tahun → total, lengkap, pct_lengkap, missing {tanpa_file, tanpa_pegawai, tanpa_jenis, tanpa_tahun, tanpa_judul}, rincian 100 {id, pegawai_id, jenis_dokumen_id, issues[]}
h['evaluasi_format'] = (d) => evaluasiFormat_(d) // tahun → total, patuh, tidak_patuh, pct_patuh, rincian 100 {id, file_name, file_size, file_mime, issues[]}
h['evaluasi_kepatuhan_jenis'] = (d) => lapKepatuhanUpload_(d) // reuse L11
h['evaluasi_kadaluarsa'] = (d) => evaluasiKadaluarsa_(d) // tahun → total_kadaluarsa ≤tahun-5, tanpa_ba, list 100 {id, pegawai_id, jenis_dokumen_id, tahun}
h['evaluasi_fisik'] = (d) => evaluasiFisik_(d) // tahun → total, tanpa_lokasi, pct_tanpa, note proxy future G07
h['evaluasi_alih_media'] = (d) => evaluasiAlihMedia_(d) // tahun → total, digital, pct_digital, total_lampiran, rekap[] {jenis_dokumen_id, total, digital, pct}
h['get_tindak_lanjut_list'] = (d) => getTindakLanjutList_(d) // page, search, status_rtl, sumber_evaluasi, tahun, per_page 10 → data, total, total_pages, page
h['save_tindak_lanjut'] = (d,u) => saveTindakLanjut_(d,u) // record judul_rtl wajib, sumber_evaluasi default manual, status_rtl default baru, progress_pct default 0
h['ubah_status_tindak_lanjut'] = (d,u) => ubahStatusTindakLanjut_(d,u) // id, status_rtl/status_baru, progress_pct, catatan — cek RTL_TRANSISI_LEGAL_ baru→[diproses,batal], diproses→[selesai,batal]
h['generate_tindak_lanjut'] = (d,u) => generateTindakLanjut_(d,u) // tahun, sumber_evaluasi semua/E3/E4/E1/E6/E5 — existing judul dedup map — R1 dari E3 belum_lengkap, R2 dari E4 rincian, R3 dari A9 lewat>0, R4 dari E6 tanpa_ba>0, R5 dari E5 pct<50 — return generated count — idempoten
```

## Frontend Flow v1.6.3 — J_Api + J_Actions + J_State v1.0.3
- loadAll silent: dashboard, master satelit, dokumen 1, jenis, rtl 1, rekap klasifikasi — Promise.all
- loadDokumen: page, search, tahun, jenis_dokumen_id, status, pegawai_id, per_page dokumenPerPage 20 — server pagination — dokumenList, dokumenTotalData, dokumenTotalPagesServer, dokumenPage — filteredDokumen client safety + paginatedDokumen return filtered (server slice)
- loadRekapKlasifikasi/Pegawai/Unit/Periode/Status/Keterlambatan/FileBermasalah/Kepatuhan: tahun lapKlasTahun → lapXData + loading flag
- exportKhas: tahun → exportKhasResult file_url + window.open + toast — V_Laporan tampil link
- loadAnalisa: tahun analisaTahun, tab analisaTab, map handler→dataKey → callServer → this[dataKey]=data — shape proyeksi, units[], matrix row[u.id]
- loadEvaluasi: tahun evaluasiTahun, tab evaluasiTab, map handler→dataKey → callServer
- loadRtl: page, rtlSearch, rtlFilters status_rtl/sumber_evaluasi/tahun, per_page 10 → rtlList, rtlTotalData, rtlTotalPages, rtlPage — rtlBaruCount etc computed
- generateRtl: rtlGenerating true, sumber rtlGenerateSumber, tahun rtlGenerateTahun → generated count toast + loadRtl 1
- openDokumenCreate/Edit: y now, form reset, role-guard !isAdmin auto-fill pegawai_id, showForm=true, $nextTick reset file input ref — fix v1.6.3
- simpanDokumen: role-guard !isAdmin paksa pegawai_id, validasi wajib, fileInput ref files[0] size >10MB error, mime PDF warning, FileReader base64 split(',')[1], payload record+file_base64/file_name/file_mime, save_dokumen, toast, close, loadDokumen page, loadRekapKlasifikasi
- verifikasiDokumen: id, status_baru, catatan → verifikasi_dokumen → toast + loadDokumen
- RTL: openRtlCreate/Edit, simpanRtl judul_rtl wajib, hapusRtl confirm, openRtlStatus, ubahStatusRtl status_rtl/progress_pct/catatan → ubah_status_tindak_lanjut → toast + loadRtl

## Drive Flow
- saveDokumen_ file_base64 → getOrCreateFolder_ SIDOKUMEN + tahun subfolder → newBlob base64 → file.getId() → file_drive_id + file_name/size/mime
- laporanExportKhas_ → getOrCreateFolder_ SIDOKUMEN Export → SpreadsheetApp.create SIDOKUMEN_KHAS_{tahun} → 7 sheets appendRow + formatting KOP + return file_url via Drive file getUrl()

## Perubahan v1.6.3
- J_State v1.0.3 fix pagination conflict dokumenTotalPages → dokumenTotalPagesServer + rtl counters
- J_Actions v1.0.3 + nextTick fix file input reset after modal render
- V_ 9 files v1.0.2 sinkron backend shape — proyeksi, units[], matrix, pct_, clampPct_
- Backend 14-17 v1.6-v1.9 tetap, tapi workspace sync GAS truth
- 87 handler tetap, tidak ada penambahan actionLevels
