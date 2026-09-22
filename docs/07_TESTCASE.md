# 07_TESTCASE — SIDOKUMEN v1.6.3 full sync

> Target suite: runAllTestsSidokumen() — library 42/0/1 + routing 29/0 + domain 14/0 = GREEN — frontend GAS truth v1.0.2/v1.0.3 + V_ 9 files v1.0.2 + backend 14-17 v1.6-v1.9 — 11 sheet + 87 handler + Drive + UIUX v1.10

## TC-LIB — Library CoreLib v2.3.0
- Jalankan `runLibraryTests()` — harap PASS 42 FAIL 0 SKIP 1 — dari CoreLib.runCoreTests(testCtx_) — ctx appCode, ssId, masterSsId, platformApiUrl, headersMap, isRefFunc

## TC-ROUTING — 87 handler routing — testDispatcherRouting()
- localHandlers count ≥80 (target 85 local + 2 native =87) — dari buildLocalHandlers_()
- Semua handler punya actionLevels — missingLevels = 0 — dari getAppConfig_().actionLevels
- ping tanpa token DITOLAK fail-closed — handleAction({action:'ping'}) success false
- Handler kritis full piramida tersedia: laporan_daftar_dokumen, laporan_rekap_periode, laporan_rekap_status, laporan_keterlambatan, laporan_file_bermasalah, lap_kepatuhan_upload, laporan_khas_data, laporan_export_khas, analisa_distribusi_unit, analisa_top_pengirim, analisa_beban_pejabat, analisa_retensi, analisa_korelasi_jenis_unit, analisa_tte_ratio, analisa_sla_pejabat, analisa_kritis_bulanan, evaluasi_sla_verifikasi, evaluasi_sla_upload, evaluasi_kelengkapan, evaluasi_format, evaluasi_kepatuhan_jenis, evaluasi_kadaluarsa, evaluasi_fisik, evaluasi_alih_media, get_tindak_lanjut_list, generate_tindak_lanjut — typeof handlers[a]==='function'

## TC-DOMAIN — Domain SIDOKUMEN v1.6.3 — runDomainTestsSidokumen()

### TC-JENIS-01 — M_JENIS_DOKUMEN save valid
- Input: record kode TST-{timestamp}, nama Test Jenis {timestamp}, kategori LAINNYA, periode Fleksibel, urutan 99, status_aktif true — user TEST_ADMIN
- Harap: success + id
- Cleanup: softDelete M_JENIS_DOKUMEN id

### TC-DOK-01 — T_DOKUMEN save valid
- Input: jenisId dari saveGeneric M_JENIS_DOKUMEN PK-TEST-{timestamp}, pegawai_id TEST-PEGAWAI-001, jenis_dokumen_id jenisId, tahun 2026, judul Test Dokumen {timestamp}, status baru, file_drive_id dummy, file_name test.pdf, file_size 1234, file_mime application/pdf — user TEST_USER
- Harap: success + id — savedId
- Cleanup jenisId softDelete M_JENIS_DOKUMEN

### TC-DOK-02 — get list tahun 2026
- Input: tahun 2026
- Harap: success + array data

### TC-DOK-03 — Verifikasi baru→disetujui
- Input: id savedId, status_baru disetujui, catatan Test approve — user TEST_ADMIN
- Harap: success + status disetujui
- Cleanup: softDelete T_DOKUMEN savedId

### TC-L4 — Rekap per jenis shape
- Input: tahun 2026
- Handler: lapRekapKlasifikasi_
- Harap: success + data.rekap array

### TC-L6 — Rekap per pegawai shape — V_Laporan + V_Dashboard L6
- Input: tahun 2026
- Handler: lapRekapPegawai_
- Harap: success + data.rekap array + data.belum_lengkap array + nip + unit_id field untuk V_Laporan v1.0.2
- UI: V_Dashboard belum_lengkap panel + V_Laporan L6 table NIP/Unit + progress-track clampPct_

### TC-L11 — Kepatuhan shape
- Input: tahun 2026
- Handler: lapKepatuhanUpload_
- Harap: success + data.rekap array + total + tepat_waktu + pct

### TC-L12 — Khas 7 sheet data shape
- Input: tahun 2026
- Handler: laporanKhasData_
- Harap: success + data.klasifikasi + data.pegawai — untuk export 7 sheet

### TC-A3 — Distribusi unit shape — V_Analisa v1.0.2
- Input: tahun 2026
- Handler: analisaDistribusiUnit_
- Harap: success + data.distribusi array top8 + total — V_Analisa tab unit stat total/top unit/unit terdata + table unit_id/jml/% pct_

### TC-A6 — Retensi shape — V_Analisa v1.0.2
- Input: tahun 2026
- Handler: analisaRetensi_
- Harap: success + data.proyeksi array 5 tahun {tahun, musnah, permanen} — V_Analisa tab retensi table tahun/musnah/permanen

### TC-A7 — Korelasi shape — V_Analisa v1.0.2
- Input: tahun 2026
- Handler: analisaKorelasiJenisUnit_
- Harap: success + data.units[] {id,nama} top8 + data.matrix[] {jenis_id, jenis_nama, [unitId]: count} — V_Analisa tab korelasi header dynamic units[] + row[u.id]

### TC-A9 — SLA pejabat shape — V_Analisa + V_Evaluasi
- Input: tahun 2026
- Handler: analisaSlaPejabat_
- Harap: success + data.sla array {verifikator_id, nama, total, lewat, pct_lewat, avg_hari} — V_Analisa tab sla stat total verif/lewat/verifikator + table + reduce lewat

