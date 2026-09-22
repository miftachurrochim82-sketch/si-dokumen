# 02_PRD — Product Requirements Document — SIDOKUMEN v1.6.3 full sync

> 11 sheet + 87 handler + Drive + 8 menu — tema #065f46 emerald — frontend GAS truth v1.0.2/v1.0.3 + V_ 9 files v1.0.2 + backend 14-17 v1.6-v1.9

## P1 — Dashboard Kelengkapan (KONTRAK) — V_Dashboard v1.0.2
- **Tujuan:** Lihat kondisi upload sekilas + evaluasi + RTL
- **AC v1.6.3:**
  - 8 KPI app-stat-card: total dokumen, baru/menunggu, disetujui, % kelengkapan tahun berjalan + totalRtl/rtlBaru/rtlSelesai/exportKhas — nullish-safe `dashboardData.totalRtl != null ? ... : rtlTotalData` + `rtlBaruCount` computed dari J_State v1.0.3
  - Chart tren upload 12 bulan (bar) L7 + chart status (doughnut: baru/menunggu/disetujui/revisi) L8 — `chartTrenLabels/Datasets/Colors`
  - Tabel 5 dokumen terbaru (L1) + panel "belum upload" per jenis dari L6 belum_lengkap — progress-track `clampPct_(b.pct)` + badge
  - Filter tahun di dashboard + link cepat ke Laporan/Evaluasi/RTL + tombol Segarkan `loadAll()`
  - UI: grid 4 + 4 KPI, 2 chart, 2 tabel — card overflow-hidden !p-0 + table-scroll

## P2 — Dokumen (T_UTAMA = T_DOKUMEN) (KONTRAK) — V_Dokumen v1.0.2 + V_Modals v1.0.2 + J_Actions v1.0.3
- **Tujuan:** Upload & kelola file
- **User Story:** Sebagai pegawai, saya upload PK 2026 PDF saya, supaya admin tidak nagih WA — user biasa auto-fill pegawai_id sendiri
- **AC v1.6.3:**
  - List + filter-bar-analytics: search judul (debounce future), filter tahun, jenis dokumen, status, pegawai (admin), unit — `loadDokumen(1)` tiap filter change
  - Tabel min-w: kode min-w-[160px], pegawai min-w-[200px], jenis min-w-[180px], status min-w-[100px], aksi min-w-[120px] — table-scroll + hover bg-slate-50
  - Pagination server-side tunggal: `dokumenTotalPagesServer`, `dokumenTotalData`, `dokumenPage` — footer hal x/y + btn prev/next disabled
  - Form modal v-if 2xl: pegawai_id (select dari masterPegawaiList, disabled !isAdmin + helper text), jenis_dokumen_id select, tahun number, bulan 1-12 opsional, judul auto, file input accept .pdf, catatan
  - Upload: FileReader base64 split(',')[1] → payload `file_base64, file_name, file_mime` + record → Drive folder 'SIDOKUMEN' via getOrCreateFolder_ → file_drive_id + file_name + file_size disimpan
  - **Fix v1.6.3:** `openDokumenCreate/Edit` → `showForm=true` dulu, baru `$nextTick` reset file input ref — cegah undefined karena v-if
  - Role-guard: !isAdmin → paksa `pegawai_id = currentUser.pegawai_id` di Create, Edit, dan simpanDokumen — anti spoofing
  - Status default baru → menunggu setelah upload, duplikat guard pegawai+tahun+jenis+bulan → BAD_REQUEST + tampilkan file lama
  - Badge valid: baru=info, menunggu=warning, disetujui=success, revisi=danger, ditolak=rose — via `badgeStatusDokumen()`

