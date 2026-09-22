# 02_PRD — Product Requirements Document — SIDOKUMEN v1.7.0 full sync

> 12 sheet + 93 handler + Drive + 7 menu — tema #065f46 emerald — frontend GAS truth v1.1.0 + backend 00-17 v1.0.3-v1.0.7

## P1 — Dashboard Kelengkapan (KONTRAK) — V_Dashboard v1.1.0
- **Tujuan:** Lihat kondisi upload sekilas + evaluasi + RTL
- **AC v1.7.0:**
  - **Hero banner gradient emerald** — persentase kelengkapan besar (3xl-4xl font-black) + inline stats (Total/Baru/Setuju) + progress bar `clampPct_(pctLengkap)` — border-0 + shadow-lg
  - **8 KPI app-stat-card grouped** — 2 grup dengan heading uppercase: "Dokumen" (4) + "RTL" (4)
  - Grup Dokumen: Total Dokumen, Baru/Menunggu, Disetujui, % Kelengkapan
  - Grup RTL: Total RTL, RTL Baru, **RTL Diproses** (baru), RTL Selesai
  - Nullish-safe `dashboardData.totalRtl != null ? ... : rtlTotalData` + `rtlBaruCount`/`rtlDiprosesCount`/`rtlSelesaiCount` computed dari J_State v1.0.4
  - Chart tren upload 12 bulan (bar) L7 + chart status (doughnut) L8 — `chartTrenLabels/Datasets/Colors`
  - Tabel 5 dokumen terbaru (L1) + panel "belum upload" per jenis dari L6 belum_lengkap — progress-track `clampPct_(b.pct)` + color via `pctColor_` + badge
  - **Empty state rapi** — icon folder-open + subtitle + hint; **green checkmark** kalau semua pegawai lengkap
  - Tombol Segarkan `loadAll()` disabled saat loading + spinner icon
  - UI: hero + 2 grup KPI + 2 chart + 2 tabel — card overflow-hidden !p-0 + table-scroll + bg-slate-50 header

## P2 — Dokumen (T_DOKUMEN) (KONTRAK) — V_Dokumen v1.1.0 + V_Modals v1.1.0 + J_Actions v1.0.4
- **Tujuan:** Upload & kelola file
- **User Story:** Sebagai pegawai, saya upload PK 2026 PDF saya, supaya admin tidak nagih WA — user biasa auto-fill pegawai_id sendiri
- **AC v1.7.0:**
  - **Quick stats 4 KPI** — Total Hasil / Perlu Verif / Disetujui / Halaman (icon w-9 h-9 rounded-lg + value font-black)
  - Filter-bar-analytics: **search + clear button** (icon search left + `×` right when value) + tahun + jenis + status + btn refresh dengan spinner
  - **Debounce 350ms** — `debouncedLoadDokumen()` cegah spam API
  - Tabel min-w: kode min-w-[160px], pegawai min-w-[200px], jenis min-w-[180px], status min-w-[100px], aksi min-w-[120px] — table-scroll + hover emerald tint (bukan slate)
  - Kode cell dengan icon calendar + font-mono; jenis cell dengan icon `#` + periode_label
  - **Pagination lengkap:** First `«` + Prev + Nomor + Next + Last `»` + info "Menampilkan X dari Y • Hal Z/W"
  - Form modal v-if 2xl: pegawai_id (disabled !isAdmin + **lock icon** + helper text), jenis_dokumen_id, tahun number (**min/max 2000-2100**), bulan 1-12 opsional, judul auto hint, file input accept .pdf + info file lama card (kalau edit)
  - Upload: FileReader base64 split(',')[1] → payload `file_base64, file_name, file_mime` + record → Drive folder 'SIDOKUMEN/{tahun}' → file_drive_id + file_name + file_size + file_mime disimpan
  - **Fix v1.0.4:** `openDokumenCreate/Edit` → `showForm=true` dulu, baru `$nextTick` reset file input ref — cegah undefined karena v-if
  - **Role-guard:** !isAdmin → paksa `pegawai_id = currentUser.pegawai_id` di Create, Edit, dan simpanDokumen — anti spoofing
  - **Validate tahun 2000-2100** di simpanDokumen — cegah typo tahun
  - Status default baru, duplikat guard pegawai+tahun+jenis+bulan → BAD_REQUEST + tampilkan file lama (existing[0].id)
  - Badge valid: baru=info, menunggu=warning, disetujui=success, revisi=danger, ditolak=rose — via `badgeStatusDokumen()`

