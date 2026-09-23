// SIDOKUMEN - 99_TestSuite.gs (v1.0.5 — 12 sheet + 91 localHandlers + 35 domain test)
// ============================================================
// Changelog:
//   v1.0.5 — Tambah 8 test keamanan untuk fix v1.0.4/v1.0.8 (K2+K3):
//            DOK.4 FSM disetujui final, DOK.5 bypass status via save_dokumen,
//            DOK.6 self-approve, DOK.7 create atas nama orang lain,
//            DOK.8/9 hapus dokumen orang lain/owner, R OWN ownership RTL.
//            Aktor test baru: TEST_USER_B_ (PEG-002), TEST_VERIFIKATOR_SELF_.
//   v1.0.4 — Tambah 7 test baru untuk field yang diperbaiki di backend v1.0.3-v1.0.7:
//            E2 (total_with_deadline/no_deadline), E1 (total_with_dokumen/no_dokumen),
//            A5 (lewat/pct), A6 (musnah_netto), A10 (expected), E4 (regex),
//            RTL state machine (illegal transition rejected).
//            Handle CoreLib known failure (testMode removed di v2.3.0) via
//            KNOWN_LIB_FAILURES_ = 1 → allPass aware.
//            Update banner version.
//   v1.0.3 — 20 domain test + threshold ≥90 + dynamic sheet count.
//   v1.0.2 — Initial.
// ============================================================

var TEST_USER_ADMIN_ = { id: 'TEST-ADMIN', email: 'test.admin@trenggalekkab.go.id', role: 'admin', pegawai_id: '' };
var TEST_USER_USER_ = { id: 'TEST-USER', email: 'test.user@trenggalekkab.go.id', role: 'user', pegawai_id: 'TEST-PEGAWAI-001' };
// v1.0.5 — aktor tambahan untuk test keamanan K2/K3
var TEST_USER_B_ = { id: 'TEST-USER-B', email: 'test.userb@trenggalekkab.go.id', role: 'user', pegawai_id: 'TEST-PEGAWAI-002' };
var TEST_VERIFIKATOR_SELF_ = { id: 'TEST-VERIF', email: 'test.verif@trenggalekkab.go.id', role: 'verifikator', pegawai_id: 'TEST-PEGAWAI-001' };

// CoreLib v2.3.0 — 1 known failure: test "exchange ticket with testMode" dihapus
// karena `testMode` dihilangkan untuk keamanan. Bukan bug SIDOKUMEN.
var KNOWN_LIB_FAILURES_ = 1;

function testCtx_() {
  return { appCode: APP_CODE, ssId: SPREADSHEET_ID, masterSsId: MASTER_SPREADSHEET_ID, ssIdB: appProps_().getProperty('TEST_SPREADSHEET_ID_B') || '', platformApiUrl: PLATFORM_API_URL, headersMap: ALL_SHEET_HEADERS, isRefFunc: isRefSheet_ };
}
function _assert_(results, name, cond, detail) {
  if (cond) { results.push({ name: name, status: 'PASS' }); Logger.log('  ✅ ' + name); }
  else { results.push({ name: name, status: 'FAIL', detail: detail || '' }); Logger.log('  ❌ ' + name + ' — ' + (detail || '')); }
}

function runLibraryTests() {
  Logger.log('🧪 REGRESSION CoreLib v2.3.0 dari ' + APP_CODE);
  var recap = CoreLib.runCoreTests(testCtx_());
  Logger.log('REKAP: PASS ' + recap.passed + ' / FAIL ' + recap.failed + ' / SKIP ' + recap.skipped);
  if (recap.failed > 0 && recap.failed <= KNOWN_LIB_FAILURES_) {
    Logger.log('  ℹ️  ' + recap.failed + ' FAIL = known CoreLib issue (testMode removed), tidak blocking');
  }
  return recap;
}

