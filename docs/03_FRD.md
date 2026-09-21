# 03_FRD — Functional Requirements Document — SIDOKUMEN v1.5 full piramida 35 output

> Satu baris FR = satu handler backend + satu UI. 11 sheet + 87 handler + Drive — dari starter-kit v2.10.0

## FR-01 — M_JENIS_DOKUMEN CRUD
- **Sheet:** M_JENIS_DOKUMEN
- **Handler:** get_jenis_list, save_jenis, delete_jenis
- **Validasi:** kode unik, nama wajib, kategori wajib, periode wajib
- **UI:** V_Master.html tab Jenis — table-scroll min-w 100/260/140/100/120, badge aktif/nonaktif, btn-icon edit/hapus, modal v-if lg (kode,nama,kategori,periode,urutan,status_aktif,keterangan)

## FR-02 — T_DOKUMEN List + Filter L1
- **Sheet:** T_DOKUMEN
- **Handler:** get_dokumen_list (filter: tahun, bulan, jenis_dokumen_id, status, pegawai_id, unit, search, page, per_page) — `laporan_daftar_dokumen` alias
- **Logic:** soft-delete filter, tolerant reader pegawai_id→nama via SIMPEG PEGAWAI map, pagination CoreLib.paginate, search CoreLib.matchSearch judul+catatan+file_name
- **UI:** V_Dokumen.html — filter-bar-analytics (search flex-1 + tahun + jenis + status + pegawai adminOnly), table min-w 160/200/140/100/100/120, badge valid status, btn-icon, pagination

## FR-03 — T_DOKUMEN Save + Upload Drive
- **Handler:** save_dokumen
- **Input:** record {pegawai_id, jenis_dokumen_id, tahun, bulan, judul, deskripsi, file_drive_id, file_name, file_size, file_mime, status, uploaded_by, catatan} + file_base64, file_name, file_mime (optional)
- **Logic:**
  - pegawai_id wajib, jenis_dokumen_id wajib, tahun wajib
  - jika file_base64 ada: simpan ke Drive folder 'SIDOKUMEN' via getOrCreateFolder_ + Utilities.newBlob(base64, mime, name) → file.getId() → file_drive_id, file_name, file_size, file_mime
  - duplikat guard: cek T_DOKUMEN pegawai_id+tahun+jenis_dokumen_id+bulan sama (bulan bisa null) → BAD_REQUEST + tampilkan file lama
  - judul auto: jika kosong, `${tahun}_${kode_jenis}_${nama_pegawai}${bulan?'_'+bulan:''}.pdf`
  - status default baru → menunggu setelah upload
- **UI:** modal v-if 2xl — pegawai-picker, jenis select, tahun number, bulan 1-12, judul auto, file input accept .pdf, catatan

## FR-04 — T_DOKUMEN Verifikasi + T_VERIFIKASI
- **Handler:** verifikasi_dokumen, get_verifikasi_list, save_verifikasi
- **Input:** id dokumen, status_baru (menunggu/disetujui/revisi/ditolak), catatan
- **Logic:** transisi legal: baru→menunggu→disetujui/revisi, menunggu→disetujui/revisi, revisi→menunggu, ditolak→baru (opsional) — simpan jejak di T_VERIFIKASI {dokumen_id, verifikator_id=user.id, status_lama, status_baru, catatan}
- **UI:** V_Dokumen modal status md — status select + catatan textarea