## P3 — Laporan 12 Output (KONTRAK) — V_Laporan v1.1.0
- **L1 Daftar Dokumen:** `laporan_daftar_dokumen` — pagination + search + filter tahun/bulan/jenis/status/pegawai/unit — V_Dokumen
- **L2 per Jenis:** filter jenis_dokumen_id — count per jenis — reuse L4
- **L3 per Pegawai:** filter pegawai_id — count per pegawai — reuse L6
- **L4 Rekap per Jenis:** `lap_rekap_klasifikasi` — tahun, group by jenis, jml + pct vs total pegawai — **stat 3 + progress bar visual** — tab klasifikasi
- **L5 Rekap per Unit:** `lap_rekap_unit` — group by unit via PEGAWAI map — **stat 3 (Total Dokumen + Unit Terdata + Top Unit)** + tabel dengan **`unit_nama` fallback** + progress bar — tab unit
- **L6 Rekap per Pegawai:** `lap_rekap_pegawai` — matrix pegawai×jenis, total_jenis, pct, belum_lengkap[], lengkap[] + nip + unit_id — **stat 4** + table min-w 200/100/100/100/140/100 + **progress color-coded** + ID mono kecil + status badge — tab pegawai + panel dashboard
- **L7 Rekap per Periode:** `laporan_rekap_periode` — group by tahun-bulan, tren 12 bulan — **stat 3 (Total + Periode Terdata + Rata-rata/bulan)** + table periode + **progress trend** — tab periode
- **L8 Rekap per Status:** `laporan_rekap_status` — baru/menunggu/disetujui/revisi/ditolak — **5 kartu besar per status** + tabel + progress bar — tab status
- **L9 Keterlambatan:** `laporan_keterlambatan` — vs T_JADWAL deadline via **dual-map `{byDokumen, byJenis}`** — **stat 4 (Total + Jadwal Aktif + Terlambat + Tepat Waktu)** + **info banner "Belum ada jadwal"** kalau jadwal_total=0 + empty state hijau kalau tidak ada terlambat + badge `+Xh` merah di kolom selisih — tab terlambat
- **L10 File Bermasalah:** `laporan_file_bermasalah` — tanpa file_drive_id, mime bukan PDF, size >10MB, nama tidak standar — **stat 3** + **badge chip per issue** (bukan text comma) + empty state hijau + file size readable (KB) — tab bermasalah
- **L11 Kepatuhan Upload:** `lap_kepatuhan_upload` — pakai **dual-map `buildDeadlineMap_`** + **skip kalau tidak ada deadline** (bukan blanket Jan-31) — **stat 4 (Total + With Deadline + Terlambat + Tanpa Jadwal)** + tabel kolom **`total_with_deadline` + `no_deadline`** + progress color-coded + **Export Khas L12 dengan info banner hijau field `sheets` benar** — tab kepatuhan
- **L12 Laporan Khas 7 sheet:** `laporan_khas_data` + `laporan_export_khas` — Spreadsheet baru `SIDOKUMEN_KHAS_{tahun}` 7 sheets: Cover KOP Satpol PP, Ringkasan, Rekap Jenis (L4), Rekap Unit (L5), Rekap Pegawai (L6), Kepatuhan (L11), TTD — folder SIDOKUMEN Export — **return `file_url` via `ss.getUrl()`** (bukan hardcode) + auto-open via `window.open` + tampil link di V_Laporan

