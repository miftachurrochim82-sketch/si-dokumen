# 03_FRD — Functional Requirements Document — SIDOKUMEN v1.7.0 full sync

> Satu baris FR = satu handler backend + satu UI. 12 sheet + 93 handler + Drive + frontend GAS truth v1.1.0 + backend 00-17 v1.0.3-v1.0.7 — starter-kit v2.10.0 + CoreLib v2.3.0

## FR-01 — M_JENIS_DOKUMEN CRUD — V_Master v1.1.0
- **Sheet:** M_JENIS_DOKUMEN
- **Handler:** get_jenis_list, save_jenis, delete_jenis
- **Validasi:** kode unik, nama wajib, kategori wajib, periode wajib
- **UI v1.7.0:** V_Master.html tab Jenis — **quick stats 4 KPI (Total/Aktif/Nonaktif/Kategori)** + **search box dengan clear button** filter multi-field client-side via `masterFilteredJenis` computed + table-scroll min-w 100/240/140/100/70/100/110 + **kode chip badge slate mono** + **keterangan subtitle** + periode clock icon + urutan `#X` mono + status badge + **hover emerald tint** + btn-icon edit pakai `openJenisEdit(j)` + btn-icon-danger hapus + modal v-if lg (kode mono + hint "singkat UPPERCASE", nama, kategori, periode + note "Bulanan → A10", urutan min=0, status_aktif, keterangan) — `openJenisCreate()` reset form + **2 empty state** (no hasil search / belum ada jenis)

## FR-02 — T_DOKUMEN List + Filter L1 — V_Dokumen v1.1.0 + J_State v1.0.4
- **Sheet:** T_DOKUMEN
- **Handler:** get_dokumen_list (filter: tahun, bulan, jenis_dokumen_id, status, pegawai_id, **unit_id baru**, search, page, per_page) — `laporan_daftar_dokumen` alias — pagination server-side
- **Logic:** soft-delete filter, tolerant reader pegawai_id→nama via SIMPEG PEGAWAI map, pagination CoreLib.paginate, search CoreLib.matchSearch judul+catatan+file_name, per_page 20 default dari `dokumenPerPage`, **filter `unit_id` baru di v1.0.3** via PEGAWAI map
- **UI v1.7.0:** V_Dokumen.html — **quick stats 4 KPI (Total Hasil/Perlu Verif/Disetujui/Halaman)** + filter-bar-analytics (**search icon search kiri + clear button × kanan** + tahun + jenis + status + pegawai adminOnly + btn refresh dengan spinner) — **debounce 350ms** via `debouncedLoadDokumen()` — table min-w 160/200/180/100/120 + **hover emerald tint** + kode cell dengan icon calendar + jenis cell dengan icon `#` + periode_label — badge valid via `badgeStatusDokumen()` — btn-icon Drive view/edit/verifikasi/hapus — **pagination lengkap First/Last** + info "Menampilkan X dari Y • Hal Z/W" — computed `paginatedDokumen` return `filteredDokumen` (server sudah slice)

## FR-03 — T_DOKUMEN Save + Upload Drive — J_Actions v1.0.4 + V_Modals v1.1.0
- **Handler:** save_dokumen
- **Input:** record {pegawai_id, jenis_dokumen_id, tahun, bulan, judul, deskripsi, file_drive_id, file_name, file_size, file_mime, status, uploaded_by, catatan, **lokasi_fisik, kondisi_fisik**} + file_base64, file_name, file_mime (optional)
- **Logic v1.7.0:**
  - pegawai_id wajib, jenis_dokumen_id wajib, tahun wajib, **tahun divalidasi range 2000-2100 di frontend + backend**
  - role-guard: !isAdmin → paksa `pegawai_id = currentUser.pegawai_id` di `openDokumenCreate`, `openDokumenEdit`, `simpanDokumen` — anti spoofing double-layer
  - jika file_base64 ada: **pre-check ukuran via `base64.length × 3/4` sebelum decode** (perf) + simpan ke Drive folder 'SIDOKUMEN' via `getOrCreateFolder_` + `Utilities.newBlob(base64, mime, name)` → `file.getId()` → file_drive_id, file_name, file_size, file_mime — FileReader split(',')[1]
  - duplikat guard: cek T_DOKUMEN pegawai_id+tahun+jenis_dokumen_id+bulan sama → BAD_REQUEST + tampilkan file lama (existing[0].id)
  - judul auto: `${namaJenis} ${tahun}${bulan?'-'+bulan:''} - ${pegawai_id}`
  - status default 'baru', update `periode_label` otomatis di preSaveHook_
  - **T_LOGBOOK dicatat** otomatis — `aksi='create'|'update'`
