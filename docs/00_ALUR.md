# 00_ALUR — Alur Gate 0 → Build — SIDOKUMEN v1.7.0 full sync

> Template dari starter-kit/docs/00_ALUR.md v2.10.0
> App: SIDOKUMEN — Sistem Dokumen Kinerja (Perjanjian Kinerja, SKP, Penilaian, Lapkin, dll)
> Versi: v1.7.0 full sync — 35 output (L12+A10+E8+R5) — 12 sheet + 93 handler + Drive + frontend GAS truth
> Tanggal: 2026-09-22 — Gate 0 → v1.7.0
> Frontend: Index v1.0.3 (splash) + J_State v1.0.4 + J_Helpers v1.0.3 + J_Api v1.0.3 + J_Actions v1.0.4 + J_App v1.0.3 + V_ 8 files v1.1.0
> Backend: 00_Utils v1.0.3 + 01_Config v1.0.3 + 02_AppLogic v1.0.3 + 10_Laporan v1.0.3 + 13_Rekap v1.0.3 + 14_Analisa v1.0.4 + 15_Lanjut v1.0.5 + 16_Evaluasi v1.0.6 + 17_Rtl v1.0.7 + 99_TestSuite v1.0.4
> Test: GREEN 42/0/1 + 29/0 + 27/0 — runAllTestsSidokumen

## Prinsip Gate 0 (dokumen dulu, kode kemudian)
- Satu baris dokumen = satu item kode (FR → handler, sheet → header, UI → komponen)
- ❓ = jangan tebak — tulis pertanyaan, kunci jawaban tertulis dari pemilik
- View ≠ sheet baru — cek dulu apakah bisa pakai filter/computed
- Piramida: Laporan 12 (L1-L12) → Analisa 10 (A1-A10) → Evaluasi 8 (E1-E8) → RTL 5 (R1-R5) = 35 output puncak

## 9 Pertanyaan Wajib Gate 0 (sudah dijawab 2026-09-21, tetap valid v1.7.0)
1. Siapa upload? **Campur — pegawai bisa, admin TU bisa, ada jejak uploaded_by + role-guard frontend v1.0.4 (anti spoofing pegawai_id dengan $nextTick reset file input)**
2. Jenis dokumen apa? **7 wajib + fleksibel — master M_JENIS_DOKUMEN bisa ditambah admin (PK, Sasaran SKP Tahunan, Sasaran SKP Periodik/Perubahan, PK Perubahan, Penilaian Bulanan, Penilaian Tahunan, Lapkin + LHKPN, IKI, dll) — seed 10 di V_Master v1.1.0 (quick stats 4 + search + kode chip mono)**
3. Fitur v1? **Upload + cari + rekap kelengkapan + piramida penuh: Laporan 12 + Analisa 10 + Evaluasi 8 + RTL 5 + export Khas 7 sheet + frontend GAS truth v1.1.0 (quick stats + hero banner + progress color-coded + info banner transparansi)**
4. Periode? **Tahunan + Bulanan + Periodik/Perubahan — pakai field tahun + bulan + periode_label — validasi frontend 2000-2100 di J_Actions v1.0.4**
5. Verifikasi? **v1 sederhana — status baru/menunggu/disetujui/revisi, admin verifikasi, jejak di T_VERIFIKASI — SLA parametrik (sla_hari default 3) di E1/E2/A9 + R3 — quick-pick status buttons di V_Modals v1.1.0**
6. File? **PDF utama, ≤10MB, simpan di Drive folder 'SIDOKUMEN', file_drive_id di sheet — L10 file bermasalah cek mime/size — frontend FileReader base64 + $nextTick reset + pre-check size base64.length×3/4 sebelum decode**
7. Pencarian? **Per pegawai, per tahun, per jenis, per status, per unit (via SIMPEG + filter unit_id baru di v1.0.3) — L1 daftar dokumen + filter-bar-analytics + pagination server-side tunggal + debounce 350ms**
8. Rekap? **Per pegawai kelengkapan %, per jenis total, per unit (dengan unit_nama dari UNIT_KERJA), per tahun — L4 per jenis, L5 per unit, L6 per pegawai matrix, L11 kepatuhan vs T_JADWAL dual-map + total_with_deadline + no_deadline transparan**
9. RTL? **Puncak piramida — R1 Lengkapi Dokumen (dari E3), R2 Perbaiki Format (dari E4), R3 Verifikasi Tertunda (dari E1/A9), R4 Arsipkan Lama (dari E6), R5 Pembinaan Pegawai (dari E5 <50%) — auto-generate idempoten dedup judul case-insensitive + breakdown detail.r1..r5 + errors[] + state machine baru→diproses→selesai/batal→baru (reaktivasi) + BLOKIR bypass di saveTindakLanjut_**

