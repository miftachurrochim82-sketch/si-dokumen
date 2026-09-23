# 📁 SIDOKUMEN — Sistem Dokumen Kinerja (v1.7.1)

Gudang file Perjanjian Kinerja, Sasaran SKP Tahunan, Sasaran SKP Periodik/Perubahan, PK Perubahan, Penilaian SKP Bulanan/Tahunan, Laporan Kinerja, LHKPN, IKI, dll — untuk Satpol PP & Damkar Kab. Trenggalek.

> Versi: v1.7.1 — 35 output + 12 sheet + 93 handler + 35 domain test — Index v1.0.4 (Tailwind compiled, tanpa Play CDN) + J_State v1.0.4 + J_Helpers v1.0.3 + J_Api v1.0.3 + J_Actions v1.0.4 + J_App v1.0.3 + V_ 7 files v1.0.3 (+V_Master v1.0.2) + backend 01-02 v1.0.4 + 13 v1.0.4 + 17 v1.0.8 + 99 v1.0.5 — 2026-09-22
> ⚠️ Test belum dijalankan ulang di GAS setelah fix keamanan v1.7.1 — wajib jalankan `runAllTestsSidokumen()` (target 35/0) SEBELUM deploy.
> Template: starter-kit v2.10.1 (12 sheet + 93 handler + RTL FSM + UIUX v1.10)
> CoreLib pin 15 (v2.3.0) • CDN @v2.8.1 • Vue 3.5.42 • FA 6.5.2 • Tema #065f46 emerald-800
> Test: 🎯 Domain 35 test (27 base + 8 keamanan K2/K3) — target HIJAU setelah run ulang di GAS
> Sync: workspace = GitHub (after upload) — 26 src + 9 docs + README v1.7.1 — GAS butuh paste 01/02/17/99

## 🆕 Changelog v1.7.1 (dari v1.7.0) — Fix Keamanan (review ekosistem 4 repo)

### 🔴 K2 — bypass verifikasi dokumen ditutup

| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `02_AppLogic.gs` | `save_dokumen` (level `user`) meneruskan `status` bebas → user bisa kirim `status:'disetujui'` dan lolos tanpa verifikator | Non-verifikator: create → status dipaksa `'baru'`; update → status dikunci ke nilai lama |
| 2 | `01_ConfigAndBridge.gs` | Blok `localPreSaveHook_` untuk T_DOKUMEN = dead code (hanya efektif di T_APPROVAL) | Hook diperluas: non-verifikator tak bisa ubah status saat update (pertahanan ganda) |
| 3 | `02_AppLogic.gs` | `verifikasi_dokumen` tanpa state machine + verifikator bisa approve dokumennya sendiri | `DOKUMEN_TRANSISI_LEGAL_` (disetujui = final; revisi/ditolak → baru via unggah ulang) + **anti self-approve** (FORBIDDEN) |

### 🔴 K3 — IDOR (aksi ke dokumen orang lain) ditutup

| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `02_AppLogic.gs` | `delete_dokumen`/`save_dokumen` (level `user`) bekerja utk dokumen **siapa pun** — role-guard `pegawai_id` hanya ada di frontend | `assertOwnerOrAdmin_(actor, row, 'pegawai_id')` (semantik CoreLib RLS: admin/super bypass; owner = `pegawai_id`; baris tanpa owner = hanya admin, fail-closed) |
| 2 | `02_AppLogic.gs` | Create baru bisa men-spoof `pegawai_id` orang lain via API | Non-admin hanya bisa membuat dokumen atas nama sendiri |
| 3 | `17_RtlApi.gs` | `ubah_status_tindak_lanjut` (level `user`) bisa mengubah RTL **siapa pun** | Ownership guard di `assigned_to` (save update + ubah status) + create manual auto-fill `assigned_to` = pembuat |

### 🧪 Test

- `99_TestSuite.gs` v1.0.5 — **+8 test keamanan**: DOK.4 (FSM final), DOK.5 (bypass status), DOK.6 (self-approve), DOK.7 (IDOR create), DOK.8/9 (IDOR delete), R OWN (ownership RTL) → **35 domain test**.
- Aktor test baru: `TEST_USER_B_` (PEG-002), `TEST_VERIFIKATOR_SELF_`.

