# 04_DATABASE — SIDOKUMEN v1.6.3 full sync

> Skema 11 sheet (3 master + 8 tabel) — standar starter-kit v2.10.0 — 87 handler full — frontend v1.0.2/v1.0.3 + backend 14-17 v1.6-v1.9 — tidak ada perubahan skema dari v1.5, hanya fix frontend pagination + role-guard

## LOCAL_SHEETS (11)

```js
var LOCAL_SHEETS = {
  M_JENIS_DOKUMEN: 'M_JENIS_DOKUMEN',
  M_KATEGORI_DOKUMEN: 'M_KATEGORI_DOKUMEN',
  M_PERIODE: 'M_PERIODE',
  T_DOKUMEN: 'T_DOKUMEN',
  T_VERIFIKASI: 'T_VERIFIKASI',
  T_LAMPIRAN: 'T_LAMPIRAN',
  T_LOGBOOK: 'T_LOGBOOK',
  T_APPROVAL: 'T_APPROVAL', // reuse untuk verifikasi approval jika perlu
  T_JADWAL: 'T_JADWAL', // untuk deadline pengumpulan — dipakai L9/L11/E2 — buildDeadlineMap_ fix tanggal_selesai
  T_REKAP: 'T_REKAP', // cache rekap bulanan/tahunan
  T_TINDAK_LANJUT: 'T_TINDAK_LANJUT' // untuk RTL R1-R5 + BA musnah E6 — RTL_TRANSISI_LEGAL_ baru→diproses→selesai/batal
};
```

Alias: T_RTL → T_TINDAK_LANJUT (dari si-arsip v2.10.0)

## ALL_SHEET_HEADERS (kontrak) — tetap v1.5, valid v1.6.3

### M_JENIS_DOKUMEN
id, kode, nama, kategori, periode, urutan, status_aktif, keterangan, created_at, updated_at, created_by, updated_by, deleted_at

Seed 10 v1.6.3 (sama v1.5):
- PK — Perjanjian Kinerja — KINERJA_UTAMA — Tahunan
- SKP_TAHUNAN — Sasaran SKP Tahunan — KINERJA_UTAMA — Tahunan
- SKP_PERIODIK — Sasaran SKP Periodik — KINERJA_UTAMA — Periodik
- PK_PERUBAHAN — PK Perubahan — PERUBAHAN — Fleksibel
- PENILAIAN_BULANAN — Penilaian SKP Bulanan — PENILAIAN — Bulanan
- PENILAIAN_TAHUNAN — Penilaian SKP Tahunan — PENILAIAN — Tahunan
- LAPKIN — Laporan Kinerja — LAPORAN — Tahunan
- LHKPN — LHKPN — LAINNYA — Tahunan
- IKI — IKI — LAINNYA — Tahunan
- SKP_LAIN — Dokumen Lainnya — LAINNYA — Fleksibel

### M_KATEGORI_DOKUMEN
id, kode, nama, urutan, status_aktif, keterangan, created_at, updated_at

Seed 5: KINERJA_UTAMA, PERUBAHAN, PENILAIAN, LAPORAN, LAINNYA

### M_PERIODE
id, tahun, label, status_aktif, keterangan, created_at

Seed 3: 2024, 2025, 2026

### T_DOKUMEN (utama)
id, pegawai_id, jenis_dokumen_id, tahun, bulan, periode_label, judul, deskripsi, file_drive_id, file_name, file_size, file_mime, status, uploaded_by, catatan, created_at, updated_at, created_by, updated_by, deleted_at, lokasi_fisik (future G07), kondisi_fisik (future)

- pegawai_id → PEGAWAI.pegawai_id (SIMPEG ref)
- jenis_dokumen_id → M_JENIS_DOKUMEN.id
- tahun: 2024-2026 string
- bulan: 1-12 nullable (null = tahunan)
- file_drive_id: Drive file ID di folder SIDOKUMEN/{tahun} — file_name, file_size, file_mime disimpan
- status: baru/menunggu/disetujui/revisi/ditolak — default baru
- uploaded_by: email actor dari session — jejak campur pegawai+admin TU
- catatan: catatan verifikasi / keterangan
- Index: pegawai_id+tahun+jenis_dokumen_id+bulan unique guard — duplikat → BAD_REQUEST

