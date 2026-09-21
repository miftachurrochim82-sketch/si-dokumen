# 06_API_FLOW — SIDOKUMEN v1.5 full piramida 35 output

> 87 handler = 6 config +2 self +1 dashboard +3 SIMPEG +1 master_satelit +3 jenis +5 dokumen +8 laporan L1-L3,L7-L10 +6 laporan rekap L4-L6,L11,L12 +8 analisa A3-A10 +11 evaluasi E1-E8 +12 RTL R1-R5 +2 native

## Flow SSO (standar ekosistem si-platform)
1. User buka katalog si-platform → klik SIDOKUMEN → ?ticket=st_xxx
2. Index.html baca __SSO_TICKET__ → AppCore.exchangePlatformTicket → token sesi
3. callServer pakai token → CoreLib.checkAuth → role viewer/user/verifikator/admin
4. Fail-closed: tanpa token → UNAUTHORIZED — ping tanpa token DITOLAK

## ActionLevels 87 — full mapping v1.5

```js
actionLevels: {
  // Config 6
  'get_config': 'viewer', 'get_config_list': 'viewer',
  'save_config_item': 'admin', 'save_config': 'admin',
  'delete_config_item': 'admin', 'delete_config': 'admin',
  // Self 2
  'get_my_profile': 'viewer', 'save_my_profile': 'viewer',
  // Dashboard 1
  'get_dashboard': 'viewer', 'dashboard': 'viewer', // alias
  // SIMPEG 3
  'get_pegawai_list': 'viewer', 'get_unit_list': 'viewer', 'get_jabatan_list': 'viewer',
  // Master satelit 1
  'get_master_satelit': 'viewer',
  // Jenis Dokumen 3
  'get_jenis_list': 'viewer', 'save_jenis': 'verifikator', 'delete_jenis': 'verifikator',
  // Dokumen 5
  'get_dokumen_list': 'viewer', 'get_dokumen_detail': 'viewer',
  'save_dokumen': 'user', 'delete_dokumen': 'user', 'verifikasi_dokumen': 'verifikator',
  // Laporan L1-L3,L7-L10 — 8
  'laporan_daftar_dokumen': 'viewer', // L1 alias get_dokumen_list dengan filter lengkap
  'laporan_rekap_periode': 'viewer', // L7
  'laporan_rekap_status': 'viewer', // L8
  'laporan_keterlambatan': 'viewer', // L9 vs T_JADWAL
  'laporan_file_bermasalah': 'viewer', // L10
  // Laporan Rekap L4-L6,L11,L12 — 6
  'lap_rekap_klasifikasi': 'viewer', // L4 per jenis
  'lap_rekap_unit': 'viewer', // L5 per unit
  'lap_rekap_pegawai': 'viewer', // L6 per pegawai matrix
  'lap_kepatuhan_upload': 'viewer', // L11
  'laporan_khas_data': 'viewer', // L12 data composite
  'laporan_export_khas': 'verifikator', // L12 export 7 sheet Drive
  // Analisa A3-A10 — 8
  'analisa_distribusi_unit': 'viewer', // A3
  'analisa_top_pengirim': 'viewer', // A4
  'analisa_beban_pejabat': 'viewer', // A5
  'analisa_retensi': 'viewer', // A6
  'analisa_korelasi_jenis_unit': 'viewer', // A7
  'analisa_tte_ratio': 'viewer', // A8 placeholder
  'analisa_sla_pejabat': 'viewer', // A9
  'analisa_kritis_bulanan': 'viewer', // A10
  // Evaluasi E1-E8 — 11 (8 utama + 3 legacy alias)
  'evaluasi_sla_verifikasi': 'verifikator', // E1
  'evaluasi_sla_upload': 'verifikator', // E2
  'evaluasi_kelengkapan': 'verifikator', // E3
  'evaluasi_format': 'verifikator', // E4
  'evaluasi_kepatuhan_jenis': 'verifikator', // E5
  'evaluasi_kadaluarsa': 'verifikator', // E6
  'evaluasi_fisik': 'verifikator', // E7
  'evaluasi_alih_media': 'verifikator', // E8
  'evaluasi_sla_disposisi': 'verifikator', // legacy alias E1
  'evaluasi_jra': 'verifikator', // legacy alias E6
  'evaluasi_sla': 'verifikator', // legacy alias E1
  // RTL R1-R5 — 12 (6 utama + 6 alias kompat si-arsip)
  'get_tindak_lanjut_list': 'viewer', // R list
  'get_tindak_lanjut_detail': 'viewer',
  'save_tindak_lanjut': 'verifikator',
  'delete_tindak_lanjut': 'verifikator',
  'ubah_status_tindak_lanjut': 'verifikator',
  'generate_tindak_lanjut': 'verifikator', // R generate
  'get_rtl_list': 'viewer', // alias kompat
  'get_rtl_detail': 'viewer',
  'save_rtl': 'verifikator',
  'delete_rtl': 'verifikator',
  'ubah_status_rtl': 'verifikator',
  'generate_rtl': 'verifikator',
  // Native 2 (dari CoreLib)
  'exchange_platform_ticket': 'viewer',
  'logout': 'viewer'
}
```

