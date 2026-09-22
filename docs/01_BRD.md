# 01_BRD — Business Requirements Document — SIDOKUMEN v1.7.0 full sync

> App: SIDOKUMEN — Sistem Dokumen Kinerja
> Versi: v1.7.0 full sync — 35 output (L12+A10+E8+R5) — 12 sheet + 93 handler + Drive + frontend GAS truth v1.1.0
> Pemilik: Satpol PP dan Damkar Kab. Trenggalek — TU/Kepegawaian
> Tanggal: 2026-09-22
> Frontend: Index v1.0.3 (splash) + J_State v1.0.4 + J_Helpers v1.0.3 + J_Api v1.0.3 + J_Actions v1.0.4 + J_App v1.0.3 + V_ 8 files v1.1.0
> Backend: 00_Utils v1.0.3 + 01_Config v1.0.3 + 02_AppLogic v1.0.3 + 10_Laporan v1.0.3 + 13_Rekap v1.0.3 + 14_Analisa v1.0.4 + 15_Lanjut v1.0.5 + 16_Evaluasi v1.0.6 + 17_Rtl v1.0.7 + 99_TestSuite v1.0.4

## 1. Latar Belakang & Masalah
Setiap tahun kantor harus mengumpulkan file:
- Perjanjian Kinerja (PK)
- Sasaran SKP Tahunan
- Sasaran SKP Periodik/Perubahan
- Perjanjian Kinerja Perubahan
- Penilaian SKP Bulanan
- Penilaian SKP Tahunan
- Laporan Kinerja (Lapkin)
- Plus: LHKPN, IKI, SKP lainnya, file pendukung

**Masalah umum:**
- File tercecer di WA, email, laptop masing-masing
- Tidak tahu siapa sudah upload, siapa belum — butuh rekap kelengkapan per pegawai/jenis/unit
- Format tidak standar (bukan PDF, >10MB, nama acak) — butuh evaluasi format
- Verifikasi lambat — butuh SLA 3 hari + evaluasi + RTL
- Kadaluarsa arsip 5 tahun — butuh retensi + BA musnah
- **Frontend lama v1.6.3:** bug pagination ganda + role-guard belum ada → fix v1.0.4 dengan `dokumenTotalPagesServer` + `$nextTick` reset file input + validasi tahun 2000-2100
- **Backend lama v1.6.3:** `buildDeadlineMap_` key salah → L9/E2/L11 selalu 0, `analisaBebanPejabat_.lewat` selalu 0, `analisaKritisBulanan_.expected` hardcode ×1, RTL `saveTindakLanjut_` bisa bypass state machine → fix v1.0.3-v1.0.7 dengan dual-map deadline, pre-index cache, real SLA counter, block state machine

## 2. Tujuan Bisnis v1.7.0 full sync
- Gudang tunggal file kinerja — semua PDF di Drive folder 'SIDOKUMEN' + jejak uploaded_by + role-guard frontend v1.0.4 (user biasa auto-fill pegawai_id sendiri, anti spoofing) + validasi tahun 2000-2100 + $nextTick reset file input
- **Piramida laporan:** L1-L12 (12 output) — daftar, per jenis/pegawai/unit/periode/status/keterlambatan/file bermasalah/kepatuhan/khas 7 sheet — V_Laporan v1.1.0 dengan info banner `jadwal_total` + `total_with_deadline` + `no_deadline` transparan + progress color-coded + Export Khas field `sheets` benar
- **Piramida analisa:** A3-A10 — distribusi unit top8 (dengan `unit_nama`), top pengumpul top10, beban verifikator (dengan `lewat` real SLA + `sla_hari` parametrik), retensi 5yr proyeksi (dengan `musnah_netto`), korelasi jenis×unit matrix 5×8 (single-pass O(n) + sticky kolom), TTE ratio placeholder 0%, SLA pejabat lewat >3 hari (pre-index cached), kritis bulanan 12 bulan (dengan `expected` = pegawai × jenis_bulanan) — V_Analisa v1.1.0
- **Piramida evaluasi:** E1-E8 — SLA verifikasi (`total_with_dokumen` + `no_dokumen`), SLA upload (`total_with_deadline` + `no_deadline` via dual-map), kelengkapan missing 5 kategori + `pct_missing`, format regex case-insensitive + display pattern, kepatuhan jenis reuse L11, kadaluarsa ≤tahun-5 tanpa BA (`dengan_ba` + `tanpa_ba` split akurat), fisik real (`ada_lokasi` + `pct_ada` dari field `lokasi_fisik`), alih media % digital (rekap sorted) — V_Evaluasi v1.1.0
- **Piramida RTL:** R1-R5 puncak — auto-generate idempoten dedup judul case-insensitive dari E3/E4/E1/E6/E5 + breakdown `detail.r1..r5` + `errors[]` collection + state machine `baru→diproses→selesai/batal→baru` (reaktivasi) + BLOKIR bypass via `saveTindakLanjut_` + auto-progress (100 saat selesai, 0 saat batal) — V_Rtl v1.1.0 dengan breakdown panel + immutable fields + quick-pick status + info transisi legal
- **Frontend GAS truth v1.1.0:** Index v1.0.3 (splash screen) + J_State v1.0.4 (fix pagination + masterSearch + rtlGenerateResult) + J_Helpers v1.0.3 (cached lookup + pctColor_ + debounce) + J_Api v1.0.3 (breakdown generateRtl) + J_Actions v1.0.4 (role-guard + $nextTick + validate tahun) — 100% sync GAS=Workspace=GitHub
- **Dashboard:** Hero banner gradient emerald + 8 KPI grouped (Dokumen 4 + RTL 4) + 2 chart (tren + status) + 2 tabel (terbaru L1 + belum lengkap L6) + nullish-safe + progress color-coded — V_Dashboard v1.1.0
- **KONFIGURASI sheet** — key-value store (12 sheet dari 11) untuk pengaturan aplikasi (pk=`key`)
- **Test GREEN:** Library 42/0/1 + Routing 29/0 + Domain **27/0** (naik dari 14 → +13 test baru)