- **UI v1.7.0:** modal v-if 2xl — pegawai-picker `:disabled="!isAdmin"` + **lock icon** + helper text "Admin bisa pilih pegawai mana saja" / "User biasa — otomatis atas nama Anda", jenis select, tahun number min/max, bulan 1-12 opsional, judul auto hint, file input ref="fileDokumen" accept .pdf, catatan, **info file lama card** (kalau edit, dengan tombol Buka Drive + warning file tidak berubah) — **fix v1.0.4 `$nextTick`:** showForm=true dulu, baru `$nextTick` reset file input `value=''` (cegah undefined karena v-if + cegah file nyangkut antar sesi)

## FR-04 — T_DOKUMEN Verifikasi + T_VERIFIKASI — V_Modals v1.1.0 + J_Actions v1.0.4
- **Handler:** verifikasi_dokumen, get_verifikasi_list, save_verifikasi
- **Input:** id dokumen, status_baru (menunggu/disetujui/revisi/ditolak), catatan
- **Logic v1.7.0:** update T_DOKUMEN status + insert T_VERIFIKASI log dengan **`verifikator_id = actor.pegawai_id || actor.id || actor.email`** (fallback baru v1.0.3) + SLA parametrik dihitung di E1/A9
- **UI v1.7.0:** modal status md — **4 quick-pick tombol status** (menunggu/disetujui/revisi/ditolak) + info banner "status saat ini" + textarea catatan + **info "Perubahan akan dicatat di T_VERIFIKASI"** + `openDokumenStatus(r)` set statusTarget

## FR-05 — Dashboard 8 KPI + Charts — V_Dashboard v1.1.0 + J_State v1.0.4 + J_Api
- **Handler:** get_dashboard
- **Logic v1.7.0:** totalDokumen, totalBaru, totalDisetujui, pctLengkap = total / (totalPegawai*totalJenis) *100, totalPegawai, totalJenis, tahun, role, nama, **totalRtl, rtlBaru, rtlSelesai (baru v1.0.3 dari T_TINDAK_LANJUT)** — plus chart data tren 12 bulan L7, status L8, terbaru L1, belum lengkap L6
- **UI v1.7.0:** V_Dashboard — **hero banner gradient emerald** (persentase kelengkapan 3xl-4xl font-black + inline stats + progress bar `clampPct_(pctLengkap)`) + **8 stat-card grouped** dengan heading uppercase: "Dokumen" (Total/Baru/Menunggu/Disetujui/pctLengkap) + "RTL" (Total/Baru/Diproses/Selesai) — **nullish-safe** `dashboardData.totalRtl != null ? ... : rtlTotalData` + `rtlBaruCount/rtlDiprosesCount/rtlSelesaiCount` computed — chart-bar + chart-doughnut — table 5 terbaru + belum lengkap L6 dengan progress-track `clampPct_` + color via `pctColor_` + badge + **empty state rapi dengan icon + green checkmark kalau semua lengkap** — grid 1/2 lg + card overflow-hidden !p-0 — tombol Segarkan dengan spinner disabled saat loading