### 🎨 UI/UX Standar (audit 2026-09-22 — detail di `AUDIT_UIUX_SIDOKUMEN.md` workspace)

| # | Perbaikan |
|---|---|
| 1 | **Play CDN dihapus** → CSS Tailwind v3.4.17 ter-compile (39,7 KB inline; Index 43,8 KB < batas 50 KB GAS) |
| 2 | Fix bug E7: teks `:subtext` literal JavaScript tampil mentah di kartu |
| 3 | ID mentah → nama: unit (A3, L5 + backend `unit_nama` baru), pegawai & jenis (E3, E6) |
| 4 | Tombol Verifikasi kini `v-can="'verifikator'"` (user biasa tidak melihat tombol yang pasti gagal) |
| 5 | Form RTL: field Status dihapus (status hanya via modal Ubah Status + state machine backend) |
| 6 | Tab A8 TTE ("field belum ada") disembunyikan — fitur setengah jadi tidak dipamerkan |
| 7 | Filter Tahun (13 tempat) = select `tahunOptions`, bukan teks bebas |
| 8 | Chart Tren 12 bulan akurat dari server (L7 × 2 tahun), bukan 20 baris halaman pertama |
| 9 | Ukuran file human-readable, icon menu unik, title tanpa versi internal |

## 🆕 Changelog v1.7.0 (dari v1.6.3)

### 🔴 Bugfix Kritis Backend

| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `10_LaporanApi.gs` | `buildDeadlineMap_` key tidak match `T_JADWAL` → `laporanKeterlambatan_` selalu 0 | Dual-map `{byDokumen, byJenis}` |
| 2 | `13_LaporanRekapApi.gs` | `lapKepatuhanUpload_` deadline blanket `Jan-31` → angka palsu | Pakai `buildDeadlineMap_` + `no_deadline` transparan |
| 3 | `14_AnalisaApi.gs` | `analisaBebanPejabat_.lewat` **selalu 0** | Hitung real SLA >3 hari |
| 4 | `15_AnalisaLanjutApi.gs` | `analisaKritisBulanan_.expected` hardcode `×1` | Hitung `pegawai × jenis_bulanan` |
| 5 | `16_EvaluasiApi.gs` | `evaluasiSlaUpload_` map kosong | Pakai `buildDeadlineMap_` |
| 6 | `16_EvaluasiApi.gs` | `evaluasiFisik_` akses field non-existent | Tambah `lokasi_fisik` di header + real counter |
| 7 | `17_RtlApi.gs` | `saveTindakLanjut_` bisa bypass state machine | BLOKIR update `status_rtl` & `judul_rtl` langsung |

### 🟠 Perbaikan Performa

| # | Fungsi | Sebelum | Sesudah |
|---|---|---|---|
| 1 | `analisaKorelasiJenisUnit_` | O(j×u×n) = 5×8×n | Single-pass O(n) |
| 2 | `analisaSlaPejabat_` | `findRecordById_` per baris | Pre-index `dokMap` |
| 3 | `evaluasiKadaluarsa_` | O(n²) `indexOf` | `split(',')` + map |
| 4 | `namaPegawai_` / `namaJenisDokumen_` | O(n) scan list | O(1) cached map |
| 5 | `analisaRetensi_` | 5× scan list | Pre-count by year O(n) |

### 🟢 Fitur Baru

- **`KONFIGURASI` sheet** — key-value store (12 sheet dari 11)
- **`T_DOKUMEN.lokasi_fisik` + `.kondisi_fisik`** — tracking arsip fisik real (E7)
- **Field SLA parameter** — `sla_hari` di E1/A9 (default 3)
- **Breakdown R1-R5** di `generate_tindak_lanjut` → `detail.{r1..r5}` + `errors[]`
- **`total_with_deadline` / `no_deadline`** di E2/L11 — transparansi
- **`total_with_dokumen` / `no_dokumen`** di E1/A9
- **`musnah_netto`** di A6 — retensi net
- **`expected`** per baris di A10
- **`regex`** field di E4
- **`dengan_ba`** di E6
- **`unit_nama`** di A3
- **`jsonSafe_`** di `00_Utils.gs` — escape XSS ticket SSO
- **`AUDIT_DRY_RUN`** — skip HTTP audit saat test