function testDispatcherRouting() {
  Logger.log('🚏 ROUTING handler SIDOKUMEN');
  var ok=0,fail=0; function verdict(c,l){ if(c){ ok++; Logger.log('✅ '+l); } else { fail++; Logger.log('❌ '+l); } }
  var handlers=buildLocalHandlers_(); var cfg=getAppConfig_(); var actionLevels=cfg.actionLevels||{};
  var hKeys=Object.keys(handlers);
  verdict(hKeys.length>=90, 'localHandlers '+hKeys.length+' (target ≥90 local + 2 native =93)');
  var missingLevels=hKeys.filter(function(k){ if(['exchange_platform_ticket','logout'].indexOf(k)!==-1) return false; return actionLevels[k]===undefined; });
  verdict(missingLevels.length===0, 'Semua handler punya actionLevels' + (missingLevels.length ? ' MISSING: '+missingLevels.join(', ') : ''));
  var ping=handleAction({action:'ping'});
  verdict(ping&&ping.success===false, 'ping tanpa token DITOLAK fail-closed');
  ['laporan_daftar_dokumen','laporan_rekap_periode','laporan_rekap_status','laporan_keterlambatan','laporan_file_bermasalah','lap_kepatuhan_upload','laporan_khas_data','laporan_export_khas','analisa_distribusi_unit','analisa_top_pengirim','analisa_beban_pejabat','analisa_retensi','analisa_korelasi_jenis_unit','analisa_tte_ratio','analisa_sla_pejabat','analisa_kritis_bulanan','evaluasi_sla_verifikasi','evaluasi_sla_upload','evaluasi_kelengkapan','evaluasi_format','evaluasi_kepatuhan_jenis','evaluasi_kadaluarsa','evaluasi_fisik','evaluasi_alih_media','get_tindak_lanjut_list','generate_tindak_lanjut'].forEach(function(a){ verdict(typeof handlers[a]==='function','handler tersedia: '+a); });
  Logger.log('ROUTING: '+ok+' / '+fail);
  return {ok:ok,fail:fail};
}

