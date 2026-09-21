# 02_PRD — Product Requirements Document — SIDOKUMEN v1.5 full piramida 35 output

> 11 sheet + 87 handler + Drive + 8 menu — tema #065f46 emerald

## P1 — Dashboard Kelengkapan (KONTRAK)
- **Tujuan:** Lihat kondisi upload sekilas + evaluasi + RTL
- **AC:**
  - 4 KPI app-stat-card: total dokumen, baru/menunggu, disetujui, % kelengkapan tahun berjalan + totalRtl/rtlBaru/rtlSelesai
  - Chart tren upload 12 bulan (bar) + chart status (doughnut: baru/menunggu/disetujui/revisi)
  - Tabel 5 dokumen terbaru + panel "belum upload" per jenis (misal PK 2026: 5 pegawai belum) — dari L6 belum_lengkap
  - Filter tahun di dashboard + link cepat ke Laporan/Evaluasi/RTL

## P2 — Dokumen (T_UTAMA = T_DOKUMEN) (KONTRAK)
- **Tujuan:** Upload & kelola file
- **User Story:** Sebagai pegawai, saya upload PK 2026 PDF saya, supaya admin tidak nagih WA
- **AC:**
  - List + filter-bar-analytics: search judul, filter tahun, bulan, jenis dokumen, status, pegawai (admin), unit
  - Tabel min-w: kode (auto) min-w-[160px], pegawai min-w-[200px], jenis min-w-[140px], tahun/bulan min-w-[100px], status badge valid min-w-[100px], aksi btn-icon min-w-[120px] (lihat, edit, hapus, verifikasi)
  - Form modal v-if 2xl: pegawai_id (pegawai-picker, admin bisa pilih, user auto diri), jenis_dokumen_id (select dari master), tahun (number), bulan (1-12, opsional), judul (auto dari jenis+tahun+nama), file upload (PDF ≤10MB via FileReader base64 → Drive), catatan
  - Upload → simpan ke Drive folder 'SIDOKUMEN' → file_drive_id + file_name + file_size disimpan + subfolder tahun opsional
  - Status default baru → menunggu setelah upload
  - Duplikat guard: pegawai+tahun+jenis+bulan sama → BAD_REQUEST + tampilkan file lama
  - Badge valid: baru=info, menunggu=warning, disetujui=success, revisi=danger, ditolak=rose

## P3 — Laporan 12 Output (KONTRAK) — L1-L12
- **L1 Daftar Dokumen:** `laporan_daftar_dokumen` — pagination + search + filter tahun/bulan/jenis/status/pegawai/unit
- **L2 per Jenis:** filter jenis_dokumen_id — count per jenis
- **L3 per Pegawai:** filter pegawai_id — count per pegawai
- **L4 Rekap per Jenis:** `lap_rekap_klasifikasi` — tahun, group by jenis, jml + pct vs total pegawai
- **L5 Rekap per Unit:** `lap_rekap_unit` — group by unit via PEGAWAI map
- **L6 Rekap per Pegawai:** `lap_rekap_pegawai` — matrix pegawai × jenis, total_jenis, pct, belum_lengkap[], lengkap[]
- **L7 Rekap per Periode:** `laporan_rekap_periode` — group by tahun-bulan
- **L8 Rekap per Status:** `laporan_rekap_status` — group by status
- **L9 Keterlambatan:** `laporan_keterlambatan` — vs T_JADWAL deadline, selisih_hari = tgl_upload - deadline
- **L10 File Bermasalah:** `laporan_file_bermasalah` — tanpa file_drive_id, mime bukan PDF, size >10MB, nama tidak standar
- **L11 Kepatuhan Upload:** `lap_kepatuhan_upload` — vs T_JADWAL deadline, tepat_waktu = selisih ≤0, pct tepat waktu per jenis
- **L12 Laporan Khas 7 sheet:** `laporan_khas_data` + `laporan_export_khas` — composite top5 + export Spreadsheet baru `SIDOKUMEN_KHAS_2026` 7 sheet: Cover KOP Satpol PP, Ringkasan, Rekap Jenis (L4), Rekap Unit (L5), Rekap Pegawai (L6), Kepatuhan (L11), TTD — via SpreadsheetApp.create + getOrCreateFolder_ 'SIDOKUMEN Export' — return file_url