### 🔵 Frontend (UIUX v1.1.0)

- **Splash screen** — logo SD + brand + spinner
- **Hero banner Dashboard** — gradient emerald + progress kelengkapan
- **Quick stats** di V_Dokumen (4 KPI) + V_Master (4 KPI)
- **Search + clear button** di V_Dokumen & V_Master
- **Progress bar color-coded** — merah <50%, kuning 50-79%, hijau ≥80%
- **Pagination lengkap** — First/Last + info "X dari Y"
- **Breakdown R1-R5 panel** di V_Rtl setelah generate
- **Quick-pick status buttons** di modal verifikasi & RTL
- **Info banner** E1/E2 — transparansi
- **Badge chips** per issue di E3/E4/L10
- **Role-guard dropdown** pegawai disabled untuk non-admin
- **Immutable fields** saat edit RTL
- **Debounce 350ms** — search tidak spam API

## Masalah

File kinerja tercecer di WA/email/laptop, tidak tahu siapa belum upload, cari file lama susah, tidak ada rekap kelengkapan, format tidak standar, verifikasi lambat, arsip kadaluarsa tanpa BA.

## Solusi v1.7.0 full (35 output)

### Dokumen (L1)
- **T_DOKUMEN** CRUD + filter tahun/bulan/jenis/status/pegawai/unit/search + pagination 20 + duplikat guard pegawai+tahun+jenis+bulan
- Upload PDF ≤10MB via FileReader base64 → Drive folder `SIDOKUMEN/{tahun}` → `file_drive_id` + `file_name` + `file_size` + `file_mime` disimpan
- Status `baru→menunggu→disetujui/revisi/ditolak` + log `T_VERIFIKASI` + SLA 3 hari
- **Baru:** `lokasi_fisik` + `kondisi_fisik` untuk tracking arsip fisik
- **Baru:** Role-guard frontend — user biasa auto-fill `pegawai_id` sendiri

### Laporan 12 Output (L1-L12)
- **L1** Daftar Dokumen — `laporan_daftar_dokumen`
- **L2** per Jenis — filter `jenis_dokumen_id`
- **L3** per Pegawai — filter `pegawai_id`
- **L4** Rekap per Jenis — `lap_rekap_klasifikasi`
- **L5** Rekap per Unit — `lap_rekap_unit` — dengan `unit_nama`
- **L6** Rekap per Pegawai — `lap_rekap_pegawai` — matrix pegawai×jenis + nip + unit_id
- **L7** Rekap per Periode — `laporan_rekap_periode`
- **L8** Rekap per Status — `laporan_rekap_status`
- **L9** Keterlambatan — `laporan_keterlambatan` — vs `T_JADWAL` dual-map + `jadwal_total`
- **L10** File Bermasalah — `laporan_file_bermasalah` — `issues[]` chips
- **L11** Kepatuhan Upload — `lap_kepatuhan_upload` — `total_with_deadline` + `no_deadline` transparan
- **L12** Laporan Khas 7 sheet — `laporan_khas_data` + `laporan_export_khas` — Spreadsheet `SIDOKUMEN_KHAS_{tahun}` 7 sheets

### Analisa 10 Output (A3-A10)
- **A3** Distribusi Unit — `analisa_distribusi_unit` — top 8 unit + `unit_nama`
- **A4** Top Pengumpul — `analisa_top_pengirim` — top 10 pegawai + %
- **A5** Beban Verifikator — `analisa_beban_pejabat` — `diteruskan/diproses/selesai/lewat` + SLA real
- **A6** Retensi — `analisa_retensi` — proyeksi 5 tahun + `musnah_netto`
- **A7** Korelasi Jenis×Unit — `analisa_korelasi_jenis_unit` — matrix top5×top8 + `units[]` + `matrix[i][unitId]`
- **A8** TTE Ratio — `analisa_tte_ratio` — placeholder 0% (future G15)
- **A9** SLA Pejabat — `analisa_sla_pejabat` — `sla_hari` parametrik + `no_dokumen` counter
- **A10** Kritis Bulanan — `analisa_kritis_bulanan` — `expected` = pegawai × jenis_bulanan

