---
title: 04_DATABASE — SIDOKUMEN
version: 1.7.0
status: stable
last_updated: 2026-09-22
maintainer: Tim SIDOKUMEN
tags:
  - database
  - schema
  - sidokumen
  - starter-kit
  - v1.7.0
---

# 04_DATABASE — SIDOKUMEN v1.7.0 Full Sync

![Version](https://img.shields.io/badge/version-1.7.0-blue)
![Sheets](https://img.shields.io/badge/sheets-12-green)
![Handlers](https://img.shields.io/badge/handlers-93-orange)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

> Skema **12 sheet** (3 master + 8 tabel + 1 KONFIGURASI) — standar starter-kit v2.10.0 — **93 handler full** — frontend v1.1.0 + backend 00–17 v1.0.3–v1.0.7

> [!IMPORTANT]
> **v1.7.0 fix:**
> - `T_DOKUMEN` + `lokasi_fisik` / `kondisi_fisik` (bukan future — sudah real untuk E7)
> - `M_KATEGORI_DOKUMEN.deskripsi` (bukan `keterangan`)
> - `T_LOGBOOK.aksi` (bukan `aktivitas`) + `dokumen_id`
> - `T_APPROVAL.urutan` / `role_approver` / `tanggal_approve` (bukan `level`)
> - `T_JADWAL` TANPA `tahun` / `jenis_dokumen_id` (akar bug dual-map fix)
> - `T_REKAP.periode` / `total_item` / `ringkasan_json`
> - **+ KONFIGURASI key-value (pk=`key`)**

---

## 📑 Daftar Isi

- [1. LOCAL_SHEETS (12)](#1-local_sheets-12)
- [2. ALL_SHEET_HEADERS (Kontrak v1.7.0)](#2-all_sheet_headers-kontrak-v170)
  - [2.1 M_JENIS_DOKUMEN](#21-m_jenis_dokumen)
  - [2.2 M_KATEGORI_DOKUMEN](#22-m_kategori_dokumen)
  - [2.3 M_PERIODE](#23-m_periode)
  - [2.4 T_DOKUMEN (utama)](#24-t_dokumen-utama)
  - [2.5 T_VERIFIKASI](#25-t_verifikasi)
  - [2.6 T_LAMPIRAN](#26-t_lampiran)
  - [2.7 T_LOGBOOK](#27-t_logbook)
  - [2.8 T_APPROVAL](#28-t_approval)
  - [2.9 T_JADWAL](#29-t_jadwal)
  - [2.10 T_REKAP](#210-t_rekap)
  - [2.11 T_TINDAK_LANJUT (RTL)](#211-t_tindak_lanjut-rtl)
  - [2.12 KONFIGURASI (NEW v1.7.0)](#212-konfigurasi-new-v170)
- [3. SIMPEG Ref (Tolerant Reader)](#3-simpeg-ref-tolerant-reader--bukan-local_sheets)
- [4. Drive Structure — v1.7.0](#4-drive-structure--v170)
- [5. Perubahan v1.7.0 dari v1.6.3](#5-perubahan-v170-dari-v163)
- [6. Ringkasan Perubahan v1.6.3 → v1.7.0](#6--ringkasan-perubahan-v163--v170)
- [7. Changelog](#7-changelog)

---

## 1. LOCAL_SHEETS (12)

```js
var LOCAL_SHEETS = {
  M_JENIS_DOKUMEN:    'M_JENIS_DOKUMEN',
  M_KATEGORI_DOKUMEN: 'M_KATEGORI_DOKUMEN',
  M_PERIODE:          'M_PERIODE',
  T_DOKUMEN:          'T_DOKUMEN',
  T_VERIFIKASI:       'T_VERIFIKASI',
  T_LAMPIRAN:         'T_LAMPIRAN',
  T_LOGBOOK:          'T_LOGBOOK',
  T_APPROVAL:         'T_APPROVAL',        // reuse untuk approval bertingkat (future)
  T_JADWAL:           'T_JADWAL',          // deadline pengumpulan — L9/L11/E2 dual-map byDokumen+byJenis
  T_REKAP:            'T_REKAP',           // cache rekap bulanan/tahunan
  T_TINDAK_LANJUT:    'T_TINDAK_LANJUT',   // RTL R1-R5 + BA musnah E6
  T_RTL:              'T_TINDAK_LANJUT',   // alias backward-compat (si-arsip v2.10.0)
  KONFIGURASI:        'KONFIGURASI'        // key-value store — pk=`key` (di-copy ke id oleh preSaveHook_)
};
```

> [!NOTE]
> **Alias:** `T_RTL` → `T_TINDAK_LANJUT`.
> **Primary key `KONFIGURASI` = `key`** (di-copy ke `id` oleh `localPreSaveHook_` agar `apiSave` / `apiDelete` bekerja).

---

## 2. ALL_SHEET_HEADERS (Kontrak v1.7.0)

### 2.1 M_JENIS_DOKUMEN

```
id, kode, nama, kategori, periode, urutan, status_aktif, keterangan,
created_at, updated_at, created_by, updated_by, deleted_at
```

**Seed 10 (sama v1.5):**

| Kode | Nama | Kategori | Periode |
|---|---|---|---|
| `PK` | Perjanjian Kinerja | `KINERJA_UTAMA` | Tahunan |
| `SKP_TAHUNAN` | Sasaran SKP Tahunan | `KINERJA_UTAMA` | Tahunan |
| `SKP_PERIODIK` | Sasaran SKP Periodik | `KINERJA_UTAMA` | Periodik |
| `PK_PERUBAHAN` | PK Perubahan | `PERUBAHAN` | Fleksibel |
| `PENILAIAN_BULANAN` | Penilaian SKP Bulanan | `PENILAIAN` | Bulanan (untuk A10 Kritis) |
| `PENILAIAN_TAHUNAN` | Penilaian SKP Tahunan | `PENILAIAN` | Tahunan |
| `LAPKIN` | Laporan Kinerja | `LAPORAN` | Tahunan |
| `LHKPN` | LHKPN | `LAINNYA` | Tahunan |
| `IKI` | IKI | `LAINNYA` | Tahunan |
| `SKP_LAIN` | Dokumen Lainnya | `LAINNYA` | Fleksibel |

### 2.2 M_KATEGORI_DOKUMEN

```
id, kode, nama, deskripsi, urutan, status_aktif,
created_at, updated_at, created_by, updated_by, deleted_at
```

- **v1.7.0 fix:** `deskripsi` (bukan `keterangan`) + tambahan `created_by` / `updated_by` / `deleted_at`.
- **Seed 5:** `KINERJA_UTAMA`, `PERUBAHAN`, `PENILAIAN`, `LAPORAN`, `LAINNYA`.

### 2.3 M_PERIODE

```
id, tahun, bulan, label, status_aktif,
created_at, updated_at, created_by, updated_by, deleted_at
```

- **Seed 3:** 2024, 2025, 2026.

### 2.4 T_DOKUMEN (utama)

```
id, pegawai_id, jenis_dokumen_id, tahun, bulan, periode_label,
judul, deskripsi, file_drive_id, file_name, file_size, file_mime,
status, uploaded_by, catatan, lokasi_fisik, kondisi_fisik,
created_at, updated_at, created_by, updated_by, deleted_at
```

- `pegawai_id` → `PEGAWAI.pegawai_id` (SIMPEG ref).
- `jenis_dokumen_id` → `M_JENIS_DOKUMEN.id`.
- `tahun`: 2024–2026 string (frontend validate 2000–2100).
- `bulan`: 1–12 nullable (`null` = tahunan).
- `file_drive_id`: Drive file ID di folder `SIDOKUMEN/{tahun}` — `file_name`, `file_size`, `file_mime` disimpan.
- `status`: `baru` / `menunggu` / `disetujui` / `revisi` / `ditolak` — default `baru`.
- `uploaded_by`: email actor dari session — jejak campur pegawai + admin TU.
- `lokasi_fisik` **(NEW v1.7.0)**: teks lokasi arsip fisik (contoh: `"Lemari A-01"`) — dipakai E7 real (bukan placeholder).
- `kondisi_fisik` **(NEW v1.7.0)**: teks kondisi (contoh: `"Baik"`) — future G07.
- **Duplikat guard:** `pegawai_id + tahun + jenis_dokumen_id + bulan` unique → `BAD_REQUEST`.
- **Auto:** `periode_label = tahun + (bulan ? '-' + padStart(bulan,2) : '')` di `preSaveHook_`.
- `T_LOGBOOK` otomatis dicatat dari `saveDokumen_` — `aksi='create'|'update'`.

### 2.5 T_VERIFIKASI

```
id, dokumen_id, verifikator_id, status_lama, status_baru, catatan,
created_at, updated_at, created_by, updated_by, deleted_at
```

- `dokumen_id` → `T_DOKUMEN.id`.
- `verifikator_id` → `PEGAWAI.pegawai_id` / user email — fallback `actor.pegawai_id || actor.id || actor.email` (v1.7.0).
- **SLA parametrik:** diff hari `created_at` verifikasi − `created_at` dokumen ≤ `sla_hari` (default 3) → patuh — dipakai E1/A9.

### 2.6 T_LAMPIRAN

```
id, dokumen_id, file_drive_id, file_name, file_size, keterangan,
created_at, updated_at, created_by, updated_by, deleted_at
```

- Untuk lampiran tambahan selain file utama — dipakai E8 `total_lampiran`.

### 2.7 T_LOGBOOK

```
id, dokumen_id, pegawai_id, aksi, catatan_sebelum, catatan_sesudah,
created_at, updated_at, created_by, updated_by, deleted_at
```

- **v1.7.0 fix:** `aksi` (bukan `aktivitas`) + `dokumen_id` + `catatan_sebelum` / `sesudah`.
- `aksi`: `'create'` | `'update'` — dicatat otomatis dari `saveDokumen_`.
- `catatan_sebelum` / `sesudah`: nilai judul sebelum/sesudah perubahan.

### 2.8 T_APPROVAL

```
id, dokumen_id, urutan, role_approver, approver_id, status, catatan,
tanggal_approve, created_at, updated_at, created_by, updated_by, deleted_at
```

- **v1.7.0 fix:** `urutan` (bukan `level`) + `role_approver` + `tanggal_approve`.
- `urutan`: step approval (1, 2, 3, ...).
- `role_approver`: role yang berhak approve (mis. `verifikator`, `admin`).
- `tanggal_approve`: ISO date saat approve.
- **Reuse** untuk approval bertingkat (future) — tidak dipakai aktif di v1.7.0.

### 2.9 T_JADWAL

```
id, dokumen_id, judul, tanggal_mulai, tanggal_selesai, lokasi,
pegawai_id, status, keterangan,
created_at, updated_at, created_by, updated_by, deleted_at
```

> [!WARNING]
> **CATATAN KRITIS v1.7.0:**
> - **TIDAK ADA** field `jenis_dokumen_id` / `tahun` — ini akar bug v1.6.3 yang bikin `laporanKeterlambatan_` selalu 0.
> - Filter tahun dilakukan via prefix `tanggal_selesai` (fallback `tanggal_mulai`) di `buildDeadlineMap_` dual-map.

**`buildDeadlineMap_(tahun)` v1.0.3** return:

```js
{ byDokumen: { dokId: tgl }, byJenis: { jenisId: tgl } }
```

- `byDokumen`: match langsung `T_JADWAL.dokumen_id` → `T_DOKUMEN.id`.
- `byJenis`: fallback kalau `T_JADWAL.jenis_dokumen_id` diisi (future-proof, field belum ada di header).
- **Prioritas lookup:** `byDokumen[dokId]` → `byJenis[jenisId]` → skip (bukan fallback blanket Jan-31).
- Dipakai **L9** keterlambatan, **L11** kepatuhan, **E2** SLA upload — semua pakai dual-map.

### 2.10 T_REKAP

```
id, periode, pegawai_id, unit_id, jenis_dokumen_id,
total_item, total_nilai, ringkasan_json, status_rekap, generated_at,
created_at, updated_at, created_by, updated_by, deleted_at
```

- **v1.7.0 fix:** `periode` (bukan `tahun` / `bulan`) + `total_item` / `total_nilai` / `ringkasan_json` / `status_rekap` / `generated_at`.
- Cache rekap — optional, bisa dihitung on-the-fly via `lap*` handler.
- `ringkasan_json`: snapshot data untuk audit historis.
- `status_rekap`: `'draft'` | `'final'`.

### 2.11 T_TINDAK_LANJUT (RTL)

```
id, sumber_evaluasi, judul_rtl, deskripsi, assigned_to, due_date,
status_rtl, progress_pct, dokumen_terkait, catatan,
created_at, updated_at, created_by, updated_by, deleted_at
```

- `sumber_evaluasi`: `E3` / `E4` / `E1` / `E6` / `E5` / `manual`.
- `judul_rtl`: unique dedup untuk idempoten generate — case-insensitive lowercase normalized (v1.7.0) — contoh: `R1 Lengkapi dokumen {nama} tahun {tahun} ({pct}%)`.
- **`status_rtl` state machine v1.7.0:**

| Dari | Ke |
|---|---|
| `baru` | `diproses`, `batal` |
| `diproses` | `selesai`, `batal` |
| `selesai` | — (final) |
| `batal` | `baru` (reaktivasi — baru di v1.7.0, sebelumnya `[]`) |

> [!CAUTION]
> **BLOKIR via `save_tindak_lanjut`** — update `status_rtl` harus via `ubah_status_tindak_lanjut`.

- `progress_pct`: 0–100 clamp via `clampPct_()` helper — UI progress-track color-coded.
- **Auto-progress v1.7.0:** 100 saat `selesai` (kalau tidak dikirim), 0 saat `batal`.
- `due_date`: `YYYY-MM-DD` — tahun filter + sort ASC di `getTindakLanjutList_`.
- `assigned_to`: `pegawai_id` — filter baru v1.7.0.
- `dokumen_terkait`: id dokumen (bisa comma-separated untuk R4/R5) — `split(',')` akurat di E6 v1.7.0.
- **BA musnah:** sumber E6, judul R4, catatan BA.
- **Idempotensi:** generate ulang tidak duplicate kalau judul sama (case-insensitive).

### 2.12 KONFIGURASI (NEW v1.7.0)

```
id, key, value, created_at, updated_at, created_by, updated_by, deleted_at
```

- **Primary key = `key`** (di-copy ke `id` oleh `localPreSaveHook_` agar `apiSave` / `apiDelete` bekerja).
- `pkFields: { KONFIGURASI: 'key' }` di `getAppConfig_()`.
- Key harus lolos `CoreLib.isAllowedConfigKey(key)` — kalau tidak → `FORBIDDEN`.
- Dipakai `saveConfigItem_` + `deleteConfigItem_` + audit `SAVE_CONFIG` / `SAVE_CONFIG_DENIED` / `DELETE_CONFIG` / `DELETE_CONFIG_DENIED`.
- **Handler:** `get_config`, `get_config_list`, `save_config_item` (= `save_config`), `delete_config_item` (= `delete_config`), `save` (entity=`KONFIGURASI`), `delete` (entity=`KONFIGURASI`).

---

## 3. SIMPEG Ref (Tolerant Reader — bukan LOCAL_SHEETS)

### 3.1 PEGAWAI

```
pegawai_id, nip, nik, nama, gelar_depan, gelar_belakang, jenis_kelamin,
tanggal_lahir, pangkat_golongan, status_kepegawaian, pendidikan_terakhir,
email, no_hp, alamat, foto_url, unit_id, jabatan_id, atasan_id, role, status,
created_at, updated_at, created_by, updated_by, deleted_at
```

### 3.2 UNIT_KERJA

```
unit_id, kode_unit, nama_unit, kategori_unit, parent_unit_id, lokasi,
telepon_unit, kepala_nip, kepala_hp, kepala_unit_id, jenis_unit,
status_aktif, keterangan, status,
created_at, updated_at, created_by, updated_by, deleted_at
```

### 3.3 JABATAN

```
jabatan_id, kode_jabatan, nama_jabatan, jenis_jabatan, rumpun_jabatan,
jenjang_jabatan, kelas_jabatan, unit_id, status_jabatan,
plt_pegawai_id, tanggal_mulai_jabatan, tanggal_selesai_jabatan,
target_jp_tahunan, status_aktif, keterangan, status,
created_at, updated_at, created_by, updated_by, deleted_at
```

> [!NOTE]
> **`isRefSheet_` fix v1.0.3:** hanya SIMPEG ref yang dianggap ref. `M_*` lokal + KONFIGURASI tetap dibuat via `ensureLocalSheets_()` + `initDatabase()` seed — fix missing `M_KATEGORI`, `M_PERIODE` setelah `CoreLib.initDatabase`.

---

## 4. Drive Structure — v1.7.0

### 4.1 Folder Utama

- Folder `SIDOKUMEN` root → subfolder `{tahun}` → file `{judul}.pdf` — `file_drive_id` disimpan.
  - **Pre-check size:** `base64.length × 3/4` sebelum decode (hindari alokasi besar).
  - **Folder auto-create:** `getOrCreateFolder_('SIDOKUMEN')` + `getOrCreateFolder_(tahun, parentFolder)`.

### 4.2 Folder Export

- Folder `SIDOKUMEN Export` → file `SIDOKUMEN_KHAS_{tahun}_{timestamp}` spreadsheet 7 sheets — `file_url` return via `ss.getUrl()` (bukan hardcode).
- **Sheets:** Cover (KOP Satpol PP), Ringkasan, Rekap Jenis (L4), Rekap Unit (L5), Rekap Pegawai (L6), Kepatuhan (L11), TTD.

---

## 5. Perubahan v1.7.0 dari v1.6.3

### 5.1 Skema — Header Akurat

| Sheet | Perubahan |
|---|---|
| `M_KATEGORI_DOKUMEN` | `deskripsi` (bukan `keterangan`) + `created_by` / `updated_by` / `deleted_at` |
| `M_PERIODE` | + `bulan` + `created_by` / `updated_by` / `deleted_at` |
| `T_DOKUMEN` | + `lokasi_fisik` + `kondisi_fisik` (bukan future — sudah real untuk E7) |
| `T_VERIFIKASI` | + `updated_at` / `updated_by` / `deleted_at` |
| `T_LAMPIRAN` | + `updated_at` / `created_by` / `updated_by` / `deleted_at` |
| `T_LOGBOOK` | `aksi` (bukan `aktivitas`) + `dokumen_id` + `catatan_sebelum` / `sesudah` + updated fields |
| `T_APPROVAL` | `urutan` / `role_approver` / `tanggal_approve` (bukan `level`) + updated fields |
| `T_JADWAL` | **TIDAK ada** `jenis_dokumen_id` / `tahun` — pakai `dokumen_id` + `judul` + `lokasi` + `pegawai_id` + `status` — akar bug dual-map |
| `T_REKAP` | `periode` / `total_item` / `total_nilai` / `ringkasan_json` / `status_rekap` / `generated_at` (bukan `tahun` / `bulan` / `jml` / `pct` / `keterangan`) |
| `KONFIGURASI` | **BARU** — key-value store — pk=`key` |

### 5.2 Backend Fix (v1.0.3–v1.0.7)

- `buildDeadlineMap_` dual-map `{byDokumen, byJenis}` di `10_LaporanApi` — fix L9 selalu 0 karena `T_JADWAL.jenis_dokumen_id` tidak ada.
- `lapKepatuhanUpload_` v1.0.3 pakai dual-map + `total_with_deadline` / `no_deadline` + skip kalau tidak ada (bukan blanket Jan-31).
- `evaluasiSlaUpload_` v1.0.6 pakai dual-map + `no_deadline` transparan.
- `evaluasiKadaluarsa_` v1.0.6 `split(',')` akurat (dari `indexOf` false-positive) + `dengan_ba` field baru.
- `evaluasiFisik_` v1.0.6 pakai field `lokasi_fisik` real (header ditambah v1.0.3) + `ada_lokasi` + `pct_ada`.
- `analisaBebanPejabat_.lewat` v1.0.4 hitung real SLA >3 hari (dari selalu 0) + `sla_hari` parametrik + pct per baris.
- `analisaKritisBulanan_.expected` v1.0.5 hitung pegawai × jenis_bulanan (dari hardcode ×1) + filter jenis `periode='Bulanan'`.
- `analisaKorelasiJenisUnit_` v1.0.5 single-pass O(n) counts map (dari O(j×u×n)) + kolom total per row.
- `analisaSlaPejabat_` v1.0.5 pre-index `dokMap` + `pegawaiNamaMap` + guard clock skew + `no_dokumen`.
- `analisaRetensi_` v1.0.5 pre-count by year O(n) + `musnah_netto`.
- `saveTindakLanjut_` v1.0.7 **BLOKIR** update `status_rtl` & `judul_rtl` — cegah bypass state machine.
- `ubahStatusTindakLanjut_` v1.0.7 idempoten + auto-progress + validate range.
- `generateTindakLanjut_` v1.0.7 idempoten case-insensitive + `detail.r1..r5` + `errors[]` collection.
- `RTL_TRANSISI_LEGAL_.batal` v1.0.7: `[]` → `['baru']` (reaktivasi).
- `getDashboard_` v1.0.3 + `totalRtl`, `rtlBaru`, `rtlSelesai`.
- `getDokumenList_` v1.0.3 + filter `unit_id` via PEGAWAI map.
- `verifikasiDokumen_` v1.0.3 actor fallback `pegawai_id || id || email`.

### 5.3 Frontend Fix (v1.1.0)

- **J_State v1.0.4:** `dokumenTotalPagesServer` + rtl counters + `masterSearch` + `masterFilteredJenis` + `rtlGenerateResult`.
- **J_Actions v1.0.4:** role-guard + `$nextTick` reset + validate tahun 2000–2100.
- **J_Helpers v1.0.3:** cached lookup O(1) + `pctColor_` + `fmtDateTime` / `fmtNumber` / `truncate_`.
- **J_Api v1.0.3:** breakdown `generateRtl`.
- **00_Utils v1.0.3:** `jsonSafe_` XSS escape + `AUDIT_DRY_RUN`.
- **99_TestSuite v1.0.4:** 27 domain test + `KNOWN_LIB_FAILURES_` aware.

### 5.4 Migrasi Existing Data

- **`T_DOKUMEN`** kolom baru: tambahkan `lokasi_fisik` + `kondisi_fisik` di sheet (posisi sebelum `created_at`). CoreLib tolerant reader pakai header-name match, jadi urutan tidak masalah.
- **`M_KATEGORI_DOKUMEN`:** rename `keterangan` → `deskripsi` (kalau ada data lama) atau tambahkan kolom baru.
- **`T_LOGBOOK`:** pastikan header baris 1 = `['id','dokumen_id','pegawai_id','aksi','catatan_sebelum','catatan_sesudah','created_at','updated_at','created_by','updated_by','deleted_at']`.
- **`T_APPROVAL`:** rename `level` → `urutan` + tambah `role_approver`, `tanggal_approve`.
- **`T_JADWAL`:** pastikan tidak ada kolom `jenis_dokumen_id` / `tahun` di header — kalau ada data lama, isi `dokumen_id` atau biarkan (akan di-skip oleh dual-map).
- **`T_REKAP`:** tambahkan `periode`, `total_item`, `total_nilai`, `ringkasan_json`, `status_rekap`, `generated_at`.
- **`KONFIGURASI`:** sheet baru dibuat otomatis oleh `ensureLocalSheets_()` saat `initDatabase()`.

> [!TIP]
> Jalankan `initDatabase()` sekali setelah migrasi file untuk ensure sheet + seed.

---

## 6. 📊 Ringkasan Perubahan v1.6.3 → v1.7.0

| Sheet | v1.6.3 | v1.7.0 |
|---|---|---|
| **Count** | 11 | **12** (+KONFIGURASI) |
| **M_JENIS_DOKUMEN** | OK | OK (tidak berubah) |
| **M_KATEGORI_DOKUMEN** | `keterangan`, 8 kolom | **`deskripsi`, 11 kolom** |
| **M_PERIODE** | 6 kolom | **+ `bulan` + audit fields** (10 kolom) |
| **T_DOKUMEN** | `lokasi_fisik` / `kondisi_fisik` future | **Real di header + auto `periode_label` + T_LOGBOOK otomatis** |
| **T_VERIFIKASI** | 8 kolom | **11 kolom (+updated fields)** + actor fallback |
| **T_LAMPIRAN** | 7 kolom | **11 kolom (+updated fields)** |
| **T_LOGBOOK** | `aktivitas`, 6 kolom | **`aksi`, 11 kolom (+`dokumen_id` +`catatan_sebelum` / `sesudah`)** |
| **T_APPROVAL** | `level`, 7 kolom | **`urutan`+`role_approver`+`tanggal_approve`, 12 kolom** |
| **T_JADWAL** | `jenis_dokumen_id` / `tahun` (akar bug) | **`dokumen_id` / `judul` / `lokasi` / `pegawai_id` / `status`** — dual-map fix |
| **T_REKAP** | `tahun` / `bulan` / `jml` / `pct` / `keterangan` | **`periode` / `total_item` / `total_nilai` / `ringkasan_json` / `status_rekap` / `generated_at`** |
| **T_TINDAK_LANJUT** | `batal→[]` | **`batal→[baru]` reaktivasi + BLOKIR bypass + auto-progress + idempoten case-insensitive + split akurat** |
| **KONFIGURASI** | ❌ | **✅ pk=`key` key-value store** |

---

## 7. Changelog

### v1.7.0 — 2026-09-22

- ✨ Tambah sheet **KONFIGURASI** (key-value store, pk=`key`).
- 🐛 Fix `T_JADWAL` dual-map — hapus `jenis_dokumen_id` / `tahun` (akar bug L9 selalu 0).
- 🐛 Fix `T_LOGBOOK.aksi` (bukan `aktivitas`) + tambah `dokumen_id` + `catatan_sebelum` / `sesudah`.
- 🐛 Fix `T_APPROVAL.urutan` / `role_approver` / `tanggal_approve` (bukan `level`).
- 🐛 Fix `T_REKAP.periode` / `total_item` / `ringkasan_json` / `status_rekap` / `generated_at`.
- 🐛 Fix `M_KATEGORI_DOKUMEN.deskripsi` (bukan `keterangan`).
- ✨ `T_DOKUMEN` + `lokasi_fisik` + `kondisi_fisik` (real untuk E7).
- ✨ `T_TINDAK_LANJUT` reaktivasi `batal → baru` + BLOKIR bypass + auto-progress + idempoten case-insensitive.
- 🔧 Backend fix v1.0.3–v1.0.7 (lihat [§5.2](#52-backend-fix-v103v107)).
- 🔧 Frontend fix v1.1.0 (lihat [§5.3](#53-frontend-fix-v110)).

### v1.6.3 — (sebelumnya)

- 11 sheet, dual-map bug, `T_JADWAL` pakai `jenis_dokumen_id` / `tahun`.
- `T_LOGBOOK.aktivitas`, `T_APPROVAL.level`, `T_REKAP.tahun/bulan/jml/pct`.

---

## 📁 Struktur Repo Rekomendasi

```
sidokumen/
├── docs/
│   ├── 01_OVERVIEW.md
│   ├── 02_ARSITEKTUR.md
│   ├── 03_API.md
│   ├── 04_DATABASE.md          ← file ini
│   ├── 05_FRONTEND.md
│   └── 06_DEPLOYMENT.md
├── src/
│   ├── backend/
│   │   ├── 00_Utils.gs
│   │   ├── 01_CoreLib.gs
│   │   ├── ...
│   │   └── 17_TestSuite.gs
│   └── frontend/
│       ├── J_State.gs
│       ├── J_Actions.gs
│       ├── J_Api.gs
│       └── J_Helpers.gs
├── .gitignore
├── LICENSE
└── README.md
```

---

**04_DATABASE.md v1.7.0 siap commit — sinkron 100% dengan kode aktual (semua header regenerate dari `ALL_SHEET_HEADERS` + migrasi notes untuk sheet existing).** ✅