## FR-05 — Laporan L4-L6,L11,L12 — 13_LaporanRekapApi.gs
- **Handler:** lap_rekap_klasifikasi (tahun) → {tahun, rekap:[{jenis_id,kode,nama,jumlah,pct}], total, pegawaiTotal}, lap_rekap_unit (tahun) → group by unit via PEGAWAI map, lap_rekap_pegawai (tahun) → {rekap:[{pegawai_id,nama,unit_id,total_jenis,total_dokumen,pct,lengkap,belum_lengkap}], totalPegawai}, lap_kepatuhan_upload (tahun) → vs T_JADWAL deadline, rekap per jenis {jenis_id,nama,total,tepat_waktu,terlambat,pct}
- **Handler Khas:** laporan_khas_data (tahun) → composite {klasifikasi, unit, pegawai, kepatuhan, top5 jenis, top5 pegawai}, laporan_export_khas (tahun) → create Spreadsheet `SIDOKUMEN_KHAS_{tahun}` 7 sheets: Cover KOP, Ringkasan, Rekap Jenis (L4), Rekap Unit (L5), Rekap Pegawai (L6), Kepatuhan (L11), TTD — via SpreadsheetApp.create + folder 'SIDOKUMEN Export' — return {file_id, file_url, tahun, sheet_count:7}
- **UI:** V_Laporan.html — filter-bar-analytics tahun + 4 tab klasifikasi/pegawai/unit/kepatuhan + stat-card + table-scroll + progress-track + btn export Khas L12 link file_url

## FR-06 — Laporan L1-L3,L7-L10 — 10_LaporanApi.gs
- **Handler:** laporan_daftar_dokumen (search,tahun,bulan,jenis,status,pegawai,page,per_page), laporan_rekap_periode (tahun) → map bulan 1-12 jml, laporan_rekap_status (tahun) → map status, laporan_keterlambatan (tahun) → vs T_JADWAL deadline selisih_hari, laporan_file_bermasalah (tahun) → cek tanpa file_drive_id, mime bukan PDF, size >10MB, nama tidak standar regex
- **UI:** reuse V_Laporan + V_Dokumen filter

## FR-07 — Analisa A3-A5 — 14_AnalisaApi.gs
- **Handler:** analisa_distribusi_unit (tahun) → {tahun,total,distribusi:[{unit_id,jumlah}]}, analisa_top_pengirim (tahun) → {top:[{pegawai_id,nama,jumlah,pct}] top10}, analisa_beban_pejabat (tahun) → {beban:[{verifikator_id,nama,diteruskan,diproses,selesai,jumlah}]} dari T_VERIFIKASI
- **UI:** V_Analisa.html tab unit/top/beban — table-scroll min-w

## FR-08 — Analisa A6-A10 — 15_AnalisaLanjutApi.gs
- **Handler:** analisa_retensi (tahun) → proyeksi 5 tahun {tahun, retensi:[{tahun_proyeksi,jml,perlu_musnah,perlu_permanen}]}, analisa_korelasi_jenis_unit (tahun) → matrix {jenis:[top5], unit:[top8], matrix: jenis×unit count}, analisa_tte_ratio (tahun) → {total,tte,pct:0} placeholder future G15, analisa_sla_pejabat (tahun) → {sla:[{verifikator_id,nama,total,lewat,pct_lewat,avg_hari}] lewat >3 hari}, analisa_kritis_bulanan (tahun) → {rekap:[{bulan,nama_bulan,jml,belum}] 12 bulan}
- **UI:** V_Analisa.html tab retensi/korelasi/tte/sla/kritis — stat-card + table-scroll

## FR-09 — Evaluasi E1-E8 — 16_EvaluasiApi.gs
- **Handler:** evaluasi_sla_verifikasi (tahun) → {total,patuh,tidak_patuh,pct_patuh,avg_hari, tahun}, evaluasi_sla_upload (tahun) → vs T_JADWAL {total,tepat,terlambat,pct_patuh,avg_telat}, evaluasi_kelengkapan (tahun) → {total,lengkap,missing, rincian 100 issues: tanpa_file, tanpa_pegawai, tanpa_jenis, tanpa_tahun, tanpa_judul}, evaluasi_format (tahun) → {total,patuh,tidak_patuh,pct_patuh, rincian 100 issues: mime_bukan_pdf, size_besar, nama_tidak_standar}, evaluasi_kepatuhan_jenis (tahun) → reuse L11 {rekap:[{jenis_id,nama,total,tepat_waktu,pct}]}, evaluasi_kadaluarsa (tahun) → {total,kadaluarsa, tanpa_ba, rincian} dokumen ≤tahun-5 tanpa BA di T_TINDAK_LANJUT, evaluasi_fisik (tahun) → {total,ada_fisik,pct} proxy lokasi_fisik, evaluasi_alih_media (tahun) → {total,digital,analog,pct_digital, per_jenis}
- **UI:** V_Evaluasi.html — 8 tab sla_verif/sla_upload/kelengkapan/format/kepatuhan/kadaluarsa/fisik/alih — stat-card + table-scroll rincian 100 + badge

