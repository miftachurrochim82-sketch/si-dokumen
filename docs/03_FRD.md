# 03_FRD — Functional Requirements Document — SIDOKUMEN v1.6.3 full sync

> Satu baris FR = satu handler backend + satu UI. 11 sheet + 87 handler + Drive + frontend GAS truth v1.0.2/v1.0.3 + V_ 9 files v1.0.2 — starter-kit v2.10.0 + CoreLib v2.3.0

## FR-01 — M_JENIS_DOKUMEN CRUD — V_Master v1.0.2
- **Sheet:** M_JENIS_DOKUMEN
- **Handler:** get_jenis_list, save_jenis, delete_jenis
- **Validasi:** kode unik, nama wajib, kategori wajib, periode wajib
- **UI v1.6.3:** V_Master.html tab Jenis — table-scroll min-w 100/260/140/100/100/120, badge aktif/nonaktif via badgeKategori(), btn-icon edit pakai openJenisEdit(j) (fix dari direct assign), modal v-if lg (kode,nama,kategori,periode,urutan,status_aktif,keterangan) — openJenisCreate() reset form

## FR-02 — T_DOKUMEN List + Filter L1 — V_Dokumen v1.0.2 + J_State v1.0.3
- **Sheet:** T_DOKUMEN
- **Handler:** get_dokumen_list (filter: tahun, bulan, jenis_dokumen_id, status, pegawai_id, unit, search, page, per_page) — `laporan_daftar_dokumen` alias — pagination server-side
- **Logic:** soft-delete filter, tolerant reader pegawai_id→nama via SIMPEG PEGAWAI map, pagination CoreLib.paginate, search CoreLib.matchSearch judul+catatan+file_name, per_page 20 default dari dokumenPerPage
- **UI v1.6.3:** V_Dokumen.html — filter-bar-analytics (search flex-1 + tahun + jenis + status + pegawai adminOnly) @input/@change loadDokumen(1), table min-w 160/200/180/100/120, badge valid status via badgeStatusDokumen(), btn-icon Drive view/edit/verifikasi/hapus, pagination footer dokumenTotalData + hal dokumenPage/dokumenTotalPagesServer + prev/next — computed paginatedDokumen return filteredDokumen (server sudah slice) — fix v1.0.3

## FR-03 — T_DOKUMEN Save + Upload Drive — J_Actions v1.0.3 + V_Modals v1.0.2
- **Handler:** save_dokumen
- **Input:** record {pegawai_id, jenis_dokumen_id, tahun, bulan, judul, deskripsi, file_drive_id, file_name, file_size, file_mime, status, uploaded_by, catatan} + file_base64, file_name, file_mime (optional)
- **Logic v1.6.3:**
  - pegawai_id wajib, jenis_dokumen_id wajib, tahun wajib
  - role-guard: !isAdmin → paksa pegawai_id = currentUser.pegawai_id di openCreate, openEdit, simpanDokumen
  - jika file_base64 ada: simpan ke Drive folder 'SIDOKUMEN' via getOrCreateFolder_ + Utilities.newBlob(base64, mime, name) → file.getId() → file_drive_id, file_name, file_size, file_mime — FileReader split(',')[1]
  - duplikat guard: cek T_DOKUMEN pegawai_id+tahun+jenis_dokumen_id+bulan sama → BAD_REQUEST + tampilkan file lama
  - judul auto: jika kosong, `${tahun}_${kode_jenis}_${nama_pegawai}${bulan?'_'+bulan:''}.pdf`
  - status default baru → menunggu setelah upload
- **UI v1.6.3:** modal v-if 2xl — pegawai-picker disabled !isAdmin + helper text "User biasa — otomatis atas nama Anda", jenis select, tahun number, bulan 1-12, judul auto, file input ref="fileDokumen" accept .pdf, catatan — **fix nextTick:** showForm=true dulu, baru $nextTick reset file input value='' (cegah undefined karena v-if)

## FR-04 — T_DOKUMEN Verifikasi + T_VERIFIKASI — V_Modals + J_Actions
- **Handler:** verifikasi_dokumen, get_verifikasi_list, save_verifikasi
- **Input:** id dokumen, status_baru (menunggu/disetujui/revisi/ditolak), catatan
- **Logic:** update T_DOKUMEN status, insert T_VERIFIKASI log verifikator_id, created_at, catatan — SLA 3 hari dihitung di E1/A9
- **UI:** modal status md — select status baru + textarea catatan + openDokumenStatus(r) set statusTarget