## P4 — Analisa 10 Output (A3-A10) — V_Analisa v1.1.0
- **A3 Distribusi Unit:** `analisa_distribusi_unit` — top 8 unit + **`unit_nama` lookup via UNIT_KERJA** — stat total, top unit (dengan unit_nama), unit terdata + tabel unit_nama + kode mono + progress bar (pct_ dari total) — **pre-index pegawaiMap**
- **A4 Top Pengumpul:** `analisa_top_pengirim` — top 10 pegawai + % — **stat top nama + jumlah + % + total** + **rank #1 dengan crown emoji** + rank lain nomor abu — **pre-index pegawaiNamaMap O(n)**
- **A5 Beban Verifikator:** `analisa_beban_pejabat` — **`lewat` dihitung real SLA >3 hari** (fix v1.0.4 dari selalu 0) — **stat 3 (Total + Lewat SLA + Pejabat Aktif)** + tabel kolom Diteruskan/Diproses/Selesai/**Lewat** (dengan icon warning kalau >0) + **kolom pct baru** + note SLA hari dari `data.sla_hari` — **pre-index pegawaiNamaMap**
- **A6 Retensi:** `analisa_retensi` — proyeksi 5 tahun musnah/permanen + **`musnah_netto`** (fix v1.0.5) — **stat 4 (Tahun Basis + Total Dokumen + Perlu Musnah Netto + Permanen)** + tabel kolom Tahun/Musnah/Permanen/**Netto** (badge rose) + **note "netto = musnah - permanen"** — **pre-count by year O(n)**
- **A7 Korelasi Jenis×Unit:** `analisa_korelasi_jenis_unit` — matrix top5 jenis × top8 unit — **single-pass O(n) counts map** (fix v1.0.5 dari O(j×u×n)) + **rows dengan kolom `total`** + **sticky kolom jenis** + dot untuk nilai 0 — header dynamic `units[].{id, nama}` + rows `matrix[].{jenis_id, jenis_nama, total, [unitId]: count}`
- **A8 TTE Ratio:** `analisa_tte_ratio` — placeholder 0% (future G15 TTE) — stat total, tte, % + **info banner kuning "Belum ada field TTE — future v2.0"**
- **A9 SLA Pejabat:** `analisa_sla_pejabat` — total, lewat >3 hari, pct_lewat, avg_hari + **`sla_hari` parametrik** (fix v1.0.5) + **`no_dokumen` counter** + **guard clock skew diff<0→0** — **stat 3 (Total Verifikasi + Lewat SLA + Verifikator)** + tabel dengan **inline progress color-coded (merah >50%, kuning >20%, hijau)** + `avg_hari` mono + note SLA — **pre-index dokMap + pegawaiNamaMap**
- **A10 Kritis Bulanan:** `analisa_kritis_bulanan` — **`expected` = pegawai × jenis_bulanan** (fix v1.0.5 dari hardcode ×1) + filter jenis dengan `periode='Bulanan'` aktif — **stat 4 (Total Bulanan + Expected/bulan + Jenis Bulanan + Total Pegawai)** + tabel kolom Bulan/Jml/**Expected**/Belum/Progress (dari `r.pct` backend)

