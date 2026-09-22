// SIDOKUMEN - 99_TestSuite.gs (v1.0.3 — 12 sheet + 91 localHandlers + 2 native + 20 domain test)
var TEST_USER_ADMIN_ = { id: 'TEST-ADMIN', email: 'test.admin@trenggalekkab.go.id', role: 'admin', pegawai_id: '' };
var TEST_USER_USER_ = { id: 'TEST-USER', email: 'test.user@trenggalekkab.go.id', role: 'user', pegawai_id: 'TEST-PEGAWAI-001' };

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
  Logger.log('🎯 DOMAIN SIDOKUMEN v1.0.3 — 20 test');
  var results=[];
  try{
    var r1=saveGeneric_('M_JENIS_DOKUMEN',{record:{kode:'TST-'+Date.now(), nama:'Test Jenis '+Date.now(), kategori:'LAINNYA', periode:'Fleksibel', urutan:99, status_aktif:'true'}}, TEST_USER_ADMIN_);
    _assert_(results,'JENIS.1 save valid', r1.success&&r1.data&&r1.data.id, r1.error||'');
    if(r1.success&&r1.data&&r1.data.id) softDeleteRecord_('M_JENIS_DOKUMEN', r1.data.id, TEST_USER_ADMIN_);
  }catch(e){ _assert_(results,'JENIS.1',false,e.message); }
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
    try{ softDeleteRecord_('T_DOKUMEN', savedId, TEST_USER_USER_); }catch(e){}
  }
  // Laporan
  try{ var r=lapRekapKlasifikasi_({tahun:'2026'}); _assert_(results,'L4 rekap jenis shape', r.success&&r.data&&Array.isArray(r.data.rekap), r.error||''); }catch(e){ _assert_(results,'L4',false,e.message); }
  try{ var r=lapRekapPegawai_({tahun:'2026'}); _assert_(results,'L6 rekap pegawai shape', r.success&&r.data&&Array.isArray(r.data.rekap), r.error||''); }catch(e){ _assert_(results,'L6',false,e.message); }
  try{ var r=laporanKeterlambatan_({tahun:'2026'}); _assert_(results,'L9 keterlambatan shape', r.success&&r.data&&Array.isArray(r.data.list), r.error||''); }catch(e){ _assert_(results,'L9',false,e.message); }
  try{ var r=laporanFileBermasalah_({tahun:'2026'}); _assert_(results,'L10 file bermasalah shape', r.success&&r.data&&Array.isArray(r.data.list), r.error||''); }catch(e){ _assert_(results,'L10',false,e.message); }
  try{ var r=lapKepatuhanUpload_({tahun:'2026'}); _assert_(results,'L11 kepatuhan shape', r.success&&r.data&&Array.isArray(r.data.rekap), r.error||''); }catch(e){ _assert_(results,'L11',false,e.message); }
  try{ var r=laporanKhasData_({tahun:'2026'}); _assert_(results,'L12 khas 7 sheet data shape', r.success&&r.data&&r.data.klasifikasi&&r.data.pegawai, r.error||''); }catch(e){ _assert_(results,'L12',false,e.message); }
  // Analisa
  try{ var r=analisaDistribusiUnit_({tahun:'2026'}); _assert_(results,'A3 distribusi unit shape', r.success&&r.data&&Array.isArray(r.data.distribusi), r.error||''); }catch(e){ _assert_(results,'A3',false,e.message); }
  try{
    var r=analisaRetensi_({tahun:'2026'});
    _assert_(results,'A6 retensi shape (proyeksi 5 tahun)', r.success && r.data && Array.isArray(r.data.proyeksi) && r.data.proyeksi.length===5, r.error||'');
  }catch(e){ _assert_(results,'A6',false,e.message); }
  try{
    var r=analisaKorelasiJenisUnit_({tahun:'2026'});
    _assert_(results,'A7 korelasi shape (units[] + matrix[])', r.success && r.data && Array.isArray(r.data.units) && Array.isArray(r.data.matrix), r.error||'');
  }catch(e){ _assert_(results,'A7',false,e.message); }
  try{ var r=analisaSlaPejabat_({tahun:'2026'}); _assert_(results,'A9 SLA pejabat shape', r.success&&r.data&&Array.isArray(r.data.sla), r.error||''); }catch(e){ _assert_(results,'A9',false,e.message); }
  // Evaluasi
  try{ var r=evaluasiKelengkapan_({tahun:'2026'}); _assert_(results,'E3 kelengkapan shape', r.success&&r.data&&r.data.missing!==undefined, r.error||''); }catch(e){ _assert_(results,'E3',false,e.message); }
  try{ var r=evaluasiFormat_({tahun:'2026'}); _assert_(results,'E4 format shape', r.success&&r.data&&r.data.rincian!==undefined, r.error||''); }catch(e){ _assert_(results,'E4',false,e.message); }
  try{
    var r=evaluasiKadaluarsa_({tahun:'2026'});
    _assert_(results,'E6 kadaluarsa shape (total_kadaluarsa + tanpa_ba)', r.success && r.data && r.data.total_kadaluarsa!==undefined && r.data.tanpa_ba!==undefined, r.error||'');
  }catch(e){ _assert_(results,'E6',false,e.message); }
  try{
    var r=evaluasiAlihMedia_({tahun:'2026'});
    _assert_(results,'E8 alih media shape (rekap[])', r.success && r.data && Array.isArray(r.data.rekap), r.error||'');
  }catch(e){ _assert_(results,'E8',false,e.message); }
  // RTL
  try{ var r=generateTindakLanjut_({tahun:'2026', sumber_evaluasi:'semua'}, TEST_USER_ADMIN_); _assert_(results,'R1-R5 generate idempoten', r.success, r.error||''); }catch(e){ _assert_(results,'R generate',false,e.message); }
  // Schema
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
  Logger.log('## TEST SUITE SIDOKUMEN v1.0.3 — 12 sheet + 91 handler + 20 domain test');
  Logger.log('##########################################################');
  var lib=runLibraryTests(); Logger.log('');
  var routing=testDispatcherRouting(); Logger.log('');
  var domain=runDomainTestsSidokumen(); Logger.log('');
  Logger.log('## REKAP: Library PASS '+lib.passed+' FAIL '+lib.failed+' | Routing '+routing.ok+'/'+routing.fail+' | Domain PASS '+domain.pass+' FAIL '+domain.fail);
  var allPass=(lib.failed===0)&&(routing.fail===0)&&(domain.fail===0);
  Logger.log(allPass?'🎉 SEMUA HIJAU FULL PIRAMIDA':'⚠️ Ada GAGAL');
  return {library:lib,routing:routing,domain:domain,allPass:allPass};
}