## Tahapan Build v1.7.0 full sync
1. Gate 0 docs 01-08 v1.0 → v1.5 full (87 handler) → v1.7.0 sync frontend + backend bugfix
2. Backend split per-domain + bugfix v1.7.0:
   - **10_LaporanApi v1.0.3** — dual-map `buildDeadlineMap_ {byDokumen, byJenis}` + `jadwal_total` di L9
   - **13_LaporanRekapApi v1.0.3** — pakai dual-map + `total_with_deadline` + `no_deadline` + sort tie-break + file name `.trim()`
   - **14_AnalisaApi v1.0.4** — `lewat` real SLA + pre-index pegawaiNamaMap + `unit_nama` lookup
   - **15_AnalisaLanjutApi v1.0.5** — `musnah_netto` + `sla_hari` parametrik + `expected` = pegawai × jenis_bulanan
   - **16_EvaluasiApi v1.0.6** — pakai dual-map deadline + `total_with_dokumen`/`no_dokumen` + regex `/i` + `dengan_ba` + `ada_lokasi` real
   - **17_RtlApi v1.0.7** — BLOKIR bypass state machine + idempoten case-insensitive + breakdown detail + state machine `batal→baru` reaktivasi
3. Config 01_ConfigAndBridge v1.0.3 — **12 sheet (KONFIGURASI)** + **93 actionLevels** (generate_tindak_lanjut→verifikator, delete_tindak_lanjut→admin) + T_DOKUMEN.lokasi_fisik/kondisi_fisik + pkFields.KONFIGURASI=key
4. AppLogic 02 v1.0.3 — 91 localHandlers wiring + getDashboard_ RTL stats + filter unit_id di getDokumenList_ + actor fallback (pegawai_id > id > email) + 99 v1.0.4 dengan 27 domain test + KNOWN_LIB_FAILURES_ aware
5. Utils 00 v1.0.3 — audit_ + sendAuditLog_ + jsonSafe_ (XSS escape untuk `__SSO_TICKET__`) + AUDIT_DRY_RUN + testUtilsSelfCheck
6. Frontend GAS truth v1.1.0:
   - **Index v1.0.3** — splash screen logo SD + brand + spinner bar + auto-hide (4s safety) + meta dual theme-color + [v-cloak] + scrollbar-gutter stable
   - **J_State v1.0.4** — data + computed + masterSearch + masterFilteredJenis + rtlGenerateResult + fix dokumenTotalPagesServer + rtl counters
   - **J_Helpers v1.0.3** — format + badge + cached lookup `_pegawaiMapCache_`/`_jenisMapCache_` + pctColor_ + debounce 350ms + fmtDateTime/fmtNumber/truncate_
   - **J_Api v1.0.3** — REST wrapper + generateRtl dengan breakdown rtlGenerateResult + error fallback konsisten
   - **J_Actions v1.0.4** — open* helpers (openDokumenCreate/Edit/JenisCreate/Edit/RtlCreate/Edit) + role-guard pegawai_id + $nextTick reset + validate tahun 2000-2100
   - **J_App v1.0.3** — mount + menu 7 (Utama/Analisa/Master) + pageIcons + onNavigate conditional
   - **V_ 8 files v1.1.0** — Dashboard (hero banner + 8 KPI grouped + 2 chart), Dokumen (quick stats 4 + search clear + pagination First/Last), Laporan (8 tab icon + info banner jadwal_total), Analisa (8 tab icon + sticky A7 + inline progress A9), Evaluasi (8 tab icon + quick-pick status modal), Master (quick stats 4 + search clear + kode chip), Modals (lock icon + quick-pick), Rtl (breakdown panel + immutable fields + info transisi)
