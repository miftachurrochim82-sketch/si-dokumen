# 📁 SIDOKUMEN — Sistem Dokumen Kinerja (v1.0)

Gudang file Perjanjian Kinerja, Sasaran SKP Tahunan, Sasaran SKP Periodik/Perubahan, PK Perubahan, Penilaian SKP Bulanan/Tahunan, Laporan Kinerja, LHKPN, IKI, dll — untuk Satpol PP & Damkar Kab. Trenggalek.

> Versi: v1.0 Gate 0 (2026-09-21 malam) — dokumen-dulu
> Template: starter-kit v2.10.1 (11 sheet + 72 handler + RTL + UIUX v1.10)
> CoreLib pin 15 (v2.3.0) • CDN @v2.8.1 • Vue 3.5.42 • Tema #065f46 emerald-800

## Masalah
File kinerja tercecer di WA/email/laptop, tidak tahu siapa belum upload, cari file lama susah, tidak ada rekap kelengkapan.

## Solusi v1 (KONTRAK)
- Master jenis dokumen fleksibel (10 seed awal, admin bisa tambah)
- Upload PDF ≤10MB ke Drive folder 'SIDOKUMEN' (file_drive_id disimpan di sheet)
- T_DOKUMEN CRUD + filter tahun/bulan/jenis/status/pegawai/unit + duplikat guard pegawai+tahun+jenis+bulan
- Status baru→menunggu→disetujui/revisi + log T_VERIFIKASI
- Dashboard 4 KPI (total, baru/menunggu, disetujui, % lengkap) + 2 chart + tabel terbaru + panel belum lengkap
- Rekap per jenis (L4), per pegawai (L5) dengan % + progress bar, per unit
- UIUX v1.10: min-w + table-scroll + badge valid + app-stat-card + btn-icon + filter label + modal v-if

## Skema 11 sheet
- Master 3: M_JENIS_DOKUMEN, M_KATEGORI_DOKUMEN, M_PERIODE
- Tabel 8: T_DOKUMEN (utama), T_VERIFIKASI, T_LAMPIRAN, T_LOGBOOK, T_APPROVAL, T_JADWAL, T_REKAP, T_TINDAK_LANJUT (RTL)
- Drive: folder 'SIDOKUMEN' + subfolder tahun, file naming {tahun}_{kode}_{nama}_{bulan}.pdf

## File src (16)
- appsscript.json, 00_Utils.gs, 01_ConfigAndBridge.gs (11 sheet + 72 handler), 02_AppLogic.gs (72 handler + Drive upload + rekap), 99_TestSuite.gs, Index.html (tema #065f46), V_Dashboard.html, V_Dokumen.html, V_Rekap.html, V_Master.html, V_Modals.html, J_State.html, J_Helpers.html, J_Api.html, J_Actions.html, J_App.html

## Cara pakai (13 langkah starter-kit)
1. Buat spreadsheet baru + proyek GAS baru
2. Copy 16 file src whole-file
3. Set Script Properties SPREADSHEET_ID, MASTER_SPREADSHEET_ID, PLATFORM_API_URL
4. appsscript.json pastikan CoreLib pin 15
5. Jalankan initDatabase() → 11 sheet + seed 10 jenis + 5 kategori
6. Deploy Web App (USER_DEPLOYING, ANYONE_ANONYMOUS) → URL /exec
7. Daftar di si-platform applications (code SIDOKUMEN)
8. Uji SSO + upload PDF pertama + verifikasi + rekap

## Test
- runAllTestsSidokumen() — library 42/0/1 + routing 72 + domain dokumen

## Roadmap
- v1.0 KONTRAK: upload + cari + rekap kelengkapan (ini)
- v1.1 ROADMAP: preview PDF inline, export Excel KOP, timeline verifikasi, lonceng belum upload, menu ⋮, preset rentang
- v1.2 ROADMAP: TTE, WA deadline, jadwal, integrasi SILAHAR, lampiran multiple, logbook, approval berjenjang