### Evaluasi 8 Output (E1-E8)
- **E1** SLA Verifikasi — `evaluasi_sla_verifikasi` — `total_with_dokumen` + `no_dokumen` + `sla_hari`
- **E2** SLA Upload — `evaluasi_sla_upload` vs T_JADWAL — `total_with_deadline` + `no_deadline`
- **E3** Kelengkapan — `evaluasi_kelengkapan` — missing 5 kategori + `pct_missing`
- **E4** Format — `evaluasi_format` — regex case-insensitive + display pattern
- **E5** Kepatuhan Jenis — `evaluasi_kepatuhan_jenis` — reuse L11
- **E6** Kadaluarsa — `evaluasi_kadaluarsa` — `dengan_ba` + `tanpa_ba` split akurat
- **E7** Fisik — `evaluasi_fisik` — `ada_lokasi` + `pct_ada` (field real)
- **E8** Alih Media — `evaluasi_alih_media` — % digital + `rekap[]`

### RTL 5 Output (R1-R5) — Puncak Piramida
- **R1** Lengkapi Dokumen — dari E3
- **R2** Perbaiki Format — dari E4
- **R3** Verifikasi Tertunda — dari E1/A9
- **R4** Arsipkan Dokumen Lama — dari E6
- **R5** Pembinaan Pegawai — dari E5 <50%
- Handler: `get_tindak_lanjut_list`, `save_tindak_lanjut`, `ubah_status_tindak_lanjut` (legal baru→diproses→selesai/batal→baru reaktivasi), `generate_tindak_lanjut` idempoten dedup judul + breakdown `detail.{r1..r5}`
- **State machine:** `baru → diproses → selesai/batal`, `batal → baru` (reaktivasi), `selesai` final
- **Backend guard:** `save_tindak_lanjut` BLOKIR perubahan `status_rtl` & `judul_rtl` (harus via `ubah_status_tindak_lanjut`)
- UI: V_Rtl — generate panel + stats 4 + filter + table + badge + progress-track color-coded + modal lg/md + breakdown R1-R5

## Skema 12 sheet

- Master 3: M_JENIS_DOKUMEN (10 seed), M_KATEGORI_DOKUMEN (5), M_PERIODE (2024,2025,2026)
- Tabel 8: T_DOKUMEN, T_VERIFIKASI, T_LAMPIRAN, T_LOGBOOK, T_APPROVAL, T_JADWAL, T_REKAP, T_TINDAK_LANJUT
- Sistem 1: **KONFIGURASI** (key-value store, primary key = `key`)
- Drive: `SIDOKUMEN/{tahun}` + `SIDOKUMEN Export`

## File src (26) — v1.7.0

### Backend (10)