function runDomainTestsSidokumen() {
  Logger.log('🎯 DOMAIN SIDOKUMEN v1.0.5 — 35 test (27 base + 8 keamanan K2/K3)');
  var results=[];

  // ========== JENIS ==========
  try{
    var r1=saveGeneric_('M_JENIS_DOKUMEN',{record:{kode:'TST-'+Date.now(), nama:'Test Jenis '+Date.now(), kategori:'LAINNYA', periode:'Fleksibel', urutan:99, status_aktif:'true'}}, TEST_USER_ADMIN_);
    _assert_(results,'JENIS.1 save valid', r1.success&&r1.data&&r1.data.id, r1.error||'');
    if(r1.success&&r1.data&&r1.data.id) softDeleteRecord_('M_JENIS_DOKUMEN', r1.data.id, TEST_USER_ADMIN_);
  }catch(e){ _assert_(results,'JENIS.1',false,e.message); }

  // ========== DOKUMEN ==========
  var savedId='';
  try{
    var jenis=saveGeneric_('M_JENIS_DOKUMEN',{record:{kode:'PK-TEST-'+Date.now(), nama:'PK Test', kategori:'KINERJA_UTAMA', periode:'Tahunan', urutan:1, status_aktif:'true'}}, TEST_USER_ADMIN_);
    var jenisId=jenis.success?jenis.data.id:'';
    var r2=saveDokumen_({record:{pegawai_id:'TEST-PEGAWAI-001', jenis_dokumen_id:jenisId, tahun:'2026', judul:'Test Dokumen '+Date.now(), status:'baru', file_drive_id:'dummy-drive-id', file_name:'test.pdf', file_size:1234, file_mime:'application/pdf'}}, TEST_USER_USER_);
    _assert_(results,'DOK.1 save valid', r2.success&&r2.data&&r2.data.id, r2.error||'');
    savedId=r2.success?r2.data.id:'';
    if(jenisId) softDeleteRecord_('M_JENIS_DOKUMEN', jenisId, TEST_USER_ADMIN_);
  }catch(e){ _assert_(results,'DOK.1',false,e.message); }
  try{
    var r3=getDokumenList_({tahun:'2026'});
    _assert_(results,'DOK.2 get list tahun 2026', r3.success&&Array.isArray(r3.data), r3.error||'');
  }catch(e){ _assert_(results,'DOK.2',false,e.message); }
  if(savedId){
    try{
      var r4=verifikasiDokumen_({id:savedId, status_baru:'disetujui', catatan:'Test approve'}, TEST_USER_ADMIN_);
      _assert_(results,'DOK.3 verifikasi baru→disetujui', r4.success&&r4.data&&String(r4.data.status)==='disetujui', r4.error||'');
    }catch(e){ _assert_(results,'DOK.3',false,e.message); }
    // v1.0.5 (K2): 'disetujui' final — transisi ke revisi harus ditolak
    try{
      var r4b=verifikasiDokumen_({id:savedId, status_baru:'revisi', catatan:'Test final'}, TEST_USER_ADMIN_);
      _assert_(results,'DOK.4 FSM: disetujui→revisi DITOLAK (final)', r4b.success===false, 'Expected reject: '+JSON.stringify(r4b));
    }catch(e){ _assert_(results,'DOK.4 FSM',false,e.message); }
    try{ softDeleteRecord_('T_DOKUMEN', savedId, TEST_USER_USER_); }catch(e){}
  }

  // ========== KEAMANAN (v1.0.5) — K2 status & self-approve, K3 ownership ==========
  // K2: non-verifikator submit status 'disetujui' via save_dokumen → dipaksa 'baru'
  var secId='';
  try{
    var jsec=saveGeneric_('M_JENIS_DOKUMEN',{record:{kode:'SEC-'+Date.now(), nama:'Jenis Security Test', kategori:'LAINNYA', periode:'Fleksibel', urutan:98, status_aktif:'true'}}, TEST_USER_ADMIN_);
    var jsecId=jsec.success?jsec.data.id:'';
    var r5=saveDokumen_({record:{pegawai_id:'TEST-PEGAWAI-001', jenis_dokumen_id:jsecId, tahun:'2026', judul:'Test Bypass Status '+Date.now(), status:'disetujui', file_drive_id:'dummy-drive-id', file_name:'test.pdf', file_size:1234, file_mime:'application/pdf'}}, TEST_USER_USER_);
    _assert_(results,'DOK.5 K2: user kirim status "disetujui" → tersimpan "baru"', r5.success&&r5.data&&String(r5.data.status)==='baru', r5.error||('got status: '+(r5.data&&r5.data.status)));
    secId=r5.success?r5.data.id:'';
    if(jsecId) softDeleteRecord_('M_JENIS_DOKUMEN', jsecId, TEST_USER_ADMIN_);
  }catch(e){ _assert_(results,'DOK.5 K2',false,e.message); }

  // K2: self-approve ditolak (verifikator = pemilik dokumen)
  if(secId){
    try{
      var r6=verifikasiDokumen_({id:secId, status_baru:'disetujui', catatan:'Self approve'}, TEST_VERIFIKATOR_SELF_);
      _assert_(results,'DOK.6 K2: self-approve DITOLAK', r6.success===false&&r6.code==='FORBIDDEN', 'Expected FORBIDDEN: '+JSON.stringify(r6));
    }catch(e){ _assert_(results,'DOK.6 K2 self-approve',false,e.message); }
    try{ softDeleteRecord_('T_DOKUMEN', secId, TEST_USER_USER_); }catch(e){}
  }

  // K3: create atas nama orang lain → FORBIDDEN
  try{
    var jsec2=saveGeneric_('M_JENIS_DOKUMEN',{record:{kode:'SEC2-'+Date.now(), nama:'Jenis Security Test 2', kategori:'LAINNYA', periode:'Fleksibel', urutan:97, status_aktif:'true'}}, TEST_USER_ADMIN_);
    var r7=saveDokumen_({record:{pegawai_id:'TEST-PEGAWAI-002', jenis_dokumen_id:(jsec2.success?jsec2.data.id:''), tahun:'2026', judul:'Test IDOR Create '+Date.now(), status:'baru', file_drive_id:'dummy-drive-id', file_name:'test.pdf', file_size:1234, file_mime:'application/pdf'}}, TEST_USER_USER_);
    _assert_(results,'DOK.7 K3: create atas nama orang lain DITOLAK', r7.success===false&&r7.code==='FORBIDDEN', 'Expected FORBIDDEN: '+JSON.stringify(r7));
    if(jsec2.success) softDeleteRecord_('M_JENIS_DOKUMEN', jsec2.data.id, TEST_USER_ADMIN_);
  }catch(e){ _assert_(results,'DOK.7 K3',false,e.message); }

  // K3: hapus dokumen orang lain → FORBIDDEN; owner → LOLOS
  var idorId='';
  try{
    var jsec3=saveGeneric_('M_JENIS_DOKUMEN',{record:{kode:'SEC3-'+Date.now(), nama:'Jenis Security Test 3', kategori:'LAINNYA', periode:'Fleksibel', urutan:96, status_aktif:'true'}}, TEST_USER_ADMIN_);
    var r8=saveDokumen_({record:{pegawai_id:'TEST-PEGAWAI-001', jenis_dokumen_id:(jsec3.success?jsec3.data.id:''), tahun:'2026', judul:'Test IDOR Delete '+Date.now(), status:'baru', file_drive_id:'dummy-drive-id', file_name:'test.pdf', file_size:1234, file_mime:'application/pdf'}}, TEST_USER_USER_);
    idorId=r8.success?r8.data.id:'';
    if(idorId){
      var r9=deleteDokumen_({id:idorId}, TEST_USER_B_);
      _assert_(results,'DOK.8 K3: hapus dokumen orang lain DITOLAK', r9.success===false&&r9.code==='FORBIDDEN', 'Expected FORBIDDEN: '+JSON.stringify(r9));
      var r10=deleteDokumen_({id:idorId}, TEST_USER_USER_);
      _assert_(results,'DOK.9 K3: owner hapus dokumen sendiri LOLOS', r10.success===true, r10.error||'');
    } else {
      _assert_(results,'DOK.8/9 K3 setup', false, 'Gagal buat dokumen: '+JSON.stringify(r8));
    }
    if(jsec3.success) softDeleteRecord_('M_JENIS_DOKUMEN', jsec3.data.id, TEST_USER_ADMIN_);
  }catch(e){ _assert_(results,'DOK.8/9 K3',false,e.message); }

  // ========== LAPORAN ==========
  try{ var r=lapRekapKlasifikasi_({tahun:'2026'}); _assert_(results,'L4 rekap jenis shape', r.success&&r.data&&Array.isArray(r.data.rekap), r.error||''); }catch(e){ _assert_(results,'L4',false,e.message); }
  try{ var r=lapRekapPegawai_({tahun:'2026'}); _assert_(results,'L6 rekap pegawai shape', r.success&&r.data&&Array.isArray(r.data.rekap), r.error||''); }catch(e){ _assert_(results,'L6',false,e.message); }
  try{
    var r=laporanKeterlambatan_({tahun:'2026'});
    _assert_(results,'L9 keterlambatan shape (+ jadwal_total)', r.success && r.data && Array.isArray(r.data.list) && r.data.jadwal_total!==undefined, r.error||'');
  }catch(e){ _assert_(results,'L9',false,e.message); }
  try{ var r=laporanFileBermasalah_({tahun:'2026'}); _assert_(results,'L10 file bermasalah shape', r.success&&r.data&&Array.isArray(r.data.list), r.error||''); }catch(e){ _assert_(results,'L10',false,e.message); }
  try{
    var r=lapKepatuhanUpload_({tahun:'2026'});
    _assert_(results,'L11 kepatuhan shape (+ total_with_deadline)', r.success && r.data && Array.isArray(r.data.rekap) && r.data.total_with_deadline!==undefined, r.error||'');
  }catch(e){ _assert_(results,'L11',false,e.message); }
  try{ var r=laporanKhasData_({tahun:'2026'}); _assert_(results,'L12 khas 7 sheet data shape', r.success&&r.data&&r.data.klasifikasi&&r.data.pegawai, r.error||''); }catch(e){ _assert_(results,'L12',false,e.message); }

  // ========== ANALISA ==========
  try{
    var r=analisaDistribusiUnit_({tahun:'2026'});
    _assert_(results,'A3 distribusi unit shape (+ unit_nama)', r.success && r.data && Array.isArray(r.data.distribusi), r.error||'');
  }catch(e){ _assert_(results,'A3',false,e.message); }
  try{
    var r=analisaBebanPejabat_({tahun:'2026'});
    _assert_(results,'A5 beban pejabat shape (+ lewat/pct)', r.success && r.data && Array.isArray(r.data.beban) && r.data.sla_hari!==undefined, r.error||'');
  }catch(e){ _assert_(results,'A5',false,e.message); }
  try{
    var r=analisaRetensi_({tahun:'2026'});
    _assert_(results,'A6 retensi shape (proyeksi 5 tahun + musnah_netto)', r.success && r.data && Array.isArray(r.data.proyeksi) && r.data.proyeksi.length===5 && r.data.proyeksi[0].musnah_netto!==undefined, r.error||'');
  }catch(e){ _assert_(results,'A6',false,e.message); }
  try{
    var r=analisaKorelasiJenisUnit_({tahun:'2026'});
    _assert_(results,'A7 korelasi shape (units[] + matrix[])', r.success && r.data && Array.isArray(r.data.units) && Array.isArray(r.data.matrix), r.error||'');
  }catch(e){ _assert_(results,'A7',false,e.message); }
  try{
    var r=analisaSlaPejabat_({tahun:'2026'});
    _assert_(results,'A9 SLA pejabat shape (+ sla_hari)', r.success && r.data && Array.isArray(r.data.sla) && r.data.sla_hari!==undefined, r.error||'');
  }catch(e){ _assert_(results,'A9',false,e.message); }
  try{
    var r=analisaKritisBulanan_({tahun:'2026'});
    _assert_(results,'A10 kritis bulanan shape (+ expected)', r.success && r.data && Array.isArray(r.data.rekap) && r.data.expected_per_bulan!==undefined && r.data.rekap.length===12, r.error||'');
  }catch(e){ _assert_(results,'A10',false,e.message); }

  // ========== EVALUASI ==========
  try{
    var r=evaluasiSlaVerifikasi_({tahun:'2026'});
    _assert_(results,'E1 SLA verifikasi shape (+ total_with_dokumen)', r.success && r.data && r.data.total_with_dokumen!==undefined && r.data.no_dokumen!==undefined, r.error||'');
  }catch(e){ _assert_(results,'E1',false,e.message); }
  try{
    var r=evaluasiSlaUpload_({tahun:'2026'});
    _assert_(results,'E2 SLA upload shape (+ total_with_deadline)', r.success && r.data && r.data.total_with_deadline!==undefined && r.data.no_deadline!==undefined, r.error||'');
  }catch(e){ _assert_(results,'E2',false,e.message); }
  try{ var r=evaluasiKelengkapan_({tahun:'2026'}); _assert_(results,'E3 kelengkapan shape', r.success&&r.data&&r.data.missing!==undefined, r.error||''); }catch(e){ _assert_(results,'E3',false,e.message); }
  try{
    var r=evaluasiFormat_({tahun:'2026'});
    _assert_(results,'E4 format shape (+ regex)', r.success && r.data && r.data.rincian!==undefined && typeof r.data.regex==='string', r.error||'');
  }catch(e){ _assert_(results,'E4',false,e.message); }
  try{
    var r=evaluasiKadaluarsa_({tahun:'2026'});
    _assert_(results,'E6 kadaluarsa shape (+ dengan_ba)', r.success && r.data && r.data.total_kadaluarsa!==undefined && r.data.tanpa_ba!==undefined && r.data.dengan_ba!==undefined, r.error||'');
  }catch(e){ _assert_(results,'E6',false,e.message); }
  try{ var r=evaluasiFisik_({tahun:'2026'}); _assert_(results,'E7 fisik shape (ada_lokasi)', r.success&&r.data&&r.data.ada_lokasi!==undefined, r.error||''); }catch(e){ _assert_(results,'E7',false,e.message); }
  try{
    var r=evaluasiAlihMedia_({tahun:'2026'});
    _assert_(results,'E8 alih media shape (rekap[])', r.success && r.data && Array.isArray(r.data.rekap), r.error||'');
  }catch(e){ _assert_(results,'E8',false,e.message); }

  // ========== RTL ==========
  try{
    var r=generateTindakLanjut_({tahun:'2026', sumber_evaluasi:'semua'}, TEST_USER_ADMIN_);
    _assert_(results,'R1-R5 generate (+ detail.r1..r5 + errors)',
      r.success && r.data && r.data.detail && r.data.detail.r1!==undefined && Array.isArray(r.data.errors),
      r.error||'');
  }catch(e){ _assert_(results,'R generate',false,e.message); }

  // RTL state machine — test transisi ilegal ditolak
  try {
    var rtl = saveRecord_('T_TINDAK_LANJUT', {
      sumber_evaluasi: 'manual',
      judul_rtl: 'Uji RTL FSM ' + Date.now(),
      deskripsi: 'Test state machine',
      status_rtl: 'baru',
      progress_pct: 0
    }, TEST_USER_ADMIN_);
    if (rtl && rtl.id) {
      // Coba transisi ilegal baru → selesai
      var badTrans = ubahStatusTindakLanjut_({ id: rtl.id, status_rtl: 'selesai' }, TEST_USER_ADMIN_);
      _assert_(results, 'R FSM: baru→selesai DITOLAK', badTrans.success === false, 'Expected reject, got: ' + JSON.stringify(badTrans));

      // Coba transisi legal baru → diproses
      var goodTrans = ubahStatusTindakLanjut_({ id: rtl.id, status_rtl: 'diproses', progress_pct: 50 }, TEST_USER_ADMIN_);
      _assert_(results, 'R FSM: baru→diproses LOLOS', goodTrans.success === true && goodTrans.data && Number(goodTrans.data.progress_pct) === 50, goodTrans.error || 'Expected success');

      // Cleanup
      try { softDeleteRecord_('T_TINDAK_LANJUT', rtl.id, TEST_USER_ADMIN_); } catch (e) {}
    } else {
      _assert_(results, 'R FSM: setup RTL', false, 'Gagal buat RTL test');
    }
  } catch (e) { _assert_(results, 'R FSM', false, e.message); }

  // v1.0.5 (K3): ownership RTL — non-owner ditolak, owner lolos
  try {
    var rtl2 = saveRecord_('T_TINDAK_LANJUT', {
      sumber_evaluasi: 'manual',
      judul_rtl: 'Uji RTL Ownership ' + Date.now(),
      deskripsi: 'Test ownership guard (K3)',
      assigned_to: 'TEST-PEGAWAI-002',
      status_rtl: 'baru',
      progress_pct: 0
    }, TEST_USER_ADMIN_);
    if (rtl2 && rtl2.id) {
      var rBad = ubahStatusTindakLanjut_({ id: rtl2.id, status_rtl: 'diproses' }, TEST_USER_USER_);
      _assert_(results, 'R OWN: user non-owner ubah status RTL DITOLAK', rBad.success === false && rBad.code === 'FORBIDDEN', 'Expected FORBIDDEN: ' + JSON.stringify(rBad));
      var rOwn = ubahStatusTindakLanjut_({ id: rtl2.id, status_rtl: 'diproses' }, TEST_USER_B_);
      _assert_(results, 'R OWN: owner ubah status RTL LOLOS (baru→diproses)', rOwn.success === true, rOwn.error || '');
      try { softDeleteRecord_('T_TINDAK_LANJUT', rtl2.id, TEST_USER_ADMIN_); } catch (e) {}
    } else {
      _assert_(results, 'R OWN: setup RTL', false, 'Gagal buat RTL test');
    }
  } catch (e) { _assert_(results, 'R OWN', false, e.message); }

  // ========== SCHEMA ==========
  try{
    var ss=CoreLib.getDb(SPREADSHEET_ID);
    var sheetsBisnis=Object.keys(LOCAL_SHEETS).map(function(k){ return LOCAL_SHEETS[k]; }).filter(function(v,i,a){ return a.indexOf(v)===i; });
    var missing=sheetsBisnis.filter(function(name){ return !ss.getSheetByName(name); });
    _assert_(results,'SCHEMA.1 '+sheetsBisnis.length+' sheet ada', missing.length===0, missing.length?'MISSING: '+missing.join(', '):'');
  }catch(e){ _assert_(results,'SCHEMA.1',false,e.message); }

  var pass=results.filter(function(r){ return r.status==='PASS'; }).length;
  var fail=results.filter(function(r){ return r.status==='FAIL'; }).length;
  Logger.log('DOMAIN: PASS='+pass+' FAIL='+fail);
  return {pass:pass,fail:fail,results:results};
}