7. State/Api/Actions/App: 7 menu (dashboard,dokumen,laporan,analisa,evaluasi,rtl,master) + brand 35 output + pagination server-side tunggal
8. Zip v1.7.0 — 26 src + 9 docs + README v1.7.0 — 100% sync GAS=Workspace=GitHub (after upload)

## Perubahan v1.7.0 dari v1.6.3

### 🔴 Bugfix Kritis Backend (7 bug)
- **`buildDeadlineMap_`** dual-map `{byDokumen, byJenis}` — fix `laporanKeterlambatan_` selalu 0 karena key `jenis_dokumen_id` tidak ada di T_JADWAL
- **`lapKepatuhanUpload_`** pakai dual-map + `no_deadline` transparan — fix angka palsu dari blanket `Jan-31`
- **`analisaBebanPejabat_.lewat`** dihitung real SLA >3 hari — fix field selalu 0 (tidak pernah di-increment)
- **`analisaKritisBulanan_.expected`** hitung `pegawai × jenis_bulanan` — fix hardcode `×1` untuk semua jenis
- **`evaluasiSlaUpload_`** pakai dual-map — fix map kosong → semua pakai fallback blanket
- **`evaluasiFisik_`** pakai field `lokasi_fisik` real (ditambah ke header T_DOKUMEN) — fix akses field non-existent
- **`saveTindakLanjut_`** BLOKIR update `status_rtl` & `judul_rtl` langsung — fix bypass state machine via payload edit

### 🟠 Perbaikan Performa (5 fix)
- **`analisaKorelasiJenisUnit_`** O(j×u×n) → O(n) single-pass counts map
- **`analisaSlaPejabat_`** pre-index `dokMap` + `pegawaiNamaMap` (dari O(n²) ke O(n))
- **`evaluasiKadaluarsa_`** `split(',')` + map akurat (dari `indexOf` false-positive)
- **`namaPegawai_` / `namaJenisDokumen_`** O(1) cached map dengan auto-invalidate by length
- **`analisaRetensi_`** pre-count by year O(n) (dari 5× scan list)

### 🟢 Fitur Baru Backend
- **`KONFIGURASI` sheet** (11 → 12 sheet) — key-value store, primary key = `key`, `pkFields.KONFIGURASI='key'`
- **`T_DOKUMEN.lokasi_fisik` + `kondisi_fisik`** — tracking arsip fisik real untuk E7
- **Field SLA parameter** — `sla_hari` di E1/A9 (default 3, override via param)
- **Breakdown R1-R5** di `generate_tindak_lanjut` → `detail.{r1..r5}` + `errors[]` collection (bukan silent catch)
- **`total_with_deadline` / `no_deadline`** di E2/L11 — transparansi dokumen tanpa jadwal
- **`total_with_dokumen` / `no_dokumen`** di E1/A9 — hitung hanya verifikasi ber-dokumen valid
- **`musnah_netto`** di A6 — retensi net (bukan duplikasi permanen)
- **`expected`** per baris di A10 — target bulanan akurat
- **`regex`** field di E4 — display pattern nama file standar
- **`dengan_ba`** di E6 — coverage BA musnah
- **`unit_nama`** di A3 — label unit via UNIT_KERJA lookup
- **`jsonSafe_`** di `00_Utils.gs` — escape XSS `<>&\u2028\u2029` untuk `__SSO_TICKET__`
- **`AUDIT_DRY_RUN`** — skip HTTP audit saat test (auto restore setelah self-check)
- **`KNOWN_LIB_FAILURES_`** — toleransi CoreLib internal test fail (default 1)