## FR-10 — RTL R1-R5 — 17_RtlApi.gs
- **Sheet:** T_TINDAK_LANJUT (alias T_RTL) — id, sumber_evaluasi, judul_rtl, deskripsi, assigned_to, due_date, status_rtl, progress_pct, dokumen_terkait, catatan, tahun, created_at, updated_at, created_by, updated_by, deleted_at
- **Handler:** get_tindak_lanjut_list (page,search,status_rtl,sumber_evaluasi,tahun,per_page) → paginated + total + total_pages, get_tindak_lanjut_detail (id), save_tindak_lanjut (record), delete_tindak_lanjut (id), ubah_status_tindak_lanjut (id,status_rtl,progress_pct,catatan) — legal transisi RTL_TRANSISI_LEGAL_ {baru:['diproses','batal'], diproses:['selesai','batal'], selesai:[], batal:[]}, generate_tindak_lanjut (tahun,sumber_evaluasi) — sumber: semua/E3→R1/E4→R2/E1→R3/E6→R4/E5→R5/manual — dedup judul via Set + cek existing T_TINDAK_LANJUT judul_rtl, idempoten, auto-create R1 dari E3 belum_lengkap, R2 dari E4 format, R3 dari E1/A9 lewat, R4 dari E6 tanpa BA, R5 dari E5 <50%
- **UI:** V_Rtl.html v1.10 — generate panel sumber+ tahun + btn Generate + 4 stat-card total/baru/diproses/selesai + filter-bar search/status/sumber/tahun + table-scroll min-w 260/100/100/140/110 + badge sumber/status + progress-track + modal form lg + modal status md + confirm hapus

## FR-11 — Master Satelit + SIMPEG RO
- **Handler:** get_master_satelit → {pegawai:[], jenis:[], kategori:[]} — tolerant reader PEGAWAI via CoreLib.getSheetData_ route MASTER_SPREADSHEET_ID
- **Handler:** get_pegawai_list, get_unit_list, get_jabatan_list — proxy SIMPEG
- **UI:** pegawai-picker component, filter unit

## FR-12 — Config + Self + Dashboard
- **Handler:** get_config, get_config_list, save_config_item, save_config, delete_config_item, delete_config (admin), get_my_profile, save_my_profile (viewer), get_dashboard (viewer) → {totalDokumen,totalBaru,totalDisetujui,pctLengkap,totalPegawai,totalJenis,tahun,role,nama,totalRtl,rtlBaru,rtlSelesai}
- **UI:** V_Dashboard.html — 4 KPI + chart tren/status + tabel terbaru + panel belum lengkap

## Mapping FR → actionLevels 87
Lihat 06_API_FLOW.md — 87 handler = 6 config +2 self +1 dashboard +3 SIMPEG +1 master_satelit +3 jenis +4 dokumen (list/detail/save/delete/verifikasi) +8 laporan (L1-L3,L7-L10) +4 laporan rekap (L4-L6,L11) +2 khas (data/export) +8 analisa (A3-A10) +11 evaluasi (E1-E8 + legacy alias evaluasi_sla_disposisi/jra/sla) +12 RTL (5 utama + 7 alias kompat si-arsip)
