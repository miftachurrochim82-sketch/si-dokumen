# 05_UIUX — SIDOKUMEN v1.6.3 full sync

> UIUX v1.10 polish dari si-arsip — min-w + table-scroll + badge valid + app-stat-card + btn-icon + filter label + modal v-if + tema #065f46 emerald — 8 menu full — frontend GAS truth v1.0.2/v1.0.3 + V_ 9 files v1.0.2

## Tema v1.6.3
- Primary: #065f46 emerald-800 (bedakan dari si-arsip #0369a1 sky-700) — dokumen kinerja = hijau
- :root --primary: #065f46, --primary-dark: #064e3b, --primary-light: #ecfdf5, --primary-lighter: #d1fae5, --primary-text: #064e3b, --primary-accent: #34d399, --primary-rgb: 6,95,70
- meta theme-color #065f46
- tailwind.config extend colors primary 50-900 emerald
- Brand: title 'SIDOKUMEN', subtitle 'Gudang Dokumen Kinerja — Laporan 12 + Analisa 10 + Evaluasi 8 + RTL 5', logoIcon fa-folder-tree, logoChar SD — J_App v1.0.2
- Dark mode: try localStorage sidokumen_dark → documentElement classList dark — toggle via app-header
- Font: Inter 400-900, FA 6.5.2, Vue 3.5.42, CDN @v2.8.1 app-common, app-components, app-core, app-modules

## Layout Shell v1.6.3 — starter-kit v2.10.0 + CDN @v2.8.1 — Index v1.0.2 GAS truth
- Index.html: base target _top, meta viewport, theme-color, preconnect cdnjs + fonts, tailwind CDN, Inter, FA, Vue prod, app-common.min.css, style :root + [v-cloak] + filter-bar-analytics + filter-label + table-scroll + progress-track/fill, __SSO_TICKET__ + __IS_SSO_ENTRY__, app div v-cloak + toast-container + app-login + app-sidebar + app-header + main overflow-y-auto p-4 sm:p-6 lg:p-8 + include V_Modals, V_Dashboard, V_Dokumen, V_Laporan, V_Analisa, V_Evaluasi, V_Rtl, V_Master + include J_State, J_Helpers, J_Api, J_Actions, J_App + CDN app-components/core/modules
- Include order: V_Modals → V_Dashboard → V_Dokumen → V_Laporan → V_Analisa → V_Evaluasi → V_Rtl → V_Master (V_Rekap legacy tidak di-include, dead code 4.8KB, bisa hapus)
- J_State → J_Helpers → J_Api → J_Actions → J_App (AppCore.create) — mixins SidokumenMixin data+computed+methods
- Menu 7: Utama (dashboard,dokumen,laporan), Analisa (analisa,evaluasi,rtl), Master (master) — pageIcons gauge-high, file-lines, chart-line, clipboard-check, list-check, tags — J_App v1.0.2

## CSS Wajib v1.6.3 — dari si-arsip v1.9 + fix
- filter-bar-analytics: display:flex flex-direction:column gap-0.5rem align-items:flex-end; @media min-width:640px flex-direction:row — untuk periode filter + tahun input + Tampilkan button — dipakai V_Analisa, V_Evaluasi, V_Laporan, V_Dokumen, V_Rtl
- filter-label: font-size:11px color:#64748b font-weight:500 display:block margin-bottom:2px; dark #94a3b8
- table-scroll: overflow-x:auto -webkit-overflow-scrolling:touch — untuk semua table min-w
- progress-track: width:4rem height:0.5rem background:#e2e8f0 border-radius:9999px overflow:hidden display:inline-block vertical-align:middle; dark #334155
- progress-fill: height:100% background:#10b981 transition:all 0.3s — width via clampPct_()
- input: border rounded-lg px-3 py-2 text-sm focus:ring-2 ring-emerald-500 — CDN app-common
- btn: px-3 py-2 rounded-lg text-sm font-medium
- btn-primary: bg-emerald-600 text-white hover:bg-emerald-700
- btn-ghost: bg-slate-100 dark:bg-slate-800 hover:bg-slate-200
- btn-icon: w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100
- btn-icon-danger: hover:bg-rose-50 text-rose-600
- card: bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-4 — !p-0 untuk table card
- form-label: text-xs font-semibold text-slate-700 dark:text-slate-300
- animate-fade-in: CDN

