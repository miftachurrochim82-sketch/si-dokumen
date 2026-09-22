# 📁 SIDOKUMEN — Sistem Dokumen Kinerja (v1.6.3 full sync)

Gudang file Perjanjian Kinerja, Sasaran SKP Tahunan, Sasaran SKP Periodik/Perubahan, PK Perubahan, Penilaian SKP Bulanan/Tahunan, Laporan Kinerja, LHKPN, IKI, dll — untuk Satpol PP & Damkar Kab. Trenggalek.

> Versi: v1.6.3 full sync — 35 output + Index v1.0.2 + J_Actions v1.0.3 nextTick + J_State v1.0.3 + V_ 9 files v1.0.2 + backend 14-17 v1.6-v1.9 + docs v1.6.3 — 2026-09-22 05:51
> Workspace = GAS truth (15 frontend + 10 backend) — 26 src + 9 docs v1.6.3 + README — 100% sync GAS=Workspace=GitHub (after upload) — zip 96KB
> Template: starter-kit v2.10.1 (11 sheet + 87 handler + RTL + UIUX v1.10)
> CoreLib pin 15 (v2.3.0) • CDN @v2.8.1 • Vue 3.5.42 • FA 6.5.2 • Tema #065f46 emerald-800
> Test: 🎉 HIJAU — Library 42/0/1 + Routing 29/0 + Domain 14/0 (runAllTestsSidokumen)
> Sync: workspace = GAS = GitHub (after upload batch) — 26 src + 9 docs + README v1.6.1 — frontend GAS truth

## Masalah

File kinerja tercecer di WA/email/laptop, tidak tahu siapa belum upload, cari file lama susah, tidak ada rekap kelengkapan, format tidak standar, verifikasi lambat, arsip kadaluarsa tanpa BA.

## Solusi v1.6 full (35 output)

### Dokumen (L1)
- **T_DOKUMEN** CRUD + filter tahun/bulan/jenis/status/pegawai/unit/search + pagination 20 + duplikat guard pegawai+tahun+jenis+bulan
- Upload PDF ≤10MB via FileReader base64 → Drive folder `SIDOKUMEN/{tahun}` → `file_drive_id` + `file_name` + `file_size` + `file_mime` disimpan
- Status `baru→menunggu→disetujui/revisi/ditolak` + log `T_VERIFIKASI` + SLA 3 hari

### Laporan 12 Output (L1-L12)
- **L1** Daftar Dokumen — `laporan_daftar_dokumen`
- **L2** per Jenis — filter `jenis_dokumen_id`
- **L3** per Pegawai — filter `pegawai_id`
- **L4** Rekap per Jenis — `lap_rekap_klasifikasi`
- **L5** Rekap per Unit — `lap_rekap_unit`
- **L6** Rekap per Pegawai — `lap_rekap_pegawai` — matrix pegawai×jenis
- **L7** Rekap per Periode — `laporan_rekap_periode`
- **L8** Rekap per Status — `laporan_rekap_status`
- **L9** Keterlambatan — `laporan_keterlambatan` — vs `T_JADWAL`
- **L10** File Bermasalah — `laporan_file_bermasalah`
- **L11** Kepatuhan Upload — `lap_kepatuhan_upload`
- **L12** Laporan Khas 7 sheet — `laporan_khas_data` + `laporan_export_khas` — Spreadsheet `SIDOKUMEN_KHAS_{tahun}` 7 sheets

### Analisa 10 Output (A3-A10)
- **A3** Distribusi Unit — `analisa_distribusi_unit` — top 8 unit
- **A4** Top Pengumpul — `analisa_top_pengirim` — top 10 pegawai + %
- **A5** Beban Verifikator — `analisa_beban_pejabat`
- **A6** Retensi — `analisa_retensi` — proyeksi 5 tahun musnah/permanen
- **A7** Korelasi Jenis×Unit — `analisa_korelasi_jenis_unit` — matrix top5×top8
- **A8** TTE Ratio — `analisa_tte_ratio` — placeholder 0% (future G15)
- **A9** SLA Pejabat — `analisa_sla_pejabat` — lewat >3 hari
- **A10** Kritis Bulanan — `analisa_kritis_bulanan` — 12 bulan jml+belum

