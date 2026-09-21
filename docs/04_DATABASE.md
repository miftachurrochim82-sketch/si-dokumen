# 04_DATABASE — SIDOKUMEN v1.5 full piramida 35 output

> Skema 11 sheet (3 master + 8 tabel) — standar starter-kit v2.10.0 — 87 handler full

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
  T_JADWAL: 'T_JADWAL', // untuk deadline pengumpulan — dipakai L9/L11/E2
  T_REKAP: 'T_REKAP', // cache rekap bulanan/tahunan
  T_TINDAK_LANJUT: 'T_TINDAK_LANJUT' // untuk RTL R1-R5 + BA musnah E6
};
```

Alias: T_RTL → T_TINDAK_LANJUT (dari si-arsip v2.10.0)

## ALL_SHEET_HEADERS (kontrak)

### M_JENIS_DOKUMEN
id, kode, nama, kategori, periode, urutan, status_aktif, keterangan, created_at, updated_at, created_by, updated_by, deleted_at

Seed 10 v1.5:
- PK (Perjanjian Kinerja), SKP_TAHUNAN, SKP_PERIODIK, PK_PERUBAHAN, PENILAIAN_BULANAN, PENILAIAN_TAHUNAN, LAPKIN, LHKPN, IKI, SKP_LAIN
- kategori: KINERJA_UTAMA, PERUBAHAN, PENILAIAN, LAPORAN, LAINNYA — status_aktif true

### M_KATEGORI_DOKUMEN
id, kode, nama, deskripsi, urutan, status_aktif, created_at, updated_at, created_by, updated_by, deleted_at

Seed: KINERJA_UTAMA, PERUBAHAN, PENILAIAN, LAPORAN, LAINNYA

### M_PERIODE
id, tahun, bulan, label, status_aktif, created_at, updated_at, created_by, updated_by, deleted_at

Seed: 2024, 2025, 2026 + bulan 1-12 — untuk L7 rekap periode

### T_DOKUMEN (utama) — dipakai semua L/A/E/R
id, pegawai_id, jenis_dokumen_id, tahun, bulan, periode_label, judul, deskripsi, file_drive_id, file_name, file_size, file_mime, status, uploaded_by, catatan, created_at, updated_at, created_by, updated_by, deleted_at

- pegawai_id → SIMPEG PEGAWAI.id — untuk L3/L5/L6/A3/A4
- jenis_dokumen_id → M_JENIS_DOKUMEN.id — untuk L2/L4/E5
- tahun, bulan — untuk L7/A10/E3
- file_drive_id: id file di Drive folder 'SIDOKUMEN' — untuk L10/E4/E8 alih media
- file_name, file_size, file_mime — untuk L10 file bermasalah (mime bukan PDF, >10MB, nama tidak standar)
- status: baru, menunggu, disetujui, revisi, ditolak — untuk L8/A5
- uploaded_by: email pengupload (bisa beda dengan pegawai_id bila admin uploadkan)
- Index: pegawai_id+tahun+jenis_dokumen_id+bulan unique (cegah duplikat) — guard di save_dokumen_

### T_VERIFIKASI — untuk A5 Beban + E1 SLA + A9 SLA Pejabat + R3
id, dokumen_id, verifikator_id, status_lama, status_baru, catatan, created_at, updated_at, created_by, updated_by, deleted_at

- dokumen_id → T_DOKUMEN.id
- verifikator_id → user.id / pegawai_id verifikator
- created_at vs dokumen created_at → hitung SLA verifikasi (selisih hari) — E1/A9 lewat >3 hari

### T_JADWAL — untuk L9 Keterlambatan + L11 Kepatuhan + E2 SLA Upload
id, kode, nama, jenis_dokumen_id, tahun, bulan, deadline_tgl, deskripsi, status_aktif, created_at, updated_at, created_by, updated_by, deleted_at

- jenis_dokumen_id + tahun + bulan → deadline
- Logic: selisih_hari = T_DOKUMEN.created_at - deadline_tgl — tepat_waktu jika ≤0

### T_TINDAK_LANJUT — untuk RTL R1-R5 + E6 BA musnah
id, sumber_evaluasi, judul_rtl, deskripsi, assigned_to, due_date, status_rtl, progress_pct, dokumen_terkait, catatan, tahun, created_at, updated_at, created_by, updated_by, deleted_at

- sumber_evaluasi: E3/E4/E1/E6/E5/manual — untuk R1-R5 generate
- judul_rtl unique guard dedup — idempoten generate
- status_rtl: baru, diproses, selesai, batal — transisi legal RTL_TRANSISI_LEGAL_
- progress_pct 0-100 — progress-track UI
- dokumen_terkait: id dokumen atau list tahun — untuk E6 cek BA musnah (dokumen kadaluarsa tanpa BA = cari T_TINDAK_LANJUT dengan dokumen_terkait mengandung tahun lama + judul mengandung BA/musnah)

### T_LAMPIRAN, T_LOGBOOK, T_APPROVAL, T_REKAP
Reuse dari starter-kit v2.10.0 — header standar + audit cols — untuk lampiran tambahan, log, approval, cache rekap

## LOCAL_ID_PREFIX
M_JENIS_DOKUMEN: jns-, M_KATEGORI_DOKUMEN: kat-, M_PERIODE: prd-, T_DOKUMEN: dok-, T_VERIFIKASI: ver-, T_LAMPIRAN: lmp-, T_LOGBOOK: log-, T_APPROVAL: apr-, T_JADWAL: jdw-, T_REKAP: rek-, T_TINDAK_LANJUT/T_RTL: rtl-

## SIMPEG RO (tolerant reader)
PEGAWAI, JABATAN, UNIT_KERJA — baca via getSheetData_('PEGAWAI') otomatis route ke MASTER_SPREADSHEET_ID — dipakai A3 distribusi unit, L5 rekap unit, L6 matrix pegawai

## Drive
- Folder utama: 'SIDOKUMEN' (buat otomatis di My Drive admin via getOrCreateFolder_, share ke editor yang sama dengan spreadsheet)
- Subfolder per tahun: 'SIDOKUMEN/2026', 'SIDOKUMEN/2025' (opsional, untuk rapi) — dipakai save_dokumen_
- Folder export Khas L12: 'SIDOKUMEN Export' — berisi spreadsheet `SIDOKUMEN_KHAS_2026` 7 sheets — via getOrCreateFolder_ + SpreadsheetApp.create
- File naming: {tahun}_{kode_jenis}_{nama_pegawai}_{bulan}.pdf → 2026_PK_Budi_Santoso.pdf — regex evaluasi E4: `^\d{4}_[A-Z0-9_]+_[A-Z0-9\-]+(_\d{1,2})?\.pdf$`

## Relasi Full Piramida
- T_DOKUMEN.pegawai_id → PEGAWAI.id (1 pegawai punya banyak dokumen per tahun) — L3/L5/L6/A3/A4
- T_DOKUMEN.jenis_dokumen_id → M_JENIS_DOKUMEN.id — L2/L4/E5
- T_VERIFIKASI.dokumen_id → T_DOKUMEN.id — A5/A9/E1/R3
- T_LAMPIRAN.dokumen_id → T_DOKUMEN.id
- T_JADWAL.jenis_dokumen_id → M_JENIS_DOKUMEN.id — L9/L11/E2
- T_TINDAK_LANJUT.dokumen_terkait → T_DOKUMEN.id atau tahun — E6/R4

## Validasi Full
- File wajib PDF, ≤10MB — L10/E4
- Tahun 2020-2030
- Bulan 1-12 atau null (untuk tahunan) — L7/A10
- Status transisi legal via verifikasi_dokumen handler — baru→menunggu→disetujui/revisi
- Duplikat guard pegawai+tahun+jenis+bulan — BAD_REQUEST
- Nama standar regex — E4
- SLA verifikasi ≤3 hari — E1/A9
- SLA upload vs T_JADWAL — E2/L11
- Kadaluarsa ≤tahun-5 tanpa BA — E6

## Seed v1.5
- M_JENIS_DOKUMEN 10, M_KATEGORI 5, M_PERIODE 3 tahun + 12 bulan
- T_JADWAL seed contoh: PK 2026 deadline 2026-01-31, SKP_TAHUNAN 2026-02-28, dll
- initDatabase() buat 11 sheet + ZZ_TEST_CRUD + seed + Drive folder