## P4 — Analisa 10 Output (KONTRAK) — A3-A10 (A1-A2 dari Dashboard)
- **A3 Distribusi Unit:** `analisa_distribusi_unit` — tahun, distribusi per unit via PEGAWAI, total
- **A4 Top Pengumpul:** `analisa_top_pengirim` — top 10 pegawai paling rajin + jumlah + pct
- **A5 Beban Verifikator:** `analisa_beban_pejabat` — per verifikator (diteruskan/diproses/selesai) dari T_VERIFIKASI
- **A6 Retensi:** `analisa_retensi` — proyeksi 5 tahun: tahun-5 musnah, tahun-10 permanen, butuh BA
- **A7 Korelasi Jenis×Unit:** `analisa_korelasi_jenis_unit` — matrix top5 jenis × top8 unit
- **A8 TTE Ratio:** `analisa_tte_ratio` — placeholder 0% (future G15 TTE), total + tte + pct
- **A9 SLA Pejabat:** `analisa_sla_pejabat` — per verifikator total, lewat >3 hari, pct_lewat, avg_hari
- **A10 Kritis Bulanan:** `analisa_kritis_bulanan` — 12 bulan rekap jml + belum

## P5 — Evaluasi 8 Output (KONTRAK) — E1-E8
- **E1 SLA Verifikasi:** `evaluasi_sla_verifikasi` — total verifikasi, patuh ≤3 hari, tidak patuh >3 hari, pct_patuh, avg_hari
- **E2 SLA Upload:** `evaluasi_sla_upload` — vs T_JADWAL, total, tepat, terlambat, pct_patuh, avg_telat
- **E3 Kelengkapan:** `evaluasi_kelengkapan` — total dokumen, lengkap, missing (tanpa_file, tanpa_pegawai, tanpa_jenis, tanpa_tahun, tanpa_judul) + rincian 100
- **E4 Format:** `evaluasi_format` — total, patuh, tidak_patuh, rincian 100: mime bukan PDF, size >10MB, nama tidak standar regex `^\d{4}_[A-Z0-9_]+_[A-Z0-9\-]+(_\d{1,2})?\.pdf$`
- **E5 Kepatuhan Jenis:** `evaluasi_kepatuhan_jenis` — reuse L11 rekap per jenis pct
- **E6 Kadaluarsa:** `evaluasi_kadaluarsa` — dokumen ≤tahun-5 tanpa BA musnah di T_TINDAK_LANJUT (cek dokumen_terkait + judul mengandung tahun lama)
- **E7 Fisik:** `evaluasi_fisik` — proxy lokasi_fisik field (future), total + ada_fisik + pct
- **E8 Alih Media:** `evaluasi_alih_media` — % digital (ada file_drive_id) vs total + per jenis

## P6 — RTL 5 Output (KONTRAK) — R1-R5 Puncak Piramida
- **R1 Lengkapi Dokumen:** sumber E3 belum_lengkap — judul `R1 Lengkapi dokumen {nama} tahun {tahun} ({pct}%)`
- **R2 Perbaiki Format:** sumber E4 format tidak patuh — judul `R2 Perbaiki format {file_name} — {nama} ({issues})`
- **R3 Verifikasi Tertunda:** sumber E1/A9 SLA lewat — judul `R3 Verifikasi tertunda — {nama verifikator} ({lewat} lewat)`
- **R4 Arsipkan Dokumen Lama:** sumber E6 kadaluarsa — judul `R4 Arsipkan dokumen kadaluarsa tahun {tahun} — {count} dokumen`
- **R5 Pembinaan Pegawai:** sumber E5 kepatuhan <50% — judul `R5 Pembinaan pegawai — {count} jenis kepatuhan <50%`
- **Handler:** `get_tindak_lanjut_list` (page,search,status_rtl,sumber_evaluasi,tahun,per_page), `get_tindak_lanjut_detail`, `save_tindak_lanjut`, `delete_tindak_lanjut`, `ubah_status_tindak_lanjut` (legal: baru→diproses→selesai/batal), `generate_tindak_lanjut` (tahun,sumber_evaluasi,semua) — dedup judul via judul_set, idempoten
- **UI:** V_Rtl.html — generate panel + filter search/status/sumber/tahun + 4 stat-card total/baru/diproses/selesai + table-scroll min-w 260/100/100/140/110 + badge sumber/status + progress-track + modal form lg (judul,deskripsi,assigned_to,due_date,status,progress,catatan) + modal status md (status baru + progress + catatan)

## P7 — Master Jenis Dokumen (KONTRAK)
- CRUD M_JENIS_DOKUMEN — seed 10: PK, SKP_TAHUNAN, SKP_PERIODIK, PK_PERUBAHAN, PENILAIAN_BULANAN, PENILAIAN_TAHUNAN, LAPKIN, LHKPN, IKI, SKP_LAIN — kategori KINERJA_UTAMA/PERUBAHAN/PENILAIAN/LAPORAN/LAINNYA — status_aktif true/false — guard dipakai di T_DOKUMEN

## P8 — Pengaturan + Profil (KONTRAK)
- Pengaturan wrapper app-settings (CDN), Profil wrapper app-profile — role viewer/user/verifikator/admin