### Evaluasi 8 Output (E1-E8)
- **E1** SLA Verifikasi — `evaluasi_sla_verifikasi`
- **E2** SLA Upload — `evaluasi_sla_upload` vs T_JADWAL
- **E3** Kelengkapan — `evaluasi_kelengkapan` — missing 5 kategori
- **E4** Format — `evaluasi_format` — regex nama standar
- **E5** Kepatuhan Jenis — `evaluasi_kepatuhan_jenis`
- **E6** Kadaluarsa — `evaluasi_kadaluarsa` — ≤tahun-5 tanpa BA
- **E7** Fisik — `evaluasi_fisik` — proxy lokasi_fisik
- **E8** Alih Media — `evaluasi_alih_media` — % digital

### RTL 5 Output (R1-R5) — Puncak Piramida
- **R1** Lengkapi Dokumen — dari E3
- **R2** Perbaiki Format — dari E4
- **R3** Verifikasi Tertunda — dari E1/A9
- **R4** Arsipkan Dokumen Lama — dari E6
- **R5** Pembinaan Pegawai — dari E5 <50%
- Handler: `get_tindak_lanjut_list`, `save_tindak_lanjut`, `ubah_status_tindak_lanjut` (legal baru→diproses→selesai/batal), `generate_tindak_lanjut` idempoten dedup judul
- UI: V_Rtl — generate panel + stats 4 + filter + table + badge + progress-track + modal lg/md

## Skema 11 sheet

- Master 3: M_JENIS_DOKUMEN (10 seed), M_KATEGORI_DOKUMEN (5), M_PERIODE (2024,2025,2026)
- Tabel 8: T_DOKUMEN, T_VERIFIKASI, T_LAMPIRAN, T_LOGBOOK, T_APPROVAL, T_JADWAL, T_REKAP, T_TINDAK_LANJUT
- Drive: `SIDOKUMEN/{tahun}` + `SIDOKUMEN Export`

## File src (26) — v1.6.1 frontend GAS truth

- `appsscript.json` — CoreLib pin 15 v2.3.0 — **sebelumnya missing di GitHub, sekarang ada**
- `00_Utils.gs` — audit_, getOrCreateFolder_ — **sebelumnya missing di GitHub, sekarang ada**
- `01_ConfigAndBridge.gs` v1.0.2 — 11 sheet + 87 actionLevels + isRefSheet_ fix + KONFIGURASI/cfg
- `02_AppLogic.gs` v1.0.2 — 91 handlers + ensureLocalSheets_ + seed 10+5+3
- `10_LaporanApi.gs` v1.0.2 — buildDeadlineMap_ fix T_JADWAL
- `13_LaporanRekapApi.gs` v1.5 — L4/L5/L6/L11/L12 khas 7 sheet export
- `14_AnalisaApi.gs` v1.6 — A3/A4/A5
- `15_AnalisaLanjutApi.gs` v1.7 — A6/A7/A8/A9/A10
- `16_EvaluasiApi.gs` v1.8 — E1-E8
- `17_RtlApi.gs` v1.9 — R1-R5 + RTL_TRANSISI_LEGAL_ baru→diproses/batal→selesai + idempoten
- `99_TestSuite.gs` v1.0.2 — 12 sheet + 91 handlers
- `Index.html` v1.0.2 — GAS truth — tema #065f46 + 7 V_ include + 5 J_ include
- `J_State.html` v1.0.3 — **fix dokumenTotalPages → dokumenTotalPagesServer + rtlBaruCount/diproses/selesai/batal**
- `J_Actions.html` v1.0.3 — **NEW: openDokumenCreate/openJenisCreate/openRtlCreate + role-guard pegawai_id auto-fill + FileReader base64 ≤10MB**
- `J_Api.html` v1.0.2, `J_Helpers.html` v1.0.2, `J_App.html` v1.0.2 — platformUrl + brand 35 output
- `V_Dashboard.html` v1.0.2 8 KPI, `V_Dokumen.html`, `V_Laporan.html` v1.0.2 8 tab, `V_Analisa.html` v1.0.2 8 tab, `V_Evaluasi.html` v1.0.2 8 tab, `V_Rtl.html`, `V_Master.html`, `V_Modals.html`, `V_Rekap.html`

