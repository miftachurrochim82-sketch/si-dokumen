# 07_TESTCASE — SIDOKUMEN v1.5 full piramida 35 output

> Target suite: runAllTestsSidokumen() — library 42/0/1 + routing 80+/0 + domain L4/L6/L11/L12/A3/A9/E3/E4/R generate + schema 11 = ~150/0/1

## TC-DOK-01 — Upload valid
- Input: pegawai_id TEST-PEGAWAI-001, jenis PK seed, tahun 2026, file_drive_id dummy, file_name test.pdf, file_size 1234, file_mime application/pdf, judul Test Dokumen
- Harap: success + id dok-xxx
- Cleanup: softDelete T_DOKUMEN

## TC-DOK-02 — Upload tanpa file saat create DITOLAK (opsional, tergantung policy)
- Input: tanpa file_drive_id + tanpa file_base64 — saat ini diperbolehkan dummy untuk test, tapi validasi file wajib di UI

## TC-DOK-03 — Duplikat pegawai+tahun+jenis+bulan DITOLAK
- Input: buat 1 dokumen pegawai+tahun+jenis+bulan sama, lalu buat lagi sama persis
- Harap: pertama success, kedua BAD_REQUEST duplikat + tampilkan file lama
- Cleanup

## TC-DOK-04 — File >10MB DITOLAK (via UI check, backend cek file_size)
- Input: file_size 11*1024*1024
- Harap: UI toast error, backend bisa simpan tapi L10 file_bermasalah akan flag

## TC-DOK-05 — get list tahun 2026 success
- Input: tahun 2026
- Harap: success + array data (bisa kosong)

## TC-DOK-06 — Verifikasi baru→disetujui
- Input: id dokumen status baru, status_baru disetujui, catatan Test approve, user admin
- Harap: success + status disetujui + jejak di T_VERIFIKASI
- Cleanup

## TC-LAP-01 — L4 rekap per jenis shape
- Input: tahun 2026
- Handler: lap_rekap_klasifikasi
- Harap: success + data.rekap array + pegawaiTotal number

## TC-LAP-02 — L6 rekap per pegawai shape matrix
- Input: tahun 2026
- Handler: lap_rekap_pegawai
- Harap: success + data.rekap array [{pegawai_id,nama,unit_id,total_jenis,total_dokumen,pct,belum_lengkap[],lengkap[]}]

## TC-LAP-03 — L11 kepatuhan upload shape vs T_JADWAL
- Input: tahun 2026
- Handler: lap_kepatuhan_upload
- Harap: success + data.rekap array [{jenis_id,nama,total,tepat_waktu,terlambat,pct}]

## TC-LAP-04 — L12 khas data composite + export 7 sheet
- Input: tahun 2026
- Handler: laporan_khas_data → success + data.klasifikasi + data.pegawai + data.kepatuhan + top5
- Handler: laporan_export_khas → success + data.file_id + file_url + sheet_count 7 — cek folder SIDOKUMEN Export ada + file bisa dibuka
- Cleanup: optional hapus spreadsheet test

## TC-ANA-01 — A3 distribusi unit shape
- Input: tahun 2026
- Handler: analisa_distribusi_unit
- Harap: success + data.distribusi array [{unit_id,jumlah}] + total

## TC-ANA-02 — A9 SLA pejabat shape lewat >3 hari
- Input: tahun 2026
- Handler: analisa_sla_pejabat
- Harap: success + data.sla array [{verifikator_id,nama,total,lewat,pct_lewat,avg_hari}]

## TC-EVA-01 — E3 kelengkapan shape missing
- Input: tahun 2026
- Handler: evaluasi_kelengkapan
- Harap: success + data.missing + data.rincian array 0-100 issues tanpa_file/tanpa_pegawai/tanpa_jenis/tanpa_tahun/tanpa_judul

## TC-EVA-02 — E4 format shape tidak_patuh
- Input: tahun 2026
- Handler: evaluasi_format
- Harap: success + data.rincian array issues mime_bukan_pdf/size_besar/nama_tidak_standar regex

## TC-RTL-01 — R1-R5 generate idempoten dedup judul
- Input: tahun 2026, sumber_evaluasi semua
- Handler: generate_tindak_lanjut
- Harap: success + data.generated number — panggil 2x dengan tahun sama → kedua generated 0 karena dedup judul_set + existing check
- Cleanup: softDelete T_TINDAK_LANJUT generated test

## TC-SCHEMA-01 — 11 sheet ada
- Input: SPREADSHEET_ID
- Harap: semua LOCAL_SHEETS ada: M_JENIS_DOKUMEN, M_KATEGORI_DOKUMEN, M_PERIODE, T_DOKUMEN, T_VERIFIKASI, T_LAMPIRAN, T_LOGBOOK, T_APPROVAL, T_JADWAL, T_REKAP, T_TINDAK_LANJUT

## TC-ROUTING-01 — 87 handler
- Input: buildLocalHandlers_() keys length >=80, actionLevels semua handler ada kecuali native 2
- Harap: ok >=80, missingLevels 0, ping tanpa token DITOLAK fail-closed

## Run
```js
runAllTestsSidokumen() // di GAS editor → View → Logs
// Harap: Library PASS 42 FAIL 0 SKIP 1 | Routing ok 80+/fail 0 | Domain PASS 10+ FAIL 0 | allPass true → 🎉 SEMUA HIJAU FULL PIRAMIDA
```