## Komponen CDN — app-common.min.css + app-components.min.js
- app-sidebar: collapsed, mobile-open, dark, current-page, is-admin, user, brand, menu — @navigate, @toggle, @close, @logout
- app-header: dark, app-title, current-page, page-icons, user — @toggle-dark, @toggle-mobile, @navigate
- app-login: is-processing, error-message, app-title, app-subtitle, instansi — @login goToPlatform
- app-stat-card: title, value, icon, color emerald/sky/amber/purple/rose, subtext
- app-chart-bar: labels, datasets, title, height, colors
- app-chart-doughnut: labels, datasets, title, height, colors
- app-badge: size sm, status draft/menunggu/proses/disetujui/revisi/ditolak/aktif/nonaktif/info, label
- app-skeleton: type table
- app-empty-state: icon, title, subtitle
- app-modal: v-if, @close, title, subtitle, icon, size 2xl/lg/md, loading, confirm-text, cancel-text, @confirm
- toast-container + toast-item toast-success/error/warning — showToast()

## State & Computed — J_State v1.0.3 fix
- data(): dataLoaded, dashboardData {totalDokumen, totalBaru, totalDisetujui, pctLengkap, totalPegawai, totalJenis, tahun, role, nama, totalRtl, rtlBaru, rtlSelesai}, dokumenList[], dokumenLoading, dokumenFilters {search, tahun, jenis_dokumen_id, status, pegawai_id}, dokumenPage, dokumenPerPage 20, dokumenTotalPagesServer 1, dokumenTotalData 0, showDokumenForm, dokumenSaving, dokumenForm {id, pegawai_id, jenis_dokumen_id, tahun, bulan, periode_label, judul, deskripsi, file_drive_id, file_name, file_size, file_mime, status, uploaded_by, catatan}, showStatusForm, statusTarget, statusBaru, statusCatatan, jenisList[], kategoriList[], periodeList[], masterTab, showJenisForm, jenisSaving, jenisForm, laporanTab, lapKlasData, lapKlasLoading, lapKlasTahun, lapPegawaiData, lapPegawaiLoading, lapUnitData, lapUnitLoading, lapPeriodeData, lapPeriodeLoading, lapStatusData, lapStatusLoading, lapTerlambatData, lapTerlambatLoading, lapBermasalahData, lapBermasalahLoading, lapKepatuhanData, lapKepatuhanLoading, exportKhasResult, exportKhasLoading, analisaTab, analisaTahun, analisaLoading, analisaUnitData, analisaTopData, analisaBebanData, analisaSlaData, analisaKritisData, analisaRetensiData, analisaKorelasiData, analisaTteData, evaluasiTab, evaluasiTahun, evaluasiLoading, evaluasiSlaVerifData, evaluasiSlaUploadData, evaluasiKelengkapanData, evaluasiFormatData, evaluasiKepatuhanData, evaluasiKadaluarsaData, evaluasiFisikData, evaluasiAlihData, rtlList[], rtlLoading, rtlSaving, rtlGenerating, rtlGenerateSumber, rtlGenerateTahun, rtlSearch, rtlFilters {status_rtl, sumber_evaluasi, tahun}, rtlPage, rtlTotalPages, rtlTotalData, showRtlForm, showRtlStatusForm, rtlForm {id, sumber_evaluasi, judul_rtl, deskripsi, assigned_to, due_date, status_rtl, progress_pct, dokumen_terkait, catatan}, rtlStatusTarget, rtlStatusBaru, rtlStatusProgress, rtlStatusCatatan, rowMenuId
- computed: filteredDokumen() client-side safety filter tahun/jenis/status/pegawai_id/search, paginatedDokumen() return filteredDokumen (server sudah slice) — fix v1.0.3, rtlBaruCount, rtlDiprosesCount, rtlSelesaiCount, rtlBatalCount, chartTrenLabels (12 bulan Jan-Des), chartTrenDatasets counts per YYYY-MM, chartTrenColors [#065f46], chartStatusLabels, chartStatusDatasets {baru,menunggu,disetujui,revisi,ditolak}, chartStatusColors, dokumenFilterDefs() search+tahun+jenis+status select options dari jenisList
- **Fix v1.0.3:** dokumenTotalPages tidak duplikat data/computed (Vue3 conflict) → dokumenTotalPagesServer, paginatedDokumen return langsung

## Actions — J_Actions v1.0.3 + nextTick fix v1.6.3
- openDokumenCreate(): y=now, dokumenForm reset, role-guard !isAdmin auto-fill pegawai_id, showForm=true, $nextTick reset file input ref — fix v-if modal ref undefined
- openDokumenEdit(r): Object.assign defaults + r, role-guard paksa pegawai_id sendiri !isAdmin, showForm=true, $nextTick reset file input
- simpanDokumen(): role-guard !isAdmin paksa pegawai_id, validasi wajib pegawai_id, jenis_dokumen_id, tahun, fileInput ref files[0] check size >10MB error, mime PDF warning, FileReader base64 split(',')[1] async, payload record + file_base64/file_name/file_mime, callServer save_dokumen, toast success, close form, loadDokumen page, loadRekapKlasifikasi
- hapusDokumen(r): confirm hapus judul/file_name/id, callServer delete_dokumen, toast, loadDokumen page
- openDokumenStatus(r): statusTarget=r, statusBaru=r.status, statusCatatan='', showStatusForm=true
- verifikasiDokumen(): callServer verifikasi_dokumen id, status_baru, catatan, toast, close, loadDokumen page
- openJenisCreate/Edit, simpanJenis, hapusJenis — validasi nama+kode wajib, callServer save_jenis/delete_jenis, loadJenis
- openRtlCreate/Edit, simpanRtl, hapusRtl, openRtlStatus, ubahStatusRtl — judul_rtl wajib, legacy judul copy, callServer save_tindak_lanjut/delete/ubah_status, loadRtl page, generateRtl

## Api — J_Api v1.0.2
- loadAll(silent): Promise.all loadDashboard, loadMasterSatelit, loadDokumen 1, loadJenis, loadRtl 1, loadRekapKlasifikasi
- loadDashboard(silent): callServer get_dashboard → dashboardData assign defaults
- loadMasterSatelit: get_master_satelit → masterPegawaiList, jenisList, kategoriList
- loadJenis: get_jenis_list → jenisList
- loadDokumen(page, silent): dokumenLoading true, p=page||dokumenPage||1, callServer get_dokumen_list page, search, tahun, jenis_dokumen_id, status, pegawai_id, per_page dokumenPerPage → dokumenList, dokumenTotalData, dokumenTotalPagesServer, dokumenPage
- loadRekapKlasifikasi/Pegawai/Unit/Periode/Status/Keterlambatan/FileBermasalah/Kepatuhan: callServer lap_rekap_klasifikasi etc tahun lapKlasTahun → lapXData + loading false + toast error if !silent
- exportKhas: callServer laporan_export_khas tahun → exportKhasResult + window.open file_url + toast
- loadAnalisa: tahun analisaTahun, tab analisaTab, map unit/top/beban/sla/kritis/retensi/korelasi/tte → [handler, dataKey], callServer handler tahun → this[dataKey]=res.data
- loadEvaluasi: tahun evaluasiTahun, tab evaluasiTab, map sla_verif/sla_upload/kelengkapan/format/kepatuhan/kadaluarsa/fisik/alih → [handler, dataKey], callServer
- loadRtl(page, silent): rtlLoading true, p, callServer get_tindak_lanjut_list page, search rtlSearch, status_rtl, sumber_evaluasi, tahun, per_page 10 → rtlList, rtlTotalData, rtlTotalPages, rtlPage
- generateRtl: rtlGenerating true, callServer generate_tindak_lanjut sumber evaluasi rtlGenerateSumber, tahun rtlGenerateTahun → toast generated count + loadRtl 1

## V_ Files v1.0.2 — UI detail
- V_Dashboard: 8 KPI grid 4+4, 2 chart, 2 table (terbaru L1 + belum lengkap L6) — nullish-safe + rtlBaruCount + progress-track clampPct_
- V_Dokumen: filter-bar-analytics search flex-1 + tahun + jenis + status + btn refresh, card table-scroll min-w 160/200/180/100/120, badge, btn-icon Drive view/edit/verifikasi/hapus, pagination footer dokumenTotalData + hal page/totalPagesServer + prev/next
- V_Laporan: 8 tab button grid 2x4 L4/L6/L5/L11 + L7/L8/L9/L10, filter-bar tahun + Tampilkan + Export Khas L12, stat 3-4 + table-scroll + progress-track + link file_url
- V_Analisa: 8 tab button grid 2x4 A3/A4/A5/A9 + A6/A7/A8/A10, filter tahun + Tampilkan, skeleton table, A3 stat total/top unit/unit terdata + table unit_id/jml/% pct_, A4 stat top nama + total + table pegawai/jml/%, A5 table pegawai/diteruskan/diproses/selesai/jml, A9 stat total verif/lewat/verifikator + table verifikator/total/lewat/% lewat/avg hari, A6 stat tahun basis/proyeksi 5th/total musnah + table tahun/musnah/permanen proyeksi, A7 table header dynamic units[] + rows matrix row[u.id], A8 stat total/tte/% + note future G15, A10 table bulan/jml/belum/% pct_(jml, jml+belum)
- V_Evaluasi: 8 tab button grid 2x4 E1-E4 + E5-E8, filter tahun + Tampilkan, skeleton, E1 stat 4 total/patuh/lewat/avg, E2 stat 4 total/tepat/terlambat/avg telat, E3 stat total/lengkap/tanpa file/issues + table dokumen/issues, E4 stat total/patuh/tidak patuh + table file/issues, E5 stat total/tepat/jenis + table jenis/total/tepat/%, E6 stat total kadaluarsa/tanpa BA/sudah BA + table id/pegawai/jenis/tahun, E7 stat total/tanpa lokasi/ada lokasi + note proxy, E8 stat total/digital/belum digital/lampiran + table jenis/total/digital/%
- V_Rtl: header + btn RTL Baru + Segarkan, card generate panel sumber evaluasi select semua/E3→R1/E4→R2/E1→R3/E6→R4/E5→R5 + tahun + Generate button + note dedup, filter bar cari+status+sumber+tahun, stats 4 total/bar/diproses/selesai via rtlBaruCount etc, card table-scroll min-w 260/100/100/140/110 + badge sumber/status + progress-track clampPct_ + btn edit/status/hapus, pagination footer, modal lg form sumber/status/judul/deskripsi/assigned_to/due_date/progress/dokumen_terkait/catatan + modal md status baru/progress/catatan transisi legal baru→diproses→selesai/batal
- V_Master: header + btn Tambah Jenis, card table-scroll min-w 100/240/140/100/100/120 kode/nama/kategori/periode/status/aksi + badge kategori + badge aktif/nonaktif + btn edit via openJenisEdit(j) + hapus
- V_Modals: modal dokumen 2xl form pegawai select disabled !isAdmin + helper text + jenis select + tahun number + bulan 1-12 + judul auto + file input ref fileDokumen accept pdf + file lama info + Drive link + catatan textarea, modal jenis lg kode/nama/kategori/periode/urutan/status/keterangan, modal status md status baru + catatan, rowMenuId overlay
- V_Rekap: legacy L4/L5 — card 3 tab klasifikasi/pegawai/unit — bisa dihapus karena sudah di V_Laporan

## Perubahan v1.6.3
- J_Actions nextTick fix — file input reset setelah modal render
- V_ 9 files v1.0.2 sinkron backend shape — proyeksi, units[], pct_, clampPct_, rtl counters
- J_State v1.0.3 pagination fix — dokumenTotalPagesServer
- Index v1.0.2 GAS truth — 7 V_ include + 5 J_ include
- Tema tetap #065f46 emerald, CDN @v2.8.1, Vue 3.5.42, FA 6.5.2