## 3. Stakeholder
- **Pegawai:** upload dokumen sendiri, lihat rekap kelengkapan sendiri, role-guard anti spoofing (pegawai_id auto-fill + locked dropdown untuk non-admin)
- **Admin TU / Verifikator:** verifikasi status (quick-pick 4 tombol), lihat semua pegawai, generate RTL (breakdown R1-R5 panel + errors list), export Khas 7 sheet (auto-open link)
- **Pimpinan:** lihat dashboard hero banner + 8 KPI + 2 chart + laporan kepatuhan + analisa beban (lewat SLA real) + evaluasi SLA (parametrik)
- **Auditor:** butuh jejak AUDIT_LOGS (via SI-PLATFORM + local) + T_VERIFIKASI (log status) + T_LOGBOOK (create/update) + BA musnah di T_TINDAK_LANJUT (sumber E6, RTL R4)

## 4. Ruang Lingkup v1.7.0
**In:**
- Master fleksibel M_JENIS_DOKUMEN 10 seed + M_KATEGORI 5 + M_PERIODE 3 (2024-2026)
- **KONFIGURASI** key-value store (pk=`key`) + audit SAVE_CONFIG/DELETE_CONFIG
- T_DOKUMEN CRUD + upload PDF ≤10MB base64 → Drive SIDOKUMEN/{tahun} + duplikat guard pegawai+tahun+jenis+bulan + role-guard frontend + validate tahun 2000-2100 + **`lokasi_fisik` + `kondisi_fisik`** untuk tracking arsip fisik
- Laporan 12 output + Analisa 10 + Evaluasi 8 + RTL 5 = 35 output
- Export Khas L12 7 sheet (Cover KOP, Ringkasan, Rekap Jenis, Unit, Pegawai, Kepatuhan, TTD) → folder SIDOKUMEN Export via `ss.getUrl()`
- Dashboard hero banner + 8 KPI grouped + 2 chart + 2 tabel
- **Splash screen** untuk pengalaman first-load (logo SD + brand + spinner + auto-hide 4s)
- **Role-guard double-layer:** frontend (dropdown disabled + auto-fill) + backend (actor fallback pegawai_id > id > email)
- **State machine RTL** dengan backend guard (BLOKIR bypass) + breakdown + error collection
- **Dual-map deadline** `{byDokumen, byJenis}` + skip kalau tidak ada (bukan blanket)
- Test GREEN 42/0/1 + 29/0 + 27/0

**Out (v2):**
- Preview PDF inline iframe Drive, export Excel per pegawai, timeline verifikasi bertingkat, lonceng notifikasi + badge belum upload, TTE digital real (A8 non-placeholder), OCR isi PDF, e-sign workflow, integrasi e-Kinerja BKN, retensi otomatis + BA digital