## FR-05 — Dashboard 8 KPI + Charts — V_Dashboard v1.0.2 + J_State v1.0.3 + J_Api
- **Handler:** get_dashboard
- **Logic:** totalDokumen, totalBaru, totalDisetujui, pctLengkap = total / (totalPegawai*totalJenis) *100, totalPegawai, totalJenis, tahun, role, nama, totalRtl, rtlBaru, rtlSelesai — plus chart data tren 12 bulan L7, status L8, terbaru L1, belum lengkap L6
- **UI v1.6.3:** V_Dashboard — 8 stat-card (4+4) — nullish-safe `dashboardData.totalRtl != null ? ... : rtlTotalData` + `rtlBaruCount/rtlSelesaiCount` computed, chart-bar + chart-doughnut, table 5 terbaru + belum lengkap L6 dengan progress-track clampPct_ + badge — grid 1/2 lg + card overflow-hidden !p-0

## FR-06 — Laporan L4-L6,L11,L12 Khas — V_Laporan v1.0.2 + 13_LaporanRekapApi v1.5
- **Handler:** lap_rekap_klasifikasi (L4), lap_rekap_unit (L5), lap_rekap_pegawai (L6), lap_kepatuhan_upload (L11), laporan_khas_data + laporan_export_khas (L12)
- **Logic L4:** group by jenis_dokumen_id, jml, pct vs total pegawai
- **Logic L5:** group by unit via PEGAWAI map unit_id, jml, pct
- **Logic L6:** matrix pegawai×jenis, total_jenis, jml, pct, belum_lengkap[], lengkap[] + nip + unit_id — untuk dashboard + V_Laporan
- **Logic L11:** vs T_JADWAL deadline, tepat_waktu, pct per jenis
- **Logic L12:** composite L4+L5+L6+L11 + cover KOP + ringkasan + TTD — SpreadsheetApp.create SIDOKUMEN_KHAS_{tahun} 7 sheets + folder SIDOKUMEN Export + return file_url
- **UI v1.6.3:** V_Laporan — 8 tab button grid 2x4 (klasifikasi/pegawai/unit/kepatuhan + periode/status/terlambat/bermasalah), filter-bar-analytics tahun + Tampilkan + Export Khas L12, stat 3-4 + table-scroll min-w + progress-track + link file_url — shape sesuai backend

## FR-07 — Laporan L1-L3,L7-L10 — V_Laporan + 10_LaporanApi v1.0.2
- **Handler:** laporan_daftar_dokumen (L1 alias get_dokumen_list), laporan_rekap_periode (L7), laporan_rekap_status (L8), laporan_keterlambatan (L9), laporan_file_bermasalah (L10)
- **Logic L7:** group by tahun-bulan, tren 12 bulan
- **Logic L8:** group by status baru/menunggu/disetujui/revisi/ditolak
- **Logic L9:** vs T_JADWAL tanggal_selesai filter buildDeadlineMap_ fix, selisih_hari = upload - deadline, list id, pegawai, jenis, tgl_upload, deadline
- **Logic L10:** tanpa file_drive_id, mime bukan PDF, size >10MB, nama tidak standar regex — list id, file_name, issues[]
- **UI:** tab periode/status/terlambat/bermasalah — stat + table

## FR-08 — Analisa A3-A5 — V_Analisa v1.0.2 + 14_AnalisaApi v1.6
- **Handler:** analisa_distribusi_unit (A3), analisa_top_pengirim (A4), analisa_beban_pejabat (A5)
- **Logic A3:** filter tahun, pegawaiMap unit_id, group by unit, distribusi top8 sorted, total
- **Logic A4:** filter tahun, group by pegawai_id, top 10 + pct, nama via findRecordById_
- **Logic A5:** filter tahun, group by pegawai_id, diteruskan/diproses/selesai/lewat, jumlah
- **UI v1.6.3:** V_Analisa tab unit/top/beban — stat 3 + table-scroll — pct_() helper

## FR-09 — Analisa A6-A10 — V_Analisa v1.0.2 + 15_AnalisaLanjutApi v1.7
- **Handler:** analisa_retensi (A6), analisa_korelasi_jenis_unit (A7), analisa_tte_ratio (A8), analisa_sla_pejabat (A9), analisa_kritis_bulanan (A10)
- **Logic A6:** tahunNow, list T_DOKUMEN, map 5 tahun ke depan proyeksi musnah ≤th-5, permanen ≤th-10
- **Logic A7:** filter tahun, pegawaiMap, jenisList top5 aktif, unitMap top8, matrix rows {jenis_id, jenis_nama, [unitId]: count}
- **Logic A8:** placeholder 0% tte — total, tte=0, pct=0, note future G15
- **Logic A9:** filter tahun, T_VERIFIKASI, hitung diff hari dokumen created → verifikasi created, map total, lewat >3h, total_hari, avg_hari, pct_lewat, sorted lewat
- **Logic A10:** tahun, pegawaiTotal, jenisTotal, bulanMap 1-12, rekap bulan, nama_bulan, jml, belum = expected - jml
- **UI v1.6.3:** tab retensi/korelasi/tte/kritis + sla — stat + table — A7 header dynamic units[] + row[u.id], A6 table tahun/musnah/permanen, A9 reduce lewat, A10 pct_(jml, jml+belum)

