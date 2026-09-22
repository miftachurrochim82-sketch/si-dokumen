# 01_BRD — Business Requirements Document — SIDOKUMEN v1.6.3 full sync

> App: SIDOKUMEN — Sistem Dokumen Kinerja
> Versi: v1.6.3 full sync — 35 output (L12+A10+E8+R5) — 11 sheet + 87 handler + Drive + frontend GAS truth v1.0.2/v1.0.3
> Pemilik: Satpol PP dan Damkar Kab. Trenggalek — TU/Kepegawaian
> Tanggal: 2026-09-22
> Frontend: Index v1.0.2 + J_State v1.0.3 + J_Actions v1.0.3 nextTick + V_ 9 files v1.0.2
> Backend: 14 v1.6 + 15 v1.7 + 16 v1.8 + 17 v1.9

## 1. Latar Belakang & Masalah
Setiap tahun kantor harus mengumpulkan file:
- Perjanjian Kinerja (PK)
- Sasaran SKP Tahunan
- Sasaran SKP Periodik/Perubahan
- Perjanjian Kinerja Perubahan
- Penilaian SKP Bulanan
- Penilaian SKP Tahunan
- Laporan Kinerja (Lapkin)
- Plus: LHKPN, IKI, SKP lainnya, file pendukung

**Masalah umum:**
- File tercecer di WA, email, laptop masing-masing
- Tidak tahu siapa sudah upload, siapa belum — butuh rekap kelengkapan per pegawai/jenis/unit
- Format tidak standar (bukan PDF, >10MB, nama acak) — butuh evaluasi format
- Verifikasi lambat — butuh SLA 3 hari + evaluasi + RTL
- Kadaluarsa arsip 5 tahun — butuh retensi + BA musnah
- Frontend lama bug pagination + role-guard belum ada — butuh fix v1.0.3

## 2. Tujuan Bisnis v1.6.3 full sync
- Gudang tunggal file kinerja — semua PDF di Drive folder 'SIDOKUMEN' + jejak uploaded_by + role-guard frontend v1.0.3 (user biasa auto-fill pegawai_id sendiri, anti spoofing)
- **Piramida laporan:** L1-L12 (12 output) — daftar, per jenis/pegawai/unit/periode/status/keterlambatan/file bermasalah/kepatuhan/khas 7 sheet — V_Laporan v1.0.2 sinkron backend shape
- **Piramida analisa:** A1-A10 — distribusi unit top8, top pengumpul top10, beban verifikator, retensi 5yr proyeksi, korelasi jenis×unit matrix 5×8, TTE ratio placeholder 0%, SLA pejabat lewat >3 hari, kritis bulanan 12 bulan — V_Analisa v1.0.2
- **Piramida evaluasi:** E1-E8 — SLA verifikasi, SLA upload vs T_JADWAL, kelengkapan missing 5 kategori, format regex nama standar, kepatuhan jenis reuse L11, kadaluarsa ≤tahun-5 tanpa BA, fisik proxy lokasi_fisik, alih media % digital — V_Evaluasi v1.0.2
- **Piramida RTL:** R1-R5 puncak — auto-generate idempoten dedup judul dari E3/E4/E1/E6/E5 — V_Rtl v1.0.2 clamp progress + stats 4 + modal lg/md
- **Frontend GAS truth:** Index v1.0.2 + J_State v1.0.3 fix dokumenTotalPagesServer + J_Actions v1.0.3 nextTick reset file input — 100% sync GAS=Workspace=GitHub
- **Dashboard:** 8 KPI (total, baru, disetujui, % lengkap + total RTL, baru, selesai, export khas) + tren L7 + status L8 + terbaru L1 + belum lengkap L6 — V_Dashboard v1.0.2 nullish-safe

## 3. Stakeholder
- Pegawai: upload dokumen sendiri, lihat rekap kelengkapan sendiri
- Admin TU / Verifikator: verifikasi status, lihat semua pegawai, generate RTL, export Khas 7 sheet
- Pimpinan: lihat dashboard 8 KPI + laporan kepatuhan + analisa beban + evaluasi SLA
- Auditor: butuh jejak AUDIT_LOGS + T_VERIFIKASI + BA musnah di T_TINDAK_LANJUT

## 4. Ruang Lingkup v1.6.3
**In:**
- Master fleksibel M_JENIS_DOKUMEN 10 seed + M_KATEGORI 5 + M_PERIODE 3 (2024-2026)
- T_DOKUMEN CRUD + upload PDF ≤10MB base64 → Drive SIDOKUMEN/{tahun} + duplikat guard pegawai+tahun+jenis+bulan + role-guard frontend
- Laporan 12 output + Analisa 10 + Evaluasi 8 + RTL 5 = 35 output
- Export Khas L12 7 sheet (Cover KOP, Ringkasan, Rekap Jenis, Unit, Pegawai, Kepatuhan, TTD) → folder SIDOKUMEN Export
- Dashboard 8 KPI + 2 chart
- Test GREEN 42/0/1 + 29/0 + 14/0

**Out (v2):**
- Preview PDF inline iframe, export Excel per pegawai, timeline verifikasi bertingkat, lonceng notifikasi, TTE digital real, OCR

## 5. Kriteria Sukses v1.6.3
- Semua pegawai bisa upload PDF ≤10MB, admin bisa verifikasi, status berubah, jejak di T_VERIFIKASI
- Laporan L4/L6/L11 tampil % kelengkapan per pegawai/jenis/unit, L12 export 7 sheet jadi dengan file_url
- Analisa A3 distribusi unit top8, A4 top10, A9 SLA lewat >3 hari, A6 retensi proyeksi 5 tahun, A7 matrix 5×8
- Evaluasi E3 missing tanpa_file, E4 format regex, E6 kadaluarsa tanpa BA, E8 % digital
- RTL generate dari E3/E4/E1/E6/E5 idempoten dedup judul, transisi legal baru→diproses→selesai/batal, progress clamp
- Frontend: pagination server-side tunggal dokumenTotalPagesServer, role-guard pegawai_id, nextTick reset file input, V_ 9 files v1.0.2 sinkron backend shape
- Test runAllTestsSidokumen GREEN

## 6. Risiko & Mitigasi v1.6.3
- File besar >10MB → UI check + L10 flag + toast error
- Duplikat upload → guard + tampilkan file lama
- Bug pagination Vue3 (dokumenTotalPages conflict) → fix v1.0.3 dokumenTotalPagesServer
- Spoofing pegawai_id → role-guard frontend + backend check actor pegawai_id
- Ref file input undefined karena v-if modal → fix nextTick di J_Actions v1.6.3
