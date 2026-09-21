# 05_UIUX — SIDOKUMEN v1.5 full piramida 35 output

> UIUX v1.10 polish dari si-arsip — min-w + table-scroll + badge valid + app-stat-card + btn-icon + filter label + modal v-if + tema #065f46 emerald — 8 menu full

## Tema
- Primary: #065f46 emerald-800 (bedakan dari si-arsip #0369a1 sky-700) — dokumen kinerja = hijau
- :root --primary: #065f46, --primary-dark: #064e3b, --primary-light: #ecfdf5
- meta theme-color #065f46
- tailwind.config extend colors primary 50-900 emerald
- Brand: title 'SIDOKUMEN v1.5 full', subtitle '35 output — Laporan 12 + Analisa 10 + Evaluasi 8 + RTL 5', logoIcon fa-folder-tree, logoChar SD

## Layout Shell (starter-kit v2.10.0 + CDN @v2.8.1)
- Index.html: CDN (app-common, app-components, app-core, app-modules), Vue 3.5.42, FA 6.5.2
- Include: V_Modals → V_Dashboard → V_Dokumen → V_Laporan → V_Analisa → V_Evaluasi → V_Rtl → V_Rekap (legacy) → V_Master
- J_State → J_Helpers → J_Api → J_Actions → J_App (AppCore.create) — mixins SidokumenMixin
- Menu 8: Utama (dashboard,dokumen,laporan), Analisa (analisa,evaluasi,rtl), Master (master), Sistem (pengaturan adminOnly)

## CSS Wajib (dari si-arsip v1.9)
- filter-bar-analytics: flex wrap gap-2 items-end bg slate-50 dark slate-800/30 p-3 rounded-xl
- filter-label: text-[11px] uppercase tracking-wide text-slate-500
- table-scroll: overflow-x-auto -webkit-overflow-scrolling touch
- progress-track: h-2 bg-slate-200 rounded-full overflow-hidden
- progress-fill: h-full bg-emerald-500 transition-all
- input: border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-emerald-500
- btn: px-3 py-2 rounded-lg text-sm font-medium
- btn-primary: bg-emerald-600 text-white hover:bg-emerald-700
- btn-ghost: bg-slate-100 dark:bg-slate-800 hover:bg-slate-200
- btn-icon: w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100
- btn-icon-danger: hover:bg-rose-50 text-rose-600
- card: bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4
- stat-card: app-stat-card — title, value, icon, color emerald/sky/amber/purple/rose, subtext

## V_Dashboard.html — 4 KPI + 2 chart + tabel + panel belum upload + RTL stats
- Header: icon fa-folder-tree + judul Dashboard SIDOKUMEN v1.5 + sub 35 output
- KPI 4: total dokumen, baru/menunggu, disetujui, % kelengkapan tahun berjalan + RTL stats totalRtl/rtlBaru/rtlSelesai
- Chart row: tren upload 12 bulan bar + status doughnut baru/menunggu/disetujui/revisi
- Tabel terbaru: 5 dokumen terbaru (kode/tanggal, pegawai, jenis, status badge, aksi btn-icon eye)
- Panel belum upload: dari L6 belum_lengkap per jenis — misal PK 2026: 5 pegawai belum
- Link cepat: btn ke Laporan/Evaluasi/RTL

## V_Dokumen.html — L1 + upload
- Filter-bar-analytics: search flex-1 + tahun + jenis + status + pegawai adminOnly + unit
- Table min-w: kode 160, pegawai 200, jenis 140, tahun 100, status 100, aksi 120
- Badge valid: baru=info, menunggu=warning, disetujui=success, revisi=danger, ditolak=rose
- Row action: btn-icon eye/edit/trash/check
- Modal form v-if 2xl: pegawai-picker (admin bisa pilih, user auto diri), jenis select, tahun number, bulan 1-12 optional, judul auto, file input accept .pdf ≤10MB via $refs.fileDokumen + FileReader base64, catatan textarea, btn Simpan loading
- Modal status v-if md: status select + catatan