- `appsscript.json` v1.0.2 — CoreLib pin 15 v2.3.0 + scope Drive + `developmentMode: false`
- `00_Utils.gs` **v1.0.3** — audit_, sendAuditLog_, **jsonSafe_** (escape XSS) + dry-run guard + self-check
- `01_ConfigAndBridge.gs` **v1.0.3** — **12 sheet** + **93 actionLevels** + isRefSheet_ SIMPEG-only + KONFIGURASI/cfg + T_DOKUMEN.lokasi_fisik + generate_tindak_lanjut→verifikator
- `02_AppLogic.gs` **v1.0.3** — 91 localHandlers + ensureLocalSheets_ + seed 10+5+3 + getDashboard_ RTL stats + filter unit_id + actor fallback (pegawai_id > id > email)
- `10_LaporanApi.gs` **v1.0.3** — L1-L3, L7-L10 + **buildDeadlineMap_ dual-map** `{byDokumen, byJenis}` + `jadwal_total` di L9
- `13_LaporanRekapApi.gs` **v1.0.3** — L4/L5/L6/L11/L12 khas 7 sheet export + `total_with_deadline` + `no_deadline`
- `14_AnalisaApi.gs` **v1.0.4** — A3/A4/A5 + `unit_nama` + **`lewat` real SLA** + pre-index pegawaiNamaMap
- `15_AnalisaLanjutApi.gs` **v1.0.5** — A6/A7/A8/A9/A10 + `musnah_netto` + `sla_hari` + **`expected` = pegawai × jenis_bulanan**
- `16_EvaluasiApi.gs` **v1.0.6** — E1-E8 + **buildDeadlineMap_** + **`total_with_dokumen`/`no_dokumen`** + regex `/i` + `dengan_ba` + `ada_lokasi`
- `17_RtlApi.gs` **v1.0.7** — R1-R5 + `RTL_TRANSISI_LEGAL_` (batal→baru reaktivasi) + **BLOKIR bypass state machine** + `detail.r1..r5` + `errors[]` + idempotensi case-insensitive
- `99_TestSuite.gs` **v1.0.4** — **27 domain test** + `KNOWN_LIB_FAILURES_` toleransi CoreLib + threshold ≥90 localHandlers

### Frontend Entry (1)

- `Index.html` **v1.0.3** — **Splash screen** (logo SD + brand + spinner) + jsonSafe ticket + [v-cloak] + meta SEO + 8 V_ include + 5 J_ include

### Frontend State (5)

- `J_State.html` **v1.0.4** — data + computed + **masterSearch** + **masterFilteredJenis** + **rtlGenerateResult** + cache lookup (O(1))
- `J_Helpers.html` **v1.0.3** — fmtTgl/fmtDateTime/fmtNumber/truncate_ + badge* + **cached lookup** + `pct_`/`clampPct_`/`pctColor_` + debounce 350ms
- `J_Api.html` **v1.0.3** — REST wrapper + **generateRtl breakdown R1-R5** + silent flags + error fallback konsisten
- `J_Actions.html` **v1.0.4** — openDokumenCreate/Edit + openJenisCreate/Edit + openRtlCreate/Edit + **role-guard pegawai_id** + **$nextTick reset file input** + validasi tahun 2000-2100
- `J_App.html` **v1.0.3** — mount app + menu 7 + pageIcons + onNavigate conditional + platformUrl + brand 35 output

### Views (9)

- `V_Dashboard.html` **v1.1.0** — Hero banner + 8 KPI (Dokumen 4 + RTL 4) + 2 chart + 2 tabel + nullish-safe
- `V_Dokumen.html` **v1.1.0** — Quick stats 4 + search+clear + pagination lengkap + emerald hover
- `V_Laporan.html` **v1.1.0** — 8 tab (L4-L11) + progress bar + info banner jadwal_total + export L12 field `sheets` benar
- `V_Analisa.html` **v1.1.0** — 8 tab (A3-A10) + breakdown missing 5 kotak + regex panel + empty state hijau
- `V_Evaluasi.html` **v1.1.0** — 8 tab (E1-E8) + info transparansi + progress color-coded + quick-pick status
- `V_Rtl.html` **v1.1.0** — R1-R5 + **breakdown R1-R5 panel** + state machine + disabled edit untuk final + pagination lengkap
- `V_Master.html` **v1.1.0** — Jenis CRUD + quick stats 4 + search+clear + kode chip mono + keterangan subtitle
- `V_Modals.html` **v1.1.0** — 3 modal (dokumen, jenis, status) + lock indicator + quick-pick status + regex hint
- `V_Rekap.html` — **DEPRECATED** — dihapus dari Index include (sudah di V_Laporan)

## Docs (9) — v1.7.0