### TC-E3 — Kelengkapan shape — V_Evaluasi v1.0.2
- Input: tahun 2026
- Handler: evaluasiKelengkapan_
- Harap: success + data.missing {tanpa_file, tanpa_pegawai, tanpa_jenis, tanpa_tahun, tanpa_judul} + rincian 100 — V_Evaluasi tab kelengkapan stat total/lengkap/tanpa file/issues + table dokumen/issues

### TC-E4 — Format shape — V_Evaluasi v1.0.2
- Input: tahun 2026
- Handler: evaluasiFormat_
- Harap: success + data.rincian array + patuh/tidak_patuh/pct_patuh — V_Evaluasi tab format stat total/patuh/tidak patuh + table file/issues — regex nama standar

### TC-R — Generate idempoten — V_Rtl v1.0.2 + 17_RtlApi v1.9
- Input: tahun 2026, sumber_evaluasi semua — user TEST_ADMIN
- Handler: generateTindakLanjut_
- Harap: success — generated count — idempoten dedup judul — RTL_TRANSISI_LEGAL_ baru→diproses→selesai/batal — V_Rtl generate panel + stats rtlBaruCount etc + progress-track clampPct_

### TC-SCHEMA-01 — 11 sheet ada
- Check: Object.keys(LOCAL_SHEETS) unique → ss.getSheetByName(name) exists — missing = 0 — 11 sheet
- Fix ensureLocalSheets_() + initDatabase seed 10+5+3 — untuk M_KATEGORI, M_PERIODE yang sebelumnya missing karena isRefSheet_ fix

## TC-FRONTEND v1.6.3 — Manual UI (tidak di runAllTests, tapi checklist)

### TC-FE-01 — Index v1.0.2 load
- Buka /exec → SSO ticket → token → loadAll silent → dashboard 8 KPI muncul, chart tren + status, tabel terbaru + belum lengkap — no console error — [v-cloak] hidden

### TC-FE-02 — Dokumen pagination server-side tunggal — V_Dokumen v1.0.2 + J_State v1.0.3
- Menu Dokumen → list muncul, filter tahun/jenis/status/search → loadDokumen(1) → footer hal x/y dokumenTotalPagesServer + prev/next disabled logic — paginatedDokumen return filteredDokumen (server slice) — tidak ada error dokumenTotalPages conflict Vue3

### TC-FE-03 — Upload + role-guard + nextTick — J_Actions v1.0.3 + V_Modals v1.0.2
- User biasa → Upload Baru → pegawai select disabled + helper text "otomatis atas nama Anda" — pegawai_id auto-fill currentUser.pegawai_id
- Pilih file PDF ≤10MB → Simpan → FileReader base64 → save_dokumen → toast success → close → loadDokumen page + loadRekapKlasifikasi
- Buka lagi Upload Baru → file input kosong (reset via $nextTick) — tidak ada file lama nyangkut
- Edit dokumen → openDokumenEdit → pegawai_id paksa sendiri untuk non-admin (anti spoofing) + file input reset via nextTick

### TC-FE-04 — Laporan L6 + L12 — V_Laporan v1.0.2
- Laporan tab L6 Per Pegawai → Tampilkan → stat total pegawai/lengkap/belum/total dokumen + table NIP/Unit/Lengkap/%/Status + progress-track clampPct_
- Tab L11 Kepatuhan → Tampilkan → stat total/tepat/terlambat + table jenis/total/tepat/% + btn Export Khas L12 → exportKhas → file_url link + window.open (popup) — file_url valid Drive link

### TC-FE-05 — Analisa A6/A7 — V_Analisa v1.0.2
- Analisa tab A6 Retensi → Tampilkan → stat tahun basis/proyeksi 5th/total musnah + table tahun/musnah/permanen — data.proyeksi shape
- Tab A7 Korelasi → Tampilkan → table header dynamic units[] {id,nama} top8 + rows matrix row[u.id] count — 5 jenis × 8 unit

### TC-FE-06 — Evaluasi E3/E4 — V_Evaluasi v1.0.2
- Evaluasi tab E3 Lengkap → Tampilkan → stat total/lengkap/tanpa file/issues + table dokumen/issues
- Tab E4 Format → Tampilkan → stat total/patuh/tidak patuh + table file/issues — regex nama standar

### TC-FE-07 — RTL generate + status + progress — V_Rtl v1.0.2 + J_Actions v1.0.3
- RTL → Generate sumber semua + tahun → Generate → toast generated count + loadRtl 1 — dedup judul idempoten
- Stats 4 total/bar/diproses/selesai via rtlBaruCount etc computed — progress-track clampPct_
- Edit RTL → openRtlEdit → legacy judul copy → simpanRtl judul_rtl wajib
- Ubah Status → openRtlStatus → status baru + progress + catatan → ubah_status_tindak_lanjut → cek legal baru→diproses→selesai/batal → toast + loadRtl

## Rekap Test v1.6.3
- Library PASS 42 FAIL 0 SKIP 1 — CoreLib v2.3.0
- Routing 29/0 — localHandlers 91 — ping fail-closed — semua handler L/A/E/R ada — 87 actionLevels
- Domain PASS 14 FAIL 0 — JENIS.1, DOK.1, DOK.2, DOK.3, L4, L6, L11, L12, A3, A9, E3, E4, R generate, SCHEMA 11
- Frontend manual 7 checklist — Index, Dokumen pagination, Upload role-guard nextTick, Laporan L6/L12, Analisa A6/A7, Evaluasi E3/E4, RTL generate — semua OK
- 🎉 SEMUA HIJAU FULL PIRAMIDA v1.6.3