## P3 — Laporan 12 Output (KONTRAK) — V_Laporan v1.0.2
- **L1 Daftar Dokumen:** `laporan_daftar_dokumen` — pagination + search + filter tahun/bulan/jenis/status/pegawai/unit — V_Dokumen
- **L2 per Jenis:** filter jenis_dokumen_id — count per jenis — reuse L4
- **L3 per Pegawai:** filter pegawai_id — count per pegawai — reuse L6
- **L4 Rekap per Jenis:** `lap_rekap_klasifikasi` — tahun, group by jenis, jml + pct vs total pegawai — stat 3 + table-scroll — V_Laporan tab klasifikasi
- **L5 Rekap per Unit:** `lap_rekap_unit` — group by unit via PEGAWAI map — table unit_id, jml, pct — tab unit
- **L6 Rekap per Pegawai:** `lap_rekap_pegawai` — matrix pegawai×jenis, total_jenis, pct, belum_lengkap[], lengkap[] + nip + unit_id — stat 4 (total pegawai, lengkap, belum, total dokumen) + table min-w 200/100/100/100/100/120 + progress-track + badge — tab pegawai + panel dashboard
- **L7 Rekap per Periode:** `laporan_rekap_periode` — group by tahun-bulan, tren 12 bulan — table periode, jml — tab periode
- **L8 Rekap per Status:** `laporan_rekap_status` — baru/menunggu/disetujui/revisi/ditolak — table status badge + jml + % — tab status
- **L9 Keterlambatan:** `laporan_keterlambatan` — vs T_JADWAL deadline, selisih_hari + list id, pegawai, jenis, tgl_upload, deadline, +hari — stat 3 + table — tab terlambat
- **L10 File Bermasalah:** `laporan_file_bermasalah` — tanpa file_drive_id, mime bukan PDF, size >10MB, nama tidak standar — stat 3 + table id, file_name, issues — tab bermasalah
- **L11 Kepatuhan Upload:** `lap_kepatuhan_upload` — vs deadline, tepat_waktu pct per jenis — stat 3 + table + export Khas button — tab kepatuhan
- **L12 Laporan Khas 7 sheet:** `laporan_khas_data` + `laporan_export_khas` — Spreadsheet baru SIDOKUMEN_KHAS_{tahun} 7 sheets: Cover KOP Satpol PP, Ringkasan, Rekap Jenis (L4), Rekap Unit (L5), Rekap Pegawai (L6), Kepatuhan (L11), TTD — folder SIDOKUMEN Export — return file_url + tampil link di V_Laporan

## P4 — Analisa 10 Output (A3-A10) — V_Analisa v1.0.2
- **A3 Distribusi Unit:** `analisa_distribusi_unit` — top 8 unit — stat total, top unit, unit terdata + table unit_id, jml, % via pct_()
- **A4 Top Pengumpul:** `analisa_top_pengirim` — top 10 pegawai + % — stat top nama + total + table pegawai, jml, %
- **A5 Beban Verifikator:** `analisa_beban_pejabat` — per admin TU diteruskan/diproses/selesai — table pegawai, diteruskan, diproses, selesai, jml
- **A6 Retensi:** `analisa_retensi` — proyeksi 5 tahun musnah/permanen (≤tahun-5, ≤tahun-10) — stat tahun basis, proyeksi 5 tahun, total musnah + table tahun, musnah, permanen — data.proyeksi shape
- **A7 Korelasi Jenis×Unit:** `analisa_korelasi_jenis_unit` — matrix top5 jenis × top8 unit — table header dynamic units[] {id,nama}, rows matrix[] {jenis_id, jenis_nama, [unitId]: count}
- **A8 TTE Ratio:** `analisa_tte_ratio` — placeholder 0% (future G15 TTE) — stat total, tte, % + note field belum ada
- **A9 SLA Pejabat:** `analisa_sla_pejabat` — total, lewat >3 hari, pct_lewat, avg_hari — stat total verif, lewat >3h, verifikator + table verifikator, total, lewat, % lewat, avg hari — reduce lewat
- **A10 Kritis Bulanan:** `analisa_kritis_bulanan` — 12 bulan jml + belum — table bulan, jml, belum, % via pct_(jml, jml+belum)