## FR-10 — Evaluasi E1-E8 — V_Evaluasi v1.0.2 + 16_EvaluasiApi v1.8
- **Handler:** evaluasi_sla_verifikasi (E1), evaluasi_sla_upload (E2), evaluasi_kelengkapan (E3), evaluasi_format (E4), evaluasi_kepatuhan_jenis (E5 reuse L11), evaluasi_kadaluarsa (E6), evaluasi_fisik (E7), evaluasi_alih_media (E8)
- **Logic E1:** filter tahun, T_VERIFIKASI, diff hari, patuh ≤3h, lewat, pct_patuh, avg_hari
- **Logic E2:** filter tahun, deadlineMap dari T_JADWAL, tglUpload vs dl, patuh, lewat, totalTelat, pct_patuh, avg_telat_hari
- **Logic E3:** filter tahun, missing tanpa_file/tanpa_pegawai/tanpa_jenis/tanpa_tahun/tanpa_judul, rincian 100 {id, pegawai_id, jenis_dokumen_id, issues[]}, lengkap, pct_lengkap
- **Logic E4:** filter tahun, invalid mime bukan PDF, size >10MB, nama tidak standar regex, rincian 100 {id, file_name, file_size, file_mime, issues[]}, patuh, tidak_patuh, pct_patuh
- **Logic E5:** reuse L11 rekap per jenis pct
- **Logic E6:** tahunNow-5 kadaluarsa, cek T_TINDAK_LANJUT sumber E6 untuk BA, tanpa_ba, total_kadaluarsa, list 100
- **Logic E7:** filter tahun, tanpa_lokasi = !lokasi_fisik, pct_tanpa, note proxy future G07
- **Logic E8:** filter tahun, lampiran, sudahDigital file_drive_id, pct_digital, perJenis total/digital/pct, rekap sorted pct
- **UI v1.6.3:** 8 tab button grid 2x4, filter tahun + Tampilkan, stat 3-4 + table-scroll — shape sinkron backend

## FR-11 — RTL R1-R5 — V_Rtl v1.0.2 + 17_RtlApi v1.9
- **Handler:** get_tindak_lanjut_list (page, search, status_rtl, sumber_evaluasi, tahun, per_page 10), get_tindak_lanjut_detail, save_tindak_lanjut, delete_tindak_lanjut, ubah_status_tindak_lanjut, generate_tindak_lanjut
- **Logic:** RTL_TRANSISI_LEGAL_ baru→[diproses,batal], diproses→[selesai,batal], selesai→[], batal→[] — cek legal, return BAD_REQUEST jika illegal
- **Logic generate:** tahun, sumber evaluasi semua/E3/E4/E1/E6/E5, existing judul dedup map, R1 dari lapRekapPegawai belum_lengkap, R2 dari evaluasiFormat rincian, R3 dari analisaSlaPejabat lewat>0, R4 dari evaluasiKadaluarsa tanpa_ba>0, R5 dari evaluasiKepatuhanJenis pct<50 — idempoten
- **UI v1.6.3:** generate panel sumber evaluasi select + tahun + Generate button + note dedup, filter bar cari+status+sumber+tahun, stats 4 total/bar/diproses/selesai via rtlBaruCount etc computed, table min-w 260/100/100/140/110 + badge sumber/status + progress-track clampPct_ + modal lg form + md status + pagination server-side

## FR-12 — Master Satelit + Dashboard + Config — 01_Config + 02_AppLogic
- **Handler:** get_master_satelit (pegawai, jenis, kategori), get_dashboard, get_config, save_config, etc
- **Logic:** isRefSheet_ fix hanya SIMPEG ref (PEGAWAI, UNIT_KERJA, JABATAN), LOCAL_SHEETS lokal M_* + T_*, ensureLocalSheets_() + initDatabase seed 10+5+3, actionLevels 87, buildLocalHandlers 91, fail-closed ping tanpa token DITOLAK
- **UI:** J_State data + computed filteredDokumen, paginatedDokumen (server slice), rtl counters, chart labels/datasets/colors, dokumenFilterDefs
