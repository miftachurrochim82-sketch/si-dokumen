# 00_ALUR — Alur Gate 0 → Build — SIDOKUMEN v1.6.3 full sync

> Template dari starter-kit/docs/00_ALUR.md v2.10.0
> App: SIDOKUMEN — Sistem Dokumen Kinerja (Perjanjian Kinerja, SKP, Penilaian, Lapkin, dll)
> Versi: v1.6.3 full sync — 35 output (L12+A10+E8+R5) — 11 sheet + 87 handler + Drive + frontend GAS truth
> Tanggal: 2026-09-22 — Gate 0 → v1.6.3
> Frontend: Index v1.0.2 + J_State v1.0.3 + J_Actions v1.0.3 + J_Api/J_App/J_Helpers v1.0.2 + V_ 9 files v1.0.2
> Backend: 00_Utils v1.0.2 + 01_Config v1.0.2 + 02_AppLogic v1.0.2 + 10_Laporan v1.0.2 + 13_Rekap v1.5 + 14_Analisa v1.6 + 15_Lanjut v1.7 + 16_Evaluasi v1.8 + 17_Rtl v1.9 + 99_TestSuite v1.0.2
> Test: GREEN 42/0/1 + 29/0 + 14/0 — runAllTestsSidokumen

## Prinsip Gate 0 (dokumen dulu, kode kemudian)
- Satu baris dokumen = satu item kode (FR → handler, sheet → header, UI → komponen)
- ❓ = jangan tebak — tulis pertanyaan, kunci jawaban tertulis dari pemilik
- View ≠ sheet baru — cek dulu apakah bisa pakai filter/computed
- Piramida: Laporan 12 (L1-L12) → Analisa 10 (A1-A10) → Evaluasi 8 (E1-E8) → RTL 5 (R1-R5) = 35 output puncak

## 9 Pertanyaan Wajib Gate 0 (sudah dijawab 2026-09-21, tetap valid v1.6.3)
1. Siapa upload? **Campur — pegawai bisa, admin TU bisa, ada jejak uploaded_by + role-guard frontend v1.0.3**
2. Jenis dokumen apa? **7 wajib + fleksibel — master M_JENIS_DOKUMEN bisa ditambah admin (PK, Sasaran SKP Tahunan, Sasaran SKP Periodik/Perubahan, PK Perubahan, Penilaian Bulanan, Penilaian Tahunan, Lapkin + LHKPN, IKI, dll) — seed 10**
3. Fitur v1? **Upload + cari + rekap kelengkapan + piramida penuh: Laporan 12 + Analisa 10 + Evaluasi 8 + RTL 5 + export Khas 7 sheet + frontend GAS truth v1.0.2/v1.0.3**
4. Periode? **Tahunan + Bulanan + Periodik/Perubahan — pakai field tahun + bulan + periode_label**
5. Verifikasi? **v1 sederhana — status baru/menunggu/disetujui/revisi, admin verifikasi, jejak di T_VERIFIKASI — SLA 3 hari + E1/E2 + R3**
6. File? **PDF utama, ≤10MB, simpan di Drive folder 'SIDOKUMEN', file_drive_id di sheet — L10 file bermasalah cek mime/size — frontend FileReader base64 + nextTick reset**
7. Pencarian? **Per pegawai, per tahun, per jenis, per status, per unit (via SIMPEG) — L1 daftar dokumen + filter-bar-analytics + pagination server-side tunggal**
8. Rekap? **Per pegawai kelengkapan %, per jenis total, per unit, per tahun — L4 per jenis, L5 per unit, L6 per pegawai matrix, L11 kepatuhan vs T_JADWAL — V_Laporan v1.0.2**
9. RTL? **Puncak piramida — R1 Lengkapi Dokumen (dari E3), R2 Perbaiki Format (dari E4), R3 Verifikasi Tertunda (dari E1/A9), R4 Arsipkan Lama (dari E6), R5 Pembinaan Pegawai (dari E5 <50%) — auto-generate idempoten dedup judul + V_Rtl v1.0.2 clamp progress**

## Tahapan Build v1.6.3 full sync
1. Gate 0 docs 01-08 v1.0 → v1.5 full (87 handler) → v1.6.3 sync frontend
2. Backend split per-domain: 10_LaporanApi (L1-L3,L7-L10), 13_LaporanRekapApi (L4-L6,L11,L12 khas 7 sheet), 14_AnalisaApi v1.6 (A3-A5), 15_AnalisaLanjutApi v1.7 (A6-A10), 16_EvaluasiApi v1.8 (E1-E8), 17_RtlApi v1.9 (R1-R5 + RTL_TRANSISI_LEGAL)
3. Config 01_ConfigAndBridge 72→87 actionLevels + AppLogic buildLocalHandlers wiring 19 baru + ensureLocalSheets_()
4. Frontend GAS truth v1.0.2/v1.0.3: Index v1.0.2 (7 V_ + 5 J_), J_State v1.0.3 fix dokumenTotalPagesServer + rtlBaruCount, J_Actions v1.0.3 openDokumenCreate/Edit + role-guard + nextTick reset file input, V_ 9 files v1.0.2 (Analisa/Dashboard/Dokumen/Evaluasi/Laporan/Master/Modals/Rekap/Rtl)
5. State/Api/Actions/App: 8 menu (dashboard,dokumen,laporan,analisa,evaluasi,rtl,master) + brand 35 output + pagination server-side tunggal
6. Zip v1.6.3 — 87KB — 26 src + 9 docs + README — 100% sync GAS=Workspace=GitHub (after upload)

## Perubahan v1.6.3 dari v1.5
- Frontend: Index v1.0.2 GAS truth, J_Actions v1.0.3 nextTick fix, J_State v1.0.3 pagination fix, V_ 9 files v1.0.2 sinkron backend shape (proyeksi retensi, units[] korelasi, pct_, clampPct_)
- Backend: 14 v1.6, 15 v1.7, 16 v1.8, 17 v1.9 tetap, tapi workspace sudah sync GAS
- Docs: 00-08 update ke v1.6.3
- Test: tetap GREEN 42/0/1 + 29/0 + 14/0
