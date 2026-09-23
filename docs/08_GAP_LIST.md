# 08_GAP_LIST — SIDOKUMEN v1.6.3 full sync

> Gap = fitur yang belum ada di v1, tapi mungkin di v2. Satu baris = satu FR/ide. Status: KONTRAK (v1), DONE (selesai), ROADMAP (v2), IDE (v3+), FIX (bugfix)

## Fase 1 — v1.0 KONTRAK (Gate 0 awal) — DONE 2026-09-21
- G01 — M_JENIS_DOKUMEN CRUD + seed 10 — DONE — handler get_jenis_list/save_jenis/delete_jenis + V_Master v1.0.2 openJenisEdit
- G02 — T_DOKUMEN upload Drive + list filter + duplikat guard — DONE — save_dokumen_ + Drive folder SIDOKUMEN + FileReader base64 + role-guard v1.0.3
- G03 — T_VERIFIKASI status baru/menunggu/disetujui/revisi — DONE — verifikasi_dokumen_ + jejak T_VERIFIKASI + SLA 3 hari E1/A9
- G04 — Dashboard 4 KPI + 2 chart + tabel terbaru + panel belum upload — DONE — get_dashboard + V_Dashboard v1.0.2 8 KPI nullish-safe + tren/status chart + belum_lengkap L6 progress-track
- G05 — Rekap klasifikasi + per pegawai + per unit — DONE v1.0 awal — lap_rekap_klasifikasi/unit/pegawai L4-L6 — V_Laporan v1.0.2 + V_Dashboard L6
- G06 — Master Jenis Dokumen UI — DONE — V_Master tab Jenis + modal lg + openJenisCreate/Edit
- G07 — Pengaturan wrapper app-settings + Profil wrapper app-profile — DONE — Index include + J_App brand

## Fase 1.5 — v1.5 full piramida 35 output — DONE 2026-09-21 malam
- G08 — Laporan L1-L3,L7-L10 — DONE — 10_LaporanApi.gs laporanDaftarDokumen_, rekapPeriode, rekapStatus, keterlambatan vs T_JADWAL buildDeadlineMap_ fix tanggal_selesai, fileBermasalah — V_Laporan v1.0.2 8 tab
- G09 — Laporan L4-L6,L11 — DONE — 13_LaporanRekapApi.gs lapRekapKlasifikasi_, lapRekapUnit_, lapRekapPegawai_ matrix + nip+unit_id, lapKepatuhanUpload_ vs deadline — V_Laporan v1.0.2
- G10 — Laporan Khas L12 export 7 sheet — DONE — laporanKhasData_ composite + laporanExportKhas_ SpreadsheetApp.create SIDOKUMEN_KHAS_{tahun} 7 sheets Cover/Ringkasan/Rekap Jenis/Unit/Pegawai/Kepatuhan/TTD + folder SIDOKUMEN Export + return file_url — V_Laporan btn export + link file_url
- G11 — Analisa A3-A5 — DONE — 14_AnalisaApi.gs v1.6 analisaDistribusiUnit_ top8, analisaTopPengirim_ top10, analisaBebanPejabat_ — V_Analisa v1.0.2 tab unit/top/beban
- G12 — Analisa A6-A10 — DONE — 15_AnalisaLanjutApi.gs v1.7 analisaRetensi_ 5yr proyeksi musnah/permanen, analisaKorelasiJenisUnit_ matrix 5×8 units[] + matrix row[u.id], analisaTteRatio_ placeholder 0%, analisaSlaPejabat_ lewat >3 hari, analisaKritisBulanan_ 12 bulan — V_Analisa v1.0.2 tab retensi/korelasi/tte/kritis/sla
- G13 — Evaluasi E1-E8 — DONE — 16_EvaluasiApi.gs v1.8 evaluasiSlaVerifikasi_, evaluasiSlaUpload_, evaluasiKelengkapan_ missing 5 kategori, evaluasiFormat_ regex nama standar, evaluasiKepatuhanJenis_ reuse L11, evaluasiKadaluarsa_ ≤tahun-5 tanpa BA, evaluasiFisik_ proxy lokasi_fisik, evaluasiAlihMedia_ file_drive vs total — V_Evaluasi v1.0.2 8 tab
- G14 — RTL R1-R5 puncak piramida — DONE — 17_RtlApi.gs v1.9 RTL_TRANSISI_LEGAL_ baru→[diproses,batal], diproses→[selesai,batal] + get/save/delete/ubahStatus/generate R1 dari E3, R2 dari E4, R3 dari E1/A9, R4 dari E6, R5 dari E5 + dedup judul idempoten + V_Rtl v1.0.2 generate panel + stats 4 rtlBaruCount etc + table min-w 260/100/100/140/110 + badge + progress-track clampPct_ + modal lg/md + pagination
- G15 — Config 72→87 + AppLogic wiring 19 baru — DONE — 01_ConfigAndBridge v1.0.2 87 actionLevels + KONFIGURASI/cfg, 02_AppLogic v1.0.2 buildLocalHandlers 91 + ensureLocalSheets_() + seed 10+5+3 + isRefSheet_ fix SIMPEG-only
- G16 — Frontend 8 menu full — DONE v1.5 — Index include V_Laporan/V_Analisa/V_Evaluasi/V_Rtl + J_State full + J_Api loadRekapKlasifikasi/Pegawai/Kepatuhan/exportKhas + loadAnalisa/loadEvaluasi/loadRtl/generateRtl + J_Actions simpanRtl/hapusRtl/ubahStatusRtl + J_App menu 7 + brand 35 output
- G17 — TestSuite full piramida — DONE — 99_TestSuite.gs v1.0.2 runAllTestsSidokumen() L4/L6/L11/L12/A3/A9/E3/E4/R generate + schema 11 + routing 87 — GREEN 42/0/1 + 29/0 + 14/0