## 5. Kriteria Sukses v1.7.0
- Semua pegawai bisa upload PDF ≤10MB, admin bisa verifikasi (quick-pick 4 tombol), status berubah, jejak di T_VERIFIKASI (`verifikator_id` fallback pegawai_id > id > email)
- Laporan L4/L6/L11 tampil % kelengkapan per pegawai/jenis/unit, L11 dengan `total_with_deadline` + `no_deadline` transparan, L12 export 7 sheet jadi dengan `file_url` (via `ss.getUrl()`) + auto-open
- Analisa A3 distribusi unit top8 (dengan `unit_nama`), A4 top10, A5 beban dengan `lewat` real SLA + `sla_hari` dari backend, A6 retensi proyeksi 5 tahun dengan `musnah_netto`, A7 matrix 5×8 dengan sticky kolom + kolom Total, A9 SLA lewat >3 hari (parametrik), A10 kritis bulanan dengan `expected` akurat
- Evaluasi E1 `total_with_dokumen` + `no_dokumen`, E2 `total_with_deadline` + `no_deadline`, E3 missing tanpa_file + chips issues, E4 format regex display + chips, E6 kadaluarsa `dengan_ba` + `tanpa_ba`, E7 fisik `ada_lokasi` real, E8 % digital rekap
- RTL generate dari E3/E4/E1/E6/E5 idempoten dedup judul case-insensitive + breakdown `detail.r1..r5` + `errors[]` collection, state machine legal baru→diproses→selesai/batal→baru (reaktivasi), BLOKIR bypass via saveTindakLanjut_, auto-progress (100 selesai, 0 batal), validate progress_pct 0..100
- Frontend: hero banner Dashboard + quick stats V_Dokumen/V_Master + search+clear + progress color-coded + pagination lengkap + debounce 350ms + role-guard + $nextTick reset + immutable fields RTL + info banner transparansi + badge chips + splash screen
- Test runAllTestsSidokumen GREEN 42/0/1 + 29/0 + 27/0 dengan `KNOWN_LIB_FAILURES_` aware

## 6. Risiko & Mitigasi v1.7.0
- **File besar >10MB** → UI check (file.size) + backend pre-check (base64.length × 3/4) + L10 flag + toast error
- **Duplikat upload** → guard pegawai+tahun+jenis+bulan + BAD_REQUEST + tampilkan ID file lama
- **Bug pagination Vue3** (`dokumenTotalPages` konflik data↔computed) → fix v1.0.4 dengan `dokumenTotalPagesServer` di data + `paginatedDokumen` return langsung (server sudah slice)
- **Spoofing pegawai_id** → role-guard frontend (dropdown disabled + auto-fill currentUser.pegawai_id) + backend fallback actor pegawai_id > id > email
- **Ref file input undefined karena v-if modal** → fix `$nextTick` di `openDokumenCreate/Edit` + reset value='' cegah file nyangkut antar sesi
- **Tahun tidak valid** → validate 2000-2100 di frontend + backend
- **Deadline blanket (Jan-31)** → dual-map `{byDokumen, byJenis}` + skip kalau tidak ada jadwal (bukan fallback blanket) → L9/E2/L11 lebih akurat
- **`analisaBebanPejabat_.lewat` selalu 0** → hitung real SLA `created_at > 3 hari` untuk status menunggu/baru/revisi + `sla_hari` parametrik
- **`analisaKritisBulanan_.expected` hardcode ×1** → hitung `pegawai × jenis_bulanan` berdasarkan jenis dengan `periode='Bulanan'` aktif
- **Bypass state machine RTL** → `saveTindakLanjut_` BLOKIR update `status_rtl` & `judul_rtl` langsung, harus via `ubah_status_tindak_lanjut` + idempotensi case-insensitive judul
- **Transisi ilegal RTL** → cek `RTL_TRANSISI_LEGAL_` + return BAD_REQUEST dengan daftar transisi legal + UI disabled untuk final
- **Clock skew** → guard `diff < 0 → 0` di E1/A9
- **CoreLib internal fail** → `KNOWN_LIB_FAILURES_` toleransi (default 1) + `allPass` aware
- **XSS di SSO ticket** → `jsonSafe_` escape `<>&\u2028\u2029` di Index.html
- **Audit spam saat testing** → `AUDIT_DRY_RUN='true'` skip HTTP (auto restore setelah self-check)
