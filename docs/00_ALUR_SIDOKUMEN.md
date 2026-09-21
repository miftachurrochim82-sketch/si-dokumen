# 00_ALUR — Alur Gate 0 → Build — SIDOKUMEN v1.5 full piramida

> Template dari starter-kit/docs/00_ALUR.md v2.10.0
> App: SIDOKUMEN — Sistem Dokumen Kinerja (Perjanjian Kinerja, SKP, Penilaian, Lapkin, dll)
> Versi: v1.5 full piramida 35 output (L12+A10+E8+R5) — 11 sheet + 87 handler + Drive
> Tanggal: 2026-09-21 malam — Gate 0 → full

## Prinsip Gate 0 (dokumen dulu, kode kemudian)
- Satu baris dokumen = satu item kode (FR → handler, sheet → header, UI → komponen)
- ❓ = jangan tebak — tulis pertanyaan, kunci jawaban tertulis dari pemilik
- View ≠ sheet baru — cek dulu apakah bisa pakai filter/computed
- Piramida: Laporan 12 (L1-L12) → Analisa 10 (A1-A10) → Evaluasi 8 (E1-E8) → RTL 5 (R1-R5) = 35 output puncak

## 9 Pertanyaan Wajib Gate 0 (sudah dijawab 2026-09-21)
1. Siapa upload? **Campur — pegawai bisa, admin TU bisa, ada jejak uploaded_by**
2. Jenis dokumen apa? **7 wajib + fleksibel — master M_JENIS_DOKUMEN bisa ditambah admin (PK, Sasaran SKP Tahunan, Sasaran SKP Periodik/Perubahan, PK Perubahan, Penilaian Bulanan, Penilaian Tahunan, Lapkin + LHKPN, IKI, dll) — seed 10**
3. Fitur v1? **Upload + cari + rekap kelengkapan + piramida penuh: Laporan 12 + Analisa 10 + Evaluasi 8 + RTL 5 + export Khas 7 sheet**
4. Periode? **Tahunan + Bulanan + Periodik/Perubahan — pakai field tahun + bulan + periode_label**
5. Verifikasi? **v1 sederhana — status baru/menunggu/disetujui/revisi, admin verifikasi, jejak di T_VERIFIKASI — SLA 3 hari**
6. File? **PDF utama, ≤10MB, simpan di Drive folder 'SIDOKUMEN', file_drive_id di sheet — L10 file bermasalah cek mime/size**
7. Pencarian? **Per pegawai, per tahun, per jenis, per status, per unit (via SIMPEG) — L1 daftar dokumen + filter-bar-analytics**
8. Rekap? **Per pegawai kelengkapan %, per jenis total, per unit, per tahun — L4 per jenis, L5 per unit, L6 per pegawai matrix, L11 kepatuhan vs T_JADWAL**
9. RTL? **Puncak piramida — R1 Lengkapi Dokumen (dari E3 belum_lengkap), R2 Perbaiki Format (dari E4), R3 Verifikasi Tertunda (dari E1/A9 lewat), R4 Arsipkan Lama (dari E6 kadaluarsa tanpa BA), R5 Pembinaan Pegawai (dari E5 <50%) — auto-generate idempoten dedup judul**

## Tahapan Build v1.5 full
1. Gate 0 docs 01-08 v1.0 → v1.5 full (87 handler)
2. Backend split per-domain: 10_LaporanApi (L1-L3,L7-L10), 13_LaporanRekapApi (L4-L6,L11,L12 khas 7 sheet), 14_AnalisaApi (A3-A5), 15_AnalisaLanjutApi (A6-A10), 16_EvaluasiApi (E1-E8), 17_RtlApi (R1-R5)
3. Config 01_ConfigAndBridge 72→87 actionLevels + AppLogic buildLocalHandlers wiring 19 baru
4. Frontend: V_Laporan (4 tab L4/L6/L11 + export Khas L12), V_Analisa (8 tab A3-A10), V_Evaluasi (8 tab E1-E8), V_Rtl (R1-R5 generate + progress bar + modal lg/md)
5. State/Api/Actions/App: 8 menu (dashboard,dokumen,laporan,analisa,evaluasi,rtl,master,pengaturan) + brand 35 output
6. TestSuite full piramida 35 output
7. initDatabase() + deploy GAS + runAllTestsSidokumen() → hijau