## P5 — Evaluasi 8 Output (E1-E8) — V_Evaluasi v1.0.2
- **E1 SLA Verifikasi:** `evaluasi_sla_verifikasi` — patuh ≤3 hari, pct_patuh, avg_hari — stat 4
- **E2 SLA Upload:** `evaluasi_sla_upload` — vs T_JADWAL, tepat/terlambat, avg_telat — stat 4
- **E3 Kelengkapan:** `evaluasi_kelengkapan` — missing tanpa_file/tanpa_pegawai/tanpa_jenis/tanpa_tahun/tanpa_judul + rincian 100 — stat total, lengkap, tanpa_file, issues + table dokumen, issues
- **E4 Format:** `evaluasi_format` — mime bukan PDF, >10MB, nama tidak standar regex `^\d{4}_[A-Z0-9_]+_[A-Z0-9\-]+(_\d{1,2})?\.pdf$` — stat total, patuh, tidak patuh + table file, issues
- **E5 Kepatuhan Jenis:** `evaluasi_kepatuhan_jenis` — reuse L11 pct per jenis — stat total, tepat waktu, jenis + table jenis, total, tepat, %
- **E6 Kadaluarsa:** `evaluasi_kadaluarsa` — ≤tahun-5 tanpa BA musnah di T_TINDAK_LANJUT — stat total kadaluarsa, tanpa BA, sudah BA + table id, pegawai, jenis, tahun
- **E7 Fisik:** `evaluasi_fisik` — proxy lokasi_fisik — stat total, tanpa lokasi, ada lokasi + note field belum ada
- **E8 Alih Media:** `evaluasi_alih_media` — % digital (file_drive_id) vs total + per jenis + total_lampiran — stat total, digital, belum digital, lampiran + table jenis, total, digital, %

## P6 — RTL 5 Output (R1-R5) Puncak Piramida — V_Rtl v1.0.2 + 17_RtlApi v1.9
- **R1 Lengkapi Dokumen** — dari E3 belum_lengkap — judul `R1 Lengkapi dokumen {nama} tahun {tahun} ({pct}%)`
- **R2 Perbaiki Format** — dari E4 tidak patuh — judul `R2 Perbaiki format {file_name}`
- **R3 Verifikasi Tertunda** — dari E1/A9 lewat >3h — judul `R3 Verifikasi tertunda — {nama} ({lewat} lewat)`
- **R4 Arsipkan Dokumen Lama** — dari E6 kadaluarsa tanpa BA — judul `R4 Arsipkan dokumen kadaluarsa tahun {tahun} — {n} dokumen`
- **R5 Pembinaan Pegawai** — dari E5 <50% — judul `R5 Pembinaan pegawai — {n} jenis <50% tahun {tahun}`
- Handler: `get_tindak_lanjut_list` (page, search, status_rtl, sumber_evaluasi, tahun, per_page 10), `save_tindak_lanjut`, `ubah_status_tindak_lanjut` (legal baru→diproses→selesai/batal via RTL_TRANSISI_LEGAL_), `generate_tindak_lanjut` idempoten dedup judul
- UI: generate panel + filter bar (cari, status, sumber, tahun) + stats 4 (total, baru=rtlBaruCount, diproses=rtlDiprosesCount, selesai=rtlSelesaiCount) + table min-w 260/100/100/140/110 + badge sumber/status + progress-track + clampPct_ + modal lg (form) + md (status) + pagination server-side

## P7 — Master Jenis Dokumen — V_Master v1.0.2
- **Tujuan:** Kelola master fleksibel 10 seed
- **AC:** table-scroll min-w 100/240/140/100/100/120, badge kategori via badgeKategori(), badge aktif/nonaktif, btn-icon edit pakai openJenisEdit(j) (fix v1.6.3 dari direct assign), modal lg form kode, nama, kategori, periode, urutan, status_aktif, keterangan

## P8 — Sistem & Keamanan — J_Actions v1.0.3 + J_State v1.0.3
- Role-guard: user biasa auto-fill pegawai_id sendiri di Create/Edit/Save — anti spoofing
- Pagination: server-side tunggal dokumenTotalPagesServer, dokumenTotalData, dokumenPage — fix Vue3 conflict dokumenTotalPages duplikat data/computed
- File input reset: $nextTick setelah showForm=true — fix v-if modal ref undefined
- Fail-closed: ping tanpa token DITOLAK, actionLevels 87