## P5 — Evaluasi 8 Output (E1-E8) — V_Evaluasi v1.1.0
- **E1 SLA Verifikasi:** `evaluasi_sla_verifikasi` — patuh ≤ `sla_hari` (parametrik, default 3), pct_patuh, avg_hari + **`total_with_dokumen` + `no_dokumen`** — **stat 4** + **info banner "X verifikasi dengan dokumen valid"** + **"Y verifikasi orphan"** (kalau ada) — **pre-index dokMap** + guard clock skew
- **E2 SLA Upload:** `evaluasi_sla_upload` — pakai **`buildDeadlineMap_` dual-map** (fix v1.0.6) — **stat 4 (Total + Tepat Waktu + Terlambat + Avg Telat)** + **info banner green "X dokumen dengan jadwal deadline"** + **slate "Y dokumen tanpa jadwal"** — pct dihitung dari `total_with_deadline` (jujur)
- **E3 Kelengkapan:** `evaluasi_kelengkapan` — missing 5 kategori (tanpa_file/tanpa_pegawai/tanpa_jenis/tanpa_tahun/tanpa_judul) + **`pct_missing` baru** + rincian 100 — **stat 4** + **5 kotak breakdown missing** + tabel dengan **chip badge per issue** (bukan text comma)
- **E4 Format:** `evaluasi_format` — mime bukan PDF, >10MB, nama tidak standar regex case-insensitive `/i` (fix v1.0.6) — **stat 3** + **panel regex source pattern** + tabel dengan chip badge issues + file mono
- **E5 Kepatuhan Jenis:** `evaluasi_kepatuhan_jenis` — reuse L11 pct per jenis — **stat 4 (Total + Tepat + No Jadwal + Jenis Terdata)** + tabel progress color-coded
- **E6 Kadaluarsa:** `evaluasi_kadaluarsa` — ≤tahun-5 tanpa BA musnah di T_TINDAK_LANJUT sumber E6 + **split(',') akurat + `dengan_ba` field baru** (fix v1.0.6) — **stat 4 (Total Kadaluarsa + Sudah BA + Tanpa BA + Coverage %)** + **empty state hijau "Semua sudah ada BA musnah"** + tabel id/pegawai/jenis/tahun
- **E7 Fisik:** `evaluasi_fisik` — pakai **field `lokasi_fisik` real** (header ditambah v1.0.3) — **stat 4 (Total + Ada Lokasi + Tanpa Lokasi + Coverage %)** + **info banner "Cara mengisi lokasi fisik"** dari `data.note`
- **E8 Alih Media:** `evaluasi_alih_media` — % digital (`file_drive_id` non-empty) vs total + per jenis + `total_lampiran` — **stat 4 (Total + Digital + Belum Digital + Lampiran)** + tabel **progress color-coded** per jenis + sort by pct asc → jenis dengan coverage rendah muncul atas

## P6 — RTL 5 Output (R1-R5) Puncak Piramida — V_Rtl v1.1.0 + 17_RtlApi v1.0.7
- **R1 Lengkapi Dokumen** — dari E3 belum_lengkap — judul `R1 Lengkapi dokumen {nama} tahun {tahun} ({pct}%)`
- **R2 Perbaiki Format** — dari E4 tidak patuh — judul `R2 Perbaiki format {file_name}`
- **R3 Verifikasi Tertunda** — dari E1/A9 lewat >0 — judul `R3 Verifikasi tertunda — {nama} ({lewat} lewat)`
- **R4 Arsipkan Dokumen Lama** — dari E6 tanpa_ba >0 — judul `R4 Arsipkan dokumen kadaluarsa tahun {tahun} — {n} dokumen`
- **R5 Pembinaan Pegawai** — dari E5 pct<50% — judul `R5 Pembinaan pegawai — {n} jenis <50% tahun {tahun}`
- **Handler v1.0.7:**
  - `get_tindak_lanjut_list` (page, search, status_rtl, sumber_evaluasi, tahun, per_page 10, **`assigned_to` baru** + sort due_date ASC → created_at DESC + cap per_page max 100)
  - `save_tindak_lanjut` — **BLOKIR update `status_rtl` & `judul_rtl`** saat edit (fix v1.0.7) + validate progress_pct 0..100
  - `ubah_status_tindak_lanjut` — **idempoten** (status sama → no-op success) + validate progress_pct + **auto-set 100 saat selesai** + **auto-reset 0 saat batal**
  - `generate_tindak_lanjut` — **idempoten dedup judul case-insensitive** + **kumpulkan `errors[]`** (bukan silent catch) + return **`detail.{r1..r5}`** + total + errors[]
  - **`RTL_TRANSISI_LEGAL_`:** baru→[diproses,batal], diproses→[selesai,batal], selesai→[], **batal→[baru]** (reaktivasi baru di v1.0.7)