- `00_ALUR.md` — Gate 0 → build
- `01_BRD.md` — Business Requirements Document
- `02_PRD.md` — Product Requirements (P1-P8)
- `03_FRD.md` — Functional Requirements (FR-01..FR-12)
- `04_DATABASE.md` — **12 sheet schema** (header akurat — M_KATEGORI.deskripsi, T_LOGBOOK.aksi, T_APPROVAL.urutan, T_JADWAL.dokumen_id, T_REKAP.periode, KONFIGURASI.key)
- `05_UIUX.md` — Design system + komponen + splash + hero + quick stats
- `06_API_FLOW.md` — 93 handler mapping + flow
- `07_TESTCASE.md` — **35 domain test** (27 base + 8 keamanan v1.7.1) + frontend manual checklist
- `08_GAP_LIST.md` — v1.7 DONE (G01-G47) + v1.8 roadmap

## Sync Status 2026-09-22

- Workspace (source of truth baru): 01 v1.0.4 + 02 v1.0.4 + 17 v1.0.8 + 99 v1.0.5 + sisanya tak berubah
- GAS: BELUM sync — paste whole-file `01_ConfigAndBridge.gs`, `02_AppLogic.gs`, `17_RtlApi.gs`, `99_TestSuite.gs`, lalu jalankan `runAllTestsSidokumen()` → target Library 42/0/1 + Routing 29/0 + Domain **35/0**
- Frontend: Index v1.0.3 + J_State v1.0.4 + J_Helpers v1.0.3 + J_Api v1.0.3 + J_Actions v1.0.4 + J_App v1.0.3 + V_ 8 files v1.1.0 (tidak berubah di v1.7.1)
- GitHub: perlu upload batch v1.7.1 — `README.md`, `src/*` semua — setelah itu 100% sync

## Cara upload ke GitHub (drag-drop)

1. Buka https://github.com/miftachurrochim82-sketch/si-dokumen
2. Drag-drop file zip `si-dokumen-v1.7-full.zip` ATAU upload manual folder `src/` + `docs/` + `README.md`
3. File wajib ada: `src/00_Utils.gs`, `src/appsscript.json`, `docs/01_BRD.md`, `src/10-17` (v1.0.3-v1.0.7), `README.md` v1.7.0
4. Commit message: `v1.7.0 full sync — 12 sheet + 93 handler + 27 domain test + 30 bugfix + splash + role-guard + state machine RTL`
5. Verifikasi: repo harus 26 src + 9 docs + README v1.7.0 — total 36 files

## Cara pakai (10 langkah)

1. Buat spreadsheet baru + proyek GAS baru
2. Copy 26 file src whole-file
3. Set Script Properties: `SPREADSHEET_ID`, `MASTER_SPREADSHEET_ID`, `PLATFORM_API_URL`
4. `initDatabase({ id: 'ADMIN', role: 'admin', email: 'admin@trenggalekkab.go.id' })` → **12 sheet** + seed 10+5+3
5. `runAllTestsSidokumen()` → HIJAU **42/0/1 + 29/0 + 27/0**
6. (Opsional) Set `AUDIT_DRY_RUN=true` saat testing, hapus untuk produksi
7. Deploy Web App `USER_DEPLOYING` `ANYONE_ANONYMOUS`
8. Daftar di si-platform code `SIDOKUMEN`
9. Uji upload PDF + Laporan L12 7 sheet + Analisa + Evaluasi + RTL generate (breakdown R1-R5)
10. Uji role-guard: login sebagai user biasa, coba upload → pegawai_id auto-fill

## Test

```js
runAllTestsSidokumen()
// Library PASS 42 FAIL 0 SKIP 1              (CoreLib v2.3.0)
// Routing 29/0 — localHandlers 91            (93 actionLevels)
// Domain PASS 27 FAIL 0
//   Base:     JENIS.1, DOK.1-3, SCHEMA.1
//   Laporan:  L4, L6, L9, L10, L11, L12
//   Analisa:  A3, A5, A6, A7, A9, A10
//   Evaluasi: E1, E2, E3, E4, E6, E7, E8
//   RTL:      R1-R5 generate + breakdown detail + errors + FSM (2 assert)
// 🎉 SEMUA HIJAU FULL PIRAMIDA