### 🔵 Frontend UIUX v1.1.0
- **Splash screen** — logo SD + brand + spinner bar + auto-hide setelah load (safety 4s)
- **Hero banner Dashboard** — gradient emerald + persentase kelengkapan 3xl-4xl + inline stats + progress bar + 8 KPI grouped (Dokumen 4 + RTL 4)
- **Quick stats 4 KPI** di V_Dokumen (Total/Perlu Verif/Disetujui/Halaman) + V_Master (Total/Aktif/Nonaktif/Kategori)
- **Search + clear button** di V_Dokumen (icon search kiri + × kanan) + V_Master (filter multi-field)
- **Progress bar color-coded** konsisten via `pctColor_` — merah <50%, kuning 50-79%, hijau ≥80%
- **Pagination lengkap** — First `«` + Prev + Nomor + Next + Last `»` + info "Menampilkan X dari Y"
- **Breakdown R1-R5 panel** di V_Rtl setelah generate (5 kotak grid + errors list)
- **Quick-pick status buttons** di modal verifikasi (4 tombol) + modal RTL status (4 tombol + info transisi legal)
- **Info banner transparansi** E1 (`total_with_dokumen` + `no_dokumen`) + E2 (`total_with_deadline` + `no_deadline`) + L9 (`jadwal_total`) + L11
- **Badge chips per issue** — split `"tanpa file_drive_id, mime bukan PDF"` menjadi chips terpisah di E3/E4/L10
- **Role-guard dropdown** pegawai `:disabled="!isAdmin"` + helper text + lock icon di label
- **Immutable fields** saat edit RTL — `judul_rtl` & `status_rtl` disabled + note "gunakan tombol Ubah Status"
- **Debounce 350ms** — search di V_Dokumen & V_Rtl tidak spam API
- **Empty state rapi** — icon + subtitle + green checkmark kalau data bersih (E6/L10)
- **Disabled tombol edit/status** saat RTL final (`selesai`/`batal`) — konsisten dengan backend guard

### 📋 Docs (9) v1.7.0
- `00-08` update ke v1.7.0 dengan detail 30 bugfix + frontend v1.1.0 + 27 domain test + field baru

### 🧪 Test
- **Library:** 42/0/1 (CoreLib v2.3.0, `KNOWN_LIB_FAILURES_` aware)
- **Routing:** 29/0 (91 localHandlers + 93 actionLevels, threshold ≥90)
- **Domain:** **27/0** (naik dari 14 → tambah A5, A6 detail, A10, E1, E2, E7 + RTL FSM 2 assert + SCHEMA dinamis)
  - Base CRUD: JENIS.1, DOK.1-3, SCHEMA.1
  - Laporan: L4, L6, L9, L10, L11, L12
  - Analisa: A3, A5, A6, A7, A9, A10
  - Evaluasi: E1, E2, E3, E4, E6, E7, E8
  - RTL: R1-R5 generate + `detail.r1..r5` + errors + FSM 2 assert

## Perubahan v1.6.3 dari v1.5 (historis)
- Frontend: Index v1.0.2 GAS truth, J_Actions v1.0.3 nextTick fix, J_State v1.0.3 pagination fix, V_ 9 files v1.0.2 sinkron backend shape
- Backend: 14 v1.6, 15 v1.7, 16 v1.8, 17 v1.9 tetap, workspace sudah sync GAS
- Docs: 00-08 update ke v1.6.3
- Test: tetap GREEN 42/0/1 + 29/0 + 14/0