- **UI v1.1.0:**
  - Header + btn RTL Baru + Segarkan + **quick stats 4** (Total/Baru/Diproses/Selesai) via `rtlBaruCount`/`rtlDiprosesCount`/`rtlSelesaiCount` computed
  - **Generate panel dengan breakdown R1-R5 panel (5 kotak)** — muncul setelah generate via `rtlGenerateResult.detail` + errors list (kalau ada)
  - Filter bar cari+status+sumber+tahun + search+clear
  - Table min-w 260/100/100/160/110/140 + badge sumber/status + **assigned_to name** + progress-track **color-coded** + **btn edit disabled saat final** + **btn status disabled saat selesai**
  - **Pagination lengkap** First/Last + info X dari Y
  - **Modal lg form:** field `judul_rtl` & `status_rtl` **disabled saat edit** (immutable) + note "gunakan tombol Ubah Status"
  - **Modal md status:** **4 quick-pick tombol** + info banner transisi legal sesuai `rtlStatusTarget.status_rtl` + hint auto-progress
  - **Info transisi legal** sesuai state machine

## P7 — Master Jenis Dokumen — V_Master v1.1.0
- **Tujuan:** Kelola master fleksibel 10 seed
- **AC v1.7.0:**
  - **Quick stats 4 KPI** — Total Jenis / Aktif / Nonaktif / Kategori (icon w-9 h-9 rounded-lg)
  - **Search box dengan clear button** — filter client-side multi-field (kode + nama + kategori + periode + keterangan) via `masterFilteredJenis` computed
  - Tabel min-w 100/240/140/100/70/100/110 — **kode chip badge slate mono** + **keterangan subtitle** + periode clock icon + urutan `#X` mono abu + status badge aktif/nonaktif
  - Row hover emerald tint (bukan slate)
  - Btn-icon edit pakai `openJenisEdit(j)` (fix v1.0.3 dari direct assign) + btn-icon-danger hapus
  - Modal lg form: kode (mono + hint "singkat UPPERCASE"), nama, kategori, periode (**+ note "Bulanan → A10"**), urutan number min=0, status_aktif, keterangan
  - **Empty state 2 kondisi:** no hasil search (icon search) vs belum ada jenis (icon tags)

## P8 — Sistem & Keamanan — J_Actions v1.0.4 + J_State v1.0.4 + J_Helpers v1.0.3 + J_Api v1.0.3
- **Role-guard double-layer:** frontend (dropdown `:disabled="!isAdmin"` + auto-fill `currentUser.pegawai_id`) + backend (actor fallback `pegawai_id > id > email`)
- **Pagination:** server-side tunggal `dokumenTotalPagesServer` + `dokumenTotalData` + `dokumenPage` — fix Vue3 conflict `dokumenTotalPages` duplikat data↔computed
- **File input reset:** `$nextTick` setelah `showForm=true` — fix v-if modal ref undefined + cegah file nyangkut antar sesi
- **Validate tahun 2000-2100** di simpanDokumen — cegah typo tahun
- **Fail-closed:** ping tanpa token DITOLAK, **93 actionLevels**
- **State machine RTL guard:** `saveTindakLanjut_` BLOKIR bypass `status_rtl` & `judul_rtl`
- **Cache lookup O(1):** `_pegawaiMapCache_` + `_jenisMapCache_` auto-invalidate by length — performa lookup 10-100x lebih cepat untuk list besar
- **Debounce 350ms:** search input dokumen & RTL
- **`pctColor_` helper:** warna progress bar konsisten (merah <50%, kuning 50-79%, hijau ≥80%)
- **`jsonSafe_` di 00_Utils v1.0.3:** escape XSS `<>&\u2028\u2029` untuk `__SSO_TICKET__`
- **`AUDIT_DRY_RUN`:** skip HTTP audit saat test (auto restore setelah self-check)
- **`KNOWN_LIB_FAILURES_` di 99_TestSuite v1.0.4:** toleransi CoreLib internal fail + `allPass` aware
- **Error handling konsisten:** `(res && res.error) || 'default'` di semua catch + `console.warn` untuk debug
