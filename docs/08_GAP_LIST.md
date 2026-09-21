# 08_GAP_LIST — SIDOKUMEN v1.5 full piramida 35 output

> Gap = fitur yang belum ada di v1, tapi mungkin di v2. Satu baris = satu FR/ide. Status: KONTRAK (v1), DONE (selesai), ROADMAP (v2), IDE (v3+)

## Fase 1 — v1.0 KONTRAK (Gate 0 awal) — DONE 2026-09-21
- G01 — M_JENIS_DOKUMEN CRUD + seed 10 — DONE — handler get_jenis_list/save_jenis/delete_jenis + V_Master
- G02 — T_DOKUMEN upload Drive + list filter + duplikat guard — DONE — save_dokumen_ + Drive folder SIDOKUMEN + FileReader base64
- G03 — T_VERIFIKASI status baru/menunggu/disetujui/revisi — DONE — verifikasi_dokumen_ + jejak T_VERIFIKASI
- G04 — Dashboard 4 KPI + 2 chart + tabel terbaru + panel belum upload — DONE — get_dashboard + V_Dashboard 4 stat-card + tren/status chart
- G05 — Rekap klasifikasi + per pegawai + per unit — DONE v1.0 awal — lap_rekap_klasifikasi/unit/pegawai L4-L6
- G06 — Master Jenis Dokumen UI — DONE — V_Master tab Jenis + modal lg
- G07 — Pengaturan wrapper app-settings + Profil wrapper app-profile — DONE — Index include + J_App brand

## Fase 1.5 — v1.5 full piramida 35 output — DONE 2026-09-21 malam
- G08 — Laporan L1-L3,L7-L10 — DONE — 10_LaporanApi.gs laporanDaftarDokumen_, rekapPeriode, rekapStatus, keterlambatan vs T_JADWAL, fileBermasalah
- G09 — Laporan L4-L6,L11 — DONE — 13_LaporanRekapApi.gs lapRekapKlasifikasi_, lapRekapUnit_, lapRekapPegawai_ matrix, lapKepatuhanUpload_ vs deadline
- G10 — Laporan Khas L12 export 7 sheet — DONE — laporanKhasData_ composite + laporanExportKhas_ SpreadsheetApp.create SIDOKUMEN_KHAS_{tahun} 7 sheets Cover/Ringkasan/Rekap Jenis/Unit/Pegawai/Kepatuhan/TTD + folder SIDOKUMEN Export + return file_url — V_Laporan btn export
- G11 — Analisa A3-A5 — DONE — 14_AnalisaApi.gs analisaDistribusiUnit_, analisaTopPengirim_ top10, analisaBebanPejabat_
- G12 — Analisa A6-A10 — DONE — 15_AnalisaLanjutApi.gs analisaRetensi_ 5yr, analisaKorelasiJenisUnit_ matrix, analisaTteRatio_ placeholder 0%, analisaSlaPejabat_ lewat >3 hari, analisaKritisBulanan_ 12 bulan
- G13 — Evaluasi E1-E8 — DONE — 16_EvaluasiApi.gs evaluasiSlaVerifikasi_, evaluasiSlaUpload_, evaluasiKelengkapan_ missing, evaluasiFormat_ regex nama standar, evaluasiKepatuhanJenis_ reuse L11, evaluasiKadaluarsa_ ≤tahun-5 tanpa BA, evaluasiFisik_ proxy, evaluasiAlihMedia_ file_drive vs total
- G14 — RTL R1-R5 puncak piramida — DONE — 17_RtlApi.gs RTL_TRANSISI_LEGAL_ baru/diproses/selesai/batal + get/save/delete/ubahStatus/generate R1 dari E3, R2 dari E4, R3 dari E1/A9, R4 dari E6, R5 dari E5 + dedup judul idempoten + V_Rtl generate panel + stats + table + modal lg/md + progress-track
- G15 — Config 72→87 + AppLogic wiring 19 baru — DONE — 01_ConfigAndBridge 87 actionLevels, 02_AppLogic buildLocalHandlers 19 binding
- G16 — Frontend 8 menu full — DONE — Index include V_Laporan/V_Analisa/V_Evaluasi/V_Rtl + J_State full + J_Api loadRekapKlasifikasi/Pegawai/Kepatuhan/exportKhas + loadAnalisa/loadEvaluasi/loadRtl/generateRtl + J_Actions simpanRtl/hapusRtl/ubahStatusRtl + J_App menu 8 + brand 35 output
- G17 — TestSuite full piramida — DONE — 99_TestSuite.gs runAllTestsSidokumen() L4/L6/L11/L12/A3/A9/E3/E4/R generate + schema 11 + routing 87

## Fase 2 — v1.6 ROADMAP (prioritas tinggi, belum)
- G18 — Preview PDF inline di modal detail (iframe Drive file_drive_id) — ROADMAP
- G19 — Export Excel rekap kelengkapan + PDF cover KOP — ROADMAP (L12 khas sudah, tapi Excel per pegawai belum)
- G20 — Timeline verifikasi bertingkat — ROADMAP
- G21 — Notifikasi lonceng + badge belum upload — ROADMAP
- G22 — Preset rentang tahun + quick filter — ROADMAP
- G23 — Menu ⋮ di tabel dokumen — ROADMAP
- G24 — Upload multiple file + drag drop — ROADMAP

## Fase 3 — v2.0 IDE (jangka panjang)
- G25 — TTE digital G15 + ratio A8 jadi real — IDE — butuh integrasi TTE service
- G26 — OCR isi PDF + search isi — IDE
- G27 — e-sign + workflow approval berjenjang — IDE
- G28 — Integrasi e-Kinerja BKN — tarik SKP otomatis — IDE
- G29 — Retensi otomatis + BA musnah digital — IDE — butuh TTE
- G30 — Dashboard pimpinan eksekutif + export PDF tahunan — IDE