## V_Laporan.html — L1-L12 full (baru v1.5)
- Header: Laporan 12 Output + filter tahun + 4 tab: Per Jenis L4, Per Pegawai L6, Per Unit L5, Kepatuhan L11
- Tab Klasifikasi L4: stat-card total + top jenis + table-scroll min-w 260/60/60 jenis/jml/% + progress-track
- Tab Pegawai L6: stat-card total pegawai + matrix table min-w 200/60/60/260 pegawai/total/%/belum_lengkap + badge lengkap/belum + progress
- Tab Kepatuhan L11: table min-w 180/60/80/60 jenis/total/tepat/% + badge
- Export Khas L12: card — btn Export Khas 7 sheet + result file_url link Drive + info sheet_count 7 (Cover,Ringkasan,Rekap Jenis,Unit,Pegawai,Kepatuhan,TTD)
- Skeleton loading type table, empty-state icon

## V_Analisa.html — A3-A10 (baru v1.5)
- Header: Analisa 10 Output + sub A3-A10 + 8 tab btn: A3 Unit, A4 Top, A5 Beban, A9 SLA + A6 Retensi, A7 Korelasi, A8 TTE, A10 Kritis
- Periode filter: tahun + btn Tampilkan → loadAnalisa()
- Tab Unit A3: stat-card total + top unit + table distribusi unit_id/jumlah
- Tab Top A4: table top 10 pegawai nama/jml/%
- Tab Beban A5: table verifikator diteruskan/diproses/selesai/jml
- Tab SLA A9: table verifikator total/lewat/% lewat/avg hari — lewat >3 hari
- Tab Kritis A10: table 12 bulan nama_bulan/jml/belum
- Retensi A6: proyeksi 5 tahun, Korelasi A7 matrix, TTE A8 0% placeholder — skeleton + empty-state

## V_Evaluasi.html — E1-E8 (baru v1.5)
- Header: Evaluasi 8 Output + sub E1-E8 + 8 tab btn: E1 SLA Verif, E2 SLA Upload, E3 Lengkap, E4 Format + E5 Kepatuhan, E6 Kadaluarsa, E7 Fisik, E8 Alih Media
- Periode filter tahun + btn Tampilkan → loadEvaluasi()
- E1: stat-card total verif/patuh ≤3h/avg hari
- E3 Kelengkapan: stat total/lengkap + table rincian 100 dokumen + issues (tanpa_file, tanpa_pegawai, dll)
- E4 Format: stat total/patuh/tidak_patuh + table file + issues (mime bukan PDF, size >10MB, nama tidak standar)
- E5 Kepatuhan: table jenis/total/tepat/% — reuse L11
- Skeleton + empty-state

## V_Rtl.html — R1-R5 Puncak (baru v1.5, UIUX v1.10 59/28/0/0/56)
- Header: RTL Rencana Tindak Lanjut + sub R1-R5 + btn RTL Baru + Segarkan
- Generate card: filter sumber evaluasi (semua/E3→R1/E4→R2/E1→R3/E6→R4/E5→R5/manual) + tahun + btn Generate (loading spinner) + info dedup judul
- Filter-bar: search + status_rtl (baru/diproses/selesai/batal) + sumber_evaluasi + tahun
- Stats 4: app-stat-card total/baru/diproses/selesai — hitung dari rtlList filter
- Table min-w: judul 260, sumber 100 badge, status 100 badge, progress 140 progress-track+%, due_date 110, aksi 120 btn-icon pen/arrows-rotate/trash
- Modal Form RTL size lg v-if: sumber_evaluasi select, status select, judul_rtl input *, deskripsi textarea, assigned_to pegawai_id, due_date date, progress_pct number 0-100, dokumen_terkait, catatan
- Modal Ubah Status size md v-if: status baru + progress + catatan — transisi legal baru→diproses→selesai/batal

## V_Master.html — Jenis Dokumen
- Tab Jenis: table-scroll min-w 100/260/140/100/120 kode/nama/kategori/status/aksi + badge aktif/nonaktif + btn-icon edit/hapus + modal lg

## V_Modals.html — semua modal
- Upload dokumen 2xl, status md, jenis lg, RTL lg, RTL status md — v-if @close + :loading + confirm-text Simpan + cancel-text Batal

## Badge & Helpers
- badgeStatusDokumen: baru=info, menunggu=warning, disetujui=success, revisi=danger, ditolak=rose
- badgeStatusRtl: baru=amber, diproses=sky, selesai=emerald, batal=slate
- badgeSumberEvaluasi: E3=rose, E4=amber, E1=sky, E6=purple, E5=emerald, manual=slate
- fmtTgl WIB: format tgl Indonesia

## Responsif
- Semua table pakai table-scroll + min-w 100-260 agar tidak pecah di HP
- Filter-bar-analytics flex-col md:flex-row
- Grid stat-card 1→2→4 kolom