## FR-06 — Laporan L4-L6,L11,L12 Khas — V_Laporan v1.1.0 + 13_LaporanRekapApi v1.0.3
- **Handler:** lap_rekap_klasifikasi (L4), lap_rekap_unit (L5), lap_rekap_pegawai (L6), lap_kepatuhan_upload (L11), laporan_khas_data + laporan_export_khas (L12)
- **Logic L4 v1.7.0:** group by jenis_dokumen_id, jml, pct vs total pegawai — return shape sama
- **Logic L5 v1.7.0:** group by unit via PEGAWAI map, jml, pct, **+ `unit_nama` lookup via UNIT_KERJA** — return shape sama
- **Logic L6 v1.7.0:** matrix pegawai×jenis, total_jenis, jml, pct, belum_lengkap[], lengkap[] + nip + unit_id — **skip jenis nonaktif dari hitungan pct** — sort pct DESC → nama ASC
- **Logic L11 v1.7.0 (FIX):** **PAKAI `buildDeadlineMap_` dari 10_LaporanApi v1.0.3 dual-map `{byDokumen, byJenis}`** + **skip kalau tidak ada deadline** (bukan blanket Jan-31) + return **`total_with_deadline` + `no_deadline`** + pct dihitung dari `total_with_deadline` (jujur) + sort dengan deadline dulu
- **Logic L12 v1.7.0:** composite L4+L5+L6+L11 + cover KOP + ringkasan + TTD — SpreadsheetApp.create SIDOKUMEN_KHAS_{tahun} 7 sheets + folder SIDOKUMEN Export + return **`file_url` via `ss.getUrl()`** (bukan hardcode) + **`sheets: 7`** field (bukan `sheet_count`) + try-catch removeFile guard
- **UI v1.7.0:** V_Laporan — **8 tab button grid 2x4 dengan icon** (tags/user/building/percent + calendar/flag/clock/triangle-exclamation) — filter tahun + Tampilkan dengan spinner + Export Khas L12 — **L4 dengan progress bar visual** — **L5 dengan unit_nama fallback + Top Unit stat** — **L6 progress color-coded + ID mono kecil** — **L7 stat 3 (Rata-rata/bulan) + progress trend** — **L8 5 kartu besar per status** — **L9 stat 4 (Total/Jadwal Aktif/Terlambat/Tepat Waktu) + info banner jadwal_total=0 + empty state hijau + badge `+Xh` merah** — **L10 stat 3 + badge chip per issue + file size readable + empty state hijau** — **L11 stat 4 (Total/With Deadline/Terlambat/Tanpa Jadwal) + kolom total_with_deadline + no_deadline + progress color-coded + info banner hijau Export dengan field `sheets` benar**

## FR-07 — Laporan L1-L3,L7-L10 — V_Laporan v1.1.0 + 10_LaporanApi v1.0.3
- **Handler:** laporan_daftar_dokumen (L1 alias get_dokumen_list), laporan_rekap_periode (L7), laporan_rekap_status (L8), laporan_keterlambatan (L9), laporan_file_bermasalah (L10)
- **Logic L7 v1.7.0:** group by tahun-bulan, tren 12 bulan — shape sama
- **Logic L8 v1.7.0:** group by status baru/menunggu/disetujui/revisi/ditolak — shape sama
- **Logic L9 v1.7.0 (FIX):** vs T_JADWAL via **`buildDeadlineMap_` dual-map `{byDokumen, byJenis}`** (fix dari key salah `jenis_dokumen_id` yang tidak ada di T_JADWAL) — prioritas `byDokumen[dokId]` → `byJenis[jenisId]` → skip — return **`jadwal_total`** baru untuk transparansi + `terlambat_total` + `list[]` dengan `{id, pegawai_id, jenis_dokumen_id, tgl_upload, deadline, selisih_hari}` + **pre-check size base64 di saveDokumen_**
- **Logic L10 v1.7.0:** tanpa file_drive_id, mime bukan PDF, size >10MB, nama tidak standar regex — list id, file_name, file_size, file_mime, issues[]
- **UI v1.7.0:** tab periode/status/terlambat/bermasalah — **semua dengan icon di tab** + stat 3-4 + info banner + **chip badge per issue** + badge `+Xh` di selisih + **empty state hijau** kalau bersih