Total 87 = 85 local +2 native — buildLocalHandlers_ wiring 19 baru L/A/E/R

## Flow Utama

### Upload Dokumen
1. Frontend J_Actions simpanDokumen() → FileReader base64 + file_name/mime → callServer save_dokumen {record, file_base64, file_name, file_mime}
2. Backend saveDokumen_ → cek duplikat pegawai+tahun+jenis+bulan → jika ada → BAD_REQUEST + tampilkan file lama
3. Jika file_base64: getOrCreateFolder_ 'SIDOKUMEN' → newBlob → createFile → getId() → file_drive_id
4. saveGeneric_ T_DOKUMEN + audit + id prefix dok-
5. Frontend toast success → loadDokumen(1) + loadRekapKlasifikasi()

### Verifikasi + SLA
1. Admin buka V_Dokumen → btn verifikasi → modal status → pilih disetujui/revisi + catatan → verifikasi_dokumen
2. Backend verifikasi_dokumen_ → cek transisi legal baru→menunggu→disetujui/revisi → update T_DOKUMEN status + insert T_VERIFIKASI jejak verifikator_id, status_lama, status_baru
3. E1/A9 hitung selisih hari created_at T_VERIFIKASI - created_at T_DOKUMEN → lewat jika >3 hari

### Laporan Khas L12 Export 7 Sheet
1. User pilih tahun di V_Laporan → btn Export Khas L12
2. callServer laporan_export_khas {tahun}
3. Backend laporanExportKhas_ → panggil laporanKhasData_ (composite L4+L5+L6+L11 + top5) → getOrCreateFolder_ 'SIDOKUMEN Export' → SpreadsheetApp.create `SIDOKUMEN_KHAS_{tahun}` → buat 7 sheet: Cover KOP Satpol PP, Ringkasan, Rekap Jenis (L4), Rekap Unit (L5), Rekap Pegawai (L6), Kepatuhan (L11), TTD — isi via setValues → move file ke folder export → return {file_id, file_url}
4. Frontend tampilkan link file_url

### Analisa → Evaluasi → RTL Generate
1. User V_Analisa pilih tahun → loadAnalisa() → call A3/A4/A5/A9/A10 dll → tampilkan table
2. User V_Evaluasi pilih tahun → loadEvaluasi() → call E1-E8 → tampilkan stat + rincian 100
3. User V_Rtl → pilih sumber evaluasi (semua/E3/E4/E1/E6/E5) + tahun → Generate
4. Backend generateTindakLanjut_ → switch sumber: E3→R1 dari evaluasiKelengkapan_ belum_lengkap, E4→R2 dari evaluasiFormat_ tidak_patuh, E1→R3 dari evaluasiSlaVerifikasi_ tidak_patuh, E6→R4 dari evaluasiKadaluarsa_ kadaluarsa, E5→R5 dari evaluasiKepatuhanJenis_ pct<50 — dedup judul via judul_set + existing judul_rtl di T_TINDAK_LANJUT — saveGeneric_ tiap RTL baru — return {generated, existing}
5. Frontend toast + loadRtl(1)

## Error Handling
- BAD_REQUEST: validasi gagal (pegawai_id wajib, jenis wajib, tahun wajib, file >10MB, duplikat, status transisi ilegal, judul RTL wajib)
- NOT_FOUND: id tidak ada di T_DOKUMEN/T_TINDAK_LANJUT
- FORBIDDEN: role tidak cukup (save_dokumen butuh user, verifikasi butuh verifikator, export khas butuh verifikator)
- UNAUTHORIZED: tanpa token — fail-closed
- INTERNAL: Drive error, SpreadsheetApp error — log + toast error

## Pagination
- Semua list pakai CoreLib.paginate — per_page 20 dokumen, 10 RTL — return {data, total, total_pages, page}