## Fase 1.6 — v1.6 full sync — DONE 2026-09-22
- G18 — Sync GAS backend 14-17 v1.6-v1.9 ke workspace — DONE — 14_AnalisaApi v1.6, 15 v1.7, 16 v1.8, 17 v1.9 + 00_Utils + appsscript.json yang missing di GitHub
- G19 — Sync J_State v1.0.3 dari GitHub ke workspace — DONE — fix dokumenTotalPages → dokumenTotalPagesServer + rtlBaruCount/diproses/selesai/batal computed + paginatedDokumen return langsung
- G20 — README v1.6 + zip v1.6 full 86KB 38 files — DONE — 26 src + 9 docs + README — siap drag-drop GitHub

## Fase 1.6.2 — v1.6.2 frontend GAS truth — DONE 2026-09-22
- G21 — Sync frontend GAS truth 15 files — DONE — Index v1.0.2 + J_Actions v1.0.3 + J_Api/J_App/J_Helpers v1.0.2 + J_State v1.0.3 + V_ 9 files v1.0.2 (Analisa/Dashboard/Dokumen/Evaluasi/Laporan/Master/Modals/Rekap/Rtl) — workspace = GAS
- G22 — V_ 9 files v1.0.2 sinkron backend shape — DONE — A6 proyeksi, A7 units[] + matrix row[u.id], A9 reduce lewat, E3 missing, E4 rincian, L6 nip/unit_id, L9 selisih_hari, L10 issues, L11 tepat_waktu, L12 file_url, RTL clampPct_ + rtlBaruCount
- G23 — Zip v1.6.2 87KB — DONE — 26 src + 9 docs + README v1.6.2

## Fase 1.6.3 — v1.6.3 fix nextTick + docs — DONE 2026-09-22 05:46
- G24 — FIX J_Actions v1.6.3 nextTick reset file input — DONE — openDokumenCreate/Edit showForm=true dulu, baru $nextTick reset file input ref — fix v-if modal ref undefined — user sudah update manual di GAS, workspace sync
- G25 — Update docs 00-08 ke v1.6.3 — DONE — 00_ALUR, 01_BRD, 02_PRD, 03_FRD, 04_DATABASE, 05_UIUX, 06_API_FLOW, 07_TESTCASE, 08_GAP_LIST semua update ke v1.6.3 dengan detail frontend v1.0.2/v1.0.3 + V_ 9 files v1.0.2 + backend 14-17 v1.6-v1.9 + J_State fix + J_Actions nextTick
- G26 — Zip v1.6.3 87KB — DONE — 26 src + 9 docs v1.6.3 + README v1.6.3 — 100% sync GAS=Workspace=GitHub (after upload)

## Fase 2 — v1.7 ROADMAP (prioritas tinggi, belum)
- G27 — Preview PDF inline di modal detail (iframe Drive file_drive_id) — ROADMAP — V_Dokumen btn view sudah ada, tinggal iframe modal
- G28 — Export Excel rekap kelengkapan + PDF cover KOP — ROADMAP — L12 khas 7 sheet sudah, tapi Excel per pegawai belum — bisa pakai Sheet → Excel export
- G29 — Timeline verifikasi bertingkat — ROADMAP — T_VERIFIKASI sudah ada log, tinggal UI timeline di V_Dokumen detail
- G30 — Notifikasi lonceng + badge belum upload — ROADMAP — dashboard L6 belum_lengkap sudah, tinggal lonceng di header
- G31 — Menu ⋮ row actions + preset rentang tahun — ROADMAP — table-scroll sudah ada, tinggal dropdown ⋮
- G32 — Upload multiple + drag-drop — ROADMAP — FileReader sekarang single, bisa multiple

## Fase 3 — v2.0 IDE (jangka panjang)
- G33 — TTE digital G15 + ratio A8 real — IDE — field tte di T_DOKUMEN belum ada, butuh integrasi BSrE
- G34 — OCR isi PDF + e-sign workflow — IDE
- G35 — Integrasi e-Kinerja BKN — IDE — mapping pegawai_id + SKP
- G36 — Retensi otomatis + BA musnah digital — IDE — E6 + R4 sudah ada logic, tinggal BA digital + TTE
- G37 — Dashboard eksekutif + export PDF — IDE
- G38 — CDN candidates promotion — IDE — C4-C8 queued (C1-C3 sudah di CoreLib v2.4.0)
- G39 — Debounce search + app-confirm modal ganti confirm() — FIX minor v1.7 — sudah dicatat di audit 2026-09-22