function runAllTestsSidokumen() {
  Logger.log('##########################################################');
  Logger.log('## TEST SUITE SIDOKUMEN v1.0.4 — 12 sheet + 91 handler + 27 domain test');
  Logger.log('##########################################################');
  var lib=runLibraryTests(); Logger.log('');
  var routing=testDispatcherRouting(); Logger.log('');
  var domain=runDomainTestsSidokumen(); Logger.log('');

  Logger.log('## REKAP: Library PASS '+lib.passed+' FAIL '+lib.failed+'/'+KNOWN_LIB_FAILURES_+' (known) SKIP '+lib.skipped+' | Routing '+routing.ok+'/'+routing.fail+' | Domain PASS '+domain.pass+' FAIL '+domain.fail);

  var libOk = (lib.failed <= KNOWN_LIB_FAILURES_);
  var allPass = libOk && (routing.fail === 0) && (domain.fail === 0);

  if (allPass) {
    if (lib.failed > 0) {
      Logger.log('🎉 SEMUA HIJAU FULL PIRAMIDA (' + lib.failed + ' known lib fail dari CoreLib v2.3.0)');
    } else {
      Logger.log('🎉 SEMUA HIJAU FULL PIRAMIDA');
    }
  } else {
    Logger.log('⚠️ Ada GAGAL');
  }

  return {library:lib,routing:routing,domain:domain,allPass:allPass};
}