## Docs (9) — Gate 0 v1.5

- `00_ALUR.md`, `01_BRD.md` (**sebelumnya missing di GitHub**), `02_PRD.md`, `03_FRD.md`, `04_DATABASE.md`, `05_UIUX.md`, `06_API_FLOW.md`, `07_TESTCASE.md`, `08_GAP_LIST.md`

## Sync Status 2026-09-22

- GAS: 00_Utils v1.0.2 + 01 v1.0.2 + 02 v1.0.2 + 10 v1.0.2 + 13 v1.5 + 14 v1.6 + 15 v1.7 + 16 v1.8 + 17 v1.9 + 99 v1.0.2 ✅ GREEN
- Workspace: 26 src synced — J_State upgraded to v1.0.3 dari GitHub (fix pagination conflict)
- GitHub: perlu upload — `src/00_Utils.gs`, `src/appsscript.json`, `docs/01_BRD.md`, `src/14-17` terbaru, `README.md` v1.6 — setelah itu 100% sync

## Cara upload ke GitHub (drag-drop)

1. Buka https://github.com/miftachurrochim82-sketch/si-dokumen
2. Drag-drop file zip `si-dokumen-v1.6-full.zip` ATAU upload manual folder `src/` + `docs/` + `README.md`
3. File wajib ada: `src/00_Utils.gs`, `src/appsscript.json`, `docs/01_BRD.md` — ini yang kemarin missing
4. Commit message: `v1.6 full sync — 00_Utils + appsscript.json + 01_BRD + 14-17 v1.6-v1.9 + J_State v1.0.3`
5. Verifikasi: repo harus 26 src + 9 docs + README v1.6 — total 36 files

## Cara pakai (13 langkah)

1. Buat spreadsheet baru + proyek GAS baru
2. Copy 26 file src whole-file
3. Set Script Properties: SPREADSHEET_ID, MASTER_SPREADSHEET_ID, PLATFORM_API_URL
4. `initDatabase()` → 11 sheet + seed
5. `runAllTestsSidokumen()` → HIJAU 42/0/1 + 29/0 + 14/0
6. Deploy Web App USER_DEPLOYING ANYONE_ANONYMOUS
7. Daftar di si-platform code SIDOKUMEN
8. Uji upload PDF + Laporan L12 7 sheet + Analisa + Evaluasi + RTL generate

## Test

```js
runAllTestsSidokumen()
// Library PASS 42 FAIL 0 SKIP 1
// Routing 29/0 — localHandlers 91
// Domain PASS 14 FAIL 0 — JENIS.1, DOK.1, DOK.2, DOK.3, L4, L6, L11, L12, A3, A9, E3, E4, R generate, SCHEMA 11
// 🎉 SEMUA HIJAU FULL PIRAMIDA
```

## Roadmap

- v1.6 DONE: full sync 35 output + J_State fix + GAS v1.6-v1.9
- v1.7 NEXT: preview PDF inline, export Excel per pegawai, timeline verifikasi, menu ⋮
- v2.0 IDE: TTE digital + OCR + e-sign + integrasi e-Kinerja BKN

## Lisensi

Internal Satpol PP & Damkar Kab. Trenggalek — starter-kit v2.10.1