### T_VERIFIKASI
id, dokumen_id, verifikator_id, status_lama, status_baru, catatan, created_at, created_by

- dokumen_id → T_DOKUMEN.id
- verifikator_id → PEGAWAI.pegawai_id / user email
- SLA: diff created_at verifikasi - created_at dokumen ≤3 hari patuh — dipakai E1/A9

### T_LAMPIRAN
id, dokumen_id, file_drive_id, file_name, file_size, file_mime, keterangan, created_at

- Untuk lampiran tambahan selain file utama — dipakai E8 total_lampiran

### T_LOGBOOK
id, pegawai_id, aktivitas, tanggal, keterangan, created_at

- Future log harian — belum dipakai v1

### T_APPROVAL
id, dokumen_id, approver_id, level, status, catatan, created_at

- Reuse untuk approval bertingkat — future

### T_JADWAL
id, jenis_dokumen_id, tahun, tanggal_mulai, tanggal_selesai, keterangan, created_at

- Deadline pengumpulan per jenis per tahun — dipakai L9 keterlambatan vs upload, L11 kepatuhan, E2 SLA upload — **fix v1.0.2 buildDeadlineMap_ pakai tanggal_selesai filter, skip no-deadline**

### T_REKAP
id, tahun, bulan, jenis_dokumen_id, unit_id, pegawai_id, jml, pct, keterangan, created_at

- Cache rekap — optional, bisa dihitung on-the-fly

### T_TINDAK_LANJUT (RTL)
id, sumber_evaluasi, judul_rtl, deskripsi, assigned_to, due_date, status_rtl, progress_pct, dokumen_terkait, catatan, created_at, updated_at, created_by, updated_by, deleted_at

- sumber_evaluasi: E3/E4/E1/E6/E5/manual
- judul_rtl: unique dedup untuk idempoten generate — contoh `R1 Lengkapi dokumen {nama} tahun {tahun} ({pct}%)`
- status_rtl: baru/diproses/selesai/batal — transisi legal via RTL_TRANSISI_LEGAL_ baru→[diproses,batal], diproses→[selesai,batal]
- progress_pct: 0-100 clamp via clampPct_() helper — UI progress-track
- due_date: YYYY-MM-DD — tahun filter
- assigned_to: pegawai_id
- dokumen_terkait: id dokumen (bisa comma-separated untuk R4/R5)
- BA musnah: sumber E6, judul R4, catatan BA

## SIMPEG Ref (tolerant reader, tetap di SIMPEG sheet, bukan LOCAL_SHEETS)
- PEGAWAI: pegawai_id, nama, nama_lengkap, nip, unit_id, jabatan_id, status_aktif
- UNIT_KERJA: unit_id, nama_unit
- JABATAN: jabatan_id, nama_jabatan

isRefSheet_ fix v1.0.2: hanya SIMPEG ref yang dianggap ref, M_* lokal tetap dibuat via ensureLocalSheets_() + initDatabase() seed — fix missing M_KATEGORI, M_PERIODE setelah CoreLib.initDatabase

## Drive Structure — tetap
- Folder `SIDOKUMEN` root → subfolder `{tahun}` → file `{tahun}_{kode}_{nama}_{bulan}.pdf` — file_drive_id disimpan
- Folder `SIDOKUMEN Export` → file `SIDOKUMEN_KHAS_{tahun}` spreadsheet 7 sheets — file_url return

## Perubahan v1.6.3
- Tidak ada perubahan skema header — semua header v1.5 tetap valid
- Fix backend: buildDeadlineMap_ pakai tanggal_selesai, filter no-deadline skip — L9/L11/E2 lebih akurat
- Fix frontend: J_State v1.0.3 dokumenTotalPagesServer + rtl counters — tidak butuh perubahan DB, hanya state
- Fix J_Actions nextTick — tidak butuh perubahan DB