## FR-08 — Analisa A3-A5 — V_Analisa v1.1.0 + 14_AnalisaApi v1.0.4
- **Handler:** analisa_distribusi_unit (A3), analisa_top_pengirim (A4), analisa_beban_pejabat (A5)
- **Logic A3 v1.7.0:** filter tahun, pre-index pegawaiMap unit_id, group by unit, distribusi top8 sorted, total, **+ `unit_nama` lookup via UNIT_KERJA**
- **Logic A4 v1.7.0:** filter tahun, group by pegawai_id, top 10 + pct, **pre-index `pegawaiNamaMap` O(n)** (dari O(n²) findRecordById_)
- **Logic A5 v1.7.0 (FIX):** filter tahun, group by pegawai_id, diteruskan/diproses/selesai/**`lewat` dihitung real SLA >3 hari** (fix dari selalu 0) + **`pct` per baris baru** + **`sla_hari` parametrik** + pre-index pegawaiNamaMap + normalisasi `.trim()`
- **UI v1.7.0:** V_Analisa tab unit/top/beban — **tab bar dengan icon** + **A3 stat 3 + unit_nama + progress bar** + **A4 stat 2 dengan crown emoji rank #1** + **A5 stat 3 + kolom `lewat` dengan icon warning + kolom `pct` baru + note SLA hari** — `pct_()` helper

## FR-09 — Analisa A6-A10 — V_Analisa v1.1.0 + 15_AnalisaLanjutApi v1.0.5
- **Handler:** analisa_retensi (A6), analisa_korelasi_jenis_unit (A7), analisa_tte_ratio (A8), analisa_sla_pejabat (A9), analisa_kritis_bulanan (A10)
- **Logic A6 v1.7.0 (FIX):** **pre-count by year O(n)** (single pass) + proyeksi 5 tahun dengan **`musnah_netto = musnah - permanen`** + `total_dokumen` untuk clarity
- **Logic A7 v1.7.0 (FIX):** **single-pass O(n) counts map** (dari O(j×u×n) = 5×8×n) + normalisasi `.trim()` + jenis top5 aktif + unit top8 + matrix rows `{jenis_id, jenis_nama, total, [unitId]: count}` + **kolom `total` per row baru**
- **Logic A8 v1.7.0:** placeholder 0% tte — total, tte=0, pct=0, note future G15
- **Logic A9 v1.7.0 (FIX):** **pre-index `dokMap` + `pegawaiNamaMap`** (dari O(n²) findRecordById_ per baris) + **`sla_hari` parametrik** (default 3) + **guard clock skew `diff < 0 → 0`** + **`no_dokumen` counter** + map total/lewat/total_hari — sort lewat DESC → total DESC
- **Logic A10 v1.7.0 (FIX):** **filter jenis dengan `periode='Bulanan'` aktif saja** + **`expected = pegawai × jumlah_jenis_bulanan`** (fix dari hardcode ×1) + return `total_bulanan`, `total_jenis_bulanan`, `expected_per_bulan` + row pct
- **UI v1.7.0:** tab retensi/korelasi/tte/kritis + sla — **A6 stat 4 + kolom Netto Musnah + note "netto = musnah - permanen"** + **A7 sticky kolom jenis + kolom Total per row + dot untuk nilai 0** + **A9 inline progress color-coded + note SLA hari** + **A10 stat 4 + kolom Expected + progress dari r.pct backend**

## FR-10 — Evaluasi E1-E8 — V_Evaluasi v1.1.0 + 16_EvaluasiApi v1.0.6
- **Handler:** evaluasi_sla_verifikasi (E1), evaluasi_sla_upload (E2), evaluasi_kelengkapan (E3), evaluasi_format (E4), evaluasi_kepatuhan_jenis (E5 reuse L11), evaluasi_kadaluarsa (E6), evaluasi_fisik (E7), evaluasi_alih_media (E8)
- **Logic E1 v1.7.0 (FIX):** **pre-index `dokMap`** (dari O(n²)) + **`sla_hari` parametrik** + **guard clock skew** + return **`total_with_dokumen` + `no_dokumen`** + pct dihitung dari total_with_dokumen (bukan total)
- **Logic E2 v1.7.0 (FIX):** **PAKAI `buildDeadlineMap_` dual-map** (dari deadlineMap manual dengan key salah) + **skip kalau tidak ada** (bukan blanket Jan-31) + return **`total_with_deadline` + `no_deadline`**
- **Logic E3 v1.7.0:** missing 5 kategori + **`pct_missing` baru** + rincian 100 dengan chips issues — shape sama
- **Logic E4 v1.7.0 (FIX):** **regex case-insensitive `/i`** (dari case-sensitive) + **return `regex` source** untuk display + rincian 100 dengan chips + normalisasi `.trim()`
- **Logic E5 v1.7.0:** reuse L11 pct per jenis
- **Logic E6 v1.7.0 (FIX):** **pre-index RTL by dokumen_terkait dengan `split(',')` akurat** (dari `indexOf(id)` false-positive) + return **`dengan_ba` field baru** (bukan hanya tanpa_ba)
- **Logic E7 v1.7.0 (FIX):** **pakai field `lokasi_fisik` real** (header ditambah di T_DOKUMEN v1.0.3) + return `ada_lokasi` + `tanpa_lokasi` + `pct_ada` + `pct_tanpa` + note "Isi kolom lokasi_fisik"
- **Logic E8 v1.7.0:** normalisasi `.trim()` + rekap sorted pct asc → jenis dengan coverage rendah di atas + tie-break total DESC
- **UI v1.7.0:** 8 tab button grid 2x4 dengan icon, filter tahun + Tampilkan dengan spinner — **E1 info banner "X dengan dokumen valid" + "Y orphan"** — **E2 info banner green + slate** — **E3 5 kotak breakdown missing + chip badge per issue** — **E4 panel regex source + chip badge** — **E5 progress color-coded** — **E6 empty state hijau + stat coverage** — **E7 info banner cara isi + stat ada/tanpa lokasi** — **E8 progress color-coded per jenis**

## FR-11 — RTL R1-R5 — V_Rtl v1.1.0 + 17_RtlApi v1.0.7
- **Handler:** get_tindak_lanjut_list (page, search, status_rtl, sumber_evaluasi, tahun, **assigned_to baru**, per_page 10 cap max 100), get_tindak_lanjut_detail, save_tindak_lanjut, delete_tindak_lanjut, ubah_status_tindak_lanjut, generate_tindak_lanjut
- **Logic v1.7.0 (FIX KRITIS):**
  - **`RTL_TRANSISI_LEGAL_`:** baru→[diproses,batal], diproses→[selesai,batal], selesai→[], **batal→[baru] (reaktivasi baru)**
  - **`saveTindakLanjut_` BLOKIR:** update `status_rtl` harus via `ubah_status_tindak_lanjut` + `judul_rtl` immutable (fix dari bypass state machine via payload edit)
  - **`ubahStatusTindakLanjut_`:** **idempoten** (status sama → no-op success + info) + validate progress_pct 0..100 + **auto-set 100 saat selesai** + **auto-reset 0 saat batal**
  - **`generateTindakLanjut_`:** **idempoten dedup judul case-insensitive** (lowercase normalized) + **kumpulkan `errors[]`** (bukan silent catch) + return **`detail.{r1..r5}`** + `total` + `errors[]` + success flag = false kalau ada errors
  - R1 dari `lapRekapPegawai` belum_lengkap, R2 dari `evaluasiFormat` rincian, R3 dari `analisaSlaPejabat` lewat>0, R4 dari `evaluasiKadaluarsa` tanpa_ba>0, R5 dari `evaluasiKepatuhanJenis` pct<50
  - **Sort baru:** due_date ASC → created_at DESC
- **UI v1.7.0:** header + btn RTL Baru + Segarkan + **quick stats 4** + **generate panel dengan breakdown R1-R5 panel (5 kotak grid)** + errors list (kalau ada) + filter bar cari+status+sumber+tahun + search+clear + table min-w 260/100/100/160/110/140 + **assigned_to name** + badge sumber/status + progress-track **color-coded** + **btn edit disabled saat final** + **btn status disabled saat selesai** + **pagination lengkap First/Last** + **modal lg form:** `judul_rtl` & `status_rtl` **disabled saat edit** (immutable) + note "gunakan tombol Ubah Status" + **modal md status:** **4 quick-pick tombol** + info banner transisi legal sesuai status target + hint auto-progress

## FR-12 — Master Satelit + Dashboard + Config + Init DB — 01_ConfigAndBridge v1.0.3 + 02_AppLogic v1.0.3 + 00_Utils v1.0.3
- **Handler:** get_master_satelit (pegawai, jenis, kategori), get_dashboard, get_config, save_config, get_pegawai_list, get_unit_list, get_jabatan_list, init_database
- **Logic v1.7.0:**
  - **12 sheet LOCAL_SHEETS** — M_JENIS/M_KATEGORI/M_PERIODE/T_DOKUMEN/T_VERIFIKASI/T_LAMPIRAN/T_LOGBOOK/T_APPROVAL/T_JADWAL/T_REKAP/T_TINDAK_LANJUT + **KONFIGURASI** (baru)
  - **93 actionLevels** (naik dari 87) — `generate_tindak_lanjut→verifikator` + `delete_tindak_lanjut→admin` + **pkFields.KONFIGURASI='key'**
  - **T_DOKUMEN + `lokasi_fisik` + `kondisi_fisik`** (baru)
  - **`isRefSheet_`** hanya SIMPEG (PEGAWAI, UNIT_KERJA, JABATAN) — M_* lokal tidak dianggap ref
  - **`ensureLocalSheets_`** + `initDatabase` seed 10+5+3 + **error collection (bukan silent)**
  - **`getDashboard_ RTL stats`** — totalRtl, rtlBaru, rtlSelesai dari T_TINDAK_LANJUT + **filter unit_id baru di getDokumenList_**
  - **`localPreSaveHook_`** KONFIGURASI handle (id = key) + T_TINDAK_LANJUT default status/progress + T_DOKUMEN auto periode_label
  - **`00_Utils.gs v1.0.3`:** `audit_` + `sendAuditLog_` + **`jsonSafe_` XSS escape** `<>&\u2028\u2029` + **`AUDIT_DRY_RUN`** guard + **`testUtilsSelfCheck`** dengan auto-set dry-run + restore
  - **`99_TestSuite.gs v1.0.4`:** **27 domain test** (naik dari 14) + **threshold ≥90 localHandlers** + **`KNOWN_LIB_FAILURES_`** toleransi CoreLib + **SCHEMA dinamis** (bukan hardcode 11) + **RTL FSM test** (2 assert) + **`verifikasiRtlApi17`** 9 test
- **UI v1.7.0:** J_State v1.0.4 data + computed — `filteredDokumen`, `paginatedDokumen` (server slice), rtl counters, chart labels/datasets/colors, `dokumenFilterDefs`, **`masterFilteredJenis` baru**, **`rtlGenerateResult` state baru** — J_Helpers v1.0.3 **cached lookup O(1)** + `pctColor_` + `fmtDateTime`/`fmtNumber`/`truncate_` + debounce 350ms — J_Api v1.0.3 **breakdown generateRtl** — J_Actions v1.0.4 role-guard + `$nextTick` + validate tahun 2000-2100 — J_App v1.0.3 menu 7 + onNavigate conditional — Index v1.0.3 splash screen + jsonSafe ticket
